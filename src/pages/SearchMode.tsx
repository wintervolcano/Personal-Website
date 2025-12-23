// src/pages/SearchMode.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/cn";
import { usePrefersReducedMotion } from "../lib/motion";
import { ThemeToggle, type Theme } from "../components/themeToggle";

/* -------------------------
   Shared tiny utilities
-------------------------- */
function clamp01(v: number) {
    return Math.max(0, Math.min(1, v));
}

function gauss(x: number, mu: number, sigma: number) {
    const z = (x - mu) / sigma;
    return Math.exp(-0.5 * z * z);
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

/* -------------------------
   Demo model
-------------------------- */
type DemoTarget = {
    name: string;
    f0_hz: number;
    difficulty: "easy" | "medium" | "hard";
};

function difficultyKnobs(d: DemoTarget["difficulty"]) {
    const peakAmp = d === "easy" ? 1.55 : d === "medium" ? 1.25 : 1.05;
    const decoys = d === "easy" ? 2 : d === "medium" ? 4 : 6;
    const tol = d === "easy" ? 0.02 : d === "medium" ? 0.013 : 0.01;
    const peakW = d === "easy" ? 0.0065 : d === "medium" ? 0.005 : 0.0038;
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

// -------------------------
//  Try-it demo component
// -------------------------
function TryItDemo({ theme }: { theme: Theme }) {
    const reduced = usePrefersReducedMotion();

    // Local Browse/Search mode just for this panel
    const [demoTheme, setDemoTheme] = useState<Theme>(theme);
    useEffect(() => {
        setDemoTheme(theme);
    }, [theme]);

    const isDark = demoTheme === "dark";

    const panelRef = useRef<HTMLDivElement | null>(null);
    const tsRef = useRef<HTMLCanvasElement | null>(null);
    const fftRef = useRef<HTMLCanvasElement | null>(null);

    const [locked, setLocked] = useState(false);
    const [status, setStatus] = useState<"idle" | "captured" | "miss" | "hit">("idle");
    const [markerX, setMarkerX] = useState<number | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [showHint, setShowHint] = useState(false);

    // Guided steps:
    // 0 = tell user to click toggle
    // 1 = explain sky / capture
    // 2 = explain FFT / peak click
    // 3 = success summary
    const [guideStep, setGuideStep] = useState<0 | 1 | 2 | 3>(0);

    const scanRef = useRef({ mx: 0, my: 0, nx: 0, ny: 0, nonce: 0 });
    const dirtyRef = useRef(true);

    const frozenRef = useRef<{
        seed: number;
        ts: number[];
        fft: number[];
        nx: number;
        ny: number;
    } | null>(null);

    const computeRef = useRef({
        startMs: performance.now(),
        cpuHrs: 812.4,
        gpuHrs: 96.1,
        diskTB: 2.7,
        candidates: 14320,
    });

    const target: DemoTarget = useMemo(
        () => ({ name: "DEMO PSR J1713+0747", f0_hz: 218.8, difficulty: "medium" }),
        []
    );
    const knobs = useMemo(() => difficultyKnobs(target.difficulty), [target.difficulty]);
    const peakPos = useMemo(() => peakPosForF0(target.f0_hz), [target.f0_hz]);

    // FIXED hotspot near bottom-right of the panel (normalized coords 0..1)
    const hotspot = useMemo(() => ({ hx: 0.99, hy: 0.99 }), []);

    const reset = () => {
        setLocked(false);
        setStatus("idle");
        setMarkerX(null);
        frozenRef.current = null;
        dirtyRef.current = true;
        setToast(null);
        setShowHint(false);
        setGuideStep(0);
    };

    // ESC resets
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                reset();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Mouse tracking inside panel
    useEffect(() => {
        const el = panelRef.current;
        if (!el) return;

        const onMove = (e: MouseEvent) => {
            if (locked) return;
            const r = el.getBoundingClientRect();
            const mx = e.clientX - r.left;
            const my = e.clientY - r.top;
            const nx = clamp01(mx / Math.max(1, r.width));
            const ny = clamp01(my / Math.max(1, r.height));

            const s = scanRef.current;
            scanRef.current = { mx, my, nx, ny, nonce: s.nonce + 1 };
            dirtyRef.current = true;
        };

        el.addEventListener("mousemove", onMove, { passive: true });
        return () => el.removeEventListener("mousemove", onMove as any);
    }, [locked]);

    // Advance guided steps based on state
    useEffect(() => {
        if (demoTheme === "dark" && guideStep === 0) setGuideStep(1);
    }, [demoTheme, guideStep]);

    useEffect(() => {
        if (status === "captured" && guideStep < 2) setGuideStep(2);
        if (status === "hit" && guideStep < 3) {
            setGuideStep(3);
            setShowHint(false);
        }
    }, [status, guideStep]);

    // Hint timer: once panel is in Search Mode, show hint after some time if not solved
    useEffect(() => {
        setShowHint(false);
        if (demoTheme !== "dark") return;
        if (status === "hit") return;

        const id = window.setTimeout(() => setShowHint(true), 20000); // 20s
        return () => window.clearTimeout(id);
    }, [demoTheme, status]);

    // Click background to CAPTURE (only in Search Mode)
    useEffect(() => {
        const el = panelRef.current;
        if (!el) return;

        const onClick = (e: MouseEvent) => {
            if (demoTheme !== "dark") {
                setToast("Flip this demo into Search Mode to start.");
                window.setTimeout(() => setToast(null), 1300);
                return;
            }
            if (locked) return;

            const targetEl = e.target as HTMLElement | null;
            if (!targetEl) return;
            if (targetEl.closest("button,a,canvas,[data-nolock]")) return;

            const s = scanRef.current;

            const liveSeed = hashToUint32(
                `fk:demo:${s.nonce}:${Math.floor(s.mx)}:${Math.floor(s.my)}`
            );

            const dx = s.nx - hotspot.hx;
            const dy = s.ny - hotspot.hy;
            const dist = Math.hypot(dx, dy);
            const proximity = Math.exp(-(dist * dist) / (0.22 * 0.22));
            const hasTarget = true;

            const ts = synthTimeSeries({
                seed: liveSeed ^ 0x13579bdf,
                n: 520,
                mouseX: s.mx,
                mouseY: s.my,
                hasTarget,
                proximity,
                f0_hz: target.f0_hz,
            });

            const fft = synthFFT({
                seed: liveSeed ^ 0x2468ace0,
                bins: Math.max(
                    620,
                    Math.floor(fftRef.current?.getBoundingClientRect().width || 620)
                ),
                peakPos,
                peakAmp: knobs.peakAmp,
                peakW: knobs.peakW,
                decoys: knobs.decoys,
                hasTarget,
                proximity,
                mouseX: s.mx,
                pageLikeSalt: "demo",
            });

            frozenRef.current = { seed: liveSeed, ts, fft, nx: s.nx, ny: s.ny };

            setLocked(true);
            setStatus("captured");
            setMarkerX(null);
            dirtyRef.current = true;
            setShowHint(false);

            setToast("Captured. Now click an FFT peak to attempt detection.");
            window.setTimeout(() => setToast(null), 1600);
        };

        el.addEventListener("click", onClick);
        return () => el.removeEventListener("click", onClick);
    }, [demoTheme, hotspot.hx, hotspot.hy, knobs.decoys, knobs.peakAmp, knobs.peakW, locked, peakPos, target.f0_hz]);

    // Draw loop (FFT disabled in Browse Mode)
    useEffect(() => {
        const ts = tsRef.current;
        const fft = fftRef.current;
        if (!ts || !fft) return;

        const tsCtx = ts.getContext("2d");
        const fftCtx = fft.getContext("2d");
        if (!tsCtx || !fftCtx) return;

        let raf = 0;

        const resize = () => {
            const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

            const tsRect = ts.getBoundingClientRect();
            ts.width = Math.floor(tsRect.width * dpr);
            ts.height = Math.floor(tsRect.height * dpr);
            tsCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const fftRect = fft.getBoundingClientRect();
            fft.width = Math.floor(fftRect.width * dpr);
            fft.height = Math.floor(fftRect.height * dpr);
            fftCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

            dirtyRef.current = true;
        };

        resize();
        window.addEventListener("resize", resize);

        const draw = () => {
            raf = requestAnimationFrame(draw);

            if (!dirtyRef.current && reduced) return;
            if (!dirtyRef.current && locked) return;
            dirtyRef.current = false;

            const tsRect = ts.getBoundingClientRect();
            const fftRect = fft.getBoundingClientRect();
            const w1 = tsRect.width;
            const h1 = tsRect.height;
            const w2 = fftRect.width;
            const h2 = fftRect.height;

            tsCtx.clearRect(0, 0, w1, h1);
            fftCtx.clearRect(0, 0, w2, h2);

            // Browse Mode: only axes + hint, no synth
            if (demoTheme !== "dark") {
                drawAxes(tsCtx, w1, h1, demoTheme);
                drawAxes(fftCtx, w2, h2, demoTheme);

                fftCtx.save();
                fftCtx.fillStyle = "rgba(0,0,0,0.6)";
                fftCtx.font = "600 11px ui-sans-serif, system-ui";
                fftCtx.fillText(
                    "Toggle Search Mode in this panel to start the demo.",
                    12,
                    h2 - 12
                );
                fftCtx.restore();

                return;
            }

            // Search Mode: full synth
            drawAxes(tsCtx, w1, h1, demoTheme);
            drawAxes(fftCtx, w2, h2, demoTheme);

            const line = isDark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.92)";
            const dim = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)";

            const s = scanRef.current;

            const dx = s.nx - hotspot.hx;
            const dy = s.ny - hotspot.hy;
            const dist = Math.hypot(dx, dy);
            const proximity = Math.exp(-(dist * dist) / (0.22 * 0.22));
            const hasTarget = true;

            const liveSeed = hashToUint32(
                `fk:demo:${s.nonce}:${Math.floor(s.mx)}:${Math.floor(s.my)}`
            );

            const useFrozen = locked && frozenRef.current;
            const tsVals = useFrozen
                ? frozenRef.current!.ts
                : synthTimeSeries({
                    seed: liveSeed ^ 0x13579bdf,
                    n: 520,
                    mouseX: s.mx,
                    mouseY: s.my,
                    hasTarget,
                    proximity,
                    f0_hz: target.f0_hz,
                });

            const fftVals = useFrozen
                ? frozenRef.current!.fft
                : synthFFT({
                    seed: liveSeed ^ 0x2468ace0,
                    bins: Math.max(
                        620,
                        Math.floor(fft.getBoundingClientRect().width || 620)
                    ),
                    peakPos,
                    peakAmp: knobs.peakAmp,
                    peakW: knobs.peakW,
                    decoys: knobs.decoys,
                    hasTarget,
                    proximity,
                    mouseX: s.mx,
                    pageLikeSalt: "demo",
                });

            // Time series
            {
                let ymin = Infinity;
                let ymax = -Infinity;
                for (const v of tsVals) {
                    ymin = Math.min(ymin, v);
                    ymax = Math.max(ymax, v);
                }
                const span = Math.max(1e-6, ymax - ymin);
                const topPad = 0.1;
                const botPad = 0.1;
                const toY = (v: number) => {
                    const t = (v - ymin) / span;
                    return (1 - (topPad + t * (1 - topPad - botPad))) * h1;
                };

                tsCtx.save();
                tsCtx.strokeStyle = line;
                tsCtx.lineWidth = 1.4;
                tsCtx.globalAlpha = 0.95;

                tsCtx.beginPath();
                for (let i = 0; i < tsVals.length; i++) {
                    const u = i / (tsVals.length - 1);
                    const xx = u * w1;
                    const yy = toY(tsVals[i]);
                    if (i === 0) tsCtx.moveTo(xx, yy);
                    else tsCtx.lineTo(xx, yy);
                }
                tsCtx.stroke();

                tsCtx.globalAlpha = 0.9;
                tsCtx.fillStyle = dim;
                tsCtx.font = "600 11px ui-sans-serif, system-ui";
                tsCtx.fillText("TIME SERIES (synthetic voltages)", 12, 18);
                tsCtx.restore();
            }

            // FFT
            {
                let ymin = Infinity;
                let ymax = -Infinity;
                for (const v of fftVals) {
                    ymin = Math.min(ymin, v);
                    ymax = Math.max(ymax, v);
                }
                const span = Math.max(1e-6, ymax - ymin);
                const topPad = 0.1;
                const botPad = 0.1;
                const toY = (v: number) => {
                    const t = (v - ymin) / span;
                    return (1 - (topPad + t * (1 - topPad - botPad))) * h2;
                };

                fftCtx.save();
                fftCtx.strokeStyle = line;
                fftCtx.lineWidth = 1.85;
                fftCtx.globalAlpha = 0.95;

                fftCtx.beginPath();
                for (let i = 0; i < fftVals.length; i++) {
                    const u = i / (fftVals.length - 1);
                    const xx = u * w2;
                    const yy = toY(fftVals[i]);
                    if (i === 0) fftCtx.moveTo(xx, yy);
                    else fftCtx.lineTo(xx, yy);
                }
                fftCtx.stroke();

                if (markerX !== null) {
                    fftCtx.save();
                    fftCtx.globalAlpha = 0.85;
                    fftCtx.strokeStyle = isDark
                        ? "rgba(255,255,255,0.70)"
                        : "rgba(0,0,0,0.70)";
                    fftCtx.setLineDash([6, 6]);
                    fftCtx.beginPath();
                    fftCtx.moveTo(markerX * w2, 0);
                    fftCtx.lineTo(markerX * w2, h2);
                    fftCtx.stroke();
                    fftCtx.restore();
                }

                fftCtx.globalAlpha = 0.9;
                fftCtx.fillStyle = dim;
                fftCtx.font = "600 11px ui-sans-serif, system-ui";
                fftCtx.fillText("FOURIER DOMAIN (synthetic)", 12, 18);

                const msg =
                    status === "idle"
                        ? "Move mouse, Capture first, then click an FFT peak. (ESC resets)"
                        : status === "captured"
                            ? "Captured. Click an FFT peak to attempt detection. (ESC resets)"
                            : status === "miss"
                                ? "Miss. Try another peak (still captured). (ESC resets)"
                                : "Detection confirmed.";

                fftCtx.fillText(msg, 12, h2 - 12);
                fftCtx.restore();
            }

            const c = computeRef.current;
            const t = (performance.now() - c.startMs) / 1000;
            c.cpuHrs = 812.4 + t * 0.06;
            c.gpuHrs = 96.1 + t * 0.012;
            c.diskTB = 2.7 + t * 0.0009;
            c.candidates = 14320 + Math.floor(t * 22 + proximity * 3);
        };

        raf = requestAnimationFrame(draw);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
        };
    }, [demoTheme, isDark, knobs.decoys, knobs.peakAmp, knobs.peakW, locked, markerX, peakPos, reduced, status, target.f0_hz, hotspot.hx, hotspot.hy]);

    const handleFFTClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (demoTheme !== "dark") {
            setToast("Turn on Search Mode in this panel first.");
            window.setTimeout(() => setToast(null), 1300);
            return;
        }

        if (!locked) {
            setToast("Capture first: click the background once.");
            window.setTimeout(() => setToast(null), 1300);
            return;
        }

        const el = fftRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const u = clamp01((e.clientX - rect.left) / rect.width);
        setMarkerX(u);

        const d = Math.min(
            Math.abs(u - peakPos),
            Math.abs(u - clamp01(peakPos * 2)),
            Math.abs(u - clamp01(peakPos * 3))
        );

        if (d <= knobs.tol) {
            setStatus("hit");
            setShowHint(false);
            setToast("✅ Detection confirmed — nice catch.");
            window.setTimeout(() => setToast(null), 1600);
        } else {
            setStatus("miss");
            const lines = [
                "Close! Astronomers have missed worse on real nights.",
                "Nope — that peak was just noise cosplaying as science.",
                "Wrong peak, right spirit. Try again.",
                "That one’s an impostor. Find the one that stays narrow.",
                "Not this bin. The Universe is teasing you today.",
            ];
            setToast(lines[Math.floor(Math.random() * lines.length)]);
            window.setTimeout(() => setToast(null), 1700);
        }
    };

    const cardBg = isDark ? "border-white/20 bg-black" : "border-black/10 bg-black/5";
    const faint = isDark ? "text-white/65" : "text-black/65";
    const c = computeRef.current;

    const glass = isDark
        ? "backdrop-blur-md bg-white/10 border border-white/25 text-white"
        : "backdrop-blur-md bg-black/5 border border-black/10 text-black";

    return (
        <div
            ref={panelRef}
            className={cn(
                "relative w-full min-h-[380px] overflow-hidden rounded-[28px] border p-5 sm:p-7",
                cardBg
            )}
        >
            {/* background glows */}
            <div
                className={cn(
                    "absolute inset-0 opacity-70 pointer-events-none",
                    isDark
                        ? "bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_40%),radial-gradient(circle_at_85%_0%,rgba(255,255,255,0.06),transparent_40%)]"
                        : "bg-[radial-gradient(circle_at_30%_20%,rgba(0,0,0,0.06),transparent_40%),radial-gradient(circle_at_85%_0%,rgba(0,0,0,0.04),transparent_40%)]"
                )}
            />

            <div className="relative">
                {/* fixed pulsar hint at bottom-right (after timeout) */}
                {showHint && demoTheme === "dark" && status !== "hit" && (
                    <div
                        className="pointer-events-none absolute z-20"
                        style={{
                            left: `${hotspot.hx * 100}%`,
                            top: `${hotspot.hy * 100}%`,
                            transform: "translate(-50%, -50%)",
                        }}
                    >
                        <div className="flex flex-col items-center gap-1">
                            <div className="h-4 w-4 rounded-full bg-yellow-300 shadow-[0_0_0_6px_rgba(250,204,21,0.35)]" />
                            <div className="rounded-full bg-black/90 text-white text-[10px] px-2 py-1 tracking-[0.16em] uppercase">
                                Try here
                            </div>
                        </div>
                    </div>
                )}

                {/* Guided overlays */}
                {guideStep === 0 && (
                    <div
                        className={cn(
                            "pointer-events-none absolute right-55 -top-5 max-w-xs rounded-2xl px-4 py-3 text-xs sm:text-sm",
                            glass
                        )}
                    >
                        <div className="text-[10px] font-semibold tracking-[0.2em] uppercase opacity-80">
                            Step 1
                        </div>
                        <div className="mt-1">
                            Click this toggle to switch the demo into{" "}
                            <span className="font-semibold">Search Mode</span>.
                        </div>
                    </div>
                )}

                {guideStep === 1 && (
                    <div
                        className={cn(
                            "pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 -translate-y-1/2 max-w-md rounded-2xl px-4 py-3 text-xs sm:text-sm",
                            glass
                        )}
                    >
                        <div className="text-[10px] font-semibold tracking-[0.2em] uppercase opacity-80">
                            Step 2
                        </div>
                        <div className="mt-1">
                            Move over the large “sky” area. When the spectrum looks interesting, click the
                            background once to <span className="font-semibold">capture</span> that position.
                        </div>
                    </div>
                )}

                {guideStep === 2 && (
                    <div
                        className={cn(
                            "pointer-events-none absolute left-1/2 top-[75%] -translate-x-1/2 -translate-y-1/2 max-w-md rounded-2xl px-4 py-3 text-xs sm:text-sm",
                            glass
                        )}
                    >
                        <div className="text-[10px] font-semibold tracking-[0.5em] uppercase opacity-80">
                            Step 3
                        </div>
                        <div className="mt-1">
                            The FFT panel now shows a frozen spectrum. Click a narrow peak to see if it’s the planted pulsar. You can try multiple times without re-capturing. But if you want to recapture another part of the sky, press escape or the reset button. 
                        </div>
                    </div>
                )}

                {guideStep === 3 && (
                    <div
                        className={cn(
                            "pointer-events-none absolute left-1/2 top-6 max-w-xs rounded-2xl px-4 py-3 text-xs sm:text-sm",
                            glass
                        )}
                    >
                        <div className="text-[10px] font-semibold tracking-[0.2em] uppercase opacity-80">
                            Step 4
                        </div>
                        <div className="mt-1">
                            Nice — you’ve found the demo pulsar! On the site, each confirmed detection reveals the detection plot and increments your session tally. 
                        </div>
                    </div>
                )}

                {/* header + controls */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                    <div>
                        <div
                            className={cn(
                                "text-[11px] font-semibold tracking-[0.28em] uppercase",
                                isDark ? "text-white/60" : "text-black/55"
                            )}
                        >
                            Try it demo
                        </div>
                        <div
                            className={cn(
                                "mt-2 text-lg sm:text-2xl font-extrabold tracking-[-0.02em]",
                                isDark ? "text-white" : "text-black"
                            )}
                        >
                            Scan → capture → click the peak
                        </div>
                        <div className={cn("mt-2 text-lg leading-relaxed max-w-[100ch]", faint)}>
                            Move over the “sky” (any non-clickable background). Most positions look like noise.
                            When you think you see a candidate, click the background to{" "}
                            <span className={cn("font-semibold", isDark ? "text-white" : "text-black")}>
                                capture
                            </span>
                            , then click an FFT peak to confirm. Press{" "}
                            <span className={cn("font-semibold", isDark ? "text-white" : "text-black")}>
                                ESC
                            </span>{" "}
                            to reset.
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3" data-nolock>
                        <ThemeToggle theme={demoTheme} setTheme={setDemoTheme} />
                        <div className="flex items-center gap-2">
                            <div
                                className={cn(
                                    "rounded-full border px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase",
                                    isDark
                                        ? "border-white/14 bg-white/5 text-white/80"
                                        : "border-black/10 bg-black/5 text-black/70"
                                )}
                            >
                                {locked ? "CAPTURED" : "LIVE"}
                            </div>
                            <button
                                onClick={reset}
                                className={cn(
                                    "rounded-full border px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase transition-colors",
                                    isDark
                                        ? "border-white/14 bg-white/5 text-white/80 hover:bg-white/10"
                                        : "border-black/10 bg-black text-white hover:bg-black/90"
                                )}
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* main demo layout */}
                <div className="mt-5 grid grid-cols-12 gap-3">
                    <div className="col-span-12 lg:col-span-4">
                        <div
                            className={cn(
                                "rounded-2xl border overflow-hidden",
                                isDark ? "border-white/20 bg-black" : "border-black/10 bg-white/70"
                            )}
                        >
                            <canvas ref={tsRef} className="h-[180px] w-full" data-nolock />
                        </div>

                        <div
                            className={cn(
                                "mt-3 rounded-2xl border p-4",
                                isDark ? "border-white/20 bg-black" : "border-black/10 bg-white/70"
                            )}
                        >
                            <div
                                className={cn(
                                    "text-[11px] font-semibold tracking-[0.28em] uppercase",
                                    isDark ? "text-white/60" : "text-black/55"
                                )}
                            >
                                Simulated compute
                            </div>
                            <div className={cn("mt-2 text-sm leading-relaxed", faint)}>
                                <div>
                                    CPU time:{" "}
                                    <span className={cn("font-semibold", isDark ? "text-white" : "text-black")}>
                                        {c.cpuHrs.toFixed(1)}
                                    </span>{" "}
                                    core-hours
                                </div>
                                <div>
                                    GPU time:{" "}
                                    <span className={cn("font-semibold", isDark ? "text-white" : "text-black")}>
                                        {c.gpuHrs.toFixed(1)}
                                    </span>{" "}
                                    gpu-hours
                                </div>
                                <div>
                                    Disk read:{" "}
                                    <span className={cn("font-semibold", isDark ? "text-white" : "text-black")}>
                                        {c.diskTB.toFixed(3)}
                                    </span>{" "}
                                    TB
                                </div>
                                <div>
                                    Candidates:{" "}
                                    <span className={cn("font-semibold", isDark ? "text-white" : "text-black")}>
                                        {c.candidates.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-8">
                        <div
                            className={cn(
                                "rounded-2xl border overflow-hidden",
                                isDark ? "border-white/20 bg-black" : "border-black/10 bg-white/70"
                            )}
                        >
                            <canvas
                                ref={fftRef}
                                onClick={handleFFTClick}
                                className="h-[180px] w-full cursor-crosshair"
                                data-nolock
                            />
                        </div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div
                                className={cn(
                                    "rounded-2xl border p-4",
                                    isDark ? "border-white/20 bg-black" : "border-black/10 bg-white/70"
                                )}
                            >
                                <div
                                    className={cn(
                                        "text-[11px] font-semibold tracking-[0.28em] uppercase",
                                        isDark ? "text-white/60" : "text-black/55"
                                    )}
                                >
                                    What the panels are
                                </div>
                                <ul className={cn("mt-2 space-y-1 text-sm leading-relaxed", faint)}>
                                    <li>
                                        • <b>Time series</b>: synthetic voltages (noise + occasional spikes).
                                    </li>
                                    <li>
                                        • <b>FFT</b>: power spectrum; narrow peaks suggest periodicity.
                                    </li>
                                    <li>• Most peaks are decoys; the real one strengthens only near a hotspot.</li>
                                </ul>
                            </div>

                            <div
                                className={cn(
                                    "rounded-2xl border p-4",
                                    isDark ? "border-white/20 bg-black" : "border-black/10 bg-white/70"
                                )}
                            >
                                <div
                                    className={cn(
                                        "text-[11px] font-semibold tracking-[0.28em] uppercase",
                                        isDark ? "text-white/60" : "text-black/55"
                                    )}
                                >
                                    Demo target (revealed)
                                </div>
                                <div className={cn("mt-2 text-sm leading-relaxed", faint)}>
                                    <div>
                                        Name:{" "}
                                        <span className={cn("font-semibold", isDark ? "text-white" : "text-black")}>
                                            {target.name}
                                        </span>
                                    </div>
                                    <div>
                                        Planted f₀:{" "}
                                        <span className={cn("font-semibold", isDark ? "text-white" : "text-black")}>
                                            {target.f0_hz.toFixed(1)} Hz
                                        </span>
                                    </div>
                                    <div className={cn("mt-1 text-xs", isDark ? "text-white/50" : "text-black/50")}>
                                        (On the real site, targets are hidden until you solve.)
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toast */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: toast ? 1 : 0, y: toast ? 0 : 8 }}
                    transition={{ duration: 0.22 }}
                    className={cn(
                        "pointer-events-none absolute left-6 right-6 -bottom-4",
                        "rounded-2xl border px-4 py-3 text-sm font-semibold",
                        isDark
                            ? "border-white/12 bg-black/80 text-white/85"
                            : "border-black/10 bg-white/90 text-black/80"
                    )}
                    style={{ display: toast ? "block" : "none" }}
                >
                    {toast}
                </motion.div>
            </div>
        </div>
    );
}



