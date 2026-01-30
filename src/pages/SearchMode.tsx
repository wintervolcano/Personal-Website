// Search Mode page.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/cn";
import { usePrefersReducedMotion } from "../lib/motion";
import { usePageMeta } from "../lib/usePageMeta";
import { ThemeToggle, type Theme } from "../components/themeToggle";
import type { Pulsar } from "../lib/pulsars";
import { getTrapumPulsars, type TrapumPulsar } from "../lib/trapumPulsars";
import TutorialOverlay, { type TutorialStep } from "../components/TutorialOverlay";
import TutorialHighlight from "../components/TutorialHighlight";

/* Shared helper utilities */
function clamp01(x: number) {
    return Math.min(1, Math.max(0, x));
}

function cellNoise(i: number, ch: number) {
    // Hash to [0,1).
    let n = (i + 1) * 374761393 + (ch + 1) * 668265263;
    n = (n ^ (n >>> 13)) * 1274126177;
    n = (n ^ (n >>> 16)) >>> 0;
    return n / 4294967296;
}

function gauss(x: number, mu: number, sigma: number) {
    const z = (x - mu) / sigma;
    return Math.exp(-0.5 * z * z);
}

function wrap01(x: number) {
    return ((x % 1) + 1) % 1;
}

function hashToUint32(s: string) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function mulberry32(seed: number) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function drawAxes(ctx: CanvasRenderingContext2D, w: number, h: number, theme: Theme) {
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.globalAlpha = theme === "dark" ? 0.25 : 0.18;
    ctx.strokeStyle = theme === "dark" ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    ctx.globalAlpha = theme === "dark" ? 0.12 : 0.08;
    const step = 32;
    for (let x = step; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, h);
        ctx.stroke();
    }
    for (let y = step; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(w, y + 0.5);
        ctx.stroke();
    }
    ctx.restore();
}

/* Hero-style pulsar glyph */
type PulsarGlyphSprite = {
    r: number;
    beamLen: number;
    beamW: number;
    beamAlpha: number;
    tiltDeg: number;
};

function PulsarBeam({
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
    const rgb = "0,0,0";
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
                    background: `linear-gradient(to top, rgba(${rgb},0), rgba(${rgb},${alpha}))`,
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
                    background: `linear-gradient(to top, rgba(${rgb},0), rgba(${rgb},${alpha * 0.9}))`,
                    filter: "blur(0.15px)",
                    opacity: 0.95,
                }}
            />
        </div>
    );
}

function FoldingPulsarGlyph({ sprite }: { sprite: PulsarGlyphSprite }) {
    const s = sprite;
    return (
        <div className="relative" style={{ width: s.beamLen * 1.5, height: s.beamLen * 1.5 }}>
            <div className="absolute inset-0">
                <PulsarBeam len={s.beamLen} w={s.beamW} alpha={s.beamAlpha} rotateDeg={0} tiltDeg={s.tiltDeg} />
                <PulsarBeam len={s.beamLen} w={s.beamW} alpha={s.beamAlpha} rotateDeg={180} tiltDeg={s.tiltDeg} />
            </div>

            <div
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{
                    width: s.r * 2,
                    height: s.r * 2,
                    transform: "translate(-50%,-50%)",
                    background:
                        "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), rgba(152,196,249,1) 60%, rgba(166,224,248,1) 100%)",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.45)",
                }}
            />

            <div
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{
                    width: s.r * 2.6,
                    height: s.r * 2.6,
                    transform: "translate(-50%,-50%)",
                    background: "radial-gradient(circle, rgba(147,197,253,0.3), rgba(15,23,42,0) 70%)",
                    filter: "blur(0.35px)",
                    opacity: 0.85,
                    pointerEvents: "none",
                }}
            />
        </div>
    );
}

/* Demo model */
type DemoTarget = {
    name: string;
    f0_hz: number;
    difficulty: "easy" | "medium" | "hard";
};

function difficultyKnobs(d: DemoTarget["difficulty"]) {
    // Hard demo targets are more noisy: weaker, narrower peaks and extra decoys.
    const peakAmp = d === "easy" ? 1.55 : d === "medium" ? 1.25 : 0.9;
    const decoys = d === "easy" ? 2 : d === "medium" ? 4 : 7;
    const tol = d === "easy" ? 0.02 : d === "medium" ? 0.013 : 0.009;
    const peakW = d === "easy" ? 0.0065 : d === "medium" ? 0.005 : 0.0034;
    return { peakAmp, decoys, tol, peakW };
}

function peakPosForF0(f0: number) {
    const fMin = 0;
    const fMax = 900;
    return clamp01((f0 - fMin) / (fMax - fMin));
}

function synthTimeSeries(opts: {
    seed: number;
    n: number;
    mouseX: number;
    mouseY: number;
    hasTarget: boolean;
    proximity: number;
    f0_hz: number;
}) {
    const rng = mulberry32(opts.seed);
    const vals = new Array<number>(opts.n);

    let ar = 0;
    const arA = 0.92;

    for (let i = 0; i < opts.n; i++) {
        const u = i / (opts.n - 1);

        const w = (rng() - 0.5) * 1.8;
        ar = arA * ar + (1 - arA) * (rng() - 0.5) * 4.2;
        const spike = rng() < 0.012 ? (0.8 + 2.8 * rng()) * (0.35 + 0.85 * opts.proximity) : 0;

        const mxPhase = (opts.mouseX * 0.0011 + opts.mouseY * 0.0007) * 0.07;
        const targetAmp = opts.hasTarget ? 0.05 + 0.95 * opts.proximity : 0;
        const periodic = opts.hasTarget
            ? Math.sin(2 * Math.PI * (u * (opts.f0_hz / 220) + mxPhase)) * (0.65 * targetAmp)
            : 0;

        vals[i] = 0.55 * w + 0.32 * ar + 0.45 * periodic + spike;
    }

    return vals;
}

function synthFFT(opts: {
    seed: number;
    bins: number;
    peakPos: number;
    peakAmp: number;
    peakW: number;
    decoys: number;
    hasTarget: boolean;
    proximity: number;
    mouseX: number;
    pageLikeSalt: string;
}) {
    const rng = mulberry32(opts.seed);

    const decoyRng = mulberry32(
        hashToUint32(`fk:demo:decoys:${opts.pageLikeSalt}:${opts.seed}`) ^ 0xa5a5a5a5
    );
    const decoyPeaks: number[] = [];
    for (let i = 0; i < opts.decoys; i++) {
        let p = decoyRng();
        const minDist = 0.06;
        if (Math.abs(p - opts.peakPos) < minDist) p = clamp01(p + (p < opts.peakPos ? -minDist : minDist));
        decoyPeaks.push(p);
    }

    const spikeCount = rng() < 0.75 ? (rng() < 0.45 ? 1 : 2) : 0;
    const noiseSpikes: Array<{ p: number; a: number; w: number }> = [];
    for (let i = 0; i < spikeCount; i++) {
        noiseSpikes.push({
            p: rng(),
            a: 0.1 + 0.2 * rng(),
            w: opts.peakW * (1.1 + 0.8 * rng()),
        });
    }

    const vals = new Array<number>(opts.bins);

    const mx = (opts.mouseX / Math.max(1, window.innerWidth || 1)) * 0.08;
    const ampMod = 0.02 + mx;

    for (let i = 0; i < opts.bins; i++) {
        const u = i / (opts.bins - 1);

        const roll = 0.58 + 0.32 * (1 - u);
        const white = (rng() - 0.5) * 0.2;
        const red = Math.sin(u * 7.0 * 2 * Math.PI) * ampMod;

        let y = roll + white + red;

        if (opts.hasTarget) {
            const amp = opts.peakAmp * (0.03 + 0.97 * opts.proximity);
            y += gauss(u, opts.peakPos, opts.peakW) * 0.95 * amp;
            y += gauss(u, clamp01(opts.peakPos * 2), opts.peakW * 0.9) * 0.32 * amp;
            y += gauss(u, clamp01(opts.peakPos * 3), opts.peakW * 0.85) * 0.2 * amp;
        }

        for (const dp of decoyPeaks) {
            const a = (0.1 + 0.12 * rng()) * (0.3 + 0.7 * opts.proximity);
            y += gauss(u, dp, opts.peakW * (0.9 + 0.45 * rng())) * a;
        }

        for (const sp of noiseSpikes) {
            y += gauss(u, sp.p, sp.w) * sp.a;
        }

        vals[i] = y;
    }

    return vals;
}

// Try-it demo component.

