import React from "react";
import { cn } from "../lib/cn";
import type { Theme } from "../components/themeToggle.tsx";

export function SectionShell({
  theme,
  eyebrow,
  title,
  subtitle,
  rightSlot,
  children,
}: {
  theme: Theme;
  eyebrow: string;
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  const isDark = theme === "dark";
  return (
    <section className={cn("relative w-full", isDark ? "bg-black" : "bg-white")}>
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 py-14 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-7">
            <div className={cn("text-xs font-semibold tracking-[0.32em] uppercase", isDark ? "text-white/60" : "text-black/55")}>{eyebrow}</div>
            <h2 className={cn("mt-4 text-4xl sm:text-6xl font-black tracking-[-0.04em]", isDark ? "text-white" : "text-black")}>{title}</h2>
          </div>
          <div className="lg:col-span-5">
            {rightSlot ? (
              rightSlot
            ) : subtitle ? (
              <p className={cn("text-base sm:text-lg leading-relaxed", isDark ? "text-white/65" : "text-black/65")}>{subtitle}</p>
            ) : null}
          </div>
        </div>
        <div className="mt-10 sm:mt-12">{children}</div>
      </div>
    </section>
  );
}
