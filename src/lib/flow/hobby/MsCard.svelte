<script>
  /**
   * Hobby pages: ONE card for every milestone (mockups A, A2): the star, the name, the next star with
   * its stage, the value against the next threshold, the bar and the thresholds. Only the next star is
   * shown; with all stars reached the card shows «Path» and the best value.
   * r: an evaluated milestone (flowms.js evaluate); kind: 'soon' (gold frame), 'plain'; sub: a quiet line
   * (the activity's name on A2 «Pro Aktivität»).
   */
  import { Star } from '@lucide/svelte';
  import Sugg from './Sugg.svelte';
  import { msName, starLine, val } from './words.js';
  import { t, num } from '../../i18n.svelte.js';

  let { r, kind = 'plain', sub = '' } = $props();
  const left = $derived(Math.max(0, Math.round((r.target - r.value) * 10) / 10));
  const unit = $derived(r.m.unit);
</script>

<article class="mscard {kind}" data-ms={r.id}>
  <div class="mh">
    <span class="si" class:full={r.done} aria-hidden="true"><Star size={22} /></span>
    <div class="mt">
      <h3>{msName(r.m)}{#if r.m.sugg}<Sugg />{/if}</h3>
      <p class="st">{r.done ? t('All stars · {stage}', { stage: t('Path|stage') }) : starLine(r.next)}</p>
    </div>
  </div>
  <p class="v"><b class="num">{val(r.done ? r.best : r.value)}</b>{#if !r.done}<span>{t('of {n}', { n: val(r.target, unit) })}</span>{:else if unit}<span>{unit}</span>{/if}</p>
  <div class="bar" role="progressbar" aria-label={msName(r.m)} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(r.progress * 100)}><i style:width="{Math.round(r.progress * 100)}%"></i></div>
  <p class="w">{#if sub}{sub}{#if r.next && kind === 'soon'}{' · '}{t('{n} to go', { n: val(left, unit) })}{/if}{:else if kind === 'soon'}{t('{n} to go', { n: val(left, unit) })} · {t('from 80 % «soon»')}{:else}{t(r.m.what)}{/if}</p>
  {#if !sub}<p class="steps num">{r.steps.map((s) => num(s)).join(' · ')}</p>{/if}
</article>

<style>
  .mscard {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    padding: 14px 16px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .mscard.soon {
    border: 2px solid var(--l2);
    background: var(--warn-soft);
  }
  .mh {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  .si {
    flex: none;
    color: var(--l2);
    line-height: 0;
  }
  .si.full :global(svg) {
    fill: var(--l2);
  }
  .mt {
    min-width: 0;
  }
  h3 {
    margin: 0;
    font: 600 var(--fs-body)/1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .st {
    margin: 0;
    color: var(--warn);
    font-size: var(--fs-small);
    font-weight: 500;
  }
  .v {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 2px 6px;
    margin: 4px 0 0;
  }
  .v b {
    font: 800 var(--fs-title)/1 var(--font-brand);
  }
  .v span {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .bar {
    height: 6px;
    border-radius: 3px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: 3px;
    background: var(--l2);
  }
  .w {
    margin: 0;
    color: var(--warn);
    font-size: var(--fs-small);
  }
  .plain .w {
    color: var(--ink-2);
  }
  .steps {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
</style>
