import React from 'react';
import { AiDiagnosticResult } from '../types/engine';

interface VibesparAiDiagnosticsProps {
  diagnostic: AiDiagnosticResult;
  theme: 'light' | 'dark';
}

export const VibesparAiDiagnostics: React.FC<VibesparAiDiagnosticsProps> = ({
  diagnostic,
  theme,
}) => {
  const isLight = theme === 'light';

  const anomalyScore = diagnostic.anomalyScore !== undefined ? diagnostic.anomalyScore : 0.81;
  const isCritical = diagnostic.status === 'CRITICAL' || anomalyScore >= 0.65;
  const isWarning = diagnostic.status === 'WARNING' || (anomalyScore >= 0.35 && anomalyScore < 0.65);

  // Score color
  let scoreColor = 'text-emerald-600 dark:text-emerald-400';
  if (isCritical) {
    scoreColor = 'text-rose-600 dark:text-rose-500';
  } else if (isWarning) {
    scoreColor = 'text-amber-500 dark:text-amber-400';
  }

  // Active fault name
  const faultTitle =
    diagnostic.probableFault && diagnostic.probableFault !== 'NOMINAL'
      ? diagnostic.probableFault.replace(/_/g, ' ')
      : 'COOLING SYSTEM DEGRADATION';

  const faultProbability = diagnostic.faultProbability || 87;

  // Affected subsystems text
  let affectedText = 'Cooling / Thermal';
  let deviationTags = ['CHT ↑', 'EGT ↑', 'VIB ↑'];

  if (faultTitle.includes('INJECTOR') || faultTitle.includes('FUEL')) {
    affectedText = 'Fuel Injection / Air-Fuel Mixture';
    deviationTags = ['EGT ↓', 'RPM ↓', 'MAP ↑'];
  } else if (faultTitle.includes('MISFIRE')) {
    affectedText = 'Combustion / Ignition Coil';
    deviationTags = ['VIB ↑', 'RPM ↓', 'EGT ↓'];
  } else if (faultTitle.includes('LUBRICATION') || faultTitle.includes('OIL')) {
    affectedText = 'Lubrication / Mechanical Friction';
    deviationTags = ['OIL P ↓', 'OIL T ↑', 'VIB ↑'];
  } else if (faultTitle.includes('OVERHEAT') || faultTitle.includes('COOLING')) {
    affectedText = 'Cooling / Thermal';
    deviationTags = ['CHT ↑', 'EGT ↑', 'VIB ↑'];
  } else if (faultTitle.includes('VIBRATION')) {
    affectedText = 'Mechanical / Crankshaft Bearings';
    deviationTags = ['VIB ↑', 'RPM ↓'];
  }

  return (
    <div
      id="ai-diagnostics-section"
      className={`w-full rounded border p-4 transition-colors shadow-sm ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#080e1a] border-[#16253c] text-slate-100'
      }`}
    >
      {/* Header */}
      <h2 className="text-xs sm:text-sm font-chakra font-bold tracking-widest uppercase text-slate-800 dark:text-slate-200 mb-2">
        AI DIAGNOSTICS
      </h2>

      {/* Hero Anomaly Score */}
      <div className="flex flex-col items-center justify-center my-3">
        <span className={`text-4xl sm:text-5xl font-chakra font-black tracking-tight ${scoreColor}`}>
          {anomalyScore.toFixed(2)}
        </span>
        <div className="text-[11px] font-chakra font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mt-1">
          ANOMALY SCORE
        </div>
      </div>

      {/* Diagnostic Fault Card (with red/amber border matching screenshot) */}
      <div
        className={`rounded-md border p-3.5 mt-4 transition-all ${
          isCritical
            ? isLight
              ? 'border-rose-500 bg-rose-50/50 shadow-[0_0_12px_rgba(244,63,94,0.1)]'
              : 'border-rose-600/80 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
            : isWarning
            ? isLight
              ? 'border-amber-500 bg-amber-50/50 shadow-[0_0_12px_rgba(245,158,11,0.1)]'
              : 'border-amber-500/80 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
            : isLight
            ? 'border-emerald-500 bg-emerald-50/40'
            : 'border-emerald-600/60 bg-emerald-950/20'
        }`}
      >
        {/* Fault Title */}
        <div
          className={`text-xs sm:text-sm font-chakra font-black tracking-wide uppercase ${
            isCritical
              ? 'text-rose-600 dark:text-rose-400'
              : isWarning
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {faultTitle}
        </div>

        {/* Big percentage */}
        <div className="flex items-baseline space-x-1 my-1">
          <span className="text-2xl sm:text-3xl font-chakra font-black text-amber-500 dark:text-amber-400">
            {faultProbability}
          </span>
          <span className="text-base font-chakra font-bold text-amber-500 dark:text-amber-400">
            %
          </span>
        </div>

        {/* Affected subsystems line */}
        <div className="text-[11px] font-chakra text-slate-600 dark:text-slate-400 mb-2">
          Affected: {affectedText}
        </div>

        {/* Parameter Deviation Badges (CHT ↑, EGT ↑, VIB ↑) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {deviationTags.map((tag) => (
            <span
              key={tag}
              className={`px-2 py-0.5 rounded text-[10px] font-chakra font-bold tracking-wider ${
                tag.includes('↑')
                  ? isLight
                    ? 'bg-rose-100 text-rose-700 border border-rose-300'
                    : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                  : isLight
                  ? 'bg-cyan-100 text-cyan-700 border border-cyan-300'
                  : 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
