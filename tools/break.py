#!/usr/bin/env python3
"""
BREAKER v1.0 · Oct 23 2026
Tries to break a single-file HTML app the way real people do: a thumb on an
Android phone, a kid on an iPad, a phone that blocks storage, a sideways screen.
Writes raw findings (JSON + screenshots). A separate reviewer agent then reads
the findings and the source and decides what actually needs fixing.

usage:
  python3 break.py <site_root> <page_path> [--out DIR] [--taps N] [--seed N] [--date "Oct 23"]
example:
  python3 break.py ./site fiveletters.html --out ./reports/fiveletters
"""
import argparse, functools, http.server, json, os, random, re, socketserver, threading, time
from datetime import date
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

os.environ.setdefault("PLAYWRIGHT_BROWSERS_PATH", "/opt/pw-browsers")

DEVICES = {
    "phone": dict(viewport={"width": 412, "height": 915}, device_scale_factor=2.625, is_mobile=True, has_touch=True,
                  user_agent="Mozilla/5.0 (Linux; Android 13; SM-G781U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36"),
    "ipad": dict(viewport={"width": 820, "height": 1180}, device_scale_factor=2, is_mobile=True, has_touch=True,
                 user_agent="Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"),
}

# Runs in every frame before the app's own code: forwards uncaught errors to the console
ERROR_HOOK = """
window.addEventListener('error', e => console.error('[uncaught] ' + (e.message||e) + ' @' + (e.filename||'').split('/').pop() + ':' + (e.lineno||'?')));
window.addEventListener('unhandledrejection', e => console.error('[unhandled promise] ' + (e.reason && (e.reason.stack||e.reason.message) || e.reason)));
"""
# Simulates a phone/browser that refuses storage (private mode, blocked site data)
STORAGE_BLOCK = """
for (const k of ['localStorage','sessionStorage']) {
  try { Object.defineProperty(window, k, { get(){ throw new DOMException('Storage blocked (breaker test)','SecurityError'); } }); } catch(e){}
}
"""

CLICKABLES_JS = """
() => {
  const sel = 'button,a[href],[role=button],input,select,textarea,summary,label,[onclick],[tabindex]:not([tabindex="-1"]),canvas,.btn,.tile,.icon,.key,.card';
  const out = [];
  for (const el of document.querySelectorAll(sel)) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0 || cs.pointerEvents === 'none') continue;
    if (r.bottom < 0 || r.right < 0 || r.top > innerHeight || r.left > innerWidth) continue;
    const label = (el.getAttribute('aria-label') || el.innerText || el.value || el.title || el.alt || el.id || el.className || el.tagName).toString().trim().replace(/\\s+/g,' ').slice(0,40);
    out.push({x: r.left, y: r.top, w: r.width, h: r.height, tag: el.tagName.toLowerCase(), label});
  }
  return out;
}
"""

PAGE_CHECKS_JS = """
() => {
  const se = document.scrollingElement || document.documentElement;
  const text = document.body ? document.body.innerText : '';
  return {
    overflowX: Math.max(se.scrollWidth, document.body ? document.body.scrollWidth : 0) - innerWidth,
    textLen: text.trim().length,
    hasCanvas: !!document.querySelector('canvas'),
    hasIframe: !!document.querySelector('iframe'),
    emDashes: (text.match(/\\u2014/g) || []).length,
    emDashSamples: (text.match(/.{0,25}\\u2014.{0,25}/g) || []).slice(0,5),
    versions: (text.match(/v\\d+(?:\\.\\d+)+(?:\\s*[·\\-]\\s*[A-Z][a-z]{2}\\s+\\d{1,2})?/g) || []).slice(0,6),
    title: document.title,
  };
}
"""

def serve(root):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a, **k): pass
    handler = functools.partial(Quiet, directory=root)
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]

