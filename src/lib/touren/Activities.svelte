<script>
  /**
   * AT1 «Abgeschlossene Touren» (mockup AT1, Noah 14.10.2026 21:19 «1a 2a 3b 4b at1 freigeben»): every Strava
   * activity on Touren › Übersicht, newest first and by month, with the period (12 Monate / year / Alle) and
   * the sport chips. Each row: the name, the date, the Strava type and the bike the app counted it for, km and
   * Hm, the values of its sport (touren/aktivitaeten.js FIELDS, 3b) and the time in the five HR zones as a bar
   * with min and % (2a). An activity of a trip packed in the app carries «Packmodus: <trip>» with its state;
   * several activities of one such trip are one row. The newest 20 show, «Mehr laden» adds 20 (4b). Rating
   * stays in the Packmodus (4b of the first round). Only to look at, no rating.
   * rows: tourRows (aktivitaeten.js); bikes; today; periodOf: rueckblick.js periodOf.
   */
  import { t, tn, num } from '../i18n.svelte.js';
  import Seg from '../ui/Seg.svelte';
  import TripState from '../ui/TripState.svelte';
  import Empty from '../ui/Empty.svelte';
  import ZoneBar from '../strava/ZoneBar.svelte';
  import KindIcon from '../strava/KindIcon.svelte';
  import Help from '../ui/Help.svelte';
  import { FIELD_HELP } from '../daumen.js'; // FE14: a difficult value explains itself
  import { typeKey, KIND_NAMES } from '../training.js';
  import { PAGE, fieldsOf, inPeriodRows, sportCounts, byMonth, zoneParts } from './aktivitaeten.js';
  import { n0, n1, hours, dates, monthLong, DASH } from '../review/fmt.js';
  import { ChevronRight, Tag, ArrowRight, Bike, Backpack, HeartPulse, Info, Activity } from '@lucide/svelte';

  let { rows = [], bikes = [], today, periodOf, connected = true } = $props();

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
  const list = $derived(kind === 'all' ? inPeriod : inPeriod.filter((r) => (r.kind in KIND_NAMES ? r.kind : 'other') === kind));
  const groups = $derived(byMonth(list.slice(0, shown)));
  const bikeName = $derived(Object.fromEntries(bikes.map((b) => [b.id, b.name])));
  const setMode = (v) => ((mode = v), (shown = PAGE));
  const setKind = (k) => ((kind = k), (shown = PAGE));

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
  const when = (r) => (r.n > 1 ? `${dates(r.day, r.endDay)} · ${tn(r.n, '{n} activity', '{n} activities')}` : `${dates(r.day)}${r.time ? ` · ${r.time}` : ''}`);
  const zmin = (m) => (m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')} h` : t('{n} min', { n: m }));
</script>

<section class="acts" aria-labelledby="trips-acts" data-activities>
  <div class="sh">
    <div>
      <h2 id="trips-acts">{t('Completed trips')}</h2>
      <p class="ss" data-acts-sub>{t('All Strava activities')} · {tn(inPeriod.length, '{n} activity', '{n} activities')} · {t('newest first, by month')}</p>
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
  </div>

  {#if !rows.length}
    <div class="none"><Empty icon={Activity} title={t('No Strava activities yet.')} text={connected ? t('They come with the next fetch from Strava.') : t('Connect Strava once, then every activity shows here.')}>{#if !connected}<a class="btn btn-link" href="#/flow/training" data-connect>{t('Connect Strava')}<ChevronRight size={16} aria-hidden="true" /></a>{/if}</Empty></div>
  {:else if !list.length}
    <div class="none"><Empty icon={Activity} title={t('No activity in this period.')} text={t('Another period or sport shows more.')} action={mode !== 'all' ? { label: t('Show all|filter'), onclick: () => setMode('all'), explain: t('Show all years') } : null} /></div>
  {:else}
    <div class="list" data-act-list>
      {#each groups as g (g.month)}
        <h3 class="mh">{monthLong(g.month)}</h3>
        <ul class="rows">
          {#each g.rows as r (r.id)}
            {@const parts = zoneParts(r.zones)}
            <li class="ar" data-act-row={r.id} data-kind={r.kind}>
              <span class="aic" aria-hidden="true"><KindIcon kind={r.kind} size={18} /></span>
              <div class="am">
                <div class="at">
                  <a class="an" href={r.href}>{r.name || t(typeKey(r.type))}</a>
                  {#if r.pm}<span class="pm" data-pm={r.pm.tripId}><Backpack size={13} aria-hidden="true" />{t('Pack mode: {name}', { name: r.pm.title })}<TripState state={r.pm.state} /></span>{/if}
                </div>
                <p class="as">
                  <span>{when(r)}</span>
                  {#if r.type}<span class="ty" data-type={r.type}><Tag size={12} aria-hidden="true" />{t('Strava type «{type}»', { type: r.type })}</span>{/if}
                  {#if r.bikeId && bikeName[r.bikeId]}<span class="bk" data-bike={r.bikeId}><ArrowRight size={12} aria-hidden="true" /><Bike size={12} aria-hidden="true" />{bikeName[r.bikeId]}</span>{/if}
                </p>
              </div>
              <div class="ak num"><span><b>{r.km > 0 || r.kind !== 'other' ? n1(r.km) : DASH}</b><small>km</small></span><span><b>{n0(r.hm)}</b><small>{t('Hm|col')}</small></span></div>
              <span class="chev" aria-hidden="true"><ChevronRight size={18} /></span>
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
            </li>
          {/each}
        </ul>
      {/each}
    </div>
    {#if list.length > shown}
      <button type="button" class="btn k loadmore" onclick={() => (shown += PAGE)} data-load-more>{t('Load more')}<span class="num">{t('{n} of {all}', { n: num(shown), all: num(list.length) })}</span></button>
    {/if}
    <p class="rv-note hint"><Info size={16} aria-hidden="true" /><span>{t('All values from Strava. TSS from power and your FTP: without a power meter «–». A multi-day trip of the Packmodus is one row with all its activities. Only to look at, no rating.')}</span></p>
  {/if}
</section>

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
  .pm {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 2px 4px 2px 10px;
    border-radius: 999px;
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
    grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
    gap: 6px 12px;
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
  @media (max-width: 700px) {
    .list {
      padding: 4px 8px 8px;
    }
    .ar {
      grid-template-columns: 36px minmax(0, 1fr) 18px;
      padding: 14px 2px;
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
