<script>
  /**
   * «Wege-Gedächtnis» (Noah 07.11.2026 «5a»): all the stretches you marked after a ride. Each can get a name,
   * change its mark (good / to avoid) and be deleted, with Undo. A bad stretch is avoided when a new way is
   * planned; a good one shows as a sign on the live map. Lives in the options of the live map.
   */
  import { liveQuery } from 'dexie';
  import { ThumbsUp, ThumbsDown, Pencil, Trash2, Check } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, locale } from '../i18n.svelte.js';
  import { askDelete, deleteWithUndo, saveFailed } from '../ui/ask.js';
  import { offerRename } from '../ui/rename.svelte.js';
  import { WAYS_KEY, cleanMemory, nameOf, renameWay, removeWay, restoreWay, changeRating, NAME_MAX } from './wegegedaechtnis.js';

  const memQ = liveQuery(() => db.settings.get(WAYS_KEY));
  const mem = $derived(cleanMemory($memQ?.value));
  const ways = $derived([...mem.ways].sort((a, b) => (b.at ?? 0) - (a.at ?? 0)));
  let err = $state('');
  let editing = $state(null);
  let draft = $state('');

  const label = (w) => nameOf(w, { km: (a, b) => t('km {a}–{b}', { a, b }), date: (d) => new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'numeric' }) });
  const save = (value) => db.settings.put({ key: WAYS_KEY, value });
  async function run(fn) {
    err = '';
    try {
      await fn();
    } catch (e) {
      err = saveFailed(e);
    }
  }
  function startEdit(w) {
    editing = w.id;
    draft = w.name || '';
  }
  const doRename = (w) =>
    run(async () => {
      const old = w.name || '';
      await save(renameWay(mem, w.id, draft));
      editing = null;
      offerRename(draft.trim() || label({ ...w, name: '' }), () => save(renameWay(cleanMemory($memQ?.value), w.id, old)));
    });
  async function remove(w) {
    if ((await askDelete({ title: t('Delete "{name}" from the remembered ways?', { name: label(w) }), text: t('The app will no longer avoid or show this stretch. You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    await deleteWithUndo({
      name: label(w),
      text: t('"{name}" deleted.', { name: label(w) }),
      run: async () => {
        await save(removeWay(mem, w.id));
        return w;
      },
      undo: (saved) => save(restoreWay(cleanMemory($memQ?.value), saved)),
    });
  }
</script>

<div class="wm" data-way-memory>
  <b>{t('Remembered ways')}</b>
  <small>{t('Stretches you marked after a ride. Bad ones are avoided when the app plans a new way; good ones show as a sign on the map. Rename, change or delete them here.')}</small>
  {#if !ways.length}
    <p class="tp-small tp-muted" data-way-empty>{t('Nothing yet. After a ride, «Your ride» asks how the stretches were.')}</p>
  {:else}
    <ul class="wm-list">
      {#each ways as w (w.id)}
        <li class="wm-row" data-way-row={w.id}>
          {#if editing === w.id}
            <input class="inp" bind:value={draft} maxlength={NAME_MAX} aria-label={t('Name')} placeholder={label({ ...w, name: '' })} onkeydown={(e) => e.key === 'Enter' && doRename(w)} data-way-name-input />
            <button type="button" class="btn sm wm-btn" aria-label={t('Save')} onclick={() => doRename(w)} data-way-name-save><Check size={16} aria-hidden="true" /></button>
          {:else}
            <span class="wm-name" data-way-name>{label(w)}</span>
            <button type="button" class="btn sm wm-btn" aria-label={t('Rename')} onclick={() => startEdit(w)} data-way-rename><Pencil size={16} aria-hidden="true" /></button>
          {/if}
          <button type="button" class="btn sm wm-btn" aria-pressed={w.rating === 'up'} aria-label={t('Good stretch')} onclick={() => run(() => save(changeRating(mem, w.id, 'up')))} data-way-up><ThumbsUp size={16} aria-hidden="true" /></button>
          <button type="button" class="btn sm wm-btn" aria-pressed={w.rating === 'down'} aria-label={t('Stretch to avoid')} onclick={() => run(() => save(changeRating(mem, w.id, 'down')))} data-way-down><ThumbsDown size={16} aria-hidden="true" /></button>
          <button type="button" class="btn sm wm-btn" aria-label={t('Delete')} onclick={() => remove(w)} data-way-delete><Trash2 size={16} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
  {/if}
  {#if err}<p class="wm-err" role="alert">{err}</p>{/if}
</div>

<style>
  .wm {
    display: grid;
    gap: 6px;
  }
  .wm small {
    color: var(--ink-2);
  }
  .wm p {
    margin: 0;
  }
  .wm-list {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .wm-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .wm-name {
    flex: 1;
    min-width: 8ch;
    overflow-wrap: break-word;
  }
  .wm-row :global(.inp) {
    flex: 1;
    min-width: 8ch;
  }
  .wm-btn {
    min-width: 44px;
    min-height: 44px;
    justify-content: center;
  }
  .wm-btn[aria-pressed='true'][data-way-up] {
    background: var(--ok);
    color: var(--paper);
  }
  .wm-btn[aria-pressed='true'][data-way-down] {
    background: var(--bad);
    color: var(--paper);
  }
  .wm-err {
    color: var(--bad);
  }
</style>
