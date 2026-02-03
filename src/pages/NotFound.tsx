import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "../lib/cn";
import type { Theme } from "../components/themeToggle";
import { usePageMeta } from "../lib/usePageMeta";
import { ArrowLeft, Home } from "lucide-react";

export function NotFound({ theme }: { theme: Theme }) {
  const isDark = theme === "dark";
  const navigate = useNavigate();

  usePageMeta(
    "Page Not Found – Fazal Kareem",
    "The page you're looking for doesn't exist or has been moved."
  );

  return (
    <div className={cn("w-full min-h-[60vh] flex items-center justify-center", isDark ? "bg-black" : "bg-white")}>
      <div className="mx-auto max-w-[600px] px-4 sm:px-8 py-14 sm:py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className={cn("text-[120px] sm:text-[180px] font-black tracking-[-0.06em] leading-none", isDark ? "text-white/10" : "text-black/10")}>
            404
          </div>

          <h1 className={cn("mt-4 text-2xl sm:text-4xl font-black tracking-[-0.03em]", isDark ? "text-white" : "text-black")}>
            Page not found
          </h1>

          <p className={cn("mt-4 text-base sm:text-lg leading-relaxed", isDark ? "text-white/65" : "text-black/65")}>
            The page you're looking for doesn't exist, has been moved, or maybe the pulsar signal got lost in the noise.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              onClick={() => navigate(-1)}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3",
                "text-xs font-semibold tracking-[0.18em] uppercase",
                "border transition-colors",
                isDark
                  ? "border-white/20 text-white/80 hover:bg-white/10"
                  : "border-black/20 text-black/80 hover:bg-black/5"
              )}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <ArrowLeft className="h-4 w-4" />
              Go back
            </motion.button>

            <motion.button
              onClick={() => navigate("/")}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3",
                "text-xs font-semibold tracking-[0.18em] uppercase",
                "border transition-colors",
                isDark
                  ? "bg-white text-black border-white hover:bg-white/90"
                  : "bg-black text-white border-black hover:bg-black/90"
              )}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <Home className="h-4 w-4" />
              Home
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
