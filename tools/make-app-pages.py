#!/usr/bin/env python3
"""Build one page per app for motbuchanan.com.

Reads the home screen (index.html) and writes, into the app/ folder:
  app/<slug>.html   a plain page with the app's card text as real text
  app/<slug>.jpg    a 1200x630 share image (only with --images)
plus sitemap.xml at the site root.

Run from anywhere:
  python3 tools/make-app-pages.py <site folder> [--images]

Re-run it whenever an app is added, renamed, re-iconed or its card text changes.
The slug rule here must match slugOf() in index.html.
"""
import sys, re, json, html, os, datetime, urllib.parse

SITE = 'https://motbuchanan.com/'
# hand-made files in app/ the tool should leave alone (old addresses that forward to a new name)
KEEP_EXTRA = set()
CAT = {'play': ('Play', '#4cf0e0'), 'learn': ('Learn', '#f59847'),
       'tool': ('Tool', '#ff6fae'), 'make': ('Make', '#b57cff')}
# what each app is, in a few plain words, for search result titles ("Pocket Shark: a free 3D pool game with a coach")
SHORT = {
    'light-scout': 'a free golden hour planner for photos',
    'rookery': 'a free Hallmark Beauty of Birds checklist',
    'civic-compass': 'a free civic toolkit for voters',
    'pocket-shark': 'a free 3D pool game with a coach',
    'the-brew-deck': 'free homebrew beer lessons and recipes',
    'roughcut': 'a free video editor for your phone browser',
    'side-boss': 'a free side hustle planner game',
    'gather': 'a free holiday and party planner',
    'the-keep': 'a free walking game drawn in letters',
    'knight-school': 'learn chess free, from the first move',
    'all-thumbs': 'a free course on building apps on a phone',
    'pigment': 'a free color wheel and paint mixer',
    'reframe': 'a free tool that swaps jargon for plain words',
    'star-stuff': 'a free planet merge game',
    'the-production-triangle': 'good, fast or cheap, by dragging',
    'liftsafe': 'a free forklift operator course',
    'brick-breaker': 'a free brick breaker game',
    'sharp': 'a free piano trainer that lights the next key',
    'harp': 'a free harmonica trainer',
    'nazca': 'a free infinite drawing canvas',
    'the-upcard': 'learn blackjack strategy free, with a coach',
    'sudoku': 'free daily sudoku puzzles',
    'game-shelf': '24 free board and card games',
    'jigsaw': 'turn any photo into a free jigsaw puzzle',
    'five-letters': 'a free daily five-letter word game',
    'measure-up': 'a free music game for school subjects',
    'bloom': 'grow a different plant every time',
    'spectra': 'a free journal for the colors you see in music',
    'two-cans': 'private two-phone chat, practice copy',
    'paper-wing': 'ten paper airplanes, folded step by step',
}
APPCAT = {'play': 'GameApplication', 'learn': 'EducationalApplication', 'tool': 'UtilitiesApplication', 'make': 'MultimediaApplication'}
PERSON = {'@type': 'Person', 'name': 'Mot Buchanan', 'url': 'https://motbuchanan.com/'}


def full_what(a):
    # what search engines read: the card line plus its note (Two Cans: "practice version" must travel with "locked")
    w = a['what']
    if a.get('note') and 'practice' in a['note']:  # only notes that change what the app is; skip trivia like file sizes
        n = a['note'].strip()
        w += ' ' + n[0].upper() + n[1:] + ('' if n.endswith('.') else '.')
    return w


def ld(obj):
    # schema labels for search engines and AI search; "</" escaped so it can never close the script tag
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False).replace('</', '<\\/') + '</script>'


MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']


def slug(name):
    return re.sub(r'[^a-z0-9]+', '-', re.sub(r"['\u2019]", '', name.lower())).strip('-')


def e(s):
    return html.escape(s or '', quote=True)


