<script>
  /**
   * Paket K #322 «Wasser- und Essen-Rechner»: the fold in «Mehr» on Unterwegs. Per day and for the whole
   * tour: litres to drink, refills with your bottles, calories as a rough guide, and the food of the
   * packing list against what the hours need. «Heiss» can be set by hand (a suggestion, changeable).
   * days: [{ label, hours, hot }]; bottles: litres on the bike; food: [{ id, name, perHours, qty }].
   */
  import { t, num } from '../i18n.svelte.js';
  import { waterFood } from './wasser.js';
  import { HOT_C } from '../blockplan.js';
  import './unterwegs.css';

  let { days = [], bottles = 0, food = [] } = $props();
  let hot = $state(null); // null: from the weather; true/false: set by hand
  const res = $derived(waterFood({ days: days.map((d) => ({ ...d, hot: hot ?? d.hot })), bottles, food }));
</script>

<div class="uw-water" data-water>
  <div class="uw-kv">
    <div><b class="num">{num(res.total.waterL)} L</b><span>{t('to drink')}</span></div>
    <div><b class="num">{num(res.total.kcal)}</b><span>{t('kcal, roughly')}</span></div>
    <div><b class="num">{num(res.total.hours)} h</b><span>{t('riding')}</span></div>
    {#if res.total.refills != null}<div><b class="num">{res.total.refills}×</b><span>{t('refill ({l} L bottles)', { l: num(bottles) })}</span></div>{/if}
  </div>
  {#if res.days.length > 1}
    <ul class="dl">
      {#each res.days as d, i (i)}
        <li><span>{days[i].label}</span><span class="num">{num(d.hours)} h · {num(d.waterL)} L{d.refills != null ? ` · ${t('{n}× refill', { n: d.refills })}` : ''} · {num(d.kcal)} kcal</span></li>
      {/each}
    </ul>
  {/if}
  {#if res.food.length}
    <h3 class="uw-h3">{t('Food in the packing list')}</h3>
    <ul class="dl">
      {#each res.food as f (f.id)}
        <li class:warn={f.short}><span>{f.name}</span><span class="num">{t('{need} needed · {have} packed', { need: f.need, have: f.have })}{f.short ? ` · ${t('{n} missing', { n: f.short })}` : ''}</span></li>
      {/each}
    </ul>
  {:else}
    <p class="tp-small tp-muted">{t('Food with «one per N hours» in the packing list is counted here.')}</p>
  {/if}
  <label class="hot"><input type="checkbox" checked={hot ?? days.some((d) => d.hot)} onchange={(e) => (hot = e.currentTarget.checked)} /> {t('Hot (from {c} °C): {l} L more per hour', { c: HOT_C, l: '0.25' })}</label>
  <p class="uw-fine">{t('A guide, not a rule: 0.5 L and about 250 kcal per riding hour. Your body knows best.')}</p>
</div>

<style>
  .dl {
    list-style: none;
    margin: 10px 0 0;
    padding: 0;
  }
  .dl li {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 4px 12px;
    padding: 6px 0;
    border-bottom: 1px solid var(--line);
  }
  .dl li.warn span:last-child {
    font-weight: 600;
  }
  .hot {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
  }
</style>
