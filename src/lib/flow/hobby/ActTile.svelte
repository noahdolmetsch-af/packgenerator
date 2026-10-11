<script>
  /**
   * Hobby pages (H14a, H15a, H29a): one favourite tile. The playful name (renamable), the activity's own
   * name, a small ring with the stand, and ONE line that fits instead of a date (milestone, history,
   * week, nudge, streak or best). The tile opens the activity's own page, or its editor until that page
   * exists. state: flow.js actState; line: flowtiles.js tileLine.
   */
  import { ChevronRight } from '@lucide/svelte';
  import { TILE_LINE_NAMES } from '../../flowtiles.js';
  import { tileName, monthWord } from './words.js';
  import { actName, goalName } from '../ui.svelte.js';
  import { dayShort, oneGoal } from '../words.js';
  import { t, tn } from '../../i18n.svelte.js';

  let { state, line, href, onrename } = $props();
  const a = $derived(state.act);
  const fill = $derived(state.stand.of ? Math.min(1, state.stand.n / state.stand.of) : 0);
  const C = 2 * Math.PI * 17;
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

<div class="tile {a.ring}" data-tile={a.id}>
  <a class="tl" {href}>
    <span class="ring" aria-hidden="true">
      <svg viewBox="0 0 44 44" width="44" height="44"><circle cx="22" cy="22" r="17" class="rs" /><circle cx="22" cy="22" r="17" class="ra" stroke-dasharray="{Math.max(0.01, fill * C)} {C}" transform="rotate(-90 22 22)" /></svg>
      <span class="rn num">{state.resting ? '–' : `${state.stand.n}/${state.stand.of}`}</span>
    </span>
    <span class="tn"><b>{tileName(a)}</b></span>
    <span class="cv" aria-hidden="true"><ChevronRight size={18} /></span>
  </a>
  <p class="own">{actName(a)} · <button type="button" class="rn-btn" onclick={() => onrename?.(a)} aria-label={t('Rename {name}', { name: tileName(a) })}>{t('rename')}</button></p>
  <p class="kind">{t(TILE_LINE_NAMES[line?.kind] ?? 'Week')}</p>
  {#if line?.kind === 'spark'}
    <svg class="spark" viewBox="0 0 100 24" preserveAspectRatio="none" role="img" aria-label={tn(line.vars.n, '{n} time in 8 weeks', '{n} times in 8 weeks')}><polyline points={spark} /></svg>
  {:else}
    <p class="line">{line?.parts ? weekText : text}</p>
  {/if}
</div>

<style>
  .tile {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    padding: 12px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .tl {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    color: var(--ink);
    text-decoration: none;
  }
  .ring {
    position: relative;
    flex: none;
    width: 44px;
    height: 44px;
  }
  .ring svg {
    display: block;
  }
  .rs,
  .ra {
    fill: none;
    stroke-width: 5;
  }
  .rs {
    stroke: var(--paper-2);
  }
  .ra {
    stroke-linecap: round;
  }
  .move .ra {
    stroke: var(--hi);
  }
  .mind .ra {
    stroke: var(--accent);
  }
  .rest .ra {
    stroke: var(--l3);
  }
  .rn {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font: 600 var(--fs-tiny)/1 var(--font-body);
  }
  .tn {
    flex: 1;
    min-width: 0;
  }
  .cv {
    flex: none;
    line-height: 0;
    color: var(--ink-3);
  }
  .tn b {
    display: block;
    font: 600 var(--fs-sub)/1.2 var(--font-body);
    overflow-wrap: break-word;
  }
  /* a phone: two tiles side by side, the name gets the whole width under the ring */
  @media (max-width: 599px) {
    .tl {
      flex-wrap: wrap;
      gap: 6px 10px;
    }
    .cv {
      margin-left: auto;
    }
    .tn {
      order: 3;
      flex-basis: 100%;
    }
    .tn b {
      font-size: var(--fs-body);
    }
  }
  .own {
    margin: -4px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .rn-btn {
    position: relative;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  .rn-btn::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    min-width: 44px;
    height: 44px;
    transform: translate(-50%, -50%);
  }
  .kind {
    margin: 6px 0 0;
    color: var(--ink-3);
    font: 600 var(--fs-tiny)/1.3 var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .line {
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 500;
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
