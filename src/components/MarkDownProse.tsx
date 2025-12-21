import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUpRight } from "lucide-react";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

type Theme = "light" | "dark";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function isExternal(href?: string) {
  if (!href) return false;
  return /^https?:\/\//i.test(href);
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
        "group block rounded-2xl border p-5 transition",
        "hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)]",
        isDark ? "border-white/12 bg-white/5 hover:bg-white/8" : "border-black/10 bg-black/5 hover:bg-black/7"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition",
          isDark
            ? "bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_45%),radial-gradient(circle_at_85%_0%,rgba(255,255,255,0.06),transparent_40%)]"
            : "bg-[radial-gradient(circle_at_30%_20%,rgba(0,0,0,0.06),transparent_45%),radial-gradient(circle_at_85%_0%,rgba(0,0,0,0.04),transparent_40%)]"
        )}
        style={{ position: "absolute" }}
      />
      <div className="relative">
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

        <div className={cn("mt-3 text-xs truncate", isDark ? "text-white/45" : "text-black/45")}>{href}</div>
      </div>
    </a>
  );
}

function stripDashPrefix(s: string) {
  return s.replace(/^\s*(—|-|–)\s*/g, "").trim();
}

export function MarkdownProse({ theme, markdown }: { theme: Theme; markdown: string }) {
  const isDark = theme === "dark";

  return (
    <div
      className={cn(
        // Typography aligned to your site
        "leading-relaxed",
        isDark ? "text-white/80" : "text-black/75"
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className={cn("text-4xl sm:text-6xl font-black tracking-[-0.04em] mt-2", isDark ? "text-white" : "text-black")}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className={cn("text-2xl sm:text-3xl font-extrabold tracking-[-0.02em] mt-10 mb-3", isDark ? "text-white" : "text-black")}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={cn("text-xl font-extrabold mt-8 mb-2", isDark ? "text-white" : "text-black")}>{children}</h3>
          ),
          p: ({ node, children }) => {
            // If the paragraph is ONLY a single link (or bare URL), render a card
            const n: any = node;
            const kids = n?.children || [];
            if (kids.length === 1 && kids[0]?.type === "link") {
              const href = kids[0]?.url as string;
              const title =
                kids[0]?.children?.[0]?.value ||
                (typeof children?.[0] === "string" ? String(children[0]) : href);
              return (
                <div className="my-4">
                  <LinkCard theme={theme} href={href} title={String(title)} />
                </div>
              );
            }
            if (kids.length === 1 && kids[0]?.type === "text") {
              const txt = String(kids[0]?.value || "").trim();
              if (/^https?:\/\//i.test(txt)) {
                return (
                  <div className="my-4">
                    <LinkCard theme={theme} href={txt} title={txt.replace(/^https?:\/\//i, "")} />
                  </div>
                );
              }
            }
            return <p className="mt-3">{children}</p>;
          },
          ul: ({ children }) => <ul className="mt-4 grid gap-3">{children}</ul>,
          li: ({ node, children }) => {
            // Turn "- [Title](url) — desc" into a card
            const n: any = node;
            const kids = n?.children || [];

            const first = kids[0];
            const second = kids[1];

            if (first?.type === "link") {
              const href = first.url as string;
              const title =
                first?.children?.[0]?.value ||
                (typeof children?.[0] === "string" ? String(children[0]) : href);

              const desc =
                second?.type === "text"
                  ? stripDashPrefix(String(second.value || ""))
                  : undefined;

              return (
                <li>
                  <LinkCard theme={theme} href={href} title={String(title)} desc={desc} />
                </li>
              );
            }

            // Default list item
            return (
              <li className={cn("list-none rounded-xl px-4 py-3 border", isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5")}>
                {children}
              </li>
            );
          },
          a: ({ href, children }) => (
            <a
              href={href}
              target={isExternal(href) ? "_blank" : undefined}
              rel={isExternal(href) ? "noopener noreferrer" : undefined}
              className={cn(
                "font-semibold underline underline-offset-4 decoration-2",
                isDark ? "text-white hover:decoration-white/70" : "text-black hover:decoration-black/50"
              )}
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className={cn(
                "mt-6 rounded-2xl border px-5 py-4",
                isDark ? "border-white/12 bg-white/5 text-white/75" : "border-black/10 bg-black/5 text-black/70"
              )}
            >
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[0.95em]",
                isDark ? "bg-white/10 text-white/85" : "bg-black/10 text-black/85"
              )}
            >
              {children}
            </code>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}