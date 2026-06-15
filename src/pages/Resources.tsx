import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionShell } from "./SectionShell";
import { CardGrid } from "../components/CardGrid";
import type { Theme } from "../components/themeToggle";
import type { MdDoc } from "../lib/content";
import { usePageMeta } from "../lib/usePageMeta";

export function Resources({
  theme,
  docs,
}: {
  theme: Theme;
  docs: MdDoc[];
}) {
  const navigate = useNavigate();

  usePageMeta(
    "Resources – Fazal Kareem",
    "Curated resources for students, astronomers, and media—helpful links, software, and outreach materials."
  );

  return (
    <SectionShell
      theme={theme}
      eyebrow="Resources"
      title="Notes worth keeping"
      subtitle="Curated pages for students and astronomers—plus catalogs and updates. These are markdown-backed."
    >
      <CardGrid
        theme={theme}
        items={[
          {
            k: "a1",
            t: "For Students",
            d: "Helpful links and study material",
            onClick: () => navigate("/resources/for-students"),
          },
          {
            k: "a1b",
            t: "Binary Pulsar Timing Lab",
            d: "Interactive timing workbench for orbital geometry, delays, TOAs, and residuals.",
            onClick: () => navigate("/resources/binary-pulsar-lab"),
          },
          {
            k: "a1c",
            t: "Globular Cluster Explorer",
            d: "Interactive 3D globular cluster visualization and exploration.",
            onClick: () => navigate("/globular-cluster-explorer"),
          },
          {
            k: "a1d",
            t: "The lighthouse model",
            d: "A simple interactive model of pulsar emission geometry.",
            onClick: () => navigate("/lighthouse-model"),
          },
          {
            k: "a2",
            t: "For Astronomers",
            d: "Software and helpful links",
            onClick: () => navigate("/resources/for-astronomers"),
          },
          {
            k: "a3",
            t: "For Media",
            d: "Outreach material and press releases",
            onClick: () => navigate("/resources/for-media"),
          },

          ...docs.map((d) => ({
            k: d.slug,
            t: d.title,
            d: d.description || (d.body ? d.body.slice(0, 120) + "…" : ""),
            tag: (d.tags && d.tags[0]) || "resource",
            onClick: () => navigate(`/resources/${d.slug}`),
          })),
        ]}
      />
    </SectionShell>
  );
}
