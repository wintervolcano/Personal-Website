import { kv } from "@vercel/kv";

// POST /api/post-like?id=<id>   -> increment like count
// DELETE /api/post-like?id=<id> -> decrement like count (clamped at 0)
// Response: { id, likes, likedByMe }
export default async function handler(req: any, res: any) {
    const id = String(req.query?.id || "").trim();
    if (!id) {
        res.status(400).json({ error: "Missing id" });
        return;
    }

    const key = `post:likes:${id}`;

    if (req.method === "POST") {
        const likes = await kv.incr(key);
        res.status(200).json({ id, likes, likedByMe: true });
        return;
    }

    if (req.method === "DELETE") {
        const current = (await kv.get<number>(key)) ?? 0;
        const next = current > 0 ? current - 1 : 0;
        await kv.set(key, next);
        res.status(200).json({ id, likes: next, likedByMe: false });
        return;
    }

    res.status(405).json({ error: "Method not allowed" });
}

