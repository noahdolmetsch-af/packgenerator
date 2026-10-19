<script>
  /**
   * Routine «Das tut mir gut» › «Change list» (mockup D2, Noah 12.10.2026 «d1-d5 freigeben»). #/routine,
   * a page of Heute. The chips «Every day» and Mon–Sun show the list of that day («Thu · +1»: one item
   * more on Thursday); on a computer the suggestions sit on the left, the list on the right.
   * Every item: drag it (handle) or ↑ ↓, tap it to rename it, choose its days, a time (e.g. «Up before
   * 5:55») and a link to Im Flow (it ticks itself); × deletes it with «Undo». Add a suggestion with one
   * tap, or an own one. Everything is a suggestion: nothing here is needed, all can be deleted.
   */
  import { Plus, X, Check, Clock, Link2, Pencil, Trash2 } from '@lucide/svelte';
  import AreaIntro from '../lib/intro/AreaIntro.svelte'; // «Anleitungen überall»: the guide of this page (lib/guides.js)
  import Crumb from '../lib/flow/kit/Crumb.svelte';
  import SortGrip from '../lib/ui/SortGrip.svelte';
  import SortArrows from '../lib/ui/SortArrows.svelte';
  import { sortable } from '../lib/ui/sortable.js';
  import { toast } from '../lib/flow/ui.svelte.js';
  import { routineQuery, saveRoutine, readRoutine } from '../lib/routine-data.js';
  import { SUGGESTIONS, listFor, extraOn, newItem, addItem, removeItem, renameItem, patchItem, moveItem, stepItem, toggleDay, hm } from '../lib/routine.js';
  import { itemName, daysWords, dayShort } from '../lib/routine-words.js';
  import { localDay } from '../lib/localday.js';
  import { phone } from '../lib/media.svelte.js';
  import { t, tn, num } from '../lib/i18n.svelte.js';

  const today = localDay();
  const q = routineQuery(today);
  const routine = $derived($q?.routine ?? null);
  let view = $state('all'); // 'all' or a weekday 0–6
  let open = $state(null); // the item whose settings show
  let own = $state('');
  let ownOpen = $state(false);
  let nameDraft = $state('');

  const shown = $derived(routine ? listFor(routine.items, view) : []);
  const names = $derived(new Set((routine?.items ?? []).map((x) => x.name)));
  const offer = $derived(SUGGESTIONS.filter((s) => !names.has(s.name)));

  // every change reads what is saved first, so two quick taps never undo each other
  async function change(fn) {
    await saveRoutine(fn(await readRoutine()));
  }
  const forView = () => (view === 'all' ? {} : { days: [view] });
  async function addSuggestion(s) {
    await change((r) => addItem(r, newItem(s.name, { time: s.time ?? null, link: s.link ?? null, ...forView() })));
  }
  async function addOwn(e) {
    e.preventDefault();
    const name = own.trim();
    if (!name) return;
    await change((r) => addItem(r, newItem(name, forView())));
    own = '';
    ownOpen = false;
  }
  async function del(x) {
    const before = await readRoutine();
    await saveRoutine(removeItem(before, x.id));
    if (open === x.id) open = null;
    toast(t('«{name}» deleted', { name: itemName(x) }), () => saveRoutine(before));
  }
  function toggleOpen(x) {
    open = open === x.id ? null : x.id;
    nameDraft = open ? itemName(x) : '';
  }
  async function rename(x, e) {
    e?.preventDefault();
    const name = nameDraft.trim();
    if (name && name !== itemName(x)) await change((r) => renameItem(r, x.id, name));
  }
  const ids = () => shown.map((x) => x.id);
  const onmove = (from, to) => {
    const list = ids();
    const id = list[from];
    const target = list[to];
    return change((r) => moveItem(r, id, r.items.findIndex((x) => x.id === target)));
  };
  const step = (id, dir) => change((r) => stepItem(r, ids(), id, dir));
  const sub = (x) => [x.link === 'meditation' ? t('linked with Im Flow › Meditation') : '', x.time ? t('time {hm}', { hm: hm(x.time) }) : '', daysWords(x.days)].filter(Boolean).join(' · ');
</script>

