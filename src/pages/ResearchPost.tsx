import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Heart } from "lucide-react";
import type { Theme } from "../components/themeToggle";
import type { MdDoc } from "../lib/content";
import { cn } from "../lib/cn";
import { fetchPostLikes, togglePostLike } from "../lib/postLikes";

export default function ResearchPost({
    theme,
    posts,
}: {
    theme: Theme;
    posts: MdDoc[];
}) {
    const isDark = theme === "dark";
    const { slug } = useParams();

    const [likeCount, setLikeCount] = useState(0);
    const [liked, setLiked] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);

    const post = useMemo(() => posts.find((p) => p.slug === slug), [posts, slug]);

    const likeId = post ? `research/${post.slug}` : undefined;

    useEffect(() => {
        if (!likeId) return;
        let cancelled = false;
        (async () => {
            const snapshotMap = await fetchPostLikes([likeId]);
            if (cancelled) return;
            const snapshot = snapshotMap[likeId];
            if (!snapshot) return;
            setLikeCount(snapshot.likes ?? 0);
            setLiked(!!snapshot.likedByMe);
        })();
        return () => {
            cancelled = true;
        };
    }, [likeId]);

    const handleLikeClick = async () => {
        if (!likeId || likeLoading) return;
        const nextLiked = !liked;
        setLiked(nextLiked);
        setLikeCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));
        setLikeLoading(true);
        try {
            const snapshot = await togglePostLike(likeId, nextLiked);
            if (snapshot) {
                setLikeCount(snapshot.likes ?? 0);
                setLiked(snapshot.likedByMe ?? nextLiked);
            }
        } finally {
            setLikeLoading(false);
        }
    };

    if (!post) {
        return (
            <section className={cn("min-h-[100svh] w-full px-4 sm:px-8 pt-28 pb-20", isDark ? "bg-black text-white" : "bg-white text-black")}>
                <div className="mx-auto max-w-[1100px]">
                    <div className={cn("text-xs font-semibold tracking-[0.28em] uppercase", isDark ? "text-white/55" : "text-black/55")}>
                        Research
                    </div>
                    <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-[-0.04em]">Post not found</h1>
                    <Link
                        to="/research"
                        className={cn(
                            "mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase",
                            isDark ? "border-white/15 bg-white/5 text-white/80 hover:bg-white/10" : "border-black/10 bg-black/5 text-black/70 hover:bg-black/10"
                        )}
                    >
                        ← Back to research
                    </Link>
                </div>
            </section>
        );
    }

    // Render markdown from whichever field your loader uses
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
                        to="/research"
                        className={cn(
                            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase",
                            isDark ? "border-white/15 bg-white/5 text-white/80 hover:bg-white/10" : "border-black/10 bg-black/5 text-black/70 hover:bg-black/10"
                        )}
                    >
                        ← Back
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className={cn("text-xs font-semibold tracking-[0.28em] uppercase", isDark ? "text-white/55" : "text-black/55")}>
                            {(post as any).date ?? ""}
                        </div>

                        {likeId ? (
                            <button
                                type="button"
                                onClick={handleLikeClick}
                                disabled={likeLoading}
                                className={cn(
                                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold tracking-[0.16em] uppercase transition-colors",
                                    isDark
                                        ? liked
                                            ? "border-white bg-white text-black"
                                            : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
                                        : liked
                                            ? "border-black bg-black text-white"
                                            : "border-black/15 bg-black/5 text-black/75 hover:bg-black/10"
                                )}
                            >
                                <Heart
                                    className={cn(
                                        "h-3.5 w-3.5",
                                        liked ? "fill-current" : "fill-transparent"
                                    )}
                                />
                                <span>{likeCount}</span>
                            </button>
                        ) : null}
                    </div>
                </div>

                <h1 className="mt-8 text-4xl sm:text-6xl font-black tracking-[-0.05em] leading-[0.92]">
                    {(post as any).title ?? post.slug}
                </h1>

                {(post as any).description ? (
                    <p
                        className={cn(
                            "mt-5 text-[1.02rem] sm:text-[1.12rem] leading-relaxed",
                            isDark ? "text-white/70" : "text-black/65"
                        )}
                    >
                        {(post as any).description}
                    </p>
                ) : null}

                <div className={cn("mt-10 h-px w-full", isDark ? "bg-white/10" : "bg-black/10")} />

                <article
                    className={cn(
                        "mt-10 text-[0.98rem] sm:text-[1.08rem] leading-relaxed text-justify",
                        isDark ? "text-white/75" : "text-black/70"
                    )}
                >
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
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
                            p: ({ children }) => (
                                <p className="mt-5 text-[1.02rem] sm:text-[1.12rem] leading-relaxed">{children}</p>
                            ),
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
                            table: ({ children }) => (
                                <div className="mt-6 overflow-x-auto">
                                    <table className="min-w-full border-collapse text-sm">
                                        {children}
                                    </table>
                                </div>
                            ),
                            thead: ({ children }) => (
                                <thead className={isDark ? "bg-white/10" : "bg-black/5"}>{children}</thead>
                            ),
                            tbody: ({ children }) => <tbody>{children}</tbody>,
                            tr: ({ children }) => (
                                <tr className={cn(isDark ? "border-white/10" : "border-black/10", "border-b last:border-0")}>{children}</tr>
                            ),
                            th: ({ children }) => (
                                <th className="px-3 py-2 text-left text-[0.72rem] font-semibold tracking-[0.16em] uppercase">
                                    {children}
                                </th>
                            ),
                            td: ({ children }) => <td className="px-3 py-2 align-top text-sm">{children}</td>,
                        }}
                    >
                        {markdown}
                    </ReactMarkdown>
                </article>
            </div>
        </section>
    );
}
