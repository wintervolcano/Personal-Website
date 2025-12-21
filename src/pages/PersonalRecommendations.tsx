import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionShell } from "./SectionShell";
import type { Theme } from "../components/themeToggle";
import { cn } from "../lib/cn";
import { ArrowUpRight } from "lucide-react";

type RecItem = {
  title: string;
  creator?: string;
  meta?: string;
  note?: string;
  href?: string;
};

const READING_RECS: RecItem[] = [
  {
    title: "Wuthering Heights",
    creator: "Emily Brontë",
    meta: "fiction • favourite",
    note: "The intense relationship between the gypsy foundling Heathcliff and Catherine Earnshaw, my all time favourite fiction.",
    href: "https://www.goodreads.com/book/show/32929156-wuthering-heights",
  },
  {
    title: "The God delusion",
    creator: "Richard Dawkins",
    meta: "non-fiction • finished",
    note: "Truth is, I agree with him. Mostly.",
    href: "https://www.goodreads.com/book/show/14743.The_God_Delusion",
  },
];

const FILM_MUSIC_RECS: RecItem[] = [
  {
    title: "Interstellar",
    creator: "Christopher Nolan / 2014",
    meta: "film • All time Favourite",
    note: "I'm naming my fictional daughter Murphy, and I'll give her a watch.",
    href: "https://www.imdb.com/title/tt0816692/",
  },
  {
    title: "Black",
    creator: "Pearl Jam",
    meta: "Song • work playlist",
    note: "Rock peaked here for me",
    href: "https://open.spotify.com/track/5Xak5fmy089t0FYmh3VJiY?si=b683af33454143c3",
  },
];

const FOOTBALL_MISC_RECS: RecItem[] = [
  {
    title: "FC Barcelona",
    meta: "football club",
    note: "The team I yell for on weekends; Visca Barca! And Messi is the GOAT. I want to one day stand in the stands of Nou Camp and sing 'Messi, Messi, Messi' as the 10th minute strikes."
  },
];

function RecSection({
  theme,
  heading,
  intro,
  items,
}: {
  theme: Theme;
  heading: string;
  intro: string;
  items: RecItem[];
}) {
  const isDark = theme === "dark";
  return (
    <div className="space-y-4">
      <h3
        className={cn(
          "text-sm font-semibold tracking-[0.16em] uppercase",
          isDark ? "text-white/70" : "text-black/70"
        )}
      >
        {heading}
      </h3>
      <p
        className={cn(
          "text-sm sm:text-base leading-relaxed",
          isDark ? "text-white/70" : "text-black/70"
        )}
      >
        {intro}
      </p>
      <div className="grid grid-cols-1 gap-3 auto-rows-fr">
        {items.map((item) => {
          const key = `${heading}:${item.title}:${item.meta ?? ""}`;
          const baseClasses = cn(
            "group block h-30 sm:h-35 rounded-2xl border px-3 py-3 sm:px-4 sm:py-3.5 transition-colors",
            isDark
              ? "border-white/12 bg-white/5 hover:border-white/40 hover:bg-white/10"
              : "border-black/10 bg-black/5 hover:border-black/40 hover:bg-black/10"
          );

          const content = (
            <>
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="text-sm font-semibold tracking-[-0.01em]">
                    {item.title}
                  </div>
                  {item.href ? (
                    <ArrowUpRight
                      className={cn(
                        "h-3 w-3 opacity-60 transition-opacity group-hover:opacity-100",
                        isDark ? "text-white" : "text-black"
                      )}
                    />
                  ) : null}
                </div>
                {item.meta ? (
                  <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-white/55 dark:text-black/55">
                    {item.meta}
                  </div>
                ) : null}
              </div>
              {item.creator ? (
                <div className={cn("mt-0.5 text-xs", isDark ? "text-white/65" : "text-black/65")}>
                  {item.creator}
                </div>
              ) : null}
              {item.note ? (
                <div
                  className={cn(
                    "mt-1 text-xs sm:text-[13px] leading-relaxed",
                    isDark ? "text-white/70" : "text-black/70"
                  )}
                >
                  {item.note}
                </div>
              ) : null}
              {item.href ? (
                <div
                  className={cn(
                    "mt-2 text-[10px] font-semibold tracking-[0.18em] uppercase",
                    isDark ? "text-white/60" : "text-black/60"
                  )}
                >
                  Tap to open • opens in new tab
                </div>
              ) : null}
            </>
          );

          if (item.href) {
            return (
              <a
                key={key}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className={cn(baseClasses, "cursor-pointer")}
              >
                {content}
              </a>
            );
          }

          return (
            <div key={key} className={baseClasses}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PersonalRecommendations({ theme }: { theme: Theme }) {
  const isDark = theme === "dark";
  const navigate = useNavigate();

  return (
    <SectionShell
      theme={theme}
      eyebrow="Personal"
      title="Books, films, and other obsessions"
      subtitle="A loosely curated shelf of things I keep coming back to — stories, records, matches, and ideas that shape how I think about science and people."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
        <RecSection
          theme={theme}
          heading="Reading"
          intro="This is where I’ll keep a running log of the books that left a mark — a mix of science writing, fiction, and essays. I’ll update it over time as I finish new things."
          items={READING_RECS}
        />

        <RecSection
          theme={theme}
          heading="Film & music"
          intro="A short list of films, albums, and live sets that I keep looping through while working or travelling — some quiet, some loud enough for debugging marathons."
          items={FILM_MUSIC_RECS}
        />

        <RecSection
          theme={theme}
          heading="Football & misc."
          intro="Because no recommendation list is complete without a team to yell for: clubs, matches, and a few other small obsessions that don’t quite fit anywhere else."
          items={FOOTBALL_MISC_RECS}
        />
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={() => navigate("/about")}
          className={cn(
            "inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase",
            isDark ? "border-white/40 text-white/80 hover:bg-white/10" : "border-black/40 text-black/80 hover:bg-black/5"
          )}
        >
          Back to about
        </button>
      </div>
    </SectionShell>
  );
}
