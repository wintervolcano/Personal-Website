import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Search } from "lucide-react";
import type { Theme } from "../components/themeToggle";
import { fetchOrcidPublications, searchPublications, type PublicationItem } from "../lib/publications";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Pill({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  const isDark = theme === "dark";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5",
        "text-[11px] font-semibold tracking-[0.18em] uppercase",
        isDark ? "border-white/14 bg-white/5 text-white/75" : "border-black/10 bg-black/5 text-black/70"
      )}
    >
      {children}
    </span>
  );
}

function Card({ theme, title, children }: { theme: Theme; title: string; children: React.ReactNode }) {
  const isDark = theme === "dark";
  return (
    <motion.div
      className={cn(
        "h-full rounded-[28px] border p-6 sm:p-7 flex flex-col",
        isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5"
      )}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 520, damping: 36 }}
    >
      <div className={cn("text-[11px] font-semibold tracking-[0.28em] uppercase", isDark ? "text-white/60" : "text-black/55")}>
        {title}
      </div>
      <div className={cn("mt-3 text-sm leading-relaxed", isDark ? "text-white/70" : "text-black/70")}>{children}</div>
      <div className="mt-auto" />
    </motion.div>
  );
}

function PubRow({ theme, p }: { theme: Theme; p: PublicationItem }) {
  const isDark = theme === "dark";
  return (
    <div
      className={cn(
        "rounded-2xl border px-5 py-4 flex items-start justify-between gap-4",
        isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"
      )}
    >
      <div>
        <div className={cn("font-extrabold tracking-[-0.02em]", isDark ? "text-white" : "text-black")}>{p.title}</div>
        <div className={cn("mt-1 text-sm", isDark ? "text-white/65" : "text-black/65")}>
          {(p.year ? `${p.year}` : "—")} {p.venue ? `• ${p.venue}` : ""} {p.doi ? `• DOI: ${p.doi}` : ""}
        </div>
      </div>
      {p.url ? (
        <a
          className={cn(
            "shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-2",
            "text-xs font-semibold tracking-[0.18em] uppercase",
            isDark ? "border-white/12 bg-white/5 text-white/80 hover:bg-white/10" : "border-black/10 bg-black/5 text-black/70 hover:bg-black/10"
          )}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open <ArrowUpRight className="h-4 w-4" />
        </a>
      ) : null}
    </div>
  );
}

