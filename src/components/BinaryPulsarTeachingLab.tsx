// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";

const C = 299792458;
const DAY = 86400;
const AU = 1.495978707e11;
const TSUN = 4.9254909e-6;

const DEFAULT_MODEL_VALUES = {
  name: "J1756-2251",
  PB_days: 0.319633901605243,
  A1_lt_s: 2.75647549529579,
  OM_deg: -37.4763126188279,
  ECC: 0.180570155193058,
  OMDOT_deg_yr: 2.58238697915158,
  F0: 35.135072516315,
  F1: -1.26033876996867e-15,
  GAMMA: 0.00113823948066969,
  PBDOT: -2.10293663424684e-13,
  DM: 120.702336850668,
  M2: 1.23,
  INC_deg: 68,
  T0_days: 0,
  pulsarMass: 1.34,
  companionIsPulsar: false,
  companionF0: 0,
};

const MODEL_PRESETS = [
  {
    id: "j1756-2251",
    source: "preset",
    displayName: "PSR J1756-2251",
    values: DEFAULT_MODEL_VALUES,
    providedFields: Object.keys(DEFAULT_MODEL_VALUES),
    unknownKeys: [],
  },
  {
    id: "b1913+16",
    source: "preset",
    displayName: "PSR B1913+16",
    values: {
      ...DEFAULT_MODEL_VALUES,
      name: "B1913+16",
      PB_days: 0.322997448918,
      A1_lt_s: 2.3417725,
      OM_deg: 292.54487,
      ECC: 0.6171334,
      OMDOT_deg_yr: 4.226598,
      F0: 16.940537785677,
      F1: -2.4225e-18,
      GAMMA: 0.0042919,
      PBDOT: -2.4211e-12,
      DM: 168.77,
      M2: 1.389,
      INC_deg: 47.2,
    },
    providedFields: Object.keys(DEFAULT_MODEL_VALUES),
    unknownKeys: [],
  },
  {
    id: "j0737-3039a",
    source: "preset",
    displayName: "PSR J0737-3039A",
    values: {
      ...DEFAULT_MODEL_VALUES,
      name: "J0737-3039A",
      PB_days: 0.10225156248,
      A1_lt_s: 1.415032,
      OM_deg: 73.8,
      ECC: 0.0877775,
      OMDOT_deg_yr: 16.8995,
      F0: 44.0540694,
      F1: -3.4e-15,
      GAMMA: 0.0003856,
      PBDOT: -1.25e-12,
      DM: 48.9,
      M2: 1.2489,
      INC_deg: 88.7,
      companionIsPulsar: true,
      companionF0: 0.36056,
    },
    providedFields: Object.keys(DEFAULT_MODEL_VALUES),
    unknownKeys: [],
  },
];

const DELAY_COLORS = {
  romer: { stroke: "#7aa2f7", fill: "rgba(122,162,247,0.12)", label: "Romer", symbol: "dR" },
  einstein: { stroke: "#c084b8", fill: "rgba(192,132,184,0.12)", label: "Einstein", symbol: "dE" },
  shapiro: { stroke: "#4dbf96", fill: "rgba(77,191,150,0.12)", label: "Shapiro", symbol: "dS" },
  secular: { stroke: "#c9a84c", fill: "rgba(201,168,76,0.12)", label: "Secular", symbol: "dSec" },
  dm: { stroke: "#9580d4", fill: "rgba(149,128,212,0.12)", label: "Dispersion", symbol: "dDM" },
  total: { stroke: "#c8c8d4", fill: "rgba(200,200,212,0.07)", label: "Total", symbol: "dtot" },
  residual: { stroke: "#e07848", fill: "rgba(224,120,72,0.10)", label: "Residual", symbol: "dres" },
};

const LONG_BASELINE_WINDOWS = {
  orbit: { label: "1 orbit", days: DEFAULT_MODEL_VALUES.PB_days },
  day: { label: "1 day", days: 1 },
  month: { label: "30 days", days: 30 },
  year: { label: "1 year", days: 365.25 },
};

const PARAMETER_META = [
  { key: "PB_days", label: "PB", unit: "d", min: 0.01, max: 5, step: 0.0001, tabs: ["orbit", "timing", "longBaseline"], group: "binary" },
  { key: "ECC", label: "ECC", unit: "", min: 0, max: 0.95, step: 0.001, tabs: ["orbit", "timing", "longBaseline"], group: "binary" },
  { key: "OM_deg", label: "OM", unit: "deg", min: -180, max: 360, step: 1, tabs: ["orbit", "timing", "longBaseline"], group: "binary" },
  { key: "A1_lt_s", label: "A1", unit: "lt-s", min: 0.05, max: 12, step: 0.01, tabs: ["orbit", "timing", "longBaseline"], group: "binary" },
  { key: "T0_days", label: "T0", unit: "d", min: -5, max: 5, step: 0.001, tabs: ["orbit", "timing", "longBaseline"], group: "binary" },
  { key: "M2", label: "M2", unit: "Msun", min: 0.2, max: 3, step: 0.01, tabs: ["orbit", "timing", "longBaseline"], group: "binary" },
  { key: "INC_deg", label: "INC", unit: "deg", min: 5, max: 89.9, step: 0.1, tabs: ["orbit", "timing", "longBaseline"], group: "binary" },
  { key: "DM", label: "DM", unit: "pc cm^-3", min: 0, max: 400, step: 0.05, tabs: ["timing", "longBaseline"], group: "timing" },
  { key: "GAMMA", label: "GAMMA", unit: "s", min: 0, max: 0.02, step: 0.00001, tabs: ["timing", "longBaseline"], group: "timing" },
  { key: "OMDOT_deg_yr", label: "OMDOT", unit: "deg/yr", min: -10, max: 30, step: 0.001, tabs: ["timing", "longBaseline"], group: "timing" },
  { key: "PBDOT", label: "PBDOT", unit: "", min: -1e-11, max: 1e-11, step: 1e-14, tabs: ["timing", "longBaseline"], group: "timing" },
];

const PARAMETER_GROUP_LABELS = {
  binary: "Binary",
  timing: "Timing",
};

const EPOCH_OFFSET_PARAM_KEYS = ["PB_days", "ECC", "OM_deg", "A1_lt_s", "T0_days", "M2", "INC_deg", "DM", "GAMMA", "OMDOT_deg_yr", "PBDOT"];

const EPOCH_OFFSET_PARAMS = PARAMETER_META.filter((param) => EPOCH_OFFSET_PARAM_KEYS.includes(param.key));

function fmt(v, d = 4) {
  if (!Number.isFinite(v)) return "--";
  if (Math.abs(v) >= 1e4 || (Math.abs(v) > 0 && Math.abs(v) < 1e-3)) return v.toExponential(2);
  return v.toFixed(d);
}

function decimalsFromStep(step) {
  if (!Number.isFinite(step) || step <= 0) return 4;
  if (step >= 1) return 2;
  return Math.min(8, Math.max(3, Math.ceil(-Math.log10(step)) + 1));
}

function getEpochOffsetScale(param, currentValue) {
  const magnitude = Math.abs(currentValue);
  const order = magnitude > 0 ? 10 ** Math.floor(Math.log10(magnitude)) : Math.max(param.step, 1e-6);
  const stepFloor = param.key === "PBDOT" ? 1e-16 : param.key === "GAMMA" ? 1e-8 : param.key === "OMDOT_deg_yr" ? 1e-5 : param.step / 100;
  const step = Math.max(order / 1000, stepFloor);
  const span = Math.max(order, magnitude * 0.2, step * 25);
  return {
    step,
    min: -span,
    max: span,
    decimals: decimalsFromStep(step),
  };
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function countModelDiffs(a, b) {
  return PARAMETER_META.reduce((count, param) => {
    const av = a?.[param.key];
    const bv = b?.[param.key];
    return count + (Number.isFinite(av) && Number.isFinite(bv) && Math.abs(av - bv) > 1e-12 ? 1 : 0);
  }, 0);
}

function countOffsetDiffs(offsets) {
  return Object.values(offsets || {}).reduce((count, value) => count + (Math.abs(value) > 1e-9 ? 1 : 0), 0);
}

function zeroOffsetMap(keys) {
  return keys.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});
}

function normalizeModelEnvelope(envelope) {
  const values = {
    ...DEFAULT_MODEL_VALUES,
    ...(envelope?.values ?? {}),
  };
  return {
    id: envelope?.id ?? `model-${Math.random().toString(36).slice(2, 8)}`,
    source: envelope?.source ?? "preset",
    displayName: envelope?.displayName ?? `PSR ${values.name}`,
    values,
    providedFields: envelope?.providedFields ?? Object.keys(values),
    unknownKeys: envelope?.unknownKeys ?? [],
  };
}

function sumDelayTerms(delays, fittedDelays = null) {
  const keys = ["romer", "einstein", "shapiro", "secular", "dm"];
  return keys.reduce((sum, key) => sum + ((fittedDelays?.[key] ? 0 : 1) * (delays?.[key] ?? 0)), 0);
}

function sumSelectedDelayTerms(delays, selectedDelays = null) {
  const keys = ["romer", "einstein", "shapiro", "secular", "dm"];
  return keys.reduce((sum, key) => sum + ((selectedDelays?.[key] ? 1 : 0) * (delays?.[key] ?? 0)), 0);
}

function sumVisibleDelayTerms(delays, activeDelays = null, fittedDelays = null) {
  const keys = ["romer", "einstein", "shapiro", "secular", "dm"];
  return keys.reduce((sum, key) => {
    const isActive = activeDelays?.[key] ?? true;
    const isFitted = fittedDelays?.[key] ?? false;
    return sum + (isActive && !isFitted ? delays?.[key] ?? 0 : 0);
  }, 0);
}

function sumVisibleNoiseTerms(toa, activeDelays = null) {
  const keys = ["romer", "einstein", "shapiro", "secular", "dm"];
  return keys.reduce((sum, key) => {
    const isActive = activeDelays?.[key] ?? true;
    return sum + (isActive ? toa?.[`noise_${key}`] ?? 0 : 0);
  }, 0);
}

function parseMaybeNumber(raw) {
  const cleaned = `${raw}`.replace(/[dD]/g, "e");
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function parseParText(text) {
  const known = {};
  const provided = new Set();
  const unknownKeys = [];

  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("C ")) return;
    const [keyRaw, valueRaw] = trimmed.split(/\s+/, 2);
    const key = keyRaw?.toUpperCase();
    if (!key || valueRaw == null) return;

    const numeric = parseMaybeNumber(valueRaw);
    const map = {
      PSRJ: "name",
      PSR: "name",
      PB: "PB_days",
      A1: "A1_lt_s",
      ECC: "ECC",
      E: "ECC",
      OM: "OM_deg",
      OMDOT: "OMDOT_deg_yr",
      F0: "F0",
      F1: "F1",
      GAMMA: "GAMMA",
      PBDOT: "PBDOT",
      DM: "DM",
      M2: "M2",
      SINI: "SINI",
      INC: "INC_deg",
      T0: "T0_days",
      TASC: "T0_days",
      M1: "pulsarMass",
    };

    if (!map[key]) {
      unknownKeys.push(key);
      return;
    }

    const outKey = map[key];
    provided.add(outKey);
    if (outKey === "name") {
      known[outKey] = valueRaw;
    } else if (numeric != null) {
      known[outKey] = numeric;
    }
  });

  if (known.SINI != null && known.INC_deg == null) {
    known.INC_deg = (Math.asin(clamp(known.SINI, -1, 1)) * 180) / Math.PI;
    provided.add("INC_deg");
  }

  const values = {
    ...DEFAULT_MODEL_VALUES,
    ...known,
  };

  return normalizeModelEnvelope({
    id: `upload-${Date.now()}`,
    source: "uploaded_par",
    displayName: `PSR ${values.name}`,
    values,
    providedFields: Array.from(provided),
    unknownKeys,
  });
}

function modelSupport(envelope) {
  const provided = new Set(envelope.providedFields || []);
  const orbitMissing = ["PB_days", "A1_lt_s", "ECC", "OM_deg", "M2", "INC_deg"].filter((key) => !provided.has(key));
  const timingMissing = ["PB_days", "A1_lt_s", "ECC", "OM_deg", "GAMMA", "DM", "F0"].filter((key) => !provided.has(key));
  const epochMissing = ["PB_days", "A1_lt_s", "ECC", "OM_deg", "GAMMA", "M2", "INC_deg", "DM"].filter((key) => !provided.has(key));
  return {
    orbitMissing,
    timingMissing,
    epochMissing,
    orbitReady: orbitMissing.length === 0,
    timingReady: timingMissing.length === 0,
    epochReady: epochMissing.length === 0,
  };
}

function kepler(M, e) {
  let E = e < 0.8 ? M : Math.PI;
  for (let i = 0; i < 60; i++) {
    const d = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += d;
    if (Math.abs(d) < 1e-13) break;
  }
  return E;
}

function trueAnom(E, e) {
  return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
}

function romerDelay(E, e, omega, a1) {
  return a1 * (Math.sin(omega) * (Math.cos(E) - e) + Math.sqrt(1 - e * e) * Math.cos(omega) * Math.sin(E));
}

function einsteinDelay(E, gamma) {
  return gamma * Math.sin(E);
}

function shapiroDelayRS(E, e, omega, r_s, s) {
  const sinE = Math.sin(E);
  const cosE = Math.cos(E);
  const proj = Math.sin(omega) * (cosE - e) + Math.sqrt(1 - e * e) * Math.cos(omega) * sinE;
  const arg = 1 - e * cosE - s * proj;
  return -2 * r_s * Math.log(Math.max(arg, 1e-6));
}

function shapiroMeanRS(e, omega, r_s, s, N = 400) {
  let sumF = 0;
  let sumW = 0;
  for (let i = 0; i < N; i++) {
    const E = (i / N) * 2 * Math.PI;
    const w = 1 - e * Math.cos(E);
    sumF += w * shapiroDelayRS(E, e, omega, r_s, s);
    sumW += w;
  }
  return sumF / Math.max(sumW, 1e-9);
}

function secularDelay(tDays, model) {
  const tYr = tDays / 365.25;
  const orbitalWeight = clamp(model.PB_days / 0.5, 0.4, 2.1);
  const inclinationWeight = 0.35 + 0.65 * Math.sin((model.INC_deg * Math.PI) / 180);
  return 2.8e-6 * orbitalWeight * inclinationWeight * (0.8 * tYr + 0.35 * Math.sin(2 * Math.PI * tYr));
}

function dispersionDelay(dm, freqMHz) {
  return 4148.808 * dm / Math.max(freqMHz * freqMHz, 1);
}

function shapiroR(mcMsun) {
  return TSUN * mcMsun;
}

function shapiroS(incDeg) {
  return Math.sin((incDeg * Math.PI) / 180);
}

