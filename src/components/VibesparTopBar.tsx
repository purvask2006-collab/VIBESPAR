import React, { useState, useEffect } from 'react';
import { Sun, Moon, Plane, Cpu, Wrench, Eye, Code2, FileText, ShieldCheck, Layers } from 'lucide-react';
import { UserRole } from '../types/engine';

interface VibesparTopBarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  show3DEngine: boolean;
  onToggle3DEngine: () => void;
  onOpenPythonModal: () => void;
  onOpenReportsModal: () => void;
  onOpenArchitectureModal?: () => void;
  uavId?: string;
  engineId?: string;
  missionId?: string;
  isConnected?: boolean;
}

export const VibesparTopBar: React.FC<VibesparTopBarProps> = ({
  theme,
  onToggleTheme,
  currentRole,
  onSelectRole,
  show3DEngine,
  onToggle3DEngine,
  onOpenPythonModal,
  onOpenReportsModal,
  onOpenArchitectureModal,
  uavId = 'UAV-07',
  engineId = 'AERO-PISTON-01',
  missionId = 'MISSION-027',
  isConnected = true,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${hours}:${minutes}:${seconds} UTC`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const isLight = theme === 'light';

  const roles: { id: UserRole; label: string; sub: string; icon: React.ReactNode }[] = [
    {
      id: 'OVERVIEW',
      label: 'Overview',
      sub: 'Aero Piston Digital Twin',
      icon: <Plane className="w-3.5 h-3.5" />,
    },
    {
      id: 'OPERATOR',
      label: '3D Engine',
      sub: 'Kinematics & Cutaway',
      icon: <Eye className="w-3.5 h-3.5" />,
    },
    {
      id: 'ENGINEER',
      label: 'Telemetry',
      sub: 'Thermodynamics & Residuals',
      icon: <Cpu className="w-3.5 h-3.5" />,
    },
    {
      id: 'EDGE_AI',
      label: 'Diagnostics',
      sub: 'AI & SHAP Root-Cause',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
    },
    {
      id: 'MAINTENANCE',
      label: 'RUL',
      sub: 'Prognostics & Timeline',
      icon: <Wrench className="w-3.5 h-3.5" />,
    },
    {
      id: 'REPORTS',
      label: 'Reports',
      sub: 'Sortie Logs & Analytics',
      icon: <FileText className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <header
      id="vibespar-topbar"
      className={`w-full px-3 sm:px-5 py-2 border-b transition-colors flex flex-wrap items-center justify-between gap-3 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800 shadow-xs'
          : 'bg-[#060c18] border-[#14233a] text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
      }`}
    >
      {/* Left side: Brand + UAV Engine Digital Twin + LIVE Indicator (Exact to image.png) */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className="flex items-center space-x-2.5">
          {/* Cyan Wings Emblem */}
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m2 9 8 3-8 3" />
              <path d="m22 9-8 3 8 3" />
              <path d="M10 12h4" />
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-chakra font-extrabold text-xl tracking-wider text-cyan-600 dark:text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                VIBESPAR
              </span>
            </div>
            <span className="text-[10px] font-chakra font-semibold text-slate-500 dark:text-slate-400 -mt-1 hidden sm:inline">
              UAV Engine Digital Twin
            </span>
          </div>
        </div>

        {/* Live Indicator Badge (Green pulsing dot) */}
        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-emerald-700 dark:text-emerald-400 font-chakra font-bold tracking-wider text-[11px]">
            LIVE
          </span>
        </div>
      </div>

      {/* Middle: Horizontal Navigation Tabs (Overview, 3D Engine, Telemetry, Diagnostics, RUL, Reports) */}
      <nav className={`flex items-center p-1 rounded-lg border shadow-inner ${
        isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-[#091322] border-[#182c48]'
      }`}>
        {roles.map((r) => {
          const isActive = currentRole === r.id;
          return (
            <button
              key={r.id}
              onClick={() => onSelectRole(r.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all text-xs font-chakra font-bold tracking-wide ${
                isActive
                  ? isLight
                    ? 'bg-white text-cyan-700 border border-slate-200 shadow-xs'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#101e33] border border-transparent'
              }`}
              title={`${r.label} — ${r.sub}`}
            >
              <span className={isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}>{r.icon}</span>
              <span>{r.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right side: MALE UAV | Aero Piston Engine + Silhouette + Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3 text-xs font-chakra">
        {/* MALE UAV | Aero Piston Engine with Aircraft Silhouette (Matching image.png) */}
        <div className="hidden xl:flex items-center space-x-2 text-xs font-chakra text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">MALE UAV</span>
          <span>|</span>
          <span className="font-medium text-slate-600 dark:text-slate-400">Aero Piston Engine</span>
          {/* UAV Silhouette Icon */}
          <svg className="w-6 h-6 text-slate-400 dark:text-slate-500 ml-1" viewBox="0 0 48 24" fill="currentColor">
            <path d="M24 8 L32 10 L44 11 L46 12 L32 13 L28 16 L24 22 L22 22 L24 16 L16 16 L12 20 L10 20 L12 14 L4 13 L2 12 L4 11 L16 10 L22 8 Z" opacity="0.8" />
          </svg>
        </div>

        {/* Architecture & Technical Documentation Button */}
        {onOpenArchitectureModal && (
          <button
            onClick={onOpenArchitectureModal}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border text-xs font-chakra font-bold tracking-wider transition-all shadow-xs ${
              isLight
                ? 'bg-teal-50 hover:bg-teal-100 border-teal-300 text-teal-800'
                : 'bg-teal-950/60 hover:bg-teal-900/80 border-teal-500/60 text-teal-300'
            }`}
            title="Open Digital Twin Architecture & Technical Documentation"
          >
            <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="hidden lg:inline">TECH SPECS</span>
          </button>
        )}

        {/* Toggle 3D Engine View */}
        <button
          onClick={onToggle3DEngine}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border text-xs font-chakra font-semibold transition-all shadow-xs ${
            show3DEngine
              ? isLight
                ? 'bg-cyan-50 border-cyan-300 text-cyan-800'
                : 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
              : isLight
              ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              : 'bg-[#091322] border-[#182c48] text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle 3D Engine cutaway visualization in current view"
        >
          <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span className="hidden xl:inline">3D TWIN:</span>
          <span className="font-bold">{show3DEngine ? 'ON' : 'OFF'}</span>
        </button>

        {/* Mission-Wise Health Reports Button */}
        <button
          onClick={onOpenReportsModal}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border text-xs font-chakra font-bold tracking-wider transition-all shadow-xs ${
            isLight
              ? 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-800'
              : 'bg-cyan-950/60 hover:bg-cyan-900/80 border-cyan-700/80 text-cyan-300'
          }`}
          title="Open comprehensive Mission-Wise Health Reports module"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span className="hidden sm:inline">REPORTS</span>
        </button>

        {/* Python Dash Code Export Button */}
        <button
          onClick={onOpenPythonModal}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border text-xs font-chakra font-bold tracking-wider transition-all shadow-xs ${
            isLight
              ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
              : 'border-[#23426e] bg-[#0c1a2f] hover:bg-[#132644] text-amber-300'
          }`}
          title="View & copy complete Python Dash + Plotly code for SIH 2026"
        >
          <Code2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span className="hidden md:inline">PYTHON DASH</span>
        </button>

        {/* UTC Clock */}
        <div className={`hidden sm:block font-tech text-xs tracking-wider ${
          isLight ? 'text-slate-700 font-semibold' : 'text-slate-300'
        }`}>
          {utcTime || '12:47:03 UTC'}
        </div>

        {/* Connected Badge */}
        <div className={`hidden lg:block px-2 py-0.5 rounded border text-[10px] font-chakra font-bold tracking-wider uppercase ${
          isLight
            ? 'border-emerald-400 text-emerald-800 bg-emerald-50'
            : 'border-emerald-500/60 text-emerald-400 bg-emerald-950/30'
        }`}>
          CONNECTED
        </div>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className={`p-1.5 rounded border transition-colors shadow-xs ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              : 'bg-[#0d182a] hover:bg-[#142642] border-[#1d3353] text-amber-400'
          }`}
        >
          {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

