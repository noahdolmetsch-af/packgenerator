#!/usr/bin/env python3
"""
«Tourenvorschläge» (Noah 23.11.2026 «alles umsetzen mit 100 strecken»): builds src/lib/vorschlaege/data/netz.js
from the open data set «Mountainbikeland Schweiz» (swisstopo/ASTRA, Open Government Data, terms «open use, must
provide the source»: © swisstopo, SchweizMobil). It replaces the pilot build (the five pilot tours keep their ids).

  curl -O https://data.geo.admin.ch/ch.astra.mountainbikeland/mountainbikeland/mountainbikeland_2056.gpkg
  python3 -I scripts/vorschlaege/build-netz.py mountainbikeland_2056.gpkg canton-cache.json src/lib/vorschlaege/data

The GeoPackage (100 MB) never goes into the repo. Only the standard library is used. canton-cache.json keeps the
canton of every start point ("E:N" in LV95 rounded to 500 m → "ZH"); a missing one is asked from api3.geo.admin.ch
(layer swissboundaries3d-kanton-flaeche) and written back.

The choice of the tours (rules, in this order):
 1. the five pilot tours stay (their ids are in people's lists);
 2. a canton without any tour of «Kondition schwer» gets its strongest stage of «mittel» (field best: true, shown
    with a note, never claimed to be hard);
 3. then ALL stages of «Kondition schwer» (the official network has 131 with a canton), nearest start to Zurich main
    station first;
 4. then, until there are COUNT tours, the stages of «Kondition mittel» with a climb of MED_UP m or more, nearest first,
    at most MED_CAP per canton. They are marked by their level and only show when «Medium» is switched on.
Per tour: the line (lat, lon, 5 decimals, about 140 points), the height and the ground every 100 m
(s = single trail, u = unpaved, p = paved; from the nearest way piece within 40 m), the official levels
«Kondition» and «Technik» (easy, medium, difficult), the canton (region) and dz, the km from Zurich main station
to the start as the crow flies (the fallback of «nearer first» without a home place).
"""
import json, math, os, sqlite3, struct, sys, urllib.request

COUNT = 200
MED_UP = 900  # a stage of «Kondition mittel» only fills up from this climb (m)
MED_CAP = 8  # and at most this many per canton
ZH_HB = (2683000, 1248000)
# (route, stage) -> (id, title, kind): the pilot tours keep their ids, titles and kinds
PILOT = {
    ('33', 1): ('sm-33', 'Winterthur → Hulftegg', 'oneway'),
    ('10711', 0): ('sm-10711', 'Uetliberg → Zürich, Triemli', 'descent'),
    ('250', 0): ('sm-250', 'Flims', 'loop'),
    ('636', 0): ('sm-636', 'Arosa, Route 636', 'loop'),
    ('332', 0): ('sm-332', 'Davos Platz, Route 332', 'loop'),
}
CANTONS = 'ZH BE LU UR SZ OW NW GL ZG FR SO BS BL SH AR AI SG GR AG TG TI VD VS NE GE JU'.split()


def lv95_to_wgs(E, N):
    y = (E - 2600000) / 1e6
    x = (N - 1200000) / 1e6
    lon = 2.6779094 + 4.728982 * y + 0.791484 * y * x + 0.1306 * y * x * x - 0.0436 * y ** 3
    lat = 16.9023892 + 3.238272 * x - 0.270978 * y * y - 0.002528 * x * x - 0.0447 * y * y * x - 0.0140 * x ** 3
    return lat * 100 / 36, lon * 100 / 36


def parse(blob):
    env = (blob[3] >> 1) & 7
    wkb = blob[8 + {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}[env]:]

    def head(pos):
        bo = '<' if wkb[pos] == 1 else '>'
        t = struct.unpack(bo + 'I', wkb[pos + 1:pos + 5])[0]
        dim = 2 + (1 if t & 0x80000000 else 0) + (1 if t & 0x40000000 else 0)
        base = t & 0xFFFFFF
        if base >= 1000:
            dim += base // 1000
        return bo, base % 1000, dim, pos + 5

    def line(pos, bo, dim):
        k = struct.unpack(bo + 'I', wkb[pos:pos + 4])[0]
        pos += 4
        pts = []
        for _ in range(k):
            pts.append(struct.unpack(bo + 'd' * dim, wkb[pos:pos + 8 * dim]))
            pos += 8 * dim
        return pts, pos

    bo, t, dim, pos = head(0)
    out = []
    if t == 2:
        p, pos = line(pos, bo, dim)
        out.append(p)
    else:
        m = struct.unpack(bo + 'I', wkb[pos:pos + 4])[0]
        pos += 4
        for _ in range(m):
            bo2, _t, dim2, pos = head(pos)
            p, pos = line(pos, bo2, dim2)
            out.append(p)
    return out



