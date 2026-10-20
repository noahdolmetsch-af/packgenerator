<script module>
  // Gesamttest 20.10 «2a»: the visits before this opening of the page, kept per opening (a re-mount while the
  // page loads, or a {#key}, is no new visit and keeps the first visit open)
  const beforeOf = new Map();
  let nav = 0;
  if (typeof window !== 'undefined') window.addEventListener('hashchange', () => nav++);
</script>

<script>
  /**
   * «Einstieg» on top of a place (Noah 15.10.2026 «1a 2a 3a 4a», mockups design/bereich-einstieg A1, A2):
   * what you do here, what to expect, the tip of the day (pageinfo.js, «Passt zu heute» first, with its
   * button), one «Did you know» with its source, the small tour of the place and the Handbook. Open on the
   * first visit, then the quiet line «So geht's ›» (Gesamttest 20.10.2026 «2a», phone and computer). × takes it away; then the page's
   * own tip line (the `hidden` snippet) shows as before. Words and rules: lib/intro.js.
   * mini: folded it is only a round «i» in the top corner of the page head (the head needs position: relative).
   * place: a key of INTROS (= the page key in pageinfo.js); a page below a place (intro.page) has no tour.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { putSetting } from '../flowdb.js';
  import { INTRO_KEY, INTROS, tipsOf, introOf, visit, isOpen, setFold, hide, offerTour, setOffered } from '../intro.js';
  import { tipOfDay, factOfDay } from '../pageinfo.js';
  import { pageInfo, dayContext } from '../pageinfo/store.svelte.js';
  import KindTag from '../pageinfo/KindTag.svelte';
  import TipsSheet from '../pageinfo/TipsSheet.svelte';
  import { TOURS, stepCount } from '../tour.js';
  import { startTour } from '../tour/run.js';
  import { phone } from '../media.svelte.js';
  import { localDay } from '../localday.js';
  import { t } from '../i18n.svelte.js';
  import { Check, Target, Moon, Map as MapIcon, Backpack, History, Scale, Boxes, ShoppingCart, Info, ChevronUp, X, Lightbulb, ChevronRight, Bike, Wrench, ListChecks, Timer, ChartLine, CalendarDays, Heart, Star, ShoppingBag, Sun, Copy, Shirt, Thermometer } from '@lucide/svelte';

  let { place, hidden: hiddenSnippet = null, mini = false } = $props();
  const ICON = { check: Check, goal: Target, moon: Moon, map: MapIcon, pack: Backpack, back: History, scale: Scale, blocks: Boxes, cart: ShoppingCart, bike: Bike, wrench: Wrench, list: ListChecks, timer: Timer, chart: ChartLine, calendar: CalendarDays, heart: Heart, star: Star, bag: ShoppingBag, sun: Sun, copy: Copy, shirt: Shirt, thermo: Thermometer };
  // svelte-ignore state_referenced_locally
  const intro = INTROS[place];
  const today = localDay();
  const pi = pageInfo();
  const dc = dayContext(today);

  const q = liveQuery(() => db.settings.get(INTRO_KEY));
  let raw = $state(undefined);
  let loaded = $state(false);
  $effect(() => {
    const sub = q.subscribe({ next: (x) => ((raw = x?.value), (loaded = true)) });
    return () => sub.unsubscribe();
  });
  const save = (fn) =>
    db.transaction('rw', db.settings, async () => {
      const next = fn((await db.settings.get(INTRO_KEY))?.value);
      if (next) await putSetting(db, INTRO_KEY, next);
    });

  // one visit per opening of the page (a re-render or a re-mount is no new visit)
  let before = $state(null);
  $effect(() => {
    if (!intro || !loaded || before !== null) return;
    const k = `${place}:${nav}`;
    if (beforeOf.has(k)) {
      before = beforeOf.get(k);
      return;
    }
    before = introOf(raw).visits[place] ?? 0;
    beforeOf.set(k, before);
    save((v) => visit(v, place));
  });

  const st = $derived(introOf(raw));
  const gone = $derived(!!st.hidden[place]);
  const open = $derived(isOpen(raw, place, phone.matches, !!intro?.folded, before));
  const offer = $derived(offerTour(raw, place));
  const tip = $derived(pi.loaded ? tipOfDay(pi.info, tipsOf(place), today, dc.ctx, { sourced: false }) : null);
  const fact = $derived(pi.loaded ? factOfDay(pi.info, tipsOf(place), today, tip?.id) : null);
  const deg = $derived(tip?.when === 'heat' || tip?.when === 'cold' ? dc.ctx.max : null);
  const tipText = (x) => (x.own ? x.text : t(x.text));
  const name = $derived(intro ? t(intro.name) : '');
  const hasTour = $derived(!!intro?.tour && !!TOURS[intro.tour]);
  let tips = $state(false);

  function tour() {
    save((v) => setOffered(v, place));
    startTour(intro.tour);
  }
</script>

{#if intro && loaded && before !== null}
  {#if gone}
    {@render hiddenSnippet?.()}
  {:else if !open && mini}
    <!-- a short page (Meditation): folded, only a round «i» in the corner of the head, no extra row -->
    <button type="button" class="ai-mini" data-intro={place} data-open="false" aria-expanded="false" aria-label={t('How to use {place}', { place: name })} onclick={() => save((v) => setFold(v, place, false))}><Info size={20} aria-hidden="true" /></button>
  {:else if !open}
    <!-- Gesamttest 20.10 «2a»: one quiet line «ⓘ So geht's ›», a tap opens the Einstieg in place -->
    <button type="button" class="ai-line" data-intro={place} data-open="false" aria-expanded="false" onclick={() => save((v) => setFold(v, place, false))}>
      <Info size={18} aria-hidden="true" />
      <span class="tx">{t('How it works|help')}</span>
      <ChevronRight size={16} aria-hidden="true" />
    </button>
  {:else}
    <section class="card ai" class:wide={!phone.matches} data-intro={place} data-open="true" aria-labelledby="ai-{place}">
      <div class="main">
        <div class="head">
          <div>
            <!-- Impeccable 20.10.2026: no label above the title («DAS IST …»); the title speaks for itself -->
            <h2 id="ai-{place}">{t(intro.title)}</h2>
          </div>
          {#if phone.matches}<button type="button" class="x" aria-label={t('Hide the introduction')} onclick={() => save((v) => hide(v, place))}><X size={20} aria-hidden="true" /></button>{/if}
        </div>
        {#if offer && hasTour}
          <div class="offer" data-offer>
            <span>{t('New here? A short tour of {place} ({n} steps)', { place: name, n: stepCount(intro.tour) })}</span>
            <span class="oacts">
              <button type="button" class="btn sm" onclick={() => save((v) => setOffered(v, place))}>{t('No thanks')}</button>
              <button type="button" class="btn sm" onclick={tour}>{t('Start ›|tour')}</button>
            </span>
          </div>
        {/if}
        <ul class="things">
          {#each intro.things as x (x.title)}
            {@const Icon = ICON[x.icon] ?? Check}
            <li>
              <span class="ti"><Icon size={18} aria-hidden="true" /></span>
              <span><b>{#if x.href}<a href={x.href}>{t(x.title)}</a>{:else}{t(x.title)}{/if}</b><small>{t(x.text)}</small></span>
            </li>
          {/each}
        </ul>
        <p class="expect"><b>{t('What to expect:')}</b> {t(intro.expect)}</p>
        {#if phone.matches}{@render side()}{/if}
        <div class="links">
          {#if hasTour}<button type="button" class="lk" onclick={tour}>{t('Tour of {place} ({n} steps)', { place: name, n: stepCount(intro.tour) })}</button>{/if}
          <a class="lk" href="#/me/handbook">{t('Handbook')}</a>
          <button type="button" class="fold" onclick={() => save((v) => setFold(v, place, true))}>{t('Fold')}<ChevronUp size={16} aria-hidden="true" /></button>
        </div>
      </div>
      {#if !phone.matches}
        <div class="side">
          <button type="button" class="x" aria-label={t('Hide the introduction')} onclick={() => save((v) => hide(v, place))}><X size={18} aria-hidden="true" /></button>
          {@render side()}
        </div>
      {/if}
    </section>
  {/if}
{/if}

{#snippet side()}
  {#if tip}
    <div class="tip" data-tip={tip.id}>
      <p class="th"><Lightbulb size={16} aria-hidden="true" />{t('Tip for today')}</p>
      <p>{#if tip.kind !== 'tip'}<KindTag kind={tip.kind} {deg} />{/if}{tipText(tip)}</p>
      <div class="tacts">
        {#if tip.button && tip.href}<a class="btn sm" href={tip.href}>{t(tip.button)}<ChevronRight size={16} aria-hidden="true" /></a>{/if}
        <button type="button" class="lk" onclick={() => (tips = true)}>{t('All tips ›')}</button>
      </div>
    </div>
  {/if}
  {#if fact}
    <div class="fact" data-fact={fact.id}>
      <p><KindTag kind="know" />{t(fact.text)}</p>
      <p class="src">{t('Source: {source}', { source: t(fact.source) })}</p>
    </div>
  {/if}
{/snippet}

{#if tips}<TipsSheet page={tipsOf(place)} {name} onclose={() => (tips = false)} />{/if}

<style>
  .ai {
    padding: 0;
    overflow: hidden;
    margin-bottom: var(--sp-3, 16px);
    /* Design 2: one look for help */
    border: 1px solid var(--help-line);
    border-radius: var(--help-r);
    background: var(--help-bg);
    box-shadow: none;
  }
  .ai.wide {
    display: grid;
    grid-template-columns: 1fr 340px;
  }
  .main {
    padding: 18px 20px 14px;
    min-width: 0;
  }
  .head {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  .head > div {
    flex: 1;
  }
  .kick {
    margin: 0;
    font-size: var(--fs-label);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--hi);
  }
  h2 {
    margin: 4px 0 0;
    font-size: var(--fs-sub);
    line-height: 1.25;
  }
  .x {
    flex: none;
    min-width: 44px;
    min-height: 44px;
    margin: -8px -10px 0 0;
    background: none;
    border: 0;
    padding: 4px;
    color: var(--ink-3);
    cursor: pointer;
  }
  .side .x {
    position: absolute;
    right: 6px;
    top: 6px;
    margin: 0;
  }
  .offer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin-top: 12px;
    padding: 10px 12px;
    border-radius: 12px;
    border: 2px solid var(--hi);
    background: var(--hi-soft);
    font-weight: 600;
  }
  .offer > span:first-child {
    flex: 1 1 200px;
  }
  .oacts {
    display: flex;
    gap: 8px;
  }
  .things {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
    display: grid;
    gap: 0;
  }
  .wide .things {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .things li {
    display: flex;
    gap: 12px;
    padding: 9px 0;
    border-bottom: 1px solid var(--help-line);
  }
  .wide .things li {
    border: 0;
    padding: 0;
  }
  .things li > span:last-child {
    display: grid;
    gap: 2px;
  }
  /* the title link is a 44 px touch target without making the row taller */
  .things b a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    min-width: 44px; /* a short title («Teile») still gets a full tap target */
    margin: -11px 0;
  }
  .things small {
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
  .things a {
    color: inherit;
  }
  .ti {
    flex: none;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: var(--paper);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .expect {
    margin: 12px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .expect b {
    color: var(--ink);
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 18px;
    margin-top: 12px;
  }
  .lk,
  .fold {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    background: none;
    border: 0;
    padding: 0;
    font: inherit;
    font-size: var(--fs-small);
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
  }
  .fold {
    margin-left: auto;
    color: var(--ink-3);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .side {
    position: relative;
    background: var(--paper);
    border-left: 1px solid var(--help-line);
    padding: 18px 18px 16px;
  }
  .tip p,
  .fact p {
    margin: 0;
    line-height: 1.45;
    font-size: var(--fs-small);
  }
  .tip .th {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 700;
    color: var(--hi);
    margin-bottom: 6px;
  }
  .tacts .btn {
    min-height: 44px;
  }
  .ai-mini {
    position: absolute;
    top: 0;
    right: 0;
    width: 44px;
    height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--line);
    border-radius: 22px;
    background: var(--paper);
    color: var(--ink-2);
    cursor: pointer;
  }
  .tacts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 14px;
    margin-top: 10px;
  }
  .ai:not(.wide) .tip {
    margin-top: 12px;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--paper);
  }
  .fact {
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .ai:not(.wide) .fact {
    border-top: 0;
    padding: 0 2px;
  }
  .fact .src {
    margin-top: 4px;
    color: var(--ink-3);
    font-size: var(--fs-label);
  }
  /* Gesamttest 20.10 «2a» + Design 2: the quiet line, the same look as the help card's line (HintCard .mini) */
  .ai-line {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 44px;
    margin-bottom: var(--sp-3, 12px);
    padding: 8px 14px;
    border: 1px solid var(--help-line);
    border-radius: var(--help-r);
    background: var(--help-bg);
    text-align: left;
    font: inherit;
    color: var(--ink-2);
    cursor: pointer;
  }
  .ai-line > :global(svg:first-child) {
    flex: none;
    color: var(--help-icon);
  }
  .ai-line .tx {
    flex: 1;
    min-width: 0;
  }
</style>
