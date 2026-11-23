<script>
  /**
   * «Abendblick» (Noah 23.11.2026 «G2»): the evening of a tour of several days: a tap on a thing says «not used»,
   * another «broken», another «used» again; below, what was missing so far. The marks are the ones of the debrief
   * (tourgear.js setMark, addMissing), so nothing has to be entered twice afterwards. Rules: abendblick.js.
   */
  import { liveQuery } from 'dexie';
  import { Check, Ban, TriangleAlert, Plus, X } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, tn, num, nameOf } from '../i18n.svelte.js';
  import { saveFailed } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { setMark, addMissing, dropMissing, putMissingBack, MARK_NAMES } from '../touren/tourgear.js';
  import { abendRows, abendSummary, NEXT_MARK } from './abendblick.js';

  let { trip, items = [] } = $props();
  const debQ = liveQuery(() => db.debriefs.get(trip.id));
  const rows = $derived(abendRows(trip, $debQ ?? null, items, nameOf));
  const sum = $derived(abendSummary(rows));
  const missing = $derived(($debQ?.missing ?? []).filter((m) => !m.food));
  const ICON = { used: Check, unused: Ban, broken: TriangleAlert };
  let miss = $state('');

  async function tap(r) {
    try {
      await setMark(db, trip, r.id, NEXT_MARK[r.mark]);
    } catch (err) {
      saveFailed(err);
    }
  }
  async function addMiss() {
    if (!miss.trim()) return;
    try {
      await addMissing(db, trip, miss, {});
      miss = '';
    } catch (err) {
      saveFailed(err);
    }
  }
  async function dropMiss(m) {
    const gone = await dropMissing(db, trip, m.id);
    offerDone(t('"{name}" removed.', { name: m.name }), () => putMissingBack(db, trip, gone));
  }
  const kg = (g) => (g < 950 ? `${num(Math.round(g / 10) * 10)} g` : `${num(Math.round(g / 100) / 10)} kg`);
</script>

<div class="ab" data-abend>
  <p class="why">{t('Tap a thing once for «not used», twice for «broken», three times for «used» again. What you leave alone counts as used. Tomorrow you can still change it.')}</p>
  {#if sum.unused || sum.broken}
    <p class="sum" role="status" data-abend-sum>
      {#if sum.unused}{tn(sum.unused, 'Not used so far: {n} thing', 'Not used so far: {n} things')}{#if sum.g}{` · ${kg(sum.g)}`}{/if}{/if}{#if sum.unused && sum.broken}{' · '}{/if}{#if sum.broken}{tn(sum.broken, '{n} broken', '{n} broken')}{/if}
    </p>
  {/if}
  <ul class="rows">
    {#each rows as r (r.id)}
      {@const Icon = ICON[r.mark]}
      <li data-abend-row={r.id} data-mark={r.mark}>
        <button type="button" class="row {r.mark}" aria-label={t('{name}: {mark}. Tap to change.', { name: r.name, mark: t(MARK_NAMES[r.mark]) })} onclick={() => tap(r)}>
          <span class="nm">{r.name}{#if r.qty > 1}<span class="q num"> × {r.qty}</span>{/if}</span>
          <span class="st"><Icon size={14} aria-hidden="true" />{t(MARK_NAMES[r.mark])}</span>
        </button>
      </li>
    {/each}
  </ul>
  <div class="miss" data-abend-missing>
    <h4>{t('What was missing?')}</h4>
    {#if missing.length}
      <ul class="ml">
        {#each missing as m (m.id)}
          <li><span>{m.name}</span><button type="button" class="dx" aria-label={t('Take «{name}» out', { name: m.name })} onclick={() => dropMiss(m)}><X size={14} aria-hidden="true" /></button></li>
        {/each}
      </ul>
    {/if}
    <form class="add" onsubmit={(e) => { e.preventDefault(); addMiss(); }}>
      <input class="inp" type="text" bind:value={miss} placeholder={t('e.g. gloves, a second tube')} aria-label={t('What was missing?')} data-abend-input />
      <button type="submit" class="btn" data-abend-add><Plus size={16} aria-hidden="true" />{t('Add')}</button>
    </form>
  </div>
</div>

<style>
  .ab {
    display: grid;
    gap: 10px;
  }
  .why {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .sum {
    margin: 0;
    font-weight: 600;
  }
  .rows,
  .ml {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .rows li {
    border-top: 1px solid var(--line);
  }
  .rows li:first-child {
    border-top: 0;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    min-height: 44px;
    padding: 6px 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .nm {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .q {
    color: var(--ink-3);
  }
  .st {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 32px;
    padding: 0 10px;
    border: 1px solid var(--line);
    border-radius: 999px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .row.unused .st {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .row.broken .st {
    border-color: var(--bad);
    background: var(--bad);
    color: var(--paper);
  }
  .miss h4 {
    margin: 0 0 4px;
    font-size: var(--fs-body);
  }
  .ml li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 44px;
    overflow-wrap: break-word;
  }
  .dx {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .add {
    display: flex;
    gap: 8px;
  }
  .add .inp {
    flex: 1;
    min-width: 0;
  }
</style>
