/**
 * «Was mir wesentlich ist» (Noah 05.11.2026 «8b» → «Quartals-Erinnerung» und «Vergleich mit früher»):
 *   - once a quarter (91 days after the newest entry) a quiet line on Heute asks to look at the entries again;
 *     «Later» waits 14 days, a switch on the page turns it off. Nothing is sent, nothing is shown elsewhere.
 *   - «Then and now»: the newest entry beside an earlier one (by default the one about a quarter before) with
 *     the words that stayed, the new ones and the ones that are gone. A hint, not a verdict.
 * Stored in the page record (cfg): essRemind (false = off), essSnooze ('YYYY-MM-DD'). Pure; tested in
 * tests/frei-wesentlich.test.js.
 */
export const QUARTER_DAYS = 91;
export const SNOOZE_DAYS = 14;

const ms = (day) => Date.parse(`${day}T12:00:00Z`);
/** Calendar days from a to b (b later = positive). */
export const daysBetween = (a, b) => Math.round((ms(b) - ms(a)) / 864e5);
/** A day n calendar days later (no 864e5 on «now», only on noon UTC, so summer time cannot shift it). */
export const addDaysTo = (day, n) => new Date(ms(day) + n * 864e5).toISOString().slice(0, 10);

export const remindOn = (cfg) => cfg?.essRemind !== false;

/** The newest entry (by its day, then by time). */
export const newestOf = (entries = []) => [...entries].filter((e) => e?.day).sort((a, b) => String(b.day).localeCompare(String(a.day)) || String(b.at ?? '').localeCompare(String(a.at ?? '')))[0] ?? null;

/**
 * Is it time to look again? → { last, days } (the day of the newest entry and the days since) or null.
 * Not without an entry, not when switched off, not while «Later» waits.
 */
export function essentialDue({ entries = [], cfg = {}, today }) {
  if (!remindOn(cfg)) return null;
  const last = newestOf(entries);
  if (!last) return null;
  if (cfg?.essSnooze && cfg.essSnooze > today) return null;
  const days = daysBetween(last.day, today);
  return days >= QUARTER_DAYS ? { last: last.day, days } : null;
}

/** The whole months since the newest entry (3 for 91 days), for the line. */
export const monthsSince = (days) => Math.max(1, Math.round(days / 30.4));

const STOP = new Set(
  ('that this with from have your what when more most than then them they were will would about into over also only just some very much many such like even make made mine been being does done each other there their where which while whom whose these those here ' +
    'aber auch dass dies diese dieser dieses dort eine einen einem einer eines euch ganz hier immer jede jeder jedes kann keine machen mehr nach nicht noch oder sein sind soll viel viele wann warum weil wenn werde werden wieder wird wollen wurde würde zwischen dann dort über unter vor von war was wie wir wo zu zum zur').split(' '),
);

/** The words of a text that carry meaning (4 letters or more, no filler), each once, in the order written. */
export function wordsOf(text = '') {
  const seen = new Map();
  for (const w of String(text).match(/[\p{L}][\p{L}'’-]*/gu) ?? []) {
    const key = w.toLowerCase();
    if (key.length < 4 || STOP.has(key) || seen.has(key)) continue;
    seen.set(key, w);
  }
  return seen;
}

/** What stayed, what is new and what is gone between an earlier and a newer text (a few words each). */
export function compareTexts(newer = '', older = '', max = 12) {
  const a = wordsOf(newer);
  const b = wordsOf(older);
  const pick = (from, notIn, want) => [...from].filter(([k]) => notIn.has(k) === want).map(([, w]) => w).slice(0, max);
  return { stayed: pick(a, b, true), added: pick(a, b, false), dropped: pick(b, a, false) };
}

/** The earlier entry to show beside `newer`: the one about a quarter before it, else the one right before. */
export function pickEarlier(entries = [], newer) {
  if (!newer) return null;
  const others = entries.filter((e) => e?.day && e.id !== newer.id && String(e.day).concat(e.at ?? '') <= String(newer.day).concat(newer.at ?? ''));
  if (!others.length) return null;
  const target = addDaysTo(newer.day, -QUARTER_DAYS);
  return [...others].sort((x, y) => Math.abs(daysBetween(target, x.day)) - Math.abs(daysBetween(target, y.day)) || String(y.at ?? '').localeCompare(String(x.at ?? '')))[0];
}
