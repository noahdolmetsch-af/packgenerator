// TR5–TR7 «Leistung und Analysen»: fictional Strava activities with power, for the specs of the
// activity analyses, the week analyses and the weight page. Calendar days in Zurich (never now + n × 24 h).
// Every number is made up; nothing here comes from a real ride.
export const P = 'test_data_gtp_';
export const zurichToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
export const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${zurichToday()}T12:00:00Z`));

export const GEAR = [{ id: 'g1', name: `${P}Gravel Blau`, km: 6142, primary: true, retired: false }];
export const ZONES = [{ min: 0, max: 115 }, { min: 115, max: 135 }, { min: 135, max: 150 }, { min: 150, max: 165 }, { min: 165, max: -1 }];

// a small steady generator, so every run sees the same numbers
const rnd = (seed) => () => ((seed = (seed * 16807) % 2147483647), (seed - 1) / 2147483646);

const base = (id, d, f = {}) => ({ id, name: `${P}Runde ${id}`, type: 'GravelRide', start: `${d}T06:00:00Z`, startLocal: `${d}T08:00:00Z`, km: 42.3, hm: 680, movingS: 5760, elapsedS: 6120, gearId: 'g1', device: '', commute: false, trainer: false, hrAvg: 138, hrMax: 171, ...f });

/** The main ride (id 3001, yesterday) with a power meter, and about 70 earlier ones over 400 days, two to three a week. */
export function activities() {
  const r = rnd(7);
  const list = [base('3001', day(-1), { name: `${P}Abendrunde Hügel`, startLocal: `${day(-1)}T17:05:00Z`, movingS: 5760, elapsedS: 6120, km: 42.3, hm: 680, wAvg: 188, wMax: 612, wDevice: true, wNorm: 211, kj: 1084, cad: 84, spdAvg: 26.4, spdMax: 58.1, tempAvg: 14, effort: 87 })];
  let n = 0;
  for (let back = 3; back < 400; back += 2 + Math.floor(r() * 3)) {
    n++;
    const km = Math.round((30 + r() * 30) * 10) / 10;
    const hm = Math.round(400 + r() * 600);
    const mov = Math.round(km / (24 + r() * 5) * 3600);
    const pm = r() > 0.15;
    const w = Math.round(165 + r() * 35 + (400 - back) / 40);
    list.push(base(String(3001 + n), day(-back), { name: `${P}Runde ${n % 6}`, km, hm, movingS: mov, elapsedS: mov + 300, hrAvg: Math.round(128 + r() * 14), wAvg: pm ? w : null, wMax: pm ? w * 3 : null, wDevice: pm, wNorm: pm ? Math.round(w * 1.1) : null, kj: pm ? Math.round((w * mov) / 1000) : null, cad: 80 + Math.round(r() * 10), effort: Math.round(40 + r() * 80) }));
  }
  // «Mehr Inhalt» T5: three earlier rides on the same route as 3001 (same name, km within 10 %), a little slower at a higher heart rate
  for (const [id, back, km, mov, hr, w] of [['3801', 15, 42.1, 5840, 142, 182], ['3802', 36, 42.6, 5900, 141, 179], ['3803', 64, 41.9, 5780, 143, 185]]) {
    list.push(base(id, day(-back), { name: `${P}Abendrunde Hügel`, startLocal: `${day(-back)}T17:10:00Z`, km, hm: 675, movingS: mov, elapsedS: mov + 300, hrAvg: hr, wAvg: w, wMax: 590, wDevice: true, wNorm: Math.round(w * 1.1), kj: Math.round((w * mov) / 1000), cad: 85, effort: 80 }));
  }
  list.push(base('3900', day(-2), { name: `${P}Lauf am See`, type: 'Run', km: 9.1, hm: 85, movingS: 2880, elapsedS: 2900, gearId: null, hrAvg: 149, effort: 45 }));
  return list;
}

const HIST = { 100: 600, 120: 1800, 140: 900, 155: 300, 170: 60 };

/** The detail of one activity, as api/strava.js sends it (with the TR5b–TR7f parts). */
export function detail(id) {
  const r = rnd(Number(id) || 1);
  const main = id === '3001';
  const w20 = main ? 248 : Math.round(225 + r() * 30);
  const pCurve = [[5, main ? 584 : 560 + Math.round(r() * 120)], [60, main ? 402 : 360 + Math.round(r() * 60)], [300, main ? 296 : 280 + Math.round(r() * 35)], [1200, w20], [3600, main ? 214 : 200 + Math.round(r() * 18)]];
  const pHist = { 100: 840, 140: 1300, 160: 560, 190: 1440, 200: 1140, 230: 1140, 260: 480, 300: 180, 360: 60 };
  const pts = [];
  for (let m = 0; m <= 96; m += 1) {
    const alt = Math.round(520 + 170 * Math.sin((m / 96) * Math.PI) + (m > 20 && m < 40 ? (m - 20) * 6 : 0));
    // «Mehr Inhalt» T2: the main ride has 4 hard pieces of 5 minutes (minutes 66, 74, 82, 90) with 3 easier minutes between
    const piece = main && [66, 74, 82, 90].some((s) => m >= s && m < s + 5);
    const hr = Math.round(126 + 22 * Math.sin(m / 9) + (m > 20 && m < 40 ? 14 : 0) + (piece ? 14 : 0));
    const w = m >= 60 && m <= 64 ? 0 : piece ? 236 + (m % 3) * 2 : main ? Math.round(165 + 25 * Math.sin(m / 7) + (m > 20 && m < 40 ? 12 : 0)) : Math.round(180 + 50 * Math.sin(m / 7));
    pts.push([m, alt, hr, w]);
  }
  const hw = { '125|180': 1320, '130|180': 540, '130|200': 1080, '135|200': 900, '140|220': 600, '145|240': 540, '150|240': 300, '155|260': 240, '160|300': 120, '165|320': 60, '170|360': 60 };
  return {
    id, kcal: 890, hist: HIST, curve: pts.map((p) => [p[0], p[2]]), w20,
    pHist, pCurve, pauses: { n: 2, secs: 360 },
    segs: [], best: [], desc: '',
    cHist: { 50: 115, 60: 230, 70: 520, 80: 1270, 90: 1730, 100: 1040, 110: 520, 120: 230, 130: 115 },
    secs5: [[0, 5, 661, 40, 131, 182], [5, 10, 641, 25, 134, 190], [10, 15, 948, 210, 152, 238], [15, 20, 895, 180, 149, 231], [20, 25, 552, 15, 128, 160], [25, 30, 620, 60, 137, 196], [30, 35, 718, 120, 143, 214], [35, 40, 605, 25, 136, 188], [40, 42.3, 279, 5, 129, 170]].map(([from, to, s, hm, hr, w]) => ({ from, to, s, hm, hr, w })),
    prof: { pts, breaks: [[60, 64]] },
    hw,
    // the main ride keeps its halves; the others drift by −1 to +7 % in the second half (T3 «Ausdauer-Check»)
    halves: main ? [{ s: 2880, w: 190, hr: 134 }, { s: 2880, w: 186, hr: 140 }] : ((hr) => [{ s: 2880, w: 190, hr }, { s: 2880, w: 188, hr: Math.round(hr * (0.99 + r() * 0.08)) }])(130 + Math.round(r() * 8)),
    climbs: main ? [{ name: `${P}Pass von Unterdorf`, km: 4.6, grade: 7.1, hm: 326, s: 1122, w: 251, hr: 158, vam: 1046 }, { name: `${P}Buchhügel`, km: 2.9, grade: 6.4, hm: 185, s: 670, w: 238, hr: 154, vam: 994 }, { name: `${P}Felsrampe`, km: 1.2, grade: 9.8, hm: 118, s: 391, w: 268, hr: 162, vam: 1086 }] : [],
  };
}

/** Answers the server and the Strava login like training.spec.js; returns nothing. */
export async function routeStrava(context, server, { acts = activities() } = {}) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
  await context.route(/packgen-three\.vercel\.app\/api\/strava/, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const url = new URL(req.url());
    const step = url.searchParams.get('step');
    server.log.push({ step, id: url.searchParams.get('id') });
    const body = (b) => route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ ok: true, ...b }) });
    if (step === 'start') return body({ url: 'https://www.strava.com/oauth/authorize?client_id=1&state=x' });
    if (step === 'status') return body({ connected: true, athlete: { firstname: 'Beispiel' } });
    if (step === 'gear') return body({ bikes: GEAR });
    if (step === 'activities') return body({ page: 1, more: false, activities: acts });
    if (step === 'zones') return body({ hr: ZONES, custom: false });
    if (step === 'detail') return body(detail(url.searchParams.get('id')));
    return route.fulfill({ status: 400, headers: cors, body: '{}' });
  });
  await context.route(/www\.strava\.com\/oauth\/authorize/, (route) => route.fulfill({ status: 302, headers: { location: `${server.app}#/bikes?tab=care&view=strava&strava=connected&key=${P}key` } }));
}

