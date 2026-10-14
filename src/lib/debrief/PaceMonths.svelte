<script>
  /**
   * SN2+ SN2i (mockup approved 13.10.2026, answer 5b: all months since the first ride, no toggle):
   * «Tempo über die Monate»: km/h per month as bars, Ø heart rate as dots below, only to look at.
   * «Puls und Leistung pro Monat»: Ø and highest heart rate, Ø and max power, best 20 min (power meter
   * only) and the time in the zones as small bars per month, the newest value on the right. Estimated
   * power is lighter and dashed. months: werte.js monthly().
   */
  import { t, num, locale } from '../i18n.svelte.js';
  import { n1, monthLong } from '../review/fmt.js';
  import { hm } from '../gpx.js';
  import { lastOf } from '../review/werte.js';
  import '../review/zones.css';

  let { months = [] } = $props();
  const letter = (ym) => new Date(`${ym}-15T12:00:00`).toLocaleDateString(locale(), { month: 'narrow' });
  const top = (key) => Math.max(0, ...months.map((m) => m[key] ?? 0)) || 1;
  const kmhTop = $derived(top('kmh'));
  const hrs = $derived(months.map((m) => m.hrAvg).filter((v) => v != null));
  const hrLo = $derived(hrs.length ? Math.min(...hrs) - 5 : 0);
  const hrHi = $derived(hrs.length ? Math.max(...hrs) + 5 : 1);
  const newest = $derived(months.at(-1)?.ym ?? null);
  const empty = $derived(months.filter((m) => !m.n && m.hrAvg == null).length);

  const ROWS = [
    { key: 'hrAvg', name: 'Ø heart rate', unit: 'bpm' },
    { key: 'hrMax', name: 'Highest heart rate', unit: 'bpm' },
    { key: 'wAvg', name: 'Ø power', unit: 'W', est: true },
    { key: 'wMax', name: 'Max. power', unit: 'W', est: true },
    { key: 'w20', name: 'Best 20 min', unit: 'W', sub: 'only rides with a power meter' },
  ];
  const any = (key) => months.some((m) => m[key] != null && m[key] !== 0);
  const zoneTop = $derived(top('zoneS'));
  // many months scroll sideways inside the card: start at the newest, on the right
  const toEnd = (el) => {
    el.scrollLeft = el.scrollWidth;
  };
</script>

