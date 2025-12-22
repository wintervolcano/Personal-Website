import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "../lib/cn";

export type Theme = "light" | "dark";

export function ThemeToggle({
  theme,
  setTheme,
  isMobile = false,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
  isMobile?: boolean;
}) {
  const isDark = theme === "dark";
  const label = isMobile
    ? isDark
      ? "Dark Mode"
      : "Light Mode"
    : isDark
      ? "Search Mode"
      : "Browse Mode";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "group relative inline-flex items-center gap-3 rounded-full border px-3 py-2",
        "transition-colors select-none",
        isDark ? "border-white/15 bg-white/5" : "border-black/10 bg-black/5"
      )}
      aria-label="Toggle theme"
      data-nolock
    >
      <span
        className={cn(
          "text-xs font-semibold tracking-[0.2em] uppercase",
          isDark ? "text-white/70" : "text-black/60"
        )}
      >
        {label}
      </span>

      <span
        className={cn(
          "relative h-7 w-14 rounded-full border overflow-hidden",
          isDark ? "border-white/15 bg-black" : "border-black/10 bg-white"
        )}
      >
        <motion.span
          layout
          animate={{ rotate: isDark ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 600, damping: 40 }}
          className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full flex items-center justify-center shadow-sm",
            // In light / Browse mode the knob is black on the left.
            // In dark / Search mode the knob is white on the right.
            isDark ? "left-[calc(100%-1.625rem)] bg-white text-black" : "left-0.5 bg-black text-white"
          )}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
        </motion.span>
        <span
          className={cn(
            "absolute inset-0",
            "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.18),transparent_55%)]",
            isDark ? "opacity-60" : "opacity-20"
          )}
        />
      </span>
    </button>
  );
}
