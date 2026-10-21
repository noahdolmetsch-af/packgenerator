<script>
  /**
   * v0.51.0 «Im Flow»: «Heute abhaken», one button per activity. One tap ticks it (the amount of the
   * goal, the place still open) with «Rückgängig»; tapping again takes today's tick back. A long press
   * (right click on a computer) opens the sheet for place, amount, duration or the countdown.
   * v0.86.0 «Meditation einfach»: with `onmed`, a tap on the meditation activity calls onmed(state)
   * (Aktiv opens its start sheet, lib/flow/MedStartSheet.svelte); without it the tap ticks as before.
   * v0.105.0 Design-Refresh P8 «Aktiv» (A1): `big` draws the new tiles of the Aktiv page (the symbol in a
   * square on top, the name, one quiet line; a ticked tile framed with a tick); Today keeps the small row.
   * KT «Kacheln antippbar» (Noah 14.10.2026, 2a, mockup KT4): a small round «•••» at the top right of each
   * tile does what the long press does (the sheet for duration, place, stopwatch); a sibling of the tile
   * button, never inside it. `help` adds one quiet line under the grid (Today's «Im Flow» card).
   * «Aktiv neu» (Noah 20.10.2026 «1a»): `compact` draws small tiles, the symbol and the name in one line
   * (the state line goes into the button's label), for Aktiv › Heute.
   */
  import { Check, Hand, Ellipsis } from '@lucide/svelte';
  import ActIcon from './ActIcon.svelte';
  import { press } from './press.js';
  import { ui, tapAct, actName } from './ui.svelte.js';
  import { tileSub } from './words.js';
  import { isMedAct } from './hobby/medstart.js';
  import { t } from '../i18n.svelte.js';
  let { states = [], today, cols = 2, onmed = null, big = false, compact = false, help = false } = $props();
  const tap = (s) => (onmed && isMedAct(s.act) ? onmed(s) : tapAct(s, today));
</script>

<ul class="tg" class:big class:compact style:--cols={cols} style:--min={cols > 2 ? '150px' : '0px'}>
  {#each states as s (s.act.id)}
    <li>
      <button
        type="button"
        class="tile {s.act.ring}"
        class:done={s.todayDone}
        data-act={s.act.id}
        aria-pressed={s.todayDone}
        title={compact ? tileSub(s) : undefined}
        aria-description={t('Long press: place, amount, duration or the countdown')}
        use:press={{ tap: () => tap(s), long: () => (ui.tick = s.act.id) }}
      >
        <span class="ic" aria-hidden="true">{#if s.todayDone}<Check size={big ? 18 : 20} strokeWidth={2.6} />{:else}<ActIcon icon={s.act.icon} ring={s.act.ring} box={false} size={18} />{/if}</span>
        <span class="tx"><b>{actName(s.act)}</b>{#if compact}<small class="sr">{tileSub(s)}</small>{:else}<small>{tileSub(s)}</small>{/if}</span>
      </button>
      <!-- KT (2a): the long press as a button, for everyone who does not know it -->
      <button type="button" class="more" data-more={s.act.id} aria-label={t('More for {name}: duration, place or stopwatch', { name: actName(s.act) })} onclick={() => (ui.tick = s.act.id)}><Ellipsis size={16} strokeWidth={3} aria-hidden="true" /></button>
    </li>
  {/each}
</ul>
{#if help && states.length}
  <!-- KT (2a): one quiet line what a tap and a long press do -->
  <p class="tghelp" data-tick-help><Hand size={16} aria-hidden="true" /><span><b>{t('Tap|tick help')}</b> {t('ticks|tick help')} · <b>{t('long press|tick help')}</b> {t('or •••: duration, place, stopwatch')}</span></p>
{/if}

<style>
  .tg {
    display: grid;
    /* at most --cols columns; v0.76.0 «Fünf Orte»: next to the sidebar a row of 5 is too narrow, so
       a tile is at least 150 px wide on a computer (fewer per row), names stay whole */
    grid-template-columns: repeat(auto-fill, minmax(max(var(--min, 0px), calc((100% - (var(--cols) - 1) * 8px) / var(--cols))), 1fr));
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  /* v0.97.0 (Inter, a little wider than Fira Sans): a narrow tile measures itself, see the end */
  li {
    position: relative;
    container-type: inline-size;
  }
  /* KT (2a): the round «•••» at the top right; its tap area is 44 px (::after), the name keeps clear of it */
  .more {
    position: absolute;
    top: 5px;
    right: 5px;
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink-2);
    cursor: pointer;
    /* Gesamttest 21.10.2026 (C6): above the next tile, so its 44 px tap area is not covered */
    z-index: 1;
  }
  .more::after {
    content: '';
    position: absolute;
    inset: -9px;
  }
  .more:hover {
    background: var(--paper-2);
    color: var(--ink);
  }
  .tghelp {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 8px 0 0;
    padding: 8px 12px;
    border-radius: 12px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.35;
  }
  .tghelp :global(svg) {
    flex: none;
    margin-top: 1px;
  }
  .tghelp b {
    color: var(--ink);
    font-weight: 600;
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
    padding-right: 38px; /* KT: room for «•••» */
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
    color: var(--l4);
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
  /* a narrow tile (two per row on a phone, the 150 px ones next to the sidebar): the name one step
     smaller, so «Spaziergang» and «Liegestütze» stay whole */
  @container (max-width: 179px) {
    .tx b {
      font-size: var(--fs-label);
    }
    /* KT: a smaller «•••» and symbol, so the name keeps its room and is never broken */
    .tg:not(.big) .tile {
      gap: 8px;
      padding-right: 26px;
    }
    .tg:not(.big) .ic {
      width: 28px;
      height: 28px;
    }
    .tg:not(.big) .more {
      top: 4px;
      right: 4px;
      width: 22px;
      height: 22px;
    }
    .tg:not(.big) .more::after {
      inset: -11px;
    }
  }
  /* v0.105.0 Design-Refresh P8 «Aktiv» (A1): the big tiles */
  .big {
    grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
    gap: var(--sp-3);
  }
  .big .tile {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    height: 100%;
    min-height: 116px;
    padding: 14px;
    border: 2px solid transparent;
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    outline: 1px solid var(--card-line);
  }
  .big .tile:hover {
    background: var(--paper-2);
  }
  .big .ic {
    width: 34px;
    height: 34px;
    margin-bottom: 4px;
    border: 0;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .big .tx b {
    font-weight: 600;
  }
  .big .tx small {
    color: var(--ink-3);
  }
  .big .tile.done {
    border-color: var(--hi);
    outline-color: transparent;
    background: var(--hi-soft);
  }
  .big .tile.done .ic {
    background: var(--hi);
    color: var(--hi-ink);
  }
  .big .tile.done small {
    color: var(--ink-2);
  }
  /* «Aktiv neu» «1a»: the small tiles, one line; the state line stays for screen readers */
  .compact .tile {
    min-height: 46px;
    padding-block: 6px;
    gap: 8px;
  }
  .compact .ic {
    width: 26px;
    height: 26px;
  }
  .compact .ic :global(svg) {
    width: 16px;
    height: 16px;
  }
  .compact .more {
    top: 50%;
    transform: translateY(-50%);
  }
  /* a small phone: the words need the room, the symbol goes (a done button keeps its tick) */
  @media (max-width: 359px) {
    .tile {
      gap: 7px;
      padding-inline: 10px 36px;
    }
    .tg:not(.big) .tile:not(.done) .ic {
      display: none;
    }
    .big .tile {
      padding: 12px 10px;
    }
  }
</style>