def load(site):
    s = open(os.path.join(site, 'index.html'), encoding='utf8').read()
    j = s.index('{', s.index('var APPINFO={'))
    try:
        info, _ = json.JSONDecoder().raw_decode(s[j:])
    except ValueError as err:
        sys.exit('Could not read APPINFO in index.html (it must stay strict JSON: double quotes, no trailing commas): %s' % err)
    tiles = {}
    pat = re.compile(r'<button class="app[^"]*"[^>]*data-cat="(\w+)"[^>]*data-game="([^"]+)"[^>]*>\s*'
                     r'<span class="icon">(?:<img src="(data:image/\w+;base64,[A-Za-z0-9+/=]+)"|(<svg.*?</svg>))', re.S)
    for cat, key, uri, svg in pat.findall(s):
        if svg:  # a drawn icon: carry it as an image address
            if 'xmlns=' not in svg:
                svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"', 1)
            uri = 'data:image/svg+xml,' + urllib.parse.quote(svg, safe="/:=' ")
        tiles[key] = (cat, uri)
    fav = re.search(r'<link rel="icon"[^>]*>', s).group(0)
    ver = re.search(r'made on a phone like this one &middot; (v[\d.]+)', s).group(1)
    apps = []
    for key, a in info.items():
        if key not in tiles:
            if key != 'buildlog.html':
                print('WARNING: no home-screen tile found for %s, so it gets no page' % key)
            continue  # the build log is not an app
        cat, uri = tiles[key]
        ext = bool(re.match(r'https?://', key))
        code = ''
        if ext:
            m = re.match(r'https://motbuchanan\.github\.io/([^/]+)/?(.*)$', key.split('?')[0])
            if m:
                code = 'https://github.com/motbuchanan/' + m.group(1) + ('/tree/main/' + m.group(2).rstrip('/') if m.group(2) else '')
        elif key.endswith('/'):
            code = 'https://github.com/motbuchanan/site/tree/main/' + key.rstrip('/')
        else:
            code = 'https://github.com/motbuchanan/site/blob/main/' + key
        apps.append(dict(key=key, slug=slug(a['name']), cat=cat, icon=uri, a=a,
                         open=key if ext else '../' + key, code=code))
    slugs = [x['slug'] for x in apps]
    assert len(slugs) == len(set(slugs)), 'two apps share a slug'
    return apps, ver, fav


CSS = """
:root{--ink:#eef1f4;--soft:#c2c9d1;--dim:#8f99a6;--line:#232a33;--bg:#0a0d11;--cc:%(cc)s}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%%}
body{background:var(--bg);color:var(--ink);font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,system-ui,sans-serif;
  padding:0 max(20px,env(safe-area-inset-left)) 56px max(20px,env(safe-area-inset-right))}
a{color:inherit}
.wrap{max-width:640px;margin:0 auto}
.top{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:6px 0 20px;font:500 13px 'JetBrains Mono',monospace}
.top a{text-decoration:none;color:var(--soft);display:inline-block;padding:14px 0}
.top a:hover,.top a:focus-visible{color:var(--ink)}
.head{display:flex;gap:18px;align-items:flex-end;flex-wrap:wrap}
.ico{width:112px;height:112px;border-radius:26px;flex:0 0 auto;display:block;background:#12161c}
.cat{font:700 11px 'JetBrains Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--cc)}
h1{font:800 clamp(30px,9vw,46px)/1.05 'Archivo',system-ui,sans-serif;letter-spacing:-.01em;overflow-wrap:anywhere}
.what{font-size:clamp(17px,4.6vw,20px);line-height:1.45;color:var(--ink);margin:22px 0 0;max-width:34em}
.for{font:600 13px 'JetBrains Mono',monospace;letter-spacing:.03em;color:var(--cc);margin-top:12px}
.facts{font:400 12px 'JetBrains Mono',monospace;color:var(--dim);margin-top:12px;overflow-wrap:anywhere}
.go{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;margin:26px 0 0}
.btn{display:inline-block;background:var(--cc);color:#0a0d11;font:700 16px 'Archivo',system-ui,sans-serif;text-decoration:none;
  padding:13px 24px;border-radius:12px;min-height:48px}
.btn:focus-visible,.go a:focus-visible,.more a:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
.go .alt{font-size:15px;color:var(--soft);display:inline-block;padding:13px 0}
.note{font-size:14px;color:var(--dim);margin-top:12px}
.shots{display:flex;gap:10px;overflow-x:auto;margin:34px -20px 0;padding:0 20px 6px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
.shots img,.shots video{height:min(62vh,420px);width:auto;border-radius:6px;border:1px solid var(--line);scroll-snap-align:start;flex:0 0 auto;background:#12161c}
section{margin-top:38px;border-top:1px solid var(--line);padding-top:20px}
h2{font:700 11px 'JetBrains Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--cc);margin-bottom:8px}
section p{color:var(--soft);max-width:36em}
.take{display:flex;flex-wrap:wrap;gap:0 24px;font-size:15px}
.take a{display:inline-block;padding:12px 0}
.more{margin-top:44px;border-top:1px solid var(--line);padding-top:20px}
.more ul{list-style:none;display:flex;flex-wrap:wrap;gap:6px 16px;font-size:15px}
.more a{color:var(--soft);text-decoration:none;display:inline-block;padding:10px 0}
.more a:hover{color:var(--ink);text-decoration:underline}
.foot{margin-top:34px;font:400 11px 'JetBrains Mono',monospace;color:var(--dim)}
@media(min-width:720px){body{padding-top:10px}.head{gap:24px}.ico{width:132px;height:132px;border-radius:30px}.shots{margin-left:0;margin-right:0;padding-left:0}}
"""