class Run:
    def __init__(self, name):
        self.name, self.errors, self.console, self.failed, self.external, self.dialogs, self.steps = name, [], [], [], set(), [], []
        self.left_app, self.sandbox_blocked, self.slow = [], 0, None
        self.current = "page load"

    def attach(self, page, origin):
        page.on("pageerror", lambda e: self.errors.append({"during": self.current, "error": str(e)[:400]}))
        def on_console(m):
            if m.type in ("error", "warning"):
                t = m.text[:400]
                if t.startswith("[uncaught]") or t.startswith("[unhandled"):
                    self.errors.append({"during": self.current, "error": t})
                elif "ERR_TUNNEL_CONNECTION_FAILED" in t or "ERR_PROXY" in t:
                    self.sandbox_blocked += 1   # test machine has no open internet: not the app's fault
                elif m.type == "error":
                    self.console.append({"during": self.current, "text": t})
        page.on("console", on_console)
        def on_resp(r):
            if r.status >= 400 and r.url.startswith(origin):
                self.failed.append({"during": self.current, "status": r.status, "url": r.url.replace(origin, "")})
        page.on("response", on_resp)
        def on_req(r):
            host = urlparse(r.url).netloc
            if host and not r.url.startswith(origin) and not r.url.startswith("data:") and not r.url.startswith("blob:"):
                self.external.add(host)
        page.on("request", on_req)
        def on_fail(r):
            if r.url.startswith(origin) and "ABORTED" not in (r.failure or ""):
                self.failed.append({"during": self.current, "status": "failed", "url": r.url.replace(origin, "")})
        page.on("requestfailed", on_fail)
        def on_dialog(d):
            self.dialogs.append({"during": self.current, "type": d.type, "message": d.message[:200]})
            try: d.accept()
            except Exception: pass
        page.on("dialog", on_dialog)

    def summary(self):
        return {"run": self.name, "uncaught_errors": self.errors, "console_errors": self.console[:25],
                "failed_requests": self.failed[:25], "external_hosts": sorted(self.external),
                "dialogs": self.dialogs[:10], "left_the_app": self.left_app[:10],
                "external_requests_blocked_by_test_machine": self.sandbox_blocked, "steps_taken": len(self.steps), "seconds_per_tap_if_slow": self.slow, "last_steps": self.steps[-12:]}

def shot(page, path, info, label):
    try:
        page.screenshot(path=path, timeout=12000)
    except Exception:
        info.setdefault("notes", []).append(f"screenshot '{label}' timed out: page too busy to draw (heavy 3D/physics on a GPU-less test machine, or a stuck loop)")

def all_clickables(page):
    found = []
    for fr in page.frames:
        try:
            items = fr.evaluate(CLICKABLES_JS)
        except Exception:
            continue
        ox = oy = 0
        if fr != page.main_frame:
            try:
                bb = fr.frame_element().bounding_box()
                if not bb: continue
                ox, oy = bb["x"], bb["y"]
            except Exception:
                continue
        for it in items:
            it["x"] += ox; it["y"] += oy
            it["frame"] = "main" if fr == page.main_frame else (fr.url.rsplit("/", 1)[-1] or "iframe")
            found.append(it)
    return found

def checks(page):
    out = {}
    try: out = page.evaluate(PAGE_CHECKS_JS)
    except Exception as e: out = {"error": str(e)[:200]}
    for fr in page.frames[1:]:
        try:
            c = fr.evaluate(PAGE_CHECKS_JS)
            out.setdefault("frames", []).append({"frame": fr.url.rsplit("/", 1)[-1], **{k: c[k] for k in ("emDashes", "emDashSamples", "versions", "overflowX")}})
        except Exception:
            pass
    return out

def monkey(page, run, n, rng, vw, vh, origin, start_url, budget):
    t_start = time.time()
    for i in range(n):
        if time.time() - t_start > budget:
            run.slow = round((time.time() - t_start) / max(i, 1), 2)
            run.steps.append(f"{i}: stopped, {budget}s time budget used up (~{run.slow}s per tap)")
            break
        roll = rng.random()
        try:
            if page.url.split("#")[0].split("?")[0] != start_url:
                run.left_app.append(f"{run.current} -> {page.url.replace(origin, '')[:70]}")
                run.steps.append(f"{i}: app navigated away to {page.url.replace(origin, '')[:60]}, returning")
                run.current = "returning to app"
                page.goto(start_url, wait_until="load", timeout=20000)
                page.wait_for_timeout(500)
            items = [c for c in all_clickables(page) if 0 <= c["x"] + c["w"] / 2 <= vw and 0 <= c["y"] + c["h"] / 2 <= vh]
            if roll < 0.12:
                x1, y1 = rng.randint(30, vw - 30), rng.randint(80, vh - 80)
                dx, dy = rng.choice([(-250, 0), (250, 0), (0, -350), (0, 350)])
                run.current = f"swipe {'left' if dx<0 else 'right' if dx>0 else 'up' if dy<0 else 'down'} at {x1},{y1}"
                page.mouse.move(x1, y1); page.mouse.down()
                for s in range(1, 7): page.mouse.move(x1 + dx * s / 6, y1 + dy * s / 6)
                page.mouse.up()
            elif roll < 0.20 or not items:
                x, y = rng.randint(5, vw - 5), rng.randint(5, vh - 5)
                run.current = f"random tap at {x},{y}"
                page.touchscreen.tap(x, y)
            else:
                c = rng.choice(items)
                x, y = c["x"] + c["w"] / 2, c["y"] + c["h"] / 2
                mash = roll > 0.93
                run.current = f"{'mash 4x' if mash else 'tap'} [{c['tag']}] '{c['label']}' ({c['frame']})"
                for _ in range(4 if mash else 1):
                    page.touchscreen.tap(x, y)
            run.steps.append(f"{i}: {run.current}")
            page.wait_for_timeout(rng.choice([60, 120, 250, 400]))
        except Exception as e:
            run.steps.append(f"{i}: action failed ({str(e)[:80]})")
            try:
                if page.is_closed(): break
            except Exception:
                break
    run.current = "after tapping"

