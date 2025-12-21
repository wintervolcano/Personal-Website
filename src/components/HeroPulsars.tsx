import React, { useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

type Theme = "light" | "dark";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(!!mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

function useViewport() {
  const [vp, setVp] = useState({ vw: 1200, vh: 800 });
  useEffect(() => {
    const upd = () => setVp({ vw: window.innerWidth || 1200, vh: window.innerHeight || 800 });
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);
  return vp;
}

function useMouseXYEnabled(enabled: boolean) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [enabled, x, y]);

  return { x, y };
}

/** ------- Visual primitives ------- */

type PulsarSprite = {
  id: string;
  x: number;
  y: number;
  r: number;
  spinSec: number;
  driftSec: number;
  depth: number;
  beamLen: number;
  beamW: number;
  beamAlpha: number;
  tiltDeg: number;
};

type BinarySprite = {
  id: string;
  x: number;
  y: number;
  rP: number;
  rC: number;
  orbitR: number;
  baseOrbitSec: number;
  hoverOrbitSec: number;
  spinSec: number;
  driftSec: number;
  depth: number;
};

function makePulsars(): PulsarSprite[] {
  return [
    // thinner beams + slightly shorter
    { id: "p1", x: 0.11, y: 0.08, r: 14, spinSec: 0.9, driftSec: 10.0, depth: 0.55, beamLen: 140, beamW: 16, beamAlpha: 0.20, tiltDeg: 18 },
    { id: "p2", x: 0.84, y: 0.02, r: 11, spinSec: 3.2, driftSec: 9.0, depth: 0.45, beamLen: 160, beamW: 14, beamAlpha: 0.18, tiltDeg: 14 },
    { id: "p3", x: 0.01, y: 0.4, r: 11, spinSec: 2.2, driftSec: 9.0, depth: 0.45, beamLen: 170, beamW: 14, beamAlpha: 0.18, tiltDeg: 14 },
    { id: "p4", x: 0.80, y: 0.64, r: 10, spinSec: 1.3, driftSec: 11.0, depth: 0.40, beamLen: 150, beamW: 12, beamAlpha: 0.16, tiltDeg: 22 },
  ];
}

function makeBinaries(): BinarySprite[] {
  return [
    // hover speed-up: faster but not silly
    { id: "b1", x: 0.70, y: 0.54, rP: 12, rC: 8, orbitR: 50, baseOrbitSec: 6.0, hoverOrbitSec: 0.02, spinSec: 1.6, driftSec: 10.0, depth: 0.50 },
    { id: "b2", x: 0.22, y: 0.80, rP: 11, rC: 7, orbitR: 22, baseOrbitSec: 1.4, hoverOrbitSec: 2.4, spinSec: 3.0, driftSec: 11.0, depth: 0.42 },
    { id: "b3", x: 0.5, y: 0.11, rP: 11, rC: 7, orbitR: 30, baseOrbitSec: 2.4, hoverOrbitSec: 2.4, spinSec: 2.0, driftSec: 11.0, depth: 0.42 },
  ];
}

function Beam({
  len,
  w,
  alpha,
  rotateDeg,
  tiltDeg,
}: {
  len: number;
  w: number;
  alpha: number;
  rotateDeg: number;
  tiltDeg: number;
}) {
  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{
        transform: `translate(-50%,-50%) rotate(${rotateDeg}deg) rotateX(${tiltDeg}deg)`,
        transformOrigin: "50% 50%",
      }}
    >
      {/* long thin beam */}
      <div
        style={{
          width: w,
          height: len,
          transform: "translate(-50%,-100%)",
          marginLeft: "50%",
          borderRadius: 999,
          background: `linear-gradient(to top, rgba(0,0,0,0), rgba(0,0,0,${alpha}))`,
          filter: "blur(0.5px)",
        }}
      />
      {/* inner core beam (even thinner) */}
      <div
        style={{
          width: Math.max(4, Math.round(w * 0.35)),
          height: Math.max(34, Math.round(len * 0.45)),
          transform: "translate(-50%,-100%)",
          marginLeft: "50%",
          marginTop: -len + 14,
          borderRadius: 999,
          background: `linear-gradient(to top, rgba(0,0,0,0), rgba(0,0,0,${alpha * 0.9}))`,
          filter: "blur(0.15px)",
          opacity: 0.95,
        }}
      />
    </div>
  );
}

