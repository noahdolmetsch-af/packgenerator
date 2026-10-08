<script>
  /**
   * v0.35.0 (AP29, Noah): the rows of "In progress": name; short date left, a small neutral badge
   * right; a chevron; ••• with the quiet actions. The whole row opens the trip at its next step.
   * Kept on its own so a later tab "In progress" (variant A) can show the same rows.
   *
   * rows: drafts.js inProgress(); current: the trip open on this page (highlighted, no chevron);
   * onopen(row); onaction(row, action) for 'skip' | 'end' | 'noDebrief' | 'discard' (after the
   * question below for 'discard'); trips: the records (for "Not riding" vs "Not going" and the question).
   */
  import { ChevronRight, Check, Ellipsis } from '@lucide/svelte';
  import { t, locale } from '../i18n.svelte.js';
  import { rowActions, hasWork } from '../drafts.js';

  let { rows = [], current = null, trips = [], onopen, onaction } = $props();

  let menu = $state(null); // the id whose ••• is open
  let asking = $state(null); // the id whose "Discard?" question shows
  const tripOf = (row) => trips.find((x) => x.id === row.tripId) ?? null;
  const short = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' }) : t('No date set'));
  function label(action, row) {
    if (action === 'skip') return row.bike ? t('Not riding|menu') : t('Not going|menu');
    if (action === 'end') return t('End the trip today');
    if (action === 'noDebrief') return t('Finish without debrief');
    return t('Discard');
  }
  function pick(row, action) {
    menu = null;
    if (action === 'discard') asking = row.id;
    else onaction?.(row, action);
  }
  // Escape closes the ••• menu only (not the sheet behind it); the focus goes back to •••.
  function menuKey(e) {
    if (e.key !== 'Escape' || !menu) return;
    e.stopPropagation();
    e.preventDefault();
    const box = e.currentTarget.closest('.mw');
    menu = null;
    box?.querySelector('.more')?.focus();
  }
</script>

<ul class="pr-rows">
  {#each rows as row (row.id)}
    {@const cur = row.tripId === current}
    {@const s = row.state}
    <li class:cur data-row={row.id}>
      {#if asking === row.id}
        <div class="ask" role="group" aria-label={t('Discard')}>
          <p>{t('Delete the trip "{title}"? A backup file can bring it back.', { title: row.title })}{#if hasWork(tripOf(row))}{' '}{t('Ticks and checks on it go too.')}{/if}</p>
          <div class="ask-b">
            <button type="button" class="btn sm del" onclick={() => ((asking = null), onaction?.(row, 'discard'))}>{t('Discard')}</button>
            <button type="button" class="btn sm" onclick={() => (asking = null)}>{t('Keep')}</button>
          </div>
        </div>
      {:else}
        <a class="go" href={row.next.href} aria-current={cur ? 'true' : undefined} onclick={(e) => onopen?.(row, e)}>
          <b class="nm">{row.title}</b>
          <span class="sub">
            <span class="dt">{short(row.date)}</span>
            <i class="pb num">{#if s.key === 'packed'}<Check size={14} aria-hidden="true" />{/if}{t(s.label, { done: s.done, total: s.total, day: s.day })}</i>
          </span>
          {#if !cur}<ChevronRight class="chev" size={18} aria-hidden="true" />{:else}<span class="chev" aria-hidden="true"></span>{/if}
        </a>
        <div class="mw">
          <button type="button" class="more" aria-label={t('More for {title}', { title: row.title })} aria-haspopup="menu" aria-expanded={menu === row.id} onkeydown={menuKey} onclick={() => (menu = menu === row.id ? null : row.id)}><Ellipsis size={20} aria-hidden="true" /></button>
          {#if menu === row.id}
            <div class="menu" role="menu">
              {#each rowActions(row, { current }) as a (a)}<button type="button" role="menuitem" class:del={a === 'discard'} onkeydown={menuKey} onclick={() => pick(row, a)}>{label(a, row)}</button>{/each}
            </div>
          {/if}
        </div>
      {/if}
    </li>
  {/each}
</ul>

<style>
  .pr-rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    position: relative;
    display: flex;
    align-items: center;
    border-top: 1px solid var(--line);
  }
  li.cur {
    background: var(--paper-2);
  }
  .go {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 22px;
    grid-template-rows: auto auto;
    column-gap: 6px;
    align-items: center;
    min-height: 56px;
    padding: 10px 4px 10px 16px;
    color: var(--ink);
    text-decoration: none;
  }
  .go:hover .nm {
    text-decoration: underline;
  }
  .go:focus-visible {
    outline: var(--focus-ring);
    outline-offset: -3px;
  }
  .nm {
    grid-column: 1;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .sub {
    grid-column: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 10px;
    margin-top: 2px;
    font-size: 14px;
    color: var(--ink-3);
  }
  .pb {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-style: normal;
    font-size: 12px;
    font-weight: 600;
    padding: 2px 9px;
    border-radius: 99px;
    background: var(--paper-2);
    color: var(--ink-2);
    white-space: nowrap;
  }
  li.cur .pb {
    background: var(--paper);
  }
  .go :global(.chev) {
    grid-column: 2;
    grid-row: 1 / span 2;
    color: var(--ink-3);
  }
  .mw {
    position: relative;
    flex: none;
  }
  .more {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin-right: 4px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .more:hover {
    background: var(--paper-2);
  }
  .more:focus-visible {
    outline: var(--focus-ring);
    outline-offset: -3px;
  }
  /* Noah: row actions quiet on a computer (visible on hover and focus), always on a phone. */
  @media (hover: hover) and (min-width: 720px) {
    .more {
      opacity: 0;
    }
    li:hover .more,
    li:focus-within .more,
    .more[aria-expanded='true'] {
      opacity: 1;
    }
  }
  .menu {
    position: absolute;
    right: 4px;
    top: 44px;
    z-index: 3;
    display: grid;
    min-width: 220px;
    padding: 4px;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(15, 46, 39, 0.18);
  }
  .menu button {
    min-height: 44px;
    padding: 8px 12px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .menu button:hover,
  .menu button:focus-visible {
    background: var(--paper-2);
  }
  .menu button.del {
    color: var(--bad);
  }
  .ask {
    flex: 1;
    padding: 10px 16px;
  }
  .ask p {
    margin: 0 0 8px;
    font-size: 14px;
    overflow-wrap: anywhere;
  }
  .ask-b {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .ask .btn {
    min-height: 44px;
  }
  .btn.del {
    color: var(--bad);
  }
</style>
