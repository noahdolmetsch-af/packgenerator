<script>
  /**
   * v0.51.0 «Im Flow»: «Heute abhaken», one button per activity. One tap ticks it (the amount of the
   * goal, the place still open) with «Rückgängig»; tapping again takes today's tick back. A long press
   * (right click on a computer) opens the sheet for place, amount, duration or the countdown.
   */
  import { Check } from '@lucide/svelte';
  import ActIcon from './ActIcon.svelte';
  import { press } from './press.js';
  import { ui, tapAct, actName } from './ui.svelte.js';
  import { tileSub } from './words.js';
  import { t } from '../i18n.svelte.js';
  let { states = [], today, cols = 2 } = $props();
</script>

<ul class="tg" style:--cols={cols} style:--min={cols > 2 ? '150px' : '0px'}>
  {#each states as s (s.act.id)}
    <li>
      <button
        type="button"
        class="tile {s.act.ring}"
        class:done={s.todayDone}
        data-act={s.act.id}
        aria-pressed={s.todayDone}
        aria-description={t('Long press: place, amount, duration or the countdown')}
        use:press={{ tap: () => tapAct(s, today), long: () => (ui.tick = s.act.id) }}
      >
        <span class="ic" aria-hidden="true">{#if s.todayDone}<Check size={20} strokeWidth={2.6} />{:else}<ActIcon icon={s.act.icon} ring={s.act.ring} box={false} size={18} />{/if}</span>
        <span class="tx"><b>{actName(s.act)}</b><small>{tileSub(s)}</small></span>
      </button>
    </li>
  {/each}
</ul>

<style>
  .tg {
    display: grid;
    /* at most --cols columns; v0.74.0 «Fünf Orte»: next to the sidebar a row of 5 is too narrow, so
       a tile is at least 150 px wide on a computer (fewer per row), names stay whole */
    grid-template-columns: repeat(auto-fill, minmax(max(var(--min, 0px), calc((100% - (var(--cols) - 1) * 8px) / var(--cols))), 1fr));
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tile {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 54px;
    padding: 7px 10px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    touch-action: manipulation;
  }
  .tile:hover {
    background: var(--paper-2);
  }
  .ic {
    flex: none;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1.5px solid currentColor;
  }
  .move .ic {
    color: var(--hi);
  }
  .mind .ic {
    color: var(--accent);
  }
  .rest .ic {
    color: var(--l3);
  }
  .tx {
    min-width: 0;
    line-height: 1.25;
  }
  .tx b {
    display: block;
    font-weight: 500;
    overflow-wrap: break-word;
    hyphens: auto; /* v0.69.1 G: «draussen» on a done tile at 320 px: a syllable break, not mid-letter */
  }
  .tx small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tile.done {
    border-color: transparent;
    background: var(--accent-soft);
  }
  .tile.done .ic {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--paper);
  }
  .tile.done small {
    color: var(--accent);
  }
  /* a small phone: the words need the room, the symbol goes (a done button keeps its tick) */
  @media (max-width: 359px) {
    .tile {
      gap: 7px;
      padding-inline: 10px;
    }
    .tile:not(.done) .ic {
      display: none;
    }
  }
</style>
