<script>
  /**
   * «Meilensteine motivierender» PR 5 (Noah 21.11.2026 «1-5 a», Idee 4): «Dein Jahr in Sternen»: the stars of the year by
   * month as small bars, the totals and the newest star. A look back, no goal and no comparison. y: yearOfStars().
   */
  import { msName, stageName, dayWord } from './words.js';
  import { t, tn, locale } from '../../i18n.svelte.js';

  let { y, today } = $props();
  const max = $derived(Math.max(1, ...y.months));
  const month = (i, style) => new Date(Date.UTC(2026, i, 1)).toLocaleDateString(locale(), { month: style, timeZone: 'UTC' });
</script>

<section class="yr card" data-year-stars aria-labelledby="yr-h">
  <h2 id="yr-h">{t('Your year in stars')}</h2>
  <div class="nums">
    <p><b class="num" data-year-total>{y.total}</b><span>{tn(y.total, 'star in {year}', 'stars in {year}', { year: y.year })}</span></p>
    <p><b class="num">{y.all}</b><span>{t('stars since the start')}</span></p>
    {#if y.best}<p><b>{month(y.best.month, 'long')}</b><span>{t('strongest month ({n})', { n: y.best.n })}</span></p>{/if}
  </div>
  <div class="bars" role="img" aria-label={t('Stars per month in {year}', { year: y.year })}>
    {#each y.months as n, i (i)}
      <div class:now={i === y.now} class:fut={i > y.now}>
        <em>{n || ''}</em>
        <i style:height="{i > y.now ? 12 : n ? Math.max(6, Math.round((n / max) * 56)) : 2}px"></i>
        <span>{month(i, 'narrow')}</span>
      </div>
    {/each}
  </div>
  {#if y.last}<p class="last">{t('Newest: {name}, star {k} · {stage}, {day}', { name: msName(y.last.r.m), k: y.last.star, stage: stageName(y.last.star), day: dayWord(y.last.day, today) })}</p>{/if}
</section>

<style>
  .yr {
    display: grid;
    gap: var(--sp-3);
    padding: var(--sp-4);
    min-width: 0;
  }
  h2 {
    margin: 0;
    font: 700 var(--fs-section) / 1.25 var(--font-body);
  }
  .nums {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2) var(--sp-5);
  }
  .nums p {
    display: grid;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .nums b {
    color: var(--ink);
    font: 700 var(--fs-num) / 1.1 var(--font-body);
  }
  .bars {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: var(--sp-1);
    align-items: end;
    max-width: 32rem;
  }
  .bars div {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 2px;
    min-width: 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .bars i {
    display: block;
    width: 100%;
    max-width: 26px;
    border-radius: 4px 4px 0 0;
    background: var(--l2);
  }
  .bars .now i {
    background: var(--accent);
  }
  .bars .fut i {
    border: 1px dashed var(--line-strong);
    border-bottom: 0;
    background: none;
  }
  .bars em {
    color: var(--ink);
    font-style: normal;
    font-weight: 600;
    min-height: 1em;
  }
  .last {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
