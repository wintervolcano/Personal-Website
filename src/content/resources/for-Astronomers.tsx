import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

type Theme = "light" | "dark";

function cn(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(" ");
}

function isExternal(href?: string) {
    if (!href) return false;
    return /^https?:\/\//i.test(href);
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

function TOCLink({ theme, href, label }: { theme: Theme; href: string; label: string }) {
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

function Card({ theme, title, body }: { theme: Theme; title: string; body: React.ReactNode }) {
    const isDark = theme === "dark";
    return (
        <motion.div
            className={cn(
                "h-full rounded-[28px] border p-6 sm:p-7",
                "flex flex-col",
                isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5"
            )}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 520, damping: 36 }}
        >
            <div className={cn("text-[11px] font-semibold tracking-[0.28em] uppercase", isDark ? "text-white/60" : "text-black/55")}>
                {title}
            </div>
            <div className={cn("mt-3 text-sm leading-relaxed", isDark ? "text-white/70" : "text-black/70")}>{body}</div>
            <div className="mt-auto" />
        </motion.div>
    );
}

function LinkCard({
    theme,
    href,
    title,
    desc,
}: {
    theme: Theme;
    href: string;
    title: string;
    desc?: string;
}) {
    const isDark = theme === "dark";
    return (
        <a
            href={href}
            target={isExternal(href) ? "_blank" : undefined}
            rel={isExternal(href) ? "noopener noreferrer" : undefined}
            className={cn(
                "group relative block h-full rounded-[28px] border p-6 sm:p-7 transition",
                "hover:-translate-y-0.5 hover:shadow-[0_18px_60px_rgba(0,0,0,0.12)]",
                isDark ? "border-white/12 bg-white/5 hover:bg-white/8" : "border-black/10 bg-black/5 hover:bg-black/7"
            )}
            data-nolock
        >
            <div
                className={cn(
                    "absolute inset-0 rounded-[28px] opacity-0 group-hover:opacity-100 transition",
                    isDark
                        ? "bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_45%),radial-gradient(circle_at_85%_0%,rgba(255,255,255,0.06),transparent_40%)]"
                        : "bg-[radial-gradient(circle_at_30%_20%,rgba(0,0,0,0.06),transparent_45%),radial-gradient(circle_at_85%_0%,rgba(0,0,0,0.04),transparent_40%)]"
                )}
            />
            <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                    <div className={cn("text-lg font-extrabold tracking-[-0.02em]", isDark ? "text-white" : "text-black")}>
                        {title}
                    </div>
                    <span
                        className={cn(
                            "shrink-0 inline-flex items-center gap-1 text-xs font-semibold tracking-[0.18em] uppercase",
                            isDark ? "text-white/70" : "text-black/60"
                        )}
                    >
                        Open <ArrowUpRight className="h-4 w-4" />
                    </span>
                </div>

                {desc ? (
                    <div className={cn("mt-2 text-sm leading-relaxed", isDark ? "text-white/70" : "text-black/65")}>{desc}</div>
                ) : null}

                <div className="mt-auto" />
                <div className={cn("mt-4 text-xs truncate", isDark ? "text-white/45" : "text-black/45")}>{href}</div>
            </div>
        </a>
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
                    <div className="lg:col-span-7">
                        <div className={cn("text-xs font-semibold tracking-[0.32em] uppercase", isDark ? "text-white/60" : "text-black/55")}>
                            {eyebrow}
                        </div>
                        <h2 className={cn("mt-4 text-4xl sm:text-6xl font-black tracking-[-0.04em]", isDark ? "text-white" : "text-black")}>
                            {title}
                        </h2>
                    </div>
                    <div className="lg:col-span-5">
                        <p className={cn("text-base sm:text-lg leading-relaxed", isDark ? "text-white/65" : "text-black/65")}>{subtitle}</p>
                    </div>
                </div>

                <div className="mt-10 sm:mt-12">{children}</div>
            </div>
        </section>
    );
}

