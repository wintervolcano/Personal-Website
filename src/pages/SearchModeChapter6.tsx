// Chapter 6 page: Finding new pulsars.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/cn";
import { usePrefersReducedMotion } from "../lib/motion";
import { usePageMeta } from "../lib/usePageMeta";
import type { Theme } from "../components/themeToggle";
import { MarkdownProse } from "../components/MarkDownProse";
import chapterMarkdown from "../content/book/hbpa-ch6.md?raw";

function clamp01(x: number) {
    return Math.min(1, Math.max(0, x));
}

function gauss(x: number, mu: number, sigma: number) {
    const z = (x - mu) / sigma;
    return Math.exp(-0.5 * z * z);
}

function mulberry32(seed: number) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function drawAxes(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
    ctx.globalAlpha = 0.08;
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

// New utility functions for Chapter 6 components
function sinc(x: number): number {
    return Math.abs(x) < 1e-6 ? 1 : Math.sin(x) / x;
}

function runningMedian(values: number[], windowSize: number): number[] {
    const result = new Array(values.length);
    for (let i = 0; i < values.length; i++) {
        const start = Math.max(0, i - Math.floor(windowSize / 2));
        const end = Math.min(values.length, i + Math.floor(windowSize / 2));
        const window = values.slice(start, end).sort((a, b) => a - b);
        result[i] = window[Math.floor(window.length / 2)];
    }
    return result;
}

function inverseDFT(harmonics: { re: number; im: number }[]): number[] {
    const N = 64;
    const profile = new Array(N).fill(0);
    for (let i = 0; i < N; i++) {
        for (let k = 0; k < harmonics.length; k++) {
            const { re, im } = harmonics[k];
            const angle = (2 * Math.PI * k * i) / N;
            profile[i] += re * Math.cos(angle) - im * Math.sin(angle);
        }
        profile[i] /= N;
    }
    return profile;
}

function calculateTreeOps(channels: number, samples: number): number {
    const stages = Math.log2(channels);
    return samples * stages;
}

function calculateBruteForceOps(channels: number, samples: number): number {
    return channels * channels * (samples / channels);
}

function Callout({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mt-3 rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-xs text-black/70">
            <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/50">{title}</div>
            <div className="mt-1 leading-relaxed">{children}</div>
        </div>
    );
}

type ChapterSection = {
    heading: string;
    level: number;
    markdown: string;
};

function splitMarkdownSections(markdown: string) {
    const sections: ChapterSection[] = [];
    const lines = markdown.split("\n");
    let currentHeading = "";
    let currentLevel = 2;
    let bodyLines: string[] = [];

    const pushSection = () => {
        if (!currentHeading) return;
        const headingLine = `${"#".repeat(currentLevel)} ${currentHeading}`;
        const body = bodyLines.join("\n").trim();
        const sectionMarkdown = [headingLine, body].filter(Boolean).join("\n\n");
        sections.push({ heading: currentHeading, level: currentLevel, markdown: sectionMarkdown });
    };

    for (const line of lines) {
        const match = /^(#{2,5})\s+(.*)$/.exec(line);
        if (match) {
            pushSection();
            currentLevel = match[1].length;
            currentHeading = match[2].trim();
            bodyLines = [];
            continue;
        }
        bodyLines.push(line);
    }

    pushSection();
    return sections;
}

function TreeDedispersionDemo() {
    const treeRef = useRef<HTMLCanvasElement | null>(null);
    const compRef = useRef<HTMLCanvasElement | null>(null);
    const [channels, setChannels] = useState(8);

    const totalSamples = 2048;
    const bruteOps = useMemo(() => calculateBruteForceOps(channels, totalSamples), [channels]);
    const treeOps = useMemo(() => calculateTreeOps(channels, totalSamples), [channels]);
    const ratio = bruteOps / treeOps;

    useEffect(() => {
        const treeCanvas = treeRef.current;
        const compCanvas = compRef.current;
        if (!treeCanvas || !compCanvas) return;

        const treeCtx = treeCanvas.getContext("2d");
        const compCtx = compCanvas.getContext("2d");
        if (!treeCtx || !compCtx) return;

        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

        // Tree canvas
        const treeRect = treeCanvas.getBoundingClientRect();
        treeCanvas.width = Math.max(1, Math.floor(treeRect.width * dpr));
        treeCanvas.height = Math.max(1, Math.floor(treeRect.height * dpr));
        treeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Comparison canvas
        const compRect = compCanvas.getBoundingClientRect();
        compCanvas.width = Math.max(1, Math.floor(compRect.width * dpr));
        compCanvas.height = Math.max(1, Math.floor(compRect.height * dpr));
        compCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const wTree = treeRect.width || 1;
        const hTree = treeRect.height || 1;
        const wComp = compRect.width || 1;
        const hComp = compRect.height || 1;

        // Draw tree structure
        drawAxes(treeCtx, wTree, hTree);

        const stages = Math.log2(channels);
        const levelHeight = (hTree - 40) / (stages + 1);
        const nodeRadius = 8;

        // Color scheme for different stages
        const stageColors = ["rgba(249,115,22,0.9)", "rgba(239,68,68,0.85)", "rgba(168,85,247,0.8)"];

        // Draw tree nodes and connections
        for (let stage = 0; stage <= stages; stage++) {
            const nodesInStage = channels / Math.pow(2, stage);
            const nodeSpacing = wTree / (nodesInStage + 1);
            const y = 20 + stage * levelHeight;

            for (let node = 0; node < nodesInStage; node++) {
                const x = (node + 1) * nodeSpacing;

                // Draw connections to children (if not last stage)
                if (stage < stages) {
                    const childY = 20 + (stage + 1) * levelHeight;
                    const leftChildX = (2 * node + 1) * nodeSpacing / 2;
                    const rightChildX = (2 * node + 2) * nodeSpacing / 2;

                    treeCtx.strokeStyle = "rgba(0,0,0,0.25)";
                    treeCtx.lineWidth = 1.5;
                    treeCtx.beginPath();
                    treeCtx.moveTo(x, y + nodeRadius);
                    treeCtx.lineTo(leftChildX, childY - nodeRadius);
                    treeCtx.stroke();

                    treeCtx.beginPath();
                    treeCtx.moveTo(x, y + nodeRadius);
                    treeCtx.lineTo(rightChildX, childY - nodeRadius);
                    treeCtx.stroke();
                }

                // Draw node
                const colorIdx = Math.min(stage, stageColors.length - 1);
                treeCtx.fillStyle = stageColors[colorIdx];
                treeCtx.beginPath();
                treeCtx.arc(x, y, nodeRadius, 0, Math.PI * 2);
                treeCtx.fill();

                treeCtx.strokeStyle = "rgba(0,0,0,0.3)";
                treeCtx.lineWidth = 1;
                treeCtx.stroke();
            }
        }

        // Labels
        treeCtx.fillStyle = "rgba(0,0,0,0.65)";
        treeCtx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        treeCtx.fillText(`Tree de-dispersion (${channels} channels)`, 8, 12);
        treeCtx.fillText(`Stages: ${stages}`, 8, hTree - 6);

        // Draw comparison bar chart
        drawAxes(compCtx, wComp, hComp);

        const maxOps = Math.max(bruteOps, treeOps);
        const barWidth = (wComp - 100) / 2;
        const barSpacing = 30;

        // Brute-force bar
        const bruteHeight = (bruteOps / maxOps) * (hComp - 60);
        compCtx.fillStyle = "rgba(239,68,68,0.8)";
        compCtx.fillRect(40, hComp - bruteHeight - 30, barWidth, bruteHeight);
        compCtx.fillStyle = "rgba(0,0,0,0.65)";
        compCtx.font = "9px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        compCtx.textAlign = "center";
        compCtx.fillText("Brute-force", 40 + barWidth / 2, hComp - 16);
        compCtx.fillText(`${(bruteOps / 1e6).toFixed(1)}M`, 40 + barWidth / 2, hComp - 4);

        // Tree algorithm bar
        const treeHeight = (treeOps / maxOps) * (hComp - 60);
        compCtx.fillStyle = "rgba(16,185,129,0.8)";
        compCtx.fillRect(40 + barWidth + barSpacing, hComp - treeHeight - 30, barWidth, treeHeight);
        compCtx.fillStyle = "rgba(0,0,0,0.65)";
        compCtx.fillText("Tree", 40 + barWidth + barSpacing + barWidth / 2, hComp - 16);
        compCtx.fillText(`${(treeOps / 1e6).toFixed(1)}M`, 40 + barWidth + barSpacing + barWidth / 2, hComp - 4);

        // Title and ratio
        compCtx.textAlign = "left";
        compCtx.fillText("Operation count comparison", 8, 12);
        compCtx.fillText(`Speedup: ${ratio.toFixed(1)}x`, wComp - 80, 12);

    }, [channels, bruteOps, treeOps, ratio]);

    const channelPresets = [4, 8, 16, 32, 64, 128];

    return (
        <div className="mt-4 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-4 sm:px-5 sm:py-5 text-left">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/70">
                Interactive: Tree de-dispersion algorithm
            </div>
            <div className="mt-2 text-xs sm:text-sm text-black/70">
                The tree algorithm reuses partial sums at each stage, reducing complexity from O(n²) to O(n log n).
            </div>
            <Callout title="How it works">
                The binary tree structure builds larger de-dispersed outputs from smaller ones. Each stage combines pairs of
                channels, reusing computations from the previous stage.
            </Callout>
            <Callout title="Try this">
                Increase channels from 8 to 128 and watch the operation count ratio explode. For 1024 channels, the speedup
                exceeds 100x!
            </Callout>
            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                <canvas ref={treeRef} className="h-[200px] w-full" />
                <canvas ref={compRef} className="h-[200px] w-full" />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">Channels</span>
                    {channelPresets.map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            onClick={() => setChannels(preset)}
                            className={cn(
                                "rounded-lg border px-3 py-1 text-xs font-medium transition-colors",
                                channels === preset
                                    ? "border-black bg-black text-white"
                                    : "border-black/20 bg-white text-black/70 hover:bg-black/5"
                            )}
                        >
                            {preset}
                        </button>
                    ))}
                </div>
                <div className="text-xs text-black/70">
                    Efficiency gain: {ratio.toFixed(1)}x faster
                </div>
            </div>
        </div>
    );
}

function RedNoiseWhiteningDemo() {
    const rawRef = useRef<HTMLCanvasElement | null>(null);
    const whitenedRef = useRef<HTMLCanvasElement | null>(null);
    const [redNoiseStrength, setRedNoiseStrength] = useState(1.2);
    const [medianWindow, setMedianWindow] = useState(32);
    const [signalFreq, setSignalFreq] = useState(0.55);
    const [signalStrength, setSignalStrength] = useState(8.0);

    const { rawSpectrum, whitenedSpectrum, rawSNR, whitenedSNR } = useMemo(() => {
        const length = 256;
        const rng = mulberry32(0xfade);

        // Generate 1/f red noise
        const redNoise = new Array(length);
        for (let i = 0; i < length; i++) {
            const f = (i + 1) / length;
            redNoise[i] = (rng() - 0.5) / Math.pow(f, redNoiseStrength);
        }

        // Add white noise
        const raw = new Array(length);
        for (let i = 0; i < length; i++) {
            raw[i] = redNoise[i] * 0.5 + (rng() - 0.5) * 0.3;
        }

        // Add signal at signalFreq
        const signalBin = Math.floor(signalFreq * length);
        raw[signalBin] += signalStrength;

        // Calculate raw S/N
        const rawMean = raw.reduce((a, b) => a + b, 0) / length;
        const rawVariance = raw.reduce((a, b) => a + (b - rawMean) ** 2, 0) / length;
        const rawStd = Math.sqrt(rawVariance);
        const rawSNR = (raw[signalBin] - rawMean) / rawStd;

        // Whiten spectrum
        const medians = runningMedian(raw, medianWindow);
        const whitened = raw.map((v, i) => v - medians[i]);
        const rms = Math.sqrt(whitened.reduce((a, b) => a + b * b, 0) / whitened.length);
        const normalized = whitened.map((v) => v / rms);

        // Calculate whitened S/N
        const whitenedMean = normalized.reduce((a, b) => a + b, 0) / length;
        const whitenedVariance = normalized.reduce((a, b) => a + (b - whitenedMean) ** 2, 0) / length;
        const whitenedStd = Math.sqrt(whitenedVariance);
        const whitenedSNR = (normalized[signalBin] - whitenedMean) / whitenedStd;

        return {
            rawSpectrum: { values: raw, medians },
            whitenedSpectrum: normalized,
            rawSNR,
            whitenedSNR,
        };
    }, [redNoiseStrength, medianWindow, signalFreq, signalStrength]);

    useEffect(() => {
        const rawCanvas = rawRef.current;
        const whitenedCanvas = whitenedRef.current;
        if (!rawCanvas || !whitenedCanvas) return;

        const rawCtx = rawCanvas.getContext("2d");
        const whitenedCtx = whitenedCanvas.getContext("2d");
        if (!rawCtx || !whitenedCtx) return;

        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

        // Raw spectrum canvas
        const rawRect = rawCanvas.getBoundingClientRect();
        rawCanvas.width = Math.max(1, Math.floor(rawRect.width * dpr));
        rawCanvas.height = Math.max(1, Math.floor(rawRect.height * dpr));
        rawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Whitened spectrum canvas
        const whitenedRect = whitenedCanvas.getBoundingClientRect();
        whitenedCanvas.width = Math.max(1, Math.floor(whitenedRect.width * dpr));
        whitenedCanvas.height = Math.max(1, Math.floor(whitenedRect.height * dpr));
        whitenedCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const wRaw = rawRect.width || 1;
        const hRaw = rawRect.height || 1;
        const wWhite = whitenedRect.width || 1;
        const hWhite = whitenedRect.height || 1;

        // Draw raw spectrum
        drawAxes(rawCtx, wRaw, hRaw);

        const rawMax = Math.max(...rawSpectrum.values);
        const rawMin = Math.min(...rawSpectrum.values);
        const rawSpan = Math.max(1e-6, rawMax - rawMin);

        // Draw spectrum line
        rawCtx.strokeStyle = "rgba(0,0,0,0.85)";
        rawCtx.lineWidth = 1.4;
        rawCtx.beginPath();
        for (let i = 0; i < rawSpectrum.values.length; i++) {
            const u = i / (rawSpectrum.values.length - 1);
            const v = (rawSpectrum.values[i] - rawMin) / rawSpan;
            const x = u * wRaw;
            const y = (1 - v) * (hRaw - 20) + 10;
            if (i === 0) rawCtx.moveTo(x, y);
            else rawCtx.lineTo(x, y);
        }
        rawCtx.stroke();

        // Draw running median overlay
        rawCtx.strokeStyle = "rgba(239,68,68,0.7)";
        rawCtx.setLineDash([4, 4]);
        rawCtx.lineWidth = 1.2;
        rawCtx.beginPath();
        for (let i = 0; i < rawSpectrum.medians.length; i++) {
            const u = i / (rawSpectrum.medians.length - 1);
            const v = (rawSpectrum.medians[i] - rawMin) / rawSpan;
            const x = u * wRaw;
            const y = (1 - v) * (hRaw - 20) + 10;
            if (i === 0) rawCtx.moveTo(x, y);
            else rawCtx.lineTo(x, y);
        }
        rawCtx.stroke();
        rawCtx.setLineDash([]);

        // Mark signal position
        const sigX = signalFreq * wRaw;
        rawCtx.strokeStyle = "rgba(16,185,129,0.8)";
        rawCtx.lineWidth = 1.5;
        rawCtx.beginPath();
        rawCtx.moveTo(sigX, 10);
        rawCtx.lineTo(sigX, hRaw - 20);
        rawCtx.stroke();

        // Labels
        rawCtx.fillStyle = "rgba(0,0,0,0.65)";
        rawCtx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        rawCtx.fillText("Raw spectrum with red noise", 8, 12);
        rawCtx.fillText(`S/N: ${rawSNR.toFixed(1)}`, wRaw - 60, 12);
        rawCtx.fillText("Frequency", wRaw - 58, hRaw - 6);

        // Draw whitened spectrum
        drawAxes(whitenedCtx, wWhite, hWhite);

        const whiteMax = Math.max(...whitenedSpectrum);
        const whiteMin = Math.min(...whitenedSpectrum);
        const whiteSpan = Math.max(1e-6, whiteMax - whiteMin);

        whitenedCtx.strokeStyle = "rgba(0,0,0,0.85)";
        whitenedCtx.lineWidth = 1.4;
        whitenedCtx.beginPath();
        for (let i = 0; i < whitenedSpectrum.length; i++) {
            const u = i / (whitenedSpectrum.length - 1);
            const v = (whitenedSpectrum[i] - whiteMin) / whiteSpan;
            const x = u * wWhite;
            const y = (1 - v) * (hWhite - 20) + 10;
            if (i === 0) whitenedCtx.moveTo(x, y);
            else whitenedCtx.lineTo(x, y);
        }
        whitenedCtx.stroke();

        // Mark signal position
        const sigXWhite = signalFreq * wWhite;
        whitenedCtx.strokeStyle = "rgba(16,185,129,0.8)";
        whitenedCtx.lineWidth = 1.5;
        whitenedCtx.beginPath();
        whitenedCtx.moveTo(sigXWhite, 10);
        whitenedCtx.lineTo(sigXWhite, hWhite - 20);
        whitenedCtx.stroke();

        // Detection threshold line
        const threshold = 5; // 5-sigma
        const thresholdV = (threshold - whiteMin) / whiteSpan;
        const thresholdY = (1 - thresholdV) * (hWhite - 20) + 10;
        whitenedCtx.strokeStyle = "rgba(239,68,68,0.6)";
        whitenedCtx.setLineDash([5, 5]);
        whitenedCtx.lineWidth = 1;
        whitenedCtx.beginPath();
        whitenedCtx.moveTo(0, thresholdY);
        whitenedCtx.lineTo(wWhite, thresholdY);
        whitenedCtx.stroke();
        whitenedCtx.setLineDash([]);

        // Labels
        whitenedCtx.fillStyle = "rgba(0,0,0,0.65)";
        whitenedCtx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        whitenedCtx.fillText("Whitened spectrum", 8, 12);
        whitenedCtx.fillText(`S/N: ${whitenedSNR.toFixed(1)}`, wWhite - 60, 12);
        whitenedCtx.fillText("Frequency", wWhite - 58, hWhite - 6);
        whitenedCtx.fillText("5σ threshold", wWhite - 72, thresholdY - 4);
    }, [rawSpectrum, whitenedSpectrum, signalFreq, rawSNR, whitenedSNR]);

    return (
        <div className="mt-4 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-4 sm:px-5 sm:py-5 text-left">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/70">
                Interactive: Red noise whitening
            </div>
            <div className="mt-2 text-xs sm:text-sm text-black/70">
                Normalize power spectra to achieve zero mean and unit RMS, enabling accurate significance estimation.
            </div>
            <Callout title="Why red noise">
                Receiver fluctuations, sky background, and system instabilities create low-frequency (1/f) noise that dominates
                raw spectra.
            </Callout>
            <Callout title="Try this">
                Crank red noise to 2.0 and watch the raw S/N plummet. Notice how whitening keeps S/N stable by normalizing the
                baseline.
            </Callout>
            <div className="mt-3 flex flex-col gap-3">
                <canvas ref={rawRef} className="h-[140px] w-full" />
                <canvas ref={whitenedRef} className="h-[140px] w-full" />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-xs text-black/75">
                    <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">Red noise</span>
                    <input
                        type="range"
                        min={0.5}
                        max={2.5}
                        step={0.1}
                        value={redNoiseStrength}
                        onChange={(e) => setRedNoiseStrength(Number(e.target.value))}
                        className="w-40 accent-black"
                    />
                    <span className="text-xs tabular-nums text-black/70">{redNoiseStrength.toFixed(1)}</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-black/75">
                    <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">
                        Median window
                    </span>
                    <input
                        type="range"
                        min={8}
                        max={128}
                        step={8}
                        value={medianWindow}
                        onChange={(e) => setMedianWindow(Number(e.target.value))}
                        className="w-40 accent-black"
                    />
                    <span className="text-xs tabular-nums text-black/70">{medianWindow}</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-black/75">
                    <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">Signal freq</span>
                    <input
                        type="range"
                        min={0.1}
                        max={0.9}
                        step={0.05}
                        value={signalFreq}
                        onChange={(e) => setSignalFreq(Number(e.target.value))}
                        className="w-40 accent-black"
                    />
                    <span className="text-xs tabular-nums text-black/70">{signalFreq.toFixed(2)}</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-black/75">
                    <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">Signal power</span>
                    <input
                        type="range"
                        min={2}
                        max={15}
                        step={0.5}
                        value={signalStrength}
                        onChange={(e) => setSignalStrength(Number(e.target.value))}
                        className="w-40 accent-black"
                    />
                    <span className="text-xs tabular-nums text-black/70">{signalStrength.toFixed(1)}</span>
                </label>
            </div>
            <div className="mt-3 text-xs text-black/70">
                Impact: Whitening enables uniform false-alarm probability calculation using χ² distribution.
            </div>
        </div>
    );
}

