<script>
  /**
   * AT1 «Abgeschlossene Touren» (mockup AT1, Noah 14.10.2026 21:19 «1a 2a 3b 4b at1 freigeben»): every Strava
   * activity on Touren › Übersicht, newest first and by month, with the period (12 Monate / year / Alle) and
   * the sport chips. Each row: the name, the date, the Strava type and the bike the app counted it for, km and
   * Hm, the values of its sport (touren/aktivitaeten.js FIELDS, 3b) and the time in the five HR zones as a bar
   * with min and % (2a). An activity of a trip packed in the app carries «Packmodus: <trip>» with its state;
   * several activities of one such trip are one row. The newest 20 show, «Mehr laden» adds 20 (4b). Rating
   * stays in the Packmodus (4b of the first round). Only to look at, no rating.
   * Part 2: «Filter» (ActFilterSheet.svelte, actfilter.js) beside the sport chips, the active filters as
   * chips to tap away, the saved ones as «Meine Filter» above the list.
   * rows: tourRows (aktivitaeten.js); bikes; today; periodOf: rueckblick.js periodOf; saved: the saved
   * filters; onsave(name, filter); ondrop(id).
   * 0.163.0 «Handy kurz» (Noah 15.10.2026, answer 2b): on a phone the newest PHONE_ROWS show, then «Show n more»;
   * a row's values are one grey line (ACT_LINE: Dauer, Verstrichen, Ø Tempo, Ø/max. HF, TSS, Ø Leistung,
   * without the missing ones), the zones and the other values after a tap on the activity. A computer keeps the full rows.
   * Tour-Seite (Noah 19.10.2026 «4 beides 5a»): the list shows as rows, tiles, a map or a calendar (LIST_VIEWS,
   * kept for next time); «Auswählen» chooses several to join into one tour or to hide; «Ausgeblendete zeigen»
   * brings the hidden ones back into view. A row opens the page «Tour».
   * view, onview(v); lineOf(row): the map lines of a row; onjoin(rows), onhide(rows), onshow(rows).
   * Gesamttest 20.10.2026 B3 (Noah «3a»): the list lives on its own tab Touren › Fahrten (#/trips/rides); its head
   * says «Alle Aktivitäten», a trip packed in the app is marked «Mit Packliste: <trip>».
   */
  import { t, tn, num } from '../i18n.svelte.js';
  import ActTiles from './ActTiles.svelte';
  import ActCal from './ActCal.svelte';
  import ActMap from './ActMap.svelte';
  import { LIST_VIEWS } from './tour.js';
  import Seg from '../ui/Seg.svelte';
  import TripState from '../ui/TripState.svelte';
  import Empty from '../ui/Empty.svelte';
  import ZoneBar from '../strava/ZoneBar.svelte';
  import KindIcon from '../strava/KindIcon.svelte';
  import Help from '../ui/Help.svelte';
  import { FIELD_HELP } from '../daumen.js'; // FE14: a difficult value explains itself
  import { typeKey, KIND_NAMES } from '../training.js';
  import { PAGE, fieldsOf, inPeriodRows, sportCounts, byMonth, zoneParts } from './aktivitaeten.js';
  import { emptyActFilter, normActFilter, filterActs, actChips, withoutActChip, sameActFilter } from './actfilter.js';
  import ActFilterSheet from './ActFilterSheet.svelte';
  import { n0, n1, hours, dates, monthLong, DASH } from '../review/fmt.js';
  import { phone } from '../media.svelte.js';
  import { PHONE_ROWS, ACT_LINE, shortLine, capGroups } from './kurz.js';
  import { ChevronRight, ChevronDown, Tag, ArrowRight, Bike, Backpack, HeartPulse, Info, Activity, SlidersHorizontal, Bookmark, X, Search, Check, ListChecks, Link2, EyeOff, Eye, LayoutGrid } from '@lucide/svelte';

  let { rows: allRows = [], bikes = [], today, periodOf, connected = true, saved = [], onsave, ondrop, view = 'rows', onview, lineOf: mapLines = () => [], onjoin, onhide, onshow } = $props();

  // Tour-Seite: hidden tours stay out unless «Ausgeblendete zeigen»
  let showHid = $state(false);
  const hiddenN = $derived(allRows.filter((r) => r.hidden).length);
  const rows = $derived(showHid ? allRows : allRows.filter((r) => !r.hidden));
  const VIEWS = $derived(LIST_VIEWS.map((v) => ({ key: v.key, name: t(v.name) })));
  // 5a: choose several (not the trips of the Packmodus: they are a tour already)
  let picking = $state(false);
  let picked = $state(new Set());
  const canPick = (r) => !r.pm;
  const togglePick = (r) => {
    if (!canPick(r)) return;
    const next = new Set(picked);
    next.has(r.id) ? next.delete(r.id) : next.add(r.id);
    picked = next;
  };
  const pickedRows = $derived(allRows.filter((r) => picked.has(r.id)));
  const endPick = () => ((picking = false), (picked = new Set()));

  let mode = $state('12m');
  let kind = $state('all');
  let shown = $state(PAGE);
  const PERIODS = $derived([
    { key: '12m', name: t('12 months') },
    { key: 'year', name: today.slice(0, 4) },
    { key: 'all', name: t('All|period') },
  ]);
  const inPeriod = $derived(inPeriodRows(rows, periodOf(mode, today)));
  const chips = $derived(sportCounts(inPeriod));
  const ofKind = $derived(kind === 'all' ? inPeriod : inPeriod.filter((r) => (r.kind in KIND_NAMES ? r.kind : 'other') === kind));
  let filter = $state(emptyActFilter());
  let sheet = $state(false);
  const list = $derived(filterActs(ofKind, filter));
  let phoneAll = $state(false); // 0.163.0: on a phone «Show n more» opens the page of 20
  const short = $derived(phone.matches && !phoneAll);
  const groups = $derived(short ? capGroups(byMonth(list.slice(0, PHONE_ROWS)), PHONE_ROWS) : byMonth(list.slice(0, shown)));
  const bikeName = $derived(Object.fromEntries(bikes.map((b) => [b.id, b.name])));
  const setMode = (v) => ((mode = v), (shown = PAGE));
  const setKind = (k) => ((kind = k), (shown = PAGE));
  const setFilter = (f) => ((filter = normActFilter(f)), (shown = PAGE));
  const fchips = $derived(actChips(filter, bikeName));
  const setSaved = (x) => setFilter(sameActFilter(filter, x.f) ? emptyActFilter() : x.f);

  /** The label, the value and the unit of each field. */
  const secs = (s) => hours(s ? s / 3600 : null);
  const FIELD = {
    dauer: (r) => [t('Duration|act'), secs(r.dauer), ''],
    verstr: (r) => [t('Elapsed|col'), secs(r.verstr), ''],
    tss: (r) => [t('TSS'), n0(r.tss), ''],
    hf: (r) => [t('Ø HR'), n0(r.hf), t('bpm')],
    hfmax: (r) => [t('Max. HR'), n0(r.hfmax), t('bpm')],
    tf: (r) => [t('Ø cadence'), n0(r.tf), r.kind === 'run' ? t('steps/min') : t('rpm')],
    kmh: (r) => [t('Ø speed'), n1(r.kmh), 'km/h'],
    kmhmax: (r) => [t('Max. speed'), n1(r.kmhmax), 'km/h'],
    w: (r) => [t('Ø power'), n0(r.w), 'W'],
    wmax: (r) => [t('Max. power'), n0(r.wmax), 'W'],
    w20: (r) => [t('Max. 20 min'), n0(r.w20), 'W'],
  };
  const HELP = { dauer: 'moving', verstr: 'elapsed' };
  /** 0.163.0 (2b): the grey line of a row on a phone. */
  const lineOf = (r) => shortLine(ACT_LINE.filter((f) => fieldsOf(r).includes(f)).map((f) => FIELD[f](r)), DASH);
  const when = (r) => (r.n > 1 ? `${dates(r.day, r.endDay)} · ${tn(r.n, '{n} activity', '{n} activities')}` : `${dates(r.day)}${r.time ? ` · ${r.time}` : ''}`);
  const zmin = (m) => (m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')} h` : t('{n} min', { n: m }));
</script>

<section class="acts" aria-labelledby="trips-acts" data-activities>
  <div class="sh">
    <div>
      <h2 id="trips-acts">{t('All activities|rides')}</h2>
      <p class="ss" data-acts-sub>{tn(inPeriod.length, '{n} activity', '{n} activities')}{#if !phone.matches}{' · '}{t('newest first, by month')}{/if}</p>
    </div>
    <a class="btn btn-link more" href="#/flow/training?view=list">{t('In Training')}<ChevronRight size={16} aria-hidden="true" /></a>
  </div>
  <div class="tools">
    <Seg full={false} label={t('Period')} value={mode} options={PERIODS} onchange={setMode} />
    {#if inPeriod.length}<div class="kchips" role="group" aria-label={t('Sport')}>
      {#each chips as c (c.key)}
        <button type="button" class="kc" aria-pressed={kind === c.key} onclick={() => setKind(c.key)} data-kind={c.key}>
          {#if c.key !== 'all'}<KindIcon kind={c.key} size={15} />{/if}{c.key === 'all' ? t('All|kind') : t(KIND_NAMES[c.key])}<span class="num">{num(c.n)}</span>
        </button>
      {/each}
    </div>{/if}
    {#if rows.length}<button type="button" class="btn k fbtn" aria-haspopup="dialog" onclick={() => (sheet = true)} data-act-filter-open><SlidersHorizontal size={17} aria-hidden="true" /><span class="kl">{t('Filter')}</span>{#if fchips.length}<span class="fn num" data-act-filter-n>{fchips.length}</span>{/if}</button>{/if}
  </div>
  <!-- «Handy kurz»: on a phone the views wait behind «Ansicht und Auswahl» under the five rows (page at most 3 screens) -->
  {#if allRows.length && !(short && view === 'rows' && list.length > PHONE_ROWS)}
    <div class="views" data-act-views>
      <Seg full={false} label={t('View')} value={view} options={VIEWS} onchange={(v) => (endPick(), onview?.(v))} />
      <div class="vb">
        {#if hiddenN}<button type="button" class="btn btn-link" aria-pressed={showHid} onclick={() => (showHid = !showHid)} data-show-hidden>{#if showHid}<EyeOff size={16} aria-hidden="true" />{t('Leave out hidden')}{:else}<Eye size={16} aria-hidden="true" />{tn(hiddenN, 'Show {n} hidden', 'Show {n} hidden')}{/if}</button>{/if}
        {#if view === 'rows' || view === 'tiles'}<button type="button" class="btn btn-link" aria-pressed={picking} onclick={() => (picking ? endPick() : (picking = true))} data-act-pick>{#if picking}{t('Done')}{:else}<ListChecks size={16} aria-hidden="true" />{t('Choose several')}{/if}</button>{/if}
      </div>
    </div>
    {#if picking}<p class="pickhint tp-small" data-pick-hint>{t('Tap the activities that belong together, then «Join into one tour». Trips with a packing list are a tour already.')}</p>{/if}
  {/if}
  {#if saved.length}
    <div class="mine" role="group" aria-label={t('My filters')} data-act-my-filters>
      <span class="al"><Bookmark size={14} aria-hidden="true" />{t('My filters')}</span>
      {#each saved as x (x.id)}<button type="button" class="mf" aria-pressed={sameActFilter(filter, x.f)} onclick={() => setSaved(x)} data-saved={x.name}>{x.name}</button>{/each}
    </div>
  {/if}
  {#if fchips.length}
    <div class="active" data-act-active-filters>
      <span class="al">{t('Active|filter')}</span>
      {#each fchips as c (c.id)}<button type="button" class="ac" data-chip={c.id} aria-label={t('Remove filter {name}', { name: t(c.label, c.vars) })} onclick={() => setFilter(withoutActChip(filter, c))}>{t(c.label, c.vars)}<X size={15} aria-hidden="true" /></button>{/each}
      <button type="button" class="btn btn-link clear" onclick={() => setFilter(emptyActFilter())} data-clear-filters>{t('Clear filters')}</button>
    </div>
  {/if}

  {#if !rows.length}
    <div class="none"><Empty icon={Activity} title={t('No Strava activities yet.')} text={connected ? t('They come with the next fetch from Strava.') : t('Connect Strava once, then every activity shows here.')}>{#if !connected}<a class="btn btn-link" href="#/flow/training" data-connect>{t('Connect Strava')}<ChevronRight size={16} aria-hidden="true" /></a>{/if}</Empty></div>
  {:else if !list.length && fchips.length}
    <div class="none"><Empty icon={Search} title={t('No activity matches.')} text={t('Another filter or period shows more.')} action={{ label: t('Clear filters'), onclick: () => setFilter(emptyActFilter()), explain: t('Show all activities of the period') }} /></div>
  {:else if !list.length}
    <div class="none"><Empty icon={Activity} title={t('No activity in this period.')} text={t('Another period or sport shows more.')} action={mode !== 'all' ? { label: t('Show all|filter'), onclick: () => setMode('all'), explain: t('Show all years') } : null} /></div>
  {:else if view === 'tiles'}
    <ActTiles rows={list.slice(0, shown)} lineOf={mapLines} {picking} {picked} onpick={togglePick} />
    {#if list.length > shown}<button type="button" class="btn k loadmore" onclick={() => (shown += PAGE)} data-load-more>{t('Load more')}<span class="num">{t('{n} of {all}', { n: num(shown), all: num(list.length) })}</span></button>{/if}
  {:else if view === 'map'}
    <ActMap rows={list} lineOf={mapLines} />
  {:else if view === 'cal'}
    <ActCal rows={list} start={list[0].day.slice(0, 7)} />
  {:else}
    <div class="list" data-act-list>
      {#each groups as g (g.month)}
        <h3 class="mh">{monthLong(g.month)}</h3>
        <ul class="rows">
          {#each g.rows as r (r.id)}
            {@const parts = zoneParts(r.zones)}
            <li class="ar" class:picking class:on={picked.has(r.id)} class:hid={r.hidden} data-act-row={r.id} data-kind={r.kind}>
              {#if picking && canPick(r)}<button type="button" class="pickhit" aria-pressed={picked.has(r.id)} aria-label={t('Choose {name}', { name: r.name || t(typeKey(r.type)) })} onclick={() => togglePick(r)} data-pick={r.id}></button>{/if}
              <span class="aic" aria-hidden="true">{#if picking && canPick(r)}<span class="ck">{#if picked.has(r.id)}<Check size={16} />{/if}</span>{:else}<KindIcon kind={r.kind} size={18} />{/if}</span>
              <div class="am">
                <div class="at">
                  <a class="an" href={r.href}>{r.name || t(typeKey(r.type))}</a>
                  {#if r.grp}<span class="pm grp" data-grp={r.grp.id}><Link2 size={13} aria-hidden="true" />{t('joined')}</span>{/if}
                  {#if r.changed?.length}<span class="chg">{t('changed')}</span>{/if}
                  {#if r.hidden}<span class="chg"><EyeOff size={12} aria-hidden="true" />{t('hidden')}</span>{/if}
                  {#if r.pm}<span class="pm" data-pm={r.pm.tripId}><Backpack size={13} aria-hidden="true" />{t('With packing list: {name}', { name: r.pm.title })}<TripState state={r.pm.state} /></span>{/if}
                </div>
                <p class="as">
                  <span>{when(r)}</span>
                  {#if r.type}<span class="ty" data-type={r.type}><Tag size={12} aria-hidden="true" />{t('Strava type «{type}»', { type: r.type })}</span>{/if}
                  {#if r.bikeId && bikeName[r.bikeId]}<span class="bk" data-bike={r.bikeId}><ArrowRight size={12} aria-hidden="true" /><Bike size={12} aria-hidden="true" />{bikeName[r.bikeId]}</span>{/if}
                </p>
              </div>
              {#if !phone.matches || r.km > 0 || r.hm}<div class="ak num"><span><b>{r.km > 0 || r.kind !== 'other' ? n1(r.km) : DASH}</b><small>km</small></span><span><b>{n0(r.hm)}</b><small>{t('Hm|col')}</small></span></div>{/if}
              <span class="chev" aria-hidden="true"><ChevronRight size={18} /></span>
              {#if phone.matches}
                <!-- 0.163.0 (2b): one grey line; the zones and the other values after a tap -->
                {@const line = lineOf(r)}
                {#if line}<p class="aline num" data-act-line>{line}</p>{/if}
              {:else}
                <dl class="av" data-act-values>
                  {#each fieldsOf(r) as f (f)}
                    {@const [label, value, unit] = FIELD[f](r)}
                    <div class="vc" data-field={f}><dt>{label}{#if HELP[f]}<Help {label} text={t(FIELD_HELP[HELP[f]])} />{/if}</dt><dd class="num">{value}{#if unit && value !== DASH}{' '}<small>{unit}</small>{/if}</dd></div>
                  {/each}
                </dl>
                <div class="az" data-act-zones>
                  <span class="azl"><HeartPulse size={14} aria-hidden="true" />{t('Time in HR zones')}</span>
                  {#if parts}
                    <span class="azb"><ZoneBar secs={r.zones} h={10} /></span>
                    <ul class="azv">
                      {#each parts as p, i (i)}<li><b class="z{i + 1}">Z{i + 1}</b><span class="num">{zmin(p.min)}</span><small class="num">{p.pct} %</small></li>{/each}
                    </ul>
                  {:else}
                    <span class="azn">{r.hf != null ? t('Comes when the activity is opened once.') : t('No heart rate.')}</span>
                  {/if}
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      {/each}
    </div>
    {#if short && list.length > PHONE_ROWS}
      <div class="pmrow">
        <button type="button" class="phone-more" onclick={() => (phoneAll = true)} data-act-phone-more><ChevronDown size={16} aria-hidden="true" />{tn(list.length - PHONE_ROWS, 'Show {n} more activity', 'Show {n} more activities')}</button>
        <button type="button" class="phone-more pmv" onclick={() => (phoneAll = true)} aria-label={t('Views|act')} title={t('Views|act')} data-act-views-open><LayoutGrid size={16} aria-hidden="true" /><span class="pmvt">{t('Views|act')}</span></button>
      </div>
    {:else if !short && list.length > shown}
      <button type="button" class="btn k loadmore" onclick={() => (shown += PAGE)} data-load-more>{t('Load more')}<span class="num">{t('{n} of {all}', { n: num(shown), all: num(list.length) })}</span></button>
    {/if}
    <p class="rv-note hint hide-phone"><Info size={16} aria-hidden="true" /><span>{t('All values from Strava. TSS from power and your FTP: without a power meter «–». A multi-day trip with a packing list is one row with all its activities. Only to look at, no rating.')}</span></p>
  {/if}
  {#if picking && allRows.length}
    <div class="pickbar" role="region" aria-label={t('Chosen')} data-pick-bar>
      <span class="num">{tn(picked.size, '{n} chosen', '{n} chosen')}</span>
      <button type="button" class="btn" disabled={picked.size < 1} onclick={() => (onhide?.(pickedRows), endPick())} data-pick-hide><EyeOff size={16} aria-hidden="true" />{t('Hide')}</button>
      {#if showHid}<button type="button" class="btn" disabled={!pickedRows.some((r) => r.hidden)} onclick={() => (onshow?.(pickedRows), endPick())} data-pick-show><Eye size={16} aria-hidden="true" />{t('Show again')}</button>{/if}
      <button type="button" class="btn hi" disabled={picked.size < 2} onclick={() => (onjoin?.(pickedRows), endPick())} data-pick-join><Link2 size={16} aria-hidden="true" />{t('Join into one tour')}</button>
    </div>
  {/if}
</section>

{#if sheet}
  <ActFilterSheet {filter} rows={ofKind} {bikes} {saved} onapply={setFilter} {onsave} {ondrop} onclose={() => (sheet = false)} />
{/if}

<style>
  .acts {
    margin: 0 0 var(--sp-5);
  }
  .sh {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 4px 16px;
    margin: 0 0 var(--sp-2);
  }
  .sh h2 {
    margin: 0;
    font: 600 var(--fs-section) / 1.25 var(--font-body);
  }
  .ss {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .more {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    text-decoration: none;
  }
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 14px;
    margin: 0 0 var(--sp-3);
  }
  .fbtn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    margin-left: auto;
  }
  .fn {
    display: inline-grid;
    place-items: center;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--ink);
    color: var(--paper);
    font: 600 var(--fs-tiny) / 1 var(--font-body);
  }
  .mine,
  .active {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2);
    margin: 0 0 var(--sp-2);
  }
  .al {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-2);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
  }
  .mf,
  .ac {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 14px;
    border: 1px dashed var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.2 var(--font-body);
    cursor: pointer;
  }
  .mf[aria-pressed='true'],
  .ac {
    border: 1px solid var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .clear {
    min-height: 44px;
  }
  .kchips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .kc {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--card-line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1 var(--font-body);
    cursor: pointer;
  }
  .kc .num {
    color: var(--ink-2);
  }
  .kc[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .kc[aria-pressed='true'] .num {
    color: inherit;
    opacity: 0.8;
  }
  .kc:focus-visible {
    outline: var(--focus-ring);
  }
  .list {
    padding: 6px 12px 10px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .mh {
    margin: 14px 4px 4px;
    color: var(--ink-2);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .rows {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .ar {
    position: relative;
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) auto 20px;
    align-items: center;
    gap: 8px 14px;
    padding: 14px 6px;
    border-top: 1px solid var(--card-line);
  }
  .ar:first-child {
    border-top: 0;
  }
  .aic {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--st-done-soft);
    color: var(--st-done);
  }
  .am {
    min-width: 0;
  }
  .at {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
  }
  .an {
    color: var(--ink);
    font: 600 var(--fs-body) / 1.3 var(--font-body);
    text-decoration: none;
    overflow-wrap: break-word;
  }
  .an:hover {
    text-decoration: underline;
  }
  /* bug fix (Noah 19.10.2026 «kann ich nicht anklicken»): the whole row opens the activity, not only its name */
  .views {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 14px;
    margin: 0 0 var(--sp-3);
  }
  .vb {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
  }
  .vb .btn-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .pickhint {
    margin: -4px 0 var(--sp-2);
    color: var(--ink-2);
  }
  .pickhit {
    position: absolute;
    inset: 0;
    z-index: 2;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .pickhit:focus-visible {
    outline: var(--focus-ring);
    outline-offset: -3px;
  }
  .ar.on {
    background: var(--paper-2);
  }
  .ar.hid {
    opacity: 0.7;
  }
  .ck {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border: 2px solid var(--ink);
    border-radius: 6px;
    background: var(--paper);
  }
  .ar.on .ck {
    background: var(--ink);
    color: var(--paper);
  }
  .chg {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 1px 8px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .pm.grp {
    padding: 2px 10px;
  }
  .pickbar {
    position: sticky;
    bottom: 12px;
    z-index: 4;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin-top: var(--sp-3);
    padding: 10px 14px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .pickbar .num {
    flex: 1;
    font-weight: 600;
  }
  .pickbar .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .an::after {
    content: '';
    position: absolute;
    inset: 0;
  }
  .an:focus-visible {
    outline: none;
  }
  .an:focus-visible::after {
    outline: var(--focus-ring);
    outline-offset: -3px;
  }
  .ar:hover {
    background: var(--paper-2);
  }
  /* the values sit above the row's link to place their «?»; a tap on them still opens the row, the «?» keeps its own tap */
  .av {
    pointer-events: none;
  }
  .av :global(button),
  .av :global(.help) {
    pointer-events: auto;
  }
  .pm {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 2px 4px 2px 10px;
    border-radius: 12px;
    max-width: 100%;
    min-width: 0;
    overflow-wrap: anywhere; /* Impeccable bug: a long tour name wraps instead of running out */
    background: var(--st-plan-soft);
    color: var(--st-plan);
    font-size: var(--fs-tiny);
  }
  .as {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    margin: 3px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ty,
  .bk {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .ty {
    padding: 1px 8px;
    border: 1px solid var(--card-line);
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink);
    font-size: var(--fs-tiny);
  }
  .ak {
    display: flex;
    gap: 22px;
  }
  .ak span {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  .ak b {
    font: 700 var(--fs-body) / 1.1 var(--font-body);
  }
  .ak small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .chev {
    color: var(--ink-2);
  }
  .av {
    grid-column: 2 / 5;
    display: grid;
    /* a ride's eleven values in one line at 1440 */
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 6px 8px;
    margin: 0;
  }
  .vc {
    min-width: 0;
  }
  .vc dt {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    white-space: nowrap;
  }
  /* FE14: the «?» stays small; its sentence opens over the values */
  .av {
    position: relative;
  }
  .vc dt :global(.q) {
    width: 20px;
    height: 20px;
    font-size: var(--fs-tiny);
  }
  .vc dt :global(.help) {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 3;
    white-space: normal;
    box-shadow: 0 6px 18px var(--shadow);
  }
  .vc dd {
    margin: 0;
    font-weight: 600;
  }
  .vc small {
    color: var(--ink-2);
    font-weight: 400;
    font-size: var(--fs-tiny);
  }
  .az {
    grid-column: 2 / 5;
    display: grid;
    grid-template-columns: 160px minmax(0, 1fr);
    align-items: center;
    gap: 6px 14px;
  }
  .azl {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .azv {
    grid-column: 2;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--fs-small);
  }
  .azv li {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 6px;
  }
  .azv b {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .azv b::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 2px;
    background: var(--zc);
  }
  .azv .z1 {
    --zc: var(--z1);
  }
  .azv .z2 {
    --zc: var(--z2);
  }
  .azv .z3 {
    --zc: var(--z3);
  }
  .azv .z4 {
    --zc: var(--z4);
  }
  .azv .z5 {
    --zc: var(--z5);
  }
  .azv small,
  .azn {
    color: var(--ink-2);
  }
  .azn {
    font-size: var(--fs-small);
  }
  .loadmore {
    display: flex;
    gap: 10px;
    margin: var(--sp-3) auto 0;
  }
  .loadmore .num {
    color: var(--ink-2);
    font-weight: 400;
  }
  .hint {
    margin-top: var(--sp-3);
  }
  /* 0.163.0 «Handy kurz»: the grey line of a row and «Show n more» on a phone */
  .aline {
    grid-column: 2 / 4;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .pmrow {
    display: flex;
    gap: var(--sp-2);
  }
  .pmrow .phone-more {
    flex: 1 1 auto;
  }
  .pmrow .pmv {
    flex: none;
    width: auto;
  }
  /* a narrow phone: «Ansichten» as its icon, so «Noch n Aktivitäten zeigen» stays on one line (Handy kurz) */
  @media (max-width: 420px) {
    .pmrow .pmvt {
      display: none;
    }
  }
  .phone-more {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    min-height: 44px;
    margin: var(--sp-2) 0 0;
    padding: 10px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-body) / 1.3 var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  @media (max-width: 719px) {
    .hide-phone,
    .ty {
      display: none;
    }
    /* the sport chips in one line that scrolls sideways */
    .kchips {
      order: 3;
      flex-wrap: nowrap;
      width: 100%;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .kc {
      flex: none;
    }
  }
  @media (max-width: 700px) {
    .fbtn {
      margin-left: 0;
    }
    .list {
      padding: 4px 8px 8px;
    }
    .ar {
      grid-template-columns: 36px minmax(0, 1fr) 18px;
      padding: 10px 2px; /* 0.163.0: a little closer on a phone */
    }
    .aic {
      width: 36px;
      height: 36px;
    }
    .ak {
      grid-column: 2 / 4;
      grid-row: 2;
      gap: 18px;
    }
    .ak span {
      flex-direction: row;
      align-items: baseline;
      gap: 4px;
    }
    .chev {
      grid-column: 3;
      grid-row: 1;
    }
    /* Paket D (CI 19.10.2026): on a phone the grey line uses the whole row width, so it needs fewer lines
       and Trips keeps room under the three screens on every device (it wrapped one line more on CI) */
    .aline {
      grid-column: 1 / 4;
    }
    .av {
      grid-column: 1 / 4;
      /* three columns: «Verstrichen» with its «?» needs the room of a third */
      grid-template-columns: repeat(3, minmax(0, 1fr));
      padding: 10px;
      border-radius: 12px;
      background: var(--paper-2);
    }
    .az {
      grid-column: 1 / 4;
      grid-template-columns: 1fr;
    }
    .azv {
      grid-column: 1;
      gap: 4px;
    }
    .azv li {
      flex-direction: column;
      gap: 0;
    }
  }
</style>
