<script>
  /**
   * «Meilensteine motivierender» PR 1 (Noah 21.11.2026 «1-5 a»): «Dein nächster Stern» on top of the Meilensteine page.
   * One big card: a ring with the progress, the star with its stage, how much is missing, and one quiet line about
   * when it could be reached (the Wochenplan of this week, else the pace of the last four weeks). Only a hint, never
   * a promise. hero: heroOf() of lib/flow/naechster.js; label: the sport's name or ''.
   */
  import { CalendarDays, TrendingUp } from '@lucide/svelte';
  import { msName, starLine, val } from './words.js';
  import { dayShort } from '../words.js';
  import { UNIT_NAME } from '../../training/wochenplan-text.js';
  import { t, locale } from '../../i18n.svelte.js';

  let { hero, label = '', title = (x) => msName(x.m) } = $props();
  const r = $derived(hero.r);
  const C = 2 * Math.PI * 42;
  const dash = $derived((C * hero.pct) / 100);
  const weekday = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'long', timeZone: 'UTC' });
  const unitName = $derived(hero.plan ? t(UNIT_NAME[hero.plan.unit.type] ?? hero.plan.unit.type) : '');
  const when = $derived(hero.plan ? `${weekday(hero.plan.day)} ${hero.plan.unit.t}` : '');
</script>

<section class="hero card" data-hero data-hero-ms={r.id} aria-labelledby="hero-h">
  <div class="ring" role="img" aria-label={t('{n} percent', { n: hero.pct })}>
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle class="bg" cx="50" cy="50" r="42" />
      <circle class="fg" cx="50" cy="50" r="42" stroke-dasharray="{dash} {C}" />
    </svg>
    <span class="pc num">{hero.pct}<small>%</small></span>
  </div>
  <div class="tx">
    <p class="lab" id="hero-h">{t('Your next star')}</p>
    <h3>{title(r)} · {starLine(r.next)}</h3>
    {#if label}<p class="who">{label}</p>{/if}
    <p class="big"><b class="num" data-hero-left>{t('{n} to go', { n: val(hero.left, r.m.unit) })}</b><span>{t('{n} of {m}', { n: val(r.value, r.m.unit), m: val(r.target, r.m.unit) })}</span></p>
  </div>
  {#if hero.plan}
    <div class="hint" data-hero-plan>
      <CalendarDays size={18} aria-hidden="true" />
      <p>
        <b>{unitName} · {when}</b>
        {#if hero.plan.reach}{t('It is in your weekly plan. Tick it off on Active and this star is yours.')}{:else}{t('It is in your weekly plan this week. Every tick on Active counts.')}{/if}
        <a href="#/flow/wochenplan">{t('Weekly plan')} ›</a>
      </p>
    </div>
  {:else if hero.pace}
    <div class="hint" data-hero-pace>
      <TrendingUp size={18} aria-hidden="true" />
      <p>{t('At your pace of the last weeks (about {n} a week) around {date}. Only a guess.', { n: val(hero.pace.perWeek, r.m.unit), date: dayShort(hero.pace.eta) })}</p>
    </div>
  {/if}
  <div class="acts">
    {#if r.m.actId}<a class="btn" href="#/flow" data-hero-tick>{t('Tick off today')}</a>{/if}
  </div>
</section>

<style>
  .hero {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr);
    gap: var(--sp-3) var(--sp-4);
    align-items: center;
    padding: var(--sp-4);
    border: 2px solid var(--l2);
    background: var(--warn-soft);
    min-width: 0;
  }
  .ring {
    position: relative;
    width: 96px;
    height: 96px;
  }
  .ring svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }
  .ring circle {
    fill: none;
    stroke-width: 10;
  }
  .ring .bg {
    stroke: var(--paper);
  }
  .ring .fg {
    stroke: var(--l2);
    stroke-linecap: round;
  }
  .pc {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    font: 700 var(--fs-sub) / 1 var(--font-body);
    text-align: center;
  }
  .pc small {
    font-size: var(--fs-tiny);
    font-weight: 500;
  }
  .tx {
    min-width: 0;
  }
  .lab {
    margin: 0;
    color: var(--warn);
    font: 700 var(--fs-tiny) / 1.3 var(--font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  h3 {
    margin: 2px 0 0;
    font: 700 var(--fs-sub) / 1.25 var(--font-body);
    overflow-wrap: break-word;
  }
  .who {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .big {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px var(--sp-3);
    margin: var(--sp-1) 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .big b {
    color: var(--ink);
    font: 700 var(--fs-num) / 1.1 var(--font-body);
  }
  .hint {
    grid-column: 1 / -1;
    display: flex;
    gap: var(--sp-2);
    align-items: flex-start;
    padding: var(--sp-2) var(--sp-3);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
  .hint :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--accent);
  }
  .hint p {
    margin: 0;
    min-width: 0;
  }
  .hint b {
    display: block;
    color: var(--ink);
    font-weight: 600;
  }
  .hint a {
    margin-left: var(--sp-1);
    color: var(--ink);
    font-weight: 600;
  }
  .acts {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .acts:empty {
    display: none;
  }
  @media (min-width: 1000px) {
    .hero {
      grid-template-columns: 120px minmax(0, 1fr) minmax(0, 20rem);
    }
    .ring {
      width: 120px;
      height: 120px;
    }
    .hint {
      grid-column: 3;
      grid-row: 1;
    }
    .acts {
      grid-column: 2 / -1;
    }
  }
</style>
