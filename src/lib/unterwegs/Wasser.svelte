<script>
  /**
   * Paket K #322 «Wasser- und Essen-Rechner»: the fold in «Mehr» on Unterwegs. Per day and for the whole
   * tour: litres to drink, refills with your bottles, calories as a rough guide, and the food of the
   * packing list against what the hours need. «Heiss» can be set by hand (a suggestion, changeable).
   * days: [{ label, hours, hot }]; bottles: litres on the bike; food: [{ id, name, perHours, qty }].
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, num } from '../i18n.svelte.js';
  import { waterFood } from './wasser.js';
  import { FUEL_KEY, valuesOf } from '../fuel.js';
  import { eatKcalH, WATER_KEY, drunkOn } from '../energie.js';
  import './unterwegs.css';

  let { days = [], bottles = 0, food = [] } = $props();
  let hot = $state(null); // null: from the weather; true/false: set by hand
  // the one energy rule (energie.js): your Verpflegung values
  const fuelQ = liveQuery(() => db.settings.get(FUEL_KEY));
  const fuel = $derived($fuelQ?.value ?? null);
  const v = $derived(valuesOf(fuel));
  // Soll gegen Ist (0.171): what you entered under Körperwerte for a day, read only
  const drunkQ = liveQuery(() => db.settings.get(WATER_KEY));
  const drunk = (date) => (date ? drunkOn($drunkQ?.value, date) : null);
  const res = $derived(waterFood({ days: days.map((d) => ({ ...d, hot: hot ?? d.hot })), bottles, food, fuel }));
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
        <li><span>{days[i].label}</span><span class="num">{num(d.hours)} h · {num(d.waterL)} L{d.refills != null ? ` · ${t('{n}× refill', { n: d.refills })}` : ''} · {num(d.kcal)} kcal{drunk(days[i].date) != null ? ` · ${t('entered: {l} L', { l: num(drunk(days[i].date)) })}` : ''}</span></li>
      {/each}
    </ul>
  {/if}
  {#if days.length === 1 && drunk(days[0].date) != null}<p class="tp-small" data-water-drunk>{t('The app reckons about {a} L for the ride; you entered {b} L for the whole day (Body values).', { a: num(res.days[0].waterL), b: num(drunk(days[0].date)) })}</p>{/if}
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
  <label class="hot"><input type="checkbox" checked={hot ?? days.some((d) => d.hot)} onchange={(e) => (hot = e.currentTarget.checked)} /> {t('Hot (from {c} °C): {l} L per hour', { c: num(v.hotC), l: num(v.hotLh) })}</label>
  <p class="uw-fine">{t('A guide, not a rule: {a}–{b} L by the temperature and about {kcal} kcal to eat per riding hour. Your body knows best.', { a: num(v.coolLh), b: num(v.hotLh), kcal: num(eatKcalH(v)) })} <a class="tp-link" href="#/trips/fuel">{t('Change your values')}</a></p>
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
