/**
 * v0.130.0 «Mehr in Aktiv»: Aktiv's own pages for the cards (MoreAktiv.svelte), in the mockups' order:
 * Woche (AK1), Erholung (AK2), Sporttasche (AK3), Ideen (HN4c, Noah «6a» 14.10.2026: «Meine Ideen» is an own list).
 * openGoals: how many goals of the week are still open (flowweek.js weekGoals); ideas: open own ideas.
 */
import { CalendarDays, Moon, ShoppingBag, Lightbulb } from '@lucide/svelte';
import { t, tn } from '../i18n.svelte.js';

export function morePages({ openGoals = 0, ideas = 0 } = {}) {
  return [
    { key: 'week', href: '#/flow/week', icon: CalendarDays, title: t('Week'), sub: openGoals ? tn(openGoals, '{n} goal open', '{n} goals open') : t('All goals on track') },
    { key: 'rest', href: '#/flow/rest', icon: Moon, title: t('Recovery|page'), sub: t('a pause has its place') },
    { key: 'bags', href: '#/flow/bags', icon: ShoppingBag, title: t('Sport bag'), sub: t('a short list per sport') },
    { key: 'ideas', href: '#/flow/ideen', icon: Lightbulb, title: t('Ideas'), sub: ideas ? t('{n} open · for your balance', { n: ideas }) : t('for your balance') },
  ];
}
