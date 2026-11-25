<script>
  /**
   * «Heute neu» N2 (Noah 20.10.2026 15:49 «5a»): «Dein Körper heute», the first tile of Heute. Four Fitbit
   * values of today next to yesterday (body.js) and the check of the moment: the Morgen-Check, from the evening
   * round time the Abend-Check (AbCard tells Heute how many questions wait; «Los» opens its window).
   * Observation only: the arrow says up or down, no colour for good or bad.
   * Banner (Noah 23.11.2026 «1-4a»): resting pulse (when Fitbit delivered it), active zone minutes today and yesterday,
   * sleep and HRV next to your usual, one quiet arrow when a value is far from it, «Fetch now» under the values.
   */
  import { liveQuery } from 'dexie';
  import { Activity, ArrowUp, ArrowDown, ArrowRight, ClipboardList, Check, ChevronRight, Info } from '@lucide/svelte';
  import { db } from '../db.js';
  import { addDays } from '../health.js';
  import { afterMorning, stampOf } from '../abfragen.js';
  import { bodyToday, bodyWeek, BANNER_KEYS } from './body.js';
  import { bodyHint, NO_KEY, noOf } from './bodyhints.js';
  import { cleanSettings, SETTINGS_KEY } from '../flow/form/auffaellt.js';
  import { MARKER_KEY, markedDays } from '../flow/marker.js';
  import { putSetting } from '../flowdb.js';
  import { HOME_PLACE } from '../know.js';
  import FitbitStand from '../health/FitbitStand.svelte';
  import TileHead from './TileHead.svelte';
  import { health, fetchNow } from '../health/client.svelte.js';
  import { fitbitEmpty, fitbitStand } from '../health/emptyline.js';
  import { phone } from '../media.svelte.js';
  import { OUTDOOR_KEY, outdoorOf, dayOf } from '../outdoor.js';
  import { levelWord } from '../flow/form/words.js';
  import BodySheet from './BodySheet.svelte';
  import { t, tn, locale } from '../i18n.svelte.js';

  let { today, due = 0, areas = [], evening = false, open = false, onstart = () => {}, check = true } = $props();
  const late = afterMorning(stampOf()); // from 11:00: «Open from this morning» instead of «Morning check» (17.11.2026)

  const hq = $derived(liveQuery(() => (db.healthDays ? db.healthDays.where('date').aboveOrEqual(addDays(today, -34)).toArray() : [])));
  const body = $derived(bodyToday($hq ?? [], today, new Date().getHours()));
  // outdoors (Noah 23.11.2026 «1-4a»): today's minutes of the challenge «outdoors», only while one runs
  const odq = $derived(
    liveQuery(async () => {
      const rec = outdoorOf((await db.settings.get(OUTDOOR_KEY))?.value);
      if (!rec?.from || rec.stopped || today < rec.from || today > rec.until) return null;
      const acts = await db.activities.where('day').equals(today).toArray();
      return { goal: rec.goalMin, total: dayOf(rec, acts, today).total, rec, acts };
    }),
  );
  const od = $derived($odq ?? null);
  // the one quiet hint line (Noah 23.11.2026 «1-4a», point 3): pulse, then week load, then daylight; «Not today» hides one for the day
  const setq = liveQuery(() => db.settings.bulkGet([MARKER_KEY, SETTINGS_KEY, HOME_PLACE, NO_KEY]));
  let minute = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (minute = Date.now()), 60000);
    return () => clearInterval(id);
  });
  const nq = $derived(noOf($setq?.[3]?.value));
  const hint = $derived(
    $setq
      ? bodyHint({ health: $hq ?? [], today, marked: markedDays($setq[0]?.value), settings: cleanSettings($setq[1]?.value), rec: od?.rec, activities: od?.acts ?? [], place: $setq[2]?.value ?? null, now: new Date(minute), no: nq })
      : null,
  );
  const hintText = $derived.by(() => {
    const h = hint;
    if (!h) return '';
    if (h.kind === 'pulse') return tn(h.n, 'Your resting pulse has been {above} beats above your usual for {n} day.', 'Your resting pulse has been {above} beats above your usual for {n} days.', { above: h.above });
    if (h.kind === 'load') return t(h.dir > 0 ? 'Active zone minutes of the last 7 days: {a}, {pct} % more than in your usual week ({b}).' : 'Active zone minutes of the last 7 days: {a}, {pct} % fewer than in your usual week ({b}).', { a: h.recent, pct: h.pct, b: h.base });
    return h.latest ? t('Daylight until {set}. To get the {n} outdoor minutes still missing, start by {latest}.', { set: h.set, n: h.missing, latest: h.latest }) : t('Daylight until {set}. It gets short for the {n} outdoor minutes still missing.', { set: h.set, n: h.missing });
  });
  const HINT_GO = { pulse: '#/flow/form', load: '#/flow/stats/azm', light: '#/flow' };
  const hintNo = () => putSetting(db, NO_KEY, { ...nq, [hint.kind]: today });
  // today's level from Form und Erholung (the same answer as on Aktiv); the big calculation loads only now, not at the start
  let formLevel = $state(null);
  $effect(() => {
    const rows = $hq;
    const d = today;
    if (!rows?.length) return void (formLevel = null);
    let live = true;
    import('../form-data.js').then((m) => m.loadForm(d)).then((f) => live && (formLevel = f?.ready?.level ?? null)).catch(() => live && (formLevel = null));
    return () => (live = false);
  });
  // Noah 2.11.2026 «1a»: nothing new from Fitbit yet → the last values of the last 7 days, each marked with its day
  const lastVals = $derived(body.rows.some((r) => r.now != null) ? null : bodyWeek($hq ?? [], today));
  // Noah 7.11.2026 «1a 2a»: some values are of today, others not yet (Fitbit delivers the night late): each one that is
  // missing shows the last value with its day, and one line says why, with «Fetch now»
  const partial = $derived(body.rows.some((r) => r.now != null) && body.rows.some((r) => r.now == null && r.last));
  const showHint = $derived(health.prefs?.connected && (partial || (lastVals?.any && lastVals.rows.some((r) => r.now != null && r.day !== today))));
  const stand = $derived(fitbitStand(health));
  const dayTag = (day) => (day === addDays(today, -1) ? t('from yesterday') : shortDay(day));
  const n1 = (x) => Number(x).toLocaleString(locale(), { maximumFractionDigits: 1 });
  const LABEL = { pulse: 'Resting pulse|body', sleep: 'Sleep|body', score: 'Sleep score|body', azm: 'Active zone minutes|body', hrv: 'HRV', steps: 'Steps' };
  const TAB = { pulse: 'hr', azm: 'azm', sleep: 'sleep', hrv: 'hrv', steps: 'steps' }; // the tab of Körperwerte a field opens on a computer
  const UNIT = { azm: 'min', hrv: 'ms' };
  const num0 = (x) => Number(x).toLocaleString(locale(), { maximumFractionDigits: 0 });
  // sleep as «4 h 10» (hours and minutes), the other values as whole numbers
  const hm = (h) => `${Math.floor(Math.round(h * 60) / 60)} h ${String(Math.round(h * 60) % 60).padStart(2, '0')}`;
  const fmt = (r, x) => (x == null ? '–' : r.key === 'sleep' ? hm(x) : r.key === 'score' && r.kind === 'efficiency' ? `${x} %` : r.key === 'steps' ? num0(x) : String(Math.round(x)));
  const label = (r) => (r.key === 'score' && r.kind === 'efficiency' ? t('Sleep efficiency|body') : t(LABEL[r.key]));
  const banner = (rows) => BANNER_KEYS.map((k) => rows.find((r) => r.key === k)).filter(Boolean);
  // «geholt 07:12» / «geholt gestern 22:40»: when Fitbit delivered the day
  const fetched = (f) => (f ? t('fetched {when}', { when: f.day === 'today' ? f.hm : `${f.day === 'yesterday' ? t('yesterday') : shortDay(f.day)} ${f.hm}`.trim() }) : '');
  const offWord = (o, key) => (key === 'steps' ? (o < 0 ? t('fewer than yesterday by now') : t('more than yesterday by now')) : o < 0 ? t('lower than usual') : t('higher than usual'));
  // the line under a value of today: pulse = when fetched; steps = yesterday by now (else yesterday whole); sleep, HRV = your usual; else yesterday
  const subOf = (r) => (r.key === 'pulse' ? fetched(r.fetched) : r.key === 'steps' ? (r.byNow != null ? t('yesterday by now {v}', { v: fmt(r, r.byNow) }) : r.before != null ? t('yesterday, whole day {v}', { v: fmt(r, r.before) }) : '') : r.usual != null ? t('usual {v}', { v: fmt(r, r.usual) }) : r.before != null ? t('yesterday {v}', { v: fmt(r, r.before) }) : partial ? t('today|body') : '');
  // «Neuer Schwung» Blatt von unten (Noah 27.10.2026 «a»): on a phone the tile opens a sheet, the computer keeps the link
  let sheet = $state(false);
  const shortDay = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', timeZone: 'UTC' });
</script>

<section class="bd surf" aria-labelledby="bd-h" data-section="body">
  <div class="hd">
    <TileHead icon={Activity} id="bd-h" title={t('Your body today')} />
    {#if phone.matches}
      <button type="button" class="go" aria-haspopup="dialog" onclick={() => (sheet = true)} data-body-open>{t('Details|body')}<ChevronRight size={16} aria-hidden="true" /></button>
    {:else}
      <a class="go" href="#/me/insights">{t('Details|body')}<ChevronRight size={16} aria-hidden="true" /></a>
    {/if}
  </div>
  {#snippet field(r, v, sub, fetch, stale)}
    <div data-body={r.key} class="fld" class:off={r.off}>
      <dt>{label(r)}</dt>
      <dd class="v">
        {#if phone.matches}
          <b class="num" data-body-stale={stale ? '' : undefined}>{fmt(r, v)}</b>
        {:else}
          <a class="va" href="#/flow/stats/{TAB[r.key]}" data-body-go={r.key}><b class="num" data-body-stale={stale ? '' : undefined}>{fmt(r, v)}</b></a>
        {/if}
        {#if UNIT[r.key]}<small>{UNIT[r.key]}</small>{/if}
        {#if r.off}<span class="mk" role="img" aria-label={offWord(r.off, r.key)} title={offWord(r.off, r.key)}>{#if r.off < 0}<ArrowDown size={14} aria-hidden="true" />{:else}<ArrowUp size={14} aria-hidden="true" />{/if}</span>{/if}
      </dd>
      {#if sub}<dd class="yd" title={r.key === 'azm' && r.before != null ? t('yesterday {v}', { v: fmt(r, r.before) }) : undefined}><span class="num">{sub}</span></dd>{/if}
      {#if fetch}<dd class="yd" data-body-fetched><span class="num">{fetch}</span></dd>{/if}
    </div>
  {/snippet}
  {#snippet extras()}
    {#if od}
      <div data-body="outdoor" class="fld">
        <dt>{t('Outdoors')}</dt>
        <dd class="v">{#if phone.matches}<b class="num">{od.total}</b>{:else}<a class="va" href="#/flow" data-body-go="outdoor"><b class="num">{od.total}</b></a>{/if}<small>min</small></dd>
        <dd class="yd"><span class="num">{t('of {n}', { n: od.goal })}</span></dd>
        <dd class="bar" role="img" aria-label={t('{a} of {b} min outdoors', { a: od.total, b: od.goal })}><i style:width="{Math.min(100, Math.round((od.total / Math.max(1, od.goal)) * 100))}%"></i></dd>
      </div>
    {/if}
    {#if formLevel}
      <div data-body="level" class="fld">
        <dt>{t('Today|level')}</dt>
        <dd class="v">{#if phone.matches}<b class="num">{levelWord(formLevel)}</b>{:else}<a class="va" href="#/flow/form" data-body-go="level"><b class="num">{levelWord(formLevel)}</b></a>{/if}</dd>
        <dd class="yd"><span class="num">{t('Form and recovery')}</span></dd>
      </div>
    {/if}
  {/snippet}
  {#if body.rows.some((r) => r.now != null)}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions (the «Details» button does the same by keyboard) -->
    <dl class="vals" class:tap={phone.matches} onclick={() => phone.matches && (sheet = true)}>
      {#each banner(body.rows).filter((r) => r.now != null || r.last) as r (r.key)}
        {#if r.now == null}
          <!-- no reading of today yet: the last value, with its day (never an empty dash) -->
          {@render field(r, r.last.value, dayTag(r.last.day), r.key === 'pulse' ? fetched(r.fetched) : '', true)}
        {:else}
          {@render field(r, r.now, subOf(r), '', false)}
        {/if}
      {/each}
      {@render extras()}
    </dl>
  {:else if lastVals?.any}
    <dl class="vals" data-body-last>
      {#each banner(lastVals.rows).filter((r) => r.now != null) as r (r.key)}
        {@render field(r, r.now, r.day === addDays(today, -1) ? t('from yesterday') : shortDay(r.day), '', true)}
      {/each}
      {@render extras()}
    </dl>
  {:else}
    {@const e = fitbitEmpty(health)}
    <p class="empty" data-fitbit-empty={e.why}>{e.text ? t(e.text, { date: e.date ? shortDay(e.date) : '' }) : t('Connect Fitbit and your resting pulse, sleep and active zone minutes show here.')} <a href={e.href}>{t(e.link)}</a></p>
  {/if}
  {#if hint}
    <p class="qh" data-body-note={hint.kind}>
      <Info size={16} aria-hidden="true" />
      <span>{hintText} <a href={HINT_GO[hint.kind]}>{t('See|note')}</a></span>
      <button type="button" class="again" onclick={hintNo} data-body-note-no>{t('Not today')}</button>
    </p>
  {/if}
  {#if showHint}
    <!-- Noah 7.11.2026 «2a»: why a value is not of today, and the way to fetch it -->
    <p class="hint" data-body-hint>
      <span>{t('Fitbit has not delivered all of today\'s values yet. The last ones are shown with their day.')}</span>
      {#if !stand?.failed}<button type="button" class="again" disabled={health.busy} onclick={() => fetchNow()} data-body-fetch>{health.busy ? t('Fetching …') : t('Fetch now|fitbit')}</button>{/if}
    </p>
  {/if}
  <FitbitStand again={!showHint} />
  <!-- the check of the moment: Morgen-Check, from the evening round time the Abend-Check -->
  <!-- Heute aufräumen (23.11.2026): when the tile «Heute-Check» is on Heute it says the same, so the row is only here without it -->
  {#if check}<div class="ck" class:done={!due} data-body-check={evening ? 'evening' : 'morning'}>
    <span class="ci" aria-hidden="true">{#if due}<ClipboardList size={20} />{:else}<Check size={20} strokeWidth={2.5} />{/if}</span>
    {#if due}
      <span class="ct">{tn(due, evening ? 'Evening check · {n} question' : late ? 'Open from this morning · {n} question' : 'Morning check · {n} question', evening ? 'Evening check · {n} questions' : late ? 'Open from this morning · {n} questions' : 'Morning check · {n} questions')}{#if areas.length}<small class="ar" data-body-areas>{areas.join(' · ')}</small>{/if}</span>
      {#if !open}<button type="button" class="btn sm" onclick={onstart}>{t('Start|round')}</button>{/if}
    {:else}
      <span class="ct">{evening ? t('Evening check: nothing open') : t('Morning check: nothing open')}</span>
      <a class="lk" href={evening ? '#/check/evening' : '#/check/morning'}>{t('See|check')}</a>
    {/if}
  </div>{/if}
  <p class="note">{t('Only to look at: a small arrow says that a value is lower or higher than usual, never good or bad.')}</p>
</section>
{#if phone.matches}<BodySheet bind:open={sheet} {today} />{/if}

<style>
  .bd {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    padding: 14px 18px;
    box-sizing: border-box;
  }
  .hd {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .hd :global(.th) {
    flex: 1;
  }
  .go {
    border: 0;
    background: transparent;
    padding: 0;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--hi);
    font-weight: 600;
    font-size: var(--fs-small);
    text-decoration: none;
  }
  .vals {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(66px, 1fr));
    gap: 6px 8px;
    margin: 0;
  }
  .vals.tap {
    cursor: pointer;
  }
  .fld {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  .vals dt,
  .yd,
  .note,
  .empty {
    color: var(--ink-3);
    font-size: var(--fs-small);
    margin: 0;
  }
  .vals dt {
    font-size: var(--fs-tiny);
  }
  .fld .yd {
    font-size: var(--fs-tiny);
    line-height: 1.25;
  }
  .vals dd {
    margin: 0;
  }
  .vals dd.v {
    display: flex;
    flex-wrap: nowrap;
    align-items: baseline;
    gap: 0 3px;
  }
  .vals b {
    font-size: var(--fs-sub);
    white-space: nowrap;
  }
  .vals dd.v small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    font-weight: 600;
  }
  .va {
    color: inherit;
    text-decoration: none;
  }
  .va::after {
    content: '';
    position: absolute;
    inset: -4px -6px;
    border-radius: 10px;
  }
  .va:hover::after {
    background: color-mix(in srgb, var(--hi) 6%, transparent);
  }
  .va:focus-visible::after {
    outline: var(--focus-ring);
  }
  .vals dd.bar {
    height: 4px;
    margin-top: 3px;
    border-radius: 2px;
    background: color-mix(in srgb, var(--ink-3) 22%, transparent);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    background: var(--hi);
  }
  .mk {
    display: inline-flex;
    align-self: center;
    color: var(--ink-3);
  }
  .yd {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .empty a {
    color: var(--hi);
    font-weight: 600;
  }
  .hint {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 12px;
    margin: 0;
    padding: 8px 12px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--hi) 8%, var(--paper));
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .hint span {
    flex: 1 1 180px;
  }
  .qh {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .qh > :global(svg) {
    flex: none;
    color: var(--ink-3);
  }
  .qh span {
    flex: 1;
    min-width: 0;
  }
  .qh a {
    color: var(--hi);
    font-weight: 600;
    white-space: nowrap;
  }
  .qh .again {
    flex: none;
  }
  .again {
    border: 0;
    background: transparent;
    padding: 0;
    min-height: 44px;
    color: var(--hi);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .ck {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 6px 10px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--hi) 8%, var(--paper));
  }
  .ck.done {
    background: transparent;
    border: 1px solid var(--line);
  }
  .ci {
    display: grid;
    color: var(--hi);
  }
  .ct {
    flex: 1;
    min-width: 0;
    font-weight: 600;
  }
  .ar {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .lk {
    color: var(--hi);
    font-weight: 600;
    font-size: var(--fs-small);
    min-height: 44px;
    display: inline-flex;
    align-items: center;
  }
  .note {
    margin-top: auto;
  }
</style>
