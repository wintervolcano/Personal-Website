import { kv } from "@vercel/kv";

// GET /api/gallery-likes?ids=id1,id2,...
// Returns: [{ id, likes, likedByMe }]
export default async function handler(req: any, res: any) {
    if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const rawIds =
        typeof req.query?.ids === "string"
            ? req.query.ids
            : Array.isArray(req.query?.ids)
                ? req.query.ids.join(",")
                : "";

    const ids = String(rawIds)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    if (!ids.length) {
        res.status(200).json([]);
        return;
    }

    const keys = ids.map((id) => `gallery:likes:${id}`);
    const values = ((await kv.mget(...keys)) || []) as Array<number | null>;

    const payload = ids.map((id, idx) => ({
        id,
        likes: (values[idx] ?? 0) as number,
        likedByMe: false, // we don't persist per-user, just the count
    }));

    res.status(200).json(payload);
}
