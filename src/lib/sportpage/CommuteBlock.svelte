<script>
  /**
   * Paket O, extra block «Pendeln» (#195 «Pendel-km zählen mit»): the km of the rides Strava marks as commute,
   * this month and this year, and the commutes ticked in Aktiv.
   */
  import { commuteKm, commuteTicks } from '../sportshelp.js';
  import { t, tn, num } from '../i18n.svelte.js';

  let { activities = [], log = [], today } = $props();
  const km = $derived(commuteKm(activities, today));
  const ticks = $derived(commuteTicks(log, today));
</script>

<p class="row" data-commute>
  <span><b class="num">{num(km.month)} km</b> <small>{t('this month')}</small></span>
  <span><b class="num">{num(km.year)} km</b> <small>{t('this year')}</small></span>
</p>
{#if ticks}<p class="small">{tn(ticks, '{n} commute ticked in Aktiv this month', '{n} commutes ticked in Aktiv this month')}</p>{/if}
<p class="small">{t('Counted are the rides Strava marks as «Commute» (tick it there once per ride, or set it for your bike).')}</p>
