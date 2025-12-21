import React from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import type { Theme } from "../components/themeToggle";
import type { MdDoc } from "../lib/content";
import { MarkdownProse } from "../components/MarkDownProse";
import { CardGrid } from "../components/CardGrid";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function ResourcePost({
  theme,
  docs,
}: {
  theme: Theme;
  docs: MdDoc[];
    }) {
    const navigate = useNavigate();
  const { slug } = useParams();
  const doc = docs.find((d) => d.slug === slug);
  const isDark = theme === "dark";


  return (
    <div className="w-full">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-8 pt-10 pb-20">
        <header className="mb-10">
          <div
            className={cn(
              "text-xs font-semibold tracking-[0.28em] uppercase",
              isDark ? "text-white/55" : "text-black/55"
            )}
          >
        Resources
    </div>

          <h1
            className={cn(
              "mt-3 text-4xl sm:text-6xl font-black tracking-[-0.04em]",
              isDark ? "text-white" : "text-black"
            )}
          >
            {doc.title}
          </h1>

          {doc.description ? (
            <p
              className={cn(
                "mt-4 text-base sm:text-lg leading-relaxed max-w-[75ch]",
                isDark ? "text-white/70" : "text-black/70"
              )}
            >
              {doc.description}
            </p>
          ) : null}
        </header>

        {/* Full control typography + link cards */}
        <MarkdownProse theme={theme} markdown={doc.body} />
      </div>
    </div>
  );
}