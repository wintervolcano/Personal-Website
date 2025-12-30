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
    /** ISO date string (YYYY-MM-DD). Used for sorting, newest first. */
    date?: string;
};

const GALLERY_ITEMS: GalleryItem[] = [
    {
        id: "g-1",
        src: "/gallery/sardinia-conference.png",
        title: "MPIfR group at Pulsar 2025, Sardinia.",
        description: "When a bunch of pulsar astronomers are asked what pulsars look like.",
        date: "2025-09-26",
    },
    {
        id: "g-2",
        src: "/gallery/compact-group-lunch-2025.png",
        title: "COMPACT Group (MPIfR) lunch, Dec 2025",
        description: "We went to Pasterei, Bonn. 1 Word. Amazing! ",
        date: "2025-12-15",
    },
    {
        id: "g-3",
        src: "/gallery/with-paulo-sardinia.png",
        title: "A selfie with Paulo Freire near Sardinia Radio Telescope",
        description: "We rolling with legends out here.",
        date: "2025-09-25",
    },
    {
        id: "g-4",
        src: "/gallery/farewell-vishnu.png",
        title: "Farewell dinner for Vishnu",
        description: "When Harvard calls, you need to go.",
        date: "2024-10-15",
    },
    {
        id: "g-5",
        src: "/gallery/effelsberg-far.png",
        title: "Effelsberg from far away",
        description: "That beast is my bread and butter.",
        date: "2024-11-03",
    },
    {
        id: "g-6",
        src: "/gallery/effelsberg-wiring.png",
        title: "Effelsberg from underneath",
        description: "These are the wires that carry data from the dish to the faraday room. They can twist up to 720 degrees.",
    },
    {
        id: "g-7",
        src: "/gallery/effelsberg_cntrl.png",
        title: "Effelsberg Control Room",
        description: "Where the magic happens.",
        date: "2024-11-03",
    },
    {
        id: "g-8",
        src: "/gallery/compact-meeting.png",
        title: "A usual COMPACT group weekly meeting",
        description: "Discussing science and getting excited about mostly noise. :(",
        date: "2025-02-12",
    },
    {
        id: "g-9",
        src: "/gallery/fundi-fun.png",
        title: "Fundamental Physics in Radio Astronomy Group",
        description: "The Fun@Fundi",
        date: "2025-06-06",
    },
    {
        id: "g-10",
        src: "/gallery/vivek-talk.png",
        title: "Vivek's talk at the Fachbeirat, MPIfR",
        description: "My picture in the slide is a complete coincidence. ;)",
        date: "2025-06-06",
    },
    {
        id: "g-11",
        src: "/gallery/yaswant-gupta.png",
        title: "With Prof. Yaswant Gupta, Director, GMRT",
        description: "An honour to meet him in person after 3 years of collaboration.",
        date: "2025-01-20",
    },
    {
        id: "g-12",
        src: "/gallery/compact-kids-vivek.png",
        title: "COMPACT Kids with the Boss, NS Workshop 2025, Bonn",
        description: "'Come see our posters' pictured here!",
        date: "2025-05-10",
    },
    {
        id: "g-13",
        src: "/gallery/aot-host.png",
        title: "Hosting the Astronomy on Tap, Fiddler's Bonn.",
        description: "Sharing science with the public is always fun! We host AoT Bonn on the last tuesday of every month.",
        date: "2025-03-25",
    },
];

export function Gallery({ theme }: { theme: Theme }) {
    const isDark = theme === "dark";

    const [likesById, setLikesById] = useState<
        Record<string, { likes: number; liked: boolean }>
    >({});

    const columns = 3;
    const columnItems = useMemo(() => {
        // Sort by date (newest first) when dates are provided.
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
                                                // Only apply grayscale + hover zoom on devices
                                                // with hover (sm and up). On mobile, images
                                                // stay in full colour.
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
