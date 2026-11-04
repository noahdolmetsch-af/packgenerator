<script>
  /**
   * «Beat your Ghost» (Noah 03.11.2026, Cockpit-Idee 4): this ride against an earlier ride of yours, the
   * «ghost». The app picks the most alike one (same route first); you can pick another from the list.
   * Side by side: power, heart rate, watts per beat, speed, time and the drift in the second half, one calm
   * sentence («same power, 6 beats less») and how alike the two rides are (route, km, Hm, temperature, wind).
   * After the ride, not live. Observation only: a better number is never an order to ride harder.
   * Rules: ghost.js. Fewer than one comparable earlier ride: nothing.
   */
  import AnaCard from '../AnaCard.svelte';
  import { ghostCase, betterOf, TEMP_FLAG, WIND_FLAG } from './ghost.js';
  import { mss } from './analysen.js';
  import { t, tn, num, locale } from '../../i18n.svelte.js';

  let { act = null, all = [] } = $props();
  let pickId = $state('');
  const gc = $derived(ghostCase(all, act, pickId));
  const ghosts = $derived(gc?.list ?? []);
  const ghost = $derived(gc?.ghost ?? null);
  const cmp = $derived(gc?.cmp ?? null);
  // «Beaten?» in one word (Noah 04.11.2026 «2a»); never a verdict on the day
  const HEAD = { beat: 'Ghost beaten|gh', level: 'Level with your ghost|gh', behind: 'Not beaten this time|gh' };
  const dayShort = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'numeric' });
  const f = (v, dec = 0) => (Number.isFinite(v) ? v.toLocaleString(locale(), { minimumFractionDigits: dec, maximumFractionDigits: dec }) : '–');
  const sgn = (v, dec, unit = '') => (Number.isFinite(v) ? `${v > 0 ? '+' : v < 0 ? '−' : '±'}${f(Math.abs(v), dec)}${unit}` : '–');

  const ROWS = {
    w: { name: 'Ø power|an', show: (v) => `${f(v)} W`, diff: (m, g) => sgn(m - g, 0, ' W') },
    hr: { name: 'Ø heart rate|an', show: (v) => f(v), diff: (m, g) => sgn(m - g, 0) },
    wpb: { name: 'Watts per beat', show: (v) => f(v, 2), diff: (m, g) => sgn(Math.round((m - g) * 100) / 100, 2) },
    kmhb: { name: 'km/h per beat|gh', show: (v) => f(v, 2), diff: (m, g) => sgn(Math.round((m - g) * 100) / 100, 2) },
    kmh: { name: 'km/h|an', show: (v) => f(v, 1), diff: (m, g) => sgn(Math.round((m - g) * 10) / 10, 1) },
    time: { name: 'Time|an', show: (v) => mss(v), diff: (m, g) => `${m - g > 0 ? '+' : m - g < 0 ? '−' : '±'}${mss(Math.abs(m - g))}` },
  };
  const rows = $derived(cmp ? cmp.rows.map((r) => ({ ...r, ...ROWS[r.key], better: betterOf(r.key, r.me, r.ghost) })) : []);
  const driftName = $derived(cmp?.drift ? t(cmp.drift.kind === 'wpb' ? 'Fall of watts per beat, 1st to 2nd half|gh' : 'Rise of heart rate, 1st to 2nd half|gh') : '');

  const sentence = $derived.by(() => {
    const v = cmp?.verdict;
    if (!v) return '';
    if (v.key === 'samepower-less') return tn(v.n, 'Same power as your ghost, {n} beat less heart rate.|gh', 'Same power as your ghost, {n} beats less heart rate.|gh');
    if (v.key === 'samepower-more') return tn(v.n, 'Same power as your ghost, {n} beat more heart rate.|gh', 'Same power as your ghost, {n} beats more heart rate.|gh');
    if (v.key === 'ahead') return t('{p} % more watts per beat than your ghost.|gh', { p: num(v.n) });
    if (v.key === 'behind') return t('{p} % fewer watts per beat than your ghost.|gh', { p: num(v.n) });
    return t('Level with your ghost: nearly the same watts per beat.|gh');
  });
  const effNote = $derived(cmp && !cmp.power ? t('Without power on both rides the speed per heartbeat stands in for watts per beat.|gh') : '');

  // how alike: each line says what is the same and what differs
  const checks = $derived.by(() => {
    if (!ghost) return [];
    const a = ghost.alike;
    const out = [{ key: 'route', ok: a.route, text: a.route ? t('Same route|gh') : t('Not the same route|gh') }];
    out.push({ key: 'km', ok: Math.abs(a.kmPct) <= 10, text: a.kmPct === 0 ? t('Same distance|gh') : t('Distance {p} %|gh', { p: sgn(a.kmPct, 0) }) });
    if (a.hmPct != null) out.push({ key: 'hm', ok: Math.abs(a.hmPct) <= 15, text: a.hmPct === 0 ? t('Same climbing|gh') : t('Climbing {p} %|gh', { p: sgn(a.hmPct, 0) }) });
    if (a.tempD != null) out.push({ key: 'temp', ok: Math.abs(a.tempD) < TEMP_FLAG, text: Math.abs(a.tempD) < 1 ? t('Same temperature|gh') : t('Temperature {d} °C|gh', { d: sgn(a.tempD, 0) }) });
    else out.push({ key: 'temp', ok: null, text: t('Temperature: not known|gh') });
    if (a.windD != null) out.push({ key: 'wind', ok: Math.abs(a.windD) < WIND_FLAG, text: Math.abs(a.windD) < 1 ? t('Same wind|gh') : t('Wind {d} km/h|gh', { d: sgn(a.windD, 0) }) });
    else out.push({ key: 'wind', ok: null, text: t('Wind: not known|gh') });
    return out;
  });
  const optLabel = (g) => `${dayShort(g.act.day)} · ${f(g.act.km, 1)} km${g.act.wDevice && g.act.wAvg > 0 ? ` · ${f(g.act.wAvg)} W` : ''} · ${f(g.act.hrAvg)} ${t('bpm|gh')}${g.alike.route ? ` · ${t('same route|gh')}` : ''}`;
