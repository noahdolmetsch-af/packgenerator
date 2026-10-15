<script>
  /**
   * v0.134.0 «Listen und Typen» (mockups LI1–LI4, Noah «LI1–LI4 freigegeben» 14.10.2026; «a»: the
   * categories first, the other lists follow one by one as their own small releases).
   * #/me/lists: the overview (LI1), every list that can be changed, «Standard» or «Angepasst».
   * #/me/lists?categories: one list (LI2): arrows up and down (answer 2b), the eye hides, the pen opens
   * the entry (LI3, ListEntrySheet), «+ Eigene Kategorie», «Auf Standard zurücksetzen».
   * Everything is a suggestion of the app: the Standard stays, the person's changes are kept apart
   * (standard.js, lists.js) and travel in the backup.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { OVERRIDES_KEY, STANDARD_LIST, listFor, isChanged, overrideOf } from '../lib/standard.js';
  import { saveList, resetToStandard, move, moveTo, toggleHidden, edit, addOwn, remove } from '../lib/lists.js';
  import { catIcon, stdIconName } from '../lib/gear/caticon.js';
  import { domainName } from '../lib/domains.js';
  import ListEntrySheet from '../lib/ich/ListEntrySheet.svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import { t, tn } from '../lib/i18n.svelte.js';
  import SortGrip from '../lib/ui/SortGrip.svelte';
  import { sortable } from '../lib/ui/sortable.js';
  import { ChevronRight, ChevronUp, ChevronDown, Eye, EyeOff, Pencil, Plus, Undo2, Lightbulb, Tag, ListChecks, Info } from '@lucide/svelte';
  import '../lib/ich/ich.css';

  const overQ = liveQuery(() => db.settings.get(OVERRIDES_KEY));
  const itemsQ = liveQuery(() => db.items.toArray());
  const checksQ = liveQuery(() => db.settings.where('key').startsWithAnyOf(['eveStandard', 'afterStandard']).toArray());

  const KEY = 'categories';
  const open = (location.hash.split('?')[1] ?? '') === KEY;

  const all = $derived($overQ?.value ?? {});
  const value = $derived(all[KEY]);
  const list = $derived(listFor(KEY, all));
  const count = $derived(($itemsQ ?? []).reduce((m, i) => ((m[i.category] = (m[i.category] ?? 0) + 1), m), {}));
  const changed = $derived(isChanged(value));
  const ownN = $derived(list.filter((e) => e.own).length);
  const hiddenN = $derived(list.filter((e) => e.hidden).length);
  const catLine = $derived([tn(list.length, '{n} entry', '{n} entries'), ownN ? tn(ownN, '{n} own', '{n} own') : null, hiddenN ? tn(hiddenN, '{n} hidden', '{n} hidden') : null].filter(Boolean).join(' · '));
  const checksOwn = $derived(($checksQ ?? []).length > 0);

  // the window of one entry: { entry } (entry null: a new own category)
  let sheet = $state(null);

  const save = (next) => saveList(db, KEY, next);
  // LI3 «Gilt für»: a category for some trip areas only says which, on a line of its own
  const only = (e) => (e.areas?.length ? t('Only {areas}', { areas: e.areas.map((k) => t(domainName(k))).join(', ') }) : '');
  const sub = (e) => {
    const n = tn(count[e.id] ?? 0, '{n} item', '{n} items');
    if (e.hidden) return `${t('Hidden')} · ${n}`;
    if (e.own) return `${t('Own category')} · ${n}`;
    if (e.renamed) return `${t('Standard name: {name}', { name: t(e.std) })} · ${n}`;
    return `${t('Standard')} · ${n}`;
  };
  const adapted = (e) => !e.own && (e.renamed || overrideOf(value).icons[e.id] || e.areas);
  function reset() {
    if (!confirm(t('Back to the Standard categories? Your names, own categories, hidden and deleted ones and the order are undone.'))) return;
    resetToStandard(db, KEY);
  }
</script>

<div class="lists ich-page" class:one={open}>
  {#if !open}
    <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Lists and types')} sub={t('The choice lists of the app. You can rename, add your own, hide and change the order.')} />
    <p class="info card"><Lightbulb size={18} aria-hidden="true" /><span>{t('Standard = how the app comes. Adapted = you changed something. Every list can go back to Standard.')}</span></p>

    <div class="grid">
      <section class="ich-sec card box" aria-labelledby="ls-gear-h">
        <h2 id="ls-gear-h">{t('Gear|place')}</h2>
        <ul class="ich-list">
          <li>
            <a class="ich-row" href="#/me/lists?categories">
              <span class="ich-ib"><Tag size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t(STANDARD_LIST[KEY].name)}</b><small>{catLine}</small></span>
              <span class="badge" class:mine={changed}>{changed ? t('Adapted') : t('Standard')}</span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
        </ul>
      </section>
      <section class="ich-sec card box" aria-labelledby="ls-trips-h">
        <h2 id="ls-trips-h">{t('Trips|place')}</h2>
        <ul class="ich-list">
          <li>
            <a class="ich-row" href="#/me/checks">
              <span class="ich-ib"><ListChecks size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Checks per trip type')}</b><small>{t('The evening before and after the trip')}</small></span>
              <span class="badge" class:mine={checksOwn}>{checksOwn ? t('Adapted') : t('Standard')}</span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
        </ul>
      </section>
    </div>
    <p class="ich-fine"><Info size={15} aria-hidden="true" /><span>{t('More lists follow one by one: sports, places on the bike, questions.')}</span></p>
  {:else}
    <VeloHead crumbs={[{ label: t('Lists and types'), href: '#/me/lists' }]} title={t(STANDARD_LIST[KEY].name)} sub={t('Applies to gear, the packing list and the search. Drag or use the arrows to change the order.')} />
    <div class="card box">
      <ul class="ich-list rows" aria-label={t(STANDARD_LIST[KEY].name)} use:sortable={{ onmove: (from, to) => save(moveTo(value, list, list[from].id, to)) }}>
        {#each list as e, i (e.id)}
          {@const I = catIcon(e.id)}
          <li class="ich-row" class:off={e.hidden} data-id={e.id} data-sort-id={e.id}>
            <SortGrip name={t(e.name)} onstep={(dir) => save(move(value, list, e.id, dir))} />
            <span class="arrows">
              <button type="button" class="ar" aria-label={t('Up: {name}', { name: t(e.name) })} disabled={i === 0} onclick={() => save(move(value, list, e.id, -1))}><ChevronUp size={16} aria-hidden="true" /></button>
              <button type="button" class="ar" aria-label={t('Down: {name}', { name: t(e.name) })} disabled={i === list.length - 1} onclick={() => save(move(value, list, e.id, 1))}><ChevronDown size={16} aria-hidden="true" /></button>
            </span>
            <span class="ich-ib" aria-hidden="true"><I size={18} /></span>
            <!-- v0.163.x: name, mark and pen are one button (the window of the entry); on the phone the name keeps its room next to the handle and the arrows -->
            <button type="button" class="edit" aria-haspopup="dialog" aria-label={t('Edit: {name}', { name: t(e.name) })} onclick={() => (sheet = { entry: e })}>
              <span class="ich-m"><b>{t(e.name)}</b><small>{sub(e)}</small>{#if only(e)}<small>{only(e)}</small>{/if}</span>
              {#if e.own}<span class="badge own">{t('Own|entry')}</span>{:else if adapted(e)}<span class="badge mine">{t('Adapted')}</span>{/if}
              <span class="pen" aria-hidden="true"><Pencil size={18} /></span>
            </button>
            <button type="button" class="ib eye" aria-pressed={e.hidden} aria-label={e.hidden ? t('Show again: {name}', { name: t(e.name) }) : t('Hide: {name}', { name: t(e.name) })} onclick={() => save(toggleHidden(value, e.id))}>
              {#if e.hidden}<EyeOff size={18} aria-hidden="true" />{:else}<Eye size={18} aria-hidden="true" />{/if}
            </button>
          </li>
        {/each}
      </ul>
      <button type="button" class="add" aria-haspopup="dialog" onclick={() => (sheet = { entry: null })}><Plus size={18} aria-hidden="true" />{t('Own category')}</button>
    </div>
    {#if changed}<button type="button" class="btn reset" onclick={reset}><Undo2 size={16} aria-hidden="true" />{t('Back to Standard|list')}</button>{/if}
    <p class="ich-fine"><Info size={15} aria-hidden="true" /><span>{t('Hidden: the items keep their category. Hide and delete are in the window of the entry (pen), for Standard entries too.')}</span></p>
  {/if}

  {#if sheet}
    {@const e = sheet.entry}
    <ListEntrySheet
      entry={e}
      count={e ? (count[e.id] ?? 0) : 0}
      stdIcon={e ? stdIconName(e.id) : 'Tag'}
      onsave={(v) => save(e ? edit(value, e, { ...v, stdIcon: stdIconName(e.id) }) : addOwn(value, v).value)}
      onhide={() => save(toggleHidden(value, e.id))}
      onremove={() => save(remove(value, e))}
      onclose={() => (sheet = null)}
    />
  {/if}
</div>

<style>
  .lists {
    max-width: 1100px;
  }
  .lists.one {
    max-width: 760px;
  }
  .info {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin: 0 0 20px;
    padding: 12px 16px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .info :global(svg) {
    flex: none;
    margin-top: 1px;
  }
  .grid {
    display: grid;
    gap: 0 20px;
  }
  @media (min-width: 900px) {
    .grid {
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }
  }
  .box {
    padding: 14px 4px 6px;
  }
  .box h2 {
    margin: 0 16px 4px;
    font: 600 var(--fs-sub) / 1.25 var(--font-body);
  }
  .badge {
    flex: none;
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font: 600 var(--fs-tiny) / 1.6 var(--font-body);
  }
  .badge.mine {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .badge.own {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .rows .ich-row {
    gap: 10px;
  }
  .arrows {
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .ar {
    display: grid;
    place-items: center;
    width: 32px;
    height: 24px;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .ar:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .ib:hover {
    background: var(--paper-2);
  }
  .edit {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 0;
    border: 0;
    border-radius: var(--r-ctl);
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .pen {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    color: var(--ink-2);
  }
  @media (hover: hover) {
    .edit:hover .pen {
      border-radius: var(--r-ctl);
      background: var(--paper-2);
    }
  }
  .off .ich-m b {
    text-decoration: line-through;
    color: var(--ink-3);
  }
  .add {
    display: flex;
    align-items: center;
    gap: 8px;
    width: calc(100% - 32px);
    min-height: 48px;
    margin: 8px 16px 12px;
    padding: 0 16px;
    border: 1px dashed var(--line-strong);
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .reset {
    margin: 16px 0 0;
  }
  /* phone: the arrows side by side, each a full 44 px tap area */
  @media (max-width: 719px) {
    .rows .ich-ib {
      display: none;
    }
    .rows .ich-row {
      gap: 2px;
    }
    /* the eye is in the window of the entry too (Ausblenden); the name keeps its room */
    .rows .eye {
      display: none;
    }
    /* v0.163.x: the mark goes under the name, the pen is a small sign (the whole name opens the window) */
    .edit {
      grid-template-columns: minmax(0, 1fr) 20px;
      gap: 0 2px;
    }
    .edit .ich-m {
      grid-row: 1;
    }
    .edit .badge {
      grid-row: 2;
      justify-self: start;
    }
    .edit .pen {
      grid-column: 2;
      grid-row: 1 / span 2;
      width: 20px;
    }
    .rows {
      padding: 4px 8px;
    }
    .arrows {
      flex-direction: row;
      gap: 0;
    }
    .ar {
      width: 44px;
      height: 44px;
      border: 0;
      background: none;
    }
    .ar:disabled {
      opacity: 0.2;
    }
  }
</style>
