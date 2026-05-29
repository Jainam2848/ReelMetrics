"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGridDistortion } from "@/lib/contexts/GridDistortionContext";
import { useAnalysisState } from "@/lib/contexts/AnalysisStateContext";

const isMobile =
  typeof window !== "undefined"
    ? window.matchMedia("(pointer: coarse)").matches
    : false;

const prefersReducedMotion =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

function detectWebGLTier(): 1 | 2 | 3 {
  if (isMobile || prefersReducedMotion) return 3;

  const canUseWebGL = (() => {
    try {
      const canvas = document.createElement("canvas");
      return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
    } catch {
      return false;
    }
  })();

  if (!canUseWebGL) return 3;

  const isHighPerf =
    typeof navigator !== "undefined" &&
    navigator.hardwareConcurrency >= 4 &&
    window.devicePixelRatio <= 2;

  return isHighPerf ? 1 : 2;
}

const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;

  uniform float u_time;
  uniform vec2  u_mouse;
  uniform float u_strength;
  uniform float u_speed;
  uniform vec2  u_resolution;
  varying vec2  v_texCoord;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = rot * p * 2.05 + 17.13;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = v_texCoord;
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 p = (uv - 0.5) * aspect;
    vec2 mouse = (u_mouse - 0.5) * aspect;

    float t = u_time * u_speed;
    float d = length(p - mouse);
    float hover = 1.0 - smoothstep(0.0, 0.52, d);
    float hoverCore = 1.0 - smoothstep(0.0, 0.18, d);

    vec2 dir = normalize((p - mouse) + vec2(0.001));
    vec2 tangent = vec2(-dir.y, dir.x);
    vec2 hoverFlow = (tangent * 0.22 - dir * 0.12) * hover * u_strength;

    vec2 flow = p;
    flow += hoverFlow;
    flow += vec2(
      fbm(p * 1.8 + vec2(t * 0.16, -t * 0.11)),
      fbm(p * 1.8 + vec2(-t * 0.13, t * 0.17))
    ) * 0.32;

    float cloudA = fbm(flow * 2.25 + vec2(t * 0.22, -t * 0.18));
    float cloudB = fbm(flow * 4.1 - vec2(t * 0.13, t * 0.20));
    float cloudC = fbm(flow * 7.5 + vec2(-t * 0.08, t * 0.10));
    float field = cloudA * 0.58 + cloudB * 0.30 + cloudC * 0.12;

    float filament = smoothstep(0.46, 0.76, field);
    filament *= 0.45 + 0.55 * fbm(flow * 9.0 + t * 0.08);

    vec3 bg = vec3(0.031, 0.035, 0.051);
    vec3 indigo = vec3(0.31, 0.27, 0.898);
    vec3 teal = vec3(0.08, 0.72, 0.65);
    vec3 violet = vec3(0.62, 0.24, 0.95);

    vec3 color = bg;
    color += mix(indigo, teal, field) * filament * 0.32;
    color += mix(violet, teal, cloudB) * hover * 0.36;
    color += teal * hoverCore * 0.18;
    color += indigo * pow(max(0.0, 1.0 - length(p - vec2(0.42, 0.34)) * 1.2), 3.0) * 0.12;
    color += teal * pow(max(0.0, 1.0 - length(p - vec2(-0.48, -0.38)) * 1.35), 3.0) * 0.10;

    float grain = noise(uv * u_resolution.xy * 0.7 + t * 18.0) - 0.5;
    color += grain * 0.018;

    float vignette = 1.0 - smoothstep(0.25, 0.92, length((uv - 0.5) * vec2(1.35, 1.0)));
    color *= mix(0.34, 1.0, vignette);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  src: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, src);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vert = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const frag = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vert || !frag) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);

  gl.deleteShader(vert);
  gl.deleteShader(frag);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function CSSFallbackBackground({ analysisState }: { analysisState: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useRef(0.5);
  const mouseY = useRef(0.5);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (isMobile || prefersReducedMotion) return;

    const handlePointerMove = (e: PointerEvent) => {
      mouseX.current = e.clientX / window.innerWidth;
      mouseY.current = e.clientY / window.innerHeight;
    };

    const tick = () => {
      if (containerRef.current) {
        containerRef.current.style.setProperty("--mouse-x", `${mouseX.current * 100}%`);
        containerRef.current.style.setProperty("--mouse-y", `${mouseY.current * 100}%`);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const primaryOrb =
    analysisState === "complete"
      ? "rgba(16,185,129,0.12)"
      : "rgba(79,70,229,0.13)";

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none"
      style={
        {
          background: "#08090D",
          "--mouse-x": "50%",
          "--mouse-y": "50%",
        } as React.CSSProperties
      }
    >
      <div
        className="absolute inset-[-18%] opacity-90"
        style={{
          background:
            "radial-gradient(circle 440px at var(--mouse-x) var(--mouse-y), rgba(20,184,166,0.20), rgba(79,70,229,0.13) 34%, transparent 70%), radial-gradient(circle at 82% 8%, rgba(79,70,229,0.14), transparent 34%), radial-gradient(circle at 5% 92%, rgba(20,184,166,0.12), transparent 34%), linear-gradient(135deg, rgba(79,70,229,0.08), transparent 42%, rgba(20,184,166,0.07))",
          filter: "blur(22px)",
          transform: "translate3d(0, 0, 0)",
        }}
      />
      <div
        className="absolute inset-0 opacity-55"
        style={{
          background:
            "radial-gradient(ellipse 80% 62% at 50% 42%, transparent 35%, rgba(8,9,13,0.72) 78%, rgba(8,9,13,1) 100%)",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 680,
          height: 680,
          top: -150,
          right: -150,
          background: `radial-gradient(circle, ${primaryOrb} 0%, rgba(79,70,229,0.04) 42%, transparent 72%)`,
          filter: "blur(90px)",
          animation: prefersReducedMotion ? "none" : "orb-breathe 12s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 520,
          height: 520,
          bottom: -120,
          left: -90,
          background:
            "radial-gradient(circle, rgba(20,184,166,0.11) 0%, rgba(20,184,166,0.035) 45%, transparent 74%)",
          filter: "blur(86px)",
          animation: prefersReducedMotion ? "none" : "orb-breathe 16s ease-in-out infinite reverse",
        }}
      />
    </div>
  );
}

interface WebGLTierProps {
  tier: 1 | 2;
  analysisState: string;
}

function WebGLFluidBackground({ tier, analysisState }: WebGLTierProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { normalizedX, normalizedY } = useGridDistortion();
  const [useFallback, setUseFallback] = useState(false);

  const rafRef = useRef<number>(0);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const startTimeRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 });
  const mouseNeedsUpdate = useRef(false);
  const currentStrengthRef = useRef(0.36);
  const strengthAnimRef = useRef<number | null>(null);

  const params = useMemo(
    () => (tier === 1 ? { speed: 0.72 } : { speed: 0.5 }),
    [tier]
  );

  useEffect(() => {
    const target =
      analysisState === "analyzing" ? 0.68 : analysisState === "complete" ? 0.42 : 0.52;

    if (strengthAnimRef.current) cancelAnimationFrame(strengthAnimRef.current);

    const start = performance.now();
    const from = currentStrengthRef.current;
    const duration = analysisState === "analyzing" ? 380 : 950;

    const animateStrength = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      currentStrengthRef.current = from + (target - from) * eased;
      if (progress < 1) {
        strengthAnimRef.current = requestAnimationFrame(animateStrength);
      }
    };

    strengthAnimRef.current = requestAnimationFrame(animateStrength);

    return () => {
      if (strengthAnimRef.current) cancelAnimationFrame(strengthAnimRef.current);
    };
  }, [analysisState]);

  useEffect(() => {
    const magneticEls = document.querySelectorAll("[data-magnetic]");

    const boost = () => {
      if (strengthAnimRef.current) cancelAnimationFrame(strengthAnimRef.current);
      const from = currentStrengthRef.current;
      const start = performance.now();
      const animate = (now: number) => {
        const progress = Math.min((now - start) / 280, 1);
        currentStrengthRef.current = from + (0.9 - from) * progress;
        if (progress < 1) strengthAnimRef.current = requestAnimationFrame(animate);
      };
      strengthAnimRef.current = requestAnimationFrame(animate);
    };

    const relax = () => {
      if (strengthAnimRef.current) cancelAnimationFrame(strengthAnimRef.current);
      const base =
        analysisState === "analyzing" ? 0.68 : analysisState === "complete" ? 0.42 : 0.52;
      const from = currentStrengthRef.current;
      const start = performance.now();
      const animate = (now: number) => {
        const progress = Math.min((now - start) / 800, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        currentStrengthRef.current = from + (base - from) * eased;
        if (progress < 1) strengthAnimRef.current = requestAnimationFrame(animate);
      };
      strengthAnimRef.current = requestAnimationFrame(animate);
    };

    magneticEls.forEach((el) => {
      el.addEventListener("mouseenter", boost);
      el.addEventListener("mouseleave", relax);
    });

    return () => {
      magneticEls.forEach((el) => {
        el.removeEventListener("mouseenter", boost);
        el.removeEventListener("mouseleave", relax);
      });
    };
  }, [analysisState]);

  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!gl) return false;

    const program = createProgram(gl);
    if (!program) return false;

    gl.useProgram(program);

    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const texBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuf);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    const texLoc = gl.getAttribLocation(program, "a_texCoord");
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

    glRef.current = gl;
    programRef.current = program;
    return true;
  }, []);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const gl = glRef.current;
    if (!canvas || !gl) return;

    const dpr = Math.min(window.devicePixelRatio, 1.5);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    if (isMobile || prefersReducedMotion || useFallback) return;

    const ok = initWebGL();
    if (!ok) {
      requestAnimationFrame(() => setUseFallback(true));
      return;
    }

    startTimeRef.current = performance.now();
    handleResize();

    const parent = canvasRef.current?.parentElement;
    const canvasForCleanup = canvasRef.current;
    const ro = new ResizeObserver(() => requestAnimationFrame(handleResize));
    if (parent) ro.observe(parent);

    const onPointerMove = (e: PointerEvent) => {
      targetMouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: 1 - e.clientY / window.innerHeight,
      };
      mouseNeedsUpdate.current = true;
      normalizedX.set(e.clientX / window.innerWidth);
      normalizedY.set(e.clientY / window.innerHeight);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const renderLoop = () => {
      const gl = glRef.current;
      const program = programRef.current;
      const canvas = canvasRef.current;
      if (!gl || !program || !canvas) return;

      const lerp = mouseNeedsUpdate.current ? 0.11 : 0.045;
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * lerp;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * lerp;
      mouseNeedsUpdate.current = false;

      const elapsed = (performance.now() - startTimeRef.current) / 1000;

      gl.uniform1f(gl.getUniformLocation(program, "u_time"), elapsed);
      gl.uniform2f(gl.getUniformLocation(program, "u_mouse"), mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(gl.getUniformLocation(program, "u_strength"), currentStrengthRef.current);
      gl.uniform1f(gl.getUniformLocation(program, "u_speed"), params.speed);
      gl.uniform2f(gl.getUniformLocation(program, "u_resolution"), canvas.width, canvas.height);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(renderLoop);
    };

    rafRef.current = requestAnimationFrame(renderLoop);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        cancelAnimationFrame(rafRef.current);
      } else {
        rafRef.current = requestAnimationFrame(renderLoop);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (strengthAnimRef.current) cancelAnimationFrame(strengthAnimRef.current);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();

      const gl = glRef.current;
      if (gl && programRef.current) {
        gl.deleteProgram(programRef.current);
      }
      glRef.current = null;
      programRef.current = null;

      if (canvasForCleanup) {
        canvasForCleanup.style.willChange = "auto";
      }
    };
  }, [handleResize, initWebGL, normalizedX, normalizedY, params.speed, useFallback]);

  const orbColor =
    analysisState === "complete" ? "rgba(16,185,129,0.10)" : "rgba(79,70,229,0.10)";
  const orbAnimDuration = analysisState === "analyzing" ? "4s" : "12s";

  if (useFallback) {
    return <CSSFallbackBackground analysisState={analysisState} />;
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none bg-[#08090D]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ willChange: "transform" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 82% 70% at 50% 48%, transparent 36%, rgba(8,9,13,0.66) 76%, rgba(8,9,13,0.96) 100%)",
        }}
      />
      <div
        className="absolute z-[1] rounded-full pointer-events-none"
        style={{
          width: 720,
          height: 720,
          top: -170,
          right: -180,
          background: `radial-gradient(circle, ${orbColor} 0%, rgba(79,70,229,0.045) 42%, transparent 72%)`,
          filter: "blur(94px)",
          animation: `orb-breathe ${orbAnimDuration} ease-in-out infinite`,
          transition: "background 1.5s ease",
        }}
      />
      <div
        className="absolute z-[1] rounded-full pointer-events-none"
        style={{
          width: 560,
          height: 560,
          bottom: -130,
          left: -110,
          background:
            "radial-gradient(circle, rgba(20,184,166,0.10) 0%, rgba(20,184,166,0.035) 44%, transparent 74%)",
          filter: "blur(88px)",
          animation: "orb-breathe 16s ease-in-out infinite reverse",
        }}
      />
    </div>
  );
}

export default function GridDistortionBackground() {
  const { analysisState } = useAnalysisState();
  const [tier] = useState<1 | 2 | 3>(() => detectWebGLTier());

  if (tier === 3) {
    return <CSSFallbackBackground analysisState={analysisState} />;
  }

  return <WebGLFluidBackground tier={tier} analysisState={analysisState} />;
}
