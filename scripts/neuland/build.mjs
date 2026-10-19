#!/usr/bin/env node
/**
 * «Neuland» (wish #1007): builds the map data of src/lib/neuland/data/ from two open npm packages.
 * Runs by hand, never in the app build; the output files are committed.
 *
 *   npm pack swiss-maps@4.7.0 world-atlas@2.0.2   (into an empty scratch folder, then unpack both)
 *   node scripts/neuland/build.mjs <swiss-maps package folder> <world-atlas package folder>
 *
 * Sources and licences: src/lib/neuland/data/QUELLEN.md
 * - swiss-maps 4.7.0 (Interactive Things, BSD-3-Clause), year 2024 (the last year with names in the
 *   .dbf files): cantons, municipalities, lakes. Geodata © BFS/swisstopo (generalised boundaries, OGD).
 * - world-atlas 2.0.2 (Mike Bostock, ISC), countries-50m: Natural Earth, public domain.
 *
 * What it does: decodes the TopoJSON arcs, simplifies each shared arc once (Douglas-Peucker, the
 * end points stay, so neighbours keep the same border), assembles the polygons, drops tiny parts,
 * quantizes to whole numbers (lon/lat × Q) and writes delta-encoded rings: every ring is a flat array
 * [x0, y0, dx1, dy1, …]. No dependency: the TopoJSON and .dbf readers are the few lines below.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const [swissDir, worldDir] = process.argv.slice(2);
if (!swissDir || !worldDir) {
  console.error('usage: node scripts/neuland/build.mjs <swiss-maps folder> <world-atlas folder>');
  process.exit(1);
}
const OUT = join(dirname(fileURLToPath(import.meta.url)), '../../src/lib/neuland/data');
mkdirSync(OUT, { recursive: true });
const YEAR = '2024';

/* ---------- readers ---------- */
function readDbf(p) {
  const b = readFileSync(p);
  const n = b.readUInt32LE(4);
  const hl = b.readUInt16LE(8);
  const rl = b.readUInt16LE(10);
  const f = [];
  for (let o = 32; b[o] !== 0x0d; o += 32) f.push({ name: b.toString('latin1', o, o + 11).replace(/\0.*$/, ''), len: b[o + 16] });
  const rows = [];
  for (let i = 0; i < n; i++) {
    let o = hl + i * rl + 1;
    const r = {};
    for (const x of f) {
      r[x.name] = b.toString('utf8', o, o + x.len).replace(/\0+/g, '').trim();
      o += x.len;
    }
    rows.push(r);
  }
  return rows;
}

/** The arcs as absolute [lon, lat] lines. */
function decodeArcs(topo) {
  const { scale, translate } = topo.transform;
  return topo.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
    });
  });
}

