<script>
  /**
   * «Bilder bei jeder Neuheit» PR 3 (Noah 23.11.2026 «1b 2a 3a 4b 5a»): the window of the card «N Neuheiten seit …»: the news since
   * `from` grouped by place (neuseitOrte.js), a group opens to one picture (with the slider before/after) and the line, each with
   * «Try it». The whole list stays under Ich › Was ist neu (the link at the end). It loads on the tap (home/NeuSeitCard.svelte),
   * so Today stays light.
   */
  import { backClose } from '../ui/backclose.js';
  import { t, locale } from '../i18n.svelte.js';
  import { X, ChevronRight, Star, Check, Save, Palette, Sparkles, User, Inbox, StickyNote, Wrench, Bike, Shirt, Package, Activity, BookOpen, Blocks, Copy, Backpack, Route, Compass, Sun } from '@lucide/svelte';
  import { iconOf } from '../whatsnew.js';
  import NewsBild from './NewsBild.svelte';
  import { goNews } from './newsRun.js';
  import { goOf, tryOf } from './newsgo.js';
  import TestRow from './TestRow.svelte';
  import { readResults } from './wasneuStore.js';
  import { compareVersions, shortVersion } from '../whatsnew.js';
  import { NEWS_HREF } from './wasneu.js';
  import { groupByPlace } from './neuseitOrte.js';
  import { localDay } from '../localday.js';
  import { dayWord } from './neuseit.js';
  import '../ui/daumen.css';
  import '../bikes/velo-dlg.css';

  // the same icons as the rows of Me › What is new (know/VersionNews.svelte), so the window looks like the rest of the app
  const ICON = { star: Star, check: Check, save: Save, palette: Palette, sparkles: Sparkles, user: User, inbox: Inbox, note: StickyNote, wrench: Wrench, bike: Bike, shirt: Shirt, box: Package, activity: Activity, book: BookOpen, blocks: Blocks, copy: Copy, pack: Backpack, route: Route, compass: Compass, sun: Sun };
  // «Testrunde» (Noah 27.11.2026): view 'version' (from the card on Today) lists every news since `from` one by one with its PR, all
  // its test steps and «Works» / «Does not work»; view 'place' is the list by place, as before. A switch at the top changes between them.
  let { from = null, view = 'place', onclose } = $props();
  const VERSION_MAX = 30;
  let dialog;
  // svelte-ignore state_referenced_locally
  let mode = $state(view === 'version' ? 'version' : 'place');
  let groups = $state(null); // null while the whole list loads
  let rows = $state([]); // the releases since `from`, newest first
  let prOf = $state(() => null);
  let results = $state(readResults());
  $effect(() => {
    const again = () => (results = readResults());
    window.addEventListener('pg:tested', again);
    return () => window.removeEventListener('pg:tested', again);
  });
  const day = (iso) => {
    const w = dayWord(iso, localDay());
    return w ? (w === 'today' ? t('today|news') : t('yesterday|news')) : new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
  };

  $effect(() => {
    dialog.showModal();
    import('../whatsnew-all.js').then((m) => {
      groups = groupByPlace(m.WHATS_NEW, from);
      prOf = m.prOf;
      rows = m.WHATS_NEW.filter((e) => from == null || compareVersions(e.version, from) > 0);
    });
  });
  function go(p, ev) {
    dialog.close();
    goNews(p, ev);
  }
  function showRelease(e) {
    const r = tryOf(e);
    dialog.close();
    if (r) goNews(r.p);
    else location.hash = NEWS_HREF;
  }
</script>

