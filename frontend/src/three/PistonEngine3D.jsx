/**
 * AEROTWIN AI - High-Fidelity 3D Aero Piston Engine Digital Twin
 * Three.js / React Three Fiber Procedural Aerospace Engine
 * 4-Cylinder Turbocharged Opposed Aero Piston Engine (Rotax 914/915 iS Architecture)
 */

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Html } from '@react-three/drei';
import * as THREE from 'three';

// Individual Cylinder with Reciprocating Piston, Cooling Fins, Valves & Spark Ignition
function CylinderAssembly({
  position,
  rotation,
  pistonOffset,
  isLeftBank,
  cylinderNumber,
  healthStatus,
  cht,
  egt,
  isFiring,
  showAnnotations
}) {
  const pistonRef = useRef();

  // Color blending according to thermal state and faults
  const getCylinderColor = () => {
    if (cht > 185 || healthStatus === 'CRITICAL') return '#ef4444'; // Critical Red
    if (cht > 165 || healthStatus === 'WARNING') return '#f59e0b'; // Amber
    return '#334155'; // Metallic Titanium Slate
  };

  const getExhaustColor = () => {
    if (egt > 870) return '#f87171'; // Glowing red hot
    if (egt > 820) return '#fbbf24'; // Hot amber
    return '#475569'; // Steel
  };

  useFrame(() => {
    if (pistonRef.current) {
      // Reciprocating motion driven by synchronized piston offset
      pistonRef.current.position.x = (isLeftBank ? -1 : 1) * (0.8 + Math.sin(pistonOffset.current) * 0.45);
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Outer Cylinder Block / Barrel */}
      <mesh castShadow receiveShadow position={[isLeftBank ? -1.2 : 1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.7, 0.72, 1.4, 28]} />
        <meshStandardMaterial
          color={getCylinderColor()}
          metalness={0.8}
          roughness={0.25}
          emissive={cht > 180 ? '#7f1d1d' : '#000000'}
          emissiveIntensity={cht > 180 ? 0.6 : 0}
        />
      </mesh>

      {/* 6 Precision Cooling Fins per Cylinder */}
      {[-0.5, -0.3, -0.1, 0.1, 0.3, 0.5].map((finY, idx) => (
        <mesh key={idx} position={[(isLeftBank ? -1.2 : 1.2), finY, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.82, 0.82, 0.04, 28]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* Cylinder Head Rocker Cover */}
      <mesh position={[isLeftBank ? -1.95 : 1.95, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.72, 0.72, 0.22, 28]} />
        <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Dual Spark Plugs (Rotax Dual Ignition System) */}
      <group position={[isLeftBank ? -2.05 : 2.05, 0.35, 0.2]} rotation={[0, 0, isLeftBank ? -0.4 : 0.4]}>
        <mesh>
          <cylinderGeometry args={[0.06, 0.06, 0.3, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.1, 12]} />
          <meshStandardMaterial color="#ef4444" roughness={0.3} />
        </mesh>
        {/* Dynamic Spark Ignition Flash when firing */}
        {isFiring && (
          <pointLight distance={1.2} intensity={2.5} color="#fef08a" />
        )}
      </group>

      {/* Reciprocating Piston Inside Sleeve */}
      <mesh ref={pistonRef} position={[isLeftBank ? -0.8 : 0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.62, 0.62, 0.5, 24]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* Stainless Exhaust Runner with Thermal Glow */}
      <mesh position={[isLeftBank ? -1.2 : 1.2, -0.75, 0.4]} rotation={[Math.PI / 3, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.95, 16]} />
        <meshStandardMaterial
          color={getExhaustColor()}
          metalness={0.75}
          roughness={0.25}
          emissive={egt > 820 ? '#dc2626' : (egt > 780 ? '#9a3412' : '#000000')}
          emissiveIntensity={egt > 820 ? 0.8 : (egt > 780 ? 0.4 : 0)}
        />
      </mesh>

      {/* CHT Thermocouple Sensor Node */}
      <mesh position={[isLeftBank ? -1.95 : 1.95, 0.6, 0.3]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color={cht > 180 ? '#ef4444' : (cht > 165 ? '#f59e0b' : '#10b981')}
          emissive={cht > 180 ? '#ef4444' : (cht > 165 ? '#f59e0b' : '#10b981')}
          emissiveIntensity={1.4}
        />
      </mesh>

      {/* Optional In-Scene Subsystem Annotation */}
      {showAnnotations && (
        <Html position={[isLeftBank ? -2.4 : 2.4, 0.8, 0]} center distanceFactor={12}>
          <div className="bg-slate-950/90 border border-slate-700/80 px-2 py-1 rounded text-[10px] font-mono text-white whitespace-nowrap shadow-xl pointer-events-none backdrop-blur-sm">
            <span className="text-sky-400 font-bold">CYL {cylinderNumber}</span> • <span className={cht > 165 ? 'text-amber-400' : 'text-emerald-400'}>{cht.toFixed(1)}°C</span>
          </div>
        </Html>
      )}
    </group>
  );
}

// Full Opposed 4-Cylinder Engine Assembly (Rotax 914 / 915 iS Turbo Architecture)
export default function PistonEngine3D({
  telemetry,
  health,
  fault,
  activeFaults,
  showAnnotations = true,
  isStandalone = false
}) {
  const crankRef = useRef();
  const turboRef = useRef();
  const propHubRef = useRef();
  const alternatorRef = useRef();
  const angleRef = useRef(0);

  const rpm = telemetry?.rpm !== undefined ? telemetry.rpm : 4800;
  const cht = telemetry?.cht || 142.4;
  const egt = telemetry?.egt || 795.0;
  const oilP = telemetry?.oil_pressure !== undefined ? telemetry.oil_pressure : 4.2;
  const fuelFlow = telemetry?.fuel_flow !== undefined ? telemetry.fuel_flow : 18.2;
  const isEngineRunning = rpm > 100;
  const healthStatus = health?.overall_health < 70 ? 'CRITICAL' : (health?.overall_health < 85 ? 'WARNING' : 'NOMINAL');

  // Offset angles for the 4 opposed cylinders (0, 180, 90, 270 deg)
  const p1Offset = useRef(0);
  const p2Offset = useRef(Math.PI);
  const p3Offset = useRef(Math.PI / 2);
  const p4Offset = useRef(Math.PI * 1.5);

  // Dynamic 4-stroke spark firing state based on engine rotation angle
  const [firingCyl, setFiringCyl] = useState(1);

  useFrame((state, delta) => {
    // Angular velocity proportional to simulated RPM
    const angularSpeed = (rpm / 60) * Math.PI * 0.45 * delta;
    angleRef.current += angularSpeed;

    p1Offset.current = angleRef.current;
    p2Offset.current = angleRef.current + Math.PI;
    p3Offset.current = angleRef.current + Math.PI / 2;
    p4Offset.current = angleRef.current + Math.PI * 1.5;

    // Firing order for 4-cylinder: 1 -> 3 -> 2 -> 4
    if (isEngineRunning) {
      const cyclePos = (angleRef.current % (Math.PI * 4)) / (Math.PI * 4);
      if (cyclePos < 0.25) setFiringCyl(1);
      else if (cyclePos < 0.5) setFiringCyl(3);
      else if (cyclePos < 0.75) setFiringCyl(2);
      else setFiringCyl(4);
    }

    if (crankRef.current) {
      crankRef.current.rotation.z = angleRef.current;
    }
    if (turboRef.current) {
      // Turbo spins at ~3x engine speed
      turboRef.current.rotation.y += angularSpeed * 3.2;
    }
    if (propHubRef.current) {
      // 2.43:1 Gearbox reduction ratio
      propHubRef.current.rotation.z += angularSpeed / 2.43;
    }
    if (alternatorRef.current) {
      alternatorRef.current.rotation.x += angularSpeed * 2.1;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. CENTRAL CRANKCASE ENGINE BLOCK */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 1.8, 4.2]} />
        <meshStandardMaterial color="#1e293b" metalness={0.88} roughness={0.2} />
      </mesh>

      {/* ROTAX 914 TURBO Stamped Branding Plate */}
      <mesh position={[0, 0.91, 0.2]}>
        <boxGeometry args={[1.1, 0.04, 1.4]} />
        <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* 2. CENTRAL CRANKSHAFT AXIS */}
      <mesh ref={crankRef} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 4.6, 28]} />
        <meshStandardMaterial color="#64748b" metalness={0.95} roughness={0.12} />
      </mesh>

      {/* 3. PROPELLER REDUCTION GEARBOX (2.43:1 Drive Hub) */}
      <mesh position={[0, 0, 2.4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.55, 0.7, 0.8, 28]} />
        <meshStandardMaterial color="#0f172a" metalness={0.92} roughness={0.15} />
      </mesh>
      <mesh ref={propHubRef} position={[0, 0, 2.95]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.65, 24]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* 4. FOUR OPPOSED CYLINDERS (ROTAX BOXER CONFIGURATION) */}
      {/* Left Bank: Cylinders 1 & 3 */}
      <CylinderAssembly
        position={[-0.75, 0, 1.0]}
        rotation={[0, 0, 0]}
        pistonOffset={p1Offset}
        isLeftBank={true}
        cylinderNumber={1}
        healthStatus={healthStatus}
        cht={cht + (activeFaults?.injector_degradation ? 22 : 0)}
        egt={egt}
        isFiring={firingCyl === 1 && isEngineRunning}
        showAnnotations={showAnnotations && isStandalone}
      />
      <CylinderAssembly
        position={[-0.75, 0, -1.0]}
        rotation={[0, 0, 0]}
        pistonOffset={p3Offset}
        isLeftBank={true}
        cylinderNumber={3}
        healthStatus={healthStatus}
        cht={cht}
        egt={egt}
        isFiring={firingCyl === 3 && isEngineRunning}
        showAnnotations={showAnnotations && isStandalone}
      />

      {/* Right Bank: Cylinders 2 & 4 */}
      <CylinderAssembly
        position={[0.75, 0, 0.5]}
        rotation={[0, 0, 0]}
        pistonOffset={p2Offset}
        isLeftBank={false}
        cylinderNumber={2}
        healthStatus={healthStatus}
        cht={cht}
        egt={egt - (activeFaults?.misfire_severity ? 75 : 0)}
        isFiring={firingCyl === 2 && isEngineRunning}
        showAnnotations={showAnnotations && isStandalone}
      />
      <CylinderAssembly
        position={[0.75, 0, -1.5]}
        rotation={[0, 0, 0]}
        pistonOffset={p4Offset}
        isLeftBank={false}
        cylinderNumber={4}
        healthStatus={healthStatus}
        cht={cht + (activeFaults?.overheating ? 35 : 0)}
        egt={egt}
        isFiring={firingCyl === 4 && isEngineRunning}
        showAnnotations={showAnnotations && isStandalone}
      />

      {/* 5. TOP AIR INTAKE PLENUM & DUAL BOSCH EFI FUEL RAILS */}
      <mesh position={[0, 1.25, -0.2]}>
        <boxGeometry args={[1.25, 0.35, 3.2]} />
        <meshStandardMaterial color="#0284c7" metalness={0.75} roughness={0.2} />
      </mesh>
      {/* 4 Electronic Fuel Injector Nozzles */}
      {[-1.0, -0.3, 0.4, 1.1].map((posZ, idx) => (
        <group key={idx} position={[0, 1.48, posZ]}>
          <mesh>
            <cylinderGeometry args={[0.09, 0.09, 0.35, 16]} />
            <meshStandardMaterial
              color={activeFaults?.injector_degradation > 0 ? '#ef4444' : '#38bdf8'}
              emissive={activeFaults?.injector_degradation > 0 ? '#ef4444' : '#0284c7'}
              emissiveIntensity={activeFaults?.injector_degradation > 0 ? 0.9 : 0.3}
            />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* 6. BOTTOM OIL PAN & LUBRICATION SUMP */}
      <mesh position={[0, -1.15, 0]}>
        <boxGeometry args={[1.35, 0.5, 3.8]} />
        <meshStandardMaterial
          color={oilP < 2.5 ? '#ef4444' : (oilP < 3.2 ? '#f59e0b' : '#334155')}
          metalness={0.82}
          roughness={0.25}
        />
      </mesh>

      {/* Spin-on Oil Filter Canister */}
      <mesh position={[0.65, -0.9, 1.2]} rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.22, 0.22, 0.55, 20]} />
        <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 7. ELECTRIC STARTER MOTOR & ALTERNATOR */}
      {/* Starter Motor (Cranks at 280 RPM during engine start) */}
      <mesh position={[-0.85, -0.4, 1.4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.9, 20]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Alternator with Serpentine Pulley */}
      <group position={[0.75, 0.6, 1.6]}>
        <mesh ref={alternatorRef} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.28, 0.28, 0.45, 24]} />
          <meshStandardMaterial color="#475569" metalness={0.92} roughness={0.15} />
        </mesh>
      </group>

      {/* 8. TURBOCHARGER & WASTEGATE EXHAUST ASSEMBLY (AFT SECTION) */}
      <group position={[0, 0.35, -2.6]}>
        {/* Exhaust Turbine Housing */}
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.58, 0.28, 16, 28]} />
          <meshStandardMaterial
            color="#475569"
            metalness={0.82}
            roughness={0.25}
            emissive={egt > 820 ? '#b91c1c' : '#000000'}
            emissiveIntensity={egt > 820 ? 0.7 : 0}
          />
        </mesh>
        {/* Rotating Compressor Impeller */}
        <mesh ref={turboRef} position={[0, 0, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.52, 0.28, 20]} />
          <meshStandardMaterial color="#0ea5e9" metalness={0.92} roughness={0.1} />
        </mesh>
        {/* Wastegate Actuator Cylinder */}
        <mesh position={[0.65, 0.4, -0.2]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.45, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
        </mesh>
        {/* Turbocharger Intercooler Charge Air Duct */}
        <mesh position={[0, 0.85, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 2.2, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      {/* 9. FADEC ENGINE CONTROL UNIT (ECU) MODULE */}
      <mesh position={[-0.88, 0.35, -0.4]}>
        <boxGeometry args={[0.2, 0.65, 0.95]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* FADEC Status LEDs (Green/Amber/Red) */}
      <mesh position={[-0.99, 0.45, -0.3]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial
          color={healthStatus === 'CRITICAL' ? '#ef4444' : (healthStatus === 'WARNING' ? '#f59e0b' : '#10b981')}
          emissive={healthStatus === 'CRITICAL' ? '#ef4444' : (healthStatus === 'WARNING' ? '#f59e0b' : '#10b981')}
          emissiveIntensity={2.0}
        />
      </mesh>

      {/* 10. FLOATING ENGINE STATUS BEACON */}
      <Float speed={2} rotationIntensity={0.15} floatIntensity={0.25}>
        <mesh position={[0, 2.3, 0]}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial
            color={healthStatus === 'CRITICAL' ? '#ef4444' : (healthStatus === 'WARNING' ? '#f59e0b' : '#10b981')}
            emissive={healthStatus === 'CRITICAL' ? '#ef4444' : (healthStatus === 'WARNING' ? '#f59e0b' : '#10b981')}
            emissiveIntensity={1.8}
          />
        </mesh>
      </Float>

      {/* 11. STANDALONE CALLOUTS FOR HIGH-IMPACT VIVA INSPECTION */}
      {showAnnotations && isStandalone && (
        <>
          {/* Turbo Callout */}
          <Html position={[0, 1.4, -2.6]} center distanceFactor={11}>
            <div className="bg-slate-950/95 border border-sky-500/80 px-2.5 py-1 rounded text-[10px] font-mono text-white shadow-2xl backdrop-blur-md whitespace-nowrap">
              <span className="text-sky-400 font-bold">TURBOCHARGER</span> • <span className="text-amber-400">{egt}°C EGT</span>
            </div>
          </Html>

          {/* EFI Rail Callout */}
          <Html position={[0, 1.9, 0.2]} center distanceFactor={11}>
            <div className="bg-slate-950/95 border border-sky-500/80 px-2.5 py-1 rounded text-[10px] font-mono text-white shadow-2xl backdrop-blur-md whitespace-nowrap">
              <span className="text-sky-400 font-bold">BOSCH EFI FUEL RAIL</span> • <span className="text-cyan-300">{fuelFlow} L/h</span>
            </div>
          </Html>

          {/* Gearbox Callout */}
          <Html position={[0, 1.0, 2.9]} center distanceFactor={11}>
            <div className="bg-slate-950/95 border border-sky-500/80 px-2.5 py-1 rounded text-[10px] font-mono text-white shadow-2xl backdrop-blur-md whitespace-nowrap">
              <span className="text-sky-400 font-bold">REDUCTION GEARBOX (2.43:1)</span> • <span className="text-white font-bold">{Math.round(rpm / 2.43)} RPM</span>
            </div>
          </Html>

          {/* Sump Callout */}
          <Html position={[0, -1.6, 0.5]} center distanceFactor={11}>
            <div className="bg-slate-950/95 border border-sky-500/80 px-2.5 py-1 rounded text-[10px] font-mono text-white shadow-2xl backdrop-blur-md whitespace-nowrap">
              <span className="text-sky-400 font-bold">OIL SUMP</span> • <span className={oilP < 2.5 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{oilP} bar</span>
            </div>
          </Html>
        </>
      )}
    </group>
  );
}