function orbitalPhaseAt(tDays, model) {
  const pb = Math.max(model.PB_days, 1e-6);
  return ((((tDays - model.T0_days) / pb) % 1) + 1) % 1;
}

function computeDelays(tDays, model, freqMHz, flags) {
  const tOffsetDays = tDays - model.T0_days;
  const tOffsetSec = tOffsetDays * DAY;
  const pb = Math.max(model.PB_days, 1e-6);
  const pbNow = Math.max(pb + (model.PBDOT * tOffsetSec) / DAY, 1e-6);
  const M = (((2 * Math.PI) / pbNow) * ((tOffsetDays % pbNow) + pbNow)) % (2 * Math.PI);
  const E = kepler(M, model.ECC);
  const omega = ((model.OM_deg + (model.OMDOT_deg_yr * tOffsetDays) / 365.25) * Math.PI) / 180;
  const r_s = shapiroR(model.M2);
  const s = shapiroS(model.INC_deg);
  const mean = shapiroMeanRS(model.ECC, omega, r_s, s);

  const dR = romerDelay(E, model.ECC, omega, model.A1_lt_s);
  const dE = einsteinDelay(E, model.GAMMA);
  const dS = shapiroDelayRS(E, model.ECC, omega, r_s, s) - mean;
  const dSec = secularDelay(tDays, model);
  const dDM = dispersionDelay(model.DM, freqMHz) - dispersionDelay(DEFAULT_MODEL_VALUES.DM, freqMHz);

  const ms = (x) => x * 1000;
  const total = ms(
    (flags.romer ? dR : 0) +
      (flags.einstein ? dE : 0) +
      (flags.shapiro ? dS : 0) +
      (flags.secular ? dSec : 0) +
      (flags.dm ? dDM : 0)
  );

  return {
    phase: ((M / (2 * Math.PI)) + 1) % 1,
    romer: ms(dR),
    einstein: ms(dE),
    shapiro: ms(dS),
    secular: ms(dSec),
    dm: ms(dDM),
    total,
  };
}

function buildTheoryCurve(model, freqMHz, fittedDelays = {}) {
  const pts = [];
  for (let i = 0; i < 400; i++) {
    const tDays = model.T0_days + (model.PB_days * i) / 400;
    const d = computeDelays(tDays, model, freqMHz, { romer: true, einstein: true, shapiro: true, secular: true, dm: true });
    const residual =
      (fittedDelays.romer ? 0 : d.romer) +
      (fittedDelays.einstein ? 0 : d.einstein) +
      (fittedDelays.shapiro ? 0 : d.shapiro) +
      (fittedDelays.secular ? 0 : d.secular) +
      (fittedDelays.dm ? 0 : d.dm);
    pts.push({
      phase: d.phase,
      romer: d.romer,
      einstein: d.einstein,
      shapiro: d.shapiro,
      secular: d.secular,
      dm: d.dm,
      total: d.total,
      residual,
    });
  }
  pts.sort((a, b) => a.phase - b.phase);
  return pts;
}

function dmVariationAtTime(tDays, durationDays, amplitude, baselineDM) {
  if (!amplitude) return baselineDM;
  const phase = (2 * Math.PI * tDays) / Math.max(durationDays, 1e-6);
  return baselineDM + amplitude * (0.72 * Math.sin(phase) + 0.28 * Math.sin(2.3 * phase + 0.7));
}

function seededUnit(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return x - Math.floor(x);
}

function seededGaussian(seed) {
  const u1 = Math.max(1e-6, seededUnit(seed));
  const u2 = seededUnit(seed + 0.5);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function buildLongBaselineSamples({
  model,
  windowKey,
  primaryFreq,
  secondFreq,
  compareMode,
  dmVarAmp,
  noiseLevel,
  termOffsets,
  paramOffsets,
  count = 180,
}) {
  const duration = windowKey === "orbit" ? model.PB_days : LONG_BASELINE_WINDOWS[windowKey].days;
  const pts = [];
  for (let i = 0; i < count; i++) {
    const tDays = (duration * i) / Math.max(count - 1, 1);
    const sampleModel = { ...model, DM: dmVariationAtTime(tDays, duration, dmVarAmp, model.DM) };
    const offsetModel = {
      ...sampleModel,
      ...Object.fromEntries(EPOCH_OFFSET_PARAMS.map((param) => [param.key, sampleModel[param.key] + (paramOffsets?.[param.key] ?? 0)])),
    };
    const epochFreqs = compareMode === "dual" ? [primaryFreq, secondFreq] : [primaryFreq];
    epochFreqs.forEach((obsFreq, freqIndex) => {
      const base = computeDelays(tDays, sampleModel, obsFreq, { romer: true, einstein: true, shapiro: true, secular: true, dm: true });
      const shifted = computeDelays(tDays, offsetModel, obsFreq, { romer: true, einstein: true, shapiro: true, secular: true, dm: true });
      const noise = seededGaussian(tDays * 97.13 + obsFreq * 0.013 + freqIndex * 11.7 + duration * 0.37) * noiseLevel * 1e-3;
      const mismatches = {
        romer: (shifted.romer - base.romer) + (base.romer ?? 0) * ((termOffsets?.romer ?? 0) / 100),
        einstein: (shifted.einstein - base.einstein) + (base.einstein ?? 0) * ((termOffsets?.einstein ?? 0) / 100),
        shapiro: (shifted.shapiro - base.shapiro) + (base.shapiro ?? 0) * ((termOffsets?.shapiro ?? 0) / 100),
        secular: (shifted.secular - base.secular) + (base.secular ?? 0) * ((termOffsets?.secular ?? 0) / 100),
        dm: (shifted.dm - base.dm) + (base.dm ?? 0) * ((termOffsets?.dm ?? 0) / 100),
      };
      const observedTerms = {
        romer: base.romer + mismatches.romer,
        einstein: base.einstein + mismatches.einstein,
        shapiro: base.shapiro + mismatches.shapiro,
        secular: base.secular + mismatches.secular,
        dm: base.dm + mismatches.dm,
      };
      const observedModel = Object.values(observedTerms).reduce((sum, value) => sum + value, 0);
      const observed = observedModel + noise;
      const residual = observed - base.total;

      pts.push({
        tDays,
        phase: orbitalPhaseAt(tDays, sampleModel),
        freq: obsFreq,
        noise,
        dmModel: sampleModel.DM,
        romer: observedTerms.romer,
        einstein: observedTerms.einstein,
        shapiro: observedTerms.shapiro,
        secular: observedTerms.secular,
        dm: observedTerms.dm,
        total: observedModel,
        observed,
        residual,
        base,
        mismatch: mismatches,
      });
    });
  }
  return { duration, points: pts };
}

function projectedOrbitExtent(model) {
  const inc = (model.INC_deg * Math.PI) / 180;
  const pulsarMass = model.pulsarMass || DEFAULT_MODEL_VALUES.pulsarMass;
  const companionMass = model.M2;
  const xM = model.A1_lt_s * C;
  const aP = xM / Math.max(Math.sin(inc), 1e-6);
  const aRel = aP * (1 + pulsarMass / companionMass);
  const muP = companionMass / (pulsarMass + companionMass);
  const muC = pulsarMass / (pulsarMass + companionMass);
  const omega = (model.OM_deg * Math.PI) / 180;
  const e = model.ECC;
  let maxExtent = 1;
  for (let i = 0; i <= 400; i++) {
    const f = (i / 400) * 2 * Math.PI;
    const r = (aRel * (1 - e ** 2)) / (1 + e * Math.cos(f));
    const xO = r * Math.cos(f);
    const yO = r * Math.sin(f);
    const xR = xO * Math.cos(omega) - yO * Math.sin(omega);
    const yR = xO * Math.sin(omega) + yO * Math.cos(omega);
    maxExtent = Math.max(
      maxExtent,
      Math.abs(muP * xR),
      Math.abs(muP * yR * Math.cos(inc)),
      Math.abs(muC * xR),
      Math.abs(muC * yR * Math.cos(inc))
    );
  }
  return maxExtent;
}

function getLongValue(point, yMode, fittedDelays, scale = 1) {
  if (yMode === "residual") return (point.observed - (point.base?.total ?? point.total ?? 0)) * scale;
  if (yMode === "total") return (point.observed ?? point.total) * scale;
  if (["romer", "einstein", "shapiro", "secular", "dm"].includes(yMode)) {
    return point[yMode];
  }
  return point.total * scale;
}

function getPostFitLongValue(point, yMode, fittedDelays, scale = 1) {
  const fittedMismatch = ["romer", "einstein", "shapiro", "secular", "dm"].reduce((sum, key) => {
    if (!fittedDelays?.[key]) return sum;
    return sum + (point.mismatch?.[key] ?? 0);
  }, 0);
  if (yMode === "residual") {
    return (((point.observed ?? point.total) - (point.base?.total ?? point.total ?? 0)) - fittedMismatch) * scale;
  }
  if (yMode === "total") {
    return ((point.observed ?? point.total) - fittedMismatch) * scale;
  }
  if (["romer", "einstein", "shapiro", "secular", "dm"].includes(yMode)) {
    return fittedDelays[yMode] ? 0 : point[yMode];
  }
  return point.residual;
}

function Slider({ value, min, max, step, onChange, color = "#e4e4e7" }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="relative flex h-5 items-center">
      <div className="relative h-1.5 w-full rounded-full bg-zinc-800">
        <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          style={{ margin: 0 }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-zinc-300 bg-zinc-900 shadow"
          style={{ left: `calc(${pct}% - 7px)`, pointerEvents: "none" }}
        />
      </div>
    </div>
  );
}

function SwitchToggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border transition-all duration-150 hover:brightness-110 active:scale-95 ${
        checked ? "border-zinc-200 bg-zinc-200" : "border-zinc-700 bg-zinc-800"
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-zinc-900 shadow transition-transform duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
        style={{ margin: 2 }}
      />
    </button>
  );
}

function ControlRow({ label, value, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <span className="font-mono tabular-nums text-zinc-100">{value}</span>
      </div>
      {children}
    </div>
  );
}

function IconBtn({ onClick, children, active = false, color, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all duration-150 hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
      style={
        active
          ? color
            ? { border: `1px solid ${color}55`, background: `${color}1a`, color, backdropFilter: "blur(12px)" }
            : {
                border: "1px solid rgba(180,180,200,0.2)",
                background: "rgba(255,255,255,0.12)",
                color: "#e8e8f0",
                backdropFilter: "blur(12px)",
              }
          : {
              border: "1px solid rgba(180,180,200,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: "#a1a1aa",
              backdropFilter: "blur(12px)",
            }
      }
    >
      {children}
    </button>
  );
}

