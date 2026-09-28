import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  Activity,
  ShieldCheck,
  Zap,
  GitBranch,
  Terminal,
  Database,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Gauge,
  Sliders,
  Radio,
  FileCode,
  X,
  Compass,
  Milestone,
  Lock,
} from 'lucide-react';

interface DigitalTwinArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
}

type TabType = 'ARCHITECTURE' | 'SIMULATION' | 'PINN_AI' | 'EDGE_CAN' | 'ROADMAP';

export const DigitalTwinArchitectureModal: React.FC<DigitalTwinArchitectureModalProps> = ({
  isOpen,
  onClose,
  theme,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('ARCHITECTURE');

  if (!isOpen) return null;

  const isLight = theme === 'light';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-colors ${
          isLight
            ? 'bg-white border-slate-300 text-slate-900'
            : 'bg-[#080f1d] border-[#1c3352] text-slate-100 shadow-[0_12px_48px_rgba(0,0,0,0.8)]'
        }`}
      >
        {/* Header Bar */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#050b16] border-[#152740]'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-600/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-chakra font-bold tracking-wide uppercase text-slate-900 dark:text-white">
                  Digital Twin Architecture & Technical Documentation
                </h2>
                <span className="text-[10px] font-chakra font-semibold px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 uppercase">
                  TRL-6 PROTOCOL
                </span>
              </div>
              <p className="text-xs font-sans text-slate-600 dark:text-slate-400">
                Rotax 914-F Turbocharged Aero Piston Digital Twin • DRDO & UAV Propulsion Deliverables
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Close Documentation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className={`flex overflow-x-auto border-b px-5 text-xs font-chakra font-bold tracking-wider uppercase ${
            isLight ? 'bg-slate-100/70 border-slate-200 text-slate-700' : 'bg-[#060e1c] border-[#152740] text-slate-300'
          }`}
        >
          <button
            onClick={() => setActiveTab('ARCHITECTURE')}
            className={`py-2.5 px-3.5 border-b-2 flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'ARCHITECTURE'
                ? 'border-cyan-600 text-cyan-700 dark:text-cyan-400 bg-white/70 dark:bg-white/5 font-extrabold'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Digital Twin Architecture</span>
          </button>
          <button
            onClick={() => setActiveTab('SIMULATION')}
            className={`py-2.5 px-3.5 border-b-2 flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'SIMULATION'
                ? 'border-cyan-600 text-cyan-700 dark:text-cyan-400 bg-white/70 dark:bg-white/5 font-extrabold'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>2. Physics Simulation Model</span>
          </button>
          <button
            onClick={() => setActiveTab('PINN_AI')}
            className={`py-2.5 px-3.5 border-b-2 flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'PINN_AI'
                ? 'border-cyan-600 text-cyan-700 dark:text-cyan-400 bg-white/70 dark:bg-white/5 font-extrabold'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>3. PINN & Explainable AI</span>
          </button>
          <button
            onClick={() => setActiveTab('EDGE_CAN')}
            className={`py-2.5 px-3.5 border-b-2 flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'EDGE_CAN'
                ? 'border-cyan-600 text-cyan-700 dark:text-cyan-400 bg-white/70 dark:bg-white/5 font-extrabold'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>4. CAN Bus & Edge Embedded</span>
          </button>
          <button
            onClick={() => setActiveTab('ROADMAP')}
            className={`py-2.5 px-3.5 border-b-2 flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'ROADMAP'
                ? 'border-cyan-600 text-cyan-700 dark:text-cyan-400 bg-white/70 dark:bg-white/5 font-extrabold'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Milestone className="w-3.5 h-3.5" />
            <span>5. Deployment Roadmap</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-slate-800 dark:text-slate-200">
          {/* TAB 1: DIGITAL TWIN ARCHITECTURE DESIGN */}
          {activeTab === 'ARCHITECTURE' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-chakra font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-600" />
                  Multilayer Digital Twin Architecture Design
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  The digital twin synchronizes physical UAV IC engine operations with virtual analytical counterparts
                  across four interconnected tiers: physical hardware instrumentation, onboard real-time edge processing,
                  high-speed CAN bus communications, and ground station prognostic digital twins.
                </p>
              </div>

              {/* Architecture Tier Flow Diagram */}
              <div
                className={`p-4 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#050c18] border-[#162a45]'
                }`}
              >
                <div className="text-xs font-chakra font-bold text-slate-700 dark:text-slate-300 uppercase mb-3">
                  Tiered Hardware-In-The-Loop (HWIL) Architecture Flow
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Tier 1 */}
                  <div
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between ${
                      isLight ? 'bg-white border-slate-200' : 'bg-[#091526] border-[#1d3757]'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-chakra font-bold text-cyan-600 dark:text-cyan-400 uppercase">
                        Tier 1: Physical Engine
                      </span>
                      <h4 className="font-chakra font-bold text-xs text-slate-900 dark:text-white mt-1">
                        Rotax 914-F Sensors
                      </h4>
                      <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 mt-2 font-sans">
                        <li>• 4x CHT Type-K Thermocouples</li>
                        <li>• 4x EGT Exhaust Pyrometers</li>
                        <li>• Piezoelectric Crank Accelerometer</li>
                        <li>• MAP & Boost Pressure Transducers</li>
                        <li>• Hall-effect Gearbox Tachometer</li>
                      </ul>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] font-tech text-emerald-600 dark:text-emerald-400">
                      Sampling: 50 Hz CAN-FD
                    </div>
                  </div>

                  {/* Tier 2 */}
                  <div
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between ${
                      isLight ? 'bg-white border-slate-200' : 'bg-[#091526] border-[#1d3757]'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-chakra font-bold text-purple-600 dark:text-purple-400 uppercase">
                        Tier 2: Onboard Edge AI
                      </span>
                      <h4 className="font-chakra font-bold text-xs text-slate-900 dark:text-white mt-1">
                        Dual FADEC & Edge TPU
                      </h4>
                      <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 mt-2 font-sans">
                        <li>• STM32H7 / Jetson Orin Nano</li>
                        <li>• INT8 Quantized PINN Model</li>
                        <li>• Sub-5ms Anomaly Inference</li>
                        <li>• Sensor Drift Compensation</li>
                        <li>• Autonomous Failsafe Logic</li>
                      </ul>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] font-tech text-purple-600 dark:text-purple-400">
                      Latency: 4.2 ms / cycle
                    </div>
                  </div>

                  {/* Tier 3 */}
                  <div
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between ${
                      isLight ? 'bg-white border-slate-200' : 'bg-[#091526] border-[#1d3757]'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-chakra font-bold text-amber-600 dark:text-amber-400 uppercase">
                        Tier 3: Datalink & Security
                      </span>
                      <h4 className="font-chakra font-bold text-xs text-slate-900 dark:text-white mt-1">
                        AES-128 Telemetry Bus
                      </h4>
                      <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 mt-2 font-sans">
                        <li>• CAN 2.0B / UAVCAN v1 Protocol</li>
                        <li>• MIL-STD-1553B Avionics Bridge</li>
                        <li>• Cryptographic HMAC Frame Signatures</li>
                        <li>• Anti-Tamper Frame Sequence Counter</li>
                        <li>• Zero Egress Raw Data Policy</li>
                      </ul>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] font-tech text-amber-600 dark:text-amber-400">
                      Bandwidth: 500 kbps
                    </div>
                  </div>

                  {/* Tier 4 */}
                  <div
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between ${
                      isLight ? 'bg-white border-slate-200' : 'bg-[#091526] border-[#1d3757]'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-chakra font-bold text-teal-600 dark:text-teal-400 uppercase">
                        Tier 4: GCS Digital Twin
                      </span>
                      <h4 className="font-chakra font-bold text-xs text-slate-900 dark:text-white mt-1">
                        Ground Control Platform
                      </h4>
                      <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 mt-2 font-sans">
                        <li>• 3D WebGL Kinematic Twin</li>
                        <li>• Residual Matrix Tracking</li>
                        <li>• Fleet RUL & Work Order Advisories</li>
                        <li>• What-If Mission Envelope Planner</li>
                        <li>• Federated Fleet Learning Sync</li>
                      </ul>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] font-tech text-teal-600 dark:text-teal-400">
                      Synchronized: Dual-Way State
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Specifications Matrix */}
              <div>
                <h4 className="text-xs font-chakra font-bold text-slate-900 dark:text-white uppercase mb-2">
                  Engine & Digital Twin Baseline Parameters
                </h4>
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs font-sans">
                    <thead
                      className={`text-[11px] font-chakra font-bold uppercase ${
                        isLight ? 'bg-slate-100 text-slate-700' : 'bg-[#071324] text-slate-300'
                      }`}
                    >
                      <tr>
                        <th className="py-2 px-3">Subsystem Parameter</th>
                        <th className="py-2 px-3">OEM / Physical Baseline</th>
                        <th className="py-2 px-3">Digital Twin Representation</th>
                        <th className="py-2 px-3">Tolerance / Threshold</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px]">
                      <tr>
                        <td className="py-2 px-3 font-semibold">Engine Displacement</td>
                        <td className="py-2 px-3">1211.2 cm³ (4-Cyl Boxer)</td>
                        <td className="py-2 px-3">Swept Volume V(θ) Kinematic Equation</td>
                        <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400">Exact CAD Geo</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold">Bore x Stroke</td>
                        <td className="py-2 px-3">79.5 mm × 64.0 mm</td>
                        <td className="py-2 px-3">Bore Cross Section: 49.64 cm² per cyl</td>
                        <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400">±0.02 mm</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold">Compression Ratio</td>
                        <td className="py-2 px-3">9.0 : 1</td>
                        <td className="py-2 px-3">Clearance Volume Vc = 37.85 cm³</td>
                        <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400">±0.15:1</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold">Cylinder Head Temp (CHT)</td>
                        <td className="py-2 px-3">Max 175°C continuous</td>
                        <td className="py-2 px-3">Lumped-Capacitance Thermal Conduction Network</td>
                        <td className="py-2 px-3 text-amber-600 dark:text-amber-400">Alert &gt;175°C | Alarm &gt;185°C</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold">Exhaust Gas Temp (EGT)</td>
                        <td className="py-2 px-3">Max 850°C continuous</td>
                        <td className="py-2 px-3">Stoichiometric λ-Combustion Enthalpy</td>
                        <td className="py-2 px-3 text-rose-600 dark:text-rose-400">Alert &gt;800°C | Alarm &gt;850°C</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold">Turbocharger Boost</td>
                        <td className="py-2 px-3">1.39 bar (40 inHg MAP max)</td>
                        <td className="py-2 px-3">TCU Wastegate Servo Actuator PID</td>
                        <td className="py-2 px-3 text-purple-600 dark:text-purple-400">±0.05 bar</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ENGINE SIMULATION MODEL & THERMODYNAMICS */}
          {activeTab === 'SIMULATION' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-chakra font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-600" />
                  Hybrid Thermodynamic & Kinematic Simulation Model
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  The digital twin incorporates a high-fidelity physical mathematical model that continuously solves
                  instantaneous thermodynamic gas state variables, crank angle kinematics, and heat dissipation
                  simultaneously with flight envelope parameters.
                </p>
              </div>

              {/* Mathematical Formulas Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#050c18] border-[#162a45]'
                  }`}
                >
                  <div className="flex items-center space-x-2 text-xs font-chakra font-bold text-cyan-600 dark:text-cyan-400 uppercase mb-2">
                    <FileCode className="w-4 h-4" />
                    <span>1. Instantaneous Cylinder Volume & Kinematics</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans mb-3">
                    As a function of crank rotation angle θ ∈ [0, 720°], the combustion chamber volume is:
                  </p>
                  <div
                    className={`p-2.5 rounded font-tech text-xs border ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0a1526] border-[#1c3554] text-cyan-300'
                    }`}
                  >
                    V(&theta;) = V_c + (&pi;·B&sup2; / 4) · [ r + l - (r·cos(&theta;) + &radic;(l&sup2; - r&sup2;·sin&sup2;(&theta;))) ]
                  </div>
                  <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5 font-sans">
                    <div>• B: Cylinder Bore = 79.5 mm (Bore Area = 49.64 cm²)</div>
                    <div>• r: Crank Throw Radius = 32.0 mm (Stroke = 64.0 mm)</div>
                    <div>• l: Connecting Rod Length = 112.0 mm (l/r = 3.5)</div>
                    <div>• Vc: Clearance Volume = 37.85 cm³</div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#050c18] border-[#162a45]'
                  }`}
                >
                  <div className="flex items-center space-x-2 text-xs font-chakra font-bold text-amber-600 dark:text-amber-400 uppercase mb-2">
                    <Flame className="w-4 h-4" />
                    <span>2. First-Law Energy Balance & Heat Flux</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans mb-3">
                    In-cylinder heat transfer follows the Annand-Woschni convective-radiative correlation:
                  </p>
                  <div
                    className={`p-2.5 rounded font-tech text-xs border ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0a1526] border-[#1c3554] text-amber-300'
                    }`}
                  >
                    q&#39;&#39; = h_c &middot; (T_gas - T_wall) + &epsilon;&middot;&sigma; &middot; (T_gas&sup4; - T_wall&sup4;)
                  </div>
                  <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5 font-sans">
                    <div>• Convective coefficient: hc = a · B⁻⁰·² · P⁰·⁸ · T⁻⁰·⁵³ · w⁰·⁸ (gas velocity w)</div>
                    <div>• Cylinder Head Temp (T_CHT) modeled via fin Biot number: Bi = 0.082</div>
                    <div>• Turbocharger Turbine Isentropic Efficiency: η_t = 0.74</div>
                    <div>• Wastegate bypass fraction dynamically adapts to altitude lapse rate</div>
                  </div>
                </div>
              </div>

              {/* Cross-Sectional Geometry Engineering Breakdown */}
              <div
                className={`p-4 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#050c18] border-[#162a45]'
                }`}
              >
                <div className="text-xs font-chakra font-bold text-slate-700 dark:text-slate-300 uppercase mb-3">
                  Cross-Sectional Aerodynamic & Mechanical Dimensions
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-sans">
                  <div className={`p-2.5 rounded border ${isLight ? 'bg-white border-slate-200' : 'bg-[#081220] border-[#19304e]'}`}>
                    <div className="text-[10px] text-slate-500 uppercase font-chakra font-semibold">Cylinder Bore Area</div>
                    <div className="text-base font-bold font-tech text-cyan-600 dark:text-cyan-400 mt-0.5">49.64 cm²</div>
                    <div className="text-[10px] text-slate-500">Ø 79.5 mm / Cyl</div>
                  </div>
                  <div className={`p-2.5 rounded border ${isLight ? 'bg-white border-slate-200' : 'bg-[#081220] border-[#19304e]'}`}>
                    <div className="text-[10px] text-slate-500 uppercase font-chakra font-semibold">Intake Runner Throat</div>
                    <div className="text-base font-bold font-tech text-emerald-600 dark:text-emerald-400 mt-0.5">7.07 cm²</div>
                    <div className="text-[10px] text-slate-500">Ø 30.0 mm Manifold</div>
                  </div>
                  <div className={`p-2.5 rounded border ${isLight ? 'bg-white border-slate-200' : 'bg-[#081220] border-[#19304e]'}`}>
                    <div className="text-[10px] text-slate-500 uppercase font-chakra font-semibold">Exhaust Valve Throat</div>
                    <div className="text-base font-bold font-tech text-rose-600 dark:text-rose-400 mt-0.5">5.73 cm²</div>
                    <div className="text-[10px] text-slate-500">Ø 27.0 mm Pyrometer</div>
                  </div>
                  <div className={`p-2.5 rounded border ${isLight ? 'bg-white border-slate-200' : 'bg-[#081220] border-[#19304e]'}`}>
                    <div className="text-[10px] text-slate-500 uppercase font-chakra font-semibold">Oil Gallery Channel</div>
                    <div className="text-base font-bold font-tech text-amber-600 dark:text-amber-400 mt-0.5">0.79 cm²</div>
                    <div className="text-[10px] text-slate-500">Ø 10.0 mm Dry Sump</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PINN & EXPLAINABLE AI ANOMALY DETECTION */}
          {activeTab === 'PINN_AI' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-chakra font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-600" />
                  Physics-Informed AI (PINN) & SHAP Explainable Diagnostics
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Unlike black-box models, our Physics-Informed Neural Network (Bi-LSTM + PINN) embeds thermodynamic
                  and mechanical conservation laws directly into the backpropagation loss objective. Anomaly scoring
                  is driven by multi-sensor residual distance combined with SHAP feature contribution attributions.
                </p>
              </div>

              {/* Loss Formulation Card */}
              <div
                className={`p-4 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#050c18] border-[#162a45]'
                }`}
              >
                <div className="text-xs font-chakra font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                  Physics-Informed Loss Objective Function
                </div>
                <div
                  className={`p-3 rounded font-tech text-xs sm:text-sm border ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0a1526] border-[#1c3554] text-purple-300'
                  }`}
                >
                  L_total = L_MSE(y, &ycirc;) + &lambda;_1 &middot; || &Delta;Q_chem - &Delta;U_cv - W_shaft - Q_loss ||&sup2; + &lambda;_2 &middot; || &Sigma; F_inertia - m_piston&middot;a_piston ||&sup2;
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-sans leading-relaxed">
                  This forces the neural network to output only states that adhere to the 1st Law of Thermodynamics
                  and reciprocating engine mass kinematics, eliminating false positives from atmospheric turbulences.
                </p>
              </div>

              {/* Anomaly Detection Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#081220] border-[#19304e]'}`}>
                  <div className="flex items-center space-x-2 text-xs font-chakra font-bold text-rose-600 dark:text-rose-400 uppercase">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Fault Isolation Engine</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed font-sans">
                    Categorizes 7 distinct propulsion failure modes: Injector Degradation, Spark Misfire, Lubrication Failure,
                    Cooling Exceedance, Crankshaft Bearing Vibration, Wastegate Sticking, and Sensor Drift.
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#081220] border-[#19304e]'}`}>
                  <div className="flex items-center space-x-2 text-xs font-chakra font-bold text-cyan-600 dark:text-cyan-400 uppercase">
                    <Activity className="w-4 h-4" />
                    <span>SHAP Explainability</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed font-sans">
                    Computes instantaneous Shapley values for each sensor channel. When Cylinder 2 CHT elevates, SHAP isolates
                    restricted fuel flow (+0.42) as root cause rather than external thermal convection.
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#081220] border-[#19304e]'}`}>
                  <div className="flex items-center space-x-2 text-xs font-chakra font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    <Zap className="w-4 h-4" />
                    <span>Prognostic RUL Estimation</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed font-sans">
                    Remaining Useful Life (RUL) computed via degradation trend extrapolation through Weibull hazard rate:
                    R(t) = exp(-(t/η)^β), projecting operating margin before mandatory hangar servicing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CAN BUS & EDGE EMBEDDED ARCHITECTURE */}
          {activeTab === 'EDGE_CAN' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-chakra font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-600" />
                  CAN Bus 2.0B / UAVCAN Communication & Edge Footprint
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Real-time telemetry streams from FADEC over dual-redundant CAN-FD channels with cryptographic
                  HMAC payload validation. Designed to fit within lightweight UAV avionics constraints with minimal SWaP-C.
                </p>
              </div>

              {/* CAN Frame DBC Matrix Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs font-sans">
                  <thead
                    className={`text-[11px] font-chakra font-bold uppercase ${
                      isLight ? 'bg-slate-100 text-slate-700' : 'bg-[#071324] text-slate-300'
                    }`}
                  >
                    <tr>
                      <th className="py-2 px-3">CAN ID</th>
                      <th className="py-2 px-3">Message Name</th>
                      <th className="py-2 px-3">DLC</th>
                      <th className="py-2 px-3">Frequency</th>
                      <th className="py-2 px-3">Signals Encoded</th>
                      <th className="py-2 px-3">Resolution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px] font-tech">
                    <tr>
                      <td className="py-2 px-3 text-cyan-600 dark:text-cyan-400 font-bold">0x280</td>
                      <td className="py-2 px-3 font-sans font-semibold">PROP_DYNAMICS</td>
                      <td className="py-2 px-3">8 Bytes</td>
                      <td className="py-2 px-3">100 Hz</td>
                      <td className="py-2 px-3 font-sans">Engine RPM, Prop Pitch, Crank Angle</td>
                      <td className="py-2 px-3">0.25 RPM / 0.1°</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-cyan-600 dark:text-cyan-400 font-bold">0x281</td>
                      <td className="py-2 px-3 font-sans font-semibold">THERMAL_CYL_1_4</td>
                      <td className="py-2 px-3">8 Bytes</td>
                      <td className="py-2 px-3">50 Hz</td>
                      <td className="py-2 px-3 font-sans">CHT Cyl 1, CHT Cyl 2, CHT Cyl 3, CHT Cyl 4</td>
                      <td className="py-2 px-3">0.1 °C / LSB</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-cyan-600 dark:text-cyan-400 font-bold">0x282</td>
                      <td className="py-2 px-3 font-sans font-semibold">EXHAUST_PYRO</td>
                      <td className="py-2 px-3">8 Bytes</td>
                      <td className="py-2 px-3">50 Hz</td>
                      <td className="py-2 px-3 font-sans">EGT Cyl 1-4, Pyrometer Collector, MAP</td>
                      <td className="py-2 px-3">0.5 °C / 0.01 bar</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-cyan-600 dark:text-cyan-400 font-bold">0x283</td>
                      <td className="py-2 px-3 font-sans font-semibold">LUBE_VIBRATION</td>
                      <td className="py-2 px-3">8 Bytes</td>
                      <td className="py-2 px-3">50 Hz</td>
                      <td className="py-2 px-3 font-sans">Oil Pressure, Oil Temp, Vib Tri-Axial RMS</td>
                      <td className="py-2 px-3">0.05 bar / 0.01 g</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-cyan-600 dark:text-cyan-400 font-bold">0x284</td>
                      <td className="py-2 px-3 font-sans font-semibold">EDGE_AI_DIAG</td>
                      <td className="py-2 px-3">8 Bytes</td>
                      <td className="py-2 px-3">20 Hz</td>
                      <td className="py-2 px-3 font-sans">Anomaly Score, Fault Code, RUL Hours</td>
                      <td className="py-2 px-3">0.001 / 1 Hour</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Edge AI Profiling Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-sans">
                <div className={`p-3 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-[#081220] border-[#19304e]'}`}>
                  <div className="text-[10px] text-slate-500 uppercase font-chakra font-semibold">Quantized Model Size</div>
                  <div className="text-base font-bold font-tech text-purple-600 dark:text-purple-400 mt-0.5">3.8 MB</div>
                  <div className="text-[10px] text-slate-500">INT8 Post-Training TFLite</div>
                </div>
                <div className={`p-3 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-[#081220] border-[#19304e]'}`}>
                  <div className="text-[10px] text-slate-500 uppercase font-chakra font-semibold">Inference Latency</div>
                  <div className="text-base font-bold font-tech text-emerald-600 dark:text-emerald-400 mt-0.5">4.2 ms</div>
                  <div className="text-[10px] text-slate-500">Cortex-M7 @ 480 MHz</div>
                </div>
                <div className={`p-3 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-[#081220] border-[#19304e]'}`}>
                  <div className="text-[10px] text-slate-500 uppercase font-chakra font-semibold">RAM Memory Footprint</div>
                  <div className="text-base font-bold font-tech text-cyan-600 dark:text-cyan-400 mt-0.5">&lt; 1.2 MB</div>
                  <div className="text-[10px] text-slate-500">Static allocation, zero heap</div>
                </div>
                <div className={`p-3 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-[#081220] border-[#19304e]'}`}>
                  <div className="text-[10px] text-slate-500 uppercase font-chakra font-semibold">Power Consumption</div>
                  <div className="text-base font-bold font-tech text-amber-600 dark:text-amber-400 mt-0.5">1.4 Watts</div>
                  <div className="text-[10px] text-slate-500">Avionics 28V Bus Draw</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DEPLOYMENT ROADMAP & TRL MATURITY */}
          {activeTab === 'ROADMAP' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-chakra font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                  <Milestone className="w-4 h-4 text-cyan-600" />
                  Technical Deployment Roadmap & TRL Advancement
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Phase-gate qualification pathway transitioning the Aero Piston Engine Digital Twin from
                  laboratory software prototype (TRL-4) to full BVLOS autonomous fleet integration (TRL-8).
                </p>
              </div>

              {/* Roadmap Phases */}
              <div className="space-y-3 font-sans">
                {/* Phase 1 */}
                <div
                  className={`p-3.5 rounded-xl border flex items-start space-x-3 ${
                    isLight ? 'bg-emerald-50/60 border-emerald-300' : 'bg-[#081a18] border-[#14483f]'
                  }`}
                >
                  <div className="p-1.5 rounded-full bg-emerald-500 text-white shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-chakra font-bold text-xs text-emerald-800 dark:text-emerald-300 uppercase">
                        Phase 1: HWIL Laboratory Bench Demonstrator (TRL 4) [COMPLETED]
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                      Real-time kinematic 3D simulation with cutaway, heat map and cross-section analysis. Multi-cylinder
                      thermal coupling, CAN frame parser, and baseline PINN Bi-LSTM anomaly detector validated against simulated dataset.
                    </p>
                  </div>
                </div>

                {/* Phase 2 */}
                <div
                  className={`p-3.5 rounded-xl border flex items-start space-x-3 ${
                    isLight ? 'bg-cyan-50/60 border-cyan-300' : 'bg-[#081928] border-[#163f60]'
                  }`}
                >
                  <div className="p-1.5 rounded-full bg-cyan-600 text-white shrink-0 mt-0.5">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-chakra font-bold text-xs text-cyan-800 dark:text-cyan-300 uppercase">
                        Phase 2: Ground Dynamometer Test Cell Integration (TRL 5) [ACTIVE]
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                      Coupling digital twin to real Rotax 914-F engine mounted on water brake dynamometer. Calibration
                      of heat transfer coefficients ($h_c$) across high-power boost regimes and validation of physical thermocouples.
                    </p>
                  </div>
                </div>

                {/* Phase 3 */}
                <div
                  className={`p-3.5 rounded-xl border flex items-start space-x-3 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#091526] border-[#1d3757]'
                  }`}
                >
                  <div className="p-1.5 rounded-full bg-slate-400 text-white shrink-0 mt-0.5">
                    <Milestone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-chakra font-bold text-xs text-slate-800 dark:text-slate-200 uppercase">
                        Phase 3: Captive Flight & Tethered Loiter Testing (TRL 6) [SCHEDULED Q3]
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Integration on TAPAS UAV test airframe. Validation of Edge AI inference under flight vibration
                      spectra, ambient temperature lapse (-15°C @ 18,000 ft), and secure telemetry datalink transmission.
                    </p>
                  </div>
                </div>

                {/* Phase 4 */}
                <div
                  className={`p-3.5 rounded-xl border flex items-start space-x-3 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#091526] border-[#1d3757]'
                  }`}
                >
                  <div className="p-1.5 rounded-full bg-slate-400 text-white shrink-0 mt-0.5">
                    <Milestone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-chakra font-bold text-xs text-slate-800 dark:text-slate-200 uppercase">
                        Phase 4: Autonomous Fleet Maintenance & Federated Learning (TRL 7/8) [HORIZON]
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Federated aggregation across 12 operational UAV units. Automated hangar work order issuance,
                      autonomous spare parts logistics via ATA-72/73 codes, and real-time engine health indexing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`px-5 py-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs font-chakra font-bold ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#050b16] border-[#152740] text-slate-400'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>CONFIDENTIAL • DRDO / AEROSPACE PROPULSION SPECIFICATION</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white transition-colors uppercase tracking-wider text-xs"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