function PulsarGlyph({ s }: { s: PulsarSprite }) {
  return (
    <div className="relative" style={{ width: s.beamLen * 2, height: s.beamLen * 2 }}>
      {/* TWO beams 180° apart */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: s.spinSec, repeat: Infinity, ease: "linear" }}
      >
        <Beam len={s.beamLen} w={s.beamW} alpha={s.beamAlpha} rotateDeg={0} tiltDeg={s.tiltDeg} />
        <Beam len={s.beamLen} w={s.beamW} alpha={s.beamAlpha} rotateDeg={180} tiltDeg={s.tiltDeg} />
      </motion.div>

      {/* star sphere (black) */}
      <div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: s.r * 2,
          height: s.r * 2,
          transform: "translate(-50%,-50%)",
          background:
            "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.28), rgba(0,0,0,1) 62%, rgba(0,0,0,1) 100%)",
          boxShadow: "0 10px 20px rgba(0,0,0,0.16)",
        }}
      />

      {/* subtle halo (not magnetosphere) */}
      <div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: s.r * 2.4,
          height: s.r * 2.4,
          transform: "translate(-50%,-50%)",
          background: "radial-gradient(circle, rgba(0,0,0,0.18), rgba(0,0,0,0) 70%)",
          filter: "blur(0.35px)",
          opacity: 0.75,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function BinaryGlyph({ s }: { s: BinarySprite }) {
  const [hover, setHover] = useState(false);

  const box = (s.orbitR + s.rP + s.rC) * 2 + 36;

  return (
    <div
      className="relative"
      style={{ width: box, height: box }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label="binary system"
    >
      {/* orbital rotation */}
      <motion.div
        className="absolute left-1/2 top-1/2"
        style={{ width: 1, height: 1 }}
        animate={{ rotate: 360 }}
        transition={{ duration: hover ? s.hoverOrbitSec : s.baseOrbitSec, repeat: Infinity, ease: "linear" }}
      >
        {/* pulsar body */}
        <div className="absolute left-0 top-0" style={{ transform: `translate(${s.orbitR}px, ${-s.orbitR * 0.10}px)` }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: s.spinSec, repeat: Infinity, ease: "linear" }}>
            <div className="relative" style={{ width: s.rP * 2, height: s.rP * 2 }}>
              <Beam len={Math.round(s.orbitR * 2.2)} w={12} alpha={0.14} rotateDeg={0} tiltDeg={16} />
              <Beam len={Math.round(s.orbitR * 2.2)} w={12} alpha={0.14} rotateDeg={180} tiltDeg={16} />
              <div
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{
                  width: s.rP * 2,
                  height: s.rP * 2,
                  transform: "translate(-50%,-50%)",
                  background:
                    "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.26), rgba(0,0,0,1) 62%, rgba(0,0,0,1) 100%)",
                  boxShadow: "0 10px 20px rgba(0,0,0,0.14)",
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* white dwarf */}
        <div className="absolute left-0 top-0" style={{ transform: `translate(${-s.orbitR}px, ${s.orbitR * 0.10}px)` }}>
          <div
            className="rounded-full"
            style={{
              width: s.rC * 2,
              height: s.rC * 2,
              background:
                "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95), rgba(255,255,255,0.55) 60%, rgba(0,0,0,0.12) 100%)",
              boxShadow: hover ? "0 14px 28px rgba(0,0,0,0.18)" : "0 10px 20px rgba(0,0,0,0.12)",
              border: "1px solid rgba(0,0,0,0.10)",
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}

export function HeroPulsars({ theme }: { theme: Theme }) {
  // IMPORTANT: no early return before hooks.
  const enabled = theme === "light";

  const reduced = usePrefersReducedMotion();
  const sprites = useMemo(() => makePulsars(), []);
  const binaries = useMemo(() => makeBinaries(), []);

  const { vw, vh } = useViewport();
  const { x, y } = useMouseXYEnabled(enabled && !reduced);

  // smoother + subtler
  const sx = useSpring(x, { stiffness: 140, damping: 30, mass: 0.9 });
  const sy = useSpring(y, { stiffness: 140, damping: 30, mass: 0.9 });

  // subtle parallax ranges (smaller than before)
  const px = useTransform(sx, [0, vw || 1], [-12, 12]);
  const py = useTransform(sy, [0, vh || 1], [-8, 8]);

  // optional: tiny “tilt” adds depth (still subtle)
  const rY = useTransform(sx, [0, vw || 1], [-2.2, 2.2]);
  const rX = useTransform(sy, [0, vh || 1], [1.8, -1.8]);

  const num = (v: any) => (typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : 0);

  // Render nothing in dark mode, but only AFTER hooks executed.
  if (!enabled) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {sprites.map((s) => (
        <motion.div
          key={s.id}
          className="absolute"
          style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%` }}
        >
          {/* OUTER: mouse parallax (no drift here) */}
          <motion.div
            style={{
              x: reduced ? 0 : (px as any),
              y: reduced ? 0 : (py as any),
              rotateX: reduced ? 0 : (rX as any),
              rotateY: reduced ? 0 : (rY as any),
            }}
            transformTemplate={(t) => {
              const tx = num(t.x) * s.depth;
              const ty = num(t.y) * s.depth;
              const rx = num((t as any).rotateX) * s.depth;
              const ry = num((t as any).rotateY) * s.depth;
              return `translate3d(${tx}px, ${ty}px, 0) rotateX(${rx}deg) rotateY(${ry}deg)`;
            }}
          >
            {/* INNER: your existing drift (doesn’t fight the mouse) */}
            <motion.div
              animate={{ y: [0, -6, 0], x: [0, 2, 0] }}
              transition={{ duration: s.driftSec, repeat: Infinity, ease: "easeInOut" }}
            >
              <PulsarGlyph s={s} />
            </motion.div>
          </motion.div>
        </motion.div>
      ))}

      {binaries.map((s) => (
        <motion.div
          key={s.id}
          className="absolute pointer-events-auto"
          style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%` }}
        >
          <motion.div
            style={{
              x: reduced ? 0 : (px as any),
              y: reduced ? 0 : (py as any),
              rotateX: reduced ? 0 : (rX as any),
              rotateY: reduced ? 0 : (rY as any),
            }}
            transformTemplate={(t) => {
              const tx = num(t.x) * s.depth;
              const ty = num(t.y) * s.depth;
              const rx = num((t as any).rotateX) * s.depth;
              const ry = num((t as any).rotateY) * s.depth;
              return `translate3d(${tx}px, ${ty}px, 0) rotateX(${rx}deg) rotateY(${ry}deg)`;
            }}
          >
            <motion.div
              animate={{ y: [0, -5, 0], x: [0, 2.5, 0] }}
              transition={{ duration: s.driftSec, repeat: Infinity, ease: "easeInOut" }}
            >
              <BinaryGlyph s={s} />
            </motion.div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}