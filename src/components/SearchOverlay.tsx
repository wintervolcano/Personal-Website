// src/components/SearchOverlay.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type Pulsar } from "../lib/pulsars";
import { getTrapumPulsars, type TrapumPulsar } from "../lib/trapumPulsars";
import { recordDetection } from "../lib/detections";

type Theme = "light" | "dark";

type LogEntry = { id: string; rank: number; ts: number };
const LOGBOOK_KEY = "fk_session_logbook_v1";
const SESSION_KEY = "fk_session_found_v1";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
function gauss(x: number, mu: number, sigma: number) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z);
}
function hashToUint32(s: string) {
  // FNV-1a 32-bit
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

function drawAxes(ctx: CanvasRenderingContext2D, w: number, h: number, theme: Theme) {
  ctx.clearRect(0, 0, w, h);
  ctx.save();

  ctx.globalAlpha = theme === "dark" ? 0.25 : 0.22;
  ctx.strokeStyle = theme === "dark" ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

  ctx.globalAlpha = theme === "dark" ? 0.12 : 0.1;
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

type ScanState = {
  mouseX: number;
  mouseY: number;
  cellX: number;
  cellY: number;
  cellIndex: number;
  nonce: number;
};

type HotspotInfo = {
  pulsar: Pulsar;
  hx: number; // inside-tile [0..1]
  hy: number; // inside-tile [0..1]
};

type Stats = {
  wallSec: number;
  dataTB: number;
  diskGB: number;
  cpuHrs: number;
  gpuHrs: number;
  files: number;
  candidates: number;
};

function difficultyKnobs(p: Pulsar) {
  const base = (p as any).difficulty as "easy" | "medium" | "hard" | undefined;
  const d = base || "medium";
  const peakAmp = d === "easy" ? 1.55 : d === "medium" ? 1.2 : 1.0;
  const decoys = d === "easy" ? 1 : d === "medium" ? 3 : 5;
  const tol = d === "easy" ? 0.02 : d === "medium" ? 0.013 : 0.009;
  const peakW = d === "easy" ? 0.0052 : d === "medium" ? 0.0041 : 0.0032;
  return { base: d, peakAmp, decoys, tol, peakW };
}
function peakPosFor(p: Pulsar) {
  const fMin = 0;
  const fMax = 900;
  const f0 = (p as any).f0_hz as number;
  return clamp01((f0 - fMin) / (fMax - fMin));
}
function fmt(n: number) {
  return n >= 1000 ? n.toFixed(0) : n.toFixed(1);
}

const MISS_LINES = [
  "Close! But the universe is noisy — try a sharper peak.",
  "RFI says hello 👋. Hunt again.",
  "Not this time. Your next click will be legendary.",
  "That peak was a decoy. The pulsar is still out there.",
  "Good instincts. Wrong bin. Adjust and fire again.",
];


function shuffleDeterministic<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  const r = mulberry32(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

// ---- Layout-safe region (keeps hotspots away from top nav + bottom overlay) ----
const SAFE_TOP_PX = 96;   // approximate navbar height
const SAFE_BOTTOM_PX = 220; // approx overlay + footer area

export function SearchOverlay({
  theme,
  pageKey,
  onSolved,
  onOpenDetection,
  sitePageKeys,
}: {
  theme: Theme;
  pageKey: string;
  onSolved: (p: Pulsar, rank: number, stats?: { candidates: number; cpuHrs: number; gpuHrs: number; dataTB: number }) => void;
  onOpenDetection: (p: Pulsar, rank: number) => void;
  /**
   * Pass ALL discoverable pages here (including blog/research slugs).
   * When you add/remove pages, pulsars are automatically redistributed
   * with no manual salt changes.
   */
  sitePageKeys?: string[];
}) {
  const isActive = theme === "dark";
  const reduced = usePrefersReducedMotion();

  const tsRef = useRef<HTMLCanvasElement | null>(null);
  const fftRef = useRef<HTMLCanvasElement | null>(null);

  const GRID_X = 8;
  const GRID_Y = 6;
  const CELL_COUNT = GRID_X * GRID_Y;

  const [allowedCellIndices, setAllowedCellIndices] = useState<number[]>(() => {
    const idxs: number[] = [];
    for (let y = 0; y < GRID_Y; y++) {
      if (y === 0 || y === GRID_Y - 1) continue;
      for (let x = 0; x < GRID_X; x++) idxs.push(y * GRID_X + x);
    }
    return idxs.length ? idxs : Array.from({ length: CELL_COUNT }, (_, i) => i);
  });

  // Keep pulsars away from interactive elements (links, buttons, etc.)
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const base = (() => {
      const idxs: number[] = [];
      for (let y = 0; y < GRID_Y; y++) {
        if (y === 0 || y === GRID_Y - 1) continue;
        for (let x = 0; x < GRID_X; x++) idxs.push(y * GRID_X + x);
      }
      return idxs.length ? idxs : Array.from({ length: CELL_COUNT }, (_, i) => i);
    })();
    const baseSet = new Set(base);

    const recompute = () => {
      const w = window.innerWidth || 1;
      const vh = window.innerHeight || 1;

      const top = Math.min(SAFE_TOP_PX, Math.max(0, vh - 1));
      const bottom = Math.min(SAFE_BOTTOM_PX, Math.max(0, vh - 1));
      const bandTop = top;
      const bandBottom = vh - bottom;
      const bandH = Math.max(1, bandBottom - bandTop);

      const forbidden = new Set<number>();

      const selectors =
        'a,button,input,textarea,select,summary,[role="button"],[role="link"],[tabindex]:not([tabindex="-1"]),[data-ui="nav"],[data-ui="search-overlay"],[data-nolock]';
      const nodes = Array.from(document.querySelectorAll<HTMLElement>(selectors));

      for (const el of nodes) {
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;

        const overlapTop = Math.max(rect.top, bandTop);
        const overlapBottom = Math.min(rect.bottom, bandBottom);
        if (overlapBottom <= overlapTop) continue;

        const colStart = Math.floor(clamp01(rect.left / w) * GRID_X);
        const colEnd = Math.floor(clamp01(rect.right / w) * GRID_X);

        const rowStartN = clamp01((overlapTop - bandTop) / bandH);
        const rowEndN = clamp01((overlapBottom - bandTop) / bandH);
        const rowStart = Math.floor(rowStartN * GRID_Y);
        const rowEnd = Math.floor(rowEndN * GRID_Y);

        for (let y = rowStart; y <= rowEnd; y++) {
          if (y < 0 || y >= GRID_Y) continue;
          for (let x = colStart; x <= colEnd; x++) {
            if (x < 0 || x >= GRID_X) continue;
            const idx = y * GRID_X + x;
            if (baseSet.has(idx)) forbidden.add(idx);
          }
        }
      }

      const filtered = base.filter((i) => !forbidden.has(i));
      setAllowedCellIndices(filtered.length ? filtered : base);
    };

    recompute();

    const onResize = () => recompute();
    const onScroll = () => recompute();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [CELL_COUNT, GRID_X, GRID_Y]);

  const scanRef = useRef<ScanState>({
    mouseX: 0,
    mouseY: 0,
    cellX: 0,
    cellY: 0,
    cellIndex: 0,
    nonce: 0,
  });

  const [locked, setLocked] = useState(false);
  const [lockX, setLockX] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "locked" | "miss" | "hit">("idle");
  const [pausedInteractive, setPausedInteractive] = useState(false);

  // Freeze buffers after capture
  const lockedSeedRef = useRef<number | null>(null);
  const lockedPulsarRef = useRef<Pulsar | null>(null); // null = noise capture
  const frozenTSRef = useRef<number[] | null>(null);
  const frozenFFTRef = useRef<number[] | null>(null);

  const dirtyRef = useRef(true);
  const pausedInteractiveRef = useRef(false);

  // Toast on miss
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null);

  // Logbook drawer
  const [logOpen, setLogOpen] = useState(false);

  const showMissToast = () => {
    const msg = MISS_LINES[Math.floor(Math.random() * MISS_LINES.length)];
    const id = Date.now();
    setToast({ id, msg });
    window.setTimeout(() => {
      setToast((t) => (t && t.id === id ? null : t));
    }, 5000);
  };

  const showRepeatToast = () => {
    const msg = "You already detected this pulsar — nice re-detection!";
    const id = Date.now();
    setToast({ id, msg });
    window.setTimeout(() => {
      setToast((t) => (t && t.id === id ? null : t));
    }, 5000);
  };

  // -------- Session discovery tracking --------
  const [logbook, setLogbook] = useState<LogEntry[]>(() => {
    try {
      const raw = sessionStorage.getItem(LOGBOOK_KEY);
      const arr = raw ? (JSON.parse(raw) as unknown) : [];
      if (!Array.isArray(arr)) return [];
      return arr
        .filter((x: any) => x && typeof x.id === "string" && typeof x.rank === "number")
        .map((x: any) => ({ id: x.id, rank: x.rank, ts: typeof x.ts === "number" ? x.ts : Date.now() }));
    } catch {
      return [];
    }
  });

  const [sessionIds, setSessionIds] = useState<string[]>(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      const arr = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
    } catch {
      return [];
    }
  });
  const sessionSet = useMemo(() => new Set(sessionIds), [sessionIds]);

  const TRAPUM_PULSARS: Pulsar[] = useMemo(() => {
    return getTrapumPulsars()
      .filter((p) => typeof p.period_ms === "number" && p.period_ms! < 10)
      .map((p): Pulsar & { trapum: TrapumPulsar } => {
        const period_ms = p.period_ms as number;
        const f0_hz = period_ms > 0 ? 1000 / period_ms : 200;
        return {
          id: p.slug,
          name: p.name,
          f0_hz,
          period_ms,
          difficulty: "medium",
          fold_png_url: p.discovery.discovery_plot_url ?? "",
          trapum: p,
        } as Pulsar & { trapum: TrapumPulsar };
      });
  }, []);

  const ALL_PULSARS = useMemo(() => {
    return TRAPUM_PULSARS;
  }, [TRAPUM_PULSARS]);

  const pulsarById = useMemo(() => {
    const m = new Map<string, Pulsar>();
    for (const p of ALL_PULSARS) m.set(p.id, p);
    return m;
  }, [ALL_PULSARS]);

  // ---- Page list + automatic redistribution salt ----
  const allPages = useMemo(() => {
    const base = (sitePageKeys && sitePageKeys.length ? sitePageKeys : [pageKey]).filter(Boolean);
    const set = new Set<string>(base);
    set.add(pageKey);
    return Array.from(set).sort(); // stable order
  }, [sitePageKeys, pageKey]);

  const autoSaltSeed = useMemo(() => {
    const pageStr = allPages.join("|");
    // include pulsar IDs so adding pulsars also redistributes.
    const idStr = ALL_PULSARS.map((p) => (p as any).id as string).join("|");
    return hashToUint32(`fk:autoSalt:${pageStr}::${idStr}`);
  }, [allPages, ALL_PULSARS]);

  // ---- Equal distribution: assign pulsar IDs across all pages ----
  const pageAssignments = useMemo(() => {
    const pages = allPages;
    const ids = ALL_PULSARS.map((p) => (p as any).id as string);

    // shuffle deterministically based on current site composition
    const shuffled = shuffleDeterministic(ids, hashToUint32(`fk:assign:${autoSaltSeed}`));

    const m = new Map<string, string[]>();
    if (pages.length === 0) return m;

    if (shuffled.length >= pages.length) {
      const baseN = Math.floor(shuffled.length / pages.length);
      const rem = shuffled.length % pages.length;

      let idx = 0;
      for (let i = 0; i < pages.length; i++) {
        const n = baseN + (i < rem ? 1 : 0);
        m.set(pages[i], shuffled.slice(idx, idx + n));
        idx += n;
      }
    } else {
      // fewer pulsars than pages: at least one per page (repeats unavoidable)
      for (let i = 0; i < pages.length; i++) {
        m.set(pages[i], [shuffled[i % Math.max(1, shuffled.length)]]);
      }
    }
    return m;
  }, [allPages, ALL_PULSARS, autoSaltSeed]);

  const assignedIdsForPage = useMemo(() => pageAssignments.get(pageKey) ?? [], [pageAssignments, pageKey]);

  // ---- Site-wide embedded IDs (for session found/left) ----
  const siteEmbeddedIds = useMemo(() => {
    const ids = new Set<string>();
    const cap = Math.min(CELL_COUNT, allowedCellIndices.length);
    for (const pk of allPages) {
      const list = pageAssignments.get(pk) ?? [];
      for (let i = 0; i < Math.min(list.length, cap); i++) ids.add(list[i]);
    }
    return ids;
  }, [allPages, pageAssignments, CELL_COUNT, allowedCellIndices.length]);

  const sessionFound = useMemo(() => {
    let n = 0;
    for (const id of sessionSet) if (siteEmbeddedIds.has(id)) n++;
    return n;
  }, [sessionSet, siteEmbeddedIds]);

  const sessionLeft = Math.max(0, siteEmbeddedIds.size - sessionFound);
  const pulsarsOnThisPage = assignedIdsForPage.length;

  // Stats (simulated)
  const statsRef = useRef<Stats>({
    wallSec: 0,
    dataTB: 0,
    diskGB: 0,
    cpuHrs: 0,
    gpuHrs: 0,
    files: 0,
    candidates: 0,
  });
  const [statsUi, setStatsUi] = useState<Stats>({ ...statsRef.current });
  const lastTickRef = useRef<number>(0);

  const commitDiscovery = (pulsarId: string) => {
    try {
      const k = `fk_discovery_count:${pulsarId}`;
      const v = Number(window.localStorage.getItem(k) || "0");
      window.localStorage.setItem(k, String(v + 1));
    } catch {
      // ignore
    }

    setSessionIds((prev) => {
      const set = new Set(prev);
      set.add(pulsarId);
      const arr = Array.from(set);
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(arr));
      } catch {
        // ignore
      }
      return arr;
    });
  };

  const reset = () => {
    setLocked(false);
    setLockX(null);
    setStatus("idle");
    setToast(null);
    lockedSeedRef.current = null;
    lockedPulsarRef.current = null;
    frozenTSRef.current = null;
    frozenFFTRef.current = null;
    dirtyRef.current = true;
  };

  // Reset when leaving search mode
  useEffect(() => {
    if (!isActive) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // Reset when pageKey changes
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey]);

  // ESC reset + L logbook
  useEffect(() => {
    if (!isActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        // If the logbook is open, close it first instead of resetting.
        if (logOpen) {
          setLogOpen(false);
          return;
        }
        reset();
      }
      if (e.key.toLowerCase() === "l") setLogOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isActive, logOpen, reset]);

  const computeCellFromXY = (mx: number, my: number) => {
    const w = window.innerWidth || 1;
    const vh = window.innerHeight || 1;

    const top = Math.min(SAFE_TOP_PX, Math.max(0, vh - 1));
    const bottom = Math.min(SAFE_BOTTOM_PX, Math.max(0, vh - 1));

    // Use full document height so vertical cells are distributed over the entire page,
    // not just the current viewport.
    const doc = document.documentElement;
    const scrollY = window.scrollY || doc.scrollTop || 0;
    const docH = doc.scrollHeight || vh;
    const effH = Math.max(1, docH - top - bottom);

    const cx = clamp01(mx / w);
    const cy = clamp01((scrollY + my - top) / effH);

    const cellX = Math.min(GRID_X - 1, Math.floor(cx * GRID_X));
    const cellY = Math.min(GRID_Y - 1, Math.floor(cy * GRID_Y));
    const cellIndex = cellY * GRID_X + cellX;

    return { cellX, cellY, cellIndex };
  };

  // ---- Hotspot map (one pulsar per chosen cell) ----
  const hotspotMap = useMemo(() => {
    const ids = assignedIdsForPage;
    if (!ids.length) return new Map<number, HotspotInfo>();

    const cap = Math.min(CELL_COUNT, allowedCellIndices.length);
    const count = Math.min(ids.length, cap);

    const cells = shuffleDeterministic(
      allowedCellIndices,
      hashToUint32(`fk:cells:${pageKey}:${autoSaltSeed}`)
    ).slice(0, count);

    const idsShuffled = shuffleDeterministic(
      ids,
      hashToUint32(`fk:pageIds:${pageKey}:${autoSaltSeed}`)
    ).slice(0, count);

    const map = new Map<number, HotspotInfo>();
    for (let i = 0; i < count; i++) {
      const cellIndex = cells[i];
      const pid = idsShuffled[i];
      const pulsar = pulsarById.get(pid);
      if (!pulsar) continue;

      const hr = mulberry32(hashToUint32(`fk:hotxy:${pageKey}:${autoSaltSeed}:${cellIndex}:${pid}`));
      map.set(cellIndex, { pulsar, hx: hr(), hy: hr() });
    }
    return map;
  }, [assignedIdsForPage, allowedCellIndices, autoSaltSeed, pageKey, CELL_COUNT, pulsarById]);

  // Mouse move updates scan state
  useEffect(() => {
    if (!isActive) return;
    const onMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const isInteractive =
        !!target &&
        !!target.closest(
          'a,button,input,textarea,select,summary,[role="button"],[role="link"],[tabindex]:not([tabindex="-1"]),[data-nolock],[data-ui="nav"],[data-ui="search-overlay"]'
        );

      if (isInteractive) {
        pausedInteractiveRef.current = true;
        setPausedInteractive(true);
        return;
      }

      if (pausedInteractiveRef.current) {
        pausedInteractiveRef.current = false;
        setPausedInteractive(false);
      }

      if (locked) return;
      const { cellX, cellY, cellIndex } = computeCellFromXY(e.clientX, e.clientY);
      const s = scanRef.current;
      scanRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        cellX,
        cellY,
        cellIndex,
        nonce: s.nonce + 1,
      };
      statsRef.current.candidates +=5;
      dirtyRef.current = true;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove as any);
  }, [isActive, locked]);

  // Click anywhere to CAPTURE (except UI)
  useEffect(() => {
    if (!isActive) return;

    const isNoLockTarget = (el: HTMLElement | null) => {
      if (!el) return false;
      if (el.closest("[data-nolock]")) return true;
      if (el.closest("[data-ui='nav']")) return true;
      if (el.closest("[data-ui='search-overlay']")) return true;
      if (el.closest('a,button,input,textarea,select,summary,[role="button"],[role="link"],[tabindex]:not([tabindex=" - 1"]),[data-nolock]')) return true;
      return false;
    };

    const onClickCapture = (e: MouseEvent) => {
      if (locked) return;
      const target = e.target as HTMLElement | null;
      if (isNoLockTarget(target)) return;

      const mx = e.clientX;
      const my = e.clientY;
      const { cellX, cellY, cellIndex } = computeCellFromXY(mx, my);

      const s0 = scanRef.current;
      // Keep the nonce stable on capture so the FFT you're seeing doesn't "jump" at
      // the moment you click.
      const nonce = s0.nonce;
      scanRef.current = { mouseX: mx, mouseY: my, cellX, cellY, cellIndex, nonce };

      const hot = hotspotMap.get(cellIndex);
      lockedPulsarRef.current = hot ? hot.pulsar : null;

      // IMPORTANT: lock seed is stable for the captured position (prevents FFT jump)
      // IMPORTANT: use the SAME seed format as the live renderer (`fk:LIVE...`) so the
      // captured spectrum matches what you saw immediately before capture.
      lockedSeedRef.current = hashToUint32(
        `fk:LIVE:${pageKey}:${autoSaltSeed}:${cellIndex}:${nonce}:${Math.floor(mx)}:${Math.floor(my)}`
      );

      setLocked(true);
      setStatus("locked");
      setLockX(null);

      frozenTSRef.current = null;
      frozenFFTRef.current = null;
      dirtyRef.current = true;
    };

    window.addEventListener("click", onClickCapture, true);
    return () => window.removeEventListener("click", onClickCapture, true);
  }, [isActive, locked, pageKey, autoSaltSeed, hotspotMap]);

  // Proximity to hotspot inside current tile
  const computeProximity = (s: ScanState) => {
    const hot = hotspotMap.get(s.cellIndex);
    if (!hot) return 0;

    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;

    const top = Math.min(SAFE_TOP_PX, Math.max(0, h - 1));
    const bottom = Math.min(SAFE_BOTTOM_PX, Math.max(0, h - 1));
    const effH = Math.max(1, h - top - bottom);

    const nx = clamp01(s.mouseX / w);
    const ny = clamp01((s.mouseY - top) / effH);

    const lx = nx * GRID_X - s.cellX;
    const ly = ny * GRID_Y - s.cellY;

    const dist = Math.hypot(lx - hot.hx, ly - hot.hy);
    const sigma = 0.22;
    return Math.exp(-(dist * dist) / (sigma * sigma));
  };

  // Build time series + FFT for a scan snapshot
  const buildSignal = (s: ScanState, frozenSeed: number | null) => {
    const hot = hotspotMap.get(s.cellIndex);
    const targetPulsar = hot ? hot.pulsar : null;
    const proximity = hot ? computeProximity(s) : 0;

    const targetVisible = !!targetPulsar && proximity > 0.12;

    const baseSeed =
      frozenSeed ??
      hashToUint32(`fk:LIVE:${pageKey}:${autoSaltSeed}:${s.cellIndex}:${s.nonce}:${Math.floor(s.mouseX)}:${Math.floor(s.mouseY)}`);

    const rng = mulberry32(baseSeed);

    // ---- TIME SERIES: AR-ish noise + spikes + bursts (no obvious sinusoid) ----
    let ts = locked ? frozenTSRef.current : null;
    if (!ts) {
      const N = 720;
      const vals = new Array<number>(N);

      let ar = 0;
      const arA = 0.985;
      const whiteScale = 6.2 + 6.0 * rng();
      const arScale = 2.8 + 2.2 * rng();

      const burstCount = rng() < 0.45 ? 1 : rng() < 0.2 ? 2 : 0;
      const bursts: Array<{ i0: number; w: number; a: number }> = [];
      for (let b = 0; b < burstCount; b++) {
        bursts.push({ i0: Math.floor(rng() * N), w: 18 + Math.floor(rng() * 42), a: 8 + 18 * rng() });
      }

      for (let i = 0; i < N; i++) {
        ar = arA * ar + (rng() - 0.5) * arScale;
        const w = (rng() - 0.5) * whiteScale;

        const spike = rng() < 0.012 ? (10 + 26 * rng()) * (rng() < 0.6 ? 1 : -1) : 0;

        let burst = 0;
        for (const br of bursts) {
          const dx = (i - br.i0) / br.w;
          burst += Math.exp(-0.5 * dx * dx) * br.a * (rng() < 0.5 ? 1 : -1);
        }

        const micro = targetVisible && rng() < (0.006 + 0.02 * proximity) ? (8 + 16 * rng()) : 0;

        vals[i] = ar + w + spike + burst + micro;
      }

      ts = vals;
      if (locked) frozenTSRef.current = vals;
    }

    // ---- FFT: noise + decoys always; real peak only near hotspot ----
    let fft = locked ? frozenFFTRef.current : null;
    if (!fft) {
      const bins = 900;
      const vals = new Array<number>(bins);

      const shapePulsar =
        (hot ? hot.pulsar : null) ??
        ALL_PULSARS[hashToUint32(`fk:shape:${pageKey}:${autoSaltSeed}:${s.cellIndex}`) % ALL_PULSARS.length];

      const { decoys, peakW } = difficultyKnobs(shapePulsar);
      const targetPos = targetPulsar ? peakPosFor(targetPulsar) : 0;
      const shapePos = peakPosFor(shapePulsar);

      const spikeCount = rng() < 0.7 ? (rng() < 0.45 ? 1 : 2) : 0;
      const noiseSpikes: Array<{ p: number; a: number; w: number }> = [];
      for (let i = 0; i < spikeCount; i++) {
        noiseSpikes.push({ p: rng(), a: 0.10 + 0.18 * rng(), w: peakW * (1.1 + 0.7 * rng()) });
      }

      const decoyRng = mulberry32(hashToUint32(`fk:decoys:${pageKey}:${autoSaltSeed}:${s.cellIndex}:${baseSeed}`) ^ 0xa5a5a5a5);
      const decoyPeaks: number[] = [];
      for (let i = 0; i < decoys; i++) {
        let p = decoyRng();
        const minDist = 0.06;
        if (Math.abs(p - shapePos) < minDist) p = clamp01(p + (p < shapePos ? -minDist : minDist));
        decoyPeaks.push(p);
      }

      // Deterministic drift: stable for a given cursor/capture seed (prevents spectrum 'jumping')
      const ampDrift = 0.92 + 0.08 * Math.sin(((baseSeed % 10000) / 10000) * 2 * Math.PI);
      const baseRipple = 0.020 + 0.028 * (s.mouseX / (window.innerWidth || 1));

      for (let i = 0; i < bins; i++) {
        const u = i / (bins - 1);

        const roll = 0.58 + 0.32 * (1 - u);
        const white = (rng() - 0.5) * 0.20;
        const ripple = Math.sin(u * 7.0 * 2 * Math.PI) * baseRipple * ampDrift;

        let y = roll + white + ripple;

        for (const dp of decoyPeaks) {
          const a = 0.06 + 0.10 * rng();
          y += gauss(u, dp, peakW * (0.95 + 0.40 * rng())) * a;
        }
        for (const sp of noiseSpikes) y += gauss(u, sp.p, sp.w) * sp.a;

        if (targetVisible && targetPulsar) {
          const { peakAmp: a0, peakW: w0 } = difficultyKnobs(targetPulsar);
          const amp = a0 * (0.10 + 0.90 * proximity);

          y += gauss(u, targetPos, w0) * (0.95 * amp);
          y += gauss(u, clamp01(targetPos * 2), w0 * 0.90) * (0.32 * amp);
          y += gauss(u, clamp01(targetPos * 3), w0 * 0.86) * (0.20 * amp);
        }

        vals[i] = y;
      }

      fft = vals;
      if (locked) frozenFFTRef.current = vals;
    }

    return { ts, fft, targetPulsar, proximity, targetVisible };
  };

  // Stats ticking (simulated)
  const tickStats = (now: number) => {
    const last = lastTickRef.current || now;
    // Convert ms → seconds and clamp so we don't jump on tab-resume.
    const dt = Math.max(0, Math.min(0.25, (now - last) / 1000));
    lastTickRef.current = now;
    if (!isActive) return;

    const s = statsRef.current;
    s.wallSec += dt;

    const activity = locked ? 1.25 : 0.75;
    s.cpuHrs += (dt * (100 * activity)) / 360;
    s.gpuHrs += (dt * (40 * activity)) / 360;
    s.dataTB += dt * (150 * activity) / 360;
    s.diskGB += dt * (500 * activity) / 360;
    s.files += Math.floor(dt * (1200 * activity));
    setStatsUi({ ...s });
  };

  // Draw loop
  useEffect(() => {
    if (!isActive) return;

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

      const now = performance.now();
      tickStats(now);

       // If the cursor is over an interactive/clickable element, freeze the live view
       // (unless we're in a locked/captured state).
       if (pausedInteractiveRef.current && !locked) {
        return;
      }

      if (reduced && !dirtyRef.current) return;
      dirtyRef.current = false;

      const w1 = ts.getBoundingClientRect().width;
      const h1 = ts.getBoundingClientRect().height;
      const w2 = fft.getBoundingClientRect().width;
      const h2 = fft.getBoundingClientRect().height;

      drawAxes(tsCtx, w1, h1, theme);
      drawAxes(fftCtx, w2, h2, theme);

      const line = theme === "dark" ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.92)";
      const dim = theme === "dark" ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)";

      const s = scanRef.current;
      const seed = locked ? (lockedSeedRef.current ?? null) : null;
      const sig = buildSignal(s, seed);

      // TIME SERIES
      {
        const vals = sig.ts;
        let vmin = Infinity, vmax = -Infinity;
        for (const v of vals) { vmin = Math.min(vmin, v); vmax = Math.max(vmax, v); }
        const span = Math.max(1e-6, vmax - vmin);

        const toY = (v: number) => {
          const t = (v - vmin) / span;
          return (1 - (0.08 + t * 0.84)) * h1;
        };

        tsCtx.save();

        tsCtx.globalAlpha = 0.22;
        tsCtx.fillStyle = theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";
        tsCtx.beginPath();
        for (let i = 0; i < vals.length; i++) {
          const u = i / (vals.length - 1);
          const x = u * w1;
          const y = toY(vals[i]);
          if (i === 0) tsCtx.moveTo(x, y);
          else tsCtx.lineTo(x, y);
        }
        tsCtx.lineTo(w1, h1);
        tsCtx.lineTo(0, h1);
        tsCtx.closePath();
        tsCtx.fill();

        tsCtx.globalAlpha = 0.95;
        tsCtx.strokeStyle = line;
        tsCtx.lineWidth = 2.1;
        tsCtx.beginPath();
        for (let i = 0; i < vals.length; i++) {
          const u = i / (vals.length - 1);
          const x = u * w1;
          const y = toY(vals[i]);
          if (i === 0) tsCtx.moveTo(x, y);
          else tsCtx.lineTo(x, y);
        }
        tsCtx.stroke();

        tsCtx.globalAlpha = 0.9;
        tsCtx.fillStyle = dim;
        tsCtx.font = "600 11px ui-sans-serif, system-ui";
        tsCtx.fillText("TIME DOMAIN • synthetic voltages", 12, 18);

        tsCtx.restore();
      }

      // FFT
      {
        const vals = sig.fft;

        let ymin = Infinity, ymax = -Infinity;
        for (const v of vals) { ymin = Math.min(ymin, v); ymax = Math.max(ymax, v); }
        const pad = 0.10 * (ymax - ymin + 1e-6);
        ymin -= pad;
        ymax += pad;

        const toY = (v: number) => {
          const t = clamp01((v - ymin) / Math.max(1e-6, (ymax - ymin)));
          return (1 - t) * (h2 * 0.84) + h2 * 0.08;
        };

        fftCtx.save();
        fftCtx.strokeStyle = line;
        fftCtx.lineWidth = 1.85;
        fftCtx.globalAlpha = 0.95;

        fftCtx.beginPath();
        for (let i = 0; i < vals.length; i++) {
          const u = i / (vals.length - 1);
          const xx = u * w2;
          const yy = toY(vals[i]);
          if (i === 0) fftCtx.moveTo(xx, yy);
          else fftCtx.lineTo(xx, yy);
        }
        fftCtx.stroke();

        if (lockX !== null) {
          fftCtx.save();
          fftCtx.globalAlpha = 0.85;
          fftCtx.strokeStyle = theme === "dark" ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.70)";
          fftCtx.setLineDash([6, 6]);
          fftCtx.beginPath();
          fftCtx.moveTo(lockX * w2, 0);
          fftCtx.lineTo(lockX * w2, h2);
          fftCtx.stroke();
          fftCtx.restore();
        }

        fftCtx.globalAlpha = 0.9;
        fftCtx.fillStyle = dim;
        fftCtx.font = "600 11px ui-sans-serif, system-ui";
        fftCtx.fillText("FREQUENCY DOMAIN • synthetic power", 12, 18);

        const msg =
          status === "idle"
            ? "Move mouse: mostly noise. Click anywhere to CAPTURE. Then click an FFT peak. (ESC resets)"
            : status === "locked"
              ? "Captured. Click an FFT peak to attempt detection. (ESC resets)"
              : status === "miss"
                ? "Miss. Try another peak (still captured). (ESC resets)"
                : "Detection confirmed.";
        fftCtx.fillText(msg, 12, h2 - 12);

        fftCtx.restore();
      }
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [isActive, theme, pageKey, reduced, locked, lockX, status, hotspotMap, autoSaltSeed]);

  const attemptFromFFTClick = async (e: React.MouseEvent) => {
    if (!isActive) return;
    if (!locked) {
      // Helpful miss note if the user clicks FFT before capturing
      const id = Date.now();
      setToast({ id, msg: "Capture first: click the sky (background), then click an FFT peak." });
      window.setTimeout(() => {
        setToast((t) => (t && t.id === id ? null : t));
      }, 2200);
      return;
    }

    const el = fftRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const u = clamp01((e.clientX - rect.left) / rect.width);
    setLockX(u);

    const pulsar = lockedPulsarRef.current;
    if (!pulsar) {
      setStatus("miss");
      showMissToast();
      return;
    }

    const tp = peakPosFor(pulsar);
    const { tol } = difficultyKnobs(pulsar);
    const d = Math.min(Math.abs(u - tp), Math.abs(u - clamp01(tp * 2)), Math.abs(u - clamp01(tp * 3)));

    if (d <= tol) {
      setStatus("hit");
      const id = (pulsar as any).id as string;

       // If this pulsar was already discovered in this session,
       // don't increment global or session counters again.
       const alreadyFound = sessionSet.has(id);

      if (alreadyFound) {
        const existing = logbook.find((e) => e.id === id);
        const rank = existing?.rank ?? 1;
        showRepeatToast();
        setTimeout(
          () =>
            onSolved(pulsar, rank, {
              candidates: statsUi.candidates,
              cpuHrs: statsUi.cpuHrs,
              gpuHrs: statsUi.gpuHrs,
              dataTB: statsUi.dataTB,
            }),
          500
        );
        return;
      }

      // Global rank via KV (fallback to local session counter on failure)
      let rank = 1;
      const remoteRank = await recordDetection(id);
      if (remoteRank != null && Number.isFinite(remoteRank)) {
        rank = remoteRank;
      } else {
        // fallback: approximate rank from localStorage
        try {
          const k = `fk_discovery_count:${id}`;
          const v = Number(window.localStorage.getItem(k) || "0");
          rank = v + 1;
        } catch {
          rank = 1;
        }
      }

      commitDiscovery(id);

      // keep one entry per pulsar in this session (prevents duplicate spam)
      setLogbook((prev) => {
        if (prev.some((x) => x && x.id === id)) return prev;
        const next: LogEntry[] = [{ id, rank, ts: Date.now() }, ...prev];
        try { sessionStorage.setItem(LOGBOOK_KEY, JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });

      setTimeout(
        () =>
          onSolved(pulsar, rank, {
            candidates: statsUi.candidates,
            cpuHrs: statsUi.cpuHrs,
            gpuHrs: statsUi.gpuHrs,
            dataTB: statsUi.dataTB,
          }),
        240
      );
    } else {
      setStatus("miss");
      showMissToast();
    }
  };

  if (!isActive) return null;

  // Display list: prefer logbook (rank-preserving), fallback to session IDs.
  const displayLog = (logbook.length
    ? logbook
    : sessionIds.map((id) => ({ id, rank: 1, ts: 0 }))
  )
    .filter((e) => e && typeof e.id === "string")
    .sort((a, b) => (b.ts || 0) - (a.ts || 0));

  return (
    <>
      {/* Global toast, rendered above modal / overlay */}
      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast.id}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="pointer-events-none fixed inset-x-0 top-15 z-[80] flex justify-center px-3"
          >
            <div className="inline-flex max-w-[92%] sm:max-w-[70%] rounded-full border border-white/14 bg-white/100 backdrop-blur px-4 py-2 text-xs font-semibold tracking-[0.12em] uppercase text-black/80">
              {toast.msg}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Instrument strip (below DiscoveryModal) */}
      <div className="pointer-events-none fixed inset-0 z-[60]">
        <div className="pointer-events-none absolute inset-x-0 bottom-0" data-ui="search-overlay">
        <div className="mx-auto max-w-[1800px] px-4 sm:px-8 pb-5">
          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="rounded-3xl border bg-black/90 backdrop-blur-xl border-white/14 overflow-hidden"
          >
            <div className="grid grid-cols-12 gap-3 p-3 sm:p-4">
              {/* Time series */}
              <div className="col-span-12 md:col-span-3">
                <div className="rounded-2xl border border-white/12 bg-black/60 overflow-hidden">
                  <canvas ref={tsRef} className="h-[140px] w-full" data-nolock />
                </div>
                <div className="mt-2 text-[11px] tracking-[0.22em] uppercase text-white/55">
                  Panel A: raw voltages (synthetic)
                </div>
              </div>

              {/* FFT */}
              <div className="col-span-12 md:col-span-6">
                <div className="rounded-2xl border border-white/12 bg-black/60 overflow-hidden">
                  <canvas
                    ref={fftRef}
                    onClick={attemptFromFFTClick}
                    className="pointer-events-auto h-[140px] w-full cursor-crosshair"
                    data-nolock
                  />
                </div>
                <div className="mt-2 text-[11px] tracking-[0.22em] uppercase text-white/55">
                  Panel B: power spectrum • click peaks after capture
                </div>
              </div>

              {/* Stats */}
              <div className="col-span-12 md:col-span-3">
                <div className="rounded-2xl border border-white/12 bg-black/60 overflow-hidden">
                  <div className="mt-1 grid grid-cols-2 gap-3 text-xs px-3">
                    <div>
                      <div className="text-white/50">Wall</div>
                      <div className="text-white font-semibold">{fmt(statsUi.wallSec)} s</div>
                    </div>
                    <div>
                      <div className="text-white/50">Candidates</div>
                      <div className="text-white font-semibold">{statsUi.candidates.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-white/50">CPU</div>
                      <div className="text-white font-semibold">{fmt(statsUi.cpuHrs)} h</div>
                    </div>
                    <div>
                      <div className="text-white/50">GPU</div>
                      <div className="text-white font-semibold">{fmt(statsUi.gpuHrs)} h</div>
                    </div>
                    <div>
                      <div className="text-white/50">Disk</div>
                      <div className="text-white font-semibold">{fmt(statsUi.diskGB)} GB</div>
                    </div>
                    <div>
                      <div className="text-white/50">Data</div>
                      <div className="text-white font-semibold">{fmt(statsUi.dataTB)} TB</div>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] leading-relaxed text-white/55 px-3 pb-3">
                    This is intentionally exaggerated to convey real survey scale.
                  </div>
                </div>
              </div>

              {/* Footer row */}
              <div className="col-span-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1 pb-1">
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.28em] uppercase text-white/55">
                    SEARCH MODE • INSTRUMENT OVERLAY
                  </div>
                  <div className="text-xs text-white/70 mt-1">
                    {locked ? (
                      <>
                        Captured:{" "}
                        <span className="text-white font-semibold">
                          {lockedPulsarRef.current ? (lockedPulsarRef.current as any).name : "noise"}
                        </span>{" "}
                        <span className="text-white/50">• click an FFT peak to attempt detection</span>
                      </>
                    ) : (
                      <>
                        Move mouse sample the sky. <span className="text-white/50">Click anywhere to capture a signal.</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="pointer-events-auto flex items-center gap-2">
                  <button
                    onClick={() => setLogOpen(true)}
                    className="rounded-full border border-white/14 bg-white/5 px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-white/80 hover:bg-white/10"
                    data-nolock
                  >
                    Logbook ({displayLog.length})
                  </button>

                  <div className="rounded-full border border-white/14 bg-white/5 px-3 py-2 text-[10px] font-semibold tracking-[0.18em] uppercase text-white/80">
                    {pulsarsOnThisPage === 1
                      ? "1 pulsar on this page"
                      : `${pulsarsOnThisPage} pulsars on this page`}
                  </div>

                  <div className="rounded-full border border-white/14 bg-white/5 px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-white/80">
                    Session: {sessionFound} found • {sessionLeft} left
                  </div>

                  <button
                    onClick={reset}
                    className="rounded-full border border-white/14 bg-white/5 px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-white/80 hover:bg-white/10"
                    data-nolock
                  >
                    Reset (ESC)
                  </button>

                  <div className="rounded-full border border-white/14 bg-white/5 px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-white/80">
                    {locked ? "CAPTURED" : "LIVE"}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Logbook drawer */}
          <AnimatePresence>
            {logOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-auto mt-3 rounded-3xl border border-white/14 bg-black/90 backdrop-blur-xl overflow-hidden"
                data-nolock
              >
                <div className="p-4 sm:p-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-semibold tracking-[0.28em] uppercase text-white/55">
                      DETECTION LOGBOOK
                    </div>
                    <div className="text-sm text-white/75 mt-2">
                      Press <span className="text-white font-semibold">L</span> to toggle this panel.
                    </div>
                  </div>
                  <button
                    onClick={() => setLogOpen(false)}
                    className="rounded-full border border-white/14 bg-white/5 px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-white/80 hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>

                <div className="px-4 sm:px-5 pb-5">
                  {displayLog.length === 0 ? (
                    <div className="text-sm text-white/60">No detections yet. Capture → click peaks → confirm.</div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {displayLog.map((e, idx) => {
                        const p = pulsarById.get(e.id);
                        if (!p) return null;

                        return (
                          <button
                            key={`${e.id}:${e.rank}:${idx}`}
                            type="button"
                            onClick={() => {
                              setLogOpen(false);
                              onOpenDetection(p, e.rank);
                            }}
                            className={cn(
                              "w-full text-left rounded-2xl border border-white/12 bg-white/5 p-4",
                              "hover:bg-white/10 transition-colors",
                              "focus:outline-none focus:ring-2 focus:ring-white/20"
                            )}
                            data-nolock
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-xs font-semibold tracking-[0.12em] text-white">
                                  {(p as any).name ?? e.id}
                                </div>
                                <div className="mt-1 text-[11px] text-white/60">
                                  f₀ ≈ {Number(((p as any).f0_hz as number) || 0).toFixed(1)} Hz • id {(p as any).id ?? e.id}
                                </div>
                              </div>
                              <div className="rounded-full border border-white/14 bg-white/5 px-3 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-white/80">
                                #{e.rank}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        </div>
      </div>
    </>
  );
}
