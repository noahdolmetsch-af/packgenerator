<script>
  /**
   * «Warst du über dem Nebel?» (Noah 27.11.2026 «wieder aufnehmen», the question left over from 4b of «Nebelmeer-Tage»): on the saved
   * Rückblick of a trip in winter. «Yes, keep the day» puts the day on the Sammel-Wand shelf «Fog sea» (with the trip, so the
   * question is asked once; the fog height is optional), «No thanks» is remembered for the trip, both with Undo. Nothing is
   * kept without a tap, no goal, no streak. A kept day shows its way to the shelf. Rules: nebelmeer.js.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, locale } from '../i18n.svelte.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { KEY, ASK_KEY, daysOf, valueOf, addDay, newId, askStateOf, declineAsk, reopenAsk, askDays } from './nebelmeer.js';
  import { CloudFog, X, ChevronRight } from '@lucide/svelte';

  let { trip } = $props();

  const dataQ = liveQuery(async () => ({
    days: daysOf((await db.settings.get(KEY))?.value),
    ask: askStateOf((await db.settings.get(ASK_KEY))?.value),
  }));
  const days = $derived($dataQ?.days ?? []);
  const kept = $derived(days.filter((d) => d.tripId === trip.id));
  const dates = $derived($dataQ ? askDays(trip, days, $dataQ.ask) : []);
  let pick = $state('');
  let topM = $state('');
  const date = $derived(dates.includes(pick) ? pick : (dates[0] ?? ''));
  const dayText = (d) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '');
  const saveDays = (list) => db.settings.put({ key: KEY, value: valueOf(list) });
  const saveAsk = (state) => db.settings.put({ key: ASK_KEY, value: state });

  async function keep() {
    if (!date) return;
    const before = days;
    const id = newId();
    await saveDays(addDay(days, { date, title: trip.title ?? '', topM: topM === '' ? null : Number(topM), tripId: trip.id }, id));
    offerDone(t('The day is kept as a fog sea day.'), () => saveDays(before));
  }
  async function leave() {
    const before = $dataQ.ask;
    await saveAsk(declineAsk(before, trip.id));
    offerDone(t('No fog sea day for this trip. Under Look back › Collection wall you can still add one.'), () => saveAsk(reopenAsk($dataQ.ask, trip.id)));
  }
</script>

{#if !$dataQ}
  <!-- loading: nothing yet, so a kept day never flashes the question -->
{:else if kept.length}
  <section class="rv-sec off done" aria-labelledby="fo-h-{trip.id}" data-fog-done>
    <div class="rv-h"><div><h2 id="fo-h-{trip.id}">{t('Kept as a fog sea day')}</h2><p class="rv-sub">{kept.map((d) => dayText(d.date)).join(' · ')}</p></div></div>
    <a class="lk" href="#/debrief/sammlung">{t('Open the collection wall')}<ChevronRight size={14} aria-hidden="true" /></a>
  </section>
{:else if dates.length}
  <section class="rv-sec off" aria-labelledby="fo-h-{trip.id}" data-fog-ask>
    <div class="rv-h"><div><h2 id="fo-h-{trip.id}"><CloudFog size={20} aria-hidden="true" /> {t('Were you above the fog?')}</h2><p class="rv-sub">{t('Then the collection wall keeps the day. No goal and no streak: fog does not come on command.')}</p></div></div>
    <div class="form">
      {#if dates.length > 1}
        <label for="fo-day-{trip.id}">{t('Day')}</label>
        <select id="fo-day-{trip.id}" value={date} onchange={(e) => (pick = e.currentTarget.value)} data-fog-day-pick>
          {#each dates as d (d)}<option value={d}>{dayText(d)}</option>{/each}
        </select>
      {:else}
        <p class="one" data-fog-day-one>{dayText(date)}</p>
      {/if}
      <label for="fo-m-{trip.id}">{t('Fog top in m (if you know it)')}</label>
      <input id="fo-m-{trip.id}" type="number" inputmode="numeric" min="0" max="4000" bind:value={topM} data-fog-top />
      <div class="acts">
        <button type="button" class="btn hi" onclick={keep} data-fog-keep><CloudFog size={16} aria-hidden="true" />{t('Yes, keep the day')}</button>
        <button type="button" class="btn" onclick={leave} data-fog-leave><X size={16} aria-hidden="true" />{t('No thanks')}</button>
      </div>
    </div>
  </section>
{/if}

<style>
  .off {
    margin-top: var(--sp-4);
  }
  .form {
    display: grid;
    gap: 6px;
    max-width: 420px;
  }
  label {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  input,
  select {
    min-height: 44px;
    padding: 0 10px;
    border: 1px solid var(--card-line);
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
  }
  .one {
    margin: 0;
    font-weight: 600;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 6px;
  }
  .lk {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
</style>
