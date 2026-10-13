<script>
  /**
   * «Training» TR3 (Noah 13.10.2026 «1-5a», «tr1-4 ok»): one activity, #/flow/training/a/<id>. Its
   * numbers, the time in each heart rate zone (Strava's zones or own ones, 3a), the heart rate over
   * the time with the zone bounds, «Gleiche Strecke» (same name and kind, distance within 10 %),
   * a note and «In Strava öffnen». The heart rate of an older activity is fetched when it opens.
   * Observation only: no value is rated.
   */
  import { liveQuery } from 'dexie';
  import { ExternalLink } from '@lucide/svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import Sec from '../../lib/flow/kit/Sec.svelte';
  import PageHead from '../../lib/ui/PageHead.svelte';
  import Empty from '../../lib/ui/Empty.svelte';
  import KindIcon from '../../lib/strava/KindIcon.svelte';
  import { db } from '../../lib/db.js';
  import { strava, loadDetail } from '../../lib/strava/client.svelte.js';
  import { zones } from '../../lib/strava/zones.svelte.js';
  import { dayWhen } from '../../lib/strava/when.js';
  import { zoneSecs, shares, hmm, speed, sameRoute, typeKey, ZONE_NAMES, zoneRange } from '../../lib/training.js';
  import { t, num, locale } from '../../lib/i18n.svelte.js';

  let { id = '' } = $props();

  const actQ = $derived(liveQuery(async () => (await db.activities.get(id)) ?? null));
  const allQ = liveQuery(() => db.activities.toArray());
  const act = $derived($actQ);
  const secs = $derived(act ? zoneSecs(act.hist, zones.bounds) : null);
  const most = $derived(secs ? Math.max(...secs) : 0);
  const sh = $derived(shares(secs));
  const same = $derived(act ? sameRoute($allQ ?? [], act) : { list: [], fastest: null });
  const gearName = $derived(act ? (strava.prefs.gear.find((g) => g.id === act.gearId)?.name ?? '') : '');
  const longDay = $derived(act ? new Date(`${act.day}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }) : '');
  const source = $derived(zones.source === 'own' ? t('your own zones') : zones.source === 'strava' ? t('your zones from Strava') : t('standard zones (maximum heart rate {n})', { n: 190 }));
  const rangeText = (i) => {
    const r = zoneRange(i, zones.bounds);
    return r.from == null ? t('under {n} beats', { n: r.to + 1 }) : r.to == null ? t('from {n} beats', { n: r.from }) : t('{a}–{b} beats', { a: r.from, b: r.to });
  };

  // an older activity: its heart rate comes when it is opened (once per visit)
  let asked = $state('');
  let fetchErr = $state('');
  $effect(() => {
    if (!act || act.detail || act.hrAvg == null || !strava.key || asked === act.id) return;
    asked = act.id;
    loadDetail(db, act.id).catch((e) => (fetchErr = e?.code === 'strava_busy' ? t('Strava is busy right now; the heart rate comes with the next fetch.') : t('The heart rate could not be fetched just now.')));
  });

  // the chart: the heart rate over the minutes, the zone bounds as dashed lines
  const W = 600;
  const H = 150;
  const chart = $derived.by(() => {
    const c = act?.curve ?? [];
    if (c.length < 2) return null;
    const maxT = c.at(-1)[0] || 1;
    const lo = Math.min(...c.map((p) => p[1]), zones.bounds[0]) - 5;
    const hi = Math.max(...c.map((p) => p[1]), zones.bounds[3]) + 5;
    const y = (b) => Math.round((H - ((b - lo) / (hi - lo)) * H) * 10) / 10;
    return { d: c.map((p, i) => `${i ? 'L' : 'M'}${Math.round((p[0] / maxT) * W * 10) / 10},${y(p[1])}`).join(' '), lines: zones.bounds.map((b) => ({ b, y: y(b) })), mins: Math.round(maxT) };
  });

  let note = $state('');
  $effect(() => {
    note = act?.note ?? '';
  });
  const saveNote = () => act && note !== (act.note ?? '') && db.activities.update(act.id, { note: note.trim() });
</script>

<div class="ta">
  <header class="ph">
    <Crumb path={[{ href: '#/flow', label: t('Active|place') }, { href: '#/flow/training?view=list', label: t('Training|tab') }]} here={act?.name ?? ''} />
    {#if act}<PageHead title={act.name || t(typeKey(act.type))} sub={[`${longDay}, ${act.time}`, act.kind === 'bike' && gearName ? gearName : t(typeKey(act.type))].join(' · ')} />{/if}
  </header>

  {#if act === undefined}
    <p class="hint" role="status">{t('Loading …')}</p>
  {:else if !act}
    <Empty text={t('This activity is not here (any more).')} action={{ label: t('All activities'), href: '#/flow/training?view=list' }} />
  {:else}
    <div class="lay">
      <div class="col">
        <div class="card vals num" data-section="values">
          <span><b>{hmm(act.elapsedS || act.movingS)}</b><small>{act.elapsedS && act.elapsedS - act.movingS >= 60 ? t('Time (moving {t})', { t: hmm(act.movingS) }) : t('Time|duration')}</small></span>
          {#if act.km}<span><b>{num(act.km)} km</b><small>{t('Distance')}</small></span>{/if}
          {#if act.hm != null}<span><b>{num(act.hm)} {t('Hm|short')}</b><small>{t('Metres climbed')}</small></span>{/if}
          {#if speed(act)}<span><b>{num(speed(act))}</b><small>{t('Ø km/h')}</small></span>{/if}
          {#if act.hrAvg != null}<span><b>{act.hrAvg}</b><small>{t('Ø heart rate')}</small></span>{/if}
          {#if act.hrMax != null}<span><b>{act.hrMax}</b><small>{t('max heart rate')}</small></span>{/if}
          {#if act.kcal}<span><b>{num(act.kcal)}</b><small>kcal</small></span>{/if}
        </div>

        <Sec id="zones-h" title={t('Time in heart rate zones')} sub={source} more={{ label: t('change zones'), href: '#/flow/training?zones=1' }}>
          <div class="card zones" data-section="zone-time">
            {#if secs}
              <ul>
                {#each secs as s, i (i)}
                  <li data-zone={i + 1}>
                    <span class="zn"><b>Z{i + 1} {t(ZONE_NAMES[i])}</b><small class="num">{rangeText(i)}</small></span>
                    <span class="bar"><i class="z{i + 1}" style:width="{most ? (s / most) * 100 : 0}%"></i></span>
                    <span class="mn num">{t('{n} min', { n: Math.round(s / 60) })}</span>
                  </li>
                {/each}
              </ul>
              {#if sh}<p class="hint num">{t('Base (Z1–Z2) {a} % · intense (Z4–Z5) {b} %', { a: sh.base, b: sh.intense })}</p>{/if}
            {:else if act.hrAvg == null}
              <p class="hint">{t('This activity has no heart rate.')}</p>
            {:else if fetchErr}
              <p class="hint" role="status">{fetchErr}</p>
            {:else if strava.key && !act.detail}
              <p class="hint" role="status">{t('Fetching the heart rate …')}</p>
            {:else if !strava.key}
              <p class="hint">{t('Connect Strava on this device to fetch the heart rate.')}</p>
            {:else}
              <p class="hint">{t('Strava has no heart rate per second for this activity.')}</p>
            {/if}
          </div>
        </Sec>

        {#if chart}
          <Sec id="curve-h" title={t('Heart rate over time')} sub={t('Lines = zone bounds')}>
            <div class="card curve" data-section="curve">
              <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" role="img" aria-label={t('Heart rate over {n} minutes, Ø {a}, max {b}', { n: chart.mins, a: act.hrAvg ?? '–', b: act.hrMax ?? '–' })}>
                {#each chart.lines as l (l.b)}<line x1="0" x2={W} y1={l.y} y2={l.y} class="zl" />{/each}
                <path d={chart.d} class="ln" />
              </svg>
              <p class="ax num"><span>0</span><span>{t('{n} min', { n: chart.mins })}</span></p>
            </div>
          </Sec>
        {/if}
      </div>

      <div class="col">
        {#if same.list.length > 1}
          <Sec id="same-h" title={t('Same route')} sub={t('{n}× done', { n: same.list.length })}>
            <ul class="card same" data-section="same-route">
              {#each same.list.slice(0, 5) as s (s.id)}
                <li>
                  <a href="#/flow/training/a/{encodeURIComponent(s.id)}" aria-current={s.id === act.id ? 'page' : undefined}>
                    <span><b>{dayWhen(s.day)}</b><small class="num">{hmm(s.movingS)}{s.hrAvg != null ? ` · Ø ${s.hrAvg}` : ''}</small></span>
                    {#if same.fastest === s.id}<span class="pill ok">{t('fastest')}</span>{/if}
                  </a>
                </li>
              {/each}
            </ul>
          </Sec>
        {/if}

        <Sec id="note-h" title={t('Note')}>
          <div class="card nt">
            <label class="sr" for="act-note">{t('Note on this activity')}</label>
            <textarea id="act-note" class="inp" rows="3" bind:value={note} onblur={saveNote} placeholder={t('How did it feel? (only here, not in Strava)')} data-note></textarea>
          </div>
        </Sec>

        <a class="btn ext" href="https://www.strava.com/activities/{encodeURIComponent(act.id)}" target="_blank" rel="noopener noreferrer"><ExternalLink size={16} aria-hidden="true" />{t('Open in Strava')}</a>
        <p class="kd"><KindIcon kind={act.kind} size={14} /> {t(typeKey(act.type))}</p>
      </div>
    </div>
  {/if}
</div>

<style>
  .ta {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 1240px;
    margin: 0 auto;
    min-width: 0;
  }
  .ta :global(.pagehead) {
    margin: 0;
  }
  .lay {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-5);
    align-items: start;
  }
  @media (min-width: 1000px) {
    .lay {
      grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    }
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
    min-width: 0;
  }
  .vals {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
    padding: 16px;
  }
  .vals span {
    display: flex;
    flex-direction: column;
    padding: 10px 12px;
    border-radius: var(--radius);
    background: var(--paper-2);
  }
  .vals b {
    font: 700 var(--fs-sub) / 1.25 var(--font-body);
  }
  .vals small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .zones,
  .curve,
  .nt {
    padding: 14px 20px;
  }
  .zones ul,
  .same {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .zones li {
    display: grid;
    grid-template-columns: minmax(110px, 150px) minmax(0, 1fr) 64px;
    align-items: center;
    gap: 12px;
    padding: 6px 0;
  }
  .zn {
    display: flex;
    flex-direction: column;
  }
  .zn b {
    font-weight: 500;
  }
  .zn small,
  .hint,
  .ax,
  .kd {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .bar {
    height: 10px;
    border-radius: 99px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: 99px;
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
  .mn {
    text-align: right;
    font-weight: 700;
  }
  .hint {
    margin: 10px 0 0;
  }
  svg {
    display: block;
    width: 100%;
    height: 150px;
  }
  .zl {
    stroke: var(--line);
    stroke-dasharray: 4 4;
    vector-effect: non-scaling-stroke;
  }
  .ln {
    fill: none;
    stroke: var(--z5);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
  }
  .ax {
    display: flex;
    justify-content: space-between;
    margin: 4px 0 0;
  }
  .same {
    padding: 6px 20px;
  }
  .same li + li {
    border-top: 1px solid var(--line);
  }
  .same a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 44px;
    padding: 8px 0;
    color: var(--ink);
    text-decoration: none;
  }
  .same a span {
    display: flex;
    flex-direction: column;
  }
  .same a[aria-current='page'] b {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .same small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .nt textarea {
    width: 100%;
    box-sizing: border-box;
  }
  .ext {
    align-self: stretch;
    justify-content: center;
  }
  .kd {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
  }
</style>
