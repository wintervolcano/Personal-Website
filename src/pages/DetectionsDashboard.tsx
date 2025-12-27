import React, { useEffect, useMemo, useState } from "react";
import { SectionShell } from "./SectionShell";
import type { Theme } from "../components/themeToggle";

type PulsarSummary = {
  id: string;
  name: string;
  count: number;
};

type DetectionEvent = {
  id: string;
  count: number;
  country: string;
  userAgent?: string;
  ts: string;
   name: string;
   page?: string | null;
};

type SummaryResponse = {
  totalDetections: number;
  pulsars: PulsarSummary[];
  events?: DetectionEvent[];
};

export function DetectionsDashboard({ theme }: { theme: Theme }) {
  const [token, setToken] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<"count" | "id" | "name" | "ts">("count");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem("fk-pulsar-dashboard-token");
      if (stored) {
        setToken(stored);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const isDark = theme === "dark";

  const rows: DetectionEvent[] = useMemo(() => {
    if (!data || !data.events) return [];
    const q = filter.trim().toLowerCase();
    let r = data.events.slice();
    if (q) {
      r = r.filter((p) => {
        const fields = [
          p.id,
          p.name,
          p.country || "",
          p.page || "",
          p.ts || "",
        ];
        return fields.some((f) => f.toLowerCase().includes(q));
      });
    }

    r.sort((a, b) => {
      if (sortKey === "count") {
        return (b.count ?? 0) - (a.count ?? 0);
      }
      if (sortKey === "id") {
        return a.id.localeCompare(b.id);
      }
      if (sortKey === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortKey === "ts") {
        const ta = a.ts ? Date.parse(a.ts) : 0;
        const tb = b.ts ? Date.parse(b.ts) : 0;
        return tb - ta;
      }
      return 0;
    });

    if (sortDir === "asc") r = [...r].reverse();
    return r;
  }, [data, filter, sortKey, sortDir]);

  function toggleSort(key: "count" | "id" | "name" | "ts") {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDir((prevDir) => (prevDir === "desc" ? "asc" : "desc"));
        return prevKey;
      }
      setSortDir(key === "count" ? "desc" : "asc");
      return key;
    });
  }

  async function fetchSummary(ev?: React.FormEvent) {
    if (ev) ev.preventDefault();
    if (!token) {
      setError("Enter admin token");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (typeof window !== "undefined" && remember) {
        try {
          window.localStorage.setItem("fk-pulsar-dashboard-token", token);
        } catch {
          // ignore persistence errors
        }
      }

      const resp = await fetch(`/api/detections-summary?token=${encodeURIComponent(token)}`);
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        const message = body && body.error ? body.error : resp.statusText;
        throw new Error(message || "Request failed");
      }
      const json = (await resp.json()) as SummaryResponse;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const hasData = !!data && data.events && data.events.length > 0;

  return (
    <SectionShell
      theme={theme}
      eyebrow="Internal"
      title="Pulsar detection dashboard"
      subtitle="Private diagnostics view for Search Mode. Paste your admin token to see how often each pulsar has been detected and where recent detections are coming from."
    >
      <form
        onSubmit={fetchSummary}
        className="flex flex-col gap-4 rounded-2xl border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] p-4 sm:p-5 max-w-xl"
      >
        <label className="text-sm font-medium flex flex-col gap-2">
          <span className={isDark ? "text-white/75" : "text-black/75"}>Admin token</span>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="rounded-lg border border-black/15 dark:border-white/20 bg-white/80 dark:bg-black/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/40 dark:focus:ring-white/40"
            autoComplete="off"
          />
        </label>
        <div className="flex items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-xs sm:text-sm">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-3 w-3 sm:h-4 sm:w-4"
            />
            <span className={isDark ? "text-white/60" : "text-black/60"}>Remember token on this device</span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="ml-auto inline-flex items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black px-4 py-1.5 text-xs sm:text-sm font-semibold tracking-wide disabled:opacity-50 disabled:cursor-default hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            {loading ? "Loading…" : "Load stats"}
          </button>
        </div>
        {error ? <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      </form>

      {hasData ? (
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2">
            <h3 className="text-sm font-semibold tracking-[0.22em] uppercase text-black/60 dark:text-white/60">
              Pulsars
            </h3>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              Total detections:{" "}
              <span className="font-semibold text-black dark:text-white">{data?.totalDetections ?? 0}</span>
            </p>
            <div className="mt-3 max-w-xs">
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter by ID, name, country, page…"
                className="w-full rounded-lg border border-black/10 dark:border-white/20 bg-white dark:bg-black/60 px-3 py-1.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-black/40 dark:focus:ring-white/40"
              />
            </div>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black/60">
              <table className="min-w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-black/10 dark:border-white/15 bg-black/[0.03] dark:bg-white/[0.04]">
                  <tr>
                    <th className="px-3 py-2 font-semibold">#</th>
                    <th
                      className="px-3 py-2 font-semibold cursor-pointer select-none"
                      onClick={() => toggleSort("id")}
                    >
                      Pulsar
                    </th>
                    <th
                      className="px-3 py-2 font-semibold cursor-pointer select-none"
                      onClick={() => toggleSort("name")}
                    >
                      Name
                    </th>
                    <th className="px-3 py-2 font-semibold">Country</th>
                    <th className="px-3 py-2 font-semibold">Page</th>
                    <th
                      className="px-3 py-2 font-semibold cursor-pointer select-none"
                      onClick={() => toggleSort("ts")}
                    >
                      Time
                    </th>
                    <th
                      className="px-3 py-2 font-semibold text-right cursor-pointer select-none"
                      onClick={() => toggleSort("count")}
                    >
                      Detections
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p, idx) => (
                    <tr
                      key={p.id}
                      className={idx % 2 === 0 ? "bg-transparent" : "bg-black/[0.015] dark:bg-white/[0.02]"}
                    >
                      <td className="px-3 py-2 text-black/60 dark:text-white/60">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono text-[11px] sm:text-xs">{p.id}</td>
                      <td className="px-3 py-2">{p.name}</td>
                      <td className="px-3 py-2">{p.country || "—"}</td>
                      <td className="px-3 py-2 font-mono text-[11px] sm:text-xs">
                        {p.page || "—"}
                      </td>
                      <td className="px-3 py-2 text-xs sm:text-[13px] text-black/70 dark:text-white/75">
                        {p.ts
                          ? (() => {
                            try {
                                return new Date(p.ts).toLocaleString();
                              } catch {
                                return p.ts;
                              }
                            })()
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">{p.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 ? (
                <div className="px-4 py-6 text-sm text-black/60 dark:text-white/60">
                  No detections recorded yet.
                </div>
              ) : null}
            </div>
          </section>

          <section className="lg:col-span-1">
            <h3 className="text-sm font-semibold tracking-[0.22em] uppercase text-black/60 dark:text-white/60">
              Recent events
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-black/60 dark:text-white/60">
              Last few detections with timestamp and reported country header.
            </p>
            <div className="mt-4 max-h-[360px] overflow-y-auto rounded-2xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-black/60">
              {data?.events && data.events.length > 0 ? (
                <ul className="divide-y divide-black/10 dark:divide-white/15 text-xs">
                  {data.events.map((ev, idx) => (
                    <li key={`${ev.id}-${ev.ts}-${idx}`} className="px-3 py-2">
                      <div className="flex justify-between gap-3">
                        <span className="font-mono text-[11px]">{ev.id}</span>
                        <span className="text-black/60 dark:text-white/60">
                          #{ev.count} · {ev.country || "unknown"}
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between gap-3 text-[11px] text-black/60 dark:text-white/60">
                        <span>
                          {(() => {
                            try {
                              return new Date(ev.ts).toLocaleString();
                            } catch {
                              return ev.ts;
                            }
                          })()}
                        </span>
                        {ev.userAgent ? (
                          <span className="truncate max-w-[8rem] sm:max-w-[10rem]">{ev.userAgent}</span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-6 text-xs sm:text-sm text-black/60 dark:text-white/60">
                  No recent events in the log.
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </SectionShell>
  );
}
