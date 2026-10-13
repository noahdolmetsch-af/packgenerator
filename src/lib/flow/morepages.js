/**
 * v0.130.0 «Mehr in Aktiv»: Aktiv's own pages for the cards (MoreAktiv.svelte). Woche comes first;
 * Erholung and Sporttasche join with their releases (mockups AK2, AK3).
 * openGoals: how many goals of the week are still open (flowweek.js weekGoals).
 */
import { CalendarDays } from '@lucide/svelte';
import { t, tn } from '../i18n.svelte.js';

export function morePages({ openGoals = 0 } = {}) {
  return [
    {
      key: 'week',
      href: '#/flow/week',
      icon: CalendarDays,
      title: t('Week'),
      sub: openGoals ? tn(openGoals, '{n} goal open', '{n} goals open') : t('All goals on track'),
    },
  ];
}
