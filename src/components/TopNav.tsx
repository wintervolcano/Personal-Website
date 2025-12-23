import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, BookOpen, FlaskConical, FileText, Layers3, Search, User, Home, Pen } from "lucide-react";
import { cn } from "../lib/cn";
import { ThemeToggle, type Theme } from "./themeToggle";

export const PAGES = [
  { key: "home", label: "Home", icon: Home },
  { key: "research", label: "Research", icon: FlaskConical },
  { key: "projects", label: "Projects", icon: Layers3 },
  { key: "publications", label: "Publications", icon: FileText },
  { key: "resources", label: "Resources", icon: BookOpen },
  { key: "blog", label: "Blog", icon: Pen },
  { key: "about", label: "About", icon: User },
] as const;

export type PageKey = (typeof PAGES)[number]["key"];

export function TopNav({
  theme,
  setTheme,
  page,
  setPage,
  isMobile,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
  page: PageKey;
  setPage: (k: PageKey) => void;
  isMobile: boolean;
}) {
  const isDark = theme === "dark";

  return (
    <div className="fixed left-0 right-0 top-0 z-50" data-ui="nav">
      <div className={cn("px-4 sm:px-8 py-2 backdrop-blur-xl", isDark ? "bg-black/40" : "bg-white/60")}>
        <div className="mx-auto max-w-[1600px]">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setPage("home")}
              className="flex items-center gap-3 text-left leading-none select-none"
              aria-label="Go home"
              data-nolock
            >
              <img
                src="/logo.png"
                alt="Fazal Kareem"
                className="h-8 w-auto max-w-[140px] object-contain"
                style={{ filter: isDark ? "none" : "invert(1)" }}
              />
              {/* <div className={cn(isDark ? "text-white" : "text-black")}>
                <div className="text-xs font-semibold tracking-[0.28em] uppercase opacity-70">FAZAL KAREEM</div>
                <div className="text-[11px] tracking-[0.25em] uppercase opacity-50">Radio • Pulsars • Gravity</div>
              </div> */}
            </button>

            <div className="hidden lg:flex items-center gap-2" data-nolock>
              {PAGES.map(({ key, label, icon: Icon }) => {
                const active = page === key;
                return (
                  <button
                    key={key}
                    onClick={() => setPage(key)}
                    className={cn(
                      "relative rounded-full px-3 py-2",
                      "text-xs font-semibold tracking-[0.18em] uppercase transition-colors",
                      active ? (isDark ? "text-white" : "text-black") : isDark ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"
                    )}
                    data-nolock
                  >
                    <span className="inline-flex items-center gap-2" data-nolock>
                      <Icon className="h-4 w-4" />
                      {label}
                    </span>
                    {active ? (
                      <motion.span
                        layoutId="nav-underline"
                        className={cn("absolute left-3 right-3 -bottom-1 h-[2px]", isDark ? "bg-white" : "bg-black")}
                        transition={{ type: "spring", stiffness: 600, damping: 40 }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3" data-nolock>
              <ThemeToggle theme={theme} setTheme={setTheme} isMobile={isMobile} />
              <a
                href="mailto:fkareem@mpifr-bonn.mpg.de"
                className={cn(
                  "hidden sm:inline-flex items-center gap-2 rounded-full border px-3 py-2",
                  "text-xs font-semibold tracking-[0.18em] uppercase transition-colors",
                  isDark ? "border-white/15 text-white/80 hover:text-white" : "border-black/10 text-black/70 hover:text-black"
                )}
                data-nolock
              >
                Contact <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="mt-3 flex lg:hidden gap-2 overflow-x-auto pb-1" data-nolock>
            {PAGES.map(({ key, label }) => {
              const active = page === key;
              return (
                <button
                  key={key}
                  onClick={() => setPage(key)}
                  className={cn(
                    "whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase",
                    active ? (isDark ? "bg-white text-black" : "bg-black text-white") : isDark ? "bg-white/10 text-white/70" : "bg-black/5 text-black/70"
                  )}
                  data-nolock
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