/** Douglas-Peucker on [lon, lat] with lon scaled by cos(lat0); tol in degrees of latitude. */
function simplify(pts, tol, k) {
  if (pts.length <= 2) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const ax = pts[a][0] * k, ay = pts[a][1];
    const bx = pts[b][0] * k, by = pts[b][1];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let best = -1, bi = -1;
    for (let i = a + 1; i < b; i++) {
      const px = pts[i][0] * k, py = pts[i][1];
      let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
      t = Math.max(0, Math.min(1, t));
      const ex = ax + t * dx - px, ey = ay + t * dy - py;
      const d = ex * ex + ey * ey;
      if (d > best) (best = d), (bi = i);
    }
    if (best > tol * tol) {
      keep[bi] = 1;
      stack.push([a, bi], [bi, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

/** Every polygon of a geometry: [[outer ring, …holes], …], each ring [[lon, lat], …]. */
function polygonsOf(geom, arcs) {
  const ring = (ids) => {
    const out = [];
    for (const id of ids) {
      const a = id < 0 ? [...arcs[~id]].reverse() : arcs[id];
      out.push(...(out.length ? a.slice(1) : a));
    }
    return out;
  };
  if (geom.type === 'Polygon') return [geom.arcs.map(ring)];
  if (geom.type === 'MultiPolygon') return geom.arcs.map((p) => p.map(ring));
  return [];
}

/** Area in km² of a [lon, lat] ring (shoelace on a local equirectangular projection). */
function areaKm2(r) {
  const lat0 = r[0][1];
  const kx = 111.32 * Math.cos((lat0 * Math.PI) / 180);
  let s = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) s += (r[j][0] * kx) * (r[i][1] * 111.32) - (r[i][0] * kx) * (r[j][1] * 111.32);
  return Math.abs(s / 2);
}

/** Quantize and delta-encode one ring: [x0, y0, dx, dy, …] in units of 1/Q degree. */
function encode(r, Q) {
  const out = [];
  let px = null, py = null;
  for (const [lon, lat] of r) {
    const x = Math.round(lon * Q), y = Math.round(lat * Q);
    if (x === px && y === py) continue;
    if (px === null) out.push(x, y);
    else out.push(x - px, y - py);
    px = x;
    py = y;
  }
  // a closed ring: the last point equals the first, leave it out (the reader closes it)
  return out.length >= 8 ? out : null;
}

/** The middle of a ring's bounding box nudged to its area centroid (for labels). */
function centroid(r) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const f = r[j][0] * r[i][1] - r[i][0] * r[j][1];
    a += f;
    cx += (r[j][0] + r[i][0]) * f;
    cy += (r[j][1] + r[i][1]) * f;
  }
  return a ? [cx / (3 * a), cy / (3 * a)] : r[0];
}

/**
 * One layer → [{ id, rings, c, km2 }]. tol: simplify tolerance (deg), minKm2: parts below go,
 * holes: keep the holes (enclaves), Q: quantization.
 */
function layer(topo, arcsRaw, name, { tol, minKm2, holes, Q, k }) {
  const simple = arcsRaw.map((a) => simplify(a, tol, k));
  return topo.objects[name].geometries.map((g) => {
    const polys = polygonsOf(g, simple);
    const rings = [];
    let big = null, bigA = 0, total = 0;
    for (const p of polys) {
      const outerA = areaKm2(p[0]);
      total += outerA;
      if (outerA > bigA) (bigA = outerA), (big = p[0]);
      if (outerA < minKm2 && polys.length > 1) continue;
      for (const [i, r] of p.entries()) {
        if (i > 0 && (!holes || areaKm2(r) < minKm2)) continue;
        const e = encode(r, Q);
        if (e) rings.push(e);
      }
    }
    if (!rings.length && big) rings.push(encode(big, Q) ?? []);
    const c = big ? centroid(big) : [0, 0];
    return { id: g.id ?? g.properties?.name, props: g.properties ?? {}, rings, c: [Math.round(c[0] * Q), Math.round(c[1] * Q)], km2: Math.round(total * 10) / 10 };
  });
}

const header = (what, src) => `/*
 * «Neuland» map data: ${what}. Generated by scripts/neuland/build.mjs; do not edit by hand.
 * Source: ${src}
 * Format: rings are delta-encoded whole numbers [x0, y0, dx1, dy1, …] in 1/q degree (x = lon, y = lat).
 * Full sources and licences: ./QUELLEN.md
 */
`;
function write(file, what, src, data) {
  const body = `${header(what, src)}export default ${JSON.stringify(data)};\n`;
  writeFileSync(join(OUT, file), body);
  console.log(file, (body.length / 1024).toFixed(1), 'KB');
}

/* ---------- Switzerland ---------- */
const CANTONS = [
  [1, 'ZH', 'Zürich'], [2, 'BE', 'Bern'], [3, 'LU', 'Luzern'], [4, 'UR', 'Uri'], [5, 'SZ', 'Schwyz'],
  [6, 'OW', 'Obwalden'], [7, 'NW', 'Nidwalden'], [8, 'GL', 'Glarus'], [9, 'ZG', 'Zug'], [10, 'FR', 'Freiburg'],
  [11, 'SO', 'Solothurn'], [12, 'BS', 'Basel-Stadt'], [13, 'BL', 'Basel-Landschaft'], [14, 'SH', 'Schaffhausen'],
  [15, 'AR', 'Appenzell Ausserrhoden'], [16, 'AI', 'Appenzell Innerrhoden'], [17, 'SG', 'St. Gallen'],
  [18, 'GR', 'Graubünden'], [19, 'AG', 'Aargau'], [20, 'TG', 'Thurgau'], [21, 'TI', 'Tessin'], [22, 'VD', 'Waadt'],
  [23, 'VS', 'Wallis'], [24, 'NE', 'Neuenburg'], [25, 'GE', 'Genf'], [26, 'JU', 'Jura'],
];
const ABBR = Object.fromEntries(CANTONS.map(([n, a]) => [n, a]));
const LAKE_DE = {
  'Bielersee / Lac de Bienne': 'Bielersee', 'Lac de Neuchâtel': 'Neuenburgersee', 'Lac de la Gruyère / Greyerzersee': 'Greyerzersee',
  'Murtensee/Lac de Morat': 'Murtensee', 'Lago di Lugano': 'Luganersee', 'Lac Léman': 'Genfersee', 'Lac de Joux': 'Lac de Joux',
};

const ch = JSON.parse(readFileSync(join(swissDir, YEAR, 'ch-combined.json'), 'utf8'));
const chArcs = decodeArcs(ch);
const K = Math.cos((46.8 * Math.PI) / 180);
const SWISS_SRC = `swiss-maps 4.7.0 (${YEAR}), © Interactive Things (BSD-3-Clause); geodata © BFS/swisstopo, generalised boundaries (OGD, free use with source)`;

{
  const rows = layer(ch, chArcs, 'cantons', { tol: 0.0006, minKm2: 0.3, holes: true, Q: 1000, k: K });
  const items = rows.map((r) => {
    const [, id, name] = CANTONS.find(([n]) => n === Number(r.id));
    return { id, bfs: Number(r.id), name, c: r.c, rings: r.rings };
  });
  write('cantons.js', 'the 26 cantons', SWISS_SRC, { q: 1000, items });
}
{
  const names = readDbf(join(swissDir, YEAR, 'municipalities.dbf'));
  const byId = new Map(names.map((r) => [Number(r.id), r]));
  const rows = layer(ch, chArcs, 'municipalities', { tol: 0.0015, minKm2: 0.05, holes: false, Q: 1000, k: K });
  const items = rows.map((r) => {
    const n = byId.get(Number(r.id));
    return { id: `g${r.id}`, name: n?.name || String(r.id), kt: ABBR[Number(n?.KTNR)] ?? '', c: r.c, rings: r.rings };
  });
  write('municipalities.js', `the ${items.length} municipalities (${YEAR})`, SWISS_SRC, { q: 1000, items });
}
{
  const names = readDbf(join(swissDir, YEAR, 'lakes.dbf'));
  const byId = new Map(names.map((r) => [Number(r.id), r.name]));
  const rows = layer(ch, chArcs, 'lakes', { tol: 0.0008, minKm2: 0.2, holes: false, Q: 1000, k: K });
  const items = rows.map((r) => {
    const raw = byId.get(Number(r.id)) ?? String(r.id);
    return { id: `l${r.id}`, name: LAKE_DE[raw] ?? raw, km2: r.km2, c: r.c, rings: r.rings };
  });
  write('lakes-shapes.js', `the ${items.length} large lakes as shapes`, SWISS_SRC, { q: 1000, items });
}

/* ---------- countries ---------- */
// ISO 3166 numeric → German name (Europe and the usual travel countries; others keep the English name)
const DE = {
  '008': 'Albanien', '020': 'Andorra', '040': 'Österreich', '056': 'Belgien', '070': 'Bosnien und Herzegowina', '100': 'Bulgarien',
  '112': 'Belarus', '191': 'Kroatien', '196': 'Zypern', '203': 'Tschechien', '208': 'Dänemark', '233': 'Estland', '246': 'Finnland',
  '250': 'Frankreich', '276': 'Deutschland', '300': 'Griechenland', '348': 'Ungarn', '352': 'Island', '372': 'Irland', '380': 'Italien',
  '428': 'Lettland', '438': 'Liechtenstein', '440': 'Litauen', '442': 'Luxemburg', '470': 'Malta', '492': 'Monaco', '498': 'Moldau',
  '499': 'Montenegro', '528': 'Niederlande', '807': 'Nordmazedonien', '578': 'Norwegen', '616': 'Polen', '620': 'Portugal',
  '642': 'Rumänien', '643': 'Russland', '674': 'San Marino', '688': 'Serbien', '703': 'Slowakei', '705': 'Slowenien', '724': 'Spanien',
  '752': 'Schweden', '756': 'Schweiz', '792': 'Türkei', '804': 'Ukraine', '826': 'Vereinigtes Königreich', '336': 'Vatikanstadt',
  '304': 'Grönland', '234': 'Färöer', '831': 'Guernsey', '832': 'Jersey', '833': 'Isle of Man', '248': 'Åland',
  '268': 'Georgien', '051': 'Armenien', '031': 'Aserbaidschan', '398': 'Kasachstan',
  '012': 'Algerien', '504': 'Marokko', '788': 'Tunesien', '818': 'Ägypten', '434': 'Libyen', '376': 'Israel', '400': 'Jordanien',
  '422': 'Libanon', '760': 'Syrien', '368': 'Irak', '364': 'Iran', '682': 'Saudi-Arabien', '784': 'Vereinigte Arabische Emirate',
  '512': 'Oman', '634': 'Katar', '048': 'Bahrain', '414': 'Kuwait', '887': 'Jemen',
  '840': 'Vereinigte Staaten', '124': 'Kanada', '484': 'Mexiko', '076': 'Brasilien', '032': 'Argentinien', '152': 'Chile', '604': 'Peru',
  '170': 'Kolumbien', '218': 'Ecuador', '068': 'Bolivien', '858': 'Uruguay', '600': 'Paraguay', '862': 'Venezuela', '188': 'Costa Rica',
  '591': 'Panama', '192': 'Kuba', '214': 'Dominikanische Republik', '388': 'Jamaika', '320': 'Guatemala', '084': 'Belize',
  '036': 'Australien', '554': 'Neuseeland', '392': 'Japan', '156': 'China', '410': 'Südkorea', '408': 'Nordkorea', '158': 'Taiwan',
  '356': 'Indien', '524': 'Nepal', '064': 'Bhutan', '144': 'Sri Lanka', '462': 'Malediven', '586': 'Pakistan', '004': 'Afghanistan',
  '050': 'Bangladesch', '764': 'Thailand', '704': 'Vietnam', '116': 'Kambodscha', '418': 'Laos', '104': 'Myanmar', '458': 'Malaysia',
  '702': 'Singapur', '360': 'Indonesien', '608': 'Philippinen', '496': 'Mongolei', '860': 'Usbekistan', '417': 'Kirgisistan',
  '762': 'Tadschikistan', '795': 'Turkmenistan',
  '710': 'Südafrika', '516': 'Namibia', '072': 'Botswana', '716': 'Simbabwe', '894': 'Sambia', '508': 'Mosambik', '454': 'Malawi',
  '834': 'Tansania', '404': 'Kenia', '800': 'Uganda', '646': 'Ruanda', '231': 'Äthiopien', '450': 'Madagaskar', '480': 'Mauritius',
  '686': 'Senegal', '288': 'Ghana', '566': 'Nigeria', '120': 'Kamerun', '180': 'Kongo (Dem. Rep.)', '178': 'Kongo', '024': 'Angola',
  '729': 'Sudan', '728': 'Südsudan', '148': 'Tschad', '562': 'Niger', '466': 'Mali', '478': 'Mauretanien', '854': 'Burkina Faso',
  '384': 'Elfenbeinküste', '430': 'Liberia', '694': 'Sierra Leone', '324': 'Guinea', '624': 'Guinea-Bissau', '270': 'Gambia',
  '132': 'Kap Verde', '204': 'Benin', '768': 'Togo', '266': 'Gabun', '226': 'Äquatorialguinea', '140': 'Zentralafrikanische Republik',
  '232': 'Eritrea', '262': 'Dschibuti', '706': 'Somalia', '426': 'Lesotho', '748': 'Eswatini', '108': 'Burundi', '174': 'Komoren',
  '690': 'Seychellen', '732': 'Westsahara', '010': 'Antarktis', '540': 'Neukaledonien', '242': 'Fidschi', '598': 'Papua-Neuguinea',
  '090': 'Salomonen', '548': 'Vanuatu', '626': 'Osttimor', '096': 'Brunei', '332': 'Haiti', '340': 'Honduras', '222': 'El Salvador',
  '558': 'Nicaragua', '780': 'Trinidad und Tobago', '044': 'Bahamas', '328': 'Guyana', '740': 'Suriname', '238': 'Falklandinseln',
  '630': 'Puerto Rico', '258': 'Französisch-Polynesien', '260': 'Französische Süd- und Antarktisgebiete',
};
const NAME_DE = { Kosovo: 'Kosovo', 'N. Cyprus': 'Nordzypern', Somaliland: 'Somaliland' };
{
  const w = JSON.parse(readFileSync(join(worldDir, 'countries-50m.json'), 'utf8'));
  const wArcs = decodeArcs(w);
  const rows = layer(w, wArcs, 'countries', { tol: 0.03, minKm2: 15, holes: false, Q: 100, k: Math.cos((50 * Math.PI) / 180) });
  const items = rows
    .filter((r) => r.rings.length)
    .map((r) => {
      const en = r.props.name ?? String(r.id);
      const id = /^\d+$/.test(String(r.id)) ? `c${r.id}` : `c-${en.toLowerCase().replace(/[^a-z]+/g, '-')}`;
      return { id, name: DE[r.id] ?? NAME_DE[en] ?? en, en, c: r.c, rings: r.rings };
    });
  write('countries.js', `${items.length} countries`, 'world-atlas 2.0.2 countries-50m (Natural Earth, public domain; package ISC)', { q: 100, items });
}
