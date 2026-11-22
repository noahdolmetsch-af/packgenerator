/**
 * «Vier Wege auf der Tourkarte» (UI-Prüfung 07.11.2026, T2, Noah «alle Vorschläge»): the ways a planned trip's card in
 * Touren › Übersicht offers, by the phase of the trip. Pure: no page, no database, no clock (today is passed in).
 *
 * Before and during the trip: Packen, Wetter, Form. Once the last day is over and the trip still stands in «Geplant»:
 * Rückblick and Form (the weather of a day gone by is no use). Every way is { key, label (English key), href }.
 * Packen is opened with switchTrip() by the page (it makes the trip the open one), the rest are plain links.
 */

/** The last day of a trip (ISO), from its start and its days; null without a start. Calendar days, no clock. */
export function lastDay(trip) {
  if (!trip?.startDate) return null;
  const d = new Date(`${trip.startDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Math.max(1, Number(trip.days) || 1) - 1);
  return d.toISOString().slice(0, 10);
}

/** 'after' once the last day lies before today, else 'before' (also without a date). */
export function phaseOf(trip, today) {
  const end = lastDay(trip);
  return end && today && end < today ? 'after' : 'before';
}

export const WAY_PACK = '#/pack?day';
export const WAY_FORM = '#/flow/form';

/** The ways of a planned trip (an object with id, startDate, days), in the order they are shown. */
export function tripWays(trip, today) {
  if (!trip?.id) return [];
  const id = encodeURIComponent(trip.id);
  if (phaseOf(trip, today) === 'after') {
    return [
      { key: 'review', label: 'Review|tripway', href: `#/debrief/${id}` },
      { key: 'form', label: 'Form|tripway', href: WAY_FORM },
    ];
  }
  return [
    { key: 'pack', label: 'Pack|tripway', href: WAY_PACK },
    { key: 'weather', label: 'Weather|tripway', href: `#/wetter?trip=${id}` },
    { key: 'form', label: 'Form|tripway', href: WAY_FORM },
  ];
}
