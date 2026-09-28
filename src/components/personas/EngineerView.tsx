import React, { useState, useEffect, useMemo } from 'react';
import {
  TelemetryData,
  EngineHealthScores,
  FaultType,
  OperatingControls as OperatingControlsType,
  DigitalTwinComparisonItem,
  AiDiagnosticResult,
} from '../../types/engine';
import { VibesparEngineVisualization } from '../VibesparEngineVisualization';
import {
  Cpu,
  Flame,
  Activity,
  Sliders,
  Maximize2,
  Minimize2,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Thermometer,
  Layers,
  BarChart3,
  HelpCircle,
  Radio,
  Share2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';

interface EngineerViewProps {
  telemetry: TelemetryData;
  telemetryHistory: TelemetryData[];
  health: EngineHealthScores;
  activeFault: FaultType;
  diagnostic: AiDiagnosticResult;
  controls: OperatingControlsType;
  onChangeControls: (controls: OperatingControlsType) => void;
  comparisonItems: DigitalTwinComparisonItem[];
  show3DEngine: boolean;
  onToggle3DEngine: () => void;
  theme: 'light' | 'dark';
  onInjectFault: (fault: FaultType) => void;
  selectedSensorId: string | null;
  onSelectSensorId: (id: string | null) => void;
}

export const EngineerView: React.FC<EngineerViewProps> = ({
  telemetry,
  telemetryHistory,
  health,
  activeFault,
  diagnostic,
  controls,
  onChangeControls,
  comparisonItems,
  show3DEngine,
  onToggle3DEngine,
  theme,
  onInjectFault,
}) => {
  // Panel 1: Residual monitor active channel tab
  const [residualChannel, setResidualChannel] = useState<'CHT' | 'EGT' | 'OIL_P' | 'MAP'>('CHT');

  // Simulation controls state (including air density)
  const [airDensity, setAirDensity] = useState<number>(1.08); // kg/m3

  // Calculated thermodynamics
  const rpm = telemetry?.rpm || 2450;
  const throttle = controls?.throttle ?? 68;
  const altitude = controls?.altitude ?? 8400;

  // Power output estimation (kW): converted from live physics powerHp (1 HP = 0.7457 kW)
  const powerKw = telemetry?.powerHp
    ? Number((telemetry.powerHp * 0.7457).toFixed(1))
    : Math.round(((rpm / 3500) * (throttle / 100) * 84.5 * (airDensity / 1.225)) * 10) / 10;

  // Fuel flow (kg/h): ~18.2 L/h * 0.72 kg/L = 13.1 kg/h
  const fuelKgHr = (telemetry.fuelFlow || 18.2) * 0.72;

  // Brake Specific Fuel Consumption (BSFC) in g/kWh
  const bsfc = powerKw > 10 ? Math.round((fuelKgHr * 1000) / powerKw) : 310;
  const isBsfcDegraded = bsfc > 330 || activeFault !== 'NORMAL';

  // Thermal Efficiency % = 3600 / (BSFC * 44 MJ/kg / 1000)
  const thermalEff = bsfc > 0 ? Math.round((3600000 / (bsfc * 44000)) * 100 * 10) / 10 : 28.5;

  // Volumetric efficiency % vs RPM and Altitude
  const volumetricEff = Math.round(
    (92 - (rpm / 3500) * 12 - (altitude / 10000) * 8 + (telemetry.turboBoostBar ? telemetry.turboBoostBar * 15 : 0)) * 10
  ) / 10;

  // Generate synthetic multi-line time series for Residual Monitor
  const residualTimeSeries = useMemo(() => {
    const points = [];
    const baseCht = telemetry.cht || 162;
    const baseEgt = telemetry.egt || 780;
    const baseOilP = telemetry.oilPressure || 4.2;
    const baseMap = telemetry.manifoldPressure || 34.2;

    for (let i = 15; i >= 0; i--) {
      const t = `-${i * 2}s`;
      const noise = (Math.sin(i * 1.5) * 0.8);
      const isFault = activeFault !== 'NORMAL';
      const offset = isFault ? (16 - i) * 0.7 : 0;

      // CHT per cylinder
      const cyl1 = Number((baseCht + noise + offset).toFixed(1));
      const cyl2 = Number((baseCht + 2.2 - noise * 0.5 + offset * 1.4).toFixed(1));
      const cyl3 = Number((baseCht - 1.8 + noise * 0.4 + offset * 0.8).toFixed(1));
      const cyl4 = Number((baseCht + 0.5 - noise * 0.3 + offset * 0.9).toFixed(1));
      const physicsCht = Number((baseCht).toFixed(1));
      const aiCht = Number((baseCht + offset * 0.85).toFixed(1));

      // Residual for selected channel
      let measured = cyl1;
      let predictedPhysics = physicsCht;
      let predictedAi = aiCht;

      if (residualChannel === 'EGT') {
        measured = baseEgt + noise * 3 + offset * 4;
        predictedPhysics = baseEgt;
        predictedAi = baseEgt + offset * 3.5;
      } else if (residualChannel === 'OIL_P') {
        measured = isFault ? baseOilP - (offset * 0.08) : baseOilP + noise * 0.03;
        predictedPhysics = baseOilP;
        predictedAi = isFault ? baseOilP - (offset * 0.07) : baseOilP;
      } else if (residualChannel === 'MAP') {
        measured = baseMap + noise * 0.2;
        predictedPhysics = baseMap;
        predictedAi = baseMap + noise * 0.15;
      }

      const residual = Number((measured - predictedPhysics).toFixed(2));
      const upperBand = 2.5;
      const lowerBand = -2.5;

      points.push({
        time: t,
        cyl1,
        cyl2,
        cyl3,
        cyl4,
        physicsCht,
        aiCht,
        measured: Number(measured.toFixed(2)),
        predictedPhysics: Number(predictedPhysics.toFixed(2)),
        predictedAi: Number(predictedAi.toFixed(2)),
        residual,
        upperBand,
        lowerBand,
      });
    }
    return points;
  }, [telemetry.cht, telemetry.egt, telemetry.oilPressure, telemetry.manifoldPressure, activeFault, residualChannel]);

  // Efficiency trends historical series
  const efficiencyHistory = useMemo(() => {
    return [
      { time: '-40s', bsfc: 295, thermal: 29.8, volEff: 88, power: powerKw * 0.94 },
      { time: '-30s', bsfc: 298, thermal: 29.5, volEff: 87.5, power: powerKw * 0.96 },
      { time: '-20s', bsfc: 302, thermal: 29.1, volEff: 87, power: powerKw * 0.98 },
      { time: '-10s', bsfc: isBsfcDegraded ? 335 : 304, thermal: isBsfcDegraded ? 26.2 : 28.9, volEff: 86.5, power: powerKw },
      { time: 'NOW', bsfc, thermal: thermalEff, volEff: volumetricEff, power: powerKw },
    ];
  }, [bsfc, thermalEff, volumetricEff, powerKw, isBsfcDegraded]);

  // Thermodynamic P-V Cycle points (Ideal Otto vs Measured Actual Indicator Loop)
  const pvCycleData = useMemo(() => {
    // Generate P-V curve points (Volume cc from TDC ~134cc to BDC ~1211cc)
    const points = [];
    const cr = 9.0;
    const vTdc = 134.5; // clearance volume (cc)
    const vBdc = 1211.0; // total volume (cc)
    const p1 = (telemetry.manifoldPressure || 34.2) / 29.92 * 1.15; // intake pressure bar
    const gamma = 1.35; // polytropic exponent

    // Compression stroke (1 -> 2)
    for (let v = vBdc; v >= vTdc; v -= 90) {
      const pIdeal = p1 * Math.pow(vBdc / v, gamma);
      const pActual = pIdeal * 0.95;
      points.push({ volume: Math.round(v), idealP: Number(pIdeal.toFixed(1)), actualP: Number(pActual.toFixed(1)), stroke: 'Compression' });
    }

    // Combustion (2 -> 3) peak pressure
    const pMaxIdeal = 76.0;
    const pMaxActual = activeFault === 'MISFIRE' ? 52.0 : 72.4;
    points.push({ volume: vTdc, idealP: pMaxIdeal, actualP: pMaxActual, stroke: 'Combustion' });

    // Expansion / Power stroke (3 -> 4)
    for (let v = vTdc + 90; v <= vBdc; v += 90) {
      const pExpIdeal = pMaxIdeal * Math.pow(vTdc / v, gamma);
      const pExpActual = pMaxActual * Math.pow(vTdc / v, 1.31) * 0.96;
      points.push({ volume: Math.round(v), idealP: Number(pExpIdeal.toFixed(1)), actualP: Number(pExpActual.toFixed(1)), stroke: 'Expansion' });
    }

    return points;
  }, [telemetry.manifoldPressure, activeFault]);

  // Sensor Fusion Correlation Matrix (6x6)
  const sensorNames = ['RPM', 'CHT', 'EGT', 'VIBRATION', 'OIL PRESS', 'FUEL FLOW'];
  const correlationMatrix = useMemo(() => {
    // Nominal vs Fault-injected correlation values
    const isOverheat = activeFault === 'OVERHEATING';
    const isOilLoss = activeFault === 'LUBRICATION_FAILURE';
    const isMisfire = activeFault === 'MISFIRE';

    return [
      // RPM
      [1.00, 0.72, 0.81, isMisfire ? 0.89 : 0.42, 0.68, 0.94],
      // CHT
      [0.72, 1.00, 0.88, isOverheat ? 0.78 : 0.35, isOverheat ? -0.74 : -0.22, 0.76],
      // EGT
      [0.81, 0.88, 1.00, isMisfire ? -0.65 : 0.28, -0.31, 0.84],
      // VIBRATION
      [isMisfire ? 0.89 : 0.42, isOverheat ? 0.78 : 0.35, isMisfire ? -0.65 : 0.28, 1.00, isOilLoss ? -0.84 : -0.15, 0.44],
      // OIL PRESS
      [0.68, isOverheat ? -0.74 : -0.22, -0.31, isOilLoss ? -0.84 : -0.15, 1.00, 0.58],
      // FUEL FLOW
      [0.94, 0.76, 0.84, 0.44, 0.58, 1.00],
    ];
  }, [activeFault]);

  const isLight = theme === 'light';

  return (
    <div className={`w-full flex flex-col space-y-3.5 font-sans select-none animate-fadeIn max-w-[1920px] mx-auto ${
      isLight ? 'text-slate-800' : 'text-slate-100'
    }`}>
      {/* ========================================================================= */}
      {/* TOP HEADER: PROPULSION ANALYSIS BENCH & DIGITAL TWIN SYNC STATUS         */}
      {/* ========================================================================= */}
      <section className={`border rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200 text-slate-800 shadow-xs' : 'bg-[#0a0e17] border-[#16273f] text-slate-100 shadow-lg'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-md border ${
            isLight ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-cyan-950/60 border-cyan-500/50 text-cyan-400'
          }`}>
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`font-chakra font-bold text-sm tracking-wider uppercase ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}>
                PROPULSION ENGINEER ANALYTICS BENCH // ROTAX 914-F TURBO
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-tech font-bold uppercase border ${
                isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-emerald-950 border border-emerald-500/60 text-emerald-300'
              }`}>
                ● TWIN SYNCHRONIZED [Δt &lt; 12ms]
              </span>
            </div>
            <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Coupled Zero-D Thermodynamic Model • Physics Residuals • Indicator Cycle Analysis
            </p>
          </div>
        </div>

        {/* Live Technical Metrics */}
        <div className={`flex items-center space-x-4 font-mono text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
          <div className="text-right">
            <div className={`text-[9px] font-chakra uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Power Output</div>
            <div className={`font-bold text-sm ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>{powerKw} kW ({Math.round(powerKw * 1.341)} HP)</div>
          </div>
          <div className={`border-l pl-3 text-right ${isLight ? 'border-slate-200' : 'border-slate-700/60'}`}>
            <div className={`text-[9px] font-chakra uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>BSFC</div>
            <div className={`font-bold text-sm ${isBsfcDegraded ? (isLight ? 'text-amber-600' : 'text-amber-400') : (isLight ? 'text-emerald-600' : 'text-emerald-400')}`}>
              {bsfc} g/kWh
            </div>
          </div>
          <div className={`border-l pl-3 text-right ${isLight ? 'border-slate-200' : 'border-slate-700/60'}`}>
            <div className={`text-[9px] font-chakra uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Thermal Eff.</div>
            <div className={`font-bold text-sm ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>{thermalEff}%</div>
          </div>
          <div className={`border-l pl-3 text-right ${isLight ? 'border-slate-200' : 'border-slate-700/60'}`}>
            <div className={`text-[9px] font-chakra uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Volumetric Eff.</div>
            <div className={`font-bold text-sm ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>{volumetricEff}%</div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* MAIN 3-COLUMN RESPONSIVE GRID (DESKTOP: 3 COLS, MOBILE: STACKING)         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* ======================================================================= */}
        {/* COLUMN 1 (4 COLS): PANEL 1 — PHYSICS VS AI RESIDUAL MONITOR             */}
        {/* ======================================================================= */}
        <div className="lg:col-span-4 flex flex-col space-y-3.5">
          <div className={`border rounded-lg p-3.5 flex flex-col justify-between ${
            isLight ? 'bg-white border-slate-200 text-slate-800 shadow-xs' : 'bg-[#0a0e17] border-[#16273f] text-slate-100 shadow-md'
          }`}>
            <div className={`flex items-center justify-between pb-2 mb-2 border-b ${isLight ? 'border-slate-200' : 'border-[#142338]'}`}>
              <div className="flex items-center space-x-2">
                <Activity className={`w-4 h-4 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
                <h3 className={`text-xs font-chakra font-bold tracking-wider uppercase ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                  PANEL 1: PHYSICS VS AI RESIDUAL MONITOR
                </h3>
              </div>
              <span className={`text-[9px] font-mono ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>2000ms UPDATE</span>
            </div>

            {/* Channel Tabs */}
            <div className={`flex items-center space-x-1.5 p-1 rounded border mb-2 text-xs font-chakra ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#070b13] border-[#142338]'
            }`}>
              {(['CHT', 'EGT', 'OIL_P', 'MAP'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setResidualChannel(tab)}
                  className={`flex-1 py-1 text-[10px] font-bold rounded transition-all ${
                    residualChannel === tab
                      ? isLight
                        ? 'bg-white text-cyan-700 border border-slate-300 shadow-xs'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 border border-transparent'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {tab === 'OIL_P' ? 'OIL P' : tab}
                </button>
              ))}
            </div>

            {/* Color Code Legend */}
            <div className={`flex items-center justify-between text-[9px] font-mono pb-2 border-b ${
              isLight ? 'border-slate-200 text-slate-600' : 'border-[#142338] text-slate-300'
            }`}>
              <span className="flex items-center space-x-1">
                <span className={`w-3 h-0.5 inline-block ${isLight ? 'bg-slate-900' : 'bg-white'}`} />
                <span>Measured ({isLight ? 'Solid Black' : 'Solid White'})</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-3 h-0.5 bg-[#06b6d4] inline-block border-t border-dashed border-[#06b6d4]" />
                <span className={isLight ? 'text-cyan-700' : 'text-cyan-400'}>Physics (Cyan)</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-3 h-0.5 bg-[#d946ef] inline-block border-t border-dotted border-[#d946ef]" />
                <span className={isLight ? 'text-fuchsia-700' : 'text-fuchsia-400'}>AI Model (Magenta)</span>
              </span>
            </div>

            {/* Primary Time-Series Chart */}
            <div className="h-44 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={residualTimeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#142338'} />
                  <XAxis dataKey="time" stroke={isLight ? '#94a3b8' : '#64748b'} tick={{ fontSize: 9, fill: isLight ? '#64748b' : '#94a3b8' }} />
                  <YAxis stroke={isLight ? '#94a3b8' : '#64748b'} tick={{ fontSize: 9, fill: isLight ? '#64748b' : '#94a3b8' }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isLight ? '#ffffff' : '#0a162a',
                      borderColor: isLight ? '#cbd5e1' : '#1e385c',
                      borderRadius: 4,
                      fontSize: 10,
                      color: isLight ? '#0f172a' : '#fff',
                    }}
                  />
                  {residualChannel === 'CHT' ? (
                    <>
                      <Line type="monotone" dataKey="cyl1" name="Cyl 1" stroke={isLight ? '#0f172a' : '#ffffff'} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="cyl2" name="Cyl 2" stroke="#ea580c" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="cyl3" name="Cyl 3" stroke="#64748b" strokeWidth={1} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="cyl4" name="Cyl 4" stroke="#94a3b8" strokeWidth={1} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="physicsCht" name="Physics Model" stroke="#06b6d4" strokeDasharray="5 5" strokeWidth={2} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="aiCht" name="AI Predicted" stroke="#d946ef" strokeDasharray="2 2" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </>
                  ) : (
                    <>
                      <Line type="monotone" dataKey="measured" name="Measured" stroke={isLight ? '#0f172a' : '#ffffff'} strokeWidth={2} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="predictedPhysics" name="Physics Model" stroke="#06b6d4" strokeDasharray="5 5" strokeWidth={2} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="predictedAi" name="AI Model" stroke="#d946ef" strokeDasharray="2 2" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Subplot: Residual = Measured - Predicted with Confidence Bands */}
            <div className={`mt-2 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-[#142338]'}`}>
              <div className={`flex items-center justify-between text-[10px] font-chakra font-bold mb-1 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <span>SUBPLOT: RESIDUAL (MEASURED - PREDICTED)</span>
                <span className={`font-mono ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>95% CONFIDENCE BAND (±2.5)</span>
              </div>
              <div className={`h-24 w-full p-1 rounded border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070b13] border-[#142338]'
              }`}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={residualTimeSeries} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#142338'} />
                    <XAxis dataKey="time" stroke={isLight ? '#94a3b8' : '#64748b'} tick={{ fontSize: 8, fill: isLight ? '#64748b' : '#94a3b8' }} />
                    <YAxis domain={[-5, 5]} stroke={isLight ? '#94a3b8' : '#64748b'} tick={{ fontSize: 8, fill: isLight ? '#64748b' : '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isLight ? '#ffffff' : '#0a162a',
                        borderColor: isLight ? '#cbd5e1' : '#1e385c',
                        borderRadius: 4,
                        fontSize: 9,
                        color: isLight ? '#0f172a' : '#fff',
                      }}
                    />
                    <Area type="monotone" dataKey="upperBand" stroke="transparent" fill={isLight ? '#bae6fd' : '#1e3a5f'} fillOpacity={0.35} />
                    <Area type="monotone" dataKey="lowerBand" stroke="transparent" fill={isLight ? '#bae6fd' : '#1e3a5f'} fillOpacity={0.35} />
                    <Line type="monotone" dataKey="residual" stroke="#0284c7" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* TOGGLEABLE 3D ENGINE PREVIEW */}
          {show3DEngine ? (
            <div className="flex flex-col">
              <div className="flex items-center justify-between pb-1 text-xs font-chakra text-slate-300">
                <span className="font-bold flex items-center space-x-1 text-cyan-400">
                  <span>3D RECIPROCATING DIGITAL TWIN</span>
                </span>
                <button
                  onClick={onToggle3DEngine}
                  className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center space-x-1"
                >
                  <Minimize2 className="w-3 h-3" />
                  <span>COLLAPSE</span>
                </button>
              </div>
              <VibesparEngineVisualization
                telemetry={telemetry}
                activeFault={activeFault}
                theme={theme}
              />
            </div>
          ) : (
            <div className="bg-[#0a0e17] border border-[#16273f] rounded-lg p-2.5 flex items-center justify-between">
              <span className="text-xs font-chakra text-slate-400">3D Viewport Minimized</span>
              <button
                onClick={onToggle3DEngine}
                className="px-2 py-1 rounded bg-[#0d1624] border border-[#1e3454] text-cyan-300 text-xs font-chakra font-semibold flex items-center space-x-1"
              >
                <Maximize2 className="w-3 h-3" />
                <span>EXPAND 3D TWIN</span>
              </button>
            </div>
          )}
        </div>

        {/* ======================================================================= */}
        {/* COLUMN 2 (4 COLS): PANEL 2 — ENGINE EFFICIENCY TRENDS & THERMO CYCLE   */}
        {/* ======================================================================= */}
        <div className="lg:col-span-4 flex flex-col space-y-3.5">
          {/* PANEL 2 — ENGINE EFFICIENCY TRENDS */}
          <div className={`border rounded-lg p-3.5 flex flex-col justify-between ${
            isLight ? 'bg-white border-slate-200 text-slate-800 shadow-xs' : 'bg-[#0a0e17] border-[#16273f] text-slate-100 shadow-md'
          }`}>
            <div className={`flex items-center justify-between pb-2 mb-2 border-b ${isLight ? 'border-slate-200' : 'border-[#142338]'}`}>
              <div className="flex items-center space-x-2">
                <TrendingUp className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                <h3 className={`text-xs font-chakra font-bold tracking-wider uppercase ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                  PANEL 2: ENGINE EFFICIENCY TRENDS
                </h3>
              </div>
              <span className={`text-[9px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>TARGET: 280-320 g/kWh</span>
            </div>

            {/* Efficiency Degradation Alert Banner */}
            {isBsfcDegraded && (
              <div className={`mb-2 p-2 rounded border flex items-center space-x-2 text-xs font-chakra animate-pulse ${
                isLight ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-amber-950/40 border-amber-500/80 text-amber-200'
              }`}>
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <span className="font-bold">EFFICIENCY DEGRADATION ALERT: </span>
                  <span>BSFC elevated ({bsfc} g/kWh, &gt;10% baseline drift). Combustion efficiency decaying.</span>
                </div>
              </div>
            )}

            {/* 4 Multi-Chart Grid for Efficiency */}
            <div className="grid grid-cols-2 gap-2">
              {/* Chart 1: BSFC */}
              <div className={`p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070b13] border-[#142338]'}`}>
                <div className="flex justify-between text-[10px] font-chakra mb-1">
                  <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>BSFC (g/kWh)</span>
                  <span className={`font-mono ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>{bsfc}</span>
                </div>
                <div className="h-18 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={efficiencyHistory}>
                      <YAxis domain={[270, 360]} hide />
                      <Line type="monotone" dataKey="bsfc" stroke={isBsfcDegraded ? '#f59e0b' : '#0284c7'} strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className={`text-[8px] font-mono mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Nominal Corridor: 280-320</div>
              </div>

              {/* Chart 2: Thermal Efficiency % */}
              <div className={`p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070b13] border-[#142338]'}`}>
                <div className="flex justify-between text-[10px] font-chakra mb-1">
                  <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Thermal Eff. %</span>
                  <span className={`font-mono ${isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400'}`}>{thermalEff}%</span>
                </div>
                <div className="h-18 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={efficiencyHistory}>
                      <YAxis domain={[20, 35]} hide />
                      <Line type="monotone" dataKey="thermal" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className={`text-[8px] font-mono mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Target: 25-35%</div>
              </div>

              {/* Chart 3: Volumetric Efficiency % */}
              <div className={`p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070b13] border-[#142338]'}`}>
                <div className="flex justify-between text-[10px] font-chakra mb-1">
                  <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Volumetric Eff.</span>
                  <span className={`font-mono ${isLight ? 'text-cyan-700 font-bold' : 'text-cyan-400'}`}>{volumetricEff}%</span>
                </div>
                <div className="h-18 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={efficiencyHistory}>
                      <YAxis domain={[75, 95]} hide />
                      <Line type="monotone" dataKey="volEff" stroke="#0284c7" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className={`text-[8px] font-mono mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>f(RPM, Altitude, Boost)</div>
              </div>

              {/* Chart 4: Power Output vs Throttle */}
              <div className={`p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070b13] border-[#142338]'}`}>
                <div className="flex justify-between text-[10px] font-chakra mb-1">
                  <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Power Output</span>
                  <span className={`font-mono ${isLight ? 'text-purple-700 font-bold' : 'text-fuchsia-400'}`}>{powerKw} kW</span>
                </div>
                <div className="h-18 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={efficiencyHistory}>
                      <YAxis domain={[0, 90]} hide />
                      <Line type="monotone" dataKey="power" stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className={`text-[8px] font-mono mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>At {controls.throttle}% Throttle</div>
              </div>
            </div>
          </div>

          {/* PANEL 3 — THERMODYNAMIC CYCLE VISUALIZATION (P-V DIAGRAM) */}
          <div className={`border rounded-lg p-3.5 flex flex-col justify-between ${
            isLight ? 'bg-white border-slate-200 text-slate-800 shadow-xs' : 'bg-[#0a0e17] border-[#16273f] text-slate-100 shadow-md'
          }`}>
            <div className={`flex items-center justify-between pb-2 mb-2 border-b ${isLight ? 'border-slate-200' : 'border-[#142338]'}`}>
              <div className="flex items-center space-x-2">
                <Flame className={`w-4 h-4 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
                <h3 className={`text-xs font-chakra font-bold tracking-wider uppercase ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                  PANEL 3: INDICATOR P-V CYCLE (PRESSURE-VOLUME)
                </h3>
              </div>
              <span className={`text-[9px] font-mono ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>AIR-STANDARD OTTO</span>
            </div>

            {/* P-V Indicator Chart */}
            <div className="h-44 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pvCycleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#142338'} />
                  <XAxis dataKey="volume" stroke={isLight ? '#94a3b8' : '#64748b'} tick={{ fontSize: 9, fill: isLight ? '#64748b' : '#94a3b8' }} unit="cc" />
                  <YAxis stroke={isLight ? '#94a3b8' : '#64748b'} tick={{ fontSize: 9, fill: isLight ? '#64748b' : '#94a3b8' }} unit="bar" domain={[0, 85]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isLight ? '#ffffff' : '#0a162a',
                      borderColor: isLight ? '#cbd5e1' : '#1e385c',
                      borderRadius: 4,
                      fontSize: 10,
                      color: isLight ? '#0f172a' : '#fff',
                    }}
                  />
                  <Line type="monotone" dataKey="idealP" name="Ideal Otto Cycle" stroke="#0284c7" strokeDasharray="4 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="actualP" name="Measured Actual Loop" stroke={isLight ? '#0f172a' : '#ffffff'} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Cycle Annotations */}
            <div className={`mt-2 pt-2 border-t grid grid-cols-3 gap-2 text-center text-xs font-chakra ${
              isLight ? 'border-slate-200' : 'border-[#142338]'
            }`}>
              <div className={`p-1.5 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070b13] border-[#142338]'}`}>
                <div className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>COMPRESSION RATIO</div>
                <div className={`font-tech font-bold text-sm ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>9.0 : 1</div>
              </div>
              <div className={`p-1.5 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070b13] border-[#142338]'}`}>
                <div className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>PEAK PRESSURE (Pmax)</div>
                <div className={`font-tech font-bold text-sm ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>72.4 bar</div>
              </div>
              <div className={`p-1.5 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070b13] border-[#142338]'}`}>
                <div className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>INDICATED MEP (IMEP)</div>
                <div className={`font-tech font-bold text-sm ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>11.8 bar</div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* COLUMN 3 (4 COLS): PANEL 4 — SENSOR FUSION & PANEL 5 — SIM CONTROLS   */}
        {/* ======================================================================= */}
        <div className="lg:col-span-4 flex flex-col space-y-3.5">
          {/* PANEL 4 — SENSOR FUSION CORRELATION MATRIX */}
          <div className={`border rounded-lg p-3.5 flex flex-col justify-between ${
            isLight ? 'bg-white border-slate-200 text-slate-800 shadow-xs' : 'bg-[#0a0e17] border-[#16273f] text-slate-100 shadow-md'
          }`}>
            <div className={`flex items-center justify-between pb-2 mb-2 border-b ${isLight ? 'border-slate-200' : 'border-[#142338]'}`}>
              <div className="flex items-center space-x-2">
                <Share2 className={`w-4 h-4 ${isLight ? 'text-fuchsia-600' : 'text-fuchsia-400'}`} />
                <h3 className={`text-xs font-chakra font-bold tracking-wider uppercase ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                  PANEL 4: SENSOR FUSION MATRIX (CROSS-CORRELATION)
                </h3>
              </div>
              <span className={`text-[9px] font-mono ${isLight ? 'text-rose-600 font-bold' : 'text-rose-400'}`}>RED = ANOMALY</span>
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-center text-[10px] font-mono border-collapse">
                <thead>
                  <tr>
                    <th className={`p-1 text-left font-chakra text-[9px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>PARAM</th>
                    {sensorNames.map((s) => (
                      <th key={s} className={`p-1 font-chakra text-[8px] truncate max-w-[40px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {s.split(' ')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {correlationMatrix.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td className={`p-1 text-left font-chakra font-bold text-[9px] whitespace-nowrap ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        {sensorNames[rIdx]}
                      </td>
                      {row.map((val, cIdx) => {
                        const isAnomalous =
                          (rIdx === 1 && cIdx === 4 && activeFault === 'OVERHEATING') ||
                          (rIdx === 4 && cIdx === 1 && activeFault === 'OVERHEATING') ||
                          (rIdx === 3 && cIdx === 4 && activeFault === 'LUBRICATION_FAILURE') ||
                          (rIdx === 4 && cIdx === 3 && activeFault === 'LUBRICATION_FAILURE') ||
                          (rIdx === 0 && cIdx === 3 && activeFault === 'MISFIRE') ||
                          (rIdx === 3 && cIdx === 0 && activeFault === 'MISFIRE');

                        let bg = isLight ? 'rgba(6, 182, 212, 0.08)' : 'rgba(6, 182, 212, 0.15)';
                        let color = isLight ? '#0284c7' : '#06b6d4';

                        if (isAnomalous) {
                          bg = isLight ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.45)';
                          color = isLight ? '#b91c1c' : '#fca5a5';
                        } else if (val < 0) {
                          bg = isLight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)';
                          color = isLight ? '#2563eb' : '#93c5fd';
                        } else if (val > 0.8) {
                          bg = isLight ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.25)';
                          color = isLight ? '#047857' : '#6ee7b7';
                        }

                        return (
                          <td
                            key={cIdx}
                            className={`p-1.5 border transition-colors ${
                              isLight ? 'border-slate-200' : 'border-[#142338]'
                            } ${
                              isAnomalous ? 'animate-pulse font-bold border-rose-500' : ''
                            }`}
                            style={{ backgroundColor: bg, color }}
                            title={`${sensorNames[rIdx]} vs ${sensorNames[cIdx]}: r = ${val.toFixed(2)}${isAnomalous ? ' [ANOMALOUS DRIFT]' : ''}`}
                          >
                            {val.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`mt-2 text-[9px] font-mono flex items-center justify-between border-t pt-1.5 ${
              isLight ? 'border-slate-200 text-slate-500' : 'border-[#142338] text-slate-400'
            }`}>
              <span>Sensor Pearson coefficient r [-1.0 to +1.0]</span>
              <span className={`font-bold ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>Anomalies trigger proactive fault alert</span>
            </div>
          </div>

          {/* PANEL 5 — SIMULATION CONTROLS */}
          <div className={`border rounded-lg p-3.5 flex flex-col justify-between ${
            isLight ? 'bg-white border-slate-200 text-slate-800 shadow-xs' : 'bg-[#0a0e17] border-[#16273f] text-slate-100 shadow-md'
          }`}>
            <div className={`flex items-center justify-between pb-2 mb-2 border-b ${isLight ? 'border-slate-200' : 'border-[#142338]'}`}>
              <div className="flex items-center space-x-2">
                <Sliders className={`w-4 h-4 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
                <h3 className={`text-xs font-chakra font-bold tracking-wider uppercase ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                  PANEL 5: SIMULATION ACTUATORS & FAULT LAB
                </h3>
              </div>
              <span className={`text-[9px] font-tech ${isLight ? 'text-cyan-700 font-bold' : 'text-cyan-400'}`}>ECU IN-THE-LOOP</span>
            </div>

            {/* Sliders: Altitude, Ambient Temp, Air Density, Throttle */}
            <div className="space-y-2 text-xs font-chakra">
              {/* Throttle */}
              <div>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Throttle Position:</span>
                  <span className={`font-mono font-bold ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>{controls?.throttle ?? 68}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={controls?.throttle ?? 68}
                  onChange={(e) => onChangeControls({ ...(controls || { throttle: 68, altitude: 8400, ambientTemp: 15, engineLoad: 70 }), throttle: Number(e.target.value) })}
                  className={`w-full cursor-pointer ${isLight ? 'accent-cyan-600 bg-slate-100' : 'accent-cyan-400 bg-[#070b13]'}`}
                />
              </div>

              {/* Altitude */}
              <div>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Altitude (MSL):</span>
                  <span className={`font-mono font-bold ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>{controls?.altitude ?? 8400} FT</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={controls?.altitude ?? 8400}
                  onChange={(e) => onChangeControls({ ...(controls || { throttle: 68, altitude: 8400, ambientTemp: 15, engineLoad: 70 }), altitude: Number(e.target.value) })}
                  className={`w-full cursor-pointer ${isLight ? 'accent-cyan-600 bg-slate-100' : 'accent-cyan-400 bg-[#070b13]'}`}
                />
              </div>

              {/* Ambient Temperature */}
              <div>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Ambient Temperature:</span>
                  <span className={`font-mono font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{controls?.ambientTemp ?? 15}°C</span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="50"
                  value={controls?.ambientTemp ?? 15}
                  onChange={(e) => onChangeControls({ ...(controls || { throttle: 68, altitude: 8400, ambientTemp: 15, engineLoad: 70 }), ambientTemp: Number(e.target.value) })}
                  className={`w-full cursor-pointer ${isLight ? 'accent-amber-600 bg-slate-100' : 'accent-amber-400 bg-[#070b13]'}`}
                />
              </div>

              {/* Air Density */}
              <div>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Air Density (ρ):</span>
                  <span className={`font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{airDensity.toFixed(2)} kg/m³</span>
                </div>
                <input
                  type="range"
                  min="0.80"
                  max="1.25"
                  step="0.01"
                  value={airDensity}
                  onChange={(e) => setAirDensity(Number(e.target.value))}
                  className={`w-full cursor-pointer ${isLight ? 'accent-emerald-600 bg-slate-100' : 'accent-emerald-400 bg-[#070b13]'}`}
                />
              </div>
            </div>

            {/* Buttons: Fault Injections & Reset */}
            <div className={`mt-3 pt-2.5 border-t ${isLight ? 'border-slate-200' : 'border-[#142338]'}`}>
              <div className={`text-[10px] font-chakra uppercase tracking-wider mb-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Fault Injections:
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-chakra">
                <button
                  onClick={() => onInjectFault('OVERHEATING')}
                  className={`p-1.5 rounded font-bold border transition-all text-[11px] ${
                    activeFault === 'OVERHEATING'
                      ? 'bg-amber-600 text-white border-amber-400 shadow-sm'
                      : isLight
                      ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      : 'bg-[#070b13] text-amber-400 border-[#142338] hover:bg-[#0e1726]'
                  }`}
                >
                  ! Cooling Fault
                </button>
                <button
                  onClick={() => onInjectFault('MISFIRE')}
                  className={`p-1.5 rounded font-bold border transition-all text-[11px] ${
                    activeFault === 'MISFIRE'
                      ? 'bg-orange-600 text-white border-orange-400 shadow-sm'
                      : isLight
                      ? 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100'
                      : 'bg-[#070b13] text-orange-400 border-[#142338] hover:bg-[#0e1726]'
                  }`}
                >
                  ⚡ Inject Misfire
                </button>
                <button
                  onClick={() => onInjectFault('LUBRICATION_FAILURE')}
                  className={`p-1.5 rounded font-bold border transition-all text-[11px] ${
                    activeFault === 'LUBRICATION_FAILURE'
                      ? 'bg-rose-600 text-white border-rose-400 shadow-sm'
                      : isLight
                      ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                      : 'bg-[#070b13] text-rose-400 border-[#142338] hover:bg-[#0e1726]'
                  }`}
                >
                  💧 Inject Oil Loss
                </button>
                <button
                  onClick={() => {
                    onInjectFault('NORMAL');
                    onChangeControls({ throttle: 68, altitude: 8400, ambientTemp: 15, engineLoad: 70 });
                    setAirDensity(1.08);
                  }}
                  className={`p-1.5 rounded font-bold border transition-all text-[11px] ${
                    activeFault === 'NORMAL'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                      : isLight
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-[#070b13] text-emerald-400 border-[#142338] hover:bg-[#0e1726]'
                  }`}
                >
                  ✓ Reset Nominal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
