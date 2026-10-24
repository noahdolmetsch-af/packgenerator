/**
 * Paket P7 «Projekt-Ablage» (Noah 21.10.2026 «6a», mockups design/projekt-ablage A–C): everything about the app's
 * project on one page in the app. The ideas and their state come from the ONE list of plans, docs/vorhaben-liste.md
 * (CLAUDE.md rule 1), read when the app is built; the releases from whatsnew.js. Only titles and short texts of the
 * public repo, no private data. The list is German (it is Noah's list), so its titles are shown as they are.
 * Pure functions, tested in tests/projektablage.test.js.
 */

/** The four columns of the idea board, in the order of the mockup (English keys for t()). */
export const STATES = [
  { key: 'idea', name: 'Idea|state' },
  { key: 'wish', name: 'Planned|state' },
  { key: 'work', name: 'In progress|state' },
  { key: 'live', name: 'Live|state' },
];

const strip = (s) => s.replace(/\*\*/g, '').trim();
/** «Akku-Rechner [H (Paket 4)]» → { title: 'Akku-Rechner', tag: 'H (Paket 4)' }. */
function itemOf(raw) {
  const s = strip(raw);
  const m = s.match(/^(.*?)\s*\[([^\]]*)\]\s*(\(prüfen\))?\s*$/);
  if (!m) return { title: s, tag: '' };
  return { title: `${m[1]}${m[3] ? ` ${m[3]}` : ''}`.trim(), tag: m[2].trim() };
}
const cells = (line) => line.split('|').slice(1, -1).map((c) => c.trim());

/**
 * Reads the list: { stand, goals: [{ n, name }], ideas: [{ title, tag, goal, state, size, use }],
 * packages: [{ key, name, goal, version, built, parked }] }.
 * state: 'idea' (Ideen, noch nicht entschieden), 'wish' (Gewünscht), 'work' (Im Bau and Gebaut, wartet …), 'live'.
 */
export function parseList(md = '') {
  const out = { stand: '', goals: [], ideas: [], packages: [] };
  const lines = String(md).split('\n');
  let goal = 0;
  let sec = ''; // 'packages' | 'wish' | 'idea' | 'work' | ''
  let liveNext = false;
  for (const line of lines) {
    const l = line.trim();
    if (!out.stand) {
      const s = l.match(/^Stand (\d{1,2}\.\d{1,2}\.\d{4}(?:, [\d:]+ UTC)?)/);
      if (s) out.stand = s[1].trim();
    }
    const h2 = l.match(/^## (\d)\. (.+)$/);
    if (h2) {
      goal = Number(h2[1]);
      out.goals.push({ n: goal, name: h2[2].replace(/\s*\(.*\)\s*$/, '').trim() });
      sec = '';
      continue;
    }
    if (/^## /.test(l)) {
      goal = 0;
      sec = /freigegebene Mockup-Pakete/i.test(l) ? 'packages' : '';
      continue;
    }
    if (/^### /.test(l)) {
      sec = /^### Gewünscht/i.test(l) ? 'wish' : /^### Ideen/i.test(l) ? 'idea' : /^### (Gebaut|Im Bau)/i.test(l) ? 'work' : '';
      continue;
    }
    if (liveNext && l) {
      liveNext = false;
      if (!l.startsWith('<')) for (const x of l.split(' · ')) if (x.trim()) out.ideas.push({ ...itemOf(x), goal, state: 'live', size: '', use: '' });
      continue;
    }
    if (/^<details><summary>Schon live/i.test(l)) {
      liveNext = !!goal;
      continue;
    }
    const inline = l.match(/^\*\*(Im Bau|Gebaut[^:]*):\*\*\s*(.+)$/i);
    if (inline && goal) {
      for (const x of inline[2].split(' · ')) if (x.trim()) out.ideas.push({ ...itemOf(x), goal, state: 'work', size: '', use: '' });
      continue;
    }
    if (!l.startsWith('|') || /^\|\s*-/.test(l)) continue;
    const c = cells(l);
    if (sec === 'packages') {
      if (!/^P\d+$/.test(c[0])) continue;
      const m = c[1].match(/^(.*?)\s*(?:\((.*)\))?$/);
      const note = m?.[2] ?? '';
      const version = note.match(/\d+\.\d+\.\d+/)?.[0] ?? null;
      out.packages.push({ key: c[0], name: (m?.[1] ?? c[1]).trim(), goal: Number(c[2]?.match(/\d/)?.[0] ?? 0), version, built: /gebaut/i.test(note), parked: /geparkt/i.test(note) });
    } else if (goal && ['wish', 'idea', 'work'].includes(sec)) {
      if (c[0] === 'Vorhaben') continue;
      out.ideas.push({ ...itemOf(c[0]), goal, state: sec, size: c[1] ?? '', use: c[2] ?? '' });
    }
  }
  return out;
}

/** How many ideas per state: { idea, wish, work, live, total }. */
export function countStates(ideas = []) {
  const c = { idea: 0, wish: 0, work: 0, live: 0, total: ideas.length };
  for (const x of ideas) if (x.state in c) c[x.state] += 1;
  return c;
}

/** -1, 0 or 1 for two versions «0.183.0». */
export function cmpVersion(a = '0', b = '0') {
  const x = String(a).split('.').map(Number);
  const y = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d) return d < 0 ? -1 : 1;
  }
  return 0;
}

