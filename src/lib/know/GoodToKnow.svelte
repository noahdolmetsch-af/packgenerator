<script>
  /**
   * Good to know on Today (v0.25.1, Noah 1a): only cards with something to say, the most urgent
   * first, each with ONE button that does the thing. Which cards and in which order: know.js
   * (tested); this file only writes the words.
   *
   * v0.30.0 (Noah 1a, 2a, 3a): always 6 tiles (tips.js, tested): at most 3 important data cards,
   * at most 1 further one, the rest tips "Did you know?" about what the app can do, each with an
   * icon, one sentence, ONE button and "I know it" (hides the tip for good). At the foot the way to
   * the overview of everything (#/features) with how much of it is used. On a phone the section is
   * no longer folded shut: the important cards and a tip show, the rest behind "Show {n} more".
   *
   * The weekend weather needs the home place (setting "homePlace", answer 1a: entered once with the
   * place search of the trip weather). Its forecast is saved in "meta" (never exported), fetched at
   * most every 3 hours; offline or failed the card shows a saved one up to 12 hours old, else nothing.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { knowCards, wearWhat, sparkPath, needsFetch, HOME_PLACE, HOME_FORECAST } from '../know.js';
  import { TIP, TIPS_KEY, usedTips, fittingTips, pickTips, todayTiles, phoneSplit, markShown, knowTip, updateTips, overview } from '../tips.js';
  import { openTodos } from '../todos.js';
  import { formatWeight, weightText } from '../gear.js';
  import { RAIN } from '../trips.js';
  import { forecastForTrip, toWx } from '../weather.js';
  import { homeForecast } from '../home-weather.js';
  import { sunTimes } from '../blockplan.js';
  import { paceOf, PACE_KEY } from '../pace.js';
  import { learningsFor } from '../debrief.js';
  import { bikesHash } from '../bikes.js';
  import { openNew, openTrip } from '../nav.js';
  import { LAST_BACKUP } from '../backup.js';
  import { SETS_KEY } from '../sets.js';
  import { standalone } from '../install.js';
  import { t, tn, num, locale, nameOf } from '../i18n.svelte.js';
  import { phone } from '../media.svelte.js';
  import { TEMPLATES_KEY } from '../templates.js';
  import { ChevronRight } from '@lucide/svelte';
  import { TIP_ICON, CARD_ICON } from './icons.js';
  import HomePlaceForm from './HomePlaceForm.svelte';
  import TipButton from './TipButton.svelte';

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

  const paceQ = liveQuery(async () => (await db.settings.get(PACE_KEY)) ?? null);
  // null = no home place yet, undefined = still reading
  const placeQ = liveQuery(async () => (await db.settings.get(HOME_PLACE))?.value ?? null);
  const fcQ = liveQuery(async () => (await db.meta.get(HOME_FORECAST)) ?? null);
  // v0.28.0 (AP25 6a): the templates, for the card "{n} suggestions for your templates".
  const tplQ = liveQuery(async () => (await db.settings.get(TEMPLATES_KEY))?.value ?? []);

  const pace = $derived(paceOf($paceQ?.value));
  const todos = $derived(loaded ? openTodos({ bikes, items, pace, debriefs, trips }) : []);
  const fc = $derived(next ? toWx(forecastForTrip(next)) : null);
  const sun = $derived(next?.startDate && place?.lat != null ? sunTimes(next.startDate, place.lat, place.lon) : null);
  const tips = $derived(learningsFor(next, learnings, 1));
  const cards = $derived(
    loaded
      ? knowCards({ today, todos, backup, demo, next, fc, sun, tips, pace, notes, bikes, trips, debriefs, visits, items, containers, templates: $tplQ ?? [], homePlace: $placeQ, homeForecast: $fcQ, placeLoading: $placeQ === undefined || $fcQ === undefined })
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
  let editPlace = $state(false);

  /* ---------- v0.30.0 (Noah 1a): the 6 tiles, tips with what is used ---------- */
  const tipsQ = liveQuery(async () => (await db.settings.get(TIPS_KEY))?.value ?? null);
  const setsQ = liveQuery(async () => (await db.settings.get(SETS_KEY))?.value ?? []);
  const notesN = liveQuery(() => db.notes.count());
  const backupQ = liveQuery(async () => {
    const [file, folder] = await Promise.all([db.meta.get(LAST_BACKUP), db.meta.get('backupFolder')]);
    return file?.at ?? folder?.lastWrite ?? null;
  });
  const langSet = (() => {
    try {
      return localStorage.getItem('lang') != null;
    } catch {
      return false;
    }
  })();
  // Every source read: before that a tip could look unused and stay chosen for the whole day.
  const ready = $derived(loaded && $tipsQ !== undefined && $placeQ !== undefined && $setsQ !== undefined && $notesN !== undefined && $backupQ !== undefined && $tplQ !== undefined && $paceQ !== undefined);
  const used = $derived(
    usedTips({ trips, items, bikes, visits, debriefs, templates: $tplQ ?? [], sets: $setsQ ?? [], notesN: $notesN ?? 0, homePlace: $placeQ, pace, lastBackup: $backupQ, demo, langSet, standalone: standalone() }),
  );
  const fit = $derived(fittingTips({ trips, items, bikes, debriefs }, today));
  const tiles = $derived(ready ? todayTiles(cards, (n) => pickTips({ state: $tipsQ, used, fit, today, n }), today) : []);
  const tipIds = $derived(tiles.filter((x) => x.kind === 'tip').map((x) => x.id));
  // Remember today's tips and count the days each one showed (a tip shown 3 days without a tap rests).
  $effect(() => {
    if (!ready || !markShown($tipsQ, tipIds, today).changed) return;
    const ids = [...tipIds];
    updateTips(db, (s) => {
      const r = markShown(s, ids, today);
      return r.changed ? r.state : null;
    });
  });
  const know = (id) => updateTips(db, (s) => knowTip(s, id, today));
  const split = $derived(phone.matches ? phoneSplit(tiles) : { shown: tiles, more: [] });
  let showMore = $state(false);
  const visible = $derived(showMore ? tiles : split.shown);
  const progress = $derived(overview($tipsQ, used));

  /* ---------- words ---------- */
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

{#snippet card(c)}
      {@const d = c.data}
      {@const Icon = CARD_ICON[c.key]}
      <div class="sig" class:late={c.prio === 1} data-card={c.key}>
        {#if Icon}<span class="ico" aria-hidden="true"><Icon size={22} strokeWidth={2} /></span>{/if}
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
        {:else if c.key === 'templates'}
          <span class="lbl">{t('Templates')}</span>
          <b>{tn(d.n, '{n} suggestion for your templates', '{n} suggestions for your templates')}</b>
          <span>{t('From your debriefs. You decide; nothing changes on its own.')}</span>
          {@render go(t('Look at them'), '#/pack/templates')}
        {:else if c.key === 'weekend'}
          <span class="lbl">{t('Weekend ride weather')} · {d.place.name.split(',')[0]}</span>
          <b>{d.days.map((x) => t('{day} {max} °C {rain}', { day: weekday(x.date), max: x.max, rain: t(RAIN[x.rain]) })).join(' · ')}</b>
          {#if editPlace}<HomePlaceForm onchosen={() => (editPlace = false)} />{/if}
          <span class="src">Open-Meteo · <button type="button" class="link" onclick={() => (editPlace = !editPlace)} aria-expanded={editPlace}>{t('Change place')}</button></span>
          {@render go(t('Plan a trip'), null, () => openNew('list'))}
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
{/snippet}

<!-- v0.30.0 (Noah 1a, 2a): a tip: icon, one sentence, ONE button, and "I know it" (gone for good). -->
{#snippet tip(id)}
  {@const x = TIP[id]}
  {@const Icon = TIP_ICON[x.icon]}
  <div class="sig tip" data-tip={id}>
    <span class="ico" aria-hidden="true"><Icon size={22} strokeWidth={2} /></span>
    <span class="lbl">{t('Did you know?')}</span>
    <p class="say">{t(x.text)}</p>
    <div class="acts">
      <TipButton {id} {next} />
      <button type="button" class="knew" onclick={() => know(id)} aria-label={t('I know it: {title}', { title: t(x.title) })}>{t('I know it')}</button>
    </div>
  </div>
{/snippet}

{#if tiles.length}
  <section class="know" aria-labelledby="know-h">
    <h2 id="know-h" class="title">{t('Good to know')}</h2>
    <div class="cards">
      {#each visible as x (x.kind === 'tip' ? `tip:${x.id}` : x.card.key)}
        {#if x.kind === 'tip'}{@render tip(x.id)}{:else}{@render card(x.card)}{/if}
      {/each}
    </div>
    {#if split.more.length}
      <button type="button" class="btn sm morebtn" aria-expanded={showMore} onclick={() => (showMore = !showMore)}>{showMore ? t('Show less') : tn(split.more.length, 'Show {n} more', 'Show {n} more')}</button>
    {/if}
    <!-- v0.30.0 (Noah 3a): everything the app can do, with ✓ and how much is used -->
    <a class="all" href="#/features"><span class="row"><span>{t('What the app can do')}</span><span class="cnt">{t('{n} of {total} used', { n: progress.used, total: progress.total })}</span></span><ChevronRight size={20} aria-hidden="true" /></a>
  </section>
{/if}

<style>
  .lbl {
    font: 600 var(--fs-small)/1.3 var(--font-body);
    color: var(--ink-3);
    margin: 0;
    padding-right: 34px;
  }
  .know h2 {
    margin: 0 0 12px;
    font-size: var(--fs-section);
  }
  /* v0.30.0 (Noah 1a): 6 tiles, a grid on the desktop (3 across at 1440 px), one column on a phone */
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 380px), 1fr));
    gap: 14px;
  }
  .sig {
    position: relative;
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
  /* the icon of the tile, top right; it says nothing the words do not */
  .ico {
    position: absolute;
    top: 14px;
    right: 14px;
    display: inline-flex;
    color: var(--ink-3);
  }
  .sig.tip {
    background: var(--paper-2);
    border-color: transparent;
  }
  .sig b {
    font-size: 17px;
    overflow-wrap: anywhere;
  }
  .sig > span:not(.lbl):not(.src):not(.ico) {
    font-size: 14px;
    color: var(--ink-2);
    overflow-wrap: anywhere;
  }
  .say {
    margin: 0;
    font-size: 16px;
    line-height: 1.4;
    color: var(--ink);
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
  .acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    margin-top: auto;
    padding-top: 4px;
  }
  .acts > :global(.go) {
    margin-top: 0;
  }
  /* "I know it": quiet, but a full 44 px target */
  .knew {
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: 400 var(--fs-small) var(--font-body);
    text-decoration: underline;
    cursor: pointer;
  }
  .morebtn {
    margin-top: 12px;
    min-height: 44px;
    width: 100%;
  }
  /* the row to the overview */
  .all {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 52px;
    margin-top: 12px;
    padding: 10px 14px 10px 16px;
    box-sizing: border-box;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    font-weight: 600;
    text-decoration: none;
  }
  .all:hover {
    background: var(--paper-2);
  }
  .all .row {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 10px;
    flex: 1;
    min-width: 0;
  }
  .all .cnt {
    font-weight: 400;
    color: var(--ink-2);
  }
  .all :global(svg) {
    flex: none;
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
</style>
