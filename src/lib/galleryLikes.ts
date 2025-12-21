export type GalleryLikeSnapshot = {
  id: string;
  likes: number;
  likedByMe?: boolean;
};

// Fetch like counts for a set of gallery IDs.
// This assumes you expose an API at /api that accepts
// ?ids=id1,id2,… and returns an array of { id, likes, likedByMe }.
export async function fetchGalleryLikes(
  ids: string[]
): Promise<Record<string, GalleryLikeSnapshot>> {
  if (!ids.length) return {};
  try {
    const params = new URLSearchParams({ ids: ids.join(",") });
    const res = await fetch(`/api?${params.toString()}`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as GalleryLikeSnapshot[];
    const out: Record<string, GalleryLikeSnapshot> = {};
    for (const row of data) {
      if (!row || !row.id) continue;
      out[row.id] = { id: row.id, likes: row.likes ?? 0, likedByMe: !!row.likedByMe };
    }
    return out;
  } catch {
    // Fallback: no backend wired yet.
    const out: Record<string, GalleryLikeSnapshot> = {};
    for (const id of ids) out[id] = { id, likes: 0, likedByMe: false };
    return out;
  }
}

// Toggle a like for a single image.
// Expects a backend at /api/id?id=<id> that increments/decrements
// and returns the updated { id, likes, likedByMe }.
export async function toggleGalleryLike(
  id: string,
  nextLiked: boolean
): Promise<GalleryLikeSnapshot | null> {
  try {
    const params = new URLSearchParams({ id });
    const res = await fetch(`/api/id?${params.toString()}`, {
      method: nextLiked ? "POST" : "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as GalleryLikeSnapshot;
    return { id: data.id, likes: data.likes ?? 0, likedByMe: !!data.likedByMe };
  } catch {
    return null;
  }
}
