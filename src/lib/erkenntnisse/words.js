/**
 * The words of an insight (shared by the page «Erkenntnisse» and the guess to test in the check, Noah 04.11.2026):
 * the sentence «On days with … your mood was … on average, otherwise …». The caller passes its t() and number
 * format; own questions keep the text the user typed (never through t()).
 */
export function xText(t, v, ownName, key, cut) {
  if (key === 'sleepH') return t('more than {v} h of sleep', { v: v(cut) });
  if (key === 'sleepFelt') return t('sleep felt above {v}', { v: v(cut) });
  if (key === 'km') return cut ? t('more than {v} km by bike', { v: v(cut) }) : t('a bike ride');
  if (key === 'med') return cut ? t('more than {v} min of meditation', { v: v(cut) }) : t('meditation');
  if (key === 'steps') return t('more than {v} steps', { v: v(Math.round(cut)) });
  if (key === 'rhr') return t('a resting pulse above {v}', { v: v(cut) });
  if (key === 'azm') return cut ? t('more than {v} active zone minutes', { v: v(cut) }) : t('active zone minutes');
  if (key === 'sunH') return cut ? t('more than {v} h of sunshine', { v: v(cut) }) : t('sunshine');
  if (key === 'lightH') return t('more than {v} h of daylight', { v: v(cut) });
  if (key === 'rainMm') return cut ? t('more than {v} mm of rain', { v: v(cut) }) : t('rain');
  if (key === 'evts') return cut ? t('more than {v} appointments', { v: v(cut) }) : t('appointments');
  if (key === 'hrv') return t('an HRV above {v}', { v: v(cut) });
  // own questions and activities keep the text the user typed (never through t())
  if (key.startsWith('own:')) return t('«{name}» above {v}', { name: ownName(key), v: v(cut) });
  if (key.startsWith('act:')) return ownName(key);
  return key;
}

export const Y = {
  battery: 'your battery|insight',
  mood: 'your mood|insight',
  sat: 'your satisfaction with the day|insight',
  rhr: 'your resting pulse|insight',
  sleepH: 'your sleep in hours|insight',
  sleepFelt: 'your sleep felt|insight',
  hrv: 'your HRV|insight',
};

/** The short name of a value in a lever line («Akku +1.6»). */
export const SHORT = { battery: 'Battery|lever', mood: 'Mood|lever', sat: 'Satisfaction|lever', rhr: 'Resting pulse|lever', sleepH: 'Sleep|lever', sleepFelt: 'Sleep felt|lever', hrv: 'HRV|lever' };
/** The unit that follows a difference in a lever line. */
export const UNIT = { sleepH: ' h', hrv: ' ms' };

/** A signed difference: +1.6, −3 (a real minus sign). */
export const signed = (v, x) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${v(Math.abs(x))}`;

/** The first letter big («mehr als 5.5 h Schlaf» → «Mehr als …»). */
export const cap = (s) => (s ? s[0].toLocaleUpperCase() + s.slice(1) : s);

/**
 * The line of a lever (Noah 23.11.2026): «Mehr als 5.5 h Schlaf: Akku im Schnitt +1.6» (or «… am Tag danach …»), and the tip under it.
 * x: a row of leversOf(); name(key) gives the user's text of an activity.
 */
export function leverLine(t, v, ownName, x) {
  const xt = cap(xText(t, v, ownName, x.x, x.cut));
  const d = `${signed(v, x.hi.mean - x.lo.mean)}${UNIT[x.y] ?? ''}`;
  return t(x.lag ? '{x}: {y} the next day {d}|lever' : '{x}: {y} on average {d}|lever', { x: xt, y: t(SHORT[x.y]), d });
}
export function tipOf(t, ownName, x) {
  const k = x.x;
  if (k === 'sleepH') return t('Try it today: go to bed earlier.');
  if (k === 'km') return t('Try it today: a ride, even a short one.');
  if (k === 'med') return t('Try it today: a few minutes of meditation.');
  if (k === 'steps') return t('Try it today: a walk.');
  if (k === 'azm') return t('Try it today: something that gets your pulse up.');
  return t('Try it today: {name}.', { name: ownName(k) });
}

/** The one sentence of an insight x (a row of insights()). */
export const sentenceOf = (t, v, ownName, x) =>
  t(x.lag ? 'The day after {x}, {y} was {hi} on average, otherwise {lo}.' : 'On days with {x}, {y} was {hi} on average, otherwise {lo}.', {
    x: xText(t, v, ownName, x.x, x.cut),
    y: t(Y[x.y]),
    hi: v(x.hi.mean),
    lo: v(x.lo.mean),
  });