export function ForAstronomers({ theme }: { theme: Theme }) {
    const isDark = theme === "dark";

    const heroLinks = [
        {
            title: "Pulsars in Globular Clusters (master list)",
            href: "https://www3.mpifr-bonn.mpg.de/staff/pfreire/GCpsr.html",
            desc: "Cluster-by-cluster tables, references, and a living overview of GC pulsars.",
        },
        {
            title: "Some useful sites (Freire)",
            href: "https://www3.mpifr-bonn.mpg.de/staff/pfreire/urls.html",
            desc: "Catalogues, surveys, follow-up tools, and publication workflow in one place.",
        },
        {
            title: "Pulsar Software Jungle",
            href: "https://alex88ridolfi.altervista.org/pagine/pulsar_software_jungle.html",
            desc: "A high-signal index of pulsar packages for searching, folding, archives, and timing.",
        },
    ];

    return (
        <div className={cn("w-full", isDark ? "bg-black" : "bg-white")}>
            {/* Header */}
            <section className={cn("w-full", isDark ? "bg-black" : "bg-white")}>
                <div className="mx-auto max-w-[1600px] px-4 sm:px-8 pt-8 pb-12 sm:pt-10 sm:pb-14">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
                        <div className="lg:col-span-8">
                            <div className={cn("text-xs font-semibold tracking-[0.32em] uppercase", isDark ? "text-white/60" : "text-black/55")}>
                                Resources • For astronomers
                            </div>
                            <h1 className={cn("mt-4 text-5xl sm:text-7xl font-black tracking-[-0.05em]", isDark ? "text-white" : "text-black")}>
                                Reference-grade links
                            </h1>
                            <p className={cn("mt-5 max-w-[85ch] text-base sm:text-lg leading-relaxed", isDark ? "text-white/65" : "text-black/65")}>
                                This page is meant to be “always open” during real work: catalogues, cross-match tools, survey discovery portals, and GC-specific
                                reference tables. Minimal prose, maximum signal.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-2">
                                <Pill theme={theme}>GC pulsars</Pill>
                                <Pill theme={theme}>Surveys</Pill>
                                <Pill theme={theme}>Counterparts</Pill>
                                <Pill theme={theme}>Publishing</Pill>
                            </div>
                        </div>

                        <div className="lg:col-span-4">
                            <div className={cn("rounded-[28px] border p-6 sm:p-7", isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5")}>
                                <div className={cn("text-[11px] font-semibold tracking-[0.28em] uppercase", isDark ? "text-white/60" : "text-black/55")}>
                                    Jump menu
                                </div>
                                <div className={cn("mt-3 text-sm leading-relaxed", isDark ? "text-white/70" : "text-black/70")}>
                                    Start with <span className={cn("font-semibold", isDark ? "text-white" : "text-black")}>GC pulsars</span> if you work in clusters,
                                    otherwise go straight to <span className={cn("font-semibold", isDark ? "text-white" : "text-black")}>Catalogues</span>.
                                </div>

                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <TOCLink theme={theme} href="#gc" label="GC pulsars" />
                                    <TOCLink theme={theme} href="#catalogs" label="Catalogues" />
                                    <TOCLink theme={theme} href="#followup" label="Follow-up" />
                                    <TOCLink theme={theme} href="#surveys" label="Surveys" />
                                    <TOCLink theme={theme} href="#software" label="Software" />
                                    <TOCLink theme={theme} href="#pub" label="Publishing" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-fr items-stretch">
                        {heroLinks.map((x) => (
                            <LinkCard key={x.href} theme={theme} href={x.href} title={x.title} desc={x.desc} />
                        ))}
                    </div>
                </div>
            </section>

            <Section
                theme={theme}
                id="gc"
                eyebrow="01 • globular clusters"
                title="Globular cluster pulsars"
                subtitle="The GC ecosystem is specialized enough that you want dedicated reference pages open while reading and writing."
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-fr items-stretch">
                    <div className="lg:col-span-7">
                        <LinkCard
                            theme={theme}
                            href="https://www3.mpifr-bonn.mpg.de/staff/pfreire/GCpsr.html"
                            title="GC pulsars master list"
                            desc="Cluster tables + references + a living snapshot of the field."
                        />
                    </div>
                    <div className="lg:col-span-5">
                        <Card
                            theme={theme}
                            title="How to use it"
                            body={
                                <>
                                    Use it for (1) attribution, (2) quick sanity checks, (3) population context, and (4) catching “already known” cases early.
                                    It’s also a great way to build intuition for what clusters tend to host which kinds of systems.
                                </>
                            }
                        />
                    </div>
                </div>
            </Section>

            <Section
                theme={theme}
                id="catalogs"
                eyebrow="02 • reference"
                title="Catalogues & lists"
                subtitle="When you need a definitive ‘what is known?’ answer, these links are the fastest route."
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-fr items-stretch">
                    <div className="lg:col-span-6">
                        <LinkCard
                            theme={theme}
                            href="https://www3.mpifr-bonn.mpg.de/staff/pfreire/urls.html"
                            title="Freire links: catalogues & lists"
                            desc="ATNF (+ psrqpy), magnetars, RRATs, gamma-ray pulsars, NS masses, Harris GCs, parallaxes, SNRs."
                        />
                    </div>
                    <div className="lg:col-span-6">
                        <Card
                            theme={theme}
                            title="Default habit"
                            body={
                                <>
                                    Build a 30-second check: catalogue → coordinates → counterpart → survey context → references.
                                    It keeps your interpretation anchored and prevents “plot-driven hallucinations.”
                                </>
                            }
                        />
                    </div>
                </div>
            </Section>

            <Section
                theme={theme}
                id="followup"
                eyebrow="03 • follow-up"
                title="Follow-up and counterparts"
                subtitle="Cross-identification tools you’ll use repeatedly: coordinate conversion, sky viewers, and multi-wavelength context."
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-fr items-stretch">
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Coordinates"
                            body={
                                <>
                                    Keep a coordinate converter handy, especially when jumping between survey formats or telescope conventions.
                                    (Freire’s page links a good one.)
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Finding counterparts"
                            body={
                                <>
                                    SIMBAD + Aladin are your bread-and-butter for “what’s at these coordinates?”.
                                    Add Gaia/SDSS when you need stellar context quickly.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="Gamma-ray context"
                            body={
                                <>
                                    For high-energy association checks, it’s useful to keep the Fermi catalog link close.
                                    It saves time when someone asks “could this be…?”
                                </>
                            }
                        />
                    </div>
                </div>
            </Section>

            <Section
                theme={theme}
                id="surveys"
                eyebrow="04 • discovery streams"
                title="Survey discovery portals"
                subtitle="A clean set of links for keeping up with new pulsars from major survey programs."
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-fr items-stretch">
                    <div className="lg:col-span-6">
                        <LinkCard
                            theme={theme}
                            href="https://www3.mpifr-bonn.mpg.de/staff/pfreire/urls.html"
                            title="Surveys & new pulsars (via Freire links)"
                            desc="FAST (GPPS/CRAFTS/GC survey), MeerKAT TRAPUM, GBNCC, LOFAR LOTAAS, Arecibo survey pages, and more."
                        />
                    </div>
                    <div className="lg:col-span-6">
                        <Card
                            theme={theme}
                            title="Why this matters"
                            body={
                                <>
                                    Discovery streams teach you the “shape” of announcements: naming, summary tables, confirmation standards, and common pitfalls.
                                    It’s also how you track overlap with your own search space.
                                </>
                            }
                        />
                    </div>
                </div>
            </Section>

            <Section
                theme={theme}
                id="software"
                eyebrow="05 • tooling"
                title="Software map"
                subtitle="Not a tutorial — a map. Use it when you hear a tool name and want to place it in the ecosystem instantly."
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-fr items-stretch">
                    <div className="lg:col-span-7">
                        <LinkCard
                            theme={theme}
                            href="https://alex88ridolfi.altervista.org/pagine/pulsar_software_jungle.html"
                            title="Pulsar Software Jungle"
                            desc="A curated index of pulsar software across searching, folding, archives, timing, and pipelines."
                        />
                    </div>
                    <div className="lg:col-span-5">
                        <Card
                            theme={theme}
                            title="Practical use"
                            body={
                                <>
                                    Use it to standardize your stack within a project: pick tools intentionally so your collaborators can reproduce your steps.
                                    This also helps you justify “why this tool?” in methods sections.
                                </>
                            }
                        />
                    </div>
                </div>
            </Section>

            <Section
                theme={theme}
                id="pub"
                eyebrow="06 • publishing"
                title="Publishing & staying current"
                subtitle="A small set of links that cover 90% of what you need for reading, writing, and submission."
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-fr items-stretch">
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="ADS"
                            body={<>Use ADS as the citation spine: search, bibtex, related works, and “who cited who” maps.</>}
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="arXiv"
                            body={<>For awareness and priority tracking. If you’re overwhelmed: one RSS filter is better than doomscrolling.</>}
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <Card
                            theme={theme}
                            title="ATel + community streams"
                            body={<>For fast transient context and quick community signals (especially when something “pops”).</>}
                        />
                    </div>
                </div>
            </Section>

            <div className={cn("w-full", isDark ? "bg-black" : "bg-white")}>
                <div className="mx-auto max-w-[1600px] px-4 sm:px-8 pb-16">
                    <div className={cn("text-xs", isDark ? "text-white/55" : "text-black/55")}>
                        Note: this page is intentionally “reference-first”. If you want, we can add a secondary “opinionated stack” panel (your preferred tools + why).
                    </div>
                </div>
            </div>
        </div>
    );
}