<dialog class="sheet from-below nss" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="nss-h" data-neu-seit-sheet>
  <div class="head">
    <h2 id="nss-h">{mode === 'version' ? t('News by update') : t('News by place')}</h2>
    <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <div class="nss-sw" role="group" aria-label={t('Show')}>
    <button type="button" class="vd-chip sw-b" aria-pressed={mode === 'version'} onclick={() => (mode = 'version')} data-nss-mode="version">{t('By update')}</button>
    <button type="button" class="vd-chip sw-b" aria-pressed={mode === 'place'} onclick={() => (mode = 'place')} data-nss-mode="place">{t('By place')}</button>
  </div>
  {#if !groups}
    <p class="muted">{t('Loading…')}</p>
  {:else if mode === 'version'}
    <ol class="vl" data-nss-versions>
      {#each rows.slice(0, VERSION_MAX) as e (e.version)}
        <li class="vi" data-nss-release={e.version}>
          <b class="vt">{t(e.title)}</b>
          <small class="vp num">{prOf(e) ? t('PR {n}', { n: prOf(e) }) + ' · ' : ''}{t('Version {v}', { v: shortVersion(e.version) })} · {day(e.date)}</small>
          {#if e.lead}<p class="vd">{t(e.lead)}</p>{/if}
          <TestRow {e} pr={prOf(e)} result={results.get(e.version)?.result ?? null} onshow={() => showRelease(e)} />
        </li>
      {/each}
    </ol>
    {#if rows.length > VERSION_MAX}<p class="all">{t('{n} more are in the whole list.', { n: rows.length - VERSION_MAX })}</p>{/if}
    <p class="all"><a href={NEWS_HREF} onclick={() => dialog.close()}>{t('Everything under Me › What is new')}</a></p>
  {:else}
    {#each groups as g, i (g.key)}
      <details class="grp" data-group={g.key} open={i === 0}>
        <summary><b>{t(g.label)}</b><span class="cnt">{g.items.length}</span></summary>
        <ul>
          {#each g.items as it (it.id + '/' + it.line + it.version)}
            {@const Icon = ICON[iconOf(it.p)] ?? Sparkles}
            <li>
              {#if it.bild}
                <NewsBild id={it.id} line={it.line} vorher={it.bild.vorher} text={it.p.text} />
              {:else}
                <p class="tx"><span class="ib" aria-hidden="true"><Icon size={16} /></span><span>{t(it.p.text)}</span></p>
              {/if}
              <p class="meta"><span>{day(it.date)}</span>
                {#if goOf(it.p)}<a class="try" href={NEWS_HREF} onclick={(ev) => go(it.p, ev)}>{t('Try it')}<ChevronRight size={14} aria-hidden="true" /></a>{/if}
              </p>
            </li>
          {/each}
        </ul>
      </details>
    {/each}
    <p class="all"><a href={NEWS_HREF} onclick={() => dialog.close()}>{t('Everything under Me › What is new')}</a></p>
  {/if}
</dialog>

<style>
  .nss {
    width: min(480px, calc(100vw - 24px));
    max-height: 86dvh;
    overflow-y: auto;
  }
  .head {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--paper);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -6px -6px 0 0;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  /* every place is a card like the cards of Me › What is new; its lines are the rows on a soft panel (know/VersionNews.svelte) */
  .grp {
    margin: 10px 0 0;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    box-shadow: var(--card-shadow);
    background: var(--paper);
    overflow: hidden;
  }
  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 48px;
    padding: 0 14px;
    cursor: pointer;
  }
  .cnt {
    min-width: 28px;
    padding: 2px 9px;
    border-radius: 999px;
    background: var(--hi-soft);
    color: var(--hi);
    font-size: var(--fs-tiny);
    font-weight: 600;
    text-align: center;
  }
  ul {
    margin: 0 10px 10px;
    padding: 2px 14px;
    list-style: none;
    border-radius: 14px;
    background: var(--paper-2);
  }
  li {
    padding: 10px 0 2px;
  }
  li + li {
    border-top: 1px solid var(--line);
  }
  .tx {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin: 0;
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink-2);
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .try {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    margin-left: auto;
    color: var(--hi);
    font-weight: 600;
    text-decoration: none;
  }
  .try:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .all {
    margin: 12px 0 0;
    font-size: var(--fs-small);
  }
  .nss-sw {
    display: flex;
    gap: 8px;
    margin: 8px 0 0;
  }
  .vl {
    margin: 10px 0 0;
    padding: 0;
    list-style: none;
  }
  .vi {
    padding: 10px 0 4px;
    border-top: 1px solid var(--line);
  }
  .vt {
    display: block;
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .vp {
    display: block;
    margin-top: 2px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .vd {
    margin: 4px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
