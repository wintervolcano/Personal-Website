import { kv } from "@vercel/kv";
import { PULSARS } from "../src/lib/pulsars";
import { getTrapumPulsars } from "../src/lib/trapumPulsars";

type DetectionEvent = {
  id: string;
  count: number;
  country: string;
  userAgent?: string;
  ts: string;
  page?: string | null;
};

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const expected = (process.env.PULSAR_DASHBOARD_TOKEN || "").trim();
  const tokenFromHeader = req.headers["x-admin-token"];

  let tokenFromQuery: string | null = null;
  // Vercel / Node may expose query both on req.url and req.query; support both.
  try {
    if (req.url) {
      const url = new URL(req.url, "http://localhost");
      tokenFromQuery = url.searchParams.get("token");
    }
  } catch {
    // ignore URL parsing issues
  }
  if (!tokenFromQuery && req.query && typeof req.query === "object") {
    const q = (req as any).query;
    if (typeof q.token === "string") {
      tokenFromQuery = q.token;
    } else if (Array.isArray(q.token) && q.token.length > 0) {
      tokenFromQuery = q.token[0];
    }
  }

  const rawToken =
    (typeof tokenFromHeader === "string" && tokenFromHeader) ||
    (Array.isArray(tokenFromHeader) ? tokenFromHeader[0] : null) ||
    tokenFromQuery;

  const token = typeof rawToken === "string" ? rawToken.trim() : rawToken;

  if (!expected) {
    res.status(401).json({
      error: "Server missing PULSAR_DASHBOARD_TOKEN",
      expectedLength: 0,
      tokenLength: typeof token === "string" ? token.length : null,
    });
    return;
  }

  if (!token || token !== expected) {
    res.status(401).json({
      error: "Unauthorized",
      reason: !token ? "missing_token" : "mismatch",
      expectedLength: expected.length,
      tokenLength: typeof token === "string" ? token.length : null,
    });
    return;
  }

  try {
    // Merge "static" pulsars and TRAPUM detections into one ID set so the
    // dashboard shows detections from both sources.
    const idMap = new Map<string, { id: string; name: string }>();

    for (const p of PULSARS) {
      if (!idMap.has(p.id)) idMap.set(p.id, { id: p.id, name: p.name });
    }
    try {
      const trapum = getTrapumPulsars();
      for (const t of trapum) {
        const id = (t as any).slug as string;
        const name = (t as any).name as string;
        if (id && !idMap.has(id)) {
          idMap.set(id, { id, name });
        }
      }
    } catch {
      // If TRAPUM data isn't available server-side, we still return the static set.
    }

    // Load the most recent detection events (if any) for richer diagnostics.
    let events: DetectionEvent[] = [];
    try {
      const rawEvents = await kv.lrange<string>("pulsar:detections:events", 0, 199);
      events =
        rawEvents
          ?.map((s) => {
            try {
              return JSON.parse(s) as DetectionEvent;
            } catch {
              return null;
            }
          })
          .filter((e): e is DetectionEvent => !!e) ?? [];
    } catch {
      // If the log key doesn't exist yet or KV doesn't support lists, just omit events.
      events = [];
    }

    // Build a quick lookup of the most recent event per pulsar ID.
    const latestById = new Map<string, DetectionEvent>();
    for (const ev of events) {
      const prev = latestById.get(ev.id);
      if (!prev || ev.ts > prev.ts) {
        latestById.set(ev.id, ev);
      }
    }

    const items = await Promise.all(
      Array.from(idMap.values()).map(async ({ id, name }) => {
        const key = `pulsar:detections:${id}`;
        const count = (await kv.get<number>(key)) ?? 0;

        let lastTs: string | null = null;
        let lastCountry: string | null = null;
        let lastPage: string | null = null;
        try {
          const lastRaw = await kv.get<string>(`pulsar:detections:last:${id}`);
          if (typeof lastRaw === "string") {
            const ev = JSON.parse(lastRaw) as DetectionEvent;
            lastTs = ev.ts || null;
            lastCountry = ev.country || null;
            lastPage = (ev.page as string | null) ?? null;
          } else {
            const ev = latestById.get(id);
            if (ev) {
              lastTs = ev.ts || null;
              lastCountry = ev.country || null;
              lastPage = (ev.page as string | null) ?? null;
            }
          }
        } catch {
          const ev = latestById.get(id);
          if (ev) {
            lastTs = ev.ts || null;
            lastCountry = ev.country || null;
            lastPage = (ev.page as string | null) ?? null;
          }
        }

        return { id, name, count, lastTs, lastCountry, lastPage };
      })
    );

    items.sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));

    res.status(200).json({
      totalDetections: items.reduce((sum, x) => sum + x.count, 0),
      pulsars: items,
      events,
    });
  } catch (e) {
    res.status(500).json({ error: "KV error", detail: String(e) });
  }
}
