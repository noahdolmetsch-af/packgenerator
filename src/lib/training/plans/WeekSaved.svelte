<script>
  /**
   * «Training verbessern» 11 «Ganze Wochen merken» (Noah 07.11.2026, «1a 2a 3a 4a»): a good week is kept as a template
   * (weekday, name, kind, sport, minutes, zone; no dates). «Put in» shows the week first and then adds it (preselected)
   * or replaces the sessions of the week that are not done. Own groups (rename, delete with «No group» preselected),
   * arrows and drag to order, rename, remove. Every change goes to the page with a message (Undo is offered there).
   */
  import { CalendarPlus } from '@lucide/svelte';
  import { t, tn } from '../../i18n.svelte.js';
  import RenameSheet from '../../ui/RenameSheet.svelte';
  import GroupDeleteSheet from '../../ui/GroupDeleteSheet.svelte';
  import SortGrip from '../../ui/SortGrip.svelte';
  import SortArrows from '../../ui/SortArrows.svelte';
  import { sortable } from '../../ui/sortable.js';
  import { libraryGroups, moveInGroup, renameLibraryGroup, deleteLibraryGroup, weekTplStats, WEEKS_MAX } from '../../training.js';

  let { items = [], canKeep = false, hasSessions = false, weekdays = [], hours = (m) => `${m} min`, onkeep, onput, onchange } = $props();

  const groups = $derived(libraryGroups(items));
  const blocks = $derived([...groups.map((g) => ({ g, list: items.filter((e) => e.group === g) })), { g: '', list: items.filter((e) => !e.group) }].filter((b) => b.list.length));
  const full = $derived(items.length >= WEEKS_MAX);

  let keeping = $state(null); // { name, group } while the window «Keep this week» is open
  let newGroup = $state(false);
  let open = $state(false);
  let preview = $state(null); // the kept week shown before it is put in
  let renaming = $state(null);
  let deleting = $state(null);

  const startKeep = () => ((keeping = { name: '', group: '' }), (newGroup = false));
  function keep() {
    const name = keeping.name.trim().slice(0, 60);
    if (!name) return;
    onkeep(name, keeping.group.trim());
    keeping = null;
  }
  const meta = (w) => {
    const s = weekTplStats(w);
    return `${tn(s.n, '{n} session', '{n} sessions', { n: s.n })} · ${hours(s.mins)}${w.uses ? ` · ${w.uses}×` : ''}`;
  };
  const step = (w, dir) => onchange(moveInGroup(items, w.id, dir), '');
  function drag(list, from, to) {
    let next = items;
    const dir = to > from ? 1 : -1;
    for (let k = 0; k < Math.abs(to - from); k++) next = moveInGroup(next, list[from].id, dir);
    onchange(next, '');
  }
  const remove = (w) => onchange(items.filter((x) => x.id !== w.id), t('«{name}» removed from your weeks.', { name: w.name }));
  const setGroup = (w, g) => onchange(items.map((x) => (x.id === w.id ? { ...x, group: g } : x)), t('«{name}» moved.', { name: w.name }));
  const gName = (g) => g || t('No group');
  const put = (w, mode) => {
    preview = null;
    onput(w, mode);
  };
</script>

