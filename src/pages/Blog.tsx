import React from "react";
import { SectionShell } from "./SectionShell";
import { CardGrid } from "../components/CardGrid";
import type { Theme } from "../components/themeToggle";
import type { MdDoc } from "../lib/content";
import { useNavigate } from "react-router-dom";

export function Blog({
  theme,
  docs,
}: {
  theme: Theme;
  docs: MdDoc[];
}) {
  const navigate = useNavigate();

  return (
    <SectionShell
      theme={theme}
      eyebrow="Blog"
      title="Short posts, deep (hopefully) thoughts"
      subtitle="Late night ramblings, personal philosophies, reflections on science and life."
    >
      <CardGrid
        theme={theme}
        items={docs.map((d) => ({
          k: d.slug,
          t: d.title,
          d: d.description || (d.body ? d.body.slice(0, 120) + "…" : ""),
          tag: d.date,
          onClick: () => navigate(`/blog/${d.slug}`), // same tab, full page route
        }))}
      />
    </SectionShell>
  );
}