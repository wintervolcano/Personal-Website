// App layout and routes.
import React, { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Analytics } from "@vercel/analytics/react";
import { ScrollToTop } from "./components/ScrollToTop";
import { cn } from "./lib/cn";
import { loadCollection, type MdDoc } from "./lib/content";
import { TopNav, type PageKey } from "./components/TopNav";
import { type Theme } from "./components/themeToggle";
import { Footer } from "./components/Footer";
import { SearchOverlay } from "./components/SearchOverlay";
import { DiscoveryModal } from "./components/DiscoveryModal";
import { ConfettiOverlay, type ConfettiLevel } from "./components/ConfettiOverlay";
import { SkipToMain } from "./components/SkipToMain";
import type { Pulsar } from "./lib/pulsars";
import { Home } from "./pages/Home";

// Lazy-loaded heavy components for better initial load performance
const SearchMode = lazy(() => import("./pages/SearchMode").then(m => ({ default: m.SearchMode })));
const SearchModeChapter6 = lazy(() => import("./pages/SearchModeChapter6").then(m => ({ default: m.SearchModeChapter6 })));
const Gallery = lazy(() => import("./pages/Gallery").then(m => ({ default: m.Gallery })));
const DetectionsDashboard = lazy(() => import("./pages/DetectionsDashboard").then(m => ({ default: m.DetectionsDashboard })));
const BinaryPulsarLab = lazy(() => import("./components/BinaryPulsarTeachingLab"));
import { Research } from "./pages/Research";
import { Projects } from "./pages/Projects";
import { Publications } from "./pages/Publications";
import { Resources } from "./pages/Resources";
import { Blog } from "./pages/Blog";
import { About } from "./pages/About";
import { PersonalRecommendations } from "./pages/PersonalRecommendations";
import { Philosophy } from "./pages/Philosophy";
import { NotFound } from "./pages/NotFound";
import { ForStudents } from "./content/resources/for-Students";
import { ForAstronomers } from "./content/resources/for-Astronomers";
import { ForMedia } from "./content/resources/for-Media";

import { PostModal } from "./pages/PostModal";

import ResearchPost from "./pages/ResearchPost";
import ProjectsPost from "./pages/ProjectsPost";
import BlogPost from "./pages/BlogPost";
import ResourcePost from "./pages/ResourcePost";

// Auto page key list for distributing pulsars across the site.
import { SITE_PAGE_KEYS } from "./lib/sitePageKeys";

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function StaticRedirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return <div className="px-4 py-6 text-center">Redirecting…</div>;
}

function pageKeyFromPath(pathname: string): PageKey {
  if (pathname === "/" || pathname === "") return "home";
  if (pathname.startsWith("/research")) return "research";
  if (pathname.startsWith("/projects")) return "projects";
  if (pathname.startsWith("/publications")) return "publications";
  if (pathname.startsWith("/resources")) return "resources";
  if (pathname.startsWith("/blog")) return "blog"; // includes /blog/:slug.
   if (pathname.startsWith("/gallery")) return "gallery";
  if (pathname.startsWith("/about")) return "about";
  return "home";
}

