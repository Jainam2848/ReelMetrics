"use client";

import React, { useEffect, useRef } from "react";
import { useAnalysisState } from "@/lib/contexts/AnalysisStateContext";

// ─── WebGL Shaders ────────────────────────────────────────────────────────────
const VERTEX_SHADER_SOURCE = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;
  
  // Custom interactive fluid parameters
  uniform vec3 u_colorFluid;
  uniform vec3 u_colorAccent;
  uniform float u_fluidSpeed;
  uniform float u_intensity;
  uniform float u_displaceStrength;

  // High performance hash based value noise
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
      mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x),
      u.y
    );
  }

  // 3 Octaves FBM for optimal performance frame rates (< 4ms frame budget)
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 3; i++) {
      value += amplitude * noise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv * 3.0;
    
    // WebGL normalized mouse coordinates
    vec2 mouseUV = u_mouse.xy / u_resolution.xy;
    vec2 toMouse = uv - mouseUV;
    float dist = length(toMouse);
    
    // Dynamic local fluid displacement fields:
    // 1. Force falloff based on circular proximity radius
    float radius = 0.65;
    float force = smoothstep(radius, 0.0, dist);
    
    // 2. Swirl vortex rotation force (perpendicular translation vectors)
    vec2 swirl = vec2(-toMouse.y, toMouse.x) * force * 1.6 * u_displaceStrength;
    
    // 3. Radial push/part force (parallel displacement translation)
    vec2 push = toMouse * force * 0.6 * u_displaceStrength;
    
    // Apply local forces directly to FBM coordinate space for fluid swirls
    p += swirl + push;

    // Slow-moving fluid domain warping noise
    vec2 q = vec2(
      fbm(p + u_time * 0.05),
      fbm(p + vec2(1.0) + u_time * 0.03)
    );
    
    vec2 r = vec2(
      fbm(p + 2.0 * q + u_time * 0.02),
      fbm(p + 2.0 * q + vec2(5.2, 1.3) + u_time * 0.01)
    );
    
    float f = fbm(p + 3.0 * r);
    
    // Base Navy Background (#08090D) = rgb(8, 9, 13) -> vec3(0.031, 0.035, 0.051)
    vec3 baseColor = vec3(0.031, 0.035, 0.051);
    vec3 color = baseColor;
    
    // Smooth fluid veins
    float fluidMask = smoothstep(0.28, 0.72, f);
    color = mix(color, u_colorFluid, fluidMask * 0.45 * u_intensity);
    
    // Accent highlights
    float accentMask = smoothstep(0.55, 0.8, fbm(p - r * 1.5 + u_time * 0.04));
    color = mix(color, u_colorAccent, accentMask * 0.16 * u_intensity);
    
    // Vignette boundary for spatial contrast
    float vignette = uv.x * (1.0 - uv.x) * uv.y * (1.0 - uv.y);
    vignette = clamp(pow(16.0 * vignette, 0.25), 0.0, 1.0);
    color *= mix(0.4, 1.0, vignette);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// ─── Uniform Configuration and Interpolation States ────────────────────────────
interface UniformState {
  colorFluid: [number, number, number]; // Normalized [R, G, B]
  colorAccent: [number, number, number];
  fluidSpeed: number;
  intensity: number;
  displaceStrength: number;
}

const STATES: Record<string, UniformState> = {
  idle: {
    colorFluid: [0.31, 0.275, 0.898], // Indigo (#4F46E5)
    colorAccent: [0.925, 0.282, 0.6], // Pink (#EC4899)
    fluidSpeed: 0.0006,
    intensity: 0.85,
    displaceStrength: 1.0,
  },
  scanning: {
    colorFluid: [0.31, 0.275, 0.898], // Indigo
    colorAccent: [0.976, 0.451, 0.086], // Vibrant Orange (#F97316)
    fluidSpeed: 0.0016,
    intensity: 1.1,
    displaceStrength: 1.3,
  },
  analyzing: {
    colorFluid: [0.55, 0.2, 0.8], // Tech Purple
    colorAccent: [0.925, 0.282, 0.6], // Fuchsia Pink
    fluidSpeed: 0.0028,
    intensity: 1.3,
    displaceStrength: 1.8,
  },
  complete: {
    colorFluid: [0.078, 0.722, 0.651], // Growth Teal (#14B8A6)
    colorAccent: [0.063, 0.725, 0.506], // Emerald Green (#10B981)
    fluidSpeed: 0.0003,
    intensity: 0.75,
    displaceStrength: 0.6,
  },
};

export function ShaderBackground() {
  const { analysisState } = useAnalysisState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const rafIdRef = useRef<number | null>(null);
  
  const timeRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const currentMouseRef = useRef({ x: 0, y: 0 });
  const mouseNeedsUpdate = useRef(false);

  // Keep track of the active running uniform values for smooth lerp transitions
  const currentUniforms = useRef<UniformState>({
    colorFluid: [0.31, 0.275, 0.898],
    colorAccent: [0.925, 0.282, 0.6],
    fluidSpeed: 0.0006,
    intensity: 0.85,
    displaceStrength: 1.0,
  });

  // Compile helper
  const compileShader = (gl: WebGLRenderingContext, source: string, type: number) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Context initialization
    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    }) || (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

    if (!gl) {
      console.warn("WebGL is unsupported on this system.");
      return;
    }
    glRef.current = gl;

    // 2. Shader Compiling & Program Linking
    const vs = compileShader(gl, VERTEX_SHADER_SOURCE, gl.VERTEX_SHADER);
    const fs = compileShader(gl, FRAGMENT_SHADER_SOURCE, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("WebGL program link verification failure:", gl.getProgramInfoLog(program));
      return;
    }
    programRef.current = program;
    gl.useProgram(program);

    // 3. Quad Geometry Setup (full-screen triangle strip/quad representation)
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // 4. Uniform bindings lookup
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const mouseLocation = gl.getUniformLocation(program, "u_mouse");
    const colorFluidLocation = gl.getUniformLocation(program, "u_colorFluid");
    const colorAccentLocation = gl.getUniformLocation(program, "u_colorAccent");
    const fluidSpeedLocation = gl.getUniformLocation(program, "u_fluidSpeed");
    const intensityLocation = gl.getUniformLocation(program, "u_intensity");
    const displaceStrengthLocation = gl.getUniformLocation(program, "u_displaceStrength");

    // Initialize mouse target coordinates to screen center
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2;
    mouseRef.current = { x: startX, y: startY };
    currentMouseRef.current = { x: startX, y: startY };

    // 5. High Performance Resize Handling using ResizeObserver (caps DPI to 1.5)
    const resizeCanvas = () => {
      if (!canvas || !gl) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const renderWidth = Math.floor(width * dpr);
      const renderHeight = Math.floor(height * dpr);

      if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
        canvas.width = renderWidth;
        canvas.height = renderHeight;
        gl.viewport(0, 0, renderWidth, renderHeight);
      }
    };
    resizeCanvas();

    const parent = canvas.parentElement;
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(resizeCanvas);
    });
    if (parent) ro.observe(parent);

    // Pointer events tracking (Throttled via dirty flag inside render loop)
    const handlePointerMove = (e: PointerEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseNeedsUpdate.current = true;
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    // 6. WebGL Loop using requestAnimationFrame
    const draw = () => {
      if (!gl || !program) return;

      // Determine state-specific transition speed coefficient
      const isFast = analysisState === "scanning" || analysisState === "analyzing";
      const lerpFactor = isFast ? 0.08 : 0.02;

      const target = (STATES[analysisState] || STATES.idle) as UniformState;

      // ─── Smoothly Lerp Uniforms ───
      currentUniforms.current.fluidSpeed += (target.fluidSpeed - currentUniforms.current.fluidSpeed) * lerpFactor;
      currentUniforms.current.intensity += (target.intensity - currentUniforms.current.intensity) * lerpFactor;
      currentUniforms.current.displaceStrength += (target.displaceStrength - currentUniforms.current.displaceStrength) * lerpFactor;

      // ─── Smoothly Lerp Colors ───
      currentUniforms.current.colorFluid[0] += (target.colorFluid[0] - currentUniforms.current.colorFluid[0]) * lerpFactor;
      currentUniforms.current.colorFluid[1] += (target.colorFluid[1] - currentUniforms.current.colorFluid[1]) * lerpFactor;
      currentUniforms.current.colorFluid[2] += (target.colorFluid[2] - currentUniforms.current.colorFluid[2]) * lerpFactor;

      currentUniforms.current.colorAccent[0] += (target.colorAccent[0] - currentUniforms.current.colorAccent[0]) * lerpFactor;
      currentUniforms.current.colorAccent[1] += (target.colorAccent[1] - currentUniforms.current.colorAccent[1]) * lerpFactor;
      currentUniforms.current.colorAccent[2] += (target.colorAccent[2] - currentUniforms.current.colorAccent[2]) * lerpFactor;

      // Increment clock with smoothly lerped speed variable
      timeRef.current += currentUniforms.current.fluidSpeed;

      // Smooth mouse lerping
      const targetMouseX = mouseRef.current.x;
      const targetMouseY = window.innerHeight - mouseRef.current.y; // Flip coordinates for WebGL

      currentMouseRef.current.x += (targetMouseX - currentMouseRef.current.x) * 0.09;
      currentMouseRef.current.y += (targetMouseY - currentMouseRef.current.y) * 0.09;

      // Bind dynamic uniforms
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, timeRef.current);
      gl.uniform2f(mouseLocation, currentMouseRef.current.x, currentMouseRef.current.y);
      
      gl.uniform3f(
        colorFluidLocation, 
        currentUniforms.current.colorFluid[0], 
        currentUniforms.current.colorFluid[1], 
        currentUniforms.current.colorFluid[2]
      );
      gl.uniform3f(
        colorAccentLocation, 
        currentUniforms.current.colorAccent[0], 
        currentUniforms.current.colorAccent[1], 
        currentUniforms.current.colorAccent[2]
      );
      
      gl.uniform1f(fluidSpeedLocation, currentUniforms.current.fluidSpeed);
      gl.uniform1f(intensityLocation, currentUniforms.current.intensity);
      gl.uniform1f(displaceStrengthLocation, currentUniforms.current.displaceStrength);

      // Render Quad
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      rafIdRef.current = requestAnimationFrame(draw);
    };
    
    rafIdRef.current = requestAnimationFrame(draw);

    // Visibility handlers to pause rendering on inactive tabs (saves battery/CPU threads)
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      } else {
        rafIdRef.current = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // 7. Cleanup
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("visibilitychange", handleVisibility);
      ro.disconnect();
      
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      // Explicitly release GPU context and buffers on unmount
      if (glRef.current) {
        const ext = glRef.current.getExtension("WEBGL_lose_context");
        if (ext) {
          ext.loseContext();
        }
        glRef.current = null;
        programRef.current = null;
      }
    };
  }, [analysisState]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none bg-[#08090D]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ transform: "translate3d(0,0,0)", willChange: "transform" }}
        aria-hidden="true"
      />
      
      {/* Soft atmospheric radial center glow to blend fluid veins perfectly */}
      <div 
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 40%, transparent 20%, rgba(8, 9, 13, 0.4) 60%, rgba(8, 9, 13, 0.95) 100%)",
        }}
      />
      
      {/* Low opacity dot grid overlay matching the beautiful design grid limits */}
      <div 
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.65,
        }}
      />
    </div>
  );
}

export default ShaderBackground;
