<script>
  /**
   * Paket B, UC-032-I1 + I2 (996 Ideen): on Touren › Reise-Links, «Options to compare». Beds, trains or flights
   * you are weighing up, each with its link, price, the booking conditions you checked and «free cancellation
   * until». Choose one or drop one with a reason; dropped ones stay folded below, so you still know why.
   * Add, change, sort (arrows and drag), delete (asks, then Undo). Kept in settings 'travel.choices'.
   */
  import { liveQuery } from 'dexie';
  import { Plus, Pencil, ExternalLink, Check, X, CalendarClock } from '@lucide/svelte';
  import { db } from '../db.js';
  import FreiSheet from '../frei/FreiSheet.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { phone } from '../media.svelte.js';
  import { localDay } from '../localday.js';
  import { t, dateOf, locale } from '../i18n.svelte.js';
  import { CHOICES_KEY, CHOICE_STATES, choicesOf, activeChoices, droppedChoices, cancelSoon, upsert, removeChoice, moveChoice } from './choices.js';

  const today = localDay();
  const q = liveQuery(() => db.settings.get(CHOICES_KEY));
  const all = $derived(choicesOf($q?.value));
  const active = $derived(activeChoices(all));
  const dropped = $derived(droppedChoices(all));
  const money = (x) => `CHF ${new Intl.NumberFormat(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x)}`;

  async function write(fn) {
    const before = choicesOf((await db.settings.get(CHOICES_KEY))?.value);
    await db.settings.put({ key: CHOICES_KEY, value: fn(before) });
    return before;
  }
  const restore = (before) => db.settings.put({ key: CHOICES_KEY, value: before });

  let edit = $state(null);
  const blank = () => ({ id: null, name: '', link: '', price: '', cancelBy: '', terms: '', state: 'open', why: '' });
  const openEdit = (c) => (edit = { ...blank(), ...c, price: c.price != null ? String(c.price) : '' });
  async function save() {
    if (!edit.name.trim()) return t('Please give it a name.');
    const id = edit.id ?? `ch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    await write((l) => upsert(l, { ...edit, id }));
    offerDone(t('Saved.'));
  }
  async function remove() {
    const c = edit;
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: c.name }), text: t('You can undo this for a few seconds.') });
    if (answer !== 'delete') return false;
    await deleteWithUndo({ run: () => write((l) => removeChoice(l, c.id)), undo: restore, text: t('"{name}" deleted.', { name: c.name }), name: c.name });
  }
  async function setState(c, state) {
    const before = await write((l) => upsert(l, { ...c, state: c.state === state ? 'open' : state }));
    offerDone(state === 'chosen' && c.state !== 'chosen' ? t('«{name}» chosen.', { name: c.name }) : t('Saved.'), () => restore(before));
  }
  const ids = () => active.map((c) => c.id);
  // the order counts among the open and chosen ones; dropped ones stay at the end
  const reorder = (id, to) => write((l) => moveChoice(l, id, to));
  const step = (id, dir) => {
    const i = ids().indexOf(id);
    const to = Math.min(Math.max(i + dir, 0), ids().length - 1);
    return to === i ? null : reorder(id, to);
  };
</script>

<section class="card tc" aria-labelledby="tc-h" data-travel-choices>
  <h2 id="tc-h">{t('Options to compare')}</h2>
  <p class="tc-note">{t('Beds, trains or flights you are weighing up: with price, the conditions you checked and why you chose or dropped one.')}</p>
  {#if active.length}
    <ul class="tc-list" use:sortable={{ onmove: (from, to) => reorder(active[from].id, to) }}>
      {#each active as c, n (c.id)}
        <li class="tc-row" class:chosen={c.state === 'chosen'} data-sort-id={c.id} data-choice={c.name}>
          <SortGrip name={c.name} onstep={(dir) => step(c.id, dir)} />
          <div class="tc-main">
            <b>{#if c.state === 'chosen'}<Check size={16} aria-label={t('Chosen')} />{' '}{/if}{c.name}</b>
            <small>{[c.price != null ? money(c.price) : '', c.terms].filter(Boolean).join(' · ')}</small>
            {#if c.cancelBy}<small class:soon={cancelSoon(c, today)} data-choice-cancel><CalendarClock size={13} aria-hidden="true" /> {t('Free cancellation until {day}', { day: dateOf(c.cancelBy) })}</small>{/if}
            <span class="tc-acts">
              {#if c.link}<a class="btn sm" href={c.link} target="_blank" rel="noopener noreferrer">{t('Open')}<ExternalLink size={14} aria-hidden="true" /></a>{/if}
              <button type="button" class="btn sm" aria-pressed={c.state === 'chosen'} onclick={() => setState(c, 'chosen')} data-choice-pick>{c.state === 'chosen' ? t('Chosen') : t('Choose this')}</button>
              <button type="button" class="btn sm" onclick={() => openEdit({ ...c, state: 'dropped' })} data-choice-drop><X size={14} aria-hidden="true" />{t('Drop|choice')}</button>
            </span>
          </div>
          {#if !phone.matches}<SortArrows name={c.name} i={n} n={active.length} onstep={(dir) => step(c.id, dir)} />{/if}
          <button type="button" class="fz-icon tc-icon" aria-label={t('Change {name}', { name: c.name })} onclick={() => openEdit(c)} data-choice-edit><Pencil size={18} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
  {/if}
  <button type="button" class="btn" onclick={() => (edit = blank())} data-choice-new><Plus size={16} aria-hidden="true" />{t('Add an option')}</button>
  {#if dropped.length}
    <details class="tc-dropped">
      <summary>{t('Dropped ({n})', { n: dropped.length })}</summary>
      <ul class="tc-list">
        {#each dropped as c (c.id)}
          <li class="tc-row" data-choice-dropped={c.name}>
            <div class="tc-main"><b><s>{c.name}</s></b>{#if c.why}<small>{c.why}</small>{/if}</div>
            <button type="button" class="btn sm" onclick={() => setState(c, 'open')} data-choice-back>{t('Back to the options')}</button>
          </li>
        {/each}
      </ul>
    </details>
  {/if}
</section>

{#if edit}
  <FreiSheet title={edit.id ? t('Change option') : t('New option')} sub={t('Options to compare')} onsave={save} ondelete={edit.id ? remove : null} onclose={() => (edit = null)}>
    <label class="fz-lab">{t('Name')}<input class="inp" maxlength="80" bind:value={edit.name} placeholder={t('e.g. Hotel by the station')} data-field="name" /></label>
    <label class="fz-lab">{t('Link (optional)')}<input class="inp" maxlength="500" inputmode="url" bind:value={edit.link} data-field="link" /></label>
    <div class="tc-two">
      <label class="fz-lab">{t('Price in CHF (optional)')}<input class="inp" inputmode="decimal" maxlength="12" bind:value={edit.price} data-field="price" /></label>
      <label class="fz-lab">{t('Free cancellation until')}<input class="inp" type="date" bind:value={edit.cancelBy} data-field="cancelBy" /></label>
    </div>
    <label class="fz-lab">{t('Conditions you checked (optional)')}<textarea class="inp" rows="2" maxlength="400" bind:value={edit.terms} placeholder={t('e.g. breakfast included, bike in the garage')} data-field="terms"></textarea></label>
    <label class="fz-lab">{t('State')}
      <select class="inp" bind:value={edit.state} data-field="state">{#each CHOICE_STATES as s (s.key)}<option value={s.key}>{t(s.name)}</option>{/each}</select>
    </label>
    <label class="fz-lab">{t('Why (optional)')}<input class="inp" maxlength="200" bind:value={edit.why} placeholder={t('e.g. too far from the route')} data-field="why" /></label>
  </FreiSheet>
{/if}

<style>
  .tc {
    display: grid;
    gap: 10px;
    margin: 0 0 var(--sp-3);
    padding: var(--sp-3) var(--sp-4);
  }
  .tc h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .tc-note {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tc-list {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tc-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
  }
  .tc-row.chosen b {
    color: var(--accent);
  }
  .tc-main {
    display: grid;
    flex: 1 1 auto;
    gap: 2px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .tc-main small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tc-main small.soon {
    color: var(--warn, var(--accent));
    font-weight: 600;
  }
  .tc-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
  }
  .tc-two {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .tc-two > * {
    flex: 1 1 140px;
  }
  .tc-dropped summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    cursor: pointer;
    color: var(--ink-2);
  }
</style>
