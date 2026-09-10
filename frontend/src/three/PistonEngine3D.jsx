/**
 * AEROTWIN AI - 3D Aero Piston Engine Digital Twin
 * Three.js / React Three Fiber Procedural Aerospace Engine
 * 4-Cylinder Turbocharged Opposed Aero Piston Engine (Rotax 914/915 iS Architecture)
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

// Individual Cylinder with Reciprocating Piston
function CylinderAssembly({ position, rotation, pistonOffset, isLeftBank, healthStatus, cht, egt }) {
  const pistonRef = useRef();

  // Color blending according to thermal state and faults
  const getCylinderColor = () => {
    if (cht > 185 || healthStatus === 'CRITICAL') return '#ef4444'; // Critical Red
    if (cht > 165 || healthStatus === 'WARNING' || healthStatus === 'ATTENTION') return '#f59e0b'; // Amber
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
      {/* Outer Cylinder Block / Cooling Fins */}
      <mesh castShadow receiveShadow position={[isLeftBank ? -1.2 : 1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.7, 0.72, 1.4, 24]} />
        <meshStandardMaterial
          color={getCylinderColor()}
          metalness={0.8}
          roughness={0.25}
          emissive={cht > 180 ? '#7f1d1d' : '#000000'}
          emissiveIntensity={cht > 180 ? 0.6 : 0}
        />
      </mesh>

      {/* Cooling Fins */}
      {[-0.4, -0.2, 0, 0.2, 0.4].map((finY, idx) => (
        <mesh key={idx} position={[(isLeftBank ? -1.2 : 1.2), finY, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.82, 0.82, 0.05, 24]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* Cylinder Head Cover */}
      <mesh position={[isLeftBank ? -1.95 : 1.95, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.72, 0.72, 0.2, 24]} />
        <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Reciprocating Piston Inside Sleeve */}
      <mesh ref={pistonRef} position={[isLeftBank ? -0.8 : 0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.62, 0.62, 0.5, 20]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* Exhaust Runner */}
      <mesh position={[isLeftBank ? -1.2 : 1.2, -0.75, 0.4]} rotation={[Math.PI / 3, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.9, 16]} />
        <meshStandardMaterial
          color={getExhaustColor()}
          metalness={0.7}
          roughness={0.3}
          emissive={egt > 850 ? '#b91c1c' : '#000000'}
          emissiveIntensity={egt > 850 ? 0.7 : 0}
        />
      </mesh>

      {/* Sensor Node Beacon (CHT Thermocouple / Piezo) */}
      <mesh position={[isLeftBank ? -1.9 : 1.9, 0.6, 0.3]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color={cht > 180 ? '#ef4444' : (cht > 165 ? '#f59e0b' : '#10b981')}
          emissive={cht > 180 ? '#ef4444' : (cht > 165 ? '#f59e0b' : '#10b981')}
          emissiveIntensity={1.2}
        />
      </mesh>
    </group>
  );
}

// Full Opposed 4-Cylinder Engine Assembly
export default function PistonEngine3D({ telemetry, health, fault, activeFaults }) {
  const crankRef = useRef();
  const turboRef = useRef();
  const angleRef = useRef(0);

  const rpm = telemetry?.rpm !== undefined ? telemetry.rpm : 4800;
  const cht = telemetry?.cht || 142;
  const egt = telemetry?.egt || 795;
  const oilP = telemetry?.oil_pressure !== undefined ? telemetry.oil_pressure : 4.2;
  const isEngineOff = rpm === 0;
  const healthStatus = health?.overall_health < 70 ? 'CRITICAL' : (health?.overall_health < 85 ? 'WARNING' : 'NOMINAL');

  // Offset angles for the 4 opposed cylinders (0, 180, 90, 270 deg)
  const p1Offset = useRef(0);
  const p2Offset = useRef(Math.PI);
  const p3Offset = useRef(Math.PI / 2);
  const p4Offset = useRef(Math.PI * 1.5);

  useFrame((state, delta) => {
    // Angular velocity proportional to real simulated RPM (scaled for visual clarity)
    const angularSpeed = (rpm / 60) * Math.PI * 0.45 * delta;
    angleRef.current += angularSpeed;

    p1Offset.current = angleRef.current;
    p2Offset.current = angleRef.current + Math.PI;
    p3Offset.current = angleRef.current + Math.PI / 2;
    p4Offset.current = angleRef.current + Math.PI * 1.5;

    if (crankRef.current) {
      crankRef.current.rotation.z = angleRef.current;
    }
    if (turboRef.current) {
      turboRef.current.rotation.y += angularSpeed * 2.8;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Central Crankcase Block */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 1.8, 4.2]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Central Rotating Crankshaft Axis */}
      <mesh ref={crankRef} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 4.6, 24]} />
        <meshStandardMaterial color="#64748b" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* Propeller Gearbox Reduction Hub */}
      <mesh position={[0, 0, 2.4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.55, 0.7, 0.8, 24]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0, 2.9]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.6, 20]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* 4 Opposed Cylinders (Rotax Boxer Configuration) */}
      {/* Left Bank: Cylinders 1 & 3 */}
      <CylinderAssembly
        position={[-0.7, 0, 1.0]}
        rotation={[0, 0, 0]}
        pistonOffset={p1Offset}
        isLeftBank={true}
        healthStatus={healthStatus}
        cht={cht + (activeFaults?.injector_degradation ? 22 : 0)}
        egt={egt}
      />
      <CylinderAssembly
        position={[-0.7, 0, -1.0]}
        rotation={[0, 0, 0]}
        pistonOffset={p3Offset}
        isLeftBank={true}
        healthStatus={healthStatus}
        cht={cht}
        egt={egt}
      />

      {/* Right Bank: Cylinders 2 & 4 */}
      <CylinderAssembly
        position={[0.7, 0, 0.5]}
        rotation={[0, 0, 0]}
        pistonOffset={p2Offset}
        isLeftBank={false}
        healthStatus={healthStatus}
        cht={cht}
        egt={egt - (activeFaults?.misfire_severity ? 75 : 0)}
      />
      <CylinderAssembly
        position={[0.7, 0, -1.5]}
        rotation={[0, 0, 0]}
        pistonOffset={p4Offset}
        isLeftBank={false}
        healthStatus={healthStatus}
        cht={cht + (activeFaults?.overheating ? 35 : 0)}
        egt={egt}
      />

      {/* Top Intake Plenum & Electronic Fuel Injection (EFI) Rails */}
      <mesh position={[0, 1.2, -0.2]}>
        <boxGeometry args={[1.2, 0.35, 3.2]} />
        <meshStandardMaterial color="#0284c7" metalness={0.75} roughness={0.2} />
      </mesh>
      {/* Injector Nozzles */}
      {[-1.0, -0.3, 0.4, 1.1].map((posZ, idx) => (
        <mesh key={idx} position={[0, 1.45, posZ]}>
          <cylinderGeometry args={[0.08, 0.08, 0.35, 16]} />
          <meshStandardMaterial
            color={activeFaults?.injector_degradation > 0 ? '#ef4444' : '#38bdf8'}
            emissive={activeFaults?.injector_degradation > 0 ? '#ef4444' : '#38bdf8'}
            emissiveIntensity={activeFaults?.injector_degradation > 0 ? 0.9 : 0.2}
          />
        </mesh>
      ))}

      {/* Bottom Oil Pan / Sump */}
      <mesh position={[0, -1.1, 0]}>
        <boxGeometry args={[1.3, 0.45, 3.6]} />
        <meshStandardMaterial
          color={oilP < 2.5 ? '#ef4444' : (oilP < 3.2 ? '#f59e0b' : '#334155')}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Turbocharger Assembly at Aft */}
      <group position={[0, 0.4, -2.5]}>
        {/* Turbine Housing */}
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.55, 0.25, 16, 24]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Rotating Compressor Impeller */}
        <mesh ref={turboRef} position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.38, 0.48, 0.25, 16]} />
          <meshStandardMaterial color="#0ea5e9" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Status HUD Annotation Marker */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
        <mesh position={[0, 2.2, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial
            color={healthStatus === 'CRITICAL' ? '#ef4444' : (healthStatus === 'WARNING' ? '#f59e0b' : '#10b981')}
            emissive={healthStatus === 'CRITICAL' ? '#ef4444' : (healthStatus === 'WARNING' ? '#f59e0b' : '#10b981')}
            emissiveIntensity={1.5}
          />
        </mesh>
      </Float>
    </group>
  );
}
