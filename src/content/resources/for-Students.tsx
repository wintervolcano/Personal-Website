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

export function ForStudents({ theme }: { theme: Theme }) {
  const isDark = theme === "dark";

  const quickLinks = [
    {
      title: "Pulsar Software Jungle",
      href: "https://alex88ridolfi.altervista.org/pagine/pulsar_software_jungle.html",
      desc: "A curated “map” of pulsar software (PRESTO, DSPSR, PSRCHIVE, tempo/tempo2, psrdada, and more).",
    },
    {
      title: "Some useful sites (Freire)",
      href: "https://www3.mpifr-bonn.mpg.de/staff/pfreire/urls.html",
      desc: "Follow-up tools, catalogues, survey portals, and the daily-driver astronomy links.",
    },
    {
      title: "Pulsars in Globular Clusters",
      href: "https://www3.mpifr-bonn.mpg.de/staff/pfreire/GCpsr.html",
      desc: "The master list of GC pulsars and references — invaluable once you start thinking in clusters.",
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
                Resources • For students
              </div>
              <h1 className={cn("mt-4 text-5xl sm:text-7xl font-black tracking-[-0.05em]", isDark ? "text-white" : "text-black")}>
                A clean starter kit
                <br />
                for pulsar work.
              </h1>
              <p className={cn("mt-5 max-w-[85ch] text-base sm:text-lg leading-relaxed", isDark ? "text-white/65" : "text-black/65")}>
                This page is optimized for first contact: “what tools exist?”, “what do I learn first?”, and “what do I click when I’m stuck?”.
                Everything here points back to the three canonical hubs you shared — just organized into a calm, instrument-like checklist.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <Pill theme={theme}>Beginner-first</Pill>
                <Pill theme={theme}>Software map</Pill>
                <Pill theme={theme}>Catalogues & follow-up</Pill>
                <Pill theme={theme}>Paper workflow</Pill>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className={cn("rounded-[28px] border p-6 sm:p-7", isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5")}>
                <div className={cn("text-[11px] font-semibold tracking-[0.28em] uppercase", isDark ? "text-white/60" : "text-black/55")}>
                  Reading guide
                </div>
                <div className={cn("mt-3 text-sm leading-relaxed", isDark ? "text-white/70" : "text-black/70")}>
                  If you only do two things today: open the <span className={cn("font-semibold", isDark ? "text-white" : "text-black")}>Software Jungle</span>{" "}
                  and bookmark <span className={cn("font-semibold", isDark ? "text-white" : "text-black")}>Some useful sites</span>.
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <TOCLink theme={theme} href="#start" label="Start here" />
                  <TOCLink theme={theme} href="#software" label="Software" />
                  <TOCLink theme={theme} href="#catalogs" label="Catalogues" />
                  <TOCLink theme={theme} href="#papers" label="Paper workflow" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-fr items-stretch">
            {quickLinks.map((x) => (
              <LinkCard key={x.href} theme={theme} href={x.href} title={x.title} desc={x.desc} />
            ))}
          </div>
        </div>
      </section>

      <Section
        theme={theme}
        id="start"
        eyebrow="01 • start"
        title="Start here"
        subtitle="A minimal path that gets you to ‘I can run tools and interpret outputs’ without drowning in options."
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-fr items-stretch">
          <div className="lg:col-span-4">
            <Card
              theme={theme}
              title="Learn the objects"
              body={
                <>
                  Know the basic taxonomy: normal pulsars vs MSPs, binaries, globular cluster populations, and why timing matters.
                  Then everything you see in plots starts to “snap into place.”
                </>
              }
            />
          </div>
          <div className="lg:col-span-4">
            <Card
              theme={theme}
              title="Learn the plots"
              body={
                <>
                  Build intuition for: folded profiles, sub-integration stability, frequency evolution, and what RFI looks like.
                  Plot literacy is your superpower.
                </>
              }
            />
          </div>
          <div className="lg:col-span-4">
            <Card
              theme={theme}
              title="Learn the workflow"
              body={
                <>
                  Search → candidate → fold → verify → (timing) → publish.
                  You don’t need to master every step on day one — but you do want the “map”.
                </>
              }
            />
          </div>
        </div>
      </Section>

      <Section
        theme={theme}
        id="software"
        eyebrow="02 • software"
        title="Software you’ll actually meet"
        subtitle="These are the tools that show up repeatedly in real pulsar work. Start with the map, then go deep as needed."
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-fr items-stretch">
          <div className="lg:col-span-6">
            <LinkCard
              theme={theme}
              href="https://alex88ridolfi.altervista.org/pagine/pulsar_software_jungle.html"
              title="Pulsar Software Jungle (curated map)"
              desc="A single page that lists the core packages (searching, folding, archives, timing) and how they relate."
            />
          </div>

          <div className="lg:col-span-6">
            <Card
              theme={theme}
              title="How to use the map"
              body={
                <>
                  Don’t try to install everything. Pick one “spine” (search or folding + archives), then add timing later.
                  The Jungle is best used as a reference index when you hear a new tool name in a meeting.
                </>
              }
            />
          </div>

          <div className="lg:col-span-4">
            <Card
              theme={theme}
              title="Search / candidates"
              body={
                <>
                  You’ll hear names like <span className="font-semibold">PRESTO</span> and related utilities for candidate sifting and diagnostics.
                  Treat these as “detection engines”.
                </>
              }
            />
          </div>
          <div className="lg:col-span-4">
            <Card
              theme={theme}
              title="Folding / archives"
              body={
                <>
                  Folding and archive inspection is where skepticism lives.
                  Tools like <span className="font-semibold">DSPSR</span> and <span className="font-semibold">PSRCHIVE</span> show up constantly.
                </>
              }
            />
          </div>
          <div className="lg:col-span-4">
            <Card
              theme={theme}
              title="Timing"
              body={
                <>
                  Timing packages (e.g. <span className="font-semibold">tempo / tempo2</span>) become relevant once you have stable detections.
                  Timing is where “cool plots” turn into physics.
                </>
              }
            />
          </div>
        </div>
      </Section>

      <Section
        theme={theme}
        id="catalogs"
        eyebrow="03 • reference"
        title="Catalogues & follow-up tools"
        subtitle="These links turn ‘I found something’ into ‘I can identify it, cross-match it, and contextualize it’."
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-fr items-stretch">
          <div className="lg:col-span-6">
            <LinkCard
              theme={theme}
              href="https://www3.mpifr-bonn.mpg.de/staff/pfreire/urls.html"
              title="Some useful sites (Freire)"
              desc="Coordinate tools, SIMBAD/Aladin, Gaia/SDSS, ATNF + psrqpy, survey discovery pages, and paper workflow links."
            />
          </div>

          <div className="lg:col-span-6">
            <LinkCard
              theme={theme}
              href="https://www3.mpifr-bonn.mpg.de/staff/pfreire/GCpsr.html"
              title="Pulsars in Globular Clusters"
              desc="The go-to list for globular cluster pulsars (plus references). Useful even when you’re ‘just browsing’ GC science."
            />
          </div>

          <div className="lg:col-span-4">
            <Card
              theme={theme}
              title="Cross-match habit"
              body={
                <>
                  The moment you see a candidate: check catalogues, look for counterparts, and confirm whether it’s already known.
                  This is the fastest way to stop reinventing the wheel.
                </>
              }
            />
          </div>
          <div className="lg:col-span-4">
            <Card
              theme={theme}
              title="Surveys as context"
              body={
                <>
                  Keep an eye on major survey discovery pages (FAST, MeerKAT/TRAPUM, GBNCC, LOFAR, etc.).
                  They’re great for learning what “real” discovery announcements look like.
                </>
              }
            />
          </div>
          <div className="lg:col-span-4">
            <Card
              theme={theme}
              title="GC work has its own ecosystem"
              body={
                <>
                  Once you’re in clusters: literature, naming, and discovery conventions matter.
                  The GC list becomes a constant open tab.
                </>
              }
            />
          </div>
        </div>
      </Section>

      <Section
        theme={theme}
        id="papers"
        eyebrow="04 • writing"
        title="Paper workflow that doesn’t hurt"
        subtitle="A practical, student-friendly way to stay current and write cleanly — without turning your life into tabs."
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-fr items-stretch">
          <div className="lg:col-span-4">
            <Card
              theme={theme}
              title="ADS + arXiv"
              body={
                <>
                  ADS for searching and citation hygiene; arXiv for daily awareness.
                  If you’re overwhelmed: track one keyword list and one collaboration list.
                </>
              }
            />
          </div>
          <div className="lg:col-span-4">
            <Card
              theme={theme}
              title="Overleaf"
              body={
                <>
                  Use Overleaf when you need collaboration speed. Otherwise: write locally + git for long-term sanity.
                </>
              }
            />
          </div>
          <div className="lg:col-span-4">
            <Card
              theme={theme}
              title="Journal targets"
              body={
                <>
                  Keep the “where do we submit?” question boring. Have 1–2 default journals per project type.
                  It reduces decision friction.
                </>
              }
            />
          </div>

          <div className="lg:col-span-12">
            <div className={cn("rounded-[28px] border p-6 sm:p-7", isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5")}>
              <div className={cn("text-[11px] font-semibold tracking-[0.28em] uppercase", isDark ? "text-white/60" : "text-black/55")}>
                One rule that helps
              </div>
              <div className={cn("mt-3 text-base sm:text-lg leading-relaxed", isDark ? "text-white/70" : "text-black/70")}>
                Keep a “lab notebook” log: what you tried, what changed, what worked, what you’re unsure about. This makes meetings and writing 10× easier.
              </div>
            </div>
          </div>
        </div>
      </Section>

      <div className={cn("w-full", isDark ? "bg-black" : "bg-white")}>
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8 pb-16">
          <div className={cn("text-xs", isDark ? "text-white/55" : "text-black/55")}>
            Tip: if you want this to become “interactive onboarding”, we can add a staged checklist with saved progress (localStorage) and “recommended next link”.
          </div>
        </div>
      </div>
    </div>
  );
}