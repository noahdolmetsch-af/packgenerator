<script>
  /**
   * Noah 26.10.2026 «12a» «Velo einwintern»: Bikes › Care › «Winter and spring» (#/bikes?tab=care&view=season).
   * Two checklists: before the winter break and before the first ride in spring. The points are the person's
   * own (add, rename, move with arrows and drag, delete with Undo; the app's points are a start); ticks per
   * bike and year. Which list is open first follows the month (October–January winter, else spring).
   */
  import { liveQuery } from 'dexie';
  import { Plus, Pencil, Trash2, RotateCcw, Snowflake, Sprout } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { sortBikes } from '../bikes.js';
  import { localDay } from '../localday.js';
  import { SEASON_KEY, seasonOf, addPackItem, renamePackItem, removePackItem, movePackItem, tickPack, ticksOf, clearPack } from '../griff.js';
  import { changeSetting, putSetting } from '../griffdb.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
  import GriffHead from './GriffHead.svelte';
  import './griff.css';

  let { bikeId = null } = $props();
  const today = localDay();
  const month = Number(today.slice(5, 7));
  // the ticks belong to a season: winter 2026 runs from October 2026 to the spring of 2027
  const seasonYear = (kind) => String(kind === 'winter' && month <= 3 ? Number(today.slice(0, 4)) - 1 : Number(today.slice(0, 4)));
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const seasonQ = liveQuery(() => db.settings.get(SEASON_KEY));
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const bike = $derived(bikes.find((b) => b.id === bikeId) ?? bikes[0] ?? null);
  const all = $derived(seasonOf($seasonQ?.value));
  let kind = $state(month >= 10 || month === 1 ? 'winter' : 'spring');
  const rec = $derived(all[kind]);
  const ticks = $derived(bike ? ticksOf(rec, bike.id, seasonYear(kind)) : []);
  const change = (fn) => changeSetting(SEASON_KEY, {}, (old) => {
    const s = seasonOf(old);
    return { ...s, [kind]: fn(s[kind]) };
  });
  const label = (x) => (x.std ? t(x.text) : x.text);

  let newText = $state('');
  let editing = $state(null);
  let editText = $state('');
  let msg = $state('');

  async function add(e) {
    e.preventDefault();
    if (!newText.trim()) return (msg = t('Type a point.'));
    await change((r) => addPackItem(r, newText, `ss-${Date.now().toString(36)}`));
    offerDone(t('"{name}" added.', { name: newText.trim() }));
    newText = '';
    msg = '';
  }
  async function rename(e, x) {
    e.preventDefault();
    if (!editText.trim()) return (msg = t('Type a point.'));
    await change((r) => renamePackItem(r, x.id, editText));
    editing = null;
    msg = '';
  }
  async function remove(x) {
    if ((await askDelete({ title: t('Delete "{name}"?', { name: label(x) }), text: t('Only this point goes.') })) !== 'delete') return;
    await deleteWithUndo({ name: label(x), text: t('"{name}" deleted.', { name: label(x) }), run: () => change((r) => removePackItem(r, x.id)), undo: (before) => putSetting(SEASON_KEY, before) });
  }
  const move = (from, to) => change((r) => movePackItem(r, from, to));
  const tick = (x) => change((r) => tickPack(r, bike.id, x.id, seasonYear(kind)));
  async function restart() {
    const before = await change((r) => clearPack(r, bike.id));
    offerDone(t('All ticks cleared.'), () => putSetting(SEASON_KEY, before));
  }
</script>

<div class="gp">
  <GriffHead {bikes} {bike} view="season" title={t('Winter and spring')} sub={t('Put the bike away for the winter, and get it ready again in spring')} />
  {#if !bike}
    <p class="quiet">{t('No bike yet. Add a bike under Bikes first.')}</p>
  {:else}
    <div class="chips" role="tablist" aria-label={t('Which list')}>
      <button type="button" class="chip" role="tab" aria-selected={kind === 'winter'} onclick={() => ((kind = 'winter'), (editing = null))} data-season-tab="winter"><Snowflake size={14} aria-hidden="true" />{t('Before the winter')}</button>
      <button type="button" class="chip" role="tab" aria-selected={kind === 'spring'} onclick={() => ((kind = 'spring'), (editing = null))} data-season-tab="spring"><Sprout size={14} aria-hidden="true" />{t('In spring')}</button>
    </div>
    <section class="gcard" aria-labelledby="ss-h" data-season={kind}>
      <h2 id="ss-h">{kind === 'winter' ? t('Before the winter') : t('In spring')} <small class="quiet">{t('{n} of {m} done', { n: ticks.filter((id) => rec.items.some((x) => x.id === id)).length, m: rec.items.length })}</small></h2>
      <p class="quiet">{t('The points are a start: change, move or delete them. The ticks are for this bike and this season.')}</p>
      <ul class="list" use:sortable={{ onmove: move }}>
        {#each rec.items as x, i (x.id)}
          <li data-sort-id={x.id} data-season-item={x.id}>
            <SortGrip name={label(x)} onstep={(dir) => move(i, i + dir)} />
            {#if editing === x.id}
              <form class="row grow" onsubmit={(e) => rename(e, x)}>
                <input class="inp grow" type="text" maxlength="120" bind:value={editText} aria-label={t('Point')} />
                <button type="submit" class="btn sm">{t('Save')}</button>
                <button type="button" class="btn sm" onclick={() => (editing = null)}>{t('Cancel')}</button>
              </form>
            {:else}
              <label class="grow tk"><input type="checkbox" checked={ticks.includes(x.id)} onchange={() => tick(x)} data-season-tick /> <span>{label(x)}</span></label>
              <SortArrows name={label(x)} {i} n={rec.items.length} onstep={(dir) => move(i, i + dir)} />
              <button type="button" class="ib" aria-label={t('Edit {name}', { name: label(x) })} onclick={() => ((editing = x.id), (editText = label(x)))}><Pencil size={16} aria-hidden="true" /></button>
              <button type="button" class="ib" aria-label={t('Delete {name}', { name: label(x) })} onclick={() => remove(x)} data-season-delete><Trash2 size={16} aria-hidden="true" /></button>
            {/if}
          </li>
        {/each}
      </ul>
      <form class="row" onsubmit={add}>
        <input class="inp grow" type="text" maxlength="120" placeholder={t('e.g. Grease the seatpost')} aria-label={t('New point')} bind:value={newText} data-season-new />
        <button type="submit" class="btn sm" data-season-add><Plus size={16} aria-hidden="true" />{t('Add|part')}</button>
      </form>
      {#if ticks.length}<p><button type="button" class="lnk" onclick={restart}><RotateCcw size={14} aria-hidden="true" />{t('Clear all ticks')}</button></p>{/if}
      {#if msg}<p class="err" role="alert">{msg}</p>{/if}
    </section>
  {/if}
</div>

<style>
  .tk {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
</style>
