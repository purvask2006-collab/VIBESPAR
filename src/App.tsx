import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertMessage,
  FaultType,
  MissionPhase,
  OperatingControls as OperatingControlsType,
  TelemetryData,
  UserRole,
} from './types/engine';
import { simulateAeroPistonTelemetry } from './services/physicsEngine';
import {
  computeExpectedValues,
  computeResidualComparison,
  computeEngineHealthScores,
  evaluateAiDiagnostics,
  computeRulEstimate,
} from './services/digitalTwinModel';
import {
  MISSION_PHASES,
  DEMO_STEPS,
  MissionReplayPoint,
} from './services/missionService';

import { TopBar } from './components/TopBar';
import { Engine3DView } from './components/Engine3DView';
import { EngineHealthPanel } from './components/EngineHealthPanel';
import { TelemetryCharts } from './components/TelemetryCharts';
import { OperatingControls } from './components/OperatingControls';
import { FaultInjectionPanel } from './components/FaultInjectionPanel';
import { DigitalTwinComparison } from './components/DigitalTwinComparison';
import { AiDiagnosticsPanel } from './components/AiDiagnosticsPanel';
import { MissionSimulationPanel } from './components/MissionSimulationPanel';
import { MissionReplayTimeline } from './components/MissionReplayTimeline';
import { WhatIfSimulation } from './components/WhatIfSimulation';
import { AlertBannerAndLogs } from './components/AlertBannerAndLogs';
import { DemoController } from './components/DemoController';

