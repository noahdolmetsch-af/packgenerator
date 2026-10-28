<script>
  /**
   * Paket U2 «Anstiege» (#/race/<id>/climbs; Noah 19.10.2026 «eine eigene Seite, wo jeder der 30 Anstiege
   * einzeln detailliert mit seiner Neigung angeschaut und analysiert werden kann», «2a»). Two boxes:
   * 'climbs-sum' (the totals and all climbs along the km) and 'climbs-list' (every climb, sortable and
   * filtered; a tap opens its card: gradient per 100 m, mini profile, numbers, when you are there, water
   * and shops, the map link and your own note). ?climb=<n> opens climb n. Notes: stored.climbNotes =
   * { [fromKm]: text }. The numbers come from climbs-lib.js.
   */
  import { untrack, onMount, tick } from 'svelte';
  import { ChevronDown, MapPin, Trash2, Droplet, ShoppingBasket, Moon, Sun } from '@lucide/svelte';
  import RaceBox from './RaceBox.svelte';
  import ProfileStrip from '../map/ProfileStrip.svelte';
  import { viewFor } from '../route/routeclimbs.js';
  import { cacheQuery } from './store.js';
  import { WX_CACHE } from './outside.js';
  import { pointAt, hhmm, hm } from './race.js';
  import { darkAt, wxNear } from './route-lib.js';
  import { raceHref } from './parts.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { climbsDetail, climbProfile, sortClimbs, climbTotals, miniPath, climbParam, climbRateOf, stepOf, STEEP, steepClass, LEVELS, SORTS, MIN_GAINS, DEFAULT_MIN, NEAR_KM } from './climbs-lib.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  let { ctx } = $props();

  // the page is built anew for every race (RaceDetail keys the part), so the id stays the same here
  const id = untrack(() => ctx.trip.id);
  const wxQ = cacheQuery(WX_CACHE + id);
  const wx = $derived($wxQ?.data ?? null);

  let minGain = $state(untrack(() => (Number(ctx.stored.climbMin) > 0 ? Number(ctx.stored.climbMin) : DEFAULT_MIN)));
  let sortBy = $state('order');
  let open = $state(null); // the key (fromKm) of the open climb
  // the fine, zoomable profile of the whole route (Noah 19.10.2026: «dasselbe genaue Profil auf der Seite
  // Anstiege»); opening a climb zooms it to that climb
  let view = $state(null);
  let cursorKm = $state(null);

  // the fine profile (a point every 50–100 m) when the route has one, else the coarse one
  const profile = $derived(climbProfile(ctx.route));
  const isDark = (km, ms) => {
    const p = pointAt(ctx.pts ?? [], km) ?? ctx.route?.start;
    return p ? darkAt(Number(p.lat), Number(p.lon))(ms) : false;
  };
  const climbs = $derived(climbsDetail({ route: ctx.route, minGain, plan: ctx.plan, as: ctx.as, pois: ctx.pois, isDark, tempAt: (km, ms) => wxNear(wx, km, ms)?.temp ?? null }));
  const shown = $derived(sortClimbs(climbs, sortBy));
  const sum = $derived(climbTotals(climbs, Number(ctx.route?.gainM) || 0));
  const notes = $derived(ctx.stored.climbNotes && typeof ctx.stored.climbNotes === 'object' ? ctx.stored.climbNotes : {});
  const rate = $derived(climbRateOf(ctx.as));
  const step = $derived(stepOf(profile));
  const routeKm = $derived(Number(ctx.route?.km) || profile.at(-1)?.[0] || 0);

  /* ---------- formatting ---------- */
  const num = (v, d = 0) => (Number.isFinite(v) ? v.toLocaleString(locale(), { maximumFractionDigits: d }) : '–');
  const when = (ms) => (ms == null ? '' : `${new Date(ms).toLocaleDateString(locale(), { weekday: 'short' })} ${hhmm(ms)}`);
  const levelName = (key) => t(LEVELS.find((l) => l.key === key)?.name ?? '');
  const MARK = { hot: 'Midday heat: climb early or late if you can', midday: 'At midday: hot when the sun shines', dark: 'In the dark: good light, slow on the way down' };
  const supplyLine = (list) => list.map((p) => `${p.name || t('Stop')} (${t('km {km}', { km: num(p.km, 1) })})`).join(', ');

  /* ---------- filter and sort ---------- */
  function setMin(v) {
    const n = Math.max(20, Math.min(3000, Math.round(Number(v) || DEFAULT_MIN)));
    minGain = n;
    open = null;
    ctx.save({ climbMin: n });
  }

  /* ---------- open one (and ?climb=<n>) ---------- */
  function hashWith(n) {
    const base = location.hash.split('?')[0];
    const q = new URLSearchParams(location.hash.split('?')[1] ?? '');
    if (n == null) q.delete('climb');
    else q.set('climb', String(n));
    const s = q.toString();
    try {
      history.replaceState(history.state, '', `${location.pathname}${location.search}${base}${s ? `?${s}` : ''}`);
    } catch {
      /* not allowed here: the card opens all the same */
    }
  }
  function toggle(c) {
    open = open === c.key ? null : c.key;
    hashWith(open ? c.n : null);
    if (open) {
      view = viewFor(c, routeKm);
      cursorKm = c.maxAt;
    }
  }
  onMount(async () => {
    const v = climbParam(location.hash);
    if (v == null) return;
    const c = climbs.find((x) => String(x.n) === v || `km${x.key}` === v);
    if (!c) return;
    open = c.key;
    await tick();
    document.querySelector(`[data-climb-row="${c.n}"]`)?.scrollIntoView({ block: 'start' });
  });

  /* ---------- the own note per climb ---------- */
  let draft = $state('');
  $effect(() => {
    const v = open ? (notes[open] ?? '') : '';
    untrack(() => (draft = v));
  });
  let savedMsg = $state('');
  const putNote = (key, text) =>
    ctx.save((cur) => {
      const all = { ...(cur.climbNotes && typeof cur.climbNotes === 'object' ? cur.climbNotes : {}) };
      if (text) all[key] = text;
      else delete all[key];
      return { ...cur, climbNotes: all };
    });
  async function saveNote(c) {
    const text = draft.trim();
    if (!text) return;
    await putNote(c.key, text);
    savedMsg = c.key;
    setTimeout(() => (savedMsg = ''), 2500);
  }
  async function deleteNote(c) {
    const old = notes[c.key];
    if (!old) return;
    const answer = await askDelete({ title: t('Delete the note on climb {n}?', { n: c.n }), text: old });
    if (answer !== 'delete') return;
    await deleteWithUndo({ run: () => putNote(c.key, ''), undo: () => putNote(c.key, old), text: t('Note on climb {n} deleted.', { n: c.n }), name: t('Note on climb {n}', { n: c.n }) });
  }

  /* ---------- charts ---------- */
  const BAR_W = 10;
  const CH_H = 100;
  const chartTop = (c) => Math.max(12, Math.ceil(Math.max(...c.bars.map((b) => b.pct), 0)));
  const barH = (pct, top) => Math.max(1.5, (Math.max(0, pct) / top) * (CH_H - 4));
  const maxGainAll = $derived(Math.max(1, ...climbs.map((c) => c.gain)));
