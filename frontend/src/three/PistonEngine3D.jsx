/**
 * AEROTWIN AI — Rotax 912/914 Engine — X-Ray Digital Twin
 * ► Labels ONLY appear on hover — hover any part to see its info
 * ► Transparent ghost shells + wireframe on structure, solid animated internals
 * ► Grid floor, crankshaft/pistons/prop all animate
 */

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/* ─────────────────────────────────────────────────────────────────────────
   HOVER PART WRAPPER
   Wraps any group — on hover shows a floating info card, hides otherwise
───────────────────────────────────────────────────────────────────────── */
function HoverPart({ children, label, sub = '', color = '#38bdf8', labelPos = [0, 1.1, 0] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <group
      onPointerOver={e => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      {children}
      {hovered && (
        <Html distanceFactor={9} position={labelPos} center>
          <div style={{
            pointerEvents: 'none',
            fontFamily: 'monospace',
            fontSize: 10,
            fontWeight: 700,
            color,
            background: 'rgba(2,6,23,0.92)',
            border: `1px solid ${color}`,
            borderRadius: 5,
            padding: '5px 10px',
            whiteSpace: 'nowrap',
            lineHeight: 1.6,
            boxShadow: `0 0 12px ${color}55`,
          }}>
            {label}
            {sub && <div style={{ fontSize: 8.5, color: '#94a3b8', fontWeight: 400, marginTop: 1 }}>{sub}</div>}
          </div>
        </Html>
      )}
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   TUBE — solid cylinder between two 3D points
───────────────────────────────────────────────────────────────────────── */
function Tube({ from, to, radius = 0.03, color = '#38bdf8', opacity = 0.85 }) {
  const start = new THREE.Vector3(...from);
  const end   = new THREE.Vector3(...to);
  const dir   = new THREE.Vector3().subVectors(end, start);
  const len   = dir.length();
  if (len < 0.001) return null;
  const mid   = new THREE.Vector3().lerpVectors(start, end, 0.5);
  const up    = Math.abs(dir.clone().normalize().y) > 0.98
    ? new THREE.Vector3(1, 0, 0)
    : new THREE.Vector3(0, 1, 0);
  const quat  = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
  const euler = new THREE.Euler().setFromQuaternion(quat);
  return (
    <mesh position={mid.toArray()} rotation={[euler.x, euler.y, euler.z]}>
      <cylinderGeometry args={[radius, radius, len, 8]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   GHOST CYLINDER — transparent shell + wireframe overlay (no geometry prop)
───────────────────────────────────────────────────────────────────────── */
function GhostCyl({ rT, rB, h, seg = 20, pos = [0,0,0], rot = [0,0,0], ghost = '#0c4a6e', wire = '#38bdf8', gOp = 0.1, wOp = 0.48 }) {
  return (
    <group position={pos} rotation={rot}>
      <mesh>
        <cylinderGeometry args={[rT, rB, h, seg]} />
        <meshStandardMaterial color={ghost} transparent opacity={gOp} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[rT, rB, h, seg]} />
        <meshBasicMaterial color={wire} wireframe transparent opacity={wOp} />
      </mesh>
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   GHOST BOX — transparent shell + wireframe overlay
───────────────────────────────────────────────────────────────────────── */
function GhostBox({ w, h, d, pos = [0,0,0], rot = [0,0,0], ghost = '#0c4a6e', wire = '#38bdf8', gOp = 0.1, wOp = 0.45 }) {
  return (
    <group position={pos} rotation={rot}>
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={ghost} transparent opacity={gOp} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshBasicMaterial color={wire} wireframe transparent opacity={wOp} />
      </mesh>
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   SINGLE BOXER CYLINDER
   Transparent barrel with solid animated piston + rings + conrod inside
───────────────────────────────────────────────────────────────────────── */
function BoxerCylinder({
  position, cylinderNumber, pistonOffset, isLeftBank,
  cht = 145, egt = 800, isEngineRunning, isEngineStarting, activeFaults = []
}) {
  const pistonRef = useRef();
  const flameRef  = useRef();

  const isCritical = cht > 185 ||
    (Array.isArray(activeFaults) && activeFaults.some(f => typeof f === 'object' && f?.cylinder === cylinderNumber));
  const isWarning = cht > 165;
  const sign = isLeftBank ? -1 : 1;

  const wireColor  = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#22d3ee';
  const ghostColor = isCritical ? '#450a0a' : '#0c4a6e';

  const status = isCritical ? '🔴 CRITICAL' : isWarning ? '🟡 WARNING' : '🟢 NOMINAL';
  const cylSub = `CHT: ${Number(cht).toFixed(1)}°C | EGT: ${Number(egt).toFixed(1)}°C | ${status}`;

  useFrame((_, delta) => {
    const angle = pistonOffset.current;
    if (pistonRef.current) {
      pistonRef.current.position.x = sign * (0.44 + Math.sin(angle) * 0.3);
    }
    if (flameRef.current) {
      flameRef.current.intensity = (isEngineRunning || isEngineStarting)
        ? Math.max(0, Math.sin(angle)) * (egt > 820 ? 4.5 : 2.5)
        : 0;
    }
  });

  return (
    <group position={position}>
      <HoverPart
        label={`CYL #${cylinderNumber} — CYLINDER HEAD`}
        sub={cylSub}
        color={wireColor}
        labelPos={[sign * 1.6, 1.0, 0]}
      >
        {/* Transparent cylinder barrel */}
        <GhostCyl rT={0.6} rB={0.63} h={1.32} seg={22}
          rot={[0, 0, Math.PI / 2]}
          ghost={ghostColor} wire={wireColor} gOp={0.08} wOp={0.5}
        />
        {/* Cooling fins */}
        {[-0.44, -0.27, -0.1, 0.07, 0.24, 0.41].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.74, 0.74, 0.028, 22]} />
            <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.42} />
          </mesh>
        ))}
        {/* Cylinder head */}
        <GhostCyl rT={0.62} rB={0.62} h={0.22} seg={22}
          pos={[sign * 0.72, 0, 0]} rot={[0, 0, Math.PI / 2]}
          ghost="#1e3a5f" wire={wireColor} gOp={0.14} wOp={0.4}
        />
        {/* Rocker cover */}
        <mesh position={[sign * 0.9, 0.2, 0]}>
          <boxGeometry args={[0.22, 0.2, 0.5]} />
          <meshBasicMaterial color="#7dd3fc" wireframe transparent opacity={0.35} />
        </mesh>
      </HoverPart>

      {/* PISTON (solid, animated — hoverable separately) */}
      <HoverPart
        label="PISTON + RINGS"
        sub={`Bore: 79.5mm | Stroke: 61mm | ${isEngineRunning ? '▶ Reciprocating' : '◼ Static'}`}
        color="#e2e8f0"
        labelPos={[sign * 1.2, 0.7, 0]}
      >
        <group ref={pistonRef} position={[sign * 0.44, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.54, 0.54, 0.36, 18]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.08} />
          </mesh>
          {[-0.1, 0.0, 0.1].map((rx, i) => (
            <mesh key={i} position={[rx, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.555, 0.555, 0.024, 18]} />
              <meshStandardMaterial color="#475569" metalness={0.95} roughness={0.06} />
            </mesh>
          ))}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.052, 0.052, 0.44, 10]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.15} />
          </mesh>
        </group>
      </HoverPart>

      {/* CONNECTING ROD */}
      <HoverPart label="CONNECTING ROD" sub="Forged steel | Links piston to crankshaft" color="#94a3b8" labelPos={[sign * 0.3, 0.6, 0]}>
        <mesh position={[sign * 0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.09, 0.62, 0.08]} />
          <meshStandardMaterial color="#64748b" metalness={0.88} roughness={0.2} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.098, 0.098, 0.088, 12]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.15} />
        </mesh>
      </HoverPart>

      {/* Combustion flash light */}
      <pointLight ref={flameRef}
        position={[sign * 0.7, 0, 0]}
        color={egt > 840 ? '#f97316' : '#38bdf8'}
        distance={2.2} intensity={0}
      />

      {/* Dual spark plugs */}
      <HoverPart label={`CYL #${cylinderNumber} — DUAL SPARK PLUGS`} sub="Rotax dual ignition | 8 plugs total" color="#fbbf24" labelPos={[sign * 1.4, 1.2, 0]}>
        {[0.22, -0.22].map((zOff, i) => (
          <group key={i} position={[sign * 0.81, 0.63, zOff]} rotation={[0, 0, isLeftBank ? -0.26 : 0.26]}>
            <mesh>
              <cylinderGeometry args={[0.038, 0.038, 0.2, 8]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0.13, 0]}>
              <sphereGeometry args={[0.048, 8, 6]} />
              <meshBasicMaterial color="#ca8a04" />
            </mesh>
          </group>
        ))}
      </HoverPart>

      {/* Pushrod tube */}
      <Tube from={[sign * 0.3, 0.59, 0.12]} to={[sign * 0.82, 0.59, 0.12]} radius={0.032} color="#64748b" opacity={0.88} />
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PROPELLER
───────────────────────────────────────────────────────────────────────── */
function Propeller({ groupRef, rpm }) {
  return (
    <HoverPart
      label="2-BLADE PROPELLER"
      sub={`Ground-adjustable pitch | ${Math.round(rpm / 2.43)} RPM prop speed`}
      color="#7dd3fc"
      labelPos={[0, 2.3, 0]}
    >
      <group ref={groupRef} position={[-2.1, 0, 0]}>
        {/* Spinner cone */}
        <mesh position={[-0.18, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.16, 0.28, 18]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.15} />
        </mesh>
        {/* Hub */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 0.26, 18]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.15} />
        </mesh>
        {/* Two blades */}
        {[0, Math.PI].map((rot, bi) => (
          <group key={bi} rotation={[rot, 0, 0]}>
            {/* Root stub */}
            <mesh position={[0, 0.22, 0]}>
              <cylinderGeometry args={[0.082, 0.082, 0.19, 10]} />
              <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
            </mesh>
            {/* Blade span */}
            <group position={[0, 1.02, 0]} rotation={[0.07, 0, 0]}>
              <mesh>
                <boxGeometry args={[0.055, 1.46, 0.22]} />
                <meshStandardMaterial color="#1e3a5f" transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
              </mesh>
              <mesh>
                <boxGeometry args={[0.055, 1.46, 0.22]} />
                <meshBasicMaterial color="#7dd3fc" wireframe transparent opacity={0.6} />
              </mesh>
            </group>
            {/* Tip */}
            <mesh position={[0, 1.84, 0.02]} rotation={[0.13, 0, 0]}>
              <boxGeometry args={[0.044, 0.17, 0.11]} />
              <meshBasicMaterial color="#7dd3fc" wireframe transparent opacity={0.52} />
            </mesh>
          </group>
        ))}
      </group>
    </HoverPart>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN ENGINE EXPORT
───────────────────────────────────────────────────────────────────────── */
export default function PistonEngine3D({ telemetry, health, activeFaults, isEngineRunning: isRunningProp }) {
  const crankRef = useRef();
  const propRef  = useRef();

  const p1 = useRef(0);
  const p2 = useRef(Math.PI);
  const p3 = useRef(Math.PI / 2);
  const p4 = useRef(Math.PI * 1.5);

  const rpm  = Number(telemetry?.rpm)          || 4800;
  const cht  = Number(telemetry?.cht)          || 145;
  const egt  = Number(telemetry?.egt)          || 800;
  const oilP = Number(telemetry?.oil_pressure) || 4.2;
  const fuelFlow = Number(telemetry?.fuel_flow) || 18.5;
  const safeActiveFaults = Array.isArray(activeFaults) ? activeFaults : [];

  const isEngineStarting = rpm > 0 && rpm < 500;
  const isEngineRunning  = isRunningProp !== undefined ? isRunningProp : rpm >= 500;
  const engineStatusText = isEngineRunning ? '▶ RUNNING' : isEngineStarting ? '⟳ STARTING' : '◼ STOPPED';

  useFrame((_, delta) => {
    const rps = (rpm / 60) * delta * Math.PI * 2;
    if (crankRef.current && (isEngineRunning || isEngineStarting)) {
      crankRef.current.rotation.x += rps;
    }
    if (propRef.current) {
      if (isEngineRunning)       propRef.current.rotation.x += rps / 2.43;
      else if (isEngineStarting) propRef.current.rotation.x += rps * 0.4;
    }
    p1.current += rps;
    p2.current += rps;
    p3.current += rps;
    p4.current += rps;
  });

  return (
    <group scale={[0.9, 0.9, 0.9]}>

      {/* ══ GRID FLOOR ══════════════════════════════════════════════════ */}
      <gridHelper args={[12, 24, '#1e3a5f', '#0f172a']} position={[0, -1.9, 0]} />
      <mesh position={[0, -1.91, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshBasicMaterial color="#020617" transparent opacity={0.9} />
      </mesh>

      {/* ══ STATUS BANNER (always visible, compact) ═════════════════════ */}
      <Html distanceFactor={12} position={[0, 2.0, 0]} center>
        <div style={{
          pointerEvents: 'none',
          fontFamily: 'monospace',
          fontSize: 9,
          fontWeight: 700,
          color: isEngineRunning ? '#10b981' : isEngineStarting ? '#f59e0b' : '#64748b',
          background: 'rgba(2,6,23,0.88)',
          border: `1px solid ${isEngineRunning ? '#10b981' : isEngineStarting ? '#f59e0b' : '#334155'}55`,
          borderRadius: 4,
          padding: '3px 8px',
          whiteSpace: 'nowrap',
        }}>
          ⚙ ROTAX 912/914 iS — {engineStatusText}
          <span style={{ color: '#64748b', fontWeight: 400, marginLeft: 6 }}>
            {Math.round(rpm)} RPM | {Number(cht).toFixed(1)}°C CHT | OIL {Number(oilP).toFixed(2)} bar
          </span>
        </div>
      </Html>

      {/* ══ CRANKCASE ═══════════════════════════════════════════════════ */}
      <HoverPart label="CRANKCASE" sub="Magnesium-aluminium alloy casting | Houses crankshaft + bearings" color="#38bdf8" labelPos={[0, 1.0, 0.6]}>
        <GhostBox w={1.14} h={0.82} d={0.92}
          ghost="#0369a1" wire="#38bdf8" gOp={0.06} wOp={0.3}
        />
      </HoverPart>

      {/* ══ CRANKSHAFT ══════════════════════════════════════════════════ */}
      <HoverPart
        label="CRANKSHAFT"
        sub={`4340 chromoly steel | ${Math.round(rpm)} RPM | Drives all 4 pistons + gearbox`}
        color="#7dd3fc"
        labelPos={[0, 0.7, 0]}
      >
        <group ref={crankRef}>
          {/* Main journal */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.098, 0.098, 1.26, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.07} />
          </mesh>
          {/* Crank throws */}
          {[[-0.27, 0.17], [0.27, -0.17]].map(([x, y], i) => (
            <group key={i}>
              <mesh position={[x, y, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.086, 0.086, 0.088, 14]} />
                <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.12} />
              </mesh>
              <mesh position={[x * 0.5, y * 0.5, 0]}>
                <boxGeometry args={[0.1, 0.24, 0.088]} />
                <meshStandardMaterial color="#475569" metalness={0.88} roughness={0.15} />
              </mesh>
            </group>
          ))}
          {/* Counterweights */}
          {[[-0.27, -0.13], [0.27, 0.13]].map(([x, y], i) => (
            <mesh key={i} position={[x, y, 0]}>
              <boxGeometry args={[0.088, 0.19, 0.095]} />
              <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
            </mesh>
          ))}
        </group>
      </HoverPart>

      {/* ══ REDUCTION GEARBOX ═══════════════════════════════════════════ */}
      <HoverPart
        label="REDUCTION GEARBOX (PSRU)"
        sub={`Ratio 2.43:1 | Prop shaft speed: ${Math.round(rpm / 2.43)} RPM | Spur gear type`}
        color="#60a5fa"
        labelPos={[-0.1, 0.82, 0]}
      >
        <group position={[-1.36, 0, 0]}>
          <GhostCyl rT={0.47} rB={0.55} h={0.48} seg={22}
            rot={[0, 0, Math.PI / 2]}
            ghost="#1e40af" wire="#60a5fa" gOp={0.12} wOp={0.46}
          />
          {/* Flange */}
          <mesh position={[0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.58, 0.58, 0.048, 22]} />
            <meshBasicMaterial color="#60a5fa" wireframe transparent opacity={0.36} />
          </mesh>
          {/* Output shaft */}
          <mesh position={[-0.28, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.11, 0.11, 0.42, 12]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.1} />
          </mesh>
          {/* Bolts */}
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <mesh key={i} position={[0.24, Math.sin(a) * 0.5, Math.cos(a) * 0.5]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.028, 0.028, 0.046, 6]} />
                <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.1} />
              </mesh>
            );
          })}
        </group>
      </HoverPart>

      {/* ══ PROPELLER ═══════════════════════════════════════════════════ */}
      <Propeller groupRef={propRef} rpm={rpm} />

      {/* ══ FOUR CYLINDERS ══════════════════════════════════════════════ */}
      <BoxerCylinder position={[-0.26, 0, -0.46]} cylinderNumber={1} pistonOffset={p1}
        isLeftBank={true} cht={cht} egt={egt}
        isEngineRunning={isEngineRunning} isEngineStarting={isEngineStarting}
        activeFaults={safeActiveFaults} />
      <BoxerCylinder position={[-0.26, 0,  0.46]} cylinderNumber={2} pistonOffset={p2}
        isLeftBank={false} cht={cht * 0.98} egt={egt * 0.97}
        isEngineRunning={isEngineRunning} isEngineStarting={isEngineStarting}
        activeFaults={safeActiveFaults} />
      <BoxerCylinder position={[ 0.42, 0, -0.46]} cylinderNumber={3} pistonOffset={p3}
        isLeftBank={true} cht={cht * 1.02} egt={egt * 1.03}
        isEngineRunning={isEngineRunning} isEngineStarting={isEngineStarting}
        activeFaults={safeActiveFaults} />
      <BoxerCylinder position={[ 0.42, 0,  0.46]} cylinderNumber={4} pistonOffset={p4}
        isLeftBank={false} cht={cht * 0.99} egt={egt * 1.01}
        isEngineRunning={isEngineRunning} isEngineStarting={isEngineStarting}
        activeFaults={safeActiveFaults} />

      {/* ══ EXHAUST RUNNERS ═════════════════════════════════════════════ */}
      <HoverPart
        label="EXHAUST SYSTEM — 4-into-1"
        sub={`EGT: ${Number(egt).toFixed(1)}°C | ${egt > 840 ? '🔴 OVERTEMP' : '🟢 Normal'} | Stainless steel runners`}
        color="#f97316"
        labelPos={[0.04, -1.0, 0]}
      >
        <Tube from={[-0.26,-0.66,-0.46]} to={[-0.04,-1.18,-0.04]} radius={0.075} color={egt>840?'#ef4444':'#6b7280'} opacity={0.88} />
        <Tube from={[-0.26,-0.66, 0.46]} to={[-0.04,-1.18, 0.04]} radius={0.075} color={egt>840?'#ef4444':'#6b7280'} opacity={0.88} />
        <Tube from={[ 0.42,-0.66,-0.46]} to={[ 0.12,-1.18,-0.04]} radius={0.075} color={egt>840?'#ef4444':'#6b7280'} opacity={0.88} />
        <Tube from={[ 0.42,-0.66, 0.46]} to={[ 0.12,-1.18, 0.04]} radius={0.075} color={egt>840?'#ef4444':'#6b7280'} opacity={0.88} />
        <mesh position={[0.04, -1.3, 0]}>
          <boxGeometry args={[0.28, 0.17, 0.19]} />
          <meshBasicMaterial color="#f97316" wireframe transparent opacity={0.55} />
        </mesh>
        <Tube from={[0.04,-1.4,0]} to={[0.04,-1.65,0]} radius={0.08} color="#f97316" opacity={0.7} />
      </HoverPart>

      {/* ══ TWIN MAGNETOS ═══════════════════════════════════════════════ */}
      <HoverPart
        label="TWIN MAGNETOS (Dual Ignition)"
        sub="Self-powered ignition | No battery needed | Dual for redundancy"
        color="#a78bfa"
        labelPos={[0.7, 1.0, 0]}
      >
        {[-0.33, 0.33].map((z, i) => (
          <GhostCyl key={i} rT={0.18} rB={0.18} h={0.34} seg={14}
            pos={[0.68, 0.3, z]} rot={[Math.PI / 2, 0, 0]}
            ghost="#7c3aed" wire="#a78bfa" gOp={0.18} wOp={0.5}
          />
        ))}
      </HoverPart>

      {/* ══ IGNITION LEADS ══════════════════════════════════════════════ */}
      <HoverPart label="IGNITION WIRING HARNESS" sub="HT leads | Yellow = 8 spark plug wires" color="#fbbf24" labelPos={[0.2, 1.1, 0]}>
        <Tube from={[0.68,0.3,-0.33]} to={[-0.26,0.66,-0.46]} radius={0.014} color="#fbbf24" opacity={0.9} />
        <Tube from={[0.68,0.3,-0.33]} to={[ 0.42,0.66,-0.46]} radius={0.014} color="#fbbf24" opacity={0.9} />
        <Tube from={[0.68,0.3, 0.33]} to={[-0.26,0.66, 0.46]} radius={0.014} color="#fbbf24" opacity={0.9} />
        <Tube from={[0.68,0.3, 0.33]} to={[ 0.42,0.66, 0.46]} radius={0.014} color="#fbbf24" opacity={0.9} />
      </HoverPart>

      {/* ══ OIL SUMP ════════════════════════════════════════════════════ */}
      <HoverPart
        label="OIL SUMP (Dry-Sump)"
        sub={`Oil pressure: ${Number(oilP).toFixed(2)} bar | Capacity: 3.0 L`}
        color="#94a3b8"
        labelPos={[0.06, -0.1, 0.6]}
      >
        <GhostBox w={0.94} h={0.26} d={0.8} pos={[0.06, -0.54, 0]}
          ghost="#334155" wire="#475569" gOp={0.14} wOp={0.36}
        />
      </HoverPart>

      {/* ══ FUEL SYSTEM ═════════════════════════════════════════════════ */}
      <HoverPart
        label="FUEL SYSTEM"
        sub={`Flow: ${Number(fuelFlow).toFixed(1)} L/h | AVGAS 100LL / Mogas`}
        color="#3b82f6"
        labelPos={[-0.1, -0.2, 0.72]}
      >
        <Tube from={[0.54, 0.17, 0.82]} to={[0.17,-0.26, 0.57]}  radius={0.024} color="#3b82f6" opacity={0.88} />
        <Tube from={[0.17,-0.26, 0.57]} to={[-0.34,-0.32, 0.17]} radius={0.024} color="#3b82f6" opacity={0.88} />
      </HoverPart>

      {/* ══ OIL PRESSURE LINE ═══════════════════════════════════════════ */}
      <HoverPart
        label="OIL PRESSURE LINE"
        sub={`${Number(oilP).toFixed(2)} bar | ${oilP < 2.5 ? '🔴 LOW PRESSURE' : '🟢 Normal'}`}
        color="#ef4444"
        labelPos={[0.3, 0.0, 0.6]}
      >
        <Tube from={[0.06,-0.62,0.1]} to={[0.38, 0.1, 0.5]} radius={0.018} color="#ef4444" opacity={0.82} />
      </HoverPart>

      {/* ══ ENGINE MOUNT FRAME ══════════════════════════════════════════ */}
      <HoverPart label="ENGINE MOUNT FRAME" sub="Chromoly steel tubes | Welded 4-point mount" color="#64748b" labelPos={[0.88, 0.8, 0]}>
        {[[-0.4,-0.4],[-0.4,0.4],[0.4,-0.4],[0.4,0.4]].map(([y,z],i) => (
          <mesh key={i} position={[0.45, y * 0.58, z * 0.58]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.033, 0.033, 0.51, 8]} />
            <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
        <mesh position={[0.78, 0, 0]}>
          <boxGeometry args={[0.048, 0.86, 0.86]} />
          <meshBasicMaterial color="#475569" wireframe transparent opacity={0.4} />
        </mesh>
      </HoverPart>

      {/* Running glow */}
      {isEngineRunning && (
        <pointLight position={[0, 0, 0]} color="#38bdf8" intensity={0.5} distance={3.0} />
      )}

    </group>
  );
}
