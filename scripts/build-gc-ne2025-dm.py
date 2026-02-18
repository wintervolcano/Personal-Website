#!/usr/bin/env python3
import argparse
import json
import math
import pathlib
import sys
from datetime import datetime, timezone
from io import StringIO
from urllib.request import Request, urlopen


def normalize_key(value):
    s = "".join(ch.lower() if ch.isalnum() else "" for ch in str(value or ""))
    return s.strip()


def tuple_key(l_deg, b_deg, rsun_kpc):
    return f"{float(l_deg):.6f}|{float(b_deg):.6f}|{float(rsun_kpc):.6f}"


def load_ne2025():
    # Preferred path based on confirmed working usage:
    # from mwprop.nemod.NE2025 import ne2025
    try:
        from mwprop.nemod.NE2025 import ne2025 as fn  # type: ignore

        if callable(fn):
            return fn
    except Exception as preferred_err:
        last_err = preferred_err

    # Fallback paths for alternate package layouts.
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


def fetch_clusters(url):
    req = Request(url, headers={"user-agent": "gc-ne2025-builder/1.0"})
    with urlopen(req, timeout=60) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    clusters = payload.get("clusters") or []
    if not isinstance(clusters, list):
        raise RuntimeError("Invalid clusters payload: 'clusters' must be a list")
    return clusters, payload


def compute_dm(ne2025_func, l_deg, b_deg, rsun_kpc):
    old_stdout = sys.stdout
    sys.stdout = StringIO()
    try:
        _dk, dv, _du, _dd = ne2025_func(
            ldeg=float(l_deg),
            bdeg=float(b_deg),
            dmd=float(rsun_kpc),
            ndir=-1,
            classic=False,
            verbose=False,
        )
        dm_val = dv.get("DM") if isinstance(dv, dict) else None
        dm_val = float(dm_val)
        if not math.isfinite(dm_val):
            raise RuntimeError("DM is not finite")
        return round(dm_val, 2)
    finally:
        sys.stdout = old_stdout


def build_dataset(clusters, ne2025_func):
    by_key = {}
    by_tuple = {}
    rows = []
    errors = []

    for c in clusters:
        c_id = str(c.get("id") or "")
        c_name = str(c.get("name") or "")
        c_token = str(c.get("cluster_token") or "")
        l_deg = c.get("l")
        b_deg = c.get("b")
        rsun_kpc = c.get("rsun_kpc")
        if l_deg is None or b_deg is None or rsun_kpc is None:
            errors.append({"id": c_id, "error": "missing l/b/rsun_kpc"})
            continue

        try:
            dm_val = compute_dm(ne2025_func, l_deg, b_deg, rsun_kpc)
        except Exception as err:
            errors.append({"id": c_id, "error": str(err)})
            continue

        rec = {
            "id": c_id,
            "name": c_name,
            "cluster_token": c_token,
            "l_deg": float(l_deg),
            "b_deg": float(b_deg),
            "rsun_kpc": float(rsun_kpc),
            "ne2025_dm_pc_cm3": dm_val,
        }
        rows.append(rec)
        by_tuple[tuple_key(l_deg, b_deg, rsun_kpc)] = dm_val
        for raw_key in (c_id, c_name, c_token):
            nk = normalize_key(raw_key)
            if nk:
                by_key[nk] = dm_val

    return rows, by_key, by_tuple, errors


def main():
    parser = argparse.ArgumentParser(description="Build weekly GC NE2025 DM dataset")
    parser.add_argument(
        "--clusters-url",
        default="https://gc-worker.fazalabdulkareem12.workers.dev/api/clusters?nocache=1",
        help="JSON endpoint providing GC clusters with l,b,rsun_kpc",
    )
    parser.add_argument(
        "--out",
        default="public/data/gc_ne2025_dm.json",
        help="Output JSON file",
    )
    args = parser.parse_args()

    ne2025_func = load_ne2025()
    clusters, source_meta = fetch_clusters(args.clusters_url)
    rows, by_key, by_tuple, errors = build_dataset(clusters, ne2025_func)

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_clusters_url": args.clusters_url,
        "source_clusters_updated": source_meta.get("updated"),
        "count": len(rows),
        "error_count": len(errors),
        "by_key": by_key,
        "by_tuple": by_tuple,
        "rows": rows,
        "errors": errors[:100],
    }

    out_path = pathlib.Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Wrote {len(rows)} DM rows to {out_path} (errors: {len(errors)})")


if __name__ == "__main__":
    main()