/**
 * T1 «Plan erfüllt?»: planned sessions over the last five weeks and today, made from the fictional rides:
 * four bike rides as planned (Z2), one planned in Z3 (nearly), one in Z4 (other zone), a bike session on the
 * day of the run (not done) and one today (still open; no activity today).
 */
export function planSessions(acts = activities()) {
  const rides = acts.filter((a) => a.type !== 'Run' && a.startLocal.slice(0, 10) >= day(-35) && a.startLocal.slice(0, 10) < day(0)).map((a) => a.startLocal.slice(0, 10));
  const days = [...new Set(rides)].sort().reverse().slice(0, 6);
  const zones = [2, 3, 2, 4, 2, 2];
  return [
    ...days.map((d, i) => ({ id: `p${i + 1}`, day: d, kind: 'bike', name: `${P}Grundlage ${i + 1}`, mins: 90, zone: zones[i] })),
    { id: 'p8', day: day(-2), kind: 'bike', name: `${P}Kurz locker`, mins: 45, zone: 1 },
    { id: 'p9', day: day(0), kind: 'bike', name: `${P}Grundlage heute`, mins: 60, zone: 2 },
  ];
}

/**
 * Puts the fictional activities straight into the app's database, every one with its detail (no
 * server, no 8-per-fetch limit), so the analyses over weeks and the year have data at once.
 */
