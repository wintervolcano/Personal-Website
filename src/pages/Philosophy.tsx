import React from "react";
import { motion } from "framer-motion";
import { cn } from "../lib/cn";
import type { Theme } from "../components/themeToggle";

function Pill({
    theme,
    children,
}: {
    theme: Theme;
    children: React.ReactNode;
}) {
    const isDark = theme === "dark";
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-3 py-1.5",
                "text-[11px] font-semibold tracking-[0.18em] uppercase",
                isDark
                    ? "border-white/14 bg-white/5 text-white/75"
                    : "border-black/10 bg-black/5 text-black/70"
            )}
        >
            {children}
        </span>
    );
}

function Card({
    theme,
    title,
    body,
}: {
    theme: Theme;
    title: string;
    body: React.ReactNode;
}) {
    const isDark = theme === "dark";
    return (
        <motion.div
            className={cn(
                "rounded-[28px] border p-6 sm:p-7 h-full",
                isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5"
            )}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 520, damping: 36 }}
        >
            <div
                className={cn(
                    "text-[11px] font-semibold tracking-[0.28em] uppercase",
                    isDark ? "text-white/60" : "text-black/55"
                )}
            >
                {title}
            </div>
            <div className={cn("mt-3 text-sm leading-relaxed", isDark ? "text-white/70" : "text-black/70")}>
                {body}
            </div>
        </motion.div>
    );
}

function Section({
    theme,
    id,
    eyebrow,
    title,
    subtitle,
    children,
}: {
    theme: Theme;
    id: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    children: React.ReactNode;
}) {
    const isDark = theme === "dark";
    return (
        <section id={id} className={cn("w-full scroll-mt-28", isDark ? "bg-black" : "bg-white")}>
            <div className="mx-auto max-w-[1600px] px-4 sm:px-8 py-14 sm:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end items-stretch">
                    <div className="lg:col-span-7">
                        <div
                            className={cn(
                                "text-xs font-semibold tracking-[0.32em] uppercase",
                                isDark ? "text-white/60" : "text-black/55"
                            )}
                        >
                            {eyebrow}
                        </div>
                        <h2
                            className={cn(
                                "mt-4 text-4xl sm:text-6xl font-black tracking-[-0.04em]",
                                isDark ? "text-white" : "text-black"
                            )}
                        >
                            {title}
                        </h2>
                    </div>
                    <div className="lg:col-span-5">
                        <p className={cn("text-base sm:text-lg leading-relaxed", isDark ? "text-white/65" : "text-black/65")}>
                            {subtitle}
                        </p>
                    </div>
                </div>

                <div className="mt-10 sm:mt-12">{children}</div>
            </div>
        </section>
    );
}

function TOCLink({
    theme,
    href,
    label,
}: {
    theme: Theme;
    href: string;
    label: string;
}) {
    const isDark = theme === "dark";
    return (
        <a
            href={href}
            className={cn(
                "rounded-2xl border px-4 py-3 text-left transition-colors",
                "text-xs font-semibold tracking-[0.18em] uppercase",
                isDark
                    ? "border-white/12 bg-black/40 text-white/75 hover:bg-white/10 hover:text-white"
                    : "border-black/10 bg-white/70 text-black/70 hover:bg-black/10 hover:text-black"
            )}
            data-nolock
        >
            {label}
        </a>
    );
}

