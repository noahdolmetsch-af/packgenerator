/**
 * Mini-Tools «Mini-Umfrage» (Noah 28.10.2026, idea 2): up to 10 short questions, shared by link; the answers
 * come back sealed (client.js) and the app counts them and writes 2–3 sentences, without AI («3a»).
 * The question and the answers in their plain form, the counting and the summary. Pure, tested in
 * tests/mini-poll.test.js.
 */
export const KIND_POLL = 'poll';
export const QS_MAX = 10;
export const OPTS_MAX = 8;
export const TITLE_MAX = 80;
export const Q_MAX = 140;
export const OPT_MAX = 60;
export const TEXT_MAX = 300;
export const NAME_MAX = 40;
/** The kinds of question (English keys for t()). */
export const TYPES = [
  { key: 'one', label: 'One answer', opts: true },
  { key: 'many', label: 'Several answers', opts: true },
  { key: 'scale', label: 'Scale 1 to 5', opts: false },
  { key: 'yesno', label: 'Yes or no', opts: false },
  { key: 'text', label: 'Short text', opts: false },
];
const TYPE_KEYS = new Set(TYPES.map((x) => x.key));
/** Ready questions to start from (English keys for t(); the maker changes them as they like). */
export const TEMPLATES = [
  { key: 'where', title: 'Where does the trip go?', qs: [{ type: 'one', text: 'Where shall we go?', opts: ['Option A', 'Option B', 'Option C'] }, { type: 'scale', text: 'How long may a day be? (1 short, 5 long)' }, { type: 'text', text: 'What matters to you?' }] },
  { key: 'after', title: 'How was the trip?', qs: [{ type: 'scale', text: 'How did you like it? (1 not at all, 5 very much)' }, { type: 'yesno', text: 'Would you come again?' }, { type: 'text', text: 'What should we do differently?' }] },
  { key: 'free', title: '', qs: [{ type: 'one', text: '', opts: ['', ''] }] },
];

const clip = (s, max) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
export const cleanName = (s) => clip(s, NAME_MAX);

/** One question → clean, or null when it cannot be answered (no text, too few options). */
export function cleanQ(q, i = 0) {
  const type = TYPE_KEYS.has(q?.type) ? q.type : 'one';
  const text = clip(q?.text, Q_MAX);
  const out = { id: typeof q?.id === 'string' && /^q\d{1,2}$/.test(q.id) ? q.id : `q${i + 1}`, type, text };
  if (type === 'one' || type === 'many') {
    const opts = [...new Set((Array.isArray(q?.opts) ? q.opts : []).map((o) => clip(o, OPT_MAX)).filter(Boolean))].slice(0, OPTS_MAX);
    if (opts.length < 2) return null;
    out.opts = opts;
  }
  return text ? out : null;
}

/** The survey as it is sealed into the link → object, or null (no title or no usable question). */
export function pollQuestion({ title, note = '', by = '', anon = false, qs }) {
  const list = (Array.isArray(qs) ? qs : []).map((q, i) => cleanQ(q, i)).filter(Boolean).slice(0, QS_MAX);
  // ids unique and in order
  list.forEach((q, i) => (q.id = `q${i + 1}`));
  const out = { v: 1, kind: KIND_POLL, title: clip(title, TITLE_MAX), note: clip(note, 200), by: cleanName(by), anon: !!anon, qs: list };
  return out.title && list.length ? out : null;
}

/** A survey read from a link → clean, or null (another kind, broken). */
export function readPoll(obj) {
  if (!obj || obj.kind !== KIND_POLL || typeof obj.pk !== 'string') return null;
  const q = pollQuestion(obj);
  return q ? { ...q, pk: obj.pk } : null;
}

/** One person's answers ({ name, r: { [question id]: value } }; «r» because «a» is the answer's id): only questions of the survey, only values that fit their kind. */
export function cleanPollAnswer({ name = '', r = {} }, poll) {
  const out = {};
  for (const q of poll.qs) {
    const v = r?.[q.id];
    if (q.type === 'one' && Number.isInteger(v) && v >= 0 && v < q.opts.length) out[q.id] = v;
    else if (q.type === 'many' && Array.isArray(v)) {
      const ok = [...new Set(v.filter((x) => Number.isInteger(x) && x >= 0 && x < q.opts.length))].sort((x, y) => x - y);
      if (ok.length) out[q.id] = ok;
    } else if (q.type === 'scale' && Number.isInteger(v) && v >= 1 && v <= 5) out[q.id] = v;
    else if (q.type === 'yesno' && (v === 0 || v === 1)) out[q.id] = v;
    else if (q.type === 'text' && clip(v, TEXT_MAX)) out[q.id] = clip(v, TEXT_MAX);
  }
  return { name: poll.anon ? '' : cleanName(name), r: out };
}

