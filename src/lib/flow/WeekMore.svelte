<script>
  /**
   * «Mehr Daten im Wochenrückblick» (Noah 01.11.2026 «3c»): tiles for the shown week from data the app already has:
   * body values (Fitbit), time in heart rate zones, km per bike, weather and appointments per day. Every value is
   * written out; a tile with no data for the week is simply not there. Rules: lib/weekmore.js. Observation only.
   */
  import { liveQuery } from 'dexie';
  import { ArrowUp, ArrowDown, Minus } from '@lucide/svelte';
  import { db } from '../db.js';
  import { PREFS_KEY } from '../strava/client.svelte.js';
  import { zones } from '../strava/zones.svelte.js';
  import { loadDayData } from '../daydata.js';
  import { shiftDay, hmm } from '../training.js';
  import { bodyTiles, zonesWeek, bikesWeek, outdoorWeek } from '../weekmore.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';

  let { monday, upto, today } = $props();

  const q = liveQuery(async () => {
    const [acts, health, prefs, day] = await Promise.all([db.activities.toArray(), db.healthDays.toArray(), db.settings.get(PREFS_KEY), loadDayData(db)]);
    return { acts, health, gear: prefs?.value?.gear ?? [], weather: day.weather, events: day.events };
  });
  const body = $derived($q ? bodyTiles($q.health, monday, upto) : []);
  const zn = $derived($q ? zonesWeek($q.acts, monday, upto, zones.bounds) : null);
  const bikes = $derived($q ? bikesWeek($q.acts, monday, upto, $q.gear) : []);
  const out = $derived($q ? outdoorWeek($q.weather, $q.events, monday, upto) : { days: [], hasWeather: false, hasEvents: false });

  const NAME = { restingHr: 'Resting heart rate', hrvMs: 'HRV', sleep: 'Sleep', steps: 'Steps', azm: 'Active zone minutes' };
  const NOTE = { mean: 'Mean per day', sum: 'Sum of the week' };
  const val = (b, v) => (v == null ? '–' : b.unit === 'min' && b.key === 'sleep' ? `${hmm(v * 60)} h` : b.unit === 'steps' ? num(Math.round(v)) : b.unit === 'bpm' ? `${num(Math.round(v))} bpm` : b.unit === 'ms' ? `${num(Math.round(v))} ms` : `${num(Math.round(v))} min`);
  const diffText = (b) => (b.diff == null ? t('no week before') : b.diff === 0 ? '±0' : `${b.diff > 0 ? '+' : '−'}${val({ ...b }, Math.abs(b.diff)).replace('–', '0')}`);
  const wd = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short' }).replace('.', '');
  const ZN = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'];
  const pct = (s) => (zn ? Math.round((s / zn.total) * 100) : 0);
  const bike = (b) => b.name || t('Without a bike');
</script>