function ReconstructedProfileDemo() {
    const specRealRef = useRef<HTMLCanvasElement | null>(null);
    const profileRealRef = useRef<HTMLCanvasElement | null>(null);
    const specSpuriousRef = useRef<HTMLCanvasElement | null>(null);
    const profileSpuriousRef = useRef<HTMLCanvasElement | null>(null);
    const [numHarmonics, setNumHarmonics] = useState(8);
    const [randomizePhases, setRandomizePhases] = useState(false);

    const { realHarmonics, spuriousHarmonics, realProfile, spuriousProfile, realSNR, spuriousSNR } = useMemo(() => {
        const N = 64; // profile bins
        const maxH = 16;

        // Generate real signal harmonics with coherent phases
        const truePhase = 0.25; // pulse at phase 0.25
        const realHarms: { amp: number; phase: number }[] = [];
        for (let h = 1; h <= maxH; h++) {
            const amp = Math.abs(sinc(Math.PI * h * 0.08)) * (h <= numHarmonics ? 1.0 : 0.3);
            const phase = -2 * Math.PI * h * truePhase;
            realHarms.push({ amp, phase });
        }

        // Generate spurious harmonics with random phases
        const rng = mulberry32(randomizePhases ? Date.now() : 0x12345);
        const spuriousHarms: { amp: number; phase: number }[] = [];
        for (let h = 1; h <= maxH; h++) {
            const amp = Math.abs(sinc(Math.PI * h * 0.08)) * (h <= numHarmonics ? 1.0 : 0.3);
            const phase = (rng() - 0.5) * 2 * Math.PI;
            spuriousHarms.push({ amp, phase });
        }

        // Reconstruct profiles
        const realProf = new Array(N).fill(0);
        const spuriousProf = new Array(N).fill(0);
        const noise = 0.15;

        for (let i = 0; i < N; i++) {
            for (let h = 0; h < numHarmonics; h++) {
                const realAng = (2 * Math.PI * (h + 1) * i) / N + realHarms[h].phase;
                realProf[i] += realHarms[h].amp * Math.cos(realAng);

                const spurAng = (2 * Math.PI * (h + 1) * i) / N + spuriousHarms[h].phase;
                spuriousProf[i] += spuriousHarms[h].amp * Math.cos(spurAng);
            }
            realProf[i] += (rng() - 0.5) * noise;
            spuriousProf[i] += (rng() - 0.5) * noise;
        }

        // Calculate S/N
        const calcSNR = (prof: number[]) => {
            const mean = prof.reduce((a, b) => a + b, 0) / prof.length;
            const variance = prof.reduce((a, b) => a + (b - mean) ** 2, 0) / prof.length;
            const std = Math.sqrt(variance);
            const peak = Math.max(...prof);
            return (peak - mean) / std;
        };

        return {
            realHarmonics: realHarms,
            spuriousHarmonics: spuriousHarms,
            realProfile: realProf,
            spuriousProfile: spuriousProf,
            realSNR: calcSNR(realProf),
            spuriousSNR: calcSNR(spuriousProf),
        };
    }, [numHarmonics, randomizePhases]);

    useEffect(() => {
        const canvases = [
            { ref: specRealRef, draw: drawRealSpectrum },
            { ref: profileRealRef, draw: drawRealProfile },
            { ref: specSpuriousRef, draw: drawSpuriousSpectrum },
            { ref: profileSpuriousRef, draw: drawSpuriousProfile },
        ];

        canvases.forEach(({ ref, draw }) => {
            const canvas = ref.current;
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
            draw(ctx, w, h);
        });

        function drawRealSpectrum(ctx: CanvasRenderingContext2D, w: number, h: number) {
            drawAxes(ctx, w, h);
            const maxAmp = Math.max(...realHarmonics.map((h) => h.amp));
            const barW = w / realHarmonics.length;

            for (let i = 0; i < realHarmonics.length; i++) {
                const v = realHarmonics[i].amp / maxAmp;
                const barH = v * (h - 28);
                const x = i * barW;
                const y = h - barH - 10;
                ctx.fillStyle = i < numHarmonics ? "rgba(16,185,129,0.85)" : "rgba(0,0,0,0.25)";
                ctx.fillRect(x + barW * 0.2, y, barW * 0.6, barH);
            }

            ctx.fillStyle = "rgba(0,0,0,0.65)";
            ctx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText("Real: Coherent phases", 8, 12);
            ctx.fillText(`S/N: ${realSNR.toFixed(1)}`, w - 60, 12);
        }

        function drawRealProfile(ctx: CanvasRenderingContext2D, w: number, h: number) {
            drawAxes(ctx, w, h);
            const max = Math.max(...realProfile);
            const min = Math.min(...realProfile);
            const span = max - min;

            ctx.strokeStyle = "rgba(16,185,129,0.9)";
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            for (let i = 0; i < realProfile.length; i++) {
                const u = i / (realProfile.length - 1);
                const v = (realProfile[i] - min) / span;
                const x = u * w;
                const y = (1 - v) * (h - 20) + 10;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            ctx.fillStyle = "rgba(0,0,0,0.65)";
            ctx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText("Reconstructed: Sharp pulse", 8, 12);
            ctx.fillText("Phase", w - 42, h - 6);
        }

        function drawSpuriousSpectrum(ctx: CanvasRenderingContext2D, w: number, h: number) {
            drawAxes(ctx, w, h);
            const maxAmp = Math.max(...spuriousHarmonics.map((h) => h.amp));
            const barW = w / spuriousHarmonics.length;

            for (let i = 0; i < spuriousHarmonics.length; i++) {
                const v = spuriousHarmonics[i].amp / maxAmp;
                const barH = v * (h - 28);
                const x = i * barW;
                const y = h - barH - 10;
                ctx.fillStyle = i < numHarmonics ? "rgba(239,68,68,0.85)" : "rgba(0,0,0,0.25)";
                ctx.fillRect(x + barW * 0.2, y, barW * 0.6, barH);
            }

            ctx.fillStyle = "rgba(0,0,0,0.65)";
            ctx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText("Spurious: Random phases", 8, 12);
            ctx.fillText(`S/N: ${spuriousSNR.toFixed(1)}`, w - 60, 12);
        }

        function drawSpuriousProfile(ctx: CanvasRenderingContext2D, w: number, h: number) {
            drawAxes(ctx, w, h);
            const max = Math.max(...spuriousProfile);
            const min = Math.min(...spuriousProfile);
            const span = max - min;

            ctx.strokeStyle = "rgba(239,68,68,0.9)";
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            for (let i = 0; i < spuriousProfile.length; i++) {
                const u = i / (spuriousProfile.length - 1);
                const v = (spuriousProfile[i] - min) / span;
                const x = u * w;
                const y = (1 - v) * (h - 20) + 10;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            ctx.fillStyle = "rgba(0,0,0,0.65)";
            ctx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText("Reconstructed: Flat noise", 8, 12);
            ctx.fillText("Phase", w - 42, h - 6);
        }
    }, [realHarmonics, spuriousHarmonics, realProfile, spuriousProfile, numHarmonics, realSNR, spuriousSNR]);

    return (
        <div className="mt-4 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-4 sm:px-5 sm:py-5 text-left">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/70">
                Interactive: Reconstructed profile validation
            </div>
            <div className="mt-2 text-xs sm:text-sm text-black/70">
                Phase coherence distinguishes real signals from spurious noise harmonics. Reconstruction reveals the truth.
            </div>
            <Callout title="Key insight">
                Real signals have harmonics with coherent phases that all point to the same pulse location. Random noise harmonics
                have random phases and produce no coherent pulse profile.
            </Callout>
            <Callout title="Try this">
                Click "Randomize phases" and watch the spurious profile change completely while the real signal stays sharp. This
                eliminates ~80% of false candidates!
            </Callout>
            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="space-y-3">
                    <canvas ref={specRealRef} className="h-[130px] w-full" />
                    <canvas ref={profileRealRef} className="h-[130px] w-full" />
                </div>
                <div className="space-y-3">
                    <canvas ref={specSpuriousRef} className="h-[130px] w-full" />
                    <canvas ref={profileSpuriousRef} className="h-[130px] w-full" />
                </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-xs text-black/75">
                    <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">Harmonics</span>
                    <input
                        type="range"
                        min={1}
                        max={16}
                        value={numHarmonics}
                        onChange={(e) => setNumHarmonics(Number(e.target.value))}
                        className="w-40 accent-black"
                    />
                    <span className="text-xs tabular-nums text-black/70">{numHarmonics}</span>
                </label>
                <button
                    type="button"
                    onClick={() => setRandomizePhases(!randomizePhases)}
                    className="rounded-lg border border-black/20 bg-white px-4 py-2 text-xs font-medium text-black/70 transition-colors hover:bg-black/5"
                >
                    Randomize spurious phases
                </button>
                <div className="text-xs text-black/70">
                    S/N drop: {((1 - spuriousSNR / realSNR) * 100).toFixed(0)}%
                </div>
            </div>
        </div>
    );
}

function TwoDimensionalFourierDemo() {
    const heatmapRef = useRef<HTMLCanvasElement | null>(null);
    const spectrumRef = useRef<HTMLCanvasElement | null>(null);
    const [dm, setDm] = useState(60);
    const [numHarmonics, setNumHarmonics] = useState(7);

    useEffect(() => {
        const heatmapCanvas = heatmapRef.current;
        const spectrumCanvas = spectrumRef.current;
        if (!heatmapCanvas || !spectrumCanvas) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = heatmapCanvas.getBoundingClientRect();
        const w = rect.width * dpr;
        const h = rect.height * dpr;
        heatmapCanvas.width = w;
        heatmapCanvas.height = h;

        const rect2 = spectrumCanvas.getBoundingClientRect();
        const w2 = rect2.width * dpr;
        const h2 = rect2.height * dpr;
        spectrumCanvas.width = w2;
        spectrumCanvas.height = h2;

        const ctx = heatmapCanvas.getContext("2d");
        const ctx2 = spectrumCanvas.getContext("2d");
        if (!ctx || !ctx2) return;

        ctx.scale(dpr, dpr);
        ctx2.scale(dpr, dpr);

        // Draw 2D heatmap (frequency vs delay space)
        const freqBins = 128;
        const delayBins = 64;
        const K = 4.148808; // dispersion constant (simplified units)

        // Background
        ctx.fillStyle = "#fafafa";
        ctx.fillRect(0, 0, rect.width, rect.height);

        // Calculate slope from DM
        const f1 = 1400; // MHz (lower frequency)
        const f2 = 1800; // MHz (upper frequency)
        const maxDelay = (dm * K) * (1 / (f1 * f1) - 1 / (f2 * f2));

        // Draw axes
        const pad = 40;
        const plotW = rect.width - 2 * pad;
        const plotH = rect.height - 2 * pad;

        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad, pad);
        ctx.lineTo(pad, pad + plotH);
        ctx.lineTo(pad + plotW, pad + plotH);
        ctx.stroke();

        // Axis labels
        ctx.fillStyle = "#000";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Frequency (bins)", pad + plotW / 2, rect.height - 5);
        ctx.save();
        ctx.translate(10, pad + plotH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("Delay (ms)", 0, 0);
        ctx.restore();

        // Draw harmonic dots along DM slope
        const fundamentalFreq = 0.3; // normalized frequency position
        for (let h = 1; h <= numHarmonics; h++) {
            const freqPos = fundamentalFreq * h;
            if (freqPos > 1.0) break;

            const delayPos = (maxDelay / 10) * (h - 1) / (h * h); // quadratic delay law approximation

            const x = pad + plotW * freqPos;
            const y = pad + plotH * (1 - Math.min(delayPos, 1.0));

            // Draw dot
            ctx.fillStyle = "#ff6b00";
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();

            // Draw faint connecting line
            if (h > 1) {
                const prevFreqPos = fundamentalFreq * (h - 1);
                const prevDelayPos = (maxDelay / 10) * (h - 2) / ((h - 1) * (h - 1));
                const x0 = pad + plotW * prevFreqPos;
                const y0 = pad + plotH * (1 - Math.min(prevDelayPos, 1.0));

                ctx.strokeStyle = "#ff6b00";
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(x0, y0);
                ctx.lineTo(x, y);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        // Draw interpolation line (DM slope)
        ctx.strokeStyle = "#0066cc";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        const startY = pad + plotH;
        const endX = pad + plotW * fundamentalFreq * numHarmonics;
        const endY = pad;
        ctx.moveTo(pad, startY);
        ctx.lineTo(Math.min(endX, pad + plotW), endY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw 1D spectrum extracted along slope
        ctx2.fillStyle = "#fafafa";
        ctx2.fillRect(0, 0, rect2.width, rect2.height);

        const pad2 = 30;
        const plotW2 = rect2.width - 2 * pad2;
        const plotH2 = rect2.height - 2 * pad2;

        // Axes
        ctx2.strokeStyle = "#000";
        ctx2.lineWidth = 1;
        ctx2.beginPath();
        ctx2.moveTo(pad2, pad2);
        ctx2.lineTo(pad2, pad2 + plotH2);
        ctx2.lineTo(pad2 + plotW2, pad2 + plotH2);
        ctx2.stroke();

        ctx2.fillStyle = "#000";
        ctx2.font = "10px sans-serif";
        ctx2.textAlign = "center";
        ctx2.fillText("Harmonic", pad2 + plotW2 / 2, rect2.height - 5);
        ctx2.save();
        ctx2.translate(10, pad2 + plotH2 / 2);
        ctx2.rotate(-Math.PI / 2);
        ctx2.fillText("Power", 0, 0);
        ctx2.restore();

        // Draw harmonic bars
        const barWidth = plotW2 / (numHarmonics + 2);
        for (let h = 1; h <= numHarmonics; h++) {
            const amp = 1.0 / Math.sqrt(h); // Power decreases with harmonic number
            const barHeight = plotH2 * amp;
            const x = pad2 + barWidth * h;
            const y = pad2 + plotH2 - barHeight;

            ctx2.fillStyle = "#ff6b00";
            ctx2.fillRect(x, y, barWidth * 0.8, barHeight);
        }

    }, [dm, numHarmonics]);

    return (
        <div className="mt-4 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-4 sm:px-5 sm:py-5 text-left">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/70">
                Interactive: Two-Dimensional Fourier Analysis
            </div>
            <div className="mt-2 text-xs sm:text-sm text-black/70">
                2D FFT reveals both periodicity and dispersion in a single transform. Harmonic dots form a diagonal pattern with slope proportional to DM.
            </div>
            <Callout title="Concept">
                Alternative formulation combines frequency and delay axes into 2D phase space. Single 2D FFT can be more efficient than many 1D FFTs.
            </Callout>
            <Callout title="Try this">
                Adjust DM slider and watch harmonic dots rotate along the slope line. Each dot represents a harmonic at its dispersion-dependent delay.
            </Callout>
            <div className="mt-3 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3">
                <div>
                    <div className="text-xs font-medium mb-1 text-black/60">2D Heatmap (Frequency vs Delay)</div>
                    <canvas ref={heatmapRef} className="h-[280px] w-full" />
                </div>
                <div>
                    <div className="text-xs font-medium mb-1 text-black/60">1D Spectrum Along Slope</div>
                    <canvas ref={spectrumRef} className="h-[280px] w-full" />
                </div>
            </div>
            <div className="mt-4 space-y-3">
                <div>
                    <label className="flex items-center justify-between text-xs text-black/70">
                        <span>DM (pc cm⁻³): {dm}</span>
                    </label>
                    <input
                        type="range"
                        min="20"
                        max="120"
                        step="5"
                        value={dm}
                        onChange={(e) => setDm(Number(e.target.value))}
                        className="w-full"
                    />
                </div>
                <div>
                    <label className="flex items-center justify-between text-xs text-black/70">
                        <span>Harmonics: {numHarmonics}</span>
                    </label>
                    <input
                        type="range"
                        min="3"
                        max="15"
                        step="1"
                        value={numHarmonics}
                        onChange={(e) => setNumHarmonics(Number(e.target.value))}
                        className="w-full"
                    />
                </div>
            </div>
        </div>
    );
}

function BarycentricCorrectionDemo() {
    const orbitRef = useRef<HTMLCanvasElement | null>(null);
    const offsetRef = useRef<HTMLCanvasElement | null>(null);
    const [obsDuration, setObsDuration] = useState(60); // minutes
    const [orbitalPhase, setOrbitalPhase] = useState(0.25); // fraction of year

    useEffect(() => {
        const orbitCanvas = orbitRef.current;
        const offsetCanvas = offsetRef.current;
        if (!orbitCanvas || !offsetCanvas) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        // Orbit diagram
        const rect1 = orbitCanvas.getBoundingClientRect();
        orbitCanvas.width = rect1.width * dpr;
        orbitCanvas.height = rect1.height * dpr;
        const ctx1 = orbitCanvas.getContext("2d");
        if (!ctx1) return;
        ctx1.scale(dpr, dpr);

        // Offset plot
        const rect2 = offsetCanvas.getBoundingClientRect();
        offsetCanvas.width = rect2.width * dpr;
        offsetCanvas.height = rect2.height * dpr;
        const ctx2 = offsetCanvas.getContext("2d");
        if (!ctx2) return;
        ctx2.scale(dpr, dpr);

        // Draw orbit diagram
        ctx1.fillStyle = "#fafafa";
        ctx1.fillRect(0, 0, rect1.width, rect1.height);

        const centerX = rect1.width / 2;
        const centerY = rect1.height / 2;
        const orbitRadius = Math.min(rect1.width, rect1.height) * 0.35;

        // Sun at center
        ctx1.fillStyle = "#ffa500";
        ctx1.beginPath();
        ctx1.arc(centerX, centerY, 8, 0, 2 * Math.PI);
        ctx1.fill();
        ctx1.fillStyle = "#000";
        ctx1.font = "10px sans-serif";
        ctx1.textAlign = "center";
        ctx1.fillText("Sun", centerX, centerY + 25);

        // Earth orbit path
        ctx1.strokeStyle = "#ccc";
        ctx1.lineWidth = 1;
        ctx1.setLineDash([3, 3]);
        ctx1.beginPath();
        ctx1.arc(centerX, centerY, orbitRadius, 0, 2 * Math.PI);
        ctx1.stroke();
        ctx1.setLineDash([]);

        // Earth position at start
        const angleStart = orbitalPhase * 2 * Math.PI;
        const earthX = centerX + orbitRadius * Math.cos(angleStart);
        const earthY = centerY + orbitRadius * Math.sin(angleStart);
        ctx1.fillStyle = "#0066cc";
        ctx1.beginPath();
        ctx1.arc(earthX, earthY, 6, 0, 2 * Math.PI);
        ctx1.fill();
        ctx1.fillStyle = "#000";
        ctx1.font = "9px sans-serif";
        ctx1.textAlign = "center";
        ctx1.fillText("Start", earthX, earthY - 12);

        // Earth velocity vector
        const velX = -Math.sin(angleStart);
        const velY = Math.cos(angleStart);
        ctx1.strokeStyle = "#0066cc";
        ctx1.lineWidth = 2;
        ctx1.beginPath();
        ctx1.moveTo(earthX, earthY);
        ctx1.lineTo(earthX + velX * 30, earthY + velY * 30);
        ctx1.stroke();
        // Arrow head
        const arrowSize = 6;
        const arrowAngle = Math.atan2(velY, velX);
        ctx1.beginPath();
        ctx1.moveTo(earthX + velX * 30, earthY + velY * 30);
        ctx1.lineTo(
            earthX + velX * 30 - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
            earthY + velY * 30 - arrowSize * Math.sin(arrowAngle - Math.PI / 6)
        );
        ctx1.lineTo(
            earthX + velX * 30 - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
            earthY + velY * 30 - arrowSize * Math.sin(arrowAngle + Math.PI / 6)
        );
        ctx1.closePath();
        ctx1.fill();

        // Earth position at end (approximate)
        const angleEnd = (orbitalPhase + obsDuration / (365.25 * 24 * 60)) * 2 * Math.PI;
        const earthXEnd = centerX + orbitRadius * Math.cos(angleEnd);
        const earthYEnd = centerY + orbitRadius * Math.sin(angleEnd);
        ctx1.fillStyle = "#cc0066";
        ctx1.beginPath();
        ctx1.arc(earthXEnd, earthYEnd, 6, 0, 2 * Math.PI);
        ctx1.fill();
        ctx1.fillStyle = "#000";
        ctx1.fillText("End", earthXEnd, earthYEnd + 18);

        // Target direction (toward galactic center at angle 0)
        const targetAngle = 0; // degrees
        const targetX = centerX + orbitRadius * 1.3 * Math.cos(targetAngle);
        const targetY = centerY + orbitRadius * 1.3 * Math.sin(targetAngle);
        ctx1.strokeStyle = "#000";
        ctx1.lineWidth = 1;
        ctx1.setLineDash([5, 5]);
        ctx1.beginPath();
        ctx1.moveTo(centerX, centerY);
        ctx1.lineTo(targetX, targetY);
        ctx1.stroke();
        ctx1.setLineDash([]);
        ctx1.fillText("Target", targetX, targetY);

        // Draw cumulative offset plot
        ctx2.fillStyle = "#fafafa";
        ctx2.fillRect(0, 0, rect2.width, rect2.height);

        const pad = 40;
        const plotW = rect2.width - 2 * pad;
        const plotH = rect2.height - 2 * pad;

        // Axes
        ctx2.strokeStyle = "#000";
        ctx2.lineWidth = 1;
        ctx2.beginPath();
        ctx2.moveTo(pad, pad);
        ctx2.lineTo(pad, pad + plotH);
        ctx2.lineTo(pad + plotW, pad + plotH);
        ctx2.stroke();

        // Labels
        ctx2.fillStyle = "#000";
        ctx2.font = "10px sans-serif";
        ctx2.textAlign = "center";
        ctx2.fillText("Time (min)", pad + plotW / 2, rect2.height - 5);
        ctx2.save();
        ctx2.translate(10, pad + plotH / 2);
        ctx2.rotate(-Math.PI / 2);
        ctx2.fillText("Offset (ms)", 0, 0);
        ctx2.restore();

        // Calculate offset curve
        const vOrbit = 30; // km/s Earth orbital velocity
        const c = 299792.458; // km/s speed of light
        const points = 100;
        const offsets: number[] = [];

        for (let i = 0; i <= points; i++) {
            const t = (i / points) * obsDuration; // minutes
            const currentAngle = (orbitalPhase + t / (365.25 * 24 * 60)) * 2 * Math.PI;

            // Velocity component toward target
            const vx = -vOrbit * Math.sin(currentAngle);
            const vy = vOrbit * Math.cos(currentAngle);
            const vRadial = vx * Math.cos(targetAngle) + vy * Math.sin(targetAngle);

            // Time offset accumulation
            const offsetMs = (t * 60 * 1000) * (vRadial / c);
            offsets.push(offsetMs);
        }

        // Find max absolute offset for scaling
        const maxOffset = Math.max(...offsets.map(Math.abs));
        const scale = maxOffset > 0 ? plotH * 0.8 / (2 * maxOffset) : 1;

        // Draw zero line
        ctx2.strokeStyle = "#ccc";
        ctx2.lineWidth = 1;
        ctx2.setLineDash([3, 3]);
        ctx2.beginPath();
        ctx2.moveTo(pad, pad + plotH / 2);
        ctx2.lineTo(pad + plotW, pad + plotH / 2);
        ctx2.stroke();
        ctx2.setLineDash([]);

        // Draw offset curve
        ctx2.strokeStyle = "#ff6b00";
        ctx2.lineWidth = 2;
        ctx2.beginPath();
        for (let i = 0; i <= points; i++) {
            const x = pad + (i / points) * plotW;
            const y = pad + plotH / 2 - offsets[i] * scale;
            if (i === 0) ctx2.moveTo(x, y);
            else ctx2.lineTo(x, y);
        }
        ctx2.stroke();

        // Display max offset
        ctx2.fillStyle = "#000";
        ctx2.font = "11px sans-serif";
        ctx2.textAlign = "right";
        ctx2.fillText(`Max offset: ${maxOffset.toFixed(2)} ms`, rect2.width - pad, pad + 15);

    }, [obsDuration, orbitalPhase]);

    return (
        <div className="mt-4 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-4 sm:px-5 sm:py-5 text-left">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/70">
                Interactive: Barycentric Correction
            </div>
            <div className="mt-2 text-xs sm:text-sm text-black/70">
                Earth's orbital motion causes time delays that accumulate during long observations. Barycentric correction transforms topocentric time to solar system barycenter time.
            </div>
            <Callout title="When critical">
                Observations longer than 30 minutes accumulate significant time offsets (several milliseconds). Essential for X-ray and gamma-ray satellites.
            </Callout>
            <Callout title="Try this">
                Increase observation duration to 120 minutes and watch the time offset grow. Change orbital phase to see how Earth's position affects the velocity component toward the target.
            </Callout>
            <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div>
                    <div className="text-xs font-medium mb-1 text-black/60">Earth Orbit Schematic</div>
                    <canvas ref={orbitRef} className="h-[240px] w-full" />
                </div>
                <div>
                    <div className="text-xs font-medium mb-1 text-black/60">Cumulative Time Offset</div>
                    <canvas ref={offsetRef} className="h-[240px] w-full" />
                </div>
            </div>
            <div className="mt-4 space-y-3">
                <div>
                    <label className="flex items-center justify-between text-xs text-black/70">
                        <span>Observation Duration: {obsDuration} min</span>
                    </label>
                    <input
                        type="range"
                        min="15"
                        max="120"
                        step="15"
                        value={obsDuration}
                        onChange={(e) => setObsDuration(Number(e.target.value))}
                        className="w-full"
                    />
                </div>
                <div>
                    <label className="flex items-center justify-between text-xs text-black/70">
                        <span>Orbital Phase: {(orbitalPhase * 100).toFixed(0)}%</span>
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={orbitalPhase}
                        onChange={(e) => setOrbitalPhase(Number(e.target.value))}
                        className="w-full"
                    />
                </div>
            </div>
        </div>
    );
}

function CandidateSelectionDemo() {
    const snrDmRef = useRef<HTMLCanvasElement | null>(null);
    const profileRef = useRef<HTMLCanvasElement | null>(null);
    const [snrThreshold, setSnrThreshold] = useState(8.0);
    const [candidateQuality, setCandidateQuality] = useState<'good' | 'marginal' | 'spurious'>('good');

    useEffect(() => {
        const snrDmCanvas = snrDmRef.current;
        const profileCanvas = profileRef.current;
        if (!snrDmCanvas || !profileCanvas) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        // S/N vs DM plot
        const rect1 = snrDmCanvas.getBoundingClientRect();
        snrDmCanvas.width = rect1.width * dpr;
        snrDmCanvas.height = rect1.height * dpr;
        const ctx1 = snrDmCanvas.getContext("2d");
        if (!ctx1) return;
        ctx1.scale(dpr, dpr);

        // Profile plot
        const rect2 = profileCanvas.getBoundingClientRect();
        profileCanvas.width = rect2.width * dpr;
        profileCanvas.height = rect2.height * dpr;
        const ctx2 = profileCanvas.getContext("2d");
        if (!ctx2) return;
        ctx2.scale(dpr, dpr);

        // Draw S/N vs DM curve
        ctx1.fillStyle = "#fafafa";
        ctx1.fillRect(0, 0, rect1.width, rect1.height);

        const pad = 40;
        const plotW = rect1.width - 2 * pad;
        const plotH = rect1.height - 2 * pad;

        // Axes
        ctx1.strokeStyle = "#000";
        ctx1.lineWidth = 1;
        ctx1.beginPath();
        ctx1.moveTo(pad, pad);
        ctx1.lineTo(pad, pad + plotH);
        ctx1.lineTo(pad + plotW, pad + plotH);
        ctx1.stroke();

        // Labels
        ctx1.fillStyle = "#000";
        ctx1.font = "10px sans-serif";
        ctx1.textAlign = "center";
        ctx1.fillText("DM (pc cm⁻³)", pad + plotW / 2, rect1.height - 5);
        ctx1.save();
        ctx1.translate(10, pad + plotH / 2);
        ctx1.rotate(-Math.PI / 2);
        ctx1.fillText("S/N", 0, 0);
        ctx1.restore();

        // Generate S/N vs DM curve based on quality
        const dmValues = [];
        const snrValues = [];
        const trueDM = 56.5;

        for (let i = 0; i <= 100; i++) {
            const dm = 20 + (i / 100) * 100;
            const dmOffset = Math.abs(dm - trueDM);
            let snr;

            if (candidateQuality === 'good') {
                // Strong, clear peak
                snr = 15 * Math.exp(-dmOffset * dmOffset / 50) + 2 * (Math.random() - 0.5);
            } else if (candidateQuality === 'marginal') {
                // Weaker peak with more noise
                snr = 9 * Math.exp(-dmOffset * dmOffset / 40) + 3 * (Math.random() - 0.5);
            } else {
                // Spurious - no clear peak, just noise
                snr = 4 + 2 * Math.sin(dm / 10) + 2 * (Math.random() - 0.5);
            }

            dmValues.push(dm);
            snrValues.push(Math.max(0, snr));
        }

        const maxSNR = Math.max(...snrValues);
        const snrScale = plotH * 0.9 / maxSNR;

        // Draw threshold line
        ctx1.strokeStyle = "#cc0066";
        ctx1.lineWidth = 1;
        ctx1.setLineDash([5, 5]);
        const threshY = pad + plotH - snrThreshold * snrScale;
        ctx1.beginPath();
        ctx1.moveTo(pad, threshY);
        ctx1.lineTo(pad + plotW, threshY);
        ctx1.stroke();
        ctx1.setLineDash([]);
        ctx1.fillStyle = "#cc0066";
        ctx1.font = "9px sans-serif";
        ctx1.textAlign = "right";
        ctx1.fillText(`Threshold: ${snrThreshold.toFixed(1)}`, rect1.width - pad - 5, threshY - 5);

        // Draw S/N curve
        ctx1.strokeStyle = "#ff6b00";
        ctx1.lineWidth = 2;
        ctx1.beginPath();
        for (let i = 0; i <= 100; i++) {
            const x = pad + (i / 100) * plotW;
            const y = pad + plotH - snrValues[i] * snrScale;
            if (i === 0) ctx1.moveTo(x, y);
            else ctx1.lineTo(x, y);
        }
        ctx1.stroke();

        // Draw reconstructed profile
        ctx2.fillStyle = "#fafafa";
        ctx2.fillRect(0, 0, rect2.width, rect2.height);

        const pad2 = 40;
        const plotW2 = rect2.width - 2 * pad2;
        const plotH2 = rect2.height - 2 * pad2;

        // Axes
        ctx2.strokeStyle = "#000";
        ctx2.lineWidth = 1;
        ctx2.beginPath();
        ctx2.moveTo(pad2, pad2);
        ctx2.lineTo(pad2, pad2 + plotH2);
        ctx2.lineTo(pad2 + plotW2, pad2 + plotH2);
        ctx2.stroke();

        ctx2.fillStyle = "#000";
        ctx2.font = "10px sans-serif";
        ctx2.textAlign = "center";
        ctx2.fillText("Pulse Phase", pad2 + plotW2 / 2, rect2.height - 5);
        ctx2.save();
        ctx2.translate(10, pad2 + plotH2 / 2);
        ctx2.rotate(-Math.PI / 2);
        ctx2.fillText("Intensity", 0, 0);
        ctx2.restore();

        // Generate profile based on quality
        const profileBins = 64;
        const profile = [];

        for (let i = 0; i < profileBins; i++) {
            const phase = i / profileBins;
            let intensity;

            if (candidateQuality === 'good') {
                // Sharp pulse
                intensity = gauss(phase, 0.3, 0.03) + 0.05 * (Math.random() - 0.5);
            } else if (candidateQuality === 'marginal') {
                // Broader, noisier pulse
                intensity = gauss(phase, 0.3, 0.06) + 0.15 * (Math.random() - 0.5);
            } else {
                // No pulse, just noise
                intensity = 0.1 + 0.1 * (Math.random() - 0.5);
            }

            profile.push(Math.max(0, intensity));
        }

        const maxProfile = Math.max(...profile);
        const profileScale = maxProfile > 0 ? plotH2 * 0.9 / maxProfile : 1;

        // Draw profile
        ctx2.fillStyle = "#ff6b00";
        const barWidth = plotW2 / profileBins;
        for (let i = 0; i < profileBins; i++) {
            const x = pad2 + i * barWidth;
            const barHeight = profile[i] * profileScale;
            const y = pad2 + plotH2 - barHeight;
            ctx2.fillRect(x, y, barWidth * 0.9, barHeight);
        }

        // Display verdict
        const passesThreshold = maxSNR >= snrThreshold;
        const hasProfile = candidateQuality !== 'spurious';
        const verdict = passesThreshold && hasProfile ? "PASS" : "FAIL";
        const verdictColor = verdict === "PASS" ? "#00aa00" : "#cc0000";

        ctx2.fillStyle = verdictColor;
        ctx2.font = "bold 14px sans-serif";
        ctx2.textAlign = "right";
        ctx2.fillText(`Verdict: ${verdict}`, rect2.width - pad2, pad2 + 20);

    }, [snrThreshold, candidateQuality]);

    return (
        <div className="mt-4 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-4 sm:px-5 sm:py-5 text-left">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/70">
                Interactive: Candidate Selection
            </div>
            <div className="mt-2 text-xs sm:text-sm text-black/70">
                Validation workflow for distinguishing real pulsars from spurious candidates using S/N vs DM curves and reconstructed profiles.
            </div>
            <Callout title="Validation checks">
                Real candidates show clear DM peak and coherent pulse profile. Spurious candidates fail one or both tests.
            </Callout>
            <Callout title="Try this">
                Change candidate quality to "Spurious" and watch both the DM curve flatten and the profile disappear. Adjust S/N threshold to see pass/fail criteria.
            </Callout>
            <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div>
                    <div className="text-xs font-medium mb-1 text-black/60">S/N vs DM Curve</div>
                    <canvas ref={snrDmRef} className="h-[220px] w-full" />
                </div>
                <div>
                    <div className="text-xs font-medium mb-1 text-black/60">Reconstructed Profile</div>
                    <canvas ref={profileRef} className="h-[220px] w-full" />
                </div>
            </div>
            <div className="mt-4 space-y-3">
                <div>
                    <label className="flex items-center justify-between text-xs text-black/70">
                        <span>S/N Threshold: {snrThreshold.toFixed(1)}</span>
                    </label>
                    <input
                        type="range"
                        min="4"
                        max="12"
                        step="0.5"
                        value={snrThreshold}
                        onChange={(e) => setSnrThreshold(Number(e.target.value))}
                        className="w-full"
                    />
                </div>
                <div>
                    <label className="text-xs text-black/70 block mb-2">Candidate Quality:</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCandidateQuality('good')}
                            className={`px-3 py-1.5 text-xs rounded border ${
                                candidateQuality === 'good'
                                    ? 'bg-black text-white border-black'
                                    : 'bg-white text-black border-black/20'
                            }`}
                        >
                            Good
                        </button>
                        <button
                            onClick={() => setCandidateQuality('marginal')}
                            className={`px-3 py-1.5 text-xs rounded border ${
                                candidateQuality === 'marginal'
                                    ? 'bg-black text-white border-black'
                                    : 'bg-white text-black border-black/20'
                            }`}
                        >
                            Marginal
                        </button>
                        <button
                            onClick={() => setCandidateQuality('spurious')}
                            className={`px-3 py-1.5 text-xs rounded border ${
                                candidateQuality === 'spurious'
                                    ? 'bg-black text-white border-black'
                                    : 'bg-white text-black border-black/20'
                            }`}
                        >
                            Spurious
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CorrelationMethodDemo() {
    const spectrumRef = useRef<HTMLCanvasElement | null>(null);
    const templateRef = useRef<HTMLCanvasElement | null>(null);
    const [templatePosition, setTemplatePosition] = useState(0.5);

    useEffect(() => {
        const spectrumCanvas = spectrumRef.current;
        const templateCanvas = templateRef.current;
        if (!spectrumCanvas || !templateCanvas) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        // Spectrum plot
        const rect1 = spectrumCanvas.getBoundingClientRect();
        spectrumCanvas.width = rect1.width * dpr;
        spectrumCanvas.height = rect1.height * dpr;
        const ctx1 = spectrumCanvas.getContext("2d");
        if (!ctx1) return;
        ctx1.scale(dpr, dpr);

        // Template plot
        const rect2 = templateCanvas.getBoundingClientRect();
        templateCanvas.width = rect2.width * dpr;
        templateCanvas.height = rect2.height * dpr;
        const ctx2 = templateCanvas.getContext("2d");
        if (!ctx2) return;
        ctx2.scale(dpr, dpr);

        // Draw spectrum with template overlay
        ctx1.fillStyle = "#fafafa";
        ctx1.fillRect(0, 0, rect1.width, rect1.height);

        const pad = 40;
        const plotW = rect1.width - 2 * pad;
        const plotH = rect1.height - 2 * pad;

        // Axes
        ctx1.strokeStyle = "#000";
        ctx1.lineWidth = 1;
        ctx1.beginPath();
        ctx1.moveTo(pad, pad);
        ctx1.lineTo(pad, pad + plotH);
        ctx1.lineTo(pad + plotW, pad + plotH);
        ctx1.stroke();

        // Labels
        ctx1.fillStyle = "#000";
        ctx1.font = "10px sans-serif";
        ctx1.textAlign = "center";
        ctx1.fillText("Frequency", pad + plotW / 2, rect1.height - 5);
        ctx1.save();
        ctx1.translate(10, pad + plotH / 2);
        ctx1.rotate(-Math.PI / 2);
        ctx1.fillText("Power", 0, 0);
        ctx1.restore();

        // Draw power spectrum with signal
        const points = 200;
        const signalFreq = 0.35;
        ctx1.strokeStyle = "#666";
        ctx1.lineWidth = 1.5;
        ctx1.beginPath();
        for (let i = 0; i <= points; i++) {
            const freq = i / points;
            const noise = 0.3 + 0.1 * Math.random();
            const signal = freq > signalFreq - 0.02 && freq < signalFreq + 0.02 ? 0.6 * Math.exp(-Math.pow((freq - signalFreq) / 0.01, 2)) : 0;
            const power = noise + signal;
            const x = pad + freq * plotW;
            const y = pad + plotH - power * plotH * 0.8;
            if (i === 0) ctx1.moveTo(x, y);
            else ctx1.lineTo(x, y);
        }
        ctx1.stroke();

        // Draw sliding template
        const templateWidth = 0.15;
        const templateCenter = templatePosition;
        ctx1.fillStyle = "rgba(0, 102, 204, 0.2)";
        ctx1.fillRect(
            pad + (templateCenter - templateWidth / 2) * plotW,
            pad,
            templateWidth * plotW,
            plotH
        );
        ctx1.strokeStyle = "#0066cc";
        ctx1.lineWidth = 2;
        ctx1.setLineDash([5, 5]);
        ctx1.beginPath();
        ctx1.moveTo(pad + templateCenter * plotW, pad);
        ctx1.lineTo(pad + templateCenter * plotW, pad + plotH);
        ctx1.stroke();
        ctx1.setLineDash([]);

        // Draw Fresnel template pattern
        ctx2.fillStyle = "#fafafa";
        ctx2.fillRect(0, 0, rect2.width, rect2.height);

        const pad2 = 40;
        const plotW2 = rect2.width - 2 * pad2;
        const plotH2 = rect2.height - 2 * pad2;

        // Axes
        ctx2.strokeStyle = "#000";
        ctx2.lineWidth = 1;
        ctx2.beginPath();
        ctx2.moveTo(pad2, pad2);
        ctx2.lineTo(pad2, pad2 + plotH2);
        ctx2.lineTo(pad2 + plotW2, pad2 + plotH2);
        ctx2.stroke();

        ctx2.fillStyle = "#000";
        ctx2.font = "10px sans-serif";
        ctx2.textAlign = "center";
        ctx2.fillText("Relative Frequency", pad2 + plotW2 / 2, rect2.height - 5);
        ctx2.save();
        ctx2.translate(10, pad2 + plotH2 / 2);
        ctx2.rotate(-Math.PI / 2);
        ctx2.fillText("Template Response", 0, 0);
        ctx2.restore();

        // Draw Fresnel integral pattern
        ctx2.strokeStyle = "#0066cc";
        ctx2.lineWidth = 2;
        ctx2.beginPath();
        for (let i = 0; i <= 100; i++) {
            const x_rel = -2 + (i / 100) * 4;
            const response = Math.exp(-x_rel * x_rel / 2); // Gaussian approximation
            const x = pad2 + (i / 100) * plotW2;
            const y = pad2 + plotH2 - response * plotH2 * 0.8;
            if (i === 0) ctx2.moveTo(x, y);
            else ctx2.lineTo(x, y);
        }
        ctx2.stroke();

        // Calculate correlation score
        const overlap = Math.abs(templateCenter - signalFreq) < templateWidth / 2 ? 1.0 - Math.abs(templateCenter - signalFreq) / (templateWidth / 2) : 0;
        ctx2.fillStyle = "#000";
        ctx2.font = "11px sans-serif";
        ctx2.textAlign = "right";
        ctx2.fillText(`Correlation: ${(overlap * 100).toFixed(0)}%`, rect2.width - pad2, pad2 + 15);

    }, [templatePosition]);

    return (
        <div className="mt-4 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-4 sm:px-5 sm:py-5 text-left">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/70">
                Interactive: Correlation Method for Binary Search
            </div>
            <div className="mt-2 text-xs sm:text-sm text-black/70">
                Template matching in frequency domain using Fresnel integral kernels. The correlation method efficiently detects acceleration signatures without time-domain resampling.
            </div>
            <Callout title="How it works">
                Slide a Fresnel-shaped template across the power spectrum. Maximum correlation indicates the orbital frequency and acceleration.
            </Callout>
            <Callout title="Try this">
                Move the template slider to align with the signal peak (around 35%). Watch correlation score increase when template overlaps the signal.
            </Callout>
            <div className="mt-3 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3">
                <div>
                    <div className="text-xs font-medium mb-1 text-black/60">Power Spectrum with Sliding Template</div>
                    <canvas ref={spectrumRef} className="h-[220px] w-full" />
                </div>
                <div>
                    <div className="text-xs font-medium mb-1 text-black/60">Fresnel Template Pattern</div>
                    <canvas ref={templateRef} className="h-[220px] w-full" />
                </div>
            </div>
            <div className="mt-4">
                <label className="flex items-center justify-between text-xs text-black/70">
                    <span>Template Position: {(templatePosition * 100).toFixed(0)}%</span>
                </label>
                <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.01"
                    value={templatePosition}
                    onChange={(e) => setTemplatePosition(Number(e.target.value))}
                    className="w-full"
                />
            </div>
        </div>
    );
}

function StackSlideSearchDemo() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [segmentLength, setSegmentLength] = useState(20);
    const [orbitalPeriod, setOrbitalPeriod] = useState(120);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = "#fafafa";
        ctx.fillRect(0, 0, rect.width, rect.height);

        const pad = 40;
        const plotW = rect.width - 2 * pad;
        const plotH = rect.height - 2 * pad;

        // Calculate number of segments
        const numSegments = Math.floor(orbitalPeriod / segmentLength);
        const segmentHeight = plotH / (numSegments + 2);

        // Axes
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad, pad);
        ctx.lineTo(pad, pad + plotH);
        ctx.lineTo(pad + plotW, pad + plotH);
        ctx.stroke();

        // Labels
        ctx.fillStyle = "#000";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Time within Segment", pad + plotW / 2, rect.height - 5);
        ctx.save();
        ctx.translate(10, pad + plotH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("Segment Number", 0, 0);
        ctx.restore();

        // Draw stacked segments with phase shift
        const pulsePhase = 0.3;
        for (let seg = 0; seg < numSegments; seg++) {
            const yBase = pad + seg * segmentHeight;

            // Calculate phase shift due to orbital motion
            const orbitalPhase = (seg * segmentLength) / orbitalPeriod;
            const phaseShift = Math.sin(2 * Math.PI * orbitalPhase) * 0.15;

            // Draw segment time series
            ctx.strokeStyle = "#666";
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i <= 100; i++) {
                const t = i / 100;
                const noise = 0.3 + 0.15 * Math.random();
                const pulseLoc = (pulsePhase + phaseShift + 1) % 1;
                const signal = gauss(t, pulseLoc, 0.03);
                const value = noise + signal * 0.6;

                const x = pad + t * plotW;
                const y = yBase + segmentHeight / 2 - value * segmentHeight * 0.4;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Mark pulse position
            const pulseLoc = (pulsePhase + phaseShift + 1) % 1;
            ctx.fillStyle = "#ff6b00";
            ctx.beginPath();
            ctx.arc(pad + pulseLoc * plotW, yBase + segmentHeight / 2, 3, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Display info
        ctx.fillStyle = "#000";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(`${numSegments} segments`, rect.width - pad, pad + 15);
        ctx.fillText(`S/N gain: ~${Math.sqrt(numSegments).toFixed(1)}x`, rect.width - pad, pad + 30);

    }, [segmentLength, orbitalPeriod]);

    return (
        <div className="mt-4 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-4 sm:px-5 sm:py-5 text-left">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/70">
                Interactive: Stack/Slide Search
            </div>
            <div className="mt-2 text-xs sm:text-sm text-black/70">
                Time series is divided into segments which are stacked and shifted to search for periodic signals modulated by orbital motion. Each orange dot marks the pulse position in that segment.
            </div>
            <Callout title="How it works">
                Divide observation into segments, shift each by trial orbital parameters, then stack. Coherent signals add constructively, improving S/N by √N.
            </Callout>
            <Callout title="Try this">
                Increase orbital period to 240 minutes and watch more segments appear. Shorter segments mean more stacking opportunities but less power per segment.
            </Callout>
            <canvas ref={canvasRef} className="mt-3 h-[280px] w-full" />
            <div className="mt-4 space-y-3">
                <div>
                    <label className="flex items-center justify-between text-xs text-black/70">
                        <span>Segment Length: {segmentLength} min</span>
                    </label>
                    <input
                        type="range"
                        min="10"
                        max="40"
                        step="5"
                        value={segmentLength}
                        onChange={(e) => setSegmentLength(Number(e.target.value))}
                        className="w-full"
                    />
                </div>
                <div>
                    <label className="flex items-center justify-between text-xs text-black/70">
                        <span>Orbital Period: {orbitalPeriod} min</span>
                    </label>
                    <input
                        type="range"
                        min="60"
                        max="240"
                        step="30"
                        value={orbitalPeriod}
                        onChange={(e) => setOrbitalPeriod(Number(e.target.value))}
                        className="w-full"
                    />
                </div>
            </div>
        </div>
    );
}

function DynamicPowerSpectrumDemo() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [orbitalPeriod, setOrbitalPeriod] = useState(90);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = "#fafafa";
        ctx.fillRect(0, 0, rect.width, rect.height);

        const pad = 40;
        const plotW = rect.width - 2 * pad;
        const plotH = rect.height - 2 * pad;

        // Axes
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad, pad);
        ctx.lineTo(pad, pad + plotH);
        ctx.lineTo(pad + plotW, pad + plotH);
        ctx.stroke();

        // Labels
        ctx.fillStyle = "#000";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Time (min)", pad + plotW / 2, rect.height - 5);
        ctx.save();
        ctx.translate(10, pad + plotH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("Frequency", 0, 0);
        ctx.restore();

        // Draw 2D spectrogram heatmap
        const timeSteps = 80;
        const freqSteps = 60;
        const fundamentalFreq = 0.45;

        for (let t = 0; t < timeSteps; t++) {
            for (let f = 0; f < freqSteps; f++) {
                const time = t / timeSteps;
                const freq = f / freqSteps;

                // Orbital modulation causes sinusoidal frequency drift
                const orbPhase = (time * 120) / orbitalPeriod;
                const freqShift = 0.05 * Math.sin(2 * Math.PI * orbPhase);
                const expectedFreq = fundamentalFreq + freqShift;

                // Power is high when frequency matches the modulated signal
                const freqDiff = Math.abs(freq - expectedFreq);
                const power = freqDiff < 0.02 ? 0.9 - freqDiff * 20 : 0.1 * Math.random();

                // Draw pixel
                const brightness = Math.floor(power * 200 + 55);
                ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
                const pixelW = plotW / timeSteps;
                const pixelH = plotH / freqSteps;
                ctx.fillRect(pad + t * pixelW, pad + (freqSteps - f - 1) * pixelH, pixelW + 1, pixelH + 1);
            }
        }

        // Draw sinusoidal trace overlay
        ctx.strokeStyle = "#ff6b00";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
            const time = i / 100;
            const orbPhase = (time * 120) / orbitalPeriod;
            const freqShift = 0.05 * Math.sin(2 * Math.PI * orbPhase);
            const freq = fundamentalFreq + freqShift;

            const x = pad + time * plotW;
            const y = pad + plotH - freq * plotH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Display info
        ctx.fillStyle = "#000";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(`Period: ${orbitalPeriod} min`, rect.width - pad, pad + 15);

    }, [orbitalPeriod]);

    return (
        <div className="mt-4 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-4 sm:px-5 sm:py-5 text-left">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/70">
                Interactive: Dynamic Power Spectrum
            </div>
            <div className="mt-2 text-xs sm:text-sm text-black/70">
                2D time-frequency spectrogram reveals orbital modulation as sinusoidal trace. The orange curve shows how the pulsar's apparent frequency changes over time due to binary motion.
            </div>
            <Callout title="Detection method">
                Orbital motion causes Doppler shifts that create sinusoidal patterns in time-frequency space. Hough transform can automatically detect these curves.
            </Callout>
            <Callout title="Try this">
                Change orbital period and watch the sinusoid frequency change. Shorter periods create faster oscillations in the frequency drift.
            </Callout>
            <canvas ref={canvasRef} className="mt-3 h-[280px] w-full" />
            <div className="mt-4">
                <label className="flex items-center justify-between text-xs text-black/70">
                    <span>Orbital Period: {orbitalPeriod} min</span>
                </label>
                <input
                    type="range"
                    min="30"
                    max="180"
                    step="15"
                    value={orbitalPeriod}
                    onChange={(e) => setOrbitalPeriod(Number(e.target.value))}
                    className="w-full"
                />
            </div>
        </div>
    );
}

function DispersionDemo() {
    const phaseRef = useRef<HTMLCanvasElement | null>(null);
    const heatRef = useRef<HTMLCanvasElement | null>(null);
    const [dm, setDm] = useState(0);
    const dmRef = useRef(dm);
    dmRef.current = dm;

    useEffect(() => {
        const phaseCanvas = phaseRef.current;
        const heatCanvas = heatRef.current;
        if (!phaseCanvas || !heatCanvas) return;

        const handle = () => {
            renderDispersionDemo(phaseCanvas, heatCanvas, dmRef.current);
        };

        handle();
        window.addEventListener("resize", handle);
        return () => window.removeEventListener("resize", handle);
    }, []);

    useEffect(() => {
        const phaseCanvas = phaseRef.current;
        const heatCanvas = heatRef.current;
        if (!phaseCanvas || !heatCanvas) return;
        renderDispersionDemo(phaseCanvas, heatCanvas, dm);
    }, [dm]);

    return (
        <div className="mt-4 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-4 sm:px-5 sm:py-5 text-left">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/70">
                Interactive: dispersion and trial DM
            </div>
            <div className="mt-2 text-xs sm:text-sm text-black/70">
                Sweep the DM slider. When the trial DM is close to the real value, the pulse column becomes vertical and the
                profile sharpens.
            </div>
            <Callout title="Why this works">
                Dispersion delays lower frequencies more than higher ones. De-dispersion applies the inverse delay so each
                channel lines up into a single sharp pulse.
            </Callout>
            <Callout title="Try this">
                Move the slider off the true DM. Notice the pulse tilts and the profile broadens, lowering detectability.
            </Callout>
            <div className="mt-3 flex flex-col gap-2">
                <canvas ref={phaseRef} className="h-[80px] w-full" />
                <canvas ref={heatRef} className="h-[220px] w-full" />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs sm:text-sm text-black/70">
                    Incorrect DM values tilt the pulse and smear it out, reducing detectability.
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">DM</span>
                    <input
                        type="range"
                        min={0}
                        max={120}
                        value={dm}
                        onChange={(e) => setDm(Number(e.target.value))}
                        className="w-40 md:w-48 accent-black"
                    />
                    <span className="text-xs tabular-nums text-black/70">{dm.toFixed(0)} pc cm^-3</span>
                </div>
            </div>
        </div>
    );
}

function renderDispersionDemo(
    phaseCanvas: HTMLCanvasElement,
    heatCanvas: HTMLCanvasElement,
    dm: number
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

    const dmTrue = 60;
    const K_MS_MHZ = 4.148808e6;
    const periodMs = 100;

    const nuHigh = 1800;
    const nuLow = 1400;
    const nuRef = nuHigh;

    const cellW = wHeat / phaseBins;
    const cellH = hHeat / channels;

    const profile = new Array<number>(phaseBins).fill(0);

    heatCtx.clearRect(0, 0, wHeat, hHeat);
    heatCtx.fillStyle = "#fffaf5";
    heatCtx.fillRect(0, 0, wHeat, hHeat);

    for (let ch = 0; ch < channels; ch++) {
        const frac = ch / Math.max(1, channels - 1);
        const nu = nuHigh - (nuHigh - nuLow) * frac;

        const invNu2 = 1 / (nu * nu);
        const invRef2 = 1 / (nuRef * nuRef);

        const dtResidualMs = K_MS_MHZ * (dmTrue - dm) * (invNu2 - invRef2);

        let phaseShift = dtResidualMs / periodMs;
        phaseShift = ((phaseShift % 1) + 1) % 1;

        const baseCenter = 0.35;
        const centerPhase = (baseCenter + phaseShift) % 1;

        for (let i = 0; i < phaseBins; i++) {
            const u = i / Math.max(1, phaseBins - 1);

            const staticNoise = 0.12 * (Math.sin((i + ch * 19) * 0.13) - 0.5);
            const movingIndex = Math.floor((((u + phaseShift) % 1 + 1) % 1) * 512);
            const movingNoise = 0.1 * (Math.sin((movingIndex + ch * 17) * 0.21) - 0.5);
            const noise = 0.12 + staticNoise + movingNoise;

            const width = 0.022;
            let dPhase = u - centerPhase;
            dPhase = ((dPhase + 0.5) % 1) - 0.5;
            const pulse = Math.exp(-0.5 * (dPhase / width) ** 2) * 1.2;

            const intensity = noise + pulse;
            profile[i] += intensity;

            const t = clamp01((intensity - 0.2) / 1.5);
            const baseR = 252;
            const baseG = 243;
            const baseB = 236;
            const peakR = 249;
            const peakG = 115;
            const peakB = 22;

            const r = baseR + (peakR - baseR) * t;
            const g = baseG + (peakG - baseG) * t;
            const b = baseB + (peakB - baseB) * t;

            heatCtx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;

            const x = i * cellW;
            const y = ch * cellH;
            heatCtx.fillRect(x, y, cellW + 0.5, cellH + 0.5);
        }
    }

    const profileCanvasWidth = phaseRect.width || 1;
    const profileCanvasHeight = phaseRect.height || 1;

    phaseCtx.clearRect(0, 0, profileCanvasWidth, profileCanvasHeight);
    phaseCtx.fillStyle = "#ffffff";
    phaseCtx.fillRect(0, 0, profileCanvasWidth, profileCanvasHeight);

    let pMin = Infinity;
    let pMax = -Infinity;
    for (let i = 0; i < phaseBins; i++) {
        const v = profile[i] / channels;
        pMin = Math.min(pMin, v);
        pMax = Math.max(pMax, v);
    }
    const span = Math.max(1e-6, pMax - pMin);

    phaseCtx.strokeStyle = "rgba(0,0,0,0.16)";
    phaseCtx.lineWidth = 1;
    phaseCtx.beginPath();
    phaseCtx.moveTo(0, profileCanvasHeight - 0.5);
    phaseCtx.lineTo(profileCanvasWidth, profileCanvasHeight - 0.5);
    phaseCtx.stroke();

    phaseCtx.strokeStyle = "rgba(0,0,0,0.9)";
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

    const axisColor = "rgba(0,0,0,0.65)";
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
        const u = k / yTicks;
        const y = (1 - u) * hHeat;
        const fLabel = nuLow + (nuHigh - nuLow) * u;
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

function DmStepSNRDemo() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [pulseWidth, setPulseWidth] = useState(4);
    const [dmStep, setDmStep] = useState(4.0);
    const pulsars = useMemo(() => [12, 21, 33, 46, 58, 72, 84, 97, 110], []);

    const hits = useMemo(() => {
        const step = Math.max(0.5, dmStep);
        const width = 1.6 + (pulseWidth / 20) * 9.0;
        return pulsars.filter((dm) => {
            const nearest = Math.round(dm / step) * step;
            const residual = Math.abs(dm - nearest);
            const loss = Math.exp(-0.5 * (residual / width) ** 2);
            return loss >= 0.7;
        }).length;
    }, [dmStep, pulsars, pulseWidth]);

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

        drawAxes(ctx, w, h);

        const dmMin = 0;
        const dmMax = 120;
        const dmSpan = dmMax - dmMin;

        const peaks = pulsars.map((dm) => ({ dm, amp: 0.6 + 0.5 * Math.cos(dm * 0.12) }));
        const bins = 280;
        const snrVals: number[] = [];
        let maxSNR = 0;
        const width = 1.6 + (pulseWidth / 20) * 9.0;

        for (let i = 0; i < bins; i++) {
            const dm = dmMin + (dmSpan * i) / (bins - 1);
            let y = 0.05;
            for (const p of peaks) {
                y += gauss(dm, p.dm, width) * p.amp;
            }
            snrVals.push(y);
            maxSNR = Math.max(maxSNR, y);
        }

        ctx.strokeStyle = "rgba(0,0,0,0.85)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < snrVals.length; i++) {
            const u = i / (snrVals.length - 1);
            const x = u * w;
            const y = (1 - snrVals[i] / Math.max(1e-6, maxSNR)) * (h - 12) + 6;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.strokeStyle = "rgba(239,68,68,0.7)";
        ctx.setLineDash([6, 6]);
        const stepCount = Math.floor(dmSpan / dmStep);
        for (let i = 0; i <= stepCount; i++) {
            const dm = dmMin + i * dmStep;
            const u = (dm - dmMin) / dmSpan;
            const x = clamp01(u) * w;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        for (const p of peaks) {
            const nearest = Math.round(p.dm / dmStep) * dmStep;
            const residual = Math.abs(p.dm - nearest);
            const loss = Math.exp(-0.5 * (residual / width) ** 2);
            const hit = loss >= 0.7;
            const u = (p.dm - dmMin) / dmSpan;
            const x = clamp01(u) * w;
            const y = (1 - (p.amp / maxSNR)) * (h - 12) + 6;
            const green = hit ? 16 : 239;
            const red = hit ? 185 : 68;
            const alpha = 0.55 + 0.45 * loss;
            ctx.fillStyle = `rgba(${green},${red},129,${alpha.toFixed(2)})`;
            ctx.beginPath();
            ctx.arc(x, y, 3.6, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = "rgba(0,0,0,0.65)";
        ctx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("Trial DM grid vs pulsar peaks", 8, 12);
        ctx.fillText("DM (pc cm^-3)", w - 98, h - 6);
        ctx.save();
        ctx.translate(12, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("Relative S/N", 0, 0);
        ctx.restore();
    }, [pulseWidth, dmStep, pulsars]);

    return (
        <div className="mt-4 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-4 sm:px-5 sm:py-5 text-left">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/70">
                Interactive: DM step size trade-off
            </div>
            <div className="mt-2 text-xs sm:text-sm text-black/70">
                Trial DMs sample the curve. If the step is too coarse, narrow pulses fall between grid points and are missed.
            </div>
            <Callout title="Concept">
                A wrong DM leaves residual smearing. Narrower pulses tolerate less smearing, so they require finer DM steps.
            </Callout>
            <Callout title="Try this">
                Make the pulse width smaller and the DM step larger. Watch the green detections drop.
            </Callout>
            <canvas ref={canvasRef} className="mt-3 h-[160px] w-full" />
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-xs text-black/75">
                    <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">Pulse width</span>
                    <input
                        type="range"
                        min={1}
                        max={20}
                        value={pulseWidth}
                        onChange={(e) => setPulseWidth(Number(e.target.value))}
                        className="w-44 accent-black"
                    />
                    <span className="text-xs tabular-nums text-black/70">{pulseWidth} ms</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-black/75">
                    <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">DM step</span>
                    <input
                        type="range"
                        min={0.5}
                        max={5}
                        step={0.5}
                        value={dmStep}
                        onChange={(e) => setDmStep(Number(e.target.value))}
                        className="w-36 accent-black"
                    />
                    <span className="text-xs tabular-nums text-black/70">{dmStep.toFixed(1)}</span>
                </label>
            </div>
            <div className="mt-3 text-xs text-black/70">
                Detected pulsars: {hits} / {pulsars.length}
            </div>
        </div>
    );
}

function HarmonicSummingDemo() {
    const timeRef = useRef<HTMLCanvasElement | null>(null);
    const specRef = useRef<HTMLCanvasElement | null>(null);
    const [duty, setDuty] = useState(0.04);
    const [harmonics, setHarmonics] = useState(8);

    const sinc = (x: number) => {
        if (Math.abs(x) < 1e-6) return 1;
        return Math.sin(x) / x;
    };

    const maxH = 16;
    const harmonicAmps = useMemo(
        () => new Array<number>(maxH).fill(0).map((_, i) => Math.abs(sinc(Math.PI * (i + 1) * duty))),
        [duty]
    );

    const snrGain = useMemo(() => {
        const include = Math.max(1, Math.min(maxH, harmonics));
        const sumSq = harmonicAmps.slice(0, include).reduce((acc, v) => acc + v * v, 0);
        const fundamental = harmonicAmps[0] || 1;
        return Math.sqrt(sumSq) / Math.max(1e-6, fundamental);
    }, [harmonics, harmonicAmps]);

    useEffect(() => {
        const timeCanvas = timeRef.current;
        const specCanvas = specRef.current;
        if (!timeCanvas || !specCanvas) return;
        const timeCtx = timeCanvas.getContext("2d");
        const specCtx = specCanvas.getContext("2d");
        if (!timeCtx || !specCtx) return;

        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        const timeRect = timeCanvas.getBoundingClientRect();
        timeCanvas.width = Math.max(1, Math.floor(timeRect.width * dpr));
        timeCanvas.height = Math.max(1, Math.floor(timeRect.height * dpr));
        timeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const specRect = specCanvas.getBoundingClientRect();
        specCanvas.width = Math.max(1, Math.floor(specRect.width * dpr));
        specCanvas.height = Math.max(1, Math.floor(specRect.height * dpr));
        specCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const wTime = timeRect.width || 1;
        const hTime = timeRect.height || 1;
        drawAxes(timeCtx, wTime, hTime);

        timeCtx.strokeStyle = "rgba(0,0,0,0.85)";
        timeCtx.lineWidth = 1.4;
        timeCtx.beginPath();
        const cycles = 3;
        for (let i = 0; i < 240; i++) {
            const t = (i / 239) * cycles;
            const phase = t % 1;
            const pulse = phase < duty ? 1 : 0;
            const y = 0.2 + 0.6 * pulse;
            const x = (i / 239) * wTime;
            const py = (1 - y) * (hTime - 10) + 5;
            if (i === 0) timeCtx.moveTo(x, py);
            else timeCtx.lineTo(x, py);
        }
        timeCtx.stroke();
        timeCtx.fillStyle = "rgba(0,0,0,0.6)";
        timeCtx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        timeCtx.fillText("Pulse train (duty cycle)", 8, 12);
        timeCtx.fillText("Phase", wTime - 42, hTime - 6);
        timeCtx.save();
        timeCtx.translate(12, hTime / 2);
        timeCtx.rotate(-Math.PI / 2);
        timeCtx.fillText("Flux", 0, 0);
        timeCtx.restore();

        const wSpec = specRect.width || 1;
        const hSpec = specRect.height || 1;
        drawAxes(specCtx, wSpec, hSpec);
        const maxAmp = Math.max(...harmonicAmps, 1e-6);
        const barW = wSpec / maxH;
        for (let i = 0; i < maxH; i++) {
            const v = harmonicAmps[i] / maxAmp;
            const barH = v * (hSpec - 22);
            const x = i * barW;
            const y = hSpec - barH - 8;
            specCtx.fillStyle = i < harmonics ? "rgba(0,0,0,0.9)" : "rgba(0,0,0,0.25)";
            specCtx.fillRect(x + barW * 0.15, y, barW * 0.7, barH);
        }
        specCtx.fillStyle = "rgba(0,0,0,0.6)";
        specCtx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        specCtx.fillText("Harmonics to sum", 8, 12);
        specCtx.fillText("Harmonic #", wSpec - 74, hSpec - 6);
        specCtx.save();
        specCtx.translate(12, hSpec / 2);
        specCtx.rotate(-Math.PI / 2);
        specCtx.fillText("Amplitude", 0, 0);
        specCtx.restore();
    }, [harmonicAmps, harmonics, duty]);

    const expected = Math.round(1 / Math.max(0.01, duty));

    return (
        <div className="mt-4 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-4 sm:px-5 sm:py-5 text-left">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/70">
                Interactive: harmonic summing
            </div>
            <div className="mt-2 text-xs sm:text-sm text-black/70">
                Narrower pulses spread power into more harmonics. Sum enough harmonics to recover S/N.
            </div>
            <Callout title="Concept">
                A narrow pulse looks like a sharp spike in time, which becomes many harmonics in frequency. Summing them
                boosts S/N.
            </Callout>
            <Callout title="Try this">
                Reduce the duty cycle and increase the number of harmonics summed. Watch the gain rise.
            </Callout>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <canvas ref={timeRef} className="h-[140px] w-full" />
                <canvas ref={specRef} className="h-[140px] w-full" />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-xs text-black/75">
                    <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">Duty</span>
                    <input
                        type="range"
                        min={0.01}
                        max={0.2}
                        step={0.005}
                        value={duty}
                        onChange={(e) => setDuty(Number(e.target.value))}
                        className="w-40 accent-black"
                    />
                    <span className="text-xs tabular-nums text-black/70">{(duty * 100).toFixed(1)}%</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-black/75">
                    <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">Sum</span>
                    <input
                        type="range"
                        min={1}
                        max={maxH}
                        value={harmonics}
                        onChange={(e) => setHarmonics(Number(e.target.value))}
                        className="w-40 accent-black"
                    />
                    <span className="text-xs tabular-nums text-black/70">{harmonics} harmonics</span>
                </label>
            </div>
            <div className="mt-3 text-xs text-black/70">
                Expected harmonics ~ {expected}. S/N gain from summing: {snrGain.toFixed(2)}x
            </div>
        </div>
    );
}

function FourierScallopingDemo() {
    const freqRef = useRef<HTMLCanvasElement | null>(null);
    const recoverRef = useRef<HTMLCanvasElement | null>(null);
    const [offset, setOffset] = useState(0.35);
    const [interbin, setInterbin] = useState(false);

    const sinc = (x: number) => {
        if (Math.abs(x) < 1e-6) return 1;
        return Math.sin(x) / x;
    };

    useEffect(() => {
        const freqCanvas = freqRef.current;
        const recoverCanvas = recoverRef.current;
        if (!freqCanvas || !recoverCanvas) return;
        const freqCtx = freqCanvas.getContext("2d");
        const recoverCtx = recoverCanvas.getContext("2d");
        if (!freqCtx || !recoverCtx) return;

        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        const freqRect = freqCanvas.getBoundingClientRect();
        freqCanvas.width = Math.max(1, Math.floor(freqRect.width * dpr));
        freqCanvas.height = Math.max(1, Math.floor(freqRect.height * dpr));
        freqCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const recoverRect = recoverCanvas.getBoundingClientRect();
        recoverCanvas.width = Math.max(1, Math.floor(recoverRect.width * dpr));
        recoverCanvas.height = Math.max(1, Math.floor(recoverRect.height * dpr));
        recoverCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const wF = freqRect.width || 1;
        const hF = freqRect.height || 1;
        const wR = recoverRect.width || 1;
        const hR = recoverRect.height || 1;

        drawAxes(freqCtx, wF, hF);
        const bins = 9;
        const binW = wF / bins;
        for (let i = 0; i < bins; i++) {
            const x = i * binW + binW / 2;
            freqCtx.strokeStyle = "rgba(0,0,0,0.2)";
            freqCtx.beginPath();
            freqCtx.moveTo(x, 8);
            freqCtx.lineTo(x, hF - 18);
            freqCtx.stroke();
            freqCtx.fillStyle = "rgba(0,0,0,0.55)";
            freqCtx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
            freqCtx.fillText(`${i - 4}`, x - 4, hF - 6);
        }

        const trueX = (4 + offset) * binW + binW / 2;
        freqCtx.strokeStyle = "rgba(239,68,68,0.9)";
        freqCtx.lineWidth = 2;
        freqCtx.beginPath();
        freqCtx.moveTo(trueX, 10);
        freqCtx.lineTo(trueX, hF - 20);
        freqCtx.stroke();
        freqCtx.fillStyle = "rgba(239,68,68,0.9)";
        freqCtx.fillText("true f", trueX - 10, 16);

        freqCtx.fillStyle = "rgba(0,0,0,0.65)";
        freqCtx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        freqCtx.fillText("Frequency bins", 8, 12);
        freqCtx.fillText("Frequency (bins)", wF - 92, hF - 4);
        freqCtx.save();
        freqCtx.translate(10, hF / 2);
        freqCtx.rotate(-Math.PI / 2);
        freqCtx.fillText("Bin center", 0, 0);
        freqCtx.restore();

        drawAxes(recoverCtx, wR, hR);
        const nearest = Math.abs(sinc(Math.PI * offset));
        const inter = Math.max(
            Math.abs(sinc(Math.PI * (offset - 0.5))),
            Math.abs(sinc(Math.PI * (offset + 0.5)))
        );
        const bars = [{ label: "Nearest bin", value: nearest, color: "rgba(239,68,68,0.9)" }];
        if (interbin) {
            bars.push({ label: "Interbin", value: inter, color: "rgba(16,185,129,0.9)" });
        }
        const max = Math.max(nearest, inter, 1e-6);
        const barW = wR / bars.length;
        bars.forEach((bar, i) => {
            const hBar = (bar.value / max) * (hR - 28);
            const x = i * barW;
            const y = hR - hBar - 10;
            recoverCtx.fillStyle = bar.color;
            recoverCtx.fillRect(x + barW * 0.2, y, barW * 0.6, hBar);
            recoverCtx.fillStyle = "rgba(0,0,0,0.6)";
            recoverCtx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
            recoverCtx.fillText(bar.label, x + 6, hR - 2);
        });
        recoverCtx.fillStyle = "rgba(0,0,0,0.65)";
        recoverCtx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        recoverCtx.fillText("Recovered response", 8, 12);
        recoverCtx.save();
        recoverCtx.translate(10, hR / 2);
        recoverCtx.rotate(-Math.PI / 2);
        recoverCtx.fillText("Amplitude", 0, 0);
        recoverCtx.restore();
    }, [offset, interbin]);

    const peak = Math.abs(Math.sin(Math.PI * offset) / (Math.PI * offset || 1));
    const loss = Math.max(0, 1 - peak);

    return (
        <div className="mt-4 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-4 sm:px-5 sm:py-5 text-left">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/70">
                Interactive: Fourier scalloping
            </div>
            <div className="mt-2 text-xs sm:text-sm text-black/70">
                Slide the fractional-bin offset. Peaks drop when the signal falls between FFT bins.
            </div>
            <Callout title="Why it matters">
                At half a bin, the response falls to about 64%, a ~36% sensitivity loss. That is why interbinning helps.
            </Callout>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <canvas ref={freqRef} className="h-[150px] w-full" />
                <canvas ref={recoverRef} className="h-[150px] w-full" />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-black/75">
                    <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">Offset</span>
                    <input
                        type="range"
                        min={0}
                        max={0.5}
                        step={0.01}
                        value={offset}
                        onChange={(e) => setOffset(Number(e.target.value))}
                        className="w-44 accent-black"
                    />
                    <span className="text-xs tabular-nums text-black/70">{offset.toFixed(2)}</span>
                </div>
                <label className="flex items-center gap-2 text-xs text-black/75">
                    <input
                        type="checkbox"
                        checked={interbin}
                        onChange={(e) => setInterbin(e.target.checked)}
                        className="h-3 w-3"
                    />
                    Interbin half-step
                </label>
                <div className="text-xs text-black/70">
                    Peak response: {(peak * 100).toFixed(0)}% (loss {(loss * 100).toFixed(0)}%)
                </div>
            </div>
        </div>
    );
}

function AccelerationDemo() {
    const tfRef = useRef<HTMLCanvasElement | null>(null);
    const fftRef = useRef<HTMLCanvasElement | null>(null);
    const [binaryPeriod, setBinaryPeriod] = useState(90);
    const [accel, setAccel] = useState(35);
    const [orbitalPhase, setOrbitalPhase] = useState(0.2);
    const [eccentricity, setEccentricity] = useState(0.1);
    const [obsMinutes, setObsMinutes] = useState(30);
    const [snr, setSnr] = useState(0);
    const [localAccel, setLocalAccel] = useState(0);

    useEffect(() => {
        const tfCanvas = tfRef.current;
        const fftCanvas = fftRef.current;
        if (!tfCanvas || !fftCanvas) return;
        const tfCtx = tfCanvas.getContext("2d");
        const fftCtx = fftCanvas.getContext("2d");
        if (!tfCtx || !fftCtx) return;

        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        const tfRect = tfCanvas.getBoundingClientRect();
        tfCanvas.width = Math.max(1, Math.floor(tfRect.width * dpr));
        tfCanvas.height = Math.max(1, Math.floor(tfRect.height * dpr));
        tfCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const fftRect = fftCanvas.getBoundingClientRect();
        fftCanvas.width = Math.max(1, Math.floor(fftRect.width * dpr));
        fftCanvas.height = Math.max(1, Math.floor(fftRect.height * dpr));
        fftCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const wTf = tfRect.width || 1;
        const hTf = tfRect.height || 1;
        const wFft = fftRect.width || 1;
        const hFft = fftRect.height || 1;

        drawAxes(tfCtx, wTf, hTf);

        const periodSec = binaryPeriod * 60;
        const vMax = (accel * periodSec) / (2 * Math.PI);
        const vScale = vMax * (1 + eccentricity);
        const timeSpan = periodSec;

        tfCtx.strokeStyle = "rgba(0,0,0,0.85)";
        tfCtx.lineWidth = 2;
        tfCtx.beginPath();
        for (let i = 0; i <= 120; i++) {
            const t = (i / 120 - 0.5) * timeSpan;
            const m = (2 * Math.PI * t) / periodSec;
            const v = vMax * (Math.sin(m) + (eccentricity / 2) * Math.sin(2 * m));
            const x = ((t + timeSpan / 2) / timeSpan) * wTf;
            const y = (1 - (v + vScale) / (2 * vScale)) * (hTf - 20) + 10;
            if (i === 0) tfCtx.moveTo(x, y);
            else tfCtx.lineTo(x, y);
        }
        tfCtx.stroke();

        const phaseTime = (orbitalPhase - 0.5) * timeSpan;
        const mPhase = (2 * Math.PI * phaseTime) / periodSec;
        const localV = vMax * (Math.sin(mPhase) + (eccentricity / 2) * Math.sin(2 * mPhase));
        const dvdt =
            (2 * Math.PI / periodSec) *
            vMax *
            (Math.cos(mPhase) + eccentricity * Math.cos(2 * mPhase));
        setLocalAccel(dvdt);
        const localX = ((phaseTime + timeSpan / 2) / timeSpan) * wTf;
        const localY = (1 - (localV + vScale) / (2 * vScale)) * (hTf - 20) + 10;

        tfCtx.fillStyle = "rgba(239,68,68,0.9)";
        tfCtx.beginPath();
        tfCtx.arc(localX, localY, 4, 0, Math.PI * 2);
        tfCtx.fill();

        tfCtx.strokeStyle = "rgba(239,68,68,0.9)";
        const obsSec = obsMinutes * 60;
        const tStart = phaseTime - obsSec / 2;
        const tEnd = phaseTime + obsSec / 2;
        tfCtx.setLineDash([6, 6]);
        tfCtx.beginPath();
        for (let i = 0; i <= 40; i++) {
            const t = tStart + (i / 40) * (tEnd - tStart);
            const v = localV + dvdt * (t - phaseTime);
            const x = ((t + timeSpan / 2) / timeSpan) * wTf;
            const y = (1 - (v + vScale) / (2 * vScale)) * (hTf - 20) + 10;
            if (i === 0) tfCtx.moveTo(x, y);
            else tfCtx.lineTo(x, y);
        }
        tfCtx.stroke();
        tfCtx.setLineDash([]);

        tfCtx.fillStyle = "rgba(239,68,68,0.18)";
        const xStart = ((tStart + timeSpan / 2) / timeSpan) * wTf;
        const xEnd = ((tEnd + timeSpan / 2) / timeSpan) * wTf;
        tfCtx.fillRect(Math.min(xStart, xEnd), 10, Math.abs(xEnd - xStart), hTf - 20);

        tfCtx.fillStyle = "rgba(0,0,0,0.65)";
        tfCtx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        tfCtx.fillText("Radial velocity curve", 8, 12);
        tfCtx.fillText("Time (s)", wTf - 54, hTf - 6);
        tfCtx.save();
        tfCtx.translate(12, hTf / 2);
        tfCtx.rotate(-Math.PI / 2);
        tfCtx.fillText("Velocity (arb.)", 0, 0);
        tfCtx.restore();

        drawAxes(fftCtx, wFft, hFft);
        const bins = 240;
        const values = new Array<number>(bins).fill(0);
        const peakPos = 0.55;
        const driftBins = (Math.abs(dvdt) * obsSec) / 1200;
        const driftSpan = clamp01(driftBins);
        const width = 0.012 + clamp01(driftSpan * 1.2) * 0.05;
        const finalWidth = width;
        for (let i = 0; i < bins; i++) {
            const u = i / (bins - 1);
            const noise = 0.18 + 0.05 * Math.sin(u * 12);
            const peak = gauss(u, peakPos, finalWidth) * 1.2;
            values[i] = noise + peak;
        }

        let min = Infinity;
        let max = -Infinity;
        for (const v of values) {
            min = Math.min(min, v);
            max = Math.max(max, v);
        }
        const span = Math.max(1e-6, max - min);
        fftCtx.strokeStyle = "rgba(0,0,0,0.85)";
        fftCtx.lineWidth = 1.6;
        fftCtx.beginPath();
        for (let i = 0; i < values.length; i++) {
            const u = i / (values.length - 1);
            const v = (values[i] - min) / span;
            const x = u * wFft;
            const y = (1 - v) * (hFft - 8) + 4;
            if (i === 0) fftCtx.moveTo(x, y);
            else fftCtx.lineTo(x, y);
        }
        fftCtx.stroke();

        const baseline = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + (b - baseline) ** 2, 0) / values.length;
        const std = Math.sqrt(Math.max(1e-6, variance));
        const peak = Math.max(...values);
        setSnr((peak - baseline) / std);

        fftCtx.fillStyle = "rgba(0,0,0,0.65)";
        fftCtx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        fftCtx.fillText("Smeared FFT peak", 8, 12);
        fftCtx.fillText("Frequency bin", wFft - 74, hFft - 6);
        fftCtx.save();
        fftCtx.translate(12, hFft / 2);
        fftCtx.rotate(-Math.PI / 2);
        fftCtx.fillText("Power", 0, 0);
        fftCtx.restore();
    }, [binaryPeriod, accel, orbitalPhase, eccentricity, obsMinutes]);

    return (
        <div className="mt-4 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-4 sm:px-5 sm:py-5 text-left">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/70">
                Interactive: acceleration drift
            </div>
            <div className="mt-2 text-xs sm:text-sm text-black/70">
                A snapshot of the radial velocity curve shows the local acceleration (tangent). That acceleration smears the FFT.
            </div>
            <Callout title="Classroom note">
                Acceleration is local: it is the slope of the velocity curve at the observation phase.
            </Callout>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <canvas ref={tfRef} className="h-[150px] w-full" />
                <canvas ref={fftRef} className="h-[150px] w-full" />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-xs text-black/75">
                    <label className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">
                            Binary period
                        </span>
                        <input
                            type="range"
                            min={20}
                            max={240}
                            step={5}
                            value={binaryPeriod}
                            onChange={(e) => setBinaryPeriod(Number(e.target.value))}
                            className="w-32 accent-black"
                        />
                        <span className="text-xs tabular-nums text-black/70">{binaryPeriod} min</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">
                            Accel
                        </span>
                        <input
                            type="range"
                            min={0}
                            max={80}
                            step={1}
                            value={accel}
                            onChange={(e) => setAccel(Number(e.target.value))}
                        className="w-32 accent-black"
                    />
                    <span className="text-xs tabular-nums text-black/70">{accel} m/s^2</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">
                            Orbital phase
                        </span>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={orbitalPhase}
                            onChange={(e) => setOrbitalPhase(Number(e.target.value))}
                            className="w-32 accent-black"
                        />
                        <span className="text-xs tabular-nums text-black/70">{orbitalPhase.toFixed(2)}</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">
                            Eccentricity
                        </span>
                        <input
                            type="range"
                            min={0}
                            max={0.8}
                            step={0.02}
                            value={eccentricity}
                            onChange={(e) => setEccentricity(Number(e.target.value))}
                            className="w-32 accent-black"
                        />
                        <span className="text-xs tabular-nums text-black/70">{eccentricity.toFixed(2)}</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">
                            Obs time
                        </span>
                        <input
                            type="range"
                            min={5}
                            max={60}
                            step={1}
                            value={obsMinutes}
                            onChange={(e) => setObsMinutes(Number(e.target.value))}
                            className="w-32 accent-black"
                        />
                        <span className="text-xs tabular-nums text-black/70">{obsMinutes} min</span>
                    </label>
                </div>
            </div>
            <div className="mt-2 text-xs text-black/70">
                Local acceleration: {localAccel.toFixed(1)} m/s^2 • Estimated FFT S/N: {snr.toFixed(1)}
            </div>
        </div>
    );
}

function FoldingTrialDemo() {
    const snrRef = useRef<HTMLCanvasElement | null>(null);
    const profileRef = useRef<HTMLCanvasElement | null>(null);
    const [stage, setStage] = useState(2);
    const totalSamples = 2048;
    const truePeriod = 128;

    const series = useMemo(() => {
        const rng = mulberry32(0xbeef1234);
        const values = new Array<number>(totalSamples);
        for (let i = 0; i < totalSamples; i++) {
            const phase = (i % truePeriod) / truePeriod;
            let d = phase - 0.2;
            d = ((d + 0.5) % 1) - 0.5;
            const pulse = Math.exp(-0.5 * (d / 0.06) ** 2) * 1.8;
            const noise = (rng() - 0.5) * 0.6;
            values[i] = pulse + noise;
        }
        return values;
    }, []);

    const snrCurve = useMemo(() => {
        const minP = 90;
        const maxP = 170;
        const curve: { p: number; snr: number }[] = [];
        for (let p = minP; p <= maxP; p++) {
            const bins = 64;
            const folded = new Array<number>(bins).fill(0);
            const counts = new Array<number>(bins).fill(0);
            for (let i = 0; i < series.length; i++) {
                const phase = (i % p) / p;
                const bin = Math.min(bins - 1, Math.floor(phase * bins));
                folded[bin] += series[i];
                counts[bin] += 1;
            }
            for (let i = 0; i < bins; i++) {
                folded[i] = counts[i] > 0 ? folded[i] / counts[i] : 0;
            }
            const mean = folded.reduce((a, b) => a + b, 0) / bins;
            const variance = folded.reduce((a, b) => a + (b - mean) ** 2, 0) / bins;
            const std = Math.sqrt(Math.max(1e-6, variance));
            const peak = Math.max(...folded);
            curve.push({ p, snr: (peak - mean) / std });
        }
        return curve;
    }, [series]);

    const stride = 2 ** (4 - stage);
    const sampled = snrCurve.filter((_, idx) => idx % stride === 0);
    const best = sampled.reduce((a, b) => (b.snr > a.snr ? b : a), sampled[0]);

    const foldedProfile = useMemo(() => {
        const bins = 64;
        const folded = new Array<number>(bins).fill(0);
        const counts = new Array<number>(bins).fill(0);
        for (let i = 0; i < series.length; i++) {
            const phase = (i % best.p) / best.p;
            const bin = Math.min(bins - 1, Math.floor(phase * bins));
            folded[bin] += series[i];
            counts[bin] += 1;
        }
        for (let i = 0; i < bins; i++) {
            folded[i] = counts[i] > 0 ? folded[i] / counts[i] : 0;
        }
        return folded;
    }, [series, best.p]);

    const naiveAdds = useMemo(() => {
        const factor = Math.max(1, Math.floor(totalSamples / best.p));
        return totalSamples * (factor - 1);
    }, [totalSamples, best.p]);

    const ffaAdds = useMemo(() => {
        const factor = Math.max(1, Math.floor(totalSamples / best.p));
        return Math.round(totalSamples * Math.log2(factor));
    }, [totalSamples, best.p]);

    useEffect(() => {
        const canvas = snrRef.current;
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
        drawAxes(ctx, w, h);

        const maxS = Math.max(...snrCurve.map((v) => v.snr), 1e-6);
        ctx.strokeStyle = "rgba(0,0,0,0.25)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        snrCurve.forEach((pt, i) => {
            const x = ((pt.p - 90) / 80) * w;
            const y = (1 - pt.snr / maxS) * (h - 20) + 10;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        sampled.forEach((pt) => {
            const x = ((pt.p - 90) / 80) * w;
            const y = (1 - pt.snr / maxS) * (h - 20) + 10;
            ctx.fillStyle = pt.p === best.p ? "rgba(239,68,68,0.9)" : "rgba(0,0,0,0.7)";
            ctx.beginPath();
            ctx.arc(x, y, pt.p === best.p ? 4 : 2.5, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("FFA sample of trial periods", 8, 12);
        ctx.fillText("Trial period (samples)", w - 140, h - 6);
        ctx.save();
        ctx.translate(12, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("Folded S/N", 0, 0);
        ctx.restore();
    }, [snrCurve, sampled, best.p]);

    useEffect(() => {
        const canvas = profileRef.current;
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
        drawAxes(ctx, w, h);

        let min = Infinity;
        let max = -Infinity;
        for (const v of foldedProfile) {
            min = Math.min(min, v);
            max = Math.max(max, v);
        }
        const span = Math.max(1e-6, max - min);
        ctx.strokeStyle = "rgba(0,0,0,0.85)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < foldedProfile.length; i++) {
            const x = (i / (foldedProfile.length - 1)) * w;
            const v = (foldedProfile[i] - min) / span;
            const y = (1 - v) * (h - 20) + 10;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(`Best trial P = ${best.p}`, 8, 12);
        ctx.fillText("Phase", w - 42, h - 6);
        ctx.save();
        ctx.translate(12, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("Flux", 0, 0);
        ctx.restore();
    }, [foldedProfile, best.p]);

    return (
        <div className="mt-4 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-4 sm:px-5 sm:py-5 text-left">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/70">
                Interactive: fast folding algorithm
            </div>
            <div className="mt-2 text-xs sm:text-sm text-black/70">
                FFA samples a dense grid of trial periods with far fewer additions than brute-force folding.
            </div>
            <Callout title="Concept">
                The FFA searches many trial periods efficiently by reusing partial sums, which is why it performs well for
                long periods.
            </Callout>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <canvas ref={snrRef} className="h-[160px] w-full" />
                <canvas ref={profileRef} className="h-[160px] w-full" />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-black/75">
                    <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">Stage</span>
                    <input
                        type="range"
                        min={0}
                        max={4}
                        step={1}
                        value={stage}
                        onChange={(e) => setStage(Number(e.target.value))}
                        className="w-44 accent-black"
                    />
                    <span className="text-xs tabular-nums text-black/70">Level {stage}</span>
                </div>
                <div className="text-xs text-black/70">
                    Trial periods grow by powers of two. Adds: naive ~{naiveAdds}, FFA ~{ffaAdds}.
                </div>
            </div>
        </div>
    );
}

function SinglePulseDemo() {
    const timeRef = useRef<HTMLCanvasElement | null>(null);
    const foldRef = useRef<HTMLCanvasElement | null>(null);
    const [threshold, setThreshold] = useState(0.5);
    const [periodic, setPeriodic] = useState(1.0);
    const [burstRate, setBurstRate] = useState(0.04);

    const series = useMemo(() => {
        const n = 360;
        const period = 36;
        const rng = mulberry32(0xdecafbad);
        const values = new Array<number>(n);
        for (let i = 0; i < n; i++) {
            const noise = (rng() - 0.5) * 0.5;
            const phase = (i % period) / period;
            let d = phase - 0.25;
            d = ((d + 0.5) % 1) - 0.5;
            const pulse = Math.exp(-0.5 * (d / 0.08) ** 2) * periodic;
            const burst = rng() < burstRate ? 1.4 + rng() * 0.8 : 0;
            values[i] = noise + pulse + burst;
        }
        return { values, period };
    }, [periodic, burstRate]);

    const above = series.values.filter((v) => v > threshold).length;

    const folded = useMemo(() => {
        const bins = 48;
        const profile = new Array<number>(bins).fill(0);
        const counts = new Array<number>(bins).fill(0);
        for (let i = 0; i < series.values.length; i++) {
            const phase = (i % series.period) / series.period;
            const bin = Math.min(bins - 1, Math.floor(phase * bins));
            profile[bin] += series.values[i];
            counts[bin] += 1;
        }
        for (let i = 0; i < bins; i++) {
            profile[i] = counts[i] > 0 ? profile[i] / counts[i] : 0;
        }
        return profile;
    }, [series]);

    const periodicSnr = useMemo(() => {
        const mean = folded.reduce((a, b) => a + b, 0) / folded.length;
        const variance = folded.reduce((a, b) => a + (b - mean) ** 2, 0) / folded.length;
        const std = Math.sqrt(Math.max(1e-6, variance));
        const peak = Math.max(...folded);
        return (peak - mean) / std;
    }, [folded]);

    useEffect(() => {
        const canvas = timeRef.current;
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
        drawAxes(ctx, w, h);

        let min = Infinity;
        let max = -Infinity;
        for (const v of series.values) {
            min = Math.min(min, v);
            max = Math.max(max, v);
        }
        const span = Math.max(1e-6, max - min);

        ctx.strokeStyle = "rgba(0,0,0,0.85)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i < series.values.length; i++) {
            const u = i / (series.values.length - 1);
            const v = (series.values[i] - min) / span;
            const x = u * w;
            const y = (1 - v) * (h - 8) + 4;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        const tNorm = clamp01((threshold - min) / span);
        const yT = (1 - tNorm) * (h - 8) + 4;
        ctx.strokeStyle = "rgba(239,68,68,0.85)";
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, yT);
        ctx.lineTo(w, yT);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("Time series + threshold", 8, 12);
    }, [series, threshold]);

    useEffect(() => {
        const canvas = foldRef.current;
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
        drawAxes(ctx, w, h);

        let min = Infinity;
        let max = -Infinity;
        for (const v of folded) {
            min = Math.min(min, v);
            max = Math.max(max, v);
        }
        const span = Math.max(1e-6, max - min);

        ctx.strokeStyle = "rgba(0,0,0,0.85)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < folded.length; i++) {
            const u = i / (folded.length - 1);
            const v = (folded[i] - min) / span;
            const x = u * w;
            const y = (1 - v) * (h - 8) + 4;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("Folded profile (periodicity)", 8, 12);
    }, [folded]);

    return (
        <div className="mt-4 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-4 sm:px-5 sm:py-5 text-left">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/70">
                Interactive: single-pulse vs periodicity
            </div>
            <div className="mt-2 text-xs sm:text-sm text-black/70">
                The same data can favor bursts in the time domain or periodic folding, depending on burstiness and strength.
            </div>
            <Callout title="Try this">
                Increase burst rate while lowering periodic strength. Single-pulse detections rise as periodic S/N drops.
            </Callout>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <canvas ref={timeRef} className="h-[140px] w-full" />
                <canvas ref={foldRef} className="h-[140px] w-full" />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-xs text-black/75">
                    <label className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">
                            Periodic
                        </span>
                        <input
                            type="range"
                            min={0.2}
                            max={1.6}
                            step={0.05}
                            value={periodic}
                            onChange={(e) => setPeriodic(Number(e.target.value))}
                            className="w-32 accent-black"
                        />
                        <span className="text-xs tabular-nums text-black/70">{periodic.toFixed(2)}</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">
                            Burst rate
                        </span>
                        <input
                            type="range"
                            min={0}
                            max={0.12}
                            step={0.01}
                            value={burstRate}
                            onChange={(e) => setBurstRate(Number(e.target.value))}
                            className="w-28 accent-black"
                        />
                        <span className="text-xs tabular-nums text-black/70">{burstRate.toFixed(2)}</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">
                            Threshold
                        </span>
                        <input
                            type="range"
                            min={0.2}
                            max={1.2}
                            step={0.02}
                            value={threshold}
                            onChange={(e) => setThreshold(Number(e.target.value))}
                            className="w-28 accent-black"
                        />
                        <span className="text-xs tabular-nums text-black/70">{threshold.toFixed(2)}</span>
                    </label>
                </div>
                <div className="text-xs text-black/70">
                    Bursts above threshold: {above} • Periodic S/N: {periodicSnr.toFixed(1)}
                </div>
            </div>
        </div>
    );
}

function PhaseModulationDemo() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [modIndex, setModIndex] = useState(1.6);
    const [spacing, setSpacing] = useState(1.0);

    const factorial = (n: number) => {
        let v = 1;
        for (let i = 2; i <= n; i++) v *= i;
        return v;
    };

    const besselJ = (n: number, x: number) => {
        let sum = 0;
        for (let m = 0; m < 12; m++) {
            const sign = m % 2 === 0 ? 1 : -1;
            const num = Math.pow(x / 2, 2 * m + n);
            const denom = factorial(m) * factorial(m + n);
            sum += sign * num / denom;
        }
        return sum;
    };

    const bands = useMemo(() => {
        const range = 6;
        const values = [];
        for (let n = -range; n <= range; n++) {
            const amp = Math.abs(besselJ(Math.abs(n), modIndex));
            values.push({ n, amp, freq: n * spacing });
        }
        return values;
    }, [modIndex, spacing]);

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
        drawAxes(ctx, w, h);

        const maxAmp = Math.max(...bands.map((b) => b.amp), 1e-6);
        const barW = w / bands.length;
        bands.forEach((band, i) => {
            const v = band.amp / maxAmp;
            const barH = v * (h - 24);
            const x = i * barW;
            const y = h - barH - 8;
            ctx.fillStyle = band.n === 0 ? "rgba(0,0,0,0.9)" : "rgba(0,0,0,0.55)";
            ctx.fillRect(x + barW * 0.2, y, barW * 0.6, barH);
            ctx.fillStyle = "rgba(0,0,0,0.55)";
            ctx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText(`${band.freq.toFixed(1)}`, x + barW * 0.3, h - 4);
        });

        ctx.fillStyle = "rgba(0,0,0,0.65)";
        ctx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("Sidebands around the spin frequency", 8, 12);
        ctx.fillText("Offset (bins)", w - 78, h - 6);
        ctx.save();
        ctx.translate(12, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("Amplitude", 0, 0);
        ctx.restore();
    }, [bands]);

    return (
        <div className="mt-4 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-4 sm:px-5 sm:py-5 text-left">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/70">
                Interactive: phase modulation sidebands
            </div>
            <div className="mt-2 text-xs sm:text-sm text-black/70">
                Short-orbit binaries split power into sidebands spaced by the orbital frequency.
            </div>
            <Callout title="Concept">
                Orbital motion phase-modulates the signal, creating a comb of sidebands whose amplitudes follow Bessel
                functions.
            </Callout>
            <canvas ref={canvasRef} className="mt-3 h-[160px] w-full" />
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-black/75">
                <label className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">
                        Modulation index
                    </span>
                    <input
                        type="range"
                        min={0.1}
                        max={4}
                        step={0.1}
                        value={modIndex}
                        onChange={(e) => setModIndex(Number(e.target.value))}
                        className="w-40 accent-black"
                    />
                    <span className="text-xs tabular-nums text-black/70">{modIndex.toFixed(1)}</span>
                </label>
                <label className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">
                        Orbital spacing
                    </span>
                    <input
                        type="range"
                        min={0.5}
                        max={3}
                        step={0.1}
                        value={spacing}
                        onChange={(e) => setSpacing(Number(e.target.value))}
                        className="w-32 accent-black"
                    />
                    <span className="text-xs tabular-nums text-black/70">{spacing.toFixed(1)} bins</span>
                </label>
            </div>
        </div>
    );
}

function RFIDemo() {
    const rawRef = useRef<HTMLCanvasElement | null>(null);
    const cleanRef = useRef<HTMLCanvasElement | null>(null);
    const [maskNarrow, setMaskNarrow] = useState(true);
    const [maskBroad, setMaskBroad] = useState(false);
    const [threshold, setThreshold] = useState(0.65);

    useEffect(() => {
        const rawCanvas = rawRef.current;
        const cleanCanvas = cleanRef.current;
        if (!rawCanvas || !cleanCanvas) return;
        const rawCtx = rawCanvas.getContext("2d");
        const cleanCtx = cleanCanvas.getContext("2d");
        if (!rawCtx || !cleanCtx) return;

        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        const rawRect = rawCanvas.getBoundingClientRect();
        rawCanvas.width = Math.max(1, Math.floor(rawRect.width * dpr));
        rawCanvas.height = Math.max(1, Math.floor(rawRect.height * dpr));
        rawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const cleanRect = cleanCanvas.getBoundingClientRect();
        cleanCanvas.width = Math.max(1, Math.floor(cleanRect.width * dpr));
        cleanCanvas.height = Math.max(1, Math.floor(cleanRect.height * dpr));
        cleanCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const w = rawRect.width || 1;
        const h = rawRect.height || 1;

        const rows = 48;
        const cols = 96;
        const rng = mulberry32(0x2024);
        const field: number[][] = [];
        for (let y = 0; y < rows; y++) {
            const row: number[] = [];
            for (let x = 0; x < cols; x++) {
                const base = 0.18 + 0.12 * (rng() - 0.5);
                const narrow =
                    (Math.abs(x - 26) < 1 ? 1.2 : 0) +
                    (Math.abs(x - 58) < 1 ? 1.0 : 0) +
                    (Math.abs(x - 74) < 1 ? 1.1 : 0);
                const broad = y > 30 && y < 40 ? 0.6 : 0;
                const pulse = x > 35 && x < 40 && y % 10 === 0 ? 0.8 : 0;
                row.push(base + narrow + broad + pulse);
            }
            field.push(row);
        }

        const drawField = (ctx: CanvasRenderingContext2D, masked: boolean) => {
            drawAxes(ctx, w, h);
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    let val = field[y][x];
                    const isNarrow = x === 26 || x === 58 || x === 74;
                    const isBroad = y > 30 && y < 40;
                    if (masked) {
                        if (maskNarrow && isNarrow) val *= 0.15;
                        if (maskBroad && isBroad) val *= 0.2;
                    }
                    const shade = Math.round(255 - clamp01(val) * 180);
                    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
                    const px = (x / cols) * w;
                    const py = (y / rows) * h;
                    ctx.fillRect(px, py, w / cols + 1, h / rows + 1);
                }
            }

            const tLine = h - clamp01(threshold) * h;
            ctx.strokeStyle = "rgba(239,68,68,0.6)";
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(0, tLine);
            ctx.lineTo(w, tLine);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText("Frequency channel", w - 98, h - 6);
            ctx.save();
            ctx.translate(12, h / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText("Time", 0, 0);
            ctx.restore();
        };

        drawField(rawCtx, false);
        drawField(cleanCtx, true);

        rawCtx.fillStyle = "rgba(0,0,0,0.6)";
        rawCtx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        rawCtx.fillText("Raw time-frequency map", 8, 12);

        cleanCtx.fillStyle = "rgba(0,0,0,0.6)";
        cleanCtx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        cleanCtx.fillText("Masked map", 8, 12);
    }, [maskBroad, maskNarrow, threshold]);

    return (
        <div className="mt-4 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-4 sm:px-5 sm:py-5 text-left">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/70">
                Interactive: RFI excision
            </div>
            <div className="mt-2 text-xs sm:text-sm text-black/70">
                Mask narrowband interference and broadband contamination to keep false alarms down.
            </div>
            <Callout title="Why it matters">
                Unmasked interference can create false candidates that dominate the search. Masking reduces workload and
                biases.
            </Callout>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <canvas ref={rawRef} className="h-[150px] w-full" />
                <canvas ref={cleanRef} className="h-[150px] w-full" />
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-xs text-black/75">
                    <input
                        type="checkbox"
                        checked={maskNarrow}
                        onChange={(e) => setMaskNarrow(e.target.checked)}
                        className="h-3 w-3"
                    />
                    Mask narrowband spikes
                </label>
                <label className="flex items-center gap-2 text-xs text-black/75">
                    <input
                        type="checkbox"
                        checked={maskBroad}
                        onChange={(e) => setMaskBroad(e.target.checked)}
                        className="h-3 w-3"
                    />
                    Mask broadband contamination
                </label>
                <label className="flex items-center gap-2 text-xs text-black/75">
                    <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">Threshold</span>
                    <input
                        type="range"
                        min={0.3}
                        max={0.9}
                        step={0.05}
                        value={threshold}
                        onChange={(e) => setThreshold(Number(e.target.value))}
                        className="w-32 accent-black"
                    />
                    <span className="text-xs tabular-nums text-black/70">{threshold.toFixed(2)}</span>
                </label>
            </div>
        </div>
    );
}

function StrategyAtlas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const pulseRef = useRef<HTMLCanvasElement | null>(null);
    const [freq, setFreq] = useState(1.4);
    const [time, setTime] = useState(25);
    const [budget, setBudget] = useState(50);
    const [target, setTarget] = useState("young");

    const targets = [
        { key: "young", label: "Young pulsars", scatter: 0.8, binary: 0.3 },
        { key: "msp", label: "Millisecond pulsars", scatter: 0.3, binary: 0.6 },
        { key: "binary", label: "Compact binaries", scatter: 0.4, binary: 0.9 },
        { key: "faint", label: "Very faint sources", scatter: 0.5, binary: 0.4 },
    ];

    const current = targets.find((t) => t.key === target) ?? targets[0];

    const scoreAt = (f: number, t: number) => {
        const freqNorm = clamp01((f - 0.4) / 2.2);
        const timeNorm = clamp01((t - 5) / 55);
        const scatterPenalty = current.scatter * clamp01(1 - freqNorm);
        const binaryPenalty = current.binary * clamp01(timeNorm);
        const depth = 0.4 + 0.6 * timeNorm;
        const freqBoost = 0.5 + 0.5 * freqNorm;
        return clamp01(depth * freqBoost - 0.25 * scatterPenalty - 0.15 * binaryPenalty);
    };

    const score = scoreAt(freq, time);
    const coverage = clamp01(budget / Math.max(1, time));

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
        drawAxes(ctx, w, h);

        const grid = 40;
        for (let i = 0; i < grid; i++) {
            for (let j = 0; j < grid; j++) {
                const f = 0.4 + (i / (grid - 1)) * 2.2;
                const t = 5 + (j / (grid - 1)) * 55;
                const s = scoreAt(f, t);
                const shade = Math.round(255 - s * 180);
                ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
                const x = (i / (grid - 1)) * w;
                const y = h - (j / (grid - 1)) * h;
                ctx.fillRect(x, y, w / grid + 1, h / grid + 1);
            }
        }

        const x = clamp01((freq - 0.4) / 2.2) * w;
        const y = h - clamp01((time - 5) / 55) * h;
        ctx.strokeStyle = "rgba(239,68,68,0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.stroke();

        const budgetLineY = h - clamp01((budget - 5) / 55) * h;
        ctx.strokeStyle = "rgba(16,185,129,0.7)";
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(0, budgetLineY);
        ctx.lineTo(w, budgetLineY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("Freq (GHz)", w - 60, h - 6);
        ctx.save();
        ctx.translate(10, 18);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("Integration (min)", 0, 0);
        ctx.restore();
    }, [freq, time, current, budget]);

    useEffect(() => {
        const canvas = pulseRef.current;
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
        drawAxes(ctx, w, h);

        const scatter = current.scatter * (1 / Math.max(0.6, freq));
        const width = 0.02 + scatter * 0.05;
        const tail = scatter * 0.18;
        const amp = 0.4 + score * 0.8;

        ctx.strokeStyle = "rgba(0,0,0,0.85)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < 200; i++) {
            const phase = i / 199;
            let pulse = Math.exp(-0.5 * ((phase - 0.25) / width) ** 2);
            if (phase > 0.25) {
                pulse *= Math.exp(-(phase - 0.25) / Math.max(0.02, tail));
            }
            const yVal = 0.1 + amp * pulse;
            const x = phase * w;
            const y = (1 - yVal) * (h - 10) + 5;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("Pulse profile (scattering + S/N)", 8, 12);
        ctx.fillText("Phase", w - 42, h - 6);
        ctx.save();
        ctx.translate(12, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("Flux", 0, 0);
        ctx.restore();
    }, [freq, current, score]);

    return (
        <div className="mt-4 w-full rounded-2xl border border-black/10 bg-black/5 px-4 py-4 sm:px-5 sm:py-5 text-left">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/70">
                Interactive: survey strategy trade-offs
            </div>
            <div className="mt-2 text-xs sm:text-sm text-black/70">
                Explore how center frequency and integration time trade sensitivity for different pulsar populations.
            </div>
            <Callout title="Classroom lens">
                Higher frequency reduces scattering, longer integration boosts depth, but binaries blur over long spans.
            </Callout>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5">
                    <div className="grid grid-cols-1 gap-2">
                        {targets.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setTarget(t.key)}
                                className={cn(
                                    "rounded-xl border px-3 py-2 text-left text-xs transition-colors",
                                    t.key === target
                                        ? "border-black bg-black text-white"
                                        : "border-black/10 bg-white/70 text-black/70 hover:bg-black/5"
                                )}
                            >
                                <div className="text-[10px] font-semibold tracking-[0.2em] uppercase opacity-70">
                                    {t.label}
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="mt-4 space-y-3">
                        <label className="flex items-center gap-2 text-xs text-black/75">
                            <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">
                                Frequency
                            </span>
                            <input
                                type="range"
                                min={0.4}
                                max={2.6}
                                step={0.05}
                                value={freq}
                                onChange={(e) => setFreq(Number(e.target.value))}
                                className="w-44 accent-black"
                            />
                            <span className="text-xs tabular-nums text-black/70">{freq.toFixed(2)} GHz</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-black/75">
                            <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">
                                Integration
                            </span>
                            <input
                                type="range"
                                min={5}
                                max={60}
                                step={1}
                                value={time}
                                onChange={(e) => setTime(Number(e.target.value))}
                                className="w-44 accent-black"
                            />
                            <span className="text-xs tabular-nums text-black/70">{time} min</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-black/75">
                            <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-black/60">
                                Survey budget
                            </span>
                            <input
                                type="range"
                                min={10}
                                max={60}
                                step={1}
                                value={budget}
                                onChange={(e) => setBudget(Number(e.target.value))}
                                className="w-44 accent-black"
                            />
                            <span className="text-xs tabular-nums text-black/70">{budget} min</span>
                        </label>
                    </div>
                </div>
                <div className="lg:col-span-7">
                    <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
                        <canvas ref={canvasRef} className="h-[220px] w-full" />
                        <div className="mt-3 text-xs text-black/70">
                            Sensitivity score: {(score * 100).toFixed(0)}% • Coverage score: {(coverage * 100).toFixed(0)}%
                        </div>
                        <div className="mt-2 text-xs text-black/60">
                            Green dashed line shows the max integration time for the current survey budget.
                        </div>
                        <canvas ref={pulseRef} className="mt-4 h-[120px] w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function SearchModeChapter6({
    theme,
    setTheme,
}: {
    theme: Theme;
    setTheme: (t: Theme) => void;
}) {
    const reduced = usePrefersReducedMotion();
    const navigate = useNavigate();

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
    }, [setTheme]);

    usePageMeta(
        "Search Mode Chapter 6 - Finding new pulsars",
        "Interactive Chapter 6 with dedispersion, FFT searches, binary acceleration, time-domain hunting, RFI mitigation, and search strategy tradeoffs."
    );

    const sections = useMemo(() => splitMarkdownSections(chapterMarkdown), []);

    const renderInteraction = (heading: string) => {
        if (heading === "6.1.1.1 Simple de-dispersion") return <DispersionDemo />;
        if (heading === "6.1.1.2 Choice of dispersion step size") return <DmStepSNRDemo />;
        if (heading === "6.1.1.3 Tree de-dispersion") return <TreeDedispersionDemo />;
        if (heading === "6.1.2 Barycentric correction for long time series") return <BarycentricCorrectionDemo />;
        if (heading === "6.1.3.2 Searching for periodic signals in the Fourier domain") return <FourierScallopingDemo />;
        if (heading === "6.1.3.3 Removing low-frequency noise") return <RedNoiseWhiteningDemo />;
        if (heading === "6.1.3.4 Increasing sensitivity to narrow pulses") return <HarmonicSummingDemo />;
        if (heading === "6.1.3.6 Reconstructed profiles") return <ReconstructedProfileDemo />;
        if (heading === "6.1.3.7 Two-dimensional Fourier analysis") return <TwoDimensionalFourierDemo />;
        if (heading === "6.1.4 Candidate selection") return <CandidateSelectionDemo />;
        if (heading === "6.2 Searches for pulsars in binary systems") return <AccelerationDemo />;
        if (heading === "6.2.2.1 Correlation method") return <CorrelationMethodDemo />;
        if (heading === "6.2.2.2 Stack/slide searches") return <StackSlideSearchDemo />;
        if (heading === "6.2.2.3 Phase-modulation searches") return <PhaseModulationDemo />;
        if (heading === "6.2.2.4 Dynamic power spectrum search") return <DynamicPowerSpectrumDemo />;
        if (heading === "6.3.1 Fast folding analyses") return <FoldingTrialDemo />;
        if (heading === "6.3.2 Single-pulse searches") return <SinglePulseDemo />;
        if (heading === "6.4.2 Frequency domain masking") return <RFIDemo />;
        if (heading === "6.5 Pulsar search strategies") return <StrategyAtlas />;
        return null;
    };

    return (
        <div className={cn("min-h-[100svh] w-full text-justify", "bg-white text-black")}>
            <div className="mx-auto max-w-[1100px] px-5 sm:px-8 lg:px-10 py-10 sm:py-14">
                <div className="flex items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className={cn(
                            "rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase transition-colors",
                            "border-black/10 bg-black text-white hover:bg-black/90"
                        )}
                    >
                        &larr; Back
                    </button>
                    <div className={cn("text-xs font-semibold tracking-[0.32em] uppercase", "text-black/55")}>
                        Search Mode / Chapter 6
                    </div>
                </div>

                <motion.h1
                    className={cn("mt-8 text-4xl sm:text-6xl font-black tracking-[-0.04em]", "text-black")}
                    initial={reduced ? undefined : { opacity: 0, y: 10 }}
                    animate={reduced ? undefined : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    Finding new pulsars
                </motion.h1>

                <div className="mt-8 space-y-10">
                    {sections.map((section, idx) => (
                        <div key={`${section.heading}-${idx}`}>
                            <div className="mx-auto max-w-[82ch]">
                                <MarkdownProse theme="light" markdown={section.markdown} />
                            </div>
                            {renderInteraction(section.heading)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
