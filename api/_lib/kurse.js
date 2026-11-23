/**
 * «Kursblick» (Noah 22.11.2026 «ja», Bauplan Welle K-A): the daily closing prices of gold, the SMI and USD/CHF
 * for the small app. The pure parts of /api/lake?action=kurse&id=…, kept free of Node (the answer is built here,
 * the fetch is passed in) so a test can run it with invented answers.
 *
 * Sources (unofficial, no key, for private use only; they can change without notice, so every series has two):
 *   - Stooq: GET https://stooq.com/q/d/l/?s={symbol}&i=d → CSV «Date,Open,High,Low,Close,Volume» (the whole history)
 *   - Yahoo Finance: GET https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?period1=0&period2={now}&interval=1d
 *       → { chart: { result: [ { meta: { gmtoffset }, timestamp: [s…], indicators: { quote: [ { close: […] } ] } } ] } }
 * Neither sends CORS headers, so only this function asks them; the app asks the function. Nothing is stored here
 * and no price file lies in the repository (licence): Vercel's cache keeps an answer for six hours.
 *
 * The answer: { id, currency, unit, source, since, last: { day, close }, fetchedAt, points: [[day, close], …] }
 * (ascending, one point per day). The current Zurich day is left out: it is not a closing price yet, so the last point is
 * always the close of an earlier day («Schlusskurs vom Vortag», Noah 22.11.2026).
 * Days are calendar days (YYYY-MM-DD) of the market; never counted with milliseconds.
 */

export const KURSE_TIMEOUT_MS = 12000;
export const MAX_POINTS = 14000; // 40 years of trading days are about 10 000

/** The assets of this wave. order: the sources to try, first the one with the longer history. */
export const KURS_ASSETS = {
  // session: the market trades around the clock (a bar can start on Sunday evening), so Yahoo's day is the one the bar ENDS on
  gold: { currency: 'USD', unit: 'oz', order: ['stooq', 'yahoo'], stooq: 'xauusd', yahoo: 'GC=F', session: true }, // spot gold per troy ounce; the futures as fallback
  smi: { currency: 'CHF', unit: 'points', order: ['yahoo', 'stooq'], stooq: '^smi', yahoo: '^SSMI' },
  usdchf: { currency: 'CHF', unit: 'rate', order: ['yahoo', 'stooq'], stooq: 'usdchf', yahoo: 'CHF=X', session: true },
};

export class KurseError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

/**
 * Any other title (a share, an ETF, a coin …) is asked for by its Yahoo symbol: id = «y:NESN.SW». Only the characters a
 * symbol has pass, and only Yahoo is asked (Stooq names its symbols differently).
 */
export const YSYMBOL = /^[A-Za-z0-9^=.\-]{1,24}$/;
export const ySymbol = (id) => (String(id).startsWith('y:') && YSYMBOL.test(String(id).slice(2)) ? String(id).slice(2) : '');

/** The id of an asset this function knows (gold, smi, usdchf or «y:SYMBOL»), or ''. */
export const okAsset = (id) => (Object.hasOwn(KURS_ASSETS, String(id)) ? String(id) : ySymbol(id) ? String(id) : '');

const r4 = (v) => Math.round(v * 1e4) / 1e4;
const dayOk = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);

/** The calendar day (YYYY-MM-DD) of a moment in Europe/Zurich. */
export function zurichDay(at) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(at));
  return p;
}

export const stooqUrl = (symbol) => `https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol)}&i=d`;
export const yahooUrl = (symbol, nowSec) => `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=0&period2=${Math.floor(nowSec)}&interval=1d`;

/** Stooq's CSV → [[day, close]], skips broken rows (an error text instead of a table gives []). */
export function parseStooq(text) {
  const out = [];
  for (const line of String(text ?? '').split(/\r?\n/)) {
    const c = line.split(',');
    if (c.length < 5 || !dayOk(c[0])) continue;
    const v = Number(c[4]);
    if (Number.isFinite(v) && v > 0) out.push([c[0], r4(v)]);
  }
  return out;
}

/** What Yahoo says about the title: its currency and its short name («CHF», «Nestle SA»). Empty where it says nothing. */
export function yahooMeta(body) {
  const m = body?.chart?.result?.[0]?.meta;
  const text = (v) => (typeof v === 'string' ? v.trim().slice(0, 80) : '');
  return { currency: /^[A-Za-z]{3,4}$/.test(m?.currency ?? '') ? m.currency : '', name: text(m?.shortName) || text(m?.longName) };
}

