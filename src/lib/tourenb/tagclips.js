/**
 * Idee 56 «Tagebuch aus Sprachnotizen» (Touren b, mockup B56 «Dein Tag zum Hören», Noah 26.10.2026 «freigabe»,
 * answer a: in the debrief per day). The short voice notes of one tour day, from three places, in time order:
 *   notes   (db.notes, tripId + day, Fahrt-Seite and Notiz + Foto): note.inputs.voices
 *   places  (db.tracks kind 'place', «Hier bin ich» on the live map): place.inputs.voices, with the place
 *   diary   (db.frei kind 'diary' of that date): entry.inputs.voices
 * Played one after the other. Your own order per day: trip.clipOrder = { [day]: [key] }.
 * Pure functions, tested in tests/touren-b.test.js.
 */
import { inputsOf } from "../eingabe/inputs.js";
import { lineKm, snap } from "../race/race.js";

const addDays = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** The date of a tour day (0-based). */
export const dateOfDay = (trip, day) =>
  trip?.startDate ? addDays(trip.startDate, day) : "";

/**
 * The clips of one day: [{ key, src, s, at, text, said?, where?, lat?, lon?, km?, from: { table, id, voiceId } }].
 * text: what the note says (its text), said: the voice note as words (Whisper), where: a place name.
 */
export function dayClips(
  trip,
  day,
  { notes = [], places = [], diary = [] } = {},
) {
  if (!trip) return [];
  const date = dateOfDay(trip, day);
  const pts = lineKm(trip.route);
  const kmAt = (lat, lon) => {
    if (pts.length < 2 || !Number.isFinite(lat)) return null;
    const s = snap(pts, { lat, lon });
    return s.offKm <= 3 ? Math.round(s.km) : null;
  };
  const out = [];
  const push = (rec, table, at, base) => {
    for (const v of inputsOf(rec.inputs).voices) {
      const lat = base.lat ?? null;
      const lon = base.lon ?? null;
      out.push({
        key: `${table}:${rec.id}:${v.id}`,
        src: v.src,
        s: v.s,
        at: v.at || at || "",
        text: base.text ?? "",
        ...(v.text ? { said: v.text } : {}),
        ...(base.where ? { where: base.where } : {}),
        ...(Number.isFinite(lat) ? { lat, lon, km: kmAt(lat, lon) } : {}),
        from: { table, id: rec.id, voiceId: v.id },
      });
    }
  };
  for (const n of notes)
    if (n && n.tripId === trip.id && n.day === day)
      push(n, "notes", n.at, {
        text: n.text,
        where: inputsOf(n.inputs).place?.name,
        lat: inputsOf(n.inputs).place?.lat,
        lon: inputsOf(n.inputs).place?.lon,
      });
  for (const p of places)
    if (
      p &&
      p.kind === "place" &&
      p.tripId === trip.id &&
      (p.day === date || String(p.at ?? "").slice(0, 10) === date)
    )
      push(p, "tracks", p.at, { text: p.text, lat: p.lat, lon: p.lon });
  for (const e of diary)
    if (e && e.kind === "diary" && e.day === date)
      push(e, "frei", e.at, {
        text: e.title || e.text,
        where: e.place?.name,
        lat: e.place?.lat,
        lon: e.place?.lon,
      });
  const order = trip.clipOrder?.[day];
  const pos = new Map(
    (Array.isArray(order) ? order : []).map((k, i) => [k, i]),
  );
  return out.sort((a, b) =>
    pos.has(a.key) && pos.has(b.key)
      ? pos.get(a.key) - pos.get(b.key)
      : pos.has(a.key)
        ? -1
        : pos.has(b.key)
          ? 1
          : String(a.at).localeCompare(String(b.at)),
  );
}

/** The days of a tour that have clips: [{ day, n, s }]. */
export function clipDays(trip, sources) {
  const days = Math.max(1, Math.round(Number(trip?.days) || 1));
  const out = [];
  for (let d = 0; d < days; d++) {
    const c = dayClips(trip, d, sources);
    if (c.length)
      out.push({
        day: d,
        n: c.length,
        s: c.reduce((x, y) => x + (y.s || 0), 0),
      });
  }
  return out;
}

/** The order with one clip moved by one place (dir −1 up, +1 down). → [key] */
export function moveClip(keys, key, dir) {
  const list = [...keys];
  const i = list.indexOf(key);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return list;
  [list[i], list[j]] = [list[j], list[i]];
  return list;
}
