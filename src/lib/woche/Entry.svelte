<script>
  /**
   * «Woche planen» WP1: one entry of the week, in its kind's colour with its word (never colour alone).
   * Own to-dos and bike work have a box to tick; entries from elsewhere link to where they live.
   */
  import { Check, X } from '@lucide/svelte';
  import { titleOf, subOf } from './words.js';
  import { KIND_NAMES } from '../woche.js';
  import { t } from '../i18n.svelte.js';

  let { e, ondone = null, onremove = null } = $props();
  const tick = $derived(e.own && (e.kind === 'todo' || e.kind === 'bike') && ondone);
  const sub = $derived(subOf(e));
</script>

<div class="en k-{e.kind}" class:rmv={e.own && onremove} class:done={e.done} data-entry={e.id} data-kind={e.kind}>
  {#if tick}
    <button type="button" class="tk" aria-pressed={e.done} aria-label={e.done ? t('Not done yet: {title}', { title: titleOf(e) }) : t('Done: {title}', { title: titleOf(e) })} onclick={() => ondone(e)}>{#if e.done}<Check size={14} strokeWidth={3} aria-hidden="true" />{/if}</button>
  {/if}
  {#if e.href && !e.own}
    <a class="tx" href={e.href}><b>{#if e.time}<span class="num">{e.time}</span>{' '}{/if}{titleOf(e)}</b><small>{sub}<span class="sr"> ({t(KIND_NAMES[e.kind])})</span></small></a>
  {:else}
    <span class="tx"><b>{#if e.time}<span class="num">{e.time}</span>{' '}{/if}{titleOf(e)}</b><small>{sub}<span class="sr"> ({t(KIND_NAMES[e.kind])})</span></small></span>
  {/if}
  {#if e.own && onremove}
    <button type="button" class="rm" aria-label={t('Remove: {title}', { title: titleOf(e) })} onclick={() => onremove(e)}><X size={14} aria-hidden="true" /></button>
  {/if}
</div>

<style>
  .en {
    --k: var(--wk-sport);
    display: flex;
    align-items: flex-start;
    gap: 6px;
    min-width: 0;
    padding: 6px 6px 6px 8px;
    border-left: 3px solid var(--k);
    border-radius: 8px;
    background: color-mix(in srgb, var(--k) 13%, var(--paper));
    font-size: var(--fs-small);
    line-height: 1.25;
  }
  .k-date {
    --k: var(--wk-date);
  }
  .k-todo {
    --k: var(--wk-todo);
  }
  .k-away {
    --k: var(--wk-away);
  }
  .k-bike {
    --k: var(--wk-bike);
  }
  .tx {
    flex: 1;
    min-width: 0;
    color: var(--ink);
    text-decoration: none;
    overflow-wrap: break-word;
  }
  a.tx {
    min-height: 32px;
  }
  b {
    display: block;
    font-weight: 600;
  }
  small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .done b {
    text-decoration: line-through;
    color: var(--ink-2);
  }
  .en {
    position: relative;
  }
  .rmv .tx {
    padding-right: 18px;
  }
  .rm {
    position: absolute;
    top: 2px;
    right: 2px;
  }
  .tk,
  .rm {
    flex: none;
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    margin: -3px 0;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--ink-2);
    cursor: pointer;
  }
  .tk::before {
    content: '';
    grid-area: 1 / 1;
    width: 18px;
    height: 18px;
    border: 2px solid var(--k);
    border-radius: 5px;
    background: var(--paper);
  }
  .tk :global(svg) {
    grid-area: 1 / 1;
    position: relative;
    color: var(--ink);
  }
  .rm:hover,
  .tk:hover {
    background: color-mix(in srgb, var(--k) 20%, var(--paper));
  }
  @media (max-width: 719px) {
    .rmv .tx {
      padding-right: 0;
    }
    .rm {
      position: static;
    }
    .tk,
    .rm {
      width: 44px;
      height: 44px;
      margin: -10px -4px;
    }
    a.tx {
      min-height: 44px;
    }
  }
</style>
