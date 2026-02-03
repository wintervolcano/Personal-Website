import { useEffect } from "react";

const SITE_ORIGIN = "https://www.fazalkareem.com";
const DEFAULT_OG_IMAGE = "/logo.png";

type PageMetaOptions = {
  ogImage?: string;
  ogType?: string;
};

function setMetaTag(property: string, content: string, useProperty = false) {
  const selector = useProperty
    ? `meta[property="${property}"]`
    : `meta[name="${property}"]`;
  let tag = document.querySelector(selector) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    if (useProperty) {
      tag.setAttribute("property", property);
    } else {
      tag.name = property;
    }
    document.head.appendChild(tag);
  }
  tag.content = content;
}

export function usePageMeta(
  title: string,
  description?: string,
  options?: PageMetaOptions
) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }

    if (description) {
      setMetaTag("description", description);
    }

    // Keep the canonical URL in sync with the current path.
    let canonicalUrl = SITE_ORIGIN;
    if (typeof window !== "undefined") {
      const path = window.location.pathname || "/";
      canonicalUrl = `${SITE_ORIGIN}${path}`;

      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonicalUrl;
    }

    // Open Graph meta tags
    if (title) {
      setMetaTag("og:title", title, true);
    }
    if (description) {
      setMetaTag("og:description", description, true);
    }
    setMetaTag("og:url", canonicalUrl, true);
    setMetaTag("og:type", options?.ogType || "website", true);
    setMetaTag("og:site_name", "Fazal Kareem", true);

    const ogImage = options?.ogImage || DEFAULT_OG_IMAGE;
    const fullOgImage = ogImage.startsWith("http") ? ogImage : `${SITE_ORIGIN}${ogImage}`;
    setMetaTag("og:image", fullOgImage, true);

    // Twitter Card meta tags
    setMetaTag("twitter:card", "summary_large_image");
    if (title) {
      setMetaTag("twitter:title", title);
    }
    if (description) {
      setMetaTag("twitter:description", description);
    }
    setMetaTag("twitter:image", fullOgImage);
  }, [title, description, options?.ogImage, options?.ogType]);
}
