<script>
  /**
   * «Bereiche anpassen» (Noah 27.10.2026 «1a 2a»): under «Customise the start page» the areas of Heute in a list.
   * Move them with the arrows or drag (1a), rename them and hide them (2a). Hiding asks where the tiles go
   * («Without area» at the end of Heute first, GroupDeleteSheet); tiles never leave Heute with it. Every change
   * offers Undo; a hidden area comes back with «Show again». Names the person typed never go through t().
   */
  import { Pencil, EyeOff, Eye } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import GroupDeleteSheet from '../ui/GroupDeleteSheet.svelte';
  import { sortable } from '../ui/sortable.js';
  import { offerDone, offerRename } from '../ui/rename.svelte.js';
  import { AREAS_KEY, normAreas, areasOf, sectionsOf, moveArea, renameArea, hideArea, showArea } from './sections.js';

  let { cfg = null, tiles = [] } = $props();

  const all = $derived(areasOf(cfg));
  const shown = $derived(all.filter((a) => !a.off));
  const hidden = $derived(all.filter((a) => a.off));
  const counts = $derived(Object.fromEntries(sectionsOf(tiles, cfg).map((s) => [s.key, s.tiles.length])));
  const nameOf = (a) => a.own ?? t(a.name);
  const tilesText = (n) => (n === 1 ? t('1 tile') : t('{n} tiles', { n }));

  let renaming = $state(null);
  let hiding = $state(null);

  const read = async () => normAreas((await db.settings.get(AREAS_KEY))?.value);
  const save = (value) => db.settings.put({ key: AREAS_KEY, value: $state.snapshot(value) });

  const move = async (from, to) => save(moveArea(await read(), from, to));
  async function rename(name) {
    const a = renaming;
    const before = await read();
    await save(renameArea(before, a.key, name));
    offerRename(name.trim() || t(a.name), () => save(before));
  }
  async function hide(to) {
    const a = hiding;
    const before = await read();
    await save(hideArea(before, a.key, to ?? ''));
    offerDone(t('Area "{name}" hidden.', { name: nameOf(a) }), () => save(before));
  }
  async function show(a) {
    const before = await read();
    await save(showArea(before, a.key));
    offerDone(t('Area "{name}" shown again.', { name: nameOf(a) }), () => save(before));
  }
</script>

<section class="areas" aria-labelledby="ar-h" data-home-areas>
  <h3 id="ar-h">{t('Areas of Today')}</h3>
  <p class="hint">{t('Move the areas with the arrows or drag, rename them or hide them. The tiles of a hidden area stay on Today.')}</p>
  <ul class="rows" use:sortable={{ onmove: move }}>
    {#each shown as a, i (a.key)}
      <li data-sort-id={a.key} data-area-row={a.key}>
        <SortGrip name={nameOf(a)} onstep={(dir) => move(i, i + dir)} />
        <span class="nm">{nameOf(a)} <small>{tilesText(counts[a.key] ?? 0)}</small></span>
        <SortArrows name={nameOf(a)} {i} n={shown.length} onstep={(dir) => move(i, i + dir)} />
        <button type="button" class="ib" aria-label={t('Rename {name}', { name: nameOf(a) })} onclick={() => (renaming = a)} data-area-rename><Pencil size={16} aria-hidden="true" /></button>
        <button type="button" class="ib" aria-label={t('Hide {name}', { name: nameOf(a) })} onclick={() => (hiding = a)} data-area-hide><EyeOff size={16} aria-hidden="true" /></button>
      </li>
    {/each}
  </ul>
  {#if hidden.length}
    <h4>{t('Hidden areas')}</h4>
    <ul class="rows">
      {#each hidden as a (a.key)}
        <li data-area-hidden={a.key}>
          <span class="nm">{nameOf(a)}</span>
          <button type="button" class="btn sm ibtn" aria-label={t('Show {name} again', { name: nameOf(a) })} onclick={() => show(a)} data-area-show><Eye size={16} aria-hidden="true" />{t('Show again')}</button>
        </li>
      {/each}
    </ul>
  {/if}
</section>

{#if renaming}
  <RenameSheet kicker={t('Area of Today')} title={t('Rename area')} value={nameOf(renaming)} hint={t('The heading of the area on Today.')} empty={t('Empty: back to the name of the app.')} max={40} onsave={rename} onclose={() => (renaming = null)} />
{/if}
{#if hiding}
  <GroupDeleteSheet
    title={t('Hide area "{name}"?', { name: nameOf(hiding) })}
    count={counts[hiding.key] ?? 0}
    what={tilesText}
    none={t('Without area')}
    noneHint={t('At the end of Today, under one heading')}
    targets={shown.filter((a) => a.key !== hiding.key).map((a) => ({ id: a.key, name: nameOf(a) }))}
    note={t('The tiles stay on Today. «Show again» below brings the area back.')}
    empty={t('No tile is in it right now.')}
    action={t('Hide|area')}
    onconfirm={hide}
    onclose={() => (hiding = null)}
  />
{/if}

<style>
  .areas {
    margin: 12px 0 4px;
  }
  h3 {
    margin: 0;
    font-size: var(--fs-body);
  }
  h4 {
    margin: 12px 0 4px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .hint {
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
    flex: 1 1 4rem; /* the name wraps, the buttons stay in one row on a 390 px phone */
    min-width: 0;
    overflow-wrap: break-word;
  }
  small {
    color: var(--ink-2);
    font-size: var(--fs-small);
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
  .ibtn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
</style>
