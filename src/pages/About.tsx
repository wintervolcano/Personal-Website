import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionShell } from "./SectionShell";
import type { Theme } from "../components/themeToggle";
import { cn } from "../lib/cn";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

type TimelineNode = {
  id: string;
  period: string;
  title: string;
  place: string;
  children?: { id: string; title: string }[];
};

const EDUCATION: TimelineNode[] = [
  {
    id: "PhD",
    period: "2024 — present",
    title: "PhD, Astronomy & Astrophysics",
    place: "Max Planck Institute for Radio Astronomy, Bonn",
    children: [
      {
        id: "phd-focus",
        title: "Pulsars in globular clusters • precision timing • tests of gravity",
      },
    ],
  },
  {
    id: "BS-MS Dual Degree",
    period: "2018 — 2023",
    title: "Master of Physics",
    place: "Indian Institute of Science Education and Research, Kolkata",
    children: [{ id: "degree-1-detail", title: "Eccentric binary supermassive black holes" }],
  },
];

const ORGS: TimelineNode[] = [
  {
    id: "mpifr",
    period: "2024 — present",
    title: "Doctoral researcher",
    place: "COMPACT Group, MPIfR Bonn",
    children: [
      {
        id: "mpifr-1",
        title: "Search for globular cluster pulsars • pulsar timing and tests of GR",
      },
    ],
  },
  {
    id: "org-1",
    period: "2022 — 2025",
    title: "Tier I member",
    place: "Indian Pulsar Timing Array",
    children: [{ id: "org-1-detail", title: "Pulsar timing arrays and GW searches" }],
  },
];

const INTERESTS: TimelineNode[] = [
  {
    id: "research-core",
    period: "Research",
    title: "Core interests",
    place: "Neutron stars, compact binaries, pulsar timing arrays, strong‑field gravity.",
    children: [
      { id: "int-1", title: "Globular cluster pulsars and binary dynamics" },
      { id: "int-2", title: "Precision timing and tests of general relativity" },
    ],
  },
  {
    id: "tools",
    period: "Tools",
    title: "Tools & pipelines",
    place: "Search‑mode visualisation, wideband pipelines, interactive notebooks.",
    children: [
      { id: "tools-1", title: "Building analysis tooling that scientists actually enjoy using" },
      { id: "tools-2", title: "End‑to‑end pipelines from backend to plots" },
    ],
  },
  {
    id: "hobbies",
    period: "Outside the telescope",
    title: "Hobbies",
    place: "Things that keep me curious (and sane).",
    children: [
      { id: "hob-1", title: "Photography and visual storytelling" },
      { id: "hob-2", title: "Teaching, mentoring, and writing about science" },
    ],
  },
];

// Black‑and‑white portrait + a couple of supporting images.
// Put these in public/about/… or swap to direct Google Photos image URLs.
const PORTRAIT_SRC = "/Fazal_image_cropped.jpeg";

const ABOUT_IMAGES: { id: string; src: string; alt: string }[] = [
  {
    id: "effelsberg",
    src: "/gallery/effelsberg-far.png",
    alt: "Effelsberg telescope from far away",
  },
  {
    id: "group-sardinia",
    src: "/gallery/sardinia-conference.png",
    alt: "MPIfR group at Pulsar 2025, Sardinia.",
  }
];

function TimelineTree({ theme, items }: { theme: Theme; items: TimelineNode[] }) {
  const isDark = theme === "dark";
  return (
    <div className="relative pl-7">
      <div
        className={cn(
          "absolute left-[10px] top-0 bottom-0 border-l",
          isDark ? "border-white/15" : "border-black/10"
        )}
      />
      <ul className="space-y-10">
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
                "text-xs sm:text-[12px] font-semibold tracking-[0.24em] uppercase",
                isDark ? "text-white/60" : "text-black/55"
              )}
            >
              {item.period}
            </div>
            <div
              className={cn(
                "mt-1 text-base font-semibold tracking-[-0.01em]",
                isDark ? "text-white" : "text-black"
              )}
            >
              {item.title}
            </div>
            <div className={cn("text-sm sm:text-base", isDark ? "text-white/65" : "text-black/65")}>
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
                    <div className={cn("text-sm", isDark ? "text-white/70" : "text-black/70")}>
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

