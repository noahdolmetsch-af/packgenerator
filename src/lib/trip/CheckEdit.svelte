<script>
  /**
   * v0.111.0 «Liste anpassen» (mockup V3, Noah «v1-v4 ok» 12.10.2026 22:34): the rows of a check to sort
   * (drag the handle, or the arrow keys on it), remove (×) and add (own words, or a suggestion: the
   * type's rows not in the list and what was missing on earlier trips of the type). «Gilt für»: only
   * this trip or every trip of the type (its standard; the other types keep their own list).
   * «Vorschlag wiederherstellen» puts the app's suggestion back. Nothing is saved before «Speichern».
   * Without a trip (Ich › Checks pro Reiseart, V4) the standard of the type is edited.
   */
  import { keepTyped } from '../ui/keeptyped.js';
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { domainName } from '../domains.js';
  import { checkKey, suggested, freshCheck, removeCheck, addCheck, moveCheck, keepTicks, missingSuggestions, missedBefore, asStandard, differs, ALL_OF } from '../checks.js';
  import { chargeList, chargeCount } from '../charge.js';
  import { checkIcon } from './checkicons.js';
  import { checkHint, shortDay } from './checkhints.js';
  import { backClose } from '../ui/backclose.js';
  import Seg from '../ui/Seg.svelte';
  import { t } from '../i18n.svelte.js';
  import SortArrows from '../ui/SortArrows.svelte';
  import { X, Plus, GripVertical, Undo2 } from '@lucide/svelte';
  import './trip.css';

  // list: what the trip (or the type) shows now; trip null: the type's standard
  let { kind = 'eve', domain, trip = null, list = [], items = [], trips = [], debriefs = [], onclose } = $props();

  let dlg;
  $effect(() => {
    dlg.showModal();
  });
  const close = () => dlg?.open && dlg.close();

  // svelte-ignore state_referenced_locally
  let draft = $state(list.map((r) => ({ id: r.id, label: r.label, done: !!r.done })));
  let words = $state('');
  let scope = $state('all');
  let saving = $state(false);
  const area = $derived(t(domainName(domain)));
  const charged = $derived(trip && kind === 'eve' ? chargeCount(trip, chargeList(trip, items)) : null);
  const plain = () => $state.snapshot(draft);
  const ideas = $derived([
    ...missingSuggestions(kind, domain, draft).map((r) => ({ key: `s:${r.id}`, row: r, label: t(r.label), sub: t('Suggestion of the app for {area}', { area }) })),
    ...(kind === 'eve' ? missedBefore(trips, debriefs, domain, draft, { except: trip?.id ?? null }) : []).map((m) => ({ key: `m:${m.name}`, name: m.name, label: t('Pack {name}', { name: m.name }), sub: t('From your debrief of {day}: missing', { day: shortDay(m.at) }) })),
  ]);
  const hid = $derived(`ce-${kind}-h`);

  const uniq = (rows) => {
    let n = Date.now();
    while (rows.some((r) => r.id === `own-${n.toString(36)}`)) n++;
    return n;
  };
  function add(event) {
    event.preventDefault();
    if (!words.trim()) return;
    draft = addCheck(plain(), words, uniq(draft));
    words = '';
  }
  function take(idea) {
    draft = idea.row ? [...plain(), { id: idea.row.id, label: idea.row.label, done: false }] : addCheck(plain(), idea.label, uniq(draft));
  }
  const remove = (id) => (draft = removeCheck(plain(), id));
  const restore = () => (draft = freshCheck(kind, domain));

  /* sorting: the handle follows the pointer (mouse and touch); the arrow keys move one place */
  let ul;
  let dragId = $state(null);
  function down(e, id) {
    dragId = id;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }
  function move(e) {
    if (!dragId || !ul) return;
    const rows = [...ul.querySelectorAll('li[data-row]')];
    const from = draft.findIndex((r) => r.id === dragId);
    // the new place: how many of the other rows have their middle above the pointer
    let to = 0;
    rows.forEach((li, i) => {
      const b = li.getBoundingClientRect();
      if (i !== from && e.clientY > b.top + b.height / 2) to++;
    });
    if (from >= 0 && to !== from) draft = moveCheck(plain(), from, to);
  }
  const up = () => (dragId = null);
  function key(e, n) {
    const to = e.key === 'ArrowUp' ? n - 1 : e.key === 'ArrowDown' ? n + 1 : null;
    if (to == null || to < 0 || to >= draft.length) return;
    e.preventDefault();
    draft = moveCheck(plain(), n, to);
    requestAnimationFrame(() => ul?.querySelectorAll('.grip')[to]?.focus());
  }

  async function save() {
    saving = true;
    const rows = plain();
    const std = checkKey(kind, domain);
    if (trip) {
      await db.trips.update(trip.id, touched({ [kind]: keepTicks(rows, list) }));
      if (scope === 'all') await db.settings.put({ key: std, value: asStandard(rows) });
    } else if (differs(rows, suggested(kind, domain))) await db.settings.put({ key: std, value: asStandard(rows) });
    else await db.settings.delete(std);
    saving = false;
    close();
  }
</script>

