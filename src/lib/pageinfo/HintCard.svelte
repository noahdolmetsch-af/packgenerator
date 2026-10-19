<script>
  /**
   * Hinweistexte HT1–HT2 (Noah 14.10.2026, mockups approved 20:31 «HT1–HT2 freigegeben», answers «1a 2b 3a»):
   * the short card at the top of a page: what the page is for, «Typisch hier» (three situations; folded on
   * a phone, 2b), «Weiter unten» (chips that jump to a part of the page; a chip shows only when its part is
   * there) and «Das kann die App hier» (opens the fold at the page end). × folds the card to the quiet line
   * «Was hier steht ›», which opens it again (1a). Data in hints.js; the state in the setting of pageinfo.
   * page: a key of HINTS (and of PAGES for the fold).
   */
  import { Info, X, ChevronDown, ChevronRight, Lightbulb, Bike, Wrench, Store, ShoppingBag, Scale, Heart, Plus, BookOpen, Cloud, Check, Clock, NotebookPen, Moon, ChartLine, Columns2, Sun, Shirt, Layers, Camera, ShieldCheck, Save, Settings, CircleQuestionMark, Target, Play, Bell } from '@lucide/svelte';
  import { pageInfo } from './store.svelte.js';
  import { hintOf } from '../hints.js';
  import { canRows, canShown, setHint, hintShown } from '../pageinfo.js';
  import { phone } from '../media.svelte.js';
  import { t, tn } from '../i18n.svelte.js';

  let { page } = $props();
  const ICONS = { bike: Bike, wrench: Wrench, shop: Store, bag: ShoppingBag, scale: Scale, heart: Heart, plus: Plus, book: BookOpen, cloud: Cloud, check: Check, clock: Clock, note: NotebookPen, moon: Moon, chart: ChartLine, columns: Columns2, sun: Sun, shirt: Shirt, layers: Layers, camera: Camera, shield: ShieldCheck, save: Save, settings: Settings, help: CircleQuestionMark, target: Target, play: Play, bell: Bell };
  const pi = pageInfo();
  const hint = $derived(hintOf(page));
  const open = $derived(pi.loaded && hintShown(pi.info, page));
  const canN = $derived(pi.loaded && canShown(pi.info, page) ? canRows(page).length : 0);

  // «Weiter unten»: only the parts that are on the page now (they come with the data, so look a few times)
  let here = $state([]);
  $effect(() => {
    const ids = (hint?.jumps ?? []).map((j) => j[1]);
    const look = () => (here = ids.filter((id) => document.getElementById(id)));
    const timers = [0, 300, 1000, 2500].map((ms) => setTimeout(look, ms));
    return () => timers.forEach(clearTimeout);
  });
  const jumps = $derived((hint?.jumps ?? []).filter((j) => here.includes(j[1])));

  function jump(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === 'DETAILS') el.open = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function toCan() {
    const el = document.querySelector('[data-section="can"]');
    if (!el) return;
    el.open = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

{#if hint && pi.loaded}
  {#if open}
    <section class="hint" data-hint={page} aria-label={t('What is here')}>
      <div class="h">
        <Info size={20} aria-hidden="true" />
        <p><b>{t(hint.lead[0])}</b> {t(hint.lead[1])}</p>
        <button type="button" class="ib" aria-label={t('Fold the explanation')} onclick={() => pi.save((v) => setHint(v, page, false))}><X size={18} aria-hidden="true" /></button>
      </div>
      {#snippet uses()}
        <ul class="uc">
          {#each hint.uses as [icon, title, text] (title)}
            {@const Icon = ICONS[icon] ?? Info}
            <li><Icon size={18} aria-hidden="true" /><span><b>{t(title)}</b>{t(text)}</span></li>
          {/each}
        </ul>
      {/snippet}
      {#if phone.matches}
        <details class="fold" data-uses>
          <summary><ChevronDown class="chev" size={16} aria-hidden="true" />{t('Typical here')} · {tn(hint.uses.length, '{n} situation', '{n} situations')}</summary>
          {@render uses()}
        </details>
      {:else}
        <p class="jl">{t('Typical here')}</p>
        {@render uses()}
      {/if}
      {#if jumps.length}
        <p class="jl">{t('Further down')}</p>
        <div class="jump">
          {#each jumps as [label, id] (id)}<button type="button" data-jump={id} onclick={() => jump(id)}>{t(label)}</button>{/each}
        </div>
      {/if}
      {#if canN}
        <div class="ft">
          <span>{t('A tap on a word jumps there')}</span>
          <button type="button" data-hint-can onclick={toCan}><Lightbulb size={14} aria-hidden="true" />{t('What the app can do here')} · {canN}<ChevronDown size={14} aria-hidden="true" /></button>
        </div>
      {/if}
    </section>
  {:else}
    <button type="button" class="mini" data-hint-line={page} onclick={() => pi.save((v) => setHint(v, page, true))}>
      <Info size={18} aria-hidden="true" /><span><b>{t('What is here')}</b> · {t(hint.lead[0])}</span><ChevronRight size={16} aria-hidden="true" />
    </button>
  {/if}
{/if}

<style>
  .hint {
    display: grid;
    gap: 10px;
    margin-bottom: 12px;
    padding: 14px 8px 14px 16px;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: var(--paper-2);
  }
  .h {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  .h > :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--hi);
  }
  .h p {
    flex: 1;
    min-width: 0;
    margin: 0;
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -10px 0;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .jl {
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .uc {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 8px;
    margin: 0;
    padding: 0 8px 0 0;
    list-style: none;
  }
  .uc li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 9px 11px;
    border-radius: 12px;
    background: var(--paper);
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .uc li :global(svg) {
    flex: none;
    margin-top: 1px;
    color: var(--ink-3);
  }
  .uc b {
    display: block;
    color: var(--ink);
  }
  .fold summary {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 11px;
    margin-right: 8px;
    border-radius: 10px;
    background: var(--paper);
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
    cursor: pointer;
    list-style: none;
  }
  .fold summary::-webkit-details-marker {
    display: none;
  }
  .fold[open] summary :global(.chev) {
    transform: rotate(180deg);
  }
  .fold .uc {
    margin-top: 8px;
  }
  .jump {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding-right: 8px;
  }
  .jump button {
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    font-weight: 500;
    cursor: pointer;
  }
  .ft {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 12px;
    margin-right: 8px;
    padding-top: 6px;
    border-top: 1px solid var(--line);
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .ft button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    border: 0;
    padding: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .mini {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 44px;
    margin-bottom: 12px;
    padding: 8px 14px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper-2);
    color: var(--ink-2);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .mini > :global(svg:first-child) {
    color: var(--hi);
  }
  .mini span {
    flex: 1;
  }
</style>
