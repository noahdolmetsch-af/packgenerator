<script>
  /**
   * SL1–SL3 jump bar (answer 2a): on a phone a row of chips to swipe (`chips`), on a computer a list
   * beside the page that stays in view (`toc`). A tap opens that group and scrolls to it; the group you
   * are in is marked.
   *
   *   <ListNav groups={[{ id, label, n }]} active={id} onjump={(id) => …} mode="chips" />
   */
  import { ArrowDown } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { groups = [], active = null, onjump, mode = 'chips', title = '' } = $props();
  const head = $derived(title || t('Jump to'));
  const on = (id, i) => (active ? active === id : i === 0);
</script>

{#if groups.length > 1}
  {#if mode === 'toc'}
    <nav class="card ls-toc" aria-label={head}>
      <b class="ls-tt"><ArrowDown size={15} aria-hidden="true" />{head}</b>
      <ol>
        {#each groups as g, i (g.id)}
          <li><button type="button" class:on={on(g.id, i)} aria-current={on(g.id, i) ? 'true' : undefined} data-jump={g.id} onclick={() => onjump(g.id)}><span>{g.label}</span><em class="num">{g.n}</em></button></li>
        {/each}
      </ol>
    </nav>
  {:else}
    <nav class="ls-jump" aria-label={head}>
      <span class="ls-jl"><ArrowDown size={14} aria-hidden="true" />{head}</span>
      <div class="ls-chips">
        {#each groups as g, i (g.id)}
          <button type="button" class="vd-chip ls-c" aria-pressed={on(g.id, i)} data-jump={g.id} onclick={() => onjump(g.id)}>{g.label}<em class="num">{g.n}</em></button>
        {/each}
      </div>
    </nav>
  {/if}
{/if}

<style>
  .ls-jump {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .ls-jl,
  .ls-tt {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-3);
    font: 600 var(--fs-small) var(--font-body);
  }
  .ls-chips {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
    overscroll-behavior-x: contain;
    margin: 0 calc(-1 * var(--gut, 16px));
    padding: 0 var(--gut, 16px) 2px;
  }
  .ls-chips::-webkit-scrollbar {
    display: none;
  }
  .ls-c {
    flex: none;
    white-space: nowrap;
  }
  .ls-c em,
  .ls-toc em {
    margin-left: 6px;
    color: var(--ink-3);
    font-style: normal;
    font-size: var(--fs-tiny);
  }
  .ls-toc {
    padding: 14px 8px 10px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    box-shadow: var(--card-shadow);
    background: var(--paper);
  }
  .ls-tt {
    padding: 0 10px 6px;
  }
  .ls-toc ol {
    list-style: none;
    margin: 0 0 0 12px;
    padding: 0;
    border-left: 2px solid var(--line);
  }
  .ls-toc button {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    width: calc(100% + 2px);
    min-height: 36px;
    margin-left: -2px;
    padding: 6px 12px;
    border: 0;
    border-left: 2px solid transparent;
    background: none;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    text-align: left;
    cursor: pointer;
  }
  .ls-toc button:hover {
    color: var(--ink);
  }
  .ls-toc button.on {
    border-left-color: var(--hi);
    border-radius: 0 8px 8px 0;
    background: var(--hi-soft);
    color: var(--ink);
    font-weight: 600;
  }
  .ls-toc button:focus-visible {
    outline: var(--focus-ring);
  }
</style>
