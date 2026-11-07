/**
 * «Nebelmeer-Tage» (Noah 06.11.2026 «1-5a», answer 4a, Idee D of «Über die Nebelgrenze motivieren»): the days you
 * were above the fog, kept on the Sammel-Wand as the shelf «Fog sea». A day is saved by a tap («Remember today»
 * on the card «Sun above the fog») or added by hand with a date, a name, a fog height and a photo. The photo is an
 * album photo (photos table, album: true), so it is also in the Fotoalbum.
 * No goal, no streak: fog does not come on command. Only a quiet count «n fog sea days this winter».
 * Stored in db.settings under KEY as { days: [...] } (in every backup, no schema change). Pure, tested in
 * tests/nebelmeer.test.js.
 */
export const KEY = 'fogSeaDays';
/** At most this many days are kept (a guard against a broken import). */
export const MAX_DAYS = 400;

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const fin = (v) => typeof v === 'number' && Number.isFinite(v);

/** One day as stored: only known fields, checked. null when it is not a day. */
export function cleanDay(r) {
  if (!r || !DAY.test(r.date ?? '')) return null;
  const topM = Number(r.topM);
  return {
    id: String(r.id || `fog-${r.date}`),
    date: r.date,
    title: String(r.title ?? '').trim().slice(0, 60),
    topM: fin(topM) && topM > 0 && topM < 5000 ? Math.round(topM) : null,
    tripId: r.tripId ? String(r.tripId) : null,
    photoId: r.photoId ? String(r.photoId) : null,
  };
}

/** The days of the stored value, newest first. */
export function daysOf(value) {
  const list = Array.isArray(value?.days) ? value.days : [];
  return list
    .map(cleanDay)
    .filter(Boolean)
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
    .slice(0, MAX_DAYS);
}

/** The stored value for a list of days. */
export const valueOf = (days) => ({ days: daysOf({ days }) });

/** Is `date` already kept? */
export const hasDay = (days, date) => (days ?? []).some((d) => d.date === date);

/** A new id with a random part (the clock can stand still in tests). */
export const newId = () => `fog-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** The list with one more day (a bad day changes nothing). */
export function addDay(days, fields, id = newId()) {
  const d = cleanDay({ ...fields, id });
  return d ? daysOf({ days: [...(days ?? []), d] }) : (days ?? []);
}

/** What changes on one day: title, date, topM, photoId (null removes the photo link). Other fields stay. */
export function patchDay(days, id, patch = {}) {
  return daysOf({
    days: (days ?? []).map((d) => {
      if (d.id !== id) return d;
      const next = { ...d };
      if (patch.title != null) next.title = patch.title;
      if (patch.date != null && DAY.test(patch.date)) next.date = patch.date;
      if ('topM' in patch) next.topM = patch.topM;
      if ('photoId' in patch) next.photoId = patch.photoId;
      return next;
    }),
  });
}

export const removeDay = (days, id) => (days ?? []).filter((d) => d.id !== id);

/**
 * The winter a day belongs to, named by the year it starts in: October to December of that year and January to March of
 * the next. null for April to September (no winter).
 */
export function winterOf(date) {
  if (!DAY.test(date ?? '')) return null;
  const y = Number(date.slice(0, 4));
  const m = Number(date.slice(5, 7));
  if (m >= 10) return y;
  if (m <= 3) return y - 1;
  return null;
}

/**
 * The quiet count: the days of «this winter» (the winter of today; from April to September the winter that just ended).
 * → { winter, n }.
 */
export function winterCount(days, today) {
  const y = Number(String(today).slice(0, 4));
  const winter = winterOf(today) ?? y - 1;
  return { winter, n: (days ?? []).filter((d) => winterOf(d.date) === winter).length };
}
