<script>
  /**
   * Eigene Listen (Noah 14.10.2026 «1a und b 2 b 3a», «4 ok 5 ok»): a new list, or the settings of one.
   * Only the name is needed. With boxes to tick or as plain notes (2b); always in Kalender › Merken, and pinned
   * to one place if you like (3a): a trip (an extra block when packing it), Material, Velos, Aktiv or Balance.
   * place / tripId: the place the window was opened from, chosen already (still changeable).
   * start / points: from the quick field in «Neu» (PL1): the name and the first points.
   */
  import { tick } from 'svelte';
  import { liveQuery } from 'dexie';
  import { X, ListChecks, NotebookPen, Pin } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { db } from '../db.js';
  import { localDay } from '../localday.js';
  import { PIN_PLACES, addPoint } from '../ownlists.js';
  import { addList, changeList, removeList, uid } from '../listsdb.js';
  import { t } from '../i18n.svelte.js';

  let { list = null, place = null, tripId = null, start = '', points = [], onclose, ondone } = $props();
  // svelte-ignore state_referenced_locally
  const from = list;
  // svelte-ignore state_referenced_locally
  let name = $state(from?.name ?? start);
  // svelte-ignore state_referenced_locally
  let check = $state(from ? from.check : true);
  // svelte-ignore state_referenced_locally
  let pin = $state(from ? (from.pin?.place ?? '') : (place ?? ''));
  // svelte-ignore state_referenced_locally
  let trip = $state(from?.pin?.tripId ?? tripId ?? '');
  let error = $state('');
  let dialog;
  let input;

  const today = localDay();
  const tripsQ = liveQuery(() => db.trips.toArray());
  // the trips still ahead (and the one it is pinned to), soonest first
  const trips = $derived(($tripsQ ?? []).filter((x) => x.id === trip || !x.startDate || x.startDate >= today).sort((a, b) => (a.startDate ?? '9999').localeCompare(b.startDate ?? '9999')));
  const tripOf = $derived(trips.find((x) => x.id === trip) ?? trips[0] ?? null);

  $effect(() => {
    dialog.showModal();
    tick().then(() => input?.focus());
  });

  async function del() {
    const undo = await removeList(db, from.id);
    dialog.close();
    ondone?.({ undo, removed: true });
  }
  async function save(e) {
    e?.preventDefault();
    if (!name.trim()) {
      error = t('Give the list a name.');
      return input?.focus();
    }
    const p = !pin ? null : pin === 'trips' ? (tripOf ? { place: 'trips', tripId: tripOf.id } : null) : { place: pin };
    let r;
    if (from) r = { list: from, undo: await changeList(db, from.id, (l) => ({ ...l, name: name.trim(), check, pin: p })) };
    else {
      r = await addList(db, { name, check, pin: p });
      if (r && points.length) await changeList(db, r.list.id, (l) => points.reduce((acc, tx) => addPoint(acc, tx, { id: uid('pt') }), l));
    }
    dialog.close();
    ondone?.(r);
  }
</script>

<dialog class="sheet from-below lsheet" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="ls-h">
  <form onsubmit={save} novalidate>
    <div class="head">
      <div>
        <h2 id="ls-h">{from ? t('List settings') : t('New list')}</h2>
        <p class="lead">{t('Only the name is needed. Every list is in Calendar › Remember.')}</p>
      </div>
      <button type="button" class="x" onclick={() => dialog.close()} aria-label={t('Close')}><X size={20} aria-hidden="true" /></button>
    </div>

    <label class="fld"><span class="lbl">{t('Name')}</span>
      <input class="inp" bind:this={input} bind:value={name} maxlength="60" enterkeyhint="done" placeholder={t('e.g. Shopping before the trip')} aria-invalid={!!error} />
    </label>
    {#if error}<p class="err" role="alert">{error}</p>{/if}

    <fieldset class="fld"><legend class="lbl">{t('Points')}</legend>
      <div class="chips">
        <button type="button" class="chip" aria-pressed={check} onclick={() => (check = true)}><ListChecks size={16} aria-hidden="true" />{t('With boxes to tick')}</button>
        <button type="button" class="chip" aria-pressed={!check} onclick={() => (check = false)}><NotebookPen size={16} aria-hidden="true" />{t('Notes only')}</button>
      </div>
    </fieldset>

    <fieldset class="fld"><legend class="lbl"><Pin size={16} aria-hidden="true" />{t('Also show it at')}</legend>
      <div class="chips">
        <button type="button" class="chip" aria-pressed={!pin} onclick={() => (pin = '')}>{t('Only in Remember')}</button>
        {#each PIN_PLACES as p (p.key)}
          {#if p.key !== 'trips' || trips.length}<button type="button" class="chip" aria-pressed={pin === p.key} onclick={() => (pin = p.key)}>{t(p.label)}</button>{/if}
        {/each}
      </div>
      {#if pin === 'trips' && trips.length}
        <select class="inp tsel" value={tripOf?.id ?? ''} onchange={(e) => (trip = e.currentTarget.value)} aria-label={t('Trip')}>
          {#each trips as x (x.id)}<option value={x.id}>{x.title || t('Trip')}{x.startDate ? ` · ${x.startDate.slice(8, 10)}.${x.startDate.slice(5, 7)}.` : ''}</option>{/each}
        </select>
        <p class="hint">{t('It shows as an extra block when you pack this trip.')}</p>
      {/if}
    </fieldset>

    <div class="acts">
      <button type="submit" class="btn hi">{from ? t('Save') : t('Create list')}</button>
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      {#if from}<button type="button" class="btn del" onclick={del}>{t('Delete list')}</button>{/if}
    </div>
  </form>
</dialog>

<style>
  .lsheet {
    width: min(600px, calc(100vw - 24px));
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }
  .head h2 {
    margin: 0;
  }
  .lead {
    margin: 2px 0 0;
    color: var(--ink-2);
  }
  .x {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink);
    cursor: pointer;
  }
  .fld {
    display: block;
    margin: 14px 0 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  .fld .lbl {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    padding: 0;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 14px;
    border: 1.5px solid var(--line);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .tsel {
    margin-top: 8px;
    width: 100%;
  }
  .hint {
    margin: 6px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .err {
    margin: 6px 0 0;
    color: var(--bad);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 18px;
  }
  .del {
    margin-left: auto;
  }
</style>
