<script>
  /**
   * Ich › Handbuch (#/me/handbook; mockup HB2, Noah 14.10.2026 «1b 2b», «hb freigeben»): every
   * function of «What the app can do», by situation, each folded: how to switch it on, 1–3 steps,
   * one example and «Take me there». One source: handbook.js (also docs/handbuch.md).
   * #/me/handbook?f=<id> opens that function.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { FEATURES, FEATURE_GROUPS } from '../lib/features.js';
  import { handbookOf } from '../lib/handbook.js';
  import { goFeature } from '../lib/know/featureRun.js';
  import { sortBikes } from '../lib/bikes.js';
  import { t } from '../lib/i18n.svelte.js';
  import { ChevronRight, Compass, Backpack, BookOpen, Bike, Leaf, Save } from '@lucide/svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import '../lib/ich/ich.css';
  import { TOUR_NAMES, stepCount } from '../lib/tour.js';
  import { askTour, startTour } from '../lib/tour/run.js';
  import { INTRO_KEY, showAll, hiddenCount } from '../lib/intro.js';
  import { putSetting } from '../lib/flowdb.js';
  import { Footprints } from '@lucide/svelte';

  const GROUP_ICON = { compass: Compass, backpack: Backpack, book: BookOpen, bike: Bike, leaf: Leaf, save: Save };
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bikeId = $derived(sortBikes($bikesQ ?? [])[0]?.id ?? null);
  const groups = FEATURE_GROUPS.map((g) => ({ ...g, rows: FEATURES.filter((x) => x.group === g.key) })).filter((g) => g.rows.length);
  const wanted = typeof location !== 'undefined' ? (location.hash.match(/[?&]f=([^&]+)/)?.[1] ?? null) : null;
  const wantId = wanted ? decodeURIComponent(wanted) : null;
  // «Rundgang» (Noah 15.10.2026 «4a»): the tours start here too; «Einstieg» × comes back here
  const introQ = liveQuery(() => db.settings.get(INTRO_KEY));
  const introGone = $derived(hiddenCount($introQ?.value));
  const bringBack = () => putSetting(db, INTRO_KEY, showAll($introQ?.value));
  const PLACE_TOURS = ['aktiv', 'touren', 'material', 'velos'];
  $effect(() => {
    if (wantId) queueMicrotask(() => document.querySelector(`[data-hb="${CSS.escape(wantId)}"]`)?.scrollIntoView({ block: 'center' }));
  });
</script>

<div class="ich-page hb">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Handbook')} sub={t('How to switch on every function, with an example')} />

  <section class="ich-sec hb-tour" aria-labelledby="hb-tour" data-hb-tour>
    <div class="ich-h"><div><h2 id="hb-tour"><Footprints size={18} aria-hidden="true" /> {t('Tour|short')}</h2></div></div>
    <div class="card hb-tc">
      <div class="hb-tmain">
        <span><b>{t(TOUR_NAMES.app)}</b><small>{t('{n} short steps, about 2 minutes', { n: stepCount('app') })}</small></span>
        <button type="button" class="btn sm hi" onclick={() => askTour('app')}>{t('Start ›|tour')}</button>
      </div>
      <p class="hb-tsmall">
        {#each PLACE_TOURS as id, i (id)}{#if i}{' · '}{/if}<button type="button" class="lk" onclick={() => startTour(id)}>{t(TOUR_NAMES[id])}</button>{/each}
      </p>
      {#if introGone}<p class="hb-tsmall"><button type="button" class="lk" onclick={bringBack}>{t('Show the introductions on top of the places again ({n})', { n: introGone })}</button></p>{/if}
    </div>
  </section>

  <div class="hb-grid">
    {#each groups as g (g.key)}
      {@const Icon = GROUP_ICON[g.icon] ?? Compass}
      <section class="ich-sec" data-group={g.key} aria-labelledby="hb-{g.key}">
        <div class="ich-h"><div><h2 id="hb-{g.key}"><Icon size={18} aria-hidden="true" /> {t(g.label)}</h2></div></div>
        <ul class="card hb-list">
          {#each g.rows as x (x.id)}
            {@const h = handbookOf(x.id)}
            <li data-hb={x.id}>
              <details open={x.id === wantId}>
                <summary><span class="hb-t">{t(x.title)}</span><ChevronRight class="hb-chev" size={18} aria-hidden="true" /></summary>
                <div class="hb-body">
                  <p class="hb-what">{t(x.text)}</p>
                  <p><b>{t('Switch on:')}</b> {h.on ? t(h.on) : t('Always there, nothing to do.')}</p>
                  {#if h.steps.length}<ol>{#each h.steps as s (s)}<li>{t(s)}</li>{/each}</ol>{/if}
                  {#if h.example}<p class="hb-ex">{t(h.example)}</p>{/if}
                  <button type="button" class="btn sm hi" onclick={() => goFeature(x, { bikeId })}>{t('Take me there')}<ChevronRight size={16} aria-hidden="true" /></button>
                </div>
              </details>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </div>
</div>

<style>
  .hb-grid {
    display: grid;
    gap: var(--sp-4);
  }
  @media (min-width: 1000px) {
    .hb-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
    }
  }
  h2 :global(svg) {
    vertical-align: -3px;
  }
  .hb-list {
    list-style: none;
    margin: 0;
    padding: 0 var(--sp-3);
  }
  .hb-list > li + li {
    border-top: 1px solid var(--line);
  }
  summary {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 48px;
    cursor: pointer;
    list-style: none;
    font-weight: 600;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  .hb-t {
    flex: 1;
    min-width: 0;
  }
  summary :global(.hb-chev) {
    flex: none;
    color: var(--ink-2);
    transition: transform 0.15s;
  }
  details[open] summary :global(.hb-chev) {
    transform: rotate(90deg);
  }
  @media (prefers-reduced-motion: reduce) {
    summary :global(.hb-chev) {
      transition: none;
    }
  }
  .hb-body {
    display: grid;
    gap: var(--sp-2);
    justify-items: start;
    margin: 0 0 var(--sp-3);
    padding: var(--sp-3);
    border-radius: 10px;
    background: var(--paper-2);
  }
  .hb-body p,
  .hb-body ol {
    margin: 0;
  }
  .hb-body ol {
    padding-left: 1.2em;
  }
  .hb-what {
    color: var(--ink-2);
  }
  .hb-ex {
    font-style: italic;
  }
  .hb-tc {
    padding: 14px 16px;
    display: grid;
    gap: 8px;
    margin-bottom: 16px;
  }
  .hb-tmain {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .hb-tmain > span {
    flex: 1;
    display: grid;
    gap: 2px;
  }
  .hb-tmain small,
  .hb-tsmall {
    color: var(--ink-3);
    font-size: var(--fs-small);
    margin: 0;
  }
  .hb-tsmall .lk {
    min-height: 44px;
    background: none;
    border: 0;
    padding: 0;
    font: inherit;
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
  }
</style>
