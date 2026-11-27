<script>
  /**
   * One quiet line under «Heute abhaken» (Noah 27.11.2026 «4a»): the most useful hint of «Was auffällt» (a week without recovery, a gap or a
   * series), a tap opens all of them on Auswerten › Woche. Nothing is shown without a hint. «Performance tips» (Me › Look › Suggestions)
   * switch it off. The rules are flow/hakenhinweise.js.
   */
  import { Leaf, Clock, Flame, ChevronRight } from '@lucide/svelte';
  import { flowQuery } from '../flow/data.svelte.js';
  import { hintsOf, lineHint } from '../flow/hakenhinweise.js';
  import { hintText } from '../flow/hakenhinweise-text.js';
  import { actName } from '../flow/ui.svelte.js';
  import { normAct } from '../flow.js';
  import { suggest, watchSuggest } from '../clear/suggest.svelte.js';

  let { today } = $props();
  watchSuggest();
  const q = $derived(flowQuery(today));
  const data = $derived($q);
  const hint = $derived(data ? lineHint(hintsOf({ acts: data.acts, log: data.log, tripDayList: data.tripDays, today })) : null);
  const x = $derived(hint ? hintText(hint, (id) => actName(normAct(data.acts.find((a) => a.id === id) ?? { id }))) : null);
  const ICONS = { balance: Leaf, gap: Clock, streak: Flame };
  const Icon = $derived(hint ? ICONS[hint.kind] : null);
</script>

{#if hint && x && suggest.on.performance}
  <a class="hh" href="#/auswerten/woche" data-haken-hinweis={hint.kind}>
    <Icon size={16} aria-hidden="true" />
    <span class="t">{x.text}</span>
    <ChevronRight size={16} aria-hidden="true" />
  </a>
{/if}

<style>
  .hh {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 44px;
    padding: 0 var(--sp-1);
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.35;
    text-decoration: none;
  }
  .hh :global(svg) {
    flex: none;
    color: var(--accent);
  }
  .hh :global(svg:last-child) {
    margin-left: auto;
    color: var(--ink-3);
  }
  .t {
    min-width: 0;
  }
</style>
