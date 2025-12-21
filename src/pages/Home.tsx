import React from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/cn";
import { useMouseXY, useViewport, usePrefersReducedMotion } from "../lib/motion";
import type { Theme } from "../components/themeToggle";
import { HeroPulsars } from "../components/HeroPulsars";
import { CardGrid } from "../components/CardGrid";

function KPI({ theme, title, value }: { theme: Theme; title: string; value: string }) {
  const isDark = theme === "dark";
  return (
    <motion.div
      className={cn(
        "md:col-span-3 rounded-3xl border p-5 sm:p-6",
        isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5"
      )}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
    >
      <div className={cn("text-[11px] font-semibold tracking-[0.28em] uppercase", isDark ? "text-white/60" : "text-black/55")}>
        {title}
      </div>
      <div className={cn("mt-2 text-lg sm:text-xl font-extrabold tracking-[-0.02em]", isDark ? "text-white" : "text-black")}>
        {value}
      </div>
    </motion.div>
  );
}

function Hero({
  theme,
  onScrollTo,
  onLearnMore,
}: {
  theme: Theme;
  onScrollTo: (id: "featured" | "latest") => void;
  onLearnMore: (e?: React.MouseEvent) => void;
}) {
  const reduced = usePrefersReducedMotion();
  const isDark = theme === "dark";
  const { x, y } = useMouseXY();
  const { w: vw, h: vh } = useViewport();

  const xSpring = useSpring(x, { stiffness: 220, damping: 28, mass: 0.8 });
  const ySpring = useSpring(y, { stiffness: 220, damping: 28, mass: 0.8 });

  const tx = useTransform(xSpring, [0, vw || 1], [-22, 22]);
  const ty = useTransform(ySpring, [0, vh || 1], [-14, 14]);

  const tx2 = useTransform(xSpring, [0, vw || 1], [14, -14]);
  const ty2 = useTransform(ySpring, [0, vh || 1], [10, -10]);

  const navigate = useNavigate();

  const goLearnMore = (e?: React.MouseEvent) => {
    const newTab = !!e && (e.metaKey || e.ctrlKey);
    const path = "/search-mode";
    if (newTab) window.open(path, "_blank", "noopener,noreferrer");
    else navigate(path);
  };

  return (
    <section className="relative min-h-[110svh] w-full overflow-hidden">
      <div
        className={cn(
          "absolute inset-0",
          isDark ? "bg-black" : "bg-white",
          isDark
            ? "bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.08),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.06),transparent_60%)]"
            : "bg-[radial-gradient(circle_at_20%_15%,rgba(0,0,0,0.06),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(0,0,0,0.05),transparent_60%)]"
        )}
      />

      <div
        className={cn(
          "absolute inset-0 opacity-55",
          isDark
            ? "bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)]"
            : "bg-[linear-gradient(rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.06)_1px,transparent_1px)]",
          "bg-[size:52px_52px]"
        )}
      />

      <HeroPulsars theme={theme} />

      <div className="relative mx-auto max-w-[1800px] px-4 sm:px-8 pt-28 sm:pt-32 min-h-[110svh] -translate-y-20">
        <div className="h-[calc(110svh-8rem)] flex flex-col justify-center items-center text-center">
          <div className="mt-6 relative">
            <motion.div
              style={reduced ? undefined : { x: tx2, y: ty2 }}
              className={cn("absolute -inset-8 blur-[1px]", isDark ? "text-white/10" : "text-black/10")}
              aria-hidden
            >
              <h1 className="text-[clamp(3.6rem,10.2vw,10.6rem)] leading-[0.88] font-black tracking-[-0.055em]">
                Fazal
                <br />
                Kareem
              </h1>
            </motion.div>

            <motion.div style={reduced ? undefined : { x: tx, y: ty }}>
              <h1 className={cn("text-[clamp(3.9rem,10.8vw,11.4rem)] leading-[0.88] font-black tracking-[-0.06em]", isDark ? "text-white" : "text-black")}>
                Fazal
                <br />
                Kareem
              </h1>
            </motion.div>

            <div className="mt-4">
              <div className={cn("text-[clamp(0.95rem,1.5vw,1.1rem)] font-semibold tracking-[0.22em] uppercase", isDark ? "text-white/70" : "text-black/60")}>
                Pulsars • Timing • Neutron Stars • Gravitational Waves
              </div>

              {/*  Only visible in LIGHT mode */}
              {!isDark ? (
                <div className={cn("mt-3 max-w-[74ch] text-base sm:text-lg leading-relaxed", "text-black/65")}>
                  Toggle into <span className="font-semibold text-black">Search Mode</span> to hunt hidden pulsars.
                </div>
              ) :
                <div className={cn("mt-3 max-w-[74ch] text-base sm:text-lg leading-relaxed", "ext-white/65")}>
                  Learn how the <span className="font-semibold text-white">Search Mode</span> mode works below.
                </div>
              }

              <div className="mt-7 flex flex-wrap justify-center gap-2" data-nolock>
                <button
                  type="button"
                  onClick={goLearnMore}
                  className={cn(
                    "inline-flex items-center rounded-full border px-4 py-3 text-s font-semibold tracking-[0.18em] uppercase transition-all",
                    "will-change-transform",
                    "hover:-translate-y-[1px] active:translate-y-0",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                    isDark
                      ? "border-white/14 bg-white/5 text-white/85 hover:bg-white/10 hover:border-white/20 focus-visible:ring-white/40 focus-visible:ring-offset-black"
                      : "border-black/10 bg-black text-white hover:bg-black/90 hover:border-black/30 focus-visible:ring-black/30 focus-visible:ring-offset-white"
                  )}
                  data-nolock
                >
                  What is Search Mode?
                </button>

              </div>
            </div>
          </div>

          <div className="mt-10 sm:mt-12">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
              <KPI theme={theme} title="Focus" value="Globular cluster pulsars" />
              <KPI theme={theme} title="Methods" value="Surveys, pipelines, timing" />
              <KPI theme={theme} title="Physics" value="Strong-field gravity tests" />
              <KPI theme={theme} title="Signals" value="Nanohertz GWs" />
            </div>
          </div>

          {/* Animated “Scroll” call */}
          <motion.div
            className={cn("mt-10 sm:mt-12 flex items-center gap-3", isDark ? "text-white/60" : "text-black/55")}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <span className="h-8 w-[1px] bg-current opacity-30" />
            <span className="text-xs font-semibold tracking-[0.28em] uppercase">Scroll</span>

            <motion.span
              aria-hidden
              className="inline-flex items-center"
              animate={
                reduced
                  ? { opacity: 0.6 }
                  : { y: [0, 6, 0], opacity: [0.55, 1, 0.55] }
              }
              transition={
                reduced
                  ? { duration: 0 }
                  : { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
              }
            >
              <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            </motion.span>
          </motion.div>
        </div>
      </div>

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-28",
          isDark ? "bg-[linear-gradient(to_top,rgba(0,0,0,1),rgba(0,0,0,0))]" : "bg-[linear-gradient(to_top,rgba(255,255,255,1),rgba(255,255,255,0))]"
        )}
      />
    </section>
  );
}

