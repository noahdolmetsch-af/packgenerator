/**
 * Paket M «Aus Touren lernen», #208 «Dein Jahr als Bildgeschichte»: your year of trips as slides
 * (#/jahr, #/jahr/<year>). Usable any time, also for past years; from 1 December the app may say
 * «Dein Jahr als Bildgeschichte ist bereit» (storyReady). Photos stay on the device (lernen/fotos.js).
 * Pure functions; JahrStory.svelte draws the slides. Tested in tests/jahrstory.test.js.
 */
import { tripFacts } from '../review/rueckblick.js';
import { localDay } from '../localday.js';
import { noteLine } from './chronik.js';

/** From 1 December on, the story of this year is ready (for a hint line). */
export const storyReady = (today = localDay()) => typeof today === 'string' && today.slice(5, 7) === '12';

/** The year of #/jahr/<year> (4 digits), else this year. */
export function yearOfHash(hash = '', today = localDay()) {
  const m = String(hash).match(/^#\/jahr\/(\d{4})(?:[/?]|$)/);
  return m ? m[1] : today.slice(0, 4);
}

/**
 * The slides of a year, in order:
 * cover { year, trips } · trip { id, title, start, end, days, km, note, photo, lines, href } (oldest first) ·
 * number { key: 'km' | 'gainM' | 'days', value } (only above 0) · neu { items } (only with items) ·
 * thanks { year }. photos: { tripId: [{ data, day }] } (fotos.js allTripPhotos).
 */
export function storySlides({ year, trips = [], debriefs = [], rides = [], learnings = [], photos = {}, neu = [], today = localDay() } = {}) {
  const y = String(year ?? today.slice(0, 4));
  const facts = tripFacts({ trips, debriefs, rides, learnings, today }).filter((r) => r.start?.slice(0, 4) === y);
  const tripRows = facts.filter((r) => r.kind === 'trip').sort((a, b) => a.start.localeCompare(b.start));
  const dBy = Object.fromEntries(debriefs.map((d) => [d.tripId, d]));
  const slides = [{ kind: 'cover', year: y, trips: tripRows.length }];
  for (const r of tripRows) {
    const lines = r.rides.map((x) => x.line).filter((l) => Array.isArray(l) && l.length > 1);
    if (!lines.length && r.trip?.route?.line?.length > 1) lines.push(r.trip.route.line);
    const ph = (photos[r.id] ?? []).find((p) => typeof p?.data === 'string');
    slides.push({ kind: 'trip', id: r.id, title: r.title, start: r.start, end: r.end, days: r.days, km: r.km == null ? null : Math.round(r.km), note: noteLine(dBy[r.id]?.note, 120), photo: ph?.data ?? null, lines, href: r.href });
  }
  const km = Math.round(facts.reduce((s, r) => s + (r.km ?? 0), 0));
  const gainM = Math.round(facts.reduce((s, r) => s + (r.gainM ?? 0), 0));
  const days = tripRows.reduce((s, r) => s + r.days, 0);
  for (const [key, value] of [['km', km], ['gainM', gainM], ['days', days]]) if (value > 0) slides.push({ kind: 'number', key, value });
  const items = (Array.isArray(neu) ? neu : []).filter((s) => typeof s === 'string' && s.trim()).slice(0, 6);
  if (items.length) slides.push({ kind: 'neu', items });
  slides.push({ kind: 'thanks', year: y });
  return slides;
}

/** The next slide index after a step (+1 / −1), kept inside 0 … n−1. */
export const stepTo = (i, step, n) => Math.max(0, Math.min(n - 1, i + step));
