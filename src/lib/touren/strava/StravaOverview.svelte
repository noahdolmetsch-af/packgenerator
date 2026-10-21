<script>
  /**
   * Strava's «Übersicht» 1:1 (Noah 20.10.2026 «1:1 nachbauen», 21.10.2026 «beide übersichten 1:1 übernehmen
   * und bei uns integrieren»): the block on the right of Strava's activity page.
   *   - Distanz, Bewegungszeit, Höhenmeter, Relative Leistung;
   *   - on grey: Gewichtete Leistung, Gesamtarbeit, Trainingsbelastung, Intensität;
   *   - NP, IF, TSS | FTP, Gewicht;
   *   - Schnitt and Max: Geschwindigkeit and the elapsed time (h:mm:ss), «Mehr anzeigen» adds heart rate,
   *     cadence, power, calories and temperature;
   *   - the weather at the start (ridewx.js): sky, Temperatur, Luftfeuchtigkeit, Gefühlt, Windgeschwindigkeit,
   *     Windrichtung;
   *   - device and bike.
   * Used on the tour page (Analyse) and in the Rückblick («Die Tour»). Observation only.
   * a: the activity; ftp, kg: for IF, TSS and W/kg; bike: the bike's name.
   */
  import { t, locale } from '../../i18n.svelte.js';
  import { intensity } from '../../training/act/power.js';
  import { powerLoad } from '../../training.js';
  import { serOf } from '../stravaana.js';
  import { clock, dhms } from './fmt.js';
  import { skyOf, dirOf, needsRideWx, ensureRideWx } from '../ridewx.js';
  import { db } from '../../db.js';
  import { ftpLabel } from '../../strava/ftpstate.js';
  import { localDay } from '../../localday.js';
  import { Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning } from '@lucide/svelte';

  let { a, ftp = null, kg = null, bike = '' } = $props();

  const num = (v, d = 0) => (Number.isFinite(v) ? Number(v).toLocaleString(locale(), { maximumFractionDigits: d, minimumFractionDigits: d }) : '–');
  const own = $derived(a.own ?? {});
  const km = $derived(own.km ?? a.km);
  const hm = $derived(own.hm ?? a.hm);
  const moving = $derived(own.movingS ?? a.movingS);
  const np = $derived(a.wNorm ?? null);
  const ifac = $derived(intensity(np, ftp));
  const load = $derived(powerLoad(a, ftp));
  const ser = $derived(serOf(a));
  let more = $state(false);

  const ROWS = $derived(
    [
      { key: 'speed', name: t('Speed|ana'), avg: a.spdAvg ?? (km && moving ? km / (moving / 3600) : null), max: a.spdMax, d: 1, unit: 'km/h' },
      { key: 'hr', name: t('Heart rate|ana'), avg: a.hrAvg, max: a.hrMax, d: 0, unit: t('bpm') },
      { key: 'cad', name: t('Cadence|ana'), avg: a.cad, max: a.cadMax ?? (ser?.cad ? Math.max(...ser.cad.filter(Number.isFinite)) : null), d: 0, unit: '' },
      { key: 'w', name: t('Power|ana'), avg: a.wAvg, max: a.wMax, d: 0, unit: 'W' },
      { key: 'kcal', name: t('Calories'), avg: a.kcal, max: null, d: 0, unit: '' },
      { key: 'temp', name: t('Temperature|ana'), avg: a.tempAvg, max: null, d: 0, unit: '°C' },
    ].filter((r) => Number.isFinite(r.avg) || Number.isFinite(r.max)),
  );
  // as on Strava: speed and the elapsed time first, the rest behind «Mehr anzeigen»
  const first = $derived(ROWS.filter((r) => r.key === 'speed'));
  const rest = $derived(ROWS.filter((r) => r.key !== 'speed'));

  const wx = $derived(a.wxRide ?? null);
  const sky = $derived(skyOf(wx?.code ?? null));
  const ICONS = { sun: Sun, cloudsun: CloudSun, cloud: Cloud, fog: CloudFog, drizzle: CloudDrizzle, rain: CloudRain, snow: CloudSnow, storm: CloudLightning };
  const Sky = $derived(ICONS[sky?.icon] ?? Cloud);
  const dir = $derived(dirOf(wx?.dir));
  // the weather at the start, fetched once per ride (quiet offline); the stored activity updates the page
  $effect(() => {
    if (needsRideWx(a)) ensureRideWx(db, a, localDay());
  });
</script>

