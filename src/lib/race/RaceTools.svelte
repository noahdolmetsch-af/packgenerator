<script>
  /**
   * «Werkzeug passend zum Velo» (Noah 27.10.2026, idea 7 of the ultra analysis): on the page «Rennen
   * detailliert planen», the tools and spares for this race, made from the race's bike (tools-lib.js) and
   * ticked off when packed. Your own list per race (stored.tools): add, change, delete with Undo, sort
   * with arrows and dragging; «Suggestions for the bike again» makes them new and keeps your ticks.
   */
  import { Wrench, RotateCcw } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import EditList from './EditList.svelte';
  import { toolsOf, fresh } from './tools-lib.js';
  import { tyreSetup } from '../workshop.js';
  import { db } from '../db.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t } from '../i18n.svelte.js';

  let { ctx } = $props();
  const bikeId = $derived(ctx.trip.bikeId ?? null);
  const bikeQ = $derived(liveQuery(async () => (bikeId ? { bike: (await db.bikes.get(bikeId)) ?? null, visits: await db.visits.where('bikeId').equals(bikeId).toArray() } : { bike: null, visits: [] })));
  const bike = $derived($bikeQ?.bike ?? null);
  const tyres = $derived(bike ? tyreSetup(bike, $bikeQ?.visits ?? []) : undefined);
  const rows = $derived(toolsOf(ctx.stored, bike, tyres, t));
  const done = $derived(rows.filter((r) => r.done).length);
  const save = (list) => ctx.save({ tools: list.map((r) => ({ id: r.id, text: r.text, why: r.why ?? '', done: r.done === true })) });
  const tick = (id, v) => save(rows.map((r) => (r.id === id ? { ...r, done: v } : r)));
  function again() {
    const before = ctx.stored.tools;
    save(fresh(bike, tyres, t, rows));
    offerDone(t('The suggestions for the bike are new.'), () => ctx.save({ tools: before }));
  }
</script>

<section class="rc-box" aria-labelledby="tl-h" data-race-tools>
  <h2 id="tl-h" class="rc-h2"><Wrench size={18} aria-hidden="true" /> {t('Tools for this bike')}</h2>
  <p class="rc-note">
    {#if bike}{t('Made from your bike «{name}»: tyres, chain, brakes. Tick off what is packed.', { name: bike.name })}{:else}{t('The race has no bike yet, so these are general suggestions. Tick off what is packed.')}{/if}
  </p>
  {#if rows.length}
    <p class="tl-sum" role="status" data-tools-sum>{t('{done} of {of} packed', { done, of: rows.length })}</p>
    <ul class="tl-list" data-tools-list>
      {#each rows as r (r.id)}
        <li class:tl-done={r.done}>
          <label class="tl-tick">
            <input type="checkbox" checked={r.done} onchange={(e) => tick(r.id, e.currentTarget.checked)} data-tools-done={r.id} />
            <span class="tl-text"><b>{r.text}</b>{#if r.why}<small>{r.why}</small>{/if}</span>
          </label>
        </li>
      {/each}
    </ul>
  {/if}
  <details class="tl-more">
    <summary data-tools-edit>{t('Change the list')}</summary>
    <EditList {rows} onchange={save} label={t('Tool or spare')} addLabel={t('Add')} placeholder={t('e.g. Spoke key')} name={t('Tool or spare')} testid="tools" blank={{ why: '', done: false }} />
    <button type="button" class="btn sm" onclick={again} data-tools-again><RotateCcw size={16} aria-hidden="true" />{t('Suggestions for the bike again')}</button>
  </details>
</section>

<style>
  .tl-sum {
    margin: 0;
    font-weight: 600;
  }
  .tl-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 2px;
  }
  .tl-tick {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-height: 44px;
    padding: 6px 0;
    cursor: pointer;
  }
  .tl-tick input {
    flex: none;
    width: 20px;
    height: 20px;
    margin-top: 2px;
  }
  .tl-text {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .tl-text small {
    color: var(--ink-2);
  }
  .tl-done b {
    color: var(--ink-2);
    font-weight: 500;
  }
  .tl-more {
    display: grid;
    gap: 8px;
  }
  .tl-more summary {
    cursor: pointer;
    min-height: 44px;
    display: flex;
    align-items: center;
    font-weight: 600;
  }
</style>
