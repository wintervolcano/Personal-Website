import { kv } from "@vercel/kv";

// POST /api/detections?id=<pulsarId>
// Increments the global detection count for that pulsar and returns { id, count }.
// GET /api/detections?id=<pulsarId> returns the current { id, count } without incrementing.
export default async function handler(req: any, res: any) {
  const url = new URL(req.url);
  const idParam = url.searchParams.get("id") || (req.query && req.query.id);
  const id = typeof idParam === "string" ? idParam.trim() : "";

  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }

  const key = `pulsar:detections:${id}`;

  try {
    if (req.method === "POST") {
      const count = await kv.incr(key);
      res.status(200).json({ id, count });
      return;
    }

    if (req.method === "GET") {
      const raw = (await kv.get<number>(key)) ?? 0;
      res.status(200).json({ id, count: raw });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    res.status(500).json({ error: "KV error", detail: String(e) });
  }
}

