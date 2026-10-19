<script>
  /**
   * TR7f «Monat gegen Monat»: two months side by side (chosen; first the last full month against the one
   * before): km, Hm, hours and load of every activity, as paired bars with their values. weeks.js monthSums.
   */
  import AnaCard from '../AnaCard.svelte';
  import { t, num, locale } from '../../i18n.svelte.js';
  import { monthsOf } from '../../training.js';
  import { loadsOf, monthSums, defaultMonths } from './weeks.js';

  let { acts = [], today = '' } = $props();
  const loads = $derived(loadsOf(acts));
  const defs = $derived(today ? defaultMonths(today) : ['', '']);
  let pickA = $state(null);
  let pickB = $state(null);
  const a = $derived(pickA ?? defs[0]);
  const b = $derived(pickB ?? defs[1]);
  const options = $derived([...new Set([...monthsOf(acts), ...defs])].filter((m) => m && (!today || m <= today.slice(0, 7))).sort().reverse());
  const sa = $derived(a ? monthSums(acts, a, loads) : null);
  const sb = $derived(b ? monthSums(acts, b, loads) : null);
  const has = $derived(!!today && acts.length > 0 && (sa?.n > 0 || sb?.n > 0 || pickA != null || pickB != null));

  const name = (ym, month = 'short', year = false) =>
    ym ? new Date(`${ym}-15T12:00:00Z`).toLocaleDateString(locale(), { month, ...(year ? { year: 'numeric' } : {}), timeZone: 'UTC' }) : '';
  const rows = $derived(
    has
      ? [
          { key: 'km', name: t('km'), a: sa.km, b: sb.km },
          { key: 'hm', name: t('Hm|short'), a: sa.hm, b: sb.hm },
          { key: 'h', name: t('Hours|sum'), a: sa.h, b: sb.h },
          { key: 'load', name: t('Load|sum'), a: sa.load, b: sb.load },
        ]
      : [],
  );
  const pct = (v, r) => (Math.max(r.a, r.b) > 0 ? (v / Math.max(r.a, r.b)) * 100 : 0);
  const label = $derived(rows.map((r) => `${r.name}: ${name(a)} ${num(r.a)} / ${name(b)} ${num(r.b)}`).join(', '));
</script>

{#if has}
  <AnaCard key="month" sub={t('choosable, first: last against the one before')}>
    <div class="pick">
      <select class="sel" aria-label={t('First month')} value={a} onchange={(e) => (pickA = e.currentTarget.value)}>
        {#each options as m (m)}<option value={m}>{name(m, 'long', true)}</option>{/each}
      </select>
      <span>{t('against|compare')}</span>
      <select class="sel" aria-label={t('Second month')} value={b} onchange={(e) => (pickB = e.currentTarget.value)}>
        {#each options as m (m)}<option value={m}>{name(m, 'long', true)}</option>{/each}
      </select>
    </div>
    <div class="rows" role="img" aria-label={label}>
      {#each rows as r (r.key)}
        <div class="row" data-row={r.key}>
          <span class="rn">{r.name}</span>
          <span class="bar"><i class="a" style="width:{pct(r.a, r)}%"></i><small>{name(a)} {num(r.a)}</small></span>
          <span class="bar"><i class="b" style="width:{pct(r.b, r)}%"></i><small>{name(b)} {num(r.b)}</small></span>
        </div>
      {/each}
    </div>
    <ul class="leg">
      <li><i class="k a"></i>{name(a, 'long')}</li>
      <li><i class="k b"></i>{name(b, 'long')}</li>
    </ul>
  </AnaCard>
{/if}

<style>
  .pick {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .pick .sel {
    flex: 1 1 0;
    width: auto;
    font-size: var(--fs-small);
    padding: 6px 8px;
  }
  .pick span {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
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