export function Philosophy({ theme }: { theme: Theme }) {
    const isDark = theme === "dark";

    return (
        <div className={cn("w-full", isDark ? "bg-black" : "bg-white")}>
            {/* Top header strip */}
            <section className={cn("w-full", isDark ? "bg-black" : "bg-white")}>
                <div className="mx-auto max-w-[1600px] px-4 sm:px-8 pt-8 pb-12 sm:pt-10 sm:pb-14">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end items-stretch">
                        <div className="lg:col-span-8">
                            <div className={cn("text-xs font-semibold tracking-[0.32em] uppercase", isDark ? "text-white/60" : "text-black/55")}>
                                Site philosophy
                            </div>
                            <h1 className={cn("mt-4 text-5xl sm:text-7xl font-black tracking-[-0.05em]", isDark ? "text-white" : "text-black")}>
                                The thought behind building this website. 
                            </h1>
                            <p className={cn("mt-5 max-w-[85ch] text-base sm:text-lg leading-relaxed", isDark ? "text-white/65" : "text-black/65")}>
                                This page is a design spec in plain language. It explains what the site is for, how Search Mode fits into the rest,
                                and the rules that should stay stable as the layout, gallery, and data sources change.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-2">
                                <Pill theme={theme}>Black/white system</Pill>
                                <Pill theme={theme}>Full-bleed layout</Pill>
                                <Pill theme={theme}>Framer Motion</Pill>
                                <Pill theme={theme}>Search Mode overlay</Pill>
                                <Pill theme={theme}>Clarity-first UX</Pill>
                            </div>
                        </div>

                        <div className="lg:col-span-4">
                            <div className={cn("rounded-[28px] border p-6 sm:p-7", isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5")}>
                                <div className={cn("text-[11px] font-semibold tracking-[0.28em] uppercase", isDark ? "text-white/60" : "text-black/55")}>
                                    Reading guide
                                </div>
                                <div className={cn("mt-3 text-sm leading-relaxed", isDark ? "text-white/70" : "text-black/70")}>
                                    If you only skim one thing: read <span className={cn("font-semibold", isDark ? "text-white" : "text-black")}>Search Mode</span> and{" "}
                                    <span className={cn("font-semibold", isDark ? "text-white" : "text-black")}>The discovery loop</span>.
                                </div>

                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 items-stretch">
                                    <TOCLink theme={theme} href="#principles" label="Principles" />
                                    <TOCLink theme={theme} href="#layout" label="Layout" />
                                    <TOCLink theme={theme} href="#type" label="Typography" />
                                    <TOCLink theme={theme} href="#motion" label="Motion" />
                                    <TOCLink theme={theme} href="#searchmode" label="Search Mode" />
                                    <TOCLink theme={theme} href="#engineering" label="Engineering" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Section
                theme={theme}
                id="principles"
                eyebrow="01 • foundations"
                title="Principles"
                subtitle="Treat the site like a simple instrument for exploring my work: clear, predictable, grounded in real pulsar data, and lightweight enough to maintain."
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Instrument, not poster"
                            body={
                                <>
                                    The main jobs of the site are: explain my research and tools, give people a way to play with Search Mode,
                                    and point to a few personal recommendations. Visual choices are there to support those jobs, not to show off styling.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Real data, clear affordances"
                            body={
                                <>
                                    TRAPUM pulsars, discovery plots, and gallery “loves” are real data, not fake counters.
                                    Buttons and cards are only clickable when they actually navigate or trigger something,
                                    and overlays stay out of the way of normal page links and controls.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Teach search-mode thinking"
                            body={
                                <>
                                    Search Mode is a small training tool: synthetic time series and FFTs, mapped onto real TRAPUM pulsars.
                                    The goal is to practice “see a candidate → commit to it → confirm or reject” without needing a full pipeline.
                                </>
                            }
                        />
                    </div>

                    <div className="lg:col-span-6">
                        <Card
                            theme={theme}
                            title="Pages with specific jobs"
                            body={
                                <>
                                    About tells the story and shows the CV. Gallery is a simple folder-backed grid with shared likes.
                                    Personal recommendations are short, skimmable cards that link out. Each page has a narrow responsibility.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-6">
                        <Card
                            theme={theme}
                            title="Consistency beats cleverness"
                            body={
                                <>
                                    Rounded cards, border weights, and motion curves repeat everywhere so new sections feel familiar.
                                    If a new idea conflicts with those patterns, the patterns usually win.
                                </>
                            }
                        />
                    </div>
                </div>
            </Section>

            <Section
                theme={theme}
                id="layout"
                eyebrow="02 • structure"
                title="Layout system"
                subtitle="The layout is full-bleed but controlled: wide max width, generous padding, and a grid that can hold both prose and dashboards."
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    <div className="lg:col-span-7">
                        <Card
                            theme={theme}
                            title="Full-bleed, not narrow-column"
                            body={
                                <>
                                    The site uses a wide container (e.g., max-w ~1600–1800px) so the hero typography can breathe and dashboard-style sections
                                    (cards, plots, grids) don’t feel cramped.
                                    <br /><br />
                                    Inside that wide frame, text line lengths are still capped via max-width on paragraphs to keep reading comfortable.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-5">
                        <Card
                            theme={theme}
                            title="Grid as a mental model"
                            body={
                                <>
                                    Most pages use a 12-column grid: big headline + supporting copy, then cards that snap into place.
                                    This keeps visual rhythm consistent and makes the site feel “engineered.”
                                </>
                            }
                        />
                    </div>

                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Spacing philosophy"
                            body={
                                <>
                                    Spacing is intentionally generous. Dense UI makes science look harder than it is.
                                    Large paddings and consistent gaps create “air” — the same way clean plots aid interpretation.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Shape language"
                            body={
                                <>
                                    Cards use a rounded “instrument bezel” radius (≈ 28px) with a thin border and subtle fill.
                                    It reads like hardware: precise edges, minimal chrome, high contrast.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Interaction zones"
                            body={
                                <>
                                    Click targets are big and obvious: pill buttons, full-width list items, and large rounded cards.
                                    This also makes the site feel good on trackpads and touch screens.
                                </>
                            }
                        />
                    </div>
                </div>
            </Section>

            <Section
                theme={theme}
                id="type"
                eyebrow="03 • typography"
                title="Typography & hierarchy"
                subtitle="Typography is the primary visual design tool here: a huge headline system, tight tracking, and small uppercase labels that behave like instrument readouts."
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    <div className="lg:col-span-6">
                        <Card
                            theme={theme}
                            title="Why the giant hero name?"
                            body={
                                <>
                                    The hero is intentionally oversized: it functions like a title page for a paper.
                                    It sets the tone immediately: high confidence, high clarity.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-6">
                        <Card
                            theme={theme}
                            title="Two-tier labels"
                            body={
                                <>
                                    Sections often start with a small uppercase eyebrow (tracking ~0.32em), followed by a heavy headline.
                                    It mimics the way instruments label channels: calm label, loud signal.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Readable line length"
                            body={
                                <>
                                    Even in a wide layout, paragraphs are constrained (≈ 70–85 characters) so reading never feels like scanning a spreadsheet.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Tracking as personality"
                            body={
                                <>
                                    Slightly wide tracking on labels makes the UI feel precise and “engineered,” without needing extra decoration.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Bold = navigational"
                            body={
                                <>
                                    Bold weights are reserved for navigation and key facts (names, KPIs). Body copy stays softer so attention flows naturally.
                                </>
                            }
                        />
                    </div>
                </div>
            </Section>

            <Section
                theme={theme}
                id="color"
                eyebrow="04 • palette"
                title="Color system"
                subtitle="The entire site is essentially two themes: clean light mode for reading and a pitch-black “instrument night mode” for Search Mode."
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    <div className="lg:col-span-6">
                        <Card
                            theme={theme}
                            title="Why black/white?"
                            body={
                                <>
                                    High contrast is the fastest way to make UI feel crisp.
                                    It also matches astronomy culture: dark skies, bright signals.
                                    Color becomes a rare tool reserved for meaning, not decoration.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-6">
                        <Card
                            theme={theme}
                            title="Translucent surfaces"
                            body={
                                <>
                                    “Glass” panels (bg white/5 or black/5) give depth without adding color.
                                    Borders stay thin so panels feel like overlays, not heavy boxes.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Borders are the scaffolding"
                            body={
                                <>
                                    Borders define structure. Background gradients are subtle and only support depth.
                                    The hierarchy comes from spacing and weight, not from thick separators.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Grid + radial glow"
                            body={
                                <>
                                    Backgrounds use a faint grid and radial gradients to imply “technical space” without competing with text.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Theme as mode, not preference"
                            body={
                                <>
                                    Dark mode isn’t only aesthetic — it’s part of the narrative: “Search Mode” feels like switching on the instrument.
                                </>
                            }
                        />
                    </div>
                </div>
            </Section>

            <Section
                theme={theme}
                id="motion"
                eyebrow="05 • motion"
                title="Motion rules"
                subtitle="Motion is not decoration; it is feedback. Every animation is subtle, consistent, and respects reduced-motion preferences."
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    <div className="lg:col-span-6">
                        <Card
                            theme={theme}
                            title="Hover lift = affordance"
                            body={
                                <>
                                    Cards lift by a few pixels on hover. This is the universal signal: “this is interactive.”
                                    The same spring settings repeat so the site feels coherent.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-6">
                        <Card
                            theme={theme}
                            title="Parallax is controlled"
                            body={
                                <>
                                    Mouse-reactive motion is intentionally small. It adds life without becoming distracting.
                                    The goal is a gentle sense of depth — like a real control panel.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Modal transitions"
                            body={
                                <>
                                    Modals appear with a spring (y + opacity + scale) to feel “snappy” but not abrupt.
                                    Closing reverses the motion for symmetry.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Reduce motion support"
                            body={
                                <>
                                    Reduced-motion users still see clean UI, but animated noise/parallax/drift are limited or removed.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Always legible"
                            body={
                                <>
                                    Motion never moves text enough to change reading position mid-scan.
                                    Most motion happens in backgrounds, glyphs, and micro-interactions.
                                </>
                            }
                        />
                    </div>
                </div>
            </Section>

            <Section
                theme={theme}
                id="searchmode"
                eyebrow="06 • the game"
                title="Search Mode & the discovery loop"
                subtitle="Search Mode turns the site into a small training instrument. It now runs on a TRAPUM-based catalog, with page-linked targets and guardrails so it never fights normal browsing."
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    <div className="lg:col-span-7">
                        <Card
                            theme={theme}
                            title="Why it’s an overlay"
                            body={
                                <>
                                    Search Mode is a fixed overlay so it feels like you’ve turned on a device that sits “on top of reality.”
                                    Every page becomes a searchable sky region without changing its layout or breaking normal navigation.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-5">
                        <Card
                            theme={theme}
                            title="Why the LOCK step exists"
                            body={
                                <>
                                    Locking simulates a real workflow: first you identify a candidate region, then you “commit” attention to it.
                                    It forces a deliberate choice before the spectrum is interpreted as a detection.
                                </>
                            }
                        />
                    </div>

                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Synthetic plots (for now)"
                            body={
                                <>
                                    Time series and FFTs are synthetic so difficulty and noise can be tuned.
                                    The TRAPUM catalog and discovery plots are real, and the UI is built so full survey outputs can replace the synthetic pieces later.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Discovery modal"
                            body={
                                <>
                                    The reward is a confirmation panel: pulsar identity, TRAPUM context, and (eventually) real fold images.
                                    It should feel closer to a useful snippet than a gamified badge.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Page-linked targets"
                            body={
                                <>
                                    Each page maps to stable target IDs via a pageKey and deterministic hashing.
                                    Hotspots avoid nav and buttons, and the grid takes scroll into account so targets are spread over the whole page, not just one viewport row.
                                </>
                            }
                        />
                    </div>

                    <div className="lg:col-span-12">
                        <div className={cn("rounded-[28px] border p-6 sm:p-7", isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5")}>
                            <div className={cn("text-[11px] font-semibold tracking-[0.28em] uppercase", isDark ? "text-white/60" : "text-black/55")}>
                                The loop, in one sentence
                            </div>
                            <div className={cn("mt-3 text-base sm:text-lg leading-relaxed", isDark ? "text-white/70" : "text-black/70")}>
                                Browse a page → toggle Search Mode → interpret the spectrum → lock → confirm → earn a detection → learn something small but real.
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            <Section
                theme={theme}
                id="content"
                eyebrow="07 • content system"
                title="Content & information architecture"
                subtitle="Research, projects, and publications read like a portfolio. Blog/resources behave more like a lab notebook. About, Gallery, and Personal recommendations exist to add human context around that work."
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    <div className="lg:col-span-6">
                        <Card
                            theme={theme}
                            title="Why markdown-backed content?"
                            body={
                                <>
                                    Markdown keeps publishing friction low. Posts and resource pages live as files in the repo,
                                    so they can be versioned alongside code and edited without a CMS.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-6">
                        <Card
                            theme={theme}
                            title="Navigation strategy"
                            body={
                                <>
                                    The top nav is sparse and stable: Research, Projects, Publications, Resources, Blog, About, Gallery.
                                    Search Mode is treated as a separate “instrument state” you enter rather than a separate content section.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Cards as units of meaning"
                            body={
                                <>
                                    Cards are the main way content is chunked. Each card has a title, a short description, and a single action.
                                    In recommendations, cards can optionally link out; if they do, the whole surface is interactive.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Skimmable by default"
                            body={
                                <>
                                    Eyebrows, big headers, and compact summaries let busy readers understand the structure quickly.
                                    Deeper reading is there, but skimming is always supported.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Deep reading is supported"
                            body={
                                <>
                                    When someone does want detail, the layout supports long-form sections without becoming visually tiring.
                                </>
                            }
                        />
                    </div>
                </div>
            </Section>

            <Section
                theme={theme}
                id="engineering"
                eyebrow="08 • implementation"
                title="Engineering choices"
                subtitle="The site is intentionally simple in architecture, so the design system stays consistent and the Search Mode experience remains reliable."
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    <div className="lg:col-span-6">
                        <Card
                            theme={theme}
                            title="React + Tailwind + Framer Motion"
                            body={
                                <>
                                    React + Vite keep the stack simple. Tailwind handles spacing and typography, and Framer Motion provides a single animation system
                                    so the UI feels like one coherent piece instead of a mix of patterns.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-6">
                        <Card
                            theme={theme}
                            title="Performance philosophy"
                            body={
                                <>
                                    Motion is lightweight: CSS gradients, canvas only where needed, and limited redraw regions.
                                    Heavy 3D is used sparingly and only when it explains something better than a static plot.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Stable IDs & determinism"
                            body={
                                <>
                                    The site leans on stable keys (pageKey, pulsar id, gallery item id) so hidden targets and like counts don’t feel random between reloads.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Reduced motion"
                            body={
                                <>
                                    Reduced-motion is treated as a first-class mode: UX stays complete even if animations are toned down.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Extensibility"
                            body={
                                <>
                                    The design is built so you can slot in real survey plots, OG share cards, richer TRAPUM metadata,
                                    and more instruments (or recommendation sections) without changing the overall UI language.
                                </>
                            }
                        />
                    </div>

                    <div className="lg:col-span-12">
                        <div className={cn("rounded-[28px] border p-6 sm:p-7", isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5")}>
                            <div className={cn("text-[11px] font-semibold tracking-[0.28em] uppercase", isDark ? "text-white/60" : "text-black/55")}>
                                What “done” looks like
                            </div>
                            <div className={cn("mt-3 text-sm sm:text-base leading-relaxed", isDark ? "text-white/70" : "text-black/70")}>
                                Real pulsar pool (100+), real fold images and metadata in the discovery panel, stable per-page targets, and a gallery +
                                recommendation system that stay easy to maintain — all while keeping the UI calm, bold, and instrument-like.
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <Pill theme={theme}>Real fold images</Pill>
                                <Pill theme={theme}>Binary-aware 3D panel</Pill>
                                <Pill theme={theme}>Share card</Pill>
                                <Pill theme={theme}>Deterministic page targets</Pill>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Footer-ish spacer */}
            <div className={cn("w-full", isDark ? "bg-black" : "bg-white")}>
                <div className="mx-auto max-w-[1600px] px-4 sm:px-8 pb-16">
                    <div className={cn("text-xs", isDark ? "text-white/55" : "text-black/55")}>
                        Last updated: when the site changes, this page should be edited like documentation.
                    </div>
                </div>
            </div>
        </div>
    );
}
