import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../lib/cn";
import type { Theme } from "./themeToggle.tsx";
import type { Pulsar } from "../lib/pulsars";
import { DiscoveryPulsarPanel } from "./Pulsar3D";

/* ----------------------------- */
/* Canvas helpers                 */
/* ----------------------------- */

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fill();
}

function strokeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.stroke();
}

function drawCenterCroppedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const iw = img.width || 1;
  const ih = img.height || 1;
  const s = Math.max(w / iw, h / ih);
  const dw = iw * s;
  const dh = ih * s;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

/* ----------------------------- */

export function DiscoveryModal({
  theme,
  open,
  pulsar,
  rank,
  onClose,
}: {
  theme: Theme;
  open: boolean;
  pulsar: Pulsar | null;
  rank: number;
  onClose: () => void;
}) {
  if (!open || !pulsar) return null;

  const [imageExpanded, setImageExpanded] = useState(false);

  const trapum = (pulsar as any).trapum as
    | {
      dm?: number | null;
      associations?: Array<{ name?: string; type?: string }>;
      discovery?: {
        discovery_date?: string;
        observation_date?: string;
        backend?: string;
        discovery_band?: string;
        pipeline?: string;
        project?: string;
        discovery_snr?: number | null;
      };
    }
    | undefined;

  const primaryAssoc = trapum?.associations && trapum.associations[0];

  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(" ");
    let line = "";
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + " ";
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
    return y;
  };

  const finalizeDownload = (canvas: HTMLCanvasElement, pulsar: Pulsar) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // small footer marks (keep subtle)
    ctx.fillStyle = "rgba(248,250,252,0.85)";
    ctx.font = "700 22px system-ui,-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif";
    // ctx.fillText("SEARCH MODE", 80, 1840);

    const link = "FAZALKAREEM.COM";
    const metrics = ctx.measureText(link);
    ctx.fillText(link, canvas.width - 80 - metrics.width, 1840);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pulsar.id || pulsar.name}-story.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const storyText = useMemo(() => {
    if (!trapum) {
      return `Synthetic detection of ${pulsar.name} in Search Mode — a tiny practice run for spotting real peaks and committing to a candidate.`;
    }
    const bits: string[] = [];
    bits.push(`${pulsar.name} is a millisecond pulsar`);
    if (trapum.dm != null) bits.push(`with DM ≈ ${trapum.dm.toFixed(1)}`);
    if (primaryAssoc?.name) bits.push(`towards ${primaryAssoc.name}`);
    if (trapum.discovery?.project) bits.push(`from the TRAPUM ${trapum.discovery.project} project`);
    if (trapum.discovery?.discovery_snr != null) bits.push(`detected at S/N ≈ ${trapum.discovery.discovery_snr.toFixed(1)}`);
    return bits.join(", ") + ".";
  }, [trapum, pulsar.name, primaryAssoc?.name]);

  const buildLists = () => {
    const left: string[] = [];
    const right: string[] = [];

    if (trapum?.dm != null) left.push(`DM : ${trapum.dm.toFixed(1)} pc cm⁻³`);
    left.push(`PERIOD : ${pulsar.period_ms.toFixed(3)} ms`);
    left.push(`F₀ : ${pulsar.f0_hz.toFixed(1)} Hz`);
    if (trapum?.discovery?.discovery_snr != null) left.push(`S/N : ${trapum.discovery.discovery_snr.toFixed(1)}`);

    if (primaryAssoc?.name) {right.push(`${primaryAssoc.name.toUpperCase()}`);}
    if (trapum?.discovery?.project) right.push(`PROJECT : ${trapum.discovery.project.toUpperCase()}`);
    if (trapum?.discovery?.discovery_band) right.push(`BAND ${trapum.discovery.discovery_band.toUpperCase()}`);
    if (trapum?.discovery?.discovery_date) right.push(`DISCOVERED : ${trapum.discovery.discovery_date}`);

    return { left, right };
  };

  /* ----------------------------- */
  /* Spotify-wrapped style generator */
  /* ----------------------------- */

  const handleDownloadStoryCard = () => {
    if (typeof window === "undefined") return;

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Palette
    const WHITE = "#f8fafc";
    const MUTED = "rgba(248,250,252,0.72)";
    const SOFT = "rgba(248,250,252,0.86)";
    const NEON = "#c8ff4d";
    const NEON2 = "#7cf6ff";

    // Clean outer background (no rainbow frame)
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Layout margins (no visible inner shell; use full space)
    const cardX = 70;
    const cardY = 140;
    const cardW = canvas.width - cardX * 2;
    const cardH = Math.floor(canvas.height - cardY * 2.15);
    const R = 48;

    const innerX = cardX + 72;
    let y = cardY;

    // header line
    ctx.fillStyle = MUTED;
    ctx.font = "700 24px system-ui,-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif";
    ctx.fillText("SEARCH MODE", innerX, y);

    // Big name
    y += 110;
    ctx.fillStyle = WHITE;
    ctx.font = "900 112px system-ui,-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif";
    ctx.fillText(pulsar.name.toUpperCase(), innerX, y);

    // “Rank” banner pill
    y += 80;
    const pillText = `I WAS THE #${rank} PERSON TO DETECT THIS PULSAR ON THE WEBSITE!`;
    ctx.font = "900 24px system-ui,-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif";
    const pillW = Math.min(cardW - 144, ctx.measureText(pillText).width + 44);
    const pillH = 54;

    ctx.fillStyle = "rgba(0,0,0,0.30)";
    fillRoundRect(ctx, innerX, y, pillW, pillH, 999);

    ctx.fillStyle = WHITE;
    ctx.fillText(pillText, innerX + 22, y + 36);

    // Album “art” square (center)
    const artSize = 620;
    const artX = cardX + Math.floor((cardW - artSize) / 2);
    const artY = y + 100;

    // Art shadow frame
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    fillRoundRect(ctx, artX - 18, artY - 18, artSize + 36, artSize + 36, 42);

    const drawFallbackArt = () => {
      const ag = ctx.createLinearGradient(artX, artY, artX + artSize, artY + artSize);
      ag.addColorStop(0, "#ff3b8a");
      ag.addColorStop(1, "#6d28ff");
      ctx.fillStyle = ag;
      fillRoundRect(ctx, artX, artY, artSize, artSize, 36);

      // halftone dots
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#001026";
      for (let yy = artY + 80; yy < artY + artSize - 70; yy += 22) {
        for (let xx = artX + 70; xx < artX + artSize - 70; xx += 22) {
          ctx.beginPath();
          ctx.arc(xx, yy, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // Pulsar glyph
      const cx = artX + artSize / 2;
      const cy = artY + artSize / 2 - 18;
      ctx.save();
      ctx.strokeStyle = "#0a0aff";
      ctx.fillStyle = "#0a0aff";
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(cx, cy, 130, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 28;
      ctx.beginPath();
      ctx.moveTo(cx - 260, cy);
      ctx.lineTo(cx + 260, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 58, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = "rgba(248,250,252,0.70)";
      ctx.lineWidth = 5;
      strokeRoundRect(ctx, artX, artY, artSize, artSize, 36);
    };

    const { left: leftList, right: rightList } = buildLists();

    const drawListsAndFooter = (baselineY: number) => {
      const listsTop = baselineY + 70;
      const colGap = 70;
      const colW = (cardW - 100 - colGap) / 2;
      const leftX = innerX;
      const rightX = innerX + colW + colGap;

      // “Top artists / top songs” style headings
      ctx.fillStyle = MUTED;
      ctx.font = "900 36px system-ui,-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif";
      ctx.fillText("TOP SIGNALS", leftX, listsTop);
      ctx.fillText("TOP CONTEXT", rightX, listsTop);

      ctx.fillStyle = WHITE;
      ctx.font = "800 32px system-ui,-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif";

      let ly = listsTop + 50;
      leftList.slice(0, 5).forEach((item, idx) => {
        wrapText(ctx, `${idx + 1}  ${item.toUpperCase()}`, leftX, ly, colW, 30);
        ly += 50;
      });

      let ry = listsTop + 50;
      rightList.slice(0, 5).forEach((item, idx) => {
        wrapText(ctx, `${idx + 1}  ${item}`, rightX, ry, colW, 30);
        ry += 50;
      });

      // Big stats row (minutes listened / top genre vibe)
      const statsY = cardY + cardH - 250;

      ctx.fillStyle = MUTED;
      ctx.font = "900 18px system-ui,-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif";
      ctx.fillText("YOUR RANK", leftX, statsY);

      ctx.fillStyle = NEON2;
      ctx.font = "900 84px system-ui,-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif";
      ctx.fillText(`#${rank}`, leftX, statsY + 92);

      ctx.fillStyle = MUTED;
      ctx.font = "900 18px system-ui,-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif";
      ctx.fillText("TOP STAT", rightX, statsY);

      const snr = trapum?.discovery?.discovery_snr;
      const dm = trapum?.dm;

      ctx.fillStyle = NEON;
      ctx.font = "900 72px system-ui,-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif";
      ctx.fillText(snr != null ? `${snr.toFixed(1)} S/N` : `— S/N`, rightX, statsY + 84);

      // ctx.fillStyle = SOFT;
      // ctx.font = "900 28px system-ui,-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif";
      // ctx.fillText(dm != null ? `DM  ${dm.toFixed(1)} pc cm⁻³` : `DM  —`, rightX, statsY + 132);

      // // Caption line (short, like wrapped caption)
      // ctx.fillStyle = "rgba(248,250,252,0.86)";
      // ctx.font = "700 26px system-ui,-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif";
      // wrapText(ctx, storyText, innerX, cardY + cardH - 84, cardW - 144, 34);

      finalizeDownload(canvas, pulsar);
    };

    const imgUrl = pulsar.fold_png_url || "";
    if (imgUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.save();
        roundRectPath(ctx, artX, artY, artSize, artSize, 36);
        ctx.clip();
        ctx.fillStyle = "rgba(0,0,0,0.22)";
        ctx.fillRect(artX, artY, artSize, artSize);
        drawCenterCroppedImage(ctx, img, artX, artY, artSize, artSize);
        ctx.restore();

        ctx.strokeStyle = "rgba(248,250,252,0.70)";
        ctx.lineWidth = 5;
        strokeRoundRect(ctx, artX, artY, artSize, artSize, 36);

        drawListsAndFooter(artY + artSize);
      };
      img.onerror = () => {
        drawFallbackArt();
        drawListsAndFooter(artY + artSize);
      };
      img.src = imgUrl;
    } else {
      drawFallbackArt();
      drawListsAndFooter(artY + artSize);
    }
  };

  /* ----------------------------- */
  /* modal key handling            */
  /* ----------------------------- */

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/80" onClick={onClose} />
        <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
          <div className="mx-auto max-w-[1200px] px-2 sm:px-8 py-10">
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 10, opacity: 0, scale: 0.99 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className={cn(
                "rounded-[28px] border overflow-hidden bg-black border-white/14 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_40px_120px_rgba(0,0,0,0.8)]"
              )}
            >
              <div className="relative p-6 sm:p-8 border-b border-white/10">
                <button
                  onClick={onClose}
                  className="absolute right-6 top-6 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase text-white/80 hover:bg-white/10"
                  data-nolock
                >
                  Esc to close
                </button>

                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
                  <div>
                    <div className="text-[11px] font-semibold tracking-[0.28em] uppercase text-white/60">Detection Confirmed</div>
                    <div className="mt-3 text-3xl sm:text-5xl font-black tracking-[-0.04em] text-white">{pulsar.name}</div>
                    <div className="mt-2 text-sm text-white/70">
                      Planted f₀: <span className="text-white font-semibold">{pulsar.f0_hz.toFixed(1)} Hz</span> • Period:{" "}
                      {pulsar.period_ms.toFixed(3)} ms
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="rounded-full border border-white/14 bg-white/5 px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-white/85">
                      You are #{rank}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  <DiscoveryPulsarPanel theme="dark" pulsar={pulsar} />

                  <div className="mt-5 rounded-2xl border border-white/12 bg-white/5 p-5">
                    <div className="text-[11px] font-semibold tracking-[0.28em] uppercase text-white/60">TRAPUM metadata</div>
                    <div className="mt-2 text-sm text-white/80 space-y-1.5">
                      {trapum?.dm != null && (
                        <div>
                          <span className="text-white/50">DM</span>{" "}
                          <span className="font-semibold text-white">{trapum.dm.toFixed(1)} pc cm⁻³</span>
                        </div>
                      )}

                      <div>
                        <span className="text-white/50">Period</span>{" "}
                        <span className="font-semibold text-white">{pulsar.period_ms.toFixed(3)} ms</span>
                      </div>

                      {trapum?.discovery?.project && (
                        <div>
                          <span className="text-white/50">Project</span>{" "}
                          <span className="font-semibold text-white">{trapum.discovery.project}</span>
                        </div>
                      )}

                      {trapum?.discovery?.backend && (
                        <div>
                          <span className="text-white/50">Backend</span>{" "}
                          <span className="font-semibold text-white">{trapum.discovery.backend}</span>
                        </div>
                      )}

                      {trapum?.discovery?.discovery_band && (
                        <div>
                          <span className="text-white/50">Band</span>{" "}
                          <span className="font-semibold text-white">{trapum.discovery.discovery_band}</span>
                        </div>
                      )}

                      {trapum?.discovery?.discovery_snr != null && (
                        <div>
                          <span className="text-white/50">S/N</span>{" "}
                          <span className="font-semibold text-white">{trapum.discovery.discovery_snr.toFixed(1)}</span>
                        </div>
                      )}

                      {primaryAssoc?.name && (
                        <div>
                          <span className="text-white/50">Association</span>{" "}
                          <span className="font-semibold text-white">
                            {primaryAssoc.name}
                            {primaryAssoc.type ? ` (${primaryAssoc.type})` : ""}
                          </span>
                        </div>
                      )}

                      {trapum?.discovery?.discovery_date && (
                        <div className="pt-1 text-xs text-white/60">
                          Discovered {trapum.discovery.discovery_date}
                          {trapum.discovery.observation_date ? ` • observed ${trapum.discovery.observation_date}` : ""}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="rounded-2xl border border-white/12 bg-black/50 overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/10">
                      <div className="text-[11px] font-semibold tracking-[0.28em] uppercase text-white/60">
                        Original detection (fold)
                      </div>
                    </div>

                    <div className="p-5">
                      {pulsar.fold_png_url ? (
                        <button
                          type="button"
                          onClick={() => setImageExpanded(true)}
                          className="group relative w-full rounded-xl border border-white/10 overflow-hidden"
                          data-nolock
                        >
                          <img
                            src={pulsar.fold_png_url}
                            alt="Fold"
                            className="w-full transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                          <div className="pointer-events-none absolute inset-0 flex items-end justify-end p-2">
                            <span className="rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase text-white/80">
                              Tap to expand
                            </span>
                          </div>
                        </button>
                      ) : (
                        <div className="h-[260px] w-full rounded-xl border border-white/10 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_55%)] flex items-center justify-center">
                          <div className="text-xs text-white/70">(Placeholder) Fold PNG goes here</div>
                        </div>
                      )}

                      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="text-[11px] font-semibold tracking-[0.28em] uppercase text-white/60">
                          Story card
                        </div>
                        <div className="mt-2 text-sm text-white/80">{storyText}</div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            className="rounded-full border border-white/14 bg-white/5 px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-white/85 hover:bg-white/10"
                            data-nolock
                            onClick={handleDownloadStoryCard}
                          >
                            Download card
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 sm:px-8 py-6 border-t border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-white/60">
                    Tip: keep exploring in Search Mode — different pages hide different targets.
                  </div>
                  <div className="text-xs text-white/60">Synthetic plots • TRAPUM metadata</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {imageExpanded && pulsar.fold_png_url ? (
            <motion.div
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setImageExpanded(false)}
            >
              <motion.img
                src={pulsar.fold_png_url}
                alt="Fold expanded"
                className="max-h-full max-w-full rounded-2xl border border-white/20"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
