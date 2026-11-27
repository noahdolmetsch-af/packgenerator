<script>
  import { readLite } from '../actlite.js';
  /**
   * «Neue Kilometer» (Träume und Neuland N4, Noah 27.10.2026 «1-5 a»), on Touren › Rückblick › Neuland:
   * per year how many km ran on roads you rode for the first time (a bar for the share), and the last rides
   * that brought new km. The lines are the heatmap's (Strava lines, GPX, own recordings), bike rides only.
   * The rules are in neuekm.js (pure, tests/neuekm.test.js). Nothing to set; nothing leaves the device.
   * The map (Noah 27.11.2026 «Neue Kilometer auf der Karte»): the new stretches of the chosen year (or all years) in the accent colour, zoomable.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { heatLines } from '../heat/heat.js';
  import { newKmOf, newKmSummary, newSegments, NEAR_M } from './neuekm.js';
  import NeulandMap from './NeulandMap.svelte';
  import Seg from '../ui/Seg.svelte';
  import { dayLong } from '../review/fmt.js';
  import { t, num } from '../i18n.svelte.js';
  import { Flame, Info } from '@lucide/svelte';

  let { today, bg = {} } = $props();
  const dataQ = liveQuery(async () => {
    const [activities, rides, tracks] = await Promise.all([
      db.activities ? readLite(db, (T) => T.toArray()) : [],
      db.rides.toArray(),
      db.tracks ? db.tracks.where('kind').equals('rec').toArray() : [],
    ]);
    return { activities, rides, tracks };
  });
  const lines = $derived($dataQ ? heatLines({ ...$dataQ, today }).filter((l) => l.kind === 'bike') : null);
  const byId = $derived(lines ? newKmOf(lines, { segments: true }) : null);
  const sum = $derived(lines && byId ? newKmSummary(lines, byId) : null);
  // the map: «all» or one year (the newest at first)
  let pickYear = $state(null);
  const year = $derived(sum?.years.some((y) => y.year === pickYear) || pickYear === 'all' ? pickYear : (sum?.years[0]?.year ?? 'all'));
  const segs = $derived(lines && byId ? newSegments(lines, byId, year) : []);
  const mapKm = $derived(year === 'all' ? sum?.years.reduce((a, y) => a + y.newKm, 0) : sum?.years.find((y) => y.year === year)?.newKm);
  // the map: Switzerland when most of the new stretches lie in it; otherwise it centres on where they are
  // (the middle 90 % of the points, so a far trip or a GPS jump does not push the map out to the whole world)
  const KR = 1.15; // the map's width to height, as NeulandMap draws it
  const inCH = (p) => p[0] > 45.78 && p[0] < 47.84 && p[1] > 5.9 && p[1] < 10.55;
  const fit = $derived.by(() => {
    const la = [];
    const lo = [];
    let inside = 0;
    for (const l of segs) for (const p of l) (la.push(p[0]), lo.push(p[1]), inCH(p) && inside++);
    if (!la.length) return null;
    if (inside >= la.length * 0.8) return { view: 'ch', bg: { cantons: bg.cantons, lakes: bg.lakes } };
    la.sort((x, y) => x - y);
    lo.sort((x, y) => x - y);
    const q = (v, f) => v[Math.min(v.length - 1, Math.max(0, Math.round((v.length - 1) * f)))];
    const [a0, a1, o0, o1] = [q(la, 0.05), q(la, 0.95), q(lo, 0.05), q(lo, 0.95)];
    const c = { lat: (a0 + a1) / 2, lon: (o0 + o1) / 2 };
    const kc = Math.cos((c.lat * Math.PI) / 180);
    const span = Math.max(((a1 - a0) / 2) * 1.12, (((o1 - o0) / 2) * 1.12 * kc) / KR, 0.06);
    return { view: 'near', center: c, span, bg: { countries: bg.countries, cantons: bg.cantons, lakes: bg.lakes } };
  });
  const pct = (s) => `${Math.round(s * 100)} %`;
</script>

{#if sum}
  <section class="rv-sec nk" aria-labelledby="nk-h" data-new-km>
    <div class="rv-h">
      <div>
        <h2 id="nk-h">{t('New kilometres')}</h2>
        <p class="rv-sub">{t('How many km ran on roads you rode for the first time.')}</p>
      </div>
      <a class="btn sm" href="#/heatmap"><Flame size={16} aria-hidden="true" />{t('Heatmap')}</a>
    </div>
    <div class="card nk-body">
      {#if !sum.years.length}
        <p class="nk-help">{t('No ride with a line yet. Connect Strava or upload a ride, then the app counts your new km.')}</p>
      {:else}
        <ul class="nk-years">
          {#each sum.years as y (y.year)}
            <li data-nk-year={y.year}>
              <div class="nk-yl"><b class="num">{y.year}</b><span><b class="num">{t('{km} km new', { km: num(y.newKm) })}</b> · {t('of {km} km', { km: num(y.km) })} · <span class="num">{pct(y.share)}</span></span></div>
              <div class="nk-bar" aria-hidden="true"><span style:width={`${Math.round(Math.min(1, y.share) * 100)}%`}></span></div>
            </li>
          {/each}
        </ul>
        {#if segs.length}
          <h3 class="nk-lh">{t('Where it was new')}</h3>
          <div class="nk-chips" data-nk-chips>
            <Seg chips full={false} label={t('Year')} value={year} onchange={(k) => (pickYear = k)} options={[...sum.years.map((y) => ({ key: y.year, name: y.year })), ...(sum.years.length > 1 ? [{ key: 'all', name: t('All years') }] : [])]} />
          </div>
          <div class="nk-map" data-nk-map data-nk-segs={segs.length}>
            <NeulandMap view={fit?.view} center={fit?.center} span={fit?.span} ratio={KR} bg={fit?.bg} newLines={segs} title={t('Map: new kilometres')} />
          </div>
          <p class="nk-cap num">{t('{km} km new', { km: num(Math.round(mapKm ?? 0)) })} · {year === 'all' ? t('All years') : year}</p>
        {/if}
        {#if sum.rides.length}
          <h3 class="nk-lh">{t('Latest rides with new km')}</h3>
          <ul class="nk-rides">
            {#each sum.rides as r (r.id)}
              <li data-nk-ride><span class="nk-rn">{r.name || t('Ride')}</span><small>{dayLong(r.day)}</small><b class="num">{t('{km} of {all} km new', { km: num(Math.round(r.newKm)), all: num(Math.round(r.km)) })}</b></li>
            {/each}
          </ul>
        {/if}
        <p class="nk-note"><Info size={16} aria-hidden="true" /><span>{t('A stretch counts as new when none of your earlier rides passed within {m} m. Rides from Strava, GPX files and your own recordings count.', { m: NEAR_M })}</span></p>
      {/if}
    </div>
  </section>
{/if}

<style>
  .nk {
    margin-top: var(--sp-5, 24px);
  }
  .nk-body {
    display: grid;
    gap: var(--sp-3);
  }
  .nk-years,
  .nk-rides {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  .nk-yl {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 12px;
    align-items: baseline;
  }
  .nk-bar {
    height: 8px;
    margin-top: 4px;
    border-radius: 4px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .nk-bar span {
    display: block;
    height: 100%;
    border-radius: 4px;
    background: var(--accent);
  }
  .nk-cap {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .nk-lh {
    margin: 0;
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    color: var(--ink-2);
  }
  .nk-rides li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0 12px;
    align-items: baseline;
  }
  .nk-rn {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .nk-rides small {
    grid-row: 2;
    color: var(--ink-3);
  }
  .nk-rides b {
    grid-row: 1 / span 2;
    grid-column: 2;
    align-self: center;
    font-weight: 600;
  }
  .nk-help,
  .nk-note {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .nk-note {
    display: flex;
    gap: 6px;
    align-items: flex-start;
  }
  .nk-note :global(svg) {
    flex: none;
    margin-top: 2px;
  }
</style>
