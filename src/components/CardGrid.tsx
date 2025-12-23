import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { cn } from "../lib/cn";
import type { Theme } from "./themeToggle.tsx";

export function CardGrid({
  theme,
  items,
}: {
  theme: Theme;
  items: Array<{ k: string; t: string; d: string; tag?: string; onClick?: () => void }>;
}) {
  const isDark = theme === "dark";
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
      {items.map((it) => (
        <motion.button
          key={it.k}
          onClick={it.onClick}
          className={cn(
            "text-left group relative rounded-3xl border p-5 sm:p-6 overflow-hidden",
            "transition-colors",
            isDark ? "border-white/12 bg-white/5 hover:bg-white/10" : "border-black/10 bg-black/5 hover:bg-black/10"
          )}
          whileHover={{ y: -6 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          data-nolock
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className={cn("text-lg sm:text-xl font-extrabold tracking-[-0.02em]", isDark ? "text-white" : "text-black")}>{it.t}</div>
              <div
                className={cn(
                  "mt-2 text-[0.95rem] sm:text-base leading-relaxed",
                  isDark ? "text-white/65" : "text-black/65"
                )}
              >
                {it.d}
              </div>
              {it.tag ? (
                <div
                  className={cn(
                    "mt-4 inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.22em] uppercase",
                    isDark ? "border-white/15 text-white/70" : "border-black/10 text-black/65"
                  )}
                >
                  {it.tag}
                </div>
              ) : null}
            </div>
            <ArrowUpRight className={cn("h-6 w-6 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5", isDark ? "text-white/70" : "text-black/60")} />
          </div>
          <div className={cn("pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-2xl", isDark ? "bg-white/10" : "bg-black/10")} />
        </motion.button>
      ))}
    </div>
  );
}
