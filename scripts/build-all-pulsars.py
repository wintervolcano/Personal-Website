#!/usr/bin/env python3
"""
Build an all-sky pulsar snapshot for the 3D globular cluster explorer.

Source: the ATNF Pulsar Catalogue tarball (psrcat_pkg.tar.gz), which contains the
canonical psrcat.db. There is no public live REST API for psrcat, so we snapshot the
tarball on a schedule (see .github/workflows/weekly-gc-ne2025-dm.yml) and commit the
result, served as a static file exactly like public/data/gc_ne2025_dm.json.

This is the FIELD pulsar population: pulsars that live inside globular clusters are
already rendered by the explorer (from Freire's GCpsr.txt), so they are excluded here.

Distances:
  - psrcat.db stores a real distance only for ~10% of pulsars (DIST_A, in kpc).
  - For the rest, distance is derived from DM + (l, b) using the NE2025 electron-density
    model -- the SAME model the repo already uses in build-gc-ne2025-dm.py (mwprop),
    just run in the inverse direction (DM -> distance).
  - Lines of sight whose DM exceeds the model maximum yield a lower-limit distance,
    flagged with dist_is_lower_limit so the page can mark them.

Everything the browser needs is precomputed so the page does no astronomy:
  name, ra_deg, dec_deg, l, b, period_ms, dm, dist_kpc, dist_source, binary.

Usage:
  python scripts/build-all-pulsars.py --out public/data/all_pulsars.json
  python scripts/build-all-pulsars.py --db /path/to/psrcat.db   # skip download
"""
import argparse
import io
import json
import math
import pathlib
import re
import sys
import tarfile
from datetime import datetime, timezone
from urllib.request import Request, urlopen

TARBALL_URL = "https://www.atnf.csiro.au/research/pulsar/psrcat/downloads/psrcat_pkg.tar.gz"

# ICRS (J2000) -> Galactic rotation matrix (same constants as gc-worker/src/index.js).
A0G = (
    (-0.0548755604162154, -0.8734370902348850, -0.4838350155487132),
    (0.4941094278755837, -0.4448296299600112, 0.7469822444972189),
    (-0.8676661490190047, -0.1980763734312015, 0.4559837761750669),
)

# Obliquity of the ecliptic (J2000), for ecliptic -> equatorial conversion.
ECL_OBLIQ_DEG = 23.4392911


def load_ne2025():
    # Preferred path, matching build-gc-ne2025-dm.py.
    try:
        from mwprop.nemod.NE2025 import ne2025 as fn  # type: ignore

        if callable(fn):
            return fn
    except Exception as preferred_err:
        last_err = preferred_err

    candidates = [
        ("mwprop.nemod", "ne2025"),
        ("mwprop.ne2025", "ne2025"),
        ("ne2025", "ne2025"),
        ("mwprop", "ne2025"),
    ]
    for mod_name, fn_name in candidates:
        try:
            mod = __import__(mod_name, fromlist=[fn_name])
            fn = getattr(mod, fn_name)
            if callable(fn):
                return fn
        except Exception as err:
            last_err = err
    raise RuntimeError(f"Unable to import ne2025: {last_err}")


def dm_to_distance(ne2025_func, l_deg, b_deg, dm):
    """NE2025 in DM->distance direction. Returns (dist_kpc, is_lower_limit)."""
    old_stdout = sys.stdout
    sys.stdout = io.StringIO()
    try:
        out = ne2025_func(
            ldeg=float(l_deg),
            bdeg=float(b_deg),
            dmd=float(dm),
            ndir=1,  # DM -> distance
            classic=False,
            dmd_only=True,
            verbose=False,
        )
        values = out[1] if isinstance(out, (tuple, list)) and len(out) >= 2 else {}
        dist = float(values.get("DIST"))
        if not math.isfinite(dist) or dist <= 0:
            return None, False
        limflag = str(values.get("limdist", "") or "").strip()
        return round(dist, 4), (limflag == ">>")
    finally:
        sys.stdout = old_stdout


def fetch_db_text(db_path):
    if db_path:
        return pathlib.Path(db_path).read_text(encoding="utf-8", errors="replace")
    req = Request(TARBALL_URL, headers={"user-agent": "gc-3d-map/all-sky-pulsars"})
    with urlopen(req, timeout=120) as resp:
        raw = resp.read()
    with tarfile.open(fileobj=io.BytesIO(raw), mode="r:gz") as tar:
        member = next((m for m in tar.getmembers() if m.name.endswith("psrcat.db")), None)
        if member is None:
            raise RuntimeError("psrcat.db not found inside tarball")
        return tar.extractfile(member).read().decode("utf-8", errors="replace")


