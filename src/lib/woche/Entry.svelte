<script>
  /**
   * «Woche planen» WP1: one entry of the week, in its kind's colour with its word (never colour alone).
   * Own to-dos and bike work have a box to tick; entries from elsewhere link to where they live.
   */
  import { Check, X, Move } from '@lucide/svelte';
  import { timedrag } from '../ui/timedrag.js';
  import { titleOf, subOf } from './words.js';
  import { KIND_NAMES } from '../woche.js';
  import { t } from '../i18n.svelte.js';

  // «Termine ziehen» (Noah 24.11.2026): an own entry can be pulled onto another day (mouse: pull it; finger: press and hold, then pull),
  // or moved with «Move …». day: the day it stands on; ondrop(entry, day) moves it; onover(day | null) tells the page which day lights up;
  // onmove(entry) opens the «Move …» window.
  let { e, day = '', ondone = null, onremove = null, ondrop = null, onover = null, onmove = null } = $props();
  let lift = $state(null);
  const tick = $derived(e.own && (e.kind === 'todo' || e.kind === 'bike') && ondone);
  const sub = $derived(subOf(e));
</script>

<div
  class="en k-{e.kind}"
  class:sp={e.sub?.src === 'spielerplus'}
  class:rmv={e.own && onremove}
  class:done={e.done}
  class:td-lift={!!lift}
  style:transform={lift ? `translate(${lift.dx}px, ${lift.dy}px)` : undefined}
  data-entry={e.id}
  data-kind={e.kind}
  use:timedrag={{ day, enabled: !!ondrop && !!(e.own || e.sid) && !e.done, whole: true, onpreview: (d) => ((lift = d), onover?.(d?.over ?? null)), oncommit: (g) => g.over && ondrop?.(e, g.over) }}
>
  {#if tick}
    <button type="button" class="tk" aria-pressed={e.done} aria-label={e.done ? t('Not done yet: {title}', { title: titleOf(e) }) : t('Done: {title}', { title: titleOf(e) })} onclick={() => ondone(e)}>{#if e.done}<Check size={14} strokeWidth={2.5} aria-hidden="true" />{/if}</button>
  {/if}
  {#if e.href && !e.own}
    <a class="tx" href={e.href} target={e.ext ? '_blank' : undefined} rel={e.ext ? 'noopener noreferrer' : undefined}><b>{#if e.time}<span class="num">{e.time}</span>{' '}{/if}{titleOf(e)}</b><small>{sub}<span class="sr"> ({t(KIND_NAMES[e.kind])})</span></small></a>
  {:else}
    <span class="tx"><b>{#if e.time}<span class="num">{e.time}</span>{' '}{/if}{titleOf(e)}</b><small>{sub}<span class="sr"> ({t(KIND_NAMES[e.kind])})</span></small></span>
  {/if}
  {#if (e.own || e.sid) && !e.done && onmove}
    <button type="button" class="mv" data-entry-move={e.id} aria-label={t('Move «{name}»', { name: titleOf(e) })} onclick={() => onmove(e)}><Move size={14} aria-hidden="true" /></button>
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
  .sp {
    --k: var(--wk-sp);
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
  .mv {
    position: absolute;
    top: 2px;
    right: 28px;
  }
  .en.rmv:has(.mv) .tx {
    padding-right: 44px;
  }
  .en:not(.rmv) .mv {
    right: 2px;
  }
  .en:not(.rmv):has(.mv) .tx {
    padding-right: 28px;
  }
  .en.td-lift {
    z-index: 6;
    background: var(--paper);
    box-shadow: var(--shadow-3);
  }
  .en {
    -webkit-touch-callout: none;
  }
  .tk,
  .rm,
  .mv {
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
  .mv:hover,
  .tk:hover {
    background: color-mix(in srgb, var(--k) 20%, var(--paper));
  }
  @media (max-width: 719px) {
    .rmv .tx {
      padding-right: 0;
    }
    .rm,
    .mv {
      position: static;
    }
    .en.rmv:has(.mv) .tx,
    .en:not(.rmv):has(.mv) .tx {
      padding-right: 0;
    }
    .tk,
    .rm,
    .mv {
      width: 44px;
      height: 44px;
      margin: -10px -4px;
    }
    a.tx {
      min-height: 44px;
    }
  }
</style>
