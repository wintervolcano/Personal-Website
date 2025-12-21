export type CollectionKey = "blog" | "research" | "resources";

export type MdDoc = {
  slug: string;
  collection: CollectionKey;
  title: string;
  date: string;
  description?: string;
  tags?: string[];
  body: string;
};

type Frontmatter = {
  title?: string;
  date?: string;
  description?: string;
  tags?: string[];
};

function parseFrontmatter(raw: string): { fm: Frontmatter; body: string } {
  const s = raw.trimStart();
  if (!s.startsWith("---")) return { fm: {}, body: raw };

  const end = s.indexOf("\n---", 3);
  if (end === -1) return { fm: {}, body: raw };

  const fmBlock = s.slice(3, end).trim();
  const body = s.slice(end + "\n---".length).replace(/^\s*\n/, "");

  const fm: Frontmatter = {};
  const lines = fmBlock
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!m) continue;

    const key = m[1];
    let val = m[2].trim();
    val = val.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");

    if (key === "tags") {
      const arr = val.match(/^\[(.*)\]$/);
      if (arr) {
        const inner = arr[1].trim();
        fm.tags = inner
          ? inner
              .split(",")
              .map((x) => x.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1"))
              .filter(Boolean)
          : [];
      } else {
        fm.tags = val.split(",").map((x) => x.trim()).filter(Boolean);
      }
      continue;
    }

    if (key === "title") fm.title = val;
    if (key === "date") fm.date = val;
    if (key === "description") fm.description = val;
  }

  return { fm, body };
}

function slugFromPath(path: string) {
  const name = path.split("/").pop() || path;
  return name.replace(/\.md$/i, "");
}

// Vite v7 glob (raw import) ✅
const BLOG_MODULES = import.meta.glob<string>("../content/blog/*.md", {
  query: "?raw",
  import: "default",
});
const RESEARCH_MODULES = import.meta.glob<string>("../content/research/*.md", {
  query: "?raw",
  import: "default",
});
const RESOURCES_MODULES = import.meta.glob<string>("../content/resources/*.md", {
  query: "?raw",
  import: "default",
});

export async function loadCollection(collection: CollectionKey): Promise<MdDoc[]> {
  const modules =
    collection === "blog"
      ? BLOG_MODULES
      : collection === "research"
        ? RESEARCH_MODULES
        : RESOURCES_MODULES;

  const entries = await Promise.all(
    Object.entries(modules).map(async ([path, loader]) => {
      const raw = await loader();
      const { fm, body } = parseFrontmatter(raw);
      const slug = slugFromPath(path);

      const doc: MdDoc = {
        slug,
        collection,
        title: fm.title || slug,
        date: fm.date || "1970-01-01",
        description: fm.description,
        tags: fm.tags || [],
        body,
      };
      return doc;
    })
  );

  entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return entries;
}