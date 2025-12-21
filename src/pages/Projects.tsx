import React from "react";
import { SectionShell } from "./SectionShell";
import { CardGrid } from "../components/CardGrid";
import type { Theme } from "../components/themeToggle.tsx";

export function Projects({ theme }: { theme: Theme }) {
  return (
    <SectionShell
      theme={theme}
      eyebrow="Projects"
      title="Pipelines, tools, and playful demos"
      subtitle="Here are some of the tools I've built to make pulsar searching and analysis easier, faster, and more fun."
    >
      <CardGrid
        theme={theme}
        items={[
          { k: "p1", t: "Wideband Baseband Merge", d: "High-throughput band stacking with strict metadata integrity.", tag: "GPU" },
          { k: "p2", t: "Candidate Review Toolkit", d: "Fast visual triage with reproducible notes.", tag: "workflow" },
          { k: "p3", t: "Search Mode Instrument", d: "A tiny game to explain FFT peaks and harmonics.", tag: "UI/UX" },
        ]}
      />
    </SectionShell>
  );
}
