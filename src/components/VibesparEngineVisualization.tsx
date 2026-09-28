import React, { useState, useEffect, useRef } from 'react';
import { TelemetryData, FaultType } from '../types/engine';
import { Engine3DView } from './Engine3DView';
import { Box, Layers, Zap, Play, Pause } from 'lucide-react';

interface VibesparEngineVisualizationProps {
  telemetry: TelemetryData;
  activeFault: FaultType;
  theme: 'light' | 'dark';
  selectedSensor?: string | null;
  onSelectSensor?: (sensorId: string) => void;
}

type StrokeType = 'FIRE' | 'COMP' | 'EXHST' | 'INTK';

export const VibesparEngineVisualization: React.FC<VibesparEngineVisualizationProps> = ({
  telemetry,
  activeFault,
  theme,
  selectedSensor,
  onSelectSensor,
}) => {
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  isPausedRef.current = isPaused;

  const [crankAngle, setCrankAngle] = useState<number>(0);
  const animFrameRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(performance.now());

  const isLight = theme === 'light';
  const rpm = Math.round(telemetry.rpm || 2418);

  // Smooth crankshaft rotation animation based on live RPM (pausable)
  useEffect(() => {
    const animate = (time: number) => {
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (!isPausedRef.current) {
        // 4-stroke cycle = 720 degrees. Speed adjusted for visual clarity
        const visualRpm = Math.min(Math.max(rpm, 1200), 3000);
        const degreesPerSec = (visualRpm / 60) * 180; // Scaled so motion is smooth and visually perceptible

        setCrankAngle((prev) => (prev + degreesPerSec * dt) % 720);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [rpm]);

  // Determine stroke and piston displacement for each of the 4 cylinders
  // Firing order: 1 - 3 - 4 - 2 (Rotax / standard inline/boxer)
  const getCylinderState = (cylIndex: number) => {
    // Phase offsets in 720° 4-stroke cycle:
    // Cyl 1: 0°
    // Cyl 2: 540°
    // Cyl 3: 180°
    // Cyl 4: 360°
    const offsets = [0, 540, 180, 360];
    const angle = (crankAngle + offsets[cylIndex]) % 720;

    let stroke: StrokeType = 'INTK';
    let isFiring = false;

    if (angle >= 0 && angle < 180) {
      stroke = 'FIRE';
      isFiring = true;
    } else if (angle >= 180 && angle < 360) {
      stroke = 'EXHST';
    } else if (angle >= 360 && angle < 540) {
      stroke = 'INTK';
    } else {
      stroke = 'COMP';
    }

    // Piston position calculation:
    // angle 0° = TDC (Top Dead Center)
    // angle 180° = BDC (Bottom Dead Center)
    const strokeAngle = angle % 180;
    // Normalized 0 (TDC) to 1 (BDC)
    const normalizedPos = (1 - Math.cos((strokeAngle * Math.PI) / 180)) / 2;

    return {
      stroke,
      isFiring,
      // Map to vertical offset (pixels down from top of cylinder chamber)
      pistonY: normalizedPos * 46, // 0 to 46px travel
      angle,
    };
  };

  const cylinders = [0, 1, 2, 3].map((idx) => ({
    id: `CYL${idx + 1}`,
    index: idx,
    ...getCylinderState(idx),
  }));

  return (
    <div
      id="engine-visualization-card"
      className={`w-full rounded border flex flex-col transition-colors shadow-sm relative overflow-hidden h-full ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#080e1a] border-[#16253c] text-slate-100'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
        <div className="flex items-center space-x-2">
          <h2 className="text-xs sm:text-sm font-chakra font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
            ENGINE VISUALIZATION
          </h2>
          {isPaused && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-chakra font-bold tracking-widest uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 animate-pulse">
              PAUSED
            </span>
          )}
        </div>

        {/* Action Controls: Pause/Resume + 2D/3D Mode */}
        <div className="flex items-center space-x-1.5">
          {/* Pause / Resume Button */}
          <button
            id="btn-pause-engine-vis"
            onClick={() => setIsPaused((prev) => !prev)}
            title={isPaused ? "Resume engine animation" : "Pause engine animation"}
            className={`px-2.5 py-0.5 rounded text-[10px] font-chakra font-bold tracking-wider transition-all border flex items-center space-x-1 ${
              isPaused
                ? isLight
                  ? 'bg-amber-500 hover:bg-amber-600 border-amber-500 text-white shadow-sm'
                  : 'bg-amber-500 hover:bg-amber-400 border-amber-400 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                : isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-[#0f1b2e] hover:bg-[#162740] border-[#1e3455] text-slate-300 hover:text-white'
            }`}
          >
            {isPaused ? (
              <>
                <Play className="w-3 h-3 fill-current text-white dark:text-slate-950" />
                <span>RESUME</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 fill-current text-amber-500" />
                <span>PAUSE</span>
              </>
            )}
          </button>

          <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700" />

          {/* 2D / 3D Toggle */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setViewMode('2d')}
              className={`px-2 py-0.5 rounded text-[10px] font-chakra font-semibold tracking-wider transition-colors border ${
                viewMode === '2d'
                  ? isLight
                    ? 'bg-cyan-50 border-cyan-400 text-cyan-700 font-bold'
                    : 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-bold'
                  : isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                  : 'bg-[#0b1424] border-[#1a2d47] text-slate-400 hover:text-slate-200'
              }`}
            >
              2D CUTAWAY
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`px-2 py-0.5 rounded text-[10px] font-chakra font-semibold tracking-wider transition-colors border ${
                viewMode === '3d'
                  ? isLight
                    ? 'bg-cyan-50 border-cyan-400 text-cyan-700 font-bold'
                    : 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-bold'
                  : isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                  : 'bg-[#0b1424] border-[#1a2d47] text-slate-400 hover:text-slate-200'
              }`}
            >
              3D TWIN
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === '3d' ? (
        <div className="w-full flex-1 min-h-[460px] p-2">
          <Engine3DView
            telemetry={telemetry}
            activeFault={activeFault}
            selectedSensor={selectedSensor}
            onSelectSensor={onSelectSensor}
            theme={theme}
            isPaused={isPaused}
          />
        </div>
      ) : (
        <div
          className={`w-full flex-1 min-h-[460px] p-6 flex flex-col justify-between relative transition-colors ${
            isLight
              ? 'bg-[#f8fafc] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]'
              : 'bg-[#050b14] bg-[radial-gradient(#15233c_1px,transparent_1px)] [background-size:16px_16px]'
          }`}
        >
          {/* Subtle Technical Grid Guidelines */}
          <div className="absolute inset-0 pointer-events-none opacity-20 border-b border-dashed border-slate-400 dark:border-slate-600 top-1/2" />

          {/* 4-Cylinder Reciprocating Cutaway Display */}
          <div className="flex-1 flex items-center justify-center">
            <div className="grid grid-cols-4 gap-3 sm:gap-6 w-full max-w-lg">
              {cylinders.map((cyl) => {
                const isFire = cyl.stroke === 'FIRE';
                const isComp = cyl.stroke === 'COMP';
                const isExhst = cyl.stroke === 'EXHST';
                const isIntk = cyl.stroke === 'INTK';

                return (
                  <div key={cyl.id} className="flex flex-col items-center select-none">
                    {/* Stroke Label above cylinder */}
                    <div
                      className={`text-xs font-chakra font-bold tracking-wider mb-2 transition-colors duration-150 ${
                        isFire
                          ? 'text-amber-600 dark:text-amber-400 scale-105'
                          : isLight
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {cyl.stroke}
                    </div>

                    {/* Cylinder Chamber */}
                    <div
                      className={`w-16 sm:w-20 h-44 rounded-t-sm rounded-b-md border relative flex flex-col items-center justify-start overflow-hidden transition-all ${
                        isFire
                          ? isLight
                            ? 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] bg-amber-50/40'
                            : 'border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.25)] bg-[#14120e]'
                          : isLight
                          ? 'border-slate-300 bg-white/90 shadow-sm'
                          : 'border-[#172b47] bg-[#07101d]'
                      }`}
                    >
                      {/* Combustion Flame / Fire Glow (active during FIRE stroke) */}
                      {isFire && (
                        <div
                          className="absolute top-0 inset-x-0 h-16 pointer-events-none animate-pulse transition-opacity"
                          style={{
                            background: isLight
                              ? 'radial-gradient(ellipse at top, rgba(245, 158, 11, 0.45) 0%, rgba(239, 68, 68, 0.2) 60%, transparent 100%)'
                              : 'radial-gradient(ellipse at top, rgba(245, 158, 11, 0.6) 0%, rgba(239, 68, 68, 0.3) 60%, transparent 100%)',
                          }}
                        />
                      )}

                      {/* Spark Plug / Injector at top */}
                      <div
                        className={`w-3 h-2 mt-0.5 rounded-b-sm border-x border-b transition-colors ${
                          isFire
                            ? 'bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                            : isLight
                            ? 'bg-slate-300 border-slate-400'
                            : 'bg-[#1e3454] border-[#294875]'
                        }`}
                      />

                      {/* Reciprocating Piston assembly */}
                      <div
                        className="w-full flex flex-col items-center absolute transition-transform duration-75 ease-linear"
                        style={{
                          transform: `translateY(${12 + cyl.pistonY}px)`,
                        }}
                      >
                        {/* Piston Head */}
                        <div
                          className={`w-13 sm:w-16 h-8 rounded-sm border flex items-center justify-center transition-colors shadow-sm ${
                            isFire
                              ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold'
                              : isLight
                              ? 'bg-slate-200 border-slate-300 text-slate-600'
                              : 'bg-[#132034] border-[#243d61] text-slate-400'
                          }`}
                        >
                          {/* Piston Rings detail */}
                          <div className="w-full px-1 flex flex-col space-y-1">
                            <div
                              className={`h-0.5 rounded-full ${
                                isFire ? 'bg-amber-700/60' : isLight ? 'bg-slate-300' : 'bg-slate-700'
                              }`}
                            />
                            <div
                              className={`h-0.5 rounded-full ${
                                isFire ? 'bg-amber-700/60' : isLight ? 'bg-slate-300' : 'bg-slate-700'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Wrist Pin */}
                        <div
                          className={`w-2.5 h-2.5 rounded-full border -mt-1 z-10 ${
                            isLight
                              ? 'bg-slate-400 border-slate-500'
                              : 'bg-[#294875] border-[#3b66a3]'
                          }`}
                        />

                        {/* Connecting Rod */}
                        <div
                          className={`w-2 h-20 -mt-1 rounded-sm transition-colors ${
                            isLight ? 'bg-slate-300 border border-slate-400' : 'bg-[#192b45] border border-[#2b4870]'
                          }`}
                        />
                      </div>

                      {/* Crankcase connection circle at bottom */}
                      <div
                        className={`absolute bottom-1 w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center ${
                          isLight ? 'border-slate-300' : 'border-[#1b3150]'
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isLight ? 'bg-slate-400' : 'bg-slate-600'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Cylinder Label at bottom */}
                    <div
                      className={`text-xs font-chakra font-bold tracking-wider mt-3 ${
                        isLight ? 'text-slate-800' : 'text-slate-200'
                      }`}
                    >
                      {cyl.id}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Controls & RPM Readout */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-2">
              {isPaused && (
                <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-chakra font-bold tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>ANIMATION PAUSED</span>
                </div>
              )}
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="font-chakra font-extrabold text-3xl sm:text-4xl text-cyan-600 dark:text-cyan-400 tracking-tight">
                {rpm}
              </span>
              <span className="font-chakra font-bold text-xs sm:text-sm text-slate-500 dark:text-slate-400 tracking-wider">
                RPM
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
