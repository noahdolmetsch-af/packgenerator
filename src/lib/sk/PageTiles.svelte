<script>
  /**
   * SK «Seiten-Kacheln» (SK1–SK8, SKX4; Noah 13.10.2026): the tile row at the very end of a page, no
   * heading. Each tile: the page name and a short live hint; outside links carry the «opens elsewhere»
   * sign and open in a new tab. At most 7 tiles, sorted by use over 4 weeks, a tile moved by hand stays
   * (pin); then one empty «+» tile. «…» on a tile (on a phone also a long press): Ausblenden (Undo),
   * Nach vorne, Kacheln anpassen. A tile with nothing to say steps aside with a quiet line.
   * Everything is a suggestion; «Kacheln anpassen › Wie am Anfang» goes back.
   *
   * page: 'past' | 'debrief' | 'bikes' | 'gear' | 'flow' (pages.js SK_PAGES)
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { Plus, Pin, ExternalLink, EyeOff, ArrowUpLeft, SlidersHorizontal, ArrowDownWideNarrow, CircleDashed, Pencil } from '@lucide/svelte';
  import MoreActions from '../ui/MoreActions.svelte';
  import { arrange, skKey, normState, hideTile, pin, MAX_TILES } from './tiles.js';
  import { SK_PAGES, SK_PAGE_NAME, SK_NEEDS, hintsFor, tileUrl } from './pages.js';
  import { changePage, putPage, tapTile } from './store.js';
  import { skIcon } from './icons.js';
  import TileSheet from './TileSheet.svelte';
  import { soft } from '../home/SmallTile.svelte';
  import OwnLinkSheet from './OwnLinkSheet.svelte';
  import SkToast from './SkToast.svelte';
  import { newTrip } from '../nav.js';
  import { localDay } from '../localday.js';
  import { bikeActs } from '../kmbook.js';
  import { phone } from '../media.svelte.js';
  import { t, lang } from '../i18n.svelte.js';

  // extrasHint (Impeccable 18.10.2026, Velos 1): a quiet line that more tiles wait under «Add a tile»
  let { page, extrasHint = false } = $props();

  const today = localDay();
  // svelte-ignore state_referenced_locally
  const stateQ = liveQuery(() => db.settings.get(skKey(page)));
  // svelte-ignore state_referenced_locally
  const needs = SK_NEEDS[page] ?? [];
  // Paket 3: with the ride ledger also the Strava rides of «Training» (bikeActs), for the month's km
  const dataQ = liveQuery(async () => ({ ...Object.fromEntries(await Promise.all(needs.map(async (n) => [n, await db[n].toArray()]))), ...(needs.includes('kmBook') ? { acts: await bikeActs(db) } : {}) }));
  const cur = $derived(normState($stateQ?.value));
  const hints = $derived($dataQ ? hintsFor(page, $dataQ, today) : {});
  const arr = $derived(arrange(SK_PAGES[page] ?? [], cur, hints, today));
  const name = $derived(t(SK_PAGE_NAME[page] ?? ''));

  let sheet = $state(null); // 'add' | 'edit' | null
  let editOwn = $state(null); // an own tile being changed
  let note = $state(null);
  const menus = {};

  const label = (d) => (d.own ? d.label : t(d.label));
  const sub = (d) => (d.own ? t('your link') : hints[d.id]?.text ?? '');
  const hrefOf = (d) => (d.own ? d.url : d.url ? tileUrl(d, lang.v) : hints[d.id]?.href ?? d.href ?? '#');
  const change = (fn) => changePage(page, fn);

  function hide(d) {
    const before = $state.snapshot(cur);
    change((s) => hideTile(s, d.id));
    note = { text: t('«{name}» hidden', { name: label(d) }), undo: () => putPage(page, before) };
  }
  function open(e, d) {
    if (pressed) {
      // a long press opened the menu: no tap
      e.preventDefault();
      pressed = false;
      return;
    }
    tapTile(page, d.id);
    if (d.run === 'newtrip') {
      e.preventDefault();
      newTrip('last');
    } else if (d.spot) {
      e.preventDefault();
      document.getElementById(d.spot)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  // SK6: on a phone a long press on a tile opens its «…» menu
  let timer = null;
  let pressed = false;
  function down(e, d) {
    if (e.pointerType !== 'touch') return;
    pressed = false;
    clearTimeout(timer);
    timer = setTimeout(() => {
      pressed = true;
      navigator.vibrate?.(10);
      menus[d.id]?.show();
    }, 550);
  }
  const up = () => clearTimeout(timer);
  const actions = (d, i) => [
    { name: t('Hide'), explain: t('Comes back via «Adjust tiles»'), icon: EyeOff, run: () => hide(d) },
    ...(i > 0 ? [{ name: t('To the front'), explain: t('Stays there (pinned)'), icon: ArrowUpLeft, run: () => change((s) => pin(s, d.id, 0)) }] : []),
    ...(d.own ? [{ name: t('Change link'), icon: Pencil, run: () => (editOwn = d) }] : []),
    { name: t('Adjust tiles'), icon: SlidersHorizontal, run: () => (sheet = 'edit') },
  ];
  function saveOwn(d, link) {
    change((s) => ({ ...s, own: s.own.map((o) => (o.id === d.id ? { ...o, url: link.url, name: link.name } : o)) }));
  }
</script>

<!-- drawn once the data is there: a «quiet» tile leaves the grid then, so the order does not jump under a tap -->
{#if SK_PAGES[page] && $dataQ}
  <section class="sk" data-sk={page} aria-label={t('More pages')}>
    <ul class="sk-grid">
      {#each arr.shown as d, i (d.id)}
        {@const Icon = skIcon(d.icon)}
        <li class="sk-t" data-sk-tile={d.id}>
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <a class="sk-a" href={hrefOf(d)} target={d.url ? '_blank' : null} rel={d.url ? 'noopener noreferrer' : null} onclick={(e) => open(e, d)} onpointerdown={(e) => down(e, d)} onpointerup={up} onpointercancel={up} onpointerleave={up} oncontextmenu={(e) => phone.matches && e.preventDefault()}>
            <span class="sk-ic" aria-hidden="true"><Icon size={18} /></span>
            <span class="sk-lb"><span class="sk-w">{#each soft(label(d)) as p, n (n)}<span>{p.replace(/\.(?=\w)/g, '.\u200b')}</span>{/each}</span>{#if d.url}<ExternalLink class="sk-ext" size={14} aria-hidden="true" /><span class="sr">{t('(opens elsewhere)')}</span>{/if}</span>
            {#if sub(d)}<span class="sk-su">{sub(d)}</span>{/if}
          </a>
          <span class="sk-tools">
            {#if Number.isInteger(cur.pins[d.id])}<span class="sk-pin" title={t('Pinned|tile')}><Pin size={14} aria-hidden="true" /><span class="sr">{t('Pinned|tile')}</span></span>{/if}
            <MoreActions bind:this={menus[d.id]} title={label(d)} label={t('More for {what}', { what: label(d) })} actions={actions(d, i)} />
          </span>
        </li>
      {/each}
      {#if arr.shown.length <= MAX_TILES}
        <li class="sk-t sk-plus">
          <button type="button" class="sk-a" data-sk-plus onclick={() => (sheet = 'add')}>
            <span class="sk-pl" aria-hidden="true"><Plus size={20} /></span>
            <span class="sk-plt">{t('Add a tile')}</span>
          </button>
        </li>
      {/if}
    </ul>
    <div class="sk-foot">
      <p class="sk-quiet">
        {#if extrasHint && arr.extras.length}<span data-sk-extras>{t('More tiles are under «Add a tile».')}</span>{/if}
        {#each arr.quiet as q (q.tile.id)}<span data-sk-quiet={q.tile.id}><CircleDashed size={14} aria-hidden="true" />{t('{name}: {what} · comes back by itself', { name: label(q.tile), what: q.text })}</span>{/each}
      </p>
      <p class="sk-right">
        {#if arr.byUse}<span class="sk-by"><ArrowDownWideNarrow size={14} aria-hidden="true" />{t('sorted by your use')}</span>{/if}
        <button type="button" class="sk-adj" data-sk-adjust onclick={() => (sheet = 'edit')}><SlidersHorizontal size={16} aria-hidden="true" />{t('Adjust tiles')}{#if arr.hidden.length}<span class="sk-n">{' · '}{t('{n} hidden', { n: arr.hidden.length })}</span>{/if}</button>
      </p>
    </div>
  </section>
  {#if sheet}<TileSheet {name} {arr} state={cur} {hints} mode={sheet} onchange={change} onclose={() => (sheet = null)} />{/if}
  {#if editOwn}{@const d = editOwn}<OwnLinkSheet title={t('Change link')} context={name} value={{ url: d.url, name: d.label }} onsave={(l) => saveOwn(d, l)} onremove={() => hide(d)} onclose={() => (editOwn = null)} />{/if}
  <SkToast bind:note />
{/if}

<style>
  .sk {
    margin: var(--sp-6, 24px) 0 0;
  }
  .sk-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  @media (max-width: 1099px) {
    .sk-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 719px) {
    .sk-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .sk-a {
      padding: 12px 10px 10px 12px;
    }
  }
  .sk-t {
    position: relative;
    min-width: 0;
  }
  .sk-a {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    width: 100%;
    height: 100%;
    min-height: 108px;
    padding: 14px 14px 12px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    color: var(--ink);
    font: 500 var(--fs-small)/1.25 var(--font-body);
    text-align: left;
    text-decoration: none;
    -webkit-touch-callout: none;
    user-select: none;
    cursor: pointer;
  }
  .sk-a:hover {
    background: var(--paper-2);
  }
  .sk-ic {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    margin-bottom: auto;
    padding-bottom: 0;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .sk-lb {
    display: block;
    margin-top: 14px;
    padding-right: 4px;
    font-weight: 600;
    font-size: var(--fs-body);
    overflow-wrap: break-word;
    min-width: 0;
    max-width: 100%;
  }
  .sk-w {
    min-width: 0;
    hyphens: manual;
  }
  .sk-lb :global(.sk-ext) {
    margin-left: 4px;
    vertical-align: -1px;
    color: var(--ink-3);
  }
  .sk-su {
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 400;
    line-height: 1.3;
    overflow-wrap: break-word;
    max-width: 100%;
  }
  .sk-tools {
    position: absolute;
    top: 6px;
    right: 6px;
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .sk-tools :global(.dots) {
    border-color: transparent;
    background: none;
  }
  .sk-pin {
    display: inline-grid;
    place-items: center;
    color: var(--ink-3);
  }
  .sk-plus .sk-a {
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 1px dashed var(--line-strong);
    background: none;
    box-shadow: none;
  }
  .sk-pl {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .sk-plt {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .sk-foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 16px;
    margin-top: 8px;
  }
  .sk-quiet {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sk-quiet span,
  .sk-by {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .sk-right {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 4px 16px;
    margin: 0 0 0 auto;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sk-adj {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: 500 var(--fs-small)/1.3 var(--font-body);
    cursor: pointer;
  }
  .sk-n {
    color: var(--ink-3);
  }
</style>
