<script>
  /**
   * Gruppenfahrt für Events (Noah 26.10.2026 «1-5 alle», «6 auch für Rennen bauen 7 8 9», «1a»: an own
   * page): everything a group of new people shares at a bikepacking event or a race, in one place. Used by
   * the maker's page (#/gruppenfahrt) and the friends' page (#/gruppe/…).
   * On top: help calls of the others (with sound) and a thunderstorm ahead. Then the group with the distance
   * to you, ready / in camp and the checkpoints, «I need help», meeting points, who has what, split costs,
   * and for the maker the settings (night pause, start, race checkpoints).
   * rows: memberRows() of group.js (with .part); part: my own part; onpart(patch): change and send it.
   */
  import { RefreshCw } from '@lucide/svelte';
  import { t, num } from '../i18n.svelte.js';
  import GroupList from './GroupList.svelte';
  import EventHelp from './EventHelp.svelte';
  import EventStatus from './EventStatus.svelte';
  import EventPoints from './EventPoints.svelte';
  import EventItems from './EventItems.svelte';
  import EventCosts from './EventCosts.svelte';
  import EventStorm from './EventStorm.svelte';
  import EventPlan from './EventPlan.svelte';
  import { withGaps, helpCalls, checkpoints } from './event.js';
  import './event.css';

  let { title = '', route = null, plan = null, rows = [], me = null, part = {}, here = null, owner = false, now = Date.now(), suggest = [], canSend = true, onpart = null, onplan = null, onrefresh = null } = $props();

  const meKm = $derived(rows.find((r) => r.me)?.km ?? null);
  const g = $derived(withGaps(rows, meKm));
  const calls = $derived(helpCalls(rows, { now, me }).map((c) => ({ ...c, gap: Number.isFinite(meKm) && Number.isFinite(c.km) ? Math.round((c.km - meKm) * 10) / 10 : null })));
  const cps = $derived(plan?.race ? checkpoints(plan, route) : []);
</script>

<div class="ev-board" data-event-board>
  <EventHelp {calls} show="alerts" {now} />
  <EventStorm {route} rows={g.rows} {me} />

  <section class="card ev-box" aria-labelledby="eb-h">
    <h2 id="eb-h">{t('In the group')}</h2>
    {#if g.spread && (g.spread.front || g.spread.back)}
      <p class="ev-strong" data-event-spread>{t('The first is {front} km ahead of you, the last {back} km behind you.', { front: num(g.spread.front), back: num(g.spread.back) })}</p>
    {/if}
    <GroupList rows={g.rows} hasRoute={!!route} {cps} {now} />
    {#if onrefresh}<div><button type="button" class="btn sm" onclick={onrefresh} data-group-refresh><RefreshCw size={16} aria-hidden="true" />{t('Refresh')}</button></div>{/if}
  </section>

  <EventHelp show="form" mine={part?.help ?? null} {now} {canSend} onsend={(help) => onpart?.({ help })} />
  <EventStatus rows={g.rows} mine={part} {plan} {cps} {meKm} {now} {canSend} {onpart} />
  <EventPoints rows={g.rows} mine={part} {here} {route} {me} {canSend} {onpart} />
  <EventItems rows={g.rows} mine={part} {me} {suggest} {canSend} {onpart} />
  <EventCosts rows={g.rows} mine={part} {me} {title} {canSend} {onpart} />
  {#if owner}<EventPlan {plan} {onplan} />{/if}
</div>
