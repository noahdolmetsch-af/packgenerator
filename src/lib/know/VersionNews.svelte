<script>
  /**
   * v0.118.0 «Was ist neu 2» (mockups W1–W2, Noah 13.10.2026 «w1-w3 freigeben», answers 1a 2a 4a): one
   * version as people read it: the version badge and the day, its own title, one sentence, the main
   * points as rows with a picture and › (each leads to its place) and the small things in their boxes
   * (New, Nicer, Fixed, Faster), one short line each, also leading to their place when they have one.
   * Used by Ich › Was ist neu (pages/WasNeu.svelte, `card` on: a white card; off: the rows on a soft panel).
   * The window after an update (know/NewsSheet.svelte) is a banner on Today since v0.127.0 A-U1.
   *
   *   <VersionNews e={entry} card level={3} onnav={(p, ev) => …}>{#snippet extra()}buttons{/snippet}</VersionNews>
   *
   * onnav(p, ev) runs before a line's link opens (the window closes itself; a line for «Data and backup»
   * opens that window instead of an address).
   * «Ausprobieren» (Noah 27.10.2026 «1a»): every line leads to its exact place (know/newsgo.js, newsRun.js):
   * the page, then the window or fold, and the spot glows.
   */
  import { shortVersion, iconOf, boxLabel } from '../whatsnew.js';
  import { goOf, hrefOf } from './newsgo.js';
  import { goNews } from './newsRun.js';
  import { t, locale } from '../i18n.svelte.js';
  import { newsWhen } from './neudatum.js';
  import { ChevronRight, Star, Check, Save, Palette, Sparkles, User, Inbox, StickyNote, Wrench, Bike, Shirt, Package, Activity, BookOpen, Blocks, Copy, Backpack, Route, Compass, Sun } from '@lucide/svelte';

  let { e, card = false, level = 3, top = false, onnav = null, extra = null, id = undefined } = $props();
  const ICON = { star: Star, check: Check, save: Save, palette: Palette, sparkles: Sparkles, user: User, inbox: Inbox, note: StickyNote, wrench: Wrench, bike: Bike, shirt: Shirt, box: Package, activity: Activity, book: BookOpen, blocks: Blocks, copy: Copy, pack: Backpack, route: Route, compass: Compass, sun: Sun };
  // Warteliste 3 (Noah «2a und Uhrzeit»): every entry shows the full day with the weekday, and the time of the merge where it is known
  const full = $derived(newsWhen(e.date, e.time, locale()));
  const when = $derived(top ? t('New · {date}', { date: full }) : full);
  // «1b»: the picture of an entry loads only after a tap (nothing when the page opens); without the internet a short note stands there
  let pic = $state(false);
  let big = $state(false);
  let failed = $state(0);
  const base = import.meta.env.BASE_URL ?? '/';
  function go(p, ev) {
    onnav?.(p, ev);
    goNews(p, ev);
  }
  // a line with only «where it shows up» still is a link (its tap shows the line)
  const linkOf = (p) => hrefOf(goOf(p)) ?? (goOf(p) ? '#/me/news' : null);
</script>