def page(x, apps, ver, stamp, fav):
    a = x['a']
    label, cc = CAT[x['cat']]
    short = SHORT.get(x['slug'])
    if not short:
        print('NOTE: no SHORT line for %s, its title is just the name' % x['slug'])
    title = a['name'] + (': ' + short if short else '') + ' · Mot Buchanan'
    schema = ld({'@context': 'https://schema.org', '@type': 'WebApplication', 'name': a['name'], 'description': full_what(a),
                 'url': SITE + 'app/' + x['slug'], 'image': SITE + 'app/' + x['slug'] + '.jpg',
                 'applicationCategory': APPCAT.get(x['cat'], 'WebApplication'), 'operatingSystem': 'Any, runs in a web browser',
                 'isAccessibleForFree': True, 'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD'}, 'author': PERSON})
    url = SITE + 'app/' + x['slug']
    since = a.get('since')
    nfiles = len(a.get('files') or [])
    facts = ' · '.join(p for p in [a.get('status') or '', ('since ' + since) if since else '', ('one file' if nfiles == 1 else '%d files' % nfiles) if nfiles else ''] if p)
    shots = ''
    media = []
    if a.get('loop'):
        media.append('<video src="../%s" poster="../%s" muted loop autoplay playsinline preload="metadata" aria-label="%s in use"></video>'
                     % (e(a['loop']['src']), e(a['loop']['poster']), e(a['name'])))
    for sh in a.get('shots') or []:
        media.append('<img src="../%s" alt="%s screenshot" loading="lazy">' % (e(sh), e(a['name'])))
    if media:
        shots = '<div class="shots">' + ''.join(media) + '</div>'
    secs = ''
    for head, key in (('Why I made it', 'why'), ('How it came together', 'how'), ('What I learned', 'learned')):
        if a.get(key):
            secs += '<section><h2>%s</h2><p>%s</p></section>' % (head, e(a[key]))
    take = '<a href="%s">See the code</a>' % e(x['code']) if x['code'] else ''
    if not re.match(r'https?://', x['key']) and not x['key'].endswith('/') and nfiles == 1:
        take += '<a href="../%s" download>Save the file</a>' % e(x['key'])
    others = ''.join('<li><a href="%s.html">%s</a></li>' % (o['slug'], e(o['a']['name'])) for o in apps if o is not x)
    note = '<p class="note">%s</p>' % e(a['note'][0].upper() + a['note'][1:] + ('' if a['note'].endswith('.') else '.')) if a.get('note') else ''
    return """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>%(title)s</title>
<meta name="description" content="%(what)s">
<link rel="canonical" href="%(url)s">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Mot Buchanan">
<meta property="og:title" content="%(title)s">
<meta property="og:description" content="%(what)s">
<meta property="og:url" content="%(url)s">
<meta property="og:image" content="%(url)s.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="%(name)s">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0a0d11">
%(fav)s
<link href="../fonts/fonts.css" rel="stylesheet">
<script data-goatcounter="https://motbuchanan.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
%(schema)s
<style>%(css)s</style>
</head>
<body>
<div class="wrap">
<nav class="top"><a href="../">Mot Buchanan</a><a href="./">all apps</a></nav>
<header>
<div class="head"><img class="ico" src="%(icon)s" alt="" width="112" height="112"><div><p class="cat">%(label)s</p><h1>%(name)s</h1></div></div>
<p class="what">%(what)s</p>
%(forline)s<p class="facts">%(facts)s</p>
<div class="go"><a class="btn" href="%(open)s">%(verb)s</a><a class="alt" href="../?app=%(slug)s">See it on the phone</a></div>
%(note)s
</header>
%(shots)s
%(secs)s
%(take)s
<section><h2>Got a build idea?</h2><p>Tell me about a problem a small app could fix. If I dig it, I might build it. No promise, and no charge.</p><p class="take"><a href="../?idea">Pitch me a build</a></p></section>
<nav class="more" aria-label="More apps"><h2>More from the phone</h2><ul>%(others)s</ul></nav>
<p class="foot">Built on a phone. Runs in your browser.</p>
</div>
</body>
</html>
""" % dict(title=e(title), what=e(a['what']), url=url, name=e(a['name']), css=CSS % dict(cc=cc), slug=x['slug'],
           icon=x['icon'], label=label, facts=e(facts), open=e(x['open']), verb=e(a['verb']), note=note, shots=shots,
           secs=secs, take=('<section><h2>Take it</h2><p class="take">%s</p></section>' % take) if take else '',
           others=others, ver=ver, stamp=stamp, fav=fav, schema=schema, forline=('<p class="for">Built for %s</p>\n' % e(a['for'])) if a.get('for') else '')


