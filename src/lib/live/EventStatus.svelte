<script>
  /**
   * Gruppenfahrt für Events (Noah 26.10.2026 «6 auch für Rennen bauen», mockup G8): «I am ready» and «I am
   * in camp». One tap, and everyone knows who is ready in the morning and who is in camp in the evening
   * (counts only on the day it was tapped). In a race (the maker's plan): «Arrived at the checkpoint» for
   * each checkpoint and the finish; the button shows up when you are near it, and by hand in the list.
   * rows: memberRows with .part; mine: my part; onpart(patch).
   */
  import { CircleCheck, Tent, Flag } from '@lucide/svelte';
  import { t, num } from '../i18n.svelte.js';
  import { statusToday, statusCount, cpNear, lastCp, zurichTime } from './event.js';
  import './event.css';

  let { rows = [], mine = {}, plan = null, cps = [], meKm = null, now = Date.now(), onpart = null, canSend = true } = $props();
  const st = $derived(statusToday(mine?.status, now));
  const count = $derived(statusCount(rows, now));
  const reached = $derived(mine?.cps ?? {});
  const near = $derived(plan?.race ? cpNear(cps, meKm, reached) : null);
  const cpName = (c) => (c.finish ? t('Finish') : c.name || t('CP {n}', { n: c.i + 1 }));
  let busy = $state(false);
  async function set(kind) {
    busy = true;
    await onpart?.({ status: st?.kind === kind ? null : { kind, at: new Date().toISOString() } });
    busy = false;
  }
  async function arrive(c) {
    busy = true;
    const cpsNew = { ...reached };
    if (cpsNew[c.i]) delete cpsNew[c.i];
    else cpsNew[c.i] = new Date().toISOString();
    await onpart?.({ cps: cpsNew });
    busy = false;
  }
  const time = (at) => zurichTime(Date.parse(at));
</script>

<section class="card ev-box" aria-labelledby="es-h" data-event-status>
  <h2 id="es-h">{t('Ready and arrived')}</h2>
  <p class="ev-muted">{plan?.start ? t('Start {time}.', { time: plan.start }) + ' ' : ''}{t('One tap, and everyone knows who is ready and who is already in camp.')}</p>
  <div class="ev-acts">
    <button type="button" class="btn" class:hi={st?.kind !== 'ready'} aria-pressed={st?.kind === 'ready'} onclick={() => set('ready')} disabled={busy || !canSend} data-event-ready><CircleCheck size={18} aria-hidden="true" />{t('I am ready')}</button>
    <button type="button" class="btn" aria-pressed={st?.kind === 'camp'} onclick={() => set('camp')} disabled={busy || !canSend} data-event-camp><Tent size={18} aria-hidden="true" />{t('I am in camp')}</button>
  </div>
  <p class="ev-strong" data-event-count>{t('{ready} of {total} ready, {camp} in camp.', { ready: count.ready, total: count.total, camp: count.camp })}</p>
  {#if st}<p class="ev-muted" role="status">{st.kind === 'ready' ? t('You are ready since {time}. Tap again to take it back.', { time: time(st.at) }) : t('You are in camp since {time}. Tap again to take it back.', { time: time(st.at) })}</p>{/if}

  {#if plan?.race && cps.length}
    <h3>{t('In the race')}</h3>
    {#if near}
      <div><button type="button" class="btn hi" onclick={() => arrive(near)} disabled={busy || !canSend} data-event-cp-near><Flag size={18} aria-hidden="true" />{near.finish ? t('Arrived at the finish') : t('Arrived at {cp}', { cp: cpName(near) })}</button></div>
    {/if}
    <ul class="ev-list" data-event-cps>
      {#each cps as c (c.i)}
        {@const who = rows.filter((r) => r.part?.cps?.[c.i])}
        <li data-event-cp={c.i}>
          <span class="ev-ic" aria-hidden="true">{c.finish ? '🏁' : '🚩'}</span>
          <span class="ev-txt"><b>{cpName(c)}</b><small>{t('km {km}', { km: num(c.km) })} · {who.length ? who.map((r) => `${r.name || t('Without a name')} ${time(r.part.cps[c.i])}`).join(', ') : t('nobody there yet')}</small></span>
          <button type="button" class="btn sm" aria-pressed={!!reached[c.i]} onclick={() => arrive(c)} disabled={busy || !canSend} data-event-cp-tap={c.i}>{reached[c.i] ? t('Arrived {time}', { time: time(reached[c.i]) }) : t('I am here')}</button>
        </li>
      {/each}
    </ul>
    {@const mineLast = lastCp(cps, reached)}
    {#if mineLast}<p class="ev-muted">{t('Your last checkpoint: {cp} at {time}.', { cp: cpName(mineLast.cp), time: time(mineLast.at) })}</p>{/if}
  {/if}
</section>
