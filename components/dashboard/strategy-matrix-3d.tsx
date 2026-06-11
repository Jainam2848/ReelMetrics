"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { usePathname } from "next/navigation";

export default function StrategyMatrix3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  // Track whether the RAF loop should be running
  const isRunningRef = useRef(false);
  const pathname = usePathname();

  // Only render on the home dashboard — other pages don't need it
  const isHomePage = pathname === "/";

  useEffect(() => {
    // If not on home page, ensure any running loop is stopped and bail early
    if (!isHomePage || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene Setup
    const scene = new THREE.Scene();

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 25;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 4. Generate Glowing Dot Texture programmatically (zero assets required)
    const createGlowingDot = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(0.3, "rgba(108, 92, 231, 0.8)"); // Brand Primary color glow
        gradient.addColorStop(0.6, "rgba(0, 184, 148, 0.2)");  // Brand Secondary color glow
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const dotTexture = createGlowingDot();

    // 5. Constellation Settings & Node Data
    const nodeCount = 50;
    const nodes: {
      position: THREE.Vector3;
      velocity: THREE.Vector3;
      originalY: number;
      speed: number;
    }[] = [];

    const positionsArray = new Float32Array(nodeCount * 3);
    const colorsArray = new Float32Array(nodeCount * 3);

    const primaryColor = new THREE.Color("#6C5CE7");
    const secondaryColor = new THREE.Color("#00B894");

    for (let i = 0; i < nodeCount; i++) {
      // Random coordinates inside a bounding box
      const x = (Math.random() - 0.5) * 35;
      const y = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 15;

      const position = new THREE.Vector3(x, y, z);
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      );

      nodes.push({
        position,
        velocity,
        originalY: y,
        speed: 0.2 + Math.random() * 0.8,
      });

      positionsArray[i * 3] = x;
      positionsArray[i * 3 + 1] = y;
      positionsArray[i * 3 + 2] = z;

      // Color interpolate between neon violet and neon teal
      const ratio = Math.random();
      const color = primaryColor.clone().lerp(secondaryColor, ratio);
      colorsArray[i * 3] = color.r;
      colorsArray[i * 3 + 1] = color.g;
      colorsArray[i * 3 + 2] = color.b;
    }

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positionsArray, 3));
    pointsGeometry.setAttribute("color", new THREE.BufferAttribute(colorsArray, 3));

    const pointsMaterial = new THREE.PointsMaterial({
      size: 1.5,
      map: dotTexture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    const pointsMesh = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(pointsMesh);

    // 6. Network/Connection Lines
    const maxConnections = 80;
    const linePositions = new Float32Array(maxConnections * 2 * 3);
    const lineColors = new Float32Array(maxConnections * 2 * 3);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineMesh);

    // 7. Mouse/Camera Tracking Interaction
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handleMouseMove = (event: MouseEvent) => {
      // Normalize coordinates (-1 to 1)
      mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // 8. Animation Loop
    let elapsed = 0;
    let lastTime = performance.now();
    isRunningRef.current = true;

    const animate = () => {
      if (!isRunningRef.current) return;

      const currentTime = performance.now();
      const delta = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;
      elapsed += delta;

      // Smooth lerp mouse tracking to ease camera rotations
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Parallax rotation of the entire particle cloud
      pointsMesh.rotation.y = mouse.x * 0.25;
      pointsMesh.rotation.x = -mouse.y * 0.15;
      lineMesh.rotation.copy(pointsMesh.rotation);

      // Animate node positions programmatically
      const positionsAttribute = pointsGeometry.getAttribute("position") as THREE.BufferAttribute;
      const positions = positionsAttribute.array as Float32Array;

      for (let i = 0; i < nodeCount; i++) {
        const node = nodes[i]!;

        // Adding smooth sine wave oscillations
        node.position.x += node.velocity.x;
        node.position.y = node.originalY + Math.sin(elapsed * node.speed + i) * 0.4;
        node.position.z += node.velocity.z;

        // Boundary checks to bounce back
        if (Math.abs(node.position.x) > 18) node.velocity.x *= -1;
        if (Math.abs(node.position.z) > 10) node.velocity.z *= -1;

        positions[i * 3] = node.position.x;
        positions[i * 3 + 1] = node.position.y;
        positions[i * 3 + 2] = node.position.z;
      }

      positionsAttribute.needsUpdate = true;

      // Recalculate node connections dynamically
      const linePositionsAttribute = lineGeometry.getAttribute("position") as THREE.BufferAttribute;
      const lineColorsAttribute = lineGeometry.getAttribute("color") as THREE.BufferAttribute;
      const linePositionsArr = linePositionsAttribute.array as Float32Array;
      const lineColorsArr = lineColorsAttribute.array as Float32Array;

      // Reset lines
      linePositionsArr.fill(0);
      lineColorsArr.fill(0);

      const maxDist = 7.5;
      let currentLines = 0;

      for (let i = 0; i < nodeCount && currentLines < maxConnections; i++) {
        const nodeA = nodes[i]!;
        for (let j = i + 1; j < nodeCount && currentLines < maxConnections; j++) {
          const nodeB = nodes[j]!;
          const dist = nodeA.position.distanceTo(nodeB.position);

          if (dist < maxDist) {
            const startIdx = currentLines * 6;
            
            // Start node position
            linePositionsArr[startIdx] = nodeA.position.x;
            linePositionsArr[startIdx + 1] = nodeA.position.y;
            linePositionsArr[startIdx + 2] = nodeA.position.z;

            // End node position
            linePositionsArr[startIdx + 3] = nodeB.position.x;
            linePositionsArr[startIdx + 4] = nodeB.position.y;
            linePositionsArr[startIdx + 5] = nodeB.position.z;

            // Compute line color (blend starting and ending nodes)
            const cA_r = colorsArray[i * 3]!;
            const cA_g = colorsArray[i * 3 + 1]!;
            const cA_b = colorsArray[i * 3 + 2]!;

            const cB_r = colorsArray[j * 3]!;
            const cB_g = colorsArray[j * 3 + 1]!;
            const cB_b = colorsArray[j * 3 + 2]!;

            lineColorsArr[startIdx] = cA_r;
            lineColorsArr[startIdx + 1] = cA_g;
            lineColorsArr[startIdx + 2] = cA_b;

            lineColorsArr[startIdx + 3] = cB_r;
            lineColorsArr[startIdx + 4] = cB_g;
            lineColorsArr[startIdx + 5] = cB_b;

            currentLines++;
          }
        }
      }

      linePositionsAttribute.needsUpdate = true;
      lineColorsAttribute.needsUpdate = true;

      // Draw Call
      renderer.render(scene, camera);
      requestRef.current = requestAnimationFrame(animate);
    };

    // 9. Resize Handling
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunningRef.current = false;
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
          requestRef.current = null;
        }
      } else {
        if (!isRunningRef.current) {
          isRunningRef.current = true;
          lastTime = performance.now();
          requestRef.current = requestAnimationFrame(animate);
        }
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Initial loop execution
    requestRef.current = requestAnimationFrame(animate);

    // 10. Cleanup on Unmount
    return () => {
      isRunningRef.current = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      // Clean up DOM
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      // Dispose ThreeJS resources to prevent WebGL context memory leaks
      pointsGeometry.dispose();
      pointsMaterial.dispose();
      dotTexture.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, [isHomePage]);

  // Don't mount the canvas at all on non-home pages — saves WebGL context
  if (!isHomePage) return null;

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden z-0 opacity-40 bg-transparent"
      aria-hidden="true"
    />
  );
}
