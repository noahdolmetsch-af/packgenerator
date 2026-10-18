<script>
  /**
   * «Training» TR2 (Noah 13.10.2026 «1-5a», «tr1-4 ok»): Aktiv › Training, every activity from Strava
   * (rides, runs, hikes …, 2a; only rides count for the bikes) with date, time, km, Hm, Ø heart rate
   * and the time in the zones. Chips by kind and a month; a tap opens one activity (TR3,
   * #/flow/training/a/<id>). The zones come from Strava and can be changed here (3a, ?zones=1).
   * TR4: «Woche» (the default view) plans the week and looks back (TrainingWeek.svelte); «Aktivitäten»
   * (?view=list) is the list.
   * Observation only: no value is rated.
   */
  import { untrack } from 'svelte';
  import AreaIntro from '../../lib/intro/AreaIntro.svelte'; // «Einstieg» on top (Noah «4a»)
  import { liveQuery } from 'dexie';
  import { ChevronRight, RefreshCw } from '@lucide/svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import Sec from '../../lib/flow/kit/Sec.svelte';
  import PageHead from '../../lib/ui/PageHead.svelte';
  import Empty from '../../lib/ui/Empty.svelte';
  import Seg from '../../lib/ui/Seg.svelte';
  import TrainingWeek from './TrainingWeek.svelte';
  import ZoneBar from '../../lib/strava/ZoneBar.svelte';
  import KindIcon from '../../lib/strava/KindIcon.svelte';
  import { db } from '../../lib/db.js';
  import { strava, STRAVA_HASH } from '../../lib/strava/client.svelte.js';
  import { zones, saveZones } from '../../lib/strava/zones.svelte.js';
  import { dayWhen } from '../../lib/strava/when.js';
  import { byNewest, zoneSecs, hmm, kindCounts, monthsOf, typeKey, KIND_NAMES, ZONE_NAMES, zoneRange, validBounds } from '../../lib/training.js';
  import { t, num, locale } from '../../lib/i18n.svelte.js';

  let { params = new URLSearchParams() } = $props();

  const PAGE = 40;
  const view = $derived(params.get('view') === 'list' ? 'list' : 'week');
  const setView = (v) => (location.hash = v === 'list' ? '#/flow/training?view=list' : '#/flow/training');
  const actsQ = liveQuery(async () => (await db.activities.toArray()).sort(byNewest));
  const acts = $derived($actsQ ?? []);
  let kind = $state('all');
  let month = $state('');
  let shown = $state(PAGE);
  const chips = $derived(kindCounts(acts));
  const months = $derived(monthsOf(acts));
  const list = $derived(acts.filter((a) => (kind === 'all' || a.kind === kind) && (!month || a.day.startsWith(month))));
  const gearName = (a) => strava.prefs.gear.find((g) => g.id === a.gearId)?.name ?? '';
  const second = (a) => (a.kind === 'bike' && gearName(a) ? gearName(a) : t(typeKey(a.type)));
  const monthName = (m) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', month: 'long', year: 'numeric' });

  // the zones (3a): from Strava, changeable; «Wie Strava» goes back
  let editing = $state(false);
  let draft = $state([...zones.bounds]);
  let zErr = $state('');
  const startEdit = () => {
    draft = [...zones.bounds];
    zErr = '';
    editing = true;
  };
  // «Zonen ändern» on one activity opens #/flow/training?zones=1
  const wantZones = $derived(params.get('zones') === '1');
  $effect(() => {
    if (wantZones && zones.loaded) untrack(startEdit);
  });
  async function keep(e) {
    e.preventDefault();
    const b = draft.map((x) => Number(x));
    if (!validBounds(b)) {
      zErr = t('Four whole numbers between 60 and 230, each higher than the one before.');
      return;
    }
    await saveZones(b);
    editing = false;
  }
  async function asStrava() {
    await saveZones(null);
    editing = false;
  }
  const source = $derived(zones.source === 'own' ? t('your own zones') : zones.source === 'strava' ? t('your zones from Strava') : t('standard zones (maximum heart rate {n})', { n: 190 }));
  const rangeText = (i) => {
    const r = zoneRange(i, zones.bounds);
    return r.from == null ? t('under {n}', { n: r.to + 1 }) : r.to == null ? t('from {n}', { n: r.from }) : `${r.from}–${r.to}`;
  };
