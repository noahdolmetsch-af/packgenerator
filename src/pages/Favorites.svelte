<script>
  import { UNDO_MS } from '../lib/ui/undo.js';
  /**
   * All my favourite things (v0.21.0, package 5): every item with a star, grouped by area, with
   * its weight and why it is a favourite. Read only; a name opens the item in Gear. Printable.
   * SN5 «Seiten neu» (Noah 13.10.2026 «ich gebe alle bild mockups frei»): the head with its path and
   * «Drucken»; one card per area with the weight right and «…» per item (open it, change the note,
   * take the star away with Undo).
   * SN5+ (Noah 13.10.2026, answers 1a 2a 3a): F1 a bar per trip kind (the heaviest kind is full); F3 under
   * each item «zuletzt dabei: <trip> · <date>» (a tap opens the trip) or a quiet «noch auf keiner Tour»;
   * F2 «Oft dabei»: items on at least half of the trips of a kind without a star, «Favorit» stars it
   * (Undo), «…» → «Nicht mehr vorschlagen»; F4 «Als Baustein» per kind opens FavBlockSheet (a copy).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { favoritesByDomain, domainName } from '../lib/domains.js';
  import { favBars, lastTrips, oftenTaken, saveFavBlock, suggestOff, FAV_OFF } from '../lib/favplus.js';
  import { localDay } from '../lib/localday.js';
  import { switchTrip } from '../lib/nav.js';
  import { undoBulk } from '../lib/gear/bulk.js';
  import FavBlockSheet from '../lib/gear/FavBlockSheet.svelte';
  import { formatWeight, itemWeight, CATEGORY } from '../lib/gear.js';
  import { t, tn, nameOf, locale } from '../lib/i18n.svelte.js';
  import Empty from '../lib/ui/Empty.svelte';
  import PathHead from '../lib/ui/PathHead.svelte';
  import Section from '../lib/ui/Section.svelte';
  import Btn from '../lib/ui/Btn.svelte';
  import MoreActions from '../lib/ui/MoreActions.svelte';
  import RenameSheet from '../lib/ui/RenameSheet.svelte';
  import { catIcon } from '../lib/gear/caticon.js';
  import { Star, Printer, StarOff, PenLine, ExternalLink, Flag, Blocks, Info, EyeOff, ChevronRight } from '@lucide/svelte';

  const itemsQ = liveQuery(() => db.items.toArray());
  const groups = $derived(favoritesByDomain($itemsQ ?? []));
  const count = $derived(new Set(groups.flatMap((g) => g.items.map((i) => i.id))).size);
  // SN5+: the trips (zuletzt dabei, oft dabei) and the items not to suggest any more.
  const tripsQ = liveQuery(() => db.trips.toArray());
  const offQ = liveQuery(() => db.settings.get(FAV_OFF));
  const today = localDay();
  const bars = $derived(favBars(groups));
  const last = $derived(lastTrips($tripsQ ?? [], today));
  const often = $derived($itemsQ && $tripsQ ? oftenTaken($itemsQ, $tripsQ, today, { off: $offQ?.value ?? [] }) : []);
  // Impeccable runde 2 (Favoriten 1): «Oft dabei» is the one thing to do here; it comes first as a closed line
  let oftenOpen = $state(false);
  const anyTrips = $derived(($tripsQ ?? []).some((x) => !x.skipped && x.startDate && x.startDate <= today && (x.entries ?? []).length));
  /** «7. Okt.» (the year only when it is not this year). */
  const shortDay = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', ...(iso.slice(0, 4) !== today.slice(0, 4) ? { year: 'numeric' } : {}), timeZone: 'UTC' });
  const openTripAt = (e, trip) => {
    e.preventDefault();
    switchTrip(trip.id, '#/pack');
  };
  const wish = (i) => i.ownership === 'wishlist' || i.ownership === 'to-buy';
  // Regeln der App (14.10.2026): a wishlist item opens in the wishlist view, else «All» finds nothing
  const gearHref = (i) => `#/gear?q=${encodeURIComponent(i.name)}${wish(i) ? '&view=wish' : ''}`;
  const subOf = (i) => [CATEGORY[i.category] ? t(CATEGORY[i.category].name) : '', i.brand, i.model, wish(i) ? t('wishlist') : ''].filter(Boolean).join(' · ');

  /* SN5: «…» of an item: open it in Gear, change why it is a favourite, take the star away (with Undo) */
  let noting = $state(null); // the item whose note is changed
  let undo = $state(null); // { text, item }
  let timer;
  const stamp = () => new Date().toISOString();
  async function unstar(i) {
    await db.items.update(i.id, { favorite: null, updatedAt: stamp() });
    clearTimeout(timer);
    undo = { text: t('{name}: no longer a favourite.', { name: nameOf(i) }), item: i };
    timer = setTimeout(() => (undo = null), UNDO_MS);
  }
  async function restar() {
    const u = undo;
    clearTimeout(timer);
    undo = null;
    if (u?.back) return u.back();
    if (u?.item) await db.items.update(u.item.id, { favorite: true, updatedAt: stamp() });
  }
  const offer = (text, back) => {
    clearTimeout(timer);
    undo = { text, back };
    timer = setTimeout(() => (undo = null), UNDO_MS);
  };
  /* SN5+ F2: «Favorit» sets the star (Undo takes it back exactly) */
  async function star(i) {
    const was = { favorite: i.favorite ?? null, updatedAt: i.updatedAt ?? null };
    await db.items.update(i.id, { favorite: true, updatedAt: stamp() });
    offer(t('{name} is a favourite now.', { name: nameOf(i) }), () => db.items.update(i.id, was));
  }
  async function hideOften(i) {
    await suggestOff(db, i.id, true);
    offer(t('{name} is not suggested any more.', { name: nameOf(i) }), () => suggestOff(db, i.id, false));
  }
  const oftenActions = (i) => [
    { name: t('Open|item'), explain: t('In Gear, with all its details'), icon: ExternalLink, run: () => (location.hash = gearHref(i)) },
    { name: t('Do not suggest any more'), explain: t('It stays in your gear'), icon: EyeOff, run: () => hideOften(i) },
  ];
  /* SN5+ F4: «Als Baustein» per trip kind */
  let blocking = $state(null); // the group whose sheet is open
  async function saveBlock(g, name, ids) {
    const res = await saveFavBlock(db, g.key, ids, name);
    if (res.error) return res.error === 'taken' ? t('There is already a building block "{name}".', { name }) : t('Give the building block a name.');
    offer(t('Building block "{name}" made.', { name }), () => undoBulk(db, res.snap));
  }
  $effect(() => () => clearTimeout(timer));
  const saveNote = (i, text) => db.items.update(i.id, { favNote: text.trim() || null, updatedAt: stamp() });
  const actionsOf = (i) => [
    { name: t('Open|item'), explain: t('In Gear, with all its details'), icon: ExternalLink, run: () => (location.hash = gearHref(i)) },
    { name: t('Change note'), explain: t('Why it is a favourite'), icon: PenLine, run: () => (noting = i) },
    { name: t('Remove star'), explain: t('The item stays in your gear'), icon: StarOff, run: () => unstar(i) },
  ];
