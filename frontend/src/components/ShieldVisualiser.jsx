import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// 1. The Core (Turns Red when Vulnerable)
const Core = ({ shieldActive }) => {
  const meshRef = useRef();
  useFrame(() => {
    meshRef.current.rotation.y += 0.004;
    meshRef.current.rotation.x += 0.0015;
  });
  return (
    <Sphere ref={meshRef} args={[0.85, 32, 32]}>
      <meshStandardMaterial 
        wireframe 
        color={shieldActive ? "#FFFFFF" : "#EF4444"} 
        transparent 
        opacity={shieldActive ? 0.3 : 0.8} 
      />
    </Sphere>
  );
};

// 2. The Air-Gap Shield Wall (Now Visible Green)
function buildShieldGeometry() {
  const w = 0.5, h = 0.62;
  const shape = new THREE.Shape();
  shape.moveTo(-w, h * 0.5);
  shape.lineTo(w, h * 0.5);
  shape.quadraticCurveTo(w, -h * 0.15, w * 0.55, -h * 0.4);
  shape.quadraticCurveTo(w * 0.25, -h * 0.62, 0, -h * 0.62);
  shape.quadraticCurveTo(-w * 0.25, -h * 0.62, -w * 0.55, -h * 0.4);
  shape.quadraticCurveTo(-w, -h * 0.15, -w, h * 0.5);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.06, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2,
  });
}

