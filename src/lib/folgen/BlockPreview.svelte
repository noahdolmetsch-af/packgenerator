<script>
  /**
   * Paket B «Folgen vorher sehen»: under the building-block chips in Packen › «Add material», the link
   * «Before adding: see the effect». The sheet shows per block what it would add (things, grams, bags),
   * a bag that is missing on this bike, a packed bag to check again, and what earlier trips say.
   * «Add» uses Packen's own addBlock (with its Undo). Logic: folgen.js.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, tn, num, nameOf } from '../i18n.svelte.js';
  import { zoneName } from '../trips.js';
  import { backClose } from '../ui/backclose.js';
  import { Eye, X, TriangleAlert, History, ListChecks } from '@lucide/svelte';
  import NeedsSheet from '../bedarf/NeedsSheet.svelte';
  import { blockEffect, blockHistory, historyLine } from './folgen.js';
  import '../trip/trip.css';

  let { trip, items = [], blocks = [], skip = new Set(), slotOf = null, zones = [], onadd, change = null } = $props();
  let needs = $state(false); // Paket B «Packen nach Bedürfnis»: its sheet (bedarf/NeedsSheet.svelte)

  let open = $state(false);
  let dialog = $state();
  const tripsQ = liveQuery(() => db.trips.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const zoneOf = (slot) => zones.find((z) => z.key === slot);
  const bagLabel = (slot) => (slot === 'body' ? t('On the body') : zoneOf(slot) ? zoneName(zoneOf(slot)) : slot);
  const kg = (g) => (g >= 1000 ? `${num(Math.round(g / 100) / 10)} kg` : `${num(Math.round(g))} g`);

  const rows = $derived.by(() => {
    if (!open || !trip) return [];
    return blocks.filter((b) => b.n > 0).map((b) => {
      const eff = blockEffect(trip, items, b, { skip, slotOf: slotOf ? slotOf(trip) : null });
      const hist = blockHistory(b, items, $tripsQ ?? [], $debriefsQ ?? [], trip.id);
      return { b, eff, hist, line: historyLine(hist) };
    });
  });

  $effect(() => {
    if (open && dialog && !dialog.open) dialog.showModal();
  });
  async function add(b) {
    dialog?.close();
    await onadd?.(b);
  }
</script>

<div class="fp-links">
  {#if blocks.some((b) => b.n > 0)}<button type="button" class="tp-link fp-open" onclick={() => (open = true)} data-block-preview><Eye size={14} aria-hidden="true" />{t('Before adding: see the effect')}</button>{/if}
  {#if change}<button type="button" class="tp-link fp-open" onclick={() => (needs = true)} data-needs-open><ListChecks size={14} aria-hidden="true" />{t('Pack by need')}</button>{/if}
</div>
{#if needs}<NeedsSheet {trip} {items} {slotOf} {change} onclose={() => (needs = false)} />{/if}

{#if open}
  <dialog class="sheet from-below fp" bind:this={dialog} use:backClose onclose={() => (open = false)} aria-labelledby="fp-h" data-block-effects>
    <div class="fp-head">
      <h2 id="fp-h">{t('What a building block changes')}</h2>
      <button type="button" class="fp-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    <p class="fp-sub">{t('Nothing changes until you tap «Add».')}</p>
    <ul class="fp-list">
      {#each rows as r (r.b.key)}
        <li data-effect={r.b.key}>
          <div class="fp-top">
            <b>{r.b.label}</b>
            <span class="num">{[tn(r.eff.added.length, '{n} thing', '{n} things'), r.eff.g ? `+${kg(r.eff.g)}` : null, r.eff.unknown ? tn(r.eff.unknown, '{n} without weight', '{n} without weight') : null].filter(Boolean).join(' · ')}</span>
          </div>
          <p class="fp-line">{r.eff.added.slice(0, 5).map((e) => nameOf(e.item)).join(', ')}{r.eff.added.length > 5 ? ` ${t('and {n} more', { n: r.eff.added.length - 5 })}` : ''}</p>
          <p class="fp-line">{t('Into: {bags}', { bags: r.eff.bags.map((x) => `${bagLabel(x.slot)} (${x.n})`).join(', ') })}</p>
          {#if r.eff.missingBag.length}<p class="fp-warn" data-effect-missing><TriangleAlert size={14} aria-hidden="true" />{tn(r.eff.missingBag.length, '{n} thing has its usual bag not on this bike; it goes into another one.', '{n} things have their usual bag not on this bike; they go into another one.')}</p>{/if}
          {#if r.eff.recheck.length}<p class="fp-warn" data-effect-recheck><TriangleAlert size={14} aria-hidden="true" />{t('Already packed, check again: {bags}', { bags: r.eff.recheck.map(bagLabel).join(', ') })}</p>{/if}
          <p class="fp-hist" data-effect-history><History size={14} aria-hidden="true" />{t(r.line.key, r.line.vars)}{r.hist.missedNames.length ? ` (${r.hist.missedNames.slice(0, 3).join(', ')})` : ''}</p>
          <button type="button" class="btn sm" onclick={() => add(r.b)}>{t('Add {block}', { block: r.b.label })}</button>
        </li>
      {/each}
    </ul>
  </dialog>
{/if}

<style>
  .fp-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0 16px;
    margin-top: 6px;
  }
  .fp-open {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .fp-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }
  .fp-head h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .fp-x {
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
  .fp-sub {
    margin: 0 0 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .fp-list {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 65vh;
    overflow-y: auto;
  }
  .fp-list li {
    display: grid;
    gap: 4px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .fp-list li .btn {
    justify-self: start;
  }
  .fp-top {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 4px 12px;
    overflow-wrap: break-word;
  }
  .fp-top .num {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .fp-line,
  .fp-warn,
  .fp-hist {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .fp-warn {
    display: flex;
    gap: 6px;
    align-items: flex-start;
    color: var(--warn);
  }
  .fp-hist {
    display: flex;
    gap: 6px;
    align-items: flex-start;
  }
  .fp-warn :global(svg),
  .fp-hist :global(svg) {
    flex: none;
    margin-top: 2px;
  }
</style>
