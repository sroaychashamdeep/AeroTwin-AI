/**
 * AEROTWIN AI - High-Fidelity 3D MALE UAV Airframe & Engine Digital Twin
 * TAPAS-BH-201 / Predator MQ-1 Class Tactical Airframe with Integrated Powerplant
 * Includes Full Takeoff, Landing, Airborne Cruise, and Ground Rollout Visual Dynamics,
 * 3D Tactical Runway, Animated Retractable Landing Gear, Propeller Slipstream,
 * Wingtip Vortex Contrails, and Touchdown Smoke Burst Effects.
 */

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Grid } from '@react-three/drei';
import * as THREE from 'three';
import PistonEngine3D from './PistonEngine3D';
import { soundFx } from '../utils/soundFx';

export default function MaleUav3D({
  telemetry,
  health,
  fault,
  activeFaults,
  viewMode = 'XRAY_CUTAWAY', // 'FULL_UAV', 'XRAY_CUTAWAY', 'ENGINE_ONLY'
  selectedPart = 'all',
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

  const rpm = telemetry?.rpm || 4800;
  const isCutaway = viewMode === 'XRAY_CUTAWAY';
  const isEngineOnly = viewMode === 'ENGINE_ONLY';

  // Vibrant & Colorful Aerospace Livery Materials
  const airframeColor = isCutaway ? '#0284c7' : '#1e3a8a';
  const airframeOpacity = isCutaway ? 0.35 : 1.0;
  const isTransparent = isCutaway;

  // Real-time Flight Dynamics & Animation Engine
  useFrame((state, delta) => {
    // 1. Propeller spinning synchronized with real engine RPM
    if (propRef.current) {
      let speedMult = 1.5;
      if (currentModeRef.current === 'TAKEOFF') speedMult = 2.2;
      if (currentModeRef.current === 'GROUND') speedMult = 0.5;
      const propSpeed = (rpm / 60) * Math.PI * speedMult * delta;
      propRef.current.rotation.z += propSpeed;
    }

    // 2. FLIR turret gentle surveillance pan
    if (flirRef.current) {
      flirRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.45;
    }

    // 3. Wingtip anti-collision strobe flashing
    strobeTimer.current += delta;
    if (strobeRef.current) {
      const flash = Math.sin(strobeTimer.current * 8) > 0.6;
      strobeRef.current.intensity = flash ? 3.0 : 0.2;
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
    let uavY = 1.35; // Default cruise altitude offset above ground
    let uavZ = 0.0;
    let pitchDeg = 0.0;
    let rollDeg = 0.0;
    let yawDeg = 0.0;
    let gearTarget = 0.0; // 0.0 = retracted, 1.0 = down & locked
    let altitudeM = 1200;
    let airspeedKts = 142;
    let currentPhase = 'CRUISE';
    let currentPhaseLabel = 'AIRBORNE CRUISE';
    let vortexIntensity = 0.0;
    let slipstreamScale = 1.0;

    if (activeSubMode === 'GROUND') {
      // Parked / Taxiing on runway
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
      // Realistic 8-second Takeoff Profile
      if (t < 2.8) {
        // Phase 1: Takeoff Roll Acceleration along runway
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
        // Phase 2: Rotation & Liftoff (Nose-Up Climb)
        const prog = (t - 2.8) / 2.4;
        uavY = prog * 0.85;
        uavZ = -2.0 - prog * 1.5;
        pitchDeg = prog * 13.5; // Rotate nose up +13.5°
        rollDeg = Math.sin(prog * Math.PI) * 1.2;
        gearTarget = Math.max(0.0, 1.0 - prog * 1.4);
        altitudeM = prog * 420;
        airspeedKts = 75 + prog * 40;
        currentPhase = 'ROTATING';
        currentPhaseLabel = 'ROTATION & LIFTOFF (+13.5°)';
        vortexIntensity = 0.9;
        slipstreamScale = 1.6;
      } else if (t < 8.2) {
        // Phase 3: Climb-out & Transition to Cruise
        const prog = (t - 5.2) / 3.0;
        uavY = 0.85 + prog * 0.5;
        uavZ = -3.5 + prog * 3.5;
        pitchDeg = 13.5 - prog * 12.5; // Level off towards cruise pitch
        rollDeg = Math.sin(prog * Math.PI * 1.5) * 1.0;
        gearTarget = 0.0;
        altitudeM = 420 + prog * 780;
        airspeedKts = 115 + prog * 27;
        currentPhase = 'CLIMB';
        currentPhaseLabel = 'CLIMB-OUT TO FL120';
        vortexIntensity = (1.0 - prog) * 0.6;
        slipstreamScale = 1.2;
      } else {
        // Transition to steady cruise
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
      // Realistic 9-second Glideslope Approach & Landing Profile
      if (t < 3.4) {
        // Phase 1: Glideslope Descent with gear extension
        const prog = t / 3.4;
        uavY = 1.35 - prog * 1.23;
        uavZ = -2.0 + prog * 2.0;
        pitchDeg = -4.2 + Math.sin(prog * Math.PI) * 0.4; // -4.2° pitch down glide
        rollDeg = Math.sin(prog * 3.0) * 1.2;
        gearTarget = Math.min(1.0, prog * 2.2); // Gear extending down
        altitudeM = Math.max(20, 1200 - prog * 1150);
        airspeedKts = 142 - prog * 68;
        currentPhase = 'DESCENT';
        currentPhaseLabel = 'GLIDESLOPE APPROACH (-4.2°)';
        vortexIntensity = 0.15;
        slipstreamScale = 0.7;
      } else if (t < 4.8) {
        // Phase 2: Flare and Touchdown impact
        const prog = (t - 3.4) / 1.4;
        uavY = Math.max(0.0, 0.12 * (1.0 - prog));
        uavZ = prog * 0.8;
        pitchDeg = -4.2 + prog * 10.2; // Flare nose-up to +6°
        rollDeg = 0.0;
        gearTarget = 1.0;
        altitudeM = Math.max(0, Math.round((1.0 - prog) * 20));
        airspeedKts = 74 - prog * 12;
        currentPhase = 'FLARE';
        currentPhaseLabel = 'FLARE & TOUCHDOWN';
        vortexIntensity = 0.0;
        slipstreamScale = 0.8;

        // Trigger Touchdown Smoke & Screech Audio Cue
        if (prog >= 0.55 && !touchdownTriggeredRef.current) {
          touchdownTriggeredRef.current = true;
          smokeTimerRef.current = 0.0;
          soundFx.playTouchdownScreech();
        }
      } else if (t < 7.8) {
        // Phase 3: Rollout Deceleration on Runway
        const prog = (t - 4.8) / 3.0;
        uavY = 0.0;
        uavZ = 0.8 - prog * 0.8;
        pitchDeg = 6.0 * (1.0 - prog); // Nose settles down onto runway
        rollDeg = 0.0;
        gearTarget = 1.0;
        altitudeM = 0;
        airspeedKts = Math.max(0, 62 * (1.0 - prog) + 6);
        currentPhase = 'ROLLOUT';
        currentPhaseLabel = 'BRAKING ROLLOUT';
        vortexIntensity = 0.0;
        slipstreamScale = 0.5;
      } else {
        // Phase 4: Ground Taxi Stop
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
      // Steady Cruise State (CRUISE)
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
      // Smooth interpolation to avoid jitter
      uavRootRef.current.position.y = THREE.MathUtils.lerp(uavRootRef.current.position.y, uavY, 0.12);
      uavRootRef.current.position.z = THREE.MathUtils.lerp(uavRootRef.current.position.z, uavZ, 0.1);

      // Pitch is rotation around X (-pitch for nose up in standard camera coordinates)
      const targetRotX = -THREE.MathUtils.degToRad(pitchDeg);
      const targetRotZ = THREE.MathUtils.degToRad(rollDeg);
      const targetRotY = THREE.MathUtils.degToRad(yawDeg);

      uavRootRef.current.rotation.x = THREE.MathUtils.lerp(uavRootRef.current.rotation.x, targetRotX, 0.12);
      uavRootRef.current.rotation.z = THREE.MathUtils.lerp(uavRootRef.current.rotation.z, targetRotZ, 0.12);
      uavRootRef.current.rotation.y = THREE.MathUtils.lerp(uavRootRef.current.rotation.y, targetRotY, 0.1);
    }

    // 6. Smooth Landing Gear Retraction & Extension
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

    // 7. Dynamic Wingtip Vortex Ribbon Opacity
    if (leftVortexRef.current && rightVortexRef.current) {
      const vOpacity = THREE.MathUtils.lerp(leftVortexRef.current.material.opacity, vortexIntensity, 0.15);
      leftVortexRef.current.material.opacity = vOpacity;
      rightVortexRef.current.material.opacity = vOpacity;
      leftVortexRef.current.visible = vOpacity > 0.02;
      rightVortexRef.current.visible = vOpacity > 0.02;
    }

    // 8. Pusher Propeller Slipstream & Thrust Animation
    if (slipstreamRef.current) {
      slipstreamRef.current.scale.set(slipstreamScale, slipstreamScale, slipstreamScale * (1 + Math.sin(state.clock.elapsedTime * 18) * 0.1));
    }

    // 9. Touchdown Smoke Puff Particle Burst
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

    // 10. Report Flight Telemetry to Parent Callback (Throttled to ~10Hz)
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

  return (
    <group position={[0, 0, 0]}>
      {/* ========================================================================= */}
      {/* 3D UAV ROOT HIERARCHY (Animated Position, Pitch, Roll & Kinematics) */}
      {/* ========================================================================= */}
      <group ref={uavRootRef} position={[0, 1.35, 0]}>
        {/* 1. MAIN FUSELAGE ASSEMBLY */}
        {/* A. Forward Nose & SATCOM Radome Bulb (Clean Bright Cyan / White Contrast) */}
        <mesh position={[0, 0.4, 3.6]} rotation={[Math.PI / 16, 0, 0]}>
          <sphereGeometry args={[0.9, 32, 24]} />
          <meshStandardMaterial
            color={isCutaway ? '#38bdf8' : '#e0f2fe'}
            metalness={0.6}
            roughness={0.2}
            transparent={isTransparent}
            opacity={isCutaway ? 0.4 : 1.0}
            wireframe={isCutaway && selectedPart === 'airframe'}
          />
        </mesh>

        {/* Nose Cone Tip (Vibrant Orange / Amber Pitot Warning Section) */}
        <mesh position={[0, 0.4, 4.45]} rotation={[Math.PI / 16, 0, 0]}>
          <coneGeometry args={[0.25, 0.6, 24]} />
          <meshStandardMaterial color="#f97316" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* B. Center Fuselage Cabin (Vibrant Royal Blue with Crimson & Gold Racing Stripes) */}
        <mesh position={[0, 0.2, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.85, 0.95, 3.8, 32]} />
          <meshStandardMaterial
            color={airframeColor}
            metalness={0.7}
            roughness={0.25}
            transparent={isTransparent}
            opacity={airframeOpacity}
            wireframe={isCutaway && selectedPart === 'airframe'}
          />
        </mesh>

        {/* Fuselage Dorsal Racing Stripe (High-Visibility Gold / Yellow Accent) */}
        <mesh position={[0, 1.05, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.18, 3.7, 0.05]} />
          <meshStandardMaterial color="#facc15" emissive="#ca8a04" emissiveIntensity={0.3} metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Fuselage Flank Accent Stripes (Dual Crimson Red Stripes) */}
        <mesh position={[0.88, 0.2, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.06, 3.6, 0.12]} />
          <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[-0.88, 0.2, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.06, 3.6, 0.12]} />
          <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.4} />
        </mesh>

        {/* C. Aft Fuselage (Engine Nacelle Cowling - Deep Emerald / Sky Cyan Accent) */}
        <mesh position={[0, 0.25, -1.8]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.65, 0.85, 2.6, 32]} />
          <meshStandardMaterial
            color={isCutaway ? '#0ea5e9' : '#047857'}
            metalness={0.8}
            roughness={0.2}
            transparent={isTransparent}
            opacity={isCutaway ? 0.2 : 1.0}
            wireframe={isCutaway}
          />
        </mesh>

        {/* D. Tactical Markings: High-Contrast Tri-Color Roundel */}
        {!isCutaway && (
          <>
            {/* Right Flank Saffron-White-Green Roundel */}
            <mesh position={[0.89, 0.35, 1.2]} rotation={[0, Math.PI / 2, 0]}>
              <circleGeometry args={[0.28, 32]} />
              <meshStandardMaterial color="#ff7722" emissive="#ff7722" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[0.90, 0.35, 1.2]} rotation={[0, Math.PI / 2, 0]}>
              <circleGeometry args={[0.19, 32]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.91, 0.35, 1.2]} rotation={[0, Math.PI / 2, 0]}>
              <circleGeometry args={[0.10, 32]} />
              <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.2} />
            </mesh>

            {/* Left Flank Roundel */}
            <mesh position={[-0.89, 0.35, 1.2]} rotation={[0, -Math.PI / 2, 0]}>
              <circleGeometry args={[0.28, 32]} />
              <meshStandardMaterial color="#ff7722" emissive="#ff7722" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[-0.90, 0.35, 1.2]} rotation={[0, -Math.PI / 2, 0]}>
              <circleGeometry args={[0.19, 32]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[-0.91, 0.35, 1.2]} rotation={[0, -Math.PI / 2, 0]}>
              <circleGeometry args={[0.10, 32]} />
              <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.2} />
            </mesh>
          </>
        )}

        {/* 2. HIGH ASPECT-RATIO MAIN WINGS (21m SPAN WITH VIBRANT ACCENTS) */}
        <group position={[0, 0.35, 0.6]}>
          {/* Main Airfoil Wing (Aerospace Navy Blue Composite) */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[17.0, 0.12, 1.1]} />
            <meshStandardMaterial
              color={airframeColor}
              metalness={0.7}
              roughness={0.25}
              transparent={isTransparent}
              opacity={airframeOpacity}
            />
          </mesh>

          {/* Full-Span Leading-Edge De-Icing Boots (High-Vis Safety Orange) */}
          <mesh position={[0, 0, 0.54]}>
            <boxGeometry args={[17.0, 0.13, 0.08]} />
            <meshStandardMaterial color="#ea580c" metalness={0.8} roughness={0.2} />
          </mesh>

          {/* Wing Aileron / Flap Demarcation Trim Lines (Sky Blue Trim) */}
          <mesh position={[4.5, 0.065, -0.45]}>
            <boxGeometry args={[6.5, 0.02, 0.18]} />
            <meshStandardMaterial color="#38bdf8" metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh position={[-4.5, 0.065, -0.45]}>
            <boxGeometry args={[6.5, 0.02, 0.18]} />
            <meshStandardMaterial color="#38bdf8" metalness={0.5} roughness={0.3} />
          </mesh>

          {/* Right Wing Tactical Warning Band (High-Visibility Yellow) */}
          <mesh position={[7.0, 0.13, 0]} rotation={[0, 0, 0.04]}>
            <boxGeometry args={[0.5, 0.13, 1.12]} />
            <meshStandardMaterial color="#facc15" emissive="#ca8a04" emissiveIntensity={0.4} />
          </mesh>

          {/* Right Wingtip Winglet (Bright Amber Gold) */}
          <mesh position={[8.5, 0.45, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.7, 0.08, 0.7]} />
            <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={0.4} metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Right Wingtip Green Navigation Strobe */}
          <mesh position={[8.7, 0.7, 0]} ref={strobeRef}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={3.5} />
          </mesh>

          {/* Left Wing Tactical Warning Band (High-Visibility Yellow) */}
          <mesh position={[-7.0, 0.13, 0]} rotation={[0, 0, -0.04]}>
            <boxGeometry args={[0.5, 0.13, 1.12]} />
            <meshStandardMaterial color="#facc15" emissive="#ca8a04" emissiveIntensity={0.4} />
          </mesh>

          {/* Left Wingtip Winglet (Bright Amber Gold) */}
          <mesh position={[-8.5, 0.45, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.7, 0.08, 0.7]} />
            <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={0.4} metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Left Wingtip Red Navigation Strobe */}
          <mesh position={[-8.7, 0.7, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3.5} />
          </mesh>

          {/* Wingtip Aerodynamic Vapor Vortex Ribbons (Active during rotation/climb) */}
          <mesh ref={rightVortexRef} position={[8.65, 0.45, -2.0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.08, 4.0, 12]} />
            <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={0.8} transparent opacity={0} />
          </mesh>
          <mesh ref={leftVortexRef} position={[-8.65, 0.45, -2.0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.08, 4.0, 12]} />
            <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={0.8} transparent opacity={0} />
          </mesh>
        </group>

        {/* 3. V-TAIL EMPENNAGE (INVERTED V-TAIL MALE UAV CONFIGURATION WITH GOLD ACCENTS) */}
        <group position={[0, 0.3, -3.1]}>
          {/* Right V-Stabilizer Fin */}
          <mesh position={[0.7, 0.85, 0]} rotation={[0.1, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.1, 1.8, 0.8]} />
            <meshStandardMaterial color={airframeColor} metalness={0.75} roughness={0.25} />
          </mesh>
          {/* Right V-Tail Tip High-Vis Golden Accent */}
          <mesh position={[1.3, 1.45, 0.02]} rotation={[0.1, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.11, 0.35, 0.78]} />
            <meshStandardMaterial color="#facc15" emissive="#eab308" emissiveIntensity={0.5} />
          </mesh>

          {/* Left V-Stabilizer Fin */}
          <mesh position={[-0.7, 0.85, 0]} rotation={[0.1, 0, Math.PI / 4]}>
            <boxGeometry args={[0.1, 1.8, 0.8]} />
            <meshStandardMaterial color={airframeColor} metalness={0.75} roughness={0.25} />
          </mesh>
          {/* Left V-Tail Tip High-Vis Golden Accent */}
          <mesh position={[-1.3, 1.45, 0.02]} rotation={[0.1, 0, Math.PI / 4]}>
            <boxGeometry args={[0.11, 0.35, 0.78]} />
            <meshStandardMaterial color="#facc15" emissive="#eab308" emissiveIntensity={0.5} />
          </mesh>

          {/* Ventral Under-fin (Bright Red Warning Skid Fin) */}
          <mesh position={[0, -0.65, 0.2]} rotation={[-0.1, 0, 0]}>
            <boxGeometry args={[0.08, 0.8, 0.7]} />
            <meshStandardMaterial color="#ef4444" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>

        {/* 4. BELLY-MOUNTED GIMBALED FLIR SENSOR TURRET BALL */}
        <group position={[0, -0.55, 3.2]} ref={flirRef}>
          {/* Gimbal Housing Base */}
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.3, 0.35, 0.2, 24]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Rotating Optical Turret Sphere */}
          <mesh position={[0, -0.15, 0]}>
            <sphereGeometry args={[0.32, 24, 24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Dual Infrared / Electro-Optical Camera Lenses */}
          <mesh position={[0.08, -0.15, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} />
            <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[-0.08, -0.15, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.1, 16]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
          </mesh>
        </group>

        {/* 5. ANIMATED RETRACTABLE TRICYCLE LANDING GEAR */}
        {/* Nose Gear Assembly (Folds Aft into Forward Fuselage Bay) */}
        <group ref={noseGearRef} position={[0, -0.7, 3.0]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.8, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.1} />
          </mesh>
          <mesh position={[0, -0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.18, 0.18, 0.12, 20]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
        </group>

        {/* Right Main Landing Gear (Swings Inward into Wing Root Bay) */}
        <group ref={rightMainGearRef} position={[0.75, -0.7, 0.2]}>
          <mesh position={[0, 0, 0]} rotation={[0, 0, -0.1]}>
            <cylinderGeometry args={[0.05, 0.05, 0.9, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.1} />
          </mesh>
          <mesh position={[0.15, -0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.14, 20]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
        </group>

        {/* Left Main Landing Gear (Swings Inward into Wing Root Bay) */}
        <group ref={leftMainGearRef} position={[-0.75, -0.7, 0.2]}>
          <mesh position={[0, 0, 0]} rotation={[0, 0, 0.1]}>
            <cylinderGeometry args={[0.05, 0.05, 0.9, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.1} />
          </mesh>
          <mesh position={[-0.15, -0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.14, 20]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
        </group>

        {/* 6. INTERNAL AERO PISTON ENGINE (ROTAX 914/915 TURBO DIGITAL TWIN) */}
        <group position={[0, 0.22, -1.6]} scale={[0.48, 0.48, 0.48]}>
          <PistonEngine3D
            telemetry={telemetry}
            health={health}
            fault={fault}
            activeFaults={activeFaults}
          />
        </group>

        {/* 7. REAL-TIME ROTATING PUSHER PROPELLER & EXHAUST SLIPSTREAM */}
        <group position={[0, 0.22, -3.2]} ref={propRef}>
          {/* Central Bullet Spinner Hub (Polished Aerospace Gold) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.22, 0.45, 24]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.92} roughness={0.15} emissive="#b45309" emissiveIntensity={0.3} />
          </mesh>

          {/* 3 Aerodynamic Propeller Blades (120 deg apart) */}
          {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, idx) => (
            <group key={idx} rotation={[0, 0, angle]}>
              <mesh position={[0, 0.95, -0.05]} rotation={[0.25, 0, 0]}>
                <boxGeometry args={[0.12, 1.4, 0.03]} />
                <meshStandardMaterial color="#0284c7" metalness={0.85} roughness={0.2} />
              </mesh>
              {/* Propeller Tip Yellow Warning Stripe */}
              <mesh position={[0, 1.6, -0.05]} rotation={[0.25, 0, 0]}>
                <boxGeometry args={[0.125, 0.15, 0.032]} />
                <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.6} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Engine Thrust / Pusher Slipstream Streamline Cone */}
        <group ref={slipstreamRef} position={[0, 0.22, -3.6]}>
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

        {/* 8. DORSAL ENGINE COOLING AIR SCOOP (NACA DUCT) */}
        <mesh position={[0, 0.85, -0.8]} rotation={[-Math.PI / 10, 0, 0]}>
          <boxGeometry args={[0.5, 0.25, 0.9]} />
          <meshStandardMaterial color="#0284c7" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* 9. INTERACTIVE SYSTEM HOTSPOT BEACONS */}
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
          <mesh position={[0, 1.25, -1.6]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial
              color={health?.overall_health < 70 ? '#ef4444' : (health?.overall_health < 85 ? '#f59e0b' : '#10b981')}
              emissive={health?.overall_health < 70 ? '#ef4444' : (health?.overall_health < 85 ? '#f59e0b' : '#10b981')}
              emissiveIntensity={2.0}
            />
          </mesh>
        </Float>

        <mesh position={[0, 1.05, 1.8]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={1.8} />
        </mesh>
      </group>

      {/* ========================================================================= */}
      {/* GROUND LEVEL INFRASTRUCTURE: RUNWAY, TOUCHDOWN SMOKE & TACTICAL GRID */}
      {/* ========================================================================= */}
      {/* 10. REALISTIC 3D TACTICAL RUNWAY STRIP (Fixed at ground plane y = -1.33) */}
      <group position={[0, -1.33, 0]}>
        {/* Main Asphalt Runway Surface */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[7.2, 52]} />
          <meshStandardMaterial color="#0f172a" roughness={0.88} metalness={0.15} />
        </mesh>

        {/* Runway Threshold Stripes (Piano Keys) - Forward End */}
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
            <meshStandardMaterial color="#facc15" emissive="#ca8a04" emissiveIntensity={0.25} />
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
            {/* Right Edge Beacon */}
            <mesh position={[3.45, 0.1, zPos]}>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshStandardMaterial
                color={Math.abs(zPos) === 22 ? '#10b981' : '#facc15'}
                emissive={Math.abs(zPos) === 22 ? '#10b981' : '#facc15'}
                emissiveIntensity={2.5}
              />
            </mesh>
            {/* Left Edge Beacon */}
            <mesh position={[-3.45, 0.1, zPos]}>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshStandardMaterial
                color={Math.abs(zPos) === 22 ? '#10b981' : '#facc15'}
                emissive={Math.abs(zPos) === 22 ? '#10b981' : '#facc15'}
                emissiveIntensity={2.5}
              />
            </mesh>
          </React.Fragment>
        ))}
      </group>

      {/* 11. DYNAMIC TOUCHDOWN TIRE SMOKE PUFF PARTICLES */}
      {/* Left Main Wheel Smoke Puff */}
      <mesh ref={leftSmokeRef} position={[-0.9, -1.25, 0.2]} visible={false}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#e2e8f0" transparent opacity={0.6} roughness={1.0} />
      </mesh>

      {/* Right Main Wheel Smoke Puff */}
      <mesh ref={rightSmokeRef} position={[0.9, -1.25, 0.2]} visible={false}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#e2e8f0" transparent opacity={0.6} roughness={1.0} />
      </mesh>

      {/* 12. TACTICAL GROUND REFERENCE GRID */}
      {showGrid && (
        <Grid
          position={[0, -1.35, 0]}
          args={[32, 32]}
          cellSize={0.7}
          cellThickness={0.75}
          cellColor="#1e293b"
          sectionSize={2.8}
          sectionThickness={1.25}
          sectionColor="#0ea5e9"
          fadeDistance={36}
        />
      )}
    </group>
  );
}
