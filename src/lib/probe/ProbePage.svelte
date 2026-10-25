<script>
  /**
   * Paket B «Touren ohne Überraschung»: «Generalprobe» (#/trip/<id>/probe) and «Gut ankommen»
   * (#/trip/<id>/heim). Both are a short list of steps with «Works», «Gap» and «Not needed»; a gap
   * becomes a to-do in Merken with one tap. Own steps can be added, renamed and deleted.
   * Logic: probe.js (tested in tests/probe.test.js). Shown by pages/Between.svelte.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, tn } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { openTrip } from '../nav.js';
  import { tripDates } from '../tabs.js';
  import { betweenHref } from '../phase.js';
  import { chargeList, chargeCount } from '../charge.js';
  import { addTodo } from '../merkendb.js';
  import { LAST_BACKUP } from '../backup.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import PageHead from '../ui/PageHead.svelte';
  import MainBar from '../ui/MainBar.svelte';
  import { Check, CircleAlert, Minus, ChevronRight, Plus, Pencil, Trash2, ListTodo, Circle } from '@lucide/svelte';
  import { PROBE_STEPS, HOME_STEPS, rowsOf, summary, answer, withTodo, addOwn, renameOwn, removeOwn, todoDue } from './probe.js';

  let { trip, kind = 'probe', items = [], debrief = null } = $props();

  const today = localDay();
  const field = $derived(kind === 'heim' ? 'home' : 'probe');
  const list = $derived(kind === 'heim' ? HOME_STEPS : PROBE_STEPS);
  const rec = $derived(trip?.[field] ?? null);

  const offlineQ = liveQuery(() => db.meta.get('offlineSaved'));
  const backupQ = liveQuery(() => db.meta.get(LAST_BACKUP));
  const charge = $derived(trip ? chargeList(trip, items) : []);
  const charged = $derived(trip ? chargeCount(trip, charge) : { done: 0, total: 0 });
  const ctx = $derived({
    today,
    offlineAt: $offlineQ?.value?.[trip?.id]?.at ?? null,
    backupAt: $backupQ?.at ?? null,
    debriefDone: debrief?.status === 'done',
    chargeDone: charged.done,
    chargeTotal: charged.total,
  });
  const rows = $derived(trip ? rowsOf(list, trip, rec, ctx) : []);
  const sum = $derived(summary(rows));
  const context = $derived(trip ? `${trip.title} · ${tripDates(trip)}` : '');

  const careHref = $derived(trip?.bikeId ? `#/bikes?tab=care&bike=${encodeURIComponent(trip.bikeId)}` : '#/bikes?tab=care');
  const hrefOf = (s) => (s.href === 'care' ? careHref : s.href === 'debrief' ? `#/debrief/${encodeURIComponent(trip.id)}` : s.href);

  async function save(next) {
    await db.trips.update(trip.id, { [field]: next, updatedAt: new Date().toISOString() });
  }
  const pick = (key, r) => save(answer($state.snapshot(rec), key, r));

  async function remember(s) {
    const step = s.own ? s.name : t(s.name);
    const text = kind === 'heim' ? t('After {trip}: {step}', { trip: trip.title, step }) : t('Before {trip}: {step}', { trip: trip.title, step });
    const res = await addTodo(db, { text, due: todoDue(kind, trip, today), src: `${field}:${trip.id}` });
    if (!res) return;
    await save(withTodo($state.snapshot(rec), s.key, res.todo.id));
    offerDone(t('In Merken, due {day}.', { day: new Date(`${res.todo.due}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'numeric' }) }), async () => {
      await res.undo();
      await save(withTodo($state.snapshot(rec), s.key, null));
    });
  }

  /* own steps */
  let newName = $state('');
  let editing = $state(null); // id
  let editName = $state('');
  async function add(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    await save(addOwn($state.snapshot(rec), newName));
    newName = '';
  }
  async function rename(e, id) {
    e.preventDefault();
    await save(renameOwn($state.snapshot(rec), id, editName));
    editing = null;
  }
  async function drop(s) {
    const ok = await askDelete({ title: t('Delete «{name}»?', { name: s.name }), text: t('Only this step goes. To-dos made from it stay in Merken.') });
    if (ok !== 'delete') return;
    const before = $state.snapshot(rec);
    await deleteWithUndo({ run: () => save(removeOwn(before, s.key)).then(() => before), undo: (saved) => save(saved), text: t('«{name}» deleted.', { name: s.name }), name: s.name });
  }

  const title = $derived(kind === 'heim' ? t('Arrive well') : t('Dress rehearsal'));
  const text = $derived(kind === 'heim' ? t('Back home. A few small things, then {trip} is really finished.', { trip: trip.title }) : t('Try {trip} once at home, a few days before. What does not work yet becomes a to-do.', { trip: trip.title }));
  const line = $derived(sum.done ? (sum.gap ? tn(sum.gap, 'Done. {n} gap is left.', 'Done. {n} gaps are left.') : t('Done. Nothing open.')) : t('{done} of {n} checked', { done: sum.ok + sum.gap, n: sum.total }));
  const main = $derived(kind === 'heim' ? (debrief?.status === 'done' ? { label: t('To the start page'), href: '#/' } : { label: t('Continue to Debrief'), href: `#/debrief/${encodeURIComponent(trip.id)}`, onclick: () => openTrip(trip.id) }) : { label: t('Back to the trip'), href: '#/pack', onclick: () => openTrip(trip.id) });
  const second = $derived(kind === 'heim' ? { label: t('Back'), href: betweenHref(trip, 'ended') } : { label: t('To the start page'), href: '#/' });
