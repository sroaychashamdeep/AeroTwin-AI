/**
 * AEROTWIN AI - High-Fidelity 3D Aero Piston Engine Digital Twin
 * Three.js / React Three Fiber Procedural Aerospace Powerplant
 * Rotax 914 / 915 iS Architecture: 4-Cylinder Turbocharged Opposed Boxer Aero Engine
 */

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Html } from '@react-three/drei';
import * as THREE from 'three';

// Individual Cylinder with Reciprocating Piston, Dual Spark Plugs & Combustion Glow
function CylinderAssembly({
  position,
  rotation,
  cylinderNumber,
  pistonOffset,
  isLeftBank,
  healthStatus,
  cht,
  egt,
  isEngineRunning,
  isEngineStarting,
  rpm,
  activeFaults
}) {
  const pistonRef = useRef();
  const connectingRodRef = useRef();
  const flameRef = useRef();

  const [hovered, setHovered] = useState(false);

  // Dynamic thermal color scaling based on real Cylinder Head Temperature
  const getCylinderColor = () => {
    if (cht > 185 || healthStatus === 'CRITICAL') return '#ef4444'; // Red (Overheating)
    if (cht > 165 || healthStatus === 'WARNING') return '#f59e0b'; // Amber
    return '#334155'; // Metallic Titanium Slate
  };

  const getExhaustColor = () => {
    if (egt > 870) return '#ef4444'; // Glowing red hot
    if (egt > 820) return '#f97316'; // Hot amber
    return '#475569'; // Steel
  };

  useFrame((state, delta) => {
    const angle = pistonOffset.current;
    if (pistonRef.current) {
      // Reciprocating piston displacement: stroke = 0.5 units
      const strokeDisplacement = Math.sin(angle) * 0.42;
      pistonRef.current.position.x = (isLeftBank ? -1 : 1) * (0.85 + strokeDisplacement);

      // Connecting rod angular oscillation
      if (connectingRodRef.current) {
        connectingRodRef.current.rotation.z = Math.cos(angle) * 0.25 * (isLeftBank ? -1 : 1);
      }
    }

    // Combustion chamber flash (flashes during power stroke when engine is running)
    if (flameRef.current) {
      if (isEngineRunning || isEngineStarting) {
        const firingIntensity = Math.max(0, Math.sin(angle));
        flameRef.current.intensity = firingIntensity * (egt > 820 ? 3.0 : 1.8);
      } else {
        flameRef.current.intensity = 0;
      }
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* 1. Main Outer Cylinder Barrel with Machined Cooling Fins */}
      <mesh castShadow receiveShadow position={[isLeftBank ? -1.25 : 1.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.72, 0.74, 1.45, 24]} />
        <meshStandardMaterial
          color={getCylinderColor()}
          metalness={0.82}
          roughness={0.25}
          emissive={cht > 175 ? '#7f1d1d' : '#000000'}
          emissiveIntensity={cht > 175 ? 0.7 : 0}
        />
      </mesh>

      {/* 2. Concentric Circumferential Cooling Fins */}
      {[-0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45].map((finY, idx) => (
        <mesh key={idx} position={[isLeftBank ? -1.25 : 1.25, finY, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.86, 0.86, 0.04, 24]} />
          <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.18} />
        </mesh>
      ))}

      {/* 3. Cast Aluminum Cylinder Head Cover with Valve Rocker Bulges */}
      <mesh position={[isLeftBank ? -2.05 : 2.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.74, 0.74, 0.25, 24]} />
        <meshStandardMaterial color="#0f172a" metalness={0.88} roughness={0.2} />
      </mesh>
      {/* Valve Rocker Cover Details */}
      <mesh position={[isLeftBank ? -2.2 : 2.2, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.2, 0.35, 0.55]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 4. Combustion Chamber Internal Flame Light */}
      <pointLight
        ref={flameRef}
        position={[isLeftBank ? -1.8 : 1.8, 0, 0]}
        color={egt > 840 ? '#f97316' : '#38bdf8'}
        distance={2.5}
        intensity={0}
      />

      {/* 5. Reciprocating Forged Piston & Wrist Pin */}
      <group ref={pistonRef} position={[isLeftBank ? -0.85 : 0.85, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.65, 0.65, 0.52, 22]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.96} roughness={0.12} />
        </mesh>
        {/* Piston Crown Rings */}
        {[-0.15, 0, 0.15].map((ringX, idx) => (
          <mesh key={idx} position={[ringX, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.66, 0.66, 0.03, 22]} />
            <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* 6. Connecting Rod to Crankcase */}
      <group ref={connectingRodRef} position={[isLeftBank ? -0.4 : 0.4, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.15, 0.85, 0.12]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* 7. Dual Spark Plugs (Rotax Dual Ignition - 2 Plugs per Cylinder) */}
      {/* Top Spark Plug */}
      <group position={[isLeftBank ? -1.9 : 1.9, 0.62, 0.25]} rotation={[0, 0, isLeftBank ? -0.4 : 0.4]}>
        <mesh>
          <cylinderGeometry args={[0.07, 0.07, 0.32, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.14, 12]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.3} roughness={0.4} />
        </mesh>
        {/* High-Tension Ignition Lead Wire */}
        <mesh position={[0, 0.35, -0.15]} rotation={[0.6, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.45, 8]} />
          <meshStandardMaterial color="#eab308" roughness={0.5} />
        </mesh>
      </group>
      {/* Bottom Spark Plug */}
      <group position={[isLeftBank ? -1.9 : 1.9, -0.62, -0.25]} rotation={[0, 0, isLeftBank ? 0.4 : -0.4]}>
        <mesh>
          <cylinderGeometry args={[0.07, 0.07, 0.32, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.14, 12]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.3} roughness={0.4} />
        </mesh>
      </group>

      {/* 8. Tuned Stainless Steel Exhaust Runner */}
      <group position={[isLeftBank ? -1.25 : 1.25, -0.75, 0.35]} rotation={[Math.PI / 3.2, 0, isLeftBank ? -0.15 : 0.15]}>
        <mesh>
          <cylinderGeometry args={[0.18, 0.18, 1.1, 16]} />
          <meshStandardMaterial
            color={getExhaustColor()}
            metalness={0.75}
            roughness={0.25}
            emissive={egt > 840 ? '#b91c1c' : '#000000'}
            emissiveIntensity={egt > 840 ? 0.75 : 0}
          />
        </mesh>
        {/* Exhaust Mounting Flange with Studs */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.08, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
        </mesh>
      </group>

      {/* 9. Cylinder Identification & Thermocouple Sensor Beacon */}
      <mesh
        position={[isLeftBank ? -2.25 : 2.25, 0.45, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial
          color={cht > 175 ? '#ef4444' : (cht > 160 ? '#f59e0b' : '#10b981')}
          emissive={cht > 175 ? '#ef4444' : (cht > 160 ? '#f59e0b' : '#10b981')}
          emissiveIntensity={hovered ? 2.5 : 1.2}
        />
      </mesh>

      {/* Floating 3D Cylinder Head Badge */}
      <Html distanceFactor={14} position={[isLeftBank ? -2.4 : 2.4, 0.7, 0]} center>
        <div
          className={`px-2 py-0.8 rounded text-[9px] font-mono font-bold whitespace-nowrap shadow-lg border backdrop-blur-md pointer-events-none transition ${
            hovered || cht > 170
              ? 'bg-slate-900/95 border-amber-500 text-amber-300 scale-105'
              : 'bg-slate-950/80 border-slate-700 text-slate-300'
          }`}
        >
          <div className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cht > 175 ? '#ef4444' : '#10b981' }} />
            <span>CYL #{cylinderNumber}</span>
            <span className="text-white font-bold ml-1">{Math.round(cht)}°C</span>
          </div>
        </div>
      </Html>
    </group>
  );
}

// Complete Rotax 914/915 iS Turbocharged Engine Digital Twin
export default function PistonEngine3D({ telemetry, health, fault, activeFaults, isEngineRunning: isRunningProp }) {
  const crankRef = useRef();
  const turboCompressorRef = useRef();
  const propHubRef = useRef();
  const angleRef = useRef(0);

  const rpm = telemetry?.rpm !== undefined ? telemetry.rpm : 4800;
  const cht = telemetry?.cht || 142.4;
  const egt = telemetry?.egt || 795.0;
  const oilP = telemetry?.oil_pressure !== undefined ? telemetry.oil_pressure : 4.2;
  const oilT = telemetry?.oil_temperature || 92.5;
  const fuelFlow = telemetry?.fuel_flow || 18.2;
  const isEngineOff = rpm === 0;
  const isEngineStarting = rpm > 0 && rpm < 500;
  const isEngineRunning = isRunningProp !== undefined ? isRunningProp : (rpm >= 500);

  const healthStatus =
    health?.overall_health < 70 ? 'CRITICAL' : (health?.overall_health < 85 ? 'WARNING' : 'NOMINAL');

  // Opposed 4-Cylinder Firing Offsets (0°, 180°, 90°, 270°)
  const p1Offset = useRef(0);
  const p2Offset = useRef(Math.PI);
  const p3Offset = useRef(Math.PI / 2);
  const p4Offset = useRef(Math.PI * 1.5);

  useFrame((state, delta) => {
    // Angular velocity proportional to physical engine RPM
    const angularSpeed = (rpm / 60) * Math.PI * 0.5 * delta;
    angleRef.current += angularSpeed;

    p1Offset.current = angleRef.current;
    p2Offset.current = angleRef.current + Math.PI;
    p3Offset.current = angleRef.current + Math.PI / 2;
    p4Offset.current = angleRef.current + Math.PI * 1.5;

    if (crankRef.current) {
      crankRef.current.rotation.z = angleRef.current;
    }
    if (turboCompressorRef.current) {
      // Turbocharger spins at ~3.2x crankshaft frequency
      turboCompressorRef.current.rotation.y += angularSpeed * 3.2;
    }
    if (propHubRef.current) {
      // Gearbox reduction: 1 : 2.43 ratio for Rotax 914
      propHubRef.current.rotation.z = angleRef.current / 2.43;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ========================================================================= */}
      {/* 1. CHROMOLY TUBULAR ENGINE MOUNTING TRUSS (AEROSPACE CRADLE)              */}
      {/* ========================================================================= */}
      <group position={[0, 0, 0]}>
        {/* Diagonal Steel Tube Braces */}
        {[
          { pos: [-1.2, 0.8, -1.8], rot: [0.35, -0.4, 0], len: 2.6 },
          { pos: [1.2, 0.8, -1.8], rot: [0.35, 0.4, 0], len: 2.6 },
          { pos: [-1.2, -0.8, -1.8], rot: [-0.35, -0.4, 0], len: 2.6 },
          { pos: [1.2, -0.8, -1.8], rot: [-0.35, 0.4, 0], len: 2.6 },
          { pos: [0, 1.2, -1.5], rot: [0.2, 0, 0], len: 2.4 },
          { pos: [0, -1.2, -1.5], rot: [-0.2, 0, 0], len: 2.4 }
        ].map((truss, idx) => (
          <mesh key={idx} position={truss.pos} rotation={truss.rot}>
            <cylinderGeometry args={[0.045, 0.045, truss.len, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.25} />
          </mesh>
        ))}

        {/* Firewall Mounting Isolation Dampeners */}
        {[-1.3, 1.3].map((mountX, i) =>
          [-0.9, 0.9].map((mountY, j) => (
            <mesh key={`${i}-${j}`} position={[mountX, mountY, -2.6]}>
              <cylinderGeometry args={[0.12, 0.12, 0.18, 16]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>
          ))
        )}
      </group>

      {/* ========================================================================= */}
      {/* 2. CENTRAL CRANKCASE MAIN BLOCK (ALUMINUM ALLOY ENGINE CORE)             */}
      {/* ========================================================================= */}
      <group position={[0, 0, 0]}>
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[1.65, 1.9, 4.4]} />
          <meshStandardMaterial
            color="#1e293b"
            metalness={0.88}
            roughness={0.22}
          />
        </mesh>

        {/* Crankcase Stiffening Ribs */}
        {[-1.6, -0.8, 0, 0.8, 1.6].map((ribZ, idx) => (
          <mesh key={idx} position={[0, 0.96, ribZ]}>
            <boxGeometry args={[1.5, 0.08, 0.12]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.15} />
          </mesh>
        ))}

        {/* Rotax Manufacturer Spec Plaque */}
        <mesh position={[0.83, 0.3, 0.5]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.7, 0.35]} />
          <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Central Hardened Rotating Crankshaft Axis */}
        <mesh ref={crankRef} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 4.8, 24]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>

      {/* ========================================================================= */}
      {/* 3. PROPELLER GEARBOX REDUCTION UNIT (AFT PUSHER SHAFT)                    */}
      {/* ========================================================================= */}
      <group position={[0, 0, 2.5]}>
        {/* Reduction Gearbox Bellhousing */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.62, 0.78, 0.9, 24]} />
          <meshStandardMaterial color="#0f172a" metalness={0.92} roughness={0.15} />
        </mesh>

        {/* Propeller Drive Output Shaft */}
        <mesh ref={propHubRef} position={[0, 0, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.75, 20]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.98} roughness={0.08} />
        </mesh>

        {/* Drive Flange with 6 Titanium Bolts */}
        <mesh position={[0, 0, 0.95]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.52, 0.52, 0.12, 24]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* ========================================================================= */}
      {/* 4. 4-CYLINDER OPPOSED BOXER ASSEMBLIES (CYLINDERS 1, 2, 3, 4)             */}
      {/* ========================================================================= */}
      {/* Left Bank: Cylinders 1 & 3 */}
      <CylinderAssembly
        position={[-0.78, 0, 1.1]}
        rotation={[0, 0, 0]}
        cylinderNumber={1}
        pistonOffset={p1Offset}
        isLeftBank={true}
        healthStatus={healthStatus}
        cht={cht + (activeFaults?.injector_degradation ? 24.5 : 0)}
        egt={egt + (activeFaults?.injector_degradation ? 45.0 : 0)}
        isEngineRunning={isEngineRunning}
        isEngineStarting={isEngineStarting}
        rpm={rpm}
        activeFaults={activeFaults}
      />
      <CylinderAssembly
        position={[-0.78, 0, -1.0]}
        rotation={[0, 0, 0]}
        cylinderNumber={3}
        pistonOffset={p3Offset}
        isLeftBank={true}
        healthStatus={healthStatus}
        cht={cht}
        egt={egt}
        isEngineRunning={isEngineRunning}
        isEngineStarting={isEngineStarting}
        rpm={rpm}
        activeFaults={activeFaults}
      />

      {/* Right Bank: Cylinders 2 & 4 */}
      <CylinderAssembly
        position={[0.78, 0, 0.55]}
        rotation={[0, 0, 0]}
        cylinderNumber={2}
        pistonOffset={p2Offset}
        isLeftBank={false}
        healthStatus={healthStatus}
        cht={cht}
        egt={egt - (activeFaults?.misfire_severity ? 95.0 : 0)}
        isEngineRunning={isEngineRunning}
        isEngineStarting={isEngineStarting}
        rpm={rpm}
        activeFaults={activeFaults}
      />
      <CylinderAssembly
        position={[0.78, 0, -1.55]}
        rotation={[0, 0, 0]}
        cylinderNumber={4}
        pistonOffset={p4Offset}
        isLeftBank={false}
        healthStatus={healthStatus}
        cht={cht + (activeFaults?.overheating ? 38.0 : 0)}
        egt={egt}
        isEngineRunning={isEngineRunning}
        isEngineStarting={isEngineStarting}
        rpm={rpm}
        activeFaults={activeFaults}
      />

      {/* ========================================================================= */}
      {/* 5. ELECTRONIC FUEL INJECTION (EFI) & HIGH-PRESSURE FUEL RAILS             */}
      {/* ========================================================================= */}
      <group position={[0, 1.25, -0.2]}>
        {/* Dual Anodized Blue Fuel Rails */}
        <mesh position={[-0.65, 0, 0]}>
          <boxGeometry args={[0.22, 0.22, 3.4]} />
          <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh position={[0.65, 0, 0]}>
          <boxGeometry args={[0.22, 0.22, 3.4]} />
          <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.15} />
        </mesh>
        {/* Cross-Over Fuel Line */}
        <mesh position={[0, 0.12, 1.3]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 1.4, 16]} />
          <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.15} />
        </mesh>

        {/* 4 Electronic Solenoid Fuel Injectors */}
        {[
          { pos: [-0.65, -0.25, 1.1], id: 1 },
          { pos: [0.65, -0.25, 0.55], id: 2 },
          { pos: [-0.65, -0.25, -1.0], id: 3 },
          { pos: [0.65, -0.25, -1.55], id: 4 }
        ].map((inj) => (
          <group key={inj.id} position={inj.pos}>
            <mesh>
              <cylinderGeometry args={[0.09, 0.09, 0.42, 16]} />
              <meshStandardMaterial
                color={activeFaults?.injector_degradation > 0 && inj.id === 1 ? '#ef4444' : '#38bdf8'}
                emissive={activeFaults?.injector_degradation > 0 && inj.id === 1 ? '#ef4444' : '#38bdf8'}
                emissiveIntensity={activeFaults?.injector_degradation > 0 && inj.id === 1 ? 1.4 : 0.3}
              />
            </mesh>
            {/* Electrical Connector Harness */}
            <mesh position={[0, 0.2, 0.08]} rotation={[0.3, 0, 0]}>
              <boxGeometry args={[0.09, 0.12, 0.1]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          </group>
        ))}

        {/* Throttle Body & Butterfly Valve Actuator */}
        <mesh position={[0, 0.3, -1.4]}>
          <cylinderGeometry args={[0.32, 0.32, 0.6, 20]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* ========================================================================= */}
      {/* 6. TURBOCHARGER, INTERCOOLER & PNEUMATIC WASTEGATE ASSEMBLY               */}
      {/* ========================================================================= */}
      <group position={[0, 0.35, -2.6]}>
        {/* Hot Turbine Volute (Exhaust Side) */}
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.65, 0.28, 20, 32]} />
          <meshStandardMaterial
            color={egt > 830 ? '#b45309' : '#334155'}
            metalness={0.82}
            roughness={0.28}
            emissive={egt > 850 ? '#991b1b' : '#000000'}
            emissiveIntensity={egt > 850 ? 0.65 : 0}
          />
        </mesh>

        {/* Cold Compressor Housing (Fresh Air Side) */}
        <mesh position={[0, 0, 0.55]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.55, 0.24, 18, 28]} />
          <meshStandardMaterial color="#0284c7" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* High-Speed Rotating Compressor Impeller */}
        <mesh ref={turboCompressorRef} position={[0, 0, 0.62]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.52, 0.3, 20]} />
          <meshStandardMaterial color="#e0f2fe" metalness={0.96} roughness={0.08} />
        </mesh>

        {/* Turbocharger Center Housing & Oil Cooling Lines */}
        <mesh position={[0, 0, 0.28]}>
          <cylinderGeometry args={[0.22, 0.22, 0.45, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Pneumatic Wastegate Actuator Canister */}
        <group position={[0.75, 0.35, -0.1]} rotation={[0, -0.3, 0]}>
          <mesh>
            <cylinderGeometry args={[0.18, 0.18, 0.42, 16]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.15} />
          </mesh>
          {/* Actuator Operating Rod */}
          <mesh position={[-0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.4, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
          </mesh>
        </group>

        {/* Boost Air Duct to Intercooler */}
        <mesh position={[0, 0.85, 0.35]} rotation={[0.4, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.9, 16]} />
          <meshStandardMaterial color="#38bdf8" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* ========================================================================= */}
      {/* 7. LUBRICATION SYSTEM: DRY SUMP OIL TANK, PUMP & BRAIDED LINES            */}
      {/* ========================================================================= */}
      <group position={[0, -1.2, 0]}>
        {/* Aluminum Lower Oil Sump Pan with Cooling Ribs */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.45, 0.48, 3.8]} />
          <meshStandardMaterial
            color={oilP < 2.5 ? '#ef4444' : (oilP < 3.2 ? '#f59e0b' : '#334155')}
            metalness={0.82}
            roughness={0.25}
            emissive={oilP < 2.5 ? '#7f1d1d' : '#000000'}
            emissiveIntensity={oilP < 2.5 ? 0.7 : 0}
          />
        </mesh>

        {/* Oil Filter Canister */}
        <mesh position={[0.75, 0.1, 1.2]} rotation={[0, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.22, 0.22, 0.55, 20]} />
          <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Braided Stainless Steel Oil Feed Lines */}
        <mesh position={[-0.72, 0.45, 0.2]} rotation={[0.1, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 2.6, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.2} />
        </mesh>
      </group>

      {/* ========================================================================= */}
      {/* 8. WATER/COOLANT CIRCULATION PUMP & DUAL HEAT EXCHANGERS                   */}
      {/* ========================================================================= */}
      <group position={[0, -0.6, 2.1]}>
        {/* Mechanical Coolant Impeller Housing */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.4, 20]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Coolant Manifold Tubes to Left and Right Banks */}
        <mesh position={[-0.6, 0.2, -0.4]} rotation={[0, 0.4, Math.PI / 3]}>
          <cylinderGeometry args={[0.07, 0.07, 1.2, 16]} />
          <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.6, 0.2, -0.4]} rotation={[0, -0.4, -Math.PI / 3]}>
          <cylinderGeometry args={[0.07, 0.07, 1.2, 16]} />
          <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* ========================================================================= */}
      {/* 9. FLOATING 3D ROTAX ENGINE DIGITAL TWIN HEALTH HUD                       */}
      {/* ========================================================================= */}
      <Float speed={2.5} rotationIntensity={0.15} floatIntensity={0.25}>
        <Html distanceFactor={13} position={[0, 2.3, 0]} center>
          <div className="bg-slate-950/90 border border-sky-500/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono text-white min-w-[240px] pointer-events-none">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5 mb-2">
              <span className="text-sky-400 font-bold flex items-center space-x-1.5">
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: isEngineRunning ? '#10b981' : (isEngineStarting ? '#f59e0b' : '#ef4444') }}
                />
                <span>ROTAX 914/915 iS TURBO</span>
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                  healthStatus === 'CRITICAL'
                    ? 'bg-red-950 text-red-300 border border-red-700'
                    : healthStatus === 'WARNING'
                    ? 'bg-amber-950 text-amber-300 border border-amber-700'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                }`}
              >
                {healthStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <div>
                <span className="text-slate-400 text-[9px] block">ENGINE SPEED:</span>
                <span className="text-white font-bold text-sm">{Math.round(rpm)} <span className="text-[10px] text-sky-400">RPM</span></span>
              </div>
              <div>
                <span className="text-slate-400 text-[9px] block">HEAD TEMP (CHT):</span>
                <span className={`font-bold text-sm ${cht > 165 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {Math.round(cht)} <span className="text-[10px] text-slate-300">°C</span>
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[9px] block">EXHAUST (EGT):</span>
                <span className={`font-bold text-sm ${egt > 820 ? 'text-amber-400' : 'text-slate-200'}`}>
                  {Math.round(egt)} <span className="text-[10px] text-slate-300">°C</span>
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[9px] block">OIL PRESSURE:</span>
                <span className={`font-bold text-sm ${oilP < 2.5 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {oilP} <span className="text-[10px] text-slate-300">bar</span>
                </span>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
              <span>TURBO BOOST: <strong className="text-sky-400">1.45 bar</strong></span>
              <span>FLOW: <strong className="text-white">{fuelFlow} L/h</strong></span>
            </div>
          </div>
        </Html>
      </Float>
    </group>
  );
}
