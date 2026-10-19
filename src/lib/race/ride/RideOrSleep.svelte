<script>
  /**
   * Paket U «Rennen», Race mode · 18 Weiterfahren oder schlafen? A calm side by side, you decide.
   * Learning: «Day 1 at 19:40 at km 140: ride on to the hotel at km 168 = 3.4 h more, arrival around
   * 23:50, against a bivy now» — exactly this comparison.
   */
  import { Trash2 } from '@lucide/svelte';
  import Box from './Box.svelte';
  import { rideOrSleep, hhmm, hm, newId } from '../race.js';
  import { lowBetween } from '../outside.js';
  import { ahead, toBed, wxNear, sleptMin, awakeH } from '../ride-lib.js';
  import { putRace } from '../store.js';
  import { askDelete, deleteWithUndo } from '../../ui/ask.js';
  import { offerDone } from '../../ui/rename.svelte.js';
  import { t, num } from '../../i18n.svelte.js';

  let { ctx, now, km, wx = null, bufferH = 0 } = $props();
  const log = $derived(Array.isArray(ctx.stored.sleepLog) ? ctx.stored.sleepLog : []);
  const kmh = $derived(ctx.plan?.kmh > 0 ? ctx.plan.kmh : 18);
  const bed = $derived(ahead(ctx.pois, km + 0.05, ['sleep'])[0] ?? null);
  const go = $derived(toBed(bed, km, now, kmh));
  const nightAt = (k, from) => {
    const s = wxNear(wx, ctx.pts, k);
    return s ? lowBetween(s, from, from + 8 * 36e5) : null;
  };
  const bedC = $derived(go ? nightAt(bed.km, go.at) : null);
  const hereC = $derived(nightAt(km, now));
  const awake = $derived(awakeH(log, ctx.plan?.start, now));
  const tired = $derived(ctx.race.tired.at(-1)?.v ?? 2);
  const pick = $derived(rideOrSleep({ tired, hour: new Date(now).getHours(), awakeH: awake, kmToBed: go?.km ?? 20, kmh, nightC: bedC ?? hereC, bagC: ctx.race.bagC, bufferH }));
  const PICK = { sleep: 'Sleep now', nap: 'A short nap (20 minutes)', ride: 'Ride on' };
  const whyText = (k) => t(k, { h: k.includes('awake') ? Math.round(awake) : hm(pick.toBedH) });
  const deg = (c) => (c == null ? '' : `${Math.round(c)} °C`);
  let min = $state('');

  async function slept(e) {
    e.preventDefault();
    const m = Math.round(Number(min));
    if (!(m > 0)) return;
    const before = await ctx.save({ sleepLog: [...log, { id: newId('s'), at: new Date().toISOString(), min: m }] });
    min = '';
    offerDone(t('{n} minutes of sleep noted.', { n: m }), () => putRace(ctx.trip.id, before));
  }
  async function drop(x) {
    if ((await askDelete({ title: t('Delete this sleep?') })) !== 'delete') return;
    const before = log;
    await deleteWithUndo({ run: () => ctx.save({ sleepLog: log.filter((y) => y.id !== x.id) }), undo: () => ctx.save({ sleepLog: before }), text: t('Sleep deleted.'), name: t('Sleep') });
  }
</script>

<Box id="ride-sleep" title={t('Ride on or sleep?')} what="Puts the next bed and sleeping here side by side: km, hours, arrival, the cold of the night, your sleep so far." why="Late at night decisions get bad; a calm comparison helps you decide. You decide, the app only suggests." from="Places to sleep from your stop file and OpenStreetMap, the pace of your plan, the weather you loaded under «Along the route», your sleep and tiredness logs.">
  <div class="rm-two">
    <div data-race-sleep-ride>
      <b>{t('Ride on')}</b>
      {#if go}
        <span>{t('To {name} at km {km}', { name: bed.name || t('Place to sleep'), km: num(Math.round(bed.km)) })}</span>
        <span>{t('{km} km = {h} more, arrival around {time}', { km: num(go.km), h: hm(go.h), time: hhmm(go.at) })}</span>
        {#if bedC != null}<span class:rc-warn={bedC < ctx.race.bagC}>{t('Night low there {c}', { c: deg(bedC) })}</span>{/if}
        {#if bed.phone}<a href="tel:{bed.phone}">{bed.phone}</a>{/if}
      {:else}
        <span class="rc-note">{t('No place to sleep known ahead. Load the places under «Along the route».')}</span>
      {/if}
    </div>
    <div data-race-sleep-here>
      <b>{t('Bivy here now')}</b>
      <span>{t('Sleep from {time} at km {km}', { time: hhmm(now), km: num(Math.round(km)) })}</span>
      {#if hereC != null}<span class:rc-warn={hereC < ctx.race.bagC}>{t('Night low here {c}', { c: deg(hereC) })}</span>{/if}
      <span class="rc-note">{t('Your sleeping bag: comfortable to {c}', { c: deg(ctx.race.bagC) })}</span>
    </div>
  </div>
  <p class="rc-note">{t('Slept so far: {h} · awake for {a}', { h: hm(sleptMin(log) / 60), a: hm(awake) })}</p>
  <div class="rc-info" data-race-sleep-pick={pick.pick}>
    <p><b>{t('Suggestion')}:</b> {t(PICK[pick.pick])}</p>
    {#each pick.why as k (k)}<p>{whyText(k)}</p>{/each}
  </div>
  <form class="rc-inline" onsubmit={slept}>
    <input class="inp" type="number" min="1" max="900" inputmode="numeric" bind:value={min} placeholder={t('Minutes')} aria-label={t('I slept … minutes')} data-race-sleep-min />
    <button type="submit" class="btn" disabled={!(Number(min) > 0)}>{t('I slept … min')}</button>
  </form>
  {#if log.length}
    <ul class="rc-list">
      {#each log as x (x.id)}
        <li class="rc-row"><span class="rc-row-main"><b>{t('{n} min', { n: x.min })}</b><small>{t('woke up at {time}', { time: hhmm(Date.parse(x.at)) })}</small></span><button type="button" class="rc-icon" aria-label={t('Delete this sleep?')} onclick={() => drop(x)}><Trash2 size={18} aria-hidden="true" /></button></li>
      {/each}
    </ul>
  {/if}
</Box>

<style>
  .rm-two {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 8px;
  }
  .rm-two > div {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--paper-2);
    min-width: 0;
    overflow-wrap: break-word;
  }
</style>
