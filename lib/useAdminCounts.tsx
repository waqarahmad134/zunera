"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { SECTIONS } from "@/lib/adminConfig";

interface AdminCounts {
  /** Item count per non-singleton section slug, plus a synthetic "media" key. */
  counts: Record<string, number>;
  publishedPosts: number;
  mediaCount: number;
  loading: boolean;
}

const AdminCountsContext = createContext<AdminCounts>({
  counts: {},
  publishedPosts: 0,
  mediaCount: 0,
  loading: true,
});

export function useAdminCounts() {
  return useContext(AdminCountsContext);
}

// Fetches item counts for every collection section (plus the media library)
// once per admin session and shares them with the sidebar and dashboard, so
// neither has to duplicate the fetching logic.
export function AdminCountsProvider({ children }: { children: ReactNode }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [publishedPosts, setPublishedPosts] = useState(0);
  const [mediaCount, setMediaCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const collections = SECTIONS.filter((s) => !s.singleton);

    (async () => {
      const [entries, mediaFiles] = await Promise.all([
        Promise.all(
          collections.map(async (s) => {
            const res = await fetch(`/api/admin/content?section=${s.slug}`);
            if (!res.ok) return { slug: s.slug, count: 0, published: null as number | null };
            const { data } = await res.json();
            const arr: { published?: boolean }[] = Array.isArray(data) ? data : [];
            const published = s.slug === "posts" ? arr.filter((p) => p.published).length : null;
            return { slug: s.slug, count: arr.length, published };
          })
        ),
        fetch("/api/admin/media")
          .then((r) => (r.ok ? r.json() : { files: [] }))
          .then((b) => b.files?.length ?? 0)
          .catch(() => 0),
      ]);

      if (cancelled) return;
      const next: Record<string, number> = { media: mediaFiles };
      for (const e of entries) {
        next[e.slug] = e.count;
        if (e.published !== null) setPublishedPosts(e.published);
      }
      setCounts(next);
      setMediaCount(mediaFiles);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminCountsContext.Provider value={{ counts, publishedPosts, mediaCount, loading }}>
      {children}
    </AdminCountsContext.Provider>
  );
}
