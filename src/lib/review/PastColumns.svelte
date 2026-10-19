<script>
  /**
   * SN4+ SN4e «Spalten» (mockup approved 13.10.2026): which columns «Vergangene Touren» shows. A dialog on a
   * computer, a sheet from below on a phone. At first every column is on; Tour and Zustand always stay.
   * «Wie am Anfang (alle an)» switches everything on again. Every tap is saved at once (settings
   * 'pastView'.hide), «Fertig» only closes. hide: the column keys switched off; onchange(hide); onclose().
   */
  import { Columns3, X, Undo2, Smartphone } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import { COLS, COL_GROUPS, toggled } from './inzahlen.js';

  let { hide = [], onchange, onclose } = $props();
  let dlg;
  const NAME = Object.fromEntries(COLS.map((c) => [c.key, c.name]));
  $effect(() => {
    dlg.showModal();
  });
</script>

<dialog data-backdrop="own" class="sheet from-below pcols" bind:this={dlg} use:backClose onclose={() => onclose?.()} onclick={(e) => e.target === dlg && dlg.close()} aria-labelledby="pc-h" data-columns-sheet>
  <div class="hd">
    <span class="hic" aria-hidden="true"><Columns3 size={20} /></span>
    <div class="hm">
      <h2 id="pc-h">{t('Columns')}</h2>
      <p>{t('At first everything is on. Trip and state always stay.')}</p>
    </div>
    <button type="button" class="x" aria-label={t('Close')} onclick={() => dlg.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  {#each COL_GROUPS as g (g.key)}
    <fieldset class="grp">
      <legend>{t(g.name)}</legend>
      {#each g.keys as k (k)}
        <label class="opt"><input type="checkbox" checked={!hide.includes(k)} onchange={() => onchange?.(toggled(hide, k))} data-col={k} /><span>{t(NAME[k])}</span></label>
      {/each}
    </fieldset>
  {/each}
  <p class="note"><Smartphone size={16} aria-hidden="true" /><span>{t('On a phone each trip is a card: weather and temperature next to the date, then km · Hm · moving time · Ø heart rate · max ♥, the bike type and the comment, as far as they are on here.')}</span></p>
  <div class="ft">
    <button type="button" class="reset" onclick={() => onchange?.([])} disabled={!hide.length}><Undo2 size={16} aria-hidden="true" />{t('As at first (all on)')}</button>
    <button type="button" class="btn hi" onclick={() => dlg.close()}>{t('Done')}</button>
  </div>
</dialog>

<style>
  .pcols {
    width: min(560px, calc(100vw - 24px));
  }
  .hd {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin: 0 0 6px;
  }
  .hic {
    display: grid;
    flex: none;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .hm {
    flex: 1;
    min-width: 0;
  }
  .hm h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .hm p {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .x {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: var(--paper-2);
    color: var(--ink);
    cursor: pointer;
  }
  .grp {
    margin: 10px 0 0;
    padding: 0;
    border: 0;
  }
  .grp legend {
    padding: 0;
    margin: 0 0 2px;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
  .opt {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 46px;
    border-bottom: 1px solid var(--line);
    font-size: var(--fs-body);
    cursor: pointer;
  }
  .opt input {
    width: 22px;
    height: 22px;
    margin: 0;
    accent-color: var(--accent);
    flex: none;
  }
  .note {
    display: flex;
    gap: 8px;
    margin: 12px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .note :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--ink-3);
  }
  .ft {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 8px 16px;
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--line);
  }
  .reset {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-body) var(--font-body);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .reset:disabled {
    color: var(--ink-3);
    text-decoration: none;
    cursor: default;
  }
  .ft .btn {
    min-height: 44px;
    min-width: 120px;
  }
</style>
