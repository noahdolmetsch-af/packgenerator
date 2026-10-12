<script>
  /**
   * v0.102.0 Design-Refresh P4 «Touren» (T3 «Gewicht», approved 12.10.2026 «Touren T1–T6 freigegeben»):
   * the weight of a trip as a light card: the gear without food and water in big, one bar split by place
   * (each bag, the bike, on me), the places with their weight, and the heaviest single item. Food and
   * water and the items without a weight stay honest in one quiet line below. Read-only.
   */
  import { weightByPlace } from '../touren.js';
  import { isConsumable } from '../gear.js';
  import { zoneName } from '../trips.js';
  import { t, tn, locale, nameOf } from '../i18n.svelte.js';

  let { trip, stats, itemsById } = $props();

  const COLORS = ['var(--hi)', 'var(--hi-bright)', 'var(--bar)', 'var(--l2)', 'var(--line)', 'var(--l3)', 'var(--l1)'];
  const kgN = (g) => (g / 1000).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const eats = (i) => isConsumable(i) || i.waterL > 0;
  const w = $derived(weightByPlace(stats, itemsById, eats));
  const zones = $derived(Object.fromEntries((stats?.zones ?? []).map((z) => [z.key, z])));
  const name = (key) => trip.purpose?.[key] || (zones[key] ? (key === 'body' ? t('On me') : zoneName(zones[key])) : key);
  const rows = $derived(w.rows.filter((r) => r.g > 0 || r.missing).map((r, n) => ({ ...r, c: COLORS[n % COLORS.length], name: name(r.key) })));
</script>

<section class="wc" aria-labelledby="wc-h">
  <h2 id="wc-h">{t('Weight')}</h2>
  <p class="sub">{t('without food and water')}</p>
  <div class="card body">
    <p class="big num"><b>{w.missing ? '~' : ''}{kgN(w.total)}</b> kg</p>
    {#if w.total > 0}
      <div class="bar" aria-hidden="true">{#each rows as r (r.key)}{#if r.g}<i style:flex={r.g} style:background={r.c}></i>{/if}{/each}</div>
      <ul class="rows">
        {#each rows as r (r.key)}<li><span class="dot" style:background={r.c} aria-hidden="true"></span><span class="nm">{r.name}</span><span class="g num">{r.missing && !r.g ? t('not weighed') : `${r.missing ? '~' : ''}${kgN(r.g)} kg`}</span></li>{/each}
      </ul>
    {/if}
    <p class="foot">
      {#if w.heaviest}<span>{t('Heaviest item: {name} {kg} kg', { name: nameOf(w.heaviest.item), kg: kgN(w.heaviest.g) })}</span>{/if}
      {#if w.food}<span>{t('Food and water: {kg} kg', { kg: kgN(w.food) })}</span>{/if}
      {#if w.missing}<span>{tn(w.missing, '{n} item not weighed', '{n} items not weighed')}</span>{/if}
    </p>
  </div>
</section>

<style>
  .wc {
    min-width: 0;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .sub {
    margin: 2px 0 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .body {
    display: grid;
    gap: 12px;
  }
  .big {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .big b {
    font: 700 var(--fs-title) / 1.1 var(--font-body);
  }
  .bar {
    display: flex;
    gap: 2px;
    height: 10px;
    border-radius: 5px;
    overflow: hidden;
  }
  .rows {
    display: grid;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rows li {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 26px;
    font-size: var(--fs-small);
  }
  .dot {
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 3px;
  }
  .nm {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .g {
    flex: none;
    color: var(--ink-2);
  }
  .foot {
    display: grid;
    gap: 2px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .foot:empty {
    display: none;
  }
</style>
