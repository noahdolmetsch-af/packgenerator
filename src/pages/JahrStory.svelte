<script>
  /**
   * Paket M «Aus Touren lernen», #208 «Dein Jahr als Bildgeschichte»: #/jahr (this year), #/jahr/<year>.
   * Full-screen slides: the cover «Dein Tourenjahr 2026», one slide per trip of the year (its photo from this
   * device, else its route drawn big; title, dates, km, one line from the debrief), the numbers (km, climbing,
   * days on the way), «Neu dieses Jahr» (neu: a list of short sentences from elsewhere, optional) and
   * «Danke für dieses Jahr» with the way to the year letter. Tap right or left, the arrow keys or a swipe go
   * on and back; the dashes on top show where you are; Escape or × closes. Usable for every year.
   */
  import { liveQuery } from 'dexie';
  import { X, ChevronLeft, ChevronRight } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { homeTrips } from '../lib/home/heute.js';
  import { allTripPhotos } from '../lib/lernen/fotos.js';
  import { storySlides, yearOfHash, stepTo } from '../lib/lernen/jahrstory.js';
  import { yearsWithData } from '../lib/lernen/gelernt.js';
  import { projectLines } from '../lib/lernen/chronik.js';
  import { localDay } from '../lib/localday.js';
  import { dates } from '../lib/review/fmt.js';
  import { t, tn, num } from '../lib/i18n.svelte.js';

  let { hash = typeof location === 'undefined' ? '' : location.hash, neu = [], onclose = null } = $props();
  const today = localDay();
  // svelte-ignore state_referenced_locally (the year of the address when the page opens; then the cover chooses)
  let year = $state(yearOfHash(hash, today));
  const dataQ = liveQuery(async () => {
    const [trips, debriefs, rides, learnings, photos] = await Promise.all([db.trips.toArray(), db.debriefs.toArray(), db.rides.toArray(), db.learnings.toArray(), allTripPhotos(db)]);
    return { trips: homeTrips(trips), debriefs, rides, learnings: learnings.filter((l) => !l.archivedAt), photos };
  });
  const data = $derived($dataQ);
  const slides = $derived(data ? storySlides({ ...data, year, neu, today }) : []);
  const years = $derived(data ? yearsWithData({ ...data, today }) : [year]);
  let i = $state(0);
  const s = $derived(slides[Math.min(i, slides.length - 1)] ?? null);
  const go = (step) => (i = stepTo(i, step, slides.length));
  function close() {
    if (onclose) return onclose();
    location.hash = '#/debrief';
  }
  function setYear(y) {
    year = y;
    i = 0;
    try {
      history.replaceState(history.state, '', `#/jahr/${y}`);
    } catch {
      /* the address stays */
    }
  }
  function onkey(e) {
    if (e.key === 'Escape') (e.preventDefault(), close());
    else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') (e.preventDefault(), go(1));
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') (e.preventDefault(), go(-1));
  }
  // a tap on the left third goes back, anywhere else on; a swipe sideways too (not on buttons and links)
  let x0 = null;
  let swiped = false;
  const onControl = (e) => !!e.target.closest?.('button, a');
  function down(e) {
    x0 = e.clientX;
    swiped = false;
  }
  function up(e) {
    if (x0 == null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 40) {
      swiped = true;
      go(dx < 0 ? 1 : -1);
    }
  }
  function tap(e) {
    if (swiped || onControl(e)) return;
    const r = e.currentTarget.getBoundingClientRect();
    go(e.clientX - r.left < r.width / 3 ? -1 : 1);
  }
  const big = (sl) => (sl?.kind === 'trip' && !sl.photo && sl.lines.length ? projectLines([{ id: sl.id, lines: sl.lines }], 320, 320, 16) : null);
  const NUM = { km: 'kilometres', gainM: 'metres of climbing', days: 'days on the way' };
  let el = $state();
  $effect(() => el?.focus());
</script>

<svelte:window onkeydown={onkey} />

