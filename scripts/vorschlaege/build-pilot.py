#!/usr/bin/env python3
"""
«Tourenvorschläge» Pilot (Noah 05.11.2026): builds src/lib/vorschlaege/data/pilot.js from the open data set
«Mountainbikeland Schweiz» (swisstopo/ASTRA, Open Government Data, source: © swisstopo, SchweizMobil).

  curl -O https://data.geo.admin.ch/ch.astra.mountainbikeland/mountainbikeland/mountainbikeland_2056.gpkg
  python3 -I scripts/vorschlaege/build-pilot.py mountainbikeland_2056.gpkg > src/lib/vorschlaege/data/pilot.js

The GeoPackage (100 MB) never goes into the repo. Only the standard library is used.
Per tour: the line (lat, lon, 5 decimals, about 140 points), the height and the ground every 100 m
(s = single trail, u = unpaved, p = paved; from the nearest way piece within 40 m) and the official
levels «Kondition» and «Technik» (easy, medium, difficult).
"""
import json, math, sqlite3, struct, sys

# Pilot tours: (route number, stage number, way, id, title, region, kind)
PILOT = [
    ('33', 1, 'Hinweg', 'sm-33', 'Winterthur → Hulftegg', 'zh', 'oneway'),
    ('10711', 0, None, 'sm-10711', 'Uetliberg → Zürich, Triemli', 'zh', 'descent'),
    ('250', 0, 'Identischer Hin- und Rückweg', 'sm-250', 'Flims', 'gr', 'loop'),
    ('636', 0, None, 'sm-636', 'Arosa, Route 636', 'gr', 'loop'),
    ('332', 0, None, 'sm-332', 'Davos Platz, Route 332', 'gr', 'loop'),
]


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


def main(path):
    c = sqlite3.connect('file:' + path + '?mode=ro', uri=True)
    G = 60
    grid = {}
    for blob, bel, st in c.execute('select geom, BelagTLM, IsSTrail from Weg'):
        for l in parse(blob):
            for v in l:
                grid.setdefault((int(v[0] // G), int(v[1] // G)), []).append((v[0], v[1], bel, st))
    tours = []
    for nr, et, abw, tid, title, region, kind in PILOT:
        rows = c.execute('select geom, Abwicklung, HoeheAbE, HoeheAufE, KonditionE, DistanzE, TechnikE from Etappe where NrR=? and NrEtappe=?', (nr, et)).fetchall()
        r = [x for x in rows if abw is None or x[1] == abw][0]
        pts = [v for l in parse(r[0]) for v in l]
        # sample every 50 m, then keep one value per 100 m
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
            best = None
            cx, cy = int(v[0] // G), int(v[1] // G)
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    for w in grid.get((cx + dx, cy + dy), []):
                        dd = math.hypot(w[0] - v[0], w[1] - v[1])
                        if dd < 40 and (best is None or dd < best[0]):
                            best = (dd, w)
            cls = 'p'
            if best:
                cls = 's' if best[1][3] == 1 else ('u' if best[1][2] == 'unpaved' else 'p')
            samples.append((cum, v[2], cls))
        total = samples[-1][0]
        n100 = int(total // 100) + 1
        ele, cls = [], ''
        for k in range(n100):
            m = k * 100
            s = min(samples, key=lambda a: abs(a[0] - m))
            ele.append(round(s[1]))
            cls += s[2]
        step = max(1, len(pts) // 140)
        line_ll = [lv95_to_wgs(v[0], v[1]) for v in pts[::step]] + [lv95_to_wgs(pts[-1][0], pts[-1][1])]
        share = lambda ch: round(100 * cls.count(ch) / len(cls))
        tours.append({
            'id': tid, 'route': nr, 'title': title, 'region': region, 'kind': kind,
            'km': r[5], 'up': r[3], 'down': r[2], 'cond': r[4], 'tech': r[6],
            'lenM': round(total), 'max': max(ele), 'min': min(ele),
            'single': share('s'), 'unpaved': share('u'), 'paved': share('p'),
            'line': [[round(a, 5), round(b, 5)] for a, b in line_ll],
            'ele': ele, 'cls': cls,
        })
    print('// Generated by scripts/vorschlaege/build-pilot.py from «Mountainbikeland Schweiz» (© swisstopo, SchweizMobil, Open Government Data). Do not edit by hand.')
    print('export default ' + json.dumps(tours, ensure_ascii=False, separators=(',', ':')) + ';')


main(sys.argv[1])
