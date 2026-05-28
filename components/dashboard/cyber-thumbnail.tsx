"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, useTexture, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface CyberThumbnailProps {
  mediaUrl: string | null;
  moatScore: number | null;
}

function ImageCard({ url }: { url: string }) {
  const texture = useTexture(url);
  return (
    <mesh castShadow receiveShadow>
      <planeGeometry args={[2.5, 3.5]} />
      <meshStandardMaterial map={texture} roughness={0.2} metalness={0.8} />
    </mesh>
  );
}

function EnergyField({ score }: { score: number | null }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Create particle positions
  const particleCount = 200;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 3 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 6;
      pos[i * 3] = Math.cos(theta) * radius;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(theta) * radius;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * (score ? 0.2 : 0.05);
    }
  });

  const isActive = score !== null;
  const color = isActive ? (score > 800 ? "#00F0FF" : "#FF003C") : "#444444";

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={color}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function CyberWireframe() {
  const wireRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (wireRef.current) {
      wireRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      wireRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <mesh ref={wireRef}>
      <boxGeometry args={[3, 4, 0.5]} />
      <meshBasicMaterial color="#00F0FF" wireframe transparent opacity={0.15} />
    </mesh>
  );
}

export function CyberThumbnail({ mediaUrl, moatScore }: CyberThumbnailProps) {
  return (
    <div className="w-full h-full min-h-[400px] relative bg-black overflow-hidden rounded-2xl border border-glass scanlines">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent z-0 pointer-events-none" />
      
      <div className="absolute inset-0 z-10">
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={2} color="#00F0FF" />
          <directionalLight position={[-5, -5, -5]} intensity={1} color="#FF003C" />
          
          <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            {mediaUrl ? (
              <React.Suspense fallback={null}>
                <ImageCard url={mediaUrl} />
              </React.Suspense>
            ) : (
              <mesh>
                <planeGeometry args={[2.5, 3.5]} />
                <meshStandardMaterial color="#111111" roughness={0.8} metalness={0.2} />
              </mesh>
            )}
            <CyberWireframe />
          </Float>
          
          <EnergyField score={moatScore} />
          
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            maxPolarAngle={Math.PI / 2 + 0.2}
            minPolarAngle={Math.PI / 2 - 0.2}
            maxAzimuthAngle={0.5}
            minAzimuthAngle={-0.5}
          />
        </Canvas>
      </div>

      {/* Cyber overlay elements */}
      <div className="absolute top-4 right-4 z-20 text-[10px] font-mono text-brand-primary/60 tracking-widest">
        SYS.REC // 001
      </div>
      <div className="absolute bottom-4 left-4 z-20 text-[10px] font-mono text-brand-primary/40 tracking-widest uppercase">
        {moatScore ? `ANALYTICS_ENGAGED::${moatScore}` : "AWAITING_INPUT"}
      </div>
    </div>
  );
}