</script>

<article class="pr" aria-labelledby="pr-h" data-probe={kind}>
  <p class="trip">{context}</p>
  <section class="card hero" id="pr-h">
    <PageHead {title} {text} sub={line} />
    <p class="what">{kind === 'heim' ? t('Tap «Done» or «Not needed». «Later» makes a to-do for tomorrow.') : t('Tap «Works», «Gap» or «Not needed». Some steps tick themselves, for example a fresh backup.')}</p>
  </section>

  <section class="until" aria-labelledby="pr-steps">
    <h2 id="pr-steps" class="sh">{kind === 'heim' ? t('Back home') : t('Try at home')}</h2>
    <ul class="card rows">
      {#each rows as s (s.key)}
        <li data-step={s.key} data-r={s.r ?? 'open'}>
          <div class="row">
            <span class="ic {s.r ?? 'open'}" aria-hidden="true">{#if s.r === 'ok'}<Check size={18} />{:else if s.r === 'gap'}<CircleAlert size={18} />{:else if s.r === 'skip'}<Minus size={18} />{:else}<Circle size={18} />{/if}</span>
            {#if editing === s.key}
              <form class="bt edit" onsubmit={(e) => rename(e, s.key)}>
                <!-- svelte-ignore a11y_autofocus -->
                <input type="text" bind:value={editName} aria-label={t('Name of the step')} autofocus />
                <button type="submit" class="btn sm">{t('Save')}</button>
                <button type="button" class="tp-link" onclick={() => (editing = null)}>{t('Cancel')}</button>
              </form>
            {:else if s.href}
              <a class="bt lnk" href={hrefOf(s)} onclick={() => s.trip && openTrip(trip.id)}><b>{s.own ? s.name : t(s.name)}</b>{#if s.sub}<small>{t(s.sub)}</small>{/if}{#if s.auto}<small class="auto">{t('Ticked by itself')}</small>{/if}</a>
              <ChevronRight size={18} aria-hidden="true" />
            {:else}
              <span class="bt"><b>{s.own ? s.name : t(s.name)}</b>{#if s.sub}<small>{t(s.sub)}</small>{/if}{#if s.auto}<small class="auto">{t('Ticked by itself')}</small>{/if}</span>
            {/if}
          </div>
          <div class="acts" role="group" aria-label={s.own ? s.name : t(s.name)}>
            <button type="button" class="ch ok" aria-pressed={s.r === 'ok'} onclick={() => pick(s.key, 'ok')}>{kind === 'heim' ? t('Done|homestep') : t('Works')}</button>
            <button type="button" class="ch gap" aria-pressed={s.r === 'gap'} onclick={() => pick(s.key, 'gap')}>{kind === 'heim' ? t('Later') : t('Gap')}</button>
            <button type="button" class="ch" aria-pressed={s.r === 'skip'} onclick={() => pick(s.key, 'skip')}>{t('Not needed|step')}</button>
            {#if s.r === 'gap'}
              {#if s.todo}<a class="tp-link todo" href="#/calendar" data-todo><ListTodo size={14} aria-hidden="true" />{t('In Merken')}</a>
              {:else}<button type="button" class="tp-link todo" onclick={() => remember(s)} data-remember><ListTodo size={14} aria-hidden="true" />{t('Keep as to-do')}</button>{/if}
            {/if}
            {#if s.own && editing !== s.key}
              <span class="own">
                <button type="button" class="ib" aria-label={t('Rename «{name}»', { name: s.name })} onclick={() => ((editing = s.key), (editName = s.name))}><Pencil size={16} /></button>
                <button type="button" class="ib" aria-label={t('Delete «{name}»', { name: s.name })} onclick={() => drop(s)}><Trash2 size={16} /></button>
              </span>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
    <form class="add" onsubmit={add}>
      <input type="text" bind:value={newName} placeholder={t('Own step, e.g. «Water the plants»')} aria-label={t('Add own step')} />
      <button type="submit" class="btn sm" disabled={!newName.trim()}><Plus size={16} aria-hidden="true" />{t('Add')}</button>
    </form>
    <p class="hint">{t('Own steps stay with this trip. Steps that do not fit: «Not needed».')}</p>
  </section>
  <MainBar {main} {second} />
</article>

<style>
  .pr {
    max-width: 1080px;
    margin: 0 auto;
    padding: 0 0 24px;
  }
  .trip {
    margin: 0 0 8px;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .hero {
    max-width: 620px;
    margin: 20px auto 0;
    text-align: center;
  }
  .hero .what {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .until {
    max-width: 620px;
    margin: 24px auto 0;
  }
  .sh {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .rows {
    list-style: none;
    margin: 8px 0 0;
    padding-top: 4px;
    padding-bottom: 4px;
  }
  .rows li {
    display: block;
    padding: 6px 0 10px;
  }
  .rows li + li {
    border-top: 1px solid var(--line);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 52px;
    color: var(--ink);
  }
  .row > :global(svg) {
    flex: none;
    color: var(--ink-3);
  }
  .ic {
    display: grid;
    flex: none;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-3);
  }
  .ic.ok {
    color: var(--accent);
  }
  .ic.gap {
    color: var(--warn, var(--ink));
  }
  .bt {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
    color: var(--ink);
    text-decoration: none;
  }
  .bt b {
    display: block;
    font-weight: 500;
  }
  .bt small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .bt small.auto {
    color: var(--accent);
  }
  .edit {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .edit input,
  .add input {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    padding: 0 10px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-left: 46px;
  }
  .ch {
    min-height: 36px;
    padding: 0 12px;
    border: 1px solid var(--line-strong);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink-2);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .ch[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .ch.ok[aria-pressed='true'] {
    border-color: var(--accent);
    background: var(--accent);
  }
  .todo {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 36px;
  }
  .own {
    display: inline-flex;
    gap: 2px;
    margin-left: auto;
  }
  .ib {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .add {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }
  .add .btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .hint {
    margin: 6px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  @media (max-width: 719px) {
    .pr {
      padding-bottom: 96px;
    }
    .acts {
      margin-left: 0;
    }
  }
</style>
