import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

function ParticleField() {
  const ref = useRef<THREE.Points>(null);
  const count = 2200;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 90;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += 0.00015 * delta * 60;
      ref.current.rotation.x += 0.00005 * delta * 60;
    }
  });

  return (
    <Points ref={ref} positions={positions} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#4c1d95"
        size={0.035}
        sizeAttenuation
        depthWrite={false}
        opacity={0.45}
      />
    </Points>
  );
}

function ShadowShard({ position, speed, scale }: {
  position: [number, number, number];
  speed: [number, number, number];
  scale: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += speed[0] * delta;
    ref.current.rotation.y += speed[1] * delta;
    ref.current.rotation.z += speed[2] * delta;
  });
  return (
    <mesh ref={ref} position={position} scale={scale}>
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#3b0764" wireframe transparent opacity={0.12} />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <ParticleField />
      <ShadowShard position={[22, 8, -35]}  speed={[0.08, 0.14, 0.04]} scale={9} />
      <ShadowShard position={[-28, -12, -25]} speed={[0.05, 0.10, 0.08]} scale={7} />
      <ShadowShard position={[-10, 16, -40]} speed={[0.12, 0.06, 0.10]} scale={5} />
      <ShadowShard position={[15, -18, -30]} speed={[0.06, 0.08, 0.12]} scale={6} />
    </>
  );
}

export function Background() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">

      {/* Pure black void base */}
      <div className="absolute inset-0" style={{ background: "#000000" }} />

      {/* ── Shadow mist layers (slow-breathing dark fog) ── */}
      <div
        className="absolute rounded-full"
        style={{
          width: "140%", height: "130%",
          top: "-15%", left: "-20%",
          background: "radial-gradient(ellipse at 40% 40%, rgba(60,7,100,0.28) 0%, rgba(30,0,50,0.12) 35%, transparent 65%)",
          animation: "shadow-breathe-1 18s ease-in-out infinite",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: "120%", height: "120%",
          top: "10%", right: "-25%",
          background: "radial-gradient(ellipse at 60% 50%, rgba(9,9,30,0.7) 0%, rgba(20,0,40,0.15) 40%, transparent 70%)",
          animation: "shadow-breathe-2 24s ease-in-out infinite",
          filter: "blur(50px)",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: "80%", height: "80%",
          bottom: "-10%", left: "10%",
          background: "radial-gradient(ellipse at 50% 60%, rgba(45,5,80,0.22) 0%, transparent 65%)",
          animation: "shadow-breathe-3 20s ease-in-out infinite",
          filter: "blur(60px)",
        }}
      />

      {/* ── Very faint purple core — the one dim light in the void ── */}
      <div
        className="absolute"
        style={{
          width: "60%", height: "50%",
          top: "20%", left: "20%",
          background: "radial-gradient(ellipse at 50% 50%, rgba(88,28,135,0.12) 0%, rgba(55,10,90,0.06) 45%, transparent 75%)",
          animation: "shadow-core-pulse 12s ease-in-out infinite",
          filter: "blur(30px)",
        }}
      />

      {/* ── Shadow tendrils (thin darkness wisps) ── */}
      <div
        className="absolute"
        style={{
          width: "2px", height: "60%",
          top: "5%", left: "22%",
          background: "linear-gradient(to bottom, transparent 0%, rgba(120,50,200,0.08) 30%, rgba(80,20,140,0.12) 60%, transparent 100%)",
          animation: "tendril-sway-1 16s ease-in-out infinite",
          filter: "blur(3px)",
        }}
      />
      <div
        className="absolute"
        style={{
          width: "2px", height: "70%",
          top: "10%", right: "18%",
          background: "linear-gradient(to bottom, transparent 0%, rgba(80,20,150,0.07) 40%, rgba(60,10,120,0.1) 70%, transparent 100%)",
          animation: "tendril-sway-2 22s ease-in-out infinite",
          filter: "blur(4px)",
        }}
      />
      <div
        className="absolute"
        style={{
          width: "1px", height: "50%",
          top: "25%", left: "55%",
          background: "linear-gradient(to bottom, transparent 0%, rgba(100,30,180,0.06) 50%, transparent 100%)",
          animation: "tendril-sway-1 19s ease-in-out infinite reverse",
          filter: "blur(2px)",
        }}
      />

      {/* ── Subtle dark hex/grid ── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(80,20,120,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(80,20,120,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          animation: "grid-drift 40s linear infinite",
        }}
      />

      {/* ── Three.js shadow particles ── */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 65], fov: 70 }}
          gl={{ antialias: false, alpha: true }}
          style={{ background: "transparent" }}
        >
          <Scene />
        </Canvas>
      </div>

      {/* ── Shadow smoke wisps (edge-bleeding blobs) ── */}
      {[
        { w: 280, h: 180, top: "5%",  left: "-5%",  dur: "22s", delay: "0s",   rot: -15 },
        { w: 200, h: 140, top: "70%", right: "-3%", dur: "28s", delay: "4s",   rot: 10  },
        { w: 160, h: 100, top: "40%", left: "-2%",  dur: "18s", delay: "8s",   rot: -8  },
        { w: 240, h: 160, bottom: "5%", right: "-4%", dur: "25s", delay: "2s", rot: 5   },
      ].map((wisp, i) => (
        <div
          key={i}
          className="absolute hidden md:block"
          style={{
            width: wisp.w, height: wisp.h,
            top: (wisp as any).top,
            bottom: (wisp as any).bottom,
            left: (wisp as any).left,
            right: (wisp as any).right,
            background: "radial-gradient(ellipse, rgba(50,5,90,0.18) 0%, rgba(30,3,60,0.08) 50%, transparent 80%)",
            filter: "blur(28px)",
            transform: `rotate(${wisp.rot}deg)`,
            animation: `shadow-wisp-float ${wisp.dur} ease-in-out infinite`,
            animationDelay: wisp.delay,
          }}
        />
      ))}

      {/* ── Vignette: deep darkness eating the edges ── */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 85% 75% at 50% 40%, transparent 30%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.92) 100%)",
        }}
      />

      {/* ── Bottom fade to solid black ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48"
        style={{ background: "linear-gradient(to bottom, transparent, #000000)" }}
      />
    </div>
  );
}
