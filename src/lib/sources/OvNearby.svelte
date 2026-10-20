<script>
  /**
   * «Neue Quellen» › «ÖV in der Nähe» (Noah 20.10.2026 «Haltestellen und nächste Abfahrten»): for the bottom
   * sheet of the live map. «Haltestellen suchen» asks for the stops near `at` ({ lat, lon }, the position
   * on the map); they show nearest first with their distance. A tap on a stop shows its next departures:
   * time, line, destination, platform and delay. «Neu laden» asks again. Live data from the Swiss timetable
   * (transport.opendata.ch, sources/ov.js); nothing is kept. Only on a tap, never by itself.
   */
  import { TrainFront, Bus, TramFront, Ship, CableCar, MapPin, ChevronLeft, RefreshCw } from '@lucide/svelte';
  import { loadStops, loadDepartures, distText, minutesUntil } from './ov.js';
  import { t, tn, num } from '../i18n.svelte.js';

  let { at = null } = $props();

  const ICON = { train: TrainFront, bus: Bus, tram: TramFront, ship: Ship, cableway: CableCar, stop: MapPin };
  let stops = $state(null);
  let stop = $state(null);
  let board = $state(null);
  let busy = $state(false);
  let msg = $state('');
  let now = $state(Date.now());

  const okNum = (v) => v != null && v !== '' && Number.isFinite(Number(v));
  const hasAt = $derived(okNum(at?.lat) && okNum(at?.lon));
  const fail = () => (typeof navigator !== 'undefined' && !navigator.onLine ? t('No connection. The timetable needs the internet.') : t('The timetable is not answering right now. Try again later.'));

  async function findStops() {
    if (!hasAt || busy) return;
    busy = true;
    msg = '';
    try {
      stops = (await loadStops(at)).stops;
      if (!stops.length) msg = t('No stops found nearby.');
    } catch {
      msg = fail();
    } finally {
      busy = false;
    }
  }
  async function openStop(s) {
    stop = s;
    board = null;
    await loadBoard();
  }
  async function loadBoard() {
    if (!stop || busy) return;
    busy = true;
    msg = '';
    try {
      board = (await loadDepartures(stop.id)).departures;
      now = Date.now();
      if (!board.length) msg = t('No departures in the next hours.');
    } catch {
      msg = fail();
    } finally {
      busy = false;
    }
  }
  const back = () => ((stop = null), (board = null), (msg = ''));
</script>

<section class="ov" aria-labelledby="ov-h" data-ov-nearby>
  <h3 id="ov-h"><TrainFront size={18} aria-hidden="true" />{t('Public transport nearby')}</h3>
  {#if !stop}
    {#if !stops}
      <p class="hint">{t('Stops near the map position and their next departures, from the Swiss timetable.')}</p>
      <button type="button" class="btn sm" disabled={!hasAt || busy} onclick={findStops}>{busy ? t('Loading…') : t('Find stops')}</button>
      {#if !hasAt}<p class="hint">{t('Waiting for your position.')}</p>{/if}
    {:else}
      <ul class="ov-list">
        {#each stops as s (s.id)}
          {@const Icon = ICON[s.kind] ?? MapPin}
          <li><button type="button" class="ov-stop" onclick={() => openStop(s)} data-ov-stop={s.id}><Icon size={18} aria-hidden="true" /><span class="ov-name">{s.name}</span><span class="ov-d num">{distText(s.distM, num)}</span></button></li>
        {/each}
      </ul>
      <button type="button" class="lk" disabled={busy} onclick={findStops}><RefreshCw size={16} aria-hidden="true" />{t('Load again')}</button>
    {/if}
  {:else}
    <div class="ov-hd">
      <button type="button" class="lk" onclick={back}><ChevronLeft size={16} aria-hidden="true" />{t('All stops')}</button>
      <button type="button" class="lk" disabled={busy} onclick={loadBoard}><RefreshCw size={16} aria-hidden="true" />{t('Load again')}</button>
    </div>
    <p class="ov-title"><b>{stop.name}</b> <span class="num">{distText(stop.distM, num)}</span></p>
    {#if busy && !board}<p class="hint">{t('Loading…')}</p>{/if}
    {#if board?.length}
      <ul class="ov-board" aria-label={t('Next departures from {stop}', { stop: stop.name })}>
        {#each board as d (`${d.at}${d.line}${d.to}`)}
          <li data-ov-dep>
            <span class="ov-time num">{d.time}{#if d.delayMin}<small class="ov-late"> +{d.delayMin}′</small>{/if}</span>
            <span class="ov-line">{d.line}</span>
            <span class="ov-to">{d.to}</span>
            <span class="ov-pl num">{#if d.platform}{d.platformChanged ? t('Pl. {p} (changed)', { p: d.platform }) : t('Pl. {p}', { p: d.platform })}{/if}</span>
            <span class="ov-in num">{tn(minutesUntil(d, now), 'in {n} min', 'in {n} min')}</span>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
  {#if msg}<p class="hint" role="status">{msg}</p>{/if}
  <p class="src">{t('Timetable: transport.opendata.ch')}</p>
</section>

<style>
  .ov {
    display: grid;
    gap: var(--sp-2);
  }
  h3 {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    margin: 0;
    font-size: var(--fs-sub);
  }
  .hint,
  .src,
  .ov-title {
    margin: 0;
  }
  .hint {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .src {
    font-size: var(--fs-tiny);
    color: var(--ink-3);
  }
  .ov-list,
  .ov-board {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
  }
  .ov-list li + li,
  .ov-board li + li {
    border-top: 1px solid var(--line);
  }
  .ov-stop {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: var(--sp-2);
    align-items: center;
    width: 100%;
    min-height: 44px;
    padding: var(--sp-1) 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .ov-d,
  .ov-pl,
  .ov-in {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ov-hd {
    display: flex;
    justify-content: space-between;
    gap: var(--sp-2);
  }
  .ov-board li {
    display: grid;
    grid-template-columns: 4.5em 3.5em 1fr auto;
    grid-template-areas: 'time line to in' '. . pl pl';
    gap: 0 var(--sp-2);
    padding: var(--sp-2) 0;
    font-size: var(--fs-small);
  }
  .ov-time {
    grid-area: time;
    font-weight: 600;
  }
  .ov-late {
    color: var(--bad);
    font-size: var(--fs-tiny);
  }
  .ov-line {
    grid-area: line;
    font-weight: 600;
  }
  .ov-to {
    grid-area: to;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .ov-pl {
    grid-area: pl;
  }
  .ov-in {
    grid-area: in;
  }
  .lk {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-1);
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    text-decoration: underline;
    cursor: pointer;
    justify-self: start;
  }
  .lk:disabled {
    color: var(--ink-3);
    cursor: default;
  }
</style>
