import { FaultType, OperatingControls, TelemetryData } from '../types/engine';

// Standard atmosphere air density ratio approx at altitude in ft
export function calculateAirDensityRatio(altitudeFt: number): number {
  return Math.exp(-altitudeFt / 29500);
}

// Generates smooth low-frequency pseudo-random walk noise
let noisePhase = 0;
function getJitter(scale: number = 1): number {
  noisePhase += 0.35;
  return (Math.sin(noisePhase * 1.3) * 0.5 + Math.sin(noisePhase * 2.7) * 0.3 + (Math.random() - 0.5) * 0.4) * scale;
}

/**
 * Calculates synthetic telemetry based on operating controls, ambient conditions, and injected faults.
 * Models a turbocharged 4-cylinder 4-stroke aero piston engine (e.g. 115 HP class UAV engine).
 */
export function simulateAeroPistonTelemetry(
  controls: OperatingControls,
  fault: FaultType,
  faultSeverity: number = 1.0, // 0.0 to 1.0
  elapsedSeconds: number = 0,
  baseRemainingFuel: number = 42.0
): TelemetryData {
  const safeControls = controls || { throttle: 68, altitude: 8400, ambientTemp: 15, engineLoad: 70 };
  const throttle = safeControls.throttle ?? 68;
  const altitude = safeControls.altitude ?? 8400;
  const ambientTemp = safeControls.ambientTemp ?? 15;
  const engineLoad = safeControls.engineLoad ?? 70;
  const densityRatio = calculateAirDensityRatio(altitude);

  // --- Base Nominal Physics ---
  // Throttle (0-100%) maps to baseline RPM (idle: 2200, WOT: 5800)
  const throttleFactor = throttle / 100;
  const loadFactor = engineLoad / 100;

  // Manifold Pressure (inHg): Ambient is ~29.92 at sea level. Turbo maintains up to 34 inHg at high throttle.
  const baseMAP = 18.0 + throttleFactor * 16.5 * Math.min(1.0, densityRatio * 1.25);

  // Base RPM: High throttle increases RPM; high load exerts resistance
  let nominalRpm = 2200 + throttleFactor * 3400 - loadFactor * 240;

  // Base Fuel Flow (L/h): heavily driven by throttle, MAP, and altitude leaning
  let nominalFuelFlow = 11.5 + throttleFactor * 24.5 * (0.7 + 0.3 * densityRatio) + (loadFactor * 2.2);

  // Ambient temperature offset from ISA standard (15°C)
  const tempOffset = ambientTemp - 15;

  // Base Cylinder Head Temperature (°C): driven by power, load, altitude cooling efficiency
  // Thinner air at high altitude reduces ram-air cooling effectiveness
  const coolingEfficiency = Math.max(0.65, Math.pow(densityRatio, 0.4));
  let nominalCht = 132 + throttleFactor * 42 + loadFactor * 16 + (tempOffset * 0.45) + ((1 - coolingEfficiency) * 22);

  // Base Exhaust Gas Temperature (°C): 670°C at idle, up to 770°C at cruise/climb
  let nominalEgt = 675 + throttleFactor * 90 + loadFactor * 25 + (tempOffset * 0.3);

  // Base Oil Pressure (bar): Driven by mechanical oil pump (proportional to RPM), nominal 4.2 - 5.0 bar
  let nominalOilPressure = 3.6 + (nominalRpm / 5800) * 1.6;

  // Base Oil Temperature (°C): lags CHT, nominal 82 - 105°C
  let nominalOilTemp = 82 + throttleFactor * 22 + loadFactor * 10 + (tempOffset * 0.4);

  // Base Vibration (g RMS): naturally increases with RPM and engine torque load
  let nominalVibration = 0.85 + (nominalRpm / 5800) * 0.85 + loadFactor * 0.4;

  // Base Bus Voltage: 28V DC generator charging
  const busVoltage = 27.9 + Math.min(0.5, (nominalRpm / 5800) * 0.5) + (Math.random() - 0.5) * 0.05;

  // --- Fault Injection Offsets ---
  let faultRpmDelta = 0;
  let faultChtDelta = 0;
  let faultEgtDelta = 0;
  let faultOilPressureDelta = 0;
  let faultOilTempDelta = 0;
  let faultFuelFlowDelta = 0;
  let faultVibrationDelta = 0;

  const sev = Math.max(0, Math.min(1, faultSeverity));

  // --- Multi-Cylinder Temperature Distribution (Rotax 914-F Boxer 4) ---
  // Cyl 1 (Front Left), Cyl 2 (Front Right), Cyl 3 (Rear Left), Cyl 4 (Rear Right)
  // Rear cylinders run 3-5°C warmer due to ram-air flow shielding behind front heads
  let c1Delta = -2.0;
  let c2Delta = 0.0;
  let c3Delta = 3.5;
  let c4Delta = 2.0;

  let egt1Delta = -5.0;
  let egt2Delta = 0.0;
  let egt3Delta = 8.0;
  let egt4Delta = 4.0;

  switch (fault) {
    case 'INJECTOR_DEGRADATION':
      // Clogged/partially stuck injector in cylinder #2: severe lean condition in Cyl 2
      faultFuelFlowDelta = (3.8 + getJitter(0.6)) * sev;
      faultEgtDelta = (45 + Math.sin(elapsedSeconds * 1.5) * 8) * sev;
      faultChtDelta = (18 + getJitter(2.0)) * sev;
      faultVibrationDelta = (1.45 + Math.abs(getJitter(0.4))) * sev;
      faultRpmDelta = (-80 + getJitter(30)) * sev;
      c2Delta += (32 + getJitter(3.0)) * sev; // Cyl 2 spikes to ~185-195°C
      egt2Delta += (68 + getJitter(8.0)) * sev;
      break;

    case 'MISFIRE':
      // Intermittent cylinder #3 ignition failure (arcing spark plug lead)
      faultRpmDelta = (Math.sin(elapsedSeconds * 8) * 160 + (Math.random() - 0.5) * 120) * sev;
      faultVibrationDelta = (3.2 + Math.abs(Math.sin(elapsedSeconds * 4) * 1.8)) * sev;
      faultEgtDelta = (-60 + Math.sin(elapsedSeconds * 5) * 75) * sev;
      faultFuelFlowDelta = (2.1 + getJitter(0.5)) * sev;
      faultChtDelta = (-12 + getJitter(3.0)) * sev;
      c3Delta -= (28 + getJitter(4.0)) * sev; // Cyl 3 combustion drops
      egt3Delta -= (85 + Math.sin(elapsedSeconds * 4) * 45) * sev; // Cyl 3 EGT drops then unburnt fuel pops
      break;

    case 'LUBRICATION_FAILURE':
      // Oil pump relief valve bypass or oil starvation/leak
      // Severe drop in oil pressure, sharp increase in oil temp and metal-on-metal vibration
      faultOilPressureDelta = (-2.4 - Math.abs(getJitter(0.2))) * sev; // drops to ~1.8 bar
      faultOilTempDelta = (36 + Math.min(18, elapsedSeconds * 0.5)) * sev; // rises to ~130°C+
      faultVibrationDelta = (1.6 + getJitter(0.3)) * sev;
      faultChtDelta = (9 + getJitter(1.5)) * sev;
      c1Delta += 8 * sev;
      c2Delta += 9 * sev;
      c3Delta += 11 * sev;
      c4Delta += 10 * sev;
      break;

    case 'OVERHEATING':
      // Cooling duct obstruction or liquid coolant loss
      // CHT skyrockets across all 4 heads, EGT climbs, oil temp follows
      faultChtDelta = (52 + Math.min(25, elapsedSeconds * 0.8)) * sev; // can reach 215-230°C
      faultEgtDelta = (65 + getJitter(6.0)) * sev;
      faultOilTempDelta = (24 + getJitter(3.0)) * sev;
      c1Delta += 48 * sev;
      c2Delta += 54 * sev;
      c3Delta += 58 * sev;
      c4Delta += 52 * sev;
      break;

    case 'VIBRATION_ANOMALY':
      // Dynamic propeller unbalance or crank bearing cage wear
      // High vibration while thermal and pressure channels remain normal
      faultVibrationDelta = (4.1 + Math.sin(elapsedSeconds * 6) * 1.1) * sev;
      break;

    case 'SENSOR_DRIFT':
      // CHT Thermocouple reference drift / ground loop bias on Cyl #2
      // Only CHT deviates upward, while EGT, Oil, and other cylinders remain nominal!
      faultChtDelta = (34 + Math.min(12, elapsedSeconds * 0.3) + getJitter(1.2)) * sev;
      c2Delta += (36 + getJitter(1.5)) * sev;
      break;

    case 'NORMAL':
    default:
      break;
  }

  // --- Apply Normal Micro-Jitter (Physical Sensor Noise) ---
  const finalRpm = Math.round(Math.max(800, nominalRpm + faultRpmDelta + getJitter(15)));
  const finalCht = Number((nominalCht + faultChtDelta + getJitter(0.6)).toFixed(1));
  const finalEgt = Number((nominalEgt + faultEgtDelta + getJitter(1.8)).toFixed(1));
  const finalOilPressure = Number(Math.max(0.2, nominalOilPressure + faultOilPressureDelta + getJitter(0.04)).toFixed(2));
  const finalOilTemp = Number((nominalOilTemp + faultOilTempDelta + getJitter(0.4)).toFixed(1));
  const finalFuelFlow = Number(Math.max(2.0, nominalFuelFlow + faultFuelFlowDelta + getJitter(0.15)).toFixed(2));
  const finalVibration = Number(Math.max(0.2, nominalVibration + faultVibrationDelta + Math.abs(getJitter(0.08))).toFixed(2));
  const finalMap = Number((baseMAP + getJitter(0.2)).toFixed(1));

  // --- Individual Cylinder Temperatures ---
  const cyl1Cht = Number((nominalCht + c1Delta + getJitter(0.5)).toFixed(1));
  const cyl2Cht = Number((nominalCht + faultChtDelta + c2Delta + getJitter(0.5)).toFixed(1));
  const cyl3Cht = Number((nominalCht + c3Delta + getJitter(0.5)).toFixed(1));
  const cyl4Cht = Number((nominalCht + c4Delta + getJitter(0.5)).toFixed(1));

  const cyl1Egt = Number((nominalEgt + egt1Delta + getJitter(1.2)).toFixed(1));
  const cyl2Egt = Number((nominalEgt + faultEgtDelta + egt2Delta + getJitter(1.2)).toFixed(1));
  const cyl3Egt = Number((nominalEgt + egt3Delta + getJitter(1.2)).toFixed(1));
  const cyl4Egt = Number((nominalEgt + egt4Delta + getJitter(1.2)).toFixed(1));

  // --- Turbocharger & Auxiliary Engine Dynamics ---
  // Turbo Boost: MAP in excess of ambient pressure (29.92 inHg ~ 1.013 bar)
  // Rotax 914 TCU target: 35.4 inHg continuous (0.20 bar boost), 39.9 inHg takeoff (0.35 bar boost)
  const ambientPressureInHg = 29.92 * densityRatio;
  const turboBoostBar = Number(Math.max(0, (finalMap - ambientPressureInHg) * 0.03386).toFixed(2));

  // Wastegate: 0% = fully closed (max spool), 100% = fully open (bypassed)
  // At high altitude, TCU closes wastegate to maintain manifold pressure
  const wastegateClosedDemand = Math.min(100, (finalMap / 39.9) * 100 * (1.2 - densityRatio * 0.4));
  const wastegatePosition = Number(Math.max(5, Math.min(95, 100 - wastegateClosedDemand + getJitter(1.5))).toFixed(1));

  // Constant-Speed Propeller Pitch: 18° at low throttle, up to 30° at high throttle cruise
  const propPitch = Number((18.0 + throttleFactor * 11.5 + (altitude / 20000) * 3.5 + getJitter(0.2)).toFixed(1));

  // Cylinder Head Coolant (Liquid water jackets, nominal 85 - 98°C, max 135°C)
  const coolantTemp = Number((86 + throttleFactor * 14 + (fault === 'OVERHEATING' ? 38 * sev : 0) + (tempOffset * 0.3) + getJitter(0.4)).toFixed(1));

  // Oil Flow Rate (L/min) driven by mechanical gear pump
  const oilFlowRate = Number(((finalRpm / 5800) * 8.5 * (finalOilPressure / 4.5)).toFixed(1));

  // Live Crank Angle across 720° 4-stroke cycle
  const crankAngleDeg = Math.round(((elapsedSeconds * (finalRpm / 60) * 360) % 720));

  // Power in HP approx: P = (RPM * MAP / 29.92) * factor
  const rawHp = (finalRpm / 5800) * (finalMap / 29.92) * 115 * (1 - (fault === 'MISFIRE' ? 0.25 * sev : 0));
  const powerHp = Number(Math.max(10, rawHp).toFixed(1));

  // Simulated fuel tank level (burn rate)
  const fuelBurnKgPerSec = (finalFuelFlow * 0.72) / 3600;
  const currentFuel = Math.max(0.5, Number((baseRemainingFuel - fuelBurnKgPerSec * elapsedSeconds).toFixed(2)));

  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];

  return {
    timeStr,
    timestamp: Date.now(),
    rpm: finalRpm,
    cht: finalCht,
    egt: finalEgt,
    oilPressure: finalOilPressure,
    oilTemperature: finalOilTemp,
    fuelFlow: finalFuelFlow,
    vibration: finalVibration,
    manifoldPressure: finalMap,
    busVoltage: Number(busVoltage.toFixed(2)),
    powerHp,
    torqueNm: Math.round(((powerHp * 745.7) / (Math.max(1, (2 * Math.PI * finalRpm) / 60)))) || 125,
    fuelRemainingKg: currentFuel,
    chtCylinders: [cyl1Cht, cyl2Cht, cyl3Cht, cyl4Cht],
    egtCylinders: [cyl1Egt, cyl2Egt, cyl3Egt, cyl4Egt],
    turboBoostBar,
    wastegatePosition,
    propellerPitchDeg: propPitch,
    coolantTemp,
    oilFlowRate,
    crankAngleDeg,
  };
}
