<script>
  /**
   * Search everything from the top bar (v0.19.6, start page answer 1a): gear, trips, templates,
   * bikes and notes. On a phone the magnifier opens the field under the bar.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { TEMPLATES_KEY } from '../templates.js';
  import { searchAll } from '../search.js';
  import { openTrip, addItem, openNew, openNote, dayRide, openData } from '../nav.js';
  import { phone } from '../media.svelte.js';
  import { t } from '../i18n.svelte.js';

  let { compact = false } = $props();
  let q = $state('');
  let open = $state(false); // phone: the field is shown
  let input = $state();
  let btn = $state(); // phone: the magnifier that opened the field
  const all = liveQuery(async () => {
    const [items, trips, bikes, notes, tpl, events] = await Promise.all([db.items.toArray(), db.trips.toArray(), db.bikes.toArray(), db.notes.toArray(), db.settings.get(TEMPLATES_KEY), db.events.toArray()]);
    return { items, trips, bikes, notes, templates: tpl?.value ?? [], events };
  });
  const groups = $derived(q.trim().length >= 2 && $all ? searchAll(q, $all) : []);
  const count = $derived(groups.reduce((n, g) => n + g.rows.length, 0));

  // v0.38.0 (Noah 13a): pages of "More" and the things of "New" are found too; an action does it.
  const RUN = { trip: () => openNew('list'), dayride: dayRide, note: () => openNote(''), item: () => addItem(), km: () => openNew('km'), data: openData };
  function go(row) {
    if (row.tripId) openTrip(row.tripId);
    q = '';
    open = false;
    if (row.action && RUN[row.action]) return RUN[row.action]();
    if (location.hash === row.href) window.dispatchEvent(new HashChangeEvent('hashchange'));
    else location.hash = row.href;
  }
  // v0.38.0: another page closes the search (the field and its results).
  $effect(() => {
    const close = () => ((q = ''), (open = false));
    window.addEventListener('hashchange', close);
    return () => window.removeEventListener('hashchange', close);
  });
  // v0.40.0 (design check): a tap anywhere else (a place in the bottom bar, +) closes it too.
  let root = $state();
  $effect(() => {
    const away = (e) => {
      if (root && !root.contains(e.target) && (open || q)) (q = ''), (open = false);
    };
    document.addEventListener('pointerdown', away, true);
    return () => document.removeEventListener('pointerdown', away, true);
  });
  // v0.24.0 (Noah): what is not there yet can be added right from the search.
  function addNew() {
    const name = q.trim();
    q = '';
    open = false;
    addItem(name);
  }
  function toggle() {
    open = !open;
    if (open) queueMicrotask(() => input?.focus());
  }
  const key = (e) => {
    if (e.key === 'Escape') {
      q = '';
      // v0.44.1 (AP21): on a phone the field closes, so the focus goes back to the magnifier (not to the page top).
      if (open) (open = false), queueMicrotask(() => btn?.focus());
    }
    if (e.key === 'Enter' && count) go(groups[0].rows[0]);
  };
</script>

<div class="search" bind:this={root} class:ph={phone.matches || compact} class:open>
  {#if phone.matches || compact}
    <button type="button" class="icon" bind:this={btn} aria-label={open ? t('Close search') : t('Search everything')} aria-expanded={open} onclick={toggle}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
    </button>
  {/if}
  {#if (!phone.matches && !compact) || open}
    <label class="field">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
      <input bind:this={input} type="search" bind:value={q} onkeydown={key} placeholder={t('Search: gear, trips, bikes, pages')} aria-label={t('Search everything')} autocomplete="off" />
    </label>
  {/if}
  {#if q.trim().length >= 2}
    <div class="res" role="region" aria-label={t('Search results')} aria-live="polite">
      {#each groups as g (g.kind)}
        <p class="gh">{t(g.name)}{g.more ? ` · ${t('{n} more', { n: g.more })}` : ''}</p>
        <ul>
          {#each g.rows as r (r.id)}
            <li><button type="button" onclick={() => go(r)}><span class="m"><b>{r.title}</b>{#if r.sub}<small>{r.sub}</small>{/if}</span>{#if r.v}<span class="v num">{r.v}</span>{/if}</button></li>
          {/each}
        </ul>
      {:else}
        <p class="none">{t('Nothing found for "{q}".', { q: q.trim() })}</p>
      {/each}
      {#if !groups.some((g) => g.kind === 'gear' && g.rows.some((r) => r.title.replace(/^★ /, '').toLowerCase() === q.trim().toLowerCase()))}
        <button type="button" class="add" onclick={addNew}>+ {t('Add "{q}" as a new item', { q: q.trim() })}</button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .search {
    position: relative;
    display: flex;
    align-items: center;
  }
  .field {
    display: flex;
    align-items: center;
    gap: 8px;
    width: min(320px, 32vw);
    height: 40px;
    padding: 0 12px;
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    box-sizing: border-box;
  }
  .field input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--ink);
    font: 400 15px var(--font-body);
  }
  /* v0.22.0 (AP03): the ring sits on the whole field (light on the dark bar, orange on a phone). */
  .field:has(input:focus-visible) {
    outline: 3px solid var(--focus-on-dark);
    outline-offset: 2px;
  }
  .ph .field:has(input:focus-visible) {
    outline-color: var(--focus);
  }
  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--paper);
    cursor: pointer;
  }
  /* Phone: the field sits under the bar, full width. */
  .ph .field {
    position: fixed;
    left: 8px;
    right: 8px;
    top: calc(56px + env(safe-area-inset-top));
    width: auto;
    height: 48px;
    border: 1.5px solid var(--line-strong);
    z-index: 30;
  }
  .res {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    width: min(420px, 90vw);
    max-height: 70vh;
    overflow: auto;
    padding: 8px;
    border: 1.5px solid var(--line-strong);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 10px 30px rgba(15, 46, 39, 0.25);
    z-index: 30;
    box-sizing: border-box;
  }
  .ph .res {
    position: fixed;
    left: 8px;
    right: 8px;
    top: calc(110px + env(safe-area-inset-top));
    width: auto;
  }
  .gh {
    margin: 8px 6px 2px;
    font: 600 13px var(--font-body);
    color: var(--ink-3);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  /* v0.40.0 (design check R3): the weight in a right column. */
  li button {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 44px;
    padding: 6px 8px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--ink);
    font: 500 15px var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  li button:hover,
  li button:focus-visible {
    background: var(--paper-2);
  }
  .m {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .v {
    flex: none;
    color: var(--ink-2);
    font-size: 14px;
    font-weight: 400;
  }
  li small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .none {
    margin: 6px;
    color: var(--ink-3);
  }
  .add {
    display: block;
    width: 100%;
    min-height: 44px;
    margin-top: 4px;
    padding: 8px 10px;
    border: 0;
    border-top: 1px solid var(--line);
    background: none;
    color: var(--ink);
    font: 600 15px var(--font-body);
    text-align: left;
    overflow-wrap: break-word;
    cursor: pointer;
  }
  .add:hover,
  .add:focus-visible {
    background: var(--paper-2, #eef1ec);
  }
</style>
