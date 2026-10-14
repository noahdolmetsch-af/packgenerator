<script>
  /**
   * Taschen-Setups (TS1, TS2): one bar of a setup's weight: bike, empty bags, gear (together the base
   * weight), then food and water (consumables, Noah «3a»: the empty bottle is gear, the water is not).
   * legend: also the four rows with their kg and where each number comes from (TS2).
   */
  import { t, tn, num } from '../i18n.svelte.js';

  let { calc, legend = false } = $props();

  const kg = (g) => num(Math.round(g / 100) / 10);
  const pct = (g) => (calc.totalG ? `${(g / calc.totalG) * 100}%` : '0');
  const things = $derived(calc.list.reduce((n, b) => n + b.items.filter((x) => !x.water && !x.food).length, 0));
  const food = $derived(calc.list.reduce((n, b) => n + b.items.filter((x) => x.food).length, 0));
  const water = $derived(calc.list.reduce((n, b) => n + b.items.filter((x) => x.water).length, 0));
  const parts = $derived([
    { key: 'bike', name: t('Bike'), from: t('from the bike data'), g: calc.bikeG },
    { key: 'bags', name: t('Bags empty'), from: tn(calc.list.length, '{n} bag from Gear', '{n} bags from Gear'), g: calc.bagsG },
    { key: 'content', name: t('Gear|setup'), from: tn(things, '{n} thing from Gear', '{n} things from Gear'), g: calc.contentG },
    { key: 'food', name: t('Food'), from: tn(food, '{n} thing', '{n} things'), g: calc.foodG ?? 0 },
    { key: 'water', name: t('Water'), from: tn(water, '{n} bottle filled', '{n} bottles filled'), g: calc.waterG },
  ].filter((p) => p.key !== 'food' || p.g));
</script>

<div class="sbar" role="img" aria-label={parts.map((p) => `${p.name} ${kg(p.g)} kg`).join(', ')}>
  {#each parts as p (p.key)}<i class="p-{p.key}" style:width={pct(p.g)}></i>{/each}
</div>
{#if legend}
  <ul class="sleg">
    {#each parts as p (p.key)}
      <li><i class="p-{p.key}" aria-hidden="true"></i><span>{p.name} <small>{p.from}</small></span><b class="num">{kg(p.g)} kg</b></li>
    {/each}
  </ul>
{/if}

<style>
  .sbar {
    display: flex;
    gap: 2px;
    height: 10px;
    border-radius: 99px;
    overflow: hidden;
    background: var(--paper-2);
  }
  .p-bike {
    background: var(--ink-2);
  }
  .p-bags {
    background: var(--l2);
  }
  .p-content {
    background: var(--ok);
  }
  .p-food {
    background: var(--l4);
  }
  .p-water {
    background: var(--l3);
  }
  .sleg {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .sleg li {
    display: grid;
    grid-template-columns: 12px minmax(0, 1fr) auto;
    align-items: baseline;
    gap: 8px;
  }
  .sleg i {
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }
  .sleg small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
