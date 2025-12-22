import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { Theme } from "../components/themeToggle";
import type { MdDoc } from "../lib/content";
import { cn } from "../lib/cn";

export default function ProjectsPost({
    theme,
    posts,
}: {
    theme: Theme;
    posts: MdDoc[];
}) {
    const isDark = theme === "dark";
    const { slug } = useParams();

    const post = useMemo(() => posts.find((p) => p.slug === slug), [posts, slug]);

    if (!post) {
        return (
            <section className={cn("min-h-[100svh] w-full px-4 sm:px-8 pt-28 pb-20", isDark ? "bg-black text-white" : "bg-white text-black")}>
                <div className="mx-auto max-w-[1100px]">
                    <div className={cn("text-xs font-semibold tracking-[0.28em] uppercase", isDark ? "text-white/55" : "text-black/55")}>
                        Projects
                    </div>
                    <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-[-0.04em]">Post not found</h1>
                    <Link
                        to="/projects"
                        className={cn(
                            "mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase",
                            isDark ? "border-white/15 bg-white/5 text-white/80 hover:bg-white/10" : "border-black/10 bg-black/5 text-black/70 hover:bg-black/10"
                        )}
                    >
                        ← Back to projects
                    </Link>
                </div>
            </section>
        );
    }

    // IMPORTANT: render the actual markdown from whichever field your loader uses.
    // In your Blog list you used `d.body`, so this will work even if `content` is undefined.
    const markdown =
        (post as any).body ??
        (post as any).content ??
        (post as any).markdown ??
        (post as any).raw ??
        "";

    return (
        <section className={cn("min-h-[100svh] w-full px-4 sm:px-8 pt-28 pb-20", isDark ? "bg-black text-white" : "bg-white text-black")}>
            <div className="mx-auto max-w-[1100px]">
                <div className="flex items-center justify-between gap-4">
                    <Link
                        to="/projects"
                        className={cn(
                            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase",
                            isDark ? "border-white/15 bg-white/5 text-white/80 hover:bg-white/10" : "border-black/10 bg-black/5 text-black/70 hover:bg-black/10"
                        )}
                    >
                        ← Back
                    </Link>

                    <div className={cn("text-xs font-semibold tracking-[0.28em] uppercase", isDark ? "text-white/55" : "text-black/55")}>
                        {(post as any).date ?? ""}
                    </div>
                </div>

                <h1 className="mt-8 text-4xl sm:text-6xl font-black tracking-[-0.05em] leading-[0.92]">
                    {(post as any).title ?? post.slug}
                </h1>

                {(post as any).description ? (
                    <p className={cn("mt-5 text-base sm:text-lg leading-relaxed", isDark ? "text-white/70" : "text-black/65")}>
                        {(post as any).description}
                    </p>
                ) : null}

                <div className={cn("mt-10 h-px w-full", isDark ? "bg-white/10" : "bg-black/10")} />

                {/* Markdown body */}
                <article className={cn("mt-10", isDark ? "text-white/75" : "text-black/70")}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                            h1: ({ children }) => (
                                <h1 className={cn("mt-10 text-3xl sm:text-5xl font-black tracking-[-0.05em] leading-[0.95]", isDark ? "text-white" : "text-black")}>
                                    {children}
                                </h1>
                            ),
                            h2: ({ children }) => (
                                <h2 className={cn("mt-10 text-2xl sm:text-4xl font-extrabold tracking-[-0.04em]", isDark ? "text-white" : "text-black")}>
                                    {children}
                                </h2>
                            ),
                            h3: ({ children }) => (
                                <h3 className={cn("mt-8 text-xl sm:text-2xl font-bold tracking-[-0.02em]", isDark ? "text-white" : "text-black")}>
                                    {children}
                                </h3>
                            ),
                            p: ({ children }) => <p className="mt-5 text-base sm:text-lg leading-relaxed">{children}</p>,
                            ul: ({ children }) => <ul className="mt-5 list-disc pl-6 space-y-2">{children}</ul>,
                            ol: ({ children }) => <ol className="mt-5 list-decimal pl-6 space-y-2">{children}</ol>,
                            hr: () => <div className={cn("my-10 h-px w-full", isDark ? "bg-white/10" : "bg-black/10")} />,
                            a: ({ href, children, ...props }) => {
                                const url = href || "#";
                                const external = /^https?:\/\//.test(url);
                                return (
                                    <a
                                        href={url}
                                        {...props}
                                        target={external ? "_blank" : undefined}
                                        rel={external ? "noreferrer" : undefined}
                                        className={cn(
                                            "underline decoration-[0.08em] underline-offset-[0.22em] transition-opacity",
                                            isDark ? "decoration-white/40 hover:opacity-90" : "decoration-black/35 hover:opacity-90"
                                        )}
                                    >
                                        {children}
                                    </a>
                                );
                            },
                            code: ({ className, children }) => {
                                const isBlock = (className || "").includes("language-");
                                if (!isBlock) {
                                    return (
                                        <code className={cn("rounded-md px-1.5 py-0.5 text-[0.95em]", isDark ? "bg-white/10" : "bg-black/10")}>
                                            {children}
                                        </code>
                                    );
                                }
                                return <code className={className}>{children}</code>;
                            },
                            pre: ({ children }) => (
                                <pre
                                    className={cn(
                                        "mt-6 rounded-2xl border p-4 overflow-x-auto text-sm leading-relaxed",
                                        isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5"
                                    )}
                                >
                                    {children}
                                </pre>
                            ),
                            blockquote: ({ children }) => (
                                <blockquote className={cn("my-6 border-l-2 pl-4 italic", isDark ? "border-white/30 text-white/75" : "border-black/25 text-black/70")}>
                                    {children}
                                </blockquote>
                            ),
                        }}
                    >
                        {markdown}
                    </ReactMarkdown>

                    {/* Debug hint if the markdown is empty */}
                    {markdown.trim().length === 0 ? (
                        <div className={cn("mt-8 text-sm", isDark ? "text-white/60" : "text-black/60")}>
                            (No markdown body found for this post. Your loader is likely not returning a `body`/`content` string.)
                        </div>
                    ) : null}
                </article>
            </div>
        </section>
    );
}
