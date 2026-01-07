import { useEffect } from "react";

const SITE_ORIGIN = "https://www.fazalkareem.com";

export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }

    if (description) {
      let tag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement("meta");
        tag.name = "description";
        document.head.appendChild(tag);
      }
      tag.content = description;
    }

    // Keep the canonical URL in sync with the current path.
    if (typeof window !== "undefined") {
      const path = window.location.pathname || "/";
      const canonicalUrl = `${SITE_ORIGIN}${path}`;

      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonicalUrl;
    }
  }, [title, description]);
}