SHARE = """<!doctype html><html><head><meta charset="utf-8"><link href="../fonts/fonts.css" rel="stylesheet"><style>
*{box-sizing:border-box;margin:0;padding:0}
body{width:1200px;height:630px;background:#0a0d11;color:#eef1f4;display:flex;align-items:center;gap:64px;padding:0 84px;overflow:hidden;
  font-family:-apple-system,'Segoe UI',Roboto,system-ui,sans-serif}
img{width:360px;height:360px;border-radius:84px;flex:0 0 auto}
.c{font:700 22px 'JetBrains Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:%(cc)s}
h1{font:800 %(size)spx/1.02 'Archivo',system-ui,sans-serif;letter-spacing:-.01em;margin:12px 0 22px}
p{font-size:29px;line-height:1.35;color:#c2c9d1;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden}
.u{position:absolute;left:84px;bottom:44px;font:500 22px 'JetBrains Mono',monospace;color:#8f99a6}
</style></head><body><img src="%(icon)s" alt=""><div><div class="c">%(label)s</div><h1>%(name)s</h1><p>%(what)s</p></div>
<div class="u">motbuchanan.com · built on a phone</div></body></html>"""


def share_images(site, apps):
    import asyncio, http.server, threading, functools
    from playwright.async_api import async_playwright

    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=site))
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()

    async def run():
        async with async_playwright() as p:
            b = await p.chromium.launch()
            pg = await b.new_page(viewport={'width': 1200, 'height': 630})
            for x in apps:
                label, cc = CAT[x['cat']]
                n = x['a']['name']
                size = 92 if len(n) <= 11 else 76 if len(n) <= 16 else 60
                tmp = os.path.join(site, 'app', '_share.html')
                open(tmp, 'w', encoding='utf8').write(SHARE % dict(cc=cc, size=size, icon=x['icon'], label=label, name=e(n), what=e(x['a']['what'])))
                # a fresh address per app, so the browser never reuses the last app's picture
                await pg.goto('http://127.0.0.1:%d/app/_share.html?%s' % (port, x['slug']))
                await pg.evaluate('document.fonts.ready')
                await pg.wait_for_timeout(120)
                await pg.screenshot(path=os.path.join(site, 'app', x['slug'] + '.jpg'), type='jpeg', quality=86)
            os.remove(tmp)
            await b.close()
    asyncio.run(run())


