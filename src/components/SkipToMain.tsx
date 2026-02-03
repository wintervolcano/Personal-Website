import { cn } from "../lib/cn";
import type { Theme } from "./themeToggle";

export function SkipToMain({ theme }: { theme: Theme }) {
  const isDark = theme === "dark";

  return (
    <a
      href="#main-content"
      className={cn(
        "sr-only focus:not-sr-only",
        "focus:fixed focus:top-4 focus:left-4 focus:z-[100]",
        "focus:rounded-lg focus:px-4 focus:py-2",
        "focus:text-sm focus:font-semibold",
        "focus:outline-none focus:ring-2",
        isDark
          ? "focus:bg-white focus:text-black focus:ring-white/50"
          : "focus:bg-black focus:text-white focus:ring-black/50"
      )}
    >
      Skip to main content
    </a>
  );
}
