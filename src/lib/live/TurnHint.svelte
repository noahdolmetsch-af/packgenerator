<script>
  /**
   * Abbiege-Hinweis (Noah «ein Pfeil vor jeder Abzweigung der Route, zum Beispiel ‹In 200 m links›»): a big
   * arrow and the text for the next turn, for laying over the full-screen live map. Large and high in
   * contrast so it reads on the handlebar in sunlight; at the turn itself («Jetzt …») it switches to the
   * action colour. No position logic: the page places it.
   *
   * Props: turn (from nextTurn in turns.js, or null: then nothing shows), distM (metres to the turn).
   */
  import { ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight, CornerUpLeft, CornerUpRight, Undo2, Spline } from '@lucide/svelte';
  import { turnText, NOW_M } from './turns.js';
  import { t, num } from '../i18n.svelte.js';

  let { turn = null, distM = null } = $props();

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
</script>

{#if Icon && text}
  <div class="th" class:now role="group" aria-label={t('Next turn|live')} data-turn-hint data-dir={turn.dir}>
    <span class="th-arrow" aria-hidden="true"><Icon size={72} strokeWidth={2.75} /></span>
    <p class="th-text">{text}</p>
  </div>
{/if}

<style>
  .th {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-width: 0;
    max-width: 100%;
    padding: var(--sp-3) var(--sp-4);
    border: 3px solid var(--ink);
    border-radius: var(--radius-card);
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 2px 12px var(--shadow);
  }
  .th.now {
    border-color: var(--hi);
    background: var(--hi);
    color: var(--hi-ink);
  }
  .th-arrow {
    flex: none;
    display: grid;
    place-items: center;
  }
  .th-text {
    min-width: 0;
    margin: 0;
    font: 800 var(--fs-page) / 1.1 var(--font-body);
    overflow-wrap: break-word;
  }
</style>
