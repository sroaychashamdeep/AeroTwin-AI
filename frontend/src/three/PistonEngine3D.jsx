/**
 * AEROTWIN AI — Rotax 912/914 Flat-4 Boxer Engine 3D Model
 * Stable, crash-free build: all geometries pre-created, no dynamic useMemo chains.
 */

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// ─── Simple straight tube between two points ─────────────────────────────────
function StraightTube({ from, to, radius = 0.03, color = '#374151' }) {
  const start = new THREE.Vector3(...from);
  const end   = new THREE.Vector3(...to);
  const dir   = new THREE.Vector3().subVectors(end, start);
  const len   = dir.length();
  const mid   = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

  // Orientation quaternion: default cylinder is along Y; we need it along dir
  const up  = new THREE.Vector3(0, 1, 0);
  const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
  const euler = new THREE.Euler().setFromQuaternion(quat);

  return (
    <mesh position={mid.toArray()} rotation={euler.toArray()}>
      <cylinderGeometry args={[radius, radius, len, 8]} />
      <meshStandardMaterial color={color} metalness={0.7} roughness={0.4} />
    </mesh>
  );
}

// ─── Individual Air-Cooled Boxer Cylinder ────────────────────────────────────
function BoxerCylinder({
  position,
  cylinderNumber,
  pistonOffset,
  isLeftBank,
  cht = 145,
  egt = 800,
  isEngineRunning,
  isEngineStarting,
  activeFaults = []
}) {
  const pistonRef = useRef();
  const flameRef  = useRef();
  const [hovered, setHovered] = useState(false);

  // Safe fault check — activeFaults can contain strings or objects
  const isCritical = cht > 185 || (Array.isArray(activeFaults) && activeFaults.some(f => typeof f === 'object' && f && f.cylinder === cylinderNumber));
  const isWarning  = cht > 165;

  const cylColor       = isCritical ? '#dc2626' : isWarning ? '#d97706' : '#374151';
  const cylEmissive    = isCritical ? '#7f1d1d' : isWarning ? '#451a03' : '#000000';
  const cylEmissiveInt = isCritical ? 0.8 : isWarning ? 0.4 : 0;

  const sign = isLeftBank ? -1 : 1;

  useFrame((_, delta) => {
    const angle = pistonOffset.current;
    if (pistonRef.current) {
      pistonRef.current.position.x = sign * (0.55 + Math.sin(angle) * 0.35);
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
    <group position={position}>

      {/* Cylinder Barrel */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.65, 0.68, 1.4, 26]} />
        <meshStandardMaterial color={cylColor} metalness={0.85} roughness={0.22}
          emissive={cylEmissive} emissiveIntensity={cylEmissiveInt} />
      </mesh>

      {/* Cooling Fins */}
      {[-0.5, -0.34, -0.18, -0.02, 0.14, 0.3, 0.46].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.82, 0.82, 0.032, 26]} />
          <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.15} />
        </mesh>
      ))}

      {/* Cylinder Head */}
      <mesh position={[sign * 0.78, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.68, 0.68, 0.26, 26]} />
        <meshStandardMaterial color="#111827" metalness={0.9} roughness={0.18} />
      </mesh>

      {/* Head fin ring */}
      <mesh position={[sign * 0.86, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.74, 0.74, 0.03, 26]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Rocker Cover */}
      <mesh position={[sign * 0.95, 0.22, 0]}>
        <boxGeometry args={[0.26, 0.24, 0.55]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Spark Plug 1 */}
      <mesh position={[sign * 0.85, 0.72, 0.22]} rotation={[0, 0, isLeftBank ? -0.3 : 0.3]}>
        <cylinderGeometry args={[0.045, 0.045, 0.25, 10]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.1} />
      </mesh>
      {/* Spark Plug 2 */}
      <mesh position={[sign * 0.85, 0.72, -0.22]} rotation={[0, 0, isLeftBank ? -0.3 : 0.3]}>
        <cylinderGeometry args={[0.045, 0.045, 0.25, 10]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.1} />
      </mesh>

      {/* Pushrod Tube */}
      <mesh position={[sign * 0.42, 0.58, 0.14]} rotation={[0, 0, isLeftBank ? -0.12 : 0.12]}>
        <cylinderGeometry args={[0.04, 0.04, 0.88, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Combustion Flash */}
      <pointLight ref={flameRef} position={[sign * 0.75, 0, 0]}
        color={egt > 840 ? '#f97316' : '#38bdf8'} distance={2.0} intensity={0} />

      {/* Piston */}
      <group ref={pistonRef} position={[sign * 0.55, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.6, 0.6, 0.44, 20]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.97} roughness={0.1} />
        </mesh>
      </group>

      {/* Hover badge */}
      {hovered && (
        <Html distanceFactor={9} position={[sign * 1.2, 1.1, 0]} center>
          <div style={{
            padding: '3px 8px', borderRadius: 4, fontSize: 9, fontFamily: 'monospace',
            fontWeight: 700, whiteSpace: 'nowrap', border: '1px solid #38bdf8',
            background: 'rgba(2,6,23,0.95)', color: '#bae6fd', pointerEvents: 'none'
          }}>
            CYL #{cylinderNumber} — {Number(cht).toFixed(1)}°C
          </div>
        </Html>
      )}

      {/* Invisible hover target */}
      <mesh rotation={[0, 0, Math.PI / 2]} visible={false}
        onPointerOver={e => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}>
        <cylinderGeometry args={[0.85, 0.85, 1.6, 10]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

// ─── 2-blade Propeller ───────────────────────────────────────────────────────
function Propeller({ groupRef }) {
  return (
    <group ref={groupRef} position={[-2.18, 0, 0]}>
      {/* Spinner cone */}
      <mesh position={[-0.22, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.18, 0.32, 18]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Hub */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.32, 18]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Blade 1 — UP */}
      <group>
        {/* Root block */}
        <mesh position={[0, 0.26, 0]}>
          <cylinderGeometry args={[0.095, 0.095, 0.24, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Main span */}
        <mesh position={[0, 1.08, 0.0]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[0.065, 1.52, 0.26]} />
          <meshStandardMaterial color="#475569" metalness={0.78} roughness={0.28} />
        </mesh>
        {/* Tip */}
        <mesh position={[0, 1.9, 0.02]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.05, 0.2, 0.14]} />
          <meshStandardMaterial color="#374151" metalness={0.75} roughness={0.3} />
        </mesh>
      </group>

      {/* Blade 2 — DOWN (180°) */}
      <group rotation={[Math.PI, 0, 0]}>
        <mesh position={[0, 0.26, 0]}>
          <cylinderGeometry args={[0.095, 0.095, 0.24, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[0, 1.08, 0.0]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[0.065, 1.52, 0.26]} />
          <meshStandardMaterial color="#475569" metalness={0.78} roughness={0.28} />
        </mesh>
        <mesh position={[0, 1.9, 0.02]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.05, 0.2, 0.14]} />
          <meshStandardMaterial color="#374151" metalness={0.75} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function PistonEngine3D({ telemetry, health, fault, activeFaults, isEngineRunning: isRunningProp }) {
  const crankRef = useRef();
  const propRef  = useRef();

  // Firing angle refs — one per cylinder
  const p1 = useRef(0);
  const p2 = useRef(Math.PI);
  const p3 = useRef(Math.PI / 2);
  const p4 = useRef(Math.PI * 1.5);

  const rpm      = Number(telemetry?.rpm)          || 4800;
  const cht      = Number(telemetry?.cht)          || 145;
  const egt      = Number(telemetry?.egt)          || 800;
  const oilP     = Number(telemetry?.oil_pressure) || 4.2;
  const fuelFlow = Number(telemetry?.fuel_flow)    || 18.5;
  const safeActiveFaults = Array.isArray(activeFaults) ? activeFaults : [];

  const isEngineOff      = rpm === 0;
  const isEngineStarting = rpm > 0 && rpm < 500;
  const isEngineRunning  = isRunningProp !== undefined ? isRunningProp : rpm >= 500;

  useFrame((_, delta) => {
    const rps = (rpm / 60) * delta * Math.PI * 2;
    if (crankRef.current && (isEngineRunning || isEngineStarting)) {
      crankRef.current.rotation.x += rps;
    }
    if (propRef.current) {
      if (isEngineRunning) propRef.current.rotation.x += rps / 2.43;
      else if (isEngineStarting) propRef.current.rotation.x += rps * 0.4;
    }
    p1.current += rps;
    p2.current += rps;
    p3.current += rps;
    p4.current += rps;
  });

  return (
    <group scale={[0.82, 0.82, 0.82]}>

      {/* ── 1. CRANKCASE ─────────────────────────────────────────────── */}
      <mesh castShadow>
        <boxGeometry args={[1.18, 0.86, 0.96]} />
        <meshStandardMaterial color="#334155" metalness={0.88} roughness={0.18} />
      </mesh>
      {/* Crankcase ribs */}
      {[-0.32, 0, 0.32].map((z, i) => (
        <mesh key={i} position={[0, 0, z]}>
          <boxGeometry args={[1.22, 0.1, 0.05]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* ── 2. CRANKSHAFT ────────────────────────────────────────────── */}
      <group ref={crankRef}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.11, 0.11, 1.35, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.12} />
        </mesh>
      </group>

      {/* ── 3. REDUCTION GEARBOX ─────────────────────────────────────── */}
      <group position={[-1.42, 0, 0]}>
        {/* Housing */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.58, 0.52, 24]} />
          <meshStandardMaterial color="#1e293b" metalness={0.88} roughness={0.18} />
        </mesh>
        {/* Rear flange */}
        <mesh position={[0.28, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.62, 0.62, 0.06, 24]} />
          <meshStandardMaterial color="#0f172a" metalness={0.88} roughness={0.2} />
        </mesh>
        {/* Prop output shaft */}
        <mesh position={[-0.32, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.13, 0.13, 0.5, 14]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.12} />
        </mesh>
        {/* Bolts */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[0.27, Math.sin(a) * 0.54, Math.cos(a) * 0.54]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.035, 0.035, 0.055, 6]} />
              <meshStandardMaterial color="#475569" metalness={0.95} roughness={0.1} />
            </mesh>
          );
        })}
      </group>

      {/* ── 4. PROPELLER ─────────────────────────────────────────────── */}
      <Propeller groupRef={propRef} />

      {/* ── 5. FOUR BOXER CYLINDERS ──────────────────────────────────── */}
      {/* CYL 1 — front left */}
      <BoxerCylinder position={[-0.28, 0, -0.48]} cylinderNumber={1} pistonOffset={p1}
        isLeftBank={true} cht={cht} egt={egt}
        isEngineRunning={isEngineRunning} isEngineStarting={isEngineStarting}
        activeFaults={safeActiveFaults} />
      {/* CYL 2 — front right */}
      <BoxerCylinder position={[-0.28, 0, 0.48]} cylinderNumber={2} pistonOffset={p2}
        isLeftBank={false} cht={cht * 0.98} egt={egt * 0.97}
        isEngineRunning={isEngineRunning} isEngineStarting={isEngineStarting}
        activeFaults={safeActiveFaults} />
      {/* CYL 3 — rear left */}
      <BoxerCylinder position={[0.44, 0, -0.48]} cylinderNumber={3} pistonOffset={p3}
        isLeftBank={true} cht={cht * 1.02} egt={egt * 1.03}
        isEngineRunning={isEngineRunning} isEngineStarting={isEngineStarting}
        activeFaults={safeActiveFaults} />
      {/* CYL 4 — rear right */}
      <BoxerCylinder position={[0.44, 0, 0.48]} cylinderNumber={4} pistonOffset={p4}
        isLeftBank={false} cht={cht * 0.99} egt={egt * 1.01}
        isEngineRunning={isEngineRunning} isEngineStarting={isEngineStarting}
        activeFaults={safeActiveFaults} />

      {/* ── 6. EXHAUST RUNNERS ───────────────────────────────────────── */}
      {/* Cyl 1 */}
      <StraightTube from={[-0.28, -0.72, -0.48]} to={[-0.18, -1.25, -0.1]}  radius={0.085} color={egt > 840 ? '#b91c1c' : '#4b5563'} />
      <StraightTube from={[-0.18, -1.25, -0.1]}  to={[0.0,  -1.45, 0.05]} radius={0.085} color={egt > 840 ? '#b91c1c' : '#4b5563'} />
      {/* Cyl 2 */}
      <StraightTube from={[-0.28, -0.72, 0.48]}  to={[-0.18, -1.25, 0.12]}  radius={0.085} color={egt > 840 ? '#b91c1c' : '#4b5563'} />
      <StraightTube from={[-0.18, -1.25, 0.12]}  to={[0.0,  -1.45, 0.05]} radius={0.085} color={egt > 840 ? '#b91c1c' : '#4b5563'} />
      {/* Cyl 3 */}
      <StraightTube from={[0.44, -0.72, -0.48]}  to={[0.32, -1.2, -0.1]}  radius={0.085} color={egt > 840 ? '#b91c1c' : '#4b5563'} />
      <StraightTube from={[0.32, -1.2, -0.1]}    to={[0.0,  -1.45, 0.05]} radius={0.085} color={egt > 840 ? '#b91c1c' : '#4b5563'} />
      {/* Cyl 4 */}
      <StraightTube from={[0.44, -0.72, 0.48]}   to={[0.32, -1.2, 0.12]}  radius={0.085} color={egt > 840 ? '#b91c1c' : '#4b5563'} />
      <StraightTube from={[0.32, -1.2, 0.12]}    to={[0.0,  -1.45, 0.05]} radius={0.085} color={egt > 840 ? '#b91c1c' : '#4b5563'} />
      {/* Collector */}
      <mesh position={[0.0, -1.55, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.68, 14]} />
        <meshStandardMaterial color="#374151" metalness={0.82} roughness={0.25} />
      </mesh>

      {/* ── 7. TWIN MAGNETOS (rear) ───────────────────────────────────── */}
      <group position={[0.7, 0.3, -0.34]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.38, 14]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
        </mesh>
      </group>
      <group position={[0.7, 0.3, 0.34]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.38, 14]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
        </mesh>
      </group>

      {/* ── 8. IGNITION LEADS (yellow wires) ─────────────────────────── */}
      <StraightTube from={[0.7, 0.3, -0.34]} to={[-0.28, 0.72, -0.48]} radius={0.018} color="#ca8a04" />
      <StraightTube from={[0.7, 0.3, -0.34]} to={[0.44,  0.72, -0.48]} radius={0.018} color="#ca8a04" />
      <StraightTube from={[0.7, 0.3,  0.34]} to={[-0.28, 0.72,  0.48]} radius={0.018} color="#ca8a04" />
      <StraightTube from={[0.7, 0.3,  0.34]} to={[0.44,  0.72,  0.48]} radius={0.018} color="#ca8a04" />

      {/* ── 9. OIL SUMP ──────────────────────────────────────────────── */}
      <mesh position={[0.06, -0.58, 0]}>
        <boxGeometry args={[1.0, 0.3, 0.85]} />
        <meshStandardMaterial color="#0f172a" metalness={0.86} roughness={0.22} />
      </mesh>

      {/* ── 10. OIL COOLER (side, rear) ──────────────────────────────── */}
      <group position={[0.52, -0.1, -0.9]}>
        <mesh>
          <boxGeometry args={[0.48, 0.52, 0.09]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <mesh key={i} position={[0, -0.2 + i * 0.085, 0.055]}>
            <boxGeometry args={[0.46, 0.02, 0.04]} />
            <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.15} />
          </mesh>
        ))}
        <StraightTube from={[0, 0.24, 0.05]} to={[-0.28, 0.5, 0]} radius={0.038} color="#374151" />
        <StraightTube from={[0, -0.24, 0.05]} to={[-0.28, -0.42, 0]} radius={0.038} color="#374151" />
      </group>

      {/* ── 11. CARBURETOR / THROTTLE BODY ───────────────────────────── */}
      <group position={[0.58, 0.18, 0.86]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.35, 14]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.15, 0.32, 12]} />
          <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.35} />
        </mesh>
      </group>

      {/* ── 12. FUEL LINE (blue) ─────────────────────────────────────── */}
      <StraightTube from={[0.58, 0.18, 0.86]} to={[0.2, -0.35, 0.6]}  radius={0.028} color="#1d4ed8" />
      <StraightTube from={[0.2, -0.35, 0.6]}  to={[-0.4, -0.38, 0.2]} radius={0.028} color="#1d4ed8" />

      {/* ── 13. OIL PRESSURE LINE (red) ──────────────────────────────── */}
      <StraightTube from={[0.06, -0.65, 0.1]} to={[0.4, 0.1, 0.55]}   radius={0.022} color="#dc2626" />

      {/* ── 14. ENGINE MOUNT TUBES ───────────────────────────────────── */}
      {[[-0.42, -0.42], [-0.42, 0.42], [0.42, -0.42], [0.42, 0.42]].map(([y, z], i) => (
        <mesh key={i} position={[0.48, y * 0.62, z * 0.62]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.038, 0.038, 0.58, 8]} />
          <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
      {/* Firewall plate */}
      <mesh position={[0.82, 0, 0]}>
        <boxGeometry args={[0.055, 0.92, 0.92]} />
        <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
      </mesh>

    </group>
  );
}
