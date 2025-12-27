import { kv } from "@vercel/kv";
import { PULSARS } from "../src/lib/pulsars";
import { getTrapumPulsars } from "../src/lib/trapumPulsars";

type StoredDetectionEvent = {
  id: string;
  count: number;
  country: string;
  userAgent?: string;
  ts: string;
  page?: string | null;
};

export type DetectionEvent = StoredDetectionEvent & {
  name: string;
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
    // Merge "static" pulsars and TRAPUM detections into one ID set
    // so we can attach human-readable names to each detection.
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

    // Load full detection log as a JSON array.
    let storedEvents: StoredDetectionEvent[] = [];
    try {
      // Read from the v2 JSON-array log. Older deployments wrote a Redis list
      // under "pulsar:detections:events", which isn't compatible with kv.get,
      // so we use a fresh key here.
      const raw = await kv.get<string>("pulsar:detections:events:v2");
      if (typeof raw === "string") {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          storedEvents = parsed
            .map((x): StoredDetectionEvent | null => {
              if (!x || typeof x !== "object") return null;
              const id = (x as any).id;
              const ts = (x as any).ts;
              if (typeof id !== "string" || typeof ts !== "string") return null;
              return {
                id,
                ts,
                count: typeof (x as any).count === "number" ? (x as any).count : 0,
                country: typeof (x as any).country === "string" ? (x as any).country : "unknown",
                userAgent: typeof (x as any).userAgent === "string" ? (x as any).userAgent : undefined,
                page:
                  typeof (x as any).page === "string"
                    ? (x as any).page
                    : (x as any).page == null
                    ? null
                    : String((x as any).page),
              };
            })
            .filter((x): x is StoredDetectionEvent => !!x);
        }
      }
    } catch {
      storedEvents = [];
    }

    // Attach names and sort newest-first.
    const events: DetectionEvent[] = storedEvents
      .map((ev) => {
        const meta = idMap.get(ev.id);
        return {
          ...ev,
          name: meta?.name ?? ev.id,
        };
      })
      .sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0));

    // Aggregate counts per pulsar for the summary table.
    const counts = new Map<string, number>();
    for (const ev of storedEvents) {
      counts.set(ev.id, (counts.get(ev.id) ?? 0) + 1);
    }

    const pulsars = Array.from(idMap.values())
      .map(({ id, name }) => ({
        id,
        name,
        count: counts.get(id) ?? 0,
      }))
      .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));

    res.status(200).json({
      totalDetections: storedEvents.length,
      pulsars,
      events,
    });
  } catch (e) {
    res.status(500).json({ error: "KV error", detail: String(e) });
  }
}
