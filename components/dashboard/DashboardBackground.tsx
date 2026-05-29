"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Particle {
  x: number;
  y: number;
  z: number;
  size: number;
  opacity: number;
}

function SceneContent({ isVisibleRef }: { isVisibleRef: React.RefObject<boolean> }) {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  // Mouse coordinate refs
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const particleCount = 40;

  // 1. Grid positions & z-depth scaling groups
  const [particles, velocities] = useMemo(() => {
    const parts: Particle[] = [];
    const vels: { x: number; y: number }[] = [];

    const cols = 8;
    const rows = 5;
    const cellWidth = 20 / cols; // Spanning X bounds roughly [-10, 10]
    const cellHeight = 12 / rows; // Spanning Y bounds roughly [-6, 6]

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        // Center cell coordinate
        const centerX = -10 + c * cellWidth + cellWidth / 2;
        const centerY = -6 + r * cellHeight + cellHeight / 2;

        // ±15% Jitter bounds from the grid center
        const jitterX = (Math.random() - 0.5) * cellWidth * 0.3;
        const jitterY = (Math.random() - 0.5) * cellHeight * 0.3;

        const x = centerX + jitterX;
        const y = centerY + jitterY;

        const index = c * rows + r;
        let z = 0;
        let opacity = 0.25;
        let size = 1.5;

        // z-depth groups for dynamic parallax layering
        if (index < 14) {
          z = -6; // Far particles
          opacity = 0.15;
          size = 1.0;
        } else if (index < 30) {
          z = -3; // Mid particles
          opacity = 0.25;
          size = 1.5;
        } else {
          z = 0; // Near particles
          opacity = 0.35;
          size = 2.0;
        }

        parts.push({ x, y, z, size, opacity });

        // Muted slow drift velocities (max 0.008 units/frame)
        vels.push({
          x: (Math.random() - 0.5) * 0.004,
          y: (Math.random() - 0.5) * 0.004,
        });
      }
    }
    return [parts, vels] as [Particle[], { x: number; y: number }[]];
  }, []);

  // 2. Pre-allocated typed arrays for lines to enforce zero-allocation rendering loops
  const maxLines = 6;
  const linePositions = useMemo(() => new Float32Array(maxLines * 2 * 3), []);
  const lineColors = useMemo(() => new Float32Array(maxLines * 2 * 3), []);

  useFrame((state) => {
    // Fully bypass frames if user tab is out of focus (observability limits)
    if (!isVisibleRef.current) return;

    const { viewport, camera } = state;

    // Smoothly ease cursor coordinates (lerp)
    mouseRef.current.x = THREE.MathUtils.lerp(mouseRef.current.x, mouseRef.current.targetX, 0.08);
    mouseRef.current.y = THREE.MathUtils.lerp(mouseRef.current.y, mouseRef.current.targetY, 0.08);

    // Dynamic, barely perceptible camera parallax window tilting
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouseRef.current.x * 0.8, 0.018);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, mouseRef.current.y * 0.5, 0.018);
    camera.lookAt(0, 0, 0);

    // Project cursor coordinates into a 3D target gravity vector
    const mouse3D = new THREE.Vector3(
      (mouseRef.current.x * viewport.width) / 2,
      (mouseRef.current.y * viewport.height) / 2,
      0
    );

    const tempObject = new THREE.Object3D();
    const connections: { distance: number; particle: Particle }[] = [];

    // Drift particles, perform boundary soft reversal, and populate instanced matrices
    for (let i = 0; i < particleCount; i++) {
      const p = particles[i]!;
      const v = velocities[i]!;

      // Update positions by velocity
      p.x += v.x;
      p.y += v.y;

      // Soft boundary bounce limits (margin offset of 1 unit outside current viewport width/height)
      const limitX = viewport.width / 2 + 1.0;
      const limitY = viewport.height / 2 + 1.0;

      if (Math.abs(p.x) > limitX) {
        v.x *= -0.8;
        p.x = Math.sign(p.x) * limitX;
      }
      if (Math.abs(p.y) > limitY) {
        v.y *= -0.8;
        p.y = Math.sign(p.y) * limitY;
      }

      // Update Instance matrix
      tempObject.position.set(p.x, p.y, p.z);
      // Scale particles based on their tiny premium sizing (1px, 1.5px, 2px representation)
      const scaleFactor = p.size * 0.035;
      tempObject.scale.set(scaleFactor, scaleFactor, scaleFactor);
      tempObject.updateMatrix();

      if (instancedMeshRef.current) {
        instancedMeshRef.current.setMatrixAt(i, tempObject.matrix);
      }

      // Check distance to mouse for lines connection
      const dx = p.x - mouse3D.x;
      const dy = p.y - mouse3D.y;
      const dz = p.z - mouse3D.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      const dist = Math.sqrt(distSq);

      if (dist < 3.5) {
        connections.push({ distance: dist, particle: p });
      }
    }

    if (instancedMeshRef.current) {
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Connect lines with hard cap: maximum of 6 lines visible at any time
    connections.sort((a, b) => a.distance - b.distance);
    const activeConnections = connections.slice(0, maxLines);

    let vertexpos = 0;
    let colorpos = 0;
    let linesCount = 0;

    activeConnections.forEach((conn) => {
      const p = conn.particle;
      const dist = conn.distance;

      // Fade: (1 - distance / maxRadius) * 0.20
      const alpha = (1.0 - dist / 3.5) * 0.20;

      // Vertices Point 1: Particle
      linePositions[vertexpos++] = p.x;
      linePositions[vertexpos++] = p.y;
      linePositions[vertexpos++] = p.z;

      // Vertices Point 2: Mouse
      linePositions[vertexpos++] = mouse3D.x;
      linePositions[vertexpos++] = mouse3D.y;
      linePositions[vertexpos++] = mouse3D.z;

      // Brand Indigo (#6366F1) RGB values
      const r = 99 / 255;
      const g = 102 / 255;
      const b = 241 / 255;

      lineColors[colorpos++] = r * alpha;
      lineColors[colorpos++] = g * alpha;
      lineColors[colorpos++] = b * alpha;

      lineColors[colorpos++] = r * alpha;
      lineColors[colorpos++] = g * alpha;
      lineColors[colorpos++] = b * alpha;

      linesCount++;
    });

    if (linesRef.current) {
      const linesGeom = linesRef.current.geometry;
      if (linesGeom.attributes.position) {
        linesGeom.attributes.position.needsUpdate = true;
      }
      if (linesGeom.attributes.color) {
        linesGeom.attributes.color.needsUpdate = true;
      }
      linesRef.current.geometry.setDrawRange(0, linesCount * 2);
    }
  });

  // Apply colors to particles on mount based on opacity multipliers
  useEffect(() => {
    if (!instancedMeshRef.current) return;
    const baseColor = new THREE.Color("#6366F1");
    for (let i = 0; i < particleCount; i++) {
      const finalColor = baseColor.clone().multiplyScalar(particles[i]!.opacity);
      instancedMeshRef.current.setColorAt(i, finalColor);
    }
    if (instancedMeshRef.current.instanceColor) {
      instancedMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [particles]);

  return (
    <group>
      {/* Capped sparse particles InstancedMesh */}
      <instancedMesh
        ref={instancedMeshRef}
        args={[null as any, null as any, particleCount]}
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>

      {/* Hairline Indigo connection lines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[lineColors, 3]}
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

export default function DashboardBackground() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const isVisibleRef = useRef(true);

  // 1. Mobile & Touch Screen opt-out checks
  useEffect(() => {
    const handleResize = () => {
      const isCoarse = window.matchMedia("(pointer: coarse)").matches;
      const isSmall = window.innerWidth < 768;
      setIsMobile(isCoarse || isSmall);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 2. Tab backgrounding visibility handler
  useEffect(() => {
    if (isMobile) return;

    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === "visible";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isMobile]);

  // 3. Prevent initial mount flashing by fading in WebGL canvas over 1200ms
  useEffect(() => {
    if (isMobile) return;
    const timer = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(timer);
  }, [isMobile]);

  // If mobile, bypass WebGL canvas rendering completely to conserve battery and GPU cycles
  if (isMobile) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2,
        pointerEvents: "none",
        opacity: mounted ? 1 : 0,
        transition: "opacity 1200ms ease-in-out",
        willChange: "transform",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 85 }}
        dpr={[1, 1.5]} // Limit pixel ratio to preserve battery and frames
        gl={{
          antialias: false, // Turn off antialiasing for maximum frame speed
          alpha: true,
          powerPreference: "low-power", // Explicit low power GPU request
        }}
        onCreated={({ gl, scene }) => {
          // Add custom unmount hook to cleanly lose WebGL contexts
          return () => {
            gl.dispose();
            scene.clear();
            gl.getContext().getExtension("WEBGL_lose_context")?.loseContext();
          };
        }}
      >
        <SceneContent isVisibleRef={isVisibleRef} />
      </Canvas>
    </div>
  );
}