/** Is this question answered in an answer? */
export const answered = (q, r) => r?.[q.id] !== undefined;

const STOP = new Set(
  'und oder aber auch nicht kein keine ein eine einen einem einer der die das den dem des ist sind war wäre mit ohne für von vom zum zur auf aus bei im in an am es ich du er sie wir ihr man mir mich dir dich uns euch mehr sehr so wie was wenn dass da noch nur schon gut gern gerne mal ja nein the a an and or but not no of to in on at for with is are was be it i you we they my our very more just too'.split(' '),
);
/** The words said most often in text answers (at least twice), most first. → [{ word, n }] */
export function frequentWords(texts, top = 3) {
  const count = new Map();
  for (const t of texts) {
    const seen = new Set();
    for (const w of String(t).toLowerCase().match(/[\p{L}\d-]{3,}/gu) ?? []) {
      if (STOP.has(w) || seen.has(w)) continue;
      seen.add(w);
      count.set(w, (count.get(w) ?? 0) + 1);
    }
  }
  return [...count].filter(([, n]) => n >= 2).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).slice(0, top).map(([word, n]) => ({ word, n }));
}

/**
 * Count all answers. rows: [{ name, r }]. → per question:
 * one/many: { counts: [n per option], n } · yesno: { counts: [no, yes], n } · scale: { counts: [n for 1..5], avg, n } ·
 * text: { texts: [{ name, text }], words, n } (n = how many answered this question).
 */
export function countPoll(poll, rows) {
  return poll.qs.map((q) => {
    const vals = rows.map((x) => ({ name: x.name, v: x.r?.[q.id] })).filter((x) => x.v !== undefined);
    const base = { id: q.id, type: q.type, text: q.text, n: vals.length };
    if (q.type === 'one' || q.type === 'many') {
      const counts = q.opts.map(() => 0);
      for (const { v } of vals) for (const i of Array.isArray(v) ? v : [v]) if (counts[i] !== undefined) counts[i] += 1;
      return { ...base, opts: q.opts, counts };
    }
    if (q.type === 'yesno') {
      const counts = [0, 0];
      for (const { v } of vals) counts[v] += 1;
      return { ...base, counts };
    }
    if (q.type === 'scale') {
      const counts = [0, 0, 0, 0, 0];
      for (const { v } of vals) counts[v - 1] += 1;
      const avg = vals.length ? Math.round((vals.reduce((s, x) => s + x.v, 0) / vals.length) * 10) / 10 : null;
      return { ...base, counts, avg };
    }
    const texts = vals.map((x) => ({ name: x.name, text: x.v }));
    return { ...base, texts, words: frequentWords(texts.map((x) => x.text)) };
  });
}

/**
 * The summary in sentences, without AI: one line per question that has answers.
 * T: the app's t(); fmt(n): a number in the app's language. → [string]
 */
export function summarize(counted, T, fmt = String) {
  const out = [];
  for (const c of counted) {
    if (!c.n) continue;
    if (c.type === 'one' || c.type === 'many') {
      const max = Math.max(...c.counts);
      const tops = c.opts.filter((_, i) => c.counts[i] === max);
      out.push(
        tops.length === 1
          ? T('{q}: most chose «{a}» ({n} of {m}).', { q: c.text, a: tops[0], n: max, m: c.n })
          : T('{q}: a tie between {list} ({n} each).', { q: c.text, list: tops.map((x) => `«${x}»`).join(', '), n: max }),
      );
    } else if (c.type === 'yesno') {
      out.push(T('{q}: {yes} yes, {no} no.', { q: c.text, yes: c.counts[1], no: c.counts[0] }));
    } else if (c.type === 'scale') {
      out.push(T('{q}: on average {avg} of 5.', { q: c.text, avg: fmt(c.avg) }));
    } else if (c.words.length) {
      out.push(T('{q}: often said {list}.', { q: c.text, list: c.words.map((w) => `«${w.word}»`).join(', ') }));
    } else {
      out.push(T('{q}: {n} answers in words.', { q: c.text, n: c.n }));
    }
  }
  return out;
}
