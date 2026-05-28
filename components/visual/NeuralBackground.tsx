/* eslint-disable */
// @ts-nocheck
"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// A low-particle-count, subtle neural network effect
function NeuralNetwork() {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const particleCount = 120; // Kept low for performance
  const maxDistance = 3.5; // Distance threshold for connecting lines

  // Generate random positions and velocities
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Spread particles in a wide 3D space
      pos[i * 3] = (Math.random() - 0.5) * 20;     // x
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20; // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 5; // z (slightly pushed back)

      // Very slow movement
      vel[i * 3] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    return [pos, vel] as [Float32Array, Float32Array];
  }, [particleCount]);

  // Buffers for lines
  // Max possible lines is n*(n-1)/2, but we only draw close ones.
  // We'll pre-allocate a reasonable buffer size.
  const linePositions = useMemo(() => new Float32Array(particleCount * particleCount * 3), [particleCount]);
  const lineOpacities = useMemo(() => new Float32Array(particleCount * particleCount), [particleCount]);
  const lineColors = useMemo(() => new Float32Array(particleCount * particleCount * 3), [particleCount]);

  useFrame(() => {
    if (!pointsRef.current || !linesRef.current) return;

    const positionsAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const posArray = positionsAttr.array as Float32Array;

    // Update positions based on velocity
    for (let i = 0; i < particleCount; i++) {
      posArray[i * 3] += velocities[i * 3];
      posArray[i * 3 + 1] += velocities[i * 3 + 1];
      posArray[i * 3 + 2] += velocities[i * 3 + 2];

      // Bounce off invisible boundaries to keep them on screen
      if (Math.abs(posArray[i * 3]) > 12) velocities[i * 3] *= -1;
      if (Math.abs(posArray[i * 3 + 1]) > 12) velocities[i * 3 + 1] *= -1;
      if (posArray[i * 3 + 2] > 2 || posArray[i * 3 + 2] < -15) velocities[i * 3 + 2] *= -1;
    }
    positionsAttr.needsUpdate = true;

    // Calculate lines between close particles
    let vertexpos = 0;
    let colorpos = 0;
    let numConnected = 0;

    const linePosAttr = linesRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const lineColorAttr = linesRef.current.geometry.attributes.color as THREE.BufferAttribute;
    
    // We update the arrays directly
    const linePosArray = linePosAttr.array as Float32Array;
    const lineColorArray = lineColorAttr.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dx = posArray[i * 3] - posArray[j * 3];
        const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
        const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < maxDistance * maxDistance) {
          // Calculate opacity based on distance (closer = more opaque)
          const alpha = 1.0 - Math.sqrt(distSq) / maxDistance;
          // Very subtle base color
          const rgb = 0.2; 
          
          // Point 1
          linePosArray[vertexpos++] = posArray[i * 3];
          linePosArray[vertexpos++] = posArray[i * 3 + 1];
          linePosArray[vertexpos++] = posArray[i * 3 + 2];
          lineColorArray[colorpos++] = rgb;
          lineColorArray[colorpos++] = rgb;
          lineColorArray[colorpos++] = rgb + 0.1; // Slight blue tint
          lineOpacities[numConnected] = alpha * 0.15; // Extremely low opacity for cinematic feel

          // Point 2
          linePosArray[vertexpos++] = posArray[j * 3];
          linePosArray[vertexpos++] = posArray[j * 3 + 1];
          linePosArray[vertexpos++] = posArray[j * 3 + 2];
          lineColorArray[colorpos++] = rgb;
          lineColorArray[colorpos++] = rgb;
          lineColorArray[colorpos++] = rgb + 0.1;
          lineOpacities[numConnected + 1] = alpha * 0.15;

          numConnected += 2;
        }
      }
    }

    linesRef.current.geometry.setDrawRange(0, numConnected);
    linePosAttr.needsUpdate = true;
    lineColorAttr.needsUpdate = true;
    
    // Update opacities via custom attribute or just rely on color if we baked it.
    // For simplicity with standard materials, we'll bake opacity into the line material's vertex colors
    // by using a custom shader or just adjusting the line color to be darker.
    // Since LineBasicMaterial doesn't support vertex alpha easily without ShaderMaterial, 
    // we multiply color by alpha to fake it for additive blending.
    for (let i = 0; i < numConnected; i++) {
      lineColorArray[i * 3] *= lineOpacities[i];
      lineColorArray[i * 3 + 1] *= lineOpacities[i];
      lineColorArray[i * 3 + 2] *= lineOpacities[i];
    }
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#8c8cff"
          transparent
          opacity={0.3}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={linePositions.length / 3}
            array={linePositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={linePositions.length / 3}
            array={lineColors}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

export function NeuralBackground() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none bg-background">
      {/* Soft gradient overlay for atmospheric depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-primary/5 via-background to-background" />
      
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]} // Limit pixel ratio for performance
        gl={{ antialias: false, alpha: true }}
      >
        <NeuralNetwork />
      </Canvas>
    </div>
  );
}
