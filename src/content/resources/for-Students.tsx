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

export function ForStudents({ theme }: { theme: Theme }) {
  const isDark = theme === "dark";

  // const quickLinks = [
  //   {
  //     title: "Pulsar Software Jungle",
  //     href: "https://alex88ridolfi.altervista.org/pagine/pulsar_software_jungle.html",
  //     desc: "A curated “map” of pulsar software (PRESTO, DSPSR, PSRCHIVE, tempo/tempo2, psrdada, and more).",
  //   },
  //   {
  //     title: "Some useful sites (Freire)",
  //     href: "https://www3.mpifr-bonn.mpg.de/staff/pfreire/urls.html",
  //     desc: "Follow-up tools, catalogues, survey portals, and the daily-driver astronomy links.",
  //   },
  //   {
  //     title: "Pulsars in Globular Clusters",
  //     href: "https://www3.mpifr-bonn.mpg.de/staff/pfreire/GCpsr.html",
  //     desc: "The master list of GC pulsars and references — invaluable once you start thinking in clusters.",
  //   },
  // ];

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
                Learn pulsar astronomy
                <br />
                from first pulses up.
              </h1>
              <p className={cn("mt-5 max-w-[85ch] text-base sm:text-lg leading-relaxed", isDark ? "text-white/65" : "text-black/65")}>
                This page is a gentle introduction to pulsar astronomy. It is meant for students who are curious about neutron stars and radio
                astronomy, and who want to understand the ideas behind the plots and software; not just follow a recipe.
                You can treat it as a small handbook: start with the concepts, then move into signals, tools, and project ideas.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <Pill theme={theme}>Concepts first</Pill>
                <Pill theme={theme}>Signals & plots</Pill>
                <Pill theme={theme}>Hands-on tools</Pill>
                <Pill theme={theme}>Projects & reading</Pill>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className={cn("rounded-[28px] border p-6 sm:p-7", isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5")}>
                <div className={cn("text-[11px] font-semibold tracking-[0.28em] uppercase", isDark ? "text-white/60" : "text-black/55")}>
                  How to use this page
                </div>
                <div className={cn("mt-3 text-sm leading-relaxed", isDark ? "text-white/70" : "text-black/70")}>
                  If you&apos;re new, read the{" "}
                  <span className={cn("font-semibold", isDark ? "text-white" : "text-black")}>Start here</span> section slowly and sketch the ideas.
                  When you start research, come back for the software and catalogue links, they become more useful once the physics is familiar.
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <TOCLink theme={theme} href="#start" label="Start here" />
                  <TOCLink theme={theme} href="#software" label="Signals & tools" />
                  <TOCLink theme={theme} href="#catalogs" label="Where pulsars live" />
                  <TOCLink theme={theme} href="#papers" label="Reading & projects" />
                </div>
              </div>
            </div>
          </div>

          {/* <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-fr items-stretch">
            {quickLinks.map((x) => (
              <LinkCard key={x.href} theme={theme} href={x.href} title={x.title} desc={x.desc} />
            ))}
          </div> */}
        </div>
      </section>

      <Section
        theme={theme}
        id="start"
        eyebrow="01 • start"
        title="Pulsars in three questions"
        subtitle="A conceptual first pass through what pulsars are, why they are interesting, and what we actually measure."
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-fr items-stretch">
          <div className="lg:col-span-4">
            <Card
              theme={theme}
              title="What is a pulsar?"
              body={
                <>
                  A pulsar is a rapidly rotating, magnetised neutron star whose radio beam sweeps past us like a lighthouse.
                  They are born in supernovae and pack more mass than the Sun into a city-sized object. Understanding this picture is the base
                  for everything else.
                </>
              }
            />
          </div>
          <div className="lg:col-span-4">
            <Card
              theme={theme}
              title="Why do we care?"
              body={
                <>
                  Pulsars are exquisite clocks and extreme physics laboratories. We use them to probe binary dynamics, the interstellar medium,
                  globular clusters, and even nanohertz gravitational waves. When you look at a timing plot, you are looking straight at gravity
                  and plasma.
                </>
              }
            />
          </div>
          <div className="lg:col-span-4">
            <Card
              theme={theme}
              title="What do we actually measure?"
              body={
                <>
                  Observers measure times-of-arrival of pulses, dispersion measures (how much the pulse is delayed by free electrons),
                  pulse profiles, and how these change with time and frequency. Almost every piece of software you will meet exists to
                  measure these things more precisely.
                </>
              }
            />
          </div>
        </div>
      </Section>

      <Section
        theme={theme}
        id="software"
        eyebrow="02 • signals"
        title="From telescope to plot"
        subtitle="How raw voltages from a telescope become the folded profiles and diagnostic panels you see in talks and papers."
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-fr items-stretch">
          <div className="lg:col-span-6">
            <LinkCard
              theme={theme}
              href="https://alex88ridolfi.altervista.org/pagine/pulsar_software_jungle.html"
              title="Pulsar Software Jungle (overview)"
              desc="Once you know what the steps are, this map tells you which packages handle which part of the chain."
            />
          </div>

          <div className="lg:col-span-6">
            <Card
              theme={theme}
              title="Signal chain in words"
              body={
                <>
                  Telescope → voltage time series → channelisation and dedispersion → search for periodicity → fold at a trial period →
                  clean, stable pulse profile. When you look at a PRESTO or PSRCHIVE panel, you are seeing these operations stacked on top of
                  one another.
                </>
              }
            />
          </div>

          <div className="lg:col-span-4">
            <Card
              theme={theme}
              title="Search and candidates"
              body={
                <>
                  Search codes (for example <span className="font-semibold">PRESTO</span>) take the time series and ask
                  “is there a repeating pattern here?”. They produce diagnostic plots for thousands of candidates. Your job is to learn what
                  looks like a real pulsar and what looks like radio-frequency interference.
                </>
              }
            />
          </div>
          <div className="lg:col-span-4">
            <Card
              theme={theme}
              title="Folding and inspection"
              body={
                <>
                  Folding tools such as <span className="font-semibold">DSPSR</span> and archive toolkits like{" "}
                  <span className="font-semibold">PSRCHIVE</span> convert promising candidates into high signal-to-noise profiles.
                  This is where you build discipline about signal quality and learn to distrust pretty but suspicious plots.
                </>
              }
            />
          </div>
          <div className="lg:col-span-4">
            <Card
              theme={theme}
              title="Timing and physics"
              body={
                <>
                  Timing packages (e.g. <span className="font-semibold">tempo / tempo2</span>) model pulse arrival times with exquisite precision.
                  This is where measurements of binary orbits, gravitational-wave backgrounds, and tests of gravity actually happen.
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
        title="Where pulsars live"
        subtitle="Catalogues and globular-cluster lists that help you place a single pulsar into the bigger astrophysical picture."
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-fr items-stretch">
          <div className="lg:col-span-6">
            <LinkCard
              theme={theme}
              href="https://www3.mpifr-bonn.mpg.de/staff/pfreire/urls.html"
              title="Some useful sites (Freire)"
              desc="Coordinate tools, SIMBAD/Aladin, Gaia/SDSS, ATNF + psrqpy, survey discovery pages, and more — the daily driver page for pulsar work."
            />
          </div>

          <div className="lg:col-span-6">
            <LinkCard
              theme={theme}
              href="https://www3.mpifr-bonn.mpg.de/staff/pfreire/GCpsr.html"
              title="Pulsars in Globular Clusters"
              desc="A living list of globular-cluster pulsars and references. Essential if you care about dense stellar systems, dynamics, and multi-pulsar clusters."
            />
          </div>

          <div className="lg:col-span-4">
            <Card
              theme={theme}
              title="Catalogues as a habit"
              body={
                <>
                  When you see a new candidate, immediately ask: is this in a catalogue already? Is it in a cluster? Is there a counterpart at
                  other wavelengths? Getting into the habit of checking catalogues makes you much faster and prevents rediscoveries.
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
                  Reading the short discovery notes is a light-weight way to learn which systems excite the community and why.
                </>
              }
            />
          </div>
          <div className="lg:col-span-4">
            <Card
              theme={theme}
              title="Globular clusters as laboratories"
              body={
                <>
                  Globular clusters are dense stellar environments with rich pulsar populations.
                  Once you work in clusters, the GC list and its references become a constant open tab and a guide to the literature.
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
        title="Reading, writing, and small projects"
        subtitle="How to stay in touch with the literature and grow from ‘I read a paper’ to ‘I can design a small pulsar project’."
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-fr items-stretch">
          <div className="lg:col-span-4">
            <Card
              theme={theme}
              title="ADS + arXiv"
              body={
                <>
                  ADS is the search engine and citation manager for astronomy papers; arXiv is the daily news feed.
                  If you feel overwhelmed, follow one keyword (e.g. &quot;pulsar timing&quot;) and one collaboration (e.g. &quot;EPTA/NANOGrav&quot;).
                </>
              }
            />
          </div>
          <div className="lg:col-span-4">
            <Card
              theme={theme}
              title="Writing tools"
              body={
                <>
                  For your first paper or report, tools like Overleaf are convenient for collaboration. As projects grow, writing locally with
                  version control becomes invaluable — especially when you revisit work years later.
                </>
              }
            />
          </div>
          <div className="lg:col-span-4">
            <Card
              theme={theme}
              title="Small project ideas"
              body={
                <>
                  Recreate a discovery plot from a published paper; explore how dispersion smears a pulse as you vary DM; or use a public timing
                  dataset to fit a simple model. Small, focused projects build intuition much faster than only reading. But if you would like to get a reading project, ask your advisor or mail me!
                </>
              }
            />
          </div>

          <div className="lg:col-span-12">
            {/* <div className={cn("rounded-[28px] border p-6 sm:p-7", isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5")}> */}
            {/* <div className={cn("text-[11px] font-semibold tracking-[0.28em] uppercase", isDark ? "text-white/60" : "text-black/55")}>
                One habit that helps
              </div> */}
              <div className={cn("mt-3 text-base sm:text-lg leading-relaxed", isDark ? "text-white/70" : "text-black/70")}>
                <LinkCard
                  theme={theme}
                  href=""
                  title="My Obsidian Method"
                  desc="Keep a notebook: what you tried, what changed, what worked, and what you&apos;re unsure about. It makes meetings, debugging,
                and writing dramatically easier — and turns your learning process into something you can review and improve. I use Obsidian to do this. If you want to read more about my notetaking method, check out this blog post."
                />
              {/* </div> */}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
