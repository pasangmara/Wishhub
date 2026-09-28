"""Chromium page loader that fetches every request via `requests` (verifying TLS against the proxy CA bundle)."""
import requests
from playwright.sync_api import sync_playwright

CA = "/root/.ccr/ca-bundle.crt"
_session = requests.Session()
_session.verify = CA
_cache = {}

def _handler(route, request):
    key = (request.method, request.url)
    try:
        if request.method == "GET" and key in _cache:
            status, headers, body = _cache[key]
        else:
            r = _session.request(request.method, request.url, headers={k: v for k, v in request.headers.items() if k.lower() not in ("host",)},
                                 data=request.post_data_buffer, timeout=30, allow_redirects=True)
            headers = {k: v for k, v in r.headers.items() if k.lower() not in ("content-encoding", "content-length", "transfer-encoding", "content-security-policy")}
            status, body = r.status_code, r.content
            if request.method == "GET":
                _cache[key] = (status, headers, body)
        route.fulfill(status=status, headers=headers, body=body)
    except Exception:
        route.abort()

def open_browser(p, **kw):
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    ctx = b.new_context(**kw)
    ctx.route("**/*", _handler)
    return b, ctx