export function Home({
  theme,
  onOpenPost,
  latestBlog,
  latestResearch,
}: {
  theme: Theme;
  onOpenPost: (collection: "blog" | "research", slug: string) => void;
  latestBlog: Array<{ slug: string; title: string; date: string; description?: string }>;
  latestResearch: Array<{ slug: string; title: string; date: string; description?: string }>;
}) {
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const openInternal = (path: string, e?: React.MouseEvent) => {
    const newTab = !!e && (e.metaKey || e.ctrlKey);
    if (newTab) window.open(path, "_blank", "noopener,noreferrer");
    else navigate(path);
  };

  const openExternal = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const scrollTo = (id: "featured" | "latest") => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={cn("w-full", isDark ? "bg-black" : "bg-white")}>
      <Hero
        theme={theme}
        onScrollTo={scrollTo}
        onLearnMore={(e) => openInternal("/search-mode", e)}
      />

      <section id="featured" className={cn("w-full", isDark ? "bg-black" : "bg-white")}>
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8 py-14 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-7">
              <div className={cn("text-xs font-semibold tracking-[0.32em] uppercase", isDark ? "text-white/60" : "text-black/55")}>Featured</div>
              <h2 className={cn("mt-4 text-4xl sm:text-6xl font-black tracking-[-0.04em]", isDark ? "text-white" : "text-black")}>
                What I build, measure, and test
              </h2>
            </div>
            <div className="lg:col-span-5">
              <p className={cn("text-base sm:text-lg leading-relaxed", isDark ? "text-white/65" : "text-black/65")}>
                From searching for pulsars to timing models — and from globular clusters to nanohertz gravitational waves, testing General Relativity in strong field regime. 
              </p>
            </div>
          </div>

          <div className="mt-10 sm:mt-12">
            <CardGrid
              theme={theme}
              items={[
                {
                  k: "p1",
                  t: "Globular Cluster Pulsar Searches",
                  d: "Compact accelerations, crowded fields, real candidates.",
                  tag: "surveys",
                  onClick: () => openInternal("/projects"),
                },
                {
                  k: "p2",
                  t: "Precision Timing",
                  d: "Long baselines, robust noise models, gravity tests.",
                  tag: "timing",
                  onClick: () => openInternal("/research"),
                },
                {
                  k: "p3",
                  t: "Timing Arrays and Nanohertz GW Signals",
                  d: "Timing arrays, correlations, and careful statistics.",
                  tag: "PTA",
                  onClick: () => openInternal("/publications"),
                },
              ]}
            />
          </div>
        </div>
      </section>

      <section id="latest" className={cn("w-full", isDark ? "bg-black" : "bg-white")}>
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8 pb-14 sm:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-7">
              <div className={cn("text-xs font-semibold tracking-[0.32em] uppercase", isDark ? "text-white/60" : "text-black/55")}>Latest</div>
              <h3 className={cn("mt-4 text-3xl sm:text-5xl font-black tracking-[-0.04em]", isDark ? "text-white" : "text-black")}>
                Updates & notes
              </h3>
            </div>
            <div className="lg:col-span-5">
              <p className={cn("text-base leading-relaxed", isDark ? "text-white/65" : "text-black/65")}>
                Powered by markdown files in <span className={cn("font-semibold", isDark ? "text-white" : "text-black")}>src/content/</span>.
              </p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6">
              <div className={cn("rounded-[28px] border p-6 sm:p-7", isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5")}>
                <div className={cn("text-[11px] font-semibold tracking-[0.28em] uppercase", isDark ? "text-white/60" : "text-black/55")}>
                  Research updates
                </div>

                <div className="mt-5 space-y-3">
                  {latestResearch.map((d) => (
                    <button
                      key={d.slug}
                      onClick={(e) => openInternal(`/research/${d.slug}`, e)}
                      className={cn(
                        "w-full text-left rounded-2xl border px-4 py-3 transition-colors",
                        isDark ? "border-white/12 bg-black/40 hover:bg-white/10" : "border-black/10 bg-white/60 hover:bg-black/10"
                      )}
                      data-nolock
                    >
                      <div className={cn("text-sm font-extrabold", isDark ? "text-white" : "text-black")}>{d.title}</div>
                      <div className={cn("mt-1 text-xs", isDark ? "text-white/60" : "text-black/55")}>{d.date}</div>
                      {d.description ? <div className={cn("mt-2 text-sm", isDark ? "text-white/70" : "text-black/65")}>{d.description}</div> : null}
                    </button>
                  ))}
                </div>

                <div className="mt-5 flex justify-center" data-nolock>
                  <button
                    onClick={() => openInternal("/research")}
                    className={cn(
                      "rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase transition-colors",
                      isDark ? "border-white/14 bg-white/5 text-white/85 hover:bg-white/10" : "border-black/10 bg-black text-white hover:bg-black/90"
                    )}
                    data-nolock
                  >
                    View all research →
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className={cn("rounded-[28px] border p-6 sm:p-7", isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5")}>
                <div className={cn("text-[11px] font-semibold tracking-[0.28em] uppercase", isDark ? "text-white/60" : "text-black/55")}>
                  Blog
                </div>

                <div className="mt-5 space-y-3">
                  {latestBlog.map((d) => (
                    <button
                      key={d.slug}
                      onClick={(e) => openInternal(`/blog/${d.slug}`, e)}
                      className={cn(
                        "w-full text-left rounded-2xl border px-4 py-3 transition-colors",
                        isDark ? "border-white/12 bg-black/40 hover:bg-white/10" : "border-black/10 bg-white/60 hover:bg-black/10"
                      )}
                      data-nolock
                    >
                      <div className={cn("text-sm font-extrabold", isDark ? "text-white" : "text-black")}>{d.title}</div>
                      <div className={cn("mt-1 text-xs", isDark ? "text-white/60" : "text-black/55")}>{d.date}</div>
                      {d.description ? <div className={cn("mt-2 text-sm", isDark ? "text-white/70" : "text-black/65")}>{d.description}</div> : null}
                    </button>
                  ))}
                </div>

                <div className="mt-5 flex justify-center" data-nolock>
                  <button
                    onClick={() => openInternal("/blog")}
                    className={cn(
                      "rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase transition-colors",
                      isDark ? "border-white/14 bg-white/5 text-white/85 hover:bg-white/10" : "border-black/10 bg-black text-white hover:bg-black/90"
                    )}
                    data-nolock
                  >
                    View all posts →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <div className={cn("rounded-[28px] border p-6 sm:p-8", isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5")}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8">
                  <div className={cn("text-sm font-extrabold", isDark ? "text-white" : "text-black")}>
                    Want a short monthly research digest?
                  </div>
                  <div className={cn("mt-2 text-sm leading-relaxed", isDark ? "text-white/65" : "text-black/65")}>
                    Subscribe to this RSS feed to be the first to know when new results and blogs drop. 
                  </div>
                </div>

                <div className="lg:col-span-4 flex gap-2 justify-center lg:justify-end" data-nolock>
                  <button
                    onClick={() => openExternal("mailto:fkareem@mpifr-bonn.mpg.de")}
                    className={cn(
                      "rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase transition-colors",
                      isDark ? "border-white/14 bg-white/5 text-white/85 hover:bg-white/10" : "border-black/10 bg-black text-white hover:bg-black/90"
                    )}
                    data-nolock
                  >
                    Contact
                  </button>

                  <button
                    onClick={() => openInternal("/blog")}
                    className={cn(
                      "rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase transition-colors",
                      isDark ? "border-white/14 bg-white/5 text-white/75 hover:bg-white/10" : "border-black/10 bg-black/5 text-black/70 hover:bg-black/10 hover:text-black"
                    )}
                    data-nolock
                  >
                    RSS (soon)
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}