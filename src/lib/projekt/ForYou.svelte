<script>
  /**
   * Paket P7 «Projekt-Ablage», «Für dich jetzt»: what waits for you. A parked package (built, it goes online only
   * after your OK) comes by itself from the list of plans; your own points you add, change, move (arrows and drag)
   * and delete (asked first, with Undo). Stored in settings under OWN_KEY, on this device and in the backup.
   */
  import { liveQuery } from 'dexie';
  import { Plus, Pencil, Trash2, Check, X, PackageCheck } from '@lucide/svelte';
  import { db } from '../db.js';
  import { OWN_KEY, ownOf, addOwn, editOwn, dropOwn, moveOwn, forYou } from './ablage.js';
  import { askDelete, deleteWithUndo, saveFailed } from '../ui/ask.js';
  import { sortable } from '../ui/sortable.js';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { t } from '../i18n.svelte.js';

  let { packages = [], appVersion = '0' } = $props();

  const ownQ = liveQuery(async () => ownOf((await db.settings.get(OWN_KEY))?.value));
  const own = $derived($ownQ ?? []);
  const parked = $derived(forYou(packages, [], appVersion, 99).all);
  const save = (list) => db.settings.put({ key: OWN_KEY, value: list });

  let adding = $state(false);
  let text = $state('');
  let editing = $state(null);
  let editText = $state('');
  async function add(e) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await save(addOwn(own, text));
      text = '';
      adding = false;
    } catch (err) {
      saveFailed(err);
    }
  }
  async function saveEdit(e) {
    e.preventDefault();
    try {
      await save(editOwn(own, editing, editText));
      editing = null;
    } catch (err) {
      saveFailed(err);
    }
  }
  async function remove(x) {
    if ((await askDelete({ title: t('Delete the point «{name}»?', { name: x.text.slice(0, 40) }), text: t('Only this point goes.') })) !== 'delete') return;
    const before = own;
    await deleteWithUndo({ run: () => save(dropOwn(own, x.id)), undo: () => save(before), text: t('Point deleted.'), name: x.text.slice(0, 40) });
  }
  const move = (from, to) => save(moveOwn(own, from, to)).catch(saveFailed);
</script>

<section class="ich-sec pa-fy" aria-labelledby="pa-fy-h" data-for-you>
  <div class="ich-h"><div><h2 id="pa-fy-h">{t('For you now')}</h2><p class="ich-hs">{t('What waits for you. Keep it to about three points.')}</p></div></div>
  {#if parked.length}
    <ul class="pa-cards">
      {#each parked as p, i (p.id)}
        <li class="card pa-card" data-for-you-pkg={p.key}>
          <span class="pa-n num">{i + 1}</span>
          <span class="pa-m"><b>{t('«{name}» is built and parked', { name: p.name })}</b><small>{p.version ? t('Version {version} goes online after your OK.', { version: p.version }) : t('It goes online after your OK.')}</small></span>
          <PackageCheck size={18} aria-hidden="true" />
        </li>
      {/each}
    </ul>
  {/if}
  {#if own.length}
    <ul class="pa-cards pa-own" use:sortable={{ onmove: move }} data-for-you-own>
      {#each own as x, i (x.id)}
        <li class="card pa-card" data-sort-id={x.id} data-for-you-point={x.id}>
          <SortGrip name={x.text} onstep={(dir) => move(i, i + dir)} />
          <span class="pa-n num">{parked.length + i + 1}</span>
          {#if editing === x.id}
            <form class="pa-form" onsubmit={saveEdit}>
              <input class="inp" maxlength="140" bind:value={editText} aria-label={t('Point')} data-for-you-edit-text />
              <button type="submit" class="pa-ib" aria-label={t('Save')}><Check size={18} aria-hidden="true" /></button>
              <button type="button" class="pa-ib" aria-label={t('Cancel')} onclick={() => (editing = null)}><X size={18} aria-hidden="true" /></button>
            </form>
          {:else}
            <span class="pa-m"><b>{x.text}</b></span>
            <button type="button" class="pa-ib" aria-label={t('Change «{name}»', { name: x.text })} onclick={() => ((editing = x.id), (editText = x.text))} data-for-you-edit><Pencil size={16} aria-hidden="true" /></button>
            <button type="button" class="pa-ib" aria-label={t('Delete «{name}»', { name: x.text })} onclick={() => remove(x)} data-for-you-delete><Trash2 size={16} aria-hidden="true" /></button>
            <SortArrows name={x.text} {i} n={own.length} onstep={(dir) => move(i, i + dir)} />
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
  {#if !parked.length && !own.length}
    <p class="pa-empty">{t('Nothing waits for you. Add a point you want to remember for the app.')}</p>
  {/if}
  {#if adding}
    <form class="pa-form pa-add" onsubmit={add}>
      <input class="inp" maxlength="140" bind:value={text} placeholder={t('e.g. answer the questions on the new page')} aria-label={t('New point')} data-for-you-text />
      <button type="submit" class="btn hi" data-for-you-save>{t('Add')}</button>
      <button type="button" class="btn" onclick={() => ((adding = false), (text = ''))}>{t('Cancel')}</button>
    </form>
  {:else}
    <button type="button" class="btn sm pa-addbtn" onclick={() => (adding = true)} data-for-you-add><Plus size={16} aria-hidden="true" />{t('Add a point')}</button>
  {/if}
</section>

<style>
  .pa-cards {
    list-style: none;
    margin: 0 0 8px;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
    gap: 8px;
  }
  .pa-card {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    min-width: 0;
  }
  .pa-n {
    flex: none;
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--accent-soft);
    color: var(--ink);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .pa-m {
    flex: 1;
    min-width: 0;
    display: grid;
    gap: 2px;
    overflow-wrap: break-word;
  }
  .pa-m small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .pa-ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    border-radius: var(--r-ctl);
    cursor: pointer;
  }
  .pa-form {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
  .pa-form .inp {
    flex: 1 1 180px;
    min-width: 0;
    min-height: 44px;
  }
  .pa-form .btn,
  .pa-addbtn {
    min-height: 44px;
  }
  .pa-add {
    margin-top: 4px;
  }
  .pa-addbtn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .pa-empty {
    margin: 0 0 8px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
