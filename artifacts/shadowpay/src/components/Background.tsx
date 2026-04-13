import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

function ParticleField() {
  const ref = useRef<THREE.Points>(null);
  const count = 4000;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.0003;
  });

  return (
    <Points ref={ref} positions={positions} frustumCulled={false}>
      <PointMaterial transparent color="#a78bfa" size={0.05} sizeAttenuation depthWrite={false} opacity={0.6} />
    </Points>
  );
}

function FloatingShape({ geometry, color, position, speed }: {
  geometry: React.ReactNode;
  color: string;
  position: [number, number, number];
  speed: [number, number, number];
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += speed[0] * delta;
      ref.current.rotation.y += speed[1] * delta;
      ref.current.rotation.z += speed[2] * delta;
    }
  });
  return (
    <mesh ref={ref} position={position}>
      {geometry}
      <meshBasicMaterial color={color} wireframe transparent opacity={0.18} />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <ParticleField />
      <FloatingShape
        geometry={<icosahedronGeometry args={[8, 1]} />}
        color="#7C3AED"
        position={[20, 10, -30]}
        speed={[0.3, 0.5, 0.1]}
      />
      <FloatingShape
        geometry={<torusKnotGeometry args={[4, 1.2, 64, 8]} />}
        color="#06B6D4"
        position={[-25, -10, -20]}
        speed={[0.2, 0.4, 0.3]}
      />
      <FloatingShape
        geometry={<octahedronGeometry args={[5]} />}
        color="#F59E0B"
        position={[-15, 5, -25]}
        speed={[0.4, 0.2, 0.5]}
      />
    </>
  );
}

export function Background() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div className="absolute inset-0" style={{ background: "var(--bg-void)" }} />
      <div className="absolute inset-0 grid-bg opacity-30" />

      {/* Glow orbs */}
      <div className="absolute top-[-20%] left-[-12%] w-[800px] h-[800px] rounded-full animate-orb-1"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.2) 0%, rgba(88,28,220,0.06) 45%, transparent 70%)" }} />
      <div className="absolute top-[5%] right-[-18%] w-[700px] h-[700px] rounded-full animate-orb-2"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(6,182,212,0.04) 40%, transparent 65%)" }} />
      <div className="absolute bottom-[-10%] left-[15%] w-[600px] h-[600px] rounded-full animate-orb-3"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 65%)" }} />

      {/* Three.js Canvas */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 60], fov: 75 }}
          gl={{ antialias: false, alpha: true }}
          style={{ background: "transparent" }}
        >
          <Scene />
        </Canvas>
      </div>

      {/* Floating Solana S logos */}
      {[
        { size: 32, opacity: 0.08, top: "8%", left: "5%", dur: "8s", delay: "0s", color: "#7C3AED" },
        { size: 24, opacity: 0.06, top: "25%", right: "4%", dur: "11s", delay: "2s", color: "#06B6D4" },
        { size: 40, opacity: 0.1,  bottom: "15%", left: "8%", dur: "14s", delay: "1s", color: "#fff" },
        { size: 28, opacity: 0.07, top: "60%", right: "7%", dur: "9s",  delay: "3s", color: "#7C3AED" },
        { size: 36, opacity: 0.09, bottom: "30%", right: "12%", dur: "13s", delay: "0.5s", color: "#06B6D4" },
        { size: 22, opacity: 0.06, top: "45%", left: "3%", dur: "10s", delay: "4s", color: "#A855F7" },
      ].map((s, i) => (
        <div
          key={i}
          className="fixed pointer-events-none hidden md:block"
          style={{
            width: s.size, height: s.size,
            opacity: s.opacity,
            top: (s as any).top, bottom: (s as any).bottom,
            left: (s as any).left, right: (s as any).right,
            animation: `float ${s.dur} ease-in-out infinite`,
            animationDelay: s.delay,
            color: s.color,
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 17.5h13.5l2.5-2.5H6.5L4 17.5zm0-5h16l2.5-2.5H6.5L4 12.5zm2.5-7.5L4 7.5h13.5l2.5-2.5H6.5z"/>
          </svg>
        </div>
      ))}

      <div className="absolute inset-0" style={{
        background: "linear-gradient(to bottom, transparent 40%, rgba(3,3,10,0.97) 100%)"
      }} />
    </div>
  );
}