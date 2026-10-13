/**
 * v0.130.0 «Mehr in Aktiv»: Aktiv's own pages for the cards (MoreAktiv.svelte), in the mockups' order:
 * Woche (AK1), Erholung (AK2), Sporttasche (AK3).
 * openGoals: how many goals of the week are still open (flowweek.js weekGoals).
 */
import { CalendarDays, Moon, ShoppingBag } from '@lucide/svelte';
import { t, tn } from '../i18n.svelte.js';

export function morePages({ openGoals = 0 } = {}) {
  return [
    { key: 'week', href: '#/flow/week', icon: CalendarDays, title: t('Week'), sub: openGoals ? tn(openGoals, '{n} goal open', '{n} goals open') : t('All goals on track') },
    { key: 'rest', href: '#/flow/rest', icon: Moon, title: t('Recovery|page'), sub: t('a pause has its place') },
    { key: 'bags', href: '#/flow/bags', icon: ShoppingBag, title: t('Sport bag'), sub: t('a short list per sport') },
  ];
}
