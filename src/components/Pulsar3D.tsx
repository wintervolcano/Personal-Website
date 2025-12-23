import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Pulsar } from "../lib/pulsars";
import { hashToUint32, clamp01 } from "../lib/pulsars";

type Theme = "light" | "dark";

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
        pointerEvents: "none",
      }}
    >
      {/* outer beam */}
      <div
        style={{
          width: w,
          height: len,
          transform: "translate(-50%,-100%)",
          marginLeft: "50%",
          borderRadius: 999,
          background: `linear-gradient(to top, rgba(255,255,255,0), rgba(255,255,255,${alpha}))`,
          filter: "blur(0.9px)",
          opacity: 0.98,
        }}
      />
      {/* inner core beam */}
      <div
        style={{
          width: Math.max(4, Math.round(w * 0.33)),
          height: Math.max(34, Math.round(len * 0.48)),
          transform: "translate(-50%,-100%)",
          marginLeft: "50%",
          marginTop: -len + 14,
          borderRadius: 999,
          background: `linear-gradient(to top, rgba(255,255,255,0), rgba(255,255,255,${Math.min(
            0.95,
            alpha * 1.1
          )}))`,
          filter: "blur(0.25px)",
          opacity: 0.95,
        }}
      />
    </div>
  );
}

function MagFieldLines({ size, tiltDeg }: { size: number; tiltDeg: number }) {
  const s = Math.max(240, size);
  const cx = s / 2;
  const cy = s / 2;

  const rX = s * 0.42;
  const rY = s * 0.32;

  const topY = cy - s * 0.22;
  const botY = cy + s * 0.22;

  const paths = [
    `M ${cx} ${topY}
     C ${cx + rX} ${cy - rY}, ${cx + rX} ${cy + rY}, ${cx} ${botY}
     C ${cx - rX} ${cy + rY}, ${cx - rX} ${cy - rY}, ${cx} ${topY}`,
    `M ${cx} ${topY + s * 0.02}
     C ${cx + rX * 0.72} ${cy - rY * 0.78}, ${cx + rX * 0.72} ${cy + rY * 0.78}, ${cx} ${botY - s * 0.02}
     C ${cx - rX * 0.72} ${cy + rY * 0.78}, ${cx - rX * 0.72} ${cy - rY * 0.78}, ${cx} ${topY + s * 0.02}`,
    `M ${cx} ${topY + s * 0.04}
     C ${cx + rX * 0.48} ${cy - rY * 0.55}, ${cx + rX * 0.48} ${cy + rY * 0.55}, ${cx} ${botY - s * 0.04}
     C ${cx - rX * 0.48} ${cy + rY * 0.55}, ${cx - rX * 0.48} ${cy - rY * 0.55}, ${cx} ${topY + s * 0.04}`,
  ];

  return (
    <div
      className="absolute inset-0"
      style={{
        transform: `translateZ(0) rotateX(${Math.max(40, Math.min(72, tiltDeg + 38))}deg)`,
        transformOrigin: "50% 50%",
        pointerEvents: "none",
      }}
    >
      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        className="absolute left-1/2 top-1/2"
        style={{
          transform: "translate(-50%,-50%)",
          filter: "drop-shadow(0 0 10px rgba(255,255,255,0.10))",
        }}
      >
        <defs>
          <linearGradient id="fkFieldFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.26)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.10)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.26)" />
          </linearGradient>
        </defs>

        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="url(#fkFieldFade)"
            strokeWidth={i === 0 ? 2.2 : i === 1 ? 1.8 : 1.5}
            opacity={i === 0 ? 0.28 : i === 1 ? 0.22 : 0.18}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        <path
          d={`M ${cx} ${topY - s * 0.06} C ${cx + s * 0.08} ${topY - s * 0.02}, ${cx - s * 0.08} ${topY + s * 0.03
            }, ${cx} ${topY + s * 0.06}`}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={1.4}
          opacity={0.35}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx} ${botY + s * 0.06} C ${cx + s * 0.08} ${botY + s * 0.02}, ${cx - s * 0.08} ${botY - s * 0.03
            }, ${cx} ${botY - s * 0.06}`}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={1.4}
          opacity={0.35}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

type PulsarSprite = {
  r: number;
  spinSec: number;
  beamLen: number;
  beamW: number;
  beamAlpha: number;
  tiltDeg: number;
};

function PulsarGlyph({ s, animated }: { s: PulsarSprite; animated: boolean }) {
  const box = s.beamLen * 2;

  return (
    <div className="relative" style={{ width: box, height: box }}>
      {/* Everything that must rotate together goes in THIS wrapper */}
      <motion.div
        className="absolute inset-0"
        animate={animated ? { rotate: 360 } : { rotate: 0 }}
        transition={
          animated
            ? { duration: s.spinSec, repeat: Infinity, ease: "linear" }
            : { duration: 0 }
        }
        style={{ pointerEvents: "none" }}
      >
        {/* magnetic field loops rotate EXACTLY with beams */}
        <MagFieldLines size={box} tiltDeg={s.tiltDeg} />

        {/* beams (locked to same rotation) */}
        <Beam len={s.beamLen} w={s.beamW} alpha={s.beamAlpha} rotateDeg={0} tiltDeg={s.tiltDeg} />
        <Beam len={s.beamLen} w={s.beamW} alpha={s.beamAlpha} rotateDeg={180} tiltDeg={s.tiltDeg} />
      </motion.div>

      {/* star sphere (stationary, centered) */}
      <div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: s.r * 2,
          height: s.r * 2,
          transform: "translate(-50%,-50%)",
          background:
            "radial-gradient(circle at 35% 35%, rgba(255,255,255,1), rgba(235,235,235,1) 48%, rgba(190,190,190,1) 75%, rgba(255,255,255,0.92) 100%)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.70), 0 0 22px rgba(255,255,255,0.10)",
        }}
      />

      {/* halo (stationary) */}
      <div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: s.r * 3.0,
          height: s.r * 3.0,
          transform: "translate(-50%,-50%)",
          background: "radial-gradient(circle, rgba(255,255,255,0.12), rgba(255,255,255,0) 70%)",
          filter: "blur(0.8px)",
          opacity: 0.9,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

type BinarySprite = {
  rP: number;
  rC: number;
  orbitR: number;
  baseOrbitSec: number;
  hoverOrbitSec: number;
  spinSec: number;
};

function BinaryGlyph({ s, animated }: { s: BinarySprite; animated: boolean }) {
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
      <motion.div
        className="absolute left-1/2 top-1/2"
        style={{ width: 1, height: 1 }}
        animate={animated ? { rotate: 360 } : { rotate: 0 }}
        transition={
          animated
            ? {
                duration: hover ? s.hoverOrbitSec : s.baseOrbitSec,
                repeat: Infinity,
                ease: "linear",
              }
            : { duration: 0 }
        }
      >
        {/* pulsar body (white) */}
        <div className="absolute left-0 top-0" style={{ transform: `translate(${s.orbitR}px, ${-s.orbitR * 0.10}px)` }}>
          <motion.div
            animate={animated ? { rotate: 360 } : { rotate: 0 }}
            transition={
              animated
                ? { duration: s.spinSec, repeat: Infinity, ease: "linear" }
                : { duration: 0 }
            }
          >
            <div className="relative" style={{ width: s.rP * 2, height: s.rP * 2 }}>
              {/* short-ish white beams */}
              <Beam len={Math.round(s.orbitR * 2.0)} w={12} alpha={0.16} rotateDeg={0} tiltDeg={16} />
              <Beam len={Math.round(s.orbitR * 2.0)} w={12} alpha={0.16} rotateDeg={180} tiltDeg={16} />

              <div
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{
                  width: s.rP * 2,
                  height: s.rP * 2,
                  transform: "translate(-50%,-50%)",
                  background:
                    "radial-gradient(circle at 35% 35%, rgba(255,255,255,1), rgba(235,235,235,1) 52%, rgba(190,190,190,1) 78%, rgba(255,255,255,0.92) 100%)",
                  boxShadow: "0 16px 36px rgba(0,0,0,0.65), 0 0 18px rgba(255,255,255,0.10)",
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* companion (still bright, but with darker shadow) */}
        <div className="absolute left-0 top-0" style={{ transform: `translate(${-s.orbitR}px, ${s.orbitR * 0.10}px)` }}>
          <div
            className="rounded-full"
            style={{
              width: s.rC * 2,
              height: s.rC * 2,
              background:
                "radial-gradient(circle at 35% 35%, rgba(255,255,255,1), rgba(255,255,255,0.65) 60%, rgba(255,255,255,0.20) 100%)",
              boxShadow: hover ? "0 18px 38px rgba(0,0,0,0.60)" : "0 14px 28px rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}

/** ------- Mapping: pulsar parameters → hero-style sprite ------- */
function spriteFromPulsar(p: Pulsar): PulsarSprite {
  // Spin: fast MSPs => ~0.8s, slow => ~3.2s
  const spinSec = clamp01((p.period_ms - 1.2) / (18 - 1.2)) * (3.2 - 0.8) + 0.8;

  // Beam length: f0 0..900 => 130..210 px
  const beamLen = Math.round(130 + clamp01(p.f0_hz / 900) * 80);

  // Difficulty affects beam thickness + alpha
  const diff = p.difficulty;
  const beamW = diff === "easy" ? 18 : diff === "medium" ? 15 : 12;
  const beamAlpha = diff === "easy" ? 0.30 : diff === "medium" ? 0.24 : 0.18;

  // Tilt: stable per id
  const h = hashToUint32(`tilt:${p.id}`) % 1000;
  const tiltDeg = 12 + (h / 1000) * 22; // 12..34

  // Radius: stable per id
  const h2 = hashToUint32(`r:${p.id}`) % 1000;
  const r = 11 + Math.round((h2 / 1000) * 5); // 11..16

  return { r, spinSec, beamLen, beamW, beamAlpha, tiltDeg };
}

function binaryFromPulsar(p: Pulsar): BinarySprite {
  const orbitR = 34 + Math.round(clamp01(p.f0_hz / 900) * 26); // 34..60
  const spinSec = clamp01((p.period_ms - 1.2) / (18 - 1.2)) * (3.2 - 0.9) + 0.9;

  const comp = (p as any).binary?.companion as string | undefined;
  const rC = comp === "NS" ? 10 : 8;

  return {
    rP: 12,
    rC,
    orbitR,
    baseOrbitSec: 3.6,
    hoverOrbitSec: 1.0,
    spinSec,
  };
}

export function DiscoveryPulsarPanel({
  theme,
  pulsar,
  animated = true,
}: {
  theme: Theme;
  pulsar: Pulsar;
  animated?: boolean;
}) {
  const isBinary = !!(pulsar as any)?.binary?.isBinary;

  const ps = useMemo(() => spriteFromPulsar(pulsar), [pulsar]);
  const bs = useMemo(() => binaryFromPulsar(pulsar), [pulsar]);

  // This panel is explicitly dark-styled (per your request)
  return (
    <div className="relative h-[240px] w-full rounded-2xl border border-white/14 bg-black overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.10),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.06),transparent_60%)]" />

      <div className="absolute left-4 top-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-white/60">
        {isBinary ? "BINARY (parameterized)" : "PULSAR (parameterized)"}
      </div>

      {/* centered */}
      <div className="absolute inset-0 grid place-items-center">
        {isBinary ? (
          <BinaryGlyph s={bs} animated={animated} />
        ) : (
          <PulsarGlyph s={ps} animated={animated} />
        )}
      </div>
    </div>
  );
}