{#if body.length}
  <section class="card wm" data-wr="body" aria-labelledby="wr-body">
    <h2 id="wr-body">{t('Body this week')}</h2>
    <ul class="tiles">
      {#each body as b (b.key)}
        {@const Arrow = b.diff > 0 ? ArrowUp : b.diff < 0 ? ArrowDown : Minus}
        {@const max = Math.max(1, ...b.days.map((d) => d.v ?? 0))}
        <li data-body={b.key}>
          <span class="l">{t(NAME[b.key])}</span>
          <b class="v num">{val(b, b.value)}</b>
          <span class="d num"><Arrow size={14} aria-hidden="true" />{diffText(b)}</span>
          <ol class="mini" aria-label={t('Per day')}>
            {#each b.days as d (d.day)}
              <li><span class="n num">{d.v == null ? '·' : b.key === 'sleep' ? hmm(d.v * 60) : b.key === 'steps' ? `${num(Math.round(d.v / 100) / 10)}k` : num(Math.round(d.v))}</span><i style:height="{d.v ? Math.max(4, (d.v / max) * 28) : 2}px" class:none={d.v == null}></i><span class="w">{wd(d.day)}</span></li>
            {/each}
          </ol>
          <span class="s">{t(NOTE[b.how])} · {t('{n} days with a value', { n: b.n })}</span>
        </li>
      {/each}
    </ul>
    <p class="cap">{t('Fitbit, from the same days of the week before. Only what was, nothing is rated.')} <a class="tp-link" href="#/auswerten/analyse">{t('All values in Analyse')}</a></p>
  </section>
{/if}

{#if zn || bikes.length}
  <div class="pair">
    {#if zn}
      <section class="card wm" data-wr="zones" aria-labelledby="wr-zones">
        <h2 id="wr-zones">{t('Time in heart rate zones')}</h2>
        <ul class="zl">
          {#each zn.secs as s, i (i)}
            <li data-zone={i + 1}><span class="l">{ZN[i]}</span><span class="bt"><i style:width="{pct(s)}%"></i></span><b class="num">{hmm(s)} h · {pct(s)} %</b></li>
          {/each}
        </ul>
        <p class="cap">{t('From the activities of the week that have a heart rate. Your zones: Aktiv › Training.')}</p>
      </section>
    {/if}
    {#if bikes.length}
      <section class="card wm" data-wr="bikes" aria-labelledby="wr-bikes">
        <h2 id="wr-bikes">{t('Km per bike')}</h2>
        <ul class="zl">
          {#each bikes as b (b.id)}
            <li data-bike={b.id}><span class="l bn">{bike(b)}</span><b class="num">{num(b.km)} km · {t('{n} rides', { n: b.n })}</b></li>
          {/each}
        </ul>
        <p class="cap">{t('The bike Strava noted on each ride.')}</p>
      </section>
    {/if}
  </div>
{/if}

{#if out.hasWeather || out.hasEvents}
  <section class="card wm" data-wr="outdoor" aria-labelledby="wr-out">
    <h2 id="wr-out">{t('Weather and appointments')}</h2>
    <ol class="days">
      {#each out.days as d (d.day)}
        <li data-out-day={d.day} class:fut={d.day > today}>
          <span class="w">{wd(d.day)}</span>
          <b class="num">{d.tmax != null ? `${num(Math.round(d.tmax))}°` : '·'}</b>
          <span class="num s">{d.rainMm != null ? `${num(d.rainMm)} mm` : '·'}</span>
          <span class="num s">{d.sunH != null ? `${num(d.sunH)} h` : '·'}</span>
          <span class="num s">{d.events != null ? tn(d.events, '{n} appointment', '{n} appointments', { n: d.events }) : '·'}</span>
        </li>
      {/each}
    </ol>
    <p class="cap">{t('Per day, top to bottom: high, rain, hours of sun, appointments. Weather of your home place, kept on this device; today and days still to come have none yet.')}</p>
  </section>
{/if}

<style>
  .wm {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    min-width: 0;
    margin: 0;
    padding: var(--sp-4);
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .cap {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: var(--sp-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tiles > li {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    padding: var(--sp-3);
    border-radius: var(--radius);
    background: var(--paper-2);
  }
  .l,
  .s {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .v {
    font: 600 var(--fs-section) / 1.2 var(--font-body);
  }
  .d {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .mini {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    align-items: end;
    gap: 3px;
    margin: 6px 0 2px;
    padding: 0;
    list-style: none;
  }
  .mini li {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 2px;
    min-width: 0;
  }
  .mini .n {
    font-size: var(--fs-small);
    color: var(--ink-2);
    white-space: nowrap;
  }
  .mini .w {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .mini i {
    display: block;
    width: 100%;
    border-radius: 3px;
    background: var(--hi);
  }
  .mini i.none {
    background: var(--line);
  }
  .pair {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--sp-4);
  }
  .zl {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .zl li {
    display: grid;
    grid-template-columns: 56px minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    font-size: var(--fs-small);
  }
  .zl li:has(.bn) {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .bt {
    display: block;
    height: 10px;
    border-radius: 99px;
    background: var(--paper-2);
  }
  .bt i {
    display: block;
    height: 100%;
    border-radius: 99px;
    background: var(--hi);
  }
  .days {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .days li {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-width: 0;
    padding: 6px 2px;
    border-radius: var(--radius);
    background: var(--paper-2);
    text-align: center;
  }
  @media (max-width: 699px) {
    .days {
      grid-template-columns: minmax(0, 1fr);
    }
    .days li {
      flex-direction: row;
      justify-content: space-between;
      gap: 8px;
      padding: 8px 12px;
      text-align: left;
    }
    .days li > * {
      flex: 1;
    }
  }
  .days li.fut {
    opacity: 0.6;
  }
  .days .s {
    font-size: var(--fs-small);
  }
  .tp-link {
    min-height: 44px;
  }
</style>
