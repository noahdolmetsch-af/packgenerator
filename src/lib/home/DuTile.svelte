<script>
  /**
   * «Heute neu» A «Ein Blick» (Noah 20.10.2026 «1A … 3a»): «Du heute», one calm card in place of «Im Flow +
   * Balance», «Körper», «Aktiv» and «Deine Werte». The balance ring of the last 7 days (balance.js) with its
   * mean and the weakest area, and beside it sleep, resting pulse, km of 7 days and the weather at home
   * (wohl.js widgetValues). Observation only, no score. The details stay one tap away under Aktiv.
   */
  import { liveQuery } from 'dexie';
  import { Heart, ChevronRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { balanceQuery } from '../flow/data.svelte.js';
  import { balance, ringPaths, CAT } from '../balance.js';
  import { homeForecast } from '../home-weather.js';
  import { lastDays } from '../flow.js';
  import { widgetValues } from '../wohl.js';
  import { countedRidesSince } from '../kmbook.js';
  import TileHead from './TileHead.svelte';
  import { t, locale } from '../i18n.svelte.js';

  let { today } = $props();
  const bq = $derived(balanceQuery(today));
  const b = $derived($bq ? balance({ ...$bq, today }) : null);
  const R = 88;
  const paths = $derived(b && b.mean != null ? ringPaths(b.cats, R, { inner: 0.3 }) : []);
  const COLOR = {
    fun: 'var(--l2)',
    rest: 'var(--l3)',
    sport: 'color-mix(in srgb, var(--l2) 50%, var(--bad))',
    mind: 'var(--l4)',
    friends: 'color-mix(in srgb, var(--bad) 55%, var(--paper))',
    nature: 'var(--l1)',
    vision: 'color-mix(in srgb, var(--l2) 55%, var(--l1))',
    goals: 'color-mix(in srgb, var(--l3) 55%, var(--l1))',
    done: 'color-mix(in srgb, var(--l2) 40%, var(--ink-3))',
  };

  const from = $derived(lastDays(today, 40)[0]);
  const vq = $derived(
    liveQuery(async () => {
      // UI-Test T5: the km of today and 7 days from the same rides as «Diese Woche» (Strava, files, recordings)
      const [rides, health] = await Promise.all([countedRidesSince(db, from), db.healthDays ? db.healthDays.where('date').aboveOrEqual(from).toArray() : []]);
      return { rides, health };
    }),
  );
  let forecast = $state(null);
  $effect(() => {
    homeForecast(db)
      .then((f) => (forecast = f))
      .catch(() => (forecast = null));
  });
  const v = $derived($vq ? widgetValues({ ...$vq, forecast, today }) : null);
  const n1 = (x) => Number(x).toLocaleString(locale(), { maximumFractionDigits: 1 });
  // the values with something to say first; at most four
  const vals = $derived.by(() => {
    if (!v) return [];
    const out = [];
    if (v.sleepH != null) out.push({ key: 'sleep', val: `${n1(v.sleepH)} h`, label: t('Sleep|du') });
    if (v.restingHr != null) out.push({ key: 'pulse', val: String(v.restingHr), label: t('Resting pulse|du') });
    out.push({ key: 'km', val: `${n1(v.kmWeek)} km`, label: t('Bike, 7 days|du') });
    if (v.weather) out.push({ key: 'weather', val: `${v.weather.min}–${v.weather.max}°`, label: t('Weather at home|du') });
    return out.slice(0, 4);
  });
  const said = $derived(b ? b.cats.map((c) => `${t(CAT[c.key].label)} ${c.value ?? '–'}`).join(', ') : '');
</script>

<section class="du surf" aria-labelledby="du-h" data-section="du">
  <div class="hd">
    <TileHead icon={Heart} id="du-h" title={t('You today')} />
    <a class="go" href="#/flow">{t('Active|place')}<ChevronRight size={16} aria-hidden="true" /></a>
  </div>
  <div class="row">
    {#if paths.length}
      <div class="rw">
        <svg viewBox="0 0 {R} {R}" width={R} height={R} role="img" aria-label={t('Balance of the last 7 days: {list}', { list: said })}>
          {#each paths as p (p.key)}
            <path d={p.bg} style:fill="color-mix(in srgb, {COLOR[p.key]} 16%, var(--paper))" />
            {#if p.fg}<path d={p.fg} style:fill={COLOR[p.key]} />{/if}
          {/each}
          <text x={R / 2} y={R / 2 + 6} class="mn num" text-anchor="middle">{b.mean}</text>
        </svg>
        <small>{t('Balance, 7 days')}</small>
      </div>
    {/if}
    <dl class="vals">
      {#each vals as x (x.key)}
        <div data-du={x.key}><dt>{x.label}</dt><dd class="num">{x.val}</dd></div>
      {/each}
    </dl>
  </div>
  {#if b?.least && paths.length}<p class="least" data-least={b.least}>{t('Least lately: {area}', { area: t(CAT[b.least].label) })}</p>
  {:else if !paths.length}<p class="least">{t('Your balance fills by itself as soon as you answer «Wi gaht\'s?» or tick something in Aktiv.')}</p>{/if}
  <p class="note">{t('Only to look at, no score.')}</p>
</section>

<style>
  .du {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    padding: 14px 18px;
    box-sizing: border-box;
  }
  .hd {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .hd :global(.th) {
    flex: 1;
  }
  .go {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--hi);
    font-weight: 600;
    font-size: var(--fs-small);
    text-decoration: none;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 18px;
    min-width: 0;
  }
  .rw {
    display: grid;
    justify-items: center;
    gap: 2px;
    flex: none;
  }
  .rw small,
  .note,
  .least {
    color: var(--ink-3);
    font-size: var(--fs-small);
    margin: 0;
  }
  .mn {
    fill: var(--ink);
    font: 700 var(--fs-sub) / 1 var(--font-body);
  }
  .vals {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 16px;
    margin: 0;
    min-width: 0;
  }
  .vals div {
    display: flex;
    flex-direction: column-reverse;
    min-width: 0;
  }
  .vals dt {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .vals dd {
    margin: 0;
    font-weight: 700;
    font-size: var(--fs-sub);
  }
  .note {
    margin-top: auto;
  }
</style>
