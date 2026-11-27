/**
 * The words of «Was auffällt» (flow/hakenhinweise.js): { text, why } for one hint. `nameOf(actId)` gives the activity's name.
 * Plain observation, no «you should»: a question at most («Heute erholen?»). The English keys go through t(), the German is in i18n/de/hakenhinweise.js.
 */
import { t, num, locale } from '../i18n.svelte.js';

const weekdayName = (i) => new Date(Date.UTC(2026, 9, 5 + i, 12)).toLocaleDateString(locale(), { weekday: 'long', timeZone: 'UTC' });

export function hintText(h, nameOf) {
  const a = nameOf(h.actId);
  const b = h.other ? nameOf(h.other) : '';
  switch (h.kind) {
    case 'balance':
      return {
        text: t('{n} days in a row with movement and no recovery. Recover today?', { n: num(h.n) }),
        why: t('Why: on each of the last {n} days you ticked something under «Move» and nothing under «Recovery».', { n: num(h.n) }),
      };
    case 'gap':
      return {
        text: h.every <= 1 ? t('{name}: {n} days without a tick, otherwise almost daily', { name: a, n: num(h.n) }) : t('{name}: {n} days without a tick, otherwise every {k} days', { name: a, n: num(h.n), k: num(h.every) }),
        why: t('Why: your own usual gap between two ticks of «{name}» is {k} days, the last tick is {n} days ago.', { name: a, k: num(h.every), n: num(h.n) }),
      };
    case 'streak':
      return {
        text: t('{name}: {n} days in a row', { name: a, n: num(h.n) }),
        why: t('Why: «{name}» is ticked on each of the last {n} days.', { name: a, n: num(h.n) }),
      };
    case 'together':
      return {
        text: t('On days with «{a}» you often tick «{b}» too', { a, b }),
        why: t('Why: on {n} of the {of} days with «{a}» there is a tick of «{b}» too, in the last 60 days. That is a pattern, not a cause.', { n: num(h.part), of: num(h.of), a, b }),
      };
    default:
      return {
        text: t('{name}: mostly on {day}', { name: a, day: weekdayName(h.weekday) }),
        why: t('Why: {n} of the {of} ticks of «{name}» in the last 60 days fall on a {day}.', { n: num(h.part), of: num(h.of), name: a, day: weekdayName(h.weekday) }),
      };
  }
}
