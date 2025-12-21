import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "../lib/cn";

export type Theme = "light" | "dark";

export function ThemeToggle({
  theme,
  setTheme,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
}) {
  const isDark = theme === "dark";

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
        {isDark ? "Search Mode" : "Browse Mode"}
      </span>

      <span
        className={cn(
          "relative h-7 w-14 rounded-full border overflow-hidden",
          isDark ? "border-white/15 bg-black" : "border-black/10 bg-white"
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 600, damping: 40 }}
          className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full",
            isDark ? "left-[calc(100%-1.625rem)] bg-white" : "left-0.5 bg-black"
          )}
        />
        <span
          className={cn(
            "absolute inset-0",
            "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.18),transparent_55%)]",
            isDark ? "opacity-60" : "opacity-20"
          )}
        />
      </span>

      <motion.span
        className={cn(
          "inline-flex items-center justify-center rounded-full h-7 w-7",
          isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"
        )}
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        aria-hidden
      >
        <Sparkles className="h-4 w-4" />
      </motion.span>
    </button>
  );
}