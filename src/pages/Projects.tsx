import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionShell } from "./SectionShell";
import { CardGrid } from "../components/CardGrid";
import type { Theme } from "../components/themeToggle";
import type { MdDoc } from "../lib/content";

export function Projects({ theme, docs }: { theme: Theme; docs?: MdDoc[] }) {
  const navigate = useNavigate();
  const items = docs ?? [];
  return (
    <SectionShell
      theme={theme}
      eyebrow="Projects"
      title="Pipelines, tools, and demos"
      subtitle="Here are some of the tools I've built to make pulsar searching and analysis easier, faster, and more fun."
    >
      <CardGrid
        theme={theme}
        items={items.map((d) => ({
          k: d.slug,
          t: d.title,
          d: d.description || (d.body ? d.body.slice(0, 120) + "…" : ""),
          tag: d.date,
          onClick: () => navigate(`/projects/${d.slug}`),
        }))}
      />
    </SectionShell>
  );
}
