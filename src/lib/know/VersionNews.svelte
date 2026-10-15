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
   */
  import { shortVersion, iconOf, boxLabel } from '../whatsnew.js';
  import { openData } from '../nav.js';
  import { t, locale } from '../i18n.svelte.js';
  import { ChevronRight, Star, Check, Save, Palette, Sparkles, User, Inbox, StickyNote, Wrench, Bike, Shirt, Package, Activity, BookOpen, Blocks, Copy, Backpack, Route, Compass, Sun } from '@lucide/svelte';

  let { e, card = false, level = 3, top = false, onnav = null, extra = null, id = undefined } = $props();
  const ICON = { star: Star, check: Check, save: Save, palette: Palette, sparkles: Sparkles, user: User, inbox: Inbox, note: StickyNote, wrench: Wrench, bike: Bike, shirt: Shirt, box: Package, activity: Activity, book: BookOpen, blocks: Blocks, copy: Copy, pack: Backpack, route: Route, compass: Compass, sun: Sun };
  const day = (iso, o) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), o);
  const when = $derived(top ? t('New · {date}', { date: day(e.date, { day: 'numeric', month: 'short', year: 'numeric' }) }) : day(e.date, { day: 'numeric', month: 'short' }));
  function go(p, ev) {
    onnav?.(p, ev);
    if (p.action !== 'data') return;
    ev.preventDefault();
    openData();
  }
</script>

<article class="vn" class:card data-version={e.version} aria-labelledby={id}>
  <div class="vn-h"><span class="vn-badge num">{shortVersion(e.version)}</span><small>{when}</small></div>
  <svelte:element this={`h${level}`} class="vn-t" {id}>{t(e.title)}</svelte:element>
  {#if e.lead}<p class="vn-ld">{t(e.lead)}</p>{/if}
  <ul class="vn-pts" class:panel={!card}>
    {#each e.points as p (p.text)}
      {@const Icon = ICON[iconOf(p)] ?? Sparkles}
      <li>
        {#if p.href}
          <a class="vn-row" href={p.href} onclick={(ev) => go(p, ev)}><span class="vn-ib" aria-hidden="true"><Icon size={16} /></span><span class="vn-x">{t(p.text)}</span><ChevronRight class="vn-chev" size={16} aria-hidden="true" /></a>
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
          {#if s.href}<a href={s.href} onclick={(ev) => go(s, ev)}>{t(s.text)}</a>{:else}<span>{t(s.text)}</span>{/if}
        </li>
      {/each}
    </ul>
  {/if}
  {@render extra?.()}
</article>

<style>
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
