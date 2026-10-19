<script>
  /**
   * «Neuland» Kantons-Bingo (wish #1007): a 5 × 5 card of cantons, the same all year (a new one on
   * 1 January). The middle is the joker, your home canton, always marked. A canton is marked when you
   * were there that year (found by the app or ticked by you). A full row, column or diagonal is a Bingo.
   * year; card: bingoCard(); marked: Set of canton ids; names: { id: name }; lines: bingoLines();
   * cantons: the canton items (for the joker choice); onhome(id): another joker; onpick(id): a cell.
   */
  import { Star } from '@lucide/svelte';
  import { t, tn } from '../i18n.svelte.js';

  let { year, card, marked, names = {}, lines = [], onhome, onpick } = $props();
  const inLine = $derived(new Set(lines.flatMap((l) => l.cells)));
  const n = $derived(card.cells.filter((c, i) => i !== 12 && marked.has(c)).length);
</script>

<div class="bingo">
  <div class="bh">
    <p class="bs">
      {#if lines.length}<b class="win">{tn(lines.length, '{n} Bingo!', '{n} Bingos!')}</b> ·{/if}
      {tn(n, '{n} of 24 fields in {year}', '{n} of 24 fields in {year}', { year })}
    </p>
  </div>
  <ol class="grid" aria-label={t('Canton bingo {year}', { year })}>
    {#each card.cells as c, i (c)}
      {@const on = i === 12 || marked.has(c)}
      <li>
        <button type="button" class="cell" class:on class:joker={i === 12} class:line={inLine.has(i)} aria-pressed={on} aria-label={i === 12 ? t('Joker: {name}, your home canton', { name: names[c] ?? c }) : `${names[c] ?? c}: ${on ? t('been there in {year}', { year }) : t('not yet in {year}', { year })}`} onclick={() => onpick?.(c)}>
          {#if i === 12}<Star size={14} aria-hidden="true" />{/if}
          <span>{c}</span>
        </button>
      </li>
    {/each}
  </ol>
  <p class="bn">
    {t('A row, a column or a diagonal full: Bingo. The card stays the same all year.')}
    {#if card.out}{t('Not on the card in {year}: {name}.', { year, name: names[card.out] ?? card.out })}{/if}
  </p>
  <label class="home">
    <span>{t('Joker (middle)')}</span>
    <select value={card.joker} onchange={(e) => onhome?.(e.currentTarget.value)}>
      {#each Object.entries(names).sort((a, b) => a[1].localeCompare(b[1])) as [id, name] (id)}<option value={id}>{name}</option>{/each}
    </select>
  </label>
</div>

<style>
  .bingo {
    display: grid;
    gap: 10px;
  }
  .bs {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .win {
    color: var(--hi);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 6px;
    max-width: 420px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    width: 100%;
    aspect-ratio: 1;
    min-height: 44px;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-body) / 1 var(--font-body);
    cursor: pointer;
  }
  .cell.on {
    background: var(--accent-soft);
    border-color: var(--accent);
    color: var(--ink);
  }
  .cell.line {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--paper);
  }
  .cell.joker {
    border-style: dashed;
  }
  .cell:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  .bn {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .home {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .home select {
    min-height: 44px;
    padding: 0 10px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--input);
    color: var(--ink);
    font: inherit;
  }
</style>
