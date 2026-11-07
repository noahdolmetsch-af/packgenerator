<script>
  /**
   * «Training verbessern» 7 «Einheiten-Bibliothek» (Noah 03.11.2026, «1-5 a» 07.11.2026): sessions the user keeps
   * (name, kind, minutes, zone). It starts with examples. In the form of a session one tap puts a kept session in; the most
   * used stand first. Own groups (rename, delete with the one window, «No group» preselected), arrows and drag to order,
   * rename, remove. Every change goes to the page with a message (Undo is offered there).
   */
  import { Bookmark, X } from '@lucide/svelte';
  import { t, tn } from '../../i18n.svelte.js';
  import RenameSheet from '../../ui/RenameSheet.svelte';
  import GroupDeleteSheet from '../../ui/GroupDeleteSheet.svelte';
  import SortGrip from '../../ui/SortGrip.svelte';
  import SortArrows from '../../ui/SortArrows.svelte';
  import { sortable } from '../../ui/sortable.js';
  import { byUse, libraryGroups, moveInGroup, renameLibraryGroup, deleteLibraryGroup, missingExamples } from '../../training.js';

  let { items = [], canSave = false, onpick, onsave, onchange, hours = (m) => `${m} min` } = $props();

  const groups = $derived(libraryGroups(items));
  /** The blocks to show: each named group, then the entries without a group. */
  const blocks = $derived([...groups.map((g) => ({ g, list: items.filter((e) => e.group === g) })), { g: '', list: items.filter((e) => !e.group) }].filter((b) => b.list.length));
  const missing = $derived(missingExamples(items, t));

  let renaming = $state(null); // group name
  let deleting = $state(null); // group name
  let newFor = $state(null); // id of the entry that gets a new group
  let newName = $state('');

  const setGroup = (e, g) => onchange(items.map((x) => (x.id === e.id ? { ...x, group: g } : x)), t('«{name}» moved.', { name: e.name }));
  function pickGroup(e, v) {
    if (v === '__new') {
      newFor = e.id;
      newName = '';
    } else setGroup(e, v);
  }
  function addGroup(e) {
    const n = newName.trim().slice(0, 30);
    newFor = null;
    if (n) setGroup(e, n);
  }
  const step = (e, dir) => onchange(moveInGroup(items, e.id, dir), '');
  function drag(list, from, to) {
    let next = items;
    const dir = to > from ? 1 : -1;
    for (let k = 0; k < Math.abs(to - from); k++) next = moveInGroup(next, list[from].id, dir);
    onchange(next, '');
  }
  const remove = (e) => onchange(items.filter((x) => x.id !== e.id), t('«{name}» removed from the library.', { name: e.name }));
  const gName = (g) => g || t('No group');
</script>

