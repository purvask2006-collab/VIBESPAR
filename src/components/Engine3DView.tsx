import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { TelemetryData } from '../types/engine';
import {
  Flame,
  Layers,
  Activity,
  Eye,
  Wrench,
  Camera,
  Gauge,
  Zap,
  Wind,
  Scissors,
  Sliders,
  RotateCcw,
  HelpCircle,
  Info,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Split,
} from 'lucide-react';

interface Engine3DViewProps {
  telemetry: TelemetryData;
  activeFault: string;
  onSelectSensor?: (sensorId: string) => void;
  selectedSensor?: string | null;
  theme?: 'light' | 'dark';
  isPaused?: boolean;
  visualMode?: VisualMode;
  onVisualModeChange?: (mode: VisualMode) => void;
  showCallouts?: boolean;
  onToggleCallouts?: () => void;
  onOpenArchitectureModal?: () => void;
  selectedComponent?: string | null;
  title?: string;
}

interface Sensor3DDef {
  id: string;
  name: string;
  shortName: string;
  position: [number, number, number];
  color: string;
  unit: string;
  getValue: (t: TelemetryData) => number | string;
}

export type VisualMode = 'CUTAWAY' | 'HEATMAP' | 'CROSS_SECTION' | 'THERMAL_IR' | 'VIBRATION' | 'MECHANICAL';

