// src/pages/Gallery.tsx
import React, { useMemo, useEffect, useState } from "react";
import { SectionShell } from "./SectionShell";
import type { Theme } from "../components/themeToggle";
import { cn } from "../lib/cn";
import { motion } from "framer-motion";
import { ArrowUpRight, Heart } from "lucide-react";
import { fetchGalleryLikes, toggleGalleryLike } from "../lib/galleryLikes";

// Images are served from the Vite `public/` folder.
// Drop JPG/PNG/WEBP files into `public/gallery/` and reference them
// here as `/gallery/filename.ext`. Titles/descriptions live purely
// in this metadata and can be edited anytime.
type GalleryItem = {
    id: string;
    src: string;
    title: string;
    description?: string;
};

const GALLERY_ITEMS: GalleryItem[] = [
    {
        id: "g-1",
        src: "/gallery/sardinia-conference.png",
        title: "MPIfR group at Pulsar 2025, Sardinia.",
        description: "When a bunch of pulsar astronomers are asked what pulsars look like.",
    },
    {
        id: "g-2",
        src: "/gallery/compact-group-lunch-2025.png",
        title: "COMPACT Group (MPIfR) lunch, Dec 2025",
        description: "We went to Pasterei, Bonn. 1 Word. Amazing! ",
    },
    {
        id: "g-3",
        src: "/gallery/with-paulo-sardinia.png",
        title: "A selfie with Paulo Freire near Sardinia Radio Telescope",
        description: "We rolling with legends out here.",
    },
    {
        id: "g-4",
        src: "/gallery/farewell-vishnu.png",
        title: "Farewell dinner for Vishnu",
        description: "When Harvard calls, you need to go.",
    },
    {
        id: "g-5",
        src: "/gallery/effelsberg-far.png",
        title: "Effelsberg from far away",
        description: "That beast is my bread and butter.",
    },
    {
        id: "g-6",
        src: "/gallery/effelsberg-wiring.png",
        title: "Effelsberg from underneath",
        description: "These are the wires that carry data from the dish to the faraday room. They can twist up to 720 degrees.",
    },
];

export function Gallery({ theme }: { theme: Theme }) {
    const isDark = theme === "dark";

    const [likesById, setLikesById] = useState<
        Record<string, { likes: number; liked: boolean }>
    >({});

    const columns = 3;
    const columnItems = useMemo(() => {
        const cols: GalleryItem[][] = Array.from({ length: columns }, () => []);
        GALLERY_ITEMS.forEach((item, idx) => {
            cols[idx % columns].push(item);
        });
        return cols;
    }, []);

    useEffect(() => {
        const ids = GALLERY_ITEMS.map((g) => g.id);
        fetchGalleryLikes(ids).then((snap) => {
            setLikesById(
                ids.reduce((acc, id) => {
                    const row = snap[id];
                    acc[id] = {
                        likes: row?.likes ?? 0,
                        liked: !!row?.likedByMe,
                    };
                    return acc;
                }, {} as Record<string, { likes: number; liked: boolean }>)
            );
        });
    }, []);

    const handleToggleLike = async (id: string) => {
        setLikesById((prev) => {
            const current = prev[id] ?? { likes: 0, liked: false };
            const nextLiked = !current.liked;
            const delta = nextLiked ? 1 : -1;
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
            {/* Staggered “polaroid” columns, animated on scroll */}
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
                                            className={cn(
                                                "h-full w-full object-cover",
                                                "grayscale group-hover:grayscale-0 group-hover:scale-[1.05] transition-transform duration-400 ease-out"
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
