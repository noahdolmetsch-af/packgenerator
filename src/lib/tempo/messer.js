// «Tempo-Messer» (Noah 02.11.2026 «a», thread «App wird langsam»): measures on THIS device only how the app feels:
// the start, the frames while scrolling, and which script files hold the screen up (Chrome's «long animation frames»).
// Nothing is stored except the switch, nothing leaves the device; the person copies one line if they want to send it.
export const TEMPO_KEY = 'tempoMesser';

/** Is the meter switched on on this device? */
export function isOn() {
  try {
    return localStorage.getItem(TEMPO_KEY) === '1';
  } catch {
    return false;
  }
}
export function setOn(on) {
  try {
    on ? localStorage.setItem(TEMPO_KEY, '1') : localStorage.removeItem(TEMPO_KEY);
  } catch {
    /* private mode: only this visit */
  }
}

/** The file name of a script URL without folder, query and hash («assets/Pack-DwrLxqqq.js» → «Pack.js»). */
export function fileOf(url = '') {
  const name = String(url).split('?')[0].split('#')[0].split('/').pop() || '';
  return name.replace(/-[A-Za-z0-9_]{6,10}(\.\w+)$/, '$1') || '(page)';
}

/** The frames while scrolling: how many, how many were slow, the worst. frames: [ms]. */
export function frameStats(frames) {
  const f = [...frames].filter((x) => x > 0).sort((a, b) => a - b);
  if (!f.length) return { n: 0, p95: 0, over50: 0, over100: 0, worst: 0 };
  return {
    n: f.length,
    p95: Math.round(f[Math.min(f.length - 1, Math.floor(f.length * 0.95))]),
    over50: f.filter((x) => x > 50).length,
    over100: f.filter((x) => x > 100).length,
    worst: Math.round(f.at(-1)),
  };
}

/** The script files that held the screen up most. loafs: [{ duration, blocking, scripts: [{ url, duration }] }]. → [{ file, ms }] */
export function topFiles(loafs, n = 3) {
  const by = new Map();
  for (const l of loafs) for (const s of l.scripts ?? []) by.set(fileOf(s.url), (by.get(fileOf(s.url)) ?? 0) + (s.duration ?? 0));
  return [...by].map(([file, ms]) => ({ file, ms: Math.round(ms) })).sort((a, b) => b.ms - a.ms).slice(0, n);
}

/** The pages where the slow frames happened, most first. loafs: [{ page }]. → [{ page, n }] */
export function topPages(loafs, n = 3) {
  const by = new Map();
  for (const l of loafs) by.set(l.page || '#/', (by.get(l.page || '#/') ?? 0) + 1);
  return [...by].map(([page, k]) => ({ page, n: k })).sort((a, b) => b.n - a.n).slice(0, n);
}

/** One plain line to copy. All words are English keys of the caller's t(); numbers only, no private content. */
export function reportLine(s, say = (x) => x) {
  const parts = [];
  if (s.firstPaint != null) parts.push(`${say('Start')}: ${(s.firstPaint / 1000).toFixed(1)} s`);
  if (s.startBlocked != null) parts.push(`${say('Held up at start')}: ${Math.round(s.startBlocked)} ms`);
  if (s.frames?.n) parts.push(`${say('Scrolling')}: ${s.frames.n} ${say('frames')}, ${s.frames.over50} ${say('over 50 ms')}, ${say('worst')} ${s.frames.worst} ms`);
  if (s.files?.length) parts.push(`${say('Most time')}: ${s.files.map((f) => `${f.file} ${f.ms} ms`).join(', ')}`);
  if (s.pages?.length) parts.push(`${say('Pages')}: ${s.pages.map((p) => `${p.page} ×${p.n}`).join(', ')}`);
  if (s.counts) parts.push(`${say('Data')}: ${Object.entries(s.counts).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  if (s.cores) parts.push(`${say('Device')}: ${s.cores} ${say('cores')}${s.memory ? `, ${s.memory} GB` : ''}`);
  return parts.join(' · ');
}

/* ---------- the collector (browser only) ---------- */
const st = { on: false, frames: [], loafs: [], startBlocked: null, scrolling: false, last: 0, raf: 0, idle: 0, obs: [], off: null };

function tick(now) {
  if (!st.scrolling) return;
  if (st.last) st.frames.push(now - st.last);
  st.last = now;
  if (st.frames.length > 4000) st.frames.splice(0, 1000);
  st.raf = requestAnimationFrame(tick);
}
function onScroll() {
  if (!st.scrolling) {
    st.scrolling = true;
    st.last = 0;
    st.raf = requestAnimationFrame(tick);
  }
  clearTimeout(st.idle);
  st.idle = setTimeout(() => ((st.scrolling = false), cancelAnimationFrame(st.raf)), 250);
}

/** Start measuring (once). Safe where the browser has no such entries. */
export function begin() {
  if (st.on || typeof window === 'undefined') return;
  st.on = true;
  const watch = (type, fn) => {
    try {
      const o = new PerformanceObserver((list) => list.getEntries().forEach(fn));
      o.observe({ type, buffered: true });
      st.obs.push(o);
      return true;
    } catch {
      return false;
    }
  };
  watch('long-animation-frame', (e) => {
    st.loafs.push({ duration: e.duration, blocking: e.blockingDuration ?? 0, page: location.hash.split('?')[0] || '#/', scripts: (e.scripts ?? []).map((s) => ({ url: s.sourceURL, duration: s.duration })) });
    if (st.loafs.length > 300) st.loafs.splice(0, 100);
  });
  st.startBlocked = 0;
  watch('longtask', (e) => {
    if (e.startTime < 8000) st.startBlocked += Math.max(0, e.duration - 50);
  });
  addEventListener('scroll', onScroll, { passive: true, capture: true });
  st.off = () => removeEventListener('scroll', onScroll, { capture: true });
}

/** Stop and forget everything measured. */
export function end() {
  st.obs.forEach((o) => o.disconnect());
  st.off?.();
  clearTimeout(st.idle);
  cancelAnimationFrame(st.raf);
  Object.assign(st, { on: false, frames: [], loafs: [], startBlocked: null, scrolling: false, last: 0, obs: [], off: null });
}

/** What was measured so far. */
export function snapshot() {
  const fp = typeof performance === 'undefined' ? null : performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null;
  return {
    on: st.on,
    firstPaint: fp,
    startBlocked: st.startBlocked,
    frames: frameStats(st.frames),
    files: topFiles(st.loafs),
    pages: topPages(st.loafs),
    cores: typeof navigator === 'undefined' ? null : navigator.hardwareConcurrency ?? null,
    memory: typeof navigator === 'undefined' ? null : navigator.deviceMemory ?? null,
  };
}