def tiny_targets(page):
    bad = []
    for c in all_clickables(page):
        if c["tag"] in ("canvas",): continue
        if min(c["w"], c["h"]) < 32:
            bad.append(f"{c['label'] or c['tag']} ({round(c['w'])}x{round(c['h'])}px, {c['frame']})")
    return sorted(set(bad))[:20]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("root"); ap.add_argument("page")
    ap.add_argument("--out", default="./breaker-report"); ap.add_argument("--taps", type=int, default=150)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--budget", type=int, default=75, help="max seconds of tapping per run")
    ap.add_argument("--date", default=date.today().strftime("%b ") + str(date.today().day))
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    srv, port = serve(os.path.abspath(a.root))
    origin = f"http://127.0.0.1:{port}"
    url = f"{origin}/{a.page.lstrip('/')}"
    rng = random.Random(a.seed)
    report = {"page": a.page, "tested": time.strftime("%Y-%m-%d %H:%M"), "today": a.date, "runs": {}}

    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])

        def session(name, device, init_scripts, taps, extra=None):
            ctx = browser.new_context(**DEVICES[device])
            ctx.set_default_timeout(15000)
            for s in init_scripts: ctx.add_init_script(s)
            page = ctx.new_page()
            run = Run(name); run.attach(page, origin)
            ctx.on("page", lambda pg: (run.steps.append(f"opened a new tab: {pg.url[:60]}"), pg.close()))
            t0 = time.time()
            try:
                page.goto(url, wait_until="load", timeout=30000)
            except Exception as e:
                run.errors.append({"during": "page load", "error": f"page did not finish loading: {str(e)[:200]}"})
            load_ms = round((time.time() - t0) * 1000)
            page.wait_for_timeout(1500)
            info = {"load_ms": load_ms, "checks_on_load": checks(page)}
            shot(page, os.path.join(a.out, f"{name}-1-load.png"), info, "load")
            if name == "phone":
                info["tiny_tap_targets"] = tiny_targets(page)
            vw, vh = DEVICES[device]["viewport"]["width"], DEVICES[device]["viewport"]["height"]
            monkey(page, run, taps, rng, vw, vh, origin, url, a.budget)
            page.wait_for_timeout(800)
            c2 = checks(page)
            info["checks_after_tapping"] = c2
            if c2.get("textLen", 1) < 5 and not c2.get("hasCanvas") and not c2.get("hasIframe"):
                info["dead_screen"] = "page is blank after tapping"
            shot(page, os.path.join(a.out, f"{name}-2-after.png"), info, "after tapping")
            if extra: extra(page, info)
            info.update(run.summary())
            report["runs"][name] = info
            with open(os.path.join(a.out, "report.json"), "w") as f:
                json.dump(report, f, indent=1)
            try: ctx.close()
            except Exception: pass

        def rotate(page, info):
            page.set_viewport_size({"width": 915, "height": 412})
            page.wait_for_timeout(700)
            c = checks(page)
            info["landscape_overflowX"] = c.get("overflowX")
            shot(page, os.path.join(a.out, "phone-3-landscape.png"), info, "landscape")
            page.set_viewport_size({"width": 412, "height": 915})

        session("phone", "phone", [ERROR_HOOK], a.taps, rotate)
        session("ipad", "ipad", [ERROR_HOOK], max(40, a.taps // 3))
        session("no-storage", "phone", [ERROR_HOOK, STORAGE_BLOCK], max(30, a.taps // 4))
        browser.close()
    srv.shutdown()

    # quick verdict for the reviewer: not a judgment, just counts
    v = {}
    for k, r in report["runs"].items():
        v[k] = {"crashes": len(r["uncaught_errors"]), "console_errors": len(r["console_errors"]),
                "missing_files": len([f for f in r["failed_requests"]]), "overflow_px": r["checks_on_load"].get("overflowX"),
                "dead_screen": bool(r.get("dead_screen"))}
    report["counts"] = v
    with open(os.path.join(a.out, "report.json"), "w") as f:
        json.dump(report, f, indent=1)
    print(json.dumps(v, indent=1))

if __name__ == "__main__":
    main()
