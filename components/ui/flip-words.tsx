"use client";
import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { cn } from "@/lib/utils";

export const FlipWords = ({
  words,
  duration = 3000,
  className,
}: {
  words: string[];
  duration?: number;
  className?: string;
}) => {
  const [currentWord, setCurrentWord] = useState(words[0] || "");
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const startAnimation = useCallback(() => {
    const word = words[words.indexOf(currentWord) + 1] || words[0] || "";
    setCurrentWord(word);
    setIsAnimating(true);
  }, [currentWord, words]);

  useEffect(() => {
    if (!isAnimating) {
      const timer = setTimeout(() => {
        startAnimation();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, duration, startAnimation]);

  return (
    <AnimatePresence
      onExitComplete={() => {
        setIsAnimating(false);
      }}
    >
      <m.div
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 15,
        }}
        exit={{
          opacity: 0,
          y: -40,
          x: 20,
          filter: "blur(8px)",
          scale: 1.2,
          position: "absolute",
        }}
        className={cn(
          "z-10 inline-block relative text-left px-2",
          className
        )}
        key={currentWord}
      >
        {currentWord.split(" ").map((word, wordIndex) => (
          <m.span
            key={word + wordIndex}
            initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              delay: wordIndex * 0.15,
              duration: 0.3,
            }}
            className="inline-block whitespace-nowrap"
          >
            {word.split("").map((letter, letterIndex) => (
              <m.span
                key={word + letterIndex}
                initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  delay: wordIndex * 0.15 + letterIndex * 0.03,
                  duration: 0.25,
                }}
                className="inline-block"
              >
                {letter}
              </m.span>
            ))}
            <span className="inline-block">&nbsp;</span>
          </m.span>
        ))}
      </m.div>
    </AnimatePresence>
  );
};
