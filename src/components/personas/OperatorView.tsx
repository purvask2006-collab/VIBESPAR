import React, { useState, useEffect } from 'react';
import {
  TelemetryData,
  EngineHealthScores,
  FaultType,
  MissionPhase,
  AlertMessage,
  AiDiagnosticResult,
} from '../../types/engine';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Gauge,
  Activity,
  Flame,
  Droplets,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Check,
  Radio,
  Sliders,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
  XAxis,
  Tooltip,
} from 'recharts';

interface OperatorViewProps {
  telemetry: TelemetryData;
  health: EngineHealthScores;
  activeFault: FaultType;
  diagnostic: AiDiagnosticResult;
  currentPhase: MissionPhase;
  onSelectPhase: (phase: MissionPhase) => void;
  show3DEngine: boolean;
  onToggle3DEngine: () => void;
  theme: 'light' | 'dark';
  onInjectFault: (fault: FaultType) => void;
  alerts: AlertMessage[];
  onAcknowledgeAlerts: () => void;
}

interface AlertItem {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  timestamp: string;
  component: string;
  message: string;
  action: string;
  acknowledged: boolean;
  escalated: boolean;
}

export const OperatorView: React.FC<OperatorViewProps> = ({
  telemetry,
  health,
  activeFault,
  diagnostic,
  currentPhase,
  onSelectPhase,
  show3DEngine,
  onToggle3DEngine,
  theme,
  onInjectFault,
}) => {
  const isLight = theme === 'light';

  // Collapsible Alert Banner state
  const [isAlertsCollapsed, setIsAlertsCollapsed] = useState(false);

  // Operator interactive alert items (with Acknowledge and Escalate)
  const [operatorAlerts, setOperatorAlerts] = useState<AlertItem[]>([
    {
      id: 'alt-1',
      severity: activeFault === 'LUBRICATION_FAILURE' ? 'CRITICAL' : 'WARNING',
      timestamp: '12:47:03 UTC',
      component: 'Cylinder 2 / Fuel Injection',
      message: 'Injector Clogging Detected — Cylinder 2 CHT Delta > 18°C',
      action: 'Trim fuel mixture +3% and monitor exhaust gas temperature.',
      acknowledged: false,
      escalated: false,
    },
    {
      id: 'alt-2',
      severity: activeFault === 'OVERHEATING' ? 'CRITICAL' : 'WARNING',
      timestamp: '12:46:21 UTC',
      component: 'Oil Cooler Circuit',
      message: 'Oil Temp Rising — Approach Thermal Envelope Margin',
      action: 'Reduce cruise throttle setting to ≤65% and verify ram airflow.',
      acknowledged: false,
      escalated: false,
    },
    {
      id: 'alt-3',
      severity: 'INFO',
      timestamp: '12:44:10 UTC',
      component: 'Turbocharger Wastegate',
      message: 'Wastegate Position Cycling at 10,200 ft transition',
      action: 'Automatic TCU adjustment active. No pilot intervention required.',
      acknowledged: true,
      escalated: false,
    },
  ]);

  // Sync active fault into alert feed
  useEffect(() => {
    if (activeFault === 'LUBRICATION_FAILURE') {
      setOperatorAlerts((prev) => [
        {
          id: `crit-oil-${Date.now()}`,
          severity: 'CRITICAL',
          timestamp: new Date().toISOString().substring(11, 19) + ' UTC',
          component: 'Oil Pressure Pump',
          message: 'CRITICAL: Oil Pressure Drop Detected (< 1.8 bar)',
          action: 'IMMEDIATE ACTION: Reduce throttle to 55%, declare PAN-PAN, RTB.',
          acknowledged: false,
          escalated: true,
        },
        ...prev.filter((a) => !a.id.startsWith('crit-oil')),
      ]);
    } else if (activeFault === 'OVERHEATING') {
      setOperatorAlerts((prev) => [
        {
          id: `crit-heat-${Date.now()}`,
          severity: 'CRITICAL',
          timestamp: new Date().toISOString().substring(11, 19) + ' UTC',
          component: 'Cooling Jacket / CHT',
          message: 'OVERHEATING: Hot Spot Cylinder Exceeded 195°C',
          action: 'Level off climb, enrich fuel mixture, reduce load.',
          acknowledged: false,
          escalated: false,
        },
        ...prev.filter((a) => !a.id.startsWith('crit-heat')),
      ]);
    }
  }, [activeFault]);

  const handleAcknowledge = (id: string) => {
    setOperatorAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  };

  const handleEscalate = (id: string) => {
    setOperatorAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, escalated: true, acknowledged: true } : a))
    );
  };

  // Sparkline data buffer (15 historical points for RPM, Vibration, EGT)
  const [sparkHistory, setSparkHistory] = useState<
    { t: string; rpm: number; vib: number; egt: number }[]
  >([]);

  useEffect(() => {
    const nowStr = new Date().toISOString().substring(14, 19);
    setSparkHistory((prev) => {
      const next = [
        ...prev,
        {
          t: nowStr,
          rpm: telemetry.rpm || 2418,
          vib: Number((telemetry.vibration || 0.22).toFixed(2)),
          egt: Math.round(telemetry.egt || 785),
        },
      ];
      return next.slice(-20);
    });
  }, [telemetry.rpm, telemetry.vibration, telemetry.egt]);

  // Determine Engine Status & Go/No-Go Recommendation
  const isCritical =
    diagnostic.status === 'CRITICAL' ||
    activeFault === 'LUBRICATION_FAILURE' ||
    (telemetry.oilPressure && telemetry.oilPressure < 1.8) ||
    (telemetry.cht && telemetry.cht > 200);

  const isDegraded =
    !isCritical &&
    (diagnostic.status === 'WARNING' ||
      activeFault !== 'NORMAL' ||
      (telemetry.cht && telemetry.cht > 175) ||
      (telemetry.oilTemperature && telemetry.oilTemperature > 110) ||
      health.overall < 75);

  const engineStatus = isCritical
    ? 'CRITICAL'
    : isDegraded
    ? 'DEGRADED'
    : 'HEALTHY';

  const goNoGo = isCritical
    ? {
        label: 'NO-GO // ABORT / RTB',
        badge: 'CRITICAL',
        color: 'rose',
        detail: 'Immediate Return-To-Base advised. Throttle to 60%, monitor oil circuit.',
      }
    : isDegraded
    ? {
        label: 'DEGRADED GO // CAUTION',
        badge: 'CAUTION',
        color: 'amber',
        detail: 'Propulsion envelope degraded. Restrict high-G maneuvers, monitor CHT.',
      }
    : {
        label: 'MISSION GO // NOMINAL',
        badge: 'GO',
        color: 'emerald',
        detail: 'All thermodynamics, vibration, and CAN bus channels within green corridor.',
      };

  // Safe range checks for digital readouts
  const oilTemp = telemetry.oilTemperature || 88.5;
  const isOilTempUnsafe = oilTemp > 115 || oilTemp < 65;

  const coolantTemp = telemetry.cht || 162.4;
  const isCoolantTempUnsafe = coolantTemp > 195 || coolantTemp < 130;

  const egt = telemetry.egt || 785;
  const isEgtUnsafe = egt > 840 || egt < 620;

  const vibration = telemetry.vibration || 0.22;
  const isVibrationUnsafe = vibration > 0.42;

  // Max safe RPM calculation (aero piston standard 3,500 max, 2,450 cruise)
  const maxSafeRpm = 3500;
  const currentRpm = Math.round(telemetry.rpm || 2418);
  const rpmPct = Math.min(100, Math.round((currentRpm / maxSafeRpm) * 100));

  // Fuel efficiency vs baseline calculation: Fuel mass flow (kg/h) = fuelFlow (L/h) * 0.72 kg/L (Avgas/Mogas)
  // Power (kW) = Power (HP) * 0.7457 kW/HP. BSFC = kg fuel / kWh
  const currentFuelEff = ((telemetry.fuelFlow || 18.4) * 0.72) / (Math.max(10, telemetry.powerHp || 95) * 0.7457);
  const baselineEff = 0.265; // kg/kWh baseline for healthy Rotax 914
  const effDeltaNum = ((currentFuelEff - baselineEff) / baselineEff) * 100;
  const effDeltaPct = (effDeltaNum > 0 ? '+' : '') + effDeltaNum.toFixed(1);
  const isEffBetter = effDeltaNum <= 0;

  // Flight phases
  const flightPhases: { id: MissionPhase; label: string; desc: string }[] = [
    { id: 'PRE_FLIGHT', label: 'PRE-FLIGHT', desc: 'ECU BITE check' },
    { id: 'TAKEOFF', label: 'TAKEOFF', desc: 'Full boost 3300 RPM' },
    { id: 'CRUISE', label: 'CRUISE', desc: '8400 ft loiter' },
    { id: 'LANDING', label: 'LANDING', desc: 'Glide approach' },
    { id: 'POST_FLIGHT', label: 'POST-FLIGHT', desc: 'Engine cooldown' },
  ];

  return (
    <div className={`w-full flex flex-col space-y-3 font-sans select-none animate-fadeIn max-w-[1920px] mx-auto ${
      isLight ? 'text-slate-800' : 'text-slate-100'
    }`}>
      {/* ========================================================================= */}
      {/* 1. TOP ROW: CRITICAL STATUS BAR (Full-width, high-contrast, zero-scroll)  */}
      {/* ========================================================================= */}
      <section className={`border rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200 shadow-xs text-slate-800' : 'bg-[#0a0e17] border-[#16273f] shadow-lg text-slate-100'
      }`}>
        {/* Left: LARGE ENGINE STATUS INDICATOR */}
        <div className="flex items-center space-x-3">
          <div
            className={`px-3 py-1.5 rounded-md font-chakra font-black tracking-widest text-xs sm:text-sm uppercase flex items-center space-x-2 border transition-all ${
              engineStatus === 'CRITICAL'
                ? isLight
                  ? 'bg-rose-50 border-rose-400 text-rose-700 animate-pulse'
                  : 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : engineStatus === 'DEGRADED'
                ? isLight
                  ? 'bg-amber-50 border-amber-400 text-amber-700'
                  : 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : isLight
                ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                : 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                engineStatus === 'CRITICAL'
                  ? 'bg-rose-500 animate-ping'
                  : engineStatus === 'DEGRADED'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
            <span>ENGINE: {engineStatus}</span>
          </div>

          {/* Overall Aircraft Go/No-Go Recommendation */}
          <div className={`border-l pl-3 ${isLight ? 'border-slate-200' : 'border-slate-700/60'}`}>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-chakra uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                AIRCRAFT RECOMMENDATION:
              </span>
              <span
                className={`font-chakra font-extrabold text-xs tracking-wider uppercase ${
                  goNoGo.color === 'rose'
                    ? isLight ? 'text-rose-600' : 'text-rose-400'
                    : goNoGo.color === 'amber'
                    ? isLight ? 'text-amber-600' : 'text-amber-400'
                    : isLight ? 'text-emerald-600' : 'text-emerald-400'
                }`}
              >
                {goNoGo.label}
              </span>
            </div>
            <p className={`text-[11px] font-mono mt-0.5 line-clamp-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {goNoGo.detail}
            </p>
          </div>
        </div>

        {/* Center: FLIGHT PHASE INDICATOR */}
        <div className={`hidden md:flex items-center p-1 rounded-md border ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#070b13] border-[#142338]'
        }`}>
          {flightPhases.map((phase) => {
            const isActive = currentPhase === phase.id;

            return (
              <button
                key={phase.id}
                onClick={() => onSelectPhase(phase.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-chakra font-bold tracking-wide transition-all ${
                  isActive
                    ? isLight
                      ? 'bg-white text-cyan-700 border border-slate-300 shadow-xs'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0d1624] border border-transparent'
                }`}
              >
                {phase.label}
              </button>
            );
          })}
        </div>

        {/* Right: MISSION TIMER & ESTIMATED TIME REMAINING */}
        <div className={`flex items-center space-x-4 font-mono text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
          <div className="text-right">
            <div className={`text-[9px] font-chakra uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              MISSION TIMER
            </div>
            <div className={`font-bold text-sm tracking-wider ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
              01:42:15
            </div>
          </div>
          <div className={`border-l pl-3 text-right ${isLight ? 'border-slate-200' : 'border-slate-700/60'}`}>
            <div className={`text-[9px] font-chakra uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              EST. TIME REMAINING
            </div>
            <div className={`font-bold text-sm tracking-wider ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              03:17:45 (FUEL)
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. MIDDLE ROW: PRIMARY GAUGES & DIGITAL READOUTS                         */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        {/* THREE LARGE CIRCULAR GAUGES (Engine Health %, RUL Hours, Current RPM) */}
        <div className={`lg:col-span-8 border rounded-lg p-3.5 flex flex-col justify-between ${
          isLight ? 'bg-white border-slate-200 text-slate-800 shadow-xs' : 'bg-[#0a0e17] border-[#16273f] text-slate-100 shadow-md'
        }`}>
          <div className={`flex items-center justify-between pb-2 mb-2 border-b ${isLight ? 'border-slate-200' : 'border-[#142338]'}`}>
            <div className="flex items-center space-x-2">
              <Gauge className={`w-4 h-4 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
              <h3 className={`text-xs font-chakra font-bold tracking-wider uppercase ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                PRIMARY PROPULSION INSTRUMENTATION [HUD GAUGES]
              </h3>
            </div>
            <span className={`text-[10px] font-tech px-2 py-0.5 rounded border ${
              isLight ? 'text-cyan-700 bg-cyan-50 border-cyan-200' : 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40'
            }`}>
              1000ms TELEMETRY UPDATE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-1">
            {/* GAUGE 1: ENGINE HEALTH % (0-100) WITH COLOR ZONES */}
            <div className={`p-3 rounded-lg border flex flex-col items-center justify-center relative overflow-hidden ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070b13] border-[#142338]'
            }`}>
              <div className={`text-[11px] font-chakra font-bold uppercase ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Engine Health
              </div>
              <div className={`text-[9px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>0 - 100 Index</div>

              {/* Circular Arc Representation */}
              <div className="relative w-32 h-32 flex items-center justify-center my-1.5">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#142338"
                    strokeWidth="8"
                  />
                  {/* Danger Zone (0-50%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset="125.6"
                    opacity="0.3"
                  />
                  {/* Active Value Arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={
                      health.overall < 50
                        ? '#ef4444'
                        : health.overall < 75
                        ? '#f59e0b'
                        : '#10b981'
                    }
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * Math.min(100, Math.max(0, health.overall))) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span
                    className={`font-tech font-extrabold text-2xl ${
                      health.overall < 50
                        ? 'text-rose-400'
                        : health.overall < 75
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {Math.round(health.overall)}%
                  </span>
                  <span className="text-[9px] font-chakra text-slate-400 uppercase">
                    {health.overall >= 75 ? 'NOMINAL' : health.overall >= 50 ? 'CAUTION' : 'CRITICAL'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between w-full text-[9px] font-mono text-slate-400 px-1 border-t border-[#142338] pt-1">
                <span className="text-rose-400">0%</span>
                <span className="text-amber-400">50%</span>
                <span className="text-emerald-400">100%</span>
              </div>
            </div>

            {/* GAUGE 2: RUL IN FLIGHT HOURS */}
            <div className={`p-3 rounded-lg border flex flex-col items-center justify-center relative overflow-hidden ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070b13] border-[#142338]'
            }`}>
              <div className={`text-[11px] font-chakra font-bold uppercase ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Remaining Useful Life
              </div>
              <div className={`text-[9px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Prognostic Horizon</div>

              <div className="relative w-32 h-32 flex items-center justify-center my-1.5">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={isLight ? '#e2e8f0' : '#142338'}
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#06b6d4"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * Math.min(100, Math.max(10, (184 / 250) * 100))) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className={`font-tech font-extrabold text-2xl ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                    184
                  </span>
                  <span className={`text-[9px] font-chakra uppercase ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    HOURS RUL
                  </span>
                </div>
              </div>

              <div className={`flex items-center justify-between w-full text-[9px] font-mono px-1 border-t pt-1 ${
                isLight ? 'border-slate-200 text-slate-500' : 'border-[#142338] text-slate-400'
              }`}>
                <span>Next Svc: 45h</span>
                <span className={isLight ? 'text-cyan-700 font-bold' : 'text-cyan-400'}>95% CI</span>
              </div>
            </div>

            {/* GAUGE 3: CURRENT RPM VS MAX SAFE RPM (3500 max) */}
            <div className={`p-3 rounded-lg border flex flex-col items-center justify-center relative overflow-hidden ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070b13] border-[#142338]'
            }`}>
              <div className={`text-[11px] font-chakra font-bold uppercase ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Crankshaft Speed
              </div>
              <div className={`text-[9px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Max Safe: 3500 RPM</div>

              <div className="relative w-32 h-32 flex items-center justify-center my-1.5">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={isLight ? '#e2e8f0' : '#142338'}
                    strokeWidth="8"
                  />
                  {/* Redline Zone 3300-3500 */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - 20}
                    opacity="0.4"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={
                      currentRpm > 3300
                        ? '#ef4444'
                        : currentRpm > 3000
                        ? '#f59e0b'
                        : '#06b6d4'
                    }
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * Math.min(100, (currentRpm / maxSafeRpm) * 100)) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span
                    className={`font-tech font-extrabold text-2xl ${
                      currentRpm > 3300
                        ? isLight ? 'text-rose-600' : 'text-rose-400'
                        : isLight ? 'text-cyan-700' : 'text-cyan-400'
                    }`}
                  >
                    {currentRpm}
                  </span>
                  <span className={`text-[9px] font-chakra uppercase ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    RPM
                  </span>
                </div>
              </div>

              <div className={`flex items-center justify-between w-full text-[9px] font-mono px-1 border-t pt-1 ${
                isLight ? 'border-slate-200 text-slate-500' : 'border-[#142338] text-slate-400'
              }`}>
                <span>Idle: 800</span>
                <span>Cruise: 2450</span>
                <span className="text-rose-500 font-bold">Max: 3500</span>
              </div>
            </div>
          </div>
        </div>

        {/* DIGITAL READOUTS: OIL TEMP, COOLANT/CHT, EGT, VIBRATION */}
        <div className={`lg:col-span-4 border rounded-lg p-3.5 flex flex-col justify-between ${
          isLight ? 'bg-white border-slate-200 text-slate-800 shadow-xs' : 'bg-[#0a0e17] border-[#16273f] text-slate-100 shadow-md'
        }`}>
          <div className={`flex items-center justify-between pb-2 mb-2 border-b ${isLight ? 'border-slate-200' : 'border-[#142338]'}`}>
            <h4 className={`text-xs font-chakra font-bold tracking-wider uppercase ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
              THERMAL & DYNAMIC DIGITAL READOUTS
            </h4>
            <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>SAFE LIMITS</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 flex-1">
            {/* 1. Oil Temperature (Safe: 60 - 120°C) */}
            <div
              className={`p-2.5 rounded-lg border flex flex-col justify-between transition-all ${
                isOilTempUnsafe
                  ? isLight
                    ? 'bg-rose-50 border-rose-300 text-rose-800 animate-pulse'
                    : 'bg-rose-950/40 border-rose-500/80 text-rose-200 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                  : isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-700'
                  : 'bg-[#070b13] border-[#142338] text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-chakra">
                <span className="font-bold flex items-center space-x-1">
                  <Droplets className="w-3.5 h-3.5 text-amber-400" />
                  <span>OIL TEMP</span>
                </span>
                <span
                  className={`text-[9px] font-mono px-1 rounded ${
                    isOilTempUnsafe ? 'bg-rose-500 text-white' : 'bg-[#101e33] text-slate-400'
                  }`}
                >
                  {isOilTempUnsafe ? 'UNSAFE' : 'SAFE'}
                </span>
              </div>
              <div className="my-1">
                <div
                  className={`text-2xl font-tech font-extrabold ${
                    isOilTempUnsafe ? 'text-rose-400' : 'text-slate-100'
                  }`}
                >
                  {oilTemp.toFixed(1)}°C
                </div>
              </div>
              <div className="text-[9px] font-mono text-slate-400">Range: 60 - 120°C</div>
            </div>

            {/* 2. Coolant / Cylinder Head Temp (Safe: 150 - 220°C) */}
            <div
              className={`p-2.5 rounded-lg border flex flex-col justify-between transition-all ${
                isCoolantTempUnsafe
                  ? isLight
                    ? 'bg-rose-50 border-rose-300 text-rose-800 animate-pulse'
                    : 'bg-rose-950/40 border-rose-500/80 text-rose-200 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                  : isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-700'
                  : 'bg-[#070b13] border-[#142338] text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-chakra">
                <span className="font-bold flex items-center space-x-1">
                  <Flame className="w-3.5 h-3.5 text-cyan-500" />
                  <span>COOLANT / CHT</span>
                </span>
                <span
                  className={`text-[9px] font-mono px-1 rounded ${
                    isCoolantTempUnsafe ? 'bg-rose-500 text-white' : isLight ? 'bg-slate-200 text-slate-700' : 'bg-[#101e33] text-slate-400'
                  }`}
                >
                  {isCoolantTempUnsafe ? 'UNSAFE' : 'SAFE'}
                </span>
              </div>
              <div className="my-1">
                <div
                  className={`text-2xl font-tech font-extrabold ${
                    isCoolantTempUnsafe ? 'text-rose-600' : isLight ? 'text-slate-900' : 'text-slate-100'
                  }`}
                >
                  {coolantTemp.toFixed(1)}°C
                </div>
              </div>
              <div className={`text-[9px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Range: 150 - 220°C</div>
            </div>

            {/* 3. Exhaust Gas Temp EGT (Safe: 600 - 800°C) */}
            <div
              className={`p-2.5 rounded-lg border flex flex-col justify-between transition-all ${
                isEgtUnsafe
                  ? isLight
                    ? 'bg-rose-50 border-rose-300 text-rose-800 animate-pulse'
                    : 'bg-rose-950/40 border-rose-500/80 text-rose-200 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                  : isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-700'
                  : 'bg-[#070b13] border-[#142338] text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-chakra">
                <span className="font-bold flex items-center space-x-1">
                  <Activity className="w-3.5 h-3.5 text-amber-500" />
                  <span>COLLECTOR EGT</span>
                </span>
                <span
                  className={`text-[9px] font-mono px-1 rounded ${
                    isEgtUnsafe ? 'bg-rose-500 text-white' : isLight ? 'bg-slate-200 text-slate-700' : 'bg-[#101e33] text-slate-400'
                  }`}
                >
                  {isEgtUnsafe ? 'UNSAFE' : 'SAFE'}
                </span>
              </div>
              <div className="my-1">
                <div
                  className={`text-2xl font-tech font-extrabold ${
                    isEgtUnsafe ? 'text-rose-600' : isLight ? 'text-slate-900' : 'text-slate-100'
                  }`}
                >
                  {Math.round(egt)}°C
                </div>
              </div>
              <div className={`text-[9px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Range: 600 - 800°C</div>
            </div>

            {/* 4. Engine Vibration (Safe: 0.1 - 0.5 g) */}
            <div
              className={`p-2.5 rounded-lg border flex flex-col justify-between transition-all ${
                isVibrationUnsafe
                  ? isLight
                    ? 'bg-rose-50 border-rose-300 text-rose-800 animate-pulse'
                    : 'bg-rose-950/40 border-rose-500/80 text-rose-200 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                  : isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-700'
                  : 'bg-[#070b13] border-[#142338] text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-chakra">
                <span className="font-bold flex items-center space-x-1">
                  <Activity className="w-3.5 h-3.5 text-teal-500" />
                  <span>VIBRATION RMS</span>
                </span>
                <span
                  className={`text-[9px] font-mono px-1 rounded ${
                    isVibrationUnsafe ? 'bg-rose-500 text-white' : isLight ? 'bg-slate-200 text-slate-700' : 'bg-[#101e33] text-slate-400'
                  }`}
                >
                  {isVibrationUnsafe ? 'UNSAFE' : 'SAFE'}
                </span>
              </div>
              <div className="my-1">
                <div
                  className={`text-2xl font-tech font-extrabold ${
                    isVibrationUnsafe ? 'text-rose-600' : isLight ? 'text-slate-900' : 'text-slate-100'
                  }`}
                >
                  {vibration.toFixed(2)} g
                </div>
              </div>
              <div className={`text-[9px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Range: 0.1 - 0.5 g</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. ALERT BANNER (STICKY, COLLAPSIBLE REAL-TIME ALERT FEED)                */}
      {/* ========================================================================= */}
      <section className={`border rounded-lg shadow-xs overflow-hidden ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0a0e17] border-[#16273f] text-slate-100 shadow-md'
      }`}>
        <div className={`px-3.5 py-2 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070b13] border-[#142338]'
        }`}>
          <div className="flex items-center space-x-2.5">
            <ShieldAlert className={`w-4 h-4 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
            <h4 className={`text-xs font-chakra font-bold tracking-wider uppercase ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
              REAL-TIME MISSION ALERT FEED ({operatorAlerts.filter((a) => !a.acknowledged).length} ACTIVE)
            </h4>
            <span className="text-[10px] font-tech text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/30">
              AUDIT RECORDED
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAlertsCollapsed(!isAlertsCollapsed)}
              className="text-[11px] font-chakra text-slate-400 hover:text-cyan-300 flex items-center space-x-1"
            >
              <span>{isAlertsCollapsed ? 'EXPAND FEED' : 'COLLAPSE'}</span>
              {isAlertsCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {!isAlertsCollapsed && (
          <div className="p-2.5 space-y-2 max-h-48 overflow-y-auto">
            {operatorAlerts.map((alert) => {
              const isCrit = alert.severity === 'CRITICAL';
              const isWarn = alert.severity === 'WARNING';
              return (
                <div
                  key={alert.id}
                  className={`p-2.5 rounded border flex flex-wrap items-center justify-between gap-3 text-xs font-chakra transition-colors ${
                    isCrit
                      ? 'bg-rose-950/25 border-rose-500/60 text-rose-100 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                      : isWarn
                      ? 'bg-amber-950/25 border-amber-500/60 text-amber-100 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                      : 'bg-[#070b13] border-[#142338] text-slate-300'
                  }`}
                >
                  {/* Alert Details */}
                  <div className="flex items-start space-x-2.5 max-w-3xl">
                    <div className="mt-0.5">
                      {isCrit ? (
                        <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
                      ) : isWarn ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-100">{alert.message}</span>
                        <span className="text-[10px] font-mono text-cyan-400">
                          [{alert.component}]
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {alert.timestamp}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-300 mt-0.5">
                        Required Action: <strong className="text-white">{alert.action}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Acknowledge & Escalate */}
                  <div className="flex items-center space-x-2 text-xs">
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={alert.acknowledged}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-all ${
                        alert.acknowledged
                          ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                          : 'bg-[#0e1c31] hover:bg-[#152a48] border-[#1f3b63] text-slate-200'
                      }`}
                    >
                      {alert.acknowledged ? '✓ ACKNOWLEDGED' : 'ACKNOWLEDGE'}
                    </button>
                    <button
                      onClick={() => handleEscalate(alert.id)}
                      disabled={alert.escalated}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-all ${
                        alert.escalated
                          ? 'bg-rose-950 border-rose-700 text-rose-300'
                          : 'bg-[#1a0e12] hover:bg-[#28151c] border-rose-900/60 text-rose-300'
                      }`}
                    >
                      {alert.escalated ? '▲ ESCALATED TO GCS' : 'ESCALATE'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 4. BOTTOM ROW: MISSION HEALTH STRIP (Timeline, Sparklines, Fuel Eff)     */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        {/* HORIZONTAL TIMELINE SHOWING MISSION PHASES WITH COLOR-CODED SNAPSHOTS */}
        <div className="lg:col-span-4 bg-[#0a0e17] border border-[#16273f] rounded-lg p-3 shadow-md flex flex-col justify-between">
          <div className="text-xs font-chakra font-bold text-slate-300 uppercase mb-2">
            MISSION PROFILE TIMELINE & HEALTH SNAPSHOTS
          </div>

          <div className="flex items-center justify-between relative py-2 px-1">
            {/* Timeline line */}
            <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-[#142338] -translate-y-1/2 z-0" />

            {[
              { name: 'PRE', health: 98, status: 'emerald', time: '00:00' },
              { name: 'TAKEOFF', health: 95, status: 'emerald', time: '00:15' },
              { name: 'CLIMB', health: 91, status: 'emerald', time: '00:30' },
              {
                name: 'CRUISE',
                health: Math.round(health.overall),
                status: isCritical ? 'rose' : isDegraded ? 'amber' : 'emerald',
                time: '01:42 (NOW)',
              },
              { name: 'LAND', health: 90, status: 'slate', time: '04:15' },
            ].map((pt, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold font-tech ${
                    pt.status === 'rose'
                      ? 'bg-rose-950 border-rose-500 text-rose-300'
                      : pt.status === 'amber'
                      ? 'bg-amber-950 border-amber-500 text-amber-300'
                      : pt.status === 'emerald'
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : 'bg-[#0d1624] border-slate-600 text-slate-400'
                  }`}
                >
                  {pt.health}
                </div>
                <span className="text-[9px] font-chakra font-bold mt-1 text-slate-300">
                  {pt.name}
                </span>
                <span className="text-[8px] font-mono text-slate-400">{pt.time}</span>
              </div>
            ))}
          </div>

          <div className="text-[9px] font-mono text-slate-400 pt-1 border-t border-[#142338] flex justify-between">
            <span>Sortie: BH-201-TAPAS</span>
            <span>Target Loiter: 4.5 hrs</span>
          </div>
        </div>

        {/* MINI SPARKLINES: RPM, VIBRATION, EGT OVER MISSION DURATION */}
        <div className="lg:col-span-5 bg-[#0a0e17] border border-[#16273f] rounded-lg p-3 shadow-md flex flex-col justify-between">
          <div className="text-xs font-chakra font-bold text-slate-300 uppercase mb-1 flex items-center justify-between">
            <span>TELEMETRY SPARKLINES (LIVE BUFFER)</span>
            <span className="text-[9px] font-mono text-cyan-400">RPM • VIB • EGT</span>
          </div>

          <div className="grid grid-cols-3 gap-2 py-1">
            {/* Sparkline 1: RPM */}
            <div className="bg-[#070b13] p-1.5 rounded border border-[#142338]">
              <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-0.5">
                <span>RPM</span>
                <span className="text-cyan-400 font-bold">{currentRpm}</span>
              </div>
              <div className="h-10 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkHistory}>
                    <Line
                      type="monotone"
                      dataKey="rpm"
                      stroke="#06b6d4"
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sparkline 2: Vibration */}
            <div className="bg-[#070b13] p-1.5 rounded border border-[#142338]">
              <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-0.5">
                <span>VIB (g)</span>
                <span className="text-teal-400 font-bold">{vibration.toFixed(2)}</span>
              </div>
              <div className="h-10 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkHistory}>
                    <Line
                      type="monotone"
                      dataKey="vib"
                      stroke="#14b8a6"
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sparkline 3: EGT */}
            <div className="bg-[#070b13] p-1.5 rounded border border-[#142338]">
              <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-0.5">
                <span>EGT (°C)</span>
                <span className="text-amber-400 font-bold">{Math.round(egt)}</span>
              </div>
              <div className="h-10 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkHistory}>
                    <Line
                      type="monotone"
                      dataKey="egt"
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="text-[9px] font-mono text-slate-400 pt-1 border-t border-[#142338] flex justify-between">
            <span>Sampling: 1000ms</span>
            <span>Rolling window: 20 samples</span>
          </div>
        </div>

        {/* CURRENT FUEL EFFICIENCY VS BASELINE */}
        <div className="lg:col-span-3 bg-[#0a0e17] border border-[#16273f] rounded-lg p-3 shadow-md flex flex-col justify-between">
          <div className="text-xs font-chakra font-bold text-slate-300 uppercase mb-1">
            FUEL EFFICIENCY // BASELINE
          </div>

          <div className="my-auto py-1">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-tech font-extrabold text-cyan-400">
                {currentFuelEff.toFixed(3)}
              </span>
              <span className="text-[11px] font-mono text-slate-400">kg/kW-h (BSFC)</span>
            </div>

            <div className="flex items-center space-x-1.5 mt-1 text-xs font-chakra">
              <span
                className={`font-bold flex items-center space-x-0.5 ${
                  isEffBetter ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {isEffBetter ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                <span>{effDeltaPct}%</span>
              </span>
              <span className="text-slate-400 text-[10px]">
                vs Mission Baseline (0.265 kg/kW-h)
              </span>
            </div>
          </div>

          <div className="text-[9px] font-mono text-slate-400 pt-1 border-t border-[#142338] flex justify-between">
            <span>Burn Rate: {(telemetry.fuelFlow || 18.4).toFixed(1)} L/h</span>
            <span className="text-emerald-400">Optimal Cruise</span>
          </div>
        </div>
      </section>
    </div>
  );
};