<div class="ov" data-strava-overview>
  <dl class="big">
    <div><dd>{num(km, 2)}<small>km</small></dd><dt>{t('Distance')}</dt></div>
    <div><dd>{clock(moving)}</dd><dt>{t('Moving time')}</dt></div>
    <div><dd>{num(hm)}<small>m</small></dd><dt>{t('Elevation gain')}</dt></div>
    {#if a.effort > 0}<div class="eff"><dd>{num(a.effort)}</dd><dt>{t('Relative Effort|ana')}</dt></div>{/if}
  </dl>
  {#if np || a.kj || load}
    <dl class="mid">
      {#if np}<div><dd>{num(np)}<small>W</small></dd><dt>{t('Weighted power')}</dt></div>{/if}
      {#if a.wStrava > 0 && a.wStrava !== np}<div data-w-strava><dd>{num(a.wStrava)}<small>W</small></dd><dt>{t('Weighted power (Strava)')}</dt></div>{/if}
      {#if a.kj}<div><dd>{num(a.kj)}<small>kJ</small></dd><dt>{t('Total work')}</dt></div>{/if}
      {#if load}<div><dd>{num(load.load)}</dd><dt>{t('Training load')}</dt></div><div><dd>{num(load.intensity * 100)}<small>%</small></dd><dt>{t('Intensity')}</dt></div>{/if}
    </dl>
  {/if}
  {#if np || ftp || kg}
    <dl class="small">
      {#if np}<div><dd>{num(np)}<small>W</small></dd><dt>NP®</dt></div>{/if}
      {#if ifac}<div><dd>{num(ifac * 100)}<small>%</small></dd><dt>IF®</dt></div>{/if}
      {#if load}<div><dd>{num(load.load)}</dd><dt>TSS®</dt></div>{/if}
      {#if ftp}<div class="ftp sep"><dd>{num(ftp)}<small>W</small></dd><dt>{t(ftpLabel())}</dt></div>{/if}
      {#if kg}<div class="kg"><dd>{num(kg, 1)}<small>kg</small></dd><dt>{t('Weight')}</dt></div>{/if}
      {#if kg && np}<div class="sep"><dd>{num(np / kg, 1)}<small>W/kg</small></dd><dt>{t('NP per kg')}</dt></div>{/if}
    </dl>
  {/if}
  <div class="amw">
    <table class="am" data-ana-avgmax>
      <thead><tr><th></th><th scope="col">{t('Average|ana')}</th><th scope="col">{t('Max')}</th></tr></thead>
      <tbody>
        {#each more ? [...first, ...rest] : first as r (r.key)}<tr data-am={r.key}><th scope="row">{r.name}</th><td>{num(r.avg, r.d)} <small>{r.unit}</small></td><td>{Number.isFinite(r.max) ? num(r.max, r.d) : ''} {#if Number.isFinite(r.max)}<small>{r.unit}</small>{/if}</td></tr>{/each}
        <tr data-am="elapsed"><th scope="row">{t('Elapsed time')}</th><td data-elapsed>{dhms(a.elapsedS)}</td><td></td></tr>
      </tbody>
    </table>
    {#if rest.length}<button type="button" class="btn sm moreb" aria-expanded={more} onclick={() => (more = !more)} data-am-more>{more ? t('Show less|strava') : t('Show more|strava')}</button>{/if}
  </div>
  {#if wx}
    <div class="wx" data-ride-wx>
      <Sky size={32} aria-hidden="true" />
      <dl>
        {#if sky}<div class="sky"><dt>{t(sky.key)}</dt><dd></dd></div>{/if}
        {#if wx.feel != null}<div><dt>{t('Feels like')}</dt><dd>{num(wx.feel)} °C</dd></div>{/if}
        {#if wx.t != null}<div><dt>{t('Temperature|ana')}</dt><dd>{num(wx.t)} °C</dd></div>{/if}
        {#if wx.wind != null}<div><dt>{t('Wind speed')}</dt><dd>{num(wx.wind, 1)} km/h</dd></div>{/if}
        {#if wx.hum != null}<div><dt>{t('Humidity')}</dt><dd>{num(wx.hum)}%</dd></div>{/if}
        {#if dir}<div><dt>{t('Wind direction')}</dt><dd>{t(dir)}</dd></div>{/if}
      </dl>
    </div>
  {/if}
  {#if a.device || bike}<p class="dev">{#if a.device}<span>{a.device}</span>{/if}{#if bike}<span>{t('Bike: {name}', { name: bike })}</span>{/if}</p>{/if}
</div>

<style>
  .ov {
    min-width: 0;
  }
  dl {
    margin: 0;
  }
  .ov > dl {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 28px;
    padding: 10px 0;
    border-bottom: 1px solid var(--line);
  }
  .ov > dl.big {
    padding-top: 0;
  }
  /* Strava: the second row on grey */
  .ov > dl.mid {
    margin: 0 calc(var(--sp-3) * -1);
    padding: 10px var(--sp-3);
    background: var(--paper-2);
  }
  .ov > dl div {
    display: flex;
    flex-direction: column-reverse;
  }
  .ov > dl .sep {
    padding-left: 20px;
    border-left: 1px solid var(--line-strong);
  }
  dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }
  dd small {
    margin-left: 2px;
    font-size: var(--fs-small);
  }
  dt {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .big dd {
    font-size: var(--fs-display);
    line-height: 1.1;
  }
  .mid dd,
  .small dd {
    font-size: var(--fs-section);
  }
  .eff dd {
    color: var(--bad);
  }
  .ftp dd,
  .kg dd {
    color: var(--accent);
  }
  .amw {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 0;
    border-bottom: 1px solid var(--line);
  }
  .am {
    flex: 1 1 280px;
    max-width: 560px;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  .am th,
  .am td {
    padding: 3px 6px;
    text-align: left;
    font-variant-numeric: tabular-nums;
  }
  .am thead th {
    font-weight: 600;
  }
  .am tbody th {
    font-weight: 400;
  }
  .am small {
    color: var(--ink-2);
  }
  .moreb {
    min-height: 44px;
  }
  .wx {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 12px;
    align-items: start;
    padding: 10px 0;
    border-bottom: 1px solid var(--line);
    font-size: var(--fs-small);
  }
  .wx dl {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4px 24px;
  }
  .wx dl div {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .wx dt {
    color: var(--ink);
    font-size: inherit;
  }
  .wx dd {
    text-align: right;
  }
  .dev {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 40px;
    margin: 0;
    padding-top: 10px;
    font-size: var(--fs-small);
  }
  @media (max-width: 760px) {
    .big dd {
      font-size: var(--fs-page);
    }
    .wx dl {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
