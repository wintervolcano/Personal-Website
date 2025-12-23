import React from "react";
import { ArrowUpRight } from "lucide-react";

type Theme = "light" | "dark";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function isExternal(href?: string) {
  if (!href) return false;
  return /^https?:\/\//i.test(href);
}

function InfoRow({
  theme,
  label,
  children,
}: {
  theme: Theme;
  label: string;
  children: React.ReactNode;
}) {
  const isDark = theme === "dark";
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-6 py-3 border-b border-dashed last:border-none border-white/10 sm:border-black/10">
      <div
        className={cn(
          "w-full sm:w-48 text-[11px] font-semibold tracking-[0.26em] uppercase mb-1 sm:mb-0",
          isDark ? "text-white/60" : "text-black/55"
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "flex-1 text-[0.95rem] sm:text-base leading-relaxed",
          isDark ? "text-white/75" : "text-black/75"
        )}
      >
        {children}
      </div>
    </div>
  );
}


export function ForMedia({ theme }: { theme: Theme }) {
  const isDark = theme === "dark";

  return (
    <div className={cn("w-full", isDark ? "bg-black" : "bg-white")}>
      {/* Header */}
      <section className={cn("w-full", isDark ? "bg-black" : "bg-white")}>
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8 pt-8 pb-12 sm:pt-10 sm:pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-7">
              <div
                className={cn(
                  "text-xs font-semibold tracking-[0.32em] uppercase",
                  isDark ? "text-white/60" : "text-black/55"
                )}
              >
                Resources • For media
              </div>
              <h1
                className={cn(
                  "mt-4 text-5xl sm:text-7xl font-black tracking-[-0.05em]",
                  isDark ? "text-white" : "text-black"
                )}
              >
                If you&apos;re writing about pulsars
              </h1>
              <p
                className={cn(
                  "mt-5 max-w-[80ch] text-base sm:text-lg leading-relaxed",
                  isDark ? "text-white/65" : "text-black/65"
                )}
              >
                This page is a small &quot;about&quot; for journalists, outreach teams, and podcast hosts. It collects a short
                description of what I do and how to reach me — nothing formal, just enough context to decide if I&apos;m the
                right person for your piece.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div
                className={cn(
                  "rounded-[24px] border p-6 sm:p-7",
                  isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5"
                )}
              >
                <div
                  className={cn(
                    "text-[11px] font-semibold tracking-[0.28em] uppercase",
                    isDark ? "text-white/60" : "text-black/55"
                  )}
                >
                  How to use this page
                </div>
                <p
                  className={cn(
                    "mt-3 text-sm leading-relaxed",
                    isDark ? "text-white/70" : "text-black/70"
                  )}
                >
                  Skim the quick facts, then send an email with your idea and deadline. You&apos;re welcome to quote the short description below directly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content: structured rows for media */}
      <section className={cn("w-full", isDark ? "bg-black" : "bg-white")}>
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8 pb-16">
          <div
            className={cn(
              "rounded-[24px] border p-6 sm:p-8 space-y-3",
              isDark ? "border-white/12 bg-white/5" : "border-black/10 bg-black/5"
            )}
          >
            <InfoRow theme={theme} label="Short description">
              I&apos;m a PhD student in radio astronomy, working with pulsars in globular clusters and in pulsar timing arrays. I come from a small town in Kerala, India, and I&apos;m currently based at the Max Planck Institute for Radio Astronomy in Bonn, Germany. I am passionate about understanding the universe through scientiific inquiry, and I enjoy sharing my knowledge through public outreach, blogging, and open-source software development.
            </InfoRow>

            <InfoRow theme={theme} label="Contact">
              <p>
                The fastest way to reach me for media or outreach requests is{" "}
                <a
                  className={cn(
                    "font-semibold underline underline-offset-4 decoration-2",
                    isDark ? "text-white hover:decoration-white/70" : "text-black hover:decoration-black/50"
                  )}
                >
                  fkareem[at]mpifr-bonn.mpg.de
                </a>
                . A couple of lines about the format (print, podcast, video), audience, and timeline are helpful, but not mandatory.
              </p>
              <p className="mt-2 text-xs">
                You can also link your social handles here if you want (e.g. Twitter, Mastodon, Instagram).
              </p>
            </InfoRow>

            <InfoRow theme={theme} label="Assets & visuals">
              <p>
                If you need headshots, plots or quotes, I&apos;m happy to provide a small asset pack.
                For now, you can use images from the <a
                  href="/gallery"
                  className={cn(
                    "font-semibold underline underline-offset-4 decoration-2",
                    isDark ? "text-white hover:decoration-white/70" : "text-black hover:decoration-black/50"
                  )}
                >
                  gallery
                </a>{" "}
                as reference, but please email before re‑publishing so I can send high‑resolution, captioned versions.
              </p>
            </InfoRow>

            <InfoRow theme={theme} label="Pronunciation & language">
              <p>
                Name: <strong>Fazal Kareem</strong> (roughly &quot;Fah‑zal Ka‑reem&quot;). Interviews in English; I&apos;m
                also comfortable chatting informally in Malayalam or Hindi off‑record if that helps with background.
              </p>
            </InfoRow>

            <InfoRow theme={theme} label="If you're on a deadline">
              <p>
                Put &quot;TIME‑SENSITIVE&quot; in the email subject and suggest a couple of slots in <strong>Central
                European Time (CET/CEST)</strong>. Even if I can&apos;t make it, I&apos;ll reply with a quick yes/no and
                point you to useful background links.
              </p>
            </InfoRow>
          </div>
        </div>
      </section>
    </div>
  );
}
