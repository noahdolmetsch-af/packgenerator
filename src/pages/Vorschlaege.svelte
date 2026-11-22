<script>
  /**
   * «Tourenvorschläge» (Noah 05.11.2026 «a b, Mockup ja», «1a 2a 3a»), Touren › Träume › Tourenvorschläge (#/trips/vorschlaege).
   * Pilot: five mountain bike tours from the official network «Mountainbikeland Schweiz» (swisstopo, SchweizMobil) in Zurich
   * and Grisons, with the filters region, level and time, «Why this suggestion?», a height profile with the ground, and the
   * real map. The rules are in lib/vorschlaege/regeln.js (pure, tests/vorschlaege.test.js). The data (data/pilot.js) loads only
   * with this page. Tours that do not fit this month (snow) stand grey in their own group, with the reason.
   * Your own data: pace (Dein Tempo), home place and your rides (for «new for you») are only read; «Not for me» and the
   * filters stay on this device. «Keep as a dream» adds the tour to Touren › Träume.
   */
  import { onMount } from 'svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { PACE_KEY, paceOf } from '../lib/pace.js';
  import { HOME_PLACE } from '../lib/know.js';
  import { heatLines } from '../lib/heat/heat.js';
  import { DREAMS_KEY, storeOf, newDream } from '../lib/dreams.js';
  import { saveGpx } from '../lib/gpxout.js';
  import { localDay } from '../lib/localday.js';
  import { deleteWithUndo } from '../lib/ui/ask.js';
  import Empty from '../lib/ui/Empty.svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Profil from '../lib/vorschlaege/Profil.svelte';
  import { REGIONS, LEVELS, LEVELS_STD, HOURS, ARTS, AWAYS, WHY_KEYS, artsOf, filterTours, splitNow, hoursOf, splitHours, snowOf, gridOf, newShare, whyOf, warnsOf, levelsOf, gpxOf, dreamTextOf } from '../lib/vorschlaege/regeln.js';
  import { t, num } from '../lib/i18n.svelte.js';
  import { Mountain, Download, Sparkles, EyeOff, Snowflake, TriangleAlert, Clock, MapPin, Check, Info, ChevronRight } from '@lucide/svelte';
  import '../lib/ich/ich.css';

  const today = localDay();
  const month = Number(today.slice(5, 7));
  const FILTER_KEY = 'vorschlaege.filter';
  const HIDE_KEY = 'tourvorschlaege';

  let tours = $state(null); // the data loads with the page
  onMount(async () => {
    tours = (await import('../lib/vorschlaege/data/pilot.js')).default;
  });

  // ---- hash: the list or one tour (#/trips/vorschlaege/<id>)
  let hash = $state(location.hash);
  onMount(() => {
    const on = () => (hash = location.hash);
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  });
  const openId = $derived(hash.match(/^#\/trips\/vorschlaege\/([\w-]+)/)?.[1] ?? null);

  // ---- filters (kept on this device)
  const read = () => {
    try {
      const f = JSON.parse(localStorage.getItem(FILTER_KEY) || 'null');
      return {
        regions: Array.isArray(f?.regions) ? f.regions.filter((k) => REGIONS.some((r) => r.key === k)) : [],
        levels: Array.isArray(f?.levels) ? f.levels.filter((l) => LEVELS.includes(l)) : [...LEVELS_STD],
        maxHours: HOURS.includes(f?.maxHours) ? f.maxHours : null,
        arts: Array.isArray(f?.arts) ? f.arts.filter((k) => ARTS.includes(k)) : [],
        maxAway: AWAYS.includes(f?.maxAway) ? f.maxAway : null,
      };
    } catch {
      return { regions: [], levels: [...LEVELS_STD], maxHours: null, arts: [], maxAway: null };
    }
  };
  let flt = $state(read());
  $effect(() => {
    const v = $state.snapshot(flt);
    try {
      localStorage.setItem(FILTER_KEY, JSON.stringify(v));
    } catch {
      /* private window: the filters are just not kept */
    }
  });
  const toggle = (key, val) => {
    const list = flt[key];
    flt[key] = list.includes(val) ? list.filter((x) => x !== val) : [...list, val];
  };
  const resetFilters = () => (flt = { regions: [], levels: [...LEVELS_STD], maxHours: null, arts: [], maxAway: null });

  // ---- the lines of «Why this suggestion?» you do not want (kept on this device)
  const WHY_OFF_KEY = 'vorschlaege.whyoff';
  const readOff = () => {
    try {
      const l = JSON.parse(localStorage.getItem(WHY_OFF_KEY) || '[]');
      return Array.isArray(l) ? l.filter((k) => WHY_KEYS.includes(k)) : [];
    } catch {
      return [];
    }
  };
  let whyOff = $state(readOff());
  $effect(() => {
    const v = $state.snapshot(whyOff);
    try {
      localStorage.setItem(WHY_OFF_KEY, JSON.stringify(v));
    } catch {
      /* not kept */
    }
  });
  const toggleWhy = (k) => (whyOff = whyOff.includes(k) ? whyOff.filter((x) => x !== k) : [...whyOff, k]);
  const WHY_NAME = { time: 'Time|why', snow: 'Snow|why', level: 'Difficulty|why', new: 'New for you|why', away: 'Distance from home|why' };

  // ---- your data (only read)
  const paceQ = liveQuery(async () => (await db.settings.get(PACE_KEY))?.value ?? null);
  const homeQ = liveQuery(async () => (await db.settings.get(HOME_PLACE))?.value ?? null);
  const hideQ = liveQuery(async () => (await db.settings.get(HIDE_KEY))?.value ?? null);
  const dreamsQ = liveQuery(() => db.settings.get(DREAMS_KEY));
  const ridesQ = liveQuery(async () => {
    const [activities, rides, tracks] = await Promise.all([db.activities ? db.activities.toArray() : [], db.rides.toArray(), db.tracks ? db.tracks.where('kind').equals('rec').toArray() : []]);
    return { activities, rides, tracks };
  });
  const pace = $derived(paceOf($paceQ));
  const home = $derived($homeQ?.lat != null ? $homeQ : null);
  const hidden = $derived(Array.isArray($hideQ?.hidden) ? $hideQ.hidden : []);
  const grid = $derived($ridesQ ? gridOf(heatLines({ ...$ridesQ, today }).filter((l) => l.kind === 'bike').map((l) => l.pts)) : null);

  async function setHidden(list) {
    await db.settings.put({ key: HIDE_KEY, value: { hidden: list } });
  }
  const hideTour = (tour) =>
    deleteWithUndo({
      name: tour.title,
      text: t('«{name}» is hidden. It will not come back as a suggestion.', { name: tour.title }),
      run: async () => {
        await setHidden([...new Set([...hidden, tour.id])]);
        if (openId) location.hash = '#/trips/vorschlaege';
        return tour.id;
      },
      undo: async (id) => setHidden(hidden.filter((x) => x !== id)),
    });

  // ---- the lists
  const shown = $derived(tours ? filterTours(tours, { regions: flt.regions, levels: flt.levels, maxHours: flt.maxHours, arts: flt.arts, maxAway: flt.maxAway, home, hidden, pace }) : []);
  const split = $derived(splitNow(shown, month));
  const open = $derived(tours && openId ? tours.find((x) => x.id === openId) ?? null : null);

  // ---- texts
  const regionName = (key) => t(REGIONS.find((r) => r.key === key)?.name ?? '');
  const LEVEL_NAME = { easy: 'Easy|level', medium: 'Medium|level', difficult: 'Difficult|level' };
  const levelName = (l) => t(LEVEL_NAME[l]);
  function hoursText(h) {
    const { h: hh, min } = splitHours(h);
    return min ? t('{h} h {min}', { h: hh, min }) : t('{h} h|tour', { h: hh });
  }
  function whyText(r) {
    if (r.k === 'time') {
      const when = hoursText(r.hours);
      if (r.tone === 'warn') return t('About {time}: longer than your {n} h.', { time: when, n: r.window });
      return r.mine ? t('About {time} at your own pace.', { time: when }) : t('About {time} at the standard pace.', { time: when });
    }
    if (r.k === 'snow') {
      if (r.state === 'likely') return t('Snow is likely at {m} m in this month.', { m: num(r.max) });
      if (r.state === 'possible') return t('Snow is possible at {m} m in this month.', { m: num(r.max) });
      return t('No snow expected up to {m} m in this month.', { m: num(r.max) });
    }
    if (r.k === 'level') {
      if (r.cond === 'difficult' && r.tech === 'difficult') return t('Hard for fitness and for skill.');
      return r.cond === 'difficult' ? t('Hard for fitness: long or steep.') : t('Hard for skill: technical trail.');
    }
    if (r.k === 'new') return t('About {n} % of the line is new for you.', { n: r.share });
    return t('About {km} km from home to the start.', { km: r.km });
  }
  const ART_NAME = { trail: 'Single trail|tour', downhill: 'Downhill|tour', gravel: 'Gravel and paths|tour', loop: 'Round trip|tour' };
  const artCount = $derived(tours ? Object.fromEntries(ARTS.map((k) => [k, tours.filter((x) => artsOf(x).includes(k)).length])) : {});
  const toneIcon = (r) => (r.tone === 'warn' ? TriangleAlert : Check);

  // ---- the open tour
  let mark = $state(null);
  const why = $derived(open ? whyOf(open, { month, maxHours: flt.maxHours, pace, grid, home }).filter((r) => !whyOff.includes(r.k)) : []);
  const warns = $derived(open ? warnsOf(open, month) : []);
  $effect(() => {
    open; // a new tour starts without the dot
    mark = null;
  });
  const pickAt = (f) => {
    const line = open.line;
    mark = line[Math.min(line.length - 1, Math.round(f * (line.length - 1)))];
  };
  let note = $state('');
  async function keepDream(tour) {
    const st = storeOf($dreamsQ?.value);
    if (st.dreams.some((d) => d.url === sourceOf(tour))) {
      note = t('«{name}» is already one of your dreams.', { name: tour.title });
      return;
    }
    const kind = st.kinds.some((k) => k.key === 'other') ? 'other' : null;
    const d = newDream({ title: tour.title, kind, days: 1, note: dreamTextOf(tour), url: sourceOf(tour) }, { id: `dream-${Date.now().toString(36)}`, kinds: st.kinds });
    await db.settings.put({ key: DREAMS_KEY, value: $state.snapshot({ dreams: [d, ...st.dreams], kinds: st.kinds }) });
    note = t('«{name}» is kept under Dreams.', { name: tour.title });
  }
  const sourceOf = (tour) => `https://map.schweizmobil.ch/?trackId=${tour.route}`;
  async function gpx(tour) {
    await saveGpx(gpxOf(tour), tour.title);
  }
  const tourClass = (tour) => (tour.kind === 'descent' ? 'Downhill|tour' : tour.kind === 'oneway' ? 'One way|tour' : 'Round trip|tour');
</script>

{#snippet levels(tour)}
  <span class="lv">
    {#if tour.cond}<span class="lvp" data-lv={tour.cond}>{t('Fitness|tour')}: {levelName(tour.cond)}</span>{/if}
    {#if tour.tech}<span class="lvp" data-lv={tour.tech}>{t('Skill|tour')}: {levelName(tour.tech)}</span>{/if}
  </span>
{/snippet}

<div class="ich-page vs" data-page="vorschlaege">
  {#if open}
    <VeloHead crumbs={[{ label: t('Trips|place'), href: '#/trips' }, { label: t('Tour suggestions'), href: '#/trips/vorschlaege' }]} title={open.title} here={open.title} sub={`${regionName(open.region)} · ${t(tourClass(open))}`} />
    <div class="map" data-vs-map>
      {#await import('../lib/spur/TourMap.svelte') then m}<m.default lines={[{ id: open.id, pts: open.line, n: 1, src: 'gpx' }]} marker={mark} height={320} label={t('Map of «{name}»: drag to move, pinch or wheel to zoom', { name: open.title })} />{:catch}{/await}
    </div>
    <p class="src">{t('Map and tour: © swisstopo, SchweizMobil. Check closures and snow on the spot.')}</p>

    <ul class="facts card" data-vs-facts>
      <li><b class="num">{num(open.km)} km</b><small>{t('Length|tour')}</small></li>
      <li><b class="num">+{num(open.up)} m</b><small>{t('Climb|tour')}</small></li>
      <li><b class="num">{hoursText(hoursOf(open, pace))}</b><small>{pace.mine ? t('At your pace') : t('Time|tour')}</small></li>
      <li><b class="num">{num(open.single)} %</b><small>{t('Single trail|tour')}</small></li>
    </ul>
    {@render levels(open)}

    {#if warns.length}
      <section class="warn" role="note" data-vs-warn>
        <TriangleAlert size={18} aria-hidden="true" />
        <div>
          <b>{t('Please check before you ride')}</b>
          {#each warns as w (w.k)}
            <p>{w.k === 'level' ? t('This tour is hard for fitness or skill.') : w.state === 'likely' ? t('Snow is likely up high in this month.') : t('Snow is possible up high in this month.')}</p>
          {/each}
        </div>
      </section>
    {/if}

    <section class="ich-sec" aria-labelledby="vs-prof">
      <div class="ich-h"><div><h2 id="vs-prof">{t('Height and ground')}</h2><p class="ich-hs">{t('Move the slider: the dot shows the place on the map.')}</p></div></div>
      <div class="card pad"><Profil ele={open.ele} cls={open.cls} km={open.km} onpick={pickAt} /></div>
    </section>

    <section class="ich-sec" aria-labelledby="vs-why" data-vs-why>
      <details class="card pad whybox" open>
        <summary id="vs-why">{t('Why this suggestion?')}</summary>
        <ul>
          {#each why as r (r.k)}
            {@const Icon = toneIcon(r)}
            <li class:bad={r.tone === 'warn'}><Icon size={16} aria-hidden="true" /><span>{whyText(r)}</span></li>
          {/each}
        </ul>
        <details class="lines" data-vs-lines>
          <summary>{t('Choose the lines')}</summary>
          <div class="vslrow">
            {#each WHY_KEYS as k (k)}
              <label class="lchk"><input type="checkbox" checked={!whyOff.includes(k)} onchange={() => toggleWhy(k)} data-vs-line={k} />{t(WHY_NAME[k])}</label>
            {/each}
          </div>
        </details>
        {#if !grid}<p class="hint"><Info size={14} aria-hidden="true" />{t('With your own rides (Strava, GPX or recordings) the app also says how much of the tour is new for you.')}</p>{/if}
        {#if !home}<p class="hint"><Info size={14} aria-hidden="true" />{t('Set your home place and the app says how far the start is.')}</p>{/if}
      </details>
    </section>

    <div class="acts">
      <button type="button" class="btn hi" onclick={() => keepDream(open)} data-vs-dream><Sparkles size={16} aria-hidden="true" />{t('Keep as a dream')}</button>
      <button type="button" class="btn" onclick={() => gpx(open)} data-vs-gpx><Download size={16} aria-hidden="true" />{t('Save GPX')}</button>
      <button type="button" class="btn" onclick={() => hideTour(open)} data-vs-hide><EyeOff size={16} aria-hidden="true" />{t('Not for me')}</button>
    </div>
    {#if note}<p class="ok" role="status"><Check size={16} aria-hidden="true" />{note} <a href="#/trips/dreams">{t('Open Dreams')}</a></p>{/if}
    <p class="next"><ChevronRight size={14} aria-hidden="true" />{t('Next: keep it as a dream, then plan it on its day from Dreams.')}</p>
  {:else}
    <VeloHead crumbs={[{ label: t('Trips|place'), href: '#/trips' }]} title={t('Tour suggestions')} sub={t('Mountain bike tours from the official network of SchweizMobil')} />
    <p class="intro">{t('The app suggests tours you can ride. Everything is a suggestion: change the filters, hide what is not for you.')}</p>

    <section class="card pad filters" aria-label={t('Filters|tour')} data-vs-filters>
      <div class="grp" role="group" aria-label={t('Region|tour')}>
        <span class="gl">{t('Region|tour')}</span>
        {#each REGIONS as r (r.key)}
          <button type="button" class="chip" aria-pressed={flt.regions.includes(r.key)} data-vs-region={r.key} onclick={() => toggle('regions', r.key)}>{regionName(r.key)}</button>
        {/each}
      </div>
      <div class="grp" role="group" aria-label={t('Kind of tour')} data-vs-arts>
        <span class="gl">{t('Kind of tour')}</span>
        {#each ARTS.filter((k) => artCount[k]) as k (k)}
          <button type="button" class="chip" aria-pressed={flt.arts.includes(k)} data-vs-art={k} onclick={() => toggle('arts', k)}>{t(ART_NAME[k])}</button>
        {/each}
      </div>
      <div class="grp" role="group" aria-label={t('Start|tour')} data-vs-start>
        <span class="gl">{t('Start|tour')}</span>
        {#if home}
          <button type="button" class="chip" aria-pressed={flt.maxAway === null} data-vs-away="any" onclick={() => (flt.maxAway = null)}>{t('Any|tour')}</button>
          {#each AWAYS as km (km)}
            <button type="button" class="chip" aria-pressed={flt.maxAway === km} data-vs-away={km} onclick={() => (flt.maxAway = km)}>{t('Up to {km} km from home', { km })}</button>
          {/each}
        {:else}
          <span class="hint">{t('Set your home place and you can choose how far the start may be.')}</span>
        {/if}
      </div>
      <div class="grp" role="group" aria-label={t('Difficulty|tour')}>
        <span class="gl">{t('Difficulty|tour')}</span>
        {#each LEVELS as l (l)}
          <button type="button" class="chip" aria-pressed={flt.levels.includes(l)} data-vs-level={l} onclick={() => toggle('levels', l)}>{levelName(l)}</button>
        {/each}
      </div>
      <div class="grp" role="group" aria-label={t('Time|tour')}>
        <span class="gl">{t('Time|tour')}</span>
        <button type="button" class="chip" aria-pressed={flt.maxHours === null} data-vs-hours="any" onclick={() => (flt.maxHours = null)}>{t('Any|tour')}</button>
        {#each HOURS as h (h)}
          <button type="button" class="chip" aria-pressed={flt.maxHours === h} data-vs-hours={h} onclick={() => (flt.maxHours = h)}>{t('Up to {h} h', { h })}</button>
        {/each}
      </div>
      <p class="hint"><Info size={14} aria-hidden="true" />{t('«Medium» and «Difficult» are on at the start: a tour shows when its fitness or its skill level is chosen. Switch «Easy» on to see the easy ones too.')}</p>
    </section>

    {#if !tours}
      <p class="hint" role="status">{t('Loading the tours…')}</p>
    {:else if !shown.length}
      <Empty icon={Mountain} text={hidden.length && !filterTours(tours, { hidden: [], regions: flt.regions, levels: flt.levels, maxHours: flt.maxHours, arts: flt.arts, maxAway: flt.maxAway, home, pace }).length ? t('Nothing left: you hid all of them.') : t('No tour fits these filters.')} action={{ label: t('Reset filters'), onclick: resetFilters }} />
    {:else}
      <section class="ich-sec" aria-labelledby="vs-fit" data-vs-fits>
        <div class="ich-h"><div><h2 id="vs-fit">{t('Fits now')} <small class="n num">{split.fits.length}</small></h2><p class="ich-hs">{t('Tours that suit this month.')}</p></div></div>
        {#if split.fits.length}
          <ul class="cards">
            {#each split.fits as tour (tour.id)}
              {@render card(tour, false)}
            {/each}
          </ul>
        {:else}
          <p class="hint">{t('Nothing fits this month. See the grey group below.')}</p>
        {/if}
      </section>

      {#if split.notNow.length}
        <section class="ich-sec" aria-labelledby="vs-not" data-vs-notnow>
          <div class="ich-h"><div><h2 id="vs-not">{t('Not for today')} <small class="n num">{split.notNow.length}</small></h2><p class="ich-hs">{t('Snow is likely up high in this month. They come back when it melts.')}</p></div></div>
          <ul class="cards">
            {#each split.notNow as tour (tour.id)}
              {@render card(tour, true)}
            {/each}
          </ul>
        </section>
      {/if}
    {/if}

    {#if hidden.length}
      <p class="hint"><EyeOff size={14} aria-hidden="true" />{t('{n} hidden.', { n: hidden.length })} <button type="button" class="btn btn-link" data-vs-unhide onclick={() => setHidden([])}>{t('Show all again')}</button></p>
    {/if}
    <p class="src">{t('Tours: © swisstopo, SchweizMobil («Mountainbikeland Schweiz»). Pilot with five tours in Zurich and Grisons. Check closures and snow on the spot.')}</p>
  {/if}
</div>

{#snippet card(tour, grey)}
  {@const share = grid ? newShare(tour, grid) : null}
  <li class="tc card" class:grey data-vs-tour={tour.id}>
    <a class="tl" href={`#/trips/vorschlaege/${tour.id}`}>
      <span class="th"><b>{tour.title}</b><small>{regionName(tour.region)} · {t(tourClass(tour))}</small></span>
      <span class="nums num"><span><Clock size={14} aria-hidden="true" />{hoursText(hoursOf(tour, pace))}</span><span>{num(tour.km)} km</span><span>+{num(tour.up)} m</span></span>
      {@render levels(tour)}
      {#if artsOf(tour).length}<span class="lv">{#each artsOf(tour) as k (k)}<span class="lvp">{t(ART_NAME[k])}</span>{/each}</span>{/if}
      {#if grey}
        <span class="why"><Snowflake size={14} aria-hidden="true" />{t('Snow is likely at {m} m in this month.', { m: num(tour.max) })}</span>
      {:else if snowOf(tour, month) === 'possible'}
        <span class="why"><Snowflake size={14} aria-hidden="true" />{t('Snow is possible at {m} m in this month.', { m: num(tour.max) })}</span>
      {/if}
      {#if share !== null}<span class="why"><MapPin size={14} aria-hidden="true" />{t('About {n} % new for you', { n: Math.round(share * 100) })}</span>{/if}
    </a>
    <button type="button" class="btn sm" onclick={() => hideTour(tour)} data-vs-hide><EyeOff size={16} aria-hidden="true" />{t('Not for me')}</button>
  </li>
{/snippet}

<style>
  .vs { max-width: 900px; }
  .intro { max-width: 65ch; margin: 0 0 var(--sp-4); color: var(--ink-2); }
  .pad { padding: var(--sp-3); }
  .filters { display: grid; gap: var(--sp-3); margin-bottom: var(--sp-4); }
  .grp { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-width: 0; }
  .gl { font-weight: 700; min-width: 6.5em; color: var(--ink-2); }
  .chip { min-height: 44px; padding: 0 var(--sp-3); border: 1px solid var(--line); border-radius: 99px; background: var(--card); color: var(--ink); font: inherit; font-weight: 600; cursor: pointer; }
  .chip[aria-pressed='true'] { background: var(--accent-soft); color: var(--accent-ink); border-color: var(--accent); }
  .hint { display: flex; gap: 6px; align-items: flex-start; margin: 0; color: var(--ink-3); font-size: var(--fs-small); }
  .hint :global(svg) { flex: none; margin-top: 3px; }
  .cards { display: grid; gap: var(--sp-3); list-style: none; margin: 0; padding: 0; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); }
  .tc { display: grid; gap: var(--sp-2); padding: var(--sp-3); min-width: 0; align-content: start; }
  .tc.grey { opacity: 0.78; background: var(--paper); }
  .tl { display: grid; gap: 6px; color: inherit; text-decoration: none; min-width: 0; }
  .th { display: grid; }
  .th b { overflow-wrap: break-word; }
  .th small { color: var(--ink-3); }
  .nums { display: flex; flex-wrap: wrap; gap: 4px 14px; color: var(--ink-2); }
  .nums span { display: inline-flex; gap: 4px; align-items: center; }
  .lv { display: flex; flex-wrap: wrap; gap: 6px; }
  .lvp { font-size: var(--fs-small); font-weight: 600; border-radius: 99px; padding: 1px var(--sp-2); background: var(--paper); border: 1px solid var(--line); color: var(--ink-2); }
  .lvp[data-lv='difficult'] { border-color: var(--bad); color: var(--bad); }
  .why { display: flex; gap: 6px; align-items: center; font-size: var(--fs-small); color: var(--ink-2); }
  .map { border: 1px solid var(--line); border-radius: var(--r-card); overflow: hidden; margin-bottom: var(--sp-2); }
  .src { margin: 0 0 var(--sp-3); color: var(--ink-3); font-size: var(--fs-small); }
  .facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(7em, 1fr)); gap: var(--sp-2); list-style: none; margin: 0 0 var(--sp-3); padding: var(--sp-3); }
  .facts li { display: grid; }
  .facts b { font-size: var(--fs-body); }
  .facts small { color: var(--ink-3); }
  .warn { display: flex; gap: var(--sp-2); border: 1px solid var(--bad); border-radius: var(--r-card); padding: var(--sp-3); margin: var(--sp-3) 0; color: var(--ink); }
  .warn :global(svg) { flex: none; color: var(--bad); margin-top: 2px; }
  .warn p { margin: 2px 0 0; }
  .whybox ul { list-style: none; margin: var(--sp-2) 0 0; padding: 0; display: grid; gap: 6px; }
  .whybox summary { font-weight: 700; cursor: pointer; min-height: 44px; display: flex; align-items: center; }
  .whybox li { display: flex; gap: 8px; align-items: flex-start; }
  .whybox li :global(svg) { flex: none; margin-top: 3px; color: var(--ok, var(--accent)); }
  .whybox li.bad :global(svg) { color: var(--bad); }
  .lines { margin-top: var(--sp-2); }
  .lines summary { cursor: pointer; color: var(--ink-2); min-height: 44px; display: flex; align-items: center; }
  .vslrow { display: flex; flex-wrap: wrap; gap: 4px 16px; }
  .lchk { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; }
  .acts { display: flex; flex-wrap: wrap; gap: 8px; margin: var(--sp-3) 0; }
  .next { display: flex; gap: 4px; align-items: center; color: var(--ink-3); font-size: var(--fs-small); }
</style>
