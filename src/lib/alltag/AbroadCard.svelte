<script>
  /**
   * Paket V «Alltag», Ideen 275 and 276 (Reise-Links, 19.10.2026): at a trip abroad, under «Pass, country,
   * getting there»: the emergency numbers of the country (public start numbers, the person changes, adds
   * and deletes them per country; «Back to the start numbers» undoes it), the travel insurance from
   * Ich › Alltag › Verträge (marked «travel»), and the currency of the country with a tap to the converter
   * of the Werkzeugkasten (it opens set to that currency). Only when the trip has a country other than CH.
   */
  import { Phone, Plus, X, Pencil, Coins, ShieldPlus, RotateCcw } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { change, restore, KEYS } from '../alltagdb.js';
  import { SOS_KEY, CONTRACTS_KEY, sosOf, sosOwn, telOf, currencyOf, travelCover } from '../alltag.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t } from '../i18n.svelte.js';

  let { country } = $props();
  const q = liveQuery(async () => ({ sos: (await db.settings.get(SOS_KEY))?.value ?? {}, contracts: (await db.settings.get(CONTRACTS_KEY))?.value ?? [] }));
  const c = $derived(String(country || 'CH').toUpperCase());
  const nums = $derived(sosOf(c, $q?.sos));
  const own = $derived(sosOwn(c, $q?.sos));
  const cover = $derived(travelCover($q?.contracts));
  const cur = $derived(currencyOf(c));
  // a start number's label is English source text (t()); a typed one is the person's own words
  const label = (x) => (x.own ? x.label : t(x.label));

  let editing = $state(false);
  let rows = $state([]);
  function startEdit() {
    rows = nums.map((x) => ({ label: label(x), no: x.no }));
    editing = true;
  }
  async function saveRows() {
    const clean = rows.map((r) => ({ label: r.label.trim(), no: r.no.trim(), own: true })).filter((r) => r.no);
    const before = await change(KEYS.sos, {}, (all) => ({ ...all, [c]: clean }));
    editing = false;
    offerDone(t('Saved.'), () => restore(KEYS.sos, before));
  }
  async function backToStart() {
    const before = await change(KEYS.sos, {}, (all) => Object.fromEntries(Object.entries(all).filter(([k]) => k !== c)));
    editing = false;
    offerDone(t('The start numbers are back.'), () => restore(KEYS.sos, before));
  }
  async function toConverter() {
    try {
      const row = await db.settings.get('tools.money');
      await db.settings.put({ key: 'tools.money', value: { ...(row?.value ?? {}), from: cur } });
    } catch {
      /* the converter starts with its last currency */
    }
    location.hash = '#/me/tools/money';
  }
</script>

<div class="ab" data-abroad={c}>
  <span class="sub">{t('Abroad')}</span>
  <div class="ab-box">
    <b class="ab-h"><Phone size={16} aria-hidden="true" />{t('Emergency numbers')}</b>
    {#if editing}
      {#each rows as r, i (i)}
        <div class="ab-edit">
          <input class="inp" maxlength="40" bind:value={r.label} aria-label={t('What')} />
          <input class="inp ab-no" maxlength="20" inputmode="tel" bind:value={r.no} aria-label={t('Number')} />
          <button type="button" class="ib" aria-label={t('Delete {name}', { name: r.label || r.no })} onclick={() => (rows = rows.filter((_, n) => n !== i))}><X size={16} aria-hidden="true" /></button>
        </div>
      {/each}
      <div class="ab-acts">
        <button type="button" class="btn sm" onclick={() => (rows = [...rows, { label: '', no: '' }])}><Plus size={14} aria-hidden="true" />{t('Add a number')}</button>
        <button type="button" class="btn sm hi" onclick={saveRows} data-sos-save>{t('Save')}</button>
        <button type="button" class="btn sm" onclick={() => (editing = false)}>{t('Cancel')}</button>
      </div>
    {:else}
      <ul class="ab-list">
        {#each nums as x (x.label + x.no)}<li><a href={telOf(x.no)} data-sos={x.no}><b>{x.no}</b> {label(x)}</a></li>{/each}
      </ul>
      <div class="ab-acts">
        <button type="button" class="btn sm" onclick={startEdit} data-sos-edit><Pencil size={14} aria-hidden="true" />{t('Change')}</button>
        {#if own}<button type="button" class="btn sm" onclick={backToStart}><RotateCcw size={14} aria-hidden="true" />{t('Back to the start numbers')}</button>{/if}
      </div>
      <small class="hint">{t('112 works in all of Europe. Check the numbers before you leave.')}</small>
    {/if}
  </div>
  <div class="ab-box">
    <b class="ab-h"><ShieldPlus size={16} aria-hidden="true" />{t('Travel insurance')}</b>
    {#if cover.length}
      <ul class="ab-list">
        {#each cover as x (x.id)}<li>{x.name}{#if x.number}{' · '}{x.number}{/if}{#if x.phone}{' · '}<a href={telOf(x.phone)}>{x.phone}</a>{/if}</li>{/each}
      </ul>
    {:else}
      <small class="hint">{t('None marked yet. In Me › Everyday life › Contracts, tick «Travel insurance» at yours.')}</small>
    {/if}
    <a class="btn sm" href="#/me/alltag/abos">{t('Contracts')}</a>
  </div>
  {#if cur && cur !== 'CHF'}
    <div class="ab-box">
      <b class="ab-h"><Coins size={16} aria-hidden="true" />{t('Currency: {cur}', { cur })}</b>
      <button type="button" class="btn sm" onclick={toConverter} data-abroad-money>{t('Convert {cur}', { cur })}</button>
    </div>
  {/if}
</div>

<style>
  .ab {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ab-box {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
  }
  .ab-h {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .ab-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .ab-list a {
    display: inline-flex;
    gap: 6px;
    min-height: 32px;
    align-items: center;
    color: var(--ink);
  }
  .ab-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .ab-acts .btn {
    align-self: flex-start;
  }
  .ab-box > .btn {
    align-self: flex-start;
  }
  .ab-edit {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .ab-edit .inp {
    flex: 1 1 auto;
    min-width: 0;
  }
  .ab-edit .ab-no {
    flex: 0 0 90px;
  }
  .ib {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
</style>
