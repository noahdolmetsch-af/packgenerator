<script>
  /**
   * «Alles hier» (Noah 03.11.2026 «1a», plan «freigabe»): every function of an area as a tile on top of its page, one
   * tap away. «Change» opens the list: arrows and the handle move a tile, «Hide» takes it away (Undo), a hidden tile
   * comes back with «Show», «As at the start» resets. Lists and logic: src/lib/alleshier.js.
   * area: a key of ALL_HERE (e.g. 'bikes'); vars: values for place holders in a page (e.g. { bike } for the bike folder).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { putSetting } from '../flowdb.js';
  import { EyeOff, Eye, SlidersHorizontal, RotateCcw } from '@lucide/svelte';
  import SortGrip from './SortGrip.svelte';
  import SortArrows from './SortArrows.svelte';
  import { sortable } from './sortable.js';
  import { deleteWithUndo } from './ask.js';
  import { ALL_HERE, allHereKey, arrange, step, moveTo, setHidden } from '../alleshier.js';
  import { t, tn } from '../i18n.svelte.js';

  let { area, vars = {} } = $props();

  // svelte-ignore state_referenced_locally
  const key = allHereKey(area);
  const stateQ = liveQuery(() => db.settings.get(key));
  const cur = $derived($stateQ?.value ?? null);
  // svelte-ignore state_referenced_locally
  const tiles = $derived(arrange(area, cur, vars));
  // a drag place in the shown tiles, as a place in all shown ids (a tile waiting for a bike is not shown)
  const place = (i) => tiles.ids.indexOf(tiles.shown[i]?.id);
  let editing = $state(false);

  const save = (s) => putSetting(db, key, s);
  const name = (x) => t(x.title);

  async function hide(x) {
    const before = $state.snapshot(cur);
    await deleteWithUndo({ run: () => save(setHidden(area, cur, x.id, true)), undo: () => save(before), text: t('«{name}» hidden', { name: name(x) }), name: name(x) });
  }
</script>

{#if ALL_HERE[area]}
  <section class="allhere" aria-labelledby="ah-h-{area}" data-all-here={area} data-no-pin>
    <div class="ah-head">
      <h2 id="ah-h-{area}">{t('All here')}</h2>
      <span class="ah-n">{tn(tiles.shown.length, '{n} function', '{n} functions')}</span>
      <button type="button" class="text-button ah-edit" aria-expanded={editing} onclick={() => (editing = !editing)} data-all-here-edit><SlidersHorizontal size={16} aria-hidden="true" />{editing ? t('Done') : t('Change')}</button>
    </div>
    {#if editing}
      <p class="ah-hint">{t('Move with the arrows or the handle. Hidden tiles stay in the app and come back with «Show».')}</p>
      <ul class="ah-list" use:sortable={{ onmove: (from, to) => save(moveTo(area, cur, place(from), place(to))) }}>
        {#each tiles.shown as x, i (x.id)}
          <li data-sort-id={x.id}>
            <SortGrip name={name(x)} onstep={(dir) => save(step(area, cur, x.id, dir))} />
            <span class="ah-name">{name(x)}</span>
            <SortArrows name={name(x)} {i} n={tiles.shown.length} onstep={(dir) => save(step(area, cur, x.id, dir))} />
            <button type="button" class="btn sm" onclick={() => hide(x)} aria-label={t('Hide {name}', { name: name(x) })}><EyeOff size={16} aria-hidden="true" />{t('Hide')}</button>
          </li>
        {/each}
      </ul>
      {#if tiles.hidden.length}
        <p class="ah-sub">{t('Hidden')}</p>
        <ul class="ah-list hidden">
          {#each tiles.hidden as x (x.id)}
            <li><span class="ah-name">{name(x)}</span><button type="button" class="btn sm" onclick={() => save(setHidden(area, cur, x.id, false))} aria-label={t('Show {name}', { name: name(x) })}><Eye size={16} aria-hidden="true" />{t('Show')}</button></li>
          {/each}
        </ul>
      {/if}
      {#if cur}<button type="button" class="text-button ah-reset" onclick={() => save(null)}><RotateCcw size={16} aria-hidden="true" />{t('As at the start')}</button>{/if}
    {:else if tiles.shown.length}
      <ul class="ah-grid">
        {#each tiles.shown as x (x.id)}
          <li><a href={x.href} data-all-here-tile={x.id}>{name(x)}</a></li>
        {/each}
      </ul>
    {:else}
      <p class="ah-hint">{t('All tiles are hidden. Tap «Change» to show them again.')}</p>
    {/if}
  </section>
{/if}

<style>
  .allhere {
    margin: 8px 0 16px;
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  .ah-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
    margin-bottom: 8px;
  }
  .ah-head h2 {
    margin: 0;
    font-size: var(--fs-body);
  }
  .ah-n {
    color: var(--muted);
    font-size: var(--fs-label);
  }
  .ah-edit {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .ah-grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
  }
  .ah-grid a {
    display: flex;
    align-items: center;
    min-height: 44px;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    color: var(--ink);
    font-weight: 600;
    font-size: var(--fs-label);
    line-height: 1.25;
    text-decoration: none;
  }
  .ah-grid a:hover {
    border-color: var(--accent, var(--ink));
  }
  .ah-hint,
  .ah-sub {
    margin: 0 0 8px;
    color: var(--muted);
    font-size: var(--fs-label);
  }
  .ah-list {
    list-style: none;
    margin: 0 0 10px;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .ah-list li {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
  }
  .ah-name {
    flex: 1;
    min-width: 0;
  }
  .ah-reset {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
</style>