function renderDispersionDemo(
    phaseCanvas: HTMLCanvasElement,
    heatCanvas: HTMLCanvasElement,
    dm: number,
    isDark: boolean
) {
    const phaseCtx = phaseCanvas.getContext("2d");
    const heatCtx = heatCanvas.getContext("2d");
    if (!phaseCtx || !heatCtx) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const phaseRect = phaseCanvas.getBoundingClientRect();
    phaseCanvas.width = Math.max(1, Math.floor(phaseRect.width * dpr));
    phaseCanvas.height = Math.max(1, Math.floor(phaseRect.height * dpr));
    phaseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const heatRect = heatCanvas.getBoundingClientRect();
    heatCanvas.width = Math.max(1, Math.floor(heatRect.width * dpr));
    heatCanvas.height = Math.max(1, Math.floor(heatRect.height * dpr));
    heatCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const wHeat = heatRect.width || 1;
    const hHeat = heatRect.height || 1;

    const channels = 64;
    const phaseBins = 256;

    const dmTrue = 60; // pc cm^-3, planted DM

    // Correct cold-plasma dispersion law (nu in MHz):
    // dt(ms) = 4.148808e6 * DM * (nu^-2 - nu_ref^-2)
    const K_MS_MHZ = 4.148808e6;

    // Choose a period large enough to avoid heavy phase wrapping in the band.
    // For DM~60 across 1400-1800 MHz, delay is about 50 ms. So 100 ms gives a nice tilt without too much wrapping.
    const periodMs = 100;

    // Frequency band (MHz), highest at the top, lowest at the bottom.
    const nuHigh = 1800;
    const nuLow = 1400;
    const nuRef = nuHigh;

    const cellW = wHeat / phaseBins;
    const cellH = hHeat / channels;

    const profile = new Array<number>(phaseBins).fill(0);

    // Background.
    heatCtx.clearRect(0, 0, wHeat, hHeat);
    heatCtx.fillStyle = isDark ? "#050712" : "#fffaf5";
    heatCtx.fillRect(0, 0, wHeat, hHeat);

    // Build channel-by-phase intensity using residual delay after trial dedispersion.
    for (let ch = 0; ch < channels; ch++) {
        const frac = ch / Math.max(1, channels - 1);
        const nu = nuHigh - (nuHigh - nuLow) * frac; // MHz (ch=0 to nuHigh)

        const invNu2 = 1 / (nu * nu);
        const invRef2 = 1 / (nuRef * nuRef);

        // Residual after applying trial DM to data dispersed with dmTrue.
        const dtResidualMs = K_MS_MHZ * (dmTrue - dm) * (invNu2 - invRef2);

        // Convert delay to phase shift (rotations), wrap to [0,1).
        let phaseShift = dtResidualMs / periodMs;
        phaseShift = ((phaseShift % 1) + 1) % 1;

        const baseCenter = 0.35; // where the pulse would sit when perfectly dedispersed
        const centerPhase = (baseCenter + phaseShift) % 1;

        for (let i = 0; i < phaseBins; i++) {
            const u = i / Math.max(1, phaseBins - 1);

            const staticNoise = 0.12 * (cellNoise(i, ch) - 0.5);
            const movingIndex = Math.floor((((u + phaseShift) % 1 + 1) % 1) * 512);
            const movingNoise = 0.10 * (cellNoise(movingIndex, ch + 1234) - 0.5);
            const noise = 0.12 + staticNoise + movingNoise;

            const width = 0.022;
            let dPhase = u - centerPhase;
            dPhase = ((dPhase + 0.5) % 1) - 0.5; // shortest distance on the circle
            const pulse = Math.exp(-0.5 * (dPhase / width) ** 2) * 1.2;

            const intensity = noise + pulse;
            profile[i] += intensity;

            const t = clamp01((intensity - 0.2) / 1.5);

            const baseR = isDark ? 28 : 252;
            const baseG = isDark ? 18 : 243;
            const baseB = isDark ? 24 : 236;
            const peakR = isDark ? 252 : 249;
            const peakG = isDark ? 211 : 115;
            const peakB = isDark ? 77 : 22;

            const r = baseR + (peakR - baseR) * t;
            const g = baseG + (peakG - baseG) * t;
            const b = baseB + (peakB - baseB) * t;

            heatCtx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;

            // High freq at the top: ch=0 is top row.
            const x = i * cellW;
            const y = ch * cellH;
            heatCtx.fillRect(x, y, cellW + 0.5, cellH + 0.5);
        }
    }

    // Draw profile.
    const profileCanvasWidth = phaseRect.width || 1;
    const profileCanvasHeight = phaseRect.height || 1;

    phaseCtx.clearRect(0, 0, profileCanvasWidth, profileCanvasHeight);
    phaseCtx.fillStyle = isDark ? "#000000" : "#ffffff";
    phaseCtx.fillRect(0, 0, profileCanvasWidth, profileCanvasHeight);

    let pMin = Infinity;
    let pMax = -Infinity;
    for (let i = 0; i < phaseBins; i++) {
        const v = profile[i] / channels;
        pMin = Math.min(pMin, v);
        pMax = Math.max(pMax, v);
    }
    const span = Math.max(1e-6, pMax - pMin);

    phaseCtx.strokeStyle = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.16)";
    phaseCtx.lineWidth = 1;
    phaseCtx.beginPath();
    phaseCtx.moveTo(0, profileCanvasHeight - 0.5);
    phaseCtx.lineTo(profileCanvasWidth, profileCanvasHeight - 0.5);
    phaseCtx.stroke();

    phaseCtx.strokeStyle = isDark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.9)";
    phaseCtx.lineWidth = 1.4;
    phaseCtx.beginPath();
    for (let i = 0; i < phaseBins; i++) {
        const u = i / Math.max(1, phaseBins - 1);
        const value = (profile[i] / channels - pMin) / span;
        const x = u * profileCanvasWidth;
        const y = (1 - value) * (profileCanvasHeight - 4) + 2;
        if (i === 0) phaseCtx.moveTo(x, y);
        else phaseCtx.lineTo(x, y);
    }
    phaseCtx.stroke();

    // Axes and labels (top is high freq).
    const axisColor = isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.65)";
    heatCtx.strokeStyle = axisColor;
    heatCtx.lineWidth = 1;
    heatCtx.strokeRect(0.5, 0.5, wHeat - 1, hHeat - 1);

    heatCtx.fillStyle = axisColor;
    heatCtx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    heatCtx.textBaseline = "top";
    heatCtx.textAlign = "center";

    const xTicks = 5;
    for (let k = 0; k <= xTicks; k++) {
        const u = k / xTicks;
        const x = u * wHeat;
        heatCtx.beginPath();
        heatCtx.moveTo(x + 0.5, hHeat - 1);
        heatCtx.lineTo(x + 0.5, hHeat - 6);
        heatCtx.stroke();
        heatCtx.fillText(u.toFixed(1), x, hHeat - 14);
    }
    heatCtx.fillText("Pulse phase", wHeat / 2, hHeat - 28);

    heatCtx.textAlign = "left";
    heatCtx.textBaseline = "middle";
    const yTicks = 3;
    for (let k = 0; k <= yTicks; k++) {
        const u = k / yTicks; // u=0 bottom, u=1 top
        const y = (1 - u) * hHeat;
        const fLabel = nuLow + (nuHigh - nuLow) * u; // top shows nuHigh
        heatCtx.beginPath();
        heatCtx.moveTo(0, y + 0.5);
        heatCtx.lineTo(6, y + 0.5);
        heatCtx.stroke();
        heatCtx.fillText(`${Math.round(fLabel)} MHz`, 8, y);
    }

    heatCtx.save();
    heatCtx.translate(16, hHeat / 2);
    heatCtx.rotate(-Math.PI / 2);
    heatCtx.textAlign = "center";
    heatCtx.textBaseline = "top";
    heatCtx.fillText("Frequency", 0, -8);
    heatCtx.restore();
}


function DispersionDemo({ theme }: { theme: Theme }) {
    const phaseRef = useRef<HTMLCanvasElement | null>(null);
    const heatRef = useRef<HTMLCanvasElement | null>(null);
    const [dm, setDm] = useState(0);
    const dmRef = useRef(dm);
    dmRef.current = dm;

    const isDark = theme === "dark";

    useEffect(() => {
        const phaseCanvas = phaseRef.current;
        const heatCanvas = heatRef.current;
        if (!phaseCanvas || !heatCanvas) return;

        const handle = () => {
            renderDispersionDemo(phaseCanvas, heatCanvas, dmRef.current, isDark);
        };

        handle();
        window.addEventListener("resize", handle);
        return () => window.removeEventListener("resize", handle);
    }, [theme]);

    useEffect(() => {
        const phaseCanvas = phaseRef.current;
        const heatCanvas = heatRef.current;
        if (!phaseCanvas || !heatCanvas) return;
        renderDispersionDemo(phaseCanvas, heatCanvas, dm, isDark);
    }, [dm, theme, isDark]);

    return (
        <div
            className={cn(
                "mt-4 w-full rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 text-left",
                isDark ? "border-white/20 bg-black" : "border-black/10 bg-white/70"
            )}
        >
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/70">
                Interactive: dispersion vs dedispersion
            </div>
            <div className="mt-2 text-xs sm:text-sm text-black/70">
                The bottom panel shows intensity as a function of pulse phase (horizontal) and frequency channel (vertical). The
                top panel shows the phase‑averaged profile. Adjust the DM to smear or align the pulse across channels.
            </div>
            <div className="mt-3 flex flex-col gap-2">
                <canvas ref={phaseRef} className="h-[80px] w-full" />
                <canvas ref={heatRef} className="h-[220px] w-full" />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs sm:text-sm text-black/70">
                    When the DM is correct, the bright pulse column becomes vertical and the profile sharpens. Moving away from
                    that value tilts the pulse and blurs the average.
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">
                        DM
                    </span>
                    <input
                        type="range"
                        min={0}
                        max={120}
                        value={dm}
                        onChange={(e) => setDm(Number(e.target.value))}
                        className="w-40 md:w-48 accent-black"
                    />
                    <span className="text-xs tabular-nums text-black/70">{dm.toFixed(0)} pc cm⁻³</span>
                </div>
            </div>
        </div>
    );
}

