/**
 * AEROTWIN AI - High-Fidelity 3D MALE UAV Airframe & Engine Digital Twin
 * TAPAS-BH-201 / Predator MQ-1 Class Tactical Airframe with Integrated Powerplant
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Grid } from '@react-three/drei';
import * as THREE from 'three';
import PistonEngine3D from './PistonEngine3D';

export default function MaleUav3D({
  telemetry,
  health,
  fault,
  activeFaults,
  viewMode = 'XRAY_CUTAWAY', // 'FULL_UAV', 'XRAY_CUTAWAY', 'ENGINE_ONLY'
  selectedPart = 'all',
  showGrid = true
}) {
  const propRef = useRef();
  const flirRef = useRef();
  const strobeRef = useRef();
  const strobeTimer = useRef(0);

  const rpm = telemetry?.rpm || 4800;
  const isCutaway = viewMode === 'XRAY_CUTAWAY';
  const isEngineOnly = viewMode === 'ENGINE_ONLY';

  // Body materials
  const airframeColor = '#1e2631'; // Tactical Radar-Absorbent Dark Slate Gray
  const airframeOpacity = isCutaway ? 0.28 : 1.0;
  const isTransparent = isCutaway;

  // Strobe and Propeller dynamic animations
  useFrame((state, delta) => {
    // Propeller spinning synchronized with real engine RPM
    if (propRef.current) {
      const propSpeed = (rpm / 60) * Math.PI * 1.5 * delta;
      propRef.current.rotation.z += propSpeed;
    }

    // FLIR turret gentle surveillance pan
    if (flirRef.current) {
      flirRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.45;
    }

    // Wingtip anti-collision strobe flashing
    strobeTimer.current += delta;
    if (strobeRef.current) {
      const flash = Math.sin(strobeTimer.current * 8) > 0.6;
      strobeRef.current.intensity = flash ? 3.0 : 0.2;
    }
  });

  if (isEngineOnly) {
    // If user selects isolated engine view, render only the powerplant digital twin
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
    <group position={[0, 0, 0]} scale={[1, 1, 1]}>
      {/* 1. MAIN FUSELAGE ASSEMBLY */}
      {/* A. Forward Nose & SATCOM Radome Bulb */}
      <mesh position={[0, 0.4, 3.6]} rotation={[Math.PI / 16, 0, 0]}>
        <sphereGeometry args={[0.9, 32, 24]} />
        <meshStandardMaterial
          color={airframeColor}
          metalness={0.7}
          roughness={0.3}
          transparent={isTransparent}
          opacity={airframeOpacity}
          wireframe={isCutaway && selectedPart === 'airframe'}
        />
      </mesh>

      {/* B. Center Fuselage Cabin (Avionics & Fuel Cell Bay) */}
      <mesh position={[0, 0.2, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.85, 0.95, 3.8, 32]} />
        <meshStandardMaterial
          color={airframeColor}
          metalness={0.75}
          roughness={0.25}
          transparent={isTransparent}
          opacity={airframeOpacity}
          wireframe={isCutaway && selectedPart === 'airframe'}
        />
      </mesh>

      {/* C. Aft Fuselage (Engine Nacelle Cowling) */}
      <mesh position={[0, 0.25, -1.8]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.65, 0.85, 2.6, 32]} />
        <meshStandardMaterial
          color={airframeColor}
          metalness={0.8}
          roughness={0.2}
          transparent={isTransparent}
          opacity={isCutaway ? 0.15 : 1.0}
          wireframe={isCutaway}
        />
      </mesh>

      {/* D. Tactical Markings: Roundel & Tail Number Decal */}
      {!isCutaway && (
        <>
          {/* Indian / Tactical Roundel Accent on Fuselage */}
          <mesh position={[0.86, 0.3, 1.2]} rotation={[0, Math.PI / 2, 0]}>
            <circleGeometry args={[0.22, 24]} />
            <meshStandardMaterial color="#f97316" />
          </mesh>
          <mesh position={[0.87, 0.3, 1.2]} rotation={[0, Math.PI / 2, 0]}>
            <circleGeometry args={[0.15, 24]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.88, 0.3, 1.2]} rotation={[0, Math.PI / 2, 0]}>
            <circleGeometry args={[0.07, 24]} />
            <meshStandardMaterial color="#10b981" />
          </mesh>

          {/* Left Roundel */}
          <mesh position={[-0.86, 0.3, 1.2]} rotation={[0, -Math.PI / 2, 0]}>
            <circleGeometry args={[0.22, 24]} />
            <meshStandardMaterial color="#f97316" />
          </mesh>
          <mesh position={[-0.87, 0.3, 1.2]} rotation={[0, -Math.PI / 2, 0]}>
            <circleGeometry args={[0.15, 24]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-0.88, 0.3, 1.2]} rotation={[0, -Math.PI / 2, 0]}>
            <circleGeometry args={[0.07, 24]} />
            <meshStandardMaterial color="#10b981" />
          </mesh>
        </>
      )}

      {/* 2. RECONNAISSANCE WINGS (HIGH-ASPECT RATIO MALE UAV WINGSPAN) */}
      <group position={[0, 0.25, 0.6]}>
        {/* Center Wing Box Centerpiece */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.9, 0.22, 1.4]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Right Wing (Span +X) */}
        <mesh position={[4.6, 0.12, 0]} rotation={[0, 0, 0.04]}>
          <boxGeometry args={[7.8, 0.12, 1.1]} />
          <meshStandardMaterial
            color={airframeColor}
            metalness={0.7}
            roughness={0.3}
            transparent={isTransparent}
            opacity={isCutaway ? 0.5 : 1.0}
          />
        </mesh>
        {/* Right Wingtip Winglet */}
        <mesh position={[8.5, 0.45, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.7, 0.08, 0.7]} />
          <meshStandardMaterial color="#0ea5e9" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Right Wingtip Green Navigation Strobe */}
        <mesh position={[8.7, 0.7, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={2.5} />
        </mesh>

        {/* Left Wing (Span -X) */}
        <mesh position={[-4.6, 0.12, 0]} rotation={[0, 0, -0.04]}>
          <boxGeometry args={[7.8, 0.12, 1.1]} />
          <meshStandardMaterial
            color={airframeColor}
            metalness={0.7}
            roughness={0.3}
            transparent={isTransparent}
            opacity={isCutaway ? 0.5 : 1.0}
          />
        </mesh>
        {/* Left Wingtip Winglet */}
        <mesh position={[-8.5, 0.45, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.7, 0.08, 0.7]} />
          <meshStandardMaterial color="#0ea5e9" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Left Wingtip Red Navigation Strobe */}
        <mesh position={[-8.7, 0.7, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2.5} />
        </mesh>
      </group>

      {/* 3. V-TAIL EMPENNAGE (INVERTED V-TAIL MALE UAV CONFIGURATION) */}
      <group position={[0, 0.3, -3.1]}>
        {/* Right V-Stabilizer Fin */}
        <mesh position={[0.7, 0.85, 0]} rotation={[0.1, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.1, 1.8, 0.8]} />
          <meshStandardMaterial color={airframeColor} metalness={0.75} roughness={0.25} />
        </mesh>

        {/* Left V-Stabilizer Fin */}
        <mesh position={[-0.7, 0.85, 0]} rotation={[0.1, 0, Math.PI / 4]}>
          <boxGeometry args={[0.1, 1.8, 0.8]} />
          <meshStandardMaterial color={airframeColor} metalness={0.75} roughness={0.25} />
        </mesh>

        {/* Ventral Under-fin */}
        <mesh position={[0, -0.65, 0.2]} rotation={[-0.1, 0, 0]}>
          <boxGeometry args={[0.08, 0.8, 0.7]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
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

      {/* 5. LANDING GEAR SYSTEM (TRICYCLE GEAR) */}
      <group position={[0, 0, 0]}>
        {/* Nose Gear Strut & Wheel */}
        <mesh position={[0, -0.7, 3.0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.8, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0, -1.1, 3.0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 0.12, 20]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>

        {/* Main Landing Gear (Right) */}
        <mesh position={[0.75, -0.7, 0.2]} rotation={[0, 0, -0.2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.9, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0.9, -1.1, 0.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.14, 20]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>

        {/* Main Landing Gear (Left) */}
        <mesh position={[-0.75, -0.7, 0.2]} rotation={[0, 0, 0.2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.9, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[-0.9, -1.1, 0.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.14, 20]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
      </group>

      {/* 6. INTERNAL AERO PISTON ENGINE (ROTAX 914/915 TURBO DIGITAL TWIN) */}
      {/* Mounted directly in the rear engine compartment at z = -1.6 */}
      <group position={[0, 0.22, -1.6]} scale={[0.48, 0.48, 0.48]}>
        <PistonEngine3D
          telemetry={telemetry}
          health={health}
          fault={fault}
          activeFaults={activeFaults}
        />
      </group>

      {/* 7. REAL-TIME ROTATING PUSHER PROPELLER (MOUNTED AT REAR TAIL HUB) */}
      <group position={[0, 0.22, -3.2]} ref={propRef}>
        {/* Central Bullet Spinner Hub */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.22, 0.45, 24]} />
          <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.15} />
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

      {/* 8. DORSAL ENGINE COOLING AIR SCOOP (NACA DUCT) */}
      <mesh position={[0, 0.85, -0.8]} rotation={[-Math.PI / 10, 0, 0]}>
        <boxGeometry args={[0.5, 0.25, 0.9]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* 9. INTERACTIVE SYSTEM HOTSPOT BEACONS */}
      {/* Powerplant Hotspot Beacon */}
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

      {/* Avionics Pod Hotspot Beacon */}
      <mesh position={[0, 1.05, 1.8]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={1.8} />
      </mesh>

      {/* 10. TACTICAL GROUND REFERENCE GRID */}
      {showGrid && (
        <Grid
          position={[0, -1.5, 0]}
          args={[28, 28]}
          cellSize={0.7}
          cellThickness={0.75}
          cellColor="#1e293b"
          sectionSize={2.8}
          sectionThickness={1.25}
          sectionColor="#0ea5e9"
          fadeDistance={32}
        />
      )}
    </group>
  );
}
