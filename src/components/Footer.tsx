// Footer.tsx
import React, { useMemo, useRef, useState } from "react";
import { cn } from "../lib/cn";
import type { Theme } from "./themeToggle";
import { ArrowUpRight, Github, Linkedin, Mail, Twitter } from "lucide-react";
import { motion, useAnimationFrame } from "framer-motion";

function Social({ theme, href, label, Icon }: { theme: Theme; href: string; label: string; Icon: any }) {
  const isDark = theme === "dark";
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-2",
        "text-xs font-semibold tracking-[0.18em] uppercase transition-colors",
        isDark
          ? "border-white/12 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
          : "border-black/10 bg-black/5 text-black/65 hover:bg-black/10 hover:text-black"
      )}
      data-nolock
    >
      <Icon className="h-4 w-4" />
      {label}
    </a>
  );
}

/** Hero-style Pulsar (same structure) */
function Beam({
  len,
  w,
  alpha,
  rotateDeg,
  tiltDeg,
  theme,
}: {
  len: number;
  w: number;
  alpha: number;
  rotateDeg: number;
  tiltDeg: number;
  theme: Theme;
}) {
  const isDark = theme === "dark";
  const c = isDark ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
  const c2 = isDark ? `rgba(255,255,255,${alpha * 0.9})` : `rgba(0,0,0,${alpha * 0.9})`;

  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{
        transform: `translate(-50%,-50%) rotate(${rotateDeg}deg) rotateX(${tiltDeg}deg)`,
        transformOrigin: "50% 50%",
      }}
    >
      <div
        style={{
          width: w,
          height: len,
          transform: "translate(-50%,-100%)",
          marginLeft: "50%",
          borderRadius: 999,
          background: `linear-gradient(to top, rgba(0,0,0,0), ${c})`,
          filter: "blur(0.5px)",
        }}
      />
      <div
        style={{
          width: Math.max(4, Math.round(w * 0.35)),
          height: Math.max(34, Math.round(len * 0.45)),
          transform: "translate(-50%,-100%)",
          marginLeft: "50%",
          marginTop: -len + 14,
          borderRadius: 999,
          background: `linear-gradient(to top, rgba(0,0,0,0), ${c2})`,
          filter: "blur(0.15px)",
          opacity: 0.95,
        }}
      />
    </div>
  );
}

/** Pitch-black BH shadow + very subtle lensing halo */
function BlackHole({ r, theme }: { r: number; theme: Theme }) {
  const isDark = theme === "dark";
  const ringSoft = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.14)";

  return (
    <div className="relative" style={{ width: r * 2, height: r * 2 }}>
      {/* lensing halo */}
      <div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: r * 2.8,
          height: r * 2.8,
          transform: "translate(-50%,-50%)",
          background: `radial-gradient(circle, ${ringSoft}, rgba(0,0,0,0) 90%)`,
          filter: "blur(0.75px)",
          opacity: 0.95,
          pointerEvents: "none",
        }}
      />

      {/* event horizon / shadow */}
      <div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: r * 2,
          height: r * 2,
          transform: "translate(-50%,-50%)",
          background: "radial-gradient(circle at 35% 35%, rgba(0,0,0,1), rgba(0,0,0,1) 62%, rgba(0,0,0,1) 100%)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.78)",
          border: "1px solid rgba(0,0,0,1)",
        }}
      />
    </div>
  );
}

type MassPoint = { x: number; y: number; m: number };

function warpPoint(x: number, y: number, masses: MassPoint[], k: number) {
  let dxSum = 0;
  let dySum = 0;

  for (const mp of masses) {
    const dx = x - mp.x;
    const dy = y - mp.y;
    const r2 = dx * dx + dy * dy + 18; // soften singularity
    const f = mp.m / r2;
    dxSum += dx * f;
    dySum += dy * f;
  }

  const x2 = x - dxSum * k;
  const y2 = y - dySum * k;

  // subtle “sag” toward the instantaneous barycenter of the binary so the
  // deepest part of the sheet lines up with the orbiting system.
  let cx = 50;
  let cy = 56;
  let mTot = 0;
  for (const mp of masses) {
    cx += mp.x * mp.m;
    cy += mp.y * mp.m;
    mTot += mp.m;
  }
  if (mTot > 0) {
    cx /= 1 + mTot;
    cy /= 1 + mTot;
  }

  const ddx = x - cx;
  const ddy = y - cy;
  const d2 = ddx * ddx + ddy * ddy;
  const sag = 0.8 * Math.exp(-d2 / 1400);

  return { x: x2, y: y2 + sag };
}

