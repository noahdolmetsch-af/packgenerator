/**
 * «Meine Tour» (Plan «ganze App», Schritt 2a, Noah 08.11.2026 «2 a»): what the card on Heute shows for one planned tour.
 * It only reads tourStand (stand.js, the rule of the Tour-Pfad) and the words of saetze.js, so Heute and the page
 * «Tour-Pfad» always say the same: the phase, «Schritt n von 4», the next open row as the one main button and the hints
 * as ONE line. Pure: the card passes the trip, the day and what Heute already knows. Tested in tests/meinetour.test.js.
 *
 *   meineTour(trip, ctx, { prep }) → { tripId, title, n, total, step, phase, phases, next, hint, pfad } | null
 *
 * null: no trip, or a tour that is over (debrief saved) or not riding; the card is only there for a planned tour.
 * ctx: the same as tourStand (today, debriefDone …). prep: eventPrep() of the trip (the preparation tasks of the Excel
 * list), its line is the hint; without it the first row with a note (state «warn») is.
 * next: { key, href, title, line, button } | null (nothing open in this phase). hint: { text, href, prep } | null.
 * There is no «Unterwegs» button here (Noah «9 b»): the on-the-way mode comes with step 7a and is switched on by Noah.
 */
import { tourStand, PHASES } from './stand.js';
import { PHASE_TITLE, rowWords, headLine } from './saetze.js';
import { eventPrepLine } from '../readiness.js';
import { t } from '../i18n.svelte.js';

/** The address of the path of one tour. */
export const pfadHref = (trip) => `#/trips/pfad?t=${encodeURIComponent(trip.id)}`;

export function meineTour(trip, ctx = {}, { prep = null } = {}) {
  if (!trip) return null;
  const stand = tourStand(trip, ctx);
  if (!PHASES.includes(stand.phase)) return null;
  const titles = PHASE_TITLE();
  const nx = stand.next ? { key: stand.next.key, href: stand.next.href, ...rowWords(stand.next) } : null;
  const warn = stand.phases.flatMap((p) => p.rows).find((r) => r.state === 'warn');
  let hint = null;
  if (prep?.status === 'open') hint = { text: eventPrepLine(prep), href: '#/pack', prep: trip.id };
  else if (warn) {
    const w = rowWords(warn);
    hint = { text: w.line ? `${w.title}: ${w.line}` : w.title, href: warn.href, prep: null };
  }
  return {
    tripId: trip.id,
    title: trip.title,
    n: stand.n,
    total: stand.total,
    step: headLine(stand),
    phase: stand.phase,
    phases: stand.phases.map((p) => ({ key: p.key, title: titles[p.key], state: p.state })),
    next: nx && { ...nx, button: t('Go on with {title}', { title: nx.title }) },
    hint,
    pfad: pfadHref(trip),
  };
}
