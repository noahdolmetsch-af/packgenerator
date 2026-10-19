<script>
  /**
   * «Meine KI-Projekte» (Noah 19.10.2026 «2a»): Ich › Meine KI-Projekte (#/me/ki-projekte). Your own
   * links to AI projects, threads and chats; one tap opens them in a new tab (with your own account,
   * e.g. your Claude subscription). Add, rename, change the address, delete with Undo, reorder with the
   * arrows or by dragging. The app cannot read your projects from the services: you keep the list.
   */
  import { liveQuery } from 'dexie';
  import { Plus, ExternalLink, Pencil, Trash2, Check, X } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { t } from '../lib/i18n.svelte.js';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import SortGrip from '../lib/ui/SortGrip.svelte';
  import SortArrows from '../lib/ui/SortArrows.svelte';
  import { sortable } from '../lib/ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../lib/ui/ask.js';
  import { AI_PROJECTS_KEY, serviceOf, cleanUrl, addProject, editProject, moveProject } from '../lib/aiprojects/aiprojects.js';

  const q = liveQuery(async () => (await db.settings.get(AI_PROJECTS_KEY))?.value ?? []);
  const list = $derived(Array.isArray($q) ? $q : []);
  const save = (value) => db.settings.put({ key: AI_PROJECTS_KEY, value: $state.snapshot(value) });

  let title = $state('');
  let url = $state('');
  let msg = $state('');
  let editing = $state(null); // { id, title, url }

  async function add(e) {
    e.preventDefault();
    if (!cleanUrl(url)) return (msg = t('Paste the web address of the project or chat, e.g. https://claude.ai/project/…'));
    await save(addProject(list, { title, url }, { id: `aip-${Date.now().toString(36)}` }));
    title = '';
    url = '';
    msg = '';
  }
  async function saveEdit(e) {
    e.preventDefault();
    if (!editing) return;
    await save(editProject(list, editing.id, { title: editing.title, url: editing.url }));
    editing = null;
  }
  async function remove(p) {
    const a = await askDelete({ title: t('Delete "{name}"?', { name: p.title }), text: t('Only the link in the app goes. The project or chat itself stays where it is.') });
    if (a !== 'delete') return;
    const before = list;
    await deleteWithUndo({
      run: () => save(before.filter((x) => x.id !== p.id)).then(() => before),
      undo: (saved) => save(saved),
      text: t('"{name}" deleted.', { name: p.title }),
      name: p.title,
    });
  }
  const step = (i, dir) => save(moveProject(list, i, i + dir));
</script>

<div class="aip ich-page">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('My AI projects')} sub={t('Your own links to projects, threads and chats')} />

  <section class="card aip-card">
    <p class="aip-help">{t('The app cannot read your projects from Claude, ChatGPT or others. Copy the address of a project or chat from the browser and add it here; one tap opens it with your own account.')}</p>
    <form class="aip-add" onsubmit={add}>
      <input class="inp" type="text" bind:value={title} placeholder={t('Name, e.g. Pack Generator')} aria-label={t('Name of the link')} />
      <input class="inp" type="text" inputmode="url" autocomplete="url" bind:value={url} placeholder="https://claude.ai/project/…" aria-label={t('Web address')} />
      <button type="submit" class="btn hi"><Plus size={16} aria-hidden="true" />{t('Add')}</button>
    </form>
    {#if msg}<p class="aip-msg" role="alert">{msg}</p>{/if}
  </section>

  {#if list.length}
    <ul class="aip-list" use:sortable={{ onmove: (from, to) => save(moveProject(list, from, to)) }}>
      {#each list as p, i (p.id)}
        <li class="aip-row" data-sort-id={p.id} data-aip={p.id}>
          {#if editing?.id === p.id}
            <form class="aip-edit" onsubmit={saveEdit}>
              <input class="inp" type="text" bind:value={editing.title} aria-label={t('Name of the link')} />
              <input class="inp" type="text" inputmode="url" bind:value={editing.url} aria-label={t('Web address')} />
              <button type="submit" class="btn sm hi" aria-label={t('Save')}><Check size={16} aria-hidden="true" /></button>
              <button type="button" class="btn sm" aria-label={t('Cancel')} onclick={() => (editing = null)}><X size={16} aria-hidden="true" /></button>
            </form>
          {:else}
            <SortGrip name={p.title} onstep={(dir) => step(i, dir)} />
            <SortArrows name={p.title} {i} n={list.length} onstep={(dir) => step(i, dir)} />
            <a class="aip-go" href={p.url} target="_blank" rel="noopener noreferrer"><b>{p.title}</b><small>{serviceOf(p.url)}</small><ExternalLink size={14} aria-hidden="true" /></a>
            <button type="button" class="aip-ib" aria-label={t('Rename {name}', { name: p.title })} onclick={() => (editing = { id: p.id, title: p.title, url: p.url })}><Pencil size={16} aria-hidden="true" /></button>
            <button type="button" class="aip-ib" aria-label={t('Delete {name}', { name: p.title })} onclick={() => remove(p)}><Trash2 size={16} aria-hidden="true" /></button>
          {/if}
        </li>
      {/each}
    </ul>
  {:else}
    <p class="aip-empty">{t('No links yet. Add your first project above.')}</p>
  {/if}
</div>

<style>
  .aip {
    display: grid;
    gap: 12px;
    max-width: 760px;
  }
  .aip-card {
    display: grid;
    gap: 8px;
  }
  .aip-help,
  .aip-empty {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .aip-add,
  .aip-edit {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    flex: 1;
  }
  .aip-add .inp,
  .aip-edit .inp {
    flex: 1 1 200px;
    min-width: 0;
  }
  .aip-add .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .aip-msg {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .aip-list {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .aip-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
  }
  .aip-go {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 8px;
    min-height: 44px;
    color: var(--ink);
    text-decoration: none;
    overflow-wrap: break-word;
  }
  .aip-go small {
    color: var(--ink-3);
  }
  .aip-ib {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
</style>