export async function seedActivities(page, { acts = activities(), weight = null, plan = null } = {}) {
  const recs = acts.map((a) => {
    const d = a.startLocal.slice(0, 10);
    const det = a.wDevice || a.hrAvg != null ? detail(a.id) : {};
    if (!a.wDevice) Object.assign(det, { w20: null, pHist: null, pCurve: null, hw: null, halves: [{ s: 2880, w: 190, hr: 134 }, { s: 2880, w: 186, hr: 140 }] }); // rides without a power meter keep the steady halves (T3 drifts only power rides)
    return { id: a.id, day: d, time: a.startLocal.slice(11, 16), start: a.start, name: a.name, type: a.type, kind: a.type === 'Run' ? 'run' : 'bike', km: a.km, hm: a.hm, movingS: a.movingS, elapsedS: a.elapsedS, gearId: a.gearId, hrAvg: a.hrAvg, hrMax: a.hrMax, commute: false, trainer: false, wAvg: a.wAvg ?? null, wMax: a.wMax ?? null, wDevice: !!a.wDevice, spdAvg: a.spdAvg ?? null, spdMax: a.spdMax ?? null, cad: a.cad ?? null, tempAvg: a.tempAvg ?? null, wNorm: a.wNorm ?? null, kj: a.kj ?? null, effort: a.effort ?? null, ...det, detail: new Date().toISOString(), dv: 2 };
  });
  await page.evaluate(
    ({ recs, weight, plan }) =>
      new Promise((ok, bad) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const stores = weight || plan ? ['activities', 'settings'] : ['activities'];
          const tx = r.result.transaction(stores, 'readwrite');
          for (const x of recs) tx.objectStore('activities').put(x);
          if (weight) tx.objectStore('settings').put({ key: 'me.weight', value: weight }); // weight: { entries: [{ day, kg }] }
          if (plan) tx.objectStore('settings').put({ key: 'training.plan', value: { sessions: plan } }); // plan: [{ id, day, kind, name, mins, zone }]
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
      }),
    { recs, weight, plan },
  );
}
