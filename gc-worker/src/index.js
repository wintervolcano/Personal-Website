/**
 * Cloudflare Worker: GC3D Proxy (Baumgardt combined_table.txt + Freire GCpsr.txt)
 *
 * v5 Fix:
 */

const WORKER_VERSION = "gc3d_combined_v5";

const SRC = {
  clusters: "https://people.smp.uq.edu.au/HolgerBaumgardt/globular/combined_table.txt",
  pulsars: "https://www3.mpifr-bonn.mpg.de/staff/pfreire/GCpsr.txt",
};

// ICRS(J2000) -> Galactic rotation matrix (common J2000 constants).
const A0G = [
  [-0.0548755604162154, -0.8734370902348850, -0.4838350155487132],
  [0.4941094278755837, -0.4448296299600112, 0.7469822444972189],
  [-0.8676661490190047, -0.1980763734312015, 0.4559837761750669],
];

function corsHeaders(extra = {}) {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type, if-none-match",
    ...extra,
  };
}

async function fetchWithRetry(url, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await fetch(url, {
        headers: { "user-agent": "gc-3d-map/1.4" },
        redirect: "follow",
      });
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

function safeNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function prettyClusterToken(token) {
  return String(token || "").trim().replace(/_/g, " ");
}

function normKey(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function radecToGalacticDeg(raDeg, decDeg) {
  const ra = (raDeg * Math.PI) / 180;
  const dec = (decDeg * Math.PI) / 180;

  const x = Math.cos(dec) * Math.cos(ra);
  const y = Math.cos(dec) * Math.sin(ra);
  const z = Math.sin(dec);

  const gx = A0G[0][0] * x + A0G[0][1] * y + A0G[0][2] * z;
  const gy = A0G[1][0] * x + A0G[1][1] * y + A0G[1][2] * z;
  const gz = A0G[2][0] * x + A0G[2][1] * y + A0G[2][2] * z;

  let l = Math.atan2(gy, gx);
  if (l < 0) l += 2 * Math.PI;
  const b = Math.asin(Math.max(-1, Math.min(1, gz)));

  return { l: (l * 180) / Math.PI, b: (b * 180) / Math.PI };
}

function parseCombinedTable(txt) {
  const lines = txt.split(/\r?\n/).filter(Boolean);

  const headerLine = lines.find((l) => l.startsWith("# Cluster") && l.includes("RA") && l.includes("DEC"));
  if (!headerLine) throw new Error("Could not find combined_table header line (# Cluster ...)");

  const fields = headerLine.replace(/^#\s*/, "").trim().split(/\s+/);

  const clusters = [];
  for (const line of lines) {
    if (line.startsWith("#")) continue;
    const partsRaw = line.trim().split(/\s+/);

    // Robust: allow missing trailing columns; pad with nulls
    const parts = partsRaw.slice(0, fields.length);
    while (parts.length < fields.length) parts.push(null);

    const row = {};
    for (let i = 0; i < fields.length; i++) row[fields[i]] = parts[i];

    const clusterToken = row["Cluster"];
    if (!clusterToken) continue;

    const id = prettyClusterToken(clusterToken);
    const name = id;
    const key = id; // key is exactly the cluster name/id

    const ra_deg = safeNum(row["RA"]);
    const dec_deg = safeNum(row["DEC"]);
    const rsun_kpc = safeNum(row["R_Sun"]);
    const rgc_kpc = safeNum(row["R_GC"]);
    if (ra_deg == null || dec_deg == null || rsun_kpc == null) continue;

    const { l, b } = radecToGalacticDeg(ra_deg, dec_deg);

    clusters.push({
      id,
      name,
      key,
      cluster_token: clusterToken,
      ra_deg,
      dec_deg,
      l,
      b,
      rsun_kpc,
      rgc_kpc,
      vmag: safeNum(row["V"]),
      mass_msun: safeNum(row["Mass"]),
      rc_pc: safeNum(row["rc"]),
      rhl_pc: safeNum(row["rh,l"]),
      rhm_pc: safeNum(row["rh,m"]),
      rt_pc: safeNum(row["rt"]),
    });
  }

  return clusters;
}

function addAlias(map, alias, arrRef) {
  const k = normKey(alias);
  if (!k) return;
  if (!map[k]) map[k] = arrRef;
}

function parseMaybeNum(tok) {
  if (tok == null) return null;
  let s = String(tok).trim();
  if (!s || s === "*" || s.toLowerCase() === "i") return null;

  // normalize unicode minus to ASCII hyphen
  s = s.replace(/−/g, "-");

  // strip uncertainties in parentheses: 24.599(2) -> 24.599 ; -4.9850(6) -> -4.9850
  s = s.replace(/\([^)]*\)/g, "");

  // strip leading < or >, keep numeric part
  s = s.replace(/^[<>]/, "");

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseGCpsr(txt) {
  // Map: normalized cluster key -> pulsars[]
  // Adds aliases so cluster.key = "NGC 104" matches if header is "47 Tuc (NGC 104)" etc.
  const lines = txt.split(/\r?\n/);
  const byKey = {};
  let currentArr = null;
  let currentHeader = null;

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line || line.startsWith("#")) continue;

    // Cluster header line: not starting with a pulsar name like Jxxxx or Bxxxx
    if (!/^\s*(J|B)\d/.test(line)) {
      currentHeader = line.trim();
      const k = normKey(currentHeader);
      byKey[k] = byKey[k] || [];
      currentArr = byKey[k];

      // Aliases:
      addAlias(byKey, currentHeader.replace(/\(.*?\)/g, "").trim(), currentArr); // without parentheses
      const ngcMatches = currentHeader.match(/NGC\s*\d+/ig) || [];
      for (const ngc of ngcMatches) addAlias(byKey, ngc.replace(/\s+/g, " ").trim(), currentArr);
      const mMatches = currentHeader.match(/\bM\s*\d+\b/ig) || [];
      for (const m of mMatches) addAlias(byKey, m.replace(/\s+/g, " ").trim(), currentArr);
      const terzan = currentHeader.match(/\bTerzan\s+(\d+)\b/i);
      if (terzan) addAlias(byKey, `Ter ${terzan[1]}`, currentArr);
      const tershort = currentHeader.match(/\bTer\s+(\d+)\b/i);
      if (tershort) addAlias(byKey, `Terzan ${tershort[1]}`, currentArr);
      addAlias(byKey, currentHeader.replace(/\s+/g, "_"), currentArr);

      continue;
    }

    if (!currentArr) continue;

    // Pulsar line columns (from GCpsr table):
    // name, offset_arcmin, P0_ms, Pdot(1e-20), DM, Pb_days, x_seconds, e, mc, ... (notes/refs may follow)
    const cols = line.trim().split(/\s+/);
    const name = cols[0];

    const offset_arcmin = parseMaybeNum(cols[1]);
    const period_ms = parseMaybeNum(cols[2]);
    const pdot_1e20 = parseMaybeNum(cols[3]);
    const dm = parseMaybeNum(cols[4]);
    const pb_days = parseMaybeNum(cols[5]);
    const x_s = parseMaybeNum(cols[6]);
    const ecc = parseMaybeNum(cols[7]);
    const mc_msun = parseMaybeNum(cols[8]);

    currentArr.push({
      name,
      offset_arcmin,
      period_ms,
      pdot_1e20,
      dm,
      pb_days,
      x_s,
      ecc,
      mc_msun,
      raw: line,
      cluster_header: currentHeader,
    });
  }

  return byKey;
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });

    const noCache = url.searchParams.get("nocache") === "1";

    const cacheKey = new Request(url.toString(), req);
    if (!noCache) {
      const cached = await caches.default.match(cacheKey);
      if (cached) return cached;
    }

    try {
      if (url.pathname === "/api/clusters") {
        const res = await fetchWithRetry(SRC.clusters, 3);
        if (!res.ok) return new Response("Upstream combined_table fetch failed", { status: 502, headers: corsHeaders() });

        const txt = await res.text();
        const clusters = parseCombinedTable(txt);

        const body = JSON.stringify({
          worker_version: WORKER_VERSION,
          updated: new Date().toISOString(),
          source: SRC.clusters,
          count: clusters.length,
          clusters,
        });

        const resp = new Response(body, {
          headers: corsHeaders({
            "content-type": "application/json",
            "cache-control": noCache ? "no-store" : "public, max-age=21600",
          }),
        });

        if (!noCache) ctx.waitUntil(caches.default.put(cacheKey, resp.clone()));
        return resp;
      }

      if (url.pathname === "/api/pulsars") {
        const res = await fetchWithRetry(SRC.pulsars, 3);
        if (!res.ok) return new Response("Upstream GCpsr fetch failed", { status: 502, headers: corsHeaders() });

        const txt = await res.text();
        const byKey = parseGCpsr(txt);

        const body = JSON.stringify({
          worker_version: WORKER_VERSION,
          updated: new Date().toISOString(),
          source: SRC.pulsars,
          byKey,
        });

        const resp = new Response(body, {
          headers: corsHeaders({
            "content-type": "application/json",
            "cache-control": noCache ? "no-store" : "public, max-age=21600",
          }),
        });

        if (!noCache) ctx.waitUntil(caches.default.put(cacheKey, resp.clone()));
        return resp;
      }

      return new Response("Not found", { status: 404, headers: corsHeaders() });
    } catch (e) {
      return new Response(JSON.stringify({ worker_version: WORKER_VERSION, error: "Worker error", detail: String(e) }), {
        status: 500,
        headers: corsHeaders({ "content-type": "application/json", "cache-control": "no-store" }),
      });
    }
  },
};
