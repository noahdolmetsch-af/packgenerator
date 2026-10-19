<script>
  /**
   * Planungs-Notizen (IS 246–249, Noah «1-3 erarbeiten» 15.10.2026): what comes to mind while planning,
   * in the Plan step. «Daraus wird …» turns a note into a ready-check task, an evening-check task, an
   * item on the packing list, a workshop job before the start, or a ready-check row for all trips of
   * this kind (plannotes.js). A note can also just stay a note. A fixed trip shows them to read only.
   */
  import { t } from '../i18n.svelte.js';
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { checkKey, checkOf, READY_DEFAULT } from '../checks.js';
  import { domainOf, hasBike, readyKey, READY_BY_DOMAIN } from '../domains.js';
  import { tripSlot } from '../sets.js';
  import { nextNumber } from '../notes.js';
  import { localDay } from '../localday.js';
  import { NotebookPen, Check, ChevronDown } from '@lucide/svelte';
  import { MADE, MADE_WORD, EXAMPLES, planNotesOf, addPlanNote, removePlanNote, setMade, withTask, withStandard, planItem, planRepair, rowId } from '../plannotes.js';

  let { trip, bike = null, fixed = false } = $props();
  const notes = $derived(planNotesOf(trip));
  const bikeTrip = $derived(hasBike(trip));
  const ways = $derived(MADE.filter((m) => m.kind !== 'repair' || (bikeTrip && trip.bikeId)));
  let text = $state('');
  let open = $state(null);
  let msg = $state('');

  /** One write on the trip: fn gets the stored trip and returns the changes. */
  async function write(fn, tables = []) {
    const id = trip.id;
    await db.transaction('rw', [db.trips, ...tables], async () => {
      const cur = await db.trips.get(id);
      if (!cur) return;
      const changes = await fn(cur);
      if (changes) await db.trips.update(id, touched(changes));
    });
  }
  const add = (words) => write((cur) => ({ planNotes: addPlanNote(planNotesOf(cur), words) }));
  function submit(event) {
    event.preventDefault();
    if (!text.trim()) return;
    add(text);
    text = '';
  }
  const remove = (id) => write((cur) => ({ planNotes: removePlanNote(planNotesOf(cur), id) }));

  async function make(note, kind) {
    open = null;
    const domain = domainOf(trip);
    const done = (cur, made, more = {}) => ({ ...more, planNotes: setMade(planNotesOf(cur), note.id, made) });
    if (kind === 'ready') await write((cur) => done(cur, { kind, ref: rowId(note) }, { ready: withTask(cur.ready ?? [], note) }));
    if (kind === 'eve')
      await write(
        async (cur) => {
          const standard = (await db.settings.get(checkKey('eve', domain)))?.value ?? null;
          return done(cur, { kind, ref: rowId(note) }, { eve: withTask(checkOf(cur, 'eve', standard), note) });
        },
        [db.settings],
      );
    if (kind === 'item')
      await write(
        async (cur) => {
          const rec = planItem(note, cur, await db.items.toArray());
          await db.items.put(rec);
          const slot = hasBike(cur) ? tripSlot(rec, cur.setup) : cur.packs?.[0]?.key ?? 'body';
          return done(cur, { kind, ref: rec.id }, { entries: [...(cur.entries ?? []), { itemId: rec.id, slot, qty: 1, packed: false }] });
        },
        [db.items],
      );
    if (kind === 'repair')
      await write(
        async (cur) => {
          const rec = planRepair(note, cur, { id: nextNumber(await db.maintenance.toArray()), bike, today: localDay() });
          await db.maintenance.put(rec);
          return done(cur, { kind, ref: rec.id });
        },
        [db.maintenance],
      );
    if (kind === 'all')
      await write(
        async (cur) => {
          const key = readyKey(domain);
          const standard = (await db.settings.get(key))?.value ?? null;
          await db.settings.put({ key, value: withStandard(standard, hasBike(cur) ? READY_DEFAULT : READY_BY_DOMAIN[domain] ?? [], note) });
          return done(cur, { kind, ref: key }, { ready: withTask(cur.ready ?? [], note) });
        },
        [db.settings],
      );
    msg = t(MADE_WORD[kind]);
    setTimeout(() => (msg = ''), 4000);
  }