function TimeZoomDemo({ theme }: { theme: Theme }) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [showPulse, setShowPulse] = useState(false);

    const series = useMemo(() => {
        const n = 4096;
        const periodSamples = 120;
        const rng = mulberry32(0x12345678);
        const noise = new Array<number>(n);
        const pulse = new Array<number>(n);

        for (let i = 0; i < n; i++) {
            const noiseWide = (rng() - 0.5) * 3.0;
            const noiseFine = (rng() - 0.5) * 0.6;
            noise[i] = noiseWide + noiseFine;

            const phase = (i / periodSamples) % 1;
            let d = phase - 0.8;
            d = ((d + 0.5) % 1) - 0.5;
            pulse[i] = Math.exp(-0.5 * (d / 0.035) * (d / 0.035));
        }

        return { noise, pulse, periodSamples };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.max(1, Math.floor(rect.width * dpr));
        canvas.height = Math.max(1, Math.floor(rect.height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const w = rect.width || 1;
        const h = rect.height || 1;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = theme === "dark" ? "#020617" : "#ffffff";
        ctx.fillRect(0, 0, w, h);

        const { noise, pulse } = series;
        const n = noise.length;

        const pulseScale = showPulse ? 3.0 : 0.5;

        let min = Infinity;
        let max = -Infinity;
        for (let i = 0; i < n; i++) {
            const v = noise[i] + pulse[i] * pulseScale;
            if (v < min) min = v;
            if (v > max) max = v;
        }
        const spanY = Math.max(1e-6, max - min);

        ctx.strokeStyle = theme === "dark" ? "rgba(148,163,184,0.4)" : "rgba(148,163,184,0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h - 0.5);
        ctx.lineTo(w, h - 0.5);
        ctx.stroke();

        ctx.strokeStyle = theme === "dark" ? "#e5e7eb" : "#020617";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        const steps = w;
        for (let ix = 0; ix < steps; ix++) {
            const u = ix / Math.max(1, steps - 1);
            const idx = u * (n - 1);
            const i0 = Math.max(0, Math.min(n - 1, Math.floor(idx)));
            const v = noise[i0] + pulse[i0] * pulseScale;
            const t = (v - min) / spanY;
            const x = u * w;
            const y = (1 - t) * (h - 8) + 4;
            if (ix === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        const approxPeriods = (n / 120).toFixed(0);
        ctx.fillStyle = theme === "dark" ? "rgba(148,163,184,0.8)" : "rgba(15,23,42,0.8)";
        ctx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textBaseline = "top";
        ctx.textAlign = "left";
        ctx.fillText(
            `~${approxPeriods} rotations in view · pulses ${showPulse ? "highlighted" : "hidden in the noise"
            }`,
            8,
            6
        );
    }, [series, showPulse, theme]);

    const isDark = theme === "dark";

    return (
        <div
            className={cn(
                "mt-4 w-full rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 text-left",
                isDark ? "border-white/20 bg-black" : "border-black/10 bg-white/70"
            )}
        >
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/70">
                Interactive: reveal the hidden pulses
            </div>
            <div className="mt-2 text-xs sm:text-sm text-black/70">
                At first, this looks like pure noise. Toggle the pulses on to see that small, regularly spaced spikes were hiding
                in the time series all along.
            </div>
            <div className="mt-3">
                <canvas ref={canvasRef} className="h-[140px] w-full" />
            </div>
            <div className="mt-4 flex items-center gap-3">
                <motion.button
                    type="button"
                    onClick={() => setShowPulse((v) => !v)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    className={cn(
                        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold tracking-[0.18em] uppercase transition-colors",
                        showPulse
                            ? "border-black bg-black text-white hover:bg-black/90"
                            : "border-black/15 bg-black/5 text-black hover:bg-black/10"
                    )}
                >
                    {showPulse ? "Hide pulses" : "Show pulses"}
                </motion.button>
                <span className="text-xs text-black/70">
                    Pulses are always there; this toggle simply makes the repeating peaks bold against the noisy baseline by reducing the noise.
                </span>
            </div>
        </div>
    );
}

function FftDemo({ theme }: { theme: Theme }) {
    const timeCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const freqCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [freq, setFreq] = useState(5); // cycles across the window.
    const [showHarmonics, setShowHarmonics] = useState(false);

    const isDark = theme === "dark";

    useEffect(() => {
        const timeCanvas = timeCanvasRef.current;
        const freqCanvas = freqCanvasRef.current;
        if (!timeCanvas || !freqCanvas) return;

        const timeCtx = timeCanvas.getContext("2d");
        const freqCtx = freqCanvas.getContext("2d");
        if (!timeCtx || !freqCtx) return;

        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

        const tRect = timeCanvas.getBoundingClientRect();
        timeCanvas.width = Math.max(1, Math.floor(tRect.width * dpr));
        timeCanvas.height = Math.max(1, Math.floor(tRect.height * dpr));
        timeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const fRect = freqCanvas.getBoundingClientRect();
        freqCanvas.width = Math.max(1, Math.floor(fRect.width * dpr));
        freqCanvas.height = Math.max(1, Math.floor(fRect.height * dpr));
        freqCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const wT = tRect.width || 1;
        const hT = tRect.height || 1;
        const wF = fRect.width || 1;
        const hF = fRect.height || 1;

        const N = 256;
        const noiseAmp = 1.2;
        const pulseAmp = 1.3;
        const rng = mulberry32(0xfeedf00d);

        const timeData = new Array<number>(N);
        for (let n = 0; n < N; n++) {
            const t = n / N;
            const base = pulseAmp * Math.sin(2 * Math.PI * freq * t);

            let harmonics = 0;
            if (showHarmonics) {
                for (let h = 2; h <= 5; h++) {
                    const ampScale = 1 / h;
                    harmonics += ampScale * Math.sin(2 * Math.PI * (h * freq) * t);
                }
            }

            const noise = noiseAmp * (rng() - 0.5);
            timeData[n] = base + harmonics + noise;
        }

        let min = Infinity;
        let max = -Infinity;
        for (let i = 0; i < N; i++) {
            const v = timeData[i];
            if (v < min) min = v;
            if (v > max) max = v;
        }
        const spanY = Math.max(1e-6, max - min);

        timeCtx.clearRect(0, 0, wT, hT);
        timeCtx.fillStyle = isDark ? "#020617" : "#ffffff";
        timeCtx.fillRect(0, 0, wT, hT);

        timeCtx.strokeStyle = isDark ? "rgba(148,163,184,0.4)" : "rgba(148,163,184,0.5)";
        timeCtx.lineWidth = 1;
        timeCtx.beginPath();
        timeCtx.moveTo(0, hT / 2);
        timeCtx.lineTo(wT, hT / 2);
        timeCtx.stroke();

        timeCtx.strokeStyle = isDark ? "#e5e7eb" : "#020617";
        timeCtx.lineWidth = 1.2;
        timeCtx.beginPath();
        for (let i = 0; i < N; i++) {
            const u = i / Math.max(1, N - 1);
            const v = (timeData[i] - min) / spanY;
            const x = u * wT;
            const y = (1 - v) * (hT - 8) + 4;
            if (i === 0) timeCtx.moveTo(x, y);
            else timeCtx.lineTo(x, y);
        }
        timeCtx.stroke();

        const re = new Array<number>(N).fill(0);
        const im = new Array<number>(N).fill(0);
        for (let k = 0; k < N; k++) {
            let sumRe = 0;
            let sumIm = 0;
            for (let n = 0; n < N; n++) {
                const ang = (-2 * Math.PI * k * n) / N;
                const v = timeData[n];
                sumRe += v * Math.cos(ang);
                sumIm += v * Math.sin(ang);
            }
            re[k] = sumRe;
            im[k] = sumIm;
        }

        const mag = new Array<number>(N / 2);
        let maxMag = 0;
        for (let k = 0; k < N / 2; k++) {
            const m = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
            mag[k] = m;
            if (m > maxMag) maxMag = m;
        }
        const spanMag = Math.max(1e-6, maxMag);

        freqCtx.clearRect(0, 0, wF, hF);
        freqCtx.fillStyle = isDark ? "#020617" : "#ffffff";
        freqCtx.fillRect(0, 0, wF, hF);

        freqCtx.strokeStyle = isDark ? "rgba(148,163,184,0.4)" : "rgba(148,163,184,0.5)";
        freqCtx.lineWidth = 1;
        freqCtx.beginPath();
        freqCtx.moveTo(0, hF - 0.5);
        freqCtx.lineTo(wF, hF - 0.5);
        freqCtx.stroke();

        const baseColor = isDark ? "#e5e7eb" : "#020617";
        const highlightColor = isDark ? "#f97316" : "#b91c1c";

        const barW = wF / (N / 2);
        for (let k = 0; k < N / 2; k++) {
            const u = k / Math.max(1, N / 2 - 1);
            const v = mag[k] / spanMag;
            const x = u * wF;
            const hBar = v * (hF - 12);

            const isFundamental = Math.abs(k - freq) < 0.6;
            let isHarmonic = false;
            if (showHarmonics) {
                for (let h = 2; h <= 5; h++) {
                    if (Math.abs(k - h * freq) < 0.6) {
                        isHarmonic = true;
                        break;
                    }
                }
            }

            freqCtx.fillStyle = isFundamental || isHarmonic ? highlightColor : baseColor;
            freqCtx.fillRect(x, hF - hBar - 1, barW * 0.9, hBar);
        }

        freqCtx.fillStyle = isDark ? "rgba(148,163,184,0.9)" : "rgba(15,23,42,0.9)";
        freqCtx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        freqCtx.textBaseline = "top";
        freqCtx.textAlign = "left";
        freqCtx.fillText(
            `Peak at k ≈ ${freq.toFixed(1)} · harmonics ${showHarmonics ? "2–5×f₀ on" : "off"}`,
            8,
            4
        );
    }, [freq, showHarmonics, isDark]);

    return (
        <div
            className={cn(
                "mt-4 w-full rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 text-left",
                isDark ? "border-white/20 bg-black" : "border-black/10 bg-white/70"
            )}
        >
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/70">
                Interactive: time vs frequency
            </div>
            <div className="mt-2 text-xs sm:text-sm text-black/70">
                The left plot shows a noisy sinusoid in time. The right plot shows its discrete Fourier transform; a narrow spike
                appears at the frequency that matches the repeating pattern.
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/60">
                        Time domain
                    </div>
                    <canvas ref={timeCanvasRef} className="mt-2 h-[120px] w-full" />
                </div>
                <div>
                    <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/60">
                        Frequency domain (|X[k]|)
                    </div>
                    <canvas ref={freqCanvasRef} className="mt-2 h-[120px] w-full" />
                </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">
                        Frequency bin k
                    </span>
                    <input
                        type="range"
                        min={2}
                        max={30}
                        value={freq}
                        onChange={(e) => setFreq(Number(e.target.value))}
                        className="w-40 md:w-48 accent-black"
                    />
                    <span className="text-xs tabular-nums text-black/70">k ≈ {freq}</span>
                </div>
                <label className="flex items-center gap-2 text-xs text-black/75">
                    <input
                        type="checkbox"
                        checked={showHarmonics}
                        onChange={(e) => setShowHarmonics(e.target.checked)}
                        className="h-3 w-3"
                    />
                    Add harmonics up to 5f₀ (extra spikes)
                </label>
            </div>
        </div>
    );
}


function FoldingLighthouseDemo({ theme }: { theme: Theme }) {
    const timeCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const foldCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [rotationsShown, setRotationsShown] = useState(0);

    const isDark = theme === "dark";

    const model = useMemo(() => {
        const rotations = 40;
        const samplesPerRot = 96;
        const totalSamples = rotations * samplesPerRot;
        const rng = mulberry32(0x9e3779b9);
        const samples = new Array<number>(totalSamples);

        for (let i = 0; i < totalSamples; i++) {
            const rot = Math.floor(i / samplesPerRot);
            const phase = (i % samplesPerRot) / samplesPerRot;

            const noiseWide = (rng() - 0.5) * 2.2;
            const noiseFine = (rng() - 0.5) * 0.7;
            const noise = noiseWide + noiseFine;

            const jitter = (rng() - 0.5) * 0.015;
            let d = phase - (0.78 + jitter);
            d = ((d + 0.5) % 1) - 0.5;
            const pulse = Math.exp(-0.5 * (d / 0.03) * (d / 0.03)) * 2.0;

            samples[i] = noise + pulse;
        }

        return { samples, rotations, samplesPerRot };
    }, []);

    useEffect(() => {
        const timeCanvas = timeCanvasRef.current;
        const foldCanvas = foldCanvasRef.current;
        if (!timeCanvas || !foldCanvas) return;

        const timeCtx = timeCanvas.getContext("2d");
        const foldCtx = foldCanvas.getContext("2d");
        if (!timeCtx || !foldCtx) return;

        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

        const tRect = timeCanvas.getBoundingClientRect();
        timeCanvas.width = Math.max(1, Math.floor(tRect.width * dpr));
        timeCanvas.height = Math.max(1, Math.floor(tRect.height * dpr));
        timeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const fRect = foldCanvas.getBoundingClientRect();
        foldCanvas.width = Math.max(1, Math.floor(fRect.width * dpr));
        foldCanvas.height = Math.max(1, Math.floor(fRect.height * dpr));
        foldCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const wT = tRect.width || 1;
        const hT = tRect.height || 1;
        const wF = fRect.width || 1;
        const hF = fRect.height || 1;

        const { samples, rotations, samplesPerRot } = model;
        const maxSamples = rotations * samplesPerRot;
        const usedRotations = Math.max(0, Math.min(rotations, rotationsShown));
        const usedSamples = Math.max(0, Math.min(maxSamples, usedRotations * samplesPerRot));

        timeCtx.clearRect(0, 0, wT, hT);
        timeCtx.fillStyle = isDark ? "#020617" : "#ffffff";
        timeCtx.fillRect(0, 0, wT, hT);

        if (usedSamples === 0) {
            timeCtx.strokeStyle = isDark ? "rgba(148,163,184,0.4)" : "rgba(148,163,184,0.5)";
            timeCtx.beginPath();
            timeCtx.moveTo(0, hT / 2);
            timeCtx.lineTo(wT, hT / 2);
            timeCtx.stroke();

            foldCtx.clearRect(0, 0, wF, hF);
            foldCtx.fillStyle = isDark ? "#000000" : "#ffffff";
            foldCtx.fillRect(0, 0, wF, hF);
            return;
        }

        let min = Infinity;
        let max = -Infinity;
        for (let i = 0; i < usedSamples; i++) {
            const v = samples[i];
            if (v < min) min = v;
            if (v > max) max = v;
        }
        const span = Math.max(1e-6, max - min);

        timeCtx.strokeStyle = isDark ? "rgba(148,163,184,0.4)" : "rgba(148,163,184,0.5)";
        timeCtx.lineWidth = 1;
        timeCtx.beginPath();
        timeCtx.moveTo(0, hT - 0.5);
        timeCtx.lineTo(wT, hT - 0.5);
        timeCtx.stroke();

        timeCtx.strokeStyle = isDark ? "#e5e7eb" : "#020617";
        timeCtx.lineWidth = 1.2;
        timeCtx.beginPath();
        for (let i = 0; i < usedSamples; i++) {
            const u = i / Math.max(1, maxSamples - 1);
            const v = (samples[i] - min) / span;
            const x = u * wT;
            const y = (1 - v) * (hT - 8) + 4;
            if (i === 0) timeCtx.moveTo(x, y);
            else timeCtx.lineTo(x, y);
        }
        timeCtx.stroke();

        const phaseBins = 96;
        const accum = new Array<number>(phaseBins).fill(0);
        const counts = new Array<number>(phaseBins).fill(0);
        for (let i = 0; i < usedSamples; i++) {
            const phase = (i % samplesPerRot) / samplesPerRot;
            const bin = Math.max(0, Math.min(phaseBins - 1, Math.floor(phase * phaseBins)));
            accum[bin] += samples[i];
            counts[bin] += 1;
        }

        const folded = new Array<number>(phaseBins);
        for (let b = 0; b < phaseBins; b++) {
            folded[b] = counts[b] > 0 ? accum[b] / counts[b] : 0;
        }

        let fMin = Infinity;
        let fMax = -Infinity;
        for (let b = 0; b < phaseBins; b++) {
            const v = folded[b];
            if (v < fMin) fMin = v;
            if (v > fMax) fMax = v;
        }
        const fSpan = Math.max(1e-6, fMax - fMin);

        foldCtx.clearRect(0, 0, wF, hF);
        foldCtx.fillStyle = isDark ? "#000000" : "#ffffff";
        foldCtx.fillRect(0, 0, wF, hF);

        foldCtx.strokeStyle = isDark ? "rgba(148,163,184,0.4)" : "rgba(148,163,184,0.5)";
        foldCtx.lineWidth = 1;
        foldCtx.beginPath();
        foldCtx.moveTo(0, hF - 0.5);
        foldCtx.lineTo(wF, hF - 0.5);
        foldCtx.stroke();

        foldCtx.strokeStyle = isDark ? "#e5e7eb" : "#020617";
        foldCtx.lineWidth = 1.5;
        foldCtx.beginPath();
        for (let b = 0; b < phaseBins; b++) {
            const u = b / Math.max(1, phaseBins - 1);
            const v = (folded[b] - fMin) / fSpan;
            const x = u * wF;
            const y = (1 - v) * (hF - 8) + 4;
            if (b === 0) foldCtx.moveTo(x, y);
            else foldCtx.lineTo(x, y);
        }
        foldCtx.stroke();

        foldCtx.fillStyle = isDark ? "rgba(148,163,184,0.9)" : "rgba(15,23,42,0.9)";
        foldCtx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        foldCtx.textBaseline = "top";
        foldCtx.textAlign = "left";
        foldCtx.fillText(
            `${usedRotations} rotations folded · pulse builds up as time passes`,
            8,
            4
        );
    }, [model, rotationsShown, isDark]);

    const handleAddRotation = () => {
        setRotationsShown((n) => Math.min(model.rotations, n + 1));
    };

    const handleReset = () => {
        setRotationsShown(0);
    };

    return (
        <div
            className={cn(
                "mt-4 w-full rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 text-left",
                isDark ? "border-white/20 bg-black" : "border-black/10 bg-white/70"
            )}
        >
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/70">
                Interactive: lighthouse folding
            </div>
            <div className="mt-2 text-xs sm:text-sm text-black/70">
                Think of the pulsar as a spinning lighthouse. Each time the beam sweeps past you, it adds a small spike to the
                time series. On the right, those spikes are folded on top of each other until a stable pulse profile appears.
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:items-center">
                <div className="flex w-full items-center gap-4">
                    <motion.div
                        className="flex h-24 w-24 items-center justify-center"
                        animate={{ rotate: rotationsShown * 360 }}
                        transition={{ type: "spring", stiffness: 140, damping: 18, mass: 0.8 }}
                    >
                        <FoldingPulsarGlyph
                            sprite={{ r: 10, beamLen: 60, beamW: 10, beamAlpha: 0.2, tiltDeg: 18 }}
                        />
                    </motion.div>
                    <div className="flex-1">
                        <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/60">
                            Time series
                        </div>
                        <canvas ref={timeCanvasRef} className="mt-2 h-[110px] w-full" />
                    </div>
                </div>
                <div>
                    <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/60">
                        Folded profile (accumulated pulse)
                    </div>
                    <canvas ref={foldCanvasRef} className="mt-2 h-[110px] w-full" />
                </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
                <motion.button
                    type="button"
                    onClick={handleAddRotation}
                    disabled={rotationsShown >= model.rotations}
                    whileHover={rotationsShown >= model.rotations ? undefined : { scale: 1.03 }}
                    whileTap={rotationsShown >= model.rotations ? undefined : { scale: 0.96 }}
                    className={cn(
                        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold tracking-[0.18em] uppercase transition-colors",
                        rotationsShown >= model.rotations
                            ? "border-black/20 bg-black/5 text-black/40 cursor-not-allowed"
                            : "border-black bg-black text-white hover:bg-black/90"
                    )}
                >
                    Add rotation
                </motion.button>
                <motion.button
                    type="button"
                    onClick={handleReset}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    className={cn(
                        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold tracking-[0.18em] uppercase transition-colors",
                        "border-black/15 bg-black/5 text-black hover:bg-black/10"
                    )}
                >
                    Reset
                </motion.button>
                <span className="text-xs text-black/70">
                    Rotations folded: {rotationsShown} / {model.rotations}
                </span>
            </div>
        </div>
    );
}


/* Page setup (forced light mode) */
export function SearchMode({
    theme,
    setTheme,
    onDemoSolved,
    hotspotPositions = [],
    isMobile = false,
}: {
    theme: Theme;
    setTheme: (t: Theme) => void;
    onDemoSolved?: (p: Pulsar, stats?: { candidates: number; cpuHrs: number; gpuHrs: number; dataTB: number }) => void;
    hotspotPositions?: Array<{ x: number; y: number }>;
    isMobile?: boolean;
}) {
    const reduced = usePrefersReducedMotion();
    const navigate = useNavigate();

    // Tutorial state
    const [tutorialActive, setTutorialActive] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    const [tutorialCompleted, setTutorialCompleted] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [mouseMoveCount, setMouseMoveCount] = useState(0);
    const [hasClickedToCapture, setHasClickedToCapture] = useState(false);
    const [hasDetectedPulsar, setHasDetectedPulsar] = useState(false);

    // Get a hotspot position for the tutorial hint
    // We use the first available hotspot - SearchOverlay ensures these positions are accurate
    const getHotspotForHint = () => {
        if (hotspotPositions.length === 0) return null;
        // Return the first hotspot - TutorialHighlight will handle bounds checking
        return hotspotPositions[0];
    };

    // Track mouse movement for tutorial progress
    useEffect(() => {
        const handleMouseMove = () => {
            setMouseMoveCount((prev) => prev + 1);
        };

        if (tutorialActive && theme === "dark") {
            window.addEventListener("mousemove", handleMouseMove);
            return () => window.removeEventListener("mousemove", handleMouseMove);
        }
    }, [tutorialActive, theme]);

    // Track clicks on page background to detect capture attempts during tutorial
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            // Only track when tutorial is active
            if (!tutorialActive) return;

            const target = e.target as HTMLElement | null;
            // Check if click is NOT on interactive elements (buttons, links, panels, etc.)
            const isInteractive = !!target?.closest(
                'a,button,input,textarea,select,summary,[role="button"],[role="link"],[data-ui="nav"],[data-ui="search-overlay"],[data-nolock]'
            );

            // Only count clicks on page background (not interactive) that are near a hotspot
            if (!isInteractive && hotspotPositions.length > 0) {
                // Check if click is near any hotspot (within 150px radius to match detection area)
                const clickX = e.clientX;
                const clickY = e.clientY + window.scrollY;

                const isNearHotspot = hotspotPositions.some(hotspot => {
                    const dx = clickX - hotspot.x;
                    const dy = clickY - hotspot.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    return distance <= 150; // Match the 150px detection radius
                });

                // Only advance tutorial if click was near a hotspot
                if (isNearHotspot) {
                    setHasClickedToCapture(true);
                }
            }
        };

        if (tutorialActive && theme === "dark") {
            window.addEventListener("click", handleClick, true);
            return () => window.removeEventListener("click", handleClick, true);
        }
    }, [tutorialActive, theme, hotspotPositions]);

    // Reset capture flag when step changes
    useEffect(() => {
        setHasClickedToCapture(false);
        setHasDetectedPulsar(false);
    }, [currentStep]);

    // Detect when discovery modal opens using MutationObserver for tutorial auto-advance
    useEffect(() => {
        if (!tutorialActive) return;

        let detected = false;

        // Optimized check for the discovery modal
        const checkForModal = () => {
            if (detected) return true;

            // Use more specific selector: fixed elements with high z-index that contain modal content
            // Check for the "Close" button with X icon which is unique to the discovery modal
            const closeButton = document.querySelector('button[aria-label="Close"]');
            if (closeButton && closeButton.closest('.fixed')) {
                detected = true;
                setHasDetectedPulsar(true);
                return true;
            }

            // Fallback: check for elements with specific text (but limit scope)
            const fixedElements = document.querySelectorAll('.fixed[role="dialog"], .fixed');
            for (const el of fixedElements) {
                // Use faster check: only check first 500 chars of textContent
                const text = (el.textContent || '').substring(0, 500);
                if (text.includes('Esc to close') && (text.includes('TRAPUM') || text.includes('Detection'))) {
                    detected = true;
                    setHasDetectedPulsar(true);
                    return true;
                }
            }
            return false;
        };

        // Use MutationObserver to detect when modal appears immediately
        const observer = new MutationObserver(() => {
            if (!detected) {
                checkForModal();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        // Also check immediately and periodically as backup (faster polling)
        checkForModal();
        const interval = setInterval(() => {
            if (!detected) {
                checkForModal();
            }
        }, 50); // Reduced from 200ms to 50ms for faster response

        return () => {
            observer.disconnect();
            clearInterval(interval);
        };
    }, [tutorialActive]);

    // Check localStorage on mount (don't auto-show if completed)
    useEffect(() => {
        const completed = localStorage.getItem("fk_tutorial_v1_completed");
        const skipped = localStorage.getItem("fk_tutorial_v1_skipped");
        if (completed || skipped) {
            setTutorialActive(false);
            setTutorialCompleted(!!completed);
        }
    }, []);

    const effectiveTheme: Theme = theme;
    const isDark = theme === "dark";

    const card = isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5";
    const sub = isDark ? "text-white/65" : "text-black/65";

    usePageMeta(
        "Search Mode – Learn how pulsar searches work",
        "A guided, interactive demo of pulsar searching. Watch synthetic data, click FFT peaks, and reveal real TRAPUM discoveries while learning how search-mode pipelines behave."
    );

    // Tutorial steps configuration
    const tutorialSteps: TutorialStep[] = useMemo(
        () => [
            {
                id: "welcome",
                title: "Welcome to Search Mode",
                content:
                    "Find hidden pulsars by analyzing synthetic radio signals. This tutorial will guide you through a proxy of the real detection process used by astronomers.",
                action: "Start Tutorial",
                canAutoAdvance: false,
            },
            {
                id: "toggle-theme",
                title: "Activate Search Mode",
                content:
                    "Click the theme toggle (stars icon) in the top-right navigation to switch to dark mode. This activates the signal processing instruments at the bottom of your screen.",
                canAutoAdvance: true,
                checkProgress: () => theme === "dark",
            },
            {
                id: "understand-time-domain",
                title: "Panel 1: Time Domain",
                content:
                    "The left panel shows raw voltage readings over time. This is the noisy signal as it comes from the telescope. Pulsars are buried in this noise and nearly impossible to see directly.",
                action: "Next",
            },
            {
                id: "understand-fft",
                title: "Panel 2: Frequency Domain (FFT)",
                content:
                    "The middle panel shows the Fourier Transform - it converts time data into frequency data after cleaning the data. Periodic signals (like pulsar pulses) appear as narrow PEAKS. This is where you'll spot pulsars!",
                action: "Next",
            },
            {
                id: "understand-stats",
                title: "Panel 3: Statistics",
                content:
                    "The right panel shows simulated computational resources: CPU/GPU hours, disk space, and candidate counts. These numbers show how expensive and time consuming real pulsar searches are!",
                action: "Got it",
            },
            {
                id: "scan-find-peak",
                title: "Scan the Sky for Pulsars",
                content:
                    "Move your mouse slowly across the page background - this is your telescope scanning the sky! Watch the panels change. Most FFT peaks are just noise and disappear as you move. But when you find a PERSISTENT narrow peak that stays visible, you've found a pulsar! Try scrolling down to uncover more sky. A hint marker will appear after 15 seconds to guide you to one. Click the sky where the persistent peak is to capture the data.",
                canAutoAdvance: true,
                checkProgress: () => hasClickedToCapture,
            },
            {
                id: "capture-and-analyze",
                title: "Capture & Analyze the Signal",
                content:
                    "Great! The spectrum freezed and status changed to 'Captured'. Now look at the middle FFT panel - real pulsars show very narrow, tall peaks. Wider bumps are noise. Click directly on the tallest, narrowest peak in the FFT to confirm the pulsar! Press ESC anytime to reset and try again.",
                canAutoAdvance: true,
                checkProgress: () => hasDetectedPulsar,
            },
            {
                id: "discovery-modal",
                title: "Discovery Modal",
                content:
                    "The modal shows: pulsar name (real TRAPUM discovery!), your detection accuracy, global rank (who else found it), and the actual fold plot from the telescope. TRAPUM is a real pulsar survey that uses MeerKAT Telescope. This is real data!",
                action: "Amazing!",
            },
            {
                id: "success",
                title: "Congratulations, Astronomer!",
                content:
                    "You've detected a real pulsar using the same signal processing techniques as astronomers! You can download the detection image and share on socials too. Scroll down to read about actual search methods, then explore the entire website in search mode - every page hides pulsars waiting to be discovered.",
                action: "Finish Tutorial",
                canAutoAdvance: false,
            },
        ],
        [theme, mouseMoveCount]
    );

    // Handle tutorial navigation
    const handleTutorialNext = () => {
        if (currentStep < tutorialSteps.length - 1) {
            setCurrentStep(currentStep + 1);
            setShowHint(false);
        } else {
            setTutorialCompleted(true);
            setTutorialActive(false);
            localStorage.setItem("fk_tutorial_v1_completed", "true");
        }
    };

    const handleTutorialPrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            setShowHint(false);
        }
    };

    const handleTutorialSkip = () => {
        setTutorialActive(false);
        localStorage.setItem("fk_tutorial_v1_skipped", "true");
    };

    const handleTutorialComplete = () => {
        setTutorialCompleted(true);
        setTutorialActive(false);
        localStorage.setItem("fk_tutorial_v1_completed", "true");
    };

    // Hint system - show hint after delay on specific steps
    useEffect(() => {
        setShowHint(false);
        if (!tutorialActive) return;

        const step = tutorialSteps[currentStep];

        // Toggle theme hint - show after 10 seconds
        if (step.id === "toggle-theme") {
            const timer = setTimeout(() => setShowHint(true), 10000);
            return () => clearTimeout(timer);
        }

        // Scan for peak hint - show after 15 seconds or after 30 mouse moves
        if (step.id === "scan-find-peak") {
            const timer = setTimeout(() => setShowHint(true), 15000);
            return () => clearTimeout(timer);
        }
    }, [currentStep, tutorialActive, tutorialSteps]);

    // Also show hint on scan-find-peak step after user has moved mouse 30+ times
    useEffect(() => {
        if (tutorialSteps[currentStep]?.id === "scan-find-peak" && mouseMoveCount >= 30) {
            setShowHint(true);
        }
    }, [mouseMoveCount, currentStep, tutorialSteps]);

    return (
        <div
            className={cn(
                "min-h-[100svh] w-full text-justify",
                isDark ? "bg-black text-white" : "bg-white text-black"
            )}
        >
            <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-10 sm:py-14">
                <div className="flex items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className={cn(
                            "rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase transition-colors",
                            isDark
                                ? "border-white/20 bg-white text-black hover:bg-white/90"
                                : "border-black/10 bg-black text-white hover:bg-black/90"
                        )}
                    >
                        ← Back
                    </button>

                    {/* Tutorial Button - replaces "Search Mode" subheading, hidden on mobile */}
                    {!isMobile && !tutorialActive && (
                        <button
                            onClick={() => {
                                setTutorialActive(true);
                                setTutorialCompleted(false);
                                setCurrentStep(0);
                                setMouseMoveCount(0);
                                localStorage.removeItem("fk_tutorial_v1_skipped");
                            }}
                            className={cn(
                                "rounded-full border px-6 py-2.5 text-xs font-semibold tracking-[0.18em] uppercase transition-all",
                                "text-white border-transparent will-change-transform",
                                "hover:-translate-y-[3px] hover:brightness-110 active:translate-y-0",
                                isDark
                                    ? "bg-[linear-gradient(135deg,#22d3ee,#a855f7)] shadow-[0_0_30px_rgba(34,211,238,0.55)]"
                                    : "bg-[linear-gradient(135deg,#4f46e5,#ec4899)] shadow-[0_0_26px_rgba(79,70,229,0.45)]"
                            )}
                        >
                            {tutorialCompleted ? "Restart Tutorial" : "Start Tutorial"}
                        </button>
                    )}

                    {/* Show Search Mode text when tutorial is active or on mobile (where tutorial is disabled) */}
                    {(tutorialActive || isMobile) && (
                        <div
                            className={cn(
                                "text-xs font-semibold tracking-[0.32em] uppercase",
                                isDark ? "text-white/55" : "text-black/55"
                            )}
                        >
                            Search Mode
                        </div>
                    )}
                </div>

                <motion.h1
                    className={cn(
                        "mt-8 text-4xl sm:text-6xl font-black tracking-[-0.04em]",
                        isDark ? "text-white" : "text-black"
                    )}
                    initial={reduced ? undefined : { opacity: 0, y: 10 }}
                    animate={reduced ? undefined : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    What is Search Mode
                </motion.h1>

                <div
                    className={cn(
                        "mt-6 space-y-4 text-base sm:text-xl leading-relaxed max-w-[110ch]",
                        sub
                    )}
                >
                    <p>
                        Search Mode on this website is inspired by one of the most beautiful detective stories in astrophysics:
                        how we search for pulsars in the noise of the universe. <strong>The entire website hides real pulsars</strong> discovered by the
                        TRAPUM survey, waiting for you to find them using the same signal processing techniques astronomers use.
                        A pulsar search is the process radio astronomers use to sift through huge streams of telescope data to find
                        the <strong>regular heartbeats of dead stars.</strong> This page walks through how those searches work and
                        connects that logic directly to the interactive Search Mode you can experience.
                    </p>

                    <p>
                        <strong>New here?</strong> Click the "Start Tutorial" button above to learn how to detect your first pulsar
                        through an interactive walkthrough. The tutorial will guide you step-by-step: activating search mode,
                        understanding the signal panels, scanning for persistent peaks, and making your first detection.
                        For everyone else, this page provides a detailed explanation of pulsars, time series, FFTs, folding,
                        and search algorithms.
                    </p>

                    <h2 className="mt-6 text-xl sm:text-2xl font-extrabold tracking-[-0.02em] text-black">
                        How Search Mode works
                    </h2>
                    <p>
                        The point of Search Mode is not that this site is secretly running real pulsar searches in the browser.
                        Those are done by big back‑end pipelines on telescope clusters. Instead, Search Mode borrows the{" "}
                        <strong>structure</strong> of a pulsar search to give you a tactile sense of how much work sits behind a single detection.
                    </p>
                    <p>
                        In a real survey, computers do the boring parts: they perform FFTs (read more below) on millions of windows, scan every
                        spectrum for narrow peaks, fold huge volumes of data, and rank <strong>millions</strong> of candidates
                        down to a short list humans can inspect. Clicking an FFT peak in Search Mode is a stand‑in for what the
                        code is constantly doing automatically on real data. The difference is that here you get to{" "}
                        <strong>feel</strong> that decision rather than it being hidden in a loop. If you didn't understand a word you just read
                        and want to understand it, <strong>keep reading!</strong> If you're ready to try it, use the tutorial above.
                    </p>

                    <p>
                        Toggle the theme (stars icon) in the navigation bar to activate Search Mode across the entire website.
                        Every page hides pulsars at different locations. Move your mouse across the page background to scan for signals,
                        click to capture when you find a persistent peak, then click the peak in the FFT spectrum to confirm your detection.
                        Each confirmed discovery reveals real telescope data and adds to your detection count.
                    </p>

                    {/* 1. Pulsars */}
                    <h2 className="mt-4 text-xl sm:text-2xl font-extrabold tracking-[-0.02em] text-black">
                        1. What is a pulsar?
                    </h2>
                    <p>
                        A <strong>pulsar</strong> is a rapidly spinning neutron star – the ultra‑dense remnant left behind when a
                        massive star explodes in a supernova. It is only about 10-20 km across, but packs more mass than our Sun
                        into that tiny volume. Many pulsars spin hundreds of times per second and have magnetic fields strong
                        enough to beam radio waves out from their magnetic poles.
                    </p>
                    <p>
                        If one of those beams happens to sweep across Earth as the star spins, we see a pulse of radio waves
                        every rotation like a cosmic lighthouse. Because the rotation is extremely stable, those pulses can be
                        more precise than atomic clocks. Pulsar searches are therefore about a single question: given a huge,
                        noisy data stream from a telescope, can we find the periodic heartbeat of one of these stars?
                    </p>

                    {/* 2. Time series and noise */}
                    <h2 className="mt-4 text-xl sm:text-2xl font-extrabold tracking-[-0.02em] text-black">
                        2. Time series: what telescopes actually record
                    </h2>
                    <p>
                        A radio telescope does not directly output “pulsars” or “no pulsars”. It records a{" "}
                        <strong>time series</strong> (well not really, but this description is good for now): signal intensity measured at regular time steps. At each step we record one
                        number, so the data look like a long sequence:
                        <br />
                        <code className="mt-1 inline-block px-1 rounded bg-black/5 text-[0.9em]">
                            x[0], x[1], x[2], …, x[N‑1]
                        </code>
                        .
                    </p>
                    <p>Two important knobs describe this time series:</p>
                    <ul className="list-disc pl-5 space-y-1 text-left inline-block">
                        <li>
                            <strong>Sampling interval (Δt)</strong> - how much time elapses between samples.
                        </li>
                        <li>
                            <strong>Sampling rate (fₛ)</strong> - how many samples we record per second (fₛ = 1 / Δt).
                        </li>
                    </ul>
                    <p>
                        The data are dominated by noise: random fluctuations from the receiver electronics, the sky background,
                        and human‑made interference. The pulsar signal, if it is there at all; is typically a tiny, repeating
                        pattern buried in that noise.
                    </p>

                    <TimeZoomDemo theme={effectiveTheme} />

                    {/* 3. Dispersion and dedispersion */}
                    <h2 className="mt-6 text-xl sm:text-2xl font-extrabold tracking-[-0.02em] text-black">
                        3. Dispersion and dedispersion
                    </h2>
                    <p>
                        Radio pulses travel through the ionised gas between stars, the interstellar medium. On the way, lower
                        radio frequencies are delayed more than higher ones. This effect is called <strong>dispersion</strong>.
                        Its strength depends on the <strong>dispersion measure (DM)</strong>, roughly the number of free electrons
                        along the line of sight.
                    </p>
                    <p>In practice, the telescope records data in many narrow frequency channels. Because of dispersion:</p>
                    <ul className="list-disc pl-5 space-y-1 text-left inline-block">
                        <li>Pulses in the highest‑frequency channels arrive earliest.</li>
                        <li>Lower‑frequency channels show the same pulses, but shifted later in time.</li>
                    </ul>
                    <p>
                        If we simply sum all channels without correcting this, the pulse gets smeared out and becomes harder to
                        detect. So, search pipelines perform <strong>dedispersion</strong>: they try a grid of DM values, and for
                        each DM they shift every frequency channel in time so that the pulses should line up again before
                        summing.
                    </p>

                    <DispersionDemo theme={effectiveTheme} />

                    {/* 4. FFTs and spectra */}
                    <h2 className="mt-6 text-xl sm:text-2xl font-extrabold tracking-[-0.02em] text-black">
                        4. FFTs: turning time into frequency
                    </h2>
                    <p>
                        Once we have a dedispersed time series for a particular DM, the main question becomes:{" "}
                        <em>does anything repeat?</em> Looking at the raw time series by eye is not very effective, especially
                        when the signal is weak. Instead, we transform the data into the <strong>frequency domain</strong>.
                    </p>
                    <p>
                        The mathematical tool here is the <strong>discrete Fourier transform (DFT)</strong>. It converts the time
                        series x[n] into a set of complex numbers X[k], one for each discrete frequency bin indexed by{" "}
                        <code className="mx-1 px-1 rounded bg-black/5 text-[0.9em]">k</code>. The magnitude of X[k] tells us how
                        much power the signal has at that bin’s frequency. A strictly periodic signal with period
                        <code className="mx-1 px-1 rounded bg-black/5 text-[0.9em]">P</code> seconds corresponds to a frequency{" "}
                        <code className="mx-1 px-1 rounded bg-black/5 text-[0.9em]">f = 1 / P</code>, so in the spectrum we expect
                        a peak at that frequency.
                    </p>
                    <p>
                        Computing the DFT directly is expensive for large N, so pulsar searches use the{" "}
                        <strong>fast Fourier transform (FFT)</strong>, an algorithm that reduces the work from O(N²) operations
                        to O(N log N). That efficiency is critical because real searches process huge data sets.
                    </p>
                    <p>
                        Pulsar pulses are not perfect sinusoids; they are typically short, sharp bursts. That means their power is
                        spread over several <strong>harmonics</strong> – multiples of the base frequency (2f, 3f, 4f, …). Many
                        search pipelines therefore perform <strong>harmonic summing</strong>: they combine the power at the
                        fundamental frequency and its harmonics to boost the visibility of the pulsar.
                    </p>

                    <FftDemo theme={effectiveTheme} />

                    {/* 5. Folding */}
                    <h2 className="mt-6 text-xl sm:text-2xl font-extrabold tracking-[-0.02em] text-black">
                        5. Folding: stacking pulses to boost signal
                    </h2>
                    <p>
                        An FFT gives us candidate frequencies (and therefore periods). To check and refine them, pipelines use{" "}
                        <strong>folding</strong>. The idea is simple:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-left inline-block">
                        <li>Take the dedispersed time series and cut it into chunks, each exactly one candidate period long.</li>
                        <li>Align those chunks by phase (from 0 to 1 across one rotation).</li>
                        <li>Average the chunks together for each phase bin.</li>
                    </ul>
                    <p>
                        Noise is random from chunk to chunk, so it tends to cancel out as you average more rotations. The true
                        pulsar pulse, however, always arrives at the same phase, so it adds up coherently. The result is an{" "}
                        <strong>average pulse profile</strong> with a clear peak if the candidate is real.
                    </p>

                    <FoldingLighthouseDemo theme={effectiveTheme} />

                    {/* 6. Search algorithms */}
                    <h2 className="mt-6 text-xl sm:text-2xl font-extrabold tracking-[-0.02em] text-black">
                        6. The pulsar search pipeline
                    </h2>
                    <p>Putting those pieces together, a simplified periodic pulsar search pipeline looks like this:</p>
                    <ol className="list-decimal pl-5 space-y-1 text-left inline-block">
                        <li>Record raw intensity as a function of time and frequency with a radio telescope.</li>
                        <li>Clean the data: remove obvious radio‑frequency interference and normalise the noise.</li>
                        <li>
                            For a grid of DM values, dedisperse the data to produce many time series where pulses should be
                            aligned.
                        </li>
                        <li>
                            For each dedispersed time series, compute an FFT and look for significant peaks, often with harmonic
                            summing.
                        </li>
                        <li>
                            For each promising period and DM, fold the data to produce average pulse profiles and refine the
                            parameters.
                        </li>
                        <li>
                            Rank candidates by signal‑to‑noise, profile shape, consistency across time and frequency, and whether
                            they look like real astrophysical signals rather than interference.
                        </li>
                        <li>
                            Finally, humans and/or machine‑learning systems review the highest‑ranked candidates and confirm new
                            pulsars.
                        </li>
                    </ol>
                    <p>
                        Real surveys extend this further with acceleration searches (for binary systems), single‑pulse searches
                        for bursts, and more, but the core idea remains: pull a faint, periodic pattern out of messy, high‑volume
                        data.
                    </p>

                    <figure className="mt-4 rounded-2xl border border-black/10 bg-black/5 p-4 max-w-[600px] mx-auto text-justfied">
                        <figcaption className="text-xs font-semibold tracking-[0.18em] uppercase text-black/70">
                            Example detection plot
                        </figcaption>
                        <div className="mt-3 overflow-hidden rounded-xl border border-black/10 bg-black/90">
                            <img
                                src="/NGC6626A.png"
                                alt="Sample pulsar detection plot (NGC 6626A) showing time–frequency panels and folded pulse profile."
                                className="w-full h-auto object-contain"
                            />
                        </div>
                        <p className="mt-2 text-sm">
                            This real detection plot for NGC&nbsp;6626A shows what successful candidates look like in practice: a
                            sharp folded profile, consistent signal across time and frequency, and supporting diagnostic panels
                            that humans inspect after the search pipeline has done the heavy lifting.
                        </p>
                    </figure>

                    <p>
                        The overlay UI of moving a cursor over synthetic “sky”, capturing a spectrum, clicking a peak to reveal a
                        pulsar is therefore a tiny, human‑scale version of the real thing. It compresses:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-left inline-block">
                        <li>hours of telescope time into a single panel of fake noise and one planted signal,</li>
                        <li>huge FFT banks into one spectrum that you click by hand,</li>
                        <li>thousands of folds and ranking steps into a single reveal animation,</li>
                        <li>
                            and thousands of anonymous candidates into a small set of memorable, named pulsars tied to{" "}
                            <a
                                href="https://www.trapum.org"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:opacity-75 transition-opacity"
                            >
                                TRAPUM
                            </a>{" "}
                            discoveries.
                        </li>
                    </ul>
                    <p>
                        So when you toggle Search Mode, wander across the page, and lock onto a peak, you are not running a full
                        survey, but the interaction mirrors the core loop of one: scan, detect, fold, confirm. The goal is to show you the scale and structure of pulsar searches, not to faithfully reproduce every algorithm.
                    </p>
                </div>


                {/* <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7">
                        <div className={cn("rounded-[28px] border p-5 sm:p-8 h-full", card)}>
                            <div
                                className={cn(
                                    "text-[11px] font-semibold tracking-[0.28em] uppercase",
                                    "text-black/55"
                                )}
                            >
                                How to use the real search mode
                            </div>
                            <ol
                                className={cn(
                                    "mt-4 space-y-2 text-sm sm:text-base leading-relaxed",
                                    sub
                                )}
                            >
                                <li>1) Toggle Search Mode on (site flips into dark sky mode).</li>
                                <li>2) Explore pages — different regions hide different targets.</li>
                                <li>3) When a peak looks compelling, capture and click it to confirm.</li>
                                <li>
                                    4) On success: a discovery reveal appears and your session tally updates.
                                </li>
                            </ol>

                            <div
                                className={cn(
                                    "mt-6 rounded-2xl border p-5",
                                    "border-black/10 bg-white/70"
                                )}
                            >
                                <div className={cn("text-sm font-extrabold", "text-black")}>
                                    Quick checklist
                                </div>
                                <div
                                    className={cn(
                                        "mt-2 text-sm leading-relaxed",
                                        sub
                                    )}
                                >
                                    Prefer narrow peaks; look for harmonics; don’t trust single-bin spikes; after
                                    a miss, try again. Press ESC when you want a clean reset.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5">
                        <div className={cn("rounded-[28px] border p-6 sm:p-9 h-full", card)}>
                            <div
                                className={cn(
                                    "text-[11px] font-semibold tracking-[0.28em] uppercase",
                                    "text-black/55"
                                )}
                            >
                                What’s simulated vs real
                            </div>
                            <ul
                                className={cn(
                                    "mt-4 space-y-2 text-sm sm:text-base leading-relaxed",
                                    sub
                                )}
                            >
                                <li>• Time series + FFT in the demo are synthetic.</li>
                                <li>• Compute/disk stats are simulated to communicate scale.</li>
                                <li>• The discovery plots and pulsars are real.</li>
                            </ul>

                            <div
                                className={cn(
                                    "mt-6 rounded-2xl border p-5",
                                    "border-black/10 bg-white/70"
                                )}
                            >
                                <div className={cn("text-sm font-extrabold", "text-black")}>
                                    Accessibility note
                                </div>
                                <div
                                    className={cn(
                                        "mt-2 text-sm leading-relaxed",
                                        sub
                                    )}
                                >
                                    The demo honors “reduced motion”. If you’d like, you can extend it with a
                                    fully keyboard-driven interaction.
                                </div>
                            </div>
                        </div>
                    </div>
                </div> */}

                {/* Video placeholder
                <div className={cn("mt-10 rounded-[28px] border p-5 sm:p-7", card)}>
                    <div
                        className={cn(
                            "text-[11px] font-semibold tracking-[0.28em] uppercase",
                            "text-black/55"
                        )}
                    >
                        Video walkthrough
                    </div>

                    <div
                        className={cn(
                            "mt-4 overflow-hidden rounded-2xl border",
                            "border-black/10 bg-white/70"
                        )}
                    >
                        <div className="aspect-video w-full flex items-center justify-center">
                            <div className={cn("text-sm font-semibold", "text-black/55")}>
                                Video placeholder (I'll add later)
                            </div>
                        </div>
                    </div>

                    <div className={cn("mt-3 text-sm leading-relaxed", sub)}>
                        Drop in a{" "}
                        <code className={cn("px-1 rounded", "bg-black/10")}>{"<video />"}</code>
                    </div>
                </div> */}
            </div>

            {/* Tutorial Overlay - hidden on mobile */}
            {!isMobile && (
                <TutorialOverlay
                    steps={tutorialSteps}
                    currentStep={currentStep}
                    onNext={handleTutorialNext}
                    onPrevious={handleTutorialPrevious}
                    onSkip={handleTutorialSkip}
                    onComplete={handleTutorialComplete}
                    show={tutorialActive && !tutorialCompleted}
                />
            )}

            {/* Tutorial Highlights - show relevant UI elements for each step, hidden on mobile */}
            {!isMobile && tutorialActive && !tutorialCompleted && (
                <>
                    {/* Highlight theme toggle when explaining it */}
                    {tutorialSteps[currentStep]?.id === "toggle-theme" && (
                        <TutorialHighlight targetSelector=".theme-toggle" show={true} type="box" delay={0} />
                    )}

                    {/* Show hint marker if user is stuck on theme toggle */}
                    {showHint && tutorialSteps[currentStep]?.id === "toggle-theme" && (
                        <TutorialHighlight targetSelector=".theme-toggle" show={showHint} type="marker" delay={0} />
                    )}

                    {/* Highlight panels when explaining them - these will appear when dark mode is active */}
                    {isDark && (
                        <>
                            {/* Time Domain Panel - leftmost panel */}
                            {tutorialSteps[currentStep]?.id === "understand-time-domain" && (
                                <TutorialHighlight
                                    targetSelector='[data-tutorial="time-domain-panel"]'
                                    show={true}
                                    type="box"
                                    delay={0}
                                />
                            )}

                            {/* FFT Panel - middle panel */}
                            {tutorialSteps[currentStep]?.id === "understand-fft" && (
                                <TutorialHighlight
                                    targetSelector='[data-tutorial="fft-panel"]'
                                    show={true}
                                    type="box"
                                    delay={0}
                                />
                            )}

                            {/* Stats Panel - rightmost panel */}
                            {tutorialSteps[currentStep]?.id === "understand-stats" && (
                                <TutorialHighlight
                                    targetSelector='[data-tutorial="stats-panel"]'
                                    show={true}
                                    type="box"
                                    delay={0}
                                />
                            )}

                            {/* Hint for finding persistent peaks - point to first available hotspot */}
                            {showHint && tutorialSteps[currentStep]?.id === "scan-find-peak" && (() => {
                                const hotspot = getHotspotForHint();
                                return hotspot ? (
                                    <TutorialHighlight
                                        position={hotspot}
                                        show={showHint}
                                        type="marker"
                                        delay={0}
                                    />
                                ) : null;
                            })()}
                        </>
                    )}
                </>
            )}
        </div>
    );
}
