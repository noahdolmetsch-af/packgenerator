<script>
  /**
   * v0.144.0 RE «Pflege selbst einstellen» (mockup RE3-pflegeliste, Noah 14.10.2026 4a): the card
   * «Pflege für …» above the part list. One row per care that fits the bike: name and part, what counts
   * now («alle 150 km», «Warnung 0,4 % · ersetzen 0,5 %»), «Standard» or «von dir geändert · Standard …
   * · zurücksetzen», a switch (off: no reminder, the history stays), the note or «+ Notiz».
   * A tap on the row opens the sheet (CareSheet.svelte). Under the rows: «7 von 8 an · 1 geändert ·
   * Alle auf Standard zurücksetzen». Today's numbers stay the standard; everything is a suggestion.
   *
   * bike: the bike AS STORED (not withVisits: its parts are written back); onsave(patch): stores the
   * fields on the bike (care/plan.js careChange / careResetAll).
   */
  import { Wrench, ChevronRight, StickyNote, Plus } from '@lucide/svelte';
  import { t, tn } from '../i18n.svelte.js';
  import { carePlan, careChange, careResetAll } from './plan.js';
  import { careValue, careStdText } from './plantext.js';
  import CareSheet from './CareSheet.svelte';
  import ShowMore from '../ui/ShowMore.svelte';
  import { phone } from '../media.svelte.js';
  import { PHONE_ROWS, capKeep } from '../touren/kurz.js';

  let { bike, onsave } = $props();

  const plan = $derived(carePlan(bike));
  // Gesamttest 21.10.2026 C7: on a phone the first PHONE_ROWS cares, then «Show n more».
  let all = $state(false);
  const shown = $derived(phone.matches && !all ? capKeep(plan.rows, PHONE_ROWS) : plan.rows);
  let open = $state(null); // { key, focus: 'note' | null }
  let busy = $state(false);

  async function store(patch) {
    if (busy) return;
    busy = true;
    try {
      await onsave?.($state.snapshot(patch));
    } finally {
      busy = false;
    }
  }
  // Switched back on, a care starts with the standard again.
  const toggle = (r) => store(careChange(bike, r.key, { on: !r.on }));
  const reset = (r) => store(careChange(bike, r.key, { on: true, values: null }));
  const resetAll = () => store(careResetAll(bike));
</script>

