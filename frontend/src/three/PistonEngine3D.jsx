/**
 * AEROTWIN AI — High-Fidelity Rotax 912/914 Flat-4 Boxer Engine 3D Model
 * Matches reference wireframe: 4-cylinder opposed, 2-blade prop, reduction gearbox,
 * twin magnetos, pushrod tubes, wiring harness, oil sump.
 */

import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// ─── Utility: reusable Tube curve ────────────────────────────────────────────
function CurveTube({ points, radius = 0.025, color = '#1e293b', segments = 20, metalness = 0.7, roughness = 0.4 }) {
  const curve = useMemo(() => {
    const v = points.map(p => new THREE.Vector3(...p));
    return new THREE.CatmullRomCurve3(v);
  }, []);
  const geo = useMemo(() => new THREE.TubeGeometry(curve, segments, radius, 8, false), [curve, radius, segments]);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

// ─── Individual Air-Cooled Cylinder (bulbous, finned, like the reference) ────
function BoxerCylinder({ position, rotation = [0, 0, 0], cylinderNumber, pistonOffset, isLeftBank, cht = 145, egt = 800, isEngineRunning, isEngineStarting, activeFaults = [] }) {
  const pistonRef = useRef();
  const conrodRef = useRef();
  const flameRef = useRef();
  const [hovered, setHovered] = useState(false);

  const isCritical = cht > 185 || activeFaults.some(f => f?.cylinder === cylinderNumber);
  const isWarning = cht > 165;

  const cylColor = isCritical ? '#dc2626' : isWarning ? '#d97706' : '#374151';
  const cylEmissive = isCritical ? '#7f1d1d' : isWarning ? '#451a03' : '#000000';
  const cylEmissiveInt = isCritical ? 0.8 : isWarning ? 0.4 : 0;

  // Cylinder barrel length along local X axis
  const barrelLen = 1.5;
  const sign = isLeftBank ? -1 : 1;

  useFrame((state, delta) => {
    const angle = pistonOffset.current;
    if (pistonRef.current) {
      pistonRef.current.position.x = sign * (0.6 + Math.sin(angle) * 0.38);
    }
    if (conrodRef.current) {
      conrodRef.current.rotation.z = Math.cos(angle) * 0.22 * sign;
    }
    if (flameRef.current) {
      if (isEngineRunning || isEngineStarting) {
        flameRef.current.intensity = Math.max(0, Math.sin(angle)) * (egt > 820 ? 3.5 : 2.0);
      } else {
        flameRef.current.intensity = 0;
      }
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* === Cylinder Barrel (main tube) === */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.68, 0.72, barrelLen, 28]} />
        <meshStandardMaterial
          color={cylColor}
          metalness={0.85}
          roughness={0.22}
          emissive={cylEmissive}
          emissiveIntensity={cylEmissiveInt}
        />
      </mesh>

      {/* === Cooling Fins (circumferential) === */}
      {[-0.55, -0.38, -0.22, -0.06, 0.1, 0.26, 0.42, 0.58].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.84, 0.84, 0.035, 28]} />
          <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.15} />
        </mesh>
      ))}

      {/* === Cylinder Head (dome end) === */}
      <mesh position={[sign * 0.82, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.7, 0.7, 0.28, 28]} />
        <meshStandardMaterial color="#111827" metalness={0.9} roughness={0.18} />
      </mesh>
      {/* Head fin ring */}
      {[-0.05, 0.08].map((off, i) => (
        <mesh key={i} position={[sign * (0.82 + off), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.76, 0.76, 0.03, 28]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* === Rocker Cover (top flat cover) === */}
      <mesh position={[sign * 1.0, 0.18, 0]}>
        <boxGeometry args={[0.28, 0.26, 0.6]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.75} roughness={0.3} />
      </mesh>

      {/* === Dual Spark Plugs === */}
      {[0.28, -0.28].map((zOff, i) => (
        <group key={i} position={[sign * 0.9, 0.68, zOff]} rotation={[0, 0, isLeftBank ? -0.3 : 0.3]}>
          <mesh>
            <cylinderGeometry args={[0.05, 0.05, 0.28, 10]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.1} />
          </mesh>
          {/* Ignition lead */}
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.14, 8]} />
            <meshStandardMaterial color="#ca8a04" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* === Pushrod Tube === */}
      <mesh position={[sign * 0.5, 0.55, 0.15]} rotation={[0, 0, isLeftBank ? -0.15 : 0.15]}>
        <cylinderGeometry args={[0.045, 0.045, 0.95, 10]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* === Combustion flash light === */}
      <pointLight
        ref={flameRef}
        position={[sign * 0.78, 0, 0]}
        color={egt > 840 ? '#f97316' : '#38bdf8'}
        distance={2.2}
        intensity={0}
      />

      {/* === Reciprocating Piston === */}
      <group ref={pistonRef} position={[sign * 0.6, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.62, 0.62, 0.48, 22]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.97} roughness={0.1} />
        </mesh>
      </group>

      {/* === Connecting Rod === */}
      <group ref={conrodRef} position={[0, 0, 0]}>
        <mesh position={[sign * 0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.12, 0.7, 0.1]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* === Hover label (cylinder badge) === */}
      {hovered && (
        <Html distanceFactor={10} position={[sign * 1.2, 1.1, 0]} center>
          <div className="px-2 py-1 rounded text-[9px] font-mono font-bold whitespace-nowrap border border-sky-400 bg-slate-950/95 text-sky-200 pointer-events-none shadow-xl">
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isCritical ? '#ef4444' : '#10b981' }} />
              <span>CYL #{cylinderNumber}</span>
              <span className="text-white font-bold ml-1">{Number(cht).toFixed(1)}°C</span>
            </div>
          </div>
        </Html>
      )}

      {/* invisible hitbox for hover */}
      <mesh
        position={[sign * 0.5, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        visible={false}
        onPointerOver={e => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.9, 0.9, 1.8, 12]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

// ─── Main Engine Component ────────────────────────────────────────────────────
export default function PistonEngine3D({ telemetry, health, fault, activeFaults = [], isEngineRunning: isRunningProp }) {
  const crankRef = useRef();
  const propRef = useRef();
  const gearRef = useRef();

  // Firing angle references for all 4 cylinders (0°, 180°, 90°, 270°)
  const p1 = useRef(0);
  const p2 = useRef(Math.PI);
  const p3 = useRef(Math.PI / 2);
  const p4 = useRef(Math.PI * 1.5);

  const rpm    = telemetry?.rpm         !== undefined ? telemetry.rpm         : 4800;
  const cht    = telemetry?.cht         || 145;
  const egt    = telemetry?.egt         || 800;
  const oilP   = telemetry?.oil_pressure !== undefined ? telemetry.oil_pressure : 4.2;
  const fuelFlow = telemetry?.fuel_flow || 18.5;

  const isEngineOff      = rpm === 0;
  const isEngineStarting = rpm > 0 && rpm < 500;
  const isEngineRunning  = isRunningProp !== undefined ? isRunningProp : rpm >= 500;

  const healthStatus = health?.overall_health < 70 ? 'CRITICAL' : health?.overall_health < 85 ? 'WARNING' : 'NOMINAL';

  useFrame((state, delta) => {
    const rps = (rpm / 60) * delta * Math.PI * 2;
    // Crankshaft
    if (crankRef.current && isEngineRunning) crankRef.current.rotation.x += rps;
    // Prop (via reduction gear ~2.43:1 ratio typical Rotax)
    if (propRef.current) {
      if (isEngineRunning) propRef.current.rotation.x += rps / 2.43;
      else if (isEngineStarting) propRef.current.rotation.x += rps * 0.5;
    }
    // Firing offsets
    const crankSpeed = rps;
    [p1, p2, p3, p4].forEach(p => { p.current += crankSpeed; });
  });

  const metalAlu = { metalness: 0.88, roughness: 0.18 };
  const metalSteel = { metalness: 0.92, roughness: 0.12 };

  return (
    <group position={[0, 0, 0]} scale={[0.88, 0.88, 0.88]}>

      {/* ══════════════════════════════════════════════════════════════
          1. CRANKCASE — Central engine block (magnesium/aluminum casting)
      ══════════════════════════════════════════════════════════════ */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.9, 1.0]} />
        <meshStandardMaterial color="#334155" {...metalAlu} />
      </mesh>
      {/* Crankcase side ribs */}
      {[-0.35, 0, 0.35].map((z, i) => (
        <mesh key={i} position={[0, 0, z]}>
          <boxGeometry args={[1.25, 0.12, 0.06]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* ══════════════════════════════════════════════════════════════
          2. CRANKSHAFT (visible through crankcase — center shaft)
      ══════════════════════════════════════════════════════════════ */}
      <group ref={crankRef}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.12, 1.4, 18]} />
          <meshStandardMaterial color="#94a3b8" {...metalSteel} />
        </mesh>
        {/* Crankshaft counterweights */}
        {[-0.3, 0.3].map((x, i) => (
          <mesh key={i} position={[x, 0.18, 0]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.08, 0.36, 0.14]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.15} />
          </mesh>
        ))}
      </group>

      {/* ══════════════════════════════════════════════════════════════
          3. REDUCTION GEARBOX (front — between engine and prop)
      ══════════════════════════════════════════════════════════════ */}
      <group position={[-1.5, 0, 0]}>
        {/* Gearbox housing */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.52, 0.6, 0.55, 28]} />
          <meshStandardMaterial color="#1e293b" {...metalAlu} />
        </mesh>
        {/* Gearbox rear flange */}
        <mesh position={[0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.64, 0.64, 0.06, 28]} />
          <meshStandardMaterial color="#0f172a" metalness={0.88} roughness={0.2} />
        </mesh>
        {/* Prop shaft */}
        <mesh position={[-0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.14, 0.14, 0.55, 16]} />
          <meshStandardMaterial color="#94a3b8" {...metalSteel} />
        </mesh>
        {/* Bolts around gearbox */}
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[0.28, Math.sin(a) * 0.56, Math.cos(a) * 0.56]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.06, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.95} roughness={0.1} />
            </mesh>
          );
        })}
      </group>

      {/* ══════════════════════════════════════════════════════════════
          4. PROPELLER — 2-blade, tapered airfoil cross-section
      ══════════════════════════════════════════════════════════════ */}
      <group ref={propRef} position={[-2.25, 0, 0]} rotation={[0, 0, 0]}>
        {/* Prop hub / spinner */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.18, 0.35, 20]} />
          <meshStandardMaterial color="#1e293b" {...metalSteel} />
        </mesh>
        <mesh position={[-0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.18, 0.3, 20]} />
          <meshStandardMaterial color="#1e293b" {...metalSteel} />
        </mesh>

        {/* Blade 1 (top) */}
        <group rotation={[0, 0, 0]}>
          {/* Blade root */}
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.26, 12]} />
            <meshStandardMaterial color="#334155" {...metalAlu} />
          </mesh>
          {/* Blade span — tapered box */}
          <mesh position={[0, 1.0, 0]} rotation={[0.12, 0, 0]}>
            <boxGeometry args={[0.06, 1.45, 0.28]} />
            <meshStandardMaterial color="#475569" metalness={0.78} roughness={0.3} />
          </mesh>
          {/* Blade tip */}
          <mesh position={[0, 1.82, 0.02]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.05, 0.22, 0.16]} />
            <meshStandardMaterial color="#374151" metalness={0.78} roughness={0.3} />
          </mesh>
        </group>

        {/* Blade 2 (bottom, 180°) */}
        <group rotation={[Math.PI, 0, 0]}>
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.26, 12]} />
            <meshStandardMaterial color="#334155" {...metalAlu} />
          </mesh>
          <mesh position={[0, 1.0, 0]} rotation={[0.12, 0, 0]}>
            <boxGeometry args={[0.06, 1.45, 0.28]} />
            <meshStandardMaterial color="#475569" metalness={0.78} roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.82, 0.02]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.05, 0.22, 0.16]} />
            <meshStandardMaterial color="#374151" metalness={0.78} roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* ══════════════════════════════════════════════════════════════
          5. FOUR BOXER CYLINDERS (flat-4, opposed)
          Left bank: CYL 1 (front-left) + CYL 3 (rear-left)
          Right bank: CYL 2 (front-right) + CYL 4 (rear-right)
      ══════════════════════════════════════════════════════════════ */}
      {/* CYL 1 — front-left */}
      <BoxerCylinder
        position={[-0.3, 0, -0.5]}
        cylinderNumber={1}
        pistonOffset={p1}
        isLeftBank={true}
        cht={cht}
        egt={egt}
        isEngineRunning={isEngineRunning}
        isEngineStarting={isEngineStarting}
        activeFaults={activeFaults}
      />
      {/* CYL 2 — front-right */}
      <BoxerCylinder
        position={[-0.3, 0, 0.5]}
        cylinderNumber={2}
        pistonOffset={p2}
        isLeftBank={false}
        cht={cht * 0.98}
        egt={egt * 0.97}
        isEngineRunning={isEngineRunning}
        isEngineStarting={isEngineStarting}
        activeFaults={activeFaults}
      />
      {/* CYL 3 — rear-left */}
      <BoxerCylinder
        position={[0.45, 0, -0.5]}
        cylinderNumber={3}
        pistonOffset={p3}
        isLeftBank={true}
        cht={cht * 1.02}
        egt={egt * 1.03}
        isEngineRunning={isEngineRunning}
        isEngineStarting={isEngineStarting}
        activeFaults={activeFaults}
      />
      {/* CYL 4 — rear-right */}
      <BoxerCylinder
        position={[0.45, 0, 0.5]}
        cylinderNumber={4}
        pistonOffset={p4}
        isLeftBank={false}
        cht={cht * 0.99}
        egt={egt * 1.01}
        isEngineRunning={isEngineRunning}
        isEngineStarting={isEngineStarting}
        activeFaults={activeFaults}
      />

      {/* ══════════════════════════════════════════════════════════════
          6. EXHAUST RUNNERS (4-into-2-into-1 stainless)
      ══════════════════════════════════════════════════════════════ */}
      {/* CYL 1 runner */}
      <CurveTube
        points={[[-0.3, -0.78, -0.5], [-0.4, -1.1, -0.4], [-0.5, -1.35, 0], [-0.4, -1.45, 0.2]]}
        radius={0.09}
        color={egt > 840 ? '#b91c1c' : '#475569'}
        metalness={0.78}
        roughness={0.28}
        segments={16}
      />
      {/* CYL 2 runner */}
      <CurveTube
        points={[[-0.3, -0.78, 0.5], [-0.4, -1.1, 0.35], [-0.5, -1.35, 0.1], [-0.4, -1.45, 0.2]]}
        radius={0.09}
        color={egt > 840 ? '#b91c1c' : '#475569'}
        metalness={0.78}
        roughness={0.28}
        segments={16}
      />
      {/* CYL 3 runner */}
      <CurveTube
        points={[[0.45, -0.78, -0.5], [0.55, -1.0, -0.35], [0.6, -1.28, 0], [0.55, -1.45, 0.2]]}
        radius={0.09}
        color={egt > 840 ? '#b91c1c' : '#475569'}
        metalness={0.78}
        roughness={0.28}
        segments={16}
      />
      {/* CYL 4 runner */}
      <CurveTube
        points={[[0.45, -0.78, 0.5], [0.55, -1.0, 0.4], [0.6, -1.28, 0.2], [0.55, -1.45, 0.2]]}
        radius={0.09}
        color={egt > 840 ? '#b91c1c' : '#475569'}
        metalness={0.78}
        roughness={0.28}
        segments={16}
      />
      {/* Collector / muffler */}
      <mesh position={[0.1, -1.55, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.7, 16]} />
        <meshStandardMaterial color="#374151" metalness={0.82} roughness={0.25} />
      </mesh>

      {/* ══════════════════════════════════════════════════════════════
          7. TWIN MAGNETOS (rear of engine)
      ══════════════════════════════════════════════════════════════ */}
      {/* Magneto 1 */}
      <group position={[0.72, 0.28, -0.35]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.42, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.04, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.1, 10]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
      {/* Magneto 2 */}
      <group position={[0.72, 0.28, 0.35]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.42, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.04, -0.24]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.1, 10]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════════════
          8. IGNITION WIRING HARNESS (yellow wires running to cylinders)
      ══════════════════════════════════════════════════════════════ */}
      <CurveTube points={[[0.72, 0.28, -0.35], [0.2, 0.55, -0.5], [-0.3, 0.72, -0.5]]} radius={0.02} color="#ca8a04" segments={12} metalness={0.3} roughness={0.6} />
      <CurveTube points={[[0.72, 0.28, -0.35], [0.55, 0.55, -0.5], [0.45, 0.72, -0.5]]} radius={0.02} color="#ca8a04" segments={12} metalness={0.3} roughness={0.6} />
      <CurveTube points={[[0.72, 0.28, 0.35], [0.2, 0.55, 0.5], [-0.3, 0.72, 0.5]]} radius={0.02} color="#ca8a04" segments={12} metalness={0.3} roughness={0.6} />
      <CurveTube points={[[0.72, 0.28, 0.35], [0.55, 0.55, 0.5], [0.45, 0.72, 0.5]]} radius={0.02} color="#ca8a04" segments={12} metalness={0.3} roughness={0.6} />

      {/* ══════════════════════════════════════════════════════════════
          9. OIL SUMP (bottom)
      ══════════════════════════════════════════════════════════════ */}
      <mesh position={[0.08, -0.6, 0]}>
        <boxGeometry args={[1.05, 0.32, 0.88]} />
        <meshStandardMaterial color="#0f172a" metalness={0.86} roughness={0.22} />
      </mesh>
      {/* Oil drain plug */}
      <mesh position={[0.08, -0.78, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.1, 10]} />
        <meshStandardMaterial color="#334155" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* ══════════════════════════════════════════════════════════════
          10. OIL COOLER / RADIATOR (left side, rear)
      ══════════════════════════════════════════════════════════════ */}
      <group position={[0.55, -0.1, -0.92]}>
        <mesh>
          <boxGeometry args={[0.5, 0.55, 0.1]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
        </mesh>
        {/* Cooler fins */}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} position={[0, -0.22 + i * 0.09, 0.06]}>
            <boxGeometry args={[0.48, 0.02, 0.04]} />
            <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.15} />
          </mesh>
        ))}
        {/* Oil cooler pipes */}
        <CurveTube points={[[0, 0.25, 0.05], [0, 0.45, 0], [-0.3, 0.6, 0]]} radius={0.04} color="#374151" segments={10} metalness={0.85} roughness={0.2} />
        <CurveTube points={[[0, -0.25, 0.05], [0, -0.45, 0], [-0.3, -0.5, 0]]} radius={0.04} color="#374151" segments={10} metalness={0.85} roughness={0.2} />
      </group>

      {/* ══════════════════════════════════════════════════════════════
          11. CARBURETTOR / THROTTLE BODY (right side rear)
      ══════════════════════════════════════════════════════════════ */}
      <group position={[0.6, 0.15, 0.88]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.38, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Air intake snorkel */}
        <mesh position={[0, 0, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.16, 0.35, 14]} />
          <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.35} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════════════
          12. FUEL / OIL LINES (rubber hoses, various colours)
      ══════════════════════════════════════════════════════════════ */}
      {/* Fuel line (blue) */}
      <CurveTube
        points={[[0.6, 0.15, 0.88], [0.3, -0.3, 0.7], [0, -0.5, 0.5], [-0.5, -0.4, 0.2]]}
        radius={0.03}
        color="#1d4ed8"
        segments={18}
        metalness={0.3}
        roughness={0.7}
      />
      {/* Oil pressure line (red) */}
      <CurveTube
        points={[[0.08, -0.7, 0.1], [0.3, -0.5, 0.4], [0.5, 0.1, 0.6]]}
        radius={0.025}
        color="#dc2626"
        segments={12}
        metalness={0.3}
        roughness={0.7}
      />
      {/* Breather hose (black) */}
      <CurveTube
        points={[[0.08, -0.55, -0.3], [0.3, -0.4, -0.6], [0.6, -0.2, -0.8]]}
        radius={0.03}
        color="#111827"
        segments={10}
        metalness={0.3}
        roughness={0.8}
      />

      {/* ══════════════════════════════════════════════════════════════
          13. ENGINE MOUNT FRAME (chromoly tube frame — 4 tubes)
      ══════════════════════════════════════════════════════════════ */}
      {[[-0.44, -0.44], [-0.44, 0.44], [0.44, -0.44], [0.44, 0.44]].map(([y, z], i) => (
        <mesh key={i} position={[0.5, y * 0.65, z * 0.65]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.65, 8]} />
          <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
      {/* Mount firewall plate */}
      <mesh position={[0.85, 0, 0]}>
        <boxGeometry args={[0.06, 0.95, 0.95]} />
        <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
      </mesh>
    </group>
  );
}
