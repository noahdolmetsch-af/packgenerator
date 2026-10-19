<script>
  /**
   * TR7f «Jahr gegen Jahr»: this year from 1 January to today against last year from 1 January to the same
   * day: km, Hm, hours and the number of activities (every sport), as paired bars. weeks.js yearSums.
   */
  import AnaCard from '../AnaCard.svelte';
  import { t, num, locale } from '../../i18n.svelte.js';
  import { yearSums } from './weeks.js';

  let { acts = [], today = '' } = $props();
  const y = $derived(today ? yearSums(acts, today) : null);
  const has = $derived(!!y && (y.cur.n > 0 || y.prev.n > 0));
  const dm = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const rows = $derived(
    has
      ? [
          { key: 'km', name: t('km'), a: y.cur.km, b: y.prev.km },
          { key: 'hm', name: t('Hm|short'), a: y.cur.hm, b: y.prev.hm },
          { key: 'h', name: t('Hours|sum'), a: Math.round(y.cur.h), b: Math.round(y.prev.h) },
          { key: 'n', name: t('Activities'), a: y.cur.n, b: y.prev.n },
        ]
      : [],
  );
  const pct = (v, r) => (Math.max(r.a, r.b) > 0 ? (v / Math.max(r.a, r.b)) * 100 : 0);
  const label = $derived(has ? rows.map((r) => `${r.name}: ${y.cur.year} ${num(r.a)} / ${y.prev.year} ${num(r.b)}`).join(', ') : '');
</script>

{#if has}
  <AnaCard key="year" sub={t('up to the same day')}>
    <div class="rows" role="img" aria-label={label}>
      {#each rows as r (r.key)}
        <div class="row" data-row={r.key}>
          <span class="rn">{r.name}</span>
          <span class="bar"><i class="a" style="width:{pct(r.a, r)}%"></i><small>{y.cur.year} {num(r.a)}</small></span>
          <span class="bar"><i class="b" style="width:{pct(r.b, r)}%"></i><small>{y.prev.year} {num(r.b)}</small></span>
        </div>
      {/each}
    </div>
    <ul class="leg">
      <li><i class="k a"></i>{t('{year} to {day}', { year: y.cur.year, day: dm(y.cur.to) })}</li>
      <li><i class="k b"></i>{t('{year} to {day}', { year: y.prev.year, day: dm(y.prev.to) })}</li>
    </ul>
    <p class="cap">{t('Same period: 1 January to today.')}</p>
  </AnaCard>
{/if}

<style>
  .rows {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .row {
    display: grid;
    grid-template-columns: minmax(64px, 0.7fr) 1fr 1fr;
    gap: 12px;
    align-items: center;
  }
  .rn {
    font-size: var(--fs-small);
  }
  .bar {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .bar i {
    display: block;
    height: 12px;
    border-radius: 6px;
    min-width: 2px;
  }
  .bar i.a {
    background: var(--ch-w);
  }
  .bar i.b {
    background: var(--pz1);
  }
  .bar {
    background: linear-gradient(color-mix(in srgb, var(--line) 45%, transparent), color-mix(in srgb, var(--line) 45%, transparent)) top / 100% 12px no-repeat;
    border-radius: 6px;
  }
  .bar small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .leg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .leg li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .k {
    display: inline-block;
    width: 14px;
    height: 0;
    border-top: 3px solid;
  }
  .k.a {
    border-color: var(--ch-w);
  }
  .k.b {
    border-color: var(--pz1);
  }
</style>
