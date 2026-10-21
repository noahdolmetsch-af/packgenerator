<script>
  /**
   * v0.51.0 «Im Flow»: the three rings, rolling over the last 7 days: Bewegen (outside, orange),
   * Achtsam (teal), Erholung (inside, blue). legend: the three rows with the numbers beside them.
   * v0.105.0 Design-Refresh P8 «Aktiv» (A1): `quiet` writes the numbers as a quiet line under the name
   * («2 von 4 Ziele im Soll · letzte 7 Tage») instead of the big numbers.
   */
  import { ringFill } from '../flow.js';
  import { t } from '../i18n.svelte.js';
  let { rings, size = 136, legend = true, compact = false, quiet = false } = $props();

  const ROWS = [
    { key: 'move', name: 'Move|ring', unit: 'goals on track' },
    { key: 'mind', name: 'Mindful|ring', unit: 'days' },
    { key: 'rest', name: 'Recovery|ring', unit: 'units' },
  ];
  const W = 14;
  const radius = (i) => 68 - W / 2 - i * (W + 5);
  const label = $derived(ROWS.map((r) => `${t(r.name)} ${rings[r.key].n} / ${rings[r.key].of}`).join(', '));
</script>

<div class="rings" class:compact class:quiet>
  <svg width={size} height={size} viewBox="0 0 136 136" role="img" aria-label={label}>
    {#each ROWS as r, i (r.key)}
      {@const rad = radius(i)}
      {@const c = 2 * Math.PI * rad}
      {@const f = ringFill(rings[r.key])}
      <circle cx="68" cy="68" r={rad} fill="none" class="soft {r.key}" stroke-width={W} />
      {#if f > 0}<circle cx="68" cy="68" r={rad} fill="none" class="arc {r.key}" stroke-width={W} stroke-linecap="round" stroke-dasharray="{Math.max(0.01, f * c)} {c}" transform="rotate(-90 68 68)" />{/if}
    {/each}
  </svg>
  {#if legend}
    <ul class="lg">
      {#each ROWS as r (r.key)}
        <li>
          <span class="dot {r.key}" aria-hidden="true"></span>
          {#if quiet}
            <span class="nm"><b>{t(r.name)}</b><small class="num">{rings[r.key].of ? `${t('{n} of {m}', { n: rings[r.key].n, m: rings[r.key].of })} ${t(r.unit)}` : '–'} · {t('last 7 days')}</small></span>
          {:else}
          <span class="nm"><b>{t(r.name)}</b>{#if !compact}<small>{t(r.unit)}</small>{/if}</span>
          <span class="v {r.key} num">{rings[r.key].of ? rings[r.key].n : '–'}<span class="of">/{rings[r.key].of || '–'}</span></span>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .rings {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 0;
  }
  svg {
    flex: none;
    display: block;
    max-width: 34vw;
    height: auto;
  }
  @media (max-width: 359px) {
    .rings {
      gap: 10px;
    }
    .nm small {
      display: none;
    }
    .v {
      font-size: var(--fs-section);
    }
  }
  .soft.move {
    stroke: var(--hi-soft);
  }
  .soft.mind {
    stroke: var(--l4-soft);
  }
  .soft.rest {
    stroke: var(--l3-soft);
  }
  .arc.move {
    stroke: var(--hi);
  }
  .arc.mind {
    stroke: var(--l4);
  }
  .arc.rest {
    stroke: var(--l3);
  }
  .lg {
    flex: 1;
    min-width: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .lg li {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 50px;
    border-top: 1px solid var(--line);
  }
  .lg li:first-child {
    border-top: 0;
  }
  .quiet {
    gap: var(--sp-5);
  }
  .quiet .lg li {
    min-height: 0;
    padding: 6px 0;
    border-top: 0;
  }
  .quiet .nm small {
    display: block;
    color: var(--ink-3);
  }
  .compact .lg li {
    min-height: 34px;
    border-top: 0;
  }
  .dot {
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  .dot.move {
    background: var(--hi);
  }
  .dot.mind {
    background: var(--l4);
  }
  .dot.rest {
    background: var(--l3);
  }
  .nm {
    flex: 1;
    min-width: 0;
    line-height: 1.25;
  }
  .nm b {
    display: block;
    font-weight: 500;
  }
  .nm small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .v {
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: var(--fs-page);
    line-height: 1;
  }
  .compact .v {
    font-size: var(--fs-section);
  }
  .v.move {
    color: var(--hi);
  }
  .v.mind {
    color: var(--l4);
  }
  .v.rest {
    color: var(--l3);
  }
  .of {
    color: var(--ink-3);
  }
</style>
