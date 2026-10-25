<script>
  /**
   * Paket B part 3, UC-191-I2 «Übergabe nach Verkauf»: under the sale listing, a short checklist for the
   * day the bike goes: keys, charger, papers, the bike out of Strava and Garmin, the money. Own steps can be
   * added, renamed and deleted (with Undo). Stored with the listing: griff.sell[bikeId].handover.
   */
  import { Check, Pencil, Trash2, Plus } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { changeSetting } from '../griffdb.js';
  import { SELL_KEY } from '../griff.js';
  import { answer, addOwn, renameOwn, removeOwn } from '../probe/probe.js';
  import { HANDOVER_STEPS } from './werkstatt.js';
  import '../trip/trip.css';

  let { bikeId, rec = null } = $props();
  const rows = $derived([...HANDOVER_STEPS, ...(rec?.own ?? []).map((o) => ({ key: o.id, name: o.name, own: true }))].map((s) => ({ ...s, done: rec?.steps?.[s.key]?.r === 'ok' })));
  const done = $derived(rows.filter((r) => r.done).length);

  const save = (next) => changeSetting(SELL_KEY, {}, (all) => ({ ...(all ?? {}), [bikeId]: { ...((all ?? {})[bikeId] ?? {}), handover: next } }));
  const snap = () => JSON.parse(JSON.stringify(rec ?? {}));
  const tick = (key) => save(answer(snap(), key, 'ok'));

  let newName = $state('');
  let editing = $state(null);
  let editName = $state('');
  async function add(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    await save(addOwn(snap(), newName));
    newName = '';
  }
  async function rename(e, id) {
    e.preventDefault();
    await save(renameOwn(snap(), id, editName));
    editing = null;
  }
  async function drop(s) {
    if ((await askDelete({ title: t('Delete «{name}»?', { name: s.name }), text: t('Only this step goes.') })) !== 'delete') return;
    const before = snap();
    await deleteWithUndo({ run: () => save(removeOwn(before, s.key)).then(() => before), undo: (saved) => save(saved), text: t('«{name}» deleted.', { name: s.name }), name: s.name });
  }
</script>

<section class="gcard" aria-labelledby="ho-h" data-handover>
  <h2 id="ho-h">{t('Handover')}</h2>
  <p class="quiet">{t('Sold? So that nothing stays behind on the day the bike goes.')} <b class="num">{t('{done} of {n}', { done, n: rows.length })}</b></p>
  <ul class="ho">
    {#each rows as s (s.key)}
      <li data-handover-step={s.key} class:done={s.done}>
        {#if editing === s.key}
          <form class="ho-edit" onsubmit={(e) => rename(e, s.key)}>
            <!-- svelte-ignore a11y_autofocus -->
            <input class="inp" type="text" bind:value={editName} aria-label={t('Name of the step')} autofocus />
            <button type="submit" class="btn sm">{t('Save')}</button>
            <button type="button" class="tp-link" onclick={() => (editing = null)}>{t('Cancel')}</button>
          </form>
        {:else}
          <button type="button" class="ho-tick" aria-pressed={s.done} onclick={() => tick(s.key)}>
            <span class="box" aria-hidden="true">{#if s.done}<Check size={16} />{/if}</span>
            <span class="txt"><b>{s.own ? s.name : t(s.name)}</b>{#if s.sub}<small>{t(s.sub)}</small>{/if}</span>
          </button>
          {#if s.own}
            <button type="button" class="ib" aria-label={t('Rename «{name}»', { name: s.name })} onclick={() => ((editing = s.key), (editName = s.name))}><Pencil size={16} /></button>
            <button type="button" class="ib" aria-label={t('Delete «{name}»', { name: s.name })} onclick={() => drop(s)}><Trash2 size={16} /></button>
          {/if}
        {/if}
      </li>
    {/each}
  </ul>
  <form class="ho-add" onsubmit={add}>
    <input class="inp" type="text" bind:value={newName} maxlength="80" placeholder={t('Own step, e.g. «Bottle cages off»')} aria-label={t('Add own step')} />
    <button type="submit" class="btn sm" disabled={!newName.trim()}><Plus size={16} aria-hidden="true" />{t('Add')}</button>
  </form>
</section>

<style>
  .ho {
    list-style: none;
    margin: 8px 0;
    padding: 0;
  }
  .ho li {
    display: flex;
    align-items: center;
    gap: 4px;
    border-top: 1px solid var(--line);
  }
  .ho-tick {
    display: flex;
    flex: 1 1 auto;
    gap: 10px;
    align-items: flex-start;
    min-width: 0;
    min-height: 44px;
    padding: 8px 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .box {
    display: grid;
    flex: none;
    place-items: center;
    width: 22px;
    height: 22px;
    margin-top: 1px;
    border: 1.5px solid var(--ink-3);
    border-radius: 6px;
  }
  .done .box {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--paper);
  }
  .txt {
    display: grid;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .txt small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .done .txt b {
    color: var(--ink-2);
  }
  .ib {
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
  .ho-edit,
  .ho-add {
    display: flex;
    flex: 1 1 auto;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding: 6px 0;
  }
  .ho-edit .inp,
  .ho-add .inp {
    flex: 1 1 160px;
    min-width: 0;
  }
</style>
