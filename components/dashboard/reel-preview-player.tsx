"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Music, 
  Sparkles,
  Smartphone
} from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/shared/toast";

interface ReelPreviewPlayerProps {
  day?: string;
  time?: string;
  contentType?: string;
  topic?: string;
  hookSuggestion?: string;
  audio?: string;
  estEngagement?: string;
  niche?: string;
}

export function ReelPreviewPlayer({
  day = "Monday",
  time = "08:15 AM",
  contentType = "Reel",
  topic = "Interactive Mockup Preview",
  hookSuggestion = "Start with a high-impact pattern disrupt in the first 3 seconds!",
  audio = "Trending Audio Track",
  estEngagement = "High",
  niche = "Tech",
}: ReelPreviewPlayerProps) {
  const toast = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [likes, setLikes] = useState(45200);
  const [comments, setComments] = useState(1820);
  const [shares, setShares] = useState(12400);
  const [saves, setSaves] = useState(32100);
  
  // Track transition scanner state when the timeline topic shifts
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevTopicRef = useRef(topic);

  useEffect(() => {
    if (topic !== prevTopicRef.current) {
      setIsTransitioning(true);
      prevTopicRef.current = topic;
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [topic]);

  // Track floating reactions
  const [floatingHearts, setFloatingHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [floatingSaves, setFloatingSaves] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const floatingIdCounter = useRef(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Background visual particle generation in canvas to mimic modern video/reels
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.clientWidth);
    let height = (canvas.height = canvas.clientHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.clientWidth;
      height = canvas.height = canvas.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particle nodes for abstract visual
    const particleCount = 25;
    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      color: string;
      vx: number;
      vy: number;
      angle: number;
      speed: number;
    }> = [];

    const colors = ["#6C5CE7", "#00B894", "#FF007F", "#F5A623"];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 4 + Math.random() * 24,
        color: colors[Math.floor(Math.random() * colors.length)]!,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        angle: Math.random() * Math.PI * 2,
        speed: 0.01 + Math.random() * 0.03,
      });
    }

    let frame = 0;
    const render = () => {
      frame++;
      ctx.fillStyle = "rgba(10, 10, 18, 0.2)"; // trailing fade for fluid visual
      ctx.fillRect(0, 0, width, height);

      // Gradient background blend
      const timeFactor = frame * 0.003;
      const grad = ctx.createRadialGradient(
        width / 2 + Math.sin(timeFactor) * (width * 0.3),
        height / 2 + Math.cos(timeFactor * 1.5) * (height * 0.3),
        10,
        width / 2,
        height / 2,
        width * 0.8
      );
      grad.addColorStop(0, "rgba(108, 92, 231, 0.15)");
      grad.addColorStop(0.5, "rgba(255, 0, 127, 0.08)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Render & move particles representing strategy telemetry nodes
      particles.forEach((p) => {
        p.x += p.vx * (isPlaying ? 2.5 : 0.8);
        p.y += p.vy * (isPlaying ? 2.5 : 0.8);
        p.angle += p.speed;

        // Oscillate size
        const currentRadius = p.radius + Math.sin(p.angle) * 3;

        // Bounce borders
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Drawing glowing radial particle
        const particleGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentRadius);
        particleGrad.addColorStop(0, p.color);
        particleGrad.addColorStop(0.3, p.color + "99"); // transparent glow
        particleGrad.addColorStop(1, "rgba(0,0,0,0)");
        
        ctx.beginPath();
        ctx.fillStyle = particleGrad;
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Overlay strategic connecting lines to symbolize high engagement indices
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i]!.x - particles[j]!.x;
          const dy = particles[i]!.y - particles[j]!.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i]!.x, particles[i]!.y);
            ctx.lineTo(particles[j]!.x, particles[j]!.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isPlaying]);

  // Handle play interval and progress timeline (simulates 10 seconds of high-retention reel output)
  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            // Loop and auto reset
            return 0;
          }
          return prev + 1;
        });
      }, 100);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      togglePlay();
    }
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLikes((prev) => prev + 1);
    
    // Add floating heart bubble
    const id = floatingIdCounter.current++;
    setFloatingHearts((prev) => [
      ...prev,
      { id, x: Math.random() * 40 - 20, y: -20 },
    ]);

    // Clean up heart after animation ends
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1200);
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaves((prev) => prev + 1);

    // Add floating save bookmark
    const id = floatingIdCounter.current++;
    setFloatingSaves((prev) => [
      ...prev,
      { id, x: Math.random() * 40 - 20, y: -20 },
    ]);

    setTimeout(() => {
      setFloatingSaves((prev) => prev.filter((s) => s.id !== id));
    }, 1200);
  };

  // Split captions word by word to highlight hook retention triggers
  const words = hookSuggestion.split(" ");
  const currentWordIndex = Math.floor((progress / 100) * words.length);

  return (
    <div className="flex flex-col items-center select-none w-full relative">
      {/* Dynamic 3D/CSS glow backplate */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-[500px] bg-brand-primary/10 rounded-3xl blur-3xl -z-10" />

      {/* Phone Case Mockup */}
      <div className="w-full max-w-[280px] h-[520px] rounded-[38px] border-4 border-white/10 bg-[#0c0c12] p-2.5 shadow-2xl relative overflow-hidden flex flex-col justify-between group/phone transition-all duration-500 hover:border-brand-primary/30">
        
        {/* Dynamic Island Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 rounded-full bg-black z-30 flex items-center justify-between px-3 select-none">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500/80 animate-pulse" />
          <div className="w-8 h-1 rounded-full bg-white/10" />
        </div>

        {/* Status Bar Mockup */}
        <div className="absolute top-8 left-0 right-0 px-6 flex justify-between items-center text-[9px] text-white/50 font-bold z-30 pointer-events-none">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <span>5G</span>
            <div className="w-3.5 h-2 rounded-sm border border-white/30 p-0.5 flex items-center justify-start">
              <div className="w-1.5 h-full bg-white/60 rounded-[1px]" />
            </div>
          </div>
        </div>

        {/* Active Visual WebGL/Canvas Video Container */}
        <div 
          onClick={togglePlay}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-label={isPlaying ? "Pause Simulated Reel Preview" : "Play Simulated Reel Preview"}
          className="absolute inset-0 w-full h-full cursor-pointer z-10 overflow-hidden rounded-[28px] focus:outline-none focus:ring-2 focus:ring-brand-primary/80"
        >
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Screen transition scanner sweep laser line */}
          <AnimatePresence>
            {isTransitioning && (
              <m.div
                initial={{ top: "-5%", opacity: 0.9 }}
                animate={{ top: "105%", opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute left-0 right-0 h-3 bg-gradient-to-b from-transparent via-brand-primary to-transparent z-25 pointer-events-none shadow-[0_0_12px_#6C5CE7]"
              />
            )}
          </AnimatePresence>

          {/* Frosted Play Overlay when Paused */}
          <AnimatePresence>
            {!isPlaying && (
              <m.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-20"
              >
                <m.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-glow-sm"
                >
                  <Play className="w-6 h-6 fill-white ml-1 text-white" />
                </m.div>
              </m.div>
            )}
          </AnimatePresence>

          {/* Dynamic Interactive Telemetry Metrics (Right side panel inside phone) */}
          <div className="absolute right-3.5 bottom-24 z-20 flex flex-col gap-5 items-center select-none">
            {/* LIKES Button */}
            <div className="relative">
              <button
                onClick={handleLikeClick}
                aria-label="Like simulated reel"
                className="w-10 h-10 rounded-full bg-black/40 border border-white/10 backdrop-blur-md flex items-center justify-center text-white hover:text-brand-accent hover:border-brand-accent/50 transition-all active:scale-90"
              >
                <Heart className="w-5 h-5 fill-current text-white/90 hover:text-brand-accent" />
              </button>
              <span className="text-[8px] font-bold text-white/80 block text-center mt-1">
                {(likes / 1000).toFixed(1)}k
              </span>
              
              {/* Floating Heart bubble elements */}
              <AnimatePresence>
                {floatingHearts.map((heart) => (
                  <m.div
                    key={heart.id}
                    initial={{ opacity: 1, scale: 0.8, y: 0, x: heart.x }}
                    animate={{ opacity: 0, scale: 1.4, y: -80, x: heart.x + Math.sin(heart.y / 10) * 15 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute top-0 left-3 pointer-events-none text-brand-accent drop-shadow-[0_0_8px_rgba(255,0,127,0.8)] z-30"
                  >
                    ❤️
                  </m.div>
                ))}
              </AnimatePresence>
            </div>

            {/* COMMENTS */}
            <div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setComments(prev => prev + 1);
                  toast.info("Mockup comment sync simulated!");
                }}
                aria-label="Comment on simulated reel"
                className="w-10 h-10 rounded-full bg-black/40 border border-white/10 backdrop-blur-md flex items-center justify-center text-white/90 hover:border-brand-primary/50 transition-all active:scale-90"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              <span className="text-[8px] font-bold text-white/80 block text-center mt-1">
                {(comments / 1000).toFixed(1)}k
              </span>
            </div>

            {/* SHARES */}
            <div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShares(prev => prev + 1);
                }}
                aria-label="Share simulated reel"
                className="w-10 h-10 rounded-full bg-black/40 border border-white/10 backdrop-blur-md flex items-center justify-center text-white/90 hover:border-brand-secondary/50 transition-all active:scale-90"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <span className="text-[8px] font-bold text-white/80 block text-center mt-1">
                {(shares / 1000).toFixed(1)}k
              </span>
            </div>

            {/* SAVES / BOOKMARKS */}
            <div className="relative">
              <button
                onClick={handleSaveClick}
                aria-label="Save simulated reel to bookmarks"
                className="w-10 h-10 rounded-full bg-black/40 border border-white/10 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-yellow-400 hover:border-yellow-400/50 transition-all active:scale-90"
              >
                <Bookmark className="w-5 h-5 fill-current text-white/90 hover:text-yellow-400" />
              </button>
              <span className="text-[8px] font-bold text-white/80 block text-center mt-1">
                {(saves / 1000).toFixed(1)}k
              </span>

              {/* Floating Save element bubbles */}
              <AnimatePresence>
                {floatingSaves.map((save) => (
                  <m.div
                    key={save.id}
                    initial={{ opacity: 1, scale: 0.8, y: 0, x: save.x }}
                    animate={{ opacity: 0, scale: 1.3, y: -70, x: save.x }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute top-0 left-3 pointer-events-none text-yellow-400 drop-shadow-[0_0_8px_rgba(245,166,35,0.8)] z-30"
                  >
                    ⭐
                  </m.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Glowing Animated Caption (CapCut Karaoke Style) */}
          <div className="absolute left-4 right-16 bottom-7 z-20 flex flex-col gap-2.5 pointer-events-none">
            {/* Title / Topic Card */}
            <div className="px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 backdrop-blur-sm">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-brand-primary/30 border border-brand-primary/40 text-[7px] font-black uppercase text-brand-primary tracking-wider mb-1">
                <Sparkles className="w-2 h-2" />
                {contentType} Blueprint
              </span>
              <p className="text-[10px] text-white font-extrabold line-clamp-2 uppercase tracking-wide leading-tight">
                {topic}
              </p>
            </div>

            {/* Kinetic Caption (typing hook line word by word based on progress timeline) */}
            <div className="min-h-[46px] select-text">
              <p className="text-xs text-white leading-normal font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] flex flex-wrap gap-x-1.5 gap-y-0.5">
                {words.map((word, idx) => {
                  const isActive = isPlaying && idx === currentWordIndex;
                  const isCompleted = isPlaying && idx < currentWordIndex;
                  return (
                    <m.span
                      key={idx}
                      animate={
                        isActive 
                          ? { scale: 1.15, color: "#FFEAA7", textShadow: "0 0 10px rgba(245,166,35,0.8)" } 
                          : isCompleted
                          ? { scale: 1.0, color: "#FFFFFF", textShadow: "none" }
                          : { scale: 1.0, color: "rgba(255,255,255,0.4)", textShadow: "none" }
                      }
                      transition={{ duration: 0.15 }}
                      className="origin-left inline-block"
                    >
                      {word}
                    </m.span>
                  );
                })}
              </p>
            </div>

            {/* Sound Choice Ticker at the bottom */}
            <div className="flex items-center justify-between gap-1.5 overflow-hidden w-full text-[8px] text-white/70 font-semibold select-none bg-black/30 p-1 rounded border border-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-1 overflow-hidden flex-grow">
                <Music className="w-3.5 h-3.5 text-brand-accent shrink-0 animate-spin" style={{ animationDuration: "5s" }} />
                <div className="relative w-full overflow-hidden h-3">
                  <m.div 
                    animate={isPlaying ? { x: ["0%", "-50%"] } : { x: "0%" }}
                    transition={{ duration: 6, ease: "linear", repeat: Infinity }}
                    className="absolute left-0 top-0 flex gap-4 whitespace-nowrap"
                  >
                    <span>{audio} • AI Recommend Soundtrack</span>
                    <span>{audio} • AI Recommend Soundtrack</span>
                  </m.div>
                </div>
              </div>

              {/* Bouncing neon HSL audio equalizer wave visualizer */}
              <div className="flex items-end gap-[2px] h-3 shrink-0 w-4 pl-1 border-l border-white/10 select-none">
                {[1.6, 0.9, 1.8, 1.1].map((duration, i) => (
                  <m.div
                    key={i}
                    animate={
                      isPlaying
                        ? { height: ["15%", "100%", "15%"] }
                        : { height: "15%" }
                    }
                    transition={{
                      duration,
                      ease: "easeInOut",
                      repeat: Infinity,
                    }}
                    className={`w-[1.5px] rounded-full ${
                      i % 2 === 0 ? "bg-brand-accent" : "bg-brand-secondary"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Loop Timeline Video Progress Bar */}
          <div className="absolute bottom-1.5 left-3 right-3 z-30 h-1 rounded-full bg-white/10 overflow-hidden">
            <div 
              className="h-full bg-brand-primary shadow-glow transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Dynamic bottom swipe action mockup indicator */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full bg-white/20 z-30 select-none" />
      </div>

      {/* Mini Help Info Tag */}
      <div className="mt-4 text-center select-none max-w-[240px]">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-brand-accent/20 text-brand-accent border border-brand-accent/30 tracking-wider">
          {isPlaying ? "⚡ Playing Live Video Preview" : "⏹ Paused Preview Mockup"}
        </span>
        <p className="text-[10px] text-muted-foreground mt-1.5 leading-normal">
          Click the phone screen to loop an interactive high-retention reel preview aligned with active timeline metrics.
        </p>
      </div>
    </div>
  );
}
