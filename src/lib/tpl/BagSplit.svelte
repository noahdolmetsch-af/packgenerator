<script>
  /**
   * v0.39.0 (AP28, Noah 5a): the bike of a template is optional. "Without bike": the template stays a
   * plain list, the bike is chosen with the trip. With a bike: the items go into the bike's bags by
   * their usual bag (automatic); tapping a bag shows its items to move them (tpl.slots).
   * onchange(fn): fn gets the template and returns the changed one.
   */
  import { ChevronRight } from '@lucide/svelte';
  import { knownWeight } from '../gear.js';
  import { zonesOf } from './view.js';
  import { t, tn, nameOf } from '../i18n.svelte.js';

  let { tpl, items, setsValue = [], bags = [], bikes = [], onchange } = $props();
  const zones = $derived(tpl.bikeId ? zonesOf(tpl, items, setsValue, bags) : []);
  const places = (b) => Object.values(b.setup ?? {}).filter(Boolean).length;
  let openZone = $state(null);
  const bagOf = (id) => bags.find((b) => b.id === id);
  function pickBike(b) {
    if (!b) return onchange?.((x) => ({ ...x, bikeId: null, setup: {} }));
    onchange?.((x) => ({ ...x, bikeId: b.id, setup: Object.fromEntries(Object.entries(b.setup ?? {}).filter(([, v]) => v)) }));
  }
  const move = (itemId, key) => onchange?.((x) => ({ ...x, slots: { ...(x.slots ?? {}), [itemId]: key } }));
  const weight = (z) => (z.n ? knownWeight(z.g, z.missing) : '–');
</script>

<div class="bs">
  <div class="sh"><span>{t('Bike')}</span><small>{t('optional|bike')}</small></div>
  <ul class="opts" role="radiogroup" aria-label={t('Bike')}>
    <li>
      <button type="button" class="opt" role="radio" aria-checked={!tpl.bikeId} onclick={() => pickBike(null)}>
        <span class="rad" aria-hidden="true"></span><span class="t">{t('Without bike')}<small>{t('You choose the bike with the trip')}</small></span>
      </button>
    </li>
    {#each bikes as b (b.id)}
      <li>
        <button type="button" class="opt" role="radio" aria-checked={tpl.bikeId === b.id} onclick={() => pickBike(b)}>
          <span class="rad" aria-hidden="true"></span><span class="t">{b.name}<small>{tn(places(b), '{n} bag place', '{n} bag places')}</small></span>
        </button>
      </li>
    {/each}
  </ul>
  {#if !tpl.bikeId}
    <p class="note">{t('Without a bike the template stays a plain list. The bags come with the trip.')}</p>
  {:else}
    <div class="sh"><span>{t('Spread over the bags')}</span><small>{t('automatic')}</small></div>
    <ul class="bags">
      {#each zones as z (z.key)}
        <li>
          <button type="button" class="zone" aria-expanded={openZone === z.key} onclick={() => (openZone = openZone === z.key ? null : z.key)}>
            <span class="t">{z.name}{#if z.bag}<small>{z.place}{#if z.volumeL}{' · '}{z.volumeL} L{/if}</small>{/if}</span>
            <span class="n num">{z.n}</span><span class="w num">{weight(z)}</span><ChevronRight class="chev" size={18} aria-hidden="true" />
          </button>
          {#if openZone === z.key}
            <ul class="moves">
              {#each z.rows as r (r.itemId)}
                <li>
                  <span class="t">{nameOf(r.item)}{#if r.qty > 1}{' '}<b class="num">{r.qty}×</b>{/if}</span>
                  <select class="sel" aria-label={t('Move {name}', { name: nameOf(r.item) })} value={z.key} onchange={(e) => move(r.itemId, e.currentTarget.value)}>
                    {#each zones as o (o.key)}<option value={o.key}>{o.name}</option>{/each}
                  </select>
                </li>
              {:else}
                <li class="empty">{t('Empty')}</li>
              {/each}
            </ul>
          {/if}
        </li>
      {/each}
    </ul>
    <p class="note">{t('Every item goes into its usual bag. Tap a bag to move items.')}</p>
    {#if tpl.setup && Object.values(tpl.setup).some((id) => id && !bagOf(id))}<p class="note">{t('A bag of this template no longer exists.')}</p>{/if}
  {/if}
</div>

<style>
  .bs {
    display: grid;
    gap: 2px;
  }
  .sh {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    font-size: 14px;
    font-weight: 700;
    color: var(--ink-2);
    margin: 8px 0 2px;
  }
  .sh small {
    font-weight: 600;
    color: var(--ink-3);
  }
  .opts,
  .bags,
  .moves {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .opt,
  .zone {
    width: 100%;
    display: grid;
    align-items: center;
    gap: 4px 10px;
    min-height: 52px;
    border: 0;
    border-bottom: 1px solid var(--line);
    background: none;
    color: var(--ink);
    font: 400 16px var(--font-body);
    text-align: left;
    padding: 4px 0;
    cursor: pointer;
  }
  .opt {
    grid-template-columns: 24px minmax(0, 1fr);
  }
  .zone {
    grid-template-columns: minmax(0, 1fr) auto auto 20px;
  }
  .rad {
    width: 22px;
    height: 22px;
    border: 2px solid var(--line-strong);
    border-radius: 50%;
    box-sizing: border-box;
  }
  .opt[aria-checked='true'] .rad {
    border: 7px solid var(--ink);
  }
  .t {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .t small {
    display: block;
    color: var(--ink-3);
    font-size: 14px;
  }
  .n {
    color: var(--ink-3);
    font-size: 14px;
    text-align: right;
  }
  .w {
    text-align: right;
    min-width: 64px;
    white-space: nowrap;
  }
  .zone :global(.chev) {
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  .zone[aria-expanded='true'] :global(.chev) {
    transform: rotate(90deg);
  }
  .moves li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 150px);
    align-items: center;
    gap: 8px;
    min-height: 48px;
    border-bottom: 1px solid var(--line);
    padding-left: 12px;
    font-size: 15px;
  }
  .moves .empty {
    color: var(--ink-3);
    display: block;
    padding: 12px;
  }
  .note {
    margin: 6px 0 0;
    font-size: 14px;
    color: var(--ink-3);
  }
</style>
