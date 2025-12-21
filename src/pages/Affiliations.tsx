// src/pages/Affiliations.tsx
import React from "react";
import { SectionShell } from "./SectionShell";
import type { Theme } from "../components/themeToggle";
import { cn } from "../lib/cn";

type TimelineNode = {
    id: string;
    period: string;
    title: string;
    place: string;
    children?: { id: string; title: string }[];
};

const EDUCATION: TimelineNode[] = [
    {
        id: "phd",
        period: "20XX — present",
        title: "PhD, Astronomy & Astrophysics",
        place: "Max Planck Institute for Radio Astronomy, Bonn",
        children: [
            {
                id: "phd-focus",
                title: "Pulsars in globular clusters • precision timing • tests of gravity",
            },
        ],
    },
    // Add / edit your earlier degrees here:
    {
        id: "degree-1",
        period: "YYYY — YYYY",
        title: "Your previous degree",
        place: "Institution • City",
        children: [{ id: "degree-1-detail", title: "Key focus / thesis / track" }],
    },
];

const ORGS: TimelineNode[] = [
    {
        id: "mpifr",
        period: "20XX — present",
        title: "Doctoral researcher",
        place: "Max Planck Institute for Radio Astronomy, Bonn",
        children: [
            { id: "mpifr-1", title: "Globular cluster pulsars and timing arrays" },
            { id: "mpifr-2", title: "Wideband pipelines and search-mode tooling" },
        ],
    },
    {
        id: "org-1",
        period: "YYYY — YYYY",
        title: "Your earlier role",
        place: "Organisation • City",
        children: [{ id: "org-1-detail", title: "Key project / collaboration" }],
    },
];

function TimelineTree({ theme, items }: { theme: Theme; items: TimelineNode[] }) {
    const isDark = theme === "dark";
    return (
        <div className="relative pl-4">
            <div
                className={cn(
                    "absolute left-[6px] top-0 bottom-0 border-l",
                    isDark ? "border-white/15" : "border-black/10"
                )}
            />
            <ul className="space-y-6">
                {items.map((item) => (
                    <li key={item.id} className="relative pl-6">
                        <div
                            className={cn(
                                "absolute left-0 top-1 w-3 h-3 rounded-full border-2",
                                isDark ? "bg-black border-white" : "bg-white border-black"
                            )}
                        />
                        <div
                            className={cn(
                                "text-[11px] font-semibold tracking-[0.24em] uppercase",
                                isDark ? "text-white/60" : "text-black/55"
                            )}
                        >
                            {item.period}
                        </div>
                        <div
                            className={cn(
                                "mt-1 text-sm font-semibold tracking-[-0.01em]",
                                isDark ? "text-white" : "text-black"
                            )}
                        >
                            {item.title}
                        </div>
                        <div
                            className={cn(
                                "text-sm",
                                isDark ? "text-white/65" : "text-black/65"
                            )}
                        >
                            {item.place}
                        </div>

                        {item.children && item.children.length ? (
                            <ul className="mt-3 space-y-1.5">
                                {item.children.map((child) => (
                                    <li key={child.id} className="relative pl-4">
                                        <div
                                            className={cn(
                                                "absolute left-0 top-2 h-[1px] w-3",
                                                isDark ? "bg-white/35" : "bg-black/25"
                                            )}
                                        />
                                        <div
                                            className={cn(
                                                "text-xs",
                                                isDark ? "text-white/70" : "text-black/70"
                                            )}
                                        >
                                            {child.title}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function Affiliations({ theme }: { theme: Theme }) {
    return (
        <SectionShell
            theme={theme}
            eyebrow="Affiliations"
            title="Where I've learned and worked."
            subtitle="Edit this tree to reflect your full education timeline and the organisations you've collaborated with."
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div>
                    <div className="text-[11px] font-semibold tracking-[0.28em] uppercase text-black/55 dark:text-white/60">
                        Education
                    </div>
                    <div className="mt-4">
                        <TimelineTree theme={theme} items={EDUCATION} />
                    </div>
                </div>

                <div>
                    <div className="text-[11px] font-semibold tracking-[0.28em] uppercase text-black/55 dark:text-white/60">
                        Organisations & collaborations
                    </div>
                    <div className="mt-4">
                        <TimelineTree theme={theme} items={ORGS} />
                    </div>
                </div>
            </div>
        </SectionShell>
    );
}