{#if months.length}
  <section class="rv-sec pm" aria-labelledby="pm-h" data-months>
    <div class="rv-h"><div><h2 id="pm-h">{t('Pace over the months')}</h2><p class="rv-sub">{t('Average while moving per month, with Ø heart rate · only to look at')}</p></div></div>
    <div class="rv-box pad">
      <div class="scroll" use:toEnd>
        <div class="mc" style:--n={months.length}>
          <span class="ax">km/h</span>
          <ol class="bars">
            {#each months as m (m.ym)}
              <li data-month={m.ym} title={monthLong(m.ym)}>
                {#if m.kmh != null}<span class="bv num">{n1(m.kmh)}</span><i class="bar" class:last={m.ym === newest} style:height="{(m.kmh / kmhTop) * 100}%"></i>{/if}
              </li>
            {/each}
          </ol>
          {#if hrs.length}
            <span class="ax">{t('Ø heart rate, bpm')}</span>
            <ol class="dots">
              {#each months as m (m.ym)}
                <li>{#if m.hrAvg != null}<span class="dot" style:bottom="{((m.hrAvg - hrLo) / (hrHi - hrLo)) * 100}%"><span class="dv num">{m.hrAvg}</span></span>{/if}</li>
              {/each}
            </ol>
          {/if}
          <ol class="ml" aria-hidden="true">{#each months as m (m.ym)}<li>{letter(m.ym)}</li>{/each}</ol>
        </div>
      </div>
      {#if empty}<p class="foot">{t('{n} of {all} months without rides.', { n: empty, all: months.length })}</p>{/if}
    </div>
  </section>

  {#if any('hrAvg') || any('wAvg') || any('zoneS')}
    <section class="rv-sec pm" aria-labelledby="pp-h" data-months-values>
      <div class="rv-h"><div><h2 id="pp-h">{t('Heart rate and power per month')}</h2><p class="rv-sub">{t('from Strava · {month} last, without rating', { month: monthLong(newest) })}</p></div></div>
      <ul class="rv-box pad mv">
        {#each ROWS.filter((r) => any(r.key)) as r (r.key)}
          {@const tp = top(r.key)}
          {@const l = lastOf(months, r.key)}
          <li data-row={r.key}>
            <span class="ml2">{t(r.name)}{#if r.sub}<small>{t(r.sub)}</small>{/if}</span>
            <span class="mb" style:--n={months.length}>{#each months as m (m.ym)}<i class:last={m.ym === newest} class:est={r.est && m.west} style:height="{m[r.key] ? Math.max(4, (m[r.key] / tp) * 100) : 4}%" class:none={!m[r.key]}></i>{/each}</span>
            <b class="num">{l ? num(l.v) : '–'} <small class="u">{t(r.unit)}</small></b>
          </li>
        {/each}
        {#if any('zoneS')}
          {@const l = lastOf(months, 'zoneS')}
          <li data-row="zones">
            <span class="ml2">{t('Time in heart rate zones')}<small>{t('Hours per month, Z1 below up to Z5 on top')}</small></span>
            <span class="mb zs" style:--n={months.length}>
              {#each months as m (m.ym)}
                <span class="zcol" style:height="{m.zoneS ? Math.max(4, (m.zoneS / zoneTop) * 100) : 4}%">{#if m.zones}{#each [4, 3, 2, 1, 0] as i (i)}{#if m.zones[i]}<i class="zc-{i + 1}" style:flex-grow={m.zones[i]}></i>{/if}{/each}{/if}</span>
              {/each}
            </span>
            <b class="num">{l ? hm(l.v / 3600) : '–'} <small class="u">h</small></b>
          </li>
        {/if}
        <li class="lg"><span><i class="k"></i>{t('measured')}</span>{#if months.some((m) => m.west)}<span><i class="k est"></i>{t('estimated (without power meter)')}</span>{/if}</li>
      </ul>
    </section>
  {/if}
{/if}

<style>
  .scroll {
    overflow-x: auto;
  }
  .mc {
    min-width: calc(var(--n) * 22px);
  }
  .ax {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .bars,
  .dots,
  .ml {
    display: grid;
    grid-template-columns: repeat(var(--n), minmax(0, 1fr));
    gap: 6px;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .bars {
    height: 140px;
    align-items: end;
    margin: 18px 0 10px;
    border-bottom: 1px solid var(--line-strong);
  }
  .bars li {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
  }
  .bar {
    display: block;
    width: 100%;
    max-width: 28px;
    border-radius: 3px 3px 0 0;
    background: var(--line-strong);
  }
  .bar.last {
    background: var(--hi);
  }
  .bv {
    font-size: var(--fs-tiny);
    color: var(--ink-2);
    margin-bottom: 2px;
  }
  .dots {
    height: 54px;
    margin: 14px 0 8px;
  }
  .dots li {
    position: relative;
  }
  .dot {
    position: absolute;
    left: 50%;
    width: 9px;
    height: 9px;
    margin: 0 0 -4px -5px;
    border: 2px solid var(--ink-2);
    border-radius: 50%;
    background: var(--paper);
    box-sizing: border-box;
  }
  .dv {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    font-size: var(--fs-tiny);
    color: var(--ink-2);
  }
  .ml li {
    text-align: center;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .foot {
    margin: 10px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .mv {
    list-style: none;
  }
  .mv li {
    display: grid;
    grid-template-columns: minmax(0, 10em) minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 8px 0;
  }
  .mv li + li {
    border-top: 1px solid var(--line);
  }
  .ml2 {
    display: grid;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .ml2 small,
  .u {
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .mb {
    display: grid;
    grid-template-columns: repeat(var(--n), minmax(0, 1fr));
    align-items: end;
    gap: 3px;
    height: 40px;
  }
  .mb > i {
    display: block;
    border-radius: 2px;
    background: var(--line-strong);
  }
  .mb > i.none {
    background: var(--line);
  }
  .mb > i.last {
    background: var(--hi);
  }
  .mb > i.est {
    background: var(--paper-2);
    border: 1px dashed var(--ink-3);
    box-sizing: border-box;
  }
  .zs {
    height: 64px;
  }
  .zcol {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-height: 2px;
    border-radius: 2px;
    overflow: hidden;
    background: var(--line);
  }
  .zcol i {
    display: block;
    flex: 1 1 0;
    min-height: 1px;
    border-radius: 0;
  }
  .mv b {
    font: 600 var(--fs-sub) / 1.2 var(--font-body);
    white-space: nowrap;
    text-align: right;
  }
  .lg {
    display: flex !important;
    flex-wrap: wrap;
    gap: 6px 16px;
    min-height: 0 !important;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .lg span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .k {
    display: inline-block;
    width: 14px;
    height: 8px;
    border-radius: 2px;
    background: var(--line-strong);
  }
  .k.est {
    background: var(--paper-2);
    border: 1px dashed var(--ink-3);
  }
  @media (max-width: 559px) {
    .mv li {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .mb {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
</style>