<div class="rtp">
  <Crumb path={[{ href: '#/', label: t('Today|place') }]} here={t('What does me good')} />
  <h1 class="rtp-h1" tabindex="-1" data-page-title>{t('What does me good')}</h1>
  <p class="rtp-intro">{t('Put what does you good on your list. It counts every day until you change it.')}</p>
  <AreaIntro place="routine" />

  <div class="rtp-cols">
    <section class="rtp-mine" aria-labelledby="rtp-list-h">
      <h2 id="rtp-list-h" class="rtp-h2">{t('Your list')}</h2>
      <p class="rtp-note">{tn(shown.length, '{n} item|routine', '{n} items|routine')} · {t('drag or use the arrows to sort')}</p>
      <div class="rtp-days" role="group" aria-label={t('Days')}>
        <button type="button" class="rtp-day" aria-pressed={view === 'all'} onclick={() => (view = 'all')} data-view="all">{t('Every day')}</button>
        {#each [0, 1, 2, 3, 4, 5, 6] as w (w)}
          {@const extra = routine ? extraOn(routine.items, w) : 0}
          <button type="button" class="rtp-day" aria-pressed={view === w} onclick={() => (view = w)} data-view={w}>{dayShort(w)}{#if extra}<span class="rtp-plus num">{` · +${num(extra)}`}</span>{/if}</button>
        {/each}
      </div>

      {#if routine && !shown.length}<p class="rtp-empty">{t('Nothing here yet. Add something below.')}</p>{/if}
      <ul class="rtp-list" aria-labelledby="rtp-list-h" use:sortable={{ onmove }}>
        {#each shown as x, i (x.id)}
          <li class="rtp-item" data-sort-id={x.id} data-item={x.id}>
            <div class="rtp-line">
              <SortGrip name={itemName(x)} onstep={(dir) => step(x.id, dir)} />
              <button type="button" class="rtp-open" aria-expanded={open === x.id} onclick={() => toggleOpen(x)}>
                <span class="rtp-name">{itemName(x)}</span>
                {#if sub(x)}<span class="rtp-sub">{#if x.link}<Link2 size={12} aria-hidden="true" />{:else if x.time}<Clock size={12} aria-hidden="true" />{/if}<span>{sub(x)}</span></span>{/if}
              </button>
              {#if !phone.matches}<SortArrows name={itemName(x)} {i} n={shown.length} onstep={(dir) => step(x.id, dir)} />{/if}
              <button type="button" class="rtp-x" aria-label={t('Delete {name}', { name: itemName(x) })} onclick={() => del(x)} data-del><X size={18} aria-hidden="true" /></button>
            </div>
            {#if open === x.id}
              <div class="rtp-edit" data-edit={x.id}>
                <form class="rtp-row" onsubmit={(e) => rename(x, e)}>
                  <label class="rtp-lab" for="rtp-n-{x.id}"><Pencil size={14} aria-hidden="true" />{t('Name')}</label>
                  <input id="rtp-n-{x.id}" class="inp" maxlength="80" bind:value={nameDraft} onblur={() => rename(x)} data-rename />
                </form>
                <div class="rtp-row">
                  <span class="rtp-lab">{t('Days')}</span>
                  <div class="rtp-days sm" role="group" aria-label={t('Days of {name}', { name: itemName(x) })}>
                    <button type="button" class="rtp-day" aria-pressed={!x.days} onclick={() => change((r) => patchItem(r, x.id, { days: null }))}>{t('Every day')}</button>
                    {#each [0, 1, 2, 3, 4, 5, 6] as w (w)}
                      <button type="button" class="rtp-day" aria-pressed={!x.days || x.days.includes(w)} onclick={() => change((r) => patchItem(r, x.id, { days: toggleDay(x.days, w) }))} data-day={w}>{dayShort(w)}</button>
                    {/each}
                  </div>
                </div>
                <div class="rtp-row">
                  <label class="rtp-lab" for="rtp-t-{x.id}"><Clock size={14} aria-hidden="true" />{t('Time (optional)')}</label>
                  <input id="rtp-t-{x.id}" class="inp rtp-time" type="time" value={x.time ?? ''} onchange={(e) => change((r) => patchItem(r, x.id, { time: e.currentTarget.value || null }))} data-time />
                </div>
                <div class="rtp-row">
                  <span class="rtp-lab"><Link2 size={14} aria-hidden="true" />{t('Ticks itself')}</span>
                  <div class="rtp-days sm" role="group" aria-label={t('Ticks itself')}>
                    <button type="button" class="rtp-day" aria-pressed={!x.link} onclick={() => change((r) => patchItem(r, x.id, { link: null }))}>{t('No, by hand')}</button>
                    <button type="button" class="rtp-day" aria-pressed={x.link === 'meditation'} onclick={() => change((r) => patchItem(r, x.id, { link: 'meditation' }))}>{t('With a meditation in Im Flow')}</button>
                  </div>
                </div>
                {#if phone.matches}
                  <div class="rtp-row">
                    <span class="rtp-lab">{t('Order')}</span>
                    <SortArrows name={itemName(x)} {i} n={shown.length} onstep={(dir) => step(x.id, dir)} />
                  </div>
                {/if}
                <div class="rtp-acts">
                  <button type="button" class="btn sm" onclick={() => (open = null)}><Check size={16} aria-hidden="true" />{t('Done')}</button>
                  <button type="button" class="btn sm" onclick={() => del(x)}><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>
                </div>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
      {#if view !== 'all'}<p class="rtp-note">{t('What you add now is for {day} only.', { day: dayShort(view) })}</p>{/if}
    </section>

    <section class="rtp-add" aria-labelledby="rtp-add-h">
      <h2 id="rtp-add-h" class="rtp-h2">{t('Add')}</h2>
      <p class="rtp-note">{t('tap · your own any time')}</p>
      <ul class="rtp-sugg">
        {#each offer as s (s.key)}
          <li><button type="button" class="rtp-sbtn" onclick={() => addSuggestion(s)} data-add={s.key}><span>{t(s.name, { time: hm(s.time) })}</span><Plus size={18} aria-hidden="true" /></button></li>
        {/each}
        <li>
          {#if ownOpen}
            <form class="rtp-own" onsubmit={addOwn}>
              <!-- svelte-ignore a11y_autofocus -->
              <input class="inp" maxlength="80" bind:value={own} aria-label={t('Your own item')} placeholder={t('e.g. Read 10 pages')} autofocus data-own />
              <button type="submit" class="btn sm hi">{t('Add')}</button>
            </form>
          {:else}
            <button type="button" class="rtp-sbtn" onclick={() => (ownOpen = true)} data-add="own"><span>{t('Your own item')}</span><Plus size={18} aria-hidden="true" /></button>
          {/if}
        </li>
      </ul>
    </section>
  </div>
</div>

<style>
  .rtp {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 1180px;
    margin: 0 auto;
    min-width: 0;
  }
  .rtp-h1 {
    margin: 0;
    font: 800 var(--fs-page)/1.1 var(--font-brand);
  }
  .rtp-intro {
    margin: -4px 0 4px;
    color: var(--ink-2);
    font-size: var(--fs-body);
  }
  .rtp-cols {
    display: grid;
    gap: 24px;
  }
  @media (min-width: 900px) {
    .rtp-cols {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      align-items: start;
    }
    .rtp-mine {
      order: 2;
    }
  }
  .rtp-mine,
  .rtp-add {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .rtp-h2 {
    margin: 0;
    font: 700 var(--fs-section)/1.2 var(--font-body);
  }
  .rtp-note {
    margin: -4px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .rtp-days {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 4px 0;
  }
  .rtp-day {
    min-width: 44px;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .rtp-day[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .rtp-plus {
    font-weight: 600;
  }
  .rtp-empty {
    margin: 0;
    color: var(--ink-3);
  }
  .rtp-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 10px;
    border: 2px dashed var(--line-strong);
    border-radius: 16px;
    background: var(--accent-soft);
    list-style: none;
  }
  .rtp-list:empty {
    display: none;
  }
  .rtp-item {
    border-radius: 12px;
    background: var(--paper);
    box-shadow: 0 1px 3px var(--shadow);
  }
  .rtp-line {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 4px;
  }
  .rtp-open {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
    min-height: 48px;
    padding: 6px 4px;
    border: 0;
    background: transparent;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
    justify-content: center;
  }
  .rtp-name {
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .rtp-sub {
    display: flex;
    align-items: baseline;
    gap: 4px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .rtp-sub :global(svg) {
    flex: none;
    align-self: center;
  }
  .rtp-x {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--ink-2);
    cursor: pointer;
  }
  .rtp-x:hover {
    color: var(--ink);
    background: var(--paper-2);
  }
  .rtp-edit {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 4px 14px 14px;
    border-top: 1px solid var(--line);
  }
  .rtp-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .rtp-lab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding-top: 8px;
    color: var(--ink-2);
    font: 600 var(--fs-small) var(--font-body);
  }
  .rtp-days.sm {
    margin: 0;
  }
  .rtp-time {
    max-width: 160px;
  }
  .rtp-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .rtp-sugg {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 4px 16px;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: var(--paper);
    list-style: none;
  }
  .rtp-sugg li + li {
    border-top: 1px solid var(--line);
  }
  .rtp-sbtn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    min-height: 52px;
    padding: 6px 0;
    border: 0;
    background: transparent;
    color: var(--ink);
    font: 400 var(--fs-body) var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  .rtp-own {
    display: flex;
    gap: 8px;
    padding: 8px 0;
  }
  .rtp-own .inp {
    flex: 1 1 auto;
    min-width: 0;
  }
</style>
