import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import html2canvas from "html2canvas";
import { cn } from "../lib/cn";
import type { Theme } from "./themeToggle.tsx";
import type { Pulsar } from "../lib/pulsars";
import { DiscoveryPulsarPanel } from "./Pulsar3D";

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
  const downloadCardRef = useRef<HTMLDivElement | null>(null);

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

  /* ----------------------------- */
  /* Canvas helpers + download     */
  /* ----------------------------- */

  const handleDownloadDiscoveryCard = async () => {
    if (typeof window === "undefined") return;
    if (!downloadCardRef.current) return;

    try {
      const canvas = await html2canvas(downloadCardRef.current, {
        backgroundColor: "#050509",
        scale: window.devicePixelRatio > 1 ? 2 : 1,
        useCORS: true,
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${pulsar.id || pulsar.name}-discovery.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to download discovery card", err);
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
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          onClick={onClose}
        />
        <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
          <div className="mx-auto max-w-[1200px] px-2 sm:px-8 py-10">
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 10, opacity: 0, scale: 0.99 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className={cn(
                "rounded-[28px] border overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_40px_120px_rgba(0,0,0,0.8)]"
              )}
              style={{
                backgroundColor: "#050509",
                borderColor: "rgba(255,255,255,0.14)",
                color: "#f9fafb",
              }}
            >
              <div
                className="relative p-6 sm:p-8 border-b"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              >
                <button
                  onClick={onClose}
                  className="absolute right-6 top-6 rounded-full px-3 py-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase"
                  style={{
                    border: "1px solid rgba(255,255,255,0.2)",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    color: "rgba(249,250,251,0.8)",
                  }}
                  data-nolock
                >
                  Esc to close
                </button>

                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
                  <div>
                    <div
                      className="text-[11px] font-semibold tracking-[0.28em] uppercase"
                      style={{ color: "rgba(249,250,251,0.6)" }}
                    >
                      Detection Confirmed
                    </div>
                    <div className="mt-3 text-3xl sm:text-5xl font-black tracking-[-0.04em]">{pulsar.name}</div>
                    <div className="mt-2 text-sm" style={{ color: "rgba(249,250,251,0.7)" }}>
                      Planted f₀:{" "}
                      <span className="font-semibold">{pulsar.f0_hz.toFixed(1)} Hz</span> • Period:{" "}
                      {pulsar.period_ms.toFixed(3)} ms
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-full px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase"
                      style={{
                        border: "1px solid rgba(255,255,255,0.14)",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        color: "rgba(249,250,251,0.85)",
                      }}
                    >
                      You are #{rank}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  <DiscoveryPulsarPanel theme="dark" pulsar={pulsar} />

                  <div
                    className="mt-5 rounded-2xl border p-5"
                    style={{
                      borderColor: "rgba(255,255,255,0.12)",
                      backgroundColor: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <div
                      className="text-[11px] font-semibold tracking-[0.28em] uppercase"
                      style={{ color: "rgba(249,250,251,0.7)" }}
                    >
                      TRAPUM metadata
                    </div>
                    <div className="mt-2 text-sm space-y-1.5" style={{ color: "rgba(249,250,251,0.85)" }}>
                      {trapum?.dm != null && (
                        <div>
                          <span style={{ color: "rgba(249,250,251,0.55)" }}>DM</span>{" "}
                          <span className="font-semibold">{trapum.dm.toFixed(1)} pc cm⁻³</span>
                        </div>
                      )}

                      <div>
                        <span style={{ color: "rgba(249,250,251,0.55)" }}>Period</span>{" "}
                        <span className="font-semibold">{pulsar.period_ms.toFixed(3)} ms</span>
                      </div>

                      {trapum?.discovery?.project && (
                        <div>
                          <span style={{ color: "rgba(249,250,251,0.55)" }}>Project</span>{" "}
                          <span className="font-semibold">{trapum.discovery.project}</span>
                        </div>
                      )}

                      {trapum?.discovery?.backend && (
                        <div>
                          <span style={{ color: "rgba(249,250,251,0.55)" }}>Backend</span>{" "}
                          <span className="font-semibold">{trapum.discovery.backend}</span>
                        </div>
                      )}

                      {trapum?.discovery?.discovery_band && (
                        <div>
                          <span style={{ color: "rgba(249,250,251,0.55)" }}>Band</span>{" "}
                          <span className="font-semibold">{trapum.discovery.discovery_band}</span>
                        </div>
                      )}

                      {trapum?.discovery?.discovery_snr != null && (
                        <div>
                          <span style={{ color: "rgba(249,250,251,0.55)" }}>S/N</span>{" "}
                          <span className="font-semibold">{trapum.discovery.discovery_snr.toFixed(1)}</span>
                        </div>
                      )}

                      {primaryAssoc?.name && (
                        <div>
                          <span style={{ color: "rgba(249,250,251,0.55)" }}>Association</span>{" "}
                          <span className="font-semibold">
                            {primaryAssoc.name}
                            {primaryAssoc.type ? ` (${primaryAssoc.type})` : ""}
                          </span>
                        </div>
                      )}

                      {trapum?.discovery?.discovery_date && (
                        <div className="pt-1 text-xs" style={{ color: "rgba(249,250,251,0.6)" }}>
                          Discovered {trapum.discovery.discovery_date}
                          {trapum.discovery.observation_date ? ` • observed ${trapum.discovery.observation_date}` : ""}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div
                    className="rounded-2xl border overflow-hidden"
                    style={{
                      borderColor: "rgba(255,255,255,0.12)",
                      backgroundColor: "rgba(0,0,0,0.6)",
                    }}
                  >
                    <div
                      className="px-5 py-4 border-b flex items-center justify-between gap-3"
                      style={{ borderColor: "rgba(255,255,255,0.1)" }}
                    >
                      <div
                        className="text-[11px] font-semibold tracking-[0.28em] uppercase"
                        style={{ color: "rgba(249,250,251,0.7)" }}
                      >
                        Original detection (fold)
                      </div>
                    </div>

                    <div className="p-5">
                      {pulsar.fold_png_url ? (
                        <button
                          type="button"
                          onClick={() => setImageExpanded(true)}
                          className="group relative w-full rounded-xl border overflow-hidden"
                          style={{ borderColor: "rgba(255,255,255,0.1)" }}
                          data-nolock
                        >
                          <img
                            src={pulsar.fold_png_url}
                            alt="Fold"
                            className="w-full transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                          <div className="pointer-events-none absolute inset-0 flex items-end justify-end p-2">
                            <span
                              className="rounded-full px-2 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase"
                              style={{
                                backgroundColor: "rgba(0,0,0,0.6)",
                                color: "rgba(249,250,251,0.8)",
                              }}
                            >
                              Tap to expand
                            </span>
                          </div>
                        </button>
                      ) : (
                        <div
                          className="h-[260px] w-full rounded-xl border flex items-center justify-center"
                          style={{
                            borderColor: "rgba(255,255,255,0.1)",
                            background:
                              "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.08), transparent 55%)",
                          }}
                        >
                          <div className="text-xs" style={{ color: "rgba(249,250,251,0.7)" }}>
                            (Placeholder) Fold PNG goes here
                          </div>
                        </div>
                      )}
                      <div
                        className="px-5 py-4 border-b flex items-center justify-between gap-3"
                        style={{ borderColor: "rgba(255,255,255,0.1)" }}
                      >
                        <button
                          className="rounded-full px-7 py-5 text-[15px] font-semibold tracking-[0.18em] uppercase transition-colors duration-150 hover:bg-white/10"
                          data-nolock
                          onClick={handleDownloadDiscoveryCard}
                          style={{
                            border: "1px solid rgba(255, 255, 255, 0.56)",
                            color: "rgba(249,250,251,0.85)",
                          }}
                        >
                          Download discovery card
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="px-6 sm:px-8 py-6 border-t"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs" style={{ color: "rgba(249,250,251,0.6)" }}>
                    Tip: keep exploring in Search Mode — different pages hide different targets.
                  </div>
                  <div className="text-xs" style={{ color: "rgba(249,250,251,0.6)" }}>
                    FAZALKAREEM.COM
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {imageExpanded && pulsar.fold_png_url ? (
            <motion.div
              className="fixed inset-0 z-[80] flex items-center justify-center p-4"
              style={{ backgroundColor: "rgba(0,0,0,0.9)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setImageExpanded(false)}
            >
              <motion.img
                src={pulsar.fold_png_url}
                alt="Fold expanded"
                className="max-h-full max-w-full rounded-2xl border"
                style={{ borderColor: "rgba(255,255,255,0.2)" }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Off-screen export-only card: simplified but matching layout */}
        <div
          ref={downloadCardRef}
          style={{
            position: "fixed",
            left: "-9999px",
            top: 0,
            width: "1200px",
            padding: "32px 40px 32px 40px",
            borderRadius: "28px",
            backgroundColor: "#050509",
            color: "#f9fafb",
            fontFamily:
              "-apple-system,BlinkMacSystemFont,system-ui,'SF Pro Text',sans-serif",
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "28px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  color: "rgba(249,250,251,0.6)",
                }}
              >
                Detection confirmed
              </div>
              <div
                style={{
                  marginTop: "10px",
                  fontSize: "40px",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                }}
              >
                {pulsar.name}
              </div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "14px",
                  color: "rgba(249,250,251,0.7)",
                }}
              >
                Planted f₀:{" "}
                <span style={{ fontWeight: 600 }}>
                  {pulsar.f0_hz.toFixed(1)} Hz
                </span>{" "}
                • Period: {pulsar.period_ms.toFixed(3)} ms
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <div
                style={{
                  borderRadius: "999px",
                  padding: "6px 14px",
                  fontSize: "10px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  border: "1px solid rgba(255,255,255,0.2)",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "rgba(249,250,251,0.9)",
                }}
              >
                You are #{rank} person to detect this pulsar!
              </div>
            </div>
          </div>

          {/* Main grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1.4fr)",
              gap: "24px",
            }}
          >
            {/* Left side: pulsar panel + metadata */}
            <div>
              <div
                style={{
                  borderRadius: "18px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background:
                    "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.12), transparent 55%)",
                  height: "260px",
                  marginBottom: "22px",
                  padding: "16px",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "flex-start",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    color: "rgba(249,250,251,0.6)",
                  }}
                >
                  Pulsar (parameterized)
                </div>

                    {/* Static pulsar glyph for export card */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "170px",
                      height: "170px",
                    }}
                  >
                    {/* Beam towards top-right */}
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: "18px",
                        height: "150px",
                        transform: "translate(-50%,-100%) rotate(-40deg)",
                        transformOrigin: "50% 100%",
                        borderRadius: "999px",
                        background:
                          "linear-gradient(to top, rgba(255,255,255,0), rgba(255,255,255,0.82))",
                        filter: "blur(1px)",
                        opacity: 0.95,
                      }}
                    />
                    {/* Inner core on top-right beam */}
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: "6px",
                        height: "110px",
                        transform: "translate(-50%,-100%) rotate(-40deg)",
                        transformOrigin: "50% 100%",
                        borderRadius: "999px",
                        background:
                          "linear-gradient(to top, rgba(255,255,255,0), rgba(255,255,255,0.95))",
                        opacity: 0.95,
                      }}
                    />
                    {/* Beam towards bottom-left */}
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: "18px",
                        height: "150px",
                        transform: "translate(-50%,-100%) rotate(140deg)",
                        transformOrigin: "50% 100%",
                        borderRadius: "999px",
                        background:
                          "linear-gradient(to top, rgba(255,255,255,0), rgba(255,255,255,0.78))",
                        filter: "blur(1px)",
                        opacity: 0.9,
                      }}
                    />
                    {/* Inner core on bottom-left beam */}
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: "6px",
                        height: "110px",
                        transform: "translate(-50%,-100%) rotate(140deg)",
                        transformOrigin: "50% 100%",
                        borderRadius: "999px",
                        background:
                          "linear-gradient(to top, rgba(255,255,255,0), rgba(255,255,255,0.96))",
                        opacity: 0.98,
                      }}
                    />

                    {/* Star sphere */}
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: "46px",
                        height: "46px",
                        transform: "translate(-50%,-50%)",
                        borderRadius: "999px",
                        background:
                          "radial-gradient(circle at 35% 35%, rgba(255,255,255,1), rgba(235,235,235,1) 50%, rgba(190,190,190,1) 78%, rgba(255,255,255,0.95) 100%)",
                        boxShadow:
                          "0 18px 40px rgba(0,0,0,0.70), 0 0 22px rgba(255,255,255,0.18)",
                      }}
                    />

                    {/* Halo */}
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: "90px",
                        height: "90px",
                        transform: "translate(-50%,-50%)",
                        borderRadius: "999px",
                        background:
                          "radial-gradient(circle, rgba(255,255,255,0.14), rgba(255,255,255,0) 70%)",
                        filter: "blur(0.8px)",
                        opacity: 0.9,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderRadius: "18px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  padding: "18px 20px",
                  fontSize: "14px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    color: "rgba(249,250,251,0.7)",
                    marginBottom: "10px",
                  }}
                >
                  metadata
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    color: "rgba(249,250,251,0.9)",
                  }}
                >
                  {trapum?.dm != null && (
                    <div>
                      <span style={{ color: "rgba(249,250,251,0.55)" }}>
                        DM
                      </span>{" "}
                      <span style={{ fontWeight: 600 }}>
                        {trapum.dm.toFixed(1)} pc cm⁻³
                      </span>
                    </div>
                  )}
                  <div>
                    <span style={{ color: "rgba(249,250,251,0.55)" }}>
                      Period
                    </span>{" "}
                    <span style={{ fontWeight: 600 }}>
                      {pulsar.period_ms.toFixed(3)} ms
                    </span>
                  </div>
                  {trapum?.discovery?.project && (
                    <div>
                      <span style={{ color: "rgba(249,250,251,0.55)" }}>
                        Project
                      </span>{" "}
                      <span style={{ fontWeight: 600 }}>
                        {trapum.discovery.project}
                      </span>
                    </div>
                  )}
                  {trapum?.discovery?.backend && (
                    <div>
                      <span style={{ color: "rgba(249,250,251,0.55)" }}>
                        Backend
                      </span>{" "}
                      <span style={{ fontWeight: 600 }}>
                        {trapum.discovery.backend}
                      </span>
                    </div>
                  )}
                  {trapum?.discovery?.discovery_band && (
                    <div>
                      <span style={{ color: "rgba(249,250,251,0.55)" }}>
                        Band
                      </span>{" "}
                      <span style={{ fontWeight: 600 }}>
                        {trapum.discovery.discovery_band}
                      </span>
                    </div>
                  )}
                  {trapum?.discovery?.discovery_snr != null && (
                    <div>
                      <span style={{ color: "rgba(249,250,251,0.55)" }}>
                        S/N
                      </span>{" "}
                      <span style={{ fontWeight: 600 }}>
                        {trapum.discovery.discovery_snr.toFixed(1)}
                      </span>
                    </div>
                  )}
                  {primaryAssoc?.name && (
                    <div>
                      <span style={{ color: "rgba(249,250,251,0.55)" }}>
                        Association
                      </span>{" "}
                      <span style={{ fontWeight: 600 }}>
                        {primaryAssoc.name}
                        {primaryAssoc.type
                          ? ` (${primaryAssoc.type})`
                          : ""}
                      </span>
                    </div>
                  )}
                  {trapum?.discovery?.discovery_date && (
                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "12px",
                        color: "rgba(249,250,251,0.65)",
                      }}
                    >
                      Discovered {trapum.discovery.discovery_date}
                      {trapum.discovery.observation_date
                        ? ` • observed ${trapum.discovery.observation_date}`
                        : ""}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side: fold card */}
            <div>
              <div
                style={{
                  borderRadius: "18px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backgroundColor: "rgba(0,0,0,0.6)",
                  overflow: "hidden",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 20px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      color: "rgba(249,250,251,0.7)",
                    }}
                  >
                    Original detection (fold)
                  </div>

                </div>
                <div style={{ padding: "16px" }}>
                  {pulsar.fold_png_url ? (
                    <div
                      style={{
                        position: "relative",
                        borderRadius: "16px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={pulsar.fold_png_url}
                        alt="Fold"
                        style={{ width: "100%", display: "block" }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "flex-end",
                          justifyContent: "flex-end",
                          padding: "8px",
                          pointerEvents: "none",
                        }}
                      >
                        <span
                          style={{
                            borderRadius: "999px",
                            padding: "4px 8px",
                            fontSize: "10px",
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            fontWeight: 600,
                            backgroundColor: "rgba(0,0,0,0.6)",
                            color: "rgba(249,250,251,0.8)",
                          }}
                        >
                          Tap to expand
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        height: "260px",
                        borderRadius: "16px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        color: "rgba(249,250,251,0.7)",
                      }}
                    >
                      (Placeholder) Fold PNG goes here
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer row */}
          <div
            style={{
              marginTop: "20px",
              paddingTop: "12px",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "12px",
              color: "rgba(249,250,251,0.65)",
            }}
          >
            <div>
              Tip: keep exploring in Search Mode — different pages hide
              different targets.
            </div>
            <div>FAZALKAREEM.COM</div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
