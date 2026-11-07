/**
 * Schrittart «GPS-Tracker» für «Weg zum Ziel» (Noah 05.11.2026 «a», Thread «Planen: GPS-Tracker im Weg»):
 * five steps so that the people at home can follow the ride and the tracker does not fail on the day.
 *
 *   abo     – Prepare the subscription     deadline, cost and which account (as a note)
 *   laden   – Charge the tracker           full, with the cable and the power bank in the bag
 *   probe   – Test ride                    a short ride; does the dot show up?
 *   familie – Family opens the link        the people at home see the dot on their own phone
 *   akku    – Battery over 24 hours        runs a whole day and night without a charge
 *
 * PRIVACY (Noah, binding): the app never stores a login or a password of the tracker. The only thing it keeps
 * is the hint «Access is in the password manager». `looksLikeSecret` lets the page warn before a note with
 * something that looks like a login or a password is saved.
 *
 * Nothing in the app knows whether a tracker works, so every step is ticked by hand (`auto` answers null).
 * The step carries `key` (one of the five) so that renaming it keeps it countable. Races and trips get the five
 * steps suggested; a free goal gets none (the user can add them). Everything is a suggestion: days, names, ticks,
 * order and deleting stay with the user (weg.js). Pure functions, tested in tests/weg-gps.test.js.
 * Titles and notes are English keys for t().
 */

/** The five steps: key, title, days before the start, a note under the title. */
export const STEPS = [
  { key: 'abo', title: 'Prepare the tracker subscription', offset: 45, note: 'Write down the deadline, the cost and which account it runs on. The access stays in the password manager, never here.' },
  { key: 'laden', title: 'Charge the tracker', offset: 22, note: 'Charge it full. Cable and power bank go in the bag. Charge it again the day before.' },
  { key: 'probe', title: 'Test ride with the tracker', offset: 21, note: 'A short ride. Does the dot show up on the map within a few minutes?' },
  { key: 'familie', title: 'Family opens the link', offset: 20, note: 'Send the tracking link to the people at home. Ask them to open it on their own phone.' },
  { key: 'akku', title: 'Battery lasts 24 hours', offset: 14, note: 'Let the tracker run for a whole day and night. Note how much battery is left.' },
];

/** The only sentence about access that the app keeps. */
export const ACCESS_HINT = 'Access is in the password manager';

/**
 * Does a note look like it holds a login or a password? true → the page warns and does not save it as is.
 * Words like «password» or «Passwort» followed by something, «login: …», «user: …», «pw=…». The hint
 * «Access is in the password manager» is fine.
 */
export function looksLikeSecret(text) {
  const s = String(text ?? '');
  if (!s.trim()) return false;
  const clean = s.replace(/access is in the password manager|zugang (liegt|ist) im passwortmanager/gi, '');
  return /\b(pass(word|wort|wd)?|pw|pwd|login|log-in|benutzer(name)?|username|user|passcode|pin)\s*[:=]\s*\S+/i.test(clean)
    || /\b(passwort|password)\s+(ist|is|lautet)\s+\S+/i.test(clean);
}

export default {
  type: 'gps',
  label: 'GPS tracker',
  icon: 'pin',
  /** Races and trips get the five steps; a free goal gets none (the user can add them). */
  defaults: (goal) => (goal?.kind === 'race' || goal?.kind === 'trip' ? STEPS.map(({ key, title, offset, note }) => ({ key, title, offset, note })) : []),
  /** Nothing in the app knows about the tracker: ticked by hand. */
  auto: () => null,
  /**
   * Where the step leads: the subscription and the charging to the race (links and papers) or the sheet before
   * the departure; the rides and the link for the family to the live map or the departure sheet.
   */
  link: (goal, step) => {
    const key = step?.key;
    if (key === 'probe' || key === 'akku') return '#/live';
    if (key === 'familie') return '#/ride/abfahrt';
    return goal?.kind === 'race' && goal?.tripId ? `#/race/${encodeURIComponent(goal.tripId)}` : '#/ride/abfahrt';
  },
};
