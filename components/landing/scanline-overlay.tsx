import React from "react";

export function ScanlineOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <div 
        className="w-full h-[1px] bg-white/5 opacity-0"
        style={{
          animation: "scanline 3s ease-in-out forwards"
        }}
      />
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scanline {
          0% {
            transform: translateY(-10px);
            opacity: 0;
          }
          10% {
            opacity: 1;
            box-shadow: 0 0 8px 1px rgba(255,255,255,0.1);
          }
          90% {
            opacity: 1;
            box-shadow: 0 0 8px 1px rgba(255,255,255,0.1);
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }
      `}} />
    </div>
  );
}