function PillGroup({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((option) => {
        const key = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="transition-all duration-150 hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:scale-[0.98]"
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid rgba(180,180,200,0.1)",
              background: value === key ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)",
              color: value === key ? "#f4f4f5" : "#71717a",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function SegmentedToggle({ options, value, onChange, accent = "#f4f4f5", compact = false }) {
  return (
    <div
      style={{
        display: "inline-flex",
        gap: 6,
        padding: compact ? 4 : 5,
        borderRadius: 16,
        border: "1px solid rgba(180,180,200,0.1)",
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(12px)",
        flexWrap: "wrap",
      }}
    >
      {options.map((option) => {
        const key = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;
        const active = value === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="transition-all duration-150 hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:scale-[0.98]"
            style={{
              minHeight: compact ? 28 : 36,
              padding: compact ? "5px 10px" : "8px 14px",
              borderRadius: 12,
              border: `1px solid ${active ? `${accent}44` : "rgba(180,180,200,0.08)"}`,
              background: active ? `${accent}18` : "rgba(255,255,255,0.02)",
              color: active ? accent : "#a1a1aa",
              fontSize: compact ? 11 : 12,
              fontWeight: active ? 700 : 600,
              letterSpacing: "0.02em",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function ParameterEditor({ model, compareModel, originalModel, onChange, activeTab, support }) {
  const visible = PARAMETER_META.filter((param) => param.tabs.includes(activeTab) && !(activeTab === "longBaseline" && param.group === "binary"));
  const groups = visible.reduce((acc, param) => {
    const group = param.group || "timing";
    if (!acc[group]) acc[group] = [];
    acc[group].push(param);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {Object.entries(groups).map(([groupKey, params]) => (
        <div key={groupKey} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: "#71717a" }}>
            {PARAMETER_GROUP_LABELS[groupKey] ?? groupKey}
          </div>
          {params.map((param) => {
            const value = model[param.key];
            const originalValue = originalModel?.[param.key];
            const changedFromOriginal = Number.isFinite(value) && Number.isFinite(originalValue) && Math.abs(value - originalValue) > 1e-12;
            const missing =
              support.orbitMissing.includes(param.key) ||
              support.timingMissing.includes(param.key) ||
              support.epochMissing.includes(param.key);
            return (
              <div key={param.key} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: 13, color: "#d4d4d8" }}>{param.label}</span>
                    {compareModel && Number.isFinite(compareModel[param.key]) && Math.abs((value ?? 0) - compareModel[param.key]) > 1e-12 && (
                      <span style={{ fontSize: 9, color: "#7aa2f7" }}>
                        d {fmt((value ?? 0) - compareModel[param.key], param.step < 0.01 ? 4 : 2)}
                      </span>
                    )}
                    {missing && <span style={{ fontSize: 9, color: "#a1a1aa" }}>fallback</span>}
                  </div>
                  <input
                    value={Number.isFinite(value) ? value : ""}
                    onChange={(e) => onChange(param.key, Number(e.target.value))}
                    type="number"
                    step={param.step}
                    className="w-28 rounded-md border border-white/10 bg-zinc-950/80 px-2 py-1 font-mono text-xs text-zinc-100 outline-none"
                  />
                </div>
                <ControlRow label={param.unit || "value"} value={`${fmt(value, param.step < 0.01 ? 4 : 2)} ${param.unit}`.trim()}>
                  <Slider value={value} min={param.min} max={param.max} step={param.step} onChange={(next) => onChange(param.key, next)} color="#7aa2f7" />
                </ControlRow>
                {changedFromOriginal && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => onChange(param.key, originalValue)}
                      className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-zinc-300 transition-all duration-150 hover:-translate-y-px hover:bg-white/10 hover:text-zinc-100 active:translate-y-0 active:scale-[0.98]"
                    >
                      Revert
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function DelayPanel({
  activeDelays,
  setActiveDelays,
  fittedDelays,
  setFittedDelays,
  highlightDelay,
  setHighlightDelay,
  currentDelays,
  noiseLevel,
  setNoiseLevel,
  toaInterval,
  setToaInterval,
  freqMHz,
  setFreqMHz,
  activeTab,
}) {
  const fittable = ["romer", "einstein", "shapiro", "secular", "dm"];
  const numFitted = fittable.filter((k) => fittedDelays[k]).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: "#71717a" }}>Timing delays</span>
        <span style={{ fontSize: 10, color: "#52525b", fontFamily: "monospace" }}>hover row {"->"} highlight</span>
      </div>

      {Object.entries(DELAY_COLORS)
        .filter(([key]) => key !== "residual")
        .map(([key, meta]) => {
          const val = currentDelays?.[key];
          const isOn = activeDelays[key];
          const isHL = highlightDelay === key;
          const isFitted = fittedDelays[key];
          const canFit = fittable.includes(key);
          return (
            <div key={key}>
              <div
                onMouseEnter={() => setHighlightDelay(key)}
                onMouseLeave={() => setHighlightDelay(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderRadius: 12,
                  border: `1px solid ${isHL ? `${meta.stroke}55` : "rgba(39,39,42,0.8)"}`,
                  background: isHL ? meta.fill : "rgba(9,9,11,0.4)",
                  transition: "all 0.15s",
                  opacity: isFitted ? 0.4 : isOn ? 1 : 0.45,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: isFitted ? "#52525b" : meta.stroke,
                    flexShrink: 0,
                    boxShadow: isHL ? `0 0 8px ${meta.stroke}` : "none",
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 12, color: isFitted ? "#71717a" : "#e4e4e7", fontWeight: 500 }}>{meta.label}</span>
                    <span style={{ fontSize: 10, color: isFitted ? "#52525b" : meta.stroke, fontFamily: "monospace" }}>{meta.symbol}</span>
                    {isFitted && <span style={{ fontSize: 8, color: "#fb923c", fontWeight: 700 }}>FIT</span>}
                  </div>
                </div>

                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 11,
                    color: isFitted ? "#52525b" : meta.stroke,
                    minWidth: 70,
                    textAlign: "right",
                  }}
                >
                  {val !== undefined ? `${fmt(val, Math.abs(val) < 0.1 ? 4 : 2)} ms` : "--"}
                </span>

                {canFit && (
                  <button
                    onClick={() => setFittedDelays((prev) => ({ ...prev, [key]: !prev[key] }))}
                    className="transition-all duration-150 hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:scale-[0.98]"
                    style={{
                      padding: "2px 6px",
                      borderRadius: 5,
                      fontSize: 9,
                      fontWeight: 600,
                      border: `1px solid ${isFitted ? "#fb923c55" : "#3f3f46"}`,
                      background: isFitted ? "#fb923c22" : "transparent",
                      color: isFitted ? "#fb923c" : "#71717a",
                      cursor: "pointer",
                    }}
                  >
                    {isFitted ? "on" : "fit"}
                  </button>
                )}

                <button
                  onClick={() => setActiveDelays((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className="transition-all duration-150 hover:brightness-110 active:scale-95"
                  style={{
                    width: 36,
                    height: 20,
                    borderRadius: 10,
                    border: `1px solid ${isOn ? `${meta.stroke}88` : "#3f3f46"}`,
                    background: isOn ? `${meta.stroke}33` : "#18181b",
                    cursor: "pointer",
                    position: "relative",
                    flexShrink: 0,
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 2,
                      left: isOn ? 16 : 2,
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: isOn ? meta.stroke : "#52525b",
                      transition: "left 0.2s, background 0.2s",
                    }}
                  />
                </button>
              </div>
            </div>
          );
        })}

      {numFitted > 0 && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #fb923c33",
            background: "#fb923c08",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 11, color: "#fb923c" }}>{numFitted} fitted term{numFitted > 1 ? "s" : ""}</div>
          <button
            onClick={() => setFittedDelays({ romer: false, einstein: false, shapiro: false, secular: false, dm: false })}
            className="transition-all duration-150 hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:scale-[0.98]"
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid #fb923c55",
              background: "#fb923c22",
              color: "#fb923c",
              fontSize: 9,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>
      )}

      <div
        style={{
          marginTop: 8,
          padding: "12px",
          borderRadius: 12,
          border: "1px solid rgba(180,180,200,0.09)",
          background: "rgba(255,255,255,0.03)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: "#71717a" }}>Observation</div>
        <ControlRow label="TOA interval" value={`${toaInterval} min`}>
          <Slider value={toaInterval} min={1} max={60} step={1} onChange={setToaInterval} color="#60a5fa" />
        </ControlRow>
        <ControlRow label="Noise level" value={`${noiseLevel} us`}>
          <Slider value={noiseLevel} min={0} max={200} step={5} onChange={setNoiseLevel} color="#f4f4f5" />
        </ControlRow>
        <ControlRow label="Frequency" value={`${freqMHz} MHz`}>
          <Slider value={freqMHz} min={300} max={3000} step={50} onChange={setFreqMHz} color="#a78bfa" />
        </ControlRow>
      </div>
    </div>
  );
}

function SubPlot({
  theoryCurve,
  toas,
  delayKey,
  color,
  label,
  symbol,
  highlightDelay,
  plotW,
  plotH,
  padL,
  padR,
  xTicks,
  noiseLevel,
  isLast,
  isFitted,
  fittedDelays,
  currentPhase,
}) {
  const theoryVals = theoryCurve.map((p) => p[delayKey] ?? 0);
  const signalAmp = Math.max(...theoryVals.map((v) => Math.abs(v)), 1e-4);
  const noiseSigmaMs = noiseLevel * 1e-3;
  const ySpan = Math.max(signalAmp * 1.35, noiseSigmaMs * 3.5, 1e-3);
  const yMin = -ySpan;
  const yMax = ySpan;
  const xP = (v) => padL + v * plotW;
  const yP = (v) => plotH - ((clamp(v, yMin, yMax) - yMin) / (yMax - yMin)) * plotH;
  const y0 = yP(0);

  const curveD = theoryCurve.map((pt, i) => `${i === 0 ? "M" : "L"}${xP(pt.phase).toFixed(1)},${yP(pt[delayKey] ?? 0).toFixed(1)}`).join("");
  const last = theoryCurve[theoryCurve.length - 1];
  const areaD = `${curveD} L${xP(last.phase).toFixed(1)},${y0.toFixed(1)} L${xP(0).toFixed(1)},${y0.toFixed(1)} Z`;
  const displayColor = isFitted ? "#52525b" : color;
  const dim = highlightDelay && highlightDelay !== delayKey;
  const flatResidualState = delayKey === "residual" && theoryVals.every((v) => Math.abs(v) < 1e-8) && noiseSigmaMs < 1e-8;

  const scatterDots = toas.map((t) => {
    let val;
    let noise;
    if (delayKey === "residual") {
      val = t.residual_fit ?? 0;
      noise = 0;
    } else {
      val = t[delayKey] ?? 0;
      noise = t[`noise_${delayKey}`] ?? 0;
    }
    return { x: xP(t.phase), y: yP(val + noise) };
  });

  return (
    <g opacity={dim ? 0.14 : isFitted ? 0.35 : 1}>
      <rect x={0} y={0} width={padL + plotW + padR} height={plotH} fill={highlightDelay === delayKey ? `${color}09` : "transparent"} />

      {[0.78 * ySpan, 0, -0.78 * ySpan].map((v, i) => (
        <line
          key={i}
          x1={padL}
          x2={padL + plotW}
          y1={yP(v)}
          y2={yP(v)}
          stroke={v === 0 ? "rgba(180,180,200,0.18)" : "rgba(180,180,200,0.055)"}
          strokeWidth={v === 0 ? 1 : 0.7}
        />
      ))}

      {xTicks.map((v) => (
        <line key={v} x1={xP(v)} x2={xP(v)} y1={0} y2={plotH} stroke="rgba(180,180,200,0.045)" strokeWidth="0.7" />
      ))}

      {!flatResidualState && <rect x={padL} y={yP(noiseSigmaMs)} width={plotW} height={yP(-noiseSigmaMs) - yP(noiseSigmaMs)} fill={`${displayColor}0c`} />}
      {!flatResidualState && <path d={areaD} fill={`${displayColor}12`} />}
      <path d={curveD} fill="none" stroke={displayColor} strokeWidth={highlightDelay === delayKey ? 2.6 : 1.9} strokeDasharray={isFitted ? "4 3" : "none"} />

      {currentPhase !== undefined && (
        <line x1={xP(currentPhase)} x2={xP(currentPhase)} y1={0} y2={plotH} stroke="rgba(200,200,220,0.45)" strokeWidth="1" strokeDasharray="3 4" />
      )}

      {scatterDots.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r={2.2} fill={displayColor} fillOpacity={0.65} />
      ))}

      {flatResidualState && (
        <text x={padL + plotW - 8} y={18} textAnchor="end" fill="rgba(161,161,170,0.5)" fontSize="10.5" fontFamily="monospace">
          all fitted
        </text>
      )}

      <line x1={padL} x2={padL} y1={0} y2={plotH} stroke="rgba(180,180,200,0.12)" strokeWidth="1" />
      <text x={9} y={plotH / 2 - 5} fill={displayColor} fontSize="12.5" fontWeight="700" fontFamily="monospace">
        {label}
      </text>
      <text x={9} y={plotH / 2 + 11} fill={displayColor} fontSize="10" fontFamily="monospace" opacity="0.55">
        {symbol}
      </text>

      {!isLast && <line x1={0} y1={plotH} x2={padL + plotW + padR} y2={plotH} stroke="rgba(180,180,200,0.06)" strokeWidth="1" />}
      {isLast && <line x1={padL} y1={plotH} x2={padL + plotW} y2={plotH} stroke="rgba(180,180,200,0.15)" strokeWidth="1" />}
    </g>
  );
}

function ResidualPlot({ theoryCurve, toas, activeDelays, fittedDelays, highlightDelay, noiseLevel, currentPhase }) {
  const hasFitting = Object.values(fittedDelays).some(Boolean);
  const ordered = ["romer", "einstein", "shapiro", "secular", "dm", "total"];
  let visible = ordered.filter((key) => activeDelays[key]);
  if (hasFitting) {
    visible = visible.filter((key) => key !== "total");
    visible.push("residual");
  }

  const SVG_W = 960;
  const PAD_L = 88;
  const PAD_R = 20;
  const PAD_T = 26;
  const PAD_B = 46;
  const ROW_GAP = 14;
  const plotW = SVG_W - PAD_L - PAD_R;
  const ROW_H = visible.length > 0 ? clamp(Math.floor(720 / visible.length), 110, 190) : 120;
  const SVG_H = PAD_T + ROW_H * visible.length + ROW_GAP * Math.max(visible.length - 1, 0) + PAD_B;
  const xTicks = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
  const xP = (v) => PAD_L + v * plotW;
  const lastPhase = toas.length > 0 ? toas[toas.length - 1].phase : null;

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: "100%", height: "100%", display: "block" }} preserveAspectRatio="xMidYMid meet" fontFamily="'DM Mono', monospace">
      {visible.map((key, idx) => {
        const meta = DELAY_COLORS[key];
        return (
          <g key={key} transform={`translate(0, ${PAD_T + idx * (ROW_H + ROW_GAP)})`}>
            <SubPlot
              theoryCurve={theoryCurve}
              toas={toas}
              delayKey={key}
              color={meta.stroke}
              label={meta.label}
              symbol={meta.symbol}
              highlightDelay={highlightDelay}
              plotW={plotW}
              plotH={ROW_H}
              padL={PAD_L}
              padR={PAD_R}
              xTicks={xTicks}
              noiseLevel={noiseLevel}
              isLast={idx === visible.length - 1}
              isFitted={Boolean(fittedDelays[key])}
              fittedDelays={fittedDelays}
              currentPhase={currentPhase}
            />
          </g>
        );
      })}

      {lastPhase !== null && <line x1={xP(lastPhase)} x2={xP(lastPhase)} y1={PAD_T} y2={SVG_H - PAD_B} stroke="rgba(255,255,255,0.22)" strokeWidth="1" strokeDasharray="3 5" />}
      {xTicks.map((v) => (
        <text key={v} x={xP(v)} y={SVG_H - PAD_B + 16} textAnchor="middle" fill="rgba(161,161,170,0.65)" fontSize="11">
          {v.toFixed(1)}
        </text>
      ))}
      <text x={SVG_W / 2} y={SVG_H - 4} textAnchor="middle" fill="rgba(161,161,170,0.5)" fontSize="12">
        Orbital phase
      </text>
      <text x={SVG_W - PAD_R} y={14} textAnchor="end" fill="rgba(160,160,180,0.35)" fontSize="11">
        {toas.length} TOAs
      </text>
    </svg>
  );
}

function PulseTrain({ toas, fittedDelays, pulsePeriodMs, elapsedDays, toaIntervalDays, orbitalPeriodDays }) {
  const show = 10;
  const svgW = 900;
  const svgH = 130;
  const padL = 36;
  const padR = 8;
  const padT = 18;
  const padB = 16;
  const plotW = svgW - padL - padR;
  const peakH = svgH - padT - padB;
  const baseY = padT + peakH;
  const visScale = 0.58;
  const samples = 420;
  const windowDays = Math.max(show * toaIntervalDays, toaIntervalDays);
  const windowStart = elapsedDays - windowDays;
  const pulseMarginDays = Math.max(toaIntervalDays * 2.5, windowDays * 0.12);
  const displayed = toas
    .filter((toa) => toa.epochDays >= windowStart - pulseMarginDays && toa.epochDays <= elapsedDays + pulseMarginDays)
    .sort((a, b) => a.epochDays - b.epochDays);
  const templateLift = 0.0;
  const observedDrop = 0.0;
  const laneWidth = plotW / Math.max(show, 1);
  const phaseSpanPx = laneWidth * visScale;
  const pulseSigma = laneWidth * 0.09;
  const xForEpoch = (epochDays) => padL + ((epochDays - windowStart) / windowDays) * plotW;

  const pulseCenters = displayed.map((toa) => {
    const anchorX = xForEpoch(toa.epochDays);
    const offsetMs = toa.pulse_offset_ms ?? 0;
    const residualFrac = offsetMs / Math.max(pulsePeriodMs, 1e-6);
    const visibleFrac = Math.sign(residualFrac) * Math.pow(Math.abs(residualFrac), 0.72) * 2.35;
    const observedOffsetFrac = clamp(visibleFrac, -0.6, 0.6);
    return {
      template: anchorX,
      observed: anchorX + observedOffsetFrac * phaseSpanPx,
      residualFrac,
    };
  }).filter((center) => {
    const minX = padL - laneWidth;
    const maxX = padL + plotW + laneWidth;
    const templateVisible = center.template >= minX && center.template <= maxX;
    const observedVisible = center.observed >= minX && center.observed <= maxX;
    return templateVisible || observedVisible;
  });

  const buildTrace = (kind) => {
    let d = "";
    for (let i = 0; i <= samples; i++) {
      const xPx = padL + (i / samples) * plotW;
      let amp = 0;
      for (const center of pulseCenters) {
        const dx = xPx - center[kind];
        const localAmp = Math.exp(-0.5 * (dx / pulseSigma) ** 2);
        amp = Math.max(amp, localAmp);
      }
      const laneOffset = kind === "template" ? -templateLift : observedDrop;
      const yPx = baseY - amp * peakH * 0.9 + laneOffset;
      d += `${i === 0 ? "M" : "L"}${xPx.toFixed(1)},${yPx.toFixed(1)} `;
    }
    return d;
  };

  const templatePath = buildTrace("template");
  const observedPath = buildTrace("observed");
  void orbitalPeriodDays;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: "100%", height: "100%", display: "block" }} preserveAspectRatio="xMidYMid meet" fontFamily="'DM Mono', monospace">
      <defs>
        <filter id="pulseGlow" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="1.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <line x1={padL} y1={baseY} x2={padL + plotW} y2={baseY} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      {Array.from({ length: show + 1 }, (_, i) => {
        const x = padL + (i / show) * plotW;
        return <line key={i} x1={x} x2={x} y1={padT} y2={baseY} stroke="rgba(180,180,200,0.035)" strokeWidth="0.7" />;
      })}
      <path
        d={observedPath}
        fill="none"
        stroke="rgba(251,146,60,0.82)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#pulseGlow)"
      />
      <path
        d={templatePath}
        fill="none"
        stroke="rgba(147,197,253,1)"
        strokeWidth="2.2"
        strokeDasharray="6 3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pulseCenters.slice(-8).map((center, i) => {
        const midY = padT + peakH * 0.28 + (i % 2) * 4;
        const isLate = center.observed > center.template;
        return (
          <g key={`offset-${i}`} opacity={Math.min(0.92, 0.45 + Math.abs(center.residualFrac) * 16)}>
            <line
              x1={center.template}
              x2={center.observed}
              y1={midY}
              y2={midY}
              stroke={isLate ? "rgba(251,146,60,0.34)" : "rgba(147,197,253,0.34)"}
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle cx={center.template} cy={midY} r="1.5" fill="rgba(147,197,253,0.78)" />
            <circle cx={center.observed} cy={midY} r="1.5" fill="rgba(251,146,60,0.78)" />
          </g>
        );
      })}
      <g transform={`translate(${padL + 4} 18)`}>
        <line x1={0} y1={0} x2={18} y2={0} stroke="rgba(251,146,60,0.82)" strokeWidth="2" strokeLinecap="round" />
        <text x={24} y={4} fill="rgba(251,146,60,0.88)" fontSize="10.5">
          observed
        </text>
        <line x1={96} y1={0} x2={114} y2={0} stroke="rgba(147,197,253,1)" strokeWidth="2" strokeDasharray="6 3" strokeLinecap="round" />
        <text x={120} y={4} fill="rgba(147,197,253,0.92)" fontSize="10.5">
          template
        </text>
        <text x={208} y={4} fill="rgba(161,161,170,0.7)" fontSize="10">
          dotted guide = early / late offset
        </text>
      </g>
      {displayed.length === 0 && (
        <text x={padL + plotW / 2} y={svgH / 2} textAnchor="middle" fill="rgba(161,161,170,0.3)" fontSize="12">
          Waiting for TOAs...
        </text>
      )}
    </svg>
  );
}

