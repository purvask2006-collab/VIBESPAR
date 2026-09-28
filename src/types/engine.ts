export type FaultType =
  | 'NORMAL'
  | 'INJECTOR_DEGRADATION'
  | 'MISFIRE'
  | 'LUBRICATION_FAILURE'
  | 'OVERHEATING'
  | 'VIBRATION_ANOMALY'
  | 'SENSOR_DRIFT';

export interface OperatingControls {
  throttle: number; // 0 - 100 %
  altitude: number; // 0 - 20000 ft
  ambientTemp: number; // -10 to +50 °C
  engineLoad: number; // 0 - 100 %
}

export interface TelemetryData {
  timeStr: string;
  timestamp: number;
  rpm: number;
  cht: number; // Primary/Hot Spot Cylinder Head Temp (°C)
  egt: number; // Primary Collector Exhaust Gas Temp (°C)
  oilPressure: number; // bar
  oilTemperature: number; // °C
  fuelFlow: number; // L/h
  vibration: number; // g RMS
  manifoldPressure: number; // inHg
  busVoltage: number; // V
  powerHp: number; // Horsepower (calc)
  torqueNm?: number; // Torque in Nm (calc)
  fuelRemainingKg: number; // Tank reserve
  // Enhanced Multi-Cylinder & Propulsion Channels
  chtCylinders: [number, number, number, number]; // CHT for Cyl 1, 2, 3, 4 (°C)
  egtCylinders: [number, number, number, number]; // EGT for Cyl 1, 2, 3, 4 (°C)
  turboBoostBar: number; // Gauge boost pressure (bar)
  wastegatePosition: number; // 0 - 100 % (TCU servo command)
  propellerPitchDeg: number; // Propeller blade angle (deg)
  coolantTemp: number; // Cylinder Head Water Jacket Temp (°C)
  oilFlowRate: number; // L/min
  crankAngleDeg?: number; // Instantaneous crank rotation angle (0-720°)
}

export interface DigitalTwinComparisonItem {
  id: string;
  name: string;
  unit: string;
  expected: number;
  actual: number;
  residual: number;
  tolerance: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

export interface EngineHealthScores {
  overall: number; // 0 - 100
  thermal: number; // 0 - 100
  combustion: number; // 0 - 100
  lubrication: number; // 0 - 100
  mechanical: number; // 0 - 100
  electrical: number; // 0 - 100
}

export interface AiDiagnosticResult {
  anomalyScore: number; // 0.00 - 1.00
  probableFault: string;
  faultProbability: number; // %
  confidence: number; // %
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  ruleReasoning: string[];
  signatureMatch: string;
}

export interface RulEstimate {
  minHours: number;
  maxHours: number;
  confidence: number;
  wearFactor: number;
  advisoryText: string;
}

export type MissionPhase =
  | 'PRE_FLIGHT'
  | 'TAKEOFF'
  | 'CLIMB'
  | 'CRUISE'
  | 'HIGH_ALTITUDE_LOITER'
  | 'THROTTLE_TRANSITION'
  | 'DESCENT'
  | 'LANDING'
  | 'POST_FLIGHT';

export interface MissionPhaseConfig {
  phase: MissionPhase;
  name: string;
  altitude: number;
  throttle: number;
  engineLoad: number;
  description: string;
  nominalFuelFlow: number;
  nominalRisk: 'LOW' | 'MODERATE' | 'HIGH';
}

export interface WhatIfScenarioInput {
  altitude: number;
  ambientTemp: number;
  throttle: number;
  durationHours: number;
}

export interface WhatIfPrediction {
  powerHp: number;
  fuelConsumptionTotalKg: number;
  predictedCht: number;
  predictedEgt: number;
  predictedHealthEnd: number;
  estimatedEnduranceHours: number;
  missionRisk: 'LOW' | 'MODERATE' | 'CRITICAL';
  notes: string;
}

export interface AlertMessage {
  id: string;
  timestamp: string;
  level: 'NORMAL' | 'WARNING' | 'CRITICAL';
  subsystem: 'THERMAL' | 'COMBUSTION' | 'LUBRICATION' | 'MECHANICAL' | 'ELECTRICAL' | 'SENSOR';
  message: string;
  actionRequired: string;
}

export interface DemoStep {
  step: number;
  title: string;
  subtitle: string;
  faultToInject: FaultType;
  anomalyTargetRange: [number, number];
  aiStatus: string;
  probableFault: string;
  rulRange: string;
  alertLevel: 'NORMAL' | 'WARNING' | 'CRITICAL';
  advisory: string;
}

export type UserRole = 'OVERVIEW' | 'OPERATOR' | 'ENGINEER' | 'MAINTENANCE' | 'REPORTS' | 'EDGE_AI' | 'TECH_SPECS';

export interface WorkOrderItem {
  id: string;
  taskCode: string;
  title: string;
  component: string;
  priority: 'CRITICAL' | 'SCHEDULED' | 'ADVISORY';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueHours: number;
  estimatedLaborHours: number;
  partNumber: string;
  assignedTechnician: string;
  description: string;
  dateCreated: string;
}