const ShieldWall = ({ active, count = 28 }) => {
  const meshRef = useRef();
  const geometry = useMemo(() => buildShieldGeometry(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const radius = 1.7;

  const directions = useMemo(() => {
    const pts = [];
    const offset = 2 / count;
    for (let i = 0; i < count; i++) {
      const y = i * offset - 1 + offset / 2;
      const r = Math.sqrt(1 - y * y);
      const phi = i * Math.PI * (3 - Math.sqrt(5));
      pts.push(new THREE.Vector3(Math.cos(phi) * r, y, Math.sin(phi) * r));
    }
    return pts;
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    directions.forEach((dir, i) => {
      const r = active ? radius : radius * 1.6;
      const jitter = active ? 0 : Math.sin(t * 0.6 + i) * 0.3;
      dummy.position.copy(dir).multiplyScalar(r + jitter);
      dummy.lookAt(0, 0, 0);
      dummy.rotateY(Math.PI);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, null, count]}>
      <meshStandardMaterial
        color={active ? '#10B981' : '#333333'}
        transparent
        opacity={active ? 0.25 : 0.05} // Increased opacity so you can see the air gap
        metalness={0.6}
        roughness={0.2}
        wireframe={!active}
      />
    </instancedMesh>
  );
};

// 3. The Threat Physics (Slower speeds + Asteroid Shatter Engine)
const ThreatParticles = ({ count = 30, shieldActive, onHit }) => {
  const meshRef = useRef();
  const debrisRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const collideRadius = shieldActive ? 1.75 : 0.95;

  // Slower main particles
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const radius = 4 + Math.random() * 4;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 2 - 1);
      temp.push({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi),
        speed: 0.01 + Math.random() * 0.015, // SLOWED DOWN BY 60%
      });
    }
    return temp;
  }, [count]);

  // Debris Pooling for Asteroid Shatter
  const maxDebris = 120;
  const debrisData = useMemo(() => Array.from({ length: maxDebris }, () => ({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0 })), []);
  let debrisIndex = 0;

  useFrame(() => {
    // Process Main Threats
    particles.forEach((p, i) => {
      const dir = new THREE.Vector3(-p.x, -p.y, -p.z).normalize();
      p.x += dir.x * p.speed;
      p.y += dir.y * p.speed;
      p.z += dir.z * p.speed;
      const dist = Math.sqrt(p.x ** 2 + p.y ** 2 + p.z ** 2);

      // COLLISION DETECTED
      if (dist <= collideRadius) {
        if (shieldActive) {
          onHit();
          // Spawn 4 debris shards bouncing outward
          for (let j = 0; j < 4; j++) {
            const d = debrisData[debrisIndex];
            d.x = p.x; d.y = p.y; d.z = p.z;
            const nx = p.x / dist, ny = p.y / dist, nz = p.z / dist;
            d.vx = nx * 0.04 + (Math.random() - 0.5) * 0.06;
            d.vy = ny * 0.04 + (Math.random() - 0.5) * 0.06;
            d.vz = nz * 0.04 + (Math.random() - 0.5) * 0.06;
            d.life = 1.0;
            debrisIndex = (debrisIndex + 1) % maxDebris;
          }
        }
        
        // Reset Particle outside
        const radius = 5 + Math.random() * 3;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(Math.random() * 2 - 1);
        p.x = radius * Math.sin(phi) * Math.cos(theta);
        p.y = radius * Math.sin(phi) * Math.sin(theta);
        p.z = radius * Math.cos(phi);
      }
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;

    // Process Shatter Debris
    debrisData.forEach((d, i) => {
      if (d.life > 0) {
        d.x += d.vx; d.y += d.vy; d.z += d.vz;
        d.life -= 0.03; // Fade out speed
        dummy.position.set(d.x, d.y, d.z);
        dummy.scale.setScalar(Math.max(0, d.life));
        dummy.updateMatrix();
        debrisRef.current.setMatrixAt(i, dummy.matrix);
      } else {
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        debrisRef.current.setMatrixAt(i, dummy.matrix);
      }
    });
    debrisRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      {/* Main Payloads */}
      <instancedMesh ref={meshRef} args={[null, null, count]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color="#EF4444" />
      </instancedMesh>
      {/* Shatter Debris */}
      <instancedMesh ref={debrisRef} args={[null, null, maxDebris]}>
        <boxGeometry args={[0.02, 0.02, 0.02]} />
        <meshBasicMaterial color="#EF4444" transparent opacity={0.8} />
      </instancedMesh>
    </>
  );
};

// 4. Custom Brutalist Toggle Button
const Toggle = ({ label, checked, onChange }) => (
  <button onClick={() => onChange(!checked)} className="w-full flex items-center justify-between py-3 group border-t border-gray-900 first:border-0">
    <span className="font-mono text-[10px] text-gray-500 group-hover:text-gray-300 transition-colors uppercase tracking-[0.2em]">{label}</span>
    <span className={`relative w-8 h-4 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-gray-800'}`}>
      <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-black transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </span>
  </button>
);

// MAIN EXPORT
export default function ShieldVisualiser() {
  const [shieldActive, setShieldActive] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [threatsBlocked, setThreatsBlocked] = useState(0);

  // Sync colors based on shield status
  const statusText = !shieldActive ? 'VULNERABLE' : simulating ? 'INTERCEPTING' : 'SECURE';
  const statusColor = !shieldActive ? 'text-red-500' : simulating ? 'text-emerald-400' : 'text-emerald-600';

  return (
    <div className="w-full h-full relative border border-[#111] bg-[#050505] flex flex-col overflow-hidden">
      
      {/* Top Status Overlay (Synced Colors) */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between z-10 pointer-events-none">
        <div>
          <div className="text-[9px] text-gray-600 uppercase tracking-[0.2em] mb-1">Perimeter Status</div>
          <div className={`text-sm font-mono font-bold tracking-widest ${statusColor}`}>
            {statusText}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] text-gray-600 uppercase tracking-[0.2em] mb-1">Threats Blocked</div>
          <div className={`text-3xl font-light font-sans transition-colors ${!shieldActive ? 'text-red-500' : 'text-white'}`}>
            {threatsBlocked}
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 cursor-move">
        <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <Core shieldActive={shieldActive} />
          <ShieldWall active={shieldActive} />
          {simulating && <ThreatParticles shieldActive={shieldActive} onHit={() => setThreatsBlocked((n) => n + 1)} />}
          <OrbitControls enableZoom={false} autoRotate={!simulating} autoRotateSpeed={0.6} />
        </Canvas>
      </div>

      {/* Re-added Bottom Toggle Block */}
      <div className="bg-[#020202] border-t border-[#111] px-6 py-2">
        <Toggle label="PHALANX SHIELD (AIR-GAP)" checked={shieldActive} onChange={setShieldActive} />
        <Toggle label="SIMULATE INBOUND PAYLOADS" checked={simulating} onChange={setSimulating} />
      </div>

    </div>
  );
}