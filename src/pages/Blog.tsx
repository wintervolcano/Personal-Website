import React from "react";
import { SectionShell } from "./SectionShell";
import { CardGrid } from "../components/CardGrid";
import type { Theme } from "../components/themeToggle";
import type { MdDoc } from "../lib/content";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/cn";

export function Blog({
  theme,
  docs,
}: {
  theme: Theme;
  docs: MdDoc[];
}) {
  const isDark = theme === "dark";
  const normalizeTag = (t: string) => t.trim().toLowerCase();

  const navigate = useNavigate();

  const [activeTag, setActiveTag] = React.useState<"all" | string>("all");

  const tagList = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const d of docs) {
      for (const raw of d.tags || []) {
        const norm = normalizeTag(raw);
        if (!norm) continue;
        if (!map.has(norm)) map.set(norm, raw.trim());
      }
    }

    const primaryOrder = ["science", "philosophy", "fiction", "life"];
    const norms = Array.from(map.keys());
    norms.sort((a, b) => {
      const ai = primaryOrder.indexOf(a);
      const bi = primaryOrder.indexOf(b);
      const aIsPrimary = ai !== -1;
      const bIsPrimary = bi !== -1;
      if (aIsPrimary || bIsPrimary) {
        if (aIsPrimary && !bIsPrimary) return -1;
        if (!aIsPrimary && bIsPrimary) return 1;
        if (ai !== bi) return ai - bi;
      }
      const la = map.get(a) || a;
      const lb = map.get(b) || b;
      return la.localeCompare(lb);
    });

    return norms.map((id) => ({ id, label: map.get(id) || id }));
  }, [docs]);

  const filteredDocs = React.useMemo(() => {
    if (activeTag === "all") return docs;
    const target = activeTag;
    return docs.filter((d) => (d.tags || []).some((t) => normalizeTag(t) === target));
  }, [docs, activeTag]);

  return (
    <SectionShell
      theme={theme}
      eyebrow="Blog"
      title="Short posts, deep (hopefully) thoughts"
      rightSlot={
        <div className="flex flex-col gap-4 items-start lg:items-end">
          <p
            className={cn(
              "text-base sm:text-lg leading-relaxed",
              isDark ? "text-white/65" : "text-black/65"
            )}
          >
            Late night ramblings, small methods notes, and reflections on science, fiction, philosophy, and life.
          </p>
          {tagList.length > 0 ? (
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => setActiveTag("all")}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] uppercase transition-colors",
                  activeTag === "all"
                    ? isDark
                      ? "border-white bg-white text-black"
                      : "border-black bg-black text-white"
                    : isDark
                      ? "border-white/25 text-white/80 hover:bg-white/10"
                      : "border-black/20 text-black/70 hover:bg-black/5"
                )}
              >
                All
              </button>
              {tagList.map((tag) => {
                const isActive = activeTag === tag.id;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setActiveTag(tag.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] uppercase transition-colors",
                      isActive
                        ? isDark
                          ? "border-white bg-white text-black"
                          : "border-black bg-black text-white"
                        : isDark
                          ? "border-white/25 text-white/80 hover:bg-white/10"
                          : "border-black/20 text-black/70 hover:bg-black/5"
                    )}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      }
    >
      <CardGrid
        theme={theme}
        items={filteredDocs.map((d) => ({
          k: d.slug,
          t: d.title,
          d: d.description || (d.body ? d.body.slice(0, 120) + "…" : ""),
          tag: d.tags && d.tags.length ? d.tags.join(" • ") : d.date,
          onClick: () => navigate(`/blog/${d.slug}`), // same tab, full page route
        }))}
      />
    </SectionShell>
  );
}
