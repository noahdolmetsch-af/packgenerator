<script>
  /**
   * v0.65.0 «Velo-Masse» (Noah: «zwingend die Sitzhöhe, der gewünschte Reifendruck, die Lenkerbreite
   * … sowie weitere angezeigt»): the bike's fit and setup numbers at the top of its page, always open.
   * A grid of label + value (two columns on a phone, four on a wide screen), Noah's three first
   * (bikespecs.js FIT). An empty value is a calm «–»; a tap edits it in place (number keyboard, the
   * unit beside it), Enter or leaving the field saves, Escape cancels, and a toast offers Undo.
   */
  import { db } from '../db.js';
  import { fitRows, setFit, readValue } from '../bikespecs.js';
  import { bikesHash } from '../bikes.js';
  import { t, num } from '../i18n.svelte.js';
  import { Ruler, Columns3 } from '@lucide/svelte';
  import { tick } from 'svelte';

  let { bike } = $props();

  const rows = $derived(fitRows(bike));
  const filled = $derived(rows.filter((r) => r.value != null).length);
  const show = (r) => (r.value == null ? '–' : r.num && typeof r.value === 'number' ? `${num(r.value)}${r.unit ? ` ${r.unit}` : ''}` : String(r.value));

  let editing = $state(null); // key
  let text = $state('');
  let error = $state('');
  let input = $state();
  async function open(r) {
    editing = r.key;
    error = '';
    text = r.value == null ? '' : String(r.value);
    await tick();
    input?.focus();
    input?.select();
  }

  /* Undo: the bike's fields as they were before the last save. */
  let toast = $state(null); // { text, prev, bikeId }
  let timer;
  $effect(() => () => clearTimeout(timer));
  async function save(r) {
    if (editing !== r.key) return;
    const v = text.trim() === '' ? null : readValue(text, r.num);
    if (r.num && v != null && typeof v !== 'number') {
      error = t('Type a number, e.g. {n}', { n: r.unit === 'bar' ? '1.6' : '740' });
      return;
    }
    editing = null;
    error = '';
    const stored = await db.bikes.get(bike.id);
    if (!stored) return;
    const before = fitRows(stored).find((x) => x.key === r.key)?.value ?? null;
    if (String(before ?? '') === String(v ?? '')) return;
    const changes = setFit(stored, r.key, v);
    const prev = Object.fromEntries(Object.keys(changes).map((k) => [k, stored[k] ?? (k === 'fit' ? {} : null)]));
    await db.bikes.update(bike.id, changes);
    clearTimeout(timer);
    toast = { text: v == null ? t('{what} cleared.', { what: t(r.name) }) : t('{what}: {value}.', { what: t(r.name), value: show({ ...r, value: v }) }), prev, bikeId: bike.id };
    timer = setTimeout(() => (toast = null), 8000);
  }
  function key(e, r) {
    if (e.key === 'Enter') {
      e.preventDefault();
      save(r);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      editing = null;
      error = '';
    }
  }
  async function undo() {
    const x = $state.snapshot(toast);
    clearTimeout(timer);
    toast = null;
    if (x) await db.bikes.update(x.bikeId, x.prev);
  }
</script>

<section class="card fit" aria-labelledby="fit-h">
  <div class="fh">
    <h2 id="fit-h"><Ruler size={20} aria-hidden="true" />{t('Fit and setup')}</h2>
    <span class="r num">{t('{n} of {all}', { n: filled, all: rows.length })}</span>
    <a class="cmp" href={bikesHash({ tab: 'compare' })}><Columns3 size={16} aria-hidden="true" />{t('Compare bikes')}</a>
  </div>
  <dl class="grid">
    {#each rows as r (r.key)}
      <div class="cell" class:first={r.key === 'seatHeight' || r.key === 'pressureF' || r.key === 'pressureR' || r.key === 'barWidth'}>
        <dt id="fit-{r.key}">{t(r.name)}</dt>
        <dd>
          {#if editing === r.key}
            <span class="edit">
              <input bind:this={input} class="inp" class:num={r.num} type="text" inputmode={r.num ? 'decimal' : 'text'} autocomplete="off" aria-labelledby="fit-{r.key}" bind:value={text} onkeydown={(e) => key(e, r)} onblur={() => save(r)} />
              {#if r.unit}<span class="unit">{r.unit}</span>{/if}
            </span>
            {#if error}<small class="err" role="alert">{error}</small>{/if}
          {:else}
            <button type="button" class="val num" class:none={r.value == null} aria-label="{t(r.name)}: {show(r)}" onclick={() => open(r)}>{show(r)}</button>
          {/if}
        </dd>
      </div>
    {/each}
  </dl>
</section>

{#if toast}
  <div class="fittoast" role="status">
    <span>{toast.text}</span>
    <button type="button" class="btn sm" onclick={undo}>{t('Undo')}</button>
  </div>
{/if}

<style>
  .fit {
    margin: 0 0 12px;
    padding: 14px 16px 10px;
  }
  .fh {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    margin: 0 0 6px;
  }
  .fh h2 {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
    color: var(--ink);
  }
  .fh h2 :global(svg) {
    color: var(--ink-3);
  }
  .fh .r {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .cmp {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    margin-left: auto;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 500;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 16px;
    margin: 0;
  }
  @media (min-width: 900px) {
    .grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  .cell {
    min-width: 0;
    padding: 6px 0 2px;
    border-top: 1px solid var(--line);
  }
  dt {
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.3;
    overflow-wrap: break-word;
  }
  .cell.first dt {
    color: var(--ink-2);
    font-weight: 600;
  }
  dd {
    margin: 0;
  }
  .val {
    display: block;
    width: 100%;
    min-height: 44px;
    margin: 0;
    padding: 4px 0;
    border: 0;
    background: none;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
    color: var(--ink);
    text-align: left;
    cursor: pointer;
    overflow-wrap: break-word;
  }
  .val.none {
    font-weight: 400;
    color: var(--ink-3);
  }
  @media (hover: hover) {
    .val:hover {
      background: var(--paper-2);
    }
  }
  .edit {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 0;
  }
  .edit .inp {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 44px;
  }
  .unit {
    flex: none;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .err {
    display: block;
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .fittoast {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: 24px;
    z-index: 30;
    width: min(520px, calc(100vw - 32px));
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px 10px 16px;
    background: var(--brand);
    color: var(--brand-ink);
    border-radius: 10px;
    box-shadow: 0 8px 24px var(--shadow);
  }
  .fittoast span {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
    font-size: var(--fs-small);
  }
  .fittoast .btn {
    background: transparent;
    color: var(--brand-ink);
    border-color: var(--brand-ink-2);
    min-height: 44px;
  }
  @media (max-width: 719px) {
    .fittoast {
      bottom: calc(84px + env(safe-area-inset-bottom));
    }
  }
</style>