</script>

<div class="cl" data-climbs>
  {#if profile.length < 2}
    <RaceBox id="climbs-list" title={t('Climbs|race')} what="Lists every climb of the route on its own, with its gradient per 100 m." why="You see where it gets steep and plan your strength, food and gears." from="The elevation profile of your route.">
      <p class="rc-empty">{t('No elevation profile yet: load the route under «Prepare».')}</p>
      <a class="btn" href={raceHref(id, 'prepare')}>{t('To «Prepare»')}</a>
    </RaceBox>
  {:else}
    <!-- the totals and all climbs along the km -->
    <RaceBox id="climbs-sum" title={t('All climbs in short')} what="Counts the climbs and their metres up and names the steepest 100 m, the longest and the hardest climb; the bars show every climb along the km." why="One look tells you where the hard part of the race is and how much of the climbing comes in big climbs." from="The elevation profile of your route and your minimum gain below.">
      {#if !climbs.length}
        <p class="rc-empty">{t('No climb of {m} m or more in the profile.', { m: minGain })}</p>
      {:else}
        <div class="rc-stat" data-climbs-sum>
          <div><b data-climbs-count>{sum.n}</b><small>{tn(sum.n, 'climb of {m} m or more', 'climbs of {m} m or more', { m: minGain })}</small></div>
          <div><b>{num(sum.gain)} m</b><small>{sum.share != null ? t('up in climbs ({p} % of all)', { p: sum.share }) : t('up in climbs')}</small></div>
          <div><b>{num(sum.steepest.max, 1)} %</b><small>{t('steepest 100 m: climb {n}, km {km}', { n: sum.steepest.n, km: num(sum.steepest.maxAt, 1) })}</small></div>
          <div><b>{num(sum.longest.lengthKm, 1)} km</b><small>{t('longest: climb {n}', { n: sum.longest.n })}</small></div>
          <div><b>{num(sum.hardest.score, 1)}</b><small>{t('hardest: climb {n} ({level})', { n: sum.hardest.n, level: levelName(sum.hardest.level) })}</small></div>
        </div>
        <figure class="cl-fig">
          <svg class="cl-row" viewBox="0 0 {Math.max(1, routeKm)} 60" preserveAspectRatio="none" role="img" aria-label={t('All {n} climbs along the {km} km: the higher the bar, the more metres up', { n: sum.n, km: num(routeKm) })} data-climbs-bars>
            <rect class="cl-base" x="0" y="59" width={Math.max(1, routeKm)} height="1" />
            {#each climbs as c (c.key)}
              <rect class="cl-s{steepClass(c.avg)}" x={c.fromKm} y={60 - (c.gain / maxGainAll) * 56} width={Math.max(1, c.lengthKm)} height={(c.gain / maxGainAll) * 56}><title>{t('Climb {n}', { n: c.n })} · {t('km {a}–{b}', { a: num(c.fromKm, 1), b: num(c.toKm, 1) })} · {num(c.gain)} m</title></rect>
            {/each}
          </svg>
          <figcaption class="cl-axis"><span>{t('km {km}', { km: 0 })}</span><span>{t('km {km}', { km: num(routeKm / 2) })}</span><span>{t('km {km}', { km: num(routeKm) })}</span></figcaption>
        </figure>
        <p class="rc-note">{t('Bar height: metres up. Colour: average gradient (see the legend below).')}</p>
      {/if}
      {#if profile.length > 1}
        <div class="cl-strip" data-climbs-profile>
          <h3 class="cl-strip-h">{t('Elevation profile')}</h3>
          <ProfileStrip profile={ctx.route?.profile ?? []} fine={ctx.route?.profileFine ?? null} bind:view bind:cursorKm withMap={false} marks={climbs.map((c) => ({ km: c.fromKm }))} />
        </div>
      {/if}
    </RaceBox>

    <!-- every climb on its own -->
    <RaceBox id="climbs-list" title={t('Every climb')} what="Lists every climb of the route; tap one to see its gradient per 100 m, its profile, the numbers, when you are there, water and shops nearby and your own note." why="You see where it gets steep and plan your strength, food, gears and the time of day." from="The elevation profile of your route; times from your plan; the climbing rate from «Strategy»; water and shops from your stops.">
      <div class="cl-ctl">
        <span class="rc-lab" id="cl-min-l">{t('Climbs from')}</span>
        <div class="rc-chips" role="group" aria-labelledby="cl-min-l">
          {#each MIN_GAINS as g (g)}
            <button type="button" class="rc-chip" aria-pressed={minGain === g} onclick={() => setMin(g)} data-climbs-min={g}>{t('{m} m up', { m: g })}</button>
          {/each}
        </div>
        <label class="rc-lab cl-own">{t('Own minimum (m up)')}
          <input class="inp rc-num" type="number" inputmode="numeric" min="20" max="3000" step="10" value={minGain} onchange={(e) => setMin(e.currentTarget.value)} data-climbs-min-in />
        </label>
        <span class="rc-lab" id="cl-sort-l">{t('Sort')}</span>
        <div class="rc-chips" role="group" aria-labelledby="cl-sort-l">
          {#each SORTS as s (s.key)}
            <button type="button" class="rc-chip" aria-pressed={sortBy === s.key} onclick={() => (sortBy = s.key)} data-climbs-sort={s.key}>{t(s.name)}</button>
          {/each}
        </div>
      </div>
      <details class="cl-how">
        <summary>{t('How to read this')}</summary>
        <p>{t('Difficulty: metres up × metres up ÷ (length in metres × 10), plus 1 point for every 1000 m the top lies above 1000 m. It is built like the FIETS index of a Dutch cycling magazine.')}</p>
        <p>{t('Under 2 easy, 2–4 moderate, 4–7 hard, 7–11 very hard, from 11 extreme.')}</p>
        <p>{t('A climb: at least the minimum up, and never more than 40 m down on the way.')}</p>
        {#if step != null && step > 0.2}<p>{t('Your profile has a point every {km} km: the gradient per 100 m is estimated in between (straight line), short steep ramps do not show.', { km: num(step, 1) })}</p>{/if}
      </details>
      <ul class="cl-legend" aria-label={t('Gradient colours')}>
        {#each STEEP as s (s.key)}<li><span class="cl-sw cl-bg{s.key}" aria-hidden="true"></span>{t(s.name)}</li>{/each}
      </ul>

      {#if !climbs.length}
        <p class="rc-empty">{t('No climb of {m} m or more in the profile.', { m: minGain })}</p>
      {:else}
        <ul class="rc-list" data-climbs-list>
          {#each shown as c (c.key)}
            {@const isOpen = open === c.key}
            <li class="cl-item" data-climb-row={c.n} data-climb-max={c.max} data-climb-score={c.score}>
              <button type="button" class="rc-row cl-head" aria-expanded={isOpen} aria-controls="cl-card-{c.n}" onclick={() => toggle(c)} data-climb-open={c.n}>
                <span class="cl-tick cl-bg{steepClass(c.avg)}" aria-hidden="true"></span><span class="cl-num" aria-hidden="true">{c.n}</span>
                <span class="rc-row-main">
                  <b>{t('Climb {n}', { n: c.n })} · {t('km {a}–{b}', { a: num(c.fromKm, 1), b: num(c.toKm, 1) })}</b>
                  <small>{t('{m} m up · {l} km · {avg} % average, {max} % at most', { m: num(c.gain), l: num(c.lengthKm, 1), avg: num(c.avg, 1), max: num(c.max, 1) })}</small>
                  <small>{levelName(c.level)} ({num(c.score, 1)}){#if c.eta != null}{' '}· {t('foot {at}', { at: when(c.eta) })}{/if}{#if notes[c.key]}{' '}· {t('with note')}{/if}</small>
                </span>
                <span class="cl-chev" class:cl-up={isOpen} aria-hidden="true"><ChevronDown size={20} /></span>
              </button>

              {#if isOpen}
                {@const top = chartTop(c)}
                {@const mp = miniPath(profile, c.fromKm, c.toKm)}
                <div class="cl-card" id="cl-card-{c.n}" data-climb-card={c.n}>
                  <!-- gradient per 100 m -->
                  <h3 class="cl-h3">{t('Gradient per 100 m')}{#if c.estimated}{' '}<span class="cl-est">{t('estimated')}</span>{/if}</h3>
                  <figure class="cl-fig">
                    <svg class="cl-chart" viewBox="0 0 {c.bars.length * BAR_W} {CH_H}" preserveAspectRatio="none" role="img" aria-label={t('Gradient of climb {n} per 100 m: {avg} % average, {max} % at most', { n: c.n, avg: num(c.avg, 1), max: num(c.max, 1) })} data-climb-chart>
                      {#each [3, 6, 9, 12].filter((g) => g < top) as g (g)}
                        <line class="cl-grid" x1="0" x2={c.bars.length * BAR_W} y1={CH_H - (g / top) * (CH_H - 4)} y2={CH_H - (g / top) * (CH_H - 4)} />
                      {/each}
                      {#each c.bars as b, i (i)}
                        <rect class="cl-s{steepClass(b.pct)}" x={i * BAR_W + 0.5} y={CH_H - barH(b.pct, top)} width={BAR_W - 1} height={barH(b.pct, top)} data-climb-bar><title>{t('km {a}–{b}', { a: num(b.fromKm, 1), b: num(b.toKm, 1) })}: {num(b.pct, 1)} %</title></rect>
                      {/each}
                    </svg>
                    <figcaption class="cl-axis"><span>{t('km {km}', { km: num(c.fromKm, 1) })}</span><span>{t('up to {p} %', { p: top })}</span><span>{t('km {km}', { km: num(c.toKm, 1) })}</span></figcaption>
                  </figure>
                  {#if c.estimated}<p class="rc-note">{t('Estimated: the profile has a point only every {km} km.', { km: num(step, 1) })}</p>{/if}

                  <!-- mini profile -->
                  <h3 class="cl-h3">{t('Profile')}</h3>
                  <figure class="cl-fig">
                    <svg class="cl-mini" viewBox="0 0 300 80" preserveAspectRatio="none" role="img" aria-label={t('Profile of climb {n}: from {lo} m to {hi} m', { n: c.n, lo: num(c.low), hi: num(c.top) })} data-climb-mini>
                      <rect class="cl-span" x={mp.x0} y="0" width={Math.max(1, mp.x1 - mp.x0)} height="80" />
                      <path class="cl-area" d={mp.area} />
                      <path class="cl-line" d={mp.line} vector-effect="non-scaling-stroke" />
                    </svg>
                    <figcaption class="cl-axis"><span>{num(c.low)} m</span><span>{t('top {m} m', { m: num(c.top) })}</span></figcaption>
                  </figure>

                  <!-- the numbers -->
                  <div class="rc-stat">
                    <div><b>{num(c.lengthKm, 1)} km</b><small>{t('length')}</small></div>
                    <div><b>{num(c.gain)} m</b><small>{t('up')}</small></div>
                    <div><b>{num(c.top)} m</b><small>{t('top height')}</small></div>
                    <div><b>{num(c.avg, 1)} %</b><small>{t('average')}</small></div>
                    <div><b>{num(c.max, 1)} %</b><small>{t('steepest 100 m at km {km}', { km: num(c.maxAt, 1) })}</small></div>
                    <div><b>{num(c.score, 1)}</b><small>{t('difficulty: {level}', { level: levelName(c.level) })}</small></div>
                    <div><b>{hm(c.climbH)}</b><small>{t('for the metres up at {r} m/h', { r: rate })}</small></div>
                  </div>
                  {#if c.sector}<p class="rc-text">{t('In {sector}.', { sector: c.sector })}</p>{/if}

                  <!-- when you are there -->
                  <h3 class="cl-h3">{t('When you are there')}</h3>
                  {#if c.eta != null}
                    <p class="rc-text" data-climb-when>
                      {t('Foot {a}, top {b}', { a: when(c.eta), b: when(c.etaTop) })}{#if c.planH != null}{' '}· {t('{h} on the climb in your plan', { h: hm(c.planH) })}{/if}
                    </p>
                    <p class="cl-flags">
                      {#if c.dark?.foot || c.dark?.top}<span class="cl-flag"><Moon size={16} aria-hidden="true" />{c.dark.foot && c.dark.top ? t('In the dark') : c.dark.foot ? t('Dark at the foot') : t('Dark at the top')}</span>{:else}<span class="cl-flag"><Sun size={16} aria-hidden="true" />{t('In daylight')}</span>{/if}
                      {#if c.temp != null}<span class="cl-flag">{t('{c}° at the foot', { c: Math.round(c.temp) })}</span>{/if}
                    </p>
                    {#if MARK[c.when]}<p class="rc-warn">{t(MARK[c.when])}</p>{/if}
                  {:else}
                    <p class="rc-empty">{t('No plan yet: a start time and a route are needed.')}</p>
                  {/if}

                  <!-- water and shops -->
                  <h3 class="cl-h3">{t('Water and shops (±{km} km)', { km: NEAR_KM })}</h3>
                  <ul class="cl-sup">
                    {#each [{ at: 'foot', s: c.foot, km: c.fromKm }, { at: 'top', s: c.summit, km: c.toKm }] as x (x.at)}
                      <li>
                        <b>{x.at === 'foot' ? t('At the foot') : t('At the top')}</b>
                        {#if x.s.water.length}<span><Droplet size={16} aria-hidden="true" /> {supplyLine(x.s.water)}</span>{/if}
                        {#if x.s.shop.length}<span><ShoppingBasket size={16} aria-hidden="true" /> {supplyLine(x.s.shop)}</span>{/if}
                        {#if !x.s.water.length && !x.s.shop.length}<span class="rc-warn">{t('No water or shop known within {km} km: fill up before.', { km: NEAR_KM })}</span>{/if}
                      </li>
                    {/each}
                  </ul>

                  <div class="rc-acts">
                    <a class="btn sm" href="{raceHref(id, 'map')}?km={c.fromKm}" data-climb-map={c.n}><MapPin size={16} aria-hidden="true" />{t('Show on the map')}</a>
                  </div>

                  <!-- own note -->
                  <label class="rc-lab">{t('Your note on this climb')}
                    <textarea class="inp" rows="3" maxlength="1000" bind:value={draft} placeholder={t('e.g. small gear from the bridge, water at the church')} data-climb-note={c.n}></textarea>
                  </label>
                  <div class="rc-acts">
                    <button type="button" class="btn sm" disabled={!draft.trim() || draft.trim() === (notes[c.key] ?? '')} onclick={() => saveNote(c)} data-climb-note-save={c.n}>{t('Save note')}</button>
                    {#if notes[c.key]}<button type="button" class="btn sm" onclick={() => deleteNote(c)} data-climb-note-del={c.n}><Trash2 size={16} aria-hidden="true" />{t('Delete note')}</button>{/if}
                    {#if savedMsg === c.key}<span class="rc-ok" role="status">{t('Saved.')}</span>{/if}
                  </div>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </RaceBox>
  {/if}
</div>

<style>
  .cl {
    /* the steepness classes 0–3 / 3–6 / 6–9 / 9–12 / over 12 % */
    --cl-0: var(--bar);
    --cl-1: var(--ok);
    --cl-2: var(--z3);
    --cl-3: var(--z4);
    --cl-4: var(--z5);
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }
  .cl-s0,
  .cl-bg0 {
    fill: var(--cl-0);
    background: var(--cl-0);
  }
  .cl-s1,
  .cl-bg1 {
    fill: var(--cl-1);
    background: var(--cl-1);
  }
  .cl-s2,
  .cl-bg2 {
    fill: var(--cl-2);
    background: var(--cl-2);
  }
  .cl-s3,
  .cl-bg3 {
    fill: var(--cl-3);
    background: var(--cl-3);
  }
  .cl-s4,
  .cl-bg4 {
    fill: var(--cl-4);
    background: var(--cl-4);
  }
  .cl-ctl {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .cl-own {
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .cl-how {
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: var(--lh);
  }
  .cl-how summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    font-weight: 600;
    cursor: pointer;
  }
  .cl-how p {
    margin: 0 0 4px;
  }
  .cl-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .cl-legend li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .cl-sw {
    width: 14px;
    height: 14px;
    border-radius: 3px;
  }
  .cl-item + .cl-item {
    border-top: 1px solid var(--line);
  }
  .cl-head {
    width: 100%;
    border: 0;
    background: transparent;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .cl-tick {
    flex: none;
    align-self: stretch;
    width: 6px;
    margin: 6px 0;
    border-radius: 3px;
  }
  .cl-num {
    display: grid;
    flex: none;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink);
    font: 700 var(--fs-small) var(--font-body);
  }
  .cl-chev {
    display: grid;
    flex: none;
    place-items: center;
    width: 32px;
    color: var(--ink-3);
    transition: transform 0.2s var(--ease-out);
  }
  .cl-chev.cl-up {
    transform: rotate(180deg);
  }
  .cl-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 4px 0 16px;
    min-width: 0;
  }
  .cl-h3 {
    margin: 4px 0 0;
    font: 700 var(--fs-body)/1.3 var(--font-body);
  }
  .cl-est {
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--warn-soft);
    color: var(--warn);
    font: 500 var(--fs-tiny) var(--font-body);
  }
  .cl-strip {
    margin-top: var(--sp-4);
  }
  .cl-strip-h {
    margin: 0 0 var(--sp-2);
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .cl-fig {
    margin: 0;
    min-width: 0;
  }
  .cl-chart,
  .cl-mini,
  .cl-row {
    display: block;
    width: 100%;
    border-radius: 6px;
    background: var(--paper-2);
  }
  .cl-chart {
    height: 140px;
  }
  .cl-mini {
    height: 90px;
  }
  .cl-row {
    height: 64px;
  }
  .cl-grid {
    stroke: var(--line);
    stroke-width: 0.5;
    vector-effect: non-scaling-stroke;
  }
  .cl-base {
    fill: var(--line);
  }
  .cl-span {
    fill: var(--paper);
  }
  .cl-area {
    fill: var(--accent-soft);
  }
  .cl-line {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2;
  }
  .cl-axis {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-top: 2px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-variant-numeric: tabular-nums;
  }
  .cl-flags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
  }
  .cl-flag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .cl-sup {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--fs-small);
  }
  .cl-sup li {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .cl-sup span {
    display: inline-flex;
    align-items: flex-start;
    gap: 4px;
    color: var(--ink-2);
    overflow-wrap: break-word;
    min-width: 0;
  }
  .cl-card textarea {
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
  }
</style>