export const Engine3DView: React.FC<Engine3DViewProps> = ({
  telemetry,
  activeFault,
  onSelectSensor,
  selectedSensor,
  theme = 'light',
  isPaused = false,
  visualMode: controlledVisualMode,
  onVisualModeChange,
  showCallouts,
  onToggleCallouts,
  onOpenArchitectureModal,
  selectedComponent,
  title = '3D DIGITAL TWIN • ROTAX 914-F',
}) => {
  const isLight = theme === 'light';
  const isPausedRef = useRef<boolean>(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Animation & Component Node References
  const engineRootRef = useRef<THREE.Group | null>(null);
  const nacelleGroupRef = useRef<THREE.Group | null>(null);
  const propellerRef = useRef<THREE.Group | null>(null);
  const propBladesRef = useRef<THREE.Mesh[]>([]);
  const crankshaftRef = useRef<THREE.Group | null>(null);
  const turboImpellerRef = useRef<THREE.Mesh | null>(null);
  const turbineRotorRef = useRef<THREE.Mesh | null>(null);
  const wastegateRodRef = useRef<THREE.Mesh | null>(null);

  const pistonsRef = useRef<THREE.Mesh[]>([]);
  const conrodsRef = useRef<THREE.Mesh[]>([]);
  const combustionGlowsRef = useRef<THREE.Mesh[]>([]);
  const combustionLightsRef = useRef<THREE.PointLight[]>([]);
  const cylinderBlocksRef = useRef<THREE.Mesh[]>([]);
  const cylinderHeadsRef = useRef<THREE.Mesh[]>([]);
  const valveCoversRef = useRef<THREE.Mesh[]>([]);
  const exhaustPipesRef = useRef<THREE.Mesh[]>([]);

  // Interactive View Modes & Camera State
  const [viewScope, setViewScope] = useState<'ENGINE_STAND' | 'NACELLE_MOUNT'>('ENGINE_STAND');
  const [internalVisualMode, setInternalVisualMode] = useState<VisualMode>(controlledVisualMode || 'CUTAWAY');
  const visualMode = controlledVisualMode !== undefined ? controlledVisualMode : internalVisualMode;
  const setVisualMode = (mode: VisualMode) => {
    setInternalVisualMode(mode);
    onVisualModeChange?.(mode);
  };

  useEffect(() => {
    if (controlledVisualMode !== undefined) {
      setInternalVisualMode(controlledVisualMode);
    }
  }, [controlledVisualMode]);

  const [hoveredSensor, setHoveredSensor] = useState<string | null>(null);
  const [activeCameraPreset, setActiveCameraPreset] = useState<string>('ISOMETRIC');

  // Cross-Sectional Area CAD Plane State
  const [crossSectionAxis, setCrossSectionAxis] = useState<'X' | 'Y' | 'Z'>('X');
  const [crossSectionOffset, setCrossSectionOffset] = useState<number>(0.12);
  const [crossSectionInverted, setCrossSectionInverted] = useState<boolean>(false);
  const [showHeatmapIsotherms, setShowHeatmapIsotherms] = useState<boolean>(true);
  const [showCrossSectionMetrics, setShowCrossSectionMetrics] = useState<boolean>(true);

  // Synchronized refs for real-time 60fps render loop
  const visualModeRef = useRef<VisualMode>(visualMode);
  visualModeRef.current = visualMode;
  const crossSectionAxisRef = useRef<'X' | 'Y' | 'Z'>(crossSectionAxis);
  crossSectionAxisRef.current = crossSectionAxis;
  const crossSectionOffsetRef = useRef<number>(crossSectionOffset);
  crossSectionOffsetRef.current = crossSectionOffset;
  const crossSectionInvertedRef = useRef<boolean>(crossSectionInverted);
  crossSectionInvertedRef.current = crossSectionInverted;

  const clipPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0.12));
  const crossSectionHelperRef = useRef<THREE.Group | null>(null);

  // Spherical camera orbit tracking
  const sphericalRef = useRef({ radius: 6.2, theta: Math.PI / 3.8, phi: Math.PI / 3.2 });
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0, 0.2));

  // 3D Engine Sensor mapping (Rotax 914-F Turbocharged Aero Piston Engine)
  const sensors: Sensor3DDef[] = [
    {
      id: 'rpm',
      name: 'Propeller Output Shaft & Gearbox Tachometer',
      shortName: 'PROP RPM',
      position: [0, 0, 1.95],
      color: '#0284c7',
      unit: 'RPM',
      getValue: (t) => `${t.rpm} RPM`,
    },
    {
      id: 'cht2',
      name: 'Cylinder #2 Head Thermocouple (Critical Hot Spot)',
      shortName: 'CYL-2 CHT',
      position: [1.18, 0.15, 0.38],
      color: '#ea580c',
      unit: '°C',
      getValue: (t) => `${t.chtCylinders ? t.chtCylinders[1] : t.cht}°C`,
    },
    {
      id: 'cht1',
      name: 'Cylinder #1 Head Thermocouple (Port Front)',
      shortName: 'CYL-1 CHT',
      position: [-1.18, 0.15, 0.38],
      color: '#f97316',
      unit: '°C',
      getValue: (t) => `${t.chtCylinders ? t.chtCylinders[0] : (t.cht - 2).toFixed(1)}°C`,
    },
    {
      id: 'cht3',
      name: 'Cylinder #3 Head Thermocouple (Port Rear)',
      shortName: 'CYL-3 CHT',
      position: [-1.18, 0.15, -0.22],
      color: '#f59e0b',
      unit: '°C',
      getValue: (t) => `${t.chtCylinders ? t.chtCylinders[2] : (t.cht + 3.5).toFixed(1)}°C`,
    },
    {
      id: 'egt',
      name: 'Exhaust Gas Temperature Pyrometer (Collector to Turbo)',
      shortName: 'EXH EGT',
      position: [0.45, -0.65, -0.85],
      color: '#e11d48',
      unit: '°C',
      getValue: (t) => `${t.egt}°C`,
    },
    {
      id: 'oilPressure',
      name: 'Main Lubrication Gallery Pressure Transducer',
      shortName: 'OIL PRESS',
      position: [-0.65, -0.55, 0.2],
      color: '#059669',
      unit: 'bar',
      getValue: (t) => `${t.oilPressure} bar`,
    },
    {
      id: 'oilTemp',
      name: 'Dry-Sump Oil Tank Temperature Sensor',
      shortName: 'OIL TEMP',
      position: [-0.85, -0.45, -0.6],
      color: '#d97706',
      unit: '°C',
      getValue: (t) => `${t.oilTemperature}°C`,
    },
    {
      id: 'manifoldPressure',
      name: 'Intake Plenum Manifold Absolute Pressure (MAP)',
      shortName: 'MAP / BOOST',
      position: [0, 0.88, -0.1],
      color: '#8b5cf6',
      unit: 'inHg',
      getValue: (t) => `${t.manifoldPressure} inHg (${t.turboBoostBar || 0.22} bar boost)`,
    },
    {
      id: 'wastegate',
      name: 'Turbocharger TCU Pneumatic Wastegate Position',
      shortName: 'TCU WASTEGATE',
      position: [0.35, 0.25, -0.15],
      color: '#10b981',
      unit: '%',
      getValue: (t) => `${t.wastegatePosition || 42}%`,
    },
    {
      id: 'vibration',
      name: 'Tri-Axial Crankcase Accelerometer',
      shortName: 'CRANK VIB',
      position: [0, -0.2, 0.75],
      color: '#06b6d4',
      unit: 'g',
      getValue: (t) => `${t.vibration} g`,
    },
  ];

  // Keep latest telemetry in refs for smooth requestAnimationFrame rendering
  const latestTelemetryRef = useRef(telemetry);
  useEffect(() => {
    latestTelemetryRef.current = telemetry;
  }, [telemetry]);

  const latestFaultRef = useRef(activeFault);
  useEffect(() => {
    latestFaultRef.current = activeFault;
  }, [activeFault]);

  // Camera presets handler
  const setCameraPreset = useCallback((preset: 'ISOMETRIC' | 'CUTAWAY' | 'TURBO' | 'CYLINDERS' | 'PROP') => {
    setActiveCameraPreset(preset);
    if (!cameraRef.current) return;

    let targetRadius = 6.2;
    let targetTheta = Math.PI / 3.8;
    let targetPhi = Math.PI / 3.2;
    let targetLook = new THREE.Vector3(0, 0, 0.2);

    switch (preset) {
      case 'ISOMETRIC':
        targetRadius = 6.2;
        targetTheta = Math.PI / 3.6;
        targetPhi = Math.PI / 3.2;
        targetLook.set(0, 0, 0.2);
        break;
      case 'CUTAWAY':
        targetRadius = 3.6;
        targetTheta = Math.PI / 2.0; // Side profile showing moving pistons and conrods
        targetPhi = Math.PI / 2.4;
        targetLook.set(0, 0.1, 0.2);
        break;
      case 'TURBO':
        targetRadius = 3.4;
        targetTheta = -Math.PI / 1.5; // Rear-angle focusing on turbocharger, wastegate, and glowing exhaust
        targetPhi = Math.PI / 2.8;
        targetLook.set(0.1, -0.1, -0.7);
        break;
      case 'CYLINDERS':
        targetRadius = 3.8;
        targetTheta = Math.PI / 4; // High angle showing all 4 green rocker covers & spark plugs
        targetPhi = Math.PI / 4.5;
        targetLook.set(0, 0.2, 0.1);
        break;
      case 'PROP':
        targetRadius = 4.2;
        targetTheta = 0.05; // Head-on view of the propeller and reduction gearbox
        targetPhi = Math.PI / 2.3;
        targetLook.set(0, 0.15, 1.4);
        break;
    }

    sphericalRef.current = { radius: targetRadius, theta: targetTheta, phi: targetPhi };
    targetLookAtRef.current = targetLook;

    const camera = cameraRef.current;
    camera.position.x = targetRadius * Math.sin(targetPhi) * Math.sin(targetTheta);
    camera.position.y = targetRadius * Math.cos(targetPhi);
    camera.position.z = targetRadius * Math.sin(targetPhi) * Math.cos(targetTheta);
    camera.lookAt(targetLook);
  }, []);

  // Three.js Scene Setup & Geometry Construction
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const isLight = theme === 'light';

    // 1. Scene & Environment
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isLight ? 0xf8fafc : 0x060c16);
    scene.fog = new THREE.FogExp2(isLight ? 0xf1f5f9 : 0x060c16, 0.032);
    sceneRef.current = scene;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(3.8, 2.4, 4.4);
    camera.lookAt(0, 0, 0.2);
    cameraRef.current = camera;

    // 3. High-Fidelity Aerospace Studio Lighting
    const ambientLight = new THREE.AmbientLight(isLight ? 0xffffff : 0x93b4d7, isLight ? 1.45 : 0.95);
    scene.add(ambientLight);

    // Primary Key Light (Simulating High-Bay Aerospace Cleanroom/Hangar Light)
    const keyLight = new THREE.DirectionalLight(0xffffff, isLight ? 1.85 : 1.6);
    keyLight.position.set(7, 12, 8);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Fill Light (Soft sky-blue tint for realistic alloy reflections)
    const fillLight = new THREE.DirectionalLight(isLight ? 0xdbeafe : 0x38bdf8, isLight ? 0.85 : 0.65);
    fillLight.position.set(-8, -2, -6);
    scene.add(fillLight);

    // Back Rim Light (Accentuates cooling fins and metal edges)
    const rimLight = new THREE.PointLight(isLight ? 0x0284c7 : 0x38bdf8, isLight ? 1.6 : 1.4, 25);
    rimLight.position.set(0, 4.5, -4.5);
    scene.add(rimLight);

    // Bottom Bounce Light (Brightens lower crankcase and exhaust manifold)
    const bounceLight = new THREE.DirectionalLight(isLight ? 0xf1f5f9 : 0x1e293b, isLight ? 0.6 : 0.4);
    bounceLight.position.set(0, -6, 2);
    scene.add(bounceLight);

    // 4. Ground Inspection Grid & Soft Contact Drop-Shadow
    const gridHelper = new THREE.GridHelper(16, 32, isLight ? 0x0284c7 : 0x1e3a5f, isLight ? 0xd1d5db : 0x0f1d30);
    gridHelper.position.y = -1.6;
    scene.add(gridHelper);

    // Realistic Radial Ambient Occlusion Ground Contact Shadow Disc
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const shadowCtx = shadowCanvas.getContext('2d');
    if (shadowCtx) {
      const gradient = shadowCtx.createRadialGradient(128, 128, 24, 128, 128, 124);
      gradient.addColorStop(0, isLight ? 'rgba(30, 41, 59, 0.45)' : 'rgba(0, 0, 0, 0.85)');
      gradient.addColorStop(0.5, isLight ? 'rgba(71, 85, 105, 0.22)' : 'rgba(0, 0, 0, 0.45)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      shadowCtx.fillStyle = gradient;
      shadowCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(5.2, 5.2);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.position.set(0, -1.58, 0.2);
    scene.add(shadowPlane);

    // -------------------------------------------------------------
    // BUILD THE AERO PISTON ENGINE (Rotax 914-F Turbocharged Boxer)
    // -------------------------------------------------------------
    const engineRoot = new THREE.Group();
    engineRootRef.current = engineRoot;
    scene.add(engineRoot);

    // Authentic Aerospace Materials
    const crankcaseMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0x8fa3b8 : 0x3b4a5d,
      metalness: 0.75,
      roughness: 0.3,
    });

    const cylinderFinMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0x64748b : 0x2d3a4b,
      metalness: 0.8,
      roughness: 0.28,
    });

    // Signature Rotax Olive/Green Powdercoat Valve Covers
    const rotaxGreenMat = new THREE.MeshStandardMaterial({
      color: 0x166534, // deep racing/olive green
      metalness: 0.35,
      roughness: 0.35,
    });

    const polishedAlloyMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xe2e8f0 : 0x94a3b8,
      metalness: 0.9,
      roughness: 0.15,
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.85,
      roughness: 0.25,
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.96,
      roughness: 0.08,
    });

    const carbonPropMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.3,
      roughness: 0.35,
    });

    const siliconeHoseBlue = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // silicone turbo intake couplers
      metalness: 0.1,
      roughness: 0.6,
    });

    const castIronMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // turbo turbine housing
      metalness: 0.65,
      roughness: 0.5,
    });

    // A. Central Crankcase Casting & Sump with Structural Webbing
    const crankcaseGeo = new THREE.BoxGeometry(1.24, 0.92, 1.85);
    const crankcase = new THREE.Mesh(crankcaseGeo, crankcaseMat);
    crankcase.position.set(0, 0, 0.2);
    engineRoot.add(crankcase);

    // Crankcase Split-Flange Seam & Perimeter Assembly Bolts
    const flangeSeamGeo = new THREE.BoxGeometry(1.26, 0.04, 1.87);
    const flangeSeam = new THREE.Mesh(flangeSeamGeo, polishedAlloyMat);
    flangeSeam.position.set(0, 0.02, 0.2);
    engineRoot.add(flangeSeam);

    // 14 Machined Perimeter Flange Bolts with Hexagonal Heads
    for (let i = -0.8; i <= 0.8; i += 0.26) {
      [-0.64, 0.64].forEach((bx) => {
        const boltGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.06, 6);
        const bolt = new THREE.Mesh(boltGeo, chromeMat);
        bolt.position.set(bx, 0.04, 0.2 + i);
        engineRoot.add(bolt);
      });
    }

    // Sump Stiffening Ribs
    for (let i = -0.65; i <= 0.65; i += 0.28) {
      const ribGeo = new THREE.BoxGeometry(1.28, 0.96, 0.04);
      const rib = new THREE.Mesh(ribGeo, crankcaseMat);
      rib.position.set(0, 0, 0.2 + i);
      engineRoot.add(rib);
    }

    // Lower Oil Sump Pan with Magnetic Drain Plug
    const sumpGeo = new THREE.CylinderGeometry(0.42, 0.35, 0.45, 18);
    const sump = new THREE.Mesh(sumpGeo, crankcaseMat);
    sump.position.set(0, -0.6, 0.2);
    engineRoot.add(sump);

    const drainPlugGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.08, 6);
    const drainPlug = new THREE.Mesh(drainPlugGeo, brassMat);
    drainPlug.position.set(0, -0.84, 0.2);
    engineRoot.add(drainPlug);

    // Rotax Spin-On Oil Filter Canister (Front Lower Starboard)
    const filterCanisterGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.38, 18);
    filterCanisterGeo.rotateX(Math.PI / 2);
    const filterCanisterMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.6,
      roughness: 0.3,
    });
    const filterCanister = new THREE.Mesh(filterCanisterGeo, filterCanisterMat);
    filterCanister.position.set(0.46, -0.42, 0.88);
    engineRoot.add(filterCanister);

    // Filter Hex Nut & Lockwire Boss
    const filterNutGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.06, 6);
    filterNutGeo.rotateX(Math.PI / 2);
    const filterNut = new THREE.Mesh(filterNutGeo, polishedAlloyMat);
    filterNut.position.set(0.46, -0.42, 1.09);
    engineRoot.add(filterNut);

    // Starter Motor & Solenoid (Aft Lower Accessory Pad)
    const starterGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.52, 16);
    starterGeo.rotateX(Math.PI / 2);
    const starterMesh = new THREE.Mesh(starterGeo, carbonPropMat);
    starterMesh.position.set(-0.42, -0.28, -0.88);
    engineRoot.add(starterMesh);

    const solenoidGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.32, 12);
    solenoidGeo.rotateX(Math.PI / 2);
    const solenoidMesh = new THREE.Mesh(solenoidGeo, brassMat);
    solenoidMesh.position.set(-0.42, -0.09, -0.82);
    engineRoot.add(solenoidMesh);

    // Alternator & Drive Pulley Belt (Aft Accessory Pad)
    const altGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.24, 16);
    altGeo.rotateZ(Math.PI / 2);
    const altMesh = new THREE.Mesh(altGeo, polishedAlloyMat);
    altMesh.position.set(0.38, 0.38, -0.82);
    engineRoot.add(altMesh);

    // B. Four Horizontally-Opposed Finned Cylinders & Moving Pistons
    // Rotax 914-F: Cyl 1 & 3 on Left (-X), Cyl 2 & 4 on Right (+X)
    const cylPositions: { x: number; y: number; z: number; side: number; cylNum: number; name: string }[] = [
      { x: -0.9, y: 0.12, z: 0.6, side: -1, cylNum: 1, name: 'CYL 1' },
      { x: 0.9, y: 0.12, z: 0.4, side: 1, cylNum: 2, name: 'CYL 2' },
      { x: -0.9, y: 0.12, z: -0.2, side: -1, cylNum: 3, name: 'CYL 3' },
      { x: 0.9, y: 0.12, z: -0.4, side: 1, cylNum: 4, name: 'CYL 4' },
    ];

    pistonsRef.current = [];
    conrodsRef.current = [];
    combustionGlowsRef.current = [];
    combustionLightsRef.current = [];
    cylinderBlocksRef.current = [];
    cylinderHeadsRef.current = [];
    valveCoversRef.current = [];

    cylPositions.forEach((pos) => {
      // Cylinder Barrel (with through-studs)
      const cylGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.78, 20);
      cylGeo.rotateZ(Math.PI / 2);
      const cylMesh = new THREE.Mesh(cylGeo, cylinderFinMat);
      cylMesh.position.set(pos.x, pos.y, pos.z);
      engineRoot.add(cylMesh);
      cylinderBlocksRef.current.push(cylMesh);

      // High-Density Cooling Fins (12 machined aluminum cooling fins per cylinder)
      for (let f = -0.32; f <= 0.32; f += 0.058) {
        const finGeo = new THREE.CylinderGeometry(0.43, 0.43, 0.016, 22);
        finGeo.rotateZ(Math.PI / 2);
        const fin = new THREE.Mesh(finGeo, cylinderFinMat);
        fin.position.set(pos.x + f, pos.y, pos.z);
        engineRoot.add(fin);

        // Machined Silver Edge on each fin for photorealistic metallic glint
        const finEdgeGeo = new THREE.TorusGeometry(0.43, 0.008, 6, 22);
        finEdgeGeo.rotateY(Math.PI / 2);
        const finEdge = new THREE.Mesh(finEdgeGeo, polishedAlloyMat);
        finEdge.position.set(pos.x + f, pos.y, pos.z);
        engineRoot.add(finEdge);
      }

      // Cylinder Head (Liquid-cooled jacket)
      const headGeo = new THREE.BoxGeometry(0.28, 0.68, 0.68);
      const headMesh = new THREE.Mesh(headGeo, polishedAlloyMat);
      headMesh.position.set(pos.x + pos.side * 0.46, pos.y, pos.z);
      engineRoot.add(headMesh);
      cylinderHeadsRef.current.push(headMesh);

      // Signature Rotax Green Valve/Rocker Cover
      const coverGeo = new THREE.BoxGeometry(0.12, 0.58, 0.58);
      const coverMesh = new THREE.Mesh(coverGeo, rotaxGreenMat);
      coverMesh.position.set(pos.x + pos.side * 0.62, pos.y, pos.z);
      engineRoot.add(coverMesh);
      valveCoversRef.current.push(coverMesh);

      // Central Chrome Acorn Nut on Valve Cover
      const nutGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 6);
      nutGeo.rotateZ(Math.PI / 2);
      const nut = new THREE.Mesh(nutGeo, chromeMat);
      nut.position.set(pos.x + pos.side * 0.69, pos.y, pos.z);
      engineRoot.add(nut);

      // Dual Spark Plugs with High-Tension Leads
      [-0.16, 0.16].forEach((spZ) => {
        const plugGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.24, 8);
        plugGeo.rotateZ(pos.side * (Math.PI / 4));
        const plug = new THREE.Mesh(plugGeo, brassMat);
        plug.position.set(pos.x + pos.side * 0.52, pos.y + 0.32, pos.z + spZ);
        engineRoot.add(plug);

        // Black Rubber Spark Plug Boot
        const bootGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const boot = new THREE.Mesh(bootGeo, carbonPropMat);
        boot.position.set(pos.x + pos.side * 0.58, pos.y + 0.4, pos.z + spZ);
        engineRoot.add(boot);
      });

      // Internal Combustion Chamber Flame Glow (Visible in Cutaway & Thermal modes)
      const glowGeo = new THREE.SphereGeometry(0.22, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.position.set(pos.x + pos.side * 0.32, pos.y, pos.z);
      engineRoot.add(glowMesh);
      combustionGlowsRef.current.push(glowMesh);

      const fireLight = new THREE.PointLight(0xff6600, 0, 1.8);
      fireLight.position.set(pos.x + pos.side * 0.32, pos.y, pos.z);
      engineRoot.add(fireLight);
      combustionLightsRef.current.push(fireLight);

      // Reciprocating Internal Piston with Compression Rings
      const pistonGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.3, 18);
      pistonGeo.rotateZ(Math.PI / 2);
      const pistonMesh = new THREE.Mesh(pistonGeo, chromeMat);
      pistonMesh.position.set(pos.x, pos.y, pos.z);
      engineRoot.add(pistonMesh);
      pistonsRef.current.push(pistonMesh);

      // Connecting Rod
      const conrodGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.56, 8);
      conrodGeo.rotateZ(Math.PI / 2);
      const conrodMesh = new THREE.Mesh(conrodGeo, brassMat);
      conrodMesh.position.set(pos.x - pos.side * 0.2, pos.y, pos.z);
      engineRoot.add(conrodMesh);
      conrodsRef.current.push(conrodMesh);
    });

    // C. Internal Crankshaft (Center Axis)
    const crankGroup = new THREE.Group();
    crankshaftRef.current = crankGroup;
    engineRoot.add(crankGroup);

    const crankShaftGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.6, 16);
    crankShaftGeo.rotateX(Math.PI / 2);
    const crankMain = new THREE.Mesh(crankShaftGeo, chromeMat);
    crankMain.position.set(0, 0, 0.2);
    crankGroup.add(crankMain);

    // Crankshaft Counterweight Throws
    [-0.4, -0.15, 0.2, 0.55].forEach((cwZ) => {
      const throwGeo = new THREE.BoxGeometry(0.15, 0.45, 0.18);
      const throwMesh = new THREE.Mesh(throwGeo, chromeMat);
      throwMesh.position.set(0, 0.1, cwZ);
      crankGroup.add(throwMesh);
    });

    // D. Front Propeller Reduction Gearbox (PRSU i=2.43)
    const gearboxGeo = new THREE.ConeGeometry(0.46, 0.68, 18);
    gearboxGeo.rotateX(Math.PI / 2);
    const gearbox = new THREE.Mesh(gearboxGeo, crankcaseMat);
    gearbox.position.set(0, 0.15, 1.4);
    engineRoot.add(gearbox);

    const propFlangeGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.15, 18);
    propFlangeGeo.rotateX(Math.PI / 2);
    const propFlange = new THREE.Mesh(propFlangeGeo, chromeMat);
    propFlange.position.set(0, 0.15, 1.78);
    engineRoot.add(propFlange);

    // E. 3-Blade Variable-Pitch Composite Propeller
    const propGroup = new THREE.Group();
    propGroup.position.set(0, 0.15, 1.88);
    propellerRef.current = propGroup;
    engineRoot.add(propGroup);

    // Propeller Spinner Cone (Polished Alloy)
    const spinnerGeo = new THREE.ConeGeometry(0.24, 0.55, 18);
    spinnerGeo.rotateX(Math.PI / 2);
    const spinner = new THREE.Mesh(spinnerGeo, isLight ? polishedAlloyMat : chromeMat);
    spinner.position.set(0, 0, 0.22);
    propGroup.add(spinner);

    // Variable Pitch Propeller Blades
    propBladesRef.current = [];
    for (let b = 0; b < 3; b++) {
      const bladeAngle = (b * Math.PI * 2) / 3;
      const bladePivot = new THREE.Group();
      bladePivot.rotation.z = bladeAngle;

      const bladeGeo = new THREE.BoxGeometry(0.19, 1.42, 0.04);
      bladeGeo.translate(0, 0.78, 0);
      const bladeMesh = new THREE.Mesh(bladeGeo, carbonPropMat);
      bladeMesh.rotation.y = 0.35; // baseline pitch twist
      bladePivot.add(bladeMesh);
      propBladesRef.current.push(bladeMesh);

      // Blade Tip High-Visibility Yellow Stripe
      const tipGeo = new THREE.BoxGeometry(0.192, 0.2, 0.042);
      tipGeo.translate(0, 1.4, 0);
      const tipMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const tip = new THREE.Mesh(tipGeo, tipMat);
      bladePivot.add(tip);

      propGroup.add(bladePivot);
    }

    // 6 Propeller Drive Hub Flange Attachment Bolts
    for (let f = 0; f < 6; f++) {
      const a = (f * Math.PI * 2) / 6;
      const fBoltGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.08, 6);
      fBoltGeo.rotateX(Math.PI / 2);
      const fBolt = new THREE.Mesh(fBoltGeo, polishedAlloyMat);
      fBolt.position.set(Math.cos(a) * 0.17, 0.15 + Math.sin(a) * 0.17, 1.86);
      engineRoot.add(fBolt);
    }

    // Cylinder 2 Injected Clog Thermal Warning Halo (Pulsing ring indicator)
    const cyl2HotspotHaloGeo = new THREE.RingGeometry(0.44, 0.52, 24);
    cyl2HotspotHaloGeo.rotateY(Math.PI / 2);
    const cyl2HotspotHaloMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const cyl2HotspotHalo = new THREE.Mesh(cyl2HotspotHaloGeo, cyl2HotspotHaloMat);
    cyl2HotspotHalo.position.set(1.42, 0.12, 0.4);
    cyl2HotspotHalo.name = 'cyl2HotspotHalo';
    engineRoot.add(cyl2HotspotHalo);

    // F. Garrett T25/T2 Turbocharger with Operating Wastegate Actuator
    const turboGroup = new THREE.Group();
    turboGroup.position.set(0, -0.35, -1.05);
    engineRoot.add(turboGroup);

    // Turbine Casing (Hot side - cast iron dark grey)
    const turbineGeo = new THREE.TorusGeometry(0.25, 0.12, 12, 24);
    const turbineMesh = new THREE.Mesh(turbineGeo, castIronMat);
    turboGroup.add(turbineMesh);

    // Spinning Turbine Rotor
    const turbRotorGeo = new THREE.CylinderGeometry(0.14, 0.02, 0.07, 10);
    turbRotorGeo.rotateX(Math.PI / 2);
    const turbRotor = new THREE.Mesh(turbRotorGeo, chromeMat);
    turbRotor.position.set(0, 0, 0.12);
    turboGroup.add(turbRotor);
    turbineRotorRef.current = turbRotor;

    // Compressor Casing (Cold side - polished aluminum)
    const compGeo = new THREE.CylinderGeometry(0.23, 0.32, 0.24, 18);
    compGeo.rotateX(Math.PI / 2);
    const compMesh = new THREE.Mesh(compGeo, polishedAlloyMat);
    compMesh.position.set(0, 0, -0.26);
    turboGroup.add(compMesh);

    // Spinning Compressor Impeller
    const impellerGeo = new THREE.CylinderGeometry(0.18, 0.03, 0.08, 12);
    impellerGeo.rotateX(Math.PI / 2);
    const impellerMesh = new THREE.Mesh(impellerGeo, chromeMat);
    impellerMesh.position.set(0, 0, -0.38);
    turboGroup.add(impellerMesh);
    turboImpellerRef.current = impellerMesh;

    // Wastegate Pneumatic Canister & Articulating Actuator Rod
    const wastegateCanisterGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.25, 12);
    const wastegateCanister = new THREE.Mesh(wastegateCanisterGeo, brassMat);
    wastegateCanister.position.set(0.38, 0.22, -0.15);
    turboGroup.add(wastegateCanister);

    const wastegateRodGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.32, 8);
    const wastegateRod = new THREE.Mesh(wastegateRodGeo, chromeMat);
    wastegateRod.position.set(0.38, 0.02, -0.15);
    turboGroup.add(wastegateRod);
    wastegateRodRef.current = wastegateRod;

    // G. Tuned Stainless Steel 4-into-1 Exhaust Header (Cylinders -> Turbo)
    exhaustPipesRef.current = [];
    cylPositions.forEach((pos) => {
      const pipeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(pos.x + pos.side * 0.3, pos.y - 0.2, pos.z),
        new THREE.Vector3(pos.side * 0.42, -0.48, (pos.z - 0.95) / 2),
        new THREE.Vector3(0, -0.25, -1.05),
      ]);
      const pipeGeo = new THREE.TubeGeometry(pipeCurve, 20, 0.058, 8, false);
      const pipeMat = new THREE.MeshStandardMaterial({
        color: 0x78716c,
        metalness: 0.75,
        roughness: 0.35,
      });
      const pipeMesh = new THREE.Mesh(pipeGeo, pipeMat);
      engineRoot.add(pipeMesh);
      exhaustPipesRef.current.push(pipeMesh);
    });

    // H. Intake Airbox Plenum & Glowing Blue Tuned Intake Runners
    const plenumGeo = new THREE.CylinderGeometry(0.19, 0.19, 1.45, 16);
    plenumGeo.rotateZ(Math.PI / 2);
    const plenum = new THREE.Mesh(plenumGeo, polishedAlloyMat);
    plenum.position.set(0, 0.68, 0.1);
    engineRoot.add(plenum);

    // Blue silicone intake couplers on plenum
    [-0.5, 0.5].forEach((cpX) => {
      const cGeo = new THREE.CylinderGeometry(0.205, 0.205, 0.12, 16);
      cGeo.rotateZ(Math.PI / 2);
      const cMesh = new THREE.Mesh(cGeo, siliconeHoseBlue);
      cMesh.position.set(cpX, 0.68, 0.1);
      engineRoot.add(cMesh);
    });

    // Glowing Electric-Blue Intake Runners (Air/Fuel pathways matching reference image)
    const glowingBlueIntakeMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      emissive: 0x0088ff,
      emissiveIntensity: 0.5,
      metalness: 0.4,
      roughness: 0.25,
      transparent: true,
      opacity: 0.88,
    });

    cylPositions.forEach((pos) => {
      const runnerCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(pos.side * 0.45, 0.68, pos.z),
        new THREE.Vector3(pos.x + pos.side * 0.2, 0.46, pos.z),
        new THREE.Vector3(pos.x + pos.side * 0.4, pos.y + 0.2, pos.z),
      ]);
      const runnerGeo = new THREE.TubeGeometry(runnerCurve, 14, 0.046, 8, false);
      const runnerMesh = new THREE.Mesh(runnerGeo, glowingBlueIntakeMat);
      engineRoot.add(runnerMesh);
    });

    // H2. Top-Mounted Electronic Control Unit (ECU) Housing & Cooling Ribs (Matching reference image)
    const ecuBlackMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.85,
      roughness: 0.3,
    });
    const ecuBoxGeo = new THREE.BoxGeometry(0.68, 0.2, 0.85);
    const ecuBox = new THREE.Mesh(ecuBoxGeo, ecuBlackMat);
    ecuBox.position.set(0, 0.82, 0.22);
    engineRoot.add(ecuBox);

    // Heat sink fins on top of ECU
    for (let ef = -0.32; ef <= 0.32; ef += 0.08) {
      const eFinGeo = new THREE.BoxGeometry(0.66, 0.04, 0.02);
      const eFin = new THREE.Mesh(eFinGeo, ecuBlackMat);
      eFin.position.set(0, 0.94, 0.22 + ef);
      engineRoot.add(eFin);
    }

    // ECU Harness Connector Plugs
    [-0.32, 0.32].forEach((cPos) => {
      const connGeo = new THREE.BoxGeometry(0.22, 0.12, 0.09);
      const conn = new THREE.Mesh(connGeo, brassMat);
      conn.position.set(0, 0.82, 0.22 + cPos);
      engineRoot.add(conn);
    });

    // H3. Precision Fuel Injectors & Common Fuel Rail at Intake Ports (Matching reference image)
    const injectorMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.2,
    });
    cylPositions.forEach((pos) => {
      const injGroup = new THREE.Group();
      injGroup.position.set(pos.x + pos.side * 0.28, pos.y + 0.36, pos.z);

      const injCyl = new THREE.CylinderGeometry(0.042, 0.045, 0.24, 12);
      const injMesh = new THREE.Mesh(injCyl, injectorMat);
      injGroup.add(injMesh);

      // Gold electrical solenoid clip
      const clipGeo = new THREE.BoxGeometry(0.08, 0.07, 0.08);
      const clip = new THREE.Mesh(clipGeo, brassMat);
      clip.position.set(0, 0.12, 0);
      injGroup.add(clip);

      engineRoot.add(injGroup);
    });

    // Left and Right Fuel Rails connecting the injectors
    [-1, 1].forEach((side) => {
      const railCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.62, 0.48, 0.68),
        new THREE.Vector3(side * 0.62, 0.48, 0.1),
        new THREE.Vector3(side * 0.62, 0.48, -0.42),
      ]);
      const railGeo = new THREE.TubeGeometry(railCurve, 12, 0.026, 8, false);
      const rail = new THREE.Mesh(railGeo, chromeMat);
      engineRoot.add(rail);
    });

    // I. External Dry Sump Oil Tank, Oil Radiator & Intercooler
    const oilTankGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.72, 16);
    const oilTank = new THREE.Mesh(oilTankGeo, polishedAlloyMat);
    oilTank.position.set(-0.85, -0.45, -0.6);
    engineRoot.add(oilTank);

    // Oil lines (Braided stainless hose)
    const oilLineCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.85, -0.6, -0.6),
      new THREE.Vector3(-0.5, -0.7, -0.1),
      new THREE.Vector3(0, -0.65, 0.2),
    ]);
    const oilLineGeo = new THREE.TubeGeometry(oilLineCurve, 16, 0.032, 8, false);
    const oilLineMesh = new THREE.Mesh(oilLineGeo, chromeMat);
    engineRoot.add(oilLineMesh);

    // Aluminum finned intercooler
    const intercoolerGeo = new THREE.BoxGeometry(0.72, 0.36, 0.22);
    const intercooler = new THREE.Mesh(intercoolerGeo, cylinderFinMat);
    intercooler.position.set(0, 0.98, -0.6);
    engineRoot.add(intercooler);

    // J. Tubular Chrome-Moly Engine Mount Truss (Dynafocal Ring)
    const mountRingGeo = new THREE.TorusGeometry(0.75, 0.035, 8, 18);
    const mountRingMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const mountRing = new THREE.Mesh(mountRingGeo, mountRingMat);
    mountRing.position.set(0, 0.05, -0.65);
    engineRoot.add(mountRing);

    // 4 Rubber Vibration Damper Mounts (Dynafocal isolators)
    for (let d = 0; d < 4; d++) {
      const angle = (d * Math.PI) / 2 + Math.PI / 4;
      const damperGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 10);
      const damper = new THREE.Mesh(damperGeo, carbonPropMat);
      damper.position.set(Math.cos(angle) * 0.75, Math.sin(angle) * 0.75 + 0.05, -0.65);
      damper.rotation.z = angle;
      engineRoot.add(damper);
    }

    // -------------------------------------------------------------
    // TAPAS-BH-201 MALE UAV NACELLE CONTEXT (When in NACELLE_MOUNT view)
    // -------------------------------------------------------------
    const nacelleGroup = new THREE.Group();
    nacelleGroupRef.current = nacelleGroup;
    nacelleGroup.visible = false;
    scene.add(nacelleGroup);

    // Nacelle Cowl Shell (Semi-transparent composite aerodynamic fairing)
    const cowlGeo = new THREE.CylinderGeometry(0.95, 1.25, 3.4, 24, 1, true);
    cowlGeo.rotateX(Math.PI / 2);
    const cowlMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xe2e8f0 : 0x1e293b,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const cowl = new THREE.Mesh(cowlGeo, cowlMat);
    cowl.position.set(0, 0.1, 0.2);
    nacelleGroup.add(cowl);

    // Wing Section Mockup extending from the nacelle
    const wingMockGeo = new THREE.BoxGeometry(4.5, 0.22, 1.4);
    const wingMock = new THREE.Mesh(wingMockGeo, cowlMat);
    wingMock.position.set(2.2, 0.45, 0);
    nacelleGroup.add(wingMock);

    // -------------------------------------------------------------
    // 5. 3D Sensor Markers with Glowing Rings
    // -------------------------------------------------------------
    const sensorSpheres: THREE.Mesh[] = [];
    sensors.forEach((s) => {
      const sGroup = new THREE.Group();
      sGroup.position.set(...s.position);

      const sphereGeo = new THREE.SphereGeometry(0.075, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(s.color),
        emissive: new THREE.Color(s.color),
        emissiveIntensity: 0.8,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.userData = { sensorId: s.id, sensorName: s.name };
      sGroup.add(sphere);
      sensorSpheres.push(sphere);

      // Outer pulsing ring
      const ringGeo = new THREE.RingGeometry(0.09, 0.12, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(s.color),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.name = 'sensorRing';
      sGroup.add(ring);

      engineRoot.add(sGroup);
    });

    // 6. Raycasting for Sensor Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(sensorSpheres);
      if (intersects.length > 0) {
        const id = intersects[0].object.userData.sensorId;
        setHoveredSensor(id);
        container.style.cursor = 'pointer';
      } else {
        setHoveredSensor(null);
        container.style.cursor = 'grab';
      }
    };

    const handleClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(sensorSpheres);
      if (intersects.length > 0) {
        const id = intersects[0].object.userData.sensorId;
        if (onSelectSensor) onSelectSensor(id);
      }
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('click', handleClick);

    // 7. Mouse Orbit Drag Controls
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const updateCameraFromSpherical = () => {
      const sp = sphericalRef.current;
      sp.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, sp.phi));
      sp.radius = Math.max(2.0, Math.min(14.0, sp.radius));

      camera.position.x = sp.radius * Math.sin(sp.phi) * Math.sin(sp.theta);
      camera.position.y = sp.radius * Math.cos(sp.phi);
      camera.position.z = sp.radius * Math.sin(sp.phi) * Math.cos(sp.theta);
      camera.lookAt(targetLookAtRef.current);
    };

    updateCameraFromSpherical();

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
      container.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      sphericalRef.current.theta -= deltaX * 0.008;
      sphericalRef.current.phi -= deltaY * 0.008;
      updateCameraFromSpherical();

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
      container.style.cursor = 'grab';
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      sphericalRef.current.radius += e.deltaY * 0.005;
      updateCameraFromSpherical();
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    // 8. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.localClippingEnabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Cross-Section CAD Guide Plane Helper Group
    const crossSectionHelper = new THREE.Group();
    crossSectionHelperRef.current = crossSectionHelper;
    scene.add(crossSectionHelper);

    const planeGridGeo = new THREE.PlaneGeometry(3.6, 2.8, 12, 10);
    const planeGridMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      wireframe: true,
      depthWrite: false,
    });
    const planeGrid = new THREE.Mesh(planeGridGeo, planeGridMat);
    crossSectionHelper.add(planeGrid);

    const planeFillGeo = new THREE.PlaneGeometry(3.6, 2.8);
    const planeFillMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const planeFill = new THREE.Mesh(planeFillGeo, planeFillMat);
    crossSectionHelper.add(planeFill);

    const edges = new THREE.EdgesGeometry(planeFillGeo);
    const edgeLine = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 2 })
    );
    crossSectionHelper.add(edgeLine);
    crossSectionHelper.visible = false;

    // 9. Continuous Animation Loop (Synchronized with 4-Stroke Cycle & Telemetry)
    let animationFrameId: number;
    let crankAngleRad = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const curTel = latestTelemetryRef.current;
      const curFault = latestFaultRef.current;

      // Calculate realistic angular velocity based on live RPM
      const rpm = curTel?.rpm || 5200;
      const omega = (rpm / 60) * Math.PI * 2 * 0.016; // per frame step

      if (!isPausedRef.current) {
        crankAngleRad += omega * 0.45;

        // A. Spin Propeller & Crankshaft
        if (propellerRef.current) {
          propellerRef.current.rotation.z -= omega * (1 / 2.43); // Gearbox ratio
        }
        if (crankshaftRef.current) {
          crankshaftRef.current.rotation.z -= omega;
        }
        if (turboImpellerRef.current) {
          turboImpellerRef.current.rotation.z += omega * 4.5; // Turbo high-speed spin
        }
        if (turbineRotorRef.current) {
          turbineRotorRef.current.rotation.z += omega * 4.5;
        }
      }

      const cycleAngle720 = ((crankAngleRad * (180 / Math.PI)) % 720 + 720) % 720;

      // Dynamic Propeller Blade Pitch Angle from Simulation
      const propPitchDeg = curTel?.propellerPitchDeg || 22;
      const pitchRad = (propPitchDeg * Math.PI) / 180;
      propBladesRef.current.forEach((bMesh) => {
        bMesh.rotation.y = pitchRad;
      });

      // Dynamic Wastegate Actuator Rod Position from Simulation
      if (wastegateRodRef.current) {
        const wgPos = (curTel?.wastegatePosition || 40) / 100;
        wastegateRodRef.current.position.y = 0.02 - wgPos * 0.08;
      }

      // B. Reciprocating Pistons & Conrods (Boxer stroke order 1-4-3-2)
      // 4-Stroke 720° Cycle:
      // Cyl 1: 0° - 180° (Power)
      // Cyl 4: 180° - 360° (Power)
      // Cyl 3: 360° - 540° (Power)
      // Cyl 2: 540° - 720° (Power)
      const firingRanges: [number, number][] = [
        [0, 180], // Cyl 1
        [540, 720], // Cyl 2
        [360, 540], // Cyl 3
        [180, 360], // Cyl 4
      ];

      pistonsRef.current.forEach((pMesh, idx) => {
        const strokeOffset = idx % 2 === 0 ? 0 : Math.PI;
        const disp = Math.sin(crankAngleRad + strokeOffset) * 0.16;
        const side = cylPositions[idx].side;
        pMesh.position.x = cylPositions[idx].x + side * disp;

        if (conrodsRef.current[idx]) {
          conrodsRef.current[idx].position.x = cylPositions[idx].x - side * (0.15 - disp * 0.5);
          conrodsRef.current[idx].rotation.z = Math.PI / 2 + Math.cos(crankAngleRad + strokeOffset) * 0.18;
        }

        // 4-Stroke Combustion Flame Simulation
        const [fStart, fEnd] = firingRanges[idx];
        const isFiringStroke = cycleAngle720 >= fStart && cycleAngle720 <= fEnd;
        const strokeProgress = (cycleAngle720 - fStart) / (fEnd - fStart);

        let flameIntensity = 0;
        if (isFiringStroke) {
          // Peak intensity right after ignition (first 30% of power stroke), decaying afterwards
          flameIntensity = Math.sin(Math.PI * Math.min(1.0, strokeProgress * 1.5));
        }

        // Fault modifications on combustion:
        if (curFault === 'MISFIRE' && idx === 2) {
          // Cylinder 3 misfires: erratic missing combustion
          flameIntensity *= Math.sin(Date.now() * 0.015) > 0.4 ? 0.8 : 0.05;
        } else if (curFault === 'INJECTOR_DEGRADATION' && idx === 1) {
          // Cylinder 2 running lean: fierce prolonged high-temperature flame
          flameIntensity = Math.min(1.0, flameIntensity * 1.4 + 0.15);
        }

        if (combustionGlowsRef.current[idx]) {
          const cMat = combustionGlowsRef.current[idx].material as THREE.MeshBasicMaterial;
          cMat.opacity = flameIntensity * 0.85;
        }
        if (combustionLightsRef.current[idx]) {
          combustionLightsRef.current[idx].intensity = flameIntensity * 1.6;
        }
      });

      // C. Vibration Shake Simulation during Mechanical Faults
      if (engineRootRef.current) {
        if (curFault === 'VIBRATION_ANOMALY' || curFault === 'MISFIRE') {
          const vibAmp = curFault === 'VIBRATION_ANOMALY' ? 0.045 : 0.024;
          engineRootRef.current.position.x = (Math.random() - 0.5) * vibAmp;
          engineRootRef.current.position.y = (Math.random() - 0.5) * vibAmp;
        } else {
          engineRootRef.current.position.set(0, 0, 0);
        }
      }

      // D. Pulse Sensor Rings & Hotspot Warning Halo
      const halo = engineRootRef.current?.getObjectByName('cyl2HotspotHalo') as THREE.Mesh;
      if (halo) {
        const isHot = curFault === 'INJECTOR_DEGRADATION' || (curTel?.chtCylinders && curTel.chtCylinders[1] > 170);
        halo.visible = !!isHot;
        if (isHot) {
          const s = 1.0 + Math.sin(Date.now() * 0.008) * 0.18;
          halo.scale.set(s, s, s);
        }
      }

      scene.traverse((obj) => {
        if (obj.name === 'sensorRing') {
          const s = 1.0 + Math.sin(Date.now() * 0.006) * 0.15;
          obj.scale.set(s, s, s);
          obj.lookAt(camera.position);
        }
      });

      // E. Cross-Sectional Area CAD Clipping plane dynamic update
      if (visualModeRef.current === 'CROSS_SECTION') {
        const axis = crossSectionAxisRef.current;
        const offset = crossSectionOffsetRef.current;
        const inverted = crossSectionInvertedRef.current;

        const normal = new THREE.Vector3();
        if (axis === 'X') normal.set(inverted ? 1 : -1, 0, 0);
        else if (axis === 'Y') normal.set(0, inverted ? 1 : -1, 0);
        else normal.set(0, 0, inverted ? 1 : -1);

        const constant = offset * (inverted ? -1 : 1);
        clipPlaneRef.current.set(normal, constant);

        if (rendererRef.current) {
          rendererRef.current.clippingPlanes = [clipPlaneRef.current];
        }

        if (crossSectionHelperRef.current) {
          crossSectionHelperRef.current.visible = true;
          if (axis === 'X') {
            crossSectionHelperRef.current.position.set(offset, 0, 0.2);
            crossSectionHelperRef.current.rotation.set(0, Math.PI / 2, 0);
          } else if (axis === 'Y') {
            crossSectionHelperRef.current.position.set(0, offset, 0.2);
            crossSectionHelperRef.current.rotation.set(Math.PI / 2, 0, 0);
          } else {
            crossSectionHelperRef.current.position.set(0, 0, offset + 0.2);
            crossSectionHelperRef.current.rotation.set(0, 0, 0);
          }
        }
      } else {
        if (rendererRef.current && rendererRef.current.clippingPlanes.length > 0) {
          rendererRef.current.clippingPlanes = [];
        }
        if (crossSectionHelperRef.current && crossSectionHelperRef.current.visible) {
          crossSectionHelperRef.current.visible = false;
        }
      }

      // F. Heat Map Dynamic Multi-Zone Temperature Gradient
      if (visualModeRef.current === 'HEATMAP') {
        const chtsLive = curTel?.chtCylinders || [curTel?.cht - 2, curTel?.cht, curTel?.cht + 3.5, curTel?.cht + 2];
        const egtsLive = curTel?.egtCylinders || [curTel?.egt - 6, curTel?.egt, curTel?.egt + 8, curTel?.egt + 4];

        cylinderBlocksRef.current.forEach((mesh, idx) => {
          const temp = chtsLive[idx] || 160;
          let hex = 0x10b981; // green
          if (temp < 145) hex = 0x0284c7; // sky blue
          else if (temp < 160) hex = 0x10b981;
          else if (temp < 172) hex = 0xf59e0b; // amber
          else if (temp < 182) hex = 0xf97316; // orange
          else hex = 0xef4444; // alert red

          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.color.setHex(hex);
          mat.emissive.setHex(hex);
          mat.emissiveIntensity = temp > 175 ? 0.45 : 0.15;
          mat.transparent = false;
          mat.opacity = 1.0;
        });

        cylinderHeadsRef.current.forEach((mesh, idx) => {
          const temp = chtsLive[idx] || 160;
          let hex = 0x10b981;
          if (temp < 145) hex = 0x0284c7;
          else if (temp < 160) hex = 0x10b981;
          else if (temp < 172) hex = 0xf59e0b;
          else if (temp < 182) hex = 0xf97316;
          else hex = 0xef4444;

          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.color.setHex(hex);
          mat.emissive.setHex(hex);
          mat.emissiveIntensity = temp > 175 ? 0.5 : 0.2;
        });

        exhaustPipesRef.current.forEach((mesh, idx) => {
          const temp = egtsLive[idx % 4] || 740;
          const heatColor = temp > 820 ? 0xff2d55 : temp > 760 ? 0xff9500 : 0xd97706;
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.color.setHex(heatColor);
          mat.emissive.setHex(heatColor);
          mat.emissiveIntensity = 0.92;
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0] || !rendererRef.current || !cameraRef.current) return;
      const { width: newW, height: newH } = entries[0].contentRect;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);

      if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, [theme]);

  // Update Visual Mode Materials Dynamically
  useEffect(() => {
    if (!sceneRef.current) return;

    const isCutaway = visualMode === 'CUTAWAY';
    const isThermal = visualMode === 'THERMAL_IR';
    const isHeatmap = visualMode === 'HEATMAP';
    const isCrossSection = visualMode === 'CROSS_SECTION';
    const isVib = visualMode === 'VIBRATION';

    cylinderBlocksRef.current.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (isCutaway) {
        mat.transparent = true;
        mat.opacity = 0.32;
        mat.wireframe = false;
        mat.color.setHex(theme === 'light' ? 0x64748b : 0x2d3a4b);
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      } else if (isCrossSection) {
        mat.transparent = false;
        mat.opacity = 1.0;
        mat.color.setHex(0x38bdf8); // crisp internal alloy cut tint
        mat.emissive.setHex(0x0284c7);
        mat.emissiveIntensity = 0.15;
      } else if (isHeatmap) {
        mat.transparent = false;
        mat.opacity = 1.0;
      } else if (isThermal) {
        mat.transparent = false;
        mat.opacity = 1.0;
        mat.color.setHex(0xea580c);
        mat.emissive.setHex(0xea580c);
        mat.emissiveIntensity = 0.4;
      } else if (isVib) {
        mat.transparent = false;
        mat.opacity = 1.0;
        mat.color.setHex(0x0284c7);
        mat.emissive.setHex(0x0284c7);
        mat.emissiveIntensity = 0.25;
      } else {
        mat.transparent = false;
        mat.opacity = 1.0;
        mat.color.setHex(theme === 'light' ? 0x64748b : 0x2d3a4b);
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      }
    });

    // Dynamic Thermal Exhaust glowing color tied to actual EGT
    const egt = telemetry.egt || 720;
    exhaustPipesRef.current.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (isThermal || isHeatmap || egt > 780) {
        const heatColor = egt > 820 ? 0xf43f5e : egt > 760 ? 0xe11d48 : 0xd97706;
        mat.color.setHex(heatColor);
        mat.emissive.setHex(heatColor);
        mat.emissiveIntensity = isThermal || isHeatmap ? 0.88 : 0.45;
      } else {
        mat.color.setHex(0x78716c);
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      }
    });
  }, [visualMode, theme, telemetry.egt]);

  // Update View Scope (Engine Stand vs Nacelle Mount)
  useEffect(() => {
    if (nacelleGroupRef.current) {
      nacelleGroupRef.current.visible = viewScope === 'NACELLE_MOUNT';
    }
  }, [viewScope]);

  // Cylinder temperatures array
  const chts = telemetry.chtCylinders || [
    telemetry.cht - 2,
    telemetry.cht,
    telemetry.cht + 3.5,
    telemetry.cht + 2,
  ];
  const egts = telemetry.egtCylinders || [
    telemetry.egt - 6,
    telemetry.egt,
    telemetry.egt + 8,
    telemetry.egt + 4,
  ];

  return (
    <div
      className={`w-full h-full flex flex-col rounded-xl border relative overflow-hidden transition-colors ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800 shadow-xs'
          : 'bg-[#060c18] border-[#14233a] text-slate-100 shadow-lg'
      }`}
    >
      {/* 3D Viewport Header: Clean Aerospace Specification */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 border-b transition-colors ${
          isLight
            ? 'bg-slate-50/90 border-slate-200 text-slate-800'
            : 'bg-[#070e1b] border-[#14233a] text-slate-100'
        } z-10`}
      >
        <div className="flex items-center space-x-2">
          <Wrench className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <h2 className="text-xs font-chakra font-bold tracking-wider text-slate-900 dark:text-white uppercase">
            {title}
          </h2>
          <span className="hidden sm:inline text-[10px] font-chakra font-bold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
            REAL-TIME KINEMATICS
          </span>
          {selectedComponent && (
            <span className="px-2 py-0.5 rounded text-[10px] font-chakra font-bold tracking-wider uppercase bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400">
              FOCUS: {selectedComponent}
            </span>
          )}
        </div>

        {/* View Controls: Scope Toggle + Labels Toggle + Tech Specs */}
        <div className="flex items-center space-x-1.5 text-xs font-chakra">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setViewScope('ENGINE_STAND')}
              className={`px-2.5 py-1 rounded text-xs font-chakra font-bold uppercase transition-all ${
                viewScope === 'ENGINE_STAND'
                  ? isLight
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-cyan-600 text-white shadow-xs'
                  : isLight
                  ? 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  : 'bg-[#0d1b2e] text-slate-300 border border-[#1e3455] hover:bg-[#152740]'
              }`}
            >
              Engine Stand
            </button>
            <button
              onClick={() => setViewScope('NACELLE_MOUNT')}
              className={`px-2.5 py-1 rounded text-xs font-chakra font-bold uppercase transition-all ${
                viewScope === 'NACELLE_MOUNT'
                  ? isLight
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-cyan-600 text-white shadow-xs'
                  : isLight
                  ? 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  : 'bg-[#0d1b2e] text-slate-300 border border-[#1e3455] hover:bg-[#152740]'
              }`}
            >
              Airframe Nacelle
            </button>
          </div>

          {onToggleCallouts && (
            <button
              onClick={onToggleCallouts}
              className={`px-2.5 py-1 rounded text-xs font-chakra font-bold uppercase transition-all border ${
                showCallouts
                  ? isLight
                    ? 'bg-cyan-50 border-cyan-400 text-cyan-800 shadow-xs'
                    : 'bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-xs'
                  : isLight
                  ? 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  : 'bg-[#0d1b2e] text-slate-300 border-[#1e3455] hover:bg-[#152740]'
              }`}
              title="Toggle Subsystem Labels and Pointers"
            >
              {showCallouts ? 'Hide Labels' : 'Show Labels'}
            </button>
          )}

          {onOpenArchitectureModal && (
            <button
              onClick={onOpenArchitectureModal}
              className="px-2.5 py-1 rounded text-xs font-chakra font-bold uppercase transition-all bg-cyan-700 hover:bg-cyan-600 text-white shadow-xs flex items-center gap-1.5"
              title="Open Digital Twin Architecture & Technical Documentation"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tech Specs</span>
            </button>
          )}
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full flex-1 relative cursor-grab">
        {/* Visual Mode Selector Floating Pill */}
        <div className="absolute top-2.5 left-2.5 z-20 flex flex-wrap gap-1 bg-white/95 dark:bg-[#070d18]/95 backdrop-blur-md p-1 rounded-lg border border-slate-300 dark:border-[#1e3250] shadow-md text-[10px] font-chakra font-semibold max-w-[calc(100%-120px)] sm:max-w-none">
          <button
            onClick={() => setVisualMode('CUTAWAY')}
            className={`px-2 py-1 rounded flex items-center space-x-1 transition-all ${
              visualMode === 'CUTAWAY'
                ? 'bg-cyan-700 text-white font-bold shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Internal Reciprocating Pistons & Conrods"
          >
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">CUTAWAY</span>
          </button>

          <button
            onClick={() => setVisualMode('HEATMAP')}
            className={`px-2 py-1 rounded flex items-center space-x-1 transition-all ${
              visualMode === 'HEATMAP'
                ? 'bg-amber-600 text-white font-bold shadow-xs ring-1 ring-amber-400'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="3D Multi-Zone Thermal Gradient & Hotspot Distribution"
          >
            <Flame className="w-3 h-3 text-amber-300" />
            <span className="font-bold">HEAT MAP</span>
          </button>

          <button
            onClick={() => setVisualMode('CROSS_SECTION')}
            className={`px-2 py-1 rounded flex items-center space-x-1 transition-all ${
              visualMode === 'CROSS_SECTION'
                ? 'bg-teal-700 text-white font-bold shadow-xs ring-1 ring-teal-400'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Interactive CAD Slicing Plane & Geometric Cross-Sectional Areas"
          >
            <Scissors className="w-3 h-3 text-teal-300" />
            <span className="font-bold">CROSS SECTION</span>
          </button>

          <button
            onClick={() => setVisualMode('THERMAL_IR')}
            className={`px-2 py-1 rounded flex items-center space-x-1 transition-all ${
              visualMode === 'THERMAL_IR'
                ? 'bg-rose-700 text-white font-bold shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span className="hidden sm:inline">THERMAL IR</span>
          </button>

          <button
            onClick={() => setVisualMode('VIBRATION')}
            className={`px-2 py-1 rounded flex items-center space-x-1 transition-all ${
              visualMode === 'VIBRATION'
                ? 'bg-emerald-700 text-white font-bold shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span className="hidden sm:inline">VIB STRAIN</span>
          </button>

          <button
            onClick={() => setVisualMode('MECHANICAL')}
            className={`px-2 py-1 rounded flex items-center space-x-1 transition-all ${
              visualMode === 'MECHANICAL'
                ? 'bg-slate-800 text-white font-bold shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span className="hidden sm:inline">SOLID ALLOY</span>
          </button>
        </div>

        {/* Camera Quick-Angle Presets */}
        <div className="absolute top-11 sm:top-12 left-2.5 z-20 flex flex-wrap gap-1 bg-white/95 dark:bg-[#070d18]/90 backdrop-blur-md p-1 rounded border border-slate-200 dark:border-slate-800 shadow text-[9px] font-chakra">
          <span className="px-1 py-0.5 text-slate-600 dark:text-slate-400 font-bold flex items-center gap-0.5">
            <Camera className="w-2.5 h-2.5 text-cyan-600" />
            <span className="hidden sm:inline">PRESETS:</span>
          </span>
          {(['ISOMETRIC', 'CUTAWAY', 'TURBO', 'CYLINDERS', 'PROP'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => setCameraPreset(preset)}
              className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                activeCameraPreset === preset
                  ? 'bg-cyan-700 text-white'
                  : 'text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* DEDICATED OVERLAY 1: HEAT MAP ISOTHERM LEGEND & HOTSPOT HUD    */}
        {/* ------------------------------------------------------------- */}
        {visualMode === 'HEATMAP' && (
          <div className="absolute bottom-9 left-2.5 z-20 bg-white/95 dark:bg-[#070d18]/95 backdrop-blur-md p-3 rounded-xl border border-amber-500/60 shadow-xl max-w-sm sm:max-w-md animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-1.5">
                <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                <span className="font-chakra font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wide">
                  3D Engine Thermal Heat Map
                </span>
              </div>
              <span className="text-[10px] font-chakra font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                MULTI-ZONE ISOTHERMS
              </span>
            </div>

            {/* Continuous Thermal Color Gradient Legend Bar */}
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-[9px] font-chakra font-bold text-slate-700 dark:text-slate-300">
                <span>30°C (Ambient)</span>
                <span>110°C (Oil)</span>
                <span>175°C (CHT Max)</span>
                <span>850°C (Exhaust)</span>
              </div>
              <div className="h-3 w-full rounded-sm overflow-hidden bg-gradient-to-r from-sky-600 via-teal-500 via-emerald-500 via-amber-400 via-orange-500 to-rose-600 shadow-inner" />
            </div>

            {/* Hotspot Readout Card */}
            <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs font-sans">
              <div className="p-2 rounded bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
                <div className="text-[10px] font-chakra font-bold text-amber-800 dark:text-amber-400 uppercase">
                  Critical Hotspot
                </div>
                <div className="text-sm font-bold font-tech text-slate-900 dark:text-white mt-0.5">
                  Cylinder #2: {chts[1]}°C
                </div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
                  {chts[1] > 175 ? '⚠️ Thermal Limit Exceeded' : '✓ Operating in Envelope'}
                </div>
              </div>

              <div className="p-2 rounded bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-chakra font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Convective Heat Flux (q″)
                </div>
                <div className="text-sm font-bold font-tech text-cyan-700 dark:text-cyan-400 mt-0.5">
                  14.8 kW/m²
                </div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Fin Biot Number: Bi = 0.082
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* DEDICATED OVERLAY 2: CROSS-SECTIONAL AREA CAD SLICER HUD      */}
        {/* ------------------------------------------------------------- */}
        {visualMode === 'CROSS_SECTION' && (
          <div className="absolute bottom-9 left-2.5 z-20 bg-white/95 dark:bg-[#070d18]/95 backdrop-blur-md p-3 rounded-xl border border-teal-500/60 shadow-xl max-w-sm sm:max-w-md animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-1.5">
                <Scissors className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="font-chakra font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wide">
                  Cross-Sectional Area CAD Slicer
                </span>
              </div>
              <span className="text-[10px] font-chakra font-semibold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/30">
                {crossSectionAxis}-PLANE CUT
              </span>
            </div>

            {/* Slicing Plane Selection & Invert Actions */}
            <div className="mt-2 flex items-center justify-between gap-1.5">
              <div className="flex items-center space-x-1 text-[10px] font-chakra font-bold">
                {(['X', 'Y', 'Z'] as const).map((axis) => (
                  <button
                    key={axis}
                    onClick={() => setCrossSectionAxis(axis)}
                    className={`px-2 py-1 rounded transition-all ${
                      crossSectionAxis === axis
                        ? 'bg-teal-700 text-white font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {axis === 'X' ? 'Sagittal (X)' : axis === 'Y' ? 'Axial (Y)' : 'Frontal (Z)'}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCrossSectionInverted(!crossSectionInverted)}
                  className={`px-2 py-1 rounded text-[10px] font-chakra font-bold border transition-colors ${
                    crossSectionInverted
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                  title="Invert Slice Direction"
                >
                  <Split className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setCrossSectionOffset(0.12)}
                  className="px-2 py-1 rounded text-[10px] font-chakra font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100"
                  title="Reset Slicing Plane to Datum"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Slicing Plane Offset Slider */}
            <div className="mt-2.5 space-y-1">
              <div className="flex justify-between text-[10px] font-chakra font-bold text-slate-700 dark:text-slate-300">
                <span>SLICE PLANE OFFSET:</span>
                <span className="font-tech text-teal-700 dark:text-teal-400">
                  {(crossSectionOffset * 1000).toFixed(0)} mm
                </span>
              </div>
              <input
                type="range"
                min="-0.85"
                max="0.85"
                step="0.02"
                value={crossSectionOffset}
                onChange={(e) => setCrossSectionOffset(parseFloat(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
            </div>

            {/* Real Computed Cross-Sectional Geometric Flow Areas */}
            <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-center text-xs font-sans">
              <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[9px] font-chakra font-semibold text-slate-600 dark:text-slate-400">
                  Cylinder Bore
                </div>
                <div className="font-tech font-bold text-slate-900 dark:text-white text-xs mt-0.5">
                  49.64 cm²
                </div>
                <div className="text-[8px] text-slate-500">Ø 79.5 mm</div>
              </div>

              <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[9px] font-chakra font-semibold text-slate-600 dark:text-slate-400">
                  Intake Throat
                </div>
                <div className="font-tech font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">
                  7.07 cm²
                </div>
                <div className="text-[8px] text-slate-500">Ø 30.0 mm</div>
              </div>

              <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[9px] font-chakra font-semibold text-slate-600 dark:text-slate-400">
                  Oil Gallery
                </div>
                <div className="font-tech font-bold text-amber-600 dark:text-amber-400 text-xs mt-0.5">
                  0.79 cm²
                </div>
                <div className="text-[8px] text-slate-500">Ø 10.0 mm</div>
              </div>
            </div>
          </div>
        )}

        {/* Real-Time Live Multi-Cylinder Engine Telemetry HUD (High-Contrast & Aligned) */}
        <div className="absolute top-2.5 right-2.5 z-20 bg-white/95 dark:bg-[#070d18]/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-300 dark:border-[#1e3250] shadow-xl text-xs font-tech space-y-2 select-none w-64 max-w-[calc(100vw-36px)]">
          <div className="flex justify-between items-center text-[10px] font-chakra font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-cyan-600" />
              ROTAX 914-F STATUS
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">50Hz HWIL</span>
          </div>

          {/* 4-Cylinder Head Temperatures (CHT 1, 2, 3, 4) */}
          <div>
            <div className="flex justify-between text-[10px] font-chakra font-bold text-slate-600 dark:text-slate-300">
              <span>CYLINDER HEAD TEMPS (°C):</span>
              <span className="text-slate-900 dark:text-slate-100">MAX 175°C</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mt-1">
              {chts.map((temp, idx) => {
                const isOver = temp > 175;
                const isWarn = temp > 160;
                return (
                  <div
                    key={idx}
                    className={`p-1 rounded text-center border font-chakra text-[10px] ${
                      isOver
                        ? 'bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-400 font-bold animate-pulse'
                        : isWarn
                        ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-400 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <div className="text-[8px] text-slate-500 dark:text-slate-400 font-bold">C{idx + 1}</div>
                    <div className="font-tech font-bold">{temp}°</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4-Cylinder Exhaust Gas Temperatures (EGT 1, 2, 3, 4) */}
          <div>
            <div className="flex justify-between text-[10px] font-chakra font-bold text-slate-600 dark:text-slate-300">
              <span>EXHAUST GAS TEMPS (°C):</span>
              <span className="text-slate-900 dark:text-slate-100">MAX 850°C</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mt-1">
              {egts.map((temp, idx) => {
                const isOver = temp > 850;
                const isWarn = temp > 800;
                return (
                  <div
                    key={idx}
                    className={`p-1 rounded text-center border font-chakra text-[10px] ${
                      isOver
                        ? 'bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-400 font-bold'
                        : isWarn
                        ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-400 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="text-[8px] text-slate-500 font-bold">E{idx + 1}</div>
                    <div className="font-tech font-bold">{temp}°</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Core Propulsion Dynamics */}
          <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 space-y-1 text-[11px] font-sans">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400 font-chakra font-semibold">PROP RPM:</span>
              <span className="font-bold font-tech text-cyan-700 dark:text-cyan-400">{telemetry.rpm}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400 font-chakra font-semibold">MAP / BOOST:</span>
              <span className="font-bold font-tech text-purple-700 dark:text-purple-400">
                {telemetry.manifoldPressure} inHg (+{telemetry.turboBoostBar || 0.22} bar)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400 font-chakra font-semibold">POWER & PITCH:</span>
              <span className="font-bold font-tech text-slate-900 dark:text-white">
                {telemetry.powerHp} HP @ {telemetry.propellerPitchDeg || 22}°
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400 font-chakra font-semibold">OIL P / T:</span>
              <span className="font-bold font-tech text-slate-900 dark:text-white">
                {telemetry.oilPressure} bar / {telemetry.oilTemperature}°C
              </span>
            </div>
          </div>
        </div>

        {/* Hovered / Clicked Sensor Inspection Popup */}
        {hoveredSensor && (
          <div className="absolute bottom-9 left-2.5 z-20 bg-white/95 dark:bg-[#070d18]/95 backdrop-blur-md p-2.5 rounded-lg border border-cyan-500 shadow-xl text-xs font-tech pointer-events-none max-w-xs animate-in fade-in duration-100">
            {(() => {
              const s = sensors.find((x) => x.id === hoveredSensor);
              if (!s) return null;
              return (
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="font-chakra font-bold text-slate-900 dark:text-white uppercase text-[11px]">{s.shortName}:</span>
                    <span className="font-bold text-cyan-700 dark:text-cyan-400 text-xs">{s.getValue(telemetry)}</span>
                  </div>
                  <p className="text-[10px] text-slate-700 dark:text-slate-300 font-sans leading-tight">{s.name}</p>
                </div>
              );
            })()}
          </div>
        )}

        {/* 3D Viewport Controls Hint */}
        <div className="absolute bottom-2 left-2.5 z-10 text-[9px] font-tech text-slate-600 dark:text-slate-300 bg-white/90 dark:bg-black/80 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-800 pointer-events-none uppercase tracking-wide">
          DRAG TO ORBIT • SCROLL TO ZOOM • PRESET ANGLES • CAD CROSS-SECTION & HEAT MAP ACTIVE
        </div>
      </div>
    </div>
  );
};

