<script>
  /**
   * v0.69.0 «Velo-Blätter» (Noah V1 a, mockup a-mappe): the folder («Mappe») of one bike: its sheets
   * as cards, each with one state line (complete, due, jobs, ticks). «Choose sheets» hides a sheet
   * (everything is a suggestion); «Whole folder as PDF» opens all shown sheets one after the other.
   * compact: one line of links, for the open bike in Care.
   * v0.70.0 «Velo-Blätter Teil 2» (Noah W1–W7 a): eight sheets; the Break-in plan shows by itself on a
   * new bike and goes after the first service (W1 a), «Choose sheets» covers all eight; a new sheet is
   * marked «new» until it was opened once (on this device).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { localDay } from '../localday.js';
  import { bikesHash } from '../bikes.js';
  import { SHEETS, sheetsOf, shownSheets, isShown, chooseSheet, sheetData, folderState, NEW_KM } from '../sheets.js';
  import { moreData, moreState } from '../sheets2.js';
  import { bikePhotos } from '../photo.js';
  import { seenSheets } from './seen.js';
  import { t, tn, num } from '../i18n.svelte.js';
  import { IdCard, CalendarCheck, ClipboardList, ListChecks, FolderOpen, Gauge, Wrench, ReceiptText, ShieldAlert } from '@lucide/svelte';

  let { bike, compact = false, from = null } = $props();

  const visitsQ = liveQuery(() => db.visits.toArray());
  const tasksQ = liveQuery(() => db.maintenance.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const photosQ = liveQuery(() => db.photos.toArray());
  const today = localDay();

  const visits = $derived($visitsQ ?? []);
  const data = $derived(sheetData(bike, { visits, tasks: $tasksQ ?? [], trips: $tripsQ ?? [], today }));
  const more = $derived(moreData(bike, data, { visits, items: $itemsQ ?? [], photos: $photosQ ?? [], gallery: bikePhotos(bike, $photosQ ?? []), today }));
  const state = $derived({ ...folderState({ pass: data.pass, plan: data.plan, order: data.picked, pickup: data.pickup }), ...moreState(more) });
  const ctx = $derived({ today, visits });
  const shown = $derived(shownSheets(bike, ctx));
  const hiddenN = $derived(SHEETS.filter((s) => sheetsOf(bike).hidden.includes(s.key)).length);
  const breakinOn = $derived(shown.some((s) => s.key === 'breakin'));
  const ICON = { breakin: Gauge, pass: IdCard, plan: CalendarCheck, order: ClipboardList, pickup: ListChecks, kit: Wrench, warranty: ReceiptText, theft: ShieldAlert };
  const seen = seenSheets();
  const href = (key) => bikesHash({ tab: 'setup', bike: bike.id, sheet: key, from });

  let choosing = $state(false);
  async function toggle(key, on) {
    const s = sheetsOf(bike);
    await db.bikes.update(bike.id, { sheets: { ...$state.snapshot(s), ...chooseSheet(bike, key, on, ctx) } });
  }
</script>

{#if compact}
  <nav class="fline" aria-label={t('Folder of {bike}', { bike: bike.name })}>
    <span class="flbl"><FolderOpen size={16} aria-hidden="true" />{t('Folder|sheets')}</span>
    {#each shown as s (s.key)}<a class="fchip" href={href(s.key)}>{t(s.name)}</a>{/each}
    {#if !shown.length}<a class="fchip" href={bikesHash({ tab: 'setup', bike: bike.id })}>{t('Choose sheets')}</a>{/if}
  </nav>
{:else}
  <section class="card folder" aria-labelledby="folder-h-{bike.id}">
    <div class="fh">
      <div class="ft">
        <p class="eyebrow">{t('Folder|sheets')} · {bike.name}</p>
        <h2 id="folder-h-{bike.id}">{tn(shown.length, '{n} sheet for this bike', '{n} sheets for this bike')}</h2>
        <p class="lead">{t('The app fills every sheet from your data. View it, share it as a PDF or copy the text.')}</p>
      </div>
      <div class="acts">
        <button type="button" class="btn" aria-expanded={choosing} aria-controls="folder-pick-{bike.id}" onclick={() => (choosing = !choosing)}>{t('Choose sheets')}</button>
        {#if shown.length}<a class="btn ink" href={href('all')}>{t('Whole folder as PDF')}</a>{/if}
      </div>
    </div>
    {#if choosing}
      <fieldset class="pick" id="folder-pick-{bike.id}">
        <legend>{t('Which sheets the folder shows')}</legend>
        {#each SHEETS as s (s.key)}
          <label class="pk"><input type="checkbox" checked={isShown(bike, s.key, ctx)} onchange={(e) => toggle(s.key, e.currentTarget.checked)} />{t(s.name)}</label>
        {/each}
      </fieldset>
    {/if}
    <ul class="grid">
      {#each shown as s (s.key)}
        {@const Icon = ICON[s.key]}
        <li>
          <a class="sheet" href={href(s.key)} data-sheet={s.key}>
            <span class="ic"><Icon size={20} aria-hidden="true" /></span>
            {#if s.since && !seen.includes(s.key)}<span class="new">{t('new|sheet')}</span>{/if}
            <span class="nm">{t(s.name)}</span>
            <span class="sb">{t(s.sub)}</span>
            {#if state[s.key]}<span class="st {state[s.key].tone}">{state[s.key].text}</span>{/if}
          </a>
        </li>
      {/each}
    </ul>
    <p class="foot">
      {#if hiddenN}{tn(hiddenN, '{n} sheet hidden. «Choose sheets» shows it again.', '{n} sheets hidden. «Choose sheets» shows them again.')}
      {:else if breakinOn}{t('The Break-in plan comes by itself with a new bike and goes after the first service. Every sheet can be hidden.')}
      {:else if typeof bike.km === 'number' && bike.km >= NEW_KM}{t('No Break-in plan: this bike already has {km} km. Every sheet can be hidden.', { km: num(bike.km) })}
      {:else}{t('Every sheet can be hidden. Values come from Setup, Care and the ride ledger.')}{/if}
    </p>
  </section>
{/if}

<style>
  .folder {
    margin: 0 0 16px;
  }
  .fh {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 10px 16px;
  }
  .ft {
    flex: 1 1 320px;
    min-width: 0;
  }
  .eyebrow {
    margin: 0;
    color: var(--ink-3);
    font: 600 var(--fs-tiny) / 1.4 var(--font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .ft h2 {
    margin: 2px 0;
    font-size: var(--fs-section);
    line-height: 1.25;
  }
  .lead {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .acts .btn {
    min-height: 44px;
    text-decoration: none;
  }
  .pick {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 12px 0 0;
    padding: 8px 12px;
    border: 1px solid var(--line);
    border-radius: 8px;
  }
  .pick legend {
    padding: 0 4px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .pk {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    font-size: var(--fs-body);
  }
  .pk input {
    width: 20px;
    height: 20px;
    accent-color: var(--accent);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    list-style: none;
    margin: 14px 0 0;
    padding: 0;
  }
  .sheet {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    height: 100%;
    box-sizing: border-box;
    padding: 14px 16px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    text-decoration: none;
  }
  .sheet {
    position: relative;
  }
  .new {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--hi-soft);
    color: var(--badge-ink);
    font: 600 var(--fs-tiny) / 1.6 var(--font-body);
  }
  .sheet:hover {
    border-color: var(--line-strong);
    background: var(--paper-2);
  }
  .ic {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    margin-bottom: 6px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .nm {
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .sb {
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
  .st {
    margin-top: auto;
    padding: 1px 9px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font: 500 var(--fs-tiny) / 1.6 var(--font-body);
  }
  .st.ok {
    background: var(--accent-soft);
    color: var(--ok);
  }
  .st.warn {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .foot {
    margin: 12px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .fline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
    margin: 4px 0 12px;
  }
  .flbl {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-right: 4px;
    color: var(--ink-2);
    font: 600 var(--fs-small) var(--font-body);
  }
  .fchip {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    text-decoration: none;
  }
  .fchip:hover {
    background: var(--paper-2);
  }
  @media (max-width: 900px) {
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 340px) {
    .grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
