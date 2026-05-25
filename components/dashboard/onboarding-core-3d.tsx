"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface OnboardingCore3DProps {
  niche: string;
  goal: string;
}

export default function OnboardingCore3D({ niche, goal }: OnboardingCore3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);

  // References to pass props to the active animation loop
  const currentNicheRef = useRef<string>(niche);
  const currentGoalRef = useRef<string>(goal);

  useEffect(() => {
    currentNicheRef.current = niche;
  }, [niche]);

  useEffect(() => {
    currentGoalRef.current = goal;
  }, [goal]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 8;

    // 2. WebGL Renderer Setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 3. Programmatic Radial Gradient Particle Dot Texture
    const createParticleTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.8)");
        gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.15)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const particleTexture = createParticleTexture();

    // Helper to generate a points cloud from any geometry
    const createPointsMesh = (geometry: THREE.BufferGeometry, colorHex: string) => {
      const material = new THREE.PointsMaterial({
        size: 0.16,
        color: new THREE.Color(colorHex),
        map: particleTexture,
        transparent: true,
        opacity: 0.0, // starts hidden, fades in
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const mesh = new THREE.Points(geometry, material);
      mesh.scale.setScalar(0.001); // starts collapsed
      scene.add(mesh);
      return { mesh, material };
    };

    // 4. Create the 4 Niche Geometric Shells
    // Tech: Torus Knot Geometry
    const techGeo = new THREE.TorusKnotGeometry(1.0, 0.32, 100, 12, 2, 3);
    const tech = createPointsMesh(techGeo, "#6C5CE7"); // Electric Purple

    // Finance: Swirling Cylinder
    const financeGeo = new THREE.CylinderGeometry(0.8, 0.8, 2.0, 24, 24, true);
    const finance = createPointsMesh(financeGeo, "#F5A623"); // Gold/Amber

    // Comedy: Pulsing Sphere
    const comedyGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const comedy = createPointsMesh(comedyGeo, "#FF007F"); // Neon Pink

    // Education: Structural Icosahedron
    const eduGeo = new THREE.IcosahedronGeometry(1.2, 2);
    const edu = createPointsMesh(eduGeo, "#00B894"); // Neon Teal

    // Map niche keys to their respective meshes
    const nicheMeshes: Record<string, { mesh: THREE.Points; material: THREE.PointsMaterial }> = {
      tech,
      finance,
      comedy,
      education: edu,
      // fallback options
      "": tech, 
      lifestyle: comedy,
      fashion: edu,
    };

    // Ambient Lighting for visual depth (points don't require light, but adds mesh shading capability if we add a wireframe back shell)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // 5. Animation Loop
    let elapsed = 0;
    const clock = new THREE.Clock();

    // Spring interpolation values
    const animStates = {
      tech: { scale: 0.001, opacity: 0 },
      finance: { scale: 0.001, opacity: 0 },
      comedy: { scale: 0.001, opacity: 0 },
      education: { scale: 0.001, opacity: 0 },
    };

    const animate = () => {
      const delta = clock.getDelta();
      elapsed += delta;

      // Extract current reactive props
      const activeNiche = currentNicheRef.current || "tech";
      const activeGoal = currentGoalRef.current || "";

      // Determine active target layout key
      let resolvedKey = "tech";
      if (activeNiche === "tech") resolvedKey = "tech";
      else if (activeNiche === "finance") resolvedKey = "finance";
      else if (activeNiche === "comedy" || activeNiche === "lifestyle") resolvedKey = "comedy";
      else if (activeNiche === "education" || activeNiche === "fashion") resolvedKey = "education";

      // 6. Base scale and pulse variations based on selected Goal
      let targetBaseScale = 1.0;
      let pulseSpeed = 1.5;
      let pulseAmp = 0.0;
      let rotationMultiplier = 1.0;

      if (activeGoal === "retention") {
        // Hypnotic breathing pulse
        pulseAmp = 0.12;
        pulseSpeed = 2.0;
      } else if (activeGoal === "engagement") {
        // Fast rotation + minor vertical vibration
        rotationMultiplier = 2.8;
        pulseAmp = 0.04;
        pulseSpeed = 8.0;
      } else if (activeGoal === "followers") {
        // Expanded shape
        targetBaseScale = 1.4;
        pulseAmp = 0.06;
        pulseSpeed = 1.0;
      }

      const pulse = 1.0 + Math.sin(elapsed * pulseSpeed) * pulseAmp;

      // 7. Smoothly Lerp Scales & Opacities of Niche Shapes
      Object.keys(nicheMeshes).forEach((key) => {
        const item = nicheMeshes[key];
        if (!item) return;

        // Skip keys that are just fallbacks to avoid double processing
        if (key === "" || key === "lifestyle" || key === "fashion") return;

        const targetScale = key === resolvedKey ? targetBaseScale * pulse : 0.001;
        const targetOpacity = key === resolvedKey ? 0.85 : 0.0;

        // Fetch local anim state values
        const state = animStates[key as keyof typeof animStates];
        if (state) {
          // Lerp calculations for ultra-smooth easing
          state.scale += (targetScale - state.scale) * 0.1;
          state.opacity += (targetOpacity - state.opacity) * 0.12;

          // Apply to ThreeJS Mesh and Material
          item.mesh.scale.setScalar(state.scale);
          item.material.opacity = state.opacity;

          // Gentle rotation animation
          item.mesh.rotation.y += delta * 0.4 * rotationMultiplier;
          item.mesh.rotation.x += delta * 0.15 * (rotationMultiplier * 0.5);

          // Subtle float oscillation
          item.mesh.position.y = Math.sin(elapsed * 1.2 + (key === "tech" ? 0 : 2)) * 0.15;
        }
      });

      // Render Scene
      renderer.render(scene, camera);
      requestRef.current = requestAnimationFrame(animate);
    };

    // 8. Resize Handler
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Initial Trigger
    requestRef.current = requestAnimationFrame(animate);

    // 9. Component Unmount Disposal & Cleanup
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener("resize", handleResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      // Dispose geometries
      techGeo.dispose();
      financeGeo.dispose();
      comedyGeo.dispose();
      eduGeo.dispose();

      // Dispose materials & textures
      tech.material.dispose();
      finance.material.dispose();
      comedy.material.dispose();
      edu.material.dispose();
      particleTexture.dispose();

      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[220px] select-none pointer-events-none relative z-10"
      aria-hidden="true"
    />
  );
}