</script>

<div class="tr">
  <header class="ph">
    <Crumb path={[{ href: '#/flow', label: t('Active|place') }]} here={t('Training|tab')} />
    <PageHead title={t('Training|tab')} text={t('Every activity from Strava with the time in your heart rate zones')} />
  </header>
  <AreaIntro place="training" />

  <div class="vw"><Seg full={false} label={t('View')} value={view} onchange={setView} options={[{ key: 'week', name: t('Week|training') }, { key: 'list', name: t('Activities') }]} /></div>

  {#if view === 'week'}
    <TrainingWeek {acts} />
  {:else if !acts.length}
    <Empty icon={RefreshCw} title={t('No activities yet')} text={strava.key ? t('The next fetch from Strava brings them, with their heart rate.') : t('Connect Strava once: then every activity comes by itself.')} action={{ label: strava.key ? t('To Strava') : t('Connect Strava'), href: STRAVA_HASH }} />
  {:else}
    <div class="tools">
      <div class="chips" role="group" aria-label={t('Filter by kind')}>
        {#each chips as c (c.key)}<button type="button" class="chip" aria-pressed={kind === c.key} onclick={() => ((kind = c.key), (shown = PAGE))}>{c.key === 'all' ? t('All|activities') : t(KIND_NAMES[c.key])} <span class="num">{c.n}</span></button>{/each}
      </div>
      <label class="mo"><span class="sr">{t('Month')}</span>
        <select class="sel" bind:value={month} onchange={() => (shown = PAGE)}>
          <option value="">{t('All months')}</option>
          {#each months as m (m)}<option value={m}>{monthName(m)}</option>{/each}
        </select>
      </label>
    </div>

    <section class="card tl" aria-labelledby="acts-h" data-section="activities">
      <h2 id="acts-h" class="sr">{t('Activities')}</h2>
      <div class="row head" aria-hidden="true">
        <span></span><span>{t('Date')}</span><span>{t('Activity|one')}</span><span class="r">{t('Time|duration')}</span><span class="r">km</span><span class="r">{t('Hm|short')}</span><span class="r">{t('Ø heart rate')}</span><span>{t('Time in heart rate zones')}</span><span></span>
      </div>
      <ul>
        {#each list.slice(0, shown) as a (a.id)}
          <li>
            <a class="row" href="#/flow/training/a/{encodeURIComponent(a.id)}" data-activity={a.id}>
              <span class="ki"><KindIcon kind={a.kind} /></span>
              <span class="dt num">{dayWhen(a.day)}<small>{a.time}</small></span>
              <span class="nm"><b>{a.name || t(typeKey(a.type))}</b><small>{second(a)}</small></span>
              <span class="r num" data-label={t('Time|duration')}>{hmm(a.movingS)}</span>
              <span class="r num" data-label="km">{a.km ? num(a.km) : '–'}</span>
              <span class="r num" data-label={t('Hm|short')}>{a.hm != null ? num(a.hm) : '–'}</span>
              <span class="r num hr" data-label={t('Ø heart rate')}>{a.hrAvg ?? '–'}</span>
              <span class="pv num">{[hmm(a.movingS), a.km ? `${num(a.km)} km` : '', a.hm != null ? `${num(a.hm)} ${t('Hm|short')}` : '', a.hrAvg != null ? `Ø ${a.hrAvg}` : ''].filter(Boolean).join(' · ')}</span>
              <span class="zb"><ZoneBar secs={zoneSecs(a.hist, zones.bounds)} /></span>
              <span class="go" aria-hidden="true"><ChevronRight size={18} /></span>
            </a>
          </li>
        {/each}
      </ul>
      {#if list.length > shown}<button type="button" class="btn more" onclick={() => (shown += PAGE)}>{t('Show more')} <span class="num">({list.length - shown})</span></button>{/if}
      {#if !list.length}<p class="none">{t('No activity for this choice.')}</p>{/if}
      <div class="lg"><ZoneBar bar={false} legend /></div>
      <p class="hint">{t('The bar fills in once the heart rate of the activity is fetched (the newest by themselves, any other when you open it).')}</p>
    </section>
  {/if}

  <Sec id="zones-h" title={t('Heart rate zones')} sub={source} more={editing ? null : { label: t('change'), onclick: startEdit }}>
    <div class="card zs" data-section="zones">
      {#if editing}
        <form onsubmit={keep}>
          <p class="hint">{t('The upper end of zones 1 to 4, in beats per minute. Zone 5 starts at the last one.')}</p>
          <div class="bd">
            {#each draft as _, i (i)}
              <label><span>Z{i + 1} {t(ZONE_NAMES[i])} {t('up to')}</span><input class="inp num" type="number" inputmode="numeric" min="60" max="230" bind:value={draft[i]} data-bound={i} /></label>
            {/each}
          </div>
          {#if zErr}<p class="err" role="alert">{zErr}</p>{/if}
          <div class="acts">
            <button type="submit" class="btn hi">{t('Save')}</button>
            {#if zones.strava}<button type="button" class="btn" onclick={asStrava}>{t('As in Strava')}</button>{/if}
            <button type="button" class="btn btn-link" onclick={() => (editing = false)}>{t('Cancel')}</button>
          </div>
        </form>
      {:else}
        <ul class="zl">
          {#each ZONE_NAMES as n, i (n)}<li><i class="z{i + 1}"></i><b>Z{i + 1} {t(n)}</b><span class="num">{rangeText(i)}</span></li>{/each}
        </ul>
      {/if}
    </div>
  </Sec>
</div>

<style>
  .tr {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 1240px;
    margin: 0 auto;
    min-width: 0;
  }
  .tr :global(.pagehead) {
    margin: 0;
  }
  .vw {
    align-self: flex-start;
  }
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chip {
    min-height: 44px;
    padding: 0 16px;
    border: 1px solid var(--line);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-body) / 1 var(--font-body);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    border-color: var(--brand);
    background: var(--brand);
    color: var(--brand-ink);
  }
  .tl {
    padding: 8px 20px 16px;
  }
  .tl ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .row {
    display: grid;
    grid-template-columns: 40px 110px minmax(0, 1fr) 64px 64px 64px 64px minmax(120px, 190px) 24px;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--line);
    color: var(--ink);
    text-decoration: none;
  }
  .row.head {
    padding: 8px 0;
    color: var(--ink-2);
    font: 600 var(--fs-tiny) / 1.2 var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  a.row:hover {
    background: var(--paper-2);
  }
  .ki {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius);
    background: var(--paper-2);
  }
  .dt,
  .nm {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .nm b {
    overflow-wrap: break-word;
  }
  .dt small,
  .nm small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .r {
    text-align: right;
  }
  .hr {
    font-weight: 700;
  }
  .go {
    color: var(--ink-2);
  }
  .pv {
    display: none;
  }
  .more {
    margin-top: 12px;
  }
  .none,
  .hint {
    margin: 10px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lg {
    margin-top: 10px;
  }
  @media (max-width: 899px) {
    .row.head {
      display: none;
    }
    .row {
      grid-template-columns: 32px minmax(0, 1fr) auto;
      grid-template-areas: 'ki nm go' 'ki dt go' 'ki vals go' 'ki zb go';
      gap: 2px 12px;
    }
    .ki {
      grid-area: ki;
      align-self: start;
    }
    .nm {
      grid-area: nm;
    }
    .dt {
      grid-area: dt;
      flex-direction: row;
      gap: 6px;
      color: var(--ink-2);
      font-size: var(--fs-small);
    }
    .r {
      display: none;
    }
    .pv {
      display: block;
      grid-area: vals;
      font-size: var(--fs-small);
    }
    .zb {
      grid-area: zb;
      margin-top: 6px;
    }
    .go {
      grid-area: go;
    }
  }
  .zs {
    padding: 14px 20px;
  }
  .zl {
    display: grid;
    /* 0.136.0: all five zones in one row on a computer (220 px left Z5 alone on a second row) */
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 8px 24px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .zl li {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .zl i {
    flex: none;
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }
  .zl b {
    white-space: nowrap;
  }
  .zl span {
    margin-left: auto;
    color: var(--ink-2);
    white-space: nowrap;
  }
  .z1 {
    background: var(--z1);
  }
  .z2 {
    background: var(--z2);
  }
  .z3 {
    background: var(--z3);
  }
  .z4 {
    background: var(--z4);
  }
  .z5 {
    background: var(--z5);
  }
  .bd {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
    margin: 12px 0;
  }
  .bd label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .err {
    color: var(--bad);
  }
</style>
