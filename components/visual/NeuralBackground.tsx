/* eslint-disable */
// @ts-nocheck
"use client";

import { useMemo, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// A low-particle-count, highly interactive neural network effect
function NeuralNetwork() {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const particleCount = 120; // Kept low for performance
  const maxDistance = 3.5; // Distance threshold for connecting lines
  const mouseDistanceThreshold = 4.5; // Proximity threshold for mouse links

  // Ref to hold current and target mouse positions
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // Update mouse positions on window mousemove
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to -1 to 1 (same as three.js coordinate space)
      mouseRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Generate random positions, velocities, and brand colors
  const [positions, velocities, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);

    // Brand Palette: Strategy Indigo (#4F46E5), Growth Teal (#14B8A6), Fuchsia (#D946EF)
    const palette = [
      new THREE.Color("#4F46E5"),
      new THREE.Color("#14B8A6"),
      new THREE.Color("#D946EF"),
    ];

    for (let i = 0; i < particleCount; i++) {
      // Spread particles in a wide 3D space
      pos[i * 3] = (Math.random() - 0.5) * 20;     // x
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20; // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 5; // z (slightly pushed back)

      // Very slow drift
      vel[i * 3] = (Math.random() - 0.5) * 0.008;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.008;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.008;

      // Assign a random brand color
      const color = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }
    return [pos, vel, col] as [Float32Array, Float32Array, Float32Array];
  }, [particleCount]);

  // Buffers for lines
  const linePositions = useMemo(() => new Float32Array(particleCount * particleCount * 3), [particleCount]);
  const lineOpacities = useMemo(() => new Float32Array(particleCount * particleCount), [particleCount]);
  const lineColors = useMemo(() => new Float32Array(particleCount * particleCount * 3), [particleCount]);

  useFrame((state) => {
    if (!pointsRef.current || !linesRef.current) return;

    // Smoothly interpolate mouse coordinates to make interactions silky smooth
    mouseRef.current.x = THREE.MathUtils.lerp(mouseRef.current.x, mouseRef.current.targetX, 0.08);
    mouseRef.current.y = THREE.MathUtils.lerp(mouseRef.current.y, mouseRef.current.targetY, 0.08);

    // 1. Apply smooth Camera Parallax Tilt
    const camera = state.camera;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouseRef.current.x * 2.2, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, mouseRef.current.y * 2.2, 0.05);
    camera.lookAt(0, 0, 0);

    // 2. Project screen space mouse coordinates into a 3D gravity vector at active node depth
    const viewport = state.viewport;
    const mouse3D = new THREE.Vector3(
      (mouseRef.current.x * viewport.width) / 2,
      (mouseRef.current.y * viewport.height) / 2,
      -1 // Slightly forward of the particle z center for ideal layered overlap
    );

    const positionsAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const posArray = positionsAttr.array as Float32Array;

    // 3. Update particle positions based on velocity and subtle mouse pull
    for (let i = 0; i < particleCount; i++) {
      // Passive velocity drift
      posArray[i * 3] += velocities[i * 3];
      posArray[i * 3 + 1] += velocities[i * 3 + 1];
      posArray[i * 3 + 2] += velocities[i * 3 + 2];

      // Subtle magnetic attraction towards the mouse cursor
      const dx = posArray[i * 3] - mouse3D.x;
      const dy = posArray[i * 3 + 1] - mouse3D.y;
      const dz = posArray[i * 3 + 2] - mouse3D.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      const dist = Math.sqrt(distSq);

      if (dist < mouseDistanceThreshold) {
        // Organic pulling effect: closer nodes slide gently towards the cursor
        const pullForce = (1.0 - dist / mouseDistanceThreshold) * 0.015;
        posArray[i * 3] += (mouse3D.x - posArray[i * 3]) * pullForce;
        posArray[i * 3 + 1] += (mouse3D.y - posArray[i * 3 + 1]) * pullForce;
        posArray[i * 3 + 2] += (mouse3D.z - posArray[i * 3 + 2]) * pullForce;
      }

      // Bounce off screen boundaries to keep particles within viewport constraints
      if (Math.abs(posArray[i * 3]) > 12) velocities[i * 3] *= -1;
      if (Math.abs(posArray[i * 3 + 1]) > 12) velocities[i * 3 + 1] *= -1;
      if (posArray[i * 3 + 2] > 2 || posArray[i * 3 + 2] < -15) velocities[i * 3 + 2] *= -1;
    }
    positionsAttr.needsUpdate = true;

    // 4. Calculate connections between close nodes & cursor proximity lines
    let vertexpos = 0;
    let colorpos = 0;
    let numConnected = 0;

    const linePosAttr = linesRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const lineColorAttr = linesRef.current.geometry.attributes.color as THREE.BufferAttribute;
    
    const linePosArray = linePosAttr.array as Float32Array;
    const lineColorArray = lineColorAttr.array as Float32Array;

    // Render inter-particle connections
    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dx = posArray[i * 3] - posArray[j * 3];
        const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
        const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < maxDistance * maxDistance) {
          const alpha = 1.0 - Math.sqrt(distSq) / maxDistance;
          // Clean dark node connections with subtle blue/gray blending
          const rgb = 0.18; 
          
          linePosArray[vertexpos++] = posArray[i * 3];
          linePosArray[vertexpos++] = posArray[i * 3 + 1];
          linePosArray[vertexpos++] = posArray[i * 3 + 2];
          lineColorArray[colorpos++] = rgb * alpha * 0.15;
          lineColorArray[colorpos++] = rgb * alpha * 0.15;
          lineColorArray[colorpos++] = (rgb + 0.15) * alpha * 0.25; // Subtle blue halo

          linePosArray[vertexpos++] = posArray[j * 3];
          linePosArray[vertexpos++] = posArray[j * 3 + 1];
          linePosArray[vertexpos++] = posArray[j * 3 + 2];
          lineColorArray[colorpos++] = rgb * alpha * 0.15;
          lineColorArray[colorpos++] = rgb * alpha * 0.15;
          lineColorArray[colorpos++] = (rgb + 0.15) * alpha * 0.25;

          numConnected += 2;
        }
      }

      // 5. Render cursor gravity web connections (nodes linking directly to mouse position)
      const dx = posArray[i * 3] - mouse3D.x;
      const dy = posArray[i * 3 + 1] - mouse3D.y;
      const dz = posArray[i * 3 + 2] - mouse3D.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      const dist = Math.sqrt(distSq);

      if (dist < mouseDistanceThreshold) {
        const alpha = (1.0 - dist / mouseDistanceThreshold) * 0.7; // Bright responsive link
        
        // Dynamically color gravity connections with a luxury brand gradient: Teal (#14B8A6) -> Fuchsia (#D946EF)
        const ratio = i / particleCount;
        const r = THREE.MathUtils.lerp(0.08, 0.85, ratio); 
        const g = THREE.MathUtils.lerp(0.72, 0.27, ratio); 
        const b = THREE.MathUtils.lerp(0.65, 0.93, ratio); 

        // Particle point
        linePosArray[vertexpos++] = posArray[i * 3];
        linePosArray[vertexpos++] = posArray[i * 3 + 1];
        linePosArray[vertexpos++] = posArray[i * 3 + 2];
        lineColorArray[colorpos++] = r * alpha;
        lineColorArray[colorpos++] = g * alpha;
        lineColorArray[colorpos++] = b * alpha;

        // Cursor point
        linePosArray[vertexpos++] = mouse3D.x;
        linePosArray[vertexpos++] = mouse3D.y;
        linePosArray[vertexpos++] = mouse3D.z;
        lineColorArray[colorpos++] = r * alpha;
        lineColorArray[colorpos++] = g * alpha;
        lineColorArray[colorpos++] = b * alpha;

        numConnected += 2;
      }
    }

    linesRef.current.geometry.setDrawRange(0, numConnected);
    linePosAttr.needsUpdate = true;
    lineColorAttr.needsUpdate = true;
  });

  return (
    <group>
      {/* Node Particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={colors.length / 3}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12} // Larger, premium circular points
          vertexColors
          transparent
          opacity={0.65}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Connection Lines */}
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
          opacity={1.0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

// Pristine, minimalist gyroscopic orbital rings and geometric crystal for visual structure without clutter
function FloatingGeometries() {
  const gyroRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const crystalRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // 1. Slow, elegant concentric rotations (gyroscopic system)
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = time * 0.03;
      ring1Ref.current.rotation.y = time * 0.015;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -time * 0.045;
      ring2Ref.current.rotation.z = time * 0.025;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x = -time * 0.015;
      ring3Ref.current.rotation.z = -time * 0.035;
    }

    // Gentle global float drift for orbital rings
    if (gyroRef.current) {
      gyroRef.current.position.y = Math.sin(time * 0.15) * 0.25 + 2;
    }

    // 2. Slow-rotating minimalist octahedron core
    if (crystalRef.current) {
      crystalRef.current.rotation.y = time * 0.05;
      crystalRef.current.rotation.x = Math.sin(time * 0.1) * 0.08;
      crystalRef.current.position.y = Math.cos(time * 0.15) * 0.15 - 2;
    }
  });

  return (
    <group>
      {/* ── HIGH-END CONCENTRIC ORBITAL RINGS (Symmetric, vector-sharp curves) ── */}
      <group ref={gyroRef} position={[6, 2, -8]}>
        {/* Outer Ring - Fuchsia */}
        <mesh ref={ring1Ref}>
          <ringGeometry args={[2.46, 2.5, 64]} />
          <meshBasicMaterial
            color="#D946EF"
            side={THREE.DoubleSide}
            transparent
            opacity={0.06}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Middle Ring - Teal */}
        <mesh ref={ring2Ref}>
          <ringGeometry args={[1.96, 2.0, 64]} />
          <meshBasicMaterial
            color="#14B8A6"
            side={THREE.DoubleSide}
            transparent
            opacity={0.07}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Inner Ring - Indigo */}
        <mesh ref={ring3Ref}>
          <ringGeometry args={[1.46, 1.5, 64]} />
          <meshBasicMaterial
            color="#4F46E5"
            side={THREE.DoubleSide}
            transparent
            opacity={0.09}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* ── MINIMALIST CRISP CRYSTAL (Only 8 faces, low-noise geometry) ── */}
      <mesh ref={crystalRef} position={[-6, -2, -6]} scale={1.2}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial
          color="#14B8A6"
          wireframe
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

export function NeuralBackground() {
  const pathname = usePathname();

  // Fully unmount the global background on dashboard pages to prevent duplicate WebGL canvases and loops
  // Also unmount on the marketing landing page — it has its own GridDistortionBackground WebGL canvas.
  const isDashboard =
    pathname === "/dashboard" ||
    pathname?.startsWith("/posts") ||
    pathname?.startsWith("/strategy") ||
    pathname?.startsWith("/analytics") ||
    pathname?.startsWith("/accounts") ||
    pathname?.startsWith("/billing") ||
    pathname?.startsWith("/settings");

  const isLandingPage = pathname === "/";

  if (isDashboard || isLandingPage) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none bg-[#08090D]">
      {/* Soft radial overlay for atmospheric visual depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-primary/5 via-[#08090D] to-[#08090D]" />
      
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]} // Limit pixel ratio to preserve frames-per-second on low-end screens
        gl={{ antialias: false, alpha: true }}
      >
        <NeuralNetwork />
        <FloatingGeometries />
      </Canvas>
    </div>
  );
}
