import React from 'react';
import { EngineHealthScores } from '../types/engine';

interface VibesparEngineHealthIndexProps {
  health: EngineHealthScores;
  theme: 'light' | 'dark';
}

export const VibesparEngineHealthIndex: React.FC<VibesparEngineHealthIndexProps> = ({
  health,
  theme,
}) => {
  const isLight = theme === 'light';
  const overall = Math.round(health.overall || 74);

  // Status computation
  let status: 'NOMINAL' | 'WARNING' | 'CRITICAL' = 'NOMINAL';
  let overallColor = 'text-emerald-600 dark:text-emerald-400';
  let badgeBorder = isLight
    ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
    : 'border-emerald-500 text-emerald-400 bg-emerald-950/40';

  if (overall < 60) {
    status = 'CRITICAL';
    overallColor = 'text-rose-600 dark:text-rose-500';
    badgeBorder = isLight
      ? 'border-rose-600 text-rose-700 bg-rose-50 font-bold'
      : 'border-rose-500 text-rose-400 bg-rose-950/40 font-bold';
  } else if (overall <= 80) {
    status = 'WARNING';
    overallColor = 'text-amber-500 dark:text-amber-400';
    badgeBorder = isLight
      ? 'border-amber-500 text-amber-700 bg-amber-50 font-bold'
      : 'border-amber-400 text-amber-300 bg-amber-950/40 font-bold';
  }

  // Subsystem breakdown items
  const subsystems = [
    {
      id: 'cooling',
      name: 'COOLING',
      score: health.thermal ?? 35,
    },
    {
      id: 'lubrication',
      name: 'LUBRICATION',
      score: health.lubrication ?? 95,
    },
    {
      id: 'fuel',
      name: 'FUEL',
      score: health.combustion ?? 95,
    },
    {
      id: 'ignition',
      name: 'IGNITION',
      score: health.electrical ?? 95,
    },
    {
      id: 'mechanical',
      name: 'MECHANICAL',
      score: health.mechanical ?? 68,
    },
  ];

  const getSubsystemBarColor = (score: number) => {
    if (score < 50) return 'bg-rose-500';
    if (score < 75) return 'bg-amber-400';
    return 'bg-emerald-500';
  };

  return (
    <div
      id="engine-health-index-section"
      className={`w-full rounded border p-4 transition-colors shadow-sm ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#080e1a] border-[#16253c] text-slate-100'
      }`}
    >
      {/* Header */}
      <h2 className="text-xs sm:text-sm font-chakra font-bold tracking-widest uppercase text-slate-800 dark:text-slate-200 mb-2">
        ENGINE HEALTH INDEX
      </h2>

      {/* Hero Display: Big Percentage + Overall Health + Status Badge */}
      <div className="flex flex-col items-center justify-center my-3">
        <div className="flex items-baseline justify-center">
          <span className={`text-4xl sm:text-5xl font-chakra font-black tracking-tight ${overallColor}`}>
            {overall}
          </span>
          <span className={`text-xl font-chakra font-bold ml-0.5 ${overallColor}`}>
            %
          </span>
        </div>
        <div className="text-[11px] font-chakra font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mt-1">
          OVERALL HEALTH
        </div>
        <div className={`mt-2 px-3 py-0.5 rounded text-[10px] font-chakra font-bold tracking-wider uppercase border ${badgeBorder}`}>
          {status}
        </div>
      </div>

      {/* Subsystems Horizontal Meters */}
      <div className="space-y-3 mt-4">
        {subsystems.map((sub) => {
          const barColor = getSubsystemBarColor(sub.score);

          return (
            <div key={sub.id} className="flex items-center justify-between text-xs font-chakra">
              <span className="w-24 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {sub.name}
              </span>
              <div
                className={`flex-1 h-2.5 rounded-full overflow-hidden mx-2.5 ${
                  isLight ? 'bg-slate-200 border border-slate-300' : 'bg-[#131f33] border border-slate-800'
                }`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                  style={{ width: `${Math.min(Math.max(sub.score, 5), 100)}%` }}
                />
              </div>
              <span className="w-9 text-right font-tech font-bold text-[11px] text-slate-800 dark:text-slate-200">
                {Math.round(sub.score)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
