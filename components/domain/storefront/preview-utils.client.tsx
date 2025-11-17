"use client";

import { useEffect } from "react";

/**
 * Ensures that when sf_preview=1 cookie is present, the current URL shows preview=1
 * and internal links preserve preview=1 in the query string for clarity.
 */
export default function PreviewLinkManager() {
  useEffect(() => {
    const isPreview = typeof document !== "undefined" && document.cookie.split("; ").some((c) => c.trim().startsWith("sf_preview=1"));
    if (!isPreview) return;

    // 1) Ensure current URL visibly includes preview=1 (without navigation)
    try {
      const url = new URL(window.location.href);
      if (!url.searchParams.has("preview")) {
        url.searchParams.set("preview", "1");
        window.history.replaceState({}, "", url.toString());
      }
    } catch {}

    // 2) Helper to add preview=1 to a given href if it's same-origin/internal
    const withPreview = (href: string): string => {
      try {
        if (!href) return href;
        if (href.startsWith("#")) return href; // anchors
        const base = window.location.origin;
        const u = href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//")
          ? new URL(href, base)
          : new URL(href, base);
        if (u.origin !== base) return href; // external
        if (!u.searchParams.has("preview")) u.searchParams.set("preview", "1");
        return u.pathname + (u.search ? u.search : "") + (u.hash ? u.hash : "");
      } catch {
        return href;
      }
    };

    const processAnchors = (root: ParentNode) => {
      const anchors = Array.from(root.querySelectorAll<HTMLAnchorElement>("a[href]"));
      for (const a of anchors) {
        const newHref = withPreview(a.getAttribute("href") || "");
        if (newHref) a.setAttribute("href", newHref);
      }
    };

    processAnchors(document);

    // Observe future mutations (e.g., client-side rendered lists)
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1) {
            processAnchors(n as ParentNode);
          }
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}