def canton_of(cache, path, e, n):
    k = '%d:%d' % (round(e / 500), round(n / 500))
    if k in cache:
        return cache[k]
    url = ('https://api3.geo.admin.ch/rest/services/api/MapServer/identify?geometry=%d,%d&geometryType=esriGeometryPoint'
           '&layers=all:ch.swisstopo.swissboundaries3d-kanton-flaeche.fill&tolerance=0&mapExtent=%d,%d,%d,%d'
           '&imageDisplay=100,100,96&returnGeometry=false&sr=2056') % (e, n, e - 1000, n - 1000, e + 1000, n + 1000)
    v = None
    for _ in range(3):
        try:
            r = json.load(urllib.request.urlopen(url, timeout=20))
            v = r['results'][0]['attributes']['ak'] if r['results'] else None
            break
        except Exception:
            pass
    cache[k] = v
    json.dump(cache, open(path, 'w'), indent=0, sort_keys=True)
    return v


def main(path, cache_path, out_dir):
    try:
        cache = json.load(open(cache_path))
    except Exception:
        cache = {}
    c = sqlite3.connect('file:' + path + '?mode=ro', uri=True)
    names = {}
    for nr, abw, nm in c.execute('select NrR, Abwicklung, NameR from Route'):
        names.setdefault(nr, nm)
    # one stage once: Hinweg and identical out-and-back before Rueckweg
    stages = {}
    for nr, et, abw, geom, up, down, cond, km, tech, sn, zn in c.execute(
            'select NrR, NrEtappe, Abwicklung, geom, HoeheAufE, HoeheAbE, KonditionE, DistanzE, TechnikE, NameS, NameZ from Etappe'):
        k = (nr, et)
        if k in stages and (abw == 'Rückweg' or stages[k]['abw'] != 'Rückweg'):
            continue
        pts = [v for l in parse(geom) for v in l]
        if len(pts) < 2:
            continue
        s, e = pts[0], pts[-1]
        kt = canton_of(cache, cache_path, s[0], s[1]) or canton_of(cache, cache_path, pts[len(pts) // 2][0], pts[len(pts) // 2][1])
        stages[k] = dict(nr=nr, et=et, abw=abw, pts=pts, up=up, down=down, cond=cond, km=km, tech=tech, sn=sn, zn=zn, kt=kt,
                         dz=round(math.hypot(s[0] - ZH_HB[0], s[1] - ZH_HB[1]) / 1000), closed=math.hypot(s[0] - e[0], s[1] - e[1]) < 1500)
    chosen, best = [], set()
    for k in PILOT:
        if k in stages:
            chosen.append(k)
    have = lambda kt: any(stages[k]['kt'] == kt for k in chosen)
    hard = [k for k, v in stages.items() if v['cond'] == 'difficult' and v['kt']]
    hard_cantons = {stages[k]['kt'] for k in hard}
    for kt in CANTONS:
        if kt in hard_cantons or have(kt):
            continue
        mid = sorted((k for k, v in stages.items() if v['kt'] == kt and v['cond'] == 'medium'), key=lambda k: (-stages[k]['up'], stages[k]['dz']))
        if mid:
            chosen.append(mid[0])
            best.add(mid[0])
    for k in sorted(hard, key=lambda k: (stages[k]['dz'], k)):
        if k not in chosen:
            chosen.append(k)
    med_n = {}
    for k in sorted((k for k, v in stages.items() if v['cond'] == 'medium' and v['kt'] and v['up'] >= MED_UP), key=lambda k: (stages[k]['dz'], k)):
        if len(chosen) >= COUNT:
            break
        if k in chosen or med_n.get(stages[k]['kt'], 0) >= MED_CAP:
            continue
        chosen.append(k)
        med_n[stages[k]['kt']] = med_n.get(stages[k]['kt'], 0) + 1
    # the ground: a grid of the way pieces
    G = 60
    grid = {}
    for blob, bel, st in c.execute('select geom, BelagTLM, IsSTrail from Weg'):
        for l in parse(blob):
            for v in l:
                grid.setdefault((int(v[0] // G), int(v[1] // G)), []).append((v[0], v[1], bel, st))
    def make(k):
        r = stages[k]
        pts = r['pts']
        if k in PILOT:
            tid, title, kind = PILOT[k]
        else:
            tid = 'sm-%s-%d' % k if r['et'] else 'sm-%s' % r['nr']
            title = ('%s → %s' % (r['sn'], r['zn'])) if r['sn'] != r['zn'] else '%s, %s' % (r['sn'], names.get(r['nr'], 'Route ' + r['nr']))
            kind = 'loop' if r['closed'] else 'oneway'
        out, acc, prev = [], 0.0, None
        for v in pts:
            if prev is None:
                out.append((0.0, v))
            else:
                acc += math.hypot(v[0] - prev[0], v[1] - prev[1])
                if acc >= 50:
                    out.append((acc, v))
                    acc = 0.0
            prev = v
        cum, samples = 0.0, []
        for i, (d, v) in enumerate(out):
            cum += d if i else 0
            bst = None
            cx, cy = int(v[0] // G), int(v[1] // G)
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    for w in grid.get((cx + dx, cy + dy), []):
                        dd = math.hypot(w[0] - v[0], w[1] - v[1])
                        if dd < 40 and (bst is None or dd < bst[0]):
                            bst = (dd, w)
            cls = 'p'
            if bst:
                cls = 's' if bst[1][3] == 1 else ('u' if bst[1][2] == 'unpaved' else 'p')
            samples.append((cum, v[2], cls))
        total = samples[-1][0]
        n100 = int(total // 100) + 1
        ele, cls = [], ''
        for j in range(n100):
            m = j * 100
            s = min(samples, key=lambda a: abs(a[0] - m))
            ele.append(round(s[1]))
            cls += s[2]
        step = max(1, len(pts) // 140)
        line_ll = [lv95_to_wgs(v[0], v[1]) for v in pts[::step]] + [lv95_to_wgs(pts[-1][0], pts[-1][1])]
        share = lambda ch: round(100 * cls.count(ch) / len(cls))
        t = {
            'id': tid, 'route': r['nr'], 'et': r['et'], 'title': title, 'region': (r['kt'] or '').lower(), 'kind': kind,
            'km': r['km'], 'up': r['up'], 'down': r['down'], 'cond': r['cond'], 'tech': r['tech'],
            'lenM': round(total), 'max': max(ele), 'min': min(ele), 'dz': r['dz'],
            'single': share('s'), 'unpaved': share('u'), 'paved': share('p'),
            'line': [[round(a, 5), round(b, 5)] for a, b in line_ll], 'ele': ele, 'cls': cls,
        }
        if k in best:
            t['best'] = True
        return t

    tours = [make(k) for k in sorted(chosen, key=lambda k: (stages[k]['dz'], k))]
    # all the other stages with a canton: the second file (netz-mehr.js), «Noah 24.11.2026 «ziel 3 mal so viele touren»»
    rest = [k for k in sorted(stages, key=lambda k: (stages[k]['dz'], k)) if k not in chosen and stages[k]['kt']]
    more = [make(k) for k in rest]
    head = '// Generated by scripts/vorschlaege/build-netz.py from «Mountainbikeland Schweiz» (© swisstopo, SchweizMobil, Open Government Data). Do not edit by hand.\n'
    for name, lst in (('netz.js', tours), ('netz-mehr.js', more)):
        with open(os.path.join(out_dir, name), 'w', encoding='utf-8') as f:
            f.write(head + 'export default ' + json.dumps(lst, ensure_ascii=False, separators=(',', ':')) + ';\n')


main(sys.argv[1], sys.argv[2], sys.argv[3])