function makeWarpedPathHorizontal(y0: number, masses: MassPoint[], k: number, samples = 52) {
  let d = "";
  for (let i = 0; i <= samples; i++) {
    const x = (i / samples) * 100;
    const p = warpPoint(x, y0, masses, k);
    d += i === 0 ? `M ${p.x.toFixed(6)} ${p.y.toFixed(6)}` : ` L ${p.x.toFixed(6)} ${p.y.toFixed(6)}`;
  }
  return d;
}

function makeWarpedPathVertical(x0: number, masses: MassPoint[], k: number, samples = 52) {
  let d = "";
  for (let i = 0; i <= samples; i++) {
    const y = (i / samples) * 100;
    const p = warpPoint(x0, y, masses, k);
    d += i === 0 ? `M ${p.x.toFixed(20)} ${p.y.toFixed(20)}` : ` L ${p.x.toFixed(5)} ${p.y.toFixed(5)}`;
  }
  return d;
}

function SpacetimeGrid({
  theme,
  width,
  height,
  orbitSec,
}: {
  theme: Theme;
  width: number;
  height: number;
  orbitSec: number;
}) {
  const isDark = theme === "dark";

  // grid definition: reasonably dense mesh across most of the plane
  const hLines = useMemo(() => {
    const ys: number[] = [];
    for (let y = 12; y <= 88; y += 4) ys.push(y);
    return ys;
  }, []);
  const vLines = useMemo(() => {
    const xs: number[] = [];
    for (let x = 0; x <= 100; x += 4) xs.push(x);
    return xs;
  }, []);

  const k = 90; // warp strength (lower = smoother sheet)
  const stroke = isDark ? "rgba(255, 255, 255, 0.65)" : "rgba(0,0,0,0.22)";
  const glow = isDark ? "rgba(255, 255, 255, 0.73)" : "rgba(0,0,0,0.14)";

  const [paths, setPaths] = useState<{
    h: string[];
    v: string[];
    wells: { bh: { x: number; y: number }; psr: { x: number; y: number } };
  }>({
    h: [],
    v: [],
    wells: { bh: { x: 36, y: 52 }, psr: { x: 64, y: 48 } },
  });

  const last = useRef(0);

  useAnimationFrame((t) => {
    // throttle (keeps CPU low)
    if (t - last.current < 33) return;
    last.current = t;

    const theta = ((t / 1000) * (2 * Math.PI)) / orbitSec;

    // Put bodies on an ellipse under the binary (in SVG viewBox units)
    const cx = 50;
    const cy = 56;
    const d = 18; // orbit radius in SVG space
    const ell = 0.55; // squash
    const yOff = 2.0;

    const psr = { x: cx + Math.cos(theta) * d, y: cy + Math.sin(theta) * d * ell - yOff };
    const bh = { x: cx - Math.cos(theta) * d, y: cy - Math.sin(theta) * d * ell + yOff };

    const masses: MassPoint[] = [
      { x: bh.x, y: bh.y, m: 1.35 }, // BH stronger
      { x: psr.x, y: psr.y, m: 0.95 }, // pulsar
    ];

    const h = hLines.map((yy) => makeWarpedPathHorizontal(yy, masses, k));
    const v = vLines.map((xx) => makeWarpedPathVertical(xx, masses, k));


    setPaths({ h, v, wells: { bh, psr } });
  });

  return (
    <div
      className="absolute left-1/2 top-1/2 pointer-events-none"
      style={{
        width,
        height,
        transform: "translate(-50%,-50%) translateY(10px) perspective(640px) rotateX(58deg)",
        transformOrigin: "50% 50%",
        opacity: isDark ? 0.9 : 0.75,
        filter: "blur(0.15px)",
      }}
      aria-hidden
    >
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <radialGradient id="gridFade" cx="50%" cy="60%" r="95%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="70%" stopColor="white" stopOpacity="0.55" />
            <stop offset="100%" stopColor="white" stopOpacity="0.12" />
          </radialGradient>

          <mask id="fadeMask">
            <rect x="0" y="0" width="100" height="100" fill="url(#gridFade)" />
          </mask>

          <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="0.55" result="b" />
            <feColorMatrix
              in="b"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.75 0"
              result="g"
            />
            <feMerge>
              <feMergeNode in="g" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter={isDark ? "url(#softGlow)" : undefined}>
          <rect x="0" y="0" width="100" height="100" fill={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"} />

          {paths.h.map((d, i) => (
            <path key={`h-${i}`} d={d} fill="none" stroke={stroke} strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
          ))}
          {paths.v.map((d, i) => (
            <path key={`v-${i}`} d={d} fill="none" stroke={stroke} strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
          ))}

          {/* moving “well” hints */}
          <circle cx={paths.wells.bh.x} cy={paths.wells.bh.y} r="3.5" fill={glow} />
          <circle cx={paths.wells.psr.x} cy={paths.wells.psr.y} r="5.0" fill={glow} />
        </g>
      </svg>
    </div>
  );
}

/**
 * IMPORTANT:
 * - This is ABSOLUTE but the Footer is RELATIVE, so it anchors to the footer only.
 * - pointer-events-none so it never blocks clicks on footer links.
 */
function FooterPSRBHOverlay({ theme }: { theme: Theme }) {
  const isDark = theme === "dark";

  // parameters
  const rP = 12;
  const rBH = 11;
  const orbitR = 30;
  const spinSec = 1.0;
  const orbitSec = 1.4;

  const beamLen = Math.round(orbitR * 2.2);
  const beamW = 12;
  const beamAlpha = isDark ? 0.22 : 0.18;
  const tiltDeg = 16;

  const box = (orbitR + rP + rBH) * 2 + 32;

  return (
    <div className="pointer-events-none absolute right-4 bottom-34 sm:right-8 sm:bottom-24 lg:right-20 lg:bottom-20 z-[5] opacity-90" aria-hidden>
      <div className="relative" style={{ width: box, height: box }}>
        {/* ✅ Grid lives INSIDE overlay so it can use box + orbitSec */}
        <SpacetimeGrid theme={theme} width={box * 1} height={box * 1} orbitSec={orbitSec} />

        {/* soft vignette */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: isDark
              ? "radial-gradient(circle, rgba(0, 0, 0, 0.08), rgba(0,0,0,0) 62%)"
              : "radial-gradient(circle, rgba(0, 0, 0, 0.06), rgba(0,0,0,0) 62%)",
            filter: "blur(0.6px)",
          }}
        />

        {/* orbital rotation (binary + wells rotate together because grid is time-driven by orbitSec) */}
        <motion.div
          className="absolute left-1/2 top-1/2"
          style={{ width: 1, height: 1, scaleY: 0.70, }}
          animate={{ rotate: 360 }}
          transition={{ duration: orbitSec, repeat: Infinity, ease: "linear" }}
        >
          {/* pulsar */}
          <div className="absolute left-0 top-0" style={{ transform: `translate(${orbitR}px, ${-orbitR * 0.1}px)` }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: spinSec, repeat: Infinity, ease: "linear" }}>
              <div className="relative" style={{ width: rP * 2, height: rP * 2 }}>
                <Beam len={beamLen} w={beamW} alpha={beamAlpha} rotateDeg={0} tiltDeg={tiltDeg} theme={theme} />
                <Beam len={beamLen} w={beamW} alpha={beamAlpha} rotateDeg={180} tiltDeg={tiltDeg} theme={theme} />

                <div
                  className="absolute left-1/2 top-1/2 rounded-full"
                  style={{
                    width: rP * 2,
                    height: rP * 2,
                    transform: "translate(-50%,-50%)",
                    background: isDark
                      ? "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95), rgba(255,255,255,0.55) 60%, rgba(0,0,0,0.12) 100%)"
                      : "radial-gradient(circle at 35% 35%, rgba(0,0,0,0.90), rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.10) 100%)",
                    boxShadow: isDark ? "0 10px 20px rgba(0,0,0,0.35)" : "0 10px 20px rgba(0,0,0,0.18)",
                  }}
                />
              </div>
            </motion.div>
          </div>

          {/* black hole */}
          <div className="absolute left-0 top-0" style={{ transform: `translate(${-orbitR}px, ${orbitR * 0.1}px)` }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }}>
              <BlackHole r={rBH} theme={theme} />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function Footer({ theme }: { theme: Theme }) {
  const isDark = theme === "dark";

  return (
    <footer className={cn("relative w-full overflow-hidden", isDark ? "bg-black" : "bg-white")}>
      {/* Overlay is a direct child of the footer (anchors to footer only) */}
      <FooterPSRBHOverlay theme={theme} />

      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 py-12">
        <div className={cn("rounded-[28px] border overflow-hidden", isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5")}>
          <div className={cn("p-6 sm:p-8 border-b", isDark ? "border-white/10" : "border-black/10")}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5">
                <div className={cn("text-sm font-extrabold", isDark ? "text-white" : "text-black")}>Fazal Kareem</div>
                <div className={cn("mt-2 text-xs tracking-[0.22em] uppercase", isDark ? "text-white/55" : "text-black/55")}>
                  Pulsars • Timing • Gravity
                </div>
                <div className={cn("mt-4 text-sm leading-relaxed", isDark ? "text-white/65" : "text-black/65")}>
                  Research portfolio and a gamified pulsar search tutorial. Built for clarity, fun, and a little bit of mystery.
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Social theme={theme} href="mailto:fkareem@mpifr-bonn.mpg.de" label="Email" Icon={Mail} />
                  <Social theme={theme} href="https://github.com/wintervolcano" label="GitHub" Icon={Github} />
                  <Social theme={theme} href="https://x.com/fazkareem12" label="Twitter" Icon={Twitter} />
                  <Social theme={theme} href="https://www.linkedin.com/in/fazkareem/" label="LinkedIn" Icon={Linkedin} />
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  <div>
                    <div className={cn("text-[11px] font-semibold tracking-[0.28em] uppercase", isDark ? "text-white/55" : "text-black/55")}>
                      Explore
                    </div>
                    <ul className={cn("mt-3 space-y-2 text-sm", isDark ? "text-white/70" : "text-black/70")}>
                      <li>
                        <a href="/research" className="hover:underline" data-nolock>
                          Research
                        </a>
                      </li>
                      <li>
                        <a href="/projects" className="hover:underline" data-nolock>
                          Projects
                        </a>
                      </li>
                      <li>
                        <a href="/blog" className="hover:underline" data-nolock>
                          Blog
                        </a>
                      </li>
                      <li>
                        <a href="/resources" className="hover:underline" data-nolock>
                          Resources
                        </a>
                      </li>
                      <li>
                        <a href="/site-philosophy" className="hover:underline" data-nolock>
                          Site Philosophy
                        </a>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <div className={cn("text-[11px] font-semibold tracking-[0.28em] uppercase", isDark ? "text-white/55" : "text-black/55")}>
                      Search Mode
                    </div>
                    <div className={cn("mt-3 text-sm leading-relaxed", isDark ? "text-white/65" : "text-black/65")}>
                      Toggle dark mode to scan the sky. Capture a signal. Click the peak. Reveal the pulsar.
                    </div>
                    <div className={cn("mt-3 text-xs", isDark ? "text-white/55" : "text-black/55")}>150 hidden targets • real plots</div>
                  </div>

                  <div>
                    <div className={cn("text-[11px] font-semibold tracking-[0.28em] uppercase", isDark ? "text-white/55" : "text-black/55")}>
                      Now
                    </div>
                    <div className={cn("mt-3 text-sm leading-relaxed", isDark ? "text-white/65" : "text-black/65")}>
                      MPIfR Bonn. Globular clusters. Timing arrays. 
                    </div>
                    <a
                      href="./CV_Fazal_Kareem.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "mt-3 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase",
                        isDark ? "text-white/70 hover:text-white" : "text-black/70 hover:text-black"
                      )}
                      data-nolock
                    >
                      View CV <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className={cn("text-xs", isDark ? "text-white/55" : "text-black/55")}>
              © {new Date().getFullYear()} • Built with React + Tailwind + Framer Motion
            </div>
            <div className={cn("text-xs", isDark ? "text-white/55" : "text-black/55")}>Made with ❤️ Fazal Kareem.</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
