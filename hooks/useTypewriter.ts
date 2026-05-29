import { useState, useEffect } from "react";

/**
 * A lightweight hook that generates a typewriter typing effect for a given string.
 * Resets and runs whenever the text input changes.
 *
 * @param text The complete target string to type out.
 * @param speed The typing speed in milliseconds per character (default 30ms).
 */
export function useTypewriter(text: string, speed: number = 30) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText("");
    if (!text) return;

    let currentIndex = 0;
    let accumulatedText = "";

    const timer = setInterval(() => {
      if (currentIndex < text.length) {
        accumulatedText += text.charAt(currentIndex);
        setDisplayedText(accumulatedText);
        currentIndex++;
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return displayedText;
}