export function About({ theme }: { theme: Theme }) {
  const navigate = useNavigate();
  const isDark = theme === "dark";

  return (
    <SectionShell
      theme={theme}
      eyebrow="About"
      title="Hi — I'm Fazal."
    >
      {/* Top row: narrative and portrait */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-7 xl:col-span-8 space-y-5 max-w-none">
          <p
            className={cn(
              "text-base sm:text-lg leading-relaxed max-w-[90ch]",
              isDark ? "text-white/70" : "text-black/70"
            )}
          >
            I’m a PhD researcher at Max Planck Institute for Radio Astronomy, Bonn, working with pulsars in globular clusters and
            compact binaries to probe gravity, build timing experiments, and design tools that make
            large, messy data feel approachable and even a little fun.
          </p>
          <p
            className={cn(
              "text-base sm:text-lg leading-relaxed max-w-[90ch]",
              isDark ? "text-white/70" : "text-black/70"
            )}
          >
            I’m interested in using precise pulsar timing to probe gravity in strong fields and to
            understand compact stellar systems. Most days I’m either staring at timing residuals,
            trying to rescue faint candidates from the noise, or tweaking tools so other people
            don’t have to fight their plots. I like treating software as part of the instrument: the
            right interface can make a complicated analysis feel like play, which is when you notice
            the interesting outliers.
          </p>
          <p
            className={cn(
              "text-base sm:text-lg leading-relaxed max-w-[90ch]",
              isDark ? "text-white/70" : "text-black/70"
            )}
          >
            Lately that has meant building end-to-end pulsar search pipelines, developing better timing methods,
            and small interactive tools for students and collaborators. I care as much about how a
            plot feels to explore as I do about the underlying statistics, because most discoveries
            start as a hunch when something on the screen looks just a little “off”.
          </p>
          <p
            className={cn(
              "text-base sm:text-lg leading-relaxed max-w-[90ch]",
              isDark ? "text-white/70" : "text-black/70"
            )}
          >
            This website is an experiment in treating a personal homepage like an instrument panel:
            part notebook, part control room. Search Mode, the blog, and the interactive pieces are
            all attempts to show how I think about data and experiments, not just to list outputs or
            papers.
          </p>

          <p
            className={cn(
              "mt-6 text-base sm:text-lg leading-relaxed max-w-[90ch]",
              isDark ? "text-white/70" : "text-black/70"
            )}
          >
            Outside of telescopes and terminals, I care a lot about music, stories, and movement. I
            sing almost all the time (ask me what's the song playing in my brain now and I will always have an answer), read fiction and non‑fiction in long streaks, and follow football and FC Barcelona a bit
            too closely for my own sleep schedule. Those things shape how I think about
            collaboration and attention just as much as the formal research does.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <motion.button
              onClick={() => navigate("/site-philosophy")}
              className={cn(
                "inline-flex items-center justify-center rounded-full px-6 py-3 sm:px-8 sm:py-3.5",
                "text-[11px] sm:text-xs font-semibold tracking-[0.22em] uppercase",
                "border transition-colors",
                isDark
                  ? "bg-white text-black border-white hover:bg-white/90"
                  : "bg-black text-white border-black hover:bg-black/90"
              )}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              data-nolock
            >
              Site philosophy
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </motion.button>
          
            <motion.button
              onClick={() => navigate("/personal-recommendations")}
              className={cn(
                "inline-flex items-center justify-center rounded-full px-6 py-3 sm:px-8 sm:py-3.5",
                "text-[11px] sm:text-xs font-semibold tracking-[0.22em] uppercase",
                "border transition-colors",
                isDark
                  ? "bg-transparent text-white border-white/60 hover:bg-white hover:text-black"
                  : "bg-transparent text-black border-black/70 hover:bg-black hover:text-white"
              )}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              data-nolock
            >
              Personal recommendations
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </motion.button>
          </div>
        </div>

        <div className="lg:col-span-5 xl:col-span-4 flex flex-col items-start lg:items-end gap-4">
          <motion.div
            className="relative w-full max-w-xs sm:max-w-sm lg:max-w-sm xl:max-w-md aspect-[4/5] rounded-3xl overflow-hidden border"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <img
              src={PORTRAIT_SRC}
              alt="Fazal Kareem"
              className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
            />
          </motion.div>
        </div>
      </div>

      {/* From the gallery */}
      <div
        className={cn(
          "mt-10 rounded-3xl border p-6 sm:p-8",
          isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div
              className={cn(
                "text-[12px] sm:text-xs font-semibold tracking-[0.28em] uppercase",
                isDark ? "text-white/60" : "text-black/55"
              )}
            >
              From the gallery
            </div>
            <div
              className={cn(
                "mt-2 text-sm sm:text-base leading-relaxed max-w-[60ch]",
                isDark ? "text-white/70" : "text-black/70"
              )}
            >
              A couple of recent frames from telescopes and conferences. The full gallery collects more
              snapshots from observing runs, coffee runs and legends.
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/gallery")}
            className={cn(
              "mt-2 inline-flex items-center justify-center rounded-full px-4 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase",
              isDark ? "border border-white/40 text-white/80 hover:bg-white/10" : "border border-black/40 text-black/80 hover:bg-black/5"
            )}
          >
            Open gallery
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ABOUT_IMAGES.map((img, i) => (
            <motion.div
              key={img.id}
              className="relative overflow-hidden rounded-2xl border aspect-[4/3]"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="h-full w-full object-cover grayscale hover:grayscale-0 hover:scale-[1.03] transition-all duration-500"
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Affiliations: education + organisations */}
      <div
        className={cn(
          "mt-12 rounded-3xl border p-6 sm:p-8",
          isDark ? "border-white bg-black" : "border-black bg-white"
        )}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <div
              className={cn(
                "text-xs sm:text-[12px] font-semibold tracking-[0.28em] uppercase",
                isDark ? "text-white/70" : "text-black/70"
              )}
            >
              Education
            </div>
            <div className="mt-4">
              <TimelineTree theme={theme} items={EDUCATION} />
            </div>
          </div>

          <div>
            <div
              className={cn(
                "text-xs sm:text-[12px] font-semibold tracking-[0.28em] uppercase",
                isDark ? "text-white/70" : "text-black/70"
              )}
            >
              Organisations & collaborations
            </div>
            <div className="mt-4">
              <TimelineTree theme={theme} items={ORGS} />
            </div>
          </div>
        </div>
      </div>

      {/* Core interests & hobbies as a second tree */}
      <div
        className={cn(
          "mt-10 rounded-3xl border p-6 sm:p-8",
          isDark ? "border-white bg-black" : "border-black bg-white"
        )}
      >
        <div
          className={cn(
            "text-xs sm:text-[12px] font-semibold tracking-[0.28em] uppercase",
            isDark ? "text-white/70" : "text-black/70"
          )}
        >
          Core interests & hobbies
        </div>
        <div className="mt-4">
          <TimelineTree theme={theme} items={INTERESTS} />
        </div>
      </div>
    </SectionShell>
  );
}
