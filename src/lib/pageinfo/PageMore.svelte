<script>
  /**
   * «Inhalte Flow» IF1 + IF2 (Noah 14.10.2026 «1b 3a», mockups approved 04:32): at the end of a page
   *   - the fold «What the app can do here» (closed; IF2 shows it open), each row opens the place;
   *   - the tiles «Next»: places in the app, links outside with ↗ and the site's name, own links, and the
   *     empty tile «+ Own link».
   * When the tip line is not on the page (tips off, hidden today), a quiet «Tips for this page ›» here
   * still opens the tips. page: a key of PAGES; name: the page's name; base, act: for the hrefs.
   */
  import { Lightbulb, ChevronDown, ExternalLink, Plus, X, Activity, Star, Bike, Moon, Heart, Calendar, Music, Trophy, Link } from '@lucide/svelte';
  import TipsSheet from './TipsSheet.svelte';
  import { pageInfo } from './store.svelte.js';
  import { PAGES, canRows, canShown, setCan, tilesOf, tipOfDay, addLink, removeLink, ownLinks, MAX_OWN } from '../pageinfo.js';
  import { backClose } from '../ui/backclose.js';
  import { localDay } from '../localday.js';
  import { t, tn } from '../i18n.svelte.js';

  let { page, name, base = '', act = '', open = false } = $props();
  const ICON = { goals: Activity, star: Star, bike: Bike, moon: Moon, heart: Heart, pulse: Activity, calendar: Calendar, music: Music, trophy: Trophy, link: Link };
  const pi = pageInfo();
  const today = localDay();
  const rows = $derived(canRows(page, base));
  const tiles = $derived(tilesOf(pi.info, page, { base, act }));
  const canAdd = $derived(ownLinks(pi.info, page).length < MAX_OWN);
  const noTip = $derived(pi.loaded && !tipOfDay(pi.info, page, today) && PAGES[page]?.tips?.length);

  let tipsOpen = $state(false);
  let adding = $state(false);
  let dialog = $state();
  let title = $state('');
  let url = $state('');
  let error = $state('');
  $effect(() => {
    if (adding && dialog && !dialog.open) dialog.showModal();
  });
  function startAdd() {
    title = '';
    url = '';
    error = '';
    adding = true;
  }
  function save(e) {
    e.preventDefault();
    const next = addLink(pi.info, page, title, url);
    if (!next) return (error = t('Enter a web address, for example strava.com'));
    pi.save(next);
    dialog.close();
  }
</script>