<section class="cplan" aria-labelledby="cplan-h-{bike.id}" data-care-plan>
  <h3 id="cplan-h-{bike.id}"><Wrench size={18} aria-hidden="true" />{t('Care for {bike}', { bike: bike.name })}</h3>
  <p class="lead">{t('You choose what the app reminds you of, and how often. The app’s numbers are the standard.')}</p>
  <ul class="rows">
    {#each shown as r (r.key)}
      <li class:off={!r.on} data-care={r.key}>
        <button type="button" class="main" onclick={() => (open = { key: r.key, focus: null })} aria-label={t('Set up care: {name}', { name: t(r.name) })}>
          <span class="nm"><b>{t(r.name)}</b>{' '}<small>{t(r.sub)}</small></span>
          <span class="val"><span class="num">{r.on ? careValue(r) : t('off: no reminder')}</span>{' '}<small>{#if !r.on}{t('Standard would be {v}', { v: careStdText(r) })}{:else if r.changed}{t('changed by you')} · {t('Standard {v}', { v: careStdText(r) })}{:else}{t('Standard')}{/if}</small></span>
          <span class="ch" aria-hidden="true"><ChevronRight size={18} /></span>
        </button>
        {#if r.changed}<button type="button" class="tp-link rs" disabled={busy} onclick={() => reset(r)} aria-label={t('Reset {name} to the standard', { name: t(r.name) })}>{t('reset|care')}</button>{/if}
        <button type="button" class="switch" role="switch" aria-checked={r.on} disabled={busy} aria-label={t('Care: {name}', { name: t(r.name) })} onclick={() => toggle(r)}><span class="knob"></span></button>
        {#if r.note}
          <button type="button" class="note" onclick={() => (open = { key: r.key, focus: 'note' })}><StickyNote size={15} aria-hidden="true" /><span>{r.note}</span></button>
        {:else}
          <button type="button" class="tp-link addnote" onclick={() => (open = { key: r.key, focus: 'note' })}><Plus size={14} aria-hidden="true" />{t('Note|care')}</button>
        {/if}
      </li>
    {/each}
  </ul>
  {#if shown.length < plan.rows.length}<ShowMore n={plan.rows.length - shown.length} onclick={() => (all = true)} data-care-plan-more />{/if}
  <p class="foot"><span class="num">{t('{on} of {n} on', { on: plan.on, n: plan.n })}{#if plan.changed}{' · '}{tn(plan.changed, '{n} changed', '{n} changed')}{/if}</span>{#if plan.changed || plan.on < plan.n}<button type="button" class="tp-link" disabled={busy} onclick={resetAll}>{t('Reset all to the standard')}</button>{/if}</p>
</section>

{#if open}
  {@const r = plan.rows.find((x) => x.key === open.key)}
  {#if r}<CareSheet {bike} row={r} focus={open.focus} onsave={(patch) => store(patch)} onclose={() => (open = null)} />{/if}
{/if}

<style>
  .cplan {
    margin: 0 0 14px;
    padding: 14px 16px 10px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: var(--fs-body);
  }
  .lead {
    margin: 4px 0 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .rows li {
    display: grid;
    /* the column of «zurücksetzen» keeps its width in every row, so the values stay in one line */
    grid-template-columns: minmax(0, 1fr) minmax(7rem, auto) auto;
    align-items: center;
    column-gap: 6px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .main {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
    gap: 4px 12px;
    align-items: center;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .nm,
  .val {
    display: grid;
    min-width: 0;
  }
  .nm b {
    font-weight: 500;
    overflow-wrap: break-word;
  }
  small {
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .off .nm b,
  .off .val {
    color: var(--ink-2);
  }
  .rs {
    grid-column: 2;
    justify-self: end;
    min-height: 44px;
    font-size: var(--fs-small);
  }
  .ch {
    display: grid;
    place-items: center;
    color: var(--ink-3);
  }
  .note,
  .addnote {
    grid-column: 1 / -1;
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    font-size: var(--fs-small);
  }
  .note {
    max-width: 100%;
    min-height: 36px;
    padding: 4px 10px;
    border: 0;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
    text-align: left;
    cursor: pointer;
  }
  .note span {
    overflow-wrap: break-word;
  }
  .addnote {
    min-height: 32px;
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin: 0;
    padding-top: 10px;
    border-top: 1px solid var(--line);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .foot .tp-link {
    min-height: 44px;
  }
  .switch {
    grid-column: 3;
    position: relative;
    flex: none;
    width: 56px;
    height: 44px;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .switch::before {
    content: '';
    position: absolute;
    left: 4px;
    right: 4px;
    top: 50%;
    height: 28px;
    transform: translateY(-50%);
    border-radius: 99px;
    background: var(--line-strong);
    transition: background 0.15s;
  }
  .switch .knob {
    position: absolute;
    top: 50%;
    left: 8px;
    width: 20px;
    height: 20px;
    transform: translateY(-50%);
    border-radius: 50%;
    background: var(--paper);
    box-shadow: 0 1px 2px var(--shadow);
    transition: left 0.15s;
  }
  .switch[aria-checked='true']::before {
    background: var(--accent);
  }
  .switch[aria-checked='true'] .knob {
    left: 28px;
  }
  @media (max-width: 719px) {
    .rows li {
      grid-template-columns: minmax(0, 1fr) auto auto;
    }
    .main {
      grid-template-columns: minmax(0, 1fr);
    }
    .ch {
      display: none;
    }
  }
</style>
