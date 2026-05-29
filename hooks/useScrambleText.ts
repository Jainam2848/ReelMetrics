import { useState, useEffect, useCallback, useRef } from "react";

interface ScrambleTextOptions {
  text: string;
  duration?: number; // total scramble duration in seconds
  delay?: number; // delay before scramble begins in seconds
  chars?: string;
  triggerKey?: any; // key to re-trigger the scramble
}

export function useScrambleText({
  text,
  duration = 0.8,
  delay = 0,
  chars = "01█▓░▒",
  triggerKey,
}: ScrambleTextOptions) {
  const [displayText, setDisplayText] = useState("");

  const startScramble = useCallback(() => {
    let active = true;
    const startTime = performance.now();
    const delayMs = delay * 1000;
    const durationMs = duration * 1000;
    const charCount = text.length;
    
    let frameId: number;

    const tick = (now: number) => {
      if (!active) return;

      const elapsed = now - startTime;

      // Handle initial delay phase
      if (elapsed < delayMs) {
        // Render invisible spacer characters of matching structure to prevent layout shifting
        let current = "";
        for (let i = 0; i < charCount; i++) {
          current += text[i] === " " ? " " : " ";
        }
        setDisplayText(current);
        frameId = requestAnimationFrame(tick);
        return;
      }

      const scrambleElapsed = elapsed - delayMs;
      let resolvedCount = 0;
      let current = "";

      for (let i = 0; i < charCount; i++) {
        if (text[i] === " ") {
          current += " ";
          resolvedCount++;
          continue;
        }

        // Stagger characters across the durationMs minus the resolve time of ~130ms (8 frames @ 60fps)
        const scrambleTimePerChar = 130; 
        const staggerStart = (i / charCount) * Math.max(0, durationMs - scrambleTimePerChar);
        const charElapsed = scrambleElapsed - staggerStart;

        if (charElapsed < 0) {
          // Hasn't started scrambling yet, keep space placeholder
          current += " ";
        } else if (charElapsed >= scrambleTimePerChar) {
          // Fully resolved to the true character
          current += text[i];
          resolvedCount++;
        } else {
          // Active scramble phase: select a random character from the custom set
          const randomIndex = Math.floor(Math.random() * chars.length);
          current += chars[randomIndex];
        }
      }

      setDisplayText(current);

      if (resolvedCount < charCount && scrambleElapsed < durationMs + 200) {
        frameId = requestAnimationFrame(tick);
      } else {
        setDisplayText(text); // Absolutely ensure full visual resolution
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      active = false;
      cancelAnimationFrame(frameId);
    };
  }, [text, duration, delay, chars]);

  useEffect(() => {
    const cleanup = startScramble();
    return cleanup;
  }, [startScramble, triggerKey]);

  return displayText;
}
