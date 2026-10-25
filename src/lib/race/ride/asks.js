/**
 * Paket B, UC-120-I1 «Anfrage bündeln»: who you asked for a bed tonight, when and how, and what they answered,
 * so no hotel is asked twice. Kept in the race (ctx.stored.hotelAsks), newest first. Pure, tested in tests/hotelasks.test.js.
 */
export const ANSWERS = [
  { key: 'yes', name: 'Bed booked' },
  { key: 'no', name: 'Full|hotel' },
  { key: 'wait', name: 'Calls back' },
];
export const askKey = (p) => String(p?.id ?? `${p?.name ?? ''}@${Math.round(Number(p?.km) || 0)}`);
export function asksOf(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((a) => a && a.key && a.at).map((a) => ({ key: String(a.key), name: String(a.name ?? '').slice(0, 80), at: String(a.at), how: a.how === 'mail' ? 'mail' : 'call', answer: ANSWERS.some((x) => x.key === a.answer) ? a.answer : '' })).slice(0, 40);
}
/** One more ask (newest first); the answer of an earlier ask of the same hotel stays with that one. */
export const addAsk = (list, p, how, now) => [{ key: askKey(p), name: String(p?.name ?? '').slice(0, 80), at: new Date(now).toISOString(), how: how === 'mail' ? 'mail' : 'call', answer: '' }, ...asksOf(list)].slice(0, 40);
/** The latest ask of a hotel, or null. */
export const lastAsk = (list, p) => asksOf(list).find((a) => a.key === askKey(p)) ?? null;
/** Set (or with the same key take back) the answer of the latest ask of a hotel. */
export function answerAsk(list, p, answer) {
  const all = asksOf(list);
  const i = all.findIndex((a) => a.key === askKey(p));
  if (i < 0) return all;
  all[i] = { ...all[i], answer: all[i].answer === answer ? '' : answer };
  return all;
}
/** A bed is already booked somewhere tonight (any hotel answered yes). */
export const booked = (list) => asksOf(list).find((a) => a.answer === 'yes') ?? null;
