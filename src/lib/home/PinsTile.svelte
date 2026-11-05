<script>
  /**
   * «Schnell öffnen» on Heute (Noah 01.11.2026 «1a 2a 3b 4a 5a»): your Quick Links pins as one calm tile. All pins
   * show; the pencil changes them right here (add from all functions, rename, unpin with Undo, order with arrows and
   * drag, back to the suggestions). Groups, notes and the other device stay on the page Quick Links. Same record as
   * that page (lib/quick/quicklinks.js), so a change here shows there and the other way round.
   */
  import { Pencil, Check, Plus, Trash2, RotateCcw, Search as SearchIcon } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import SortArrows from '../ui/SortArrows.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import { sortable } from '../ui/sortable.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { db } from '../db.js';
  import { FEATURES, FEATURE } from '../features.js';
  import { goFeature, runOf } from '../know/featureRun.js';
  import { glowFeature } from '../quick/findcard.js';
  import { USAGE_KEYS, cleanUsage, usePin } from '../quick/usage.js';
  import { QUICK_KEYS, deviceKind, cleanQuick, starter, pinLabel, flatPins, moveFlat, addPin, removePin, editPin, findForPin } from '../quick/quicklinks.js';
  import { localDay } from '../localday.js';
  import { t } from '../i18n.svelte.js';

  const kind = deviceKind();
  const KEY = QUICK_KEYS[kind];
  const USED = USAGE_KEYS[kind];

  let s = $state(cleanQuick(null));
  let bikeId = $state(null);
  let editing = $state(false);
  let adding = $state(false);
  let q = $state('');
  let open = $state(null); // the pin being renamed

  $effect(() => {
    const sub = liveQuery(() => db.settings.get(KEY)).subscribe({ next: (r) => (s = cleanQuick(r?.value)), error: () => {} });
    return () => sub.unsubscribe();
  });
  db.bikes.toCollection().first().then((b) => (bikeId = b?.id ?? null)).catch(() => {});

  const pins = $derived(flatPins(s));
  const hits = $derived(findForPin(FEATURES, q, t).filter((f) => !pins.some((p) => p.feature === f.id)).slice(0, 8));

  const save = (next) => db.settings.put({ key: KEY, value: JSON.parse(JSON.stringify(next)) });
  async function change(next, text) {
    const before = $state.snapshot(s);
    s = next;
    await save(next);
    if (text) offerDone(text, () => save(before));
  }

  async function go(p) {
    try {
      const u = cleanUsage((await db.settings.get(USED))?.value);
      await db.settings.put({ key: USED, value: JSON.parse(JSON.stringify(usePin(u, p.id, localDay()))) });
    } catch {
      /* the count is a nicety */
    }
    if (!p.feature) return void (location.hash = p.href);
    const f = FEATURE[p.feature];
    if (!f) return;
    goFeature(f, { bikeId });
    if (!runOf(f)) glowFeature(f.id);
  }
  const move = (a, b) => change(moveFlat(s, a, b));
  const unpin = (p) => change(removePin(s, p.id), t('«{name}» unpinned.', { name: pinLabel(p, t) }));
  const pin = (f) => {
    change(addPin(s, f.id, s.groups.at(-1)?.id ?? ''), t('«{name}» pinned.', { name: t(f.title) }));
    q = '';
  };
  function rename(p, e) {
    e.preventDefault();
    change(editPin(s, p.id, { name: String(new FormData(e.currentTarget).get('name') ?? '') }), t('Pin saved.'));
    open = null;
  }
  const reset = () => change(starter(), t('Back to the suggestions.'));
</script>

