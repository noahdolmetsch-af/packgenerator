/**
 * «Weiter, wo du warst» (Noah 23.11.2026 «1-5a»): the one line on Today that takes you back to what you began.
 * Pure rules, tested in tests/weiter.test.js. The line replaces «Weitermachen» and keeps its cases:
 * the running ride first, then the next planned trip (the old «Weitermachen», unchanged), else the newest
 * thing begun in the last 3 days (a trip without a date, a debrief started). Older things are left out of the line.
 * «Heute nicht mehr» hides the line on this device for the day; it is only kept in localStorage (no data change).
 */
import { inProgress } from '../drafts.js';
import { isTestTrip, isArchived } from '../testname.js';

/** A begun thing counts in the line for this many days after its last change (Noah «1-5a», point 3). */
export const WEITER_DAYS = 3;
/** localStorage key: the day (YYYY-MM-DD) the line was put away. */
export const NOT_TODAY_KEY = 'weiterNichtHeute';

const ms = (iso) => (iso ? Date.parse(iso) : NaN);

/** Was the thing changed within the last WEITER_DAYS days (counted in hours, from now)? */
export const recent = (updatedAt, now = Date.now()) => {
  const at = ms(updatedAt);
  return Number.isFinite(at) && now - at <= WEITER_DAYS * 24 * 3600 * 1000 && at <= now + 3600 * 1000;
};

/**
 * What else was begun, newest first (never the trip the line already leads with):
 * a trip without a date, and a debrief that was started. Each: { key, id, tripId, title, step, href, updatedAt }.
 */
export function begun({ trips = [], debriefs = [], today, leadId = null, now = Date.now() } = {}) {
  return inProgress(trips.filter((x) => !isArchived(x) && !isTestTrip(x)), debriefs, today)
    .filter((r) => r.id !== leadId && recent(r.updatedAt, now))
    .filter((r) => (r.kind === 'trip' && !r.date) || (r.kind === 'debrief' && r.state.key === 'debriefDraft'))
    .map((r) => ({ key: r.kind, id: r.id, tripId: r.tripId, title: r.title, step: r.next.step, stepLabel: r.next.label, href: r.next.href, updatedAt: r.updatedAt }))
    .sort((a, b) => (ms(b.updatedAt) || 0) - (ms(a.updatedAt) || 0));
}

/** What the line shows now, as one string: a changed thing is another line, so it comes back (Noah «1-5a», point 4). */
export const lineKey = ({ ride = null, extra = null, lead = null } = {}) => (ride ? `ride:${ride.startAt}` : extra ? `begun:${extra.id}:${extra.updatedAt}` : lead ? `lead:${lead.id}:${lead.updatedAt ?? ''}` : '');

/** The value kept when the line is put away: the day and what it showed. */
export const awayValue = (today, key) => `${today}|${key}`;

/** Is the line put away? Only for the same day and the same thing in the line. */
export const putAway = (stored, today, key) => !!stored && !!key && stored === awayValue(today, key);
