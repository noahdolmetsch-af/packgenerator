<script>
  /**
   * Gruppenfahrt für Events (Noah 26.10.2026 «5», mockup G6, «4a»): «Who has what with them», so not
   * everyone carries everything. Everyone adds what they carry («I have it») or what the group still needs;
   * a thing nobody carries shows «missing». Suggestions come from your own packing list (only on your device;
   * only what you tick goes to the group). Your own entries you rename and delete (asked first, with Undo).
   * rows: memberRows with .part; mine: my part; suggest: names from my packing list; onpart(patch).
   */
  import { Plus, Pencil, Trash2, Check } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { itemsBoard, ITEMS_MAX } from './event.js';
  import './event.css';

  let { rows = [], mine = {}, me = null, suggest = [], onpart = null, canSend = true } = $props();
  const board = $derived(itemsBoard(rows, me));
  const has = $derived(mine?.has ?? []);
  const need = $derived(mine?.need ?? []);
  const same = (a, b) => a.toLocaleLowerCase('de') === b.toLocaleLowerCase('de');
  const inList = (list, n) => list.some((x) => same(x, n));
  const myNeed = (n) => inList(need, n);
  const fresh = $derived(suggest.filter((n) => !inList(has, n)).slice(0, 12));

  let name = $state('');
  let mode = $state('has');
  let showSuggest = $state(false);
  let editing = $state(null);
  let editName = $state('');

  const put = (patch) => onpart?.(patch);
  async function add() {
    const n = name.trim().slice(0, 40);
    if (!n) return;
    if (mode === 'has') await put({ has: [...has.filter((x) => !same(x, n)), n].slice(-ITEMS_MAX), need: need.filter((x) => !same(x, n)) });
    else await put({ need: [...need.filter((x) => !same(x, n)), n].slice(-ITEMS_MAX) });
    name = '';
  }
  async function flipHas(n) {
    if (inList(has, n)) await put({ has: has.filter((x) => !same(x, n)) });
    else await put({ has: [...has, n].slice(-ITEMS_MAX), need: need.filter((x) => !same(x, n)) });
  }
  async function takeSuggest(n) {
    await put({ has: [...has, n].slice(-ITEMS_MAX) });
  }
  function startEdit(n) {
    editing = n;
    editName = n;
  }
  async function saveEdit() {
    const n = editName.trim().slice(0, 40);
    if (n && editing) await put({ has: has.map((x) => (same(x, editing) ? n : x)), need: need.map((x) => (same(x, editing) ? n : x)) });
    editing = null;
  }
  async function remove(n) {
    const a = await askDelete({ title: t('Delete «{name}»?', { name: n }), text: t('Your entry is gone from the list of the group. What the others carry stays.') });
    if (a !== 'delete') return;
    await deleteWithUndo({
      name: n,
      text: t('«{name}» deleted.', { name: n }),
      run: async () => {
        const before = { has, need };
        await put({ has: has.filter((x) => !same(x, n)), need: need.filter((x) => !same(x, n)) });
        return before;
      },
      undo: (before) => put(before),
    });
  }
</script>

<section class="card ev-box" aria-labelledby="ei-h" data-event-items>
  <h2 id="ei-h">{t('Who has what with them')}</h2>
  <p class="ev-muted">{t('So not everyone has to carry everything. Everyone in the group sees the list and adds to it.')}</p>
  {#if board.length}
    <ul class="ev-list">
      {#each board as it (it.name)}
        {@const ownEntry = it.mine || myNeed(it.name)}
        <li data-event-item={it.name}>
          <span class="ev-txt">
            {#if editing && same(editing, it.name)}
              <label class="ev-fld"><span>{t('New name')}</span><input type="text" bind:value={editName} maxlength="40" onkeydown={(e) => e.key === 'Enter' && saveEdit()} data-event-item-newname /></label>
            {:else}
              <b>{it.name}</b>
              <small>{it.who.length ? it.who.map((w) => w || t('Without a name')).join(' · ') : t('nobody yet')}</small>
            {/if}
          </span>
          {#if it.missing}<span class="ev-tag bad" data-event-item-missing>{t('missing')}</span>{:else if it.mine}<span class="ev-tag ok">{t('you')}</span>{/if}
          <span class="ev-acts">
            {#if editing && same(editing, it.name)}
              <button type="button" class="btn sm hi" onclick={saveEdit}>{t('Save')}</button>
            {:else}
              <button type="button" class="btn sm" aria-pressed={it.mine} onclick={() => flipHas(it.name)} disabled={!canSend} data-event-item-mine>{#if it.mine}<Check size={16} aria-hidden="true" />{t('I have it')}{:else}{t('Me too')}{/if}</button>
              {#if ownEntry}
                <button type="button" class="btn sm" onclick={() => startEdit(it.name)} aria-label={t('Rename «{name}»', { name: it.name })}><Pencil size={16} aria-hidden="true" /></button>
                <button type="button" class="btn sm" onclick={() => remove(it.name)} aria-label={t('Delete «{name}»', { name: it.name })} data-event-item-del><Trash2 size={16} aria-hidden="true" /></button>
              {/if}
            {/if}
          </span>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="ev-muted">{t('Nothing on the list yet.')}</p>
  {/if}

  <div class="ev-chips" role="group" aria-label={t('Add')}>
    <button type="button" class="ev-chip" aria-pressed={mode === 'has'} onclick={() => (mode = 'has')} data-event-item-mode="has">{t('I have it with me')}</button>
    <button type="button" class="ev-chip" aria-pressed={mode === 'need'} onclick={() => (mode = 'need')} data-event-item-mode="need">{t('The group needs it')}</button>
  </div>
  <div class="ev-acts">
    <label class="ev-fld ev-grow"><span>{t('Thing')}</span><input type="text" bind:value={name} maxlength="40" placeholder={t('e.g. chain oil')} onkeydown={(e) => e.key === 'Enter' && add()} data-event-item-name /></label>
    <button type="button" class="btn" onclick={add} disabled={!canSend || !name.trim()} data-event-item-add><Plus size={18} aria-hidden="true" />{t('Add')}</button>
  </div>
  {#if suggest.length}
    <div><button type="button" class="btn sm" aria-expanded={showSuggest} onclick={() => (showSuggest = !showSuggest)} data-event-item-suggest>{t('From my packing list')}</button></div>
    {#if showSuggest}
      <p class="ev-muted">{t('Packed for your tour. Only what you tap goes to the group.')}</p>
      {#if fresh.length}
        <div class="ev-chips">
          {#each fresh as n (n)}<button type="button" class="ev-chip" onclick={() => takeSuggest(n)} disabled={!canSend} data-event-item-take={n}><Plus size={14} aria-hidden="true" /> {n}</button>{/each}
        </div>
      {:else}
        <p class="ev-muted">{t('Everything of your packing list is on the list already.')}</p>
      {/if}
    {/if}
  {/if}
</section>
