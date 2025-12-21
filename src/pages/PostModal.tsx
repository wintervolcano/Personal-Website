import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { cn } from "../lib/cn";
import type { Theme } from "../components/themeToggle.tsx";
import type { MdDoc } from "../lib/content";

export function PostModal({
  theme,
  open,
  doc,
  onClose,
}: {
  theme: Theme;
  open: boolean;
  doc: MdDoc | null;
  onClose: () => void;
}) {
  if (!open || !doc) return null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[80]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/70" onClick={onClose} />
        <div className="absolute inset-0 overflow-auto">
          <div className="mx-auto max-w-[980px] px-4 sm:px-8 py-10">
            <motion.div
              initial={{ y: 18, opacity: 0, scale: 0.99 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 10, opacity: 0, scale: 0.99 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className={cn("rounded-[28px] border overflow-hidden bg-black border-white/14")}
            >
              <div className="p-6 sm:p-8 border-b border-white/10 flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.28em] uppercase text-white/60">{doc.collection}</div>
                  <div className="mt-3 text-3xl sm:text-5xl font-black tracking-[-0.04em] text-white">{doc.title}</div>
                  <div className="mt-2 text-sm text-white/70">{doc.date}{doc.tags?.length ? ` • ${doc.tags.join(", ")}` : ""}</div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full border border-white/14 bg-white/5 px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-white/85 hover:bg-white/10"
                  data-nolock
                >
                  Close
                </button>
              </div>

              <div className="p-6 sm:p-8">
                <article className="prose prose-invert max-w-none">
                  <ReactMarkdown>{doc.body}</ReactMarkdown>
                </article>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
