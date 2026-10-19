<script>
  /**
   * Hobby pages (H14a, H15a, H29a): one favourite tile. The playful name (renamable), the activity's own
   * name, a small ring with the stand, and ONE line that fits instead of a date (milestone, history,
   * week, nudge, streak or best). The tile opens the activity's own page, or its editor until that page
   * exists. state: flow.js actState; line: flowtiles.js tileLine.
   * v0.105.0 Design-Refresh P8 «Aktiv» (A7): the light tile of the mockup; the ring became the small
   * stand at the right, renaming moved to «Kacheln ändern».
   */
  import ActIcon from '../ActIcon.svelte';
  import { TILE_LINE_NAMES } from '../../flowtiles.js';
  import { tileName, monthWord } from './words.js';
  import { actName, goalName } from '../ui.svelte.js';
  import { dayShort, oneGoal } from '../words.js';
  import { t, tn } from '../../i18n.svelte.js';

  let { state, line, href } = $props();
  const a = $derived(state.act);
  const text = $derived.by(() => {
    if (!line || line.kind === 'spark' || line.parts) return '';
    if (line.one) return tn(line.n, line.one, line.many);
    const vars = { ...(line.vars ?? {}) };
    if (line.date === 'date' && vars.date) vars.date = dayShort(vars.date);
    if (line.date === 'month' && vars.month) vars.month = monthWord(vars.month);
    return t(line.key, vars);
  });
  const weekText = $derived(line?.parts ? line.parts.map((p) => (line.parts.length > 1 ? `${goalName(p.goal)} ${t('{n} of {m}', { n: p.n, m: p.of })}` : `${t('{n} of {m}', { n: p.n, m: p.of })} · ${oneGoal(p.goal)}`)).join(' · ') : '');
  const spark = $derived.by(() => {
    if (line?.kind !== 'spark') return '';
    const max = Math.max(1, ...line.points);
    return line.points.map((v, i) => `${(i * 100) / 7},${22 - (v / max) * 18}`).join(' ');
  });
</script>

<!-- v0.105.0 Design-Refresh P8 «Aktiv» (A7): the light tile: the symbol in a square, the playful name
     and its one line; a nudge («heute wäre gut») framed dashed. Renaming moved to «Kacheln ändern». -->
<a class="tile {a.ring}" class:nudge={line?.kind === 'nudge'} class:rest={state.resting} data-tile={a.id} data-kind={line?.kind ?? 'week'} {href} aria-label="{tileName(a)} · {actName(a)}{line?.kind ? ` · ${t(TILE_LINE_NAMES[line.kind])}` : ''}">
  <span class="top"><ActIcon icon={a.icon} ring={a.ring} dim={state.resting} /><span class="sd num" aria-hidden="true">{state.resting ? '' : `${state.stand.n}/${state.stand.of}`}</span></span>
  <!-- Impeccable runde 2 (clarify): the activity's own name, small and grey right above the playful name, when it differs
       (its own line: next to the symbol it broke words on a 320 px phone) -->
  {#if tileName(a) !== actName(a)}<small class="own" data-own-name aria-hidden="true">{actName(a)}</small>{/if}
  <b class="tn">{tileName(a)}</b>
  {#if line?.kind === 'spark'}
    <svg class="spark" viewBox="0 0 100 24" preserveAspectRatio="none" role="img" aria-label={tn(line.vars.n, '{n} time in 8 weeks', '{n} times in 8 weeks')}><polyline points={spark} /></svg>
  {:else}
    <span class="line">{line?.parts ? weekText : text}</span>
  {/if}
</a>

<style>
  .tile {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    min-height: 120px;
    padding: 14px;
    border: 2px solid transparent;
    border-radius: var(--radius-card);
    outline: 1px solid var(--card-line);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    color: var(--ink);
    text-decoration: none;
    box-sizing: border-box;
  }
  .tile:hover {
    background: var(--paper-2);
  }
  .tile.nudge {
    border: 2px dashed var(--warn);
    outline-color: transparent;
  }
  .tile.rest {
    opacity: 0.6;
  }
  .top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 4px;
  }
  .sd {
    flex: none;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .own {
    margin-bottom: -4px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    line-height: 1.3;
  }
  .tn {
    font: 600 var(--fs-body) / 1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .line {
    color: var(--ink-3);
    font: 400 var(--fs-small) / 1.35 var(--font-body);
  }
  .spark {
    width: 100%;
    height: 24px;
  }
  .spark polyline {
    fill: none;
    stroke: var(--hi);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
  }
</style>
