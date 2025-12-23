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
            <div
                className={cn(
                    "mt-3 text-[0.95rem] sm:text-base leading-relaxed",
                    isDark ? "text-white/70" : "text-black/70"
                )}
            >
                {body}
            </div>
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
                    <div
                        className={cn(
                            "mt-2 text-[0.95rem] sm:text-base leading-relaxed",
                            isDark ? "text-white/70" : "text-black/65"
                        )}
                    >
                        {desc}
                    </div>
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

    type LinkRow = {
        area: string;
        label: string;
        href: string;
        what: string;
        notes?: string;
    };

    const links: LinkRow[] = [
        {
            area: "Globular clusters",
            label: "Pulsars in Globular Clusters (Freire)",
            href: "https://www3.mpifr-bonn.mpg.de/staff/pfreire/GCpsr.html",
            what: "Living list of GC pulsars with basic parameters and references.",
            notes: "Keep open whenever you work on clusters or need quick context for a GC system.",
        },
        {
            area: "Catalogues & reference",
            label: "Some useful sites (Freire)",
            href: "https://www3.mpifr-bonn.mpg.de/staff/pfreire/urls.html",
            what: "Jump page to ATNF, magnetars, RRATs, NS masses, SNRs, GC catalogues, survey links and more.",
            notes: "Good default homepage; most other links here can be reached from this hub.",
        },
        {
            area: "Survey discovery streams",
            label: "Survey & new pulsar links (via Freire)",
            href: "https://www3.mpifr-bonn.mpg.de/staff/pfreire/urls.html#surveys",
            what: "FAST, MeerKAT/TRAPUM, GBNCC, LOFAR and other survey discovery pages.",
            notes: "Quick way to see if similar systems have appeared in another survey.",
        },
        {
            area: "Software map",
            label: "Pulsar Software Jungle",
            href: "https://alex88ridolfi.altervista.org/pagine/pulsar_software_jungle.html",
            what: "Curated index of search, folding, archive, timing and pipeline tools.",
            notes: "Use it as a map, not a to‑do list; great for placing a new package in context.",
        },
        {
            area: "Catalogues & tools",
            label: "ATNF Pulsar Catalogue",
            href: "https://www.atnf.csiro.au/research/pulsar/psrcat/",
            what: "Canonical pulsar catalogue with powerful query interface.",
            notes: "Often accessed via psrqpy in scripts; the web UI is still handy for quick checks.",
        },
        {
            area: "Catalogues & tools",
            label: "psrqpy",
            href: "https://psrqpy.readthedocs.io/",
            what: "Python interface for querying ATNF from notebooks and scripts.",
            notes: "Ideal for reproducible tables and parameter pulls in analysis notebooks.",
        },
        {
            area: "Counterparts & imaging",
            label: "SIMBAD",
            href: "https://simbad.u-strasbg.fr/simbad/",
            what: "Object database for quick counterpart checks at given coordinates.",
            notes: "First stop when you want to know “what is already here?” in other wavebands.",
        },
        {
            area: "Counterparts & imaging",
            label: "Aladin (Lite / Desktop)",
            href: "https://aladin.u-strasbg.fr/",
            what: "Interactive sky viewer and overlay tool.",
            notes: "Great for visual sanity checks, nearby sources and field morphology.",
        },
        {
            area: "Counterparts & imaging",
            label: "Gaia archive",
            href: "https://gea.esac.esa.int/archive/",
            what: "Optical astrometry and photometry for stars near your pulsar.",
            notes: "Useful for companions, cluster membership or nearby stellar populations.",
        },
        {
            area: "Timing & ephemerides",
            label: "TEMPO2",
            href: "https://bitbucket.org/psrsoft/tempo2/src/master/",
            what: "Widely used pulsar timing package.",
            notes: "Many PTA/timing pipelines still assume familiarity with TEMPO2 conventions.",
        },
        {
            area: "Timing & ephemerides",
            label: "libstempo",
            href: "https://github.com/vallis/libstempo",
            what: "Python interface to TEMPO2 for scripting and analysis.",
            notes: "Keeps timing analysis reproducible in notebooks.",
        },
        {
            area: "Literature & publishing",
            label: "ADS",
            href: "https://ui.adsabs.harvard.edu/",
            what: "Search engine, citation graph and library for astronomy papers.",
            notes: "Treat it as your central spine for references and “who cited who?”.",
        },
        {
            area: "Literature & publishing",
            label: "arXiv astro-ph",
            href: "https://arxiv.org/list/astro-ph/new",
            what: "Daily preprint feed for astrophysics.",
            notes: "Set up one or two filters instead of doomscrolling the full firehose.",
        },
        {
            area: "Literature & publishing",
            label: "ATel",
            href: "https://www.astronomerstelegram.org/",
            what: "Astronomer’s Telegram for fast transient and follow‑up notices.",
            notes: "Good situational awareness when something in your parameter space is going off.",
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
                                One-page link console
                            </h1>
                            <p className={cn("mt-5 max-w-[85ch] text-base sm:text-lg leading-relaxed", isDark ? "text-white/65" : "text-black/65")}>
                                Instead of repeating the same URLs under different headings, this page gives you a single, dense list of
                                links you&apos;re likely to keep open while working: catalogues, survey pages, counterpart tools, timing
                                software, and literature hubs.
                            </p>
                        </div>

                        <div className="lg:col-span-4">
                            <div className={cn("rounded-[28px] border p-6 sm:p-7", isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5")}>
                                <div className={cn("text-[11px] font-semibold tracking-[0.28em] uppercase", isDark ? "text-white/60" : "text-black/55")}>
                                    How to use this
                                </div>
                                <div className={cn("mt-3 text-sm leading-relaxed", isDark ? "text-white/70" : "text-black/70")}>
                                    Scan the left column for the area you care about (clusters, surveys, counterparts, timing, publishing),
                                    then open the relevant rows in new tabs. The goal is a compact “links console” you can park on a second
                                    monitor during analysis or paper writing.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Single table of links */}
            <section className={cn("w-full", isDark ? "bg-black" : "bg-white")}>
                <div className="mx-auto max-w-[1600px] px-4 sm:px-8 pb-16">
                    <div className="overflow-x-auto rounded-[24px] border">
                        <table
                            className={cn(
                                "min-w-full border-collapse text-[0.95rem]",
                                isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5"
                            )}
                        >
                            <thead className={isDark ? "bg-white/10" : "bg-black/5"}>
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs sm:text-[0.8rem] font-semibold tracking-[0.16em] uppercase">
                                        Area
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs sm:text-[0.8rem] font-semibold tracking-[0.16em] uppercase">
                                        Link
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs sm:text-[0.8rem] font-semibold tracking-[0.16em] uppercase">
                                        What you use it for
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs sm:text-[0.8rem] font-semibold tracking-[0.16em] uppercase">
                                        Notes
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {links.map((row, idx) => (
                                    <tr
                                        key={row.label}
                                        className={cn(
                                            idx !== links.length - 1 ? (isDark ? "border-b border-white/10" : "border-b border-black/10") : "",
                                            idx % 2 === 1 ? (isDark ? "bg-white/5" : "bg-black/5") : ""
                                        )}
                                    >
                                        <td className="px-4 py-3 align-top text-[0.85rem] sm:text-[0.9rem] font-semibold tracking-[0.12em] uppercase whitespace-nowrap">
                                            {row.area}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <a
                                                href={row.href}
                                                target={isExternal(row.href) ? "_blank" : undefined}
                                                rel={isExternal(row.href) ? "noopener noreferrer" : undefined}
                                                className={cn(
                                                    "inline-flex items-center gap-1 font-semibold underline underline-offset-4 decoration-2",
                                                    isDark ? "text-white hover:decoration-white/70" : "text-black hover:decoration-black/50"
                                                )}
                                                data-nolock
                                            >
                                                {row.label}
                                            </a>
                                            <div className={cn("mt-1 text-xs break-all", isDark ? "text-white/55" : "text-black/55")}>{row.href}</div>
                                        </td>
                                        <td className={cn("px-4 py-3 align-top text-[0.95rem] sm:text-base", isDark ? "text-white/80" : "text-black/80")}>
                                            {row.what}
                                        </td>
                                        <td className={cn("px-4 py-3 align-top text-[0.85rem] sm:text-[0.95rem]", isDark ? "text-white/65" : "text-black/65")}>
                                            {row.notes || "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}
