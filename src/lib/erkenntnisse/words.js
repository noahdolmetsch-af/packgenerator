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
  if (key.startsWith('own:')) return t('«{name}» above {v}', { name: ownName(key), v: v(cut) });
  return key;
}

export const Y = {
  battery: 'your battery|insight',
  mood: 'your mood|insight',
  sat: 'your satisfaction with the day|insight',
  rhr: 'your resting pulse|insight',
  sleepH: 'your sleep in hours|insight',
  sleepFelt: 'your sleep felt|insight',
};

/** The one sentence of an insight x (a row of insights()). */
export const sentenceOf = (t, v, ownName, x) =>
  t(x.lag ? 'The day after {x}, {y} was {hi} on average, otherwise {lo}.' : 'On days with {x}, {y} was {hi} on average, otherwise {lo}.', {
    x: xText(t, v, ownName, x.x, x.cut),
    y: t(Y[x.y]),
    hi: v(x.hi.mean),
    lo: v(x.lo.mean),
  });