/**
 * «Der Weg»: the last releases (newest three, oldest first), «Now» (the version you have) and what comes next
 * (the approved packages not yet in the app, in their order; a parked one says it waits for your OK).
 * releases: WHATS_NEW ({ version, date, title }), newest first.
 */
export function wayOf(releases = [], packages = [], appVersion = '0', { last = 3, next = 4 } = {}) {
  const done = releases.filter((r) => cmpVersion(r.version, appVersion) < 0).slice(0, last).reverse().map((r) => ({ kind: 'done', version: r.version, date: r.date, title: r.title }));
  const cur = releases.find((r) => cmpVersion(r.version, appVersion) === 0);
  const now = cur ? [{ kind: 'now', version: cur.version, date: cur.date, title: cur.title }] : [];
  const ahead = packages.filter((p) => !(p.version && cmpVersion(p.version, appVersion) <= 0)).slice(0, next).map((p) => ({ kind: p.parked ? 'parked' : 'next', key: p.key, title: p.name, version: p.version }));
  return [...done, ...now, ...ahead];
}

/**
 * «Für dich jetzt»: what waits for you. First the parked packages (built, released only after your OK), then your own
 * points (own: [{ id, text, href? }]), at most `max` on the page.
 */
export function forYou(packages = [], own = [], appVersion = '0', max = 3) {
  const parked = packages.filter((p) => p.parked && !(p.version && cmpVersion(p.version, appVersion) <= 0)).map((p) => ({ id: `pkg:${p.key}`, auto: true, key: p.key, name: p.name, version: p.version }));
  const mine = (own ?? []).filter((x) => x && String(x.text ?? '').trim()).map((x) => ({ ...x, auto: false }));
  const all = [...parked, ...mine];
  return { shown: all.slice(0, max), more: Math.max(0, all.length - max), all };
}

/** The ideas of one column, filtered by goal (0 = all). */
export const column = (ideas, state, goal = 0) => ideas.filter((x) => x.state === state && (!goal || x.goal === goal));

/** «Für dich jetzt», own points: stored in settings under OWN_KEY as [{ id, text }]. */
export const OWN_KEY = 'projekt.forYou';
export const ownOf = (v) => (Array.isArray(v) ? v.filter((x) => x && typeof x.text === 'string') : []);
export function addOwn(list, text, id = `fy-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`) {
  const s = String(text ?? '').trim().slice(0, 140);
  return s ? [...ownOf(list), { id, text: s }] : ownOf(list);
}
export const editOwn = (list, id, text) => ownOf(list).map((x) => (x.id === id ? { ...x, text: String(text ?? '').trim().slice(0, 140) || x.text } : x));
export const dropOwn = (list, id) => ownOf(list).filter((x) => x.id !== id);
export function moveOwn(list, from, to) {
  const l = [...ownOf(list)];
  if (from < 0 || from >= l.length) return l;
  const j = Math.max(0, Math.min(l.length - 1, to));
  const [x] = l.splice(from, 1);
  l.splice(j, 0, x);
  return l;
}
