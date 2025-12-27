import { kv } from "@vercel/kv";
import { PULSARS } from "../src/lib/pulsars";

type DetectionEvent = {
  id: string;
  count: number;
  country: string;
  userAgent?: string;
  ts: string;
};

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const expected = (process.env.PULSAR_DASHBOARD_TOKEN || "").trim();
  const tokenFromHeader = req.headers["x-admin-token"];

  let tokenFromQuery: string | null = null;
  try {
    const url = new URL(req.url);
    tokenFromQuery = url.searchParams.get("token");
  } catch {
    // ignore
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
    const items = await Promise.all(
      PULSARS.map(async (p) => {
        const id = p.id;
        const key = `pulsar:detections:${id}`;
        const count = (await kv.get<number>(key)) ?? 0;
        return { id, name: p.name, count };
      })
    );

    items.sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));

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

    res.status(200).json({
      totalDetections: items.reduce((sum, x) => sum + x.count, 0),
      pulsars: items,
      events,
    });
  } catch (e) {
    res.status(500).json({ error: "KV error", detail: String(e) });
  }
}
