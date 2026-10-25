<script>
  import { uiZoom, unzoomRect } from '../uizoom.js';
  /**
   * «Rundgang» (Noah 15.10.2026 12:36, «1a … 5a»): the running tour on top of the real page. The page
   * gets dark, one part of it is lit with an orange frame, the place in the navigation is marked, and a
   * small card says what it is: dots, «Step n of m», «Back», «Next», «End tour». Only watching (5a):
   * the page below does not react while the card is open. Esc ends the tour. The end card of the app tour
   * offers «End playground» when the tour ran in the playground. Steps and rules: lib/tour.js.
   */
  import { db } from '../db.js';
  import { endDemo } from '../demo.js';
  import { openTrip } from '../nav.js';
  import { phone } from '../media.svelte.js';
  import { t } from '../i18n.svelte.js';
  import { readRun, writeRun, stepAt, stepCount, nextRun, backRun, navSelector, cardSpot } from '../tour.js';
  import { TOUR_EVENT, END_EVENT } from './run.js';

  let run = $state(readRun());
  let rect = $state(null);
  let nav = $state(null);
  let card = $state();
  let primary = $state();
  let cardH = $state(240);
  let vw = $state(typeof innerWidth === 'number' ? innerWidth : 1024);
  let vh = $state(typeof innerHeight === 'number' ? innerHeight : 800);
  const step = $derived(run ? stepAt(run.id, run.step) : null);
  const count = $derived(run ? stepCount(run.id) : 0);
  const last = $derived(!!run && !!step && !step.end && run.step === count - 1);

  $effect(() => {
    const on = () => (run = readRun());
    window.addEventListener(TOUR_EVENT, on);
    return () => window.removeEventListener(TOUR_EVENT, on);
  });

  function set(next) {
    writeRun(next);
    run = next;
    if (!next) window.dispatchEvent(new Event(END_EVENT));
  }
  const end = () => set(null);

  /* find the lit part: open the page, then look for the first selector for a moment (the page loads) */
  let el = null;
  $effect(() => {
    const s = step;
    if (!s) return;
    rect = null;
    nav = null;
    el = null;
    if (s.prep === 'playTrip' && run?.play) openTrip('play-trip');
    if (s.prep === 'raceSample') openTrip('race-sample');
    if (location.hash !== s.href && !(s.href === '#/' && (location.hash === '' || location.hash === '#'))) location.hash = s.href;
    let tries = 0;
    let alive = true;
    const look = () => {
      if (!alive) return;
      const found = s.target.map((q) => [...document.querySelectorAll(q)].find((x) => x.getBoundingClientRect().height > 0)).find(Boolean);
      if (found || ++tries > 30) {
        el = found ?? null;
        if (el) {
          el.scrollIntoView({ block: 'start' });
          window.scrollBy(0, -120);
        }
        requestAnimationFrame(measure);
        return;
      }
      setTimeout(look, 100);
    };
    setTimeout(look, 150);
    return () => (alive = false);
  });

  function measure() {
    if (!step) return;
    const z = uiZoom(); // «Grösse»: everything in the page's own pixels
    vw = innerWidth / z;
    vh = innerHeight / z;
    if (el?.isConnected) {
      const r = unzoomRect(el.getBoundingClientRect(), z);
      // the lit part never reaches under the card (at the bottom on the phone, below it on the computer)
      const room = phone.matches ? vh - r.y - cardH - 110 : vh - r.y - cardH - 44;
      rect = { x: r.x, y: r.y, width: r.width, height: Math.max(48, Math.min(r.height, room)) };
    } else rect = null;
    const n = [...document.querySelectorAll(navSelector(step.place))].find((x) => x.getBoundingClientRect().height > 0);
    const nr = n && unzoomRect(n.getBoundingClientRect(), z);
    nav = nr ? { x: nr.x, y: nr.y, width: nr.width, height: nr.height } : null;
  }
  $effect(() => {
    if (!step) return;
    let raf = 0;
    const again = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    addEventListener('resize', again);
    addEventListener('scroll', again, true);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('resize', again);
      removeEventListener('scroll', again, true);
    };
  });
  $effect(() => {
    if (card) cardH = card.offsetHeight;
    if (step && primary) primary.focus({ preventScroll: true });
  });

  const spot = $derived(step?.end ? { mode: 'middle' } : cardSpot(rect, { width: vw, height: vh, phone: phone.matches, card: cardH }));
  const cardStyle = $derived(spot.mode === 'below' || spot.mode === 'above' ? `top:${spot.top}px;left:${spot.left}px` : '');

  function key(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      end();
    } else if (e.key === 'ArrowRight') set(nextRun(run));
    else if (e.key === 'ArrowLeft') set(backRun(run));
  }
  async function endPlay() {
    end();
    await endDemo(db);
    location.hash = '#/';
    location.reload();
  }
