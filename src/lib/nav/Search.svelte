<script>
  /**
   * Search everything from the top bar (v0.19.6, start page answer 1a): gear, trips, templates,
   * bikes and notes. On a phone the magnifier opens the field under the bar (v0.46.1: a full-width sheet).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { TEMPLATES_KEY } from '../templates.js';
  import { searchAll, commandActions } from '../search.js';
  import { openTrip, addItem, openNew, openNote, dayRide, openData, openWear } from '../nav.js';
  import { sortBikes } from '../bikes.js';
  import { recordCare, undoCare } from '../home/care-tap.js';
  import { countUse } from '../home/usage.js';
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
  // v0.46.0 (Noah 14a): "What do you want to do?": actions by keyword above the results.
  const cmds = $derived($all ? commandActions(q, { bikes: sortBikes($all.bikes) }) : []);
  let done = $state(null); // { text, undo } after a bike job saved from here
  let doneTimer;
  const USE = { weigh: 'weigh', dayride: 'dayride', chain: 'care', sealant: 'care', wash: 'care', km: 'km', note: 'note', wear: 'wear', trip: 'trip' };
  async function run(c) {
    const cmd = c.cmd;
    countUse(USE[cmd.kind]);
    if (['chain', 'sealant', 'wash'].includes(cmd.kind)) {
      const r = await recordCare(cmd.bikeId, cmd.kind);
      q = '';
      clearTimeout(doneTimer);
      done = r;
      doneTimer = setTimeout(() => (done = null), 8000);
      return;
    }
    q = '';
    open = false;
    if (cmd.kind === 'weigh') location.hash = '#/gear?tab=weigh';
    else if (cmd.kind === 'dayride') dayRide(cmd.bikeId ?? null);
    else if (cmd.kind === 'km') openNew('km');
    else if (cmd.kind === 'note') openNote(cmd.text ?? '');
    else if (cmd.kind === 'wear') openWear();
    else if (cmd.kind === 'trip') openNew('list');
  }
  async function undoDone() {
    const u = $state.snapshot(done?.undo); // a plain copy: IndexedDB cannot store Svelte proxies
    clearTimeout(doneTimer);
    done = null;
    await undoCare(u);
  }
  $effect(() => () => clearTimeout(doneTimer));
  // v0.46.1: while the sheet is open the top bar (with the sheet in it) lies above the page's own bars.
  $effect(() => {
    const on = open && (phone.matches || compact);
    document.body.classList.toggle('search-open', on);
    return () => document.body.classList.remove('search-open');
  });

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
      if (root && !root.contains(e.target) && (open || q || done)) (q = ''), (open = false), (done = null);
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
  // v0.46.1: the sheet starts right under the top bar (its height differs with the safe area).
  let top = $state(64);
  function toggle() {
    open = !open;
    if (open) {
      top = Math.round(root?.closest('header')?.getBoundingClientRect().bottom ?? 64);
      queueMicrotask(() => input?.focus());
    }
  }
  function close() {
    q = '';
    open = false;
    done = null;
    queueMicrotask(() => btn?.focus());
  }
  const key = (e) => {
    if (e.key === 'Escape') {
      q = '';
      // v0.44.1 (AP21): on a phone the field closes, so the focus goes back to the magnifier (not to the page top).
      if (open) (open = false), queueMicrotask(() => btn?.focus());
    }
    if (e.key === 'Enter' && cmds.length) run(cmds[0]);
    else if (e.key === 'Enter' && count) go(groups[0].rows[0]);
  };
</script>

<!-- v0.46.1 (Noah: "bei Suche auf Handy blockiert Suchfeld obersten Teil"): on a phone the open search
     is one clean sheet under the top bar (field, then the results), the magnifier turns into ×. -->
<div class="search" bind:this={root} class:ph={phone.matches || compact} class:open>
  {#if phone.matches || compact}
    <button type="button" class="icon" bind:this={btn} aria-label={open ? t('Close search') : t('Search everything')} aria-expanded={open} onclick={toggle}>
      {#if open}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      {:else}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
      {/if}
    </button>
    {#if open}
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div class="sheet" style="--top: {top}px" onclick={(e) => e.target === e.currentTarget && close()}>
        {@render field()}
        {@render results()}
        {#if q.trim().length < 2 && !done}<p class="tip">{t('Type two letters or more, or say what you want to do: "weigh", "day ride".')}</p>{/if}
      </div>
    {/if}
  {:else}
    {@render field()}
    {@render results()}
  {/if}
</div>

{#snippet field()}
  <label class="field">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
    <input bind:this={input} type="search" bind:value={q} onkeydown={key} placeholder={t('What do you want to do? "weigh", "day ride factor"')} aria-label={t('What do you want to do? Search or say an action')} autocomplete="off" />
  </label>
{/snippet}

{#snippet results()}
  {#if done && !q.trim()}
    <div class="res" role="region" aria-label={t('Search results')}>
      <p class="done" role="status"><span>{done.text}</span><button type="button" class="btn sm" onclick={undoDone}>{t('Undo')}</button></p>
    </div>
  {/if}
  {#if q.trim().length >= 2}
    <div class="res" role="region" aria-label={t('Search results')} aria-live="polite">
      {#if cmds.length}
        <p class="gh">{t('Do it now')}</p>
        <ul class="cmds">
          {#each cmds as c (c.id)}
            <li><button type="button" data-cmd={c.kind} onclick={() => run(c)}><span class="m"><b>{c.title}</b>{#if c.sub}<small>{c.sub}</small>{/if}</span><span class="go" aria-hidden="true">↵</span></button></li>
          {/each}
        </ul>
      {/if}
      {#each groups as g (g.kind)}
        <p class="gh">{t(g.name)}{g.more ? ` · ${t('{n} more', { n: g.more })}` : ''}</p>
        <ul>
          {#each g.rows as r (r.id)}
            <li><button type="button" onclick={() => go(r)}><span class="m"><b>{r.title}</b>{#if r.sub}<small>{r.sub}</small>{/if}</span>{#if r.v}<span class="v num">{r.v}</span>{/if}</button></li>
          {/each}
        </ul>
      {:else}
        {#if !cmds.length}<p class="none">{t('Nothing found for "{q}".', { q: q.trim() })}</p>{/if}
      {/each}
      {#if !groups.some((g) => g.kind === 'gear' && g.rows.some((r) => r.title.replace(/^★ /, '').toLowerCase() === q.trim().toLowerCase()))}
        <button type="button" class="add" onclick={addNew}>+ {t('Add "{q}" as a new item', { q: q.trim() })}</button>
      {/if}
    </div>
  {/if}
{/snippet}

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
    width: min(460px, 32vw);
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
    color: var(--brand-ink);
    cursor: pointer;
  }
  /* v0.46.1: phone: one sheet under the top bar, full width, the page dimmed below it. */
  .sheet {
    position: fixed;
    top: var(--top, 64px);
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 30;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px var(--gut, 16px) 16px;
    box-sizing: border-box;
    overflow-y: auto;
    overscroll-behavior: contain;
    background: var(--paper-2);
    color: var(--ink);
  }
  .sheet .field {
    flex: none;
    width: 100%;
    height: 48px;
    border: 1.5px solid var(--line-strong);
  }
  .tip {
    margin: 4px 2px;
    color: var(--ink-3);
    font-size: 15px;
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
    box-shadow: 0 10px 30px var(--shadow);
    z-index: 30;
    box-sizing: border-box;
  }
  .sheet .res {
    position: static;
    flex: none;
    width: auto;
    max-height: none;
    overflow: visible;
    box-shadow: none;
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
  /* v0.46.0: the actions first, each with a quiet ↵ (Enter does the first one). */
  .cmds li button {
    border-left: 3px solid var(--accent);
    border-radius: 0 6px 6px 0;
  }
  .go {
    flex: none;
    color: var(--ink-3);
  }
  .done {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 12px;
    margin: 4px 6px;
    font-weight: 600;
  }
  .done span {
    min-width: 0;
    overflow-wrap: anywhere;
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
    background: var(--paper-2);
  }
</style>