<div class="story" role="dialog" aria-modal="true" aria-label={t('Your year of trips {year}', { year })} tabindex="-1" bind:this={el} data-story data-slide={s?.kind}>
  <div class="dashes" aria-hidden="true">
    {#each slides as _, n (n)}<i class:on={n <= i}></i>{/each}
  </div>
  <button type="button" class="close" aria-label={t('Close')} onclick={close}><X size={22} aria-hidden="true" /></button>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="stage" onclick={tap} onpointerdown={down} onpointerup={up}>
    {#if s}
      {#key `${year}-${i}`}
        <div class="slide {s.kind}" class:bare={s.kind === 'trip' && !s.photo && !s.lines.length} aria-live="polite" aria-label={t('Slide {n} of {k}', { n: i + 1, k: slides.length })}>
          {#if s.kind === 'cover'}
            <p class="kick">{t('Your year as pictures')}</p>
            <h1>{t('Your year of trips {year}', { year: s.year })}</h1>
            <p class="lead num">{s.trips ? tn(s.trips, '{n} trip', '{n} trips') : t('No trips in this year yet.')}</p>
            {#if years.length > 1}
              <div class="years" role="group" aria-label={t('Choose a year')}>
                {#each years as y (y)}<button type="button" class="yb" aria-pressed={y === year} onclick={() => setYear(y)}>{y}</button>{/each}
              </div>
            {/if}
            <p class="hint">{t('Tap or swipe to go on.')}</p>
          {:else if s.kind === 'trip'}
            {@const m = big(s)}
            {#if s.photo}<img class="photo" src={s.photo} alt={s.title} />{:else if m}<svg class="route" viewBox="0 0 {m.w} {m.h}" aria-hidden="true">{#each m.paths as p (p.id)}<path d={p.d} />{/each}</svg>{/if}
            <div class="cap">
              <h2>{s.title}</h2>
              <p class="num">{dates(s.start, s.end)}{#if s.km}{' '}· {num(s.km)} km{/if}</p>
              {#if s.note}<p class="nt">«{s.note}»</p>{/if}
            </div>
          {:else if s.kind === 'number'}
            <p class="big num">{num(s.value)}</p>
            <p class="lead">{s.key === 'days' ? tn(s.value, 'day on the way', 'days on the way') : t(NUM[s.key])}</p>
          {:else if s.kind === 'neu'}
            <h2>{t('New this year')}</h2>
            <ul class="neu">{#each s.items as it, n (n)}<li>{it}</li>{/each}</ul>
          {:else}
            <h2>{t('Thank you for this year')}</h2>
            <p class="lead">{t('Every trip made the next one easier.')}</p>
            <a class="btn-story" href="#/gelernt/{s.year}">{t('Read the year letter')}</a>
          {/if}
        </div>
      {/key}
    {/if}
  </div>
  <div class="nav">
    <button type="button" class="nb" aria-label={t('Back')} disabled={i <= 0} onclick={() => go(-1)}><ChevronLeft size={24} aria-hidden="true" /></button>
    <span class="num">{i + 1} / {slides.length}</span>
    <button type="button" class="nb" aria-label={t('Next|story')} disabled={i >= slides.length - 1} onclick={() => go(1)}><ChevronRight size={24} aria-hidden="true" /></button>
  </div>
</div>

<style>
  .story {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    background: var(--ink);
    color: var(--paper);
    outline: none;
    overflow: hidden;
    user-select: none;
  }
  .dashes {
    display: flex;
    gap: 4px;
    padding: max(10px, env(safe-area-inset-top)) 64px 0 14px;
  }
  .dashes i {
    flex: 1 1 0;
    height: 3px;
    border-radius: 2px;
    background: color-mix(in srgb, var(--paper) 28%, transparent);
  }
  .dashes i.on {
    background: var(--paper);
  }
  .close {
    position: absolute;
    top: max(2px, env(safe-area-inset-top));
    right: 8px;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  .stage {
    position: relative;
    flex: 1 1 auto;
    min-height: 0;
    display: grid;
    place-items: center;
    cursor: pointer;
    touch-action: pan-y;
  }
  .slide {
    position: relative;
    width: min(560px, 100%);
    height: 100%;
    box-sizing: border-box;
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 14px;
    text-align: center;
    animation: fade 0.35s ease;
  }
  @keyframes fade {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .slide {
      animation: none;
    }
  }
  h1 {
    margin: 0;
    font: 700 var(--fs-display) / 1.1 var(--font-body);
    overflow-wrap: break-word;
  }
  h2 {
    margin: 0;
    font: 700 var(--fs-page) / 1.15 var(--font-body);
    overflow-wrap: break-word;
  }
  .kick,
  .hint {
    margin: 0;
    opacity: 0.7;
    font-size: var(--fs-small);
  }
  .lead {
    margin: 0;
    font-size: var(--fs-sub);
    opacity: 0.9;
  }
  .big {
    margin: 0;
    font: 700 var(--fs-display) / 1 var(--font-body);
  }
  .years {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
  }
  .yb {
    min-width: 64px;
    min-height: 44px;
    border: 1px solid color-mix(in srgb, var(--paper) 40%, transparent);
    border-radius: 999px;
    background: transparent;
    color: inherit;
    font: 600 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .yb[aria-pressed='true'] {
    background: var(--paper);
    color: var(--ink);
  }
  .trip {
    justify-content: flex-end;
  }
  .trip.bare {
    justify-content: center;
  }
  .photo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
  }
  .trip:has(.photo)::after {
    content: '';
    position: absolute;
    inset: 40% 0 0;
    background: linear-gradient(transparent, color-mix(in srgb, var(--ink) 80%, transparent));
    z-index: 0;
  }
  .route {
    width: min(78vw, 46vh, 420px);
    height: auto;
    margin: auto 0 0;
  }
  .route path {
    fill: none;
    stroke: var(--accent-soft);
    stroke-width: 4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .cap {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-bottom: 8px;
  }
  .cap p {
    margin: 0;
  }
  .nt {
    font-style: italic;
    opacity: 0.9;
  }
  .neu {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: var(--fs-sub);
  }
  .btn-story {
    display: inline-flex;
    align-items: center;
    min-height: 48px;
    padding: 0 22px;
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font-weight: 600;
    text-decoration: none;
  }
  .nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
    padding: 6px 0 max(10px, env(safe-area-inset-bottom));
    font-size: var(--fs-small);
    opacity: 0.85;
  }
  .nb {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border: 0;
    border-radius: 999px;
    background: color-mix(in srgb, var(--paper) 12%, transparent);
    color: inherit;
    cursor: pointer;
  }
  .nb:disabled {
    opacity: 0.3;
    cursor: default;
  }
</style>
