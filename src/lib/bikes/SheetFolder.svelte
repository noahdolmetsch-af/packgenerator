<script>
  /**
   * v0.69.0 «Velo-Blätter» (Noah V1 a, mockup a-mappe): the folder («Mappe») of one bike: its sheets
   * as cards, each with one state line (complete, due, jobs, ticks). «Choose sheets» hides a sheet
   * (everything is a suggestion); «Whole folder as PDF» opens all shown sheets one after the other.
   * compact: one line of links, for the open bike in Care.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { localDay } from '../localday.js';
  import { bikesHash } from '../bikes.js';
  import { SHEETS, sheetsOf, shownSheets, sheetData, folderState } from '../sheets.js';
  import { t, tn } from '../i18n.svelte.js';
  import { IdCard, CalendarCheck, ClipboardList, ListChecks, FolderOpen } from '@lucide/svelte';

  let { bike, compact = false, from = null } = $props();

  const visitsQ = liveQuery(() => db.visits.toArray());
  const tasksQ = liveQuery(() => db.maintenance.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());
  const today = localDay();

  const data = $derived(sheetData(bike, { visits: $visitsQ ?? [], tasks: $tasksQ ?? [], trips: $tripsQ ?? [], today }));
  const state = $derived(folderState({ pass: data.pass, plan: data.plan, order: data.picked, pickup: data.pickup }));
  const shown = $derived(shownSheets(bike));
  const ICON = { pass: IdCard, plan: CalendarCheck, order: ClipboardList, pickup: ListChecks };
  const href = (key) => bikesHash({ tab: 'setup', bike: bike.id, sheet: key, from });

  let choosing = $state(false);
  async function toggle(key, on) {
    const s = sheetsOf(bike);
    const hidden = on ? s.hidden.filter((k) => k !== key) : [...new Set([...s.hidden, key])];
    await db.bikes.update(bike.id, { sheets: { ...$state.snapshot(s), hidden } });
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
          <label class="pk"><input type="checkbox" checked={!sheetsOf(bike).hidden.includes(s.key)} onchange={(e) => toggle(s.key, e.currentTarget.checked)} />{t(s.name)}</label>
        {/each}
      </fieldset>
    {/if}
    <ul class="grid">
      {#each shown as s (s.key)}
        {@const Icon = ICON[s.key]}
        <li>
          <a class="sheet" href={href(s.key)} data-sheet={s.key}>
            <span class="ic"><Icon size={20} aria-hidden="true" /></span>
            <span class="nm">{t(s.name)}</span>
            <span class="sb">{t(s.sub)}</span>
            {#if state[s.key]}<span class="st {state[s.key].tone}" title={state[s.key].text}>{state[s.key].text}</span>{/if}
          </a>
        </li>
      {/each}
    </ul>
    <p class="foot">{shown.length < SHEETS.length ? tn(SHEETS.length - shown.length, '{n} sheet hidden. «Choose sheets» shows it again.', '{n} sheets hidden. «Choose sheets» shows them again.') : t('Every sheet can be hidden. Values come from Setup, Care and the ride ledger.')}</p>
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
    /* v0.69.1 (mockup round): one line, never a two-line pill; the full text as title */
    max-width: 100%;
    box-sizing: border-box;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
  /* v0.69.1: two cards side by side on a phone: a little less padding, so «noch nicht begonnen» fits */
  @media (max-width: 480px) {
    .sheet {
      padding: 12px;
    }
  }
  @media (max-width: 340px) {
    .grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
