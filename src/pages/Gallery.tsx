// Gallery page.
import React, { useMemo, useEffect, useState } from "react";
import { SectionShell } from "./SectionShell";
import type { Theme } from "../components/themeToggle";
import { cn } from "../lib/cn";
import { motion } from "framer-motion";
import { ArrowUpRight, Heart } from "lucide-react";
import { fetchGalleryLikes, toggleGalleryLike } from "../lib/galleryLikes";
import galleryData from "../data/gallery.json";
import { usePageMeta } from "../lib/usePageMeta";

// Gallery item type used internally with computed src path
type GalleryItem = {
    id: string;
    src: string;
    title: string;
    description?: string | null;
    date?: string | null;
    tags?: string[];
    location?: string | null;
};

// Map JSON data to include computed src path
const GALLERY_ITEMS: GalleryItem[] = galleryData.items.map((item) => ({
    id: item.id,
    src: `/gallery/${item.filename}`,
    title: item.title,
    description: item.description,
    date: item.date,
    tags: item.tags,
    location: item.location,
}));

export function Gallery({ theme }: { theme: Theme }) {
    const isDark = theme === "dark";

    usePageMeta(
        "Gallery – Fazal Kareem",
        "Snapshots from telescopes, conferences, and personal moments—a visual collection from life in radio astronomy."
    );

    const LOCAL_LIKES_KEY = "fk_gallery_likes";

    const readLocalLikes = (): Set<string> => {
        if (typeof window === "undefined") return new Set();
        try {
            const raw = window.localStorage.getItem(LOCAL_LIKES_KEY);
            if (!raw) return new Set();
            const arr = JSON.parse(raw) as unknown;
            if (!Array.isArray(arr)) return new Set();
            return new Set(arr.filter((x) => typeof x === "string"));
        } catch {
            return new Set();
        }
    };

    const writeLocalLikes = (ids: Set<string>) => {
        if (typeof window === "undefined") return;
        try {
            window.localStorage.setItem(LOCAL_LIKES_KEY, JSON.stringify(Array.from(ids)));
        } catch {
            // Ignore storage errors.
        }
    };

    const [likesById, setLikesById] = useState<
        Record<string, { likes: number; liked: boolean }>
    >({});

    const columns = 3;
    const columnItems = useMemo(() => {
        // Sort by date, newest first, when dates are provided.
        const sorted: GalleryItem[] = [...GALLERY_ITEMS].sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            return (
                new Date(b.date).getTime() -
                new Date(a.date).getTime()
            );
        });

        const cols: GalleryItem[][] = Array.from({ length: columns }, () => []);
        sorted.forEach((item, idx) => {
            cols[idx % columns].push(item);
        });
        return cols;
    }, []);

    useEffect(() => {
        const ids = GALLERY_ITEMS.map((g) => g.id);
        const localLikes = readLocalLikes();
        fetchGalleryLikes(ids).then((snap) => {
            setLikesById(
                ids.reduce((acc, id) => {
                    const row = snap[id];
                    const likedLocal = localLikes.has(id);
                    acc[id] = {
                        likes: row?.likes ?? 0,
                        liked: likedLocal || !!row?.likedByMe,
                    };
                    return acc;
                }, {} as Record<string, { likes: number; liked: boolean }>)
            );
        });
    }, []);

    const handleToggleLike = async (id: string) => {
        const local = readLocalLikes();
        setLikesById((prev) => {
            const current = prev[id] ?? { likes: 0, liked: false };
            const nextLiked = !current.liked;
            const delta = nextLiked ? 1 : -1;

            // Persist liked state for this browser.
            if (nextLiked) local.add(id);
            else local.delete(id);
            writeLocalLikes(local);

            return {
                ...prev,
                [id]: {
                    likes: Math.max(0, current.likes + delta),
                    liked: nextLiked,
                },
            };
        });

        const snap = await toggleGalleryLike(id, !likesById[id]?.liked);
        if (snap) {
            setLikesById((prev) => ({
                ...prev,
                [id]: {
                    likes: snap.likes ?? prev[id]?.likes ?? 0,
                    liked: !!snap.likedByMe,
                },
            }));
        }
    };

    return (
        <SectionShell
            theme={theme}
            eyebrow="Gallery"
            title="Snapshots from my work and life."
            subtitle="A loose collection of moments with people, telescopes and other personal favourites."
        >
            {/* Staggered polaroid columns, animated on scroll */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {columnItems.map((col, colIdx) => (
                    <div key={`col-${colIdx}`} className="space-y-5">
                        {col.map((item, i) => {
                            const meta = likesById[item.id] ?? { likes: 0, liked: false };
                            return (
                                <motion.figure
                                    key={item.id}
                                    className={cn(
                                        "group relative overflow-hidden rounded-3xl border bg-black/5",
                                        isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5"
                                    )}
                                    initial={{ opacity: 0, y: 18 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.3 }}
                                    transition={{ duration: 0.35, ease: "easeOut" }}
                                    whileHover={{ y: -8, scale: 1.02 }}
                                >
                                    <div className="overflow-hidden">
                                        <img
                                            src={item.src}
                                            alt={item.title}
                                            loading="lazy"
                                            decoding="async"
                                            className={cn(
                                                "h-full w-full object-cover",
                                                // Only apply grayscale and hover zoom on devices
                                                // with hover (sm and up). On mobile, images
                                                // stay in full color.
                                                "sm:grayscale sm:group-hover:grayscale-0 sm:group-hover:scale-[1.05] transition-transform duration-400 ease-out"
                                            )}
                                        />
                                    </div>
                                    <figcaption className="p-4 sm:p-5">
                                        <div
                                            className={cn(
                                                "text-sm font-semibold tracking-[-0.01em]",
                                                isDark ? "text-white" : "text-black"
                                            )}
                                        >
                                            {item.title}
                                        </div>
                                            {item.description ? (
                                            <div
                                                className={cn(
                                                    "mt-1 text-xs sm:text-sm leading-relaxed",
                                                    isDark ? "text-white/70" : "text-black/70"
                                                )}
                                            >
                                                {item.description}
                                            </div>
                                        ) : null}
                                        <div className="mt-3">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleLike(item.id)}
                                                className={cn(
                                                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] uppercase",
                                                    isDark
                                                        ? "border-white/30 text-white/80 hover:bg-white/10"
                                                        : "border-black/20 text-black/80 hover:bg-black/5"
                                                )}
                                            >
                                                <Heart
                                                    className={cn(
                                                        "h-3.5 w-3.5",
                                                        meta.liked
                                                            ? "fill-current text-red-500"
                                                            : "text-current"
                                                    )}
                                                />
                                                <span>{meta.liked ? "Loved" : "Love"}</span>
                                                <span className="ml-1 text-[10px] opacity-70">
                                                    {meta.likes}
                                                </span>
                                            </button>
                                        </div>
                                    </figcaption>
                                </motion.figure>
                            );
                        })}
                    </div>
                ))}
            </div>
        </SectionShell>
    );
}