</script>

{#if step}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="tour" data-tour={run.id} data-step={run.step} onkeydown={key}>
    {#if rect}
      <div class="lit" style="left:{rect.x - 8}px;top:{rect.y - 8}px;width:{rect.width + 16}px;height:{rect.height + 16}px"></div>
    {:else}
      <div class="dim"></div>
    {/if}
    {#if nav}<div class="navmark" style="left:{nav.x - 4}px;top:{nav.y - 4}px;width:{nav.width + 8}px;height:{nav.height + 8}px"></div>{/if}
    <div class="tcard {spot.mode}" style={cardStyle} bind:this={card} role="dialog" aria-modal="true" aria-labelledby="tour-h" aria-describedby="tour-p">
      <div class="top">
        {#if !step.end}
          <span class="dots" aria-hidden="true">{#each Array(count) as _, i (i)}<span class:on={i <= run.step} class:now={i === run.step}></span>{/each}</span>
          <span class="n">{t('Step {n} of {of}', { n: run.step + 1, of: count })}</span>
        {:else}
          <span class="n">{t('Tour|short')}</span>
        {/if}
      </div>
      <h2 id="tour-h">{t(step.title)}</h2>
      <p id="tour-p">{t(step.text)}</p>
      {#if step.end && run.play}<p class="small">{t('The example trip goes away when you end the playground. Your data is then exactly as before.')}</p>{/if}
      <div class="acts">
        {#if step.end}
          {#if run.play}
            <button type="button" class="btn sm" onclick={end}>{t('Keep playing')}</button>
            <button type="button" class="btn sm hi" bind:this={primary} onclick={endPlay}>{t('End playground')}</button>
          {:else}
            <button type="button" class="btn sm hi" bind:this={primary} onclick={end}>{t('Close|tour')}</button>
          {/if}
        {:else}
          <button type="button" class="lk" onclick={end}>{t('End tour')}</button>
          {#if run.step > 0}<button type="button" class="btn sm" onclick={() => set(backRun(run))}>{t('Back|tour')}</button>{/if}
          <button type="button" class="btn sm hi" bind:this={primary} onclick={() => set(nextRun(run))}>{last ? t('Done ›|tour') : t('Next ›|tour')}</button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .tour {
    position: fixed;
    inset: 0;
    z-index: 60;
  }
  .lit {
    position: fixed;
    border-radius: 16px;
    box-shadow: 0 0 0 9999px var(--scrim);
    outline: 3px solid var(--hi);
    outline-offset: 2px;
    transition:
      left 0.2s,
      top 0.2s,
      width 0.2s,
      height 0.2s;
  }
  .dim {
    position: fixed;
    inset: 0;
    background: var(--scrim);
  }
  .navmark {
    position: fixed;
    border-radius: 14px;
    outline: 3px solid var(--hi);
    pointer-events: none;
  }
  .tcard {
    position: fixed;
    box-sizing: border-box;
    width: min(380px, calc(calc(100vw / var(--ui-zoom, 1)) - 32px));
    background: var(--paper);
    color: var(--ink);
    border-radius: 18px;
    padding: 18px 18px 14px;
    box-shadow: 0 12px 40px var(--shadow);
  }
  .tcard.middle {
    left: 50%;
    top: 30%;
    transform: translateX(-50%);
  }
  .tcard.bottom {
    left: 16px;
    right: 16px;
    width: auto;
    bottom: calc(92px + env(safe-area-inset-bottom));
  }
  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .dots span {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 4px;
    margin-right: 4px;
    background: var(--line);
  }
  .dots span.on {
    background: var(--hi);
  }
  .dots span.now {
    width: 18px;
  }
  .n {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  h2 {
    font-size: var(--fs-sub);
    margin: 0 0 6px;
  }
  p {
    margin: 0 0 14px;
    color: var(--ink-2);
    line-height: 1.45;
  }
  p.small {
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .acts .btn {
    white-space: nowrap;
  }
  .lk {
    margin-right: auto;
    min-height: 44px;
    background: none;
    border: 0;
    padding: 0;
    color: var(--ink-3);
    text-decoration: underline;
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
</style>
