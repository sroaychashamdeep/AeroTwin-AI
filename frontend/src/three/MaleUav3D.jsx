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

  // Vibrant & Colorful Aerospace Livery Materials
  // Base: Deep Navy Blue Aerospace Composite with High Metallic Sheen
  const airframeColor = isCutaway ? '#0284c7' : '#1e3a8a'; // Vibrant Royal/Navy Aerospace Blue
  const airframeOpacity = isCutaway ? 0.35 : 1.0;
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

      {/* C. Aft Fuselage (Engine Nacelle Cowling - Deep Emerald / Amber Thermal Glow) */}
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

      {/* 2. RECONNAISSANCE WINGS (HIGH-ASPECT RATIO MALE UAV WINGSPAN) */}
      <group position={[0, 0.25, 0.6]}>
        {/* Center Wing Box Centerpiece */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.9, 0.22, 1.4]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
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

        {/* Right Wing Leading-Edge High-Visibility Orange De-Icing Boot */}
        <mesh position={[4.6, 0.12, 0.52]} rotation={[0, 0, 0.04]}>
          <boxGeometry args={[7.6, 0.13, 0.08]} />
          <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={0.25} />
        </mesh>

        {/* Right Wing Flap/Aileron Trim Stripe (Vibrant Sky Blue) */}
        <mesh position={[4.6, 0.18, -0.42]} rotation={[0, 0, 0.04]}>
          <boxGeometry args={[7.2, 0.04, 0.12]} />
          <meshStandardMaterial color="#38bdf8" />
        </mesh>

        {/* Right Wing Tactical High-Vis Yellow Warning Band */}
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
        <mesh position={[8.7, 0.7, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={3.5} />
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

        {/* Left Wing Leading-Edge High-Visibility Orange De-Icing Boot */}
        <mesh position={[-4.6, 0.12, 0.52]} rotation={[0, 0, -0.04]}>
          <boxGeometry args={[7.6, 0.13, 0.08]} />
          <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={0.25} />
        </mesh>

        {/* Left Wing Flap/Aileron Trim Stripe (Vibrant Sky Blue) */}
        <mesh position={[-4.6, 0.18, -0.42]} rotation={[0, 0, -0.04]}>
          <boxGeometry args={[7.2, 0.04, 0.12]} />
          <meshStandardMaterial color="#38bdf8" />
        </mesh>

        {/* Left Wing Tactical High-Vis Yellow Warning Band */}
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
      </group>

      {/* 3. V-TAIL EMPENNAGE (INVERTED V-TAIL MALE UAV CONFIGURATION WITH GOLD & CRIMSON ACCENTS) */}
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

      {/* 8. DORSAL ENGINE COOLING AIR SCOOP (NACA DUCT) */}
      <mesh position={[0, 0.85, -0.8]} rotation={[-Math.PI / 10, 0, 0]}>
        <boxGeometry args={[0.5, 0.25, 0.9]} />
        <meshStandardMaterial color="#0284c7" metalness={0.85} roughness={0.2} />
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