</script>

{#if ghost && cmp}
  <AnaCard key="ghost" sub={t('an earlier ride of yours|gh')}>
    <label class="gp">
      <span>{t('Your ghost|gh')}</span>
      <select class="inp" bind:value={pickId} data-ghost-pick aria-label={t('Pick your ghost|gh')}>
        {#each ghosts as g (g.act.id)}<option value={g.act.id}>{optLabel(g)}</option>{/each}
      </select>
    </label>
    <div class="gb {gc.result}" data-ghost-result={gc.result}>
      <b>{#if gc.result === 'beat'}<span aria-hidden="true">✓ </span>{/if}{t(HEAD[gc.result])}</b>
      {#if sentence}<p class="gs" data-ghost-verdict={cmp.verdict.key}>{sentence}</p>{/if}
    </div>
    <div class="gw">
      <table class="gt">
        <thead>
          <tr>
            <td></td>
            <th scope="col">{t('this ride|hl')}</th>
            <th scope="col"><a href="#/flow/training/a/{encodeURIComponent(ghost.act.id)}" data-ghost-open>{t('Ghost|gh')} · {dayShort(ghost.act.day)}</a></th>
            <th scope="col">{t('Difference|gh')}</th>
          </tr>
        </thead>
        <tbody>
          {#each rows as r (r.key)}
            <tr data-ghost-row={r.key}>
              <th scope="row">{t(r.name)}</th>
              <td>{r.show(r.me)}</td>
              <td>{r.show(r.ghost)}</td>
              <td class="df" class:bt={r.better === true}>{r.diff(r.me, r.ghost)}{#if r.better === true}<span class="ck" aria-label={t('better|gh')}> ✓</span>{/if}</td>
            </tr>
          {/each}
          {#if cmp.drift}
            <tr data-ghost-row="drift">
              <th scope="row">{driftName}</th>
              <td>{f(cmp.drift.me, 1)} %</td>
              <td>{f(cmp.drift.ghost, 1)} %</td>
              <td class="df" class:bt={cmp.drift.me < cmp.drift.ghost}>{sgn(Math.round((cmp.drift.me - cmp.drift.ghost) * 10) / 10, 1, ' %')}{#if cmp.drift.me < cmp.drift.ghost}<span class="ck" aria-label={t('better|gh')}> ✓</span>{/if}</td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
    <div class="gc" data-ghost-alike={ghost.alike.level}>
      <p class="gh2">{t(ghost.alike.level === 'good' ? 'A good match: you can compare these two.|gh' : 'Fairly alike: compare with care.|gh')}</p>
      <ul>
        {#each checks as c (c.key)}<li class:ok={c.ok === true} class:off={c.ok === false} data-ghost-check={c.key}><span aria-hidden="true">{c.ok === true ? '✓' : c.ok === false ? '≠' : '?'}</span> {c.text}</li>{/each}
      </ul>
    </div>
    <p class="cap">{[effNote, t('Beaten means: more watts per beat, or the same power with a lower heart rate. A tick marks the better value.|gh'), t('Wind, rain, traffic and sleep are only in the numbers where Strava weather knows them. A better number is an observation, not an order to ride harder.|gh')].filter(Boolean).join(' ')}</p>
  </AnaCard>
{/if}

<style>
  .gp {
    display: grid;
    gap: 4px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .gp select {
    min-width: 0;
    max-width: 100%;
  }
  .gb {
    display: grid;
    gap: 2px;
    padding: 10px 14px;
    border-radius: var(--r-ctl, 10px);
    background: var(--paper-2);
  }
  .gb.beat {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .gb b {
    font-size: var(--fs-sub);
  }
  .gs {
    margin: 0;
    font-weight: 600;
  }
  .gb.beat .gs {
    color: var(--ink);
  }
  .bt {
    color: var(--ok);
    font-weight: 700;
  }
  .gw {
    overflow-x: auto;
  }
  .gt {
    width: 100%;
    border-collapse: collapse;
    font-variant-numeric: tabular-nums;
    font-size: var(--fs-small);
  }
  th,
  td {
    padding: 8px 6px;
    text-align: right;
    border-bottom: 1px solid var(--line);
  }
  tbody th {
    text-align: left;
    font-weight: 400;
  }
  thead th {
    color: var(--ink-3);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  thead a {
    color: inherit;
  }
  .df {
    color: var(--ink-2);
  }
  .gc {
    display: grid;
    gap: 6px;
  }
  .gh2 {
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .gc ul {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .gc li {
    padding: 2px 10px;
    border: 1px solid var(--line);
    border-radius: 999px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .gc li.off {
    border-color: var(--ink-3);
    font-weight: 600;
  }
  @media (max-width: 640px) {
    th,
    td {
      padding: 8px 2px;
    }
    thead th {
      letter-spacing: 0;
    }
  }
</style>
