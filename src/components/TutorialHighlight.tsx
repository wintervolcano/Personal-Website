import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "../lib/motion";

interface TutorialHighlightProps {
  targetSelector?: string; // CSS selector for element to highlight
  position?: { x: number; y: number }; // Absolute position in pixels
  show: boolean;
  delay?: number; // ms before showing (default 0)
  type?: "pulse" | "marker" | "arrow" | "box"; // Visual style
  size?: { width: number; height: number }; // Size for box type
}

export default function TutorialHighlight({
  targetSelector,
  position,
  show,
  delay = 0,
  type = "marker",
  size,
}: TutorialHighlightProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isVisible, setIsVisible] = useState(false);
  const [elementPosition, setElementPosition] = useState<{ x: number; y: number } | null>(null);
  const [elementSize, setElementSize] = useState<{ width: number; height: number } | null>(null);

  // Handle delay
  useEffect(() => {
    if (!show) {
      setIsVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [show, delay]);

  // Find element position if targetSelector is provided
  useEffect(() => {
    if (!targetSelector || !isVisible) return;

    const updatePosition = () => {
      const element = document.querySelector(targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setElementPosition({
          x: rect.left + rect.width / 2 + window.scrollX,
          y: rect.top + rect.height / 2 + window.scrollY,
        });
        setElementSize({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [targetSelector, isVisible]);

  // Determine final position
  let finalPosition = targetSelector ? elementPosition : position;

  // Add bounds checking for marker type to prevent overflow
  if (finalPosition && type === "marker") {
    const markerSize = 300; // 300x300px marker for larger search area
    const padding = markerSize / 2 + 20; // Half marker size + extra padding

    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const documentHeight = typeof document !== 'undefined' ? document.documentElement.scrollHeight : 1000;

    finalPosition = {
      x: Math.max(padding, Math.min(viewportWidth - padding, finalPosition.x)),
      y: Math.max(padding, Math.min(documentHeight - padding, finalPosition.y)),
    };
  }

  if (!isVisible || !finalPosition) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
          className="absolute pointer-events-none z-[100]"
          style={{
            left: finalPosition.x,
            top: finalPosition.y,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Marker style - large square area with "Try here" text */}
          {type === "marker" && (
            <div className="flex flex-col items-center gap-3">
              {/* Large pulsing square area */}
              <div className="relative">
                {/* Outer pulsing border */}
                <motion.div
                  className="absolute inset-0"
                  animate={
                    prefersReducedMotion
                      ? {}
                      : {
                          scale: [1, 1.1, 1],
                          opacity: [0.6, 0.3, 0.6],
                        }
                  }
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="w-[300px] h-[300px] rounded-xl border-4 border-yellow-400 bg-yellow-400/10 shadow-[0_0_30px_rgba(250,204,21,0.4)]" />
                </motion.div>

                {/* Inner square */}
                <div className="relative w-[300px] h-[300px] rounded-xl border-4 border-yellow-400/80 bg-yellow-400/5 backdrop-blur-sm" />
              </div>

              {/* "Try here" text */}
              <div className="rounded-full bg-black/90 text-white text-xs px-4 py-2 tracking-[0.16em] uppercase font-semibold shadow-lg">
                Search in this area
              </div>
            </div>
          )}

          {/* Pulse style - subtle highlight around element */}
          {type === "pulse" && (
            <motion.div
              className="w-12 h-12 rounded-full border-4 border-yellow-400"
              animate={
                prefersReducedMotion
                  ? {}
                  : {
                      scale: [1, 1.2, 1],
                      opacity: [0.8, 0.4, 0.8],
                    }
              }
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}

          {/* Arrow style - pointing arrow */}
          {type === "arrow" && (
            <motion.div
              className="flex flex-col items-center"
              animate={
                prefersReducedMotion
                  ? {}
                  : {
                      y: [0, -10, 0],
                    }
              }
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Arrow pointer */}
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                className="text-yellow-400 drop-shadow-lg"
              >
                <path
                  d="M20 5 L20 30 M20 30 L15 25 M20 30 L25 25"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
              {/* Text hint */}
              <span className="mt-2 text-xs font-semibold text-yellow-400 bg-black/80 px-2 py-1 rounded whitespace-nowrap">
                Click here
              </span>
            </motion.div>
          )}

          {/* Box style - border outline around element */}
          {type === "box" && (
            <motion.div
              className="border-4 border-yellow-400 rounded-lg shadow-[0_0_20px_rgba(250,204,21,0.6)]"
              style={{
                width: size?.width || elementSize?.width || 100,
                height: size?.height || elementSize?.height || 100,
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
              animate={
                prefersReducedMotion
                  ? {}
                  : {
                      opacity: [0.6, 1, 0.6],
                    }
              }
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