INDEX = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>All apps · Mot Buchanan</title>
<meta name="description" content="Every app on motbuchanan.com: %(n)d free games, tools, lessons and art toys Mot Buchanan built on a phone. They run in your browser, nothing to install.">
<link rel="canonical" href="https://motbuchanan.com/app/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Mot Buchanan">
<meta property="og:title" content="All apps · Mot Buchanan">
<meta property="og:description" content="%(n)d free games, tools, lessons and art toys, all built on a phone.">
<meta property="og:url" content="https://motbuchanan.com/app/">
<meta property="og:image" content="https://motbuchanan.com/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0a0d11">
%(fav)s
<link href="../fonts/fonts.css" rel="stylesheet">
<script data-goatcounter="https://motbuchanan.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
%(schema)s
<style>
:root{--ink:#eef1f4;--soft:#c2c9d1;--dim:#8f99a6;--line:#232a33;--bg:#0a0d11}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%%}
body{background:var(--bg);color:var(--ink);font:16px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,system-ui,sans-serif;padding:0 max(20px,env(safe-area-inset-left)) 56px max(20px,env(safe-area-inset-right))}
a{color:inherit}
.wrap{max-width:760px;margin:0 auto}
.top{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:6px 0 20px;font:500 13px 'JetBrains Mono',monospace}
.top a{text-decoration:none;color:var(--soft);display:inline-block;padding:14px 0}
h1{font:800 clamp(30px,9vw,46px)/1.05 'Archivo',system-ui,sans-serif;letter-spacing:-.01em}
.lead{font-size:clamp(16px,4.4vw,19px);color:var(--soft);margin:14px 0 8px;max-width:34em}
h2{font:700 11px 'JetBrains Mono',monospace;letter-spacing:.1em;text-transform:uppercase;margin:34px 0 4px;padding-top:18px;border-top:1px solid var(--line)}
ul{list-style:none}
li a{display:flex;gap:14px;align-items:center;padding:12px 0;text-decoration:none}
li img{width:56px;height:56px;border-radius:14px;flex:0 0 auto;background:#12161c}
li b{display:block;font:700 17px 'Archivo',system-ui,sans-serif}
li span{display:block;font-size:14.5px;color:var(--soft);line-height:1.4}
li a:hover b,li a:focus-visible b{text-decoration:underline}
li a:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
.foot{margin-top:34px;font:400 11px 'JetBrains Mono',monospace;color:var(--dim)}
</style>
</head>
<body>
<div class="wrap">
<nav class="top"><a href="../about.html">Mot Buchanan</a><a href="../">the phone</a></nav>
<h1>All apps</h1>
<p class="lead">Everything on my phone-shaped home screen, as a plain list. Every one is free and runs in your browser. I built them all on a phone.</p>
%(groups)s
<p class="foot">Built on a phone. Runs in your browser.</p>
</div>
</body>
</html>
"""


def small_icon(uri, px=112):
    # the list page shows 30 icons, so shrink each to 112px to keep the page light
    m = re.match(r'data:image/\w+;base64,(.*)$', uri)
    if not m:
        return uri  # a drawn (svg) icon is already small
    try:
        import base64, io
        from PIL import Image
        im = Image.open(io.BytesIO(base64.b64decode(m.group(1)))).convert('RGB').resize((px, px), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, 'JPEG', quality=82)
        return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()
    except Exception:
        return uri


def index_page(apps, fav):
    groups = ''
    for cat in ('play', 'learn', 'make', 'tool'):
        label, cc = CAT[cat]
        rows = [x for x in apps if x['cat'] == cat]
        if not rows:
            continue
        groups += '<h2 style="color:%s">%s</h2><ul>' % (cc, label)
        for x in rows:
            groups += '<li><a href="%s.html"><img src="%s" alt="" width="56" height="56" loading="lazy"><div><b>%s</b><span>%s</span></div></a></li>' % (
                x['slug'], small_icon(x['icon']), e(x['a']['name']), e(full_what(x['a'])))
        groups += '</ul>'
    schema = ld({'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': 'All apps', 'url': SITE + 'app/', 'author': PERSON,
                 'hasPart': [{'@type': 'WebApplication', 'name': x['a']['name'], 'url': SITE + 'app/' + x['slug']} for x in apps]})
    return INDEX % dict(n=len(apps), fav=fav, schema=schema, groups=groups)


def main():
    site = sys.argv[1]
    apps, ver, fav = load(site)
    os.makedirs(os.path.join(site, 'app'), exist_ok=True)
    d = datetime.date.today()
    stamp = '%s %d %d' % (MONTHS[d.month - 1], d.day, d.year)
    changed = []
    for x in apps:
        f = os.path.join(site, 'app', x['slug'] + '.html')
        new = page(x, apps, ver, stamp, fav)
        old = open(f, encoding='utf8').read() if os.path.exists(f) else None
        if new != old:
            open(f, 'w', encoding='utf8').write(new)
            changed.append(x['slug'] + '.html')
    f = os.path.join(site, 'app', 'index.html')
    new = index_page(apps, fav)
    if not os.path.exists(f) or open(f, encoding='utf8').read() != new:
        open(f, 'w', encoding='utf8').write(new)
        changed.append('index.html')
    urls = [SITE, SITE + 'about.html', SITE + 'app/'] + [SITE + 'app/' + x['slug'] for x in apps]
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    sm += ''.join('  <url><loc>%s</loc></url>\n' % u for u in urls) + '</urlset>\n'
    open(os.path.join(site, 'sitemap.xml'), 'w', encoding='utf8').write(sm)
    if '--images' in sys.argv:
        share_images(site, apps)
    keep = {x['slug'] + ext for x in apps for ext in ('.html', '.jpg')} | {'index.html'}
    for f in sorted(os.listdir(os.path.join(site, 'app'))):
        if f not in keep and not f.startswith('_') and f not in KEEP_EXTRA:
            print('OLD FILE, delete it from the repo: app/' + f)
    for x in apps:
        if not os.path.exists(os.path.join(site, 'app', x['slug'] + '.jpg')):
            print('MISSING share image app/%s.jpg: run again with --images' % x['slug'])
    print('pages that changed: ' + (', '.join(changed) if changed else 'none'))
    print('wrote %d app pages, sitemap.xml%s' % (len(apps), ' and share images' if '--images' in sys.argv else ''))


if __name__ == '__main__':
    main()
