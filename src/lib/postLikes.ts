export type PostLikeSnapshot = {
  id: string;
  likes: number;
  likedByMe?: boolean;
};

const LOCAL_KEY_PREFIX = "postLike:";

function getLocalLiked(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(LOCAL_KEY_PREFIX + id) === "1";
  } catch {
    return false;
  }
}

function setLocalLiked(id: string, liked: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (liked) {
      window.localStorage.setItem(LOCAL_KEY_PREFIX + id, "1");
    } else {
      window.localStorage.removeItem(LOCAL_KEY_PREFIX + id);
    }
  } catch {
    // ignore
  }
}

// Fetch like counts for a set of post IDs.
// Backend: GET /api/post-likes?ids=id1,id2,…
export async function fetchPostLikes(
  ids: string[]
): Promise<Record<string, PostLikeSnapshot>> {
  if (!ids.length) return {};

  try {
    const params = new URLSearchParams({ ids: ids.join(",") });
    const res = await fetch(`/api/post-likes?${params.toString()}`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as PostLikeSnapshot[];
    const out: Record<string, PostLikeSnapshot> = {};
    for (const row of data) {
      if (!row || !row.id) continue;
      const likedByMe = getLocalLiked(row.id);
      out[row.id] = {
        id: row.id,
        likes: row.likes ?? 0,
        likedByMe,
      };
    }
    return out;
  } catch {
    const out: Record<string, PostLikeSnapshot> = {};
    for (const id of ids) {
      out[id] = { id, likes: 0, likedByMe: getLocalLiked(id) };
    }
    return out;
  }
}

// Toggle a like for a single post.
// Backend: POST /api/post-like?id=<id> to like,
//          DELETE /api/post-like?id=<id> to unlike.
export async function togglePostLike(
  id: string,
  nextLiked: boolean
): Promise<PostLikeSnapshot | null> {
  try {
    const params = new URLSearchParams({ id });
    const res = await fetch(`/api/post-like?${params.toString()}`, {
      method: nextLiked ? "POST" : "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as PostLikeSnapshot;
    const likedByMe = nextLiked;
    setLocalLiked(id, likedByMe);
    return {
      id: data.id,
      likes: data.likes ?? 0,
      likedByMe,
    };
  } catch {
    // If the request fails, don't flip local storage.
    return null;
  }
}

