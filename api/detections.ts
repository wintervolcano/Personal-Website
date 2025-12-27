import { kv } from "@vercel/kv";

// POST /api/detections?id=<pulsarId>
// Increments the global detection count for that pulsar and returns { id, count }.
// Also appends a small event record (time + country) to a rolling log in KV.
// GET /api/detections?id=<pulsarId> returns the current { id, count } without incrementing.
export default async function handler(req: any, res: any) {
  let idParam: string | null = null;
  try {
    if (req.url) {
      const url = new URL(req.url, "http://localhost");
      idParam = url.searchParams.get("id");
    }
  } catch {
    // ignore URL parsing errors; we'll fall back to req.query below
  }

  if (!idParam && req.query && typeof req.query === "object") {
    const q = req.query as any;
    if (typeof q.id === "string") {
      idParam = q.id;
    } else if (Array.isArray(q.id) && q.id.length > 0) {
      idParam = q.id[0];
    }
  }

  const id = typeof idParam === "string" ? idParam.trim() : "";

  // Optional page key (where the detection occurred)
  let pageParam: string | null = null;
  try {
    if (req.url) {
      const url = new URL(req.url, "http://localhost");
      pageParam = url.searchParams.get("page");
    }
  } catch {
    // ignore
  }
  if (!pageParam && req.query && typeof req.query === "object") {
    const q = req.query as any;
    if (typeof q.page === "string") {
      pageParam = q.page;
    } else if (Array.isArray(q.page) && q.page.length > 0) {
      pageParam = q.page[0];
    }
  }
  const page = typeof pageParam === "string" ? pageParam.trim() : "";

  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }

  const key = `pulsar:detections:${id}`;

  try {
    if (req.method === "POST") {
      const count = await kv.incr(key);

      // lightweight event entry so the internal dashboard can show when / where detections happened.
      try {
        const headers = req.headers || {};
        const country =
          (headers["x-vercel-ip-country"] as string | undefined) ||
          (headers["cf-ipcountry"] as string | undefined) ||
          "unknown";
        const ua = (headers["user-agent"] as string | undefined) || "unknown";

        const event = {
          id,
          count,
          country,
          userAgent: ua,
          ts: new Date().toISOString(),
          page: page || null,
        };

        // Append to a Redis list log (newest first) so every detection
        // is available to the dashboard in order.
        try {
          const listKey = "pulsar:detections:events";
          await kv.lpush(listKey, JSON.stringify(event));
          await kv.ltrim(listKey, 0, 999);
        } catch {
          // ignore list logging failures
        }

        // Also keep a JSON-array mirror under a v2 key as a fallback.
        try {
          const logKey = "pulsar:detections:events:v2";
          const existing = await kv.get(logKey);
          let arr: any[] = [];
          if (Array.isArray(existing)) {
            arr = existing;
          } else if (typeof existing === "string") {
            try {
              const parsed = JSON.parse(existing);
              if (Array.isArray(parsed)) arr = parsed;
            } catch {
              // ignore corrupt logs
            }
          }
          arr.unshift(event);
          if (arr.length > 1000) arr = arr.slice(0, 1000);
          await kv.set(logKey, arr);
        } catch {
          // ignore JSON-array logging failures
        }
      } catch {
        // Ignore logging failures; never block the user-facing action.
      }

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
