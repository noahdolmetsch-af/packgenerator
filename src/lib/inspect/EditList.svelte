<script>
  /**
   * «Velo-Inspektion» «Checkliste bearbeiten» (rule 18 «alles selbst bearbeiten», rule 17 «Gruppen überall»,
   * rule 14 «Pfeile und Ziehen»): add, rename, delete and move the points; add, rename, delete and move the
   * areas. Deleting an area asks where its points go («Ohne Gruppe» first, GroupDeleteSheet); points are
   * never deleted with it. Every delete offers Undo; «Standard» brings the app's list back (with Undo).
   * The list is one for all bikes; each bike shows only the points that fit it (kind, fork, shock).
   */
  import { Plus, Pencil, Trash2, RotateCcw, Link as LinkIcon } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import Seg from '../ui/Seg.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import GroupDeleteSheet from '../ui/GroupDeleteSheet.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone, offerRename } from '../ui/rename.svelte.js';
  import { LEVELS } from './items.js';
  import { INSPECT_LIST, normList, areasOf, pointsIn, renamePoint, deletePoint, addPoint, movePoint, setArea, renameArea, addArea, deleteArea, moveArea, changeOwn, listChanged } from './inspect.js';
  import { insp } from './live.svelte.js';
  import { pointName, areaName, levelName } from './names.js';
  import ShowMore from '../ui/ShowMore.svelte';
  import { phone } from '../media.svelte.js';
  import { PHONE_ROWS, capGroups } from '../touren/kurz.js';

  const list = $derived(insp.list);
  const areas = $derived(areasOf(list));
  const loose = $derived(pointsIn(list, ''));
  const read = async () => normList((await db.settings.get(INSPECT_LIST))?.value);
  const save = (value) => db.settings.put({ key: INSPECT_LIST, value: $state.snapshot(value) });

  let newName = $state('');
  let newArea = $state('extras');
  let newLevel = $state('full');
  let newAreaName = $state('');
  let msg = $state('');
  let renaming = $state(null); // { kind: 'point'|'area', item }
  let deletingArea = $state(null);
  let ownOpen = $state(null);
  // Gesamttest 21.10.2026 C7: on a phone the areas show their first PHONE_ROWS rows, and the points their first
  // PHONE_ROWS rows over all areas, each then «Show n more». The rows shown are the first ones of each list, so the
  // arrows and the drag keep the places of the whole list.
  let areasAll = $state(false);
  let pointsAll = $state(false);
  const areasShown = $derived(phone.matches && !areasAll ? areas.slice(0, PHONE_ROWS) : areas);
  const groups = $derived([...areas, ...(loose.length ? [{ id: '', std: 'No group', name: null }] : [])].map((a) => ({ a, pts: pointsIn(list, a.id) })));
  const pointsN = $derived(groups.reduce((s, g) => s + g.pts.length, 0));
  const groupsShown = $derived(phone.matches && !pointsAll && pointsN > PHONE_ROWS ? capGroups(groups, PHONE_ROWS, 'pts') : groups);
  const pointsHidden = $derived(pointsN - groupsShown.reduce((s, g) => s + g.pts.length, 0));

  async function add(e) {
    e?.preventDefault();
    const r = addPoint(await read(), { name: newName, area: areas.some((a) => a.id === newArea) ? newArea : '', level: newLevel });
    if (!r.id) return (msg = t('Give it a name.'));
    await save(r.list);
    offerDone(t('"{name}" added to the checklist.', { name: newName.trim() }));
    newName = '';
    msg = '';
    pointsAll = true; // the new point shows, also on a phone
  }
  async function addGroup(e) {
    e?.preventDefault();
    const r = addArea(await read(), newAreaName);
    if (!r.id) return (msg = t('Give it a name.'));
    await save(r.list);
    offerDone(t('Area "{name}" added.', { name: newAreaName.trim() }));
    newArea = r.id;
    newAreaName = '';
    areasAll = true;
    msg = '';
  }
  async function rename(name) {
    const r = renaming;
    const before = $state.snapshot(list);
    await save(r.kind === 'area' ? renameArea(await read(), r.item.id, name) : renamePoint(await read(), r.item.id, name));
    offerRename(name.trim() || (r.kind === 'area' ? t(r.item.std ?? '') : t(r.item.std ?? '')), () => save(before));
  }
  async function removePoint(p) {
    const name = pointName(p);
    const answer = await askDelete({ title: t('Delete "{name}"?', { name }), text: p.own ? t('Your own point goes. Inspections already saved keep it.') : t('The point no longer shows. «Standard» brings it back.') });
    if (answer !== 'delete') return;
    await deleteWithUndo({
      name,
      text: t('"{name}" deleted.', { name }),
      run: async () => {
        const before = await read();
        await save(deletePoint(before, p.id));
        return before;
      },
      undo: (before) => save(before),
    });
  }
  async function removeArea(to) {
    const a = deletingArea;
    const before = await read();
    await save(deleteArea(before, a.id, to));
    offerDone(t('Area "{name}" deleted.', { name: areaName(a) }), () => save(before));
  }
  const moveIn = async (areaId, from, to) => save(movePoint(await read(), areaId, from, to));
  const moveGroup = async (from, to) => save(moveArea(await read(), from, to));
  const putIn = async (p, areaId) => save(setArea(await read(), p.id, areaId));
  const setOwn = async (p, patch) => save(changeOwn(await read(), p.id, patch));
  async function reset() {
    const before = await read();
    await save(normList(null));
    offerDone(t('Checklist back to standard.'), () => save(before));
  }
