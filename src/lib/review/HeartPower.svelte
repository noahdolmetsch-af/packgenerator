<script>
  /**
   * SN2+ SN2e «Puls und Leistung» (mockup approved 13.10.2026): the time in the heart rate zones as one bar
   * with time and share per zone, Ø and highest heart rate, and quietly where it comes from.
   * SN2x «SN2 extra» (mockups SN2j-a Mitte and SN2k unten, answer 2 «a und b», answer 3a): the whole card.
   * - «Tempo und Pausen»: Ø and max. speed, pauses (count and time), cadence and temperature only with a
   *   sensor (a quiet line names the missing cadence sensor), calories.
   * - «Leistung» with a power meter: NP, Ø and max. power, the time in the power zones Z1–Z7 (Coggan, a calm
   *   ramp), the power curve, the estimated FTP; without one Strava's estimate marked «geschätzt» and one
   *   quiet line for what is left out. W/kg with the weight under Ich › Meine Daten, else that quiet line.
   * - «Relative Effort und Belastung»: Strava's Relative Effort and the load from NP ÷ FTP, each with small
   *   bars of the last trips. «Strava-Bestzeiten» folded: only your own times.
   * Nothing known: one quiet line. Observation only: no colour and no word for good or bad.
   *
   * values: werte.js tripValues() or null; zones: 'own' | 'standard' | null; bike: the bike's name;
   * tempo: { kmh, maxKmh, pauses: { n, min } | null, cad, temp: { avg, min, max } | null, kcal, strava } | null;
   * power: power.js tripPower() or null; effort, load: numbers or null; efforts, loads: [{ id, v }] (MiniBars);
   * mark: this trip's id; best: [{ name, km, grade, s, rank }] | null;
   * strava: whether Strava activities are there at all; sub: the line under the title.
   */
  import { t, tn, num } from '../i18n.svelte.js';
  import { hm } from '../gpx.js';
  import { n1 } from './fmt.js';
  import { RefreshCw, Info, Activity, Smartphone, Trophy, ChevronDown } from '@lucide/svelte';
  import MiniBars from './MiniBars.svelte';
  import { CURVE_S } from './power.js';
  import './zones.css';
  import Help from '../ui/Help.svelte'; // FE14
  import { FIELD_HELP } from '../daumen.js';

  let { values = null, zones = null, bike = '', tempo = null, power = null, effort = null, load = null, efforts = [], loads = [], mark = null, best = null, strava = false, sub = '' } = $props();
  const p = $derived(power ?? values?.power ?? null);
  const source = $derived(
    [
      t('Strava'),
      p ? (p.measured ? (bike ? t('power meter on {bike}', { bike }) : t('power meter')) : t('without power meter')) : '',
      tempo?.cad != null || tempo?.temp ? t('bike computer with sensors') : '',
      values?.zones ? (zones === 'own' ? t('your zones') : t('standard zones')) : '',
    ].filter(Boolean),
  );
  const any = $derived(!!values || !!p || !!(tempo && (tempo.kmh != null || tempo.pauses)) || effort != null);
  const CURVE_L = { 5: '5 s', 60: '1 min', 300: '5 min', 1200: '20 min', 3600: '60 min' };
  // the power curve as a small line: x by the order of the durations, y from 0 to the highest
  const curve = $derived.by(() => {
    const c = p?.measured ? p.curve : null;
    if (!c) return null;
    const top = Math.max(...c.map((x) => x.w)) || 1;
    const X = (s) => 20 + (CURVE_S.indexOf(s) / (CURVE_S.length - 1)) * 300;
    const Y = (w) => 92 - (w / top) * 74;
    return { pts: c.map((x) => ({ ...x, x: X(x.s), y: Y(x.w) })), top };
  });
  const secs = (s) => {
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.round(s - m * 60)).padStart(2, '0')}`;
  };
  const RANK = { 1: 'Best time', 2: '2nd time', 3: '3rd time' };
</script>

{#if any}
  <section class="rv-sec hp" aria-labelledby="hp-h" data-heart-power>
    <div class="rv-h"><div><h2 id="hp-h">{t('Heart rate and power')}</h2><p class="rv-sub">{sub || t('from Strava · to look at, without rating')}</p></div></div>
    <div class="rv-box pad">
      {#if tempo && (tempo.kmh != null || tempo.pauses || tempo.maxKmh != null)}
        <div class="part" data-tempo>
          <h3>{t('Speed and pauses')}</h3>
          <dl class="rv-tiles hpt">
            {#if tempo.kmh != null}<div class="rv-tile"><dd><b class="num">{n1(tempo.kmh)}</b> <span class="u">km/h</span></dd><dt><small>{t('Ø speed')}</small></dt></div>{/if}
            {#if tempo.maxKmh != null}<div class="rv-tile"><dd><b class="num">{n1(tempo.maxKmh)}</b> <span class="u">km/h</span></dd><dt><small>{t('Max. speed')}</small></dt></div>{/if}
            {#if tempo.pauses}<div class="rv-tile"><dd><b class="num">{num(tempo.pauses.n)} · {num(tempo.pauses.min)}</b> <span class="u">min</span></dd><dt><small>{t('Pauses')}</small></dt></div>{/if}
            {#if tempo.cad != null}<div class="rv-tile"><dd><b class="num">{num(tempo.cad)}</b> <span class="u">{t('rpm')}</span></dd><dt><small>{t('Ø cadence')}</small></dt></div>{/if}
            {#if tempo.temp}<div class="rv-tile"><dd><b class="num">{num(tempo.temp.avg)}</b> <span class="u">°</span></dd><dt><small>{t('Ø temperature')}{#if tempo.temp.min != null && tempo.temp.max != null}<span class="est">{tempo.temp.min}–{tempo.temp.max}°</span>{/if}</small></dt></div>{/if}
            {#if tempo.kcal != null}<div class="rv-tile"><dd><b class="num">{num(tempo.kcal)}</b> <span class="u">kcal</span></dd><dt><small>{t('Calories')}</small></dt></div>{/if}
          </dl>
          {#if tempo.strava && tempo.cad == null}<p class="rv-note pm" data-quiet="cadence"><Info size={16} aria-hidden="true" /><span>{bike ? t('Cadence missing: {bike} has no cadence sensor.', { bike }) : t('Cadence missing: no cadence sensor.')}</span></p>{/if}
        </div>
      {/if}

      {#if values?.zones || values?.hrAvg != null}
        <div class="part" data-hr>
          {#if values.zones}
            <div class="zh"><h3>{t('Time in heart rate zones')}</h3><span class="num">{t('{h} h with heart rate', { h: hm(values.zoneS / 3600) })}</span></div>
            <div class="zbar" aria-hidden="true">{#each values.zones as z (z.z)}{#if z.s}<i class="zc-{z.z}" style:flex-grow={z.s}></i>{/if}{/each}</div>
            <ul class="zl">
              {#each values.zones as z (z.z)}
                <li><span class="zn"><i class="zc-{z.z}" aria-hidden="true"></i>Z{z.z}</span><b class="num">{hm(z.s / 3600)}</b><small class="num">{z.pct} %</small></li>
              {/each}
            </ul>
          {:else}<h3>{t('Heart rate|review')}</h3>{/if}
          {#if values.hrAvg != null}
            <dl class="rv-tiles hpt two">
              <div class="rv-tile"><dd><b class="num">{num(values.hrAvg)}</b> <span class="u">{t('bpm')}</span></dd><dt><small>{t('Ø heart rate')}</small></dt></div>
              <div class="rv-tile"><dd><b class="num">{values.hrMax ? num(values.hrMax) : '–'}</b> <span class="u">{t('bpm')}</span></dd><dt><small>{t('Highest heart rate')}</small></dt></div>
            </dl>
          {/if}
        </div>
      {/if}

      {#if p}
        <div class="part" data-power={p.measured ? 'measured' : 'estimated'}>
          <div class="zh"><h3>{t('Power')}</h3><span>{p.measured ? t('power meter') : t('estimated by Strava')}</span></div>
          <dl class="rv-tiles hpt" class:two={!p.measured}>
            {#if p.measured}<div class="rv-tile"><dd><b class="num">{p.np ? num(p.np) : '–'}</b> <span class="u">W</span></dd><dt><small>NP<span class="est">Normalized Power</span></small></dt></div>{/if}
            <div class="rv-tile"><dd><b class="num">{num(p.avg)}</b> <span class="u">W</span></dd><dt><small>{t('Ø power')}{#if !p.measured}<span class="est">{t('estimated')}</span>{/if}</small></dt></div>
            <div class="rv-tile"><dd><b class="num">{p.max ? num(p.max) : '–'}</b> <span class="u">W</span></dd><dt><small>{t('Max. power')}{#if !p.measured}<span class="est">{t('estimated')}</span>{/if}</small></dt></div>
          </dl>
          {#if p.measured}
            {#if p.zones}
              <div class="zh sub"><h4>{t('Time in power zones')}</h4><span>{t('Z1–Z7 after Coggan, from your FTP')}</span></div>
              <div class="zbar" aria-hidden="true">{#each p.zones as z (z.z)}{#if z.s}<i class="pz-{z.z}" style:flex-grow={z.s}></i>{/if}{/each}</div>
              <ul class="zl seven">
                {#each p.zones as z (z.z)}
                  <li><span class="zn"><i class="pz-{z.z}" aria-hidden="true"></i>Z{z.z}</span><b class="num">{hm(z.s / 3600)}</b><small class="num">{z.pct} %</small></li>
                {/each}
              </ul>
            {/if}
            {#if curve}
              <div class="zh sub"><h4>{t('Power curve')}</h4><span>{t('best power over …')}</span></div>
              <svg class="pc" viewBox="0 0 340 112" role="img" aria-label={t('Power curve: {list}', { list: curve.pts.map((x) => `${CURVE_L[x.s]} ${num(x.w)} W`).join(', ') })}>
                <path class="pca" d="M{curve.pts[0].x},92 {curve.pts.map((x) => `L${x.x},${x.y}`).join(' ')} L{curve.pts.at(-1).x},92 Z" />
                <path class="pcl" d="M{curve.pts.map((x) => `${x.x},${x.y}`).join(' L')}" />
                {#each curve.pts as x (x.s)}<circle cx={x.x} cy={x.y} r="3" /><text x={x.x} y={x.y - 7} class="pv">{num(x.w)} W</text><text x={x.x} y="106" class="pl">{CURVE_L[x.s]}</text>{/each}
              </svg>
            {/if}
            {#if p.ftp}
              <dl class="rv-tiles hpt one"><div class="rv-tile"><dd><b class="num">{num(p.ftp)}</b> <span class="u">W</span></dd><dt><small>{t('estimated FTP')}<span class="est">{t('best 20 min × 0.95')}</span></small><Help label={t('estimated FTP')} text={t(FIELD_HELP.ftp)} /></dt></div></dl>
              <p class="rv-note pm"><Info size={16} aria-hidden="true" /><span>{t('Only to look at. The app estimates the FTP from your best 20 min; it changes nothing by itself.')}</span></p>
            {/if}
          {/if}
          {#if p.kg}
            <dl class="rv-tiles hpt two" data-wkg>
              <div class="rv-tile"><dd><b class="num">{p.wkgAvg != null ? n1(p.wkgAvg) : '–'}</b> <span class="u">W/kg</span></dd><dt><small>Ø{#if !p.measured}<span class="est">{t('estimated')}</span>{/if}</small></dt></div>
              {#if p.measured && p.wkg20 != null}<div class="rv-tile"><dd><b class="num">{n1(p.wkg20)}</b> <span class="u">W/kg</span></dd><dt><small>{t('best 20 min')}</small></dt></div>{/if}
            </dl>
            <!-- SN2x: wire to training.js when the Training PR lands (TR6: the weight under Ich › Meine Daten) -->
            <p class="rv-note pm wl"><Smartphone size={16} aria-hidden="true" /><span>{t('Calculated with {kg} kg, only on this device', { kg: n1(p.kg) })}</span><a href="#/me">{t('Weight under Me › My data')}</a></p>
          {:else}
            <p class="rv-note pm wl" data-quiet="weight"><Smartphone size={16} aria-hidden="true" /><span>W/kg:</span><a href="#/me">{t('Weight under Me › My data')}</a></p>
          {/if}
          {#if !p.measured}<p class="rv-note pm" data-quiet="no-watts"><Info size={16} aria-hidden="true" /><span>{t('Without watts there is no NP, power zones, power curve, estimated FTP or load. Relative Effort stays; it comes from the heart rate.')}</span></p>{/if}
        </div>
      {:else if strava}
        <p class="rv-note pm" data-quiet="no-power"><Info size={16} aria-hidden="true" /><span>{t('No power on this trip: no NP, power zones, power curve, FTP or load.')}</span></p>
      {/if}

      {#if effort != null || load != null}
        <div class="part" data-effort>
          <div class="zh"><h3>{load != null ? t('Relative Effort and load') : t('Relative Effort')}</h3><span>{t('only to look at')}</span></div>
          {#if effort != null}
            <div class="eff"><div class="rv-tile"><b class="num">{num(effort)}</b><small>{t('Relative Effort')}</small><span class="est">{t('from heart rate')}</span></div>
              <div class="bars"><MiniBars values={efforts} {mark} label={t('Relative Effort of your last {n} trips', { n: efforts.length })} /><small>{t('your last {n} trips, this one on the right', { n: efforts.length })}</small></div></div>
          {/if}
          {#if load != null}
            <div class="eff"><div class="rv-tile"><b class="num">{num(load)}</b><small>{t('Load|power')}</small><span class="est">NP ÷ FTP</span><Help label={t('Load|power')} text={t(FIELD_HELP.load)} /></div>
              <div class="bars"><MiniBars values={loads} {mark} label={t('Load of your last {n} trips with watts', { n: loads.length })} /><small>{t('trips with watts, this one on the right')}</small></div></div>
          {/if}
        </div>
      {/if}

      {#if best?.length}
        <details class="best">
          <summary><Trophy size={18} aria-hidden="true" /><span><b>{t('Strava best times')}</b><small>{tn(best.length, '{n} segment · only your own times', '{n} segments · only your own times')}</small></span><ChevronDown size={18} aria-hidden="true" /></summary>
          <ul>
            {#each best as b, i (i)}
              <li><span><b>{b.name}</b>{#if b.km != null}<small>{n1(b.km)} km{b.grade != null ? ` · ${num(b.grade)} %` : ''}</small>{/if}</span><span class="num">{b.s ? secs(b.s) : '–'}</span>{#if RANK[b.rank]}<span class="est">{t(RANK[b.rank])}</span>{/if}</li>
            {/each}
          </ul>
        </details>
      {/if}
      <p class="src"><RefreshCw size={14} aria-hidden="true" />{source.join(' · ')}</p>
    </div>
  </section>
{:else}
  <p class="hp-none" data-heart-power="none"><Activity size={16} aria-hidden="true" />{t('Heart rate and power · with Strava')}</p>
{/if}

<style>
  .part + .part {
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid var(--line);
  }
  h3 {
    margin: 0 0 8px;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  h4 {
    margin: 0;
    font: 600 var(--fs-small) / 1.3 var(--font-body);
  }
  .zh {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 4px 12px;
  }
  .zh h3 {
    margin: 0;
  }
  .zh.sub {
    margin-top: 14px;
  }
  .zh span {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .zbar {
    display: flex;
    gap: 2px;
    height: 14px;
    margin: 10px 0 8px;
    border-radius: 7px;
    overflow: hidden;
  }
  .zbar i {
    display: block;
    flex: 1 1 0;
    min-width: 3px;
  }
  .zl {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;
    list-style: none;
    margin: 0 0 12px;
    padding: 0;
  }
  .zl.seven {
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }
  .zl li {
    display: grid;
    gap: 1px;
    min-width: 0;
  }
  .zn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .zn i {
    width: 9px;
    height: 9px;
    border-radius: 2px;
  }
  .zl b {
    font: 600 var(--fs-body) / 1.2 var(--font-body);
  }
  .zl small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hpt {
    padding: 0;
    margin-top: 8px;
  }
  .hpt.two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .hpt.one {
    grid-template-columns: minmax(0, 1fr);
  }
  .hpt dd,
  .hpt dt {
    margin: 0;
  }
  .hpt .rv-tile {
    display: flex;
    flex-direction: column;
  }
  .u {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .est {
    display: inline-block;
    margin-left: 6px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .pm {
    margin-top: 10px;
    padding: 0;
  }
  .wl {
    flex-wrap: wrap;
  }
  .wl a {
    margin-left: auto;
    color: var(--ink);
    font-weight: 500;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .pc {
    display: block;
    width: 100%;
    height: auto;
    margin-top: 6px;
  }
  .pca {
    fill: color-mix(in srgb, var(--ink-3) 22%, var(--paper));
  }
  .pcl {
    fill: none;
    stroke: var(--ink-2);
    stroke-width: 1.6;
  }
  .pc circle {
    fill: var(--paper);
    stroke: var(--ink-2);
  }
  .pv,
  .pl {
    font: var(--fs-tiny) var(--font-body);
    fill: var(--ink-3);
    text-anchor: middle;
  }
  .eff {
    display: grid;
    grid-template-columns: minmax(0, 7.5em) minmax(0, 1fr);
    align-items: end;
    gap: 12px;
    margin-top: 8px;
  }
  .eff .rv-tile {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .eff .est {
    margin: 4px 0 0;
  }
  .bars small {
    display: block;
    margin-top: 4px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .best {
    margin-top: 14px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .best summary {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 52px;
    padding: 6px 12px;
    cursor: pointer;
    list-style: none;
  }
  .best summary::-webkit-details-marker {
    display: none;
  }
  .best summary > span {
    flex: 1;
    display: grid;
  }
  .best small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .best ul {
    margin: 0;
    padding: 0 12px 8px;
    list-style: none;
  }
  .best li {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    border-top: 1px solid var(--line);
  }
  .best li > span:first-child {
    flex: 1;
    display: grid;
  }
  .src {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 12px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .src :global(svg) {
    flex: none;
  }
  .hp-none {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    padding: 0 4px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  @media (max-width: 559px) {
    .zl {
      gap: 4px;
    }
    .zl.seven {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    .hpt:not(.two):not(.one) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .wl a {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      margin-left: 0;
    }
  }
</style>
