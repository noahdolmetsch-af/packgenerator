<script>
  /**
   * Einzelidee Heute 2 (UC-009-I3 «Überraschungsrunde mit Grenzen»): from «Neu» › «Überraschungsrunde».
   * You pick how much adventure and how much time; the app suggests a round from home on the side you rode
   * least (ueberraschung.js) and asks the free bike router once per tap. «Ziel erst unterwegs» keeps the
   * direction hidden here. «Als Tour planen» makes a Quick start trip with this round and these hours,
   * «GPX» gives the round to the Garmin, «Andere Runde» tries another side. Everything is a suggestion.
   */
  import { liveQuery } from 'dexie';
  import { Dices, Route, Download, RefreshCw, X, EyeOff } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, num } from '../i18n.svelte.js';
  import { backClose } from '../ui/backclose.js';
  import { sortBikes } from '../bikes.js';
  import { quickStart } from '../quickstart.js';
  import { freeTitle } from '../dayride.js';
  import { routeStats } from '../route.js';
  import { gpxString } from '../gpxout.js';
  import { switchTrip } from '../nav.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { homeForecast } from '../home-weather.js';
  import { LEVELS, LEVEL_STD, HOURS, HOURS_STD, SECTORS, knownSectors, surprisePlan, planSurprise, gpxOfRound } from '../ueberraschung.js';
  import '../bikes/velo-dlg.css';

  let { onclose } = $props();
  let dialog = $state();
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });

  const homeQ = liveQuery(() => db.settings.get('homePlace'));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const home = $derived($homeQ?.value && Number.isFinite(Number($homeQ.value.lat)) ? $homeQ.value : null);

  let level = $state(LEVEL_STD);
  let hours = $state(HOURS_STD);
  let hide = $state(false);
  let busy = $state(false);
  let err = $state('');
  let round = $state(null);
  let tried = $state([]);

  const hrs = (h) => num(h);
  const timeOf = (min) => (min >= 60 ? t('{h} h {m} min', { h: Math.floor(min / 60), m: String(min % 60).padStart(2, '0') }) : t('{m} min', { m: min }));

  async function suggest(again = false) {
    if (!home || busy) return;
    busy = true;
    err = '';
    const skip = again && round ? [...tried, round.sector] : [];
    try {
      const plan = surprisePlan(home, { level, hours, known: knownSectors($tripsQ ?? [], home), skip });
      round = await planSurprise(home, plan);
      tried = skip;
    } catch (e) {
      err =
        e?.message === 'busy'
          ? t('The bike router is busy right now. Try again in a minute.')
          : e?.message === 'noroute'
            ? t('The bike router found no round there. Tap «Another round».')
            : navigator.onLine === false
              ? t('Offline: a new round needs the internet.')
              : t('The bike router did not answer. Try again.');
    } finally {
      busy = false;
    }
  }

  function gpx() {
    const text = gpxString({ name: t('Surprise round'), line: round.line });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/gpx+xml' }));
    a.download = 'ueberraschungsrunde.gpx';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  async function plan() {
    if (!round || busy) return;
    busy = true;
    try {
      const trips = ($tripsQ ?? []).map((x) => ({ ...x }));
      const bikes = sortBikes((await db.bikes.toArray()).map((b) => ({ ...b })));
      const items = await db.items.toArray();
      const forecast = navigator.onLine ? await homeForecast(db).catch(() => null) : null;
      const trip = await quickStart(db, { trips, bikes, items, forecast });
      if (!trip) {
        err = t('First add a bike: Bikes › «Add bike».');
        return;
      }
      const gpxData = gpxOfRound(round, t('Surprise round'));
      const route = gpxData ? { ...routeStats(gpxData, 'ueberraschungsrunde.gpx'), wpts: [] } : null;
      await db.trips.update(trip.id, { title: freeTitle(t('Surprise round'), trips), hours: round.hours, ...(route ? { route } : {}), surprise: { hide, level: round.level } });
      dialog?.close();
      switchTrip(trip.id, '#/pack');
      offerDone(t('Surprise round planned: {km} km. Undo deletes the trip.', { km: num(Math.round(round.km)) }), () => db.trips.delete(trip.id));
    } finally {
      busy = false;
    }
  }
</script>

<dialog class="sheet vdlg" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="sr-h" data-surprise>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="sr-h"><Dices size={20} aria-hidden="true" /> {t('Surprise round')}</h2>
      <p class="vd-sub">{t('You choose adventure and time; the app suggests a round from home on the side you know least.')}</p>
    </div>
    <button type="button" class="btn icon" aria-label={t('Close')} onclick={() => dialog?.close()}><X size={18} aria-hidden="true" /></button>
  </div>

  {#if $homeQ !== undefined && !home}
    <p class="sr-note" role="status">{t('The round starts at home. Set your home place first: Weather › «Set your home place».')}</p>
    <a class="btn" href="#/wetter" onclick={() => dialog?.close()}>{t('Open the weather page')}</a>
  {:else if home}
    <fieldset class="sr-set">
      <legend>{t('How much adventure?')}</legend>
      <div class="sr-row">
        {#each LEVELS as l (l.key)}
          <button type="button" class="chip" aria-pressed={level === l.key} onclick={() => (level = l.key)} data-sr-level={l.key}><b>{t(l.name)}</b><small>{t(l.sub)}</small></button>
        {/each}
      </div>
    </fieldset>
    <fieldset class="sr-set">
      <legend>{t('How much time?')}</legend>
      <div class="sr-row">
        {#each HOURS as h (h)}
          <button type="button" class="chip" aria-pressed={hours === h} onclick={() => (hours = h)} data-sr-hours={h}>{t('{h} h|duration', { h: hrs(h) })}</button>
        {/each}
      </div>
    </fieldset>
    <label class="sr-hide"><input type="checkbox" bind:checked={hide} data-sr-hide /> <span>{t('Show the direction only on the way')}</span></label>

    {#if !round}
      <button type="button" class="btn hi" disabled={busy} onclick={() => suggest()} data-sr-go><Dices size={18} aria-hidden="true" />{busy ? t('Looking for a round…') : t('Suggest a round')}</button>
      <p class="sr-note">{t('Asks the free bike router once (BRouter). Nothing else leaves the device.')}</p>
    {:else}
      <div class="sr-out" role="status" data-sr-result>
        <b>{t('{km} km · {up} m up · about {time}', { km: num(Math.round(round.km)), up: num(round.gainM ?? 0), time: timeOf(round.min) })}</b>
        {#if hide}<span><EyeOff size={14} aria-hidden="true" /> {t('Direction: a surprise. The map shows the way once you ride.')}</span>
        {:else}<span>{t('Towards the {dir}, where you rarely rode.', { dir: t(SECTORS[round.sector]) })}</span>{/if}
      </div>
      <div class="sr-row">
        <button type="button" class="btn hi" disabled={busy} onclick={plan} data-sr-plan><Route size={18} aria-hidden="true" />{t('Plan as a trip')}</button>
        <button type="button" class="btn" disabled={busy} onclick={gpx} data-sr-gpx><Download size={18} aria-hidden="true" />{t('GPX for the Garmin')}</button>
        <button type="button" class="btn" disabled={busy} onclick={() => suggest(true)} data-sr-again><RefreshCw size={18} aria-hidden="true" />{t('Another round')}</button>
      </div>
    {/if}
    {#if err}<p class="sr-note err" role="alert">{err}</p>{/if}
  {/if}
</dialog>

<style>
  .sr-set {
    border: 0;
    margin: 0 0 12px;
    padding: 0;
  }
  .sr-set legend {
    font-weight: 600;
    margin-bottom: 6px;
  }
  .sr-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chip {
    display: grid;
    gap: 2px;
    text-align: left;
    min-height: 44px;
    padding: 8px 12px;
    border: 1px solid var(--line-strong);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .chip small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .chip[aria-pressed='true'] {
    border-color: var(--hi);
    box-shadow: inset 0 0 0 1px var(--hi);
  }
  .sr-hide {
    display: flex;
    gap: 8px;
    align-items: center;
    min-height: 44px;
    margin: 0 0 12px;
  }
  .sr-out {
    display: grid;
    gap: 4px;
    padding: 10px 12px;
    margin: 0 0 12px;
    border-radius: var(--radius-card);
    background: var(--paper-2);
  }
  .sr-note {
    margin: 8px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sr-note.err {
    color: var(--warn, var(--ink));
  }
  h2 :global(svg) {
    vertical-align: -3px;
  }
</style>
