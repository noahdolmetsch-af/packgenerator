/**
 * «Reise-Wünsche» › «Zur Traumtour machen» (Noah 05.11.2026 «6a»): a wish (a thought with a place) becomes
 * a dream trip of Touren › Träume in one tap, and the card shows which months fit. The months come from
 * the kind of tour (dreams.js): the one you choose on the thought, else what the words suggest (a place
 * like «Tessin» → South). When nothing fits the app says nothing about a season instead of guessing.
 * Pure helpers and one write (the dreams record and the thought, with Undo).
 */
import { DREAMS_KEY, MONTHS, storeOf, newDream, guessKind, monthsOf, seasonText } from '../dreams.js';

const clean = (s, n = 80) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

/** The name of the dream: the place, else the first words of the thought. */
export function thoughtTitle(x, fallback = '') {
  const dest = clean(x?.data?.dest);
  if (dest) return dest;
  const text = clean(x?.text, 200);
  if (!text) return fallback;
  const first = text.split(/(?<=[.!?])\s/)[0];
  return first.length > 60 ? `${first.slice(0, 59)}…` : first;
}

/** The kind of tour of a thought: your choice, else a clear hint from its words, else '' (nothing fits). */
export function thoughtKind(x, kinds) {
  const own = x?.data?.kind;
  if (own && kinds.some((k) => k.key === own)) return own;
  const guess = guessKind(`${x?.data?.dest ?? ''} ${x?.text ?? ''}`, kinds);
  return guess === 'other' ? '' : guess;
}

/** The season a thought fits: { kind, months, text, now } or null when no kind fits. tr: t(). */
export function seasonOf(x, store, today, tr = (s) => s) {
  const kind = thoughtKind(x, store.kinds);
  if (!kind) return null;
  const months = monthsOf({ kind }, store.kinds);
  if (!months.length) return null;
  return { kind, months, text: seasonText(months, (m) => tr(MONTHS[m - 1])), now: months.includes(Number(String(today).slice(5, 7))) };
}

/** The dream a thought becomes (pure). */
export function dreamFromThought(x, store, { id, now = new Date().toISOString(), fallback = '' } = {}) {
  const kind = thoughtKind(x, store.kinds);
  const d = newDream({ title: thoughtTitle(x, fallback), kind: kind || null, days: 2, note: x?.data?.dest ? clean(x?.text, 400) : '' }, { id, now, kinds: store.kinds });
  return d;
}

/**
 * Makes the dream and marks the thought with it (data.dreamId); one transaction.
 * → { dream, undo } or null when the thought is gone or already has its dream.
 */
export async function makeDream(db, thoughtId, { fallback = '', now = new Date().toISOString(), id = `dream-${Date.now().toString(36)}` } = {}) {
  return db.transaction('rw', db.settings, db.frei, async () => {
    const x = await db.frei.get(thoughtId);
    if (!x) return null;
    const before = (await db.settings.get(DREAMS_KEY)) ?? null;
    const store = storeOf(before?.value);
    if (x.data?.dreamId && store.dreams.some((d) => d.id === x.data.dreamId)) return null;
    const dream = dreamFromThought(x, store, { id, now, fallback });
    await db.settings.put({ key: DREAMS_KEY, value: { dreams: [dream, ...store.dreams], kinds: store.kinds } });
    await db.frei.put({ ...x, data: { ...(x.data ?? {}), dreamId: id } });
    const undo = async () => {
      await db.transaction('rw', db.settings, db.frei, async () => {
        if (before) await db.settings.put(before);
        else await db.settings.delete(DREAMS_KEY);
        await db.frei.put(x);
      });
    };
    return { dream, undo };
  });
}
