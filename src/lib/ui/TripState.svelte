<script>
  /**
   * v0.125.0 TZ-1 «Zustand sichtbar» (Noah 13.10.2026 «1-5 a», mockups TZ1–TZ2): the pill of a trip's
   * state, the same everywhere: icon + word (+ a small extra), never colour alone.
   *   plan  Geplant       pencil, blue
   *   done  Abgeschlossen flag, grey
   *   rated Bewertet      filled star, green
   * state: 'plan' | 'done' | 'rated' (tripstate.js); nothing shows for null. size: 'sm' (tiles, rows)
   * or 'md' (the trip header). extra: the small addition after «·» («Morgen», «GPX», «Rückblick fehlt»).
   * The words come from tripstate.js STATE_NAMES (German in i18n/de/tz1.js).
   */
  import { Pencil, Flag, Star } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { STATE_NAMES } from '../tripstate.js';

  let { state, size = 'sm', extra = '' } = $props();
  const ICON = { plan: Pencil, done: Flag, rated: Star };
  const Icon = $derived(ICON[state]);
</script>

{#if state && Icon}
  <span class="tst {state} {size}" data-state={state} title={extra ? `${t(STATE_NAMES[state])} · ${extra}` : null}>
    <Icon size={size === 'md' ? 15 : 13} fill={state === 'rated' ? 'currentColor' : 'none'} aria-hidden="true" />
    <span class="w">{t(STATE_NAMES[state])}</span>{#if extra}<span class="x">{` · ${extra}`}</span>{/if}
  </span>
{/if}

<style>
  .tst {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: var(--sp-1);
    max-width: 100%;
    min-width: 0;
    padding: 1px var(--sp-2);
    border: 1px solid color-mix(in srgb, var(--st-line) 45%, transparent);
    border-radius: 999px;
    background: var(--st-soft);
    color: var(--st-ink);
    font: 600 var(--fs-tiny) / 1.5 var(--font-body);
    white-space: nowrap;
  }
  .tst.md {
    padding: 2px 10px;
    font-size: var(--fs-small);
  }
  .plan {
    --st-ink: var(--st-plan);
    --st-soft: var(--st-plan-soft);
    --st-line: var(--st-plan-line);
  }
  .done {
    --st-ink: var(--st-done);
    --st-soft: var(--st-done-soft);
    --st-line: var(--st-done-line);
  }
  .rated {
    --st-ink: var(--st-rated);
    --st-soft: var(--st-rated-soft);
    --st-line: var(--st-rated-line);
  }
  .w {
    flex: none;
  }
  /* only the extra gives way on a narrow tile («Datum vo…»); the word of the state stays whole */
  .x {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .x {
    font-weight: 500;
  }
</style>
