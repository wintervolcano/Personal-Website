// src/App.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ScrollToTop } from "./components/ScrollToTop";
import { cn } from "./lib/cn";
import { loadCollection, type MdDoc } from "./lib/content";
import { TopNav, type PageKey } from "./components/TopNav";
import { type Theme } from "./components/themeToggle";
import { Footer } from "./components/Footer";
import { SearchOverlay } from "./components/SearchOverlay";
import { DiscoveryModal } from "./components/DiscoveryModal";
import type { Pulsar } from "./lib/pulsars";
import { SearchMode } from "./pages/SearchMode";
import { Gallery } from "./pages/Gallery";

import { Home } from "./pages/Home";
import { Research } from "./pages/Research";
import { Projects } from "./pages/Projects";
import { Publications } from "./pages/Publications";
import { Resources } from "./pages/Resources";
import { Blog } from "./pages/Blog";
import { About } from "./pages/About";
import { PersonalRecommendations } from "./pages/PersonalRecommendations";
import { Philosophy } from "./pages/Philosophy";
import { ForStudents } from "./content/resources/for-Students";
import { ForAstronomers } from "./content/resources/for-Astronomers";
import { ForMedia } from "./content/resources/for-Media";

import { PostModal } from "./pages/PostModal";

import ResearchPost from "./pages/ResearchPost";
import ProjectsPost from "./pages/ProjectsPost";
import BlogPost from "./pages/BlogPost";
import ResourcePost from "./pages/ResourcePost";

// ✅ Auto page key list (blogs + any new pages) for distributing pulsars site-wide
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

function pageKeyFromPath(pathname: string): PageKey {
  if (pathname === "/" || pathname === "") return "home";
  if (pathname.startsWith("/research")) return "research";
  if (pathname.startsWith("/projects")) return "projects";
  if (pathname.startsWith("/publications")) return "publications";
  if (pathname.startsWith("/resources")) return "resources";
  if (pathname.startsWith("/blog")) return "blog"; // includes /blog/:slug
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
    case "about":
      return "/about";
    default:
      return "/";
  }
}

export default function App() {
  const [theme, setTheme] = useState<Theme>("light");

  const [blogDocs, setBlogDocs] = useState<MdDoc[]>([]);
  const [researchDocs, setResearchDocs] = useState<MdDoc[]>([]);
  const [resourceDocs, setResourceDocs] = useState<MdDoc[]>([]);
  const [projectDocs, setProjectDocs] = useState<MdDoc[]>([]);

  // Optional modal (keep only if you still want research updates as modal)
  const [postOpen, setPostOpen] = useState(false);
  const [activePost, setActivePost] = useState<MdDoc | null>(null);

  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const [discoveredPulsar, setDiscoveredPulsar] = useState<Pulsar | null>(null);
  const [discoveryRank, setDiscoveryRank] = useState(1);

  const location = useLocation();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(false);

  const page: PageKey = useMemo(() => pageKeyFromPath(location.pathname), [location.pathname]);
  const isDark = theme === "dark";

  const handleSolved = (p: Pulsar, rank: number) => {
    setDiscoveredPulsar(p);
    setDiscoveryRank(rank);
    setDiscoveryOpen(true);
  };

  const handleOpenDetection = (p: Pulsar, rank: number) => {
    setDiscoveredPulsar(p);
    setDiscoveryRank(rank);
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

  // Keep browser UI (address bar, OS chrome) in sync with theme.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const color = theme === "dark" ? "#000000" : "#ffffff";
    if (meta) {
      meta.content = color;
    }
    // Hint to the browser for form controls / scrollbars.
    document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
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

  // Keep Home’s existing API (onOpenPost), but use real routes for blog posts.
  const openPost = (collection: "blog" | "research", slug: string) => {
    if (collection === "blog") {
      navigate(`/blog/${slug}`);
      return;
    }

    // If you later want research posts as real pages too:
    // navigate(`/research/${slug}`);

    // For now keep research updates in the modal (optional)
    const doc = researchDocs.find((d) => d.slug === slug) || null;
    setActivePost(doc);
    setPostOpen(!!doc);
  };

  // Keep TopNav API: when it calls setPage("home"), we navigate("/")
  const setPage = (k: PageKey) => {
    navigate(pathFromPageKey(k));
  };

  //  Full unique page key (so /blog/:slug doesn’t collapse to just "blog")
  function pageKeyForOverlay(pathname: string) {
    const p = pathname.replace(/\/+$/, "");
    return p === "" || p === "/" ? "home" : p.replace(/^\//, "");
  }

  const overlayPageKey = useMemo(() => pageKeyForOverlay(location.pathname), [location.pathname]);

  // ✅ Do not render SearchOverlay on the Search Mode page
  const isSearchModePage = useMemo(() => location.pathname.startsWith("/search-mode"), [location.pathname]);

  return (
    <div
      className={cn(
        "min-h-[100svh] flex flex-col overflow-x-hidden",
        isDark ? "bg-black text-white" : "bg-white text-black"
      )}
    >
      <ScrollToTop />
      <TopNav theme={theme} setTheme={setTheme} page={page} setPage={setPage} isMobile={isMobile} />

      <main className="flex-1 pt-24 sm:pt-28">
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
                <Route path="/search-mode" element={<SearchMode theme={theme} setTheme={setTheme} />} />
                <Route path="/site-philosophy" element={<Philosophy theme={theme} />} />
                <Route path="/resources/for-astronomers" element={<ForAstronomers theme={theme} />} />
                <Route path="/resources/for-students" element={<ForStudents theme={theme} />} />
                <Route path="/resources/for-media" element={<ForMedia theme={theme} />} />
                <Route path="/gallery" element={<Gallery theme={theme} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </PageTransition>
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer theme={theme} />

      {/* In Search Mode, add a “gutter” after the footer so it can scroll fully above the FFT panel */}
      {isDark ? (
        <div
          aria-hidden
          className="h-[220px] sm:h-[210px] md:h-[190px]"
          style={{ height: "calc(250px + env(safe-area-inset-bottom))" }}
        />
      ) : null}

      {/* SearchOverlay on ALL non-mobile pages (including blog posts), but not on /search-mode */}
      {!isSearchModePage && !isMobile && (
        <SearchOverlay
          theme={theme}
          pageKey={overlayPageKey}
          onSolved={handleSolved}
          onOpenDetection={handleOpenDetection}
          sitePageKeys={SITE_PAGE_KEYS}
        />
      )}

      <DiscoveryModal
        theme={theme}
        open={discoveryOpen}
        pulsar={discoveredPulsar}
        rank={discoveryRank}
        onClose={() => setDiscoveryOpen(false)}
      />

      {/* Optional: keep modal only for research posts for now */}
      <PostModal theme={theme} open={postOpen} doc={activePost} onClose={() => setPostOpen(false)} />
    </div>
  );
}
