import React, { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type ConfettiLevel = "medium" | "hard";

type Piece = {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
};

export function ConfettiOverlay({
  level,
  onDone,
}: {
  level: ConfettiLevel;
  onDone?: () => void;
}) {
  const pieces = useMemo<Piece[]>(() => {
    const count = level === "hard" ? 120 : 70;
    const colors =
      level === "hard"
        ? ["#f97373", "#38bdf8", "#fbbf24", "#a855f7", "#22c55e"]
        : ["#38bdf8", "#a855f7", "#22c55e", "#fbbf24"];
    const arr: Piece[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.8 + Math.random() * 0.8,
        size: 6 + Math.random() * 6,
        color: colors[i % colors.length],
      });
    }
    return arr;
  }, [level]);

  useEffect(() => {
    if (!onDone) return;
    const t = window.setTimeout(onDone, 2600);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <AnimatePresence>
      <motion.div
        className="pointer-events-none fixed inset-0 z-[80]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {pieces.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-[2px]"
            style={{
              width: p.size,
              height: p.size * 2,
              left: `${p.x}%`,
              top: "-40px",
              backgroundColor: p.color,
            }}
            initial={{ y: -40, rotate: 0, opacity: 0 }}
            animate={{ y: "110vh", rotate: 360, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: "easeOut",
            }}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

