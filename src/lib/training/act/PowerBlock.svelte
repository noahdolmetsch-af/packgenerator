<script>
  /**
   * TR5 «Leistung» (Noah 14.10.2026 «TR5–TR7 freigegeben»): only with a power meter. The power values
   * (Ø, NP, max, best 20 minutes, W/kg, work, FTP estimate) and the time in the 7 power zones from the
   * FTP estimate. The weight for W/kg comes from Ich › Meine Daten › Gewicht and stays on this device.
   * Observation only: no value is rated.
   */
  import Sec from '../../flow/kit/Sec.svelte';
  import { ftpEstimate, powerZoneSecs, wkg } from '../../training.js';
  import { kgOn } from '../../weight.js';
  import { weight } from '../../weight.svelte.js';
  import { fixed, hasMeter, powerRange, POWER_ZONE_NAMES } from './power.js';
  import { t, num, locale } from '../../i18n.svelte.js';
  import { ftpLabel } from '../../strava/ftpstate.js';

  let { act = null, all = [], today = '' } = $props();

  const meter = $derived(hasMeter(act));
  const ftp = $derived(meter ? ftpEstimate(all, today) : null);
  const kg = $derived(act ? kgOn(weight.entries, act.day) : null);
  const secs = $derived(meter ? powerZoneSecs(act.pHist, ftp) : null);
  const most = $derived(secs ? Math.max(...secs) : 0);
  const vals = $derived.by(() => {
    if (!meter) return [];
    const v = [];
    if (act.wAvg != null) v.push({ k: 'avg', b: `${act.wAvg} W`, s: t('Ø power') });
    if (act.wNorm != null) v.push({ k: 'np', b: `${act.wNorm} W`, s: t('NP (normalised)') });
    if (act.wMax != null) v.push({ k: 'max', b: `${act.wMax} W`, s: t('max power') });
    if (act.w20 != null) v.push({ k: 'w20', b: `${act.w20} W`, s: t('best 20 min') });
    if (kg && wkg(act.wAvg, kg) != null) v.push({ k: 'wkg', b: fixed(wkg(act.wAvg, kg), 1, locale()), s: t('W/kg Ø') });
    if (kg && wkg(act.w20, kg) != null) v.push({ k: 'wkg20', b: fixed(wkg(act.w20, kg), 1, locale()), s: t('W/kg best 20 min') });
    if (act.kj != null) v.push({ k: 'kj', b: `${num(act.kj)} kJ`, s: t('Work|power') });
    if (ftp) v.push({ k: 'ftp', b: `${ftp} W`, s: t(ftpLabel()) });
    return v;
  });
  const rangeText = (i) => {
    const r = powerRange(i, ftp);
    return r.from == null ? t('up to {n} W', { n: r.to }) : r.to == null ? t('over {n} W', { n: r.from - 1 }) : t('{a}–{b} W', { a: r.from, b: r.to });
  };
</script>

{#if meter && vals.length}
  <Sec id="power-h" title={t('Power|card')} sub={t('from the power meter')}>
    <div class="card pw" data-section="power">
      <div class="vals num">
        {#each vals as v (v.k)}<span data-power={v.k}><b>{v.b}</b><small>{v.s}</small></span>{/each}
      </div>
      <p class="hint">
        {#if ftp}{t('FTP estimated = 95 % of your best 20 minutes of the last 90 days.')}{/if}
        {#if kg}{t('W/kg with your weight from Me (stays on this device).')}
        {:else}{t('For W/kg, enter your weight under')} <a href="#/me/weight">{t('Me › My data › Weight')}</a>.{/if}
      </p>
    </div>
  </Sec>
{/if}

{#if secs}
  <Sec id="pzones-h" title={t('Time in power zones')} sub={t('from FTP {n} W', { n: ftp })}>
    <div class="card pz" data-section="power-zones">
      <ul>
        {#each secs as s, i (i)}
          <li data-pzone={i + 1}>
            <span class="zn"><b>Z{i + 1} {t(POWER_ZONE_NAMES[i])}</b><small class="num">{rangeText(i)}</small></span>
            <span class="bar"><i style:width="{most ? (s / most) * 100 : 0}%" style:background="var(--pz{i + 1})"></i></span>
            <span class="mn num">{t('{n} min', { n: Math.round(s / 60) })}</span>
          </li>
        {/each}
      </ul>
    </div>
  </Sec>
{/if}

<style>
  .pw,
  .pz {
    padding: 14px 20px;
  }
  .pw {
    padding-top: 16px;
  }
  .vals {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }
  .vals span {
    display: flex;
    flex-direction: column;
    padding: 10px 12px;
    border-radius: var(--radius);
    background: var(--paper-2);
  }
  .vals b {
    font: 700 var(--fs-sub) / 1.25 var(--font-body);
  }
  .vals small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .hint {
    margin: 10px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .hint a {
    color: var(--ink);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: grid;
    grid-template-columns: minmax(110px, 150px) minmax(0, 1fr) 64px;
    align-items: center;
    gap: 12px;
    padding: 6px 0;
  }
  .zn {
    display: flex;
    flex-direction: column;
  }
  .zn b {
    font-weight: 500;
  }
  .zn small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .bar {
    height: 10px;
    border-radius: 99px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: 99px;
  }
  .mn {
    text-align: right;
    font-weight: 700;
  }
</style>
