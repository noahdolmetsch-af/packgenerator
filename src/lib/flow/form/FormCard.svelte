<script>
  /**
   * «Form und Erholung» (Noah 20.10.2026 «2b 3a»): the card on top of Aktiv. A number 0–100 how ready you
   * are today, one sentence what today suits and the reason that counted most. Under it, when it applies:
   * the ramp hint, the recovery hint and the next or running tour. A tap opens the page «Form».
   * Only to look at, no diagnosis.
   */
  import { ChevronRight, TriangleAlert, Mountain } from '@lucide/svelte';
  import { formQuery } from '../../form-data.js';
  import { RAMP_MAX } from '../../form.js';
  import { levelWord, levelLine, partText, tourText } from './words.js';
  import { t, num } from '../../i18n.svelte.js';

  let { today } = $props();
  const q = formQuery(today);
  const f = $derived($q);
  const r = $derived(f?.ready);
  const pct = $derived(r ? r.score / 100 : 0);
</script>

{#if f}
  <a class="card fc" href="#/flow/form" data-section="form" data-level={r?.level ?? 'none'}>
    {#if r}
      <svg class="ring" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="42" class="tr" />
        <circle cx="50" cy="50" r="42" class="fl lv-{r.level}" stroke-dasharray="{(pct * 263.9).toFixed(1)} 263.9" transform="rotate(-90 50 50)" />
      </svg>
      <span class="sc num" data-form-score>{num(r.score)}</span>
      <span class="tx">
        <b>{t('Readiness')} · {levelWord(r.level)}</b>
        <span data-form-line>{levelLine(r.level)}</span>
        {#if r.reason && r.reason.points}<small data-form-reason>{partText(r.reason)}</small>{/if}
      </span>
    {:else}
      <span class="tx wide">
        <b>{t('Readiness')}</b>
        <span>{t('Comes with your first activities from Strava or with Fitbit: then the app shows each morning what today suits.')}</span>
      </span>
    {/if}
    <ChevronRight class="go" size={18} aria-hidden="true" />
    {#if f.alarm || f.rampHigh || f.tour}
      <ul class="notes">
        {#if f.alarm}<li data-form-alarm><TriangleAlert size={16} aria-hidden="true" /><span>{t('Resting pulse up and HRV down two days in a row: an easy day may help.')}</span></li>{/if}
        {#if f.rampHigh}<li data-form-ramp><TriangleAlert size={16} aria-hidden="true" /><span>{t('Your fitness rose by {n} in 7 days. More than {m} a week often leads to overload.', { n: num(r.ramp), m: RAMP_MAX })}</span></li>{/if}
        {#if f.tour}<li data-form-tour><Mountain size={16} aria-hidden="true" /><span>{tourText(f.tour)}</span></li>{/if}
      </ul>
    {/if}
  </a>
{/if}

<style>
  .fc {
    position: relative;
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr) auto;
    align-items: center;
    gap: 6px 14px;
    padding: 14px 16px;
    color: var(--ink);
    text-decoration: none;
  }
  .fc:hover {
    background: var(--paper-2);
  }
  .ring {
    grid-area: 1 / 1;
    width: 72px;
    height: 72px;
  }
  .ring .tr,
  .ring .fl {
    fill: none;
    stroke-width: 9;
  }
  .ring .tr {
    stroke: var(--paper-2);
  }
  .ring .fl {
    stroke: var(--hi);
    stroke-linecap: round;
  }
  .ring .lv-rest {
    stroke: var(--bad);
  }
  .ring .lv-easy {
    stroke: var(--warn);
  }
  .sc {
    grid-area: 1 / 1;
    justify-self: center;
    font: 700 var(--fs-title) / 1 var(--font-body);
  }
  .tx {
    display: grid;
    gap: 2px;
    min-width: 0;
    line-height: 1.35;
  }
  .tx.wide {
    grid-column: 1 / 3;
  }
  .tx small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .fc :global(.go) {
    color: var(--ink-3);
  }
  .notes {
    display: grid;
    grid-column: 1 / -1;
    gap: 6px;
    margin: 6px 0 0;
    padding: 8px 0 0;
    border-top: 1px solid var(--line);
    list-style: none;
  }
  .notes li {
    display: flex;
    gap: 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
  .notes :global(svg) {
    flex: none;
    margin-top: 2px;
  }
</style>
