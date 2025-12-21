import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
    const { pathname, search, hash } = useLocation();

    useEffect(() => {
        // If you're navigating to an anchor (#something), let the browser handle it.
        if (hash) return;

        // Scroll to top on route change
        window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    }, [pathname, search, hash]);

    return null;
}