export function Publications({ theme }: { theme: Theme }) {
  const isDark = theme === "dark";

  // Put your IDs here (or read from env/config)
  const ORCID_ID = "0000-0003-2444-838X";
  const SCHOLAR_URL = "https://scholar.google.com/citations?user=XXXX";

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PublicationItem[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const selected = useMemo<PublicationItem[]>(
    () => [
      // replace with real selections
      { id: "sel-1", title: "Improving DM estimates using low-frequency scatter-broadening estimates", year: 2024, venue: "MNRAS", type: "journal", source: "manual", url: "https://academic.oup.com/mnras/article/535/1/1184/7831684" },
      { id: "sel-2", title: "The second data release from the European Pulsar Timing Array - III. Search for gravitational wave signals", year: 2023, venue: "A&A", type: "journal", source: "manual", url: "https://inspirehep.net/literature/2672722" },
    ],
    []
  );

  const talks = useMemo(
    () => [
      { id: "post-1", title: "Poster: Effelsberg COMPACT Pipeline", where: "Sardinia", year: 2025, url: "/EFFELSBERG_SEARCH_POSTER_A0_FINAL.pdf" },
      { id: "talk-1", title: "Who am i?", where: "MPIfR Bonn", year: 2024, url: "/whoami.pdf" },
    ],
    []
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const pubs = await fetchOrcidPublications(ORCID_ID);
        if (!alive) return;
        setItems(pubs);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Failed to load publications");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [ORCID_ID]);

  const filtered = useMemo(() => searchPublications(items, query), [items, query]);

  return (
    <div className={cn("w-full", isDark ? "bg-black" : "bg-white")}>
      <section className={cn("w-full", isDark ? "bg-black" : "bg-white")}>
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8 py-14 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-8">
              <div className={cn("text-xs font-semibold tracking-[0.32em] uppercase", isDark ? "text-white/60" : "text-black/55")}>
                Publications
              </div>
              <h2 className={cn("mt-4 text-4xl sm:text-6xl font-black tracking-[-0.04em]", isDark ? "text-white" : "text-black")}>
                Papers, talks,
                <br />
                and the trail of science.
              </h2>
              <div className="mt-6 flex flex-wrap gap-2">
                <a className={cn(
                  "shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-2",
                  "text-xs font-semibold tracking-[0.18em] uppercase",
                  isDark ? "border-white/12 bg-white/5 text-white/80 hover:bg-white/10" : "border-black/10 bg-black/5 text-black/70 hover:bg-black/10"
                )}
                  href={`https://orcid.org/${ORCID_ID}`}
                  target="_blank"
                  rel="noopener norefferer"
                >
                  ORCID PAGE
                </a>
                <a className={cn(
                  "shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-2",
                  "text-xs font-semibold tracking-[0.18em] uppercase",
                  isDark ? "border-white/12 bg-white/5 text-white/80 hover:bg-white/10" : "border-black/10 bg-black/5 text-black/70 hover:bg-black/10"
                )}
                  href={{SCHOLAR_URL}}
                  target="_blank"
                  rel="noopener norefferer"
                >
                  GOOGLE SCHOLAR
                </a>
              </div>
            </div>
            
            <div className="lg:col-span-4">
              <div
                className={cn(
                  "rounded-[28px] border px-5 py-4 sm:px-6 sm:py-5",
                  isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div
                    className={cn(
                      "text-[11px] font-semibold tracking-[0.28em] uppercase",
                      isDark ? "text-white/60" : "text-black/55"
                    )}
                  >
                    Search publications
                  </div>
                  <div className="flex-1" />
                </div>

                <div
                  className={cn(
                    "mt-3 flex items-center gap-3 rounded-full px-4 py-3 shadow-sm",
                    isDark
                      ? "bg-white/8 border border-white/14"
                      : "bg-white border border-black/10"
                  )}
                >
                  <Search
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      isDark ? "text-white/65" : "text-black/55"
                    )}
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search title, venue, DOI…"
                    className={cn(
                      "w-full bg-transparent outline-none text-sm",
                      isDark
                        ? "text-white placeholder:text-white/45"
                        : "text-black placeholder:text-black/45"
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Full list */}
          <div className="mt-6">
            <div className={cn("text-xs font-semibold tracking-[0.32em] uppercase px-4", isDark ? "text-white/60" : "text-black/55")}>
              Full list of Publications.
            </div>

            {loading ? (
              <div className={cn("mt-4 text-sm", isDark ? "text-white/70" : "text-black/70")}>Loading…</div>
            ) : err ? (
              <div className={cn("mt-4 text-sm", isDark ? "text-white/70" : "text-black/70")}>
                Failed to load: {err}
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                {filtered.map((p) => (
                  <PubRow key={p.id} theme={theme} p={p} />
                ))}
              </div>
            )}
          </div>


          {/* Selected + Talks + Search bar (top, as requested) */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-6">
              <Card theme={theme} title="Selected publications">
                <div className="mt-2 grid gap-3">
                  {selected.map((p) => (
                    <PubRow key={p.id} theme={theme} p={p} />
                  ))}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-6">
              <Card theme={theme} title="Talks & posters">
                <div className="mt-2 grid gap-3">
                  {talks.map((t) => (
                    <div
                      key={`${t.title}-${t.year}`}
                      className={cn(
                        "rounded-2xl border px-5 py-4 flex items-start justify-between gap-4",
                        isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"
                      )}
                    >
                      <div>
                        <div className={cn("font-extrabold tracking-[-0.02em]", isDark ? "text-white" : "text-black")}>{t.title}</div>
                        <div className={cn("mt-1 text-sm", isDark ? "text-white/65" : "text-black/65")}>
                          {t.where} • {t.year}
                        </div>
                      </div>
                      {t.url ? (
                        <a
                          className={cn(
                            "shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-2",
                            "text-xs font-semibold tracking-[0.18em] uppercase",
                            isDark ? "border-white/12 bg.white/5 text-white/80 hover:bg-white/10"
                              : "border-black/10 bg-black/5 text-black/70 hover:bg-black/10"
                          )}
                          href={t.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open <ArrowUpRight className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}