</script>

<section class="edit" aria-labelledby="el-h" data-inspect-edit>
  <h2 id="el-h">{t('Edit checklist')}</h2>
  <p class="hint">{t('One list for all bikes: each bike shows only the points that fit it. Rename, delete, move with the arrows or drag, add your own.')}</p>

  <h3>{t('Areas')}</h3>
  <ul class="rows" use:sortable={{ onmove: moveGroup }}>
    {#each areasShown as a, i (a.id)}
      <li data-sort-id={a.id} data-area-row={a.id}>
        <SortGrip name={areaName(a)} onstep={(dir) => moveGroup(i, i + dir)} />
        <span class="nm">{areaName(a)} <small>{pointsIn(list, a.id).length}</small></span>
        <SortArrows name={areaName(a)} {i} n={areas.length} onstep={(dir) => moveGroup(i, i + dir)} />
        <button type="button" class="ib" aria-label={t('Rename {name}', { name: areaName(a) })} onclick={() => (renaming = { kind: 'area', item: a })} data-area-rename><Pencil size={16} aria-hidden="true" /></button>
        <button type="button" class="ib" aria-label={t('Delete {name}', { name: areaName(a) })} onclick={() => (deletingArea = a)} data-area-delete><Trash2 size={16} aria-hidden="true" /></button>
      </li>
    {/each}
  </ul>
  {#if areasShown.length < areas.length}<ShowMore n={areas.length - areasShown.length} onclick={() => (areasAll = true)} data-areas-more />{/if}
  <form class="addrow" onsubmit={addGroup}>
    <input class="inp" type="text" maxlength="40" aria-label={t('Name of the new area')} placeholder={t('New area, e.g. Bikepacking')} bind:value={newAreaName} data-area-new />
    <button type="submit" class="btn ibtn" data-area-add><Plus size={16} aria-hidden="true" />{t('Add area')}</button>
  </form>

  {#each groupsShown as { a, pts } (a.id)}
    {@const n = pointsIn(list, a.id).length}
    <h3>{areaName(a)}</h3>
    {#if pts.length}
      <ul class="rows" use:sortable={{ onmove: (from, to) => moveIn(a.id, from, to) }}>
        {#each pts as p, i (p.id)}
          <li data-sort-id={p.id} data-point-row={p.id}>
            <SortGrip name={pointName(p)} onstep={(dir) => moveIn(a.id, i, i + dir)} />
            <span class="nm">{pointName(p)}{' '}<small>{levelName(p.level)}{p.own ? ` · ${t('own|point')}` : ''}{p.kinds ? ` · ${p.kinds.map((k) => t(k === 'mtb' ? 'Mountain bike' : k === 'road' ? 'Road bike' : 'Gravel|kind')).join(', ')}` : ''}</small></span>
            <select class="inp asel" aria-label={t('Area of {name}', { name: pointName(p) })} value={a.id} onchange={(e) => putIn(p, e.currentTarget.value)} data-point-area>
              {#each areas as x (x.id)}<option value={x.id}>{areaName(x)}</option>{/each}
              <option value="">{t('No group')}</option>
            </select>
            <SortArrows name={pointName(p)} {i} {n} onstep={(dir) => moveIn(a.id, i, i + dir)} />
            {#if p.own}<button type="button" class="ib" aria-label={t('Note and link of {name}', { name: pointName(p) })} aria-expanded={ownOpen === p.id} onclick={() => (ownOpen = ownOpen === p.id ? null : p.id)}><LinkIcon size={16} aria-hidden="true" /></button>{/if}
            <button type="button" class="ib" aria-label={t('Rename {name}', { name: pointName(p) })} onclick={() => (renaming = { kind: 'point', item: p })} data-point-rename><Pencil size={16} aria-hidden="true" /></button>
            <button type="button" class="ib" aria-label={t('Delete {name}', { name: pointName(p) })} onclick={() => removePoint(p)} data-point-delete><Trash2 size={16} aria-hidden="true" /></button>
            {#if p.own && ownOpen === p.id}
              <div class="ownx">
                <Seg small full={false} label={t('Level')} options={LEVELS.map((l) => ({ key: l.key, name: t(l.short) }))} value={p.level} onchange={(k) => setOwn(p, { level: k })} />
                <label><span class="lbl">{t('Note: what to do')}</span><textarea class="inp" rows="2" maxlength="400" value={p.note} onchange={(e) => setOwn(p, { note: e.currentTarget.value })}></textarea></label>
                <label><span class="lbl">{t('Link to a guide')}</span><input class="inp" type="url" placeholder="https://" value={p.url} onchange={(e) => setOwn(p, { url: e.currentTarget.value })} /></label>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="quiet">{t('No points in this area.')}</p>
    {/if}
  {/each}
  {#if pointsHidden > 0}<ShowMore n={pointsHidden} onclick={() => (pointsAll = true)} data-points-more />{/if}

  <h3>{t('Add your own point')}</h3>
  <form class="addform" onsubmit={add}>
    <input class="inp" type="text" maxlength="80" aria-label={t('Name of the point')} placeholder={t('e.g. Check the bell')} bind:value={newName} oninput={() => (msg = '')} data-point-new />
    <select class="inp" aria-label={t('Area')} bind:value={newArea} data-point-newarea>
      {#each areas as x (x.id)}<option value={x.id}>{areaName(x)}</option>{/each}
      <option value="">{t('No group')}</option>
    </select>
    <Seg small full={false} label={t('Level')} options={LEVELS.map((l) => ({ key: l.key, name: t(l.short) }))} value={newLevel} onchange={(k) => (newLevel = k)} />
    <button type="submit" class="btn ibtn" data-point-add><Plus size={16} aria-hidden="true" />{t('Add|row')}</button>
  </form>
  {#if msg}<p class="err" role="alert">{msg}</p>{/if}

  {#if listChanged(list)}
    <p><button type="button" class="btn ibtn" onclick={reset} data-inspect-reset><RotateCcw size={16} aria-hidden="true" />{t('Back to standard')}</button></p>
  {/if}
</section>

{#if renaming}
  <RenameSheet
    kicker={renaming.kind === 'area' ? t('Area') : t('Checklist')}
    title={renaming.kind === 'area' ? t('Rename area') : t('Rename point')}
    value={renaming.kind === 'area' ? areaName(renaming.item) : pointName(renaming.item)}
    empty={renaming.item.own ? '' : t('Empty: back to the standard name.')}
    max={80}
    onsave={rename}
    onclose={() => (renaming = null)}
  />
{/if}
{#if deletingArea}
  <GroupDeleteSheet
    title={t('Delete area "{name}"?', { name: areaName(deletingArea) })}
    count={pointsIn(list, deletingArea.id).length}
    what={(n) => (n === 1 ? t('1 point') : t('{n} points', { n }))}
    none={t('No group')}
    noneHint={t('The points stay and show under «No group».')}
    targets={areas.filter((a) => a.id !== deletingArea.id).map((a) => ({ id: a.id, name: areaName(a) }))}
    onconfirm={removeArea}
    onclose={() => (deletingArea = null)}
  />
{/if}

<style>
  .edit {
    margin: 0 0 14px;
    padding: 14px 16px 10px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  h3 {
    margin: 16px 0 4px;
    font-size: var(--fs-body);
  }
  .hint,
  .quiet {
    margin: 4px 0 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .rows li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 6px;
    padding: 4px 0;
    border-top: 1px solid var(--line);
    background: var(--paper);
  }
  .nm {
    display: grid;
    flex: 1 1 10rem;
    min-width: 0;
    overflow-wrap: break-word;
  }
  small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .asel {
    max-width: 11rem;
    min-height: 44px;
  }
  .ib {
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink);
    cursor: pointer;
  }
  .ownx {
    display: grid;
    gap: 8px;
    flex: 1 1 100%;
    padding: 4px 0 8px;
  }
  .ownx label {
    display: grid;
    gap: 4px;
  }
  .addrow,
  .addform {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 8px 0 0;
  }
  .addrow .inp,
  .addform .inp {
    flex: 1 1 12rem;
    min-height: 44px;
  }
  .ibtn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .err {
    color: var(--bad);
  }
</style>