<section class="pt" data-pins-tile aria-label={t('Open quickly')}>
  <div class="pt-head">
    <span class="pt-n">{pins.length ? t('Your shortcuts') : t('No shortcuts yet')}</span>
    <button type="button" class="pt-edit" data-pins-edit aria-pressed={editing} onclick={() => ((editing = !editing), (open = null), (adding = false))}>
      {#if editing}<Check size={15} aria-hidden="true" />{t('Done')}{:else}<Pencil size={15} aria-hidden="true" />{t('Change shortcuts')}{/if}
    </button>
  </div>

  {#if !editing}
    <div class="pt-grid" role="list">
      {#each pins as p (p.id)}
        <button type="button" class="pt-pin" role="listitem" data-pin={p.feature || p.href} onclick={() => go(p)}>{pinLabel(p, t)}</button>
      {/each}
    </div>
  {:else}
    <ul class="pt-list" use:sortable={{ onmove: move, row: ':scope > li.pt-row' }}>
      {#each pins as p, i (p.id)}
        <li class="pt-row" data-sort-id={p.id} data-pin-row={p.feature || p.href}>
          <SortGrip name={pinLabel(p, t)} onstep={(d) => move(i, i + d)} />
          {#if open === p.id}
            <form class="pt-form" onsubmit={(e) => rename(p, e)}>
              <input class="pt-input" name="name" value={p.name} placeholder={p.feature ? t(FEATURE[p.feature]?.title ?? '') : p.title} maxlength="60" autocomplete="off" aria-label={t('Name')} />
              <button type="submit" class="btn sm hi">{t('Save')}</button>
              <button type="button" class="btn sm" onclick={() => (open = null)}>{t('Discard')}</button>
            </form>
          {:else}
            <span class="pt-lab">{pinLabel(p, t)}</span>
            <span class="pt-act">
              <button type="button" class="btn sm" aria-label={t('Rename «{name}»', { name: pinLabel(p, t) })} onclick={() => (open = p.id)}><Pencil size={15} aria-hidden="true" /></button>
              <button type="button" class="btn sm" aria-label={t('Unpin «{name}»', { name: pinLabel(p, t) })} onclick={() => unpin(p)}><Trash2 size={15} aria-hidden="true" /></button>
              <SortArrows name={pinLabel(p, t)} {i} n={pins.length} onstep={(d) => move(i, i + d)} />
            </span>
          {/if}
        </li>
      {/each}
    </ul>
    <div class="pt-tools">
      <button type="button" class="btn sm" data-pins-add aria-expanded={adding} onclick={() => (adding = !adding)}><Plus size={15} aria-hidden="true" />{t('Add a shortcut')}</button>
      <button type="button" class="btn sm" data-pins-reset onclick={reset}><RotateCcw size={15} aria-hidden="true" />{t('Back to the suggestions')}</button>
      <a class="pt-more" href="#/quick">{t('Groups and notes: Quick Links')} ›</a>
    </div>
    {#if adding}
      <div class="pt-add">
        <label class="pt-search"><SearchIcon size={15} aria-hidden="true" /><input class="pt-input" type="search" bind:value={q} placeholder={t('Search all functions')} aria-label={t('Search all functions')} autocomplete="off" /></label>
        {#if q.trim()}
          <ul class="pt-hits">
            {#each hits as f (f.id)}<li><button type="button" class="pt-hit" onclick={() => pin(f)}><Plus size={14} aria-hidden="true" />{t(f.title)}</button></li>{/each}
            {#if !hits.length}<li class="pt-none">{t('Nothing found.')}</li>{/if}
          </ul>
        {/if}
      </div>
    {/if}
  {/if}
</section>

<style>
  .pt {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-3);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    min-width: 0;
  }
  .pt-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2);
  }
  .pt-n {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .pt-edit {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 var(--sp-2);
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .pt-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(168px, 100%), 1fr)); /* «Werkzeugkasten» needs about 130 px of text: 150 px broke it mid-word (frontend walk E1-006) */
    gap: var(--sp-2);
  }
  .pt-pin {
    min-height: 48px;
    padding: 8px var(--sp-3);
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    overflow-wrap: break-word;
    hyphens: auto;
    cursor: pointer;
  }
  .pt-pin:hover {
    background: var(--paper-2);
  }
  .pt-list,
  .pt-hits {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
  }
  .pt-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2);
    min-width: 0;
  }
  .pt-act {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }
  .pt-lab {
    flex: 1 1 0;
    min-width: 72px;
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .pt-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2);
    flex: 1 1 auto;
    min-width: 0;
  }
  .pt-input {
    flex: 1 1 140px;
    min-width: 0;
    min-height: 40px;
    padding: 0 var(--sp-2);
    border: 1px solid var(--line);
    border-radius: 8px;
    font: inherit;
  }
  .pt-tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2);
  }
  .pt-more {
    font-size: var(--fs-small);
  }
  .pt-add {
    display: grid;
    gap: var(--sp-2);
  }
  .pt-search {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
  .pt-hit {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    min-height: 44px;
    padding: 0 var(--sp-2);
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .pt-hit:hover {
    background: var(--paper-2);
  }
  .pt-none {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
