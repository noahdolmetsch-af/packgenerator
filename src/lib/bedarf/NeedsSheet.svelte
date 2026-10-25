<script>
  /**
   * Paket B «Packen nach Bedürfnis»: the sheet behind «Pack by need» in Packen › «Add material».
   * Tap the needs, set days and people, choose a variant (light, comfortable, little effort); the app
   * fills each need from your gear with amounts and shows the grams of each variant. «Take» adds it in
   * one change (Packen's Undo). Logic: bedarf.js.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, tn, num, nameOf } from '../i18n.svelte.js';
  import { backClose } from '../ui/backclose.js';
  import { X, TriangleAlert } from '@lucide/svelte';
  import { NEEDS, VARIANTS, planNeeds, variantGrams, usedCount, applyPlan } from './bedarf.js';

  let { trip, items = [], slotOf = null, change, onclose } = $props();

  let dialog = $state();
  const tripsQ = liveQuery(() => db.trips.toArray());
  // svelte-ignore state_referenced_locally
  let picked = $state(trip?.needs?.length ? [...trip.needs] : []);
  // svelte-ignore state_referenced_locally
  let people = $state(Math.max(1, Number(trip?.people) || 1));
  // svelte-ignore state_referenced_locally
  let variant = $state(trip?.needVariant ?? 'light');
  const days = $derived(Math.max(1, Number(trip?.days) || 1));
  const used = $derived(usedCount($tripsQ ?? [], trip?.id));
  const opts = $derived({ variant, days, people, used });
  const plan = $derived(planNeeds(picked, items, opts));
  const grams = $derived(variantGrams(picked, items, opts));
  const kg = (g) => (g >= 1000 ? `${num(Math.round(g / 100) / 10)} kg` : `${num(Math.round(g))} g`);
  const diff = (k) => (k === 'light' || !picked.length ? '' : grams[k] - grams.light > 0 ? `+${kg(grams[k] - grams.light)}` : t('same weight'));

  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const toggle = (k) => (picked = picked.includes(k) ? picked.filter((x) => x !== k) : [...picked, k]);
  async function take() {
    const p = $state.snapshot(plan);
    const slot = slotOf ? slotOf(trip) : () => 'body';
    await change((cur) => ({ entries: applyPlan(cur.entries ?? [], p, slot), needs: [...picked], people, needVariant: variant }));
    dialog.close();
  }
</script>

<dialog class="sheet from-below nd" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="nd-h" data-needs>
  <div class="nd-head">
    <h2 id="nd-h">{t('Pack by need')}</h2>
    <button type="button" class="nd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <p class="nd-sub">{t('Say what you need; the app fills it from your gear. Shared things like the tent count once.')}</p>

  <fieldset class="nd-needs">
    <legend>{t('What do you need?')}</legend>
    {#each NEEDS as n (n.key)}
      <button type="button" class="nd-chip" aria-pressed={picked.includes(n.key)} onclick={() => toggle(n.key)} data-need={n.key}>{t(n.name)}</button>
    {/each}
  </fieldset>

  <div class="nd-row">
    <span>{tn(days, '{n} day', '{n} days')}</span>
    <label class="nd-people">{t('People')}
      <span class="nd-step">
        <button type="button" aria-label={t('One person less')} disabled={people <= 1} onclick={() => (people = Math.max(1, people - 1))}>−</button>
        <b class="num" data-people>{people}</b>
        <button type="button" aria-label={t('One person more')} disabled={people >= 12} onclick={() => (people = Math.min(12, people + 1))}>+</button>
      </span>
    </label>
  </div>

  {#if picked.length}
    <div class="nd-vars" role="radiogroup" aria-label={t('Variant')}>
      {#each VARIANTS as v (v.key)}
        <button type="button" class="nd-var" role="radio" aria-checked={variant === v.key} onclick={() => (variant = v.key)} data-variant={v.key}>
          <b>{t(v.name)}</b><small>{t(v.sub)}</small><small class="num">{kg(grams[v.key])}{diff(v.key) ? ` · ${diff(v.key)}` : ''}</small>
        </button>
      {/each}
    </div>
    <ul class="nd-list">
      {#each plan.rows as r (r.need.key)}
        <li data-need-row={r.need.key}>
          <b>{t(r.need.name)}</b>
          <span>{r.items.map((x) => (x.qty > 1 ? `${x.qty}× ${nameOf(x.item)}` : nameOf(x.item))).join(', ')}</span>
          <small class="num">{kg(r.g)}{r.unknown ? ` · ${tn(r.unknown, '{n} without weight', '{n} without weight')}` : ''}{r.need.share && people > 1 ? ` · ${t('shared, once')}` : ''}</small>
        </li>
      {/each}
      {#each plan.empty as n (n.key)}
        <li class="nd-empty" data-need-empty={n.key}><TriangleAlert size={14} aria-hidden="true" /><span>{t('Nothing of yours for «{need}» yet. Give a thing the block in Material, or add it by hand.', { need: t(n.name) })}</span></li>
      {/each}
    </ul>
    <div class="nd-foot">
      <button type="button" class="btn hi" disabled={!plan.rows.length} onclick={take} data-needs-take>{t('Take it onto the list')}</button>
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
    </div>
    <p class="nd-sub">{t('Things already on the list stay; only a bigger amount changes. Undo in Packen.')}</p>
  {:else}
    <p class="nd-sub">{t('Tap one or more needs.')}</p>
  {/if}
</dialog>

<style>
  .nd-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }
  .nd-head h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .nd-x {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .nd-sub {
    margin: 4px 0 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .nd-needs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 12px;
    padding: 0;
    border: 0;
  }
  .nd-needs legend {
    margin-bottom: 6px;
    font-weight: 600;
  }
  .nd-chip {
    min-height: 40px;
    padding: 0 12px;
    border: 1px solid var(--line-strong);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .nd-chip[aria-pressed='true'] {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--paper);
  }
  .nd-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 12px;
    color: var(--ink-2);
  }
  .nd-people {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .nd-step {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .nd-step button {
    width: 44px;
    height: 44px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-body) var(--font-body);
    cursor: pointer;
  }
  .nd-step b {
    min-width: 2ch;
    text-align: center;
  }
  .nd-vars {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 6px;
    margin-bottom: 10px;
  }
  .nd-var {
    display: grid;
    gap: 2px;
    padding: 8px 10px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .nd-var[aria-checked='true'] {
    border-color: var(--accent);
    box-shadow: inset 0 0 0 1px var(--accent);
  }
  .nd-var small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .nd-list {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 40vh;
    overflow-y: auto;
  }
  .nd-list li {
    display: grid;
    gap: 2px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
    overflow-wrap: break-word;
  }
  .nd-list small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .nd-list .nd-empty {
    display: flex;
    gap: 6px;
    color: var(--warn);
    font-size: var(--fs-small);
  }
  .nd-empty :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .nd-foot {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }
</style>
