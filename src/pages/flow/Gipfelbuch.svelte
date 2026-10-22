<script>
  /**
   * v0.165.0 «Gipfelbuch für alle» (proposal GB1, Noah 15.10.2026 08:40 «1a 2a 3a 4a und manuelle eingabe
   * möglich? 5b»): Aktiv › Aktivität › Gipfelbuch, #/flow/gipfelbuch. Passes by bike, summits on ski
   * tours and hikes, trails, and the places of sports without height, in one book (it replaces «Orte» N5).
   * On top the key line and the next star; then what the app found in your rides («Ins Gipfelbuch» or
   * «Kein Gipfel»); then the places by year (the newest year open, older ones one folded line). A tap on
   * a place shows it beside the list (computer) or under it (phone): its visits, its stars, change, remove.
   * The one main button: «Ort von Hand eintragen». Everything is a suggestion and can be changed or removed.
   */
  import { liveQuery } from 'dexie';
  import { tick } from 'svelte';
  import { Mountain, Star, ChevronRight, Plus } from '@lucide/svelte';
  import PageHead from '../../lib/ui/PageHead.svelte';
  import Empty from '../../lib/ui/Empty.svelte';
  import CoreLine from '../../lib/ui/CoreLine.svelte';
  import MainBar from '../../lib/ui/MainBar.svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import PlaceSheet from '../../lib/flow/PlaceSheet.svelte';
  import { db } from '../../lib/db.js';
  import { GB_KEY, bookOf, suggestions, addPlace, addVisit, editPlace, removePlace, dismiss, yearGroups, coreOf, sportCounts, sportOf, isVelo, gbStars, starsOfPlace, nextPassStar, placeRows, PLACE_WORD } from '../../lib/gipfelbuch.js';
  import { localDay } from '../../lib/localday.js';
  import { t, tn, num, locale } from '../../lib/i18n.svelte.js';

  const today = localDay();
  const year = today.slice(0, 4);
  const q = liveQuery(async () => {
    const [row, acts, rides, flowActs] = await Promise.all([db.settings.get(GB_KEY), db.activities.toArray(), db.rides.toArray(), db.flowActs.toArray()]);
    return { book: bookOf(row?.value), acts, rides, others: [...new Set(flowActs.map((a) => a.name).filter(Boolean))] };
  });
  const data = $derived($q);
  const book = $derived(data?.book ?? bookOf(null));

  let sport = $state(null);
  let sel = $state(null);
  let sheet = $state(null); // { mode: 'new' | 'confirm' | 'edit' | 'visit', sugg?, place? }
  let undo = $state(null); // { text, book }

  const groups = $derived(yearGroups(book, sport));
  const core = $derived(coreOf(book, year, sport));
  const counts = $derived(sportCounts(book));
  const sugg = $derived(data ? suggestions(book, { acts: data.acts, rides: data.rides }) : []);
  const next = $derived(nextPassStar(book));
  const stars = $derived(gbStars(book));
  const rows = $derived(placeRows(book));
  const picked = $derived(rows.find((r) => r.place.id === sel) ?? null);
  const placeOf = (id) => book.places.find((p) => p.id === id);

  // a wide screen shows the newest place beside the list from the start
  $effect(() => {
    if (!sel && groups[0]?.rows[0] && typeof matchMedia === 'function' && matchMedia('(min-width: 1000px)').matches) sel = groups[0].rows[0].place.id;
  });

  const save = async (nb, text = '') => {
    const before = book;
    if (text) undo = { text, book: before };
    await db.settings.put({ key: GB_KEY, value: JSON.parse(JSON.stringify(nb)) }); // resolves to the key: a text the sheet would show as an error
  };
  const undoNow = async () => {
    if (!undo) return;
    await db.settings.put({ key: GB_KEY, value: JSON.parse(JSON.stringify(undo.book)) });
    undo = null;
  };

  const dayWord = (day) => (day ? new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '');
  const dayLong = (day) => (day ? new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '');
  const m = (v) => (v == null ? '–' : `${num(v)} m`);
  const sportName = (p) => (p.sport === 'other' && p.label ? p.label : t(sportOf(p.sport).name));
  const starText = (s) =>
    s.kind === 'pass2000' ? t('First pass over 2000 m') : s.kind === 'passes' ? t('{n} passes by bike', { n: s.n }) : s.kind === 'top' ? t('Highest point {year}', { year: s.year }) : t('5 new places in {year}', { year: s.year });
  const starShort = (s) => (s.kind === 'passes' ? t('{n}. pass', { n: s.n }) : s.kind === 'top' ? t('highest|gb') : s.kind === 'pass2000' ? t('first 2000 m') : t('5 new'));

  async function pick(id) {
    sel = id;
    await tick();
    if (typeof matchMedia === 'function' && !matchMedia('(min-width: 1000px)').matches) document.getElementById('gb-det')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const visitAgain = (s) => save(addVisit(book, s.match, { day: s.day, ref: s.ref, hm: s.hm }), t('Visit added to {name}', { name: placeOf(s.match)?.name ?? '' }));
  const noPeak = (s) => save(dismiss(book, s.ref), t('Suggestion put away'));
  const remove = (r) => {
    sel = null;
    save(removePlace(book, r.place.id), t('«{name}» removed', { name: r.place.name }));
  };

  function onsave(v) {
    const s = sheet;
    if (s.mode === 'edit') return save(editPlace(book, s.place.id, { name: v.name, sport: v.sport, ele: v.ele, label: v.label, note: v.note }));
    if (s.mode === 'visit') return save(addVisit(book, s.place.id, { day: v.day, ref: 'hand' }), t('Visit added to {name}', { name: s.place.name }));
    const src = s.sugg;
    const nb = addPlace(book, { ...v, lat: src?.lat ?? null, lon: src?.lon ?? null }, { day: v.day, ref: src?.ref ?? 'hand', hm: src?.hm ?? null });
    sel = nb.places.at(-1).id;
    return save(nb, t('«{name}» is in the summit book', { name: v.name }));
  }
  const sheetTitle = $derived(!sheet ? '' : sheet.mode === 'edit' ? t('Change place') : sheet.mode === 'visit' ? t('One more visit') : sheet.mode === 'confirm' ? t('Into the summit book') : t('Enter a place by hand'));
  const sheetPlace = $derived(
    !sheet ? {} : sheet.mode === 'confirm' ? { name: sheet.sugg.name, sport: sheet.sugg.sport, ele: sheet.sugg.ele, day: sheet.sugg.day } : sheet.place ? { ...sheet.place, day: today } : { sport: sport ?? 'bike' },
  );
</script>

<div class="hob gb">
  <header class="ph">
    <Crumb path={[{ href: '#/flow', label: t('Active|place') }, { href: '#/flow/sports', label: t('My sports|tab') }]} here={t('Summit book')} />
    <PageHead title={t('Summit book')} text={t('Passes, summits and trails of every sport. New places become milestones.')} />
    {#if data && rows.length}<CoreLine parts={[{ v: core.places, label: tn(core.places, 'place', 'places') }, { v: core.fresh, label: t('new in {year}', { year }) }, core.top ? { v: m(core.top.ele), label: t('highest point {year}', { year }) } : null, core.hm ? { v: `${num(core.hm)} Hm`, label: t('climbed for them in {year}', { year }) } : null]} />{/if}
  </header>

  {#if data}
    {#if counts.length > 1}
      <nav class="chips" aria-label={t('Filter by sport')}>
        <button type="button" class="chip" aria-pressed={!sport} onclick={() => (sport = null)}>{t('All')} · {rows.length}</button>
        {#each counts as s (s.key)}<button type="button" class="chip" aria-pressed={sport === s.key} onclick={() => (sport = sport === s.key ? null : s.key)} data-gb-chip={s.key}>{t(s.name)} · {s.n}</button>{/each}
      </nav>
    {/if}

    {#if next && (!sport || isVelo(sport))}
      <a class="ms" href="#/flow/trophies?area=gipfelbuch" data-gb-next>
        <span class="st" aria-hidden="true"><Star size={22} /></span>
        <span class="tx"><b>{t('Next milestone: {n} passes by bike', { n: next.target })}</b><small class="num">{t('{left} more · {have} of {n}', { left: next.target - next.have, have: next.have, n: next.target })}</small><span class="bar" aria-hidden="true"><i style:width="{(next.have / next.target) * 100}%"></i></span></span>
        <span class="go">{t('All milestones')}<ChevronRight size={16} aria-hidden="true" /></span>
      </a>
    {/if}

    {#if undo}<p class="undo" role="status">{undo.text} <button type="button" class="link" onclick={undoNow}>{t('Undo')}</button></p>{/if}

    {#if sugg.length}
      <section class="gbc found" aria-labelledby="gb-found-h" data-gb-found>
        <h2 id="gb-found-h">{t('Found in your rides')}</h2>
        <p class="sub">{t('The highest point of a ride or tour. Confirm it with a name, or put it away.')}</p>
        <ul>
          {#each sugg.slice(0, 3) as s (s.ref)}
            <li data-gb-sugg={s.ref}>
              <span class="ic" aria-hidden="true"><Mountain size={18} /></span>
              <span class="t"><b class="num">{m(s.ele)} · {t(sportOf(s.sport).name)}</b><small>{[s.title ? `«${s.title}»` : '', dayWord(s.day)].filter(Boolean).join(' · ')}</small></span>
              <span class="acts">
                {#if s.match}<button type="button" class="btn sm hi" onclick={() => visitAgain(s)}>{t('Again at {name}', { name: placeOf(s.match)?.name ?? '' })}</button>
                {:else}<button type="button" class="btn sm hi" onclick={() => (sheet = { mode: 'confirm', sugg: s })} data-gb-confirm>{t('Into the summit book')}</button>{/if}
                <button type="button" class="btn sm" onclick={() => noPeak(s)}>{t('No summit')}</button>
              </span>
            </li>
          {/each}
        </ul>
        {#if sugg.length > 3}<p class="sub">{tn(sugg.length - 3, '{n} more after these', '{n} more after these')}</p>{/if}
      </section>
    {/if}

    {#if !rows.length}
      <section data-gb-empty>
        <Empty icon={Mountain} level={2} title={t('Your summit book is still empty')} text={t('Passes and summits come from your rides by themselves. You can also enter a place by hand, for every sport.')} />
      </section>
    {:else}
      <div class="lay">
        <div class="col">
          {#each groups as g, i (g.year)}
            <details class="gbc yr" open={i === 0} data-gb-year={g.year}>
              <summary><b>{g.year}</b><small class="num">{tn(g.visits, '{n} visit', '{n} visits')} · {t('{n} new', { n: g.fresh })}</small><ChevronRight class="chev" size={18} aria-hidden="true" /></summary>
              <ul>
                {#each g.rows as r (r.place.id)}
                  {@const st = starsOfPlace(book, r.place.id)}
                  <li>
                    <button type="button" class="row" class:on={sel === r.place.id} aria-pressed={sel === r.place.id} onclick={() => pick(r.place.id)} data-gb-place={r.place.name}>
                      <span class="ic s-{r.place.sport}" aria-hidden="true"><Mountain size={17} /></span>
                      <span class="t">
                        <b>{r.place.name}{#if r.firstEver}<i class="gbp new">{t('new|gb')}</i>{/if}{#each st.filter((x) => x.day.startsWith(g.year)) as x (x.id)}<i class="gbp star">★ {starShort(x)}</i>{/each}</b>
                        <small>{[sportName(r.place), dayWord(r.visit.day), r.firstEver && r.n === 1 ? t('first time') : t('{n}×', { n: r.n })].join(' · ')}</small>
                      </span>
                      <span class="h num">{m(r.place.ele)}</span>
                    </button>
                  </li>
                {/each}
              </ul>
            </details>
          {/each}
        </div>
        {#if picked}
          <aside class="gbc det" id="gb-det" aria-labelledby="gb-det-h" data-gb-detail>
            <h2 id="gb-det-h">{picked.place.name}</h2>
            <p class="sub">{[sportName(picked.place), t(PLACE_WORD[picked.place.sport] ?? 'Place|gb'), picked.place.ele != null ? m(picked.place.ele) : ''].filter(Boolean).join(' · ')}</p>
            <dl class="kv">
              <div><dt>{t('visits')}</dt><dd class="num">{picked.n}×</dd></div>
              <div><dt>{t('first time')}</dt><dd>{dayLong(picked.first)}</dd></div>
              <div><dt>{t('last time')}</dt><dd>{dayLong(picked.last)}</dd></div>
              <div><dt>{t('climbed')}</dt><dd class="num">{picked.visits.at(-1)?.hm != null ? `${num(picked.visits.at(-1).hm)} Hm` : '–'}</dd></div>
            </dl>
            {#if starsOfPlace(book, picked.place.id).length}
              <h3>{t('Milestones from here')}</h3>
              <ul class="stars">{#each starsOfPlace(book, picked.place.id) as s (s.id)}<li>★ {starText(s)}</li>{/each}</ul>
            {/if}
            {#if picked.place.note}<p class="note">{picked.place.note}</p>{/if}
            <h3>{t('Visits')}</h3>
            <ul class="vis">{#each [...picked.visits].reverse() as v (v.id)}<li>{dayLong(v.day)}{v.ref === 'hand' ? ` · ${t('by hand')}` : ''}{v.hm != null ? ` · ${num(v.hm)} Hm` : ''}</li>{/each}</ul>
            <div class="acts">
              <button type="button" class="btn" onclick={() => (sheet = { mode: 'visit', place: picked.place })}><Plus size={16} aria-hidden="true" />{t('One more visit')}</button>
              <button type="button" class="btn" onclick={() => (sheet = { mode: 'edit', place: picked.place })} data-gb-edit>{t('Change')}</button>
              <button type="button" class="link" onclick={() => remove(picked)} data-gb-remove>{t('Remove')}</button>
            </div>
          </aside>
        {/if}
      </div>
    {/if}

    {#if stars.length}<p class="sub foot">{tn(stars.length, '{n} star from the summit book, also in the trophy showcase', '{n} stars from the summit book, also in the trophy showcase')} · <a href="#/flow/trophies?area=gipfelbuch">{t('Trophy showcase')}</a></p>{/if}
  {/if}
</div>

<MainBar main={{ label: t('Enter a place by hand'), onclick: () => (sheet = { mode: 'new' }), arrow: false }} />

{#if sheet}
  {#key sheet}
    <PlaceSheet title={sheetTitle} hint={sheet.mode === 'confirm' ? t('Type the name of the pass or summit. Height and day come from the ride.') : ''} place={sheetPlace} withDay={sheet.mode !== 'edit'} others={data?.others ?? []} {onsave} onclose={() => (sheet = null)} />
  {/key}
{/if}

<style>
  .hob {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 1240px;
    margin: 0 auto;
    min-width: 0;
  }
  .hob :global(.pagehead) {
    margin: 0;
  }
  .ph {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  h3 {
    margin: var(--sp-3) 0 var(--sp-1);
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .sub {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .chips {
    display: flex;
    gap: var(--sp-2);
    overflow-x: auto;
    min-width: 0;
    padding-bottom: 2px;
  }
  .chip {
    flex: none;
    min-height: 44px;
    padding: 6px 14px;
    border: 1px solid var(--line-strong);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .ms {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
    padding: var(--sp-3) var(--sp-4);
    border-radius: 12px;
    background: var(--warn-soft);
    color: var(--ink);
    text-decoration: none;
  }
  .ms .st {
    color: var(--warn);
  }
  .ms .tx {
    flex: 1 1 220px;
    min-width: 0;
  }
  .ms b {
    display: block;
    font-weight: 600;
  }
  .ms small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .bar {
    display: block;
    height: 6px;
    margin-top: 6px;
    border-radius: 3px;
    background: var(--line);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    background: var(--warn);
  }
  .go {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    font-size: var(--fs-small);
    text-decoration: underline;
  }
  .undo {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .link {
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  .gbc {
    margin: 0;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  .found,
  .det {
    padding: var(--sp-4);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .found ul {
    margin-top: var(--sp-2);
  }
  .found li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
    padding: var(--sp-2) 0;
    border-top: 1px solid var(--line);
  }
  .found .t {
    flex: 1 1 180px;
    min-width: 0;
  }
  .t b {
    display: block;
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .t small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    align-items: center;
  }
  .ic {
    display: grid;
    flex: none;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 9px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .ic.s-bike,
  .ic.s-gravel {
    background: var(--info-soft);
  }
  .ic.s-hike {
    background: var(--ok-soft);
  }
  .ic.s-xc,
  .ic.s-dh {
    background: var(--hi-soft);
  }
  .lay {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-5);
    align-items: start;
  }
  @media (min-width: 1000px) {
    .lay {
      grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
    }
    .det {
      position: sticky;
      top: calc(env(safe-area-inset-top, 0px) + 16px);
    }
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    min-width: 0;
  }
  .yr summary {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-height: 52px;
    padding: var(--sp-2) var(--sp-4);
    list-style: none;
    cursor: pointer;
  }
  .yr summary::-webkit-details-marker {
    display: none;
  }
  .yr summary small {
    margin-left: auto;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .yr summary :global(.chev) {
    flex: none;
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  .yr[open] summary :global(.chev) {
    transform: rotate(90deg);
  }
  .row {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    width: 100%;
    min-height: 56px;
    padding: var(--sp-2) var(--sp-4);
    border: 0;
    border-top: 1px solid var(--line);
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .row.on {
    background: var(--paper-2);
  }
  .row .t {
    flex: 1;
    min-width: 0;
  }
  .h {
    flex: none;
    color: var(--ink-2);
    font-size: var(--fs-small);
    white-space: nowrap;
  }
  .gbp {
    display: inline-block;
    margin-left: 6px;
    padding: 1px 8px;
    border-radius: 99px;
    font: 500 var(--fs-label) / 1.5 var(--font-body);
    font-style: normal;
    white-space: nowrap;
    vertical-align: 1px;
  }
  .gbp.new {
    background: var(--hi-soft);
    color: var(--badge-ink);
  }
  .gbp.star {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .kv {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-2);
    margin: var(--sp-3) 0 0;
  }
  .kv div {
    padding: var(--sp-2) var(--sp-3);
    border-radius: 8px;
    background: var(--paper-2);
  }
  .kv dt {
    color: var(--ink-3);
    font-size: var(--fs-label);
  }
  .kv dd {
    margin: 0;
    font-weight: 600;
  }
  .stars {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .stars li {
    padding: 4px 10px;
    border-radius: 8px;
    background: var(--warn-soft);
    font-size: var(--fs-small);
  }
  .vis li {
    padding: 4px 0;
    border-top: 1px solid var(--line);
    font-size: var(--fs-small);
  }
  .note {
    margin: var(--sp-2) 0 0;
    color: var(--ink-2);
  }
  .det .acts {
    margin-top: var(--sp-3);
  }
  .det .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .foot a {
    color: var(--ink);
  }
</style>
