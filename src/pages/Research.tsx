import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionShell } from "./SectionShell";
import { CardGrid } from "../components/CardGrid";
import type { Theme } from "../components/themeToggle";
import type { MdDoc } from "../lib/content";

export function Research({ theme, docs }: { theme: Theme; docs: MdDoc[] }) {
  const navigate = useNavigate();

  return (
    <SectionShell
      theme={theme}
      eyebrow="Research"
      title="Notes, updates, and deep dives"
      subtitle="These are markdown-backed posts about my latest findings and ongoing projects. "
    >
      <CardGrid
        theme={theme}
        items={docs.map((d) => ({
          k: d.slug,
          t: d.title,
          d: d.description || (d.body ? d.body.slice(0, 120) + "…" : ""),
          tag: d.date,
          onClick: () => navigate(`/research/${d.slug}`),
        }))}
      />
    </SectionShell>
  );
}