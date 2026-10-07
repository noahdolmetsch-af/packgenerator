<script>
  /**
   * Good to know on Today (v0.25.1, Noah 1a): only cards with something to say, the most urgent
   * first, each with ONE button that does the thing. Which cards and in which order: know.js
   * (tested); this file only writes the words. On a phone the section starts folded as before
   * (v0.23.1, Noah 3b), the closed line counts the cards shown.
   *
   * The weekend weather needs the home place (setting "homePlace", answer 1a: entered once with the
   * place search of the trip weather). Its forecast is saved in "meta" (never exported), fetched at
   * most every 3 hours; offline or failed the card shows a saved one up to 12 hours old, else nothing.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { knowCards, wearWhat, sparkPath, needsFetch, HOME_PLACE, HOME_FORECAST } from '../know.js';
  import { openTodos } from '../todos.js';
  import { formatWeight, weightText } from '../gear.js';
  import { RAIN } from '../trips.js';
  import { forecastForTrip, toWx, searchPlace } from '../weather.js';
  import { homeForecast } from '../home-weather.js';
  import { sunTimes } from '../blockplan.js';
  import { paceOf, PACE_KEY } from '../pace.js';
  import { learningsFor } from '../debrief.js';
  import { bikesHash } from '../bikes.js';
  import { openNew, openTrip } from '../nav.js';
  import { t, tn, num, locale, nameOf } from '../i18n.svelte.js';
  import { phone } from '../media.svelte.js';

  let {
    loaded = false,
    today,
    next = null,
    place = null,
    trips = [],
    items = [],
    bikes = [],
    visits = [],
    debriefs = [],
    learnings = [],
    notes = [],
    containers = [],
    backup = { due: false },
    demo = null,
    importFrom = null,
    backingUp = false,
    onBackup,
    onData,
  } = $props();

  const paceQ = liveQuery(() => db.settings.get(PACE_KEY));
  // null = no home place yet, undefined = still reading
  const placeQ = liveQuery(async () => (await db.settings.get(HOME_PLACE))?.value ?? null);
  const fcQ = liveQuery(async () => (await db.meta.get(HOME_FORECAST)) ?? null);

  const pace = $derived(paceOf($paceQ?.value));
  const todos = $derived(loaded ? openTodos({ bikes, items, pace, debriefs, trips }) : []);
  const fc = $derived(next ? toWx(forecastForTrip(next)) : null);
  const sun = $derived(next?.startDate && place?.lat != null ? sunTimes(next.startDate, place.lat, place.lon) : null);
  const tips = $derived(learningsFor(next, learnings, 1));
  const cards = $derived(
    loaded
      ? knowCards({ today, todos, backup, demo, next, fc, sun, tips, pace, notes, bikes, trips, debriefs, visits, items, containers, homePlace: $placeQ, homeForecast: $fcQ, placeLoading: $placeQ === undefined || $fcQ === undefined })
      : [],
  );

  /* ---------- the home place and its forecast ---------- */
  let tried = false;
  $effect(() => {
    const homePlace = $placeQ;
    const saved = $fcQ;
    if (tried || !homePlace || saved === undefined || !navigator.onLine || !needsFetch(homePlace, saved)) return;
    tried = true;
    homeForecast(db); // saves into meta; the card follows the saved forecast (fcQ)
  });
  let q = $state('');
  let found = $state([]);
  let searching = $state(false);
  let placeMsg = $state('');
  let editPlace = $state(false);
  async function search(event) {
    event.preventDefault();
    searching = true;
    placeMsg = '';
    try {
      found = await searchPlace(q);
      if (!found.length) placeMsg = t('No place found. Try another spelling.');
    } catch {
      placeMsg = t('No connection. Place search needs the internet.');
    } finally {
      searching = false;
    }
  }
  async function choose(p) {
    const homePlace = { name: p.detail ? `${p.name}, ${p.detail}` : p.name, lat: p.lat, lon: p.lon };
    found = [];
    q = '';
    editPlace = false;
    await db.settings.put({ key: HOME_PLACE, value: homePlace });
    tried = true;
    await homeForecast(db);
  }

  /* ---------- words ---------- */
  let open = $state(false);
  const clock = (ms) => new Date(ms).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  const weekday = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(locale(), { weekday: 'short' });
  const short = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' });
  const month = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(locale(), iso.slice(0, 4) === today.slice(0, 4) ? { month: 'long' } : { month: 'short', year: 'numeric' });
  const todoText = (r) =>
    r.key === 'bikes' ? tn(r.n, 'Weigh {n} bike', 'Weigh {n} bikes')
    : r.key === 'pace' ? t('Load a few GPX rides')
    : r.key === 'check' ? tn(r.n, 'Check {n} item in the inventory', 'Check {n} items in the inventory')
    : r.key === 'favourites' ? t('Apply the favourites file')
    : t('Ride your first real trip with the app');
  const todoWhy = (r) =>
    r.key === 'bikes' ? t('Now Strava estimates: the system weight is a guess.')
    : r.key === 'pace' ? t('Riding times use a standard guess of 16 km/h.')
    : r.key === 'check' ? t('Still have it, gone or replaced?')
    : r.key === 'favourites' ? t('Your data → Import backup → Apply favourites.')
    : t('Pack, ride day, end trip and debrief: only then can the app learn.');
  const wearLine = (r) => {
    const what = t(wearWhat(r), { km: num(r.every) });
    if (r.left <= 0) return t('{what} {bike}: due now', { what, bike: r.bike });
    const about = [r.trips ? tn(r.trips, '≈ {n} trip', '≈ {n} trips') : null, r.weeks ? tn(r.weeks, '≈ {n} week', '≈ {n} weeks') : null].filter(Boolean).join(', ');
    return t('{what} {bike}: due in about {km} km', { what, bike: r.bike, km: num(r.left) }) + (about ? ` (${about})` : '');
  };
  const costText = (c) => (c.unknown === c.visits ? t('cost unknown') : `CHF ${num(Math.round(c.chf))}${c.unknown ? ` + ${t('unknown')}` : ''}`);
  const sign = (g) => (g < 0 ? '−' : g > 0 ? '+' : '±');
</script>

{#snippet go(label, href, onclick)}
  {#if href}<a class="btn sm go" {href} {onclick}>{label}</a>{:else}<button type="button" class="btn sm go" {onclick}>{label}</button>{/if}
{/snippet}

{#snippet body()}
  <div class="cards">
    {#each cards as c (c.key)}
      {@const d = c.data}
      <div class="sig" class:late={c.prio === 1} data-card={c.key}>
        {#if c.key === 'backup'}
          <span class="lbl">{t('Your data')}</span>
          <b>{t('Time for a backup')}</b>
          <span>{d.days == null ? t('You have not saved a backup file yet.') : t('Your last backup is {n} days old.', { n: d.days })} {importFrom ? t('Data from the backup of {date}. Newer state on the phone? Load its backup here.', { date: new Date(importFrom).toLocaleDateString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }) : d.afterTrip ? t('New debrief since the last backup: save one, then load it on the desktop.') : ''}</span>
          <span class="src">{t('Phone and desktop keep their own data; a backup file moves it.')}</span>
          <button type="button" class="btn sm go" disabled={backingUp} onclick={onBackup}>{t('Download backup')}</button>
        {:else if c.key === 'demo'}
          <span class="lbl">{t('Your data')}</span>
          <b>{t('Demo running')}</b>
          <span>{t('No backups while the demo runs; your own data waits until you end it.')}</span>
          {@render go(t('Open your data'), null, onData)}
        {:else if c.key === 'todo'}
          {@const [first, ...rest] = d.rows}
          <span class="lbl">{t('Still open')}</span>
          <b>{todoText(first)}</b>
          <span>{todoWhy(first)}</span>
          {#if rest.length}
            <ul class="more" aria-label={t('Also open')}>
              {#each rest as r (r.key)}
                <li>{#if r.href}<a href={r.href}>{todoText(r)}</a>{:else if r.action === 'data'}<button type="button" class="link" onclick={onData}>{todoText(r)}</button>{:else}<button type="button" class="link" onclick={() => openNew('list')}>{todoText(r)}</button>{/if}</li>
              {/each}
            </ul>
          {/if}
          <span class="src">{t('Each line goes away once it is done.')}</span>
          {#if first.href}{@render go(t('Do it now'), first.href)}{:else if first.action === 'data'}{@render go(t('Do it now'), null, onData)}{:else}{@render go(t('Plan a trip'), null, () => openNew('list'))}{/if}
        {:else if c.key === 'wear'}
          <span class="lbl">{t('Wear forecast')}</span>
          <b>{wearLine(d.rows[0])}</b>
          {#each d.rows.slice(1, 3) as r (r.bikeId)}<span>{wearLine(r)}</span>{/each}
          <span class="src">{t('From the km of each bike and its last service')}</span>
          {@render go(t('Plan in Bike care'), bikesHash({ tab: 'care', bike: d.rows[0].bikeId, open: true }))}
        {:else if c.key === 'weather'}
          <span class="lbl">{t('Weather')}{place?.name ? ` · ${place.name.split(',')[0]}` : ''}</span>
          <b>{d.fc ? t('{min} to {max} °C, {rain}', { min: d.fc.min, max: d.fc.max, rain: t(RAIN[d.fc.rain]) }) : next.wx?.min != null ? t('Packed for {min} to {max} °C', { min: next.wx.min, max: next.wx.max }) : next.title}</b>
          {#if d.sun}<span>{t('Sunrise {rise} · sunset {set}', { rise: clock(d.sun.rise), set: clock(d.sun.set) })}</span>{/if}
          <span class="src">{d.fc ? 'Open-Meteo' : t('sun computed offline')} · {next.title}</span>
          {@render go(t('Open the trip'), '#/pack', () => openTrip(next.id))}
        {:else if c.key === 'inbox'}
          <span class="lbl">{t('Inbox')}</span>
          <b>{tn(d.notes.length, '{n} note to sort', '{n} notes to sort')}</b>
          <span class="clip">{d.notes[0].text}</span>
          {@render go(t('Sort now'), '#/inbox')}
        {:else if c.key === 'weekend'}
          <span class="lbl">{t('Weekend ride weather')} · {d.place.name.split(',')[0]}</span>
          <b>{d.days.map((x) => t('{day} {max} °C {rain}', { day: weekday(x.date), max: x.max, rain: t(RAIN[x.rain]) })).join(' · ')}</b>
          {#if editPlace}{@render placeForm()}{/if}
          <span class="src">Open-Meteo · <button type="button" class="link" onclick={() => (editPlace = !editPlace)} aria-expanded={editPlace}>{t('Change place')}</button></span>
          {@render go(t('Plan a trip'), null, () => openNew('list'))}
        {:else if c.key === 'home'}
          <span class="lbl">{t('Weekend ride weather')}</span>
          <b>{t('Set your home place')}</b>
          <span>{t('Once set, you see here what Saturday and Sunday bring.')}</span>
          {@render placeForm()}
        {:else if c.key === 'season'}
          <span class="lbl">{t('Season {year} in numbers', { year: d.year })}</span>
          <b>{tn(d.trips, '{n} trip finished', '{n} trips finished')}</b>
          {#if d.km.length}<span>{d.km.map((r) => `${r.bike} ${num(r.km)} km`).join(' · ')}</span>{/if}
          {#if d.cost}<span>{t('Workshop {year}:', { year: d.year })} {costText(d.cost)} ({tn(d.cost.visits, '{n} visit', '{n} visits')})</span>{/if}
          <span class="src">{d.km.length ? t('km from your debriefs of this year') : t('No km in this year’s debriefs yet')}</span>
          {@render go(t('Show bikes'), '#/bikes')}
        {:else if c.key === 'trend'}
          <span class="lbl">{t('Weight trend')}</span>
          <b class="num">{t('{sign}{w} since {month}', { sign: sign(d.diffG), w: formatWeight(Math.abs(d.diffG)), month: month(d.first.date) })}</b>
          <span class="spark">
            <span class="num">{formatWeight(d.first.g)}</span>
            <svg viewBox="0 0 120 32" width="120" height="32" aria-hidden="true"><path d={sparkPath(d.points.map((p) => p.g))} /></svg>
            <span class="num">{formatWeight(d.last.g)}</span>
          </span>
          <span class="src">{tn(d.points.length, 'Base weight of the last {n} trip', 'Base weight of the last {n} trips')}</span>
          {@render go(t('Compare trips'), '#/debrief/compare')}
        {:else if c.key === 'upgrade'}
          <span class="lbl">{t('Best upgrade')}</span>
          <b>{t('{name}: {g} g lighter for CHF {chf} ({x} g per 100 CHF)', { name: nameOf(d.item), g: num(d.savedG), chf: num(d.chf), x: num(d.gPer100) })}</b>
          <span>{t('Instead of {name}', { name: nameOf(d.old) })}</span>
          {@render go(t('Open wishlist'), '#/gear?tab=wishlist')}
        {:else if c.key === 'unused'}
          <span class="lbl">{t('Long not used')}</span>
          <b>{d.full ? tn(d.items.length, '{n} item not on any trip for 12 months', '{n} items not on any trip for 12 months') : tn(d.items.length, '{n} item not on any trip since {date}', '{n} items not on any trip since {date}', { date: short(d.since) })}</b>
          <span>{t('{w} in total', { w: weightText(d.g, d.missing) })}</span>
          <span class="clip">{d.items.slice(0, 3).map((i) => nameOf(i)).join(', ')}{d.items.length > 3 ? ' …' : ''}</span>
          {@render go(t('Look through'), '#/gear?unused=1')}
        {:else if c.key === 'learnings'}
          <span class="lbl">{t('From your debriefs')}</span>
          <b>{d.tip.rule}</b>
          {#if d.tip.topic}<span>{d.tip.topic}</span>{/if}
          <span class="src">{tn(learnings.length, '{n} learning', '{n} learnings')}</span>
          {@render go(t('All learnings'), '#/debrief/learnings')}
        {:else if c.key === 'pace'}
          <span class="lbl">{t('Your pace')}</span>
          <b class="num">{t('{kmh} km/h moving', { kmh: d.pace.kmh })}</b>
          <span>{t('+1 h per {m} m climbing', { m: num(d.pace.climbMh) })}{d.pace.stops ? t(', stops add {n} %', { n: Math.round((d.pace.stops - 1) * 100) }) : ''}</span>
          <span class="src">{tn(d.pace.n, '{n} GPX ride', '{n} GPX rides')}</span>
          {@render go(t('Show your pace'), '#/debrief/pace')}
        {/if}
      </div>
    {/each}
  </div>
{/snippet}

{#snippet placeForm()}
  <form class="find" onsubmit={search}>
    <input class="inp" bind:value={q} placeholder={t('Home place, e.g. Aarau')} aria-label={t('Your home place')} />
    <button type="submit" class="btn sm go" disabled={searching || q.trim().length < 2}>{t('Find')}</button>
  </form>
  {#if found.length}
    <ul class="found">
      {#each found as p (`${p.lat},${p.lon}`)}<li><button type="button" class="link" onclick={() => choose(p)}>{p.name}</button> <small>{p.detail}</small></li>{/each}
    </ul>
  {/if}
  {#if placeMsg}<p class="warn" role="alert">{placeMsg}</p>{/if}
{/snippet}

{#if cards.length}
  {#if phone.matches}
    <details class="know folded" bind:open>
      <summary><h2 id="know-h" class="title">{t('Good to know')}</h2><span class="fsum">{tn(cards.length, '{n} hint', '{n} hints')}{todos.length ? ` · ${tn(todos.length, '{n} still open', '{n} still open')}` : ''}</span></summary>
      <div class="in">{@render body()}</div>
    </details>
  {:else}
    <section class="know" aria-labelledby="know-h">
      <h2 id="know-h" class="title">{t('Good to know')}</h2>
      {@render body()}
    </section>
  {/if}
{/if}

<style>
  .lbl {
    font: 600 var(--fs-small)/1.3 var(--font-body);
    color: var(--ink-3);
  }
  .know h2 {
    margin: 0 0 12px;
    font-size: var(--fs-section);
  }
  /* v0.23.1 (Noah 3b): folded on a phone, one line closed, open on touch or keyboard */
  details.know.folded {
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper);
  }
  .folded > summary {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 12px;
    min-height: 52px;
    padding: 12px 40px 12px 16px;
    box-sizing: border-box;
    position: relative;
    list-style: none;
    cursor: pointer;
  }
  .folded > summary::-webkit-details-marker {
    display: none;
  }
  .folded > summary::after {
    content: '';
    position: absolute;
    right: 18px;
    top: 22px;
    width: 9px;
    height: 9px;
    border-right: 2.2px solid var(--ink-2);
    border-bottom: 2.2px solid var(--ink-2);
    transform: rotate(45deg);
  }
  .folded[open] > summary::after {
    top: 26px;
    transform: rotate(-135deg);
  }
  .folded > summary:focus-visible {
    outline: var(--focus-ring);
    outline-offset: -3px;
    border-radius: 14px;
  }
  .folded > summary h2 {
    margin: 0;
    font-size: var(--fs-section);
    line-height: var(--lh-title);
  }
  .fsum {
    min-width: 0;
    color: var(--ink-2);
    font-size: 15px;
    overflow-wrap: anywhere;
  }
  .in {
    padding: 0 16px 16px;
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
  }
  .sig {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    padding: 16px;
    border: 1.5px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  /* most urgent: a marker and the words of the card, not colour alone */
  .sig.late {
    border-color: var(--hi);
  }
  .sig b {
    font-size: 17px;
    overflow-wrap: anywhere;
  }
  .sig > span:not(.lbl):not(.src) {
    font-size: 14px;
    color: var(--ink-2);
    overflow-wrap: anywhere;
  }
  .clip {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .src {
    margin-top: auto;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  /* the one button of the card, at its foot */
  .go {
    align-self: flex-start;
    margin-top: 4px;
    min-height: 44px;
  }
  .more {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 2px;
    font-size: 14px;
  }
  .more a,
  .more .link {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    color: var(--ink);
  }
  .spark {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .spark svg {
    flex: none;
    max-width: 100%;
  }
  .spark path {
    fill: none;
    stroke: var(--ink);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    text-decoration: underline;
    cursor: pointer;
  }
  .find {
    display: flex;
    gap: 6px;
    align-items: center;
    width: 100%;
  }
  .find .inp {
    flex: 1;
    min-width: 0;
  }
  .find .go {
    margin-top: 0;
  }
  .found {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
  }
  .found li {
    min-height: 32px;
  }
  .found small {
    color: var(--ink-3);
  }
  .warn {
    margin: 0;
    font-size: 14px;
    color: var(--ink);
  }
</style>
