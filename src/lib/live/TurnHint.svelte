<script>
  /**
   * Abbiege-Hinweis (Noah «ein Pfeil vor jeder Abzweigung der Route, zum Beispiel ‹In 200 m links›»): a big
   * arrow and the text for the next turn, for laying over the full-screen live map. Large and high in
   * contrast so it reads on the handlebar in sunlight; at the turn itself («Jetzt …») it switches to the
   * action colour. No position logic: the page places it.
   *
   * Props: turn (from nextTurn in turns.js, or null: then nothing shows), distM (metres to the turn),
   * then/thenM (the turn after it and its metres after this one: a small «then …» line, only within 1 km).
   * Navigation zum Ziel 2 (Noah 27.10.2026 «1a»): a big dark card, the arrow in its own box.
   */
  import { ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight, CornerUpLeft, CornerUpRight, Undo2, Spline } from '@lucide/svelte';
  import { turnText, NOW_M } from './turns.js';
  import { t, num } from '../i18n.svelte.js';

  let { turn = null, distM = null, then = null, thenM = null } = $props();

  const ICON = {
    'slight-left': ArrowUpLeft,
    'slight-right': ArrowUpRight,
    left: CornerUpLeft,
    right: CornerUpRight,
    'sharp-left': ArrowDownLeft,
    'sharp-right': ArrowDownRight,
    'u-turn': Undo2,
    bends: Spline,
  };
  const Icon = $derived(turn ? ICON[turn.dir] : null);
  const m = $derived(Number.isFinite(distM) ? distM : turn?.distM);
  const said = $derived(turn && Number.isFinite(m) ? turnText(turn, m) : null);
  const text = $derived(said ? t(said.key, Object.fromEntries(Object.entries(said.vars).map(([k, v]) => [k, num(v)]))) : '');
  const now = $derived(Number.isFinite(m) && m <= NOW_M);
  const ThenIcon = $derived(then ? ICON[then.dir] : null);
  // «then» only when the next turn comes soon after this one (a turn 100 km later is no help here)
  const THEN_M = 1000;
  const thenSaid = $derived(then && Number.isFinite(thenM) && thenM <= THEN_M ? turnText(then, Math.max(thenM, NOW_M + 1)) : null);
  const thenText = $derived(thenSaid ? t(thenSaid.key, Object.fromEntries(Object.entries(thenSaid.vars).map(([k, v]) => [k, num(v)]))) : '');
</script>

{#if Icon && text}
  <div class="th" class:now role="group" aria-label={t('Next turn|live')} data-turn-hint data-dir={turn.dir}>
    <span class="th-arrow" aria-hidden="true"><Icon size={56} strokeWidth={2.75} /></span>
    <p class="th-text">{text}</p>
    {#if ThenIcon && thenText}<p class="th-then" data-turn-then><ThenIcon size={18} aria-hidden="true" />{t('Then: {text}', { text: thenText })}</p>{/if}
  </div>
{/if}

<style>
  .th {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
    min-width: 0;
    max-width: 100%;
    padding: var(--sp-3);
    border: 0;
    border-radius: var(--radius-card);
    background: var(--ink);
    color: var(--paper);
    box-shadow: 0 6px 18px var(--shadow);
  }
  .th.now {
    border-color: var(--hi);
    background: var(--hi);
    color: var(--hi-ink);
  }
  .th-arrow {
    display: grid;
    place-items: center;
    width: 76px;
    height: 76px;
    border-radius: var(--radius-card);
    background: color-mix(in srgb, var(--paper) 14%, transparent);
  }
  .th-then {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    margin: 0;
    padding-top: var(--sp-2);
    border-top: 1px solid color-mix(in srgb, var(--paper) 25%, transparent);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
  }
  .th-text {
    min-width: 0;
    margin: 0;
    font: 800 var(--fs-page) / 1.1 var(--font-body);
    overflow-wrap: break-word;
  }
</style>
