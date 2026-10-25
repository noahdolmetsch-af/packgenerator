/**
 * Paket B, UC-032-I1 + I2 (996 Ideen, Reise-Links): options to compare instead of a pile of links. Each option
 * (a bed, a train, a flight) has a name, a link, a price, the booking conditions you checked (a free
 * cancellation until …, a note) and a state: open, chosen or dropped, with your reason. Dropped ones stay,
 * so you still know why. Kept in settings 'travel.choices'. Pure, tested in tests/choices.test.js.
 */
export const CHOICES_KEY = 'travel.choices';
export const CHOICE_STATES = [
  { key: 'open', name: 'Open|choice' },
  { key: 'chosen', name: 'Chosen' },
  { key: 'dropped', name: 'Dropped' },
];
const DAYRE = /^\d{4}-\d{2}-\d{2}$/;
const str = (v, n) => String(v ?? '').trim().slice(0, n);
/** A link made safe: only http(s), else ''. */
export function linkOf(v) {
  const s = str(v, 500);
  if (!s) return '';
  const u = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const x = new URL(u);
    return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : '';
  } catch {
    return '';
  }
}
export function choiceOf(c) {
  if (!c || !c.id || !str(c.name, 80)) return null;
  const price = Number(String(c.price ?? '').replace(',', '.'));
  return {
    id: String(c.id),
    name: str(c.name, 80),
    link: linkOf(c.link),
    price: Number.isFinite(price) && price > 0 ? Math.round(price * 100) / 100 : null,
    cancelBy: DAYRE.test(c.cancelBy ?? '') ? c.cancelBy : '',
    terms: str(c.terms, 400),
    state: CHOICE_STATES.some((s) => s.key === c.state) ? c.state : 'open',
    why: str(c.why, 200),
  };
}
export const choicesOf = (list) => (Array.isArray(list) ? list.map(choiceOf).filter(Boolean) : []);
/** Open and chosen first (in your order), dropped ones apart at the end. */
export const activeChoices = (list) => choicesOf(list).filter((c) => c.state !== 'dropped');
export const droppedChoices = (list) => choicesOf(list).filter((c) => c.state === 'dropped');
/** Free cancellation ends within 3 days (or today): worth a look. */
export function cancelSoon(c, today) {
  if (!c?.cancelBy || c.state === 'dropped') return false;
  const d = (Date.parse(`${c.cancelBy}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 864e5;
  return d >= 0 && d <= 3;
}
export function upsert(list, c) {
  const x = choiceOf(c);
  if (!x) return choicesOf(list);
  const all = choicesOf(list);
  return all.some((y) => y.id === x.id) ? all.map((y) => (y.id === x.id ? x : y)) : [...all, x];
}
export const removeChoice = (list, id) => choicesOf(list).filter((c) => c.id !== id);
export function moveChoice(list, id, to) {
  const all = choicesOf(list);
  const i = all.findIndex((c) => c.id === id);
  if (i < 0) return all;
  const [x] = all.splice(i, 1);
  all.splice(Math.max(0, Math.min(to, all.length)), 0, x);
  return all;
}