<div class="ws" data-saved-weeks>
  <div class="bar">
    {#if canKeep && hasSessions}<button type="button" class="btn sm" onclick={startKeep} disabled={full} data-week-keep><CalendarPlus size={16} aria-hidden="true" />{t('Keep this week')}</button>{/if}
    {#if items.length}<button type="button" class="btn btn-link sm" aria-expanded={open} onclick={() => (open = !open)} data-weeks-open>{t('My weeks ({n})', { n: items.length })}</button>{/if}
  </div>
  {#if full && hasSessions}<p class="hint">{t('You can keep up to {n} weeks. Remove one to keep another.', { n: WEEKS_MAX })}</p>{/if}
  {#if !items.length}<p class="hint" data-weeks-empty>{t('No week kept yet. Plan a good week and tap «Keep this week».')}</p>{/if}

  {#if keeping}
    <form class="kw" onsubmit={(e) => (e.preventDefault(), keep())} data-week-keep-form>
      <label>{t('Name')}<input class="inp" bind:value={keeping.name} maxlength="60" placeholder={t('e.g. Good build week')} data-week-keep-name /></label>
      <label>{t('Group')}
        {#if newGroup}
          <input class="inp" bind:value={keeping.group} maxlength="30" placeholder={t('Name of the group')} aria-label={t('Name of the group')} data-week-keep-newgroup />
        {:else}
          <select class="sel" value={keeping.group} onchange={(e) => (e.currentTarget.value === '__new' ? ((newGroup = true), (keeping.group = '')) : (keeping.group = e.currentTarget.value))} data-week-keep-group>
            <option value="">{t('No group')}</option>
            {#each groups as g (g)}<option value={g}>{g}</option>{/each}
            <option value="__new">{t('New group …')}</option>
          </select>
        {/if}
      </label>
      <p class="hint">{t('Kept are weekday, name, kind, sport, minutes and zone. Not kept: dates, «done» and notes.')}</p>
      <div class="acts"><button type="submit" class="btn btn-primary sm" data-week-keep-save>{t('Keep|week')}</button><button type="button" class="btn sm" onclick={() => (keeping = null)}>{t('Cancel')}</button></div>
    </form>
  {/if}

  {#if open && items.length}
    {#each blocks as b (b.g)}
      {#if groups.length}<p class="lg" data-weeks-group-name>{gName(b.g)}</p>{/if}
      <ul class="wl">
        {#each b.list as w (w.id)}
          <li data-week-saved={w.id}>
            <span class="wn"><b>{w.name}</b><small class="num">{meta(w)}</small></span>
            <button type="button" class="btn btn-primary sm" onclick={() => (preview = preview?.id === w.id ? null : w)} aria-expanded={preview?.id === w.id} data-week-put={w.id}>{t('Put in|week')}</button>
            {#if preview?.id === w.id}
              <div class="pv" data-week-preview>
                <ul>{#each w.items as i, k (k)}<li><b>{weekdays[i.dow]}</b> {i.name} · <span class="num">{hours(i.mins)}</span>{i.zone ? ` · Z${i.zone}` : ''}</li>{/each}</ul>
                <div class="acts">
                  <button type="button" class="btn btn-primary sm" onclick={() => put(w, 'add')} data-week-add>{t('Add to my sessions')}</button>
                  <button type="button" class="btn sm" onclick={() => put(w, 'replace')} data-week-replace>{t('Replace my sessions')}</button>
                </div>
                <p class="hint">{t('Adding keeps everything. Replacing removes only the sessions of this week that are not done. You can undo both.')}</p>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {/each}
    <details class="lm">
      <summary>{t('Manage my weeks')}</summary>
      <p class="hint">{t('Rename them, put them in groups, move them with the arrows or the handle. Remove with the cross: you can undo it for a few seconds.')}</p>
      {#each blocks as b (b.g)}
        <div class="gh" data-weeks-block={b.g}>
          <b>{gName(b.g)}</b>
          {#if b.g}<span><button type="button" class="btn btn-link sm" onclick={() => (renaming = b.g)} data-weeks-group-rename>{t('Rename')}</button><button type="button" class="btn btn-link sm" onclick={() => (deleting = b.g)} data-weeks-group-delete>{t('Delete')}</button></span>{/if}
        </div>
        <ul class="ml" use:sortable={{ onmove: (from, to) => drag(b.list, from, to) }}>
          {#each b.list as w, i (w.id)}
            <li data-sort-id={w.id}>
              <SortGrip name={w.name} onstep={(dir) => step(w, dir)} />
              <input class="inp" value={w.name} maxlength="60" aria-label={t('Name')} onchange={(ev) => onchange(items.map((x) => (x.id === w.id ? { ...x, name: ev.currentTarget.value.trim() || x.name } : x)), '')} data-weeks-name={w.id} />
              <select class="sel gs" aria-label={t('Group')} value={w.group} onchange={(ev) => (ev.currentTarget.value === '__new' ? ((renaming = `__new:${w.id}`), (ev.currentTarget.value = w.group)) : setGroup(w, ev.currentTarget.value))} data-weeks-group={w.id}>
                <option value="">{t('No group')}</option>
                {#each groups as g (g)}<option value={g}>{g}</option>{/each}
                <option value="__new">{t('New group …')}</option>
              </select>
              <SortArrows name={w.name} {i} n={b.list.length} onstep={(dir) => step(w, dir)} />
              <button type="button" class="btn btn-link sm" aria-label={t('Remove')} onclick={() => remove(w)} data-weeks-delete={w.id}>✕</button>
            </li>
          {/each}
        </ul>
      {/each}
    </details>
  {/if}
</div>

{#if renaming != null && renaming.startsWith('__new:')}
  <RenameSheet
    kicker={t('Group')}
    title={t('New group …')}
    value=""
    max={30}
    onsave={(n) => {
      const w = items.find((x) => x.id === renaming.slice(6));
      const name = n.trim();
      if (w && name) setGroup(w, name);
    }}
    onclose={() => (renaming = null)}
  />
{:else if renaming != null}
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
    what={(n) => tn(n, '{n} kept week', '{n} kept weeks')}
    none={t('No group')}
    noneHint={t('The weeks stay and show under «No group». No week is deleted.')}
    targets={groups.filter((g) => g !== deleting).map((g) => ({ id: g, name: g }))}
    onconfirm={(to) => onchange(deleteLibraryGroup(items, deleting, to ?? ''), t('Group «{name}» deleted.', { name: deleting }))}
    onclose={() => (deleting = null)}
  />
{/if}

<style>
  .ws { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; width: 100%; margin-top: 8px; }
  .bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .bar .btn { display: inline-flex; align-items: center; gap: 4px; }
  .kw { display: flex; flex-direction: column; gap: 8px; width: 100%; padding: 10px; border: 1px solid var(--line); border-radius: var(--r-md, 10px); }
  .kw label { display: flex; flex-direction: column; gap: 2px; font-size: var(--fs-small); color: var(--ink-2); }
  .acts { display: flex; gap: 8px; flex-wrap: wrap; }
  .lg { margin: 4px 0 0; font-weight: 600; font-size: var(--fs-small); }
  .wl, .ml, .pv ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; width: 100%; }
  .wl > li { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: center; justify-content: space-between; }
  .wn { display: flex; flex-direction: column; min-width: 0; }
  .wn small { color: var(--ink-2); }
  .pv { width: 100%; display: flex; flex-direction: column; gap: 6px; padding: 8px; background: var(--paper-2); border-radius: var(--r-md, 10px); }
  .pv ul { gap: 2px; font-size: var(--fs-small); }
  .lm { font-size: var(--fs-small); width: 100%; }
  .gh { display: flex; justify-content: space-between; align-items: center; margin: 10px 0 2px; }
  .ml li { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .ml .inp { flex: 1; min-width: 120px; }
  .ml .gs { flex: none; min-width: 150px; }
</style>
