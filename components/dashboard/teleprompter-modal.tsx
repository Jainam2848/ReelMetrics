"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Play, Pause, RotateCcw, Type, Gauge } from "lucide-react";

interface TeleprompterModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  spokenScript: string;
}

export function TeleprompterModal({
  isOpen,
  onClose,
  title,
  spokenScript,
}: TeleprompterModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(3); // 1 to 10
  const [fontSize, setFontSize] = useState("text-3xl"); // text-xl, text-2xl, text-3xl, text-4xl, text-5xl
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Reset scroll when opened or script changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsPlaying((playing) => (playing ? false : playing));
  }, [isOpen, spokenScript]);

  // RequestAnimationFrame loop for butter-smooth scrolling
  useEffect(() => {
    const scroll = (time: number) => {
      if (lastTimeRef.current !== null && isPlaying && scrollContainerRef.current) {
        const delta = time - lastTimeRef.current;
        // Scroll speed: pixels per millisecond based on selected speed
        const pixelsPerMs = (speed * 0.015);
        scrollContainerRef.current.scrollTop += delta * pixelsPerMs;

        // Automatically pause when reached the bottom
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 2) {
          setIsPlaying(false);
        }
      }
      lastTimeRef.current = time;
      if (isPlaying) {
        requestRef.current = requestAnimationFrame(scroll);
      }
    };

    if (isPlaying) {
      lastTimeRef.current = null; // Reset time reference on start
      requestRef.current = requestAnimationFrame(scroll);
    } else if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
    }

    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, speed]);

  if (!isOpen) return null;

  const handleReset = () => {
    setIsPlaying(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  const fontSizes = [
    { label: "S", value: "text-xl" },
    { label: "M", value: "text-2xl" },
    { label: "L", value: "text-3xl" },
    { label: "XL", value: "text-4xl" },
    { label: "XXL", value: "text-5xl" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-4xl h-[85vh] bg-[#0E0F14] border border-[#212330] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#212330] bg-[#12131A]">
          <div>
            <h3 className="font-semibold text-white text-lg">Teleprompter Mode</h3>
            <p className="text-xs text-[#82889E] mt-0.5">{title}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-[#82889E] hover:text-white rounded-lg hover:bg-[#212330] transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Highlight Zone Guides (Overlay reading line) */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-20 border-y border-[#CCF381]/30 bg-[#CCF381]/5 pointer-events-none z-10 flex items-center justify-between px-4">
          <span className="text-[10px] uppercase tracking-wider text-[#CCF381]/70 font-semibold select-none">Reading Zone</span>
          <span className="text-[10px] uppercase tracking-wider text-[#CCF381]/70 font-semibold select-none">Reading Zone</span>
        </div>

        {/* Script Scroll Area */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-12 py-[40vh] scroll-smooth text-center select-none"
          style={{ scrollbarWidth: "none" }}
        >
          <div className={`max-w-2xl mx-auto leading-relaxed font-bold tracking-wide text-white/90 ${fontSize} transition-all duration-200`}>
            {spokenScript}
          </div>
        </div>

        {/* Toolbar / Controls */}
        <div className="px-6 py-5 border-t border-[#212330] bg-[#12131A] flex flex-col md:flex-row items-center justify-between gap-4 z-20">
          
          {/* Font Controls */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1B1D28] rounded-lg text-[#82889E]">
              <Type size={16} />
            </div>
            <div className="flex bg-[#1B1D28] p-1 rounded-lg border border-[#2B2E40]">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => setFontSize(size.value)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition ${
                    fontSize === size.value 
                      ? "bg-[#CCF381] text-[#08090D]" 
                      : "text-[#82889E] hover:text-white"
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="p-3 bg-[#1B1D28] text-[#82889E] hover:text-white rounded-full border border-[#2B2E40] transition"
              title="Reset to Top"
            >
              <RotateCcw size={20} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-5 rounded-full shadow-lg transition transform hover:scale-105 active:scale-95 ${
                isPlaying 
                  ? "bg-red-500 text-white hover:bg-red-600" 
                  : "bg-[#CCF381] text-[#08090D] hover:bg-[#bce66c]"
              }`}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>
          </div>

          {/* Speed Controls */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="p-2 bg-[#1B1D28] rounded-lg text-[#82889E]">
              <Gauge size={16} />
            </div>
            <div className="flex-1 md:flex-initial flex items-center gap-3 min-w-[200px]">
              <input
                type="range"
                min="1"
                max="10"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full accent-[#CCF381] h-1 bg-[#2B2E40] rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs font-mono text-[#82889E] w-12 text-right">
                Speed {speed}
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
