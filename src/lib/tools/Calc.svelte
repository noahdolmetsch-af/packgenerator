<script>
  /**
   * Paket L «Werkzeugkasten» (#6 Rechner): type or tap a line, the result shows while typing.
   * «=» keeps the line in the last 10 (tap one to take its result). Works offline.
   */
  import { Delete, Copy } from '@lucide/svelte';
  import { evaluate, showNumber, pushHistory } from './calc.js';
  import { loadTool, saveTool } from './toolstore.js';
  import { t, locale } from '../i18n.svelte.js';
  import './tools.css';

  let line = $state('');
  let history = $state([]);
  let copied = $state(false);
  let hint = $state(''); // Tote Knöpfe (Klick-Rundgang 22.10.2026): «=» with nothing to count says why
  loadTool('calc', []).then((h) => (history = h));
  const value = $derived(evaluate(line));
  const shown = $derived(value == null ? '' : showNumber(value, locale()));

  const KEYS = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', '.', '%', '+', '(', ')', 'C', '='];
  function press(k) {
    hint = '';
    if (k === 'C') line = '';
    else if (k === '=') done();
    else line += k;
  }
  function done() {
    if (value == null) return (hint = line.trim() ? t('This is not a calculation yet. Check the signs.') : t('Type a calculation first, e.g. 12.50 × 3.'));
    hint = '';
    history = pushHistory(history, line, value);
    saveTool('calc', history).catch(() => {});
    line = String(value);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(String(value));
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {
      /* no clipboard */
    }
  }
</script>

<section class="tool-card calc">
  <label class="tool-field">
    <span>{t('Calculation')}</span>
    <input class="tool-input calc-line" inputmode="decimal" autocomplete="off" placeholder="12.50 × 3 + 10 %" bind:value={line} oninput={() => (hint = '')} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), done())} />
  </label>
  <div class="tool-row calc-res">
    <p class="tool-big" aria-live="polite" data-result>{shown ? `= ${shown}` : '='}</p>
    {#if shown}<button type="button" class="btn sm" onclick={copy}><Copy size={15} aria-hidden="true" />{copied ? t('Copied') : t('Copy')}</button>{/if}
    {#if line}<button type="button" class="btn sm" aria-label={t('Delete last sign')} onclick={() => (line = line.slice(0, -1))}><Delete size={15} aria-hidden="true" /></button>{/if}
  </div>
  {#if hint}<p class="tool-help" role="status" data-calc-hint>{hint}</p>{/if}
  <div class="calc-keys">
    {#each KEYS as k (k)}
      <button type="button" class="btn calc-k" class:hi={k === '='} data-key={k} onclick={() => press(k)}>{k}</button>
    {/each}
  </div>
</section>

{#if history.length}
  <section class="tool-card">
    <h2 class="tool-h">{t('Last calculations')}</h2>
    <ul class="tool-list">
      {#each history as h (h.line)}
        <li><button type="button" class="calc-h" onclick={() => (line = String(h.result))}><span class="tool-muted">{h.line} =</span> <b>{showNumber(h.result, locale())}</b></button></li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .calc-keys {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
    max-width: 420px;
  }
  .calc-k {
    min-height: 52px;
    font-size: var(--fs-section);
    padding: 0;
  }
  .tool-h {
    margin: 0;
    font: 600 var(--fs-sub) / 1.25 var(--font-body);
  }
  .calc-h {
    border: 0;
    background: none;
    padding: 4px 0;
    min-height: 40px;
    text-align: left;
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
</style>
