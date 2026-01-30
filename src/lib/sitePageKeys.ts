// Site page key helpers.
// Vite only (import.meta.glob).

function stripExt(p: string) {
  return p.replace(/\.(tsx|ts|mdx|md)$/, "");
}

function normalizeSlashes(p: string) {
  return p.replace(/\\/g, "/");
}

function toKebabCase(s: string) {
  return s
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

/**
 * Convert a file path to a stable "pageKey" used by SearchOverlay hotspots.
 * Examples:
 * - ../pages/About.tsx                  -> "about"
 * - /src/pages/research/index.tsx       -> "research"
 * - /src/pages/blog/[slug].tsx          -> null (template itself; real posts come from content)
 * - ../content/blog/my-post.md          -> "blog/my-post"
 */
function toKeyFromPageFile(file: string) {
  const f = normalizeSlashes(file);

  // Skip internal-only pages like the detections dashboard.
  if (f.toLowerCase().includes("detectionsdashboard.tsx")) return null;

  let rel = f;
  // Vite glob keys (relative), e.g. "../pages/Home.tsx".
  rel = rel.replace(/^(\.\.\/)+pages\//, "");
  // Fallback for absolute-style paths.
  rel = rel.replace(/^.*\/src\/pages\//, "");
  rel = rel.replace(/^.*\/src\/routes\//, "");

  const noExt = stripExt(rel);

  // Drop trailing /index.
  const cleaned = noExt.replace(/\/index$/i, "");

  // Drop dynamic route segments like [slug].
  if (cleaned.includes("[") && cleaned.includes("]")) return null;

  const segments = cleaned.split("/");
  const last = segments[segments.length - 1] || "";
  if (!last) return "home";

  const key = toKebabCase(last);
  if (!key || key === "index") return "home";

  return key;
}

function toKeyFromBlogFile(file: string) {
  const f = normalizeSlashes(file);

  let rel = f;
  rel = rel.replace(/^(\.\.\/)+content\/blog\//, "");
  rel = rel.replace(/^.*\/src\/content\/blog\//, "");

  const noExt = stripExt(rel);

  // Skip index-like files if you have them.
  if (noExt.toLowerCase().endsWith("/index")) {
    return `blog/${noExt.slice(0, -"/index".length)}`.replace(/\/$/, "");
  }

  return `blog/${noExt}`;
}

function toKeyFromResearchFile(file: string) {
  const f = normalizeSlashes(file);

  let rel = f;
  rel = rel.replace(/^(\.\.\/)+content\/research\//, "");
  rel = rel.replace(/^.*\/src\/content\/research\//, "");

  const noExt = stripExt(rel);
  if (noExt.toLowerCase().endsWith("/index")) {
    return `research/${noExt.slice(0, -"/index".length)}`.replace(/\/$/, "");
  }
  return `research/${noExt}`;
}

function toKeyFromResourcesFile(file: string) {
  const f = normalizeSlashes(file);

  let rel = f;
  rel = rel.replace(/^(\.\.\/)+content\/resources\//, "");
  rel = rel.replace(/^.*\/src\/content\/resources\//, "");

  const noExt = stripExt(rel);
  if (noExt.toLowerCase().endsWith("/index")) {
    return `resources/${noExt.slice(0, -"/index".length)}`.replace(/\/$/, "");
  }
  return `resources/${noExt}`;
}

export const SITE_PAGE_KEYS: string[] = (() => {
  /**
   * Notes:
   * - Do not use `eager: true` here.
   * - We only need file paths, not module contents.
   * - This keeps Vite from trying to parse .md/.mdx as JS.
   */

  // Pages (tsx/ts).
  const pageFiles = import.meta.glob("../pages/**/*.{tsx,ts}");

  // Content posts (md/mdx).
  // Use the `?raw` query so Vite treats these as plain text strings and does
  // not try to parse Markdown as JavaScript during the bundle. We only use the
  // keys, not the loaded contents.
  const blogFiles = import.meta.glob("../content/blog/**/*.{md,mdx}", {
    query: "?raw",
    import: "default",
  });
  const researchFiles = import.meta.glob("../content/research/**/*.{md,mdx}", {
    query: "?raw",
    import: "default",
  });
  const resourcesFiles = import.meta.glob("../content/resources/**/*.{md,mdx}", {
    query: "?raw",
    import: "default",
  });

  const keys = new Set<string>();

  for (const file of Object.keys(pageFiles)) {
    const k = toKeyFromPageFile(file);
    if (k) keys.add(k);
  }

  for (const file of Object.keys(blogFiles)) {
    const k = toKeyFromBlogFile(file);
    if (k) keys.add(k);
  }

  for (const file of Object.keys(researchFiles)) {
    const k = toKeyFromResearchFile(file);
    if (k) keys.add(k);
  }

  for (const file of Object.keys(resourcesFiles)) {
    const k = toKeyFromResourcesFile(file);
    if (k) keys.add(k);
  }

  // Always ensure home exists.
  keys.add("home");

  return Array.from(keys).sort();
})();
