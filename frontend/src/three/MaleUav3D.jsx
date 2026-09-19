/**
 * AEROTWIN AI - High-Fidelity 3D MALE UAV Airframe & Engine Digital Twin
 * TAPAS-BH-201 / Predator MQ-1 Class Tactical Airframe with Integrated Powerplant
 *
 * Full Aerospace Digital Twin Suite:
 * - 4 Visual Rendering Modes: REALISTIC, XRAY_CUTAWAY, THERMAL_HEATMAP, WIREFRAME_CAD
 * - 3 Vision Environments: DAY, NIGHT, FLIR_IR (Thermal Infrared Simulation)
 * - Exploded Assembly View (0% to 100% Disassembly Slider)
 * - Dynamic Aerodynamic Control Surfaces (Ailerons & V-Tail Ruddervators)
 * - Interactive 3D Sensor Hotspots with Floating Telemetry Cards (Drei Html)
 * - Real-Time Flight Dynamics (Takeoff, Climb, Cruise, Descent, Flare, Touchdown, Rollout)
 * - 3D Tactical Runway with Active Beacons & Touchdown Smoke Burst Particles
 */

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import PistonEngine3D from './PistonEngine3D';
import { soundFx } from '../utils/soundFx';

// Interactive 3D Telemetry Sensor Hotspot Pin
function SensorHotspot({
  position,
  id,
  name,
  value,
  unit,
  status = 'nominal',
  isSelected,
  onClick
}) {
  const [hovered, setHovered] = useState(false);

  const getStatusColor = () => {
    if (status === 'critical') return '#ef4444';
    if (status === 'warning') return '#f59e0b';
    return '#10b981';
  };

  const color = getStatusColor();

  return (
    <group position={position}>
      {/* Pulsing Core Beacon */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          soundFx.playClick('high');
          if (onClick) onClick(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected || hovered ? 3.5 : 1.8}
        />
      </mesh>

      {/* Outer Pulse Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.11, 0.15, 20]} />
        <meshBasicMaterial
          color={color}
          side={THREE.DoubleSide}
          transparent
          opacity={hovered || isSelected ? 0.9 : 0.45}
        />
      </mesh>

      {/* Floating 3D Holographic Telemetry Card */}
      {(hovered || isSelected) && (
        <Html distanceFactor={13} position={[0, 0.32, 0]} center>
          <div className="bg-aerodark/95 backdrop-blur-md border border-aeroborder p-2.5 rounded-lg shadow-2xl text-[10px] whitespace-nowrap font-mono pointer-events-none text-white z-50 min-w-[160px]">
            <div className="font-bold flex items-center justify-between space-x-2 border-b border-aeroborder/80 pb-1 mb-1.5">
              <span className="text-sky-400 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                <span>{name}</span>
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                  status === 'critical'
                    ? 'bg-red-950/80 text-red-300 border border-red-700'
                    : status === 'warning'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-700'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
                }`}
              >
                {status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-baseline justify-between text-slate-300 text-[11px]">
              <span className="text-slate-400 text-[9px]">READING:</span>
              <div className="font-bold">
                <span className="text-white text-xs">{value}</span>{' '}
                <span className="text-sky-400 text-[10px]">{unit}</span>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function MaleUav3D({
  telemetry,
  health,
  fault,
  activeFaults,
  viewMode = 'XRAY_CUTAWAY', // 'FULL_UAV', 'XRAY_CUTAWAY', 'ENGINE_ONLY'
  renderMode = 'REALISTIC', // 'REALISTIC', 'XRAY_CUTAWAY', 'THERMAL_HEATMAP', 'WIREFRAME_CAD'
  visionEnvironment = 'DAY', // 'DAY', 'NIGHT', 'FLIR_IR'
  explodedFactor = 0.0, // 0.0 to 1.0
  showSensors = true,
  selectedPart = 'all',
  onSelectPart,
  showGrid = true,
  flightMode = 'CRUISE', // 'CRUISE', 'TAKEOFF', 'LAND', 'GROUND', 'AUTO_CYCLE'
  onFlightTelemetryUpdate
}) {
  // References
  const uavRootRef = useRef();
  const propRef = useRef();
  const flirRef = useRef();
  const strobeRef = useRef();
  const noseGearRef = useRef();
  const rightMainGearRef = useRef();
  const leftMainGearRef = useRef();
  const rightAileronRef = useRef();
  const leftAileronRef = useRef();
  const rightRuddervatorRef = useRef();
  const leftRuddervatorRef = useRef();
  const slipstreamRef = useRef();
  const leftVortexRef = useRef();
  const rightVortexRef = useRef();
  const leftSmokeRef = useRef();
  const rightSmokeRef = useRef();

  // Timing and state tracking
  const strobeTimer = useRef(0);
  const currentModeRef = useRef(flightMode);
  const maneuverTimeRef = useRef(0);
  const autoCycleTimerRef = useRef(0);
  const touchdownTriggeredRef = useRef(false);
  const smokeTimerRef = useRef(999);
  const gearExtensionRef = useRef(flightMode === 'GROUND' ? 1.0 : 0.0);
  const lastReportTimeRef = useRef(0);

  const rpm = telemetry?.rpm !== undefined ? telemetry.rpm : 4800;
  const cht = telemetry?.cht || 142.4;
  const egt = telemetry?.egt || 795.0;
  const oilPressure = telemetry?.oil_pressure !== undefined ? telemetry.oil_pressure : 4.2;

  // Determine effective rendering parameters based on renderMode & visionEnvironment
  const isCutaway = renderMode === 'XRAY_CUTAWAY' || viewMode === 'XRAY_CUTAWAY';
  const isThermal = renderMode === 'THERMAL_HEATMAP';
  const isWireframe = renderMode === 'WIREFRAME_CAD';
  const isFlirIr = visionEnvironment === 'FLIR_IR';
  const isEngineOnly = viewMode === 'ENGINE_ONLY';

  // Dynamic Materials Calculation
  const getAirframeColor = () => {
    if (isFlirIr) return '#18181b'; // Cold airframe composite in FLIR
    if (isWireframe) return '#38bdf8'; // Cyan CAD vectors
    if (isThermal) return '#0284c7'; // Ambient cool skin
    if (isCutaway) return '#0284c7';
    return '#1e3a8a'; // Vibrant Royal/Navy Aerospace Blue
  };

  const getEngineCowlingColor = () => {
    if (isFlirIr) return '#ffffff'; // White-hot engine bay in FLIR
    if (isThermal) {
      if (cht > 175) return '#ef4444'; // Hot Thermal Red
      if (cht > 155) return '#f97316'; // Amber Flame
      return '#eab308'; // Warm Yellow
    }
    if (isCutaway) return '#0ea5e9';
    return '#047857'; // Deep Emerald Green
  };

  const getPropellerColor = () => {
    if (isFlirIr) return '#71717a';
    if (isWireframe) return '#38bdf8';
    return '#0284c7';
  };

  const airframeColor = getAirframeColor();
  const engineColor = getEngineCowlingColor();
  const airframeOpacity = isCutaway ? 0.35 : (isWireframe ? 0.8 : 1.0);
  const isTransparent = isCutaway || isWireframe;

  // Real-time Flight Dynamics & Animation Engine
  useFrame((state, delta) => {
    // 1. Propeller spinning synchronized with real engine RPM
    if (propRef.current) {
      if (rpm > 0) {
        let speedMult = 1.5;
        if (currentModeRef.current === 'TAKEOFF') speedMult = 2.2;
        if (currentModeRef.current === 'GROUND') speedMult = 0.5;
        const propSpeed = (rpm / 60) * Math.PI * speedMult * delta;
        propRef.current.rotation.z += propSpeed;
      }
    }

    // 2. FLIR turret gentle surveillance pan
    if (flirRef.current) {
      flirRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.45;
    }

    // 3. Wingtip anti-collision strobe flashing
    strobeTimer.current += delta;
    if (strobeRef.current) {
      const flash = Math.sin(strobeTimer.current * 8) > 0.6;
      strobeRef.current.intensity = flash ? (visionEnvironment === 'NIGHT' ? 4.5 : 3.0) : 0.2;
    }

    // 4. Flight Mode Kinematics Resolution
    if (currentModeRef.current !== flightMode) {
      currentModeRef.current = flightMode;
      maneuverTimeRef.current = 0;
      touchdownTriggeredRef.current = false;
      if (flightMode === 'LAND') {
        smokeTimerRef.current = 999;
      }
    }

    maneuverTimeRef.current += delta;
    smokeTimerRef.current += delta;

    let activeSubMode = currentModeRef.current;
    let t = maneuverTimeRef.current;

    // Handle AUTO_CYCLE loop logic
    if (currentModeRef.current === 'AUTO_CYCLE') {
      autoCycleTimerRef.current = (autoCycleTimerRef.current + delta) % 27.0;
      const act = autoCycleTimerRef.current;
      if (act < 2.5) {
        activeSubMode = 'GROUND';
        t = act;
      } else if (act < 10.5) {
        activeSubMode = 'TAKEOFF';
        t = act - 2.5;
      } else if (act < 16.5) {
        activeSubMode = 'CRUISE';
        t = act - 10.5;
      } else if (act < 24.5) {
        activeSubMode = 'LAND';
        t = act - 16.5;
      } else {
        activeSubMode = 'GROUND';
        t = act - 24.5;
      }
    }

    // Target kinematic variables
    let uavY = 1.35;
    let uavZ = 0.0;
    let pitchDeg = 0.0;
    let rollDeg = 0.0;
    let yawDeg = 0.0;
    let gearTarget = 0.0;
    let altitudeM = 1200;
    let airspeedKts = 142;
    let currentPhase = 'CRUISE';
    let currentPhaseLabel = 'AIRBORNE CRUISE';
    let vortexIntensity = 0.0;
    let slipstreamScale = 1.0;

    if (activeSubMode === 'GROUND') {
      uavY = 0.0;
      uavZ = 0.0;
      pitchDeg = 0.0;
      rollDeg = 0.0;
      yawDeg = 0.0;
      gearTarget = 1.0;
      altitudeM = 0;
      airspeedKts = 0;
      currentPhase = 'GROUND_HOLD';
      currentPhaseLabel = 'GROUND READY / TAXI';
      vortexIntensity = 0.0;
      slipstreamScale = 0.4;
    } else if (activeSubMode === 'TAKEOFF') {
      if (t < 2.8) {
        const prog = t / 2.8;
        uavY = 0.0;
        uavZ = 2.5 - prog * 4.5;
        pitchDeg = 0.0;
        rollDeg = (Math.random() - 0.5) * 0.3;
        gearTarget = 1.0;
        altitudeM = 0;
        airspeedKts = 15 + prog * 60;
        currentPhase = 'TAKEOFF_ROLL';
        currentPhaseLabel = 'TAKEOFF ROLL (SPOOL-UP)';
        vortexIntensity = 0.1;
        slipstreamScale = 1.4;
      } else if (t < 5.2) {
        const prog = (t - 2.8) / 2.4;
        uavY = prog * 0.85;
        uavZ = -2.0 - prog * 1.5;
        pitchDeg = prog * 13.5;
        rollDeg = Math.sin(prog * Math.PI) * 1.2;
        gearTarget = Math.max(0.0, 1.0 - prog * 1.4);
        altitudeM = prog * 420;
        airspeedKts = 75 + prog * 40;
        currentPhase = 'ROTATING';
        currentPhaseLabel = 'ROTATION & LIFTOFF (+13.5°)';
        vortexIntensity = 0.9;
        slipstreamScale = 1.6;
      } else if (t < 8.2) {
        const prog = (t - 5.2) / 3.0;
        uavY = 0.85 + prog * 0.5;
        uavZ = -3.5 + prog * 3.5;
        pitchDeg = 13.5 - prog * 12.5;
        rollDeg = Math.sin(prog * Math.PI * 1.5) * 1.0;
        gearTarget = 0.0;
        altitudeM = 420 + prog * 780;
        airspeedKts = 115 + prog * 27;
        currentPhase = 'CLIMB';
        currentPhaseLabel = 'CLIMB-OUT TO FL120';
        vortexIntensity = (1.0 - prog) * 0.6;
        slipstreamScale = 1.2;
      } else {
        uavY = 1.35;
        uavZ = 0.0;
        pitchDeg = 1.0;
        gearTarget = 0.0;
        altitudeM = 1200;
        airspeedKts = 142;
        currentPhase = 'CRUISE';
        currentPhaseLabel = 'AIRBORNE CRUISE (FL120)';
        vortexIntensity = 0.0;
        slipstreamScale = 1.0;
      }
    } else if (activeSubMode === 'LAND') {
      if (t < 3.4) {
        const prog = t / 3.4;
        uavY = 1.35 - prog * 1.23;
        uavZ = -2.0 + prog * 2.0;
        pitchDeg = -4.2 + Math.sin(prog * Math.PI) * 0.4;
        rollDeg = Math.sin(prog * 3.0) * 1.2;
        gearTarget = Math.min(1.0, prog * 2.2);
        altitudeM = Math.max(20, 1200 - prog * 1150);
        airspeedKts = 142 - prog * 68;
        currentPhase = 'DESCENT';
        currentPhaseLabel = 'GLIDESLOPE APPROACH (-4.2°)';
        vortexIntensity = 0.15;
        slipstreamScale = 0.7;
      } else if (t < 4.8) {
        const prog = (t - 3.4) / 1.4;
        uavY = Math.max(0.0, 0.12 * (1.0 - prog));
        uavZ = prog * 0.8;
        pitchDeg = -4.2 + prog * 10.2;
        rollDeg = 0.0;
        gearTarget = 1.0;
        altitudeM = Math.max(0, Math.round((1.0 - prog) * 20));
        airspeedKts = 74 - prog * 12;
        currentPhase = 'FLARE';
        currentPhaseLabel = 'FLARE & TOUCHDOWN';
        vortexIntensity = 0.0;
        slipstreamScale = 0.8;

        if (prog >= 0.55 && !touchdownTriggeredRef.current) {
          touchdownTriggeredRef.current = true;
          smokeTimerRef.current = 0.0;
          soundFx.playTouchdownScreech();
        }
      } else if (t < 7.8) {
        const prog = (t - 4.8) / 3.0;
        uavY = 0.0;
        uavZ = 0.8 - prog * 0.8;
        pitchDeg = 6.0 * (1.0 - prog);
        rollDeg = 0.0;
        gearTarget = 1.0;
        altitudeM = 0;
        airspeedKts = Math.max(0, 62 * (1.0 - prog) + 6);
        currentPhase = 'ROLLOUT';
        currentPhaseLabel = 'BRAKING ROLLOUT';
        vortexIntensity = 0.0;
        slipstreamScale = 0.5;
      } else {
        uavY = 0.0;
        uavZ = 0.0;
        pitchDeg = 0.0;
        rollDeg = 0.0;
        gearTarget = 1.0;
        altitudeM = 0;
        airspeedKts = 0;
        currentPhase = 'GROUND_HOLD';
        currentPhaseLabel = 'GROUND TAXI / PARKED';
        vortexIntensity = 0.0;
        slipstreamScale = 0.4;
      }
    } else {
      const flightTime = state.clock.elapsedTime;
      uavY = 1.35 + Math.sin(flightTime * 0.7) * 0.05;
      uavZ = 0.0;
      pitchDeg = 0.8 + Math.sin(flightTime * 0.5) * 0.7;
      rollDeg = Math.sin(flightTime * 0.35) * 2.2;
      yawDeg = Math.sin(flightTime * 0.25) * 0.8;
      gearTarget = 0.0;
      altitudeM = 1200 + Math.sin(flightTime * 0.2) * 12;
      airspeedKts = 142 + Math.sin(flightTime * 0.15) * 2;
      currentPhase = 'CRUISE';
      currentPhaseLabel = 'AIRBORNE CRUISE (FL120)';
      vortexIntensity = 0.05;
      slipstreamScale = 1.0;
    }

    // 5. Apply Position & Rotation to UAV Main Group
    if (uavRootRef.current) {
      uavRootRef.current.position.y = THREE.MathUtils.lerp(uavRootRef.current.position.y, uavY, 0.12);
      uavRootRef.current.position.z = THREE.MathUtils.lerp(uavRootRef.current.position.z, uavZ, 0.1);

      const targetRotX = -THREE.MathUtils.degToRad(pitchDeg);
      const targetRotZ = THREE.MathUtils.degToRad(rollDeg);
      const targetRotY = THREE.MathUtils.degToRad(yawDeg);

      uavRootRef.current.rotation.x = THREE.MathUtils.lerp(uavRootRef.current.rotation.x, targetRotX, 0.12);
      uavRootRef.current.rotation.z = THREE.MathUtils.lerp(uavRootRef.current.rotation.z, targetRotZ, 0.12);
      uavRootRef.current.rotation.y = THREE.MathUtils.lerp(uavRootRef.current.rotation.y, targetRotY, 0.1);
    }

    // 6. Dynamic Aerodynamic Control Surface Deflections
    const aileronDeflect = THREE.MathUtils.degToRad(rollDeg * 2.5);
    if (rightAileronRef.current) rightAileronRef.current.rotation.x = -aileronDeflect;
    if (leftAileronRef.current) leftAileronRef.current.rotation.x = aileronDeflect;

    const ruddervatorDeflect = THREE.MathUtils.degToRad(pitchDeg * 1.5 + yawDeg * 1.2);
    if (rightRuddervatorRef.current) rightRuddervatorRef.current.rotation.x = ruddervatorDeflect;
    if (leftRuddervatorRef.current) leftRuddervatorRef.current.rotation.x = ruddervatorDeflect;

    // 7. Smooth Landing Gear Retraction & Extension
    gearExtensionRef.current = THREE.MathUtils.lerp(gearExtensionRef.current, gearTarget, 0.08);
    const ext = gearExtensionRef.current;
    const gearRetractedAngle = (1.0 - ext) * (Math.PI / 2.15);

    if (noseGearRef.current) {
      noseGearRef.current.rotation.x = gearRetractedAngle;
      noseGearRef.current.position.y = -0.7 + (1.0 - ext) * 0.45;
      noseGearRef.current.scale.set(1, Math.max(0.1, ext), 1);
    }
    if (rightMainGearRef.current) {
      rightMainGearRef.current.rotation.z = -gearRetractedAngle;
      rightMainGearRef.current.position.y = -0.7 + (1.0 - ext) * 0.45;
      rightMainGearRef.current.scale.set(1, Math.max(0.1, ext), 1);
    }
    if (leftMainGearRef.current) {
      leftMainGearRef.current.rotation.z = gearRetractedAngle;
      leftMainGearRef.current.position.y = -0.7 + (1.0 - ext) * 0.45;
      leftMainGearRef.current.scale.set(1, Math.max(0.1, ext), 1);
    }

    // 8. Dynamic Wingtip Vortex Ribbon Opacity
    if (leftVortexRef.current && rightVortexRef.current) {
      const vOpacity = THREE.MathUtils.lerp(leftVortexRef.current.material.opacity, vortexIntensity, 0.15);
      leftVortexRef.current.material.opacity = vOpacity;
      rightVortexRef.current.material.opacity = vOpacity;
      leftVortexRef.current.visible = vOpacity > 0.02;
      rightVortexRef.current.visible = vOpacity > 0.02;
    }

    // 9. Pusher Propeller Slipstream & Thrust Animation
    if (slipstreamRef.current) {
      if (rpm > 400) {
        slipstreamRef.current.visible = true;
        slipstreamRef.current.scale.set(
          slipstreamScale,
          slipstreamScale,
          slipstreamScale * (1 + Math.sin(state.clock.elapsedTime * 18) * 0.1)
        );
      } else {
        slipstreamRef.current.visible = false;
      }
    }

    // 10. Touchdown Smoke Puff Particle Burst
    const smokeAge = smokeTimerRef.current;
    if (smokeAge < 1.6) {
      const sProgress = smokeAge / 1.6;
      const sScale = 0.2 + sProgress * 2.6;
      const sOpacity = Math.max(0, (1.0 - sProgress) * 0.75);

      if (leftSmokeRef.current) {
        leftSmokeRef.current.visible = true;
        leftSmokeRef.current.scale.set(sScale, sScale * 0.7, sScale);
        leftSmokeRef.current.position.z = 0.2 - sProgress * 0.6;
        leftSmokeRef.current.position.y = -1.25 + sProgress * 0.35;
        leftSmokeRef.current.material.opacity = sOpacity;
      }
      if (rightSmokeRef.current) {
        rightSmokeRef.current.visible = true;
        rightSmokeRef.current.scale.set(sScale, sScale * 0.7, sScale);
        rightSmokeRef.current.position.z = 0.2 - sProgress * 0.6;
        rightSmokeRef.current.position.y = -1.25 + sProgress * 0.35;
        rightSmokeRef.current.material.opacity = sOpacity;
      }
    } else {
      if (leftSmokeRef.current) leftSmokeRef.current.visible = false;
      if (rightSmokeRef.current) rightSmokeRef.current.visible = false;
    }

    // 11. Report Flight Telemetry to Parent Callback
    const now = performance.now();
    if (onFlightTelemetryUpdate && now - lastReportTimeRef.current > 90) {
      lastReportTimeRef.current = now;
      let gearState = 'TRANSIT';
      if (ext > 0.95) gearState = 'DOWN & LOCKED';
      else if (ext < 0.05) gearState = 'RETRACTED';

      onFlightTelemetryUpdate({
        phase: currentPhase,
        phaseLabel: currentPhaseLabel,
        altitudeM,
        airspeedKts,
        pitchDeg,
        gearState
      });
    }
  });

  if (isEngineOnly) {
    return (
      <PistonEngine3D
        telemetry={telemetry}
        health={health}
        fault={fault}
        activeFaults={activeFaults}
      />
    );
  }

  // Exploded View Disassembly Offsets
  const expY = explodedFactor * 1.5;
  const expWingX = explodedFactor * 2.8;
  const expAftZ = -explodedFactor * 2.2;
  const expGearY = -explodedFactor * 1.2;
  const expFlirY = -explodedFactor * 1.4;

  return (
    <group position={[0, 0, 0]}>
      {/* ========================================================================= */}
      {/* 3D UAV ROOT HIERARCHY (Animated Position, Pitch, Roll & Exploded Offsets) */}
      {/* ========================================================================= */}
      <group ref={uavRootRef} position={[0, 1.35, 0]}>
        {/* 1. MAIN FUSELAGE ASSEMBLY */}
        {/* Forward Nose & SATCOM Bulb */}
        <mesh
          position={[0, 0.4 + expY * 0.6, 3.6]}
          rotation={[Math.PI / 16, 0, 0]}
          onClick={() => onSelectPart && onSelectPart('airframe')}
        >
          <sphereGeometry args={[0.9, 32, 24]} />
          <meshStandardMaterial
            color={isThermal ? '#38bdf8' : (isCutaway ? '#38bdf8' : (isFlirIr ? '#27272a' : '#e0f2fe'))}
            metalness={0.6}
            roughness={0.2}
            transparent={isTransparent}
            opacity={airframeOpacity}
            wireframe={isWireframe || (isCutaway && selectedPart === 'airframe')}
          />
        </mesh>

        {/* Pitot Probe Warning Tip */}
        <mesh position={[0, 0.4 + expY * 0.6, 4.45]} rotation={[Math.PI / 16, 0, 0]}>
          <coneGeometry args={[0.25, 0.6, 24]} />
          <meshStandardMaterial
            color={isFlirIr ? '#52525b' : '#f97316'}
            metalness={0.8}
            roughness={0.2}
            wireframe={isWireframe}
          />
        </mesh>

        {/* Center Fuselage Cabin */}
        <mesh
          position={[0, 0.2 + expY * 0.4, 1.2]}
          rotation={[Math.PI / 2, 0, 0]}
          onClick={() => onSelectPart && onSelectPart('airframe')}
        >
          <cylinderGeometry args={[0.85, 0.95, 3.8, 32]} />
          <meshStandardMaterial
            color={airframeColor}
            metalness={0.7}
            roughness={0.25}
            transparent={isTransparent}
            opacity={airframeOpacity}
            wireframe={isWireframe || (isCutaway && selectedPart === 'airframe')}
          />
        </mesh>

        {/* Fuselage Dorsal Racing Stripe */}
        {!isWireframe && !isFlirIr && (
          <mesh position={[0, 1.05 + expY * 0.7, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
            <boxGeometry args={[0.18, 3.7, 0.05]} />
            <meshStandardMaterial
              color="#facc15"
              emissive="#ca8a04"
              emissiveIntensity={0.3}
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
        )}

        {/* Fuselage Flank Stripes */}
        {!isWireframe && !isFlirIr && (
          <>
            <mesh position={[0.88, 0.2 + expY * 0.4, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
              <boxGeometry args={[0.06, 3.6, 0.12]} />
              <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[-0.88, 0.2 + expY * 0.4, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
              <boxGeometry args={[0.06, 3.6, 0.12]} />
              <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.4} />
            </mesh>
          </>
        )}

        {/* Aft Fuselage (Engine Nacelle Cowling with Semi-Transparent Inspection View) */}
        <mesh
          position={[0, 0.25 + expY * 0.5, -1.8]}
          rotation={[Math.PI / 2, 0, 0]}
          onClick={() => onSelectPart && onSelectPart('engine_bay')}
        >
          <cylinderGeometry args={[0.70, 0.88, 2.6, 32]} />
          <meshStandardMaterial
            color={engineColor}
            metalness={0.8}
            roughness={0.2}
            transparent={true}
            opacity={isCutaway ? 0.2 : (selectedPart === 'engine_bay' ? 0.35 : 0.65)}
            wireframe={isWireframe}
            emissive={isThermal && cht > 165 ? '#7f1d1d' : '#000000'}
            emissiveIntensity={isThermal && cht > 165 ? 0.8 : 0}
          />
        </mesh>

        {/* Engine Bay Top Transparent Inspection Canopy (Reveals internal Rotax 914/915 powerplant) */}
        <mesh position={[0, 1.02 + expY * 0.55, -1.8]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.95, 2.3, 0.08]} />
          <meshStandardMaterial
            color="#38bdf8"
            metalness={0.9}
            roughness={0.1}
            transparent={true}
            opacity={0.35}
          />
        </mesh>
        {/* Inspection Canopy Gold-Anodized Perimeter Frame */}
        <mesh position={[0, 1.05 + expY * 0.55, -1.8]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[1.02, 2.38, 0.05]} />
          <meshStandardMaterial color="#facc15" metalness={0.8} roughness={0.25} wireframe={true} />
        </mesh>

        {/* Tactical Roundels */}
        {!isCutaway && !isWireframe && !isFlirIr && (
          <>
            <mesh position={[0.89, 0.35 + expY * 0.4, 1.2]} rotation={[0, Math.PI / 2, 0]}>
              <circleGeometry args={[0.28, 32]} />
              <meshStandardMaterial color="#ff7722" emissive="#ff7722" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[0.90, 0.35 + expY * 0.4, 1.2]} rotation={[0, Math.PI / 2, 0]}>
              <circleGeometry args={[0.19, 32]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.91, 0.35 + expY * 0.4, 1.2]} rotation={[0, Math.PI / 2, 0]}>
              <circleGeometry args={[0.10, 32]} />
              <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[-0.89, 0.35 + expY * 0.4, 1.2]} rotation={[0, -Math.PI / 2, 0]}>
              <circleGeometry args={[0.28, 32]} />
              <meshStandardMaterial color="#ff7722" emissive="#ff7722" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[-0.90, 0.35 + expY * 0.4, 1.2]} rotation={[0, -Math.PI / 2, 0]}>
              <circleGeometry args={[0.19, 32]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[-0.91, 0.35 + expY * 0.4, 1.2]} rotation={[0, -Math.PI / 2, 0]}>
              <circleGeometry args={[0.10, 32]} />
              <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.2} />
            </mesh>
          </>
        )}

        {/* 2. HIGH ASPECT-RATIO MAIN WINGS & DYNAMIC AILERONS */}
        {/* Right Wing Assembly */}
        <group position={[expWingX, 0.35 + expY * 0.3, 0.6]}>
          <mesh position={[4.25, 0, 0]} onClick={() => onSelectPart && onSelectPart('airframe')}>
            <boxGeometry args={[8.5, 0.12, 1.1]} />
            <meshStandardMaterial
              color={airframeColor}
              metalness={0.7}
              roughness={0.25}
              transparent={isTransparent}
              opacity={airframeOpacity}
              wireframe={isWireframe}
            />
          </mesh>

          {/* Leading Edge De-Icing Boot */}
          <mesh position={[4.25, 0, 0.54]}>
            <boxGeometry args={[8.5, 0.13, 0.08]} />
            <meshStandardMaterial
              color={isFlirIr ? '#71717a' : (isThermal ? '#f59e0b' : '#ea580c')}
              metalness={0.8}
              roughness={0.2}
              wireframe={isWireframe}
            />
          </mesh>

          {/* Dynamic Right Aileron */}
          <group position={[4.5, 0, -0.45]} ref={rightAileronRef}>
            <mesh position={[0, 0.065, 0]}>
              <boxGeometry args={[6.5, 0.02, 0.18]} />
              <meshStandardMaterial
                color={isFlirIr ? '#a1a1aa' : '#38bdf8'}
                metalness={0.5}
                roughness={0.3}
                wireframe={isWireframe}
              />
            </mesh>
          </group>

          {/* Right Warning Band */}
          <mesh position={[7.0, 0.13, 0]} rotation={[0, 0, 0.04]}>
            <boxGeometry args={[0.5, 0.13, 1.12]} />
            <meshStandardMaterial
              color="#facc15"
              emissive="#ca8a04"
              emissiveIntensity={0.4}
              wireframe={isWireframe}
            />
          </mesh>

          {/* Winglet & Green Navigation Strobe */}
          <mesh position={[8.5, 0.45, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.7, 0.08, 0.7]} />
            <meshStandardMaterial
              color="#f59e0b"
              emissive="#d97706"
              emissiveIntensity={0.4}
              metalness={0.8}
              roughness={0.2}
              wireframe={isWireframe}
            />
          </mesh>
          <mesh position={[8.7, 0.7, 0]} ref={strobeRef}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={3.5} />
          </mesh>

          {/* Wingtip Vortex Contrail */}
          <mesh ref={rightVortexRef} position={[8.65, 0.45, -2.0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.08, 4.0, 12]} />
            <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={0.8} transparent opacity={0} />
          </mesh>
        </group>

        {/* Left Wing Assembly */}
        <group position={[-expWingX, 0.35 + expY * 0.3, 0.6]}>
          <mesh position={[-4.25, 0, 0]} onClick={() => onSelectPart && onSelectPart('airframe')}>
            <boxGeometry args={[8.5, 0.12, 1.1]} />
            <meshStandardMaterial
              color={airframeColor}
              metalness={0.7}
              roughness={0.25}
              transparent={isTransparent}
              opacity={airframeOpacity}
              wireframe={isWireframe}
            />
          </mesh>

          {/* Leading Edge De-Icing Boot */}
          <mesh position={[-4.25, 0, 0.54]}>
            <boxGeometry args={[8.5, 0.13, 0.08]} />
            <meshStandardMaterial
              color={isFlirIr ? '#71717a' : (isThermal ? '#f59e0b' : '#ea580c')}
              metalness={0.8}
              roughness={0.2}
              wireframe={isWireframe}
            />
          </mesh>

          {/* Dynamic Left Aileron */}
          <group position={[-4.5, 0, -0.45]} ref={leftAileronRef}>
            <mesh position={[0, 0.065, 0]}>
              <boxGeometry args={[6.5, 0.02, 0.18]} />
              <meshStandardMaterial
                color={isFlirIr ? '#a1a1aa' : '#38bdf8'}
                metalness={0.5}
                roughness={0.3}
                wireframe={isWireframe}
              />
            </mesh>
          </group>

          {/* Left Warning Band */}
          <mesh position={[-7.0, 0.13, 0]} rotation={[0, 0, -0.04]}>
            <boxGeometry args={[0.5, 0.13, 1.12]} />
            <meshStandardMaterial
              color="#facc15"
              emissive="#ca8a04"
              emissiveIntensity={0.4}
              wireframe={isWireframe}
            />
          </mesh>

          {/* Winglet & Red Navigation Strobe */}
          <mesh position={[-8.5, 0.45, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.7, 0.08, 0.7]} />
            <meshStandardMaterial
              color="#f59e0b"
              emissive="#d97706"
              emissiveIntensity={0.4}
              metalness={0.8}
              roughness={0.2}
              wireframe={isWireframe}
            />
          </mesh>
          <mesh position={[-8.7, 0.7, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3.5} />
          </mesh>

          {/* Wingtip Vortex Contrail */}
          <mesh ref={leftVortexRef} position={[-8.65, 0.45, -2.0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.08, 4.0, 12]} />
            <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={0.8} transparent opacity={0} />
          </mesh>
        </group>

        {/* 3. V-TAIL EMPENNAGE & DYNAMIC RUDDERVATORS */}
        <group position={[0, 0.3 + expY * 0.4, -3.1 + expAftZ * 0.7]}>
          {/* Right V-Fin */}
          <group ref={rightRuddervatorRef} position={[0.7, 0.85, 0]}>
            <mesh rotation={[0.1, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.1, 1.8, 0.8]} />
              <meshStandardMaterial
                color={airframeColor}
                metalness={0.75}
                roughness={0.25}
                wireframe={isWireframe}
              />
            </mesh>
          </group>
          <mesh position={[1.3, 1.45, 0.02]} rotation={[0.1, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.11, 0.35, 0.78]} />
            <meshStandardMaterial
              color="#facc15"
              emissive="#eab308"
              emissiveIntensity={0.5}
              wireframe={isWireframe}
            />
          </mesh>

          {/* Left V-Fin */}
          <group ref={leftRuddervatorRef} position={[-0.7, 0.85, 0]}>
            <mesh rotation={[0.1, 0, Math.PI / 4]}>
              <boxGeometry args={[0.1, 1.8, 0.8]} />
              <meshStandardMaterial
                color={airframeColor}
                metalness={0.75}
                roughness={0.25}
                wireframe={isWireframe}
              />
            </mesh>
          </group>
          <mesh position={[-1.3, 1.45, 0.02]} rotation={[0.1, 0, Math.PI / 4]}>
            <boxGeometry args={[0.11, 0.35, 0.78]} />
            <meshStandardMaterial
              color="#facc15"
              emissive="#eab308"
              emissiveIntensity={0.5}
              wireframe={isWireframe}
            />
          </mesh>

          {/* Ventral Skid Fin */}
          <mesh position={[0, -0.65, 0.2]} rotation={[-0.1, 0, 0]}>
            <boxGeometry args={[0.08, 0.8, 0.7]} />
            <meshStandardMaterial
              color={isFlirIr ? '#71717a' : '#ef4444'}
              metalness={0.7}
              roughness={0.3}
              wireframe={isWireframe}
            />
          </mesh>
        </group>

        {/* 4. GIMBALED FLIR SENSOR TURRET */}
        <group position={[0, -0.55 + expFlirY, 3.2]} ref={flirRef}>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.3, 0.35, 0.2, 24]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} wireframe={isWireframe} />
          </mesh>
          <mesh position={[0, -0.15, 0]}>
            <sphereGeometry args={[0.32, 24, 24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.2} wireframe={isWireframe} />
          </mesh>
          {/* Dual Electro-Optical Lenses */}
          <mesh position={[0.08, -0.15, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} />
            <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[-0.08, -0.15, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.1, 16]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
          </mesh>
        </group>

        {/* 5. RETRACTABLE TRICYCLE LANDING GEAR */}
        <group ref={noseGearRef} position={[0, -0.7 + expGearY, 3.0]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.8, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.1} wireframe={isWireframe} />
          </mesh>
          <mesh position={[0, -0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.18, 0.18, 0.12, 20]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
        </group>

        <group ref={rightMainGearRef} position={[0.75, -0.7 + expGearY, 0.2]}>
          <mesh position={[0, 0, 0]} rotation={[0, 0, -0.1]}>
            <cylinderGeometry args={[0.05, 0.05, 0.9, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.1} wireframe={isWireframe} />
          </mesh>
          <mesh position={[0.15, -0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.14, 20]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
        </group>

        <group ref={leftMainGearRef} position={[-0.75, -0.7 + expGearY, 0.2]}>
          <mesh position={[0, 0, 0]} rotation={[0, 0, 0.1]}>
            <cylinderGeometry args={[0.05, 0.05, 0.9, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.1} wireframe={isWireframe} />
          </mesh>
          <mesh position={[-0.15, -0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.14, 20]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
        </group>

        {/* 6. INTERNAL ROTAX 914/915 TURBO DIGITAL TWIN */}
        <group position={[0, 0.22, -1.6 + expAftZ * 0.4]} scale={[0.58, 0.58, 0.58]}>
          <PistonEngine3D
            telemetry={telemetry}
            health={health}
            fault={fault}
            activeFaults={activeFaults}
            isEngineRunning={rpm >= 500}
          />
        </group>

        {/* 7. PUSHER PROPELLER & THRUST CONE */}
        <group position={[0, 0.22, -3.2 + expAftZ]} ref={propRef}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.22, 0.45, 24]} />
            <meshStandardMaterial
              color="#f59e0b"
              metalness={0.92}
              roughness={0.15}
              emissive="#b45309"
              emissiveIntensity={0.3}
              wireframe={isWireframe}
            />
          </mesh>

          {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, idx) => (
            <group key={idx} rotation={[0, 0, angle]}>
              <mesh position={[0, 0.95, -0.05]} rotation={[0.25, 0, 0]}>
                <boxGeometry args={[0.12, 1.4, 0.03]} />
                <meshStandardMaterial
                  color={getPropellerColor()}
                  metalness={0.85}
                  roughness={0.2}
                  wireframe={isWireframe}
                />
              </mesh>
              <mesh position={[0, 1.6, -0.05]} rotation={[0.25, 0, 0]}>
                <boxGeometry args={[0.125, 0.15, 0.032]} />
                <meshStandardMaterial
                  color="#facc15"
                  emissive="#facc15"
                  emissiveIntensity={0.6}
                  wireframe={isWireframe}
                />
              </mesh>
            </group>
          ))}
        </group>

        {/* Engine Thrust / Slipstream Streamline Cone */}
        <group ref={slipstreamRef} position={[0, 0.22, -3.6 + expAftZ]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.65, 2.2, 16, 1, true]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#0284c7"
              emissiveIntensity={0.4}
              transparent
              opacity={0.18}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* 8. DORSAL NACA ENGINE AIR SCOOP */}
        <mesh position={[0, 0.85 + expY * 0.5, -0.8]} rotation={[-Math.PI / 10, 0, 0]}>
          <boxGeometry args={[0.5, 0.25, 0.9]} />
          <meshStandardMaterial color="#0284c7" metalness={0.85} roughness={0.2} wireframe={isWireframe} />
        </mesh>

        {/* ========================================================================= */}
        {/* 9. INTERACTIVE 3D SENSOR HOTSPOTS (Clickable with Live Drei Html Telemetry) */}
        {/* ========================================================================= */}
        {showSensors && (
          <group>
            {/* Sensor 1: Cylinder Head 1 CHT */}
            <SensorHotspot
              position={[-0.9, 0.35, -1.3]}
              id="cht_cyl1"
              name="CYL 1 CHT"
              value={cht.toFixed(1)}
              unit="°C"
              status={cht > 180 ? 'critical' : (cht > 165 ? 'warning' : 'nominal')}
              isSelected={selectedPart === 'cylinders'}
              onClick={onSelectPart}
            />

            {/* Sensor 2: Cylinder Head 2 CHT */}
            <SensorHotspot
              position={[0.9, 0.35, -1.3]}
              id="cht_cyl2"
              name="CYL 2 CHT"
              value={(cht + 1.2).toFixed(1)}
              unit="°C"
              status={cht > 180 ? 'critical' : (cht > 165 ? 'warning' : 'nominal')}
              isSelected={selectedPart === 'cylinders'}
              onClick={onSelectPart}
            />

            {/* Sensor 3: Turbocharger MAP & Turbine */}
            <SensorHotspot
              position={[0, 0.65, -2.3]}
              id="turbo_map"
              name="TURBO MAP BOOST"
              value="38.5"
              unit="inHg"
              status="nominal"
              isSelected={selectedPart === 'turbocharger'}
              onClick={onSelectPart}
            />

            {/* Sensor 4: Oil Sump Pressure */}
            <SensorHotspot
              position={[0, -0.25, -1.6]}
              id="oil_pressure"
              name="OIL PRESSURE"
              value={oilPressure.toFixed(1)}
              unit="bar"
              status={oilPressure < 2.5 ? 'critical' : (oilPressure < 3.2 ? 'warning' : 'nominal')}
              isSelected={selectedPart === 'lubrication'}
              onClick={onSelectPart}
            />

            {/* Sensor 5: Pusher Propeller Torque */}
            <SensorHotspot
              position={[0, 0.45, -3.1]}
              id="prop_rpm"
              name="PUSHER SHAFT"
              value={Math.round(rpm / 2.43)}
              unit="RPM"
              status="nominal"
              isSelected={selectedPart === 'propeller'}
              onClick={onSelectPart}
            />

            {/* Sensor 6: Forward Avionics & FADEC Bus */}
            <SensorHotspot
              position={[0, 0.85, 1.8]}
              id="avionics_bus"
              name="FADEC 28V BUS"
              value={(telemetry?.battery_voltage || 28.1).toFixed(1)}
              unit="V DC"
              status="nominal"
              isSelected={selectedPart === 'sensors'}
              onClick={onSelectPart}
            />

            {/* Sensor 7: Belly FLIR Camera Gimbal */}
            <SensorHotspot
              position={[0, -0.65, 3.2]}
              id="flir_sensor"
              name="FLIR EO/IR"
              value="AZ: 14° EL: -8°"
              unit=""
              status="nominal"
              isSelected={selectedPart === 'flir_turret'}
              onClick={onSelectPart}
            />

            {/* Sensor 8: SATCOM Dorsal Radome */}
            <SensorHotspot
              position={[0, 1.15, 3.4]}
              id="satcom_link"
              name="SATCOM LINK"
              value="-64.2"
              unit="dBm"
              status="nominal"
              isSelected={selectedPart === 'airframe'}
              onClick={onSelectPart}
            />
          </group>
        )}
      </group>

      {/* ========================================================================= */}
      {/* GROUND LEVEL INFRASTRUCTURE: RUNWAY, TOUCHDOWN SMOKE & TACTICAL GRID */}
      {/* ========================================================================= */}
      <group position={[0, -1.33, 0]}>
        {/* Main Asphalt Runway Surface */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[7.2, 52]} />
          <meshStandardMaterial
            color={visionEnvironment === 'NIGHT' ? '#080c14' : '#0f172a'}
            roughness={0.88}
            metalness={0.15}
          />
        </mesh>

        {/* Runway Threshold Stripes - Forward End */}
        <group position={[0, 0.005, 22]}>
          {[-2.5, -1.8, -1.1, -0.4, 0.4, 1.1, 1.8, 2.5].map((xPos, idx) => (
            <mesh key={`thresh-fwd-${idx}`} position={[xPos, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.35, 3.2]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.5} />
            </mesh>
          ))}
        </group>

        {/* Runway Threshold Stripes - Aft End */}
        <group position={[0, 0.005, -22]}>
          {[-2.5, -1.8, -1.1, -0.4, 0.4, 1.1, 1.8, 2.5].map((xPos, idx) => (
            <mesh key={`thresh-aft-${idx}`} position={[xPos, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.35, 3.2]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.5} />
            </mesh>
          ))}
        </group>

        {/* Yellow Dashed Centerline Stripes */}
        {[-18, -14, -10, -6, -2, 2, 6, 10, 14, 18].map((zPos, idx) => (
          <mesh key={`centerline-${idx}`} position={[0, 0.005, zPos]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.22, 2.2]} />
            <meshStandardMaterial
              color="#facc15"
              emissive="#ca8a04"
              emissiveIntensity={visionEnvironment === 'NIGHT' ? 0.6 : 0.25}
            />
          </mesh>
        ))}

        {/* White Edge Demarcation Lines */}
        <mesh position={[3.2, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.12, 50]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
        <mesh position={[-3.2, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.12, 50]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>

        {/* Runway Edge Illuminated Light Beacons */}
        {[-22, -15, -8, 0, 8, 15, 22].map((zPos, idx) => (
          <React.Fragment key={`lights-${idx}`}>
            <mesh position={[3.45, 0.1, zPos]}>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshStandardMaterial
                color={Math.abs(zPos) === 22 ? '#10b981' : '#facc15'}
                emissive={Math.abs(zPos) === 22 ? '#10b981' : '#facc15'}
                emissiveIntensity={visionEnvironment === 'NIGHT' ? 4.5 : 2.5}
              />
            </mesh>
            <mesh position={[-3.45, 0.1, zPos]}>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshStandardMaterial
                color={Math.abs(zPos) === 22 ? '#10b981' : '#facc15'}
                emissive={Math.abs(zPos) === 22 ? '#10b981' : '#facc15'}
                emissiveIntensity={visionEnvironment === 'NIGHT' ? 4.5 : 2.5}
              />
            </mesh>
          </React.Fragment>
        ))}
      </group>

      {/* Dynamic Touchdown Tire Smoke Puffs */}
      <mesh ref={leftSmokeRef} position={[-0.9, -1.25, 0.2]} visible={false}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#e2e8f0" transparent opacity={0.6} roughness={1.0} />
      </mesh>

      <mesh ref={rightSmokeRef} position={[0.9, -1.25, 0.2]} visible={false}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#e2e8f0" transparent opacity={0.6} roughness={1.0} />
      </mesh>

      {/* Tactical Ground Reference Grid */}
      {showGrid && (
        <Grid
          position={[0, -1.35, 0]}
          args={[34, 34]}
          cellSize={0.7}
          cellThickness={0.75}
          cellColor={visionEnvironment === 'NIGHT' ? '#0f172a' : '#1e293b'}
          sectionSize={2.8}
          sectionThickness={1.25}
          sectionColor={visionEnvironment === 'FLIR_IR' ? '#52525b' : '#0ea5e9'}
          fadeDistance={38}
        />
      )}
    </group>
  );
}
