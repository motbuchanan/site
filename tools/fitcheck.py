#!/usr/bin/env python3
"""FITCHECK v1.0 · Oct 25 2026
Finds things that don't fit the screen: elements that run past the right edge,
and text clipped inside its own box, at small and common phone sizes plus a
landscape phone. Outside network blocked. Usage:
  python3 fitcheck.py <serve_root> <page path> [more page paths...]
Prints one line per problem; exit code 1 if any."""
import sys, os, functools, http.server, socketserver, threading, json
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')
from playwright.sync_api import sync_playwright

SIZES = [(320, 640, 'small phone'), (360, 760, 'phone'), (412, 915, 'Mot phone'), (640, 360, 'landscape')]
JS = r"""() => {
  const W = innerWidth, out = [];
  const label = el => (el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : '')) + ' "' + (el.innerText || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 28) + '"';
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    if (['SCRIPT','STYLE','svg','path','CANVAS','VIDEO','IMG','OPTION'].includes(el.tagName)) continue;
    if (el.closest('[aria-hidden="true"]')) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    let p = el.parentElement, scroller = false;
    while (p && p !== document.body) { const s = getComputedStyle(p); if (/(auto|scroll)/.test(s.overflowX) && !/(auto|scroll)/.test(s.overflowY)) { scroller = true; break; } p = p.parentElement; }
    if (scroller) continue;
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (cs.position !== 'fixed' && r.left < W && r.right > W + 2 && hasText) out.push(['past right edge by ' + Math.round(r.right - W) + 'px', label(el)]);
    if (hasText) { for (const n of el.childNodes) { if (n.nodeType !== 3 || !n.textContent.trim()) continue;
      const rg = document.createRange(); rg.selectNodeContents(n); const tr = rg.getBoundingClientRect();
      if (tr.width && tr.right > Math.min(W, r.right) + 2 && tr.left < W) { out.push(['letters run past ' + (tr.right > W ? 'the screen' : 'their box') + ' by ' + Math.round(tr.right - Math.min(W, r.right)) + 'px', label(el)]); break; } } }
    if (hasText && el.scrollWidth > el.clientWidth + 2 && /(hidden|clip)/.test(cs.overflowX + cs.overflow) && cs.textOverflow !== 'ellipsis') out.push(['text clipped by ' + (el.scrollWidth - el.clientWidth) + 'px', label(el)]);
  }
  const seen = new Set(); return out.filter(x => { const k = x.join('|'); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 8);
}"""

def main():
    root, pages = sys.argv[1], sys.argv[2:]
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=root)); srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{srv.server_address[1]}'
    bad = 0
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        for page in pages:
            for w, h, name in SIZES:
                c = b.new_context(viewport={'width': w, 'height': h}, is_mobile=True, has_touch=True, device_scale_factor=2)
                c.route('**/*', lambda r: r.continue_() if r.request.url.startswith(base) or r.request.url.startswith(('data:', 'blob:')) else r.abort())
                pg = c.new_page()
                try:
                    pg.goto(f'{base}/{page}', wait_until='load', timeout=40000); pg.wait_for_timeout(900)
                    for why, what in pg.evaluate(JS):
                        print(f'{page} | {name} {w}px | {why} | {what}'); bad += 1
                except Exception as e:
                    print(f'{page} | {name} | could not load: {str(e)[:80]}')
                c.close()
        b.close()
    print(f'FITCHECK: {bad} problem(s) across {len(pages)} page(s)')
    sys.exit(1 if bad else 0)

if __name__ == '__main__':
    main()