<dialog use:keepTyped={'checkedit:' + kind + ':' + (trip?.id ?? domain ?? '')} class="sheet from-below cke" bind:this={dlg} use:backClose onclose={() => onclose?.()} aria-labelledby={hid} data-check-edit={kind}>
  <header class="hd">
    <div class="tt">
      <h2 id={hid}>{kind === 'eve' ? t('Adjust the evening-before check') : t('Adjust the after-trip check')}</h2>
      <p class="sub">{trip ? t('Drag to sort, × to remove') : t('{area} · new trips start with this list. Drag to sort, × to remove', { area })}</p>
    </div>
    <button type="button" class="x" aria-label={t('Close the window')} onclick={close}><X size={20} aria-hidden="true" /></button>
  </header>

  <div class="box">
    <ul class="rows" bind:this={ul} onpointermove={move} onpointerup={up} onpointercancel={up}>
      {#each draft as r, n (r.id)}
        {@const I = checkIcon(r.id, kind)}
        {@const hint = trip ? checkHint(r, kind, { trip, charged }) : ''}
        <li data-row={r.id} class:drag={dragId === r.id}>
          <button type="button" class="grip" aria-label={t('Move {name}: arrow keys up and down', { name: t(r.label) })} onpointerdown={(e) => down(e, r.id)} onkeydown={(e) => key(e, n)}><GripVertical size={16} aria-hidden="true" /></button>
          <SortArrows name={t(r.label)} i={n} n={draft.length} onstep={(dir) => (draft = moveCheck(plain(), n, n + dir))} />
          <span class="ib" aria-hidden="true"><I size={18} /></span>
          <span class="tx"><span class="nm">{t(r.label)}</span>{#if hint}<small>{hint}</small>{/if}</span>
          <button type="button" class="xb" aria-label={t('Remove {name} from this list', { name: t(r.label) })} onclick={() => remove(r.id)}><X size={16} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
    <form class="add" onsubmit={add}>
      <input class="inp" bind:value={words} placeholder={kind === 'eve' ? t('Own row, e.g. pack the ski crampons') : t('Own row, e.g. wax the skis')} aria-label={t('Add an own row')} />
      <button type="submit" class="btn"><Plus size={15} aria-hidden="true" />{t('Add|row')}</button>
    </form>
  </div>

  {#if ideas.length}
    <h3 class="lb">{t('Suggestions for this list')}</h3>
    <ul class="rows box ideas">
      {#each ideas as i (i.key)}
        <li>
          <span class="ib" aria-hidden="true"><Plus size={16} /></span>
          <span class="tx"><span class="nm">{i.label}</span><small>{i.sub}</small></span>
          <button type="button" class="btn" aria-label={t('Add {name}', { name: i.label })} onclick={() => take(i)}>{t('Add|row')}</button>
        </li>
      {/each}
    </ul>
  {/if}

  {#if trip}
    <h3 class="lb" id="ce-scope">{t('Applies to')}</h3>
    <Seg chips full={false} labelledby="ce-scope" value={scope} onchange={(k) => (scope = k)} options={[{ key: 'trip', name: t('Only this trip') }, { key: 'all', name: t(ALL_OF[domain] ?? 'All trips of this type') }]} />
    <p class="fine">{t('Other trip types keep their own list.')}</p>
  {/if}

  <div class="foot">
    <button type="button" class="tp-link back" onclick={restore}><Undo2 size={15} aria-hidden="true" />{t('Restore the suggestion')}</button>
    <span class="bt">
      <button type="button" class="btn" onclick={close}>{t('Cancel')}</button>
      <button type="button" class="btn hi" disabled={saving} onclick={save}>{t('Save')}</button>
    </span>
  </div>
</dialog>

<style>
  .cke {
    width: min(640px, calc(100vw - 24px));
    padding: 20px;
  }
  .hd {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 14px;
  }
  .tt {
    flex: 1;
    min-width: 0;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-section) / 1.25 var(--font-body);
    overflow-wrap: break-word;
  }
  .sub,
  .fine {
    margin: 4px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .fine {
    margin-top: 8px;
    color: var(--ink-3);
  }
  .x {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink);
    cursor: pointer;
  }
  .box {
    padding: 4px 16px 12px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .rows.ideas {
    padding-bottom: 4px;
  }
  .rows li {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 60px;
    padding: 6px 0;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .ideas li:last-child {
    border-bottom: 0;
  }
  .rows li.drag {
    box-shadow: 0 6px 18px var(--shadow);
  }
  .grip {
    flex: none;
    display: grid;
    place-items: center;
    width: 32px;
    height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-3);
    cursor: grab;
    touch-action: none;
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: var(--radius);
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .tx {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow-wrap: break-word;
  }
  .tx small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.35;
  }
  .xb {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink);
    cursor: pointer;
  }
  .add {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }
  .add .inp {
    flex: 1;
    min-width: 0;
    min-height: 44px;
  }
  .add .btn,
  .ideas .btn {
    flex: none;
  }
  .lb {
    margin: 16px 2px 8px;
    color: var(--ink-2);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
  }
  .foot .back {
    margin-right: auto;
  }
  .foot .bt {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    margin-left: auto;
  }
  @media (max-width: 719px) {
    .cke {
      padding: 18px 16px;
    }
    .box {
      padding-inline: 12px;
    }
  }
</style>
