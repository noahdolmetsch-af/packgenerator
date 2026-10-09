<script>
  /**
   * v0.46.0 «Startseite neu» (Noah 12a, 13a, 15a): "What do you want to do?": 12 buttons on a
   * computer (6 × 2), 8 on a phone (4 × 2), icon and word; the last one "All 16 functions" opens a
   * sheet with all of them. A small number only where something waits (23 to weigh, 4 due, 4 notes).
   * The order (functions.js): the first four fixed, the rest by Noah's own taps.
   */
  import { Zap, Backpack, Shirt, Scale, Wrench, Route, FileText, Layers, Heart, ChartColumn, StickyNote, Gauge, Blocks, Star, BookOpen, LayoutGrid, Check } from '@lucide/svelte';
  import { FUNCTIONS, SHOWN, orderFunctions } from './functions.js';
  import { phone } from '../media.svelte.js';
  import { t, num } from '../i18n.svelte.js';

  let { usage = {}, badges = {}, used = new Set(), onrun } = $props();

  const ICON = { zap: Zap, bag: Backpack, shirt: Shirt, scale: Scale, wrench: Wrench, route: Route, file: FileText, wardrobe: Shirt, layers: Layers, heart: Heart, chart: ChartColumn, note: StickyNote, counter: Gauge, blocks: Blocks, star: Star, book: BookOpen };
  const all = $derived(orderFunctions(usage));
  const shown = $derived(all.slice(0, (phone.matches ? SHOWN.phone : SHOWN.desktop) - 1));

  let sheet = $state();
  let open = $state(false);
  $effect(() => {
    if (open && sheet && !sheet.open) sheet.showModal();
    if (!open && sheet?.open) sheet.close();
  });
  function run(f) {
    open = false;
    onrun?.(f);
  }
</script>

{#snippet btn(f, big)}
  {@const Icon = ICON[f.icon]}
  {@const n = badges[f.id] ?? 0}
  <button type="button" class="act" class:big data-fn={f.id} onclick={() => run(f)} aria-label={n ? `${t(f.label)}, ${t('{n} to do', { n })}` : undefined}>
    <span class="top"><Icon size={big ? 26 : 22} strokeWidth={2} aria-hidden="true" />{#if n}<span class="badge num" aria-hidden="true">{num(n)}</span>{/if}</span>
    <span class="lb">{t(f.label)}</span>
  </button>
{/snippet}

<section class="actions" aria-labelledby="act-h">
  <div class="head">
    <h2 id="act-h" class="kick">{t('What do you want to do?')}</h2>
    {#if !phone.matches}<button type="button" class="linkish" onclick={() => (open = true)}>{t('All {n} functions', { n: FUNCTIONS.length })}</button>{/if}
  </div>
  <div class="grid">
    {#each shown as f (f.id)}{@render btn(f, !phone.matches)}{/each}
    <button type="button" class="act all" class:big={!phone.matches} data-fn="all" onclick={() => (open = true)} aria-haspopup="dialog">
      <span class="top"><LayoutGrid size={phone.matches ? 22 : 26} strokeWidth={2} aria-hidden="true" /></span>
      <span class="lb">{phone.matches ? t('All {n}', { n: FUNCTIONS.length }) : t('All {n} functions', { n: FUNCTIONS.length })}</span>
    </button>
  </div>
</section>

<dialog class="sheet fnsheet" class:phone={phone.matches} bind:this={sheet} onclose={() => (open = false)} onclick={(e) => e.target === sheet && (open = false)} aria-labelledby="fn-h">
  <div class="sh">
    <h2 id="fn-h" class="title">{t('All {n} functions', { n: FUNCTIONS.length })}</h2>
    <button type="button" class="btn sm" onclick={() => (open = false)}>{t('Close')}</button>
  </div>
  <ul class="fnlist">
    {#each all as f (f.id)}
      {@const Icon = ICON[f.icon]}
      {@const n = badges[f.id] ?? 0}
      <li>
        <button type="button" class="fnrow" data-fn={f.id} onclick={() => run(f)}>
          <span class="ic"><Icon size={20} aria-hidden="true" /></span>
          <span class="m"><b>{t(f.label)}</b><small>{t(f.pitch)}</small></span>
          {#if n}<span class="badge num">{num(n)}</span>{:else if used.has(f.id)}<span class="usedmark" title={t('Used')}><Check size={18} aria-hidden="true" /><span class="sr">{t('Used')}</span></span>{/if}
        </button>
      </li>
    {/each}
  </ul>
</dialog>

<style>
  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }
  .kick {
    margin: 0;
    font: 600 13px/1.3 var(--font-body);
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--ink-2);
  }
  .linkish {
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 14px var(--font-body);
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }
  @media (min-width: 720px) {
    .grid {
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 12px;
    }
  }
  .act {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-width: 0;
    min-height: 72px;
    padding: 8px 4px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    font: 500 12.5px/1.2 var(--font-body);
    text-align: center;
    cursor: pointer;
  }
  .act.big {
    align-items: flex-start;
    justify-content: space-between;
    min-height: 88px;
    padding: 12px 14px;
    border-radius: 14px;
    font-size: 15.5px;
    text-align: left;
  }
  .act:hover {
    border-color: var(--line-strong);
    background: var(--paper-2);
  }
  .act :global(svg) {
    color: var(--accent);
    flex: none;
  }
  .top {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .big .top {
    width: 100%;
    justify-content: space-between;
  }
  .lb {
    min-width: 0;
    max-width: 100%;
    overflow-wrap: break-word;
    hyphens: auto;
  }
  .badge {
    display: inline-block;
    padding: 0 7px;
    border-radius: 10px;
    background: var(--badge);
    color: var(--badge-ink);
    font: 600 12px/18px var(--font-body);
  }
  .act:not(.big) .badge {
    position: absolute;
    top: -6px;
    left: calc(100% - 4px);
  }
  .fnsheet {
    width: min(720px, calc(100vw - 24px));
  }
  .fnsheet.phone {
    margin: auto 0 0;
    width: 100vw;
    max-width: 100vw;
    max-height: 88vh;
    border-radius: 16px 16px 0 0;
    padding: 14px var(--gut) calc(16px + env(safe-area-inset-bottom));
  }
  .sh {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 6px;
  }
  .sh h2 {
    font-size: var(--fs-sub);
  }
  .fnlist {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0 20px;
  }
  @media (min-width: 720px) {
    .fnlist {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .fnlist li {
    border-bottom: 1px solid var(--line);
  }
  .fnrow {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 56px;
    padding: 8px 2px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .fnrow:hover {
    background: var(--paper-2);
  }
  .fnrow .ic {
    display: grid;
    place-items: center;
    flex: none;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--accent-soft);
    color: var(--accent);
  }
  .fnrow .m {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .fnrow small {
    color: var(--ink-3);
    font-size: 13.5px;
    line-height: 1.35;
  }
  .usedmark {
    flex: none;
    color: var(--accent);
  }
</style>
