import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionShell } from "./SectionShell";
import { CardGrid } from "../components/CardGrid";
import type { Theme } from "../components/themeToggle";
import type { MdDoc } from "../lib/content";

export function Resources({
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