{#if pi.loaded && rows.length && canShown(pi.info, page)}
  <details class="card can" data-section="can" {open}>
    <summary>
      <Lightbulb size={18} aria-hidden="true" />
      <span><b>{t('What the app can do here')}</b> · {tn(rows.length, '{n} thing|can', '{n} things|can')}</span>
      <ChevronDown class="chev" size={18} aria-hidden="true" />
    </summary>
    <ul>
      {#each rows as r (r.id)}
        <li><a href={r.href} data-can={r.id}><b>{t(r.title)}</b><small>{t(r.sub)}</small></a></li>
      {/each}
    </ul>
    <button type="button" class="lk" onclick={() => pi.save(setCan(pi.info, page, false))}>{t('Hide this line')}</button>
  </details>
{/if}

<section class="next" aria-labelledby="next-h-{page}" data-section="next">
  <h2 id="next-h-{page}" class="kick">{t('Next|more')}</h2>
  <div class="tiles">
    {#each tiles as x (x.id)}
      {@const I = ICON[x.icon] ?? Link}
      {#if x.own}
        <button type="button" class="card tile own" data-tile={x.id} onclick={startAdd}>
          <I size={18} aria-hidden="true" />
          <b>{t(x.title)}</b><small>{t(x.sub)}</small>
        </button>
      {:else if x.out}
        <span class="wrap">
          <a class="card tile" href={x.out} target="_blank" rel="noopener noreferrer" data-tile={x.id}>
            <I size={18} aria-hidden="true" /><ExternalLink class="out" size={14} aria-label={t('opens outside the app')} />
            <b>{x.mine ? x.title : t(x.title)}</b>{#if x.sub}<small>{t(x.sub)}</small>{/if}<small class="dom">{x.domain}</small>
          </a>
          {#if x.mine}<button type="button" class="rm" aria-label={t('Remove the link {name}', { name: x.title })} onclick={() => pi.save(removeLink(pi.info, page, x.id))}><X size={14} aria-hidden="true" /></button>{/if}
        </span>
      {:else}
        <a class="card tile" href={x.href} data-tile={x.id}>
          <I size={18} aria-hidden="true" />
          <b>{t(x.title)}</b><small>{t(x.sub)}</small>
        </a>
      {/if}
    {/each}
    {#if canAdd && !tiles.some((x) => x.own)}
      <button type="button" class="tile add" data-tile="add" onclick={startAdd}><Plus size={18} aria-hidden="true" />{t('Own link')}</button>
    {/if}
  </div>
  {#if noTip}<button type="button" class="lk tipsl" onclick={() => (tipsOpen = true)}>{t('Tips for this page ›')}</button>{/if}
</section>

{#if tipsOpen}<TipsSheet {page} {name} onclose={() => (tipsOpen = false)} />{/if}

{#if adding}
  <dialog class="sheet from-below addl" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => (adding = false)} aria-labelledby="addl-h" data-sheet="own-link">
    <form onsubmit={save} novalidate>
      <div class="head">
        <h2 id="addl-h">{t('Own link')}</h2>
        <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
      </div>
      <label class="lbl" for="addl-t">{t('Name')}</label>
      <input id="addl-t" class="inp" bind:value={title} maxlength="60" autocomplete="off" />
      <label class="lbl" for="addl-u">{t('Address')}</label>
      <input id="addl-u" class="inp" type="url" inputmode="url" bind:value={url} placeholder="https://" autocomplete="off" oninput={() => (error = '')} />
      {#if error}<p class="err" role="alert">{error}</p>{/if}
      <div class="foot">
        <button type="submit" class="btn hi">{t('Save')}</button>
        <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      </div>
    </form>
  </dialog>
{/if}

<style>
  .can {
    padding: 0;
  }
  summary {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    padding: 10px 16px;
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary span {
    flex: 1;
    min-width: 0;
  }
  summary :global(.chev) {
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  details[open] summary :global(.chev) {
    transform: rotate(180deg);
  }
  .can ul {
    list-style: none;
    margin: 0;
    padding: 0 16px;
  }
  .can li a {
    display: grid;
    gap: 2px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
    color: var(--ink);
    text-decoration: none;
  }
  .can li small,
  .tile small {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .lk {
    min-height: 44px;
    border: 0;
    padding: 8px 16px 12px;
    background: none;
    color: var(--ink-3);
    font: inherit;
    font-size: var(--fs-small);
    text-decoration: underline;
    cursor: pointer;
  }
  .next {
    display: grid;
    gap: 10px;
  }
  .kick {
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--sp-3);
  }
  .wrap {
    position: relative;
    display: grid;
  }
  .tile {
    position: relative;
    display: grid;
    align-content: start;
    gap: 4px;
    min-height: 88px;
    padding: 12px 14px;
    border: 0;
    color: var(--ink);
    font: inherit;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }
  .tile:hover {
    background: var(--paper-2);
  }
  .tile > :global(svg:first-child) {
    color: var(--ink-2);
  }
  .tile :global(.out) {
    position: absolute;
    top: 12px;
    right: 12px;
    color: var(--ink-3);
  }
  .tile b {
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .tile .dom {
    margin-top: 2px;
  }
  .own {
    border: 1px dashed var(--line);
  }
  .add {
    display: grid;
    place-items: center;
    align-content: center;
    gap: 4px;
    border: 1px dashed var(--line);
    border-radius: var(--radius-card);
    background: none;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .rm {
    position: absolute;
    right: 4px;
    bottom: 4px;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .tipsl {
    justify-self: start;
    padding: 4px 0;
  }
  .addl {
    width: min(440px, calc(100vw - 24px));
  }
  .addl form {
    display: grid;
    gap: 6px;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .head h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .ib {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .err {
    margin: 4px 0 0;
    font-size: var(--fs-small);
    color: var(--bad);
  }
  .foot {
    display: flex;
    gap: 8px;
    margin-top: 10px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  @media (max-width: 719px) {
    .tiles {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