// Dedicated components matching the user-requested UI
import { VibesparTopBar } from './components/VibesparTopBar';
import { VibesparEngineVisualization } from './components/VibesparEngineVisualization';
import { VibesparTelemetryGauges } from './components/VibesparTelemetryGauges';
import { VibesparMissionProfile } from './components/VibesparMissionProfile';
import { VibesparEngineHealthIndex } from './components/VibesparEngineHealthIndex';
import { VibesparAiDiagnostics } from './components/VibesparAiDiagnostics';
import { VibesparBottomBar } from './components/VibesparBottomBar';
import { OperatorView } from './components/personas/OperatorView';
import { EngineerView } from './components/personas/EngineerView';
import { MaintenanceView } from './components/personas/MaintenanceView';
import { PythonDashCodeModal } from './components/PythonDashCodeModal';
import { MissionReportsModule } from './components/reports/MissionReportsModule';
import { EdgeAiSecurityPanel } from './components/edge/EdgeAiSecurityPanel';
import { AeroPistonFrontPage } from './components/AeroPistonFrontPage';
import { DigitalTwinArchitectureModal } from './components/DigitalTwinArchitectureModal';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function App() {
  // Theme state: default to 'light' (User requested: make everything light themed)
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Navigation / Role Persona state (default to Front Page Aero Piston Overview)
  const [currentRole, setCurrentRole] = useState<UserRole>('OVERVIEW');

  // Toggle 3D Engine state (toggleable per role)
  const [show3DEngine, setShow3DEngine] = useState<boolean>(true);

  // Python Dash Code modal state
  const [isPythonModalOpen, setIsPythonModalOpen] = useState<boolean>(false);

  // Mission-Wise Health Reports modal state (accessible from all roles)
  const [isReportsModalOpen, setIsReportsModalOpen] = useState<boolean>(false);

  // Digital Twin Architecture & Technical Documentation modal state
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('drdo_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Operating controls state (matches 8,400 ft cruise initial state)
  const [controls, setControls] = useState<OperatingControlsType>({
    throttle: 68,
    altitude: 8400,
    ambientTemp: 15,
    engineLoad: 70,
  });

  // Injected fault state (defaults to INJECTOR_DEGRADATION matching reference image screenshot)
  const [activeFault, setActiveFault] = useState<FaultType>('INJECTOR_DEGRADATION');
  const [faultSeverity, setFaultSeverity] = useState<number>(0.7);

  // Advanced Digital Twin & Telemetry Lab drawer state
  const [showAdvancedTools, setShowAdvancedTools] = useState<boolean>(false);

  // Mission profile phase
  const [currentMissionPhase, setCurrentMissionPhase] = useState<MissionPhase>('CRUISE');

  // Flight Data Recorder (FDR) / Live mode toggle
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);

  // Telemetry real-time buffer
  const [latestTelemetry, setLatestTelemetry] = useState<TelemetryData>(() =>
    simulateAeroPistonTelemetry(
      { throttle: 68, altitude: 8400, ambientTemp: 15, engineLoad: 70 },
      'OVERHEATING',
      0.9,
      84
    )
  );
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryData[]>([]);

  // Selected sensor for cross-highlighting
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);

  // Alerts list
  const [alerts, setAlerts] = useState<AlertMessage[]>([
    {
      id: 'al-init',
      timestamp: '12:47:03',
      level: 'WARNING',
      subsystem: 'THERMAL',
      message: 'Cooling degradation detected. CHT & EGT elevated.',
      actionRequired: 'Reduce engine load and monitor thermal parameters.',
    },
  ]);

  // Demo Mode state
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);
  const [demoStepIndex, setDemoStepIndex] = useState<number>(0);
  const [isDemoPlaying, setIsDemoPlaying] = useState<boolean>(true);

  // Starts at 84 seconds (01:24) to match screenshot
  const elapsedSecondsRef = useRef<number>(84);

  // --- Real-Time Telemetry Physics Loop (500ms update rate for stable smooth rendering) ---
  useEffect(() => {
    const interval = setInterval(() => {
      elapsedSecondsRef.current += 0.5;

      const currentSec = elapsedSecondsRef.current;
      const newTelemetry = simulateAeroPistonTelemetry(
        controls,
        activeFault,
        faultSeverity,
        currentSec
      );

      setLatestTelemetry(newTelemetry);

      setTelemetryHistory((prev) => {
        const next = [...prev, newTelemetry];
        if (next.length > 45) {
          return next.slice(next.length - 45);
        }
        return next;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [controls, activeFault, faultSeverity]);

  // --- Digital Twin Computations ---
  const expectedValues = computeExpectedValues(controls);
  const { items: comparisonItems, anomalyScore } = computeResidualComparison(
    latestTelemetry,
    expectedValues
  );
  const healthScores = computeEngineHealthScores(comparisonItems, latestTelemetry);
  const aiDiagnostics = evaluateAiDiagnostics(comparisonItems, anomalyScore, healthScores);
  const rulEstimate = computeRulEstimate(
    healthScores,
    anomalyScore,
    aiDiagnostics.probableFault
  );

  // --- Automatic Alert Triggering on Subsystem Deviation ---
  const lastLoggedFaultRef = useRef<string>('NORMAL');
  useEffect(() => {
    if (activeFault !== lastLoggedFaultRef.current) {
      lastLoggedFaultRef.current = activeFault;
      const now = new Date().toTimeString().split(' ')[0];

      if (activeFault === 'NORMAL') {
        setAlerts((prev) => [
          {
            id: `al-${Date.now()}`,
            timestamp: now,
            level: 'NORMAL',
            subsystem: 'THERMAL',
            message: 'Engine operating within expected envelope.',
            actionRequired: 'Maintain cruise altitude and continuous CAN telemetry surveillance.',
          },
          ...prev.slice(0, 19),
        ]);
      } else if (activeFault === 'INJECTOR_DEGRADATION') {
        setAlerts((prev) => [
          {
            id: `al-${Date.now()}`,
            timestamp: now,
            level: 'WARNING',
            subsystem: 'COMBUSTION',
            message: 'Emerging thermal degradation detected. EGT residual +45°C on Cylinder #2.',
            actionRequired: 'Throttle back to 60%, prepare diversion to alternate recovery strip.',
          },
          ...prev.slice(0, 19),
        ]);
      } else if (activeFault === 'LUBRICATION_FAILURE') {
        setAlerts((prev) => [
          {
            id: `al-${Date.now()}`,
            timestamp: now,
            level: 'CRITICAL',
            subsystem: 'LUBRICATION',
            message: 'Severe lubrication degradation detected. Recovery/maintenance advisory.',
            actionRequired: 'CRITICAL: Bearing boundary seizure risk. Initiate emergency descent immediately.',
          },
          ...prev.slice(0, 19),
        ]);
      } else if (activeFault === 'OVERHEATING') {
        setAlerts((prev) => [
          {
            id: `al-${Date.now()}`,
            timestamp: now,
            level: 'CRITICAL',
            subsystem: 'THERMAL',
            message: 'Cylinder head temperature exceedance (> 210°C). Thermal runaway boundary.',
            actionRequired: 'Enrich mixture, open cowl flaps, step down throttle to 45%.',
          },
          ...prev.slice(0, 19),
        ]);
      } else if (activeFault === 'SENSOR_DRIFT') {
        setAlerts((prev) => [
          {
            id: `al-${Date.now()}`,
            timestamp: now,
            level: 'WARNING',
            subsystem: 'SENSOR',
            message: 'Sensor Telemetry Drift: CHT Thermocouple decoupled from coupled thermal channels.',
            actionRequired: 'AI Isolated Sensor Failure: Do not command engine shutdown; flag avionics bay.',
          },
          ...prev.slice(0, 19),
        ]);
      } else {
        setAlerts((prev) => [
          {
            id: `al-${Date.now()}`,
            timestamp: now,
            level: 'WARNING',
            subsystem: 'MECHANICAL',
            message: `Fault signature active: ${activeFault.replace(/_/g, ' ')}.`,
            actionRequired: 'Monitor harmonic vibration trends and verify flight envelope safety.',
          },
          ...prev.slice(0, 19),
        ]);
      }
    }
  }, [activeFault]);

  // Current Headline for the Alert Banner
  const currentAlertHeadline =
    aiDiagnostics.status === 'CRITICAL'
      ? activeFault === 'LUBRICATION_FAILURE'
        ? 'Severe lubrication degradation detected. Recovery/maintenance advisory.'
        : 'Critical propulsion threshold exceedance! Immediate recovery advisory active.'
      : aiDiagnostics.status === 'WARNING'
      ? activeFault === 'INJECTOR_DEGRADATION'
        ? 'Emerging thermal degradation detected.'
        : `Diagnostic advisory: ${aiDiagnostics.probableFault}.`
      : 'Engine operating within expected envelope.';

  // --- Mission Phase Selection Handler ---
  const handleSelectMissionPhase = (phase: MissionPhase) => {
    setCurrentMissionPhase(phase);
    const cfg = MISSION_PHASES[phase];
    if (cfg) {
      setControls((prev) => ({
        ...prev,
        altitude: cfg.altitude ?? prev?.altitude ?? 8400,
        throttle: cfg.throttle ?? prev?.throttle ?? 68,
        engineLoad: cfg.engineLoad ?? prev?.engineLoad ?? 70,
      }));
    }
  };

  // --- Flight Data Recorder (FDR) Replay Handler ---
  const handleReplayPointSelect = useCallback((point: MissionReplayPoint) => {
    if (point?.controls) {
      setControls(point.controls);
    }
    if (point?.fault) {
      setActiveFault(point.fault);
    }
    setFaultSeverity(point?.faultSeverity || 0.8);
  }, []);

  // --- Demo Mode Progression Controller ---
  const applyDemoStep = useCallback((stepIdx: number) => {
    const step = DEMO_STEPS[stepIdx];
    if (!step) return;

    if (step.step === 1) {
      setControls({ throttle: 68, altitude: 14000, ambientTemp: 5, engineLoad: 70 });
      setActiveFault('NORMAL');
      setFaultSeverity(0);
    } else if (step.step === 2) {
      setActiveFault('INJECTOR_DEGRADATION');
      setFaultSeverity(0.35);
    } else if (step.step === 3) {
      setActiveFault('INJECTOR_DEGRADATION');
      setFaultSeverity(0.60);
    } else if (step.step === 4) {
      setActiveFault('INJECTOR_DEGRADATION');
      setFaultSeverity(0.75);
    } else if (step.step === 5) {
      setActiveFault('INJECTOR_DEGRADATION');
      setFaultSeverity(0.88);
    } else if (step.step === 6) {
      setActiveFault('INJECTOR_DEGRADATION');
      setFaultSeverity(0.92);
    } else if (step.step === 7) {
      setActiveFault('INJECTOR_DEGRADATION');
      setFaultSeverity(0.96);
    } else if (step.step === 8) {
      setActiveFault('INJECTOR_DEGRADATION');
      setFaultSeverity(1.0);
    }
  }, []);

  // Demo auto-advance timer (5 seconds per phase for optimal evaluation pace)
  useEffect(() => {
    if (!isDemoActive || !isDemoPlaying) return;

    const timer = setInterval(() => {
      setDemoStepIndex((prev) => {
        if (prev < DEMO_STEPS.length - 1) {
          const next = prev + 1;
          applyDemoStep(next);
          return next;
        } else {
          // Loop back or hold at maintenance advisory
          return prev;
        }
      });
    }, 5500);

    return () => clearInterval(timer);
  }, [isDemoActive, isDemoPlaying, applyDemoStep]);

  const startDemo = () => {
    setIsDemoActive(true);
    setDemoStepIndex(0);
    setIsDemoPlaying(true);
    applyDemoStep(0);
  };

  const stopDemo = () => {
    setIsDemoActive(false);
  };

  const handleDemoNext = () => {
    if (demoStepIndex < DEMO_STEPS.length - 1) {
      const next = demoStepIndex + 1;
      setDemoStepIndex(next);
      applyDemoStep(next);
    }
  };

  const handleDemoPrev = () => {
    if (demoStepIndex > 0) {
      const prev = demoStepIndex - 1;
      setDemoStepIndex(prev);
      applyDemoStep(prev);
    }
  };

  const handleDemoJump = (idx: number) => {
    setDemoStepIndex(idx);
    applyDemoStep(idx);
  };

  // Reset simulation to baseline cruise
  const handleResetSimulation = () => {
    setIsDemoActive(false);
    setActiveFault('NORMAL');
    setFaultSeverity(0.85);
    setControls({
      throttle: 68,
      altitude: 14000,
      ambientTemp: 5,
      engineLoad: 70,
    });
    setCurrentMissionPhase('CRUISE');
    setIsLiveMode(true);
  };

  // Format elapsed mission time as MM:SS (e.g. 01:24 matching screenshot)
  const elapsedMins = Math.floor(elapsedSecondsRef.current / 60);
  const elapsedSecs = Math.floor(elapsedSecondsRef.current % 60);
  const elapsedTimeStr = `${String(elapsedMins).padStart(2, '0')}:${String(elapsedSecs).padStart(2, '0')}`;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        theme === 'light'
          ? 'bg-[#f8fafc] text-slate-900'
          : 'bg-[#060a12] text-slate-100'
      }`}
    >
      {/* 1. Header with Role Selector, 3D Toggle, Reports, and Python Dash source */}
      <VibesparTopBar
        theme={theme}
        onToggleTheme={toggleTheme}
        currentRole={currentRole}
        onSelectRole={(r) => {
          if (r === 'TECH_SPECS') {
            setIsArchitectureModalOpen(true);
          } else {
            setCurrentRole(r);
          }
        }}
        show3DEngine={show3DEngine}
        onToggle3DEngine={() => setShow3DEngine(!show3DEngine)}
        onOpenPythonModal={() => setIsPythonModalOpen(true)}
        onOpenReportsModal={() => setIsReportsModalOpen(true)}
        onOpenArchitectureModal={() => setIsArchitectureModalOpen(true)}
        uavId="UAV-07"
        engineId="AERO-PISTON-01"
        missionId="MISSION-027"
        isConnected={isLiveMode}
      />

      {/* Main Dashboard Layout (Dynamically re-rendered per selected role) */}
      <main className="flex-1 p-3 sm:p-4.5 max-w-[1780px] mx-auto w-full flex flex-col space-y-4">
        {/* Active Demo Mode Stepper Banner (when active) */}
        {isDemoActive && (
          <DemoController
            currentStepIndex={demoStepIndex}
            isPlaying={isDemoPlaying}
            onTogglePlay={() => setIsDemoPlaying(!isDemoPlaying)}
            onNextStep={handleDemoNext}
            onPrevStep={handleDemoPrev}
            onStopDemo={stopDemo}
            onJumpToStep={handleDemoJump}
          />
        )}

        {/* ROLE PERSONA 0: OVERVIEW FRONT PAGE (Aero Piston Engine Dashboard with 3D Simulation Hero) */}
        {currentRole === 'OVERVIEW' && (
          <AeroPistonFrontPage
            telemetry={latestTelemetry}
            telemetryHistory={telemetryHistory}
            health={healthScores}
            activeFault={activeFault}
            faultSeverity={faultSeverity}
            diagnostic={aiDiagnostics}
            rul={rulEstimate}
            controls={controls}
            theme={theme}
            onInjectFault={(f, s) => {
              setActiveFault(f);
              setFaultSeverity(s !== undefined ? s : 0.7);
              if (f === 'NORMAL') {
                setControls((prev) => ({ ...prev, throttle: 68, altitude: 8400 }));
              }
            }}
            onNavigateTab={(tab) => {
              if (tab === 'TECH_SPECS') {
                setIsArchitectureModalOpen(true);
              } else {
                setCurrentRole(tab as UserRole);
              }
            }}
            onOpenArchitectureModal={() => setIsArchitectureModalOpen(true)}
          />
        )}

        {/* ROLE PERSONA 1: 3D ENGINE EXPLORER (Kinematics, Cutaways & Cockpit Controls) */}
        {currentRole === 'OPERATOR' && (
          <OperatorView
            telemetry={latestTelemetry}
            health={healthScores}
            activeFault={activeFault}
            diagnostic={aiDiagnostics}
            currentPhase={currentMissionPhase}
            onSelectPhase={handleSelectMissionPhase}
            show3DEngine={show3DEngine}
            onToggle3DEngine={() => setShow3DEngine(!show3DEngine)}
            theme={theme}
            onInjectFault={(f) => {
              setActiveFault(f);
              if (f === 'NORMAL') {
                setControls((prev) => ({ ...prev, throttle: 68, altitude: 8400 }));
              }
            }}
            alerts={alerts}
            onAcknowledgeAlerts={() => setAlerts([])}
          />
        )}

        {/* ROLE PERSONA 2: PROPULSION ENGINEER (Thermodynamics, Physics Residuals, Actuators) */}
        {currentRole === 'ENGINEER' && (
          <EngineerView
            telemetry={latestTelemetry}
            telemetryHistory={telemetryHistory}
            health={healthScores}
            activeFault={activeFault}
            diagnostic={aiDiagnostics}
            controls={controls}
            onChangeControls={setControls}
            comparisonItems={comparisonItems}
            show3DEngine={show3DEngine}
            onToggle3DEngine={() => setShow3DEngine(!show3DEngine)}
            theme={theme}
            onInjectFault={(f) => {
              setActiveFault(f);
              if (f === 'NORMAL') {
                setControls((prev) => ({ ...prev, throttle: 68, altitude: 8400 }));
              }
            }}
            selectedSensorId={selectedSensorId}
            onSelectSensorId={(id) => setSelectedSensorId(id)}
          />
        )}

        {/* ROLE PERSONA 3: MAINTENANCE TEAM (Prognostics, RUL, Fleet Timeline, Work Orders) */}
        {currentRole === 'MAINTENANCE' && (
          <MaintenanceView
            telemetry={latestTelemetry}
            health={healthScores}
            activeFault={activeFault}
            rul={rulEstimate}
            diagnostic={aiDiagnostics}
            show3DEngine={show3DEngine}
            onToggle3DEngine={() => setShow3DEngine(!show3DEngine)}
            theme={theme}
            onOpenReportsModule={() => setIsReportsModalOpen(true)}
          />
        )}

        {/* ROLE PERSONA 4: MISSION REPORTS (Comprehensive Self-Contained Flight Test Reports Module) */}
        {currentRole === 'REPORTS' && (
          <MissionReportsModule
            isInline={true}
            onClose={() => setCurrentRole('OPERATOR')}
            currentEngineHealth={Math.round(healthScores.overall)}
          />
        )}

        {/* ROLE PERSONA 5 / INNOVATION TAB: EDGE AI & CYBER-PHYSICAL SECURITY */}
        {currentRole === 'EDGE_AI' && (
          <EdgeAiSecurityPanel
            telemetry={latestTelemetry}
            health={healthScores}
            activeFault={activeFault}
            diagnostic={aiDiagnostics}
            theme={theme}
          />
        )}



        {/* Bottom Bar: FAULT INJECTION + DEMO MODE (Exact to Screenshot) */}
        <VibesparBottomBar
          activeFault={activeFault}
          onSelectFault={(f) => {
            setActiveFault(f);
            if (f === 'NORMAL') {
              setControls((prev) => ({ ...prev, throttle: 68, altitude: 8400 }));
            }
          }}
          isDemoActive={isDemoActive}
          onToggleDemo={() => {
            if (isDemoActive) {
              setIsDemoPlaying(!isDemoPlaying);
            } else {
              startDemo();
            }
          }}
          theme={theme}
        />

        {/* Collapsible Advanced Digital Twin & Telemetry Lab */}
        <div className="w-full pt-2">
          <button
            onClick={() => setShowAdvancedTools(!showAdvancedTools)}
            className={`w-full py-2.5 px-4 rounded border font-chakra font-bold text-xs tracking-wider flex items-center justify-between transition-colors ${
              theme === 'light'
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                : 'bg-[#091222] hover:bg-[#0e1a30] border-[#182942] text-slate-300'
            }`}
          >
            <span className="flex items-center space-x-2">
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                [ADVANCED SIMULATION SUITE]
              </span>
              <span>
                REAL-TIME CHARTS • DIGITAL TWIN RESIDUAL MATRIX • WHAT-IF SCENARIO PLANNER • FDR TIMELINE
              </span>
            </span>
            <div className="flex items-center space-x-1 text-slate-400">
              <span className="text-[11px] uppercase font-tech">
                {showAdvancedTools ? 'HIDE LAB' : 'EXPAND LAB'}
              </span>
              {showAdvancedTools ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {/* Expandable Advanced Lab Modules */}
          {showAdvancedTools && (
            <div className="mt-4 space-y-4 animate-fadeIn">
              {/* Alert System Banner & Expandable Log Drawer */}
              <AlertBannerAndLogs
                currentLevel={aiDiagnostics.status}
                currentHeadline={currentAlertHeadline}
                alerts={alerts}
                onAcknowledgeAlerts={() => setAlerts([])}
              />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Expected vs Actual Residual Table + AI Prognostic Details */}
                <div className="lg:col-span-6 flex flex-col space-y-4">
                  <DigitalTwinComparison
                    items={comparisonItems}
                    anomalyScore={anomalyScore}
                  />
                  <AiDiagnosticsPanel
                    diagnostic={aiDiagnostics}
                    rul={rulEstimate}
                  />
                </div>

                {/* Real-Time Telemetry Stream Graphs (Recharts) + Actuator Controls */}
                <div className="lg:col-span-6 flex flex-col space-y-4">
                  <TelemetryCharts
                    history={telemetryHistory}
                    latest={latestTelemetry}
                    selectedChannel={selectedSensorId}
                    onSelectChannel={(ch) => setSelectedSensorId(ch)}
                  />
                  <OperatingControls
                    controls={controls}
                    onChange={setControls}
                    disabled={isDemoActive}
                  />
                </div>
              </div>

              {/* What-If Scenario Extrapolator + Flight Data Recorder Replay */}
              <div className="space-y-4">
                <WhatIfSimulation currentHealth={healthScores.overall} />
                <MissionReplayTimeline
                  onReplayPointSelect={handleReplayPointSelect}
                  isLiveMode={isLiveMode}
                  onToggleLiveMode={() => setIsLiveMode(!isLiveMode)}
                />
              </div>

              {/* Innovation Showcase: Edge AI & Cyber-Physical Security Architecture */}
              {currentRole !== 'EDGE_AI' && (
                <div className="pt-2">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-chakra font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <span>⚡ ONBOARD COMPUTING & CYBER-SECURITY LAB</span>
                    </span>
                    <button
                      onClick={() => setCurrentRole('EDGE_AI')}
                      className="text-[11px] font-tech text-cyan-300 hover:text-cyan-100 underline decoration-cyan-500/50"
                    >
                      Open in Full View ↗
                    </button>
                  </div>
                  <EdgeAiSecurityPanel
                    telemetry={latestTelemetry}
                    health={healthScores}
                    activeFault={activeFault}
                    diagnostic={aiDiagnostics}
                    theme={theme}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Technical Metadata matching reference image */}
        <footer
          className={`w-full pt-4 pb-4 px-2 text-xs font-chakra border-t flex flex-wrap items-center justify-between gap-3 select-none ${
            theme === 'light'
              ? 'border-slate-200 text-slate-600'
              : 'border-[#15253b] text-slate-400'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <span className="font-extrabold tracking-wider text-cyan-600 dark:text-cyan-400">
              VIBESPAR
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="tracking-wide text-slate-600 dark:text-slate-400">
              Predict • Prevent • Fly
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" viewBox="0 0 48 24" fill="currentColor">
              <path d="M24 8 L32 10 L44 11 L46 12 L32 13 L28 16 L24 22 L22 22 L24 16 L16 16 L12 20 L10 20 L12 14 L4 13 L2 12 L4 11 L16 10 L22 8 Z" opacity="0.8" />
            </svg>
            <span className="font-medium text-slate-600 dark:text-slate-400">
              MALE UAV — Aero Piston Engine
            </span>
          </div>
        </footer>
      </main>

      {/* Python Dash + Plotly Full Source Code Viewer & Export Modal */}
      <PythonDashCodeModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
      />

      {/* Mission-Wise Health Reports Module (Shared across all roles) */}
      <MissionReportsModule
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        currentEngineHealth={Math.round(healthScores.overall)}
      />

      {/* Digital Twin Architecture & Technical Documentation Modal */}
      <DigitalTwinArchitectureModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
        theme={theme}
      />
    </div>
  );
}

