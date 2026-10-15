<script>
  /**
   * v0.88.0 «Aufräumen und Ausprobieren» (Noah 0.88 1a 2a, mockup F): Ich › «Testdaten aufräumen».
   * What has «test» in its name, by group (trips with their debriefs, gear, templates). Every group
   * and every entry can be unticked; one button archives the rest. Nothing is deleted: «Undo» brings
   * everything back, here, at any time (testdata.js). Back closes only this sheet.
   */
  import { backClose } from '../ui/backclose.js';
  import { db } from '../db.js';
  import { testDataState, tidyTestData, undoTestData } from '../testdatadb.js';
  import { GROUPS, debriefCount } from '../testdata.js';
  import { t, tn } from '../i18n.svelte.js';
  import { ChevronRight, Check, Archive } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';

  let { onclose } = $props();
  let dialog = $state();
  let st = $state(null);
  let off = $state(new Set());
  let open = $state(null);
  let busy = $state(false);
  let msg = $state('');
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  async function load() {
    st = await testDataState(db);
  }
  load();

  const NAMES = { trips: ['{n} trip', '{n} trips'], items: ['{n} gear item', '{n} gear items'], templates: ['{n} template', '{n} templates'], learnings: ['{n} learning', '{n} learnings'] };
  const groups = $derived(st ? GROUPS.filter((g) => st.found[g].length) : []);
  const chosen = $derived(new Set(st ? GROUPS.flatMap((g) => st.found[g].map((x) => x.id)).filter((id) => !off.has(id)) : []));
  const nChosen = $derived(chosen.size);
  const nDebriefs = $derived(st ? debriefCount(st.found, chosen) : 0);
  const groupOn = (g) => st.found[g].some((x) => !off.has(x.id));
  function toggleGroup(g) {
    const next = new Set(off);
    const on = groupOn(g);
    for (const x of st.found[g]) on ? next.add(x.id) : next.delete(x.id);
    off = next;
  }
  function toggle(id) {
    const next = new Set(off);
    next.has(id) ? next.delete(id) : next.add(id);
    off = next;
  }
  const sample = (g) => {
    const names = st.found[g].map((x) => x.name).filter(Boolean);
    return names.slice(0, 3).join(', ') + (names.length > 3 ? ' …' : '');
  };
  async function archive() {
    busy = true;
    try {
      const n = await tidyTestData(db, chosen);
      msg = tn(n, '{n} thing archived.', '{n} things archived.');
      off = new Set();
      await load();
    } finally {
      busy = false;
    }
  }
  async function undo() {
    busy = true;
    try {
      const n = await undoTestData(db);
      msg = tn(n, '{n} thing is back.', '{n} things are back.');
      await load();
    } finally {
      busy = false;
    }
  }
</script>


<!-- Design-Refresh P9 (I13b, Noah 12.10.2026 «Runde 20 freigegeben»): the window look of the new style:
     the groups with their tick on a soft panel (tap the text to see the entries), the note «Archived,
     not deleted», the buttons bottom right (the main one last). The same clean-up as before. -->
<dialog class="sheet tdsheet vdlg" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="td-h">
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="td-h">{t('Clean up test data')}</h2>
      {#if st?.found.n}<p class="vd-sub">{t('Found: everything with «test» in its name. Untick what should stay.')}</p>{/if}
    </div>
  </div>
  {#if !st}
    <p class="lead">{t('Loading…')}</p>
  {:else}
    {#if st.found.n}
      <ul class="vd-panel groups">
        {#each groups as g (g)}
          <li>
            <div class="grow">
              <button type="button" class="check" class:on={groupOn(g)} role="checkbox" aria-checked={groupOn(g)} aria-label={tn(st.found[g].length, ...NAMES[g])} onclick={() => toggleGroup(g)}>{#if groupOn(g)}<Check size={16} aria-hidden="true" />{/if}</button>
              <button type="button" class="what" aria-expanded={open === g} onclick={() => (open = open === g ? null : g)}>
                <b>{tn(st.found[g].length, ...NAMES[g])}</b>
                <small>{g === 'trips' && nDebriefs ? tn(nDebriefs, 'with {n} debrief: no longer counts for learning', 'with {n} debriefs: no longer count for learning') : sample(g)}</small>
              </button>
              <span class="chev" class:down={open === g}><ChevronRight size={18} aria-hidden="true" /></span>
            </div>
            {#if open === g}
              <ul class="entries">
                {#each st.found[g] as x (x.id)}
                  <li><label><input type="checkbox" checked={!off.has(x.id)} onchange={() => toggle(x.id)} /> <span>{x.name || t('(no name)')}</span></label></li>
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ul>
      <div class="vd-note"><Archive size={16} aria-hidden="true" /><span><b>{t('Archived, not deleted')}</b> {t('The app no longer learns from it. «Undo» in Ich › Clean up test data, at any time.')}</span></div>
    {:else}
      <p class="lead">{t('Nothing with «test» in its name left.')}</p>
    {/if}
    {#if msg}<p class="msg" role="status">{msg}</p>{/if}
  {/if}
  <div class="vd-foot">
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Close')}</button>
    {#if st?.tidied}
      <button type="button" class="btn" disabled={busy} onclick={undo}>{tn(st.tidied, 'Undo: bring {n} thing back', 'Undo: bring {n} things back')}</button>
    {/if}
    {#if st?.found.n}
      <button type="button" class="btn hi" disabled={busy || !nChosen} onclick={archive}>{tn(nChosen, 'Archive {n} thing', 'Archive {n} things')}</button>
    {/if}
  </div>
</dialog>

<style>
  .lead {
    margin: 0;
    color: var(--ink-2);
  }
  .groups,
  .entries {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .groups {
    padding: 4px 12px;
  }
  .grow {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 60px;
  }
  .check {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
    position: relative;
    color: var(--paper);
  }
  .check :global(svg) {
    position: relative;
    z-index: 1;
  }
  .check::after {
    content: '';
    position: absolute;
    inset: 11px;
    border: 1.5px solid var(--line-strong);
    border-radius: 6px;
    background: var(--paper);
  }
  .check.on::after {
    border-color: var(--ink);
    background: var(--ink);
  }
  .what {
    flex: 1;
    min-width: 0;
    display: grid;
    gap: 2px;
    min-height: 44px;
    padding: 8px 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .what b {
    font-weight: 600;
  }
  .what small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .chev {
    flex: none;
    display: grid;
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  .chev.down {
    transform: rotate(90deg);
  }
  .entries {
    padding: 0 0 10px 52px;
  }
  .entries label {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    overflow-wrap: break-word;
  }
  .vd-note :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .vd-note b {
    color: var(--ink);
    font-weight: 600;
  }
  .msg {
    margin: 12px 0 0;
    color: var(--ink-2);
  }
</style>
