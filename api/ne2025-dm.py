import json
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler
from io import StringIO
import sys


def _cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type",
    }


def _write_json(handler: BaseHTTPRequestHandler, status: int, payload: dict):
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    for k, v in _cors_headers().items():
        handler.send_header(k, v)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def _load_ne2025():
    # Keep import resolution flexible across mwprop package layouts.
    candidates = [
        ("mwprop.ne2025", "ne2025"),
        ("ne2025", "ne2025"),
        ("mwprop", "ne2025"),
    ]
    last_err = None
    for mod_name, fn_name in candidates:
        try:
            mod = __import__(mod_name, fromlist=[fn_name])
            fn = getattr(mod, fn_name)
            if callable(fn):
                return fn
        except Exception as err:  # pragma: no cover
            last_err = err
    raise RuntimeError(f"Unable to import ne2025 from mwprop: {last_err}")


NE2025_FUNC = None
NE2025_IMPORT_ERROR = None
try:
    NE2025_FUNC = _load_ne2025()
except Exception as import_err:  # pragma: no cover
    NE2025_IMPORT_ERROR = str(import_err)


def _to_float(v):
    try:
        n = float(v)
        if n != n:
            return None
        return n
    except Exception:
        return None


def _compute_dm(item: dict):
    base = {
        "id": item.get("id", ""),
        "name": item.get("name", ""),
        "l_deg": item.get("l_deg"),
        "b_deg": item.get("b_deg"),
        "rsun_kpc": item.get("rsun_kpc"),
        "ne2025_dm_pc_cm3": None,
        "status": "error",
        "error": None,
    }

    if NE2025_FUNC is None:
        base["status"] = "error"
        base["error"] = NE2025_IMPORT_ERROR or "ne2025 import failed"
        return base

    l_deg = _to_float(item.get("l_deg"))
    b_deg = _to_float(item.get("b_deg"))
    rsun_kpc = _to_float(item.get("rsun_kpc"))
    if l_deg is None or b_deg is None or rsun_kpc is None:
        base["error"] = "Invalid l_deg, b_deg, or rsun_kpc"
        return base

    old_stdout = sys.stdout
    sys.stdout = StringIO()
    try:
        _dk, dv, _du, _dd = NE2025_FUNC(
            ldeg=l_deg,
            bdeg=b_deg,
            dmd=rsun_kpc,
            ndir=-1,
            classic=False,
            verbose=False,
        )
        dm_val = None
        if isinstance(dv, dict):
            dm_val = _to_float(dv.get("DM"))
        if dm_val is None:
            raise RuntimeError("NE2025 returned no DM")

        base["l_deg"] = l_deg
        base["b_deg"] = b_deg
        base["rsun_kpc"] = rsun_kpc
        base["ne2025_dm_pc_cm3"] = round(dm_val, 2)
        base["status"] = "ok"
        return base
    except Exception as err:
        base["error"] = str(err)
        return base
    finally:
        sys.stdout = old_stdout


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        for k, v in _cors_headers().items():
            self.send_header(k, v)
        self.end_headers()

    def do_POST(self):
        try:
            cl = int(self.headers.get("content-length", "0"))
        except Exception:
            cl = 0

        raw = self.rfile.read(cl) if cl > 0 else b"{}"
        try:
            payload = json.loads(raw.decode("utf-8")) if raw else {}
        except Exception:
            return _write_json(self, 400, {"error": "Invalid JSON payload"})

        items = payload.get("items")
        if not isinstance(items, list):
            return _write_json(self, 400, {"error": "'items' must be an array"})

        results = [_compute_dm(item if isinstance(item, dict) else {}) for item in items]
        now_iso = datetime.now(timezone.utc).isoformat()

        return _write_json(
            self,
            200,
            {
                "results": results,
                "meta": {
                    "runtime": "mwprop-ne2025",
                    "count": len(results),
                    "computed_at": now_iso,
                },
            },
        )
