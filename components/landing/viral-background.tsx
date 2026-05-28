"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useScroll } from "framer-motion";

// Configuration
const NUM_NODES = 80;
const NUM_CHILDREN = 70; // Reserve for particles
const TOTAL_INSTANCES = NUM_NODES + NUM_CHILDREN;

const BRAND_COLORS = {
  purple: new THREE.Color("#6C5CE7"),
  green: new THREE.Color("#00B894"),
  pink: new THREE.Color("#FD79A8"),
  grey: new THREE.Color("#444444"),
  idle: new THREE.Color("#2a2a35"),
};

// Types
type NodeState = "idle" | "ignited" | "dead";

interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  basePosition: THREE.Vector3; // For brownian motion return
  color: THREE.Color;
  targetColor: THREE.Color;
  state: NodeState;
  scale: number;
  targetScale: number;
  isChild: boolean;
  active: boolean;
  parentIndex: number;
  lifeTime: number;
  maxLife: number;
  ignitionCooldown: number;
}

const ViralNodes = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { viewport, pointer } = useThree();
  const { scrollYProgress } = useScroll();

  // Internal state tracking
  const particles = useMemo(() => {
    const arr: ParticleData[] = [];
    
    // Primary Nodes
    for (let i = 0; i < NUM_NODES; i++) {
      const isDead = Math.random() < 0.15; // 15% start dead
      const x = (Math.random() - 0.5) * viewport.width * 1.5;
      const y = (Math.random() - 0.5) * viewport.height * 1.5;
      const z = (Math.random() - 0.5) * 5 - 2;

      arr.push({
        position: new THREE.Vector3(x, y, z),
        basePosition: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(Math.random() * 0.01 + 0.005, (Math.random() - 0.5) * 0.01, 0),
        color: isDead ? BRAND_COLORS.grey.clone() : BRAND_COLORS.idle.clone(),
        targetColor: isDead ? BRAND_COLORS.grey.clone() : BRAND_COLORS.idle.clone(),
        state: isDead ? "dead" : "idle",
        scale: isDead ? 0.4 : 1.0,
        targetScale: isDead ? 0.4 : 1.0,
        isChild: false,
        active: true,
        parentIndex: -1,
        lifeTime: 0,
        maxLife: 0,
        ignitionCooldown: Math.random() * 5 + 2, // Random delay before ignition
      });
    }

    // Child Particles
    for (let i = 0; i < NUM_CHILDREN; i++) {
      arr.push({
        position: new THREE.Vector3(0, 0, 0),
        basePosition: new THREE.Vector3(0, 0, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        color: new THREE.Color(0,0,0),
        targetColor: new THREE.Color(0,0,0),
        state: "idle",
        scale: 0,
        targetScale: 0,
        isChild: true,
        active: false,
        parentIndex: -1,
        lifeTime: 0,
        maxLife: 2,
        ignitionCooldown: 0,
      });
    }

    return arr;
  }, [viewport]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorObj = useMemo(() => new THREE.Color(), []);

  // Ripple Event Listener
  const [rippleTrigger, setRippleTrigger] = useState<{x: number, y: number, time: number} | null>(null);
  
  useEffect(() => {
    const handleRipple = (e: any) => {
      // Convert screen coords to viewport coords roughly
      const x = (e.detail.x / window.innerWidth) * 2 - 1;
      const y = -(e.detail.y / window.innerHeight) * 2 + 1;
      setRippleTrigger({ x: x * viewport.width / 2, y: y * viewport.height / 2, time: performance.now() });
    };
    window.addEventListener("viral-ripple", handleRipple);
    return () => window.removeEventListener("viral-ripple", handleRipple);
  }, [viewport]);

  // Scroll triggers
  const lastScroll = useRef(0);
  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      const thresholds = [0.2, 0.5, 0.8];
      for (const t of thresholds) {
        if (lastScroll.current < t && v >= t) {
          // Trigger wave
          particles.forEach((p) => {
            if (!p.isChild && p.state === "idle" && Math.random() > 0.4) {
              igniteNode(p);
            }
          });
        }
      }
      lastScroll.current = v;
    });
  }, [scrollYProgress, particles]);

  const igniteNode = (p: ParticleData) => {
    p.state = "ignited";
    p.targetScale = 2.5;
    p.targetColor = Math.random() > 0.5 ? BRAND_COLORS.purple.clone() : BRAND_COLORS.green.clone();
    p.ignitionCooldown = Math.random() * 5 + 3; // Cooldown till next random ignition
    p.lifeTime = 0; // use lifeTime to track ignition duration
    p.maxLife = 1.5; // seconds
  };

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const pointerVec = new THREE.Vector3(
      (pointer.x * viewport.width) / 2,
      (pointer.y * viewport.height) / 2,
      0
    );

    let childIndex = NUM_NODES; // Track available children

    particles.forEach((p, i) => {
      if (!p.active) {
        // Hide inactive
        dummy.position.set(9999, 9999, 9999);
        dummy.scale.set(0,0,0);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
        return;
      }

      // Movement & Physics
      if (!p.isChild) {
        // Drift rightwards
        p.basePosition.addScaledVector(p.velocity, delta * 60);
        
        // Wrap around
        if (p.basePosition.x > viewport.width / 2 + 2) {
          p.basePosition.x = -viewport.width / 2 - 2;
          p.basePosition.y = (Math.random() - 0.5) * viewport.height;
        }

        // Brownian motion
        p.position.lerp(p.basePosition, 0.1);
        p.position.x += (Math.random() - 0.5) * 0.05;
        p.position.y += (Math.random() - 0.5) * 0.05;

        // Gravitational pull to pointer
        const distToPointer = p.position.distanceTo(pointerVec);
        if (distToPointer < 3) {
          const force = new THREE.Vector3().subVectors(pointerVec, p.position).normalize().multiplyScalar(0.05 / Math.max(distToPointer, 0.5));
          p.position.add(force);
        }

        // Ripple Effect
        if (rippleTrigger && performance.now() - rippleTrigger.time < 1000) {
          const ripCenter = new THREE.Vector3(rippleTrigger.x, rippleTrigger.y, 0);
          const distToRipple = p.position.distanceTo(ripCenter);
          const timeSinceRipple = (performance.now() - rippleTrigger.time) / 1000;
          // Wave front travels outward
          const waveFront = timeSinceRipple * 15;
          if (Math.abs(distToRipple - waveFront) < 1.5) {
             p.position.add(new THREE.Vector3().subVectors(p.position, ripCenter).normalize().multiplyScalar(0.1));
             if (p.state === "idle" && Math.random() > 0.7) igniteNode(p);
          }
        }

        // Random Ignition Logic
        if (p.state === "idle") {
          p.ignitionCooldown -= delta;
          if (p.ignitionCooldown <= 0 && Math.random() < 0.2) {
            igniteNode(p);
          }
        } else if (p.state === "ignited") {
          p.lifeTime += delta;
          
          // Spawn children on initial ignition
          if (p.lifeTime < 0.1 && childIndex < TOTAL_INSTANCES - 3) {
             for(let j=0; j<3; j++) {
               const cp = particles[childIndex++];
               if(cp) {
                 cp.active = true;
                 cp.position.copy(p.position);
                 cp.velocity = new THREE.Vector3((Math.random()-0.5)*5, (Math.random()-0.5)*5, (Math.random()-0.5)*2);
                 cp.color = p.targetColor.clone();
                 cp.targetColor = BRAND_COLORS.pink.clone();
                 cp.scale = 0.5;
                 cp.targetScale = 0;
                 cp.lifeTime = 0;
                 cp.maxLife = 0.8 + Math.random()*0.5;
               }
             }
          }

          if (p.lifeTime > p.maxLife) {
            // Cool down
            p.state = "idle";
            p.targetScale = 1.0;
            p.targetColor = BRAND_COLORS.idle.clone();
            p.ignitionCooldown = Math.random() * 8 + 4;
          }
        }
      } else {
        // Child particle logic (sparks)
        p.lifeTime += delta;
        p.position.addScaledVector(p.velocity, delta);
        p.velocity.multiplyScalar(0.95); // drag
        p.scale = THREE.MathUtils.lerp(0.5, 0, p.lifeTime / p.maxLife);
        
        if (p.lifeTime >= p.maxLife) {
          p.active = false;
        }
      }

      // Smooth transitions
      p.scale += (p.targetScale - p.scale) * 0.1;
      p.color.lerp(p.targetColor, 0.1);

      // Apply to matrix
      dummy.position.copy(p.position);
      dummy.scale.setScalar(p.scale * 0.15); // Base node size
      dummy.updateMatrix();
      
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      meshRef.current!.setColorAt(i, p.color);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, TOTAL_INSTANCES]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
};

export function ViralBackground({ className }: { className?: string }) {
  return (
    <div className={`fixed inset-0 z-[-1] pointer-events-none bg-[#0B0C10] ${className || ""}`}>
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }} dpr={[1, 2]}>
        <color attach="background" args={["#0B0C10"]} />
        <ViralNodes />
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