function pathFromPageKey(k: PageKey): string {
  switch (k) {
    case "home":
      return "/";
    case "research":
      return "/research";
    case "projects":
      return "/projects";
    case "publications":
      return "/publications";
    case "resources":
      return "/resources";
    case "blog":
      return "/blog";
    case "gallery":
      return "/gallery";
    case "about":
      return "/about";
    default:
      return "/";
  }
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const ref = document.referrer || "";
    const sameSite =
      ref.startsWith("https://www.fazalkareem.com") || ref.startsWith("https://fazalkareem.com");
    if (!sameSite) return "light";
    const stored = window.localStorage.getItem("fk-theme");
    return stored === "dark" ? "dark" : "light";
  });

  const [blogDocs, setBlogDocs] = useState<MdDoc[]>([]);
  const [researchDocs, setResearchDocs] = useState<MdDoc[]>([]);
  const [resourceDocs, setResourceDocs] = useState<MdDoc[]>([]);
  const [projectDocs, setProjectDocs] = useState<MdDoc[]>([]);

  // Optional modal if you still want research updates here.
  const [postOpen, setPostOpen] = useState(false);
  const [activePost, setActivePost] = useState<MdDoc | null>(null);

  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const [discoveredPulsar, setDiscoveredPulsar] = useState<Pulsar | null>(null);
  const [discoveryRank, setDiscoveryRank] = useState(1);
  const [discoveryStats, setDiscoveryStats] = useState<{
    candidates: number;
    cpuHrs: number;
    gpuHrs: number;
    dataTB: number;
  } | null>(null);

  const [confettiLevel, setConfettiLevel] = useState<ConfettiLevel | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(false);
  const [hotspotPositions, setHotspotPositions] = useState<Array<{ x: number; y: number }>>([]);

  const page: PageKey = useMemo(() => pageKeyFromPath(location.pathname), [location.pathname]);
  const isDark = theme === "dark";

  const handleSolved = (
    p: Pulsar,
    rank: number,
    stats?: { candidates: number; cpuHrs: number; gpuHrs: number; dataTB: number }
  ) => {
    setDiscoveredPulsar(p);
    setDiscoveryRank(rank);
    setDiscoveryStats(stats ?? null);
    setDiscoveryOpen(true);

     const diff = (p as any).difficulty as "easy" | "medium" | "hard" | undefined;
     if (diff === "medium" || diff === "hard") {
       setConfettiLevel(diff);
     }
  };

  const handleOpenDetection = (p: Pulsar, rank: number) => {
    setDiscoveredPulsar(p);
    setDiscoveryRank(rank);
    setDiscoveryStats(null);
    setDiscoveryOpen(true);
  };

  useEffect(() => {
    (async () => {
      const [b, r, res, proj] = await Promise.all([
        loadCollection("blog"),
        loadCollection("research"),
        loadCollection("resources"),
        loadCollection("projects"),
      ]);
      setBlogDocs(b);
      setResearchDocs(r);
      setResourceDocs(res);
      setProjectDocs(proj);
    })();
  }, []);

  // Keep browser UI (address bar, OS chrome) in sync with the theme.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const color = theme === "dark" ? "#000000" : "#ffffff";
    if (meta) {
      meta.content = color;
    }
    // Hint the browser for form controls and scrollbars.
    document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("fk-theme", theme);
      } catch {
        // Ignore persistence errors.
      }
    }
  }, [theme]);

  useEffect(() => {
    const update = () => {
      if (typeof window === "undefined") return;
      setIsMobile(window.innerWidth < 768);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const latestBlog = useMemo(
    () => blogDocs.slice(0, 3).map(({ slug, title, date, description }) => ({ slug, title, date, description })),
    [blogDocs]
  );

  const latestResearch = useMemo(
    () => researchDocs.slice(0, 3).map(({ slug, title, date, description }) => ({ slug, title, date, description })),
    [researchDocs]
  );

  // Keep Home's existing API (onOpenPost), but use real routes for blog posts.
  const openPost = (collection: "blog" | "research", slug: string) => {
    if (collection === "blog") {
      navigate(`/blog/${slug}`);
      return;
    }

    // If you later want research posts as real pages:
    // navigate(`/research/${slug}`);

    // For now, keep research updates in the modal.
    const doc = researchDocs.find((d) => d.slug === slug) || null;
    setActivePost(doc);
    setPostOpen(!!doc);
  };

  // Keep TopNav API: when it calls setPage("home"), go to "/".
  const setPage = (k: PageKey) => {
    navigate(pathFromPageKey(k));
  };

  // Full unique page key so /blog/:slug does not collapse to just "blog".
  function pageKeyForOverlay(pathname: string) {
    const p = pathname.replace(/\/+$/, "");
    return p === "" || p === "/" ? "home" : p.replace(/^\//, "");
  }

  const overlayPageKey = useMemo(() => pageKeyForOverlay(location.pathname), [location.pathname]);

  // Do not render SearchOverlay on internal-only routes.
  const isInternalPage = useMemo(() => location.pathname.startsWith("/internal"), [location.pathname]);
  const isStandaloneLab = useMemo(() => location.pathname === "/resources/binary-pulsar-lab", [location.pathname]);

  return (
    <div
      className={cn(
        "flex flex-col overflow-x-hidden",
        !isMobile && "min-h-[100svh]",
        isDark ? "bg-black text-white" : "bg-white text-black"
      )}
    >
      <ScrollToTop />
      <SkipToMain theme={theme} />
      {!isStandaloneLab && <TopNav theme={theme} setTheme={setTheme} page={page} setPage={setPage} isMobile={isMobile} />}

      <main id="main-content" className={cn("flex-1", !isStandaloneLab && "pt-24 sm:pt-28")}>
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname}>
            <PageTransition>
              <Routes location={location}>
                <Route
                  path="/"
                  element={
                    <Home
                      theme={theme}
                      onOpenPost={openPost}
                      latestBlog={latestBlog}
                      latestResearch={latestResearch}
                    />
                  }
                />
                <Route path="/research" element={<Research theme={theme} docs={researchDocs} />} />
                <Route path="/research/:slug" element={<ResearchPost theme={theme} posts={researchDocs} />} />
                <Route path="/projects" element={<Projects theme={theme} docs={projectDocs} />} />
                <Route path="/publications" element={<Publications theme={theme} />} />
                <Route path="/resources" element={<Resources theme={theme} docs={resourceDocs} />} />
                <Route path="/resources/:slug" element={<ResourcePost theme={theme} docs={resourceDocs} />} />
                <Route path="/projects/:slug" element={<ProjectsPost theme={theme} posts={projectDocs} />} />
                <Route path="/blog" element={<Blog theme={theme} docs={blogDocs} onOpen={(slug) => openPost("blog", slug)} />} />
                <Route path="/blog/:slug" element={<BlogPost theme={theme} posts={blogDocs} />} />
                <Route path="/about" element={<About theme={theme} />} />
                <Route path="/personal-recommendations" element={<PersonalRecommendations theme={theme} />} />
                <Route
                  path="/search-mode"
                  element={
                    <Suspense fallback={null}>
                      <SearchMode
                        theme={theme}
                        setTheme={setTheme}
                        onDemoSolved={(p, stats) => handleSolved(p, 1, stats)}
                        hotspotPositions={hotspotPositions}
                        isMobile={isMobile}
                      />
                    </Suspense>
                  }
                />
                <Route
                  path="/search-mode/chapter-6"
                  element={
                    <Suspense fallback={null}>
                      <SearchModeChapter6 theme={theme} setTheme={setTheme} />
                    </Suspense>
                  }
                />
                <Route path="/globular-cluster-explorer" element={<StaticRedirect to="/globular-clusters-3d.html" />} />
                <Route path="/site-philosophy" element={<Philosophy theme={theme} />} />
                <Route path="/resources/for-astronomers" element={<ForAstronomers theme={theme} />} />
                <Route path="/resources/for-students" element={<ForStudents theme={theme} />} />
                <Route path="/resources/for-media" element={<ForMedia theme={theme} />} />
                <Route
                  path="/resources/binary-pulsar-lab"
                  element={
                    <Suspense fallback={null}>
                      <BinaryPulsarLab fullPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/gallery"
                  element={
                    <Suspense fallback={null}>
                      <Gallery theme={theme} />
                    </Suspense>
                  }
                />
                {/* Internal-only diagnostics page, no nav link */}
                <Route
                  path="/internal/detections"
                  element={
                    <Suspense fallback={null}>
                      <DetectionsDashboard theme={theme} />
                    </Suspense>
                  }
                />
                <Route path="*" element={<NotFound theme={theme} />} />
              </Routes>
            </PageTransition>
          </motion.div>
        </AnimatePresence>
      </main>

      {!isStandaloneLab && <Footer theme={theme} />}

      {/* In Search Mode, add a gutter after the footer so it can scroll above the FFT panel on desktop and tablet */}
      {isDark && !isMobile && !isStandaloneLab ? (
        <div
          aria-hidden
          className="h-[220px] sm:h-[210px] md:h-[190px]"
          style={{ height: "calc(250px + env(safe-area-inset-bottom))" }}
        />
      ) : null}

      {/* SearchOverlay on all non-mobile pages, except internal pages */}
      {!isInternalPage && !isMobile && !isStandaloneLab && (
        <SearchOverlay
          theme={theme}
          pageKey={overlayPageKey}
          onSolved={handleSolved}
          onOpenDetection={handleOpenDetection}
          sitePageKeys={SITE_PAGE_KEYS}
          onHotspotPositionsReady={setHotspotPositions}
        />
      )}

      <DiscoveryModal
        theme={theme}
        open={discoveryOpen}
        pulsar={discoveredPulsar}
        rank={discoveryRank}
        stats={discoveryStats ?? undefined}
        onClose={() => setDiscoveryOpen(false)}
      />

      {confettiLevel && (
        <ConfettiOverlay
          level={confettiLevel}
          onDone={() => setConfettiLevel(null)}
        />
      )}

      {/* Optional: keep the modal only for research posts for now */}
      <PostModal theme={theme} open={postOpen} doc={activePost} onClose={() => setPostOpen(false)} />

      <Analytics />
    </div>
  );
}
