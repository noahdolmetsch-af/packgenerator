<script>
  /**
   * Your trips compared (v0.19.2, Noah 5a): per debriefed trip the gear you took, split into
   * used and not used, with the trend of the last trip against the ones before.
   * v0.40.0 (design check R3, R6): a table, newest first: trip · km · kg · not needed, the numbers
   * right-aligned in their columns; the bar quiet (used green, not used grey), no orange.
   */
  import { formatWeight, knownWeight, weightText } from '../gear.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import { tripRows, trend } from '../insights.js';

  let { trips, debriefs, items } = $props();
  const rows = $derived(tripRows(trips, debriefs, items));
  const shown = $derived([...rows].reverse());
  const tr = $derived(trend(rows));
  const max = $derived(Math.max(1, ...rows.map((r) => r.packedG)));
  const pct = (g) => `${(g / max) * 100}%`;
  const kg = (g) => `${(Math.abs(g) / 1000).toFixed(1)} kg`;
  const fmtDate = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' }) : '');
</script>

{#if rows.length}
  <section id="compare" aria-labelledby="cmp-h">
    <h2 id="cmp-h" class="sec-head"><span>{t('Your trips compared')}</span><span class="n">{tn(rows.length, '{n} debrief', '{n} debriefs')}</span></h2>
    <div class="box">
      {#if tr}
        <p class="lead">
          {tr.packedDiffG <= -100 ? t('{trip}: {kg} lighter than the trips before on average,', { trip: tr.last, kg: kg(tr.packedDiffG) }) : tr.packedDiffG >= 100 ? t('{trip}: {kg} heavier than the trips before on average,', { trip: tr.last, kg: kg(tr.packedDiffG) }) : t('{trip}: about as heavy as the trips before on average,', { trip: tr.last })}
          {tr.unusedDiffG <= -50 ? t('with {w} less gear not used ({pct} % of what you took).', { w: formatWeight(-tr.unusedDiffG), pct: tr.unusedShare }) : tr.unusedDiffG >= 50 ? t('with {w} more gear not used ({pct} % of what you took).', { w: formatWeight(tr.unusedDiffG), pct: tr.unusedShare }) : t('with about as much gear not used ({pct} % of what you took).', { pct: tr.unusedShare })}
        </p>
      {/if}
      <table class="cmp" aria-label={t('Gear per trip, used and not used')}>
        <thead>
          <tr><th scope="col">{t('Trip')}</th><th scope="col" class="n">km</th><th scope="col" class="n">kg</th><th scope="col" class="n">{t('not needed')}</th></tr>
        </thead>
        <tbody>
          {#each shown as r (r.id)}
            <tr>
              <th scope="row">
                <span class="tt">{r.title}</span>
                <small>{fmtDate(r.date)}{r.missingN ? ` · ${t('{n} missing', { n: r.missingN })}` : ''}{r.packedMissing ? ` · ${t('{n} not weighed', { n: r.packedMissing })}` : ''}</small>
                <span class="bar" role="img" aria-label={t('{gear} gear, {unused} not used', { gear: weightText(r.packedG, r.packedMissing), unused: knownWeight(r.unusedG, r.unusedMissing) })}><i class="used" style:width={pct(r.packedG - r.unusedG)}></i><i class="un" style:width={pct(r.unusedG)}></i></span>
              </th>
              <td class="n num">{r.km ? num(Math.round(r.km)) : '–'}</td>
              <td class="n num">{r.packedG ? (r.packedG / 1000).toFixed(1) : '–'}</td>
              <td class="n num">{r.unusedG || r.unusedN ? knownWeight(r.unusedG, r.unusedMissing) : '–'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
      <p class="key">{#if !tr}{t('After the next debrief you see here whether you pack better from trip to trip.')} {/if}<i class="used"></i> {t('used')} <i class="un"></i> {t('not used')} · {t('gear with a known weight, food and water left out')}</p>
    </div>
  </section>
{/if}

<style>
  .box {
    padding: 12px;
    border: 1px solid var(--line);
    border-top: 0;
    border-radius: 0 0 8px 8px;
    background: var(--paper);
  }
  .lead {
    margin: 0 0 10px;
    color: var(--ink-2);
  }
  .cmp {
    width: 100%;
    border-collapse: collapse;
    font-size: 15px;
  }
  .cmp th,
  .cmp td {
    padding: 8px 4px;
    border-top: 1px solid var(--line);
    text-align: left;
    vertical-align: top;
  }
  .cmp thead th {
    border-top: 0;
    padding-top: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink-3);
  }
  .cmp tbody th {
    font-weight: 500;
    width: 100%;
    overflow-wrap: break-word;
  }
  .tt {
    display: block;
  }
  .cmp small {
    display: block;
    font-weight: 400;
    font-size: 13px;
    color: var(--ink-3);
  }
  .n {
    text-align: right !important;
    white-space: nowrap;
    padding-left: 10px !important;
  }
  .cmp thead .n {
    white-space: normal;
  }
  .bar {
    display: flex;
    height: 6px;
    margin-top: 6px;
    background: var(--paper-2);
    border-radius: 3px;
    overflow: hidden;
  }
  .used {
    background: var(--ok);
  }
  .un {
    background: var(--line-strong);
  }
  .key {
    margin: 10px 0 0;
    font-size: 13px;
    color: var(--ink-3);
  }
  .key i {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    vertical-align: -1px;
  }
</style>