{#if items.length || canSave}
  <div class="lb" data-library>
    {#if items.length}
      <p class="lh">{t('From your library')}</p>
      {#each blocks as b (b.g)}
        {#if groups.length}<p class="lg" data-library-group-name>{gName(b.g)}</p>{/if}
        <div class="lc">
          {#each byUse(b.list) as e (e.id)}<button type="button" class="ch" onclick={() => onpick(e)} data-library-pick={e.id}><Bookmark size={14} aria-hidden="true" /><span class="cn">{e.name}</span><span class="num">· {hours(e.mins)}</span>{#if e.zone}<i class="zt z{e.zone}">Z{e.zone}</i>{/if}{#if e.uses}<span class="us num">{e.uses}×</span>{/if}</button>{/each}
        </div>
      {/each}
    {/if}
    {#if canSave}<button type="button" class="btn btn-link sm" onclick={onsave} data-library-save><Bookmark size={14} aria-hidden="true" />{t('Keep this session')}</button>{/if}
    {#if items.length}
      <details class="lm">
        <summary>{t('Manage the library')}</summary>
        <p class="hint">{t('Rename them, put them in groups, move them with the arrows or the handle. Remove with the cross: you can undo it for a few seconds.')}</p>
        {#each blocks as b (b.g)}
          <div class="gh" data-library-block={b.g}>
            <b>{gName(b.g)}</b>
            {#if b.g}<span><button type="button" class="btn btn-link sm" onclick={() => (renaming = b.g)} data-library-group-rename>{t('Rename')}</button><button type="button" class="btn btn-link sm" onclick={() => (deleting = b.g)} data-library-group-delete>{t('Delete')}</button></span>{/if}
          </div>
          <ul class="ll" use:sortable={{ onmove: (from, to) => drag(b.list, from, to) }}>
            {#each b.list as e, i (e.id)}
              <li data-sort-id={e.id}>
                <SortGrip name={e.name} onstep={(dir) => step(e, dir)} />
                <input class="inp" value={e.name} maxlength="60" aria-label={t('Name')} onchange={(ev) => onchange(items.map((x) => (x.id === e.id ? { ...x, name: ev.currentTarget.value.trim() || x.name } : x)), '')} data-library-name={e.id} />
                {#if newFor === e.id}
                  <input class="inp gn" bind:value={newName} maxlength="30" placeholder={t('Name of the group')} aria-label={t('Name of the group')} onkeydown={(ev) => ev.key === 'Enter' && (ev.preventDefault(), addGroup(e))} data-library-newgroup />
                  <button type="button" class="btn sm" onclick={() => addGroup(e)}>{t('Add')}</button>
                {:else}
                  <select class="sel gs" aria-label={t('Group')} value={e.group} onchange={(ev) => pickGroup(e, ev.currentTarget.value)} data-library-group={e.id}>
                    <option value="">{t('No group')}</option>
                    {#each groups as g (g)}<option value={g}>{g}</option>{/each}
                    <option value="__new">{t('New group …')}</option>
                  </select>
                {/if}
                <SortArrows name={e.name} {i} n={b.list.length} onstep={(dir) => step(e, dir)} />
                <button type="button" class="btn btn-link sm" aria-label={t('Remove')} onclick={() => remove(e)} data-library-delete={e.id}><X size={14} aria-hidden="true" /></button>
              </li>
            {/each}
          </ul>
        {/each}
        {#if missing.length}<button type="button" class="btn sm" onclick={() => onchange([...items, ...missing], t('The examples are back.'))} data-library-examples>{t('Add the examples again')}</button>{/if}
      </details>
    {/if}
  </div>
{/if}

{#if renaming != null}
  <RenameSheet
    kicker={t('Group')}
    title={t('Rename group')}
    value={renaming}
    hint={t('The sessions of the group keep their place.')}
    max={30}
    onsave={(n) => {
      const name = n.trim();
      if (name !== renaming && groups.includes(name)) return t('This group exists already.');
      onchange(renameLibraryGroup(items, renaming, name), t('Group renamed to «{name}».', { name }));
    }}
    onclose={() => (renaming = null)}
  />
{/if}
{#if deleting != null}
  <GroupDeleteSheet
    title={t('Delete group «{name}»?', { name: deleting })}
    count={items.filter((e) => e.group === deleting).length}
    what={(n) => tn(n, '{n} kept session', '{n} kept sessions')}
    none={t('No group')}
    noneHint={t('The sessions stay and show under «No group». No session is deleted.')}
    targets={groups.filter((g) => g !== deleting).map((g) => ({ id: g, name: g }))}
    onconfirm={(to) => onchange(deleteLibraryGroup(items, deleting, to ?? ''), t('Group «{name}» deleted.', { name: deleting }))}
    onclose={() => (deleting = null)}
  />
{/if}

<style>
  .lb { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; width: 100%; }
  .lh { margin: 0; color: var(--ink-2); font-size: var(--fs-small); }
  .lg { margin: 4px 0 0; font-weight: 600; font-size: var(--fs-small); }
  .lc { display: flex; flex-wrap: wrap; gap: 6px; }
  .lc .ch { display: inline-flex; align-items: center; gap: 4px; }
  .us { color: var(--ink-2); font-size: var(--fs-small); }
  .lm { font-size: var(--fs-small); width: 100%; }
  .gh { display: flex; justify-content: space-between; align-items: center; margin: 10px 0 2px; }
  .ll { list-style: none; margin: 4px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  .ll li { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .ll .inp { flex: 1; min-width: 120px; }
  .ll .gs { flex: none; min-width: 150px; }
</style>