def parse_num(token):
    if token is None:
        return None
    s = str(token).strip()
    if not s or s == "*":
        return None
    try:
        n = float(s)
    except ValueError:
        return None
    return n if math.isfinite(n) else None


def ra_sex_to_deg(s):
    parts = str(s).strip().split(":")
    h = parse_num(parts[0]) if parts else None
    if h is None:
        return None
    m = parse_num(parts[1]) if len(parts) > 1 else 0.0
    sec = parse_num(parts[2]) if len(parts) > 2 else 0.0
    return (h + (m or 0) / 60 + (sec or 0) / 3600) * 15.0


def dec_sex_to_deg(s):
    text = str(s).strip()
    sign = -1.0 if text.startswith("-") else 1.0
    parts = text.lstrip("+-").split(":")
    d = parse_num(parts[0]) if parts else None
    if d is None:
        return None
    m = parse_num(parts[1]) if len(parts) > 1 else 0.0
    sec = parse_num(parts[2]) if len(parts) > 2 else 0.0
    return sign * (d + (m or 0) / 60 + (sec or 0) / 3600)


def ecliptic_to_equatorial(elon_deg, elat_deg):
    eps = math.radians(ECL_OBLIQ_DEG)
    lam = math.radians(elon_deg)
    bet = math.radians(elat_deg)
    sin_dec = math.sin(bet) * math.cos(eps) + math.cos(bet) * math.sin(eps) * math.sin(lam)
    dec = math.asin(max(-1.0, min(1.0, sin_dec)))
    y = math.sin(lam) * math.cos(eps) - math.tan(bet) * math.sin(eps)
    x = math.cos(lam)
    ra = math.atan2(y, x)
    if ra < 0:
        ra += 2 * math.pi
    return math.degrees(ra), math.degrees(dec)


def radec_to_galactic(ra_deg, dec_deg):
    ra = math.radians(ra_deg)
    dec = math.radians(dec_deg)
    x = math.cos(dec) * math.cos(ra)
    y = math.cos(dec) * math.sin(ra)
    z = math.sin(dec)
    gx = A0G[0][0] * x + A0G[0][1] * y + A0G[0][2] * z
    gy = A0G[1][0] * x + A0G[1][1] * y + A0G[1][2] * z
    gz = A0G[2][0] * x + A0G[2][1] * y + A0G[2][2] * z
    l = math.atan2(gy, gx)
    if l < 0:
        l += 2 * math.pi
    b = math.asin(max(-1.0, min(1.0, gz)))
    return math.degrees(l), math.degrees(b)


def parse_records(db_text):
    """psrcat.db: records separated by '@---' lines; each line 'PARAM value [err] [ref]'.
    Repeated params list the chosen value first, so first-wins is correct."""
    records = []
    cur = None
    for raw in db_text.splitlines():
        line = raw.rstrip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("@"):
            if cur:
                records.append(cur)
            cur = None
            continue
        m = re.match(r"^(\S+)\s+(.*)$", line)
        if not m:
            continue
        param = m.group(1)
        value = m.group(2).strip().split()[0] if m.group(2).strip() else ""
        if param == "PSRJ":
            if cur:
                records.append(cur)
            cur = {}
        if cur is None:
            cur = {}
        cur.setdefault(param, value)
    if cur:
        records.append(cur)
    return records


def is_gc_pulsar(rec):
    """Pulsars associated with a globular cluster are already shown by the explorer."""
    assoc = str(rec.get("ASSOC", "") or "")
    if re.search(r"\bGC[:=]", assoc):
        return True
    survey = str(rec.get("SURVEY", "") or "")
    if "globular" in survey.lower():
        return True
    return False


