/**
 * «Weiter zu …» (thread «Navigation ohne Sackgassen», Noah 23.11.2026 «ja», Punkt 3): a page whose only link led back to
 * its place gets a quiet line at its end with the way on. Short on purpose: up to three next steps, written by hand, each
 * a page that usually comes next. A page that already has many ways on (a tab, a hub) is not in this list.
 * The guard test tests/weiter.test.js checks that every address is a real page and every name has a German text.
 */
const T = {
  trips: ['#/trips', 'Trips|place'],
  dreams: ['#/trips/dreams', 'Dreams|tab'],
  inspiration: ['#/inspiration', 'Inspiration'],
  travel: ['#/travel', 'Travel links'],
  live: ['#/live', 'Live map'],
  group: ['#/gruppenfahrt', 'Group ride'],
  compare: ['#/trips/compare', 'Trips side by side'],
  fuel: ['#/trips/fuel', 'Food and water'],
  weg: ['#/trips/weg', 'Way to the goal'],
  pfad: ['#/trips/pfad', 'Tour path'],
  stopps: ['#/stopps', 'Stops nearby'],
  quiz: ['#/quiz', 'Quiz the evening before'],
  checks: ['#/me/checks', 'Checks per trip type'],
  album: ['#/me/album', 'Photo album'],
  rides: ['#/trips/rides', 'Rides|tab'],
  training: ['#/flow/training', 'Training|tab'],
  milestones: ['#/flow/milestones', 'Milestones'],
  review: ['#/flow/review', 'Week in review'],
  kurse: ['#/kurse', 'Kursblick'],
  apps: ['#/me/apps', 'Small apps'],
  me: ['#/me', 'Me|place'],
  handbook: ['#/me/handbook', 'Handbook'],
  logbuch: ['#/me/logbuch', 'Improvement log'],
  push: ['#/me/push', 'Reminders on the phone'],
  reminders: ['#/me/reminders', 'Reminders'],
  hinweise: ['#/me/hinweise', 'Alerts and news'],
  pros: ['#/me/pros', 'Bike mechanic and guide'],
  ki: ['#/me/ki-projekte', 'My AI projects'],
};

/** page address → the keys of T that come next (order: the most usual first). */
const NEXT = {
  '#/debrief/play-trip': ['trips', 'dreams'],
  '#/flow/challenges': ['milestones', 'training'],
  '#/flow/geschafft': ['review', 'training'],
  '#/inspiration': ['dreams', 'travel', 'trips'],
  '#/me/inspiration': ['dreams', 'travel', 'trips'],
  // Kursblick has its own tabs (Heute, Gold, Märkte …), so the way on leads out of it: to the small apps it lives in, and to Ich
  '#/kurse': ['apps', 'me'],
  '#/kurse/gold': ['apps', 'me'],
  '#/kurse/entscheidung': ['apps', 'me'],
  '#/kurse/maerkte': ['apps', 'me'],
  '#/kurse/portfolio': ['apps', 'me'],
  '#/kurse/quellen': ['apps', 'me'],
  '#/live': ['group', 'rides', 'trips'],
  '#/me/album': ['trips', 'rides'],
  '#/me/apps': ['kurse', 'handbook'],
  '#/me/checks': ['trips', 'quiz'],
  '#/me/handbook': ['apps', 'logbuch'],
  '#/me/ki-projekte': ['apps', 'handbook'],
  '#/me/logbuch': ['handbook', 'apps'],
  '#/me/offers': ['trips', 'pros'],
  '#/me/pros': ['trips', 'checks'],
  // Ich aufräumen (Noah 24.11.2026): the three reminder pages lead to each other, they share one row in Ich
  '#/me/push': ['reminders', 'hinweise', 'handbook'],
  '#/me/hinweise': ['reminders', 'push'],
  '#/me/reminders': ['push', 'hinweise'],
  '#/me/tennis': ['trips', 'me'],
  '#/quiz': ['checks', 'trips'],
  '#/stopps': ['weg', 'fuel', 'trips'],
  '#/travel': ['inspiration', 'dreams', 'trips'],
  '#/trips/compare': ['rides', 'weg', 'trips'],
  '#/trips/fuel': ['weg', 'stopps', 'trips'],
  '#/trips/pfad': ['weg', 'stopps', 'trips'],
  '#/trips/weg': ['pfad', 'fuel', 'stopps'],
};

/** The way on for an address: [{ href, label (the English key for t) }], at most three; [] where the page has enough ways. */
export function weiterOf(hash = '') {
  const key = String(hash).split('?')[0].replace(/\/$/, '');
  return (NEXT[key] ?? []).map((k) => ({ href: T[k][0], label: T[k][1] })).filter((x) => x.href !== key).slice(0, 3);
}

/** For the guard test. */
export const WEITER_ADDRESSES = [...new Set([...Object.keys(NEXT), ...Object.values(T).map((x) => x[0])])];
export const WEITER_LABELS = [...new Set(Object.values(T).map((x) => x[1]))];
