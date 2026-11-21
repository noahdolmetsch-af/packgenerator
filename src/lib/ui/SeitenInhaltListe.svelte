<script>
  /**
   * The list of «What you can do here»: each function of a page with what it is for, «Good to know» and «How it works»
   * (steps and example) to open; the first few rows, then «Show all n». Since 09.11.2026 (Noah «ja, 1-3», Durchklick-Fund 1) it
   * lives in the «?» window of the page (nav/HelpButton), the one help place, and no longer as a card on the page.
   * rows: from pageContent() / helpRows() in src/lib/seiteninhalt.js. key: the page key (resets the opened parts on a new page).
   */
  import { ChevronDown, ChevronRight, Lightbulb } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { SHOWN } from '../seiteninhalt.js';

  let { rows = [], key = '' } = $props();
  let all = $state(false);
  let open = $state({});
  const shown = $derived(all ? rows : rows.slice(0, SHOWN));
  let seen = '';
  $effect.pre(() => {
    if (key === seen) return;
    seen = key;
    all = false;
    open = {};
  });
</script>

<section class="si" data-seiteninhalt={key}>
  <p class="jl">{t('What you can do here')}</p>
  <ul>
    {#each shown as r (r.id)}
      <li data-seiteninhalt-item={r.id}>
        <b>{t(r.title)}</b>
        <span class="si-what">{t(r.text)}</span>
        {#if r.know}<span class="si-know" data-seiteninhalt-know={r.id}><Lightbulb size={14} aria-hidden="true" /><span><b>{t('Good to know')}</b> {t(r.know)}</span></span>{/if}
        {#if r.steps.length || r.example}
          <button type="button" class="si-how" aria-expanded={!!open[r.id]} onclick={() => (open = { ...open, [r.id]: !open[r.id] })}>
            {#if open[r.id]}<ChevronDown size={16} aria-hidden="true" />{:else}<ChevronRight size={16} aria-hidden="true" />{/if}{t('How it works')}
          </button>
          {#if open[r.id]}
            <div class="si-body" data-seiteninhalt-how={r.id}>
              {#if r.steps.length}<ol>{#each r.steps as s (s)}<li>{t(s)}</li>{/each}</ol>{/if}
              {#if r.example}<p class="si-ex">{t(r.example)}</p>{/if}
            </div>
          {/if}
        {/if}
      </li>
    {/each}
  </ul>
  {#if rows.length > SHOWN}<button type="button" class="si-all" onclick={() => (all = !all)}>{all ? t('Show fewer') : t('Show all {n}', { n: rows.length })}</button>{/if}
</section>

<style>
  .jl {
    margin: 4px 0 8px;
    font-size: var(--fs-small);
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  ul {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li b {
    display: block;
  }
  .si-what {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .si-know {
    display: flex;
    gap: 6px;
    align-items: flex-start;
    margin-top: 4px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .si-know :global(svg) {
    flex: none;
    margin-top: 3px;
    color: var(--hi);
  }
  .si-know b {
    display: inline;
    font-weight: 600;
  }
  .si-how,
  .si-all {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--hi);
    font: 600 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .si-body {
    padding: 4px 0 2px;
    font-size: var(--fs-small);
  }
  .si-body ol {
    margin: 0 0 6px;
    padding-left: 20px;
  }
  .si-ex {
    margin: 0;
    color: var(--ink-3);
  }
  button:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
</style>
