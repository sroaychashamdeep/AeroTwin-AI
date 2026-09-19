/**
 * AEROTWIN AI — Rotax 912/914 Engine — X-Ray Transparent Digital Twin
 * Wireframe + transparent shell on structural parts, solid animated internals.
 * Grid floor, part labels, all animations visible.
 *
 * STABILITY RULES (no crashes):
 *  - NO new THREE.Geometry() inside component bodies (only inside useMemo or outside)
 *  - NO geometry passed as props between components
 *  - All geometry via JSX primitives only: <cylinderGeometry>, <boxGeometry>, etc.
 */

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/* ─── STRAIGHT TUBE BETWEEN TWO 3D POINTS (pure JSX, no new THREE.Geo) ── */
function Tube({ from, to, radius = 0.03, color = '#38bdf8', opacity = 0.8 }) {
  const start = new THREE.Vector3(...from);
  const end   = new THREE.Vector3(...to);
  const dir   = new THREE.Vector3().subVectors(end, start);
  const len   = dir.length();
  const mid   = new THREE.Vector3().lerpVectors(start, end, 0.5);
  const up    = new THREE.Vector3(0, 1, 0);
  // If dir is parallel to up, use alternate axis
  const axis  = Math.abs(dir.clone().normalize().dot(up)) > 0.99
    ? new THREE.Vector3(1, 0, 0)
    : up;
  const quat  = new THREE.Quaternion().setFromUnitVectors(axis, dir.clone().normalize());
  const euler = new THREE.Euler().setFromQuaternion(quat);
  return (
    <mesh position={mid.toArray()} rotation={[euler.x, euler.y, euler.z]}>
      <cylinderGeometry args={[radius, radius, len, 8]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

/* ─── GHOST CYLINDER (transparent shell + wireframe overlay) ─────────── */
function GhostCylinder({ radiusTop, radiusBottom, height, segments = 22, position = [0,0,0], rotation = [0,0,0], ghostColor = '#0ea5e9', wireColor = '#38bdf8', ghostOpacity = 0.1, wireOpacity = 0.5 }) {
  const args = [radiusTop, radiusBottom, height, segments];
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <cylinderGeometry args={args} />
        <meshStandardMaterial color={ghostColor} transparent opacity={ghostOpacity} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh>
        <cylinderGeometry args={args} />
        <meshBasicMaterial color={wireColor} wireframe transparent opacity={wireOpacity} />
      </mesh>
    </group>
  );
}

/* ─── GHOST BOX (transparent shell + wireframe overlay) ─────────────── */
function GhostBox({ w, h, d, position = [0,0,0], rotation = [0,0,0], ghostColor = '#0ea5e9', wireColor = '#38bdf8', ghostOpacity = 0.1, wireOpacity = 0.5 }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={ghostColor} transparent opacity={ghostOpacity} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshBasicMaterial color={wireColor} wireframe transparent opacity={wireOpacity} />
      </mesh>
    </group>
  );
}

/* ─── FLOATING PART LABEL ────────────────────────────────────────────── */
function Label({ position, text, color = '#38bdf8', subtext = '' }) {
  return (
    <Html distanceFactor={10} position={position} center>
      <div style={{
        pointerEvents: 'none',
        fontFamily: 'monospace',
        fontSize: 8,
        fontWeight: 700,
        color,
        background: 'rgba(2,6,23,0.82)',
        border: `1px solid ${color}44`,
        borderRadius: 3,
        padding: '2px 6px',
        whiteSpace: 'nowrap',
        lineHeight: 1.5,
      }}>
        {text}
        {subtext && <div style={{ fontSize: 7, color: '#94a3b8', fontWeight: 400 }}>{subtext}</div>}
      </div>
    </Html>
  );
}

/* ─── SINGLE BOXER CYLINDER ──────────────────────────────────────────── */
function BoxerCylinder({
  position, cylinderNumber, pistonOffset, isLeftBank,
  cht = 145, egt = 800, isEngineRunning, isEngineStarting, activeFaults = []
}) {
  const pistonRef = useRef();
  const flameRef  = useRef();
  const [hovered, setHovered] = useState(false);

  const isCritical = cht > 185 ||
    (Array.isArray(activeFaults) && activeFaults.some(f => typeof f === 'object' && f?.cylinder === cylinderNumber));
  const isWarning = cht > 165;
  const sign = isLeftBank ? -1 : 1;

  const wireColor  = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#38bdf8';
  const ghostColor = isCritical ? '#7f1d1d' : '#0c4a6e';

  useFrame((_, delta) => {
    const angle = pistonOffset.current;
    if (pistonRef.current) {
      pistonRef.current.position.x = sign * (0.46 + Math.sin(angle) * 0.32);
    }
    if (flameRef.current) {
      flameRef.current.intensity = (isEngineRunning || isEngineStarting)
        ? Math.max(0, Math.sin(angle)) * (egt > 820 ? 4.0 : 2.2)
        : 0;
    }
  });

  return (
    <group position={position}>

      {/* Cylinder barrel — ghost + wireframe (transparent so piston visible inside) */}
      <GhostCylinder
        radiusTop={0.62} radiusBottom={0.65} height={1.36} segments={24}
        rotation={[0, 0, Math.PI / 2]}
        ghostColor={ghostColor} wireColor={wireColor}
        ghostOpacity={0.08} wireOpacity={0.52}
      />

      {/* Cooling fins — wireframe rings */}
      {[-0.48, -0.3, -0.12, 0.06, 0.24, 0.42].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.78, 0.78, 0.03, 24]} />
          <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.48} />
        </mesh>
      ))}

      {/* Cylinder head — ghost */}
      <GhostCylinder
        radiusTop={0.64} radiusBottom={0.64} height={0.24} segments={24}
        position={[sign * 0.74, 0, 0]} rotation={[0, 0, Math.PI / 2]}
        ghostColor="#1e3a5f" wireColor={wireColor}
        ghostOpacity={0.15} wireOpacity={0.42}
      />

      {/* Rocker cover — wireframe */}
      <mesh position={[sign * 0.92, 0.22, 0]}>
        <boxGeometry args={[0.24, 0.22, 0.52]} />
        <meshBasicMaterial color="#7dd3fc" wireframe transparent opacity={0.38} />
      </mesh>

      {/* ── PISTON (solid, animated) ── */}
      <group ref={pistonRef} position={[sign * 0.46, 0, 0]}>
        {/* Crown */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.55, 0.55, 0.38, 18]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Piston rings */}
        {[-0.11, 0, 0.11].map((rx, i) => (
          <mesh key={i} position={[rx, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.565, 0.565, 0.026, 18]} />
            <meshStandardMaterial color="#475569" metalness={0.95} roughness={0.06} />
          </mesh>
        ))}
        {/* Wrist pin */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 0.46, 10]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>

      {/* ── CONNECTING ROD (solid, links piston to crankshaft) ── */}
      <mesh position={[sign * 0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.09, 0.65, 0.085]} />
        <meshStandardMaterial color="#64748b" metalness={0.88} roughness={0.2} />
      </mesh>
      {/* Big-end bearing */}
      <mesh position={[sign * 0.0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.09, 12]} />
        <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Combustion flash */}
      <pointLight ref={flameRef}
        position={[sign * 0.72, 0, 0]}
        color={egt > 840 ? '#f97316' : '#38bdf8'}
        distance={2.4} intensity={0}
      />

      {/* Dual spark plugs */}
      {[0.23, -0.23].map((zOff, i) => (
        <group key={i} position={[sign * 0.83, 0.65, zOff]} rotation={[0, 0, isLeftBank ? -0.28 : 0.28]}>
          <mesh>
            <cylinderGeometry args={[0.04, 0.04, 0.21, 8]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <sphereGeometry args={[0.052, 8, 6]} />
            <meshBasicMaterial color="#ca8a04" />
          </mesh>
        </group>
      ))}

      {/* Pushrod tube */}
      <Tube from={[sign * 0.32, 0.61, 0.12]} to={[sign * 0.85, 0.61, 0.12]} radius={0.034} color="#64748b" opacity={0.9} />

      {/* Hover badge */}
      {hovered && (
        <Html distanceFactor={8} position={[sign * 1.5, 0.9, 0]} center>
          <div style={{
            padding: '4px 9px', borderRadius: 4, fontSize: 9, fontFamily: 'monospace',
            fontWeight: 700, border: `1px solid ${wireColor}`,
            background: 'rgba(2,6,23,0.95)', color: '#e0f2fe',
            pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>
            CYL #{cylinderNumber} &nbsp;<span style={{ color: wireColor }}>{Number(cht).toFixed(1)}°C</span>
          </div>
        </Html>
      )}

      {/* Invisible hover zone */}
      <mesh rotation={[0, 0, Math.PI / 2]} visible={false}
        onPointerOver={e => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}>
        <cylinderGeometry args={[0.82, 0.82, 1.5, 10]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

/* ─── PROPELLER ──────────────────────────────────────────────────────── */
function Propeller({ groupRef }) {
  return (
    <group ref={groupRef} position={[-2.12, 0, 0]}>
      {/* Spinner cone */}
      <mesh position={[-0.19, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.17, 0.29, 18]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Hub disk */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.19, 0.19, 0.28, 18]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Two blades at 0° and 180° */}
      {[0, Math.PI].map((rot, bi) => (
        <group key={bi} rotation={[rot, 0, 0]}>
          {/* Root */}
          <mesh position={[0, 0.24, 0]}>
            <cylinderGeometry args={[0.086, 0.086, 0.2, 10]} />
            <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Main span — ghost + wireframe airfoil */}
          <group position={[0, 1.04, 0]} rotation={[0.08, 0, 0]}>
            <mesh>
              <boxGeometry args={[0.058, 1.5, 0.24]} />
              <meshStandardMaterial color="#1e3a5f" transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.058, 1.5, 0.24]} />
              <meshBasicMaterial color="#7dd3fc" wireframe transparent opacity={0.62} />
            </mesh>
          </group>
          {/* Tip */}
          <mesh position={[0, 1.87, 0.02]} rotation={[0.14, 0, 0]}>
            <boxGeometry args={[0.046, 0.18, 0.12]} />
            <meshBasicMaterial color="#7dd3fc" wireframe transparent opacity={0.55} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ─── MAIN ENGINE EXPORT ─────────────────────────────────────────────── */
export default function PistonEngine3D({ telemetry, health, activeFaults, isEngineRunning: isRunningProp }) {
  const crankRef = useRef();
  const propRef  = useRef();

  // Firing angle refs — one per cylinder (boxer firing order: 1-3-2-4)
  const p1 = useRef(0);
  const p2 = useRef(Math.PI);
  const p3 = useRef(Math.PI / 2);
  const p4 = useRef(Math.PI * 1.5);

  const rpm  = Number(telemetry?.rpm)           || 4800;
  const cht  = Number(telemetry?.cht)           || 145;
  const egt  = Number(telemetry?.egt)           || 800;
  const oilP = Number(telemetry?.oil_pressure)  || 4.2;
  const safeActiveFaults = Array.isArray(activeFaults) ? activeFaults : [];

  const isEngineStarting = rpm > 0 && rpm < 500;
  const isEngineRunning  = isRunningProp !== undefined ? isRunningProp : rpm >= 500;

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
    <group scale={[0.82, 0.82, 0.82]}>

      {/* ══ GRID FLOOR ══════════════════════════════════════════════════ */}
      <gridHelper args={[14, 28, '#1e3a5f', '#0f172a']} position={[0, -2.05, 0]} />
      <mesh position={[0, -2.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshBasicMaterial color="#020617" transparent opacity={0.88} />
      </mesh>

      {/* ══ ENGINE STATUS BANNER ════════════════════════════════════════ */}
      <Label
        position={[0, 2.25, 0]}
        text={`⚙  ROTAX 912/914 iS DIGITAL TWIN — ${isEngineRunning ? '▶ RUNNING' : isEngineStarting ? '⟳ STARTING' : '◼ STOPPED'}`}
        color={isEngineRunning ? '#10b981' : isEngineStarting ? '#f59e0b' : '#64748b'}
        subtext={`${Math.round(rpm)} RPM  |  CHT ${Number(cht).toFixed(1)}°C  |  EGT ${Number(egt).toFixed(1)}°C  |  OIL ${Number(oilP).toFixed(2)} bar`}
      />

      {/* ══ CRANKCASE (transparent wireframe shell — see through it) ════ */}
      <GhostBox
        w={1.16} h={0.84} d={0.94}
        ghostColor="#0369a1" wireColor="#38bdf8"
        ghostOpacity={0.06} wireOpacity={0.32}
      />
      <Label position={[0, -0.68, 0.54]} text="CRANKCASE" color="#38bdf8" subtext="Mg-Al casting" />

      {/* ══ CRANKSHAFT (solid, rotating — most visible moving part) ════ */}
      <group ref={crankRef}>
        {/* Main journal */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 1.28, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.07} />
        </mesh>
        {/* Crank throws (offset pin journals) */}
        {[[-0.28, 0.18], [0.28, -0.18]].map(([x, y], i) => (
          <group key={i}>
            <mesh position={[x, y, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.088, 0.088, 0.09, 14]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.12} />
            </mesh>
            {/* Crank web arm */}
            <mesh position={[x * 0.5, y * 0.5, 0]}>
              <boxGeometry args={[0.11, 0.26, 0.09]} />
              <meshStandardMaterial color="#475569" metalness={0.88} roughness={0.15} />
            </mesh>
          </group>
        ))}
        {/* Counterweights (opposite side) */}
        {[[-0.28, -0.14], [0.28, 0.14]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0]}>
            <boxGeometry args={[0.09, 0.2, 0.1]} />
            <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
          </mesh>
        ))}
      </group>
      <Label position={[0, -0.52, 0]} text="CRANKSHAFT" color="#7dd3fc" subtext="4340 chromoly" />

      {/* ══ REDUCTION GEARBOX ═══════════════════════════════════════════ */}
      <group position={[-1.38, 0, 0]}>
        <GhostCylinder
          radiusTop={0.48} radiusBottom={0.56} height={0.5} segments={22}
          rotation={[0, 0, Math.PI / 2]}
          ghostColor="#1e40af" wireColor="#60a5fa"
          ghostOpacity={0.12} wireOpacity={0.48}
        />
        {/* Flange ring */}
        <mesh position={[0.26, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.6, 0.6, 0.05, 22]} />
          <meshBasicMaterial color="#60a5fa" wireframe transparent opacity={0.38} />
        </mesh>
        {/* Output shaft */}
        <mesh position={[-0.29, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.12, 0.44, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.1} />
        </mesh>
        {/* Bolts ring */}
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[0.25, Math.sin(a) * 0.52, Math.cos(a) * 0.52]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.03, 0.03, 0.05, 6]} />
              <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.1} />
            </mesh>
          );
        })}
        <Label position={[-0.1, 0.72, 0]} text="REDUCTION GEARBOX" color="#60a5fa" subtext="Ratio 2.43 : 1" />
      </group>

      {/* ══ PROPELLER ═══════════════════════════════════════════════════ */}
      <Propeller groupRef={propRef} />
      <Label position={[-2.12, 2.18, 0]} text="2-BLADE PROPELLER" color="#7dd3fc" subtext="Ground-adjustable pitch" />

      {/* ══ FOUR CYLINDERS (transparent barrels, solid animated internals) */}
      <BoxerCylinder position={[-0.27, 0, -0.47]} cylinderNumber={1} pistonOffset={p1}
        isLeftBank={true} cht={cht} egt={egt}
        isEngineRunning={isEngineRunning} isEngineStarting={isEngineStarting}
        activeFaults={safeActiveFaults} />
      <BoxerCylinder position={[-0.27, 0,  0.47]} cylinderNumber={2} pistonOffset={p2}
        isLeftBank={false} cht={cht * 0.98} egt={egt * 0.97}
        isEngineRunning={isEngineRunning} isEngineStarting={isEngineStarting}
        activeFaults={safeActiveFaults} />
      <BoxerCylinder position={[ 0.43, 0, -0.47]} cylinderNumber={3} pistonOffset={p3}
        isLeftBank={true} cht={cht * 1.02} egt={egt * 1.03}
        isEngineRunning={isEngineRunning} isEngineStarting={isEngineStarting}
        activeFaults={safeActiveFaults} />
      <BoxerCylinder position={[ 0.43, 0,  0.47]} cylinderNumber={4} pistonOffset={p4}
        isLeftBank={false} cht={cht * 0.99} egt={egt * 1.01}
        isEngineRunning={isEngineRunning} isEngineStarting={isEngineStarting}
        activeFaults={safeActiveFaults} />

      {/* Cylinder ID labels */}
      <Label position={[-0.27, -1.48, -0.47]} text="CYL 1" color="#38bdf8" />
      <Label position={[-0.27, -1.48,  0.47]} text="CYL 2" color="#38bdf8" />
      <Label position={[ 0.43, -1.48, -0.47]} text="CYL 3" color="#38bdf8" />
      <Label position={[ 0.43, -1.48,  0.47]} text="CYL 4" color="#38bdf8" />

      {/* ══ EXHAUST RUNNERS (colour shifts red when hot) ════════════════ */}
      <Tube from={[-0.27,-0.68,-0.47]} to={[-0.04,-1.2,-0.05]}  radius={0.078} color={egt>840?'#ef4444':'#6b7280'} opacity={0.88} />
      <Tube from={[-0.27,-0.68, 0.47]} to={[-0.04,-1.2, 0.05]}  radius={0.078} color={egt>840?'#ef4444':'#6b7280'} opacity={0.88} />
      <Tube from={[ 0.43,-0.68,-0.47]} to={[ 0.12,-1.2,-0.05]}  radius={0.078} color={egt>840?'#ef4444':'#6b7280'} opacity={0.88} />
      <Tube from={[ 0.43,-0.68, 0.47]} to={[ 0.12,-1.2, 0.05]}  radius={0.078} color={egt>840?'#ef4444':'#6b7280'} opacity={0.88} />
      {/* Collector */}
      <mesh position={[0.04, -1.32, 0]}>
        <boxGeometry args={[0.3, 0.18, 0.2]} />
        <meshBasicMaterial color="#f97316" wireframe transparent opacity={0.58} />
      </mesh>
      <Tube from={[0.04,-1.42,0]} to={[0.04,-1.7,0]} radius={0.083} color="#f97316" opacity={0.72} />
      <Label position={[0.04, -1.85, 0]} text="EXHAUST COLLECTOR" color="#f97316" subtext={`EGT ${Number(egt).toFixed(1)}°C`} />

      {/* ══ TWIN MAGNETOS ═══════════════════════════════════════════════ */}
      {[-0.34, 0.34].map((z, i) => (
        <GhostCylinder key={i}
          radiusTop={0.19} radiusBottom={0.19} height={0.36} segments={14}
          position={[0.7, 0.32, z]} rotation={[Math.PI / 2, 0, 0]}
          ghostColor="#7c3aed" wireColor="#a78bfa"
          ghostOpacity={0.18} wireOpacity={0.52}
        />
      ))}
      <Label position={[0.7, 0.9, 0]} text="TWIN MAGNETOS" color="#a78bfa" subtext="Dual ignition system" />

      {/* ══ IGNITION LEADS (bright yellow) ══════════════════════════════ */}
      <Tube from={[0.7,0.32,-0.34]} to={[-0.27,0.68,-0.47]} radius={0.015} color="#fbbf24" opacity={0.9} />
      <Tube from={[0.7,0.32,-0.34]} to={[ 0.43,0.68,-0.47]} radius={0.015} color="#fbbf24" opacity={0.9} />
      <Tube from={[0.7,0.32, 0.34]} to={[-0.27,0.68, 0.47]} radius={0.015} color="#fbbf24" opacity={0.9} />
      <Tube from={[0.7,0.32, 0.34]} to={[ 0.43,0.68, 0.47]} radius={0.015} color="#fbbf24" opacity={0.9} />

      {/* ══ OIL SUMP ════════════════════════════════════════════════════ */}
      <GhostBox
        w={0.96} h={0.27} d={0.82}
        position={[0.06, -0.56, 0]}
        ghostColor="#334155" wireColor="#475569"
        ghostOpacity={0.14} wireOpacity={0.38}
      />
      <Label position={[0.06, -0.82, 0]} text="OIL SUMP" color="#94a3b8" subtext={`${Number(oilP).toFixed(2)} bar`} />

      {/* ══ FUEL LINE (blue) ════════════════════════════════════════════ */}
      <Tube from={[0.55, 0.18, 0.83]} to={[0.18,-0.28, 0.58]}  radius={0.025} color="#3b82f6" opacity={0.88} />
      <Tube from={[0.18,-0.28, 0.58]} to={[-0.36,-0.34, 0.17]} radius={0.025} color="#3b82f6" opacity={0.88} />
      <Label position={[-0.18, -0.46, 0.62]} text="FUEL LINE" color="#3b82f6" />

      {/* ══ OIL PRESSURE LINE (red) ═════════════════════════════════════ */}
      <Tube from={[0.06,-0.64,0.1]} to={[0.4, 0.12, 0.5]} radius={0.019} color="#ef4444" opacity={0.82} />

      {/* ══ ENGINE MOUNT TUBES ══════════════════════════════════════════ */}
      {[[-0.41,-0.41],[-0.41,0.41],[0.41,-0.41],[0.41,0.41]].map(([y,z],i) => (
        <mesh key={i} position={[0.46, y * 0.6, z * 0.6]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.034, 0.034, 0.53, 8]} />
          <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
      {/* Firewall plate */}
      <mesh position={[0.8, 0, 0]}>
        <boxGeometry args={[0.05, 0.88, 0.88]} />
        <meshBasicMaterial color="#475569" wireframe transparent opacity={0.42} />
      </mesh>
      <Label position={[0.9, 0.66, 0]} text="FIREWALL / MOUNT" color="#64748b" />

      {/* ══ RUNNING GLOW ═════════════════════════════════════════════════ */}
      {isEngineRunning && (
        <pointLight position={[0, 0, 0]} color="#38bdf8" intensity={0.55} distance={3.2} />
      )}

    </group>
  );
}