function formatAxisTick(valueMs) {
  const abs = Math.abs(valueMs);
  if (abs >= 1000) return `${fmt(valueMs / 1000, 2)} s`;
  if (abs > 0 && abs < 0.1) return `${fmt(valueMs * 1000, 1)} us`;
  return `${fmt(valueMs, abs < 1 ? 3 : 2)} ms`;
}

function LongBaselinePlot({
  currentSamples,
  referenceSamples,
  primaryFreq,
  secondFreqMHz,
  compareMode,
  onCompareModeChange,
  xMode,
  onXModeChange,
  yMode,
  onYModeChange,
  overlayMode,
  onOverlayModeChange,
  zoomPreset,
  onZoomPresetChange,
  fittedDelays,
  noiseLevel,
  epochOffsetCount,
}) {
  const plotW = 960;
  const plotH = 280;
  const padL = 72;
  const padR = 24;
  const padT = 24;
  const padB = 42;
  const innerW = plotW - padL - padR;
  const innerH = plotH - padT - padB;
  const points = currentSamples.points;
  const refPoints = referenceSamples.points;
  const xAccessor = (point) => (xMode === "phase" ? point.phase : point.tDays);
  const xMin = 0;
  const xMax = Math.max(...points.map(xAccessor), 1);
  const x = (point) => padL + ((xAccessor(point) - xMin) / Math.max(xMax - xMin, 1e-6)) * innerW;

  const preValues = points.map((point) => getLongValue(point, yMode, fittedDelays, 1));
  const postValues = points.map((point) => getPostFitLongValue(point, yMode, fittedDelays, 1));
  const refPreValues = refPoints.map((point) => getLongValue(point, yMode, fittedDelays, 1));
  const refPostValues = refPoints.map((point) => getPostFitLongValue(point, yMode, fittedDelays, 1));

  const zoomFactor = {
    auto: 1,
    tight: 0.6,
    dm: yMode === "dm" ? 0.45 : 1,
    shapiro: yMode === "shapiro" ? 0.45 : 1,
    secular: yMode === "secular" ? 0.32 : 1,
  }[zoomPreset];

  const preMax = Math.max(...preValues.map((v) => Math.abs(v)), ...refPreValues.map((v) => Math.abs(v)), 1e-3) * zoomFactor;
  const postPointExtent = Math.max(...postValues.map((v) => Math.abs(v)), ...refPostValues.map((v) => Math.abs(v)), 0);
  const preY = (v) => padT + innerH - ((v + preMax) / (2 * preMax)) * innerH;
  const noiseSigmaMs = noiseLevel * 1e-3;
  const postMax = Math.max(postPointExtent, noiseSigmaMs * 4, 1e-5) * zoomFactor;
  const postY = (v) => padT + innerH - ((v + postMax) / (2 * postMax)) * innerH;
  const preZeroY = preY(0);
  const postZeroY = postY(0);
  const preErr = clamp(Math.abs(preY(noiseSigmaMs) - preY(0)), 0.35, 4.5);
  const postErr = clamp(Math.abs(postY(noiseSigmaMs) - postY(0)), 0.35, 4.5);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => xMin + (xMax - xMin) * f);
  const preYTicks = [preMax, 0, -preMax];
  const postYTicks = [postMax, 0, -postMax];
  const tickLabel = (tick) => {
    if (xMode === "phase") return tick.toFixed(2);
    if (xMax >= 30) return tick.toFixed(0);
    if (xMax >= 1) return tick.toFixed(1);
    return `${(tick * 24).toFixed(1)}`;
  };
  const axisLabel = xMode === "phase" ? "Orbital phase" : xMax >= 30 ? "Epoch (MJD offset, d)" : xMax >= 1 ? "Epoch (d)" : "Epoch (h)";

  const showReference = overlayMode === "reference";
  const showSelected = overlayMode === "selected";
  const hasFittedTerms = Object.values(fittedDelays || {}).some(Boolean);
  const residualNoiseLimited = yMode === "residual" && epochOffsetCount === 0;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          padding: "0 4px",
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <SegmentedToggle
            compact
            accent="#93c5fd"
            value={xMode}
            onChange={onXModeChange}
            options={[
              { value: "epoch", label: "x: epoch" },
              { value: "phase", label: "x: phase" },
            ]}
          />
          <SegmentedToggle
            compact
            accent="#f4f4f5"
            value={yMode}
            onChange={onYModeChange}
            options={[
              { value: "residual", label: "residual" },
              { value: "dm", label: "DM" },
              { value: "shapiro", label: "Shapiro" },
              { value: "secular", label: "Secular" },
              { value: "total", label: "total" },
            ]}
          />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <SegmentedToggle
            compact
            accent="#a78bfa"
            value={compareMode}
            onChange={onCompareModeChange}
            options={[
              { value: "single", label: "1 freq" },
              { value: "dual", label: "2 freq" },
            ]}
          />
          <SegmentedToggle
            compact
            accent="#4dbf96"
            value={overlayMode}
            onChange={onOverlayModeChange}
            options={[
              { value: "none", label: "overlay off" },
              { value: "reference", label: "reference" },
              { value: "selected", label: "selected" },
            ]}
          />
          <SegmentedToggle
            compact
            accent="#f59e0b"
            value={zoomPreset}
            onChange={onZoomPresetChange}
            options={[
              { value: "auto", label: "zoom auto" },
              { value: "tight", label: "tight" },
              { value: "dm", label: "DM" },
              { value: "shapiro", label: "Shapiro" },
              { value: "secular", label: "Secular" },
            ]}
          />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 14, minHeight: 0, flex: 1 }}>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, border: "1px solid rgba(180,180,200,0.09)", overflow: "hidden", padding: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "0 6px 8px" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f4f4f5" }}>Pre-fit</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 11, color: "#71717a" }}>
              {residualNoiseLimited && <span>models match</span>}
              <span>{compareMode === "dual" ? `${primaryFreq}/${secondFreqMHz} MHz` : `${primaryFreq} MHz`}</span>
              <span>{DELAY_COLORS[yMode]?.label ?? "Residual"}</span>
            </div>
          </div>
          <svg viewBox={`0 0 ${plotW} ${plotH}`} style={{ width: "100%", height: "100%", display: "block" }}>
            <line x1={padL} x2={padL + innerW} y1={preZeroY} y2={preZeroY} stroke="rgba(180,180,200,0.16)" strokeWidth="1" />
            {ticks.map((tick) => (
              <line key={tick} x1={padL + ((tick - xMin) / Math.max(xMax - xMin, 1e-6)) * innerW} x2={padL + ((tick - xMin) / Math.max(xMax - xMin, 1e-6)) * innerW} y1={padT} y2={padT + innerH} stroke="rgba(180,180,200,0.05)" strokeWidth="1" />
            ))}
            {preYTicks.map((tick, index) => (
              <g key={index}>
                <line x1={padL} x2={padL + innerW} y1={preY(tick)} y2={preY(tick)} stroke={tick === 0 ? "rgba(180,180,200,0.16)" : "rgba(180,180,200,0.055)"} strokeWidth={tick === 0 ? 1 : 0.8} />
                <text x={padL - 8} y={preY(tick) + 4} textAnchor="end" fill="rgba(161,161,170,0.65)" fontSize="10">
                  {formatAxisTick(tick)}
                </text>
              </g>
            ))}
            {showReference &&
              refPoints.map((point, i) => (
                <circle
                  key={`pre-ref-${i}`}
                  cx={x(point)}
                  cy={preY(getLongValue(point, yMode, fittedDelays, 1))}
                  r={2.8}
                  fill="none"
                  stroke="rgba(244,244,245,0.45)"
                  strokeWidth="0.9"
                />
              ))}
            {showSelected &&
              yMode === "residual" &&
              ["dm", "shapiro", "secular", "romer", "einstein"]
                .filter((key) => Math.abs(points.reduce((sum, point) => sum + Math.abs(point.mismatch?.[key] ?? 0), 0)) > 1e-6)
                .map((key) => (
                  <path
                    key={`pre-selected-${key}`}
                    d={points
                      .map((point, i) => `${i === 0 ? "M" : "L"}${x(point).toFixed(2)} ${preY((point.mismatch?.[key] ?? 0)).toFixed(2)}`)
                      .join(" ")}
                    fill="none"
                    stroke={DELAY_COLORS[key].stroke}
                    strokeWidth="1"
                    strokeOpacity="0.5"
                  />
                ))}
            {points.map((point, i) => (
              <g key={i}>
                <line x1={x(point)} x2={x(point)} y1={preY(getLongValue(point, yMode, fittedDelays, 1)) - preErr} y2={preY(getLongValue(point, yMode, fittedDelays, 1)) + preErr} stroke="rgba(228,228,231,0.36)" strokeWidth="0.7" />
                <circle cx={x(point)} cy={preY(getLongValue(point, yMode, fittedDelays, 1))} r={2.4} fill={compareMode === "dual" ? (point.freq === primaryFreq ? "#9580d4" : "#7aa2f7") : "#f4f4f5"} fillOpacity="0.9" />
              </g>
            ))}
            {ticks.map((tick) => (
              <text key={tick} x={padL + ((tick - xMin) / Math.max(xMax - xMin, 1e-6)) * innerW} y={plotH - 12} textAnchor="middle" fill="rgba(161,161,170,0.65)" fontSize="11">
                {tickLabel(tick)}
              </text>
            ))}
            <text x={plotW / 2} y={plotH - 2} textAnchor="middle" fill="rgba(161,161,170,0.5)" fontSize="12">
              {axisLabel}
            </text>
            <text x={16} y={18} fill="rgba(161,161,170,0.5)" fontSize="11">
              {DELAY_COLORS[yMode]?.label ?? yMode}
            </text>
            {residualNoiseLimited && (
              <g>
                <rect x={padL + 14} y={padT + 12} width={166} height={28} rx={14} fill="rgba(14,14,18,0.84)" stroke="rgba(180,180,200,0.08)" />
                <text x={padL + 97} y={padT + 30} textAnchor="middle" fill="rgba(161,161,170,0.74)" fontSize="10.5">
                  Residuals are noise-limited
                </text>
              </g>
            )}
          </svg>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, border: "1px solid rgba(180,180,200,0.09)", overflow: "hidden", padding: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "0 6px 8px" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f4f4f5" }}>Post-fit</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 11 }}>
              {!hasFittedTerms && <span style={{ color: "#71717a" }}>no fit terms selected</span>}
              {hasFittedTerms && residualNoiseLimited && <span style={{ color: "#71717a" }}>no model mismatch to remove</span>}
              {["dm", "shapiro", "secular", "romer", "einstein"].map((key) => (
                <span key={key} style={{ color: fittedDelays[key] ? DELAY_COLORS[key].stroke : "#71717a" }}>
                  {DELAY_COLORS[key].label}
                </span>
              ))}
            </div>
          </div>
          <svg viewBox={`0 0 ${plotW} ${plotH}`} style={{ width: "100%", height: "100%", display: "block" }}>
            <line x1={padL} x2={padL + innerW} y1={postZeroY} y2={postZeroY} stroke="rgba(180,180,200,0.16)" strokeWidth="1" />
            {ticks.map((tick) => (
              <line key={tick} x1={padL + ((tick - xMin) / Math.max(xMax - xMin, 1e-6)) * innerW} x2={padL + ((tick - xMin) / Math.max(xMax - xMin, 1e-6)) * innerW} y1={padT} y2={padT + innerH} stroke="rgba(180,180,200,0.05)" strokeWidth="1" />
            ))}
            {postYTicks.map((tick, index) => (
              <g key={index}>
                <line x1={padL} x2={padL + innerW} y1={postY(tick)} y2={postY(tick)} stroke={tick === 0 ? "rgba(180,180,200,0.16)" : "rgba(180,180,200,0.055)"} strokeWidth={tick === 0 ? 1 : 0.8} />
                <text x={padL - 8} y={postY(tick) + 4} textAnchor="end" fill="rgba(161,161,170,0.65)" fontSize="10">
                  {formatAxisTick(tick)}
                </text>
              </g>
            ))}
            {showReference &&
              refPoints.map((point, i) => (
                <circle
                  key={`post-ref-${i}`}
                  cx={x(point)}
                  cy={postY(getPostFitLongValue(point, yMode, fittedDelays, 1))}
                  r={2.7}
                  fill="none"
                  stroke="rgba(244,244,245,0.42)"
                  strokeWidth="0.9"
                />
              ))}
            {showSelected &&
              yMode === "residual" &&
              ["dm", "shapiro", "secular", "romer", "einstein"]
                .filter((key) => !fittedDelays[key] && Math.abs(points.reduce((sum, point) => sum + Math.abs(point.mismatch?.[key] ?? 0), 0)) > 1e-6)
                .map((key) => (
                  <path
                    key={`post-selected-${key}`}
                    d={points
                      .map((point, i) => `${i === 0 ? "M" : "L"}${x(point).toFixed(2)} ${postY(point.mismatch?.[key] ?? 0).toFixed(2)}`)
                      .join(" ")}
                    fill="none"
                    stroke={DELAY_COLORS[key].stroke}
                    strokeWidth="1"
                    strokeOpacity="0.45"
                  />
                ))}
            {points.map((point, i) => (
              <g key={i}>
                <line x1={x(point)} x2={x(point)} y1={postY(getPostFitLongValue(point, yMode, fittedDelays, 1)) - postErr} y2={postY(getPostFitLongValue(point, yMode, fittedDelays, 1)) + postErr} stroke="rgba(228,228,231,0.34)" strokeWidth="0.7" />
                <circle cx={x(point)} cy={postY(getPostFitLongValue(point, yMode, fittedDelays, 1))} r={2.2} fill={compareMode === "dual" ? (point.freq === primaryFreq ? "#9580d4" : "#7aa2f7") : "#e07848"} fillOpacity="0.85" />
              </g>
            ))}
            {ticks.map((tick) => (
              <text key={tick} x={padL + ((tick - xMin) / Math.max(xMax - xMin, 1e-6)) * innerW} y={plotH - 12} textAnchor="middle" fill="rgba(161,161,170,0.65)" fontSize="11">
                {tickLabel(tick)}
              </text>
            ))}
            <text x={plotW / 2} y={plotH - 2} textAnchor="middle" fill="rgba(161,161,170,0.5)" fontSize="12">
              {axisLabel}
            </text>
            <text x={16} y={18} fill="rgba(161,161,170,0.5)" fontSize="11">
              {DELAY_COLORS[yMode]?.label ?? yMode}
            </text>
            {!hasFittedTerms && (
              <g>
                <rect x={padL + 14} y={padT + 12} width={176} height={28} rx={14} fill="rgba(14,14,18,0.84)" stroke="rgba(180,180,200,0.08)" />
                <text x={padL + 102} y={padT + 30} textAnchor="middle" fill="rgba(161,161,170,0.74)" fontSize="10.5">
                  Post-fit matches pre-fit until a term is fit
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", padding: "0 4px", fontSize: 11, color: "#71717a" }}>
        <span>{compareMode === "dual" ? `${primaryFreq}/${secondFreqMHz} MHz` : `${primaryFreq} MHz`}</span>
        <span>x: {xMode === "phase" ? "orbital phase" : "epoch"}</span>
        <span>y: {DELAY_COLORS[yMode]?.label ?? yMode}</span>
        <span>sigma_TOA {noiseLevel} us</span>
      </div>
    </div>
  );
}

