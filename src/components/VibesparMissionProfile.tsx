import React from 'react';
import { MissionPhase } from '../types/engine';

interface VibesparMissionProfileProps {
  currentPhase: MissionPhase;
  onSelectPhase: (phase: MissionPhase) => void;
  altitude: number;
  fuelRemainingL: number;
  enduranceHours: number;
  elapsedTimeStr: string;
  decisionSupportText?: string;
  decisionSupportStatus?: 'NOMINAL' | 'WARNING' | 'CRITICAL';
  theme: 'light' | 'dark';
}

const PHASES: { key: MissionPhase; label: string }[] = [
  { key: 'TAKEOFF', label: 'PRE-FLIGHT' },
  { key: 'TAKEOFF', label: 'TAKEOFF' },
  { key: 'CLIMB', label: 'CLIMB' },
  { key: 'CRUISE', label: 'CRUISE' },
  { key: 'HIGH_ALTITUDE_LOITER', label: 'LOITER' },
  { key: 'DESCENT', label: 'DESCENT' },
  { key: 'LANDING', label: 'LANDING' },
];

export const VibesparMissionProfile: React.FC<VibesparMissionProfileProps> = ({
  currentPhase,
  onSelectPhase,
  altitude,
  fuelRemainingL,
  enduranceHours,
  elapsedTimeStr,
  decisionSupportText = 'REDUCE LOAD / MONITOR',
  decisionSupportStatus = 'WARNING',
  theme,
}) => {
  const isLight = theme === 'light';

  // Map phase name to selected state
  const isPhaseActive = (label: string) => {
    if (label === 'PRE-FLIGHT' && currentPhase === 'THROTTLE_TRANSITION') return true;
    if (label === 'TAKEOFF' && currentPhase === 'TAKEOFF') return true;
    if (label === 'CLIMB' && currentPhase === 'CLIMB') return true;
    if (label === 'CRUISE' && currentPhase === 'CRUISE') return true;
    if (label === 'LOITER' && currentPhase === 'HIGH_ALTITUDE_LOITER') return true;
    if (label === 'DESCENT' && currentPhase === 'DESCENT') return true;
    if (label === 'LANDING' && currentPhase === 'LANDING') return true;
    return false;
  };

  const handlePhaseClick = (label: string) => {
    if (label === 'PRE-FLIGHT') onSelectPhase('THROTTLE_TRANSITION');
    else if (label === 'TAKEOFF') onSelectPhase('TAKEOFF');
    else if (label === 'CLIMB') onSelectPhase('CLIMB');
    else if (label === 'CRUISE') onSelectPhase('CRUISE');
    else if (label === 'LOITER') onSelectPhase('HIGH_ALTITUDE_LOITER');
    else if (label === 'DESCENT') onSelectPhase('DESCENT');
    else if (label === 'LANDING') onSelectPhase('LANDING');
  };

  return (
    <div
      id="mission-profile-section"
      className={`w-full rounded border p-4 transition-colors shadow-sm ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#080e1a] border-[#16253c] text-slate-100'
      }`}
    >
      {/* Header */}
      <h2 className="text-xs sm:text-sm font-chakra font-bold tracking-widest uppercase text-slate-900 dark:text-slate-100 mb-3">
        MISSION PROFILE
      </h2>

      {/* Flight Phase Selector Pills */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {['PRE-FLIGHT', 'TAKEOFF', 'CLIMB', 'CRUISE', 'LOITER', 'DESCENT', 'LANDING'].map((label) => {
          const active = isPhaseActive(label);
          return (
            <button
              key={label}
              onClick={() => handlePhaseClick(label)}
              className={`px-3 py-1 rounded text-xs font-chakra font-bold tracking-wider transition-all border ${
                active
                  ? isLight
                    ? 'border-cyan-600 bg-cyan-600 text-white shadow-sm'
                    : 'border-cyan-500 bg-cyan-950/80 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                  : isLight
                  ? 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                  : 'border-[#15243b] bg-[#0c1424] text-slate-300 hover:bg-[#132035] hover:text-slate-100'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Flight Parameters Row (Altitude, Fuel Rem, Endurance) */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {/* Altitude */}
        <div>
          <span className="text-[10px] font-chakra font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase">
            ALTITUDE
          </span>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-xl sm:text-2xl font-chakra font-extrabold text-cyan-700 dark:text-cyan-400">
              {Math.round(altitude).toLocaleString()}
            </span>
            <span className="text-xs font-chakra font-semibold text-slate-600 dark:text-slate-400">
              ft
            </span>
          </div>
        </div>

        {/* Fuel Remaining */}
        <div>
          <span className="text-[10px] font-chakra font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase">
            FUEL REM
          </span>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-xl sm:text-2xl font-chakra font-extrabold text-slate-900 dark:text-slate-100">
              {fuelRemainingL.toFixed(1)}
            </span>
            <span className="text-xs font-chakra font-semibold text-slate-600 dark:text-slate-400">
              L
            </span>
          </div>
        </div>

        {/* Endurance */}
        <div>
          <span className="text-[10px] font-chakra font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase">
            ENDURANCE
          </span>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-xl sm:text-2xl font-chakra font-extrabold text-slate-900 dark:text-slate-100">
              {enduranceHours.toFixed(1)}
            </span>
            <span className="text-xs font-chakra font-semibold text-slate-600 dark:text-slate-400">
              h
            </span>
          </div>
        </div>
      </div>

      {/* Elapsed Mission Time */}
      <div className="mb-3">
        <span className="text-[10px] font-chakra font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase">
          ELAPSED
        </span>
        <div className="text-base sm:text-lg font-tech font-bold text-slate-900 dark:text-white">
          {elapsedTimeStr}
        </div>
      </div>

      {/* Mission Decision Support Box */}
      <div
        className={`rounded-md border p-3 transition-colors ${
          decisionSupportStatus === 'CRITICAL'
            ? isLight
              ? 'border-rose-400 bg-rose-50/50'
              : 'border-rose-500/80 bg-rose-950/20'
            : decisionSupportStatus === 'WARNING'
            ? isLight
              ? 'border-amber-400 bg-amber-50/50'
              : 'border-amber-500/80 bg-amber-950/20'
            : isLight
            ? 'border-slate-200 bg-slate-50'
            : 'border-[#17273f] bg-[#0c1424]'
        }`}
      >
        <div className="text-[10px] font-chakra font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-1">
          MISSION DECISION SUPPORT
        </div>
        <div
          className={`text-sm sm:text-base font-chakra font-extrabold tracking-wide uppercase ${
            decisionSupportStatus === 'CRITICAL'
              ? 'text-rose-600 dark:text-rose-400'
              : decisionSupportStatus === 'WARNING'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {decisionSupportText}
        </div>
      </div>
    </div>
  );
};