def build_pulsars(db_text, ne2025_func):
    records = parse_records(db_text)
    pulsars = []
    stats = {"total": 0, "gc_skipped": 0, "no_pos": 0, "dist_a": 0, "dist_ne2025": 0,
             "no_dist": 0, "lower_limit": 0, "ne2025_failed": 0}

    for rec in records:
        name = rec.get("PSRJ")
        if not name:
            continue
        stats["total"] += 1

        if is_gc_pulsar(rec):
            stats["gc_skipped"] += 1
            continue

        # Position: prefer equatorial RAJ/DECJ; else ecliptic ELONG/ELAT.
        ra_deg = dec_deg = None
        if rec.get("RAJ") and rec.get("DECJ"):
            ra_deg = ra_sex_to_deg(rec["RAJ"])
            dec_deg = dec_sex_to_deg(rec["DECJ"])
        elif rec.get("ELONG") is not None and rec.get("ELAT") is not None:
            elon = parse_num(rec["ELONG"])
            elat = parse_num(rec["ELAT"])
            if elon is not None and elat is not None:
                ra_deg, dec_deg = ecliptic_to_equatorial(elon, elat)
        if ra_deg is None or dec_deg is None:
            stats["no_pos"] += 1
            continue

        l_deg, b_deg = radec_to_galactic(ra_deg, dec_deg)

        # Period: P0 (seconds) preferred; else from F0 (Hz).
        period_ms = None
        p0 = parse_num(rec.get("P0"))
        f0 = parse_num(rec.get("F0"))
        if p0 is not None and p0 > 0:
            period_ms = p0 * 1000.0
        elif f0 is not None and f0 > 0:
            period_ms = (1.0 / f0) * 1000.0

        dm = parse_num(rec.get("DM"))

        # Distance: catalogue DIST_A (kpc) if present; else NE2025 from DM.
        dist_kpc = None
        dist_source = None
        dist_lower = False
        dist_a = parse_num(rec.get("DIST_A"))
        if dist_a is not None and dist_a > 0:
            dist_kpc = round(dist_a, 4)
            dist_source = "catalogue"
            stats["dist_a"] += 1
        elif dm is not None and dm > 0:
            try:
                d, lower = dm_to_distance(ne2025_func, l_deg, b_deg, dm)
            except Exception:
                d, lower = None, False
                stats["ne2025_failed"] += 1
            if d is not None:
                dist_kpc = d
                dist_source = "ne2025"
                dist_lower = lower
                stats["dist_ne2025"] += 1
                if lower:
                    stats["lower_limit"] += 1

        if dist_kpc is None:
            stats["no_dist"] += 1
            # Skip: without a real distance we cannot place it in the 3D scene.
            continue

        record = {
            "name": name,
            "ra_deg": round(ra_deg, 4),
            "dec_deg": round(dec_deg, 4),
            "l": round(l_deg, 4),
            "b": round(b_deg, 4),
            "period_ms": round(period_ms, 4) if period_ms is not None else None,
            "dm": round(dm, 3) if dm is not None else None,
            "dist_kpc": round(dist_kpc, 3),
            "dist_source": dist_source,
            "binary": rec.get("BINARY") is not None,
        }
        # Only emit the lower-limit flag when it's actually set (keeps the file small).
        if dist_lower:
            record["dist_is_lower_limit"] = True
        pulsars.append(record)

    if not pulsars:
        raise RuntimeError("Parsed 0 placeable pulsars from psrcat.db")
    return pulsars, stats


def main():
    parser = argparse.ArgumentParser(description="Build all-sky (field) pulsar snapshot")
    parser.add_argument("--out", default="public/data/all_pulsars.json")
    parser.add_argument("--db", default=None, help="Local psrcat.db (skip download)")
    args = parser.parse_args()

    ne2025_func = load_ne2025()
    db_text = fetch_db_text(args.db)

    ver_match = re.search(r"#CATALOGUE\s+(\S+)", db_text)
    catalogue_version = ver_match.group(1) if ver_match else None

    pulsars, stats = build_pulsars(db_text, ne2025_func)

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "ATNF Pulsar Catalogue (psrcat.db), field pulsars only",
        "source_url": TARBALL_URL,
        "catalogue_version": catalogue_version,
        "distance_model": "DIST_A (catalogue) or NE2025 from DM",
        "count": len(pulsars),
        "stats": stats,
        "pulsars": pulsars,
    }

    out_path = pathlib.Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload), encoding="utf-8")

    print(
        f"psrcat {catalogue_version or '?'}: wrote {len(pulsars)} field pulsars -> {out_path}\n"
        f"  catalogue dist: {stats['dist_a']} | NE2025 dist: {stats['dist_ne2025']} "
        f"(lower-limit: {stats['lower_limit']})\n"
        f"  GC skipped: {stats['gc_skipped']} | no position: {stats['no_pos']} | "
        f"no distance: {stats['no_dist']}"
    )


if __name__ == "__main__":
    main()
