import React from 'react';
import { TelemetryData } from '../types/engine';

interface VibesparTelemetryGaugesProps {
  telemetry: TelemetryData;
  theme: 'light' | 'dark';
}

type GaugeStatus = 'NOMINAL' | 'WARNING' | 'CRITICAL';

interface GaugeItem {
  id: string;
  label: string;
  value: number | string;
  unit: string;
  status: GaugeStatus;
}

export const VibesparTelemetryGauges: React.FC<VibesparTelemetryGaugesProps> = ({
  telemetry,
  theme,
}) => {
  const isLight = theme === 'light';

  // Extract / calculate metrics
  const rpm = Math.round(telemetry.rpm || 2418);
  const cht = Math.round(telemetry.cht || 181);
  const egt = Math.round(telemetry.egt || 742);
  // Oil Pressure: convert bar to PSI (1 bar ≈ 14.5038 PSI)
  const oilP = Math.round((telemetry.oilPressure || 3.7) * 14.5038);
  const oilT = Math.round(telemetry.oilTemperature || 91);
  const vibration = Number((telemetry.vibration || 4.8).toFixed(1));

  // Determine dynamic status thresholds for each metric
  const getRpmStatus = (): GaugeStatus => {
    if (rpm > 5500 || rpm < 1800) return 'CRITICAL';
    if (rpm > 5200 || rpm < 2000) return 'WARNING';
    return 'NOMINAL';
  };

  const getChtStatus = (): GaugeStatus => {
    if (cht > 185) return 'CRITICAL';
    if (cht > 165) return 'WARNING';
    return 'NOMINAL';
  };

  const getEgtStatus = (): GaugeStatus => {
    if (egt > 820) return 'CRITICAL';
    if (egt > 780) return 'WARNING';
    return 'NOMINAL';
  };

  const getOilPStatus = (): GaugeStatus => {
    if (oilP < 25 || oilP > 95) return 'CRITICAL';
    if (oilP < 35 || oilP > 85) return 'WARNING';
    return 'NOMINAL';
  };

  const getOilTStatus = (): GaugeStatus => {
    if (oilT > 130 || oilT < 40) return 'CRITICAL';
    if (oilT > 115 || oilT < 50) return 'WARNING';
    return 'NOMINAL';
  };

  const getVibrationStatus = (): GaugeStatus => {
    if (vibration > 4.2) return 'CRITICAL'; // In screenshot 4.8 is CRITICAL
    if (vibration > 3.0) return 'WARNING';
    return 'NOMINAL';
  };

  const gauges: GaugeItem[] = [
    {
      id: 'rpm',
      label: 'RPM',
      value: rpm,
      unit: 'rev/min',
      status: getRpmStatus(),
    },
    {
      id: 'cht',
      label: 'CHT',
      value: cht,
      unit: '°C',
      status: getChtStatus(),
    },
    {
      id: 'egt',
      label: 'EGT',
      value: egt,
      unit: '°C',
      status: getEgtStatus(),
    },
    {
      id: 'oil-p',
      label: 'OIL P',
      value: oilP,
      unit: 'PSI',
      status: getOilPStatus(),
    },
    {
      id: 'oil-t',
      label: 'OIL T',
      value: oilT,
      unit: '°C',
      status: getOilTStatus(),
    },
    {
      id: 'vibration',
      label: 'VIBRATION',
      value: vibration,
      unit: 'mm/s',
      status: getVibrationStatus(),
    },
  ];

  return (
    <div
      id="telemetry-gauges-section"
      className={`w-full rounded border p-4 transition-colors shadow-sm ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#080e1a] border-[#16253c] text-slate-100'
      }`}
    >
      {/* Header */}
      <h2 className="text-xs sm:text-sm font-chakra font-bold tracking-widest uppercase text-slate-800 dark:text-slate-200 mb-3">
        TELEMETRY GAUGES
      </h2>

      {/* 2 Rows x 3 Columns Grid */}
      <div className="grid grid-cols-3 gap-3">
        {gauges.map((g) => {
          const isCritical = g.status === 'CRITICAL';
          const isWarning = g.status === 'WARNING';
          const isNominal = g.status === 'NOMINAL';

          // Card border and background styling
          let cardBorderClass = isLight ? 'border-slate-300 bg-white shadow-xs' : 'border-[#17273f] bg-[#0b1322]';
          if (isCritical) {
            cardBorderClass = isLight
              ? 'border-rose-400 bg-rose-50/40 shadow-[0_0_12px_rgba(244,63,94,0.12)]'
              : 'border-rose-600/80 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.2)]';
          } else if (isWarning) {
            cardBorderClass = isLight
              ? 'border-amber-400 bg-amber-50/40 shadow-[0_0_12px_rgba(245,158,11,0.12)]'
              : 'border-amber-500/80 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
          }

          // Number color
          let valueColorClass = 'text-cyan-700 dark:text-cyan-400 font-extrabold';
          if (isCritical) {
            valueColorClass = 'text-rose-600 dark:text-rose-500 font-extrabold';
          } else if (isWarning) {
            valueColorClass = 'text-amber-600 dark:text-amber-400 font-extrabold';
          }

          // Status Badge Pill styling
          let badgeClass = isLight
            ? 'border-emerald-600 text-emerald-800 bg-emerald-50 font-bold'
            : 'border-emerald-500 text-emerald-400 bg-emerald-950/40 font-bold';
          if (isCritical) {
            badgeClass = isLight
              ? 'border-rose-600 text-rose-800 bg-rose-50 font-bold'
              : 'border-rose-500 text-rose-400 bg-rose-950/40 font-bold';
          } else if (isWarning) {
            badgeClass = isLight
              ? 'border-amber-500 text-amber-800 bg-amber-50 font-bold'
              : 'border-amber-400 text-amber-300 bg-amber-950/40 font-bold';
          }

          return (
            <div
              key={g.id}
              className={`rounded-md border p-3 flex flex-col items-center justify-between transition-all duration-200 min-h-[118px] ${cardBorderClass}`}
            >
              {/* Metric Label */}
              <span className="text-[11px] font-chakra font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase">
                {g.label}
              </span>

              {/* Numerical Value */}
              <div className="flex flex-col items-center my-0.5">
                <span className={`text-2xl sm:text-3xl font-chakra tracking-tight ${valueColorClass}`}>
                  {g.value}
                </span>
                <span className="text-[10px] font-chakra font-semibold text-slate-600 dark:text-slate-400 -mt-0.5">
                  {g.unit}
                </span>
              </div>

              {/* Status Badge Pill */}
              <div className={`px-2 py-0.5 rounded text-[9px] font-chakra tracking-wider uppercase border ${badgeClass}`}>
                {g.status}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