</script>

<div class="favs">
  <!-- v0.40.0 (design check): one name for the page, as in the menu: Favourites. -->
  <PathHead crumbs={[{ label: t('Gear|place'), href: '#/gear' }]} title={t('Favourites')} sub={$itemsQ ? [tn(count, '{n} item', '{n} items'), count ? t('your favourite things per kind of trip') : ''].filter(Boolean).join(' · ') : ''}>
    {#if count}<Btn icon={Printer} label={t('Print|pdf')} explain={t('Print or save as PDF')} onclick={() => window.print()} />{/if}
  </PathHead>
  {#if $itemsQ}
    {#if count}
      {#if often.length}
        <!-- Impeccable runde 2 (Favoriten 1): the suggestions on top, one line; a tap opens the list right here -->
        <button type="button" class="oline no-print" aria-expanded={oftenOpen} aria-controls="fav-often" onclick={() => (oftenOpen = !oftenOpen)} data-often-line>
          <Star size={18} aria-hidden="true" />
          <span class="ol-t">{tn(often.length, '{n} suggestion: often with you, no star yet', '{n} suggestions: often with you, no star yet')}</span>
          <ChevronRight class={oftenOpen ? 'olchev down' : 'olchev'} size={18} aria-hidden="true" />
        </button>
        {#if oftenOpen}{@render oftenSec()}{/if}
      {/if}
      <!-- Impeccable runde 2 (Favoriten 2): the bar under each kind, said once -->
      {#if groups.length > 1}<p class="flegend"><span class="fbar demo" aria-hidden="true"><span style:width="60%"></span></span>{t('Bar: the weight of the favourites against the heaviest kind')}</p>{/if}
      <div class="fgrid">
        {#each groups as g (g.key)}
          <div class="grp">
            <Section title={t(g.name)} sub={`${tn(g.items.length, '{n} item', '{n} items')}${g.grams ? ` · ${formatWeight(g.grams)}` : ''}`} id="fav-{g.key}">
              {#snippet more()}<span class="no-print"><Btn icon={Blocks} label={t('As building block')} explain={t('Save the favourites of {kind} as a building block', { kind: t(g.name) })} aria={t('Save the favourites of {kind} as a building block', { kind: t(g.name) })} onclick={() => (blocking = g)} /></span>{/snippet}
              <!-- SN5+ F1: this kind's favourite weight against the other kinds (the heaviest is full) -->
              {#if groups.length > 1}<div class="fbar" role="img" aria-label={t('{w}: {p} % of the heaviest kind', { w: formatWeight(g.grams), p: Math.round((bars[g.key] ?? 0) * 100) })}><span style:width="{(bars[g.key] ?? 0) * 100}%"></span></div>{/if}
              <ul class="card slist">
                {#each g.items as i (i.id)}
                  {@const Icon = catIcon(i.category)}
                  <!-- v0.40.0 (design check R2): the whole name opens the item; the category in words. -->
                  <li class="srow frow">
                    <span class="sib" aria-hidden="true"><Icon size={18} /></span>
                    <span class="sm"><a class="fname" href={gearHref(i)}>
                      <b>{nameOf(i)}{#if i.qty > 1}<small class="qx"> × {i.qty}</small>{/if}</b>
                      {#if i.favNote}<small class="why">«{i.favNote}»</small>{/if}
                      {#if subOf(i)}<small class="sub">{subOf(i)}</small>{/if}
                    </a>
                    <!-- SN5+ F3: the last trip it was on (a tap opens the trip) -->
                    <small class="last no-print">{#if last[i.id]}<Flag size={13} aria-hidden="true" />{t('last on:')} <a href="#/pack" onclick={(e) => openTripAt(e, last[i.id].trip)}>{last[i.id].trip.title}</a> · {shortDay(last[i.id].date)}{:else}<Flag size={13} aria-hidden="true" />{t('not on any trip yet')}{/if}</small></span>
                    <span class="sv num" class:nw={i.weightG == null}>{i.weightG == null ? t('not weighed') : formatWeight(itemWeight(i))}</span>
                    <span class="rowacts no-print"><MoreActions title={nameOf(i)} label={t('More for {name}', { name: nameOf(i) })} actions={actionsOf(i)} /></span>
                  </li>
                {/each}
              </ul>
            </Section>
          </div>
        {/each}
      </div>
      {#if !often.length}{@render oftenSec()}{/if}
      <p class="hint no-print"><Star size={15} aria-hidden="true" /><span>{t('You set the star in the item itself. Under «…»: remove the star, change the note.')}</span></p>
    {:else}
      <!-- v0.127.0 A-U2: the one empty building block -->
      <Empty icon={Star} title={t('No favourites yet')} text={t('No favourites yet. In Gear tap the ☆ in front of an item.')} action={{ label: t('Open Gear'), href: '#/gear' }} />
      {#if often.length}{@render oftenSec()}{/if}
    {/if}
  {/if}
</div>

{#snippet oftenSec()}
  <!-- SN5+ F2 «Oft dabei»: on at least half of the trips of a kind, no star yet; a suggestion only -->
  <div class="often no-print">
    <Section title={t('Often with you')} sub={often.length ? t('on many trips, but no star yet · a tap makes it a favourite') : ''} id="fav-often">
      {#if often.length}
        <ul class="card slist" data-sec="often">
          {#each often as o (o.item.id)}
            {@const i = o.item}
            {@const Icon = catIcon(i.category)}
            <li class="srow">
              <span class="sib" aria-hidden="true"><Icon size={18} /></span>
              <span class="sm"><b>{nameOf(i)}</b><small>{t('on {n} of {of} trips', { n: o.n, of: o.of })} · {t(domainName(o.domain))}</small></span>
              <span class="sv num" class:nw={i.weightG == null}>{i.weightG == null ? t('not weighed') : formatWeight(itemWeight(i))}</span>
              <span class="rowacts"><Btn icon={Star} label={t('Favourite|star')} aria={t('Make {name} a favourite', { name: nameOf(i) })} onclick={() => star(i)} /><MoreActions title={nameOf(i)} label={t('More for {name}', { name: nameOf(i) })} actions={oftenActions(i)} /></span>
            </li>
          {/each}
        </ul>
        <p class="shint"><Info size={15} aria-hidden="true" /><span>{t('A suggestion from your past trips. Under «…»: do not suggest any more.')}</span></p>
      {:else}
        <p class="shint"><Info size={15} aria-hidden="true" /><span>{anyTrips ? t('Nothing yet that is often with you and has no star.') : t('After a few trips, what is often with you shows here.')}</span></p>
      {/if}
    </Section>
  </div>
{/snippet}

{#if blocking}
  {@const g = blocking}
  <FavBlockSheet kind={t(g.name)} items={g.items} onsave={(name, ids) => saveBlock(g, name, ids)} onclose={() => (blocking = null)} />
{/if}

{#if undo}
  <div class="undo no-print" role="status">
    <span>{undo.text}</span>
    <Btn label={t('Undo')} onclick={restar} />
  </div>
{/if}

{#if noting}
  {@const i = noting}
  <RenameSheet kicker={nameOf(i)} title={t('Why it is a favourite')} value={i.favNote ?? ''} empty={t('no note')} hint={t('Shown under the item here and in its details.')} onsave={(text) => saveNote(i, text)} onclose={() => (noting = null)} />
{/if}

<style>
  .favs {
    max-width: 1240px;
  }
  .fgrid {
    display: grid;
    gap: var(--sp-5);
  }
  @media (min-width: 900px) {
    .fgrid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
    }
  }
  .grp {
    min-width: 0;
    break-inside: avoid-page;
  }
  /* 0.133.0: on a narrow phone the «As building block» button goes under the kind's name instead of
     squeezing it until a word breaks («Bikepacking» at 320 px) */
  .grp :global(.ssh) {
    flex-wrap: wrap;
  }
  .grp :global(.sst) {
    min-width: min-content;
  }
  .frow {
    break-inside: avoid;
  }
  .fname {
    display: block;
    color: var(--ink);
    text-decoration: none;
  }
  .fname:hover b {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .qx {
    display: inline;
    font-weight: 400;
  }
  .why {
    font-style: italic;
  }
  /* SN5+ F1 the bar, F3 «zuletzt dabei», F2 «Oft dabei» */
  /* Impeccable runde 2 (Favoriten 2): thin and in the accent colour, explained once above the kinds */
  .fbar {
    height: 4px;
    margin: -4px 2px 10px;
    border-radius: 99px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .fbar span {
    display: block;
    height: 100%;
    border-radius: 99px;
    background: var(--accent);
  }
  .flegend {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 var(--sp-3);
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .fbar.demo {
    flex: none;
    width: 32px;
    margin: 0;
    background: var(--line);
  }
  /* Impeccable runde 2 (Favoriten 1): «n suggestions» as one line on top */
  .oline {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 52px;
    margin: 0 0 var(--sp-4);
    padding: 10px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    box-shadow: var(--card-shadow);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .oline:hover {
    background: var(--paper-2);
  }
  .oline :global(svg) {
    flex: none;
    color: var(--ink-2);
  }
  .ol-t {
    flex: 1;
    min-width: 0;
    font-weight: 600;
  }
  .oline :global(.olchev) {
    transition: transform 150ms ease-out;
  }
  .oline :global(.olchev.down) {
    transform: rotate(90deg);
  }
  .oline[aria-expanded='true'] {
    margin-bottom: var(--sp-2);
  }
  .oline[aria-expanded='true'] + .often {
    margin: 0 0 var(--sp-5);
  }
  .favs .last {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    margin-top: 3px;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .last :global(svg) {
    flex: none;
    margin-right: 2px;
  }
  .last a {
    color: var(--ink-2);
  }
  .often {
    margin-top: var(--sp-5);
  }
  .nw {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hint {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-2);
    margin: var(--sp-3) 2px 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hint :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .undo {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 5;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 8px max(12px, calc((100vw - 1560px) / 2)) calc(8px + env(safe-area-inset-bottom));
    border-top: 1.5px solid var(--line-strong);
    background: var(--paper);
    box-shadow: 0 -4px 14px var(--shadow);
  }
  .undo span {
    flex: 1 1 180px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  @media (max-width: 719px) {
    .undo {
      bottom: calc(76px + env(safe-area-inset-bottom));
    }
  }
  @media print {
    :global(header.top),
    :global(nav.bottom),
    :global(.demo),
    .no-print {
      display: none !important;
    }
    :global(body),
    :global(main) {
      background: var(--paper) !important;
      padding: 0 !important;
    }
    .favs {
      max-width: none;
      color: var(--ink);
    }
  }
</style>