</script>

{#if !fixed || notes.length}
  <section class="pn" aria-labelledby="pn-h" data-plan-notes>
    <h2 id="pn-h">{t('Planning notes')}</h2>
    <p class="pn-sub">{t('What comes to mind while planning. It can become a task, an item or a workshop job.')}</p>
    {#if notes.length}
      <ul class="card pn-rows">
        {#each notes as n (n.id)}
          <li data-plan-note={n.id}>
            <div class="pn-line">
              <span class="pn-ic" aria-hidden="true">{#if n.made}<Check size={16} />{:else}<NotebookPen size={16} />{/if}</span>
              <span class="pn-tx"
                ><b>{n.text}</b>{#if n.made}<small>{t(MADE_WORD[n.made.kind])}</small>
                {:else if !fixed}<button type="button" class="btn sm pn-make" aria-expanded={open === n.id} onclick={() => (open = open === n.id ? null : n.id)}>{t('Turn into …')}<ChevronDown size={16} aria-hidden="true" /></button>{/if}</span
              >
              {#if !fixed}<button type="button" class="pn-x" aria-label={t('Remove the note «{text}»', { text: n.text })} onclick={() => remove(n.id)}>×</button>{/if}
            </div>
            {#if open === n.id}
              <div class="pn-ways" role="group" aria-label={t('Turn into …')}>
                {#each ways as w (w.kind)}<button type="button" class="btn sm" data-make={w.kind} onclick={() => make(n, w.kind)}>{t(w.label)}</button>{/each}
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {:else if !fixed}
      <div class="pn-ex" role="group" aria-label={t('Examples')}>
        {#each EXAMPLES as ex (ex)}<button type="button" class="btn sm" data-example={t(ex)} onclick={() => add(t(ex))}>+ {t(ex)}</button>{/each}
      </div>
    {/if}
    {#if !fixed}
      <form class="pn-add" onsubmit={submit}>
        <input class="inp" bind:value={text} placeholder={t('New note …')} aria-label={t('New planning note')} />
        <button type="submit" class="btn">{t('Add')}</button>
      </form>
    {/if}
    {#if msg}<p class="pn-ok" role="status"><Check size={16} aria-hidden="true" />{msg}</p>{/if}
  </section>
{/if}

<style>
  .pn {
    min-width: 0;
    margin-top: 16px;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .pn-sub {
    margin: 2px 0 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .pn-rows {
    display: grid;
    margin: 0 0 10px;
    padding-top: 4px;
    padding-bottom: 4px;
    list-style: none;
  }
  .pn-rows li {
    padding: 6px 0;
    border-top: 1px solid var(--line);
  }
  .pn-rows li:first-child {
    border-top: 0;
  }
  .pn-line {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    min-height: 44px;
  }
  .pn-ic {
    display: grid;
    margin-top: 4px;
    flex: none;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--hi-soft);
    color: var(--hi);
  }
  .pn-tx {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .pn-tx b {
    display: block;
    font-weight: 500;
  }
  .pn-tx small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .pn-make {
    margin-top: 6px;
    min-height: 44px;
  }
  .pn-x {
    flex: none;
    min-width: 44px;
    min-height: 44px;
    padding: 8px;
    border: 0;
    background: none;
    font-size: var(--fs-sub);
    line-height: 1;
    cursor: pointer;
  }
  .pn-ways,
  .pn-ex {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 6px 0 4px 42px;
  }
  .pn-ex {
    padding-left: 0;
    margin-bottom: 10px;
  }
  .pn-ways :global(.btn),
  .pn-ex :global(.btn) {
    min-height: 44px;
  }
  .pn-add {
    display: flex;
    gap: 10px;
  }
  .pn-add :global(.inp) {
    flex: 1;
    min-width: 0;
  }
  .pn-ok {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 8px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