<article class="vn" class:card data-version={e.version} aria-labelledby={id}>
  <div class="vn-h"><span class="vn-badge num">{shortVersion(e.version)}</span><small>{when}</small></div>
  <svelte:element this={`h${level}`} class="vn-t" {id}>{t(e.title)}</svelte:element>
  {#if e.lead}<p class="vn-ld">{t(e.lead)}</p>{/if}
  <ul class="vn-pts" class:panel={!card}>
    {#each e.points as p (p.text)}
      {@const Icon = ICON[iconOf(p)] ?? Sparkles}
      <li>
        {#if linkOf(p)}
          <a class="vn-row" href={linkOf(p)} onclick={(ev) => go(p, ev)}><span class="vn-ib" aria-hidden="true"><Icon size={16} /></span><span class="vn-x">{t(p.text)}</span><ChevronRight class="vn-chev" size={16} aria-hidden="true" /></a>
        {:else}
          <div class="vn-row"><span class="vn-ib" aria-hidden="true"><Icon size={16} /></span><span class="vn-x">{t(p.text)}</span></div>
        {/if}
      </li>
    {/each}
  </ul>
  {#if e.small?.length}
    <ul class="vn-small">
      {#each e.small as s (s.text)}
        <li data-box={s.box}>
          <span class="vn-kt" class:fix={s.box === 'fixed'}>{t(boxLabel(s.box))}</span>
          {#if linkOf(s)}<a href={linkOf(s)} onclick={(ev) => go(s, ev)}>{t(s.text)}</a>{:else}<span>{t(s.text)}</span>{/if}
        </li>
      {/each}
    </ul>
  {/if}
  {#if e.image}
    <div class="vn-pic">
      <button type="button" class="vn-picbtn" aria-expanded={pic} onclick={() => { pic = !pic; failed = 0; big = false; }} data-news-pic={e.version}>{pic ? t('Hide picture') : t('Show picture')}</button>
      {#if pic}
        <figure class="vn-fig" class:big data-news-figure>
          {#each [e.imageBefore ? { src: e.imageBefore, cap: t('Before|picture') } : null, { src: e.image, cap: e.imageBefore ? t('After|picture') : '' }].filter(Boolean) as p (p.src)}
            <div class="vn-fi">
              {#if failed}
                <p class="vn-off" role="status">{t('Picture only with internet')}</p>
              {:else}
                <button type="button" class="vn-zoom" onclick={() => (big = !big)} aria-label={t('Enlarge the picture')}><img src={base + p.src} alt={t('Picture of «{title}»', { title: t(e.title) })} loading="lazy" onerror={() => failed++} /></button>
              {/if}
              {#if p.cap}<figcaption>{p.cap}</figcaption>{/if}
            </div>
          {/each}
        </figure>
      {/if}
    </div>
  {/if}
  {@render extra?.()}
</article>

<style>
  .vn-picbtn {
    min-height: 44px;
    margin: 4px 0 0;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--hi);
    font: 600 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .vn-fig {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 4px 0 8px;
  }
  .vn-fig:not(.big) .vn-fi {
    flex: 1 1 140px;
    max-width: 240px;
  }
  .vn-fig.big .vn-fi {
    flex: 1 1 100%;
    max-width: 100%;
  }
  .vn-zoom {
    display: block;
    width: 100%;
    padding: 0;
    border: 1px solid var(--card-line);
    border-radius: 10px;
    overflow: hidden;
    background: var(--paper);
    cursor: zoom-in;
  }
  .vn-zoom img {
    display: block;
    width: 100%;
    height: auto;
  }
  .vn-fi figcaption,
  .vn-off {
    margin: 4px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .vn {
    min-width: 0;
    padding: 14px 0 6px;
    border-top: 1px solid var(--line);
  }
  .vn:first-child {
    border-top: 0;
    padding-top: 4px;
  }
  .vn.card {
    padding: 14px 16px 12px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    box-shadow: var(--card-shadow);
    background: var(--paper);
  }
  .vn-h {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .vn-h small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .vn-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 9px;
    border-radius: 999px;
    background: var(--hi-soft);
    color: var(--hi);
    font-size: var(--fs-tiny);
    font-weight: 600;
  }
  .vn-t {
    margin: 6px 0 4px;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
    color: var(--ink);
    letter-spacing: -0.01em;
    overflow-wrap: break-word;
  }
  .vn-ld {
    margin: 0 0 8px;
    color: var(--ink-2);
    line-height: 1.45;
    overflow-wrap: break-word;
  }
  .vn-pts {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .vn-pts.panel {
    padding: 2px 14px;
    border-radius: 14px;
    background: var(--paper-2);
  }
  .vn-pts > li + li {
    border-top: 1px solid var(--line);
  }
  .vn-row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 48px;
    padding: 6px 0;
    box-sizing: border-box;
    color: var(--ink);
    text-decoration: none;
  }
  a.vn-row:hover .vn-x {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .vn-ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: var(--r-ctl);
    background: var(--line);
    color: var(--ink-2);
  }
  .vn.card .vn-ib {
    background: var(--paper-2);
  }
  .vn-x {
    flex: 1;
    min-width: 0;
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .vn-row :global(.vn-chev) {
    flex: none;
    color: var(--ink-3);
  }
  .vn-small {
    list-style: none;
    margin: 8px 0 2px;
    padding: 0;
    display: grid;
    /* 0.136.0: one column for the labels (Neu, Schöner, Repariert), so every text starts at the same place */
    grid-template-columns: max-content minmax(0, 1fr);
    gap: 6px 10px;
  }
  .vn-small li {
    display: grid;
    grid-template-columns: subgrid;
    grid-column: 1 / -1;
    align-items: baseline;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .vn-small a,
  .vn-small span:last-child {
    min-width: 0;
    color: var(--ink-3);
  }
  .vn-small a {
    flex: 1;
    text-decoration: none;
  }
  /* a phone: each small line is a whole 44 px row to tap */
  @media (pointer: coarse) {
    .vn-small {
      row-gap: 0;
    }
    .vn-small a {
      display: flex;
      align-items: center;
      min-height: 44px;
    }
  }
  .vn-small a:hover {
    color: var(--ink);
    text-decoration: underline;
  }
  .vn-kt {
    justify-self: start;
    padding: 2px 9px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    font-weight: 600;
  }
  .vn-kt.fix {
    background: var(--warn-soft);
    color: var(--warn);
  }
</style>