export default function BinaryPulsarTeachingLab({ fullPage = false }: { fullPage?: boolean }) {
  const navigate = useNavigate();
  usePageMeta(
    "Binary Pulsar Timing Lab – Fazal Kareem",
    "Interactive binary pulsar timing workbench for orbital geometry, timing delays, TOAs, and residuals."
  );
  const rootRef = useRef(null);
  const headerRef = useRef(null);
  const fileInputRef = useRef(null);
  const elapsedRef = useRef(0);
  const lastToaRef = useRef(0);
  const lastRef = useRef(null);
  const lastDisplayUpdateRef = useRef(0);
  const rafRef = useRef(null);
  const beamAngleRef = useRef(0);
  const companionBeamAngleRef = useRef(0);
  const absoluteElapsedRef = useRef(0);

  const initialModel = normalizeModelEnvelope(MODEL_PRESETS[0]);
  const [viewportWidth, setViewportWidth] = useState(1400);
  const [headerHeight, setHeaderHeight] = useState(96);
  const [menuOpen, setMenuOpen] = useState(() => (typeof window === "undefined" ? true : window.innerWidth >= 1280));
  const [activeTab, setActiveTab] = useState("orbit");
  const [loadedModel, setLoadedModel] = useState(initialModel);
  const [currentModel, setCurrentModel] = useState(initialModel.values);
  const [activePresetId, setActivePresetId] = useState(initialModel.id);
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeScale, setTimeScale] = useState(300);
  const [elapsed, setElapsed] = useState(initialModel.values.T0_days);
  const [absoluteElapsed, setAbsoluteElapsed] = useState(initialModel.values.T0_days);
  const [showBeam, setShowBeam] = useState(true);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showGW, setShowGW] = useState(true);
  const [showVelVec, setShowVelVec] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [beamWidth, setBeamWidth] = useState(18);
  const [beamOpacity, setBeamOpacity] = useState(0.85);
  const [trailLen, setTrailLen] = useState(1);
  const [noiseLevel, setNoiseLevel] = useState(10);
  const [toaInterval, setToaInterval] = useState(8);
  const [freqMHz, setFreqMHz] = useState(1277);
  const [secondFreqMHz, setSecondFreqMHz] = useState(800);
  const [dmVarAmp, setDmVarAmp] = useState(0.35);
  const [longBaselineWindow, setLongBaselineWindow] = useState("month");
  const [frequencyCompareMode, setFrequencyCompareMode] = useState("dual");
  const [longXAxis, setLongXAxis] = useState("epoch");
  const [longYAxis, setLongYAxis] = useState("residual");
  const [longOverlay, setLongOverlay] = useState("reference");
  const [zoomPreset, setZoomPreset] = useState("auto");
  const [epochOffsets, setEpochOffsets] = useState({
    romer: 0,
    einstein: 0,
    shapiro: 0,
    secular: 0,
    dm: 0,
  });
  const [epochParamOffsets, setEpochParamOffsets] = useState(() => zeroOffsetMap(EPOCH_OFFSET_PARAM_KEYS));
  const [activeDelays, setActiveDelays] = useState({
    romer: true,
    einstein: true,
    shapiro: true,
    secular: false,
    dm: false,
    total: true,
  });
  const [fittedDelays, setFittedDelays] = useState({
    romer: false,
    einstein: false,
    shapiro: false,
    secular: false,
    dm: false,
  });
  const [highlightDelay, setHighlightDelay] = useState(null);
  const [toas, setToas] = useState([]);
  const [importNotice, setImportNotice] = useState("");
  const [constraintToast, setConstraintToast] = useState("");

  useEffect(() => {
    const updateViewport = () => {
      const nextWidth = rootRef.current?.clientWidth ?? window.innerWidth;
      setViewportWidth(nextWidth);
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (!headerRef.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setHeaderHeight(entry.contentRect.height);
    });
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  const isCompact = viewportWidth < 1280;
  const isMobile = viewportWidth < 768;
  const panelWidth = Math.min(380, Math.max(300, viewportWidth - 32));
  const timingLeftPad = menuOpen && !isCompact ? panelWidth + 32 : 16;
  const workspaceTopInset = headerHeight + 10;
  const sidePanelTopInset = headerHeight + 6;
  const orbitSceneOffset = menuOpen && !isCompact ? 112 : 0;

  useEffect(() => {
    if (isCompact) setMenuOpen(false);
  }, [isCompact]);

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  useEffect(() => {
    absoluteElapsedRef.current = absoluteElapsed;
  }, [absoluteElapsed]);

  useEffect(() => {
    if (activeTab === "longBaseline") {
      setIsPlaying(false);
    }
  }, [activeTab]);

  const currentSupport = useMemo(() => modelSupport({ ...loadedModel, values: currentModel }), [loadedModel, currentModel]);
  const loadedSupport = useMemo(() => modelSupport(loadedModel), [loadedModel]);
  const pulsePeriodMs = 1000 / Math.max(currentModel.F0, 1e-6);
  const modelDeltaCount = useMemo(() => countModelDiffs(currentModel, loadedModel.values), [currentModel, loadedModel]);
  const epochOffsetCount = useMemo(() => countOffsetDiffs(epochOffsets), [epochOffsets]);
  const epochParamOffsetCount = useMemo(() => countOffsetDiffs(epochParamOffsets), [epochParamOffsets]);

  const dynamics = useMemo(() => {
    const Pb = currentModel.PB_days * DAY;
    const e = currentModel.ECC;
    const omega = (currentModel.OM_deg * Math.PI) / 180;
    const inc = (currentModel.INC_deg * Math.PI) / 180;
    const xM = currentModel.A1_lt_s * C;
    const aP = xM / Math.max(Math.sin(inc), 1e-6);
    const pulsarMass = currentModel.pulsarMass || DEFAULT_MODEL_VALUES.pulsarMass;
    const companionMass = currentModel.M2;
    const aRel = aP * (1 + pulsarMass / companionMass);
    const n = (2 * Math.PI) / Math.max(Pb, 1e-6);
    const omDot = ((currentModel.OMDOT_deg_yr * Math.PI) / 180) / (365.25 * DAY);
    return {
      Pb,
      e,
      omega,
      inc,
      aRel,
      n,
      omDot,
      muP: companionMass / (pulsarMass + companionMass),
      muC: pulsarMass / (pulsarMass + companionMass),
    };
  }, [currentModel]);

  const scene = useMemo(() => {
    const t = elapsed * DAY;
    const M = ((dynamics.n * t) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const E = kepler(M, dynamics.e);
    const f = trueAnom(E, dynamics.e);
    const r = dynamics.aRel * (1 - dynamics.e * Math.cos(E));
    const omNow = dynamics.omega + dynamics.omDot * elapsed * DAY;
    const cosW = Math.cos(omNow);
    const sinW = Math.sin(omNow);
    const xOrb = r * Math.cos(f);
    const yOrb = r * Math.sin(f);
    const xR = xOrb * cosW - yOrb * sinW;
    const yR = xOrb * sinW + yOrb * cosW;
    const proj = (bx, by) => ({ x: bx, y: -by * Math.cos(dynamics.inc) });
    const sinE = Math.sin(E);
    const cosE = Math.cos(E);
    const losProj = Math.sin(omNow) * (cosE - dynamics.e) + Math.sqrt(1 - dynamics.e * dynamics.e) * Math.cos(omNow) * sinE;
    return {
      psr: proj(-dynamics.muP * xR, -dynamics.muP * yR),
      cmp: proj(dynamics.muC * xR, dynamics.muC * yR),
      losProj,
      psrBehindCmp: losProj > 0,
      omNow,
      E,
      r,
      orbitalAngRate: dynamics.n * ((1 + dynamics.e * Math.cos(f)) ** 2) / Math.max((1 - dynamics.e * dynamics.e) ** 1.5, 1e-6),
      phase: ((M / (2 * Math.PI)) + 1) % 1,
      f,
    };
  }, [elapsed, dynamics]);

  const currentDelays = useMemo(
    () => computeDelays(elapsed, currentModel, freqMHz, { romer: true, einstein: true, shapiro: true, secular: true, dm: true }),
    [elapsed, currentModel, freqMHz]
  );

  const theoryCurve = useMemo(() => buildTheoryCurve(currentModel, freqMHz, fittedDelays), [currentModel, freqMHz, fittedDelays]);

  const longBaselineCurrent = useMemo(
    () =>
      buildLongBaselineSamples({
        model: currentModel,
        windowKey: longBaselineWindow,
        primaryFreq: freqMHz,
        secondFreq: secondFreqMHz,
        compareMode: frequencyCompareMode,
        dmVarAmp,
        noiseLevel,
        termOffsets: epochOffsets,
        paramOffsets: epochParamOffsets,
      }),
    [currentModel, longBaselineWindow, freqMHz, secondFreqMHz, frequencyCompareMode, dmVarAmp, noiseLevel, epochOffsets, epochParamOffsets]
  );

  const longBaselineReference = useMemo(
    () =>
      buildLongBaselineSamples({
        model: loadedModel.values,
        windowKey: longBaselineWindow,
        primaryFreq: freqMHz,
        secondFreq: secondFreqMHz,
        compareMode: frequencyCompareMode,
        dmVarAmp: 0,
        noiseLevel,
        termOffsets: { romer: 0, einstein: 0, shapiro: 0, secular: 0, dm: 0 },
        paramOffsets: zeroOffsetMap(EPOCH_OFFSET_PARAM_KEYS),
      }),
    [loadedModel, longBaselineWindow, freqMHz, secondFreqMHz, frequencyCompareMode, noiseLevel]
  );

  const orbits = useMemo(() => {
    const pts = (sign) => {
      const arr = [];
      for (let i = 0; i <= 400; i++) {
        const f = (i / 400) * 2 * Math.PI;
        const r = (dynamics.aRel * (1 - dynamics.e ** 2)) / (1 + dynamics.e * Math.cos(f));
        const xO = r * Math.cos(f);
        const yO = r * Math.sin(f);
        const cosW = Math.cos(dynamics.omega);
        const sinW = Math.sin(dynamics.omega);
        const xR = xO * cosW - yO * sinW;
        const yR = xO * sinW + yO * cosW;
        const mu = sign > 0 ? dynamics.muC : -dynamics.muP;
        arr.push([mu * xR, -mu * yR * Math.cos(dynamics.inc)]);
      }
      return arr;
    };
    return { psr: pts(-1), cmp: pts(1) };
  }, [dynamics]);

  const trail = useMemo(() => {
    const steps = 200;
    const frac = trailLen;
    const now = scene.phase * 2 * Math.PI;
    const pPts = [];
    const cPts = [];
    for (let i = 0; i <= steps; i++) {
      const f = now - frac * 2 * Math.PI * (1 - i / steps);
      const r = (dynamics.aRel * (1 - dynamics.e ** 2)) / (1 + dynamics.e * Math.cos(f));
      const xO = r * Math.cos(f);
      const yO = r * Math.sin(f);
      const cosW = Math.cos(scene.omNow);
      const sinW = Math.sin(scene.omNow);
      const xR = xO * cosW - yO * sinW;
      const yR = xO * sinW + yO * cosW;
      pPts.push([-dynamics.muP * xR, dynamics.muP * yR * Math.cos(dynamics.inc)]);
      cPts.push([dynamics.muC * xR, -dynamics.muC * yR * Math.cos(dynamics.inc)]);
    }
    return { psr: pPts, cmp: cPts };
  }, [scene.phase, scene.omNow, dynamics, trailLen]);

  const W = 1600;
  const H = 950;
  const CENTER = { x: W * 0.5, y: H * 0.52 };
  const ORBIT_TARGET_RADIUS = 355;
  const ORBIT_CONSTRAINT_RADIUS = 420;
  const maxExt = useMemo(() => Math.max(1, ...[...orbits.psr, ...orbits.cmp].map(([x, y]) => Math.max(Math.abs(x), Math.abs(y)))), [orbits]);
  const baselineExtent = useMemo(() => projectedOrbitExtent(loadedModel.values), [loadedModel]);
  const defaultScale = ORBIT_TARGET_RADIUS / Math.max(baselineExtent, 1);
  const constrainedScale = ORBIT_CONSTRAINT_RADIUS / Math.max(maxExt, 1);
  const scale = Math.min(defaultScale, constrainedScale);
  const isOrbitConstrained = scale < defaultScale * 0.999;
  const toSvg = useCallback((p) => ({ x: CENTER.x + p.x * scale, y: CENTER.y - p.y * scale }), [scale]);
  const pathD = useCallback(
    (pts) =>
      pts
        .map(([x, y], i) => {
          const s = toSvg({ x, y });
          return `${i === 0 ? "M" : "L"}${s.x.toFixed(1)} ${s.y.toFixed(1)}`;
        })
        .join(" "),
    [toSvg]
  );

  const toaIntervalDays = toaInterval / (24 * 60);
  const timingToas = useMemo(
    () =>
      toas.map((toa) => {
        const template = computeDelays(toa.epochDays, currentModel, freqMHz, {
          romer: activeDelays.romer,
          einstein: activeDelays.einstein,
          shapiro: activeDelays.shapiro,
          secular: activeDelays.secular,
          dm: activeDelays.dm,
        });
        const visibleObservedTotal = sumVisibleDelayTerms(toa, activeDelays, null) + sumVisibleNoiseTerms(toa, activeDelays);
        const fittedTemplateTotal = sumSelectedDelayTerms(template, fittedDelays);
        const residualTotal = (toa.total ?? 0) + (toa.noise_total ?? 0) - sumVisibleDelayTerms(template, activeDelays, null);
        const residualFit = (toa.total ?? 0) + (toa.noise_total ?? 0) - sumVisibleDelayTerms(template, activeDelays, fittedDelays);
        return {
          ...toa,
          template,
          residual_total: residualTotal,
          residual_fit: residualFit,
          pulse_offset_ms: visibleObservedTotal - fittedTemplateTotal,
        };
      }),
    [toas, currentModel, freqMHz, activeDelays, fittedDelays]
  );

  useEffect(() => {
    if (!isPlaying) {
      lastRef.current = null;
      lastDisplayUpdateRef.current = 0;
      setBeamAngle(beamAngleRef.current);
      setCompanionBeamAngle(companionBeamAngleRef.current);
      return;
    }

    const tick = (now) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = Math.min((now - lastRef.current) / 1000, 0.05);
      lastRef.current = now;
      const dSim = (dt * timeScale) / DAY;
      const prevWrapped = elapsedRef.current;
      const nextAbsolute = absoluteElapsedRef.current + dSim;
      const nextWrapped = (((prevWrapped - currentModel.T0_days + dSim) % currentModel.PB_days) + currentModel.PB_days) % currentModel.PB_days + currentModel.T0_days;
      elapsedRef.current = nextWrapped;
      absoluteElapsedRef.current = nextAbsolute;
      let appendedToa = false;
      const sinceLastToa = nextAbsolute - lastToaRef.current;
      if (sinceLastToa >= toaIntervalDays) {
        lastToaRef.current = nextAbsolute;
        const d = computeDelays(nextAbsolute, currentModel, freqMHz, activeDelays);
        const gaussianNoise = () => {
          const u1 = Math.max(1e-10, Math.random());
          const u2 = Math.random();
          return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        };
        const noiseSigma = noiseLevel * 1e-3;
        const toa = {
          epochDays: nextAbsolute,
          phase: orbitalPhaseAt(nextAbsolute, currentModel),
          romer: d.romer,
          einstein: d.einstein,
          shapiro: d.shapiro,
          secular: d.secular,
          dm: d.dm,
          total: d.total,
          noise_romer: gaussianNoise() * noiseSigma,
          noise_einstein: gaussianNoise() * noiseSigma,
          noise_shapiro: gaussianNoise() * noiseSigma,
          noise_secular: gaussianNoise() * noiseSigma,
          noise_dm: gaussianNoise() * noiseSigma,
          noise_total: gaussianNoise() * noiseSigma,
        };
        appendedToa = true;
        setToas((prevToas) => [...prevToas.slice(-250), toa]);
      }

      beamAngleRef.current += dt * currentModel.F0 * 2 * Math.PI;
      if (currentModel.companionIsPulsar && currentModel.companionF0 > 0) {
        companionBeamAngleRef.current += dt * currentModel.companionF0 * 2 * Math.PI;
      }
      const targetFrameMs = activeTab === "orbit" ? 1000 / 30 : 1000 / 24;
      if (appendedToa || now - lastDisplayUpdateRef.current >= targetFrameMs) {
        lastDisplayUpdateRef.current = now;
        setElapsed(nextWrapped);
        setAbsoluteElapsed(nextAbsolute);
        setBeamAngle(beamAngleRef.current);
        setCompanionBeamAngle(companionBeamAngleRef.current);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, timeScale, toaIntervalDays, activeDelays, freqMHz, noiseLevel, currentModel, activeTab]);

  useEffect(() => {
    setToas([]);
    lastToaRef.current = currentModel.T0_days;
    elapsedRef.current = currentModel.T0_days;
    absoluteElapsedRef.current = currentModel.T0_days;
    setElapsed(currentModel.T0_days);
    setAbsoluteElapsed(currentModel.T0_days);
  }, [noiseLevel, currentModel, freqMHz, toaInterval]);

  const [beamAngle, setBeamAngle] = useState(0);
  const [companionBeamAngle, setCompanionBeamAngle] = useState(0);
  const wasOrbitConstrainedRef = useRef(false);

  useEffect(() => {
    if (isOrbitConstrained && !wasOrbitConstrainedRef.current) {
      setConstraintToast("Orbit view constrained to keep the model on screen");
      const id = setTimeout(() => setConstraintToast(""), 1800);
      wasOrbitConstrainedRef.current = true;
      return () => clearTimeout(id);
    }
    if (!isOrbitConstrained) {
      wasOrbitConstrainedRef.current = false;
    }
  }, [isOrbitConstrained]);

  const pXY = toSvg(scene.psr);
  const cXY = toSvg(scene.cmp);

  const handleModelParamChange = (key, value) => {
    if (!Number.isFinite(value)) return;
    setCurrentModel((prev) => ({ ...prev, [key]: value }));
  };

  const loadEnvelope = (envelope, setAsPreset = false) => {
    const normalized = normalizeModelEnvelope(envelope);
    setLoadedModel(normalized);
    setCurrentModel(normalized.values);
    setElapsed(normalized.values.T0_days);
    setAbsoluteElapsed(normalized.values.T0_days);
    setToas([]);
    setEpochOffsets({ romer: 0, einstein: 0, shapiro: 0, secular: 0, dm: 0 });
    setEpochParamOffsets(zeroOffsetMap(EPOCH_OFFSET_PARAM_KEYS));
    lastToaRef.current = normalized.values.T0_days;
    elapsedRef.current = normalized.values.T0_days;
    absoluteElapsedRef.current = normalized.values.T0_days;
    if (setAsPreset) setActivePresetId(normalized.id);
  };

  const handlePresetChange = (presetId) => {
    const preset = MODEL_PRESETS.find((entry) => entry.id === presetId);
    if (!preset) return;
    loadEnvelope(preset, true);
    setImportNotice("");
  };

  const handleDuplicateModel = () => {
    const duplicate = normalizeModelEnvelope({
      id: `session-${Date.now()}`,
      source: loadedModel.source,
      displayName: `PSR ${currentModel.name} copy`,
      values: { ...currentModel, name: `${currentModel.name}-copy` },
      providedFields: Object.keys(currentModel),
      unknownKeys: loadedModel.unknownKeys,
    });
    setLoadedModel(duplicate);
    setCurrentModel(duplicate.values);
    setImportNotice("Session baseline duplicated");
  };

  const handleParFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseParText(text);
    loadEnvelope(parsed, false);
    setActivePresetId("");
    setImportNotice(parsed.unknownKeys.length ? `Ignored ${parsed.unknownKeys.length} unsupported par keys` : "par loaded");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div
      ref={rootRef}
      className={`relative w-full overflow-hidden text-zinc-100 ${fullPage ? "" : "rounded-[28px] border border-white/10 shadow-[0_28px_120px_rgba(0,0,0,0.45)]"}`}
      style={{
        fontFamily: "'DM Mono','JetBrains Mono',monospace",
        background: "radial-gradient(circle at top left, rgba(122,162,247,0.12), transparent 26%), radial-gradient(circle at top right, rgba(77,191,150,0.08), transparent 24%), #0e0e12",
        height: fullPage ? "100svh" : isMobile ? 1220 : 980,
      }}
    >
      {showGrid && activeTab !== "longBaseline" && (
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: "linear-gradient(rgba(140,140,170,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(140,140,170,.18) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
            opacity: 0.22,
          }}
        />
      )}

      <input ref={fileInputRef} type="file" accept=".par,.txt" onChange={handleParFile} style={{ display: "none" }} />

      <div ref={headerRef} className="absolute left-0 right-0 top-0 z-30 px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-[rgba(12,12,16,0.72)] px-3 py-3 shadow-[0_18px_42px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:px-4">
          <div className="flex flex-wrap items-center gap-2">
            {fullPage && (
              <>
                <button
                  onClick={() => navigate("/")}
                  className="flex h-10 items-center rounded-lg px-3 transition-all duration-150 hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:scale-[0.98]"
                  style={{ border: "1px solid rgba(180,180,200,0.1)", background: "rgba(255,255,255,0.04)" }}
                  aria-label="Go home"
                >
                  <img src="/FK.svg" alt="Fazal Kareem" className="h-8 w-auto object-contain" style={{ filter: "invert(1)" }} />
                </button>
                <button
                  onClick={() => {
                    if (window.history.length > 1) navigate(-1);
                    else navigate("/resources");
                  }}
                  className="flex h-10 items-center gap-2 rounded-lg px-4 text-sm text-zinc-300 transition-all duration-150 hover:-translate-y-px hover:text-zinc-100 hover:brightness-110 active:translate-y-0 active:scale-[0.98]"
                  style={{ border: "1px solid rgba(180,180,200,0.1)", background: "rgba(255,255,255,0.04)" }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              </>
            )}

            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex h-10 items-center gap-2 rounded-lg px-4 text-sm text-zinc-400 transition-all duration-150 hover:-translate-y-px hover:text-zinc-100 hover:brightness-110 active:translate-y-0 active:scale-[0.98]"
              style={{ border: "1px solid rgba(180,180,200,0.1)", background: "rgba(255,255,255,0.04)" }}
            >
              {menuOpen ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
              {menuOpen ? "Hide panel" : "Controls"}
            </button>
          </div>

          <div className="flex min-w-[320px] flex-1 flex-wrap items-center justify-center gap-2">
            <div className="flex h-10 items-center gap-2.5 rounded-lg px-4" style={{ border: "1px solid rgba(180,180,200,0.1)", background: "rgba(255,255,255,0.04)" }}>
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#7aa2f7", boxShadow: "0 0 6px #7aa2f7" }} />
              <span className="text-sm font-semibold text-zinc-200">{loadedModel.displayName}</span>
            </div>

            <div className="flex h-10 overflow-hidden rounded-lg" style={{ border: "1px solid rgba(180,180,200,0.1)", background: "rgba(255,255,255,0.04)" }}>
              {[
                ["orbit", "Orbit"],
                ["timing", "Timing residuals"],
                ["longBaseline", "Epoch residuals"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className="h-10 px-4 text-sm transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
                  style={{ background: activeTab === key ? "rgba(255,255,255,0.1)" : "transparent", color: activeTab === key ? "#e8e8f0" : "#71717a" }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <IconBtn onClick={() => setIsPlaying((prev) => !prev)} active={isPlaying} disabled={activeTab === "longBaseline"}>
              {isPlaying ? "Pause" : "Play"}
            </IconBtn>
          <IconBtn
            onClick={() => {
              setElapsed(currentModel.T0_days);
              setAbsoluteElapsed(currentModel.T0_days);
              setToas([]);
              lastToaRef.current = currentModel.T0_days;
              elapsedRef.current = currentModel.T0_days;
              absoluteElapsedRef.current = currentModel.T0_days;
              lastDisplayUpdateRef.current = 0;
            }}
          >
            Reset phase
            </IconBtn>
            <IconBtn onClick={() => setToas([])}>Clear TOAs</IconBtn>
            <IconBtn onClick={() => {
              setCurrentModel({ ...loadedModel.values });
              setEpochOffsets({ romer: 0, einstein: 0, shapiro: 0, secular: 0, dm: 0 });
              setEpochParamOffsets(zeroOffsetMap(EPOCH_OFFSET_PARAM_KEYS));
            }}>Reset model</IconBtn>
            <IconBtn onClick={() => fileInputRef.current?.click()}>Load .par</IconBtn>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {constraintToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              position: "absolute",
              top: sidePanelTopInset + 2,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 35,
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid rgba(180,180,200,0.12)",
              background: "rgba(14,14,18,0.9)",
              color: "#d4d4d8",
              fontSize: 11,
              letterSpacing: "0.04em",
              backdropFilter: "blur(12px)",
              boxShadow: "0 14px 36px rgba(0,0,0,0.35)",
            }}
          >
            {constraintToast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 z-10">
        <AnimatePresence mode="wait">
          {activeTab === "orbit" ? (
            <motion.div key="orbit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
              <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full">
                <defs>
                  <radialGradient id="glowW" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                    <stop offset="50%" stopColor="rgba(255,255,255,0.28)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </radialGradient>
                  <radialGradient id="glowC" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(255,220,180,0.9)" />
                    <stop offset="55%" stopColor="rgba(255,180,100,0.2)" />
                    <stop offset="100%" stopColor="rgba(255,140,60,0)" />
                  </radialGradient>
                  <linearGradient id="beamA" x1="0" x2="1">
                    <stop offset="0%" stopColor={`rgba(255,255,255,${beamOpacity * 0.52})`} />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </linearGradient>
                  <linearGradient id="beamB" x1="0" x2="1">
                    <stop offset="0%" stopColor={`rgba(255,255,255,${beamOpacity * 0.2})`} />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </linearGradient>
                  <linearGradient id="beamCompA" x1="0" x2="1">
                    <stop offset="0%" stopColor={`rgba(255,214,170,${beamOpacity * 0.44})`} />
                    <stop offset="100%" stopColor="rgba(255,214,170,0)" />
                  </linearGradient>
                  <linearGradient id="beamCompB" x1="0" x2="1">
                    <stop offset="0%" stopColor={`rgba(255,180,120,${beamOpacity * 0.18})`} />
                    <stop offset="100%" stopColor="rgba(255,180,120,0)" />
                  </linearGradient>
                </defs>

                <motion.g animate={{ x: orbitSceneOffset }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
                {showGW &&
                  (() => {
                    const lineSpacing = 30;
                    const sampleStep = 12;
                    const cols = Math.ceil(W / lineSpacing) + 6;
                    const rows = Math.ceil(H / lineSpacing) + 6;
                    const px = pXY.x;
                    const py = pXY.y;
                    const cx = cXY.x;
                    const cy = cXY.y;
                    const bx = CENTER.x;
                    const by = CENTER.y;
                    const psrAmp = 0.45;
                    const psrSigma = 70;
                    const cmpAmp = 0.55 * currentModel.M2;
                    const cmpSigma = 85;
                    const sepX = cx - px;
                    const sepY = cy - py;
                    const separation = Math.sqrt(sepX * sepX + sepY * sepY) || 1;
                    const binaryAngle = Math.atan2(sepY, sepX);
                    const separationBoost = clamp(separation / 260, 0.7, 1.35);
                    const radialK = 0.026;
                    const gwAngularRate = 2 * scene.orbitalAngRate * DAY;
                    const eccentricBurst = Math.pow(clamp(dynamics.aRel / Math.max(scene.r, 1), 0.72, 3.8), 1.18);
                    const anisotropy = clamp(0.12 + dynamics.e * 0.38 + (eccentricBurst - 1) * 0.14, 0.12, 0.9);
                    const phaseSkew = 0.22 + dynamics.e * 0.95;
                    const burstGain = clamp(0.88 + (eccentricBurst - 1) * 0.62, 0.88, 2.35);

                    const displace = (x, y) => {
                      let tdx = 0;
                      let tdy = 0;
                      const masses = [
                        [px, py, psrAmp, psrSigma],
                        [cx, cy, cmpAmp, cmpSigma],
                      ];
                      for (const [mx, my, amp, sigma] of masses) {
                        const dx = mx - x;
                        const dy = my - y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const f = amp * Math.exp(-dist / sigma);
                        tdx += dx * f;
                        tdy += dy * f;
                      }
                      const dx = x - bx;
                      const dy = y - by;
                      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                      const ux = dx / dist;
                      const uy = dy / dist;
                      const tx = -uy;
                      const ty = ux;
                      const angle = Math.atan2(dy, dx);
                      const aligned = Math.cos(angle - binaryAngle);
                      const across = Math.sin(angle - binaryAngle);
                      const rise = 1 - Math.exp(-(dist * dist) / (160 * 160));
                      const fade = Math.exp(-dist / 760);
                      const anisotropicMetric =
                        dist *
                        (1 - anisotropy * aligned * aligned + 0.42 * anisotropy * across * across);
                      const retard = anisotropicMetric * radialK;
                      const sourceAngle = binaryAngle - 0.5 * retard * (1 + 0.55 * dynamics.e * Math.cos(scene.f));
                      const crest =
                        Math.sin(
                          radialK * anisotropicMetric -
                            gwAngularRate * elapsed +
                            phaseSkew * dynamics.e * Math.sin(scene.f - 0.6 * retard)
                        );
                      const plusMode = Math.cos(2 * (angle - sourceAngle));
                      const crossMode = Math.sin(2 * (angle - sourceAngle));
                      const gwAmp = 7.9 * separationBoost * burstGain * rise * fade;
                      const radialWave = gwAmp * plusMode * crest;
                      const tangentialWave = gwAmp * (0.28 + 0.18 * dynamics.e) * crossMode * crest;
                      tdx += radialWave * ux + tangentialWave * tx;
                      tdy += radialWave * uy + tangentialWave * ty;
                      return { dx: tdx, dy: tdy };
                    };

                    const paths = [];
                    for (let j = -3; j <= rows; j++) {
                      const baseY = j * lineSpacing;
                      let d = "";
                      for (let baseX = -3 * lineSpacing; baseX <= (cols + 1) * lineSpacing; baseX += sampleStep) {
                        const dd = displace(baseX, baseY);
                        d += `${d === "" ? "M" : "L"}${(baseX + dd.dx).toFixed(1)},${(baseY + dd.dy).toFixed(1)}`;
                      }
                      paths.push(<path key={`h${j}`} d={d} fill="none" stroke="rgba(96,140,255,0.26)" strokeWidth="0.9" strokeLinejoin="round" strokeLinecap="round" />);
                    }
                    for (let i = -3; i <= cols; i++) {
                      const baseX = i * lineSpacing;
                      let d = "";
                      for (let baseY = -3 * lineSpacing; baseY <= (rows + 1) * lineSpacing; baseY += sampleStep) {
                        const dd = displace(baseX, baseY);
                        d += `${d === "" ? "M" : "L"}${(baseX + dd.dx).toFixed(1)},${(baseY + dd.dy).toFixed(1)}`;
                      }
                      paths.push(<path key={`v${i}`} d={d} fill="none" stroke="rgba(78,126,240,0.22)" strokeWidth="0.9" strokeLinejoin="round" strokeLinecap="round" />);
                    }
                    return <g>{paths}</g>;
                  })()}

                {showOrbits && (
                  <>
                    <path d={pathD(orbits.psr)} fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="1.2" strokeDasharray="4 10" />
                    <path d={pathD(orbits.cmp)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" strokeDasharray="4 10" />
                  </>
                )}

                <path d={pathD(trail.psr)} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                <path d={pathD(trail.cmp)} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                <circle cx={CENTER.x} cy={CENTER.y} r="3.5" fill="rgba(255,255,255,0.55)" />
                <line x1={pXY.x} y1={pXY.y} x2={cXY.x} y2={cXY.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

                {showBeam &&
                  (() => {
                    const cosA = Math.cos(beamAngle);
                    const sinA = Math.sin(beamAngle);
                    const maxLength = 200;
                    const halfAngle = (beamWidth * Math.PI) / 360;
                    return (
                      <g transform={`translate(${pXY.x} ${pXY.y})`}>
                        {[0, 1].map((pole) => {
                          const poleToward = pole === 0 ? cosA : -cosA;
                          const poleSin = pole === 0 ? sinA : -sinA;
                          const poleLen = maxLength * Math.abs(poleSin);
                          const direction = poleSin >= 0 ? 0 : 180;
                          const brightness = poleToward > 0 ? 0.6 + 0.4 * poleToward : 0.3 + 0.2 * (1 + poleToward);
                          const widthScale = 1 + 0.8 * Math.max(0, poleToward);
                          return (
                            <g key={pole}>
                              {Math.abs(poleSin) > 0.1 && (
                                <g transform={`rotate(${direction})`}>
                                  <path d={`M0 0 L${poleLen} ${-Math.tan(halfAngle) * poleLen * widthScale} Q${poleLen * 0.9} 0 ${poleLen} ${Math.tan(halfAngle) * poleLen * widthScale} Z`} fill="url(#beamA)" opacity={brightness * beamOpacity} />
                                  <path d={`M0 0 L${poleLen * 0.8} ${-Math.tan(halfAngle) * poleLen * 0.4 * widthScale} Q${poleLen * 0.7} 0 ${poleLen * 0.8} ${Math.tan(halfAngle) * poleLen * 0.4 * widthScale} Z`} fill="url(#beamB)" opacity={brightness * beamOpacity} />
                                </g>
                              )}
                            </g>
                          );
                        })}
                      </g>
                    );
                  })()}

                {showBeam &&
                  currentModel.companionIsPulsar &&
                  (() => {
                    const cosA = Math.cos(companionBeamAngle);
                    const sinA = Math.sin(companionBeamAngle);
                    const maxLength = 160;
                    const halfAngle = (beamWidth * Math.PI) / 360;
                    return (
                      <g transform={`translate(${cXY.x} ${cXY.y})`}>
                        {[0, 1].map((pole) => {
                          const poleToward = pole === 0 ? cosA : -cosA;
                          const poleSin = pole === 0 ? sinA : -sinA;
                          const poleLen = maxLength * Math.abs(poleSin);
                          const direction = poleSin >= 0 ? 0 : 180;
                          const brightness = poleToward > 0 ? 0.55 + 0.35 * poleToward : 0.24 + 0.18 * (1 + poleToward);
                          const widthScale = 0.88 + 0.6 * Math.max(0, poleToward);
                          return (
                            <g key={`comp-${pole}`}>
                              {Math.abs(poleSin) > 0.1 && (
                                <g transform={`rotate(${direction})`}>
                                  <path d={`M0 0 L${poleLen} ${-Math.tan(halfAngle) * poleLen * widthScale} Q${poleLen * 0.9} 0 ${poleLen} ${Math.tan(halfAngle) * poleLen * widthScale} Z`} fill="url(#beamCompA)" opacity={brightness * beamOpacity} />
                                  <path d={`M0 0 L${poleLen * 0.78} ${-Math.tan(halfAngle) * poleLen * 0.34 * widthScale} Q${poleLen * 0.68} 0 ${poleLen * 0.78} ${Math.tan(halfAngle) * poleLen * 0.34 * widthScale} Z`} fill="url(#beamCompB)" opacity={brightness * beamOpacity} />
                                </g>
                              )}
                            </g>
                          );
                        })}
                      </g>
                    );
                  })()}

                {showVelVec && (
                  <line
                    x1={pXY.x}
                    y1={pXY.y}
                    x2={pXY.x - dynamics.muP * 1.2e-4 * scale * Math.sin(scene.f + scene.omNow)}
                    y2={pXY.y + dynamics.muP * 1.2e-4 * scale * Math.cos(scene.f + scene.omNow) * Math.cos(dynamics.inc)}
                    stroke="rgba(96,165,250,0.7)"
                    strokeWidth="2"
                  />
                )}

                <circle cx={cXY.x} cy={cXY.y} r={16 + currentModel.M2 * 2.5} fill="rgba(245,240,232,0.92)" />
                <circle cx={cXY.x} cy={cXY.y} r={55} fill="url(#glowC)" opacity="0.22" />
                <circle cx={pXY.x} cy={pXY.y} r="9" fill="rgba(255,255,255,0.98)" />
                <circle cx={pXY.x} cy={pXY.y} r="32" fill="url(#glowW)" opacity="0.30" />

                {showLabels &&
                  [
                    { x: pXY.x + 18, y: pXY.y - 18, title: "Pulsar", sub: `${fmt(currentModel.pulsarMass, 2)} Msun` },
                    { x: cXY.x + 18, y: cXY.y - 18, title: currentModel.companionIsPulsar ? "Pulsar B" : "Companion", sub: `${fmt(currentModel.M2, 2)} Msun` },
                    { x: CENTER.x + 12, y: CENTER.y + 32, title: "Barycenter", sub: loadedModel.displayName, faint: true },
                  ].map(({ x, y, title, sub, faint }) => (
                    <g key={title} transform={`translate(${x} ${y})`} opacity={faint ? 0.5 : 1}>
                      <rect x="0" y="-20" rx="10" width="128" height="38" fill="rgba(24,24,27,0.84)" stroke="rgba(255,255,255,0.07)" />
                      <text x="10" y="-3" fill="rgba(244,244,245,0.95)" fontSize="12" fontWeight="600">
                        {title}
                      </text>
                      <text x="10" y="12" fill="rgba(161,161,170,0.9)" fontSize="11">
                        {sub}
                      </text>
                    </g>
                  ))}
                </motion.g>
              </svg>
            </motion.div>
          ) : activeTab === "timing" ? (
            <motion.div
              key="timing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ paddingLeft: timingLeftPad, paddingRight: 16, paddingTop: workspaceTopInset, paddingBottom: 38 }}
            >
              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", paddingBottom: 12, borderBottom: "1px solid rgba(180,180,200,0.08)" }}>
                  <div>
                    <span style={{ fontSize: 17, fontWeight: 700, color: "#f4f4f5" }}>Timing residuals</span>
                    <span style={{ fontSize: 11.5, color: "#71717a", marginLeft: 12 }}>
                      {loadedModel.displayName} · {fmt(currentModel.INC_deg, 1)} deg · {freqMHz} MHz
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ padding: "4px 8px", borderRadius: 999, border: "1px solid rgba(251,146,60,0.24)", color: "#fb923c", fontSize: 10 }}>
                      TOAs: observed model
                    </div>
                    <div style={{ padding: "4px 8px", borderRadius: 999, border: "1px solid rgba(147,197,253,0.24)", color: "#93c5fd", fontSize: 10 }}>
                      curves: fit model
                    </div>
                    {modelDeltaCount > 0 && (
                      <div style={{ padding: "4px 8px", borderRadius: 999, border: "1px solid rgba(180,180,200,0.12)", color: "#d4d4d8", fontSize: 10 }}>
                        {modelDeltaCount} parameter mismatch{modelDeltaCount > 1 ? "es" : ""}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ flexShrink: 0, height: 130, background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(180,180,200,0.09)", overflow: "hidden", padding: "4px 8px 0" }}>
                  <PulseTrain
                    toas={timingToas}
                    fittedDelays={fittedDelays}
                    pulsePeriodMs={pulsePeriodMs}
                    elapsedDays={absoluteElapsed}
                    toaIntervalDays={toaIntervalDays}
                    orbitalPeriodDays={currentModel.PB_days}
                  />
                </div>

                <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 20, border: "1px solid rgba(180,180,200,0.09)", overflow: "hidden", padding: "12px 10px 8px", minHeight: 0 }}>
                  <ResidualPlot theoryCurve={theoryCurve} toas={timingToas} activeDelays={activeDelays} fittedDelays={fittedDelays} highlightDelay={highlightDelay} noiseLevel={noiseLevel} currentPhase={scene.phase} />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="longBaseline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ paddingLeft: menuOpen && !isCompact ? panelWidth + 32 : 16, paddingRight: 16, paddingTop: workspaceTopInset, paddingBottom: 40 }}
            >
              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 14, paddingBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", paddingBottom: 12, borderBottom: "1px solid rgba(180,180,200,0.08)" }}>
                  <div>
                    <span style={{ fontSize: 17, fontWeight: 700, color: "#f4f4f5" }}>Epoch residuals</span>
                    <span style={{ fontSize: 11.5, color: "#71717a", marginLeft: 12 }}>
                      {loadedModel.displayName} · {LONG_BASELINE_WINDOWS[longBaselineWindow]?.label ?? longBaselineWindow}
                    </span>
                  </div>
                </div>
                <LongBaselinePlot
                  currentSamples={longBaselineCurrent}
                  referenceSamples={longBaselineReference}
                  primaryFreq={freqMHz}
                  secondFreqMHz={secondFreqMHz}
                  compareMode={frequencyCompareMode}
                  onCompareModeChange={setFrequencyCompareMode}
                  xMode={longXAxis}
                  onXModeChange={setLongXAxis}
                  yMode={longYAxis}
                  onYModeChange={setLongYAxis}
                  overlayMode={longOverlay}
                  onOverlayModeChange={setLongOverlay}
                  zoomPreset={zoomPreset}
                  onZoomPresetChange={setZoomPreset}
                  fittedDelays={fittedDelays}
                  noiseLevel={noiseLevel}
                  epochOffsetCount={epochOffsetCount}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.aside
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            style={{ position: "absolute", left: 16, top: sidePanelTopInset, width: panelWidth, height: `calc(100% - ${sidePanelTopInset + 24}px)`, zIndex: 20 }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                borderRadius: 16,
                border: "1px solid rgba(180,180,200,0.1)",
                background: "rgba(14,14,18,0.92)",
                backdropFilter: "blur(24px)",
                overflow: "hidden",
                boxShadow: "0 20px 48px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ flexShrink: 0, padding: "16px 20px 14px", borderBottom: "1px solid rgba(180,180,200,0.09)" }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#f4f4f5", marginBottom: 3 }}>Model</div>
                <div style={{ fontSize: 11, color: "#71717a" }}>{loadedModel.displayName}</div>
              </div>

              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(180,180,200,0.18) transparent",
                }}
              >
                <section>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: "#71717a", marginBottom: 12 }}>Session</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <ControlRow label="Preset" value={activePresetId || loadedModel.source}>
                      <select
                        value={activePresetId}
                        onChange={(e) => handlePresetChange(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none"
                      >
                        {MODEL_PRESETS.map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {preset.displayName}
                          </option>
                        ))}
                      </select>
                    </ControlRow>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <IconBtn onClick={() => fileInputRef.current?.click()}>Load .par</IconBtn>
                      <IconBtn onClick={() => {
                        setCurrentModel(loadedModel.values);
                        setEpochOffsets({ romer: 0, einstein: 0, shapiro: 0, secular: 0, dm: 0 });
                        setEpochParamOffsets(zeroOffsetMap(EPOCH_OFFSET_PARAM_KEYS));
                      }}>Reset to model</IconBtn>
                      <IconBtn onClick={handleDuplicateModel}>Duplicate model</IconBtn>
                    </div>
                    <div style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(180,180,200,0.09)", background: "rgba(255,255,255,0.03)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11 }}>
                        <span style={{ color: "#d4d4d8" }}>{loadedModel.displayName}</span>
                        <span style={{ color: "#71717a" }}>{loadedModel.source}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                        {[
                          ["orbit", loadedSupport.orbitReady, loadedSupport.orbitMissing],
                          ["timing", loadedSupport.timingReady, loadedSupport.timingMissing],
                          ["epoch", loadedSupport.epochReady, loadedSupport.epochMissing],
                        ].map(([label, ready, missing]) => (
                          <div key={label} style={{ padding: "4px 8px", borderRadius: 999, border: `1px solid ${ready ? "rgba(77,191,150,0.28)" : "rgba(251,146,60,0.28)"}`, color: ready ? "#4dbf96" : "#fb923c", fontSize: 10 }}>
                            {ready ? label : `${label}: ${missing.length}`}
                          </div>
                        ))}
                      </div>
                      {importNotice && <div style={{ marginTop: 8, fontSize: 10, color: "#71717a" }}>{importNotice}</div>}
                      {loadedModel.unknownKeys.length > 0 && <div style={{ marginTop: 6, fontSize: 10, color: "#71717a" }}>Unknown keys: {loadedModel.unknownKeys.slice(0, 6).join(", ")}</div>}
                    </div>
                  </div>
                </section>

                {activeTab !== "longBaseline" && (
                  <section>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: "#71717a", marginBottom: 12 }}>Parameters</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <div style={{ padding: "4px 8px", borderRadius: 999, border: "1px solid rgba(180,180,200,0.12)", color: "#d4d4d8", fontSize: 10, visibility: modelDeltaCount > 0 ? "visible" : "hidden" }}>
                          {Math.max(modelDeltaCount, 1)} changed
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <IconBtn onClick={() => {
                          setCurrentModel({ ...loadedModel.values });
                          setEpochOffsets({ romer: 0, einstein: 0, shapiro: 0, secular: 0, dm: 0 });
                          setEpochParamOffsets(zeroOffsetMap(EPOCH_OFFSET_PARAM_KEYS));
                        }}>Revert model</IconBtn>
                      </div>
                      <ParameterEditor
                        model={currentModel}
                        compareModel={loadedModel.values}
                        originalModel={loadedModel.values}
                        onChange={handleModelParamChange}
                        activeTab={activeTab}
                        support={currentSupport}
                      />
                    </div>
                  </section>
                )}

                <section>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: "#71717a", marginBottom: 12 }}>
                    {activeTab === "longBaseline" ? "Epoch workspace" : "Sampling"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {activeTab === "longBaseline" ? (
                      <ControlRow label="Time window" value={LONG_BASELINE_WINDOWS[longBaselineWindow].label}>
                        <PillGroup options={Object.entries(LONG_BASELINE_WINDOWS).map(([value, meta]) => ({ value, label: meta.label }))} value={longBaselineWindow} onChange={setLongBaselineWindow} />
                      </ControlRow>
                    ) : (
                      <>
                        <ControlRow label="Time scale" value={`${timeScale}x`}>
                          <Slider value={timeScale} min={10} max={3000} step={10} onChange={setTimeScale} />
                        </ControlRow>
                        <ControlRow label="Trail length" value={`${Math.round(trailLen * 100)}%`}>
                          <Slider value={trailLen} min={0.05} max={1} step={0.05} onChange={setTrailLen} />
                        </ControlRow>
                        <ControlRow label="Manual phase" value={`${fmt(orbitalPhaseAt(elapsed, currentModel) * 360, 1)} deg`}>
                          <Slider value={orbitalPhaseAt(elapsed, currentModel)} min={0} max={1} step={0.002} onChange={(v) => {
                            setIsPlaying(false);
                            const nextTime = currentModel.T0_days + v * currentModel.PB_days;
                            setElapsed(nextTime);
                            setAbsoluteElapsed(nextTime);
                            elapsedRef.current = nextTime;
                            absoluteElapsedRef.current = nextTime;
                            lastDisplayUpdateRef.current = 0;
                          }} />
                        </ControlRow>
                      </>
                    )}
                  </div>
                </section>

                <section>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: "#71717a", marginBottom: 12 }}>
                    {activeTab === "longBaseline" ? "Frequency / fit" : "Timing"}
                  </div>
                  {activeTab === "longBaseline" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <ControlRow label="Primary frequency" value={`${freqMHz} MHz`}>
                        <Slider value={freqMHz} min={300} max={3000} step={50} onChange={setFreqMHz} color="#9580d4" />
                      </ControlRow>
                      {frequencyCompareMode === "dual" && (
                        <ControlRow label="Second frequency" value={`${secondFreqMHz} MHz`}>
                          <Slider value={secondFreqMHz} min={300} max={3000} step={50} onChange={setSecondFreqMHz} color="#7aa2f7" />
                        </ControlRow>
                      )}
                      <ControlRow label="DM variation" value={`${fmt(dmVarAmp, 2)} pc cm^-3`}>
                        <Slider value={dmVarAmp} min={0} max={5} step={0.05} onChange={setDmVarAmp} color="#fb923c" />
                      </ControlRow>
                      <div style={{ padding: "12px", borderRadius: 12, border: "1px solid rgba(180,180,200,0.09)", background: "rgba(255,255,255,0.03)", display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: "#71717a" }}>Injected offsets</div>
                          <button
                            onClick={() => {
                              setEpochOffsets({ romer: 0, einstein: 0, shapiro: 0, secular: 0, dm: 0 });
                              setEpochParamOffsets(zeroOffsetMap(EPOCH_OFFSET_PARAM_KEYS));
                            }}
                            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-zinc-300 transition-all duration-150 hover:-translate-y-px hover:bg-white/10 hover:text-zinc-100 active:translate-y-0 active:scale-[0.98]"
                          >
                            Reset
                          </button>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minHeight: 28 }}>
                          <div
                            style={{
                              padding: "4px 8px",
                              borderRadius: 999,
                              border: "1px solid rgba(180,180,200,0.12)",
                              color: "#d4d4d8",
                              fontSize: 10,
                              visibility: epochParamOffsetCount > 0 ? "visible" : "hidden",
                            }}
                          >
                            {Math.max(epochParamOffsetCount, 1)} parameter offset{epochParamOffsetCount === 1 ? "" : "s"}
                          </div>
                          <div
                            style={{
                              padding: "4px 8px",
                              borderRadius: 999,
                              border: "1px solid rgba(180,180,200,0.12)",
                              color: "#d4d4d8",
                              fontSize: 10,
                              visibility: epochOffsetCount > 0 ? "visible" : "hidden",
                            }}
                          >
                            {Math.max(epochOffsetCount, 1)} term offset{epochOffsetCount === 1 ? "" : "s"}
                          </div>
                        </div>
                        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em", color: "#71717a" }}>Parameter offsets</div>
                        {EPOCH_OFFSET_PARAMS.map((param) => {
                          const offsetScale = getEpochOffsetScale(param, currentModel[param.key]);
                          return (
                          <div key={param.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, minHeight: 18 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 13, color: "#d4d4d8" }}>{param.label}</span>
                                <span style={{ fontSize: 10, color: "#71717a", fontFamily: "monospace" }}>
                                  {fmt(currentModel[param.key], offsetScale.decimals)} {param.unit}
                                </span>
                              </div>
                              <span style={{ fontSize: 11, color: "#f4f4f5", fontFamily: "monospace" }}>
                                {fmt(epochParamOffsets[param.key], offsetScale.decimals)} {param.unit}
                              </span>
                            </div>
                            <div style={{ marginTop: -2 }}>
                              <Slider
                                value={epochParamOffsets[param.key]}
                                min={offsetScale.min}
                                max={offsetScale.max}
                                step={offsetScale.step}
                                onChange={(next) => setEpochParamOffsets((prev) => ({ ...prev, [param.key]: next }))}
                                color={param.group === "binary" ? "#7aa2f7" : "#c084b8"}
                              />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", minHeight: 18 }}>
                              <button
                                onClick={() => setEpochParamOffsets((prev) => ({ ...prev, [param.key]: 0 }))}
                                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-zinc-300 transition-all duration-150 hover:-translate-y-px hover:bg-white/10 hover:text-zinc-100 active:translate-y-0 active:scale-[0.98]"
                                style={{ visibility: Math.abs(epochParamOffsets[param.key]) > 1e-12 ? "visible" : "hidden" }}
                              >
                                Revert
                              </button>
                            </div>
                          </div>
                        );
                        })}
                        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em", color: "#71717a" }}>Delay term offsets</div>
                        {["romer", "einstein", "shapiro", "secular", "dm"].map((key) => (
                          <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, minHeight: 18 }}>
                              <span style={{ fontSize: 13, color: "#d4d4d8" }}>{DELAY_COLORS[key].label}</span>
                              <span style={{ fontSize: 11, color: "#f4f4f5", fontFamily: "monospace" }}>{fmt(epochOffsets[key], 2)} %</span>
                            </div>
                            <div style={{ marginTop: -2 }}>
                              <Slider
                                value={epochOffsets[key]}
                                min={key === "romer" ? -8 : -40}
                                max={key === "romer" ? 8 : 40}
                                step={0.01}
                                onChange={(next) => setEpochOffsets((prev) => ({ ...prev, [key]: next }))}
                                color={DELAY_COLORS[key].stroke}
                              />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", minHeight: 18 }}>
                              <button
                                onClick={() => setEpochOffsets((prev) => ({ ...prev, [key]: 0 }))}
                                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-zinc-300 transition-all duration-150 hover:-translate-y-px hover:bg-white/10 hover:text-zinc-100 active:translate-y-0 active:scale-[0.98]"
                                style={{ visibility: Math.abs(epochOffsets[key]) > 1e-9 ? "visible" : "hidden" }}
                              >
                                Revert
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <ControlRow label="Fit terms" value="">
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {["romer", "einstein", "shapiro", "secular", "dm"].map((key) => (
                            <button
                              key={key}
                              onClick={() => setFittedDelays((prev) => ({ ...prev, [key]: !prev[key] }))}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 999,
                                border: `1px solid ${fittedDelays[key] ? `${DELAY_COLORS[key].stroke}66` : "rgba(180,180,200,0.1)"}`,
                                background: fittedDelays[key] ? `${DELAY_COLORS[key].stroke}1c` : "rgba(255,255,255,0.03)",
                                color: fittedDelays[key] ? DELAY_COLORS[key].stroke : "#71717a",
                                fontSize: 11,
                                cursor: "pointer",
                              }}
                            >
                              {DELAY_COLORS[key].label}
                            </button>
                          ))}
                        </div>
                      </ControlRow>
                    </div>
                  ) : (
                    <DelayPanel
                      activeDelays={activeDelays}
                      setActiveDelays={setActiveDelays}
                      fittedDelays={fittedDelays}
                      setFittedDelays={setFittedDelays}
                      highlightDelay={highlightDelay}
                      setHighlightDelay={setHighlightDelay}
                      currentDelays={currentDelays}
                      noiseLevel={noiseLevel}
                      setNoiseLevel={setNoiseLevel}
                      toaInterval={toaInterval}
                      setToaInterval={setToaInterval}
                      freqMHz={freqMHz}
                      setFreqMHz={setFreqMHz}
                      activeTab={activeTab}
                    />
                  )}
                </section>

                {activeTab !== "longBaseline" && (
                  <>
                    <section>
                      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: "#71717a", marginBottom: 12 }}>Beam</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <ControlRow label="Opening angle" value={`${fmt(beamWidth, 0)} deg`}>
                          <Slider value={beamWidth} min={3} max={45} step={1} onChange={setBeamWidth} />
                        </ControlRow>
                        <ControlRow label="Opacity" value={`${Math.round(beamOpacity * 100)}%`}>
                          <Slider value={beamOpacity} min={0.1} max={1} step={0.05} onChange={setBeamOpacity} />
                        </ControlRow>
                      </div>
                    </section>

                    <section>
                      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: "#71717a", marginBottom: 12 }}>Display</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {[
                          ["Rotating beam", showBeam, setShowBeam],
                          ["Orbit guides", showOrbits, setShowOrbits],
                          ["Body labels", showLabels, setShowLabels],
                          ["GW ripples", showGW, setShowGW],
                          ["Velocity vector", showVelVec, setShowVelVec],
                          ["Background grid", showGrid, setShowGrid],
                        ].map(([label, state, setter]) => (
                          <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(180,180,200,0.09)", padding: "8px 12px" }}>
                            <span style={{ fontSize: 13, color: "#d4d4d8" }}>{label}</span>
                            <SwitchToggle checked={state} onChange={setter} />
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