/**
 * Yahoo's chart answer → [[day, close]]. The day is the market's own day (the exchange's offset to UTC is applied).
 * session = true (gold futures, currencies): a daily bar starts in the evening before (Sunday evening for Monday) and the
 * label of old bars flips with the clock change, so the day is the one 12 hours after the bar's start: the bar that started on
 * Sunday evening is Monday's, never a «Sunday close» (Monday not yet traded is today and drops out).
 */
export function parseYahoo(body, session = false) {
  const r = body?.chart?.result?.[0];
  const ts = r?.timestamp;
  const close = r?.indicators?.quote?.[0]?.close;
  if (!Array.isArray(ts) || !Array.isArray(close)) return [];
  const off = Number(r?.meta?.gmtoffset) || 0;
  const out = [];
  for (let i = 0; i < ts.length; i++) {
    const v = close[i];
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0 || !Number.isFinite(ts[i])) continue;
    out.push([new Date((session ? ts[i] + 12 * 3600 : ts[i] + off) * 1000).toISOString().slice(0, 10), r4(v)]);
  }
  return out;
}

/** Ascending, one point per day (the last one of a day wins), no day from `today` on. */
export function cleanPoints(points, today) {
  const byDay = new Map();
  for (const [d, v] of points) if (dayOk(d) && d < today) byDay.set(d, v);
  return [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).slice(-MAX_POINTS);
}

async function fetchText(url, doFetch, timeout, headers = {}) {
  const res = await doFetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', ...headers }, signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new KurseError('unreachable');
  return res;
}

// each source gives { points, meta }: the closes, and what it says about the title (only Yahoo does)
const FETCH = {
  stooq: async (a, { doFetch, timeout }) => ({ points: parseStooq(await (await fetchText(stooqUrl(a.stooq), doFetch, timeout)).text()), meta: { currency: '', name: '' } }),
  yahoo: async (a, { doFetch, timeout, now }) => {
    const body = await (await fetchText(yahooUrl(a.yahoo, new Date(now).getTime() / 1000), doFetch, timeout, { Accept: 'application/json' })).json();
    return { points: parseYahoo(body, !!a.session), meta: yahooMeta(body) };
  },
};

/**
 * One asset's closing prices. Tries the sources in the asset's order; a source that fails or answers nothing usable
 * (fewer than 5 points) hands over to the next. Throws KurseError('unknown') / ('unreachable').
 */
export async function kursReihe(id, { doFetch = (...a) => fetch(...a), now = new Date(), timeout = KURSE_TIMEOUT_MS } = {}) {
  const key = okAsset(id);
  if (!key) throw new KurseError('unknown');
  // a title of the person: only Yahoo, the currency and the name come from its answer
  const own = ySymbol(key);
  // futures («=F») and exchange rates («=X») trade around the clock: their bars get the day they end on (see parseYahoo)
  const a = own ? { currency: '', unit: 'price', order: ['yahoo'], yahoo: own, session: /=[FX]$/.test(own) } : KURS_ASSETS[key];
  const today = zurichDay(now);
  for (const source of a.order) {
    let points = [];
    let meta = { currency: '', name: '' };
    try {
      const got = await FETCH[source](a, { doFetch, timeout, now });
      points = cleanPoints(got.points, today);
      meta = got.meta;
    } catch {
      points = [];
    }
    if (points.length < 5) continue;
    const [day, close] = points[points.length - 1];
    const answer = { id: key, currency: own ? meta.currency : a.currency, unit: a.unit, source, since: points[0][0], last: { day, close }, fetchedAt: new Date(now).toISOString(), points };
    if (own && meta.name) answer.name = meta.name;
    return answer;
  }
  throw new KurseError('unreachable');
}

/** Is this the answer shape the app expects? (the client checks what it gets from the server or from its cache) */
export function isKursAnswer(b) {
  return !!b && typeof b.id === 'string' && Array.isArray(b.points) && b.points.length >= 5 && b.points.every((p) => Array.isArray(p) && dayOk(p[0]) && Number.isFinite(p[1])) && !!b.last && dayOk(b.last.day) && typeof b.fetchedAt === 'string';
}