/* -------------------------
   Page (FORCED LIGHT MODE)
-------------------------- */
export function SearchMode({
    theme,
    setTheme,
}: {
    theme: Theme;
    setTheme: (t: Theme) => void;
}) {
    const reduced = usePrefersReducedMotion();
    const navigate = useNavigate();

    // Force light mode while this page is mounted, then restore
    const prevThemeRef = useRef<Theme>(theme);
    useEffect(() => {
        prevThemeRef.current = theme;
    }, [theme]);

    useEffect(() => {
        const prev = prevThemeRef.current;
        if (prev !== "light") setTheme("light");
        return () => {
            setTheme(prevThemeRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const effectiveTheme: Theme = "light";
    const isDark = false;

    const card = isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5";
    const sub = isDark ? "text-white/65" : "text-black/65";

    return (
        <div className={cn("min-h-[100svh] w-full text-justify", "bg-white text-black")}>
            <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-10 sm:py-14">
                <div className="flex items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className={cn(
                            "rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase transition-colors",
                            "border-black/10 bg-black text-white hover:bg-black/90"
                        )}
                    >
                        ← Back
                    </button>

                    <div
                        className={cn(
                            "text-xs font-semibold tracking-[0.32em] uppercase",
                            "text-black/55"
                        )}
                    >
                        Search Mode
                    </div>
                </div>

                <motion.h1
                    className={cn(
                        "mt-8 text-4xl sm:text-6xl font-black tracking-[-0.04em]",
                        "text-black"
                    )}
                    initial={reduced ? undefined : { opacity: 0, y: 10 }}
                    animate={reduced ? undefined : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    What is Search Mode
                </motion.h1>

                <div
                    className={cn(
                        "mt-6 space-y-4 text-base sm:text-2xl leading-relaxed max-w-[100ch]",
                        sub
                    )}
                >
                    <p>
                        Search Mode is a small training tool for pulsar searches. It turns the site into a simple “instrument
                        overlay”: most places are noise, a few places hide periodic signals. Your loop is to scan the noisy
                        data, spot a promising peak in the Fourier spectrum, and lock it to reveal a pulsar.
                    </p>

                    <p>
                        If you already work with pulsar search pipelines, you can scroll straight to the demo panel below to get an understanding of the UI. For everyone else, here’s the short version of what is being simulated.
                    </p>

                    <p>
                        In a real search, a radio telescope records a time series: intensity as a function of time and
                        frequency. The first question is “does anything repeat?”. We use a fast Fourier transform (FFT) to turn
                        the time series into a spectrum of power versus frequency; a periodic signal that is almost invisible in
                        the raw squiggles often shows up as a peak in that spectrum.
                    </p>

                    <p>
                        When an FFT peak looks promising, the next step is to <strong>fold</strong> the data: you cut the time
                        series into chunks one period long and stack them. If the period is right, the pulses line up and the
                        average profile sharpens; if it is wrong, the signal smears away. Folding boosts signal‑to‑noise and
                        lets you inspect stability across time and frequency.
                    </p>

                    <p>
                        Real searches do this at scale. Specialised programs search over many trial periods and dispersion
                        measures, producing <strong>millions</strong> of candidate plots. Machine‑learning models and ranking scores bring this
                        down to thousands that humans actually look at. Each confirmed pulsar sits on top of a lot of telescope
                        time, compute, and careful inspection.
                    </p>

                    <p>
                        Search Mode compresses that entire story into a toy: a single time series, a single FFT panel, a handful
                        of synthetic signals tied to real TRAPUM discoveries, and a simulated stats bar that hints at the hidden
                        cost of real detections. This page stays in <strong>Browse Mode</strong> so you can read and try the demo
                        without turning the full overlay on.
                    </p>
                </div>

                {/* Try-it demo (panel-local Search Mode toggle) */}
                <div className="mt-10">
                    <TryItDemo theme={effectiveTheme} />
                </div>

                <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                </div>

                {/* Video placeholder */}
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
                </div>
            </div>
        </div>
    );
}
