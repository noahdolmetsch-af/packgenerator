<script>
  /**
   * «Tour planen mit GPX» (Noah 20.10.2026 «3a und b»: «beim Planen einer Tour mit einer GPX-File … ein
   * schönes Höhenprofil sehe und alle Anstiege einzeln ansehen kann … gezielt auf paar hundert Meter
   * jeweils die Steigung»). Under the map of a planned tour (pack/RouteCard.svelte):
   * - the fine, zoomable profile of the race page (map/ProfileStrip.svelte), coloured by the gradient like
   *   komoot; zoomed in, every coloured piece is 100–200 m;
   * - every climb of the route (race/climbs-lib.js), sortable, from a minimum gain; a tap opens its card
   *   (gradient per 100 m, the numbers, your note) and zooms the profile to the climb.
   * Data: trip.route (profileFine from the GPX import, route.js), trip.climbMin and trip.climbNotes (plain
   * fields of the trip, no index). Notes: askDelete + deleteWithUndo.
   */
  import { untrack, tick } from 'svelte';
  import { ChevronDown, Trash2, ZoomIn } from '@lucide/svelte';
  import ProfileStrip from '../map/ProfileStrip.svelte';
  import { climbsDetail, climbProfile, sortClimbs, climbTotals, stepOf, LEVELS, SORTS } from '../race/climbs-lib.js';
  import { fineOf } from '../map/fineprofile.js';
  import { SHORT_LIST, PLAN_MIN_GAINS, minOf, viewFor, colourOf, noteKey, notesOf, withNote } from './routeclimbs.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { db } from '../db.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  let { trip } = $props();

  const route = $derived(trip.route ?? null);
  const f = $derived(route ? fineOf(route.profileFine ?? null, route.profile ?? []) : null);
  const total = $derived(f?.km ?? Number(route?.km) ?? 0);
  const profile = $derived(climbProfile(route));
  const step = $derived(stepOf(profile));

  let view = $state(null);
  let cursorKm = $state(null);
  let minGain = $state(untrack(() => minOf(trip)));
  let sortBy = $state('order');
  let open = $state(null); // key of the open climb
  let all = $state(false);

  const climbs = $derived(route ? climbsDetail({ route, minGain }) : []);
  const sorted = $derived(sortClimbs(climbs, sortBy));
  const shown = $derived(all ? sorted : sorted.slice(0, SHORT_LIST));
  const sum = $derived(climbTotals(climbs, Number(route?.gainM) || 0));
  const notes = $derived(notesOf(trip));

  const num = (v, d = 0) => (Number.isFinite(v) ? v.toLocaleString(locale(), { maximumFractionDigits: d }) : '–');
  const levelName = (key) => t(LEVELS.find((l) => l.key === key)?.name ?? '');
  const save = (patch) => db.trips.update(trip.id, patch);

  function setMin(v) {
    minGain = Math.max(20, Math.min(3000, Math.round(Number(v) || minGain)));
    open = null;
    save({ climbMin: minGain });
  }

  let strip = $state();
  async function toggle(c) {
    open = open === c.key ? null : c.key;
    if (!open) return;
    view = viewFor(c, total);
    cursorKm = c.maxAt;
  }
  async function showInProfile(c) {
    view = viewFor(c, total);
    cursorKm = c.maxAt;
    await tick();
    strip?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  /* ---------- the own note per climb ---------- */
  let draft = $state('');
  $effect(() => {
    const v = open ? (notes[open] ?? '') : '';
    untrack(() => (draft = v));
  });
  let savedMsg = $state('');
  const putNote = async (key, text) => {
    const cur = await db.trips.get(trip.id);
    await save({ climbNotes: withNote(cur?.climbNotes, key, text) });
  };
  async function saveNote(c) {
    const text = draft.trim();
    if (!text) return;
    await putNote(noteKey(c), text);
    savedMsg = c.key;
    setTimeout(() => (savedMsg = ''), 2500);
  }
  async function deleteNote(c) {
    const old = notes[noteKey(c)];
    if (!old) return;
    if ((await askDelete({ title: t('Delete the note on climb {n}?', { n: c.n }), text: old })) !== 'delete') return;
    await deleteWithUndo({ run: () => putNote(noteKey(c), ''), undo: () => putNote(noteKey(c), old), text: t('Note on climb {n} deleted.', { n: c.n }), name: t('Note on climb {n}', { n: c.n }) });
  }

  /* ---------- the bars per 100 m ---------- */
  const BAR_W = 10;
  const CH_H = 100;
  const chartTop = (c) => Math.max(12, Math.ceil(Math.max(...c.bars.map((b) => b.pct), 0)));
  const barH = (pct, top) => Math.max(1.5, (Math.max(0, pct) / top) * (CH_H - 4));
</script>

{#if f}
  <div class="rcl" data-route-climbs>
    <div class="rcl-strip" bind:this={strip}>
      <h3 class="rcl-h">{t('Elevation profile')}</h3>
      <ProfileStrip profile={route.profile ?? []} fine={route.profileFine ?? null} bind:view bind:cursorKm withMap={false} marks={climbs.map((c) => ({ km: c.fromKm }))} />
    </div>

    <section class="rcl-list" aria-labelledby="rcl-h-{trip.id}">
      <h3 class="rcl-h" id="rcl-h-{trip.id}">{t('Climbs|race')}</h3>
      {#if climbs.length}
        <p class="rcl-sum" data-route-climbs-sum>
          <b data-route-climbs-count>{tn(sum.n, '{n} climb of {m} m or more', '{n} climbs of {m} m or more', { m: minGain })}</b>
          <span>{sum.share != null ? t('{m} m up in climbs ({p} % of all)', { m: num(sum.gain), p: sum.share }) : t('{m} m up in climbs', { m: num(sum.gain) })}</span>
          <span>{t('steepest 100 m: climb {n}, km {km}', { n: sum.steepest.n, km: num(sum.steepest.maxAt, 1) })} ({num(sum.steepest.max, 1)} %)</span>
        </p>
      {:else}
        <p class="rcl-empty">{t('No climb of {m} m or more in the profile.', { m: minGain })}</p>
      {/if}

      <details class="rcl-ctl">
        <summary>{t('Minimum and order')}</summary>
        <span class="rcl-lab" id="rcl-min-{trip.id}">{t('Climbs from')}</span>
        <div class="rcl-chips" role="group" aria-labelledby="rcl-min-{trip.id}">
          {#each PLAN_MIN_GAINS as g (g)}
            <button type="button" class="rcl-chip" aria-pressed={minGain === g} onclick={() => setMin(g)} data-route-climbs-min={g}>{t('{m} m up', { m: g })}</button>
          {/each}
        </div>
        <span class="rcl-lab" id="rcl-sort-{trip.id}">{t('Sort')}</span>
        <div class="rcl-chips" role="group" aria-labelledby="rcl-sort-{trip.id}">
          {#each SORTS as s (s.key)}
            <button type="button" class="rcl-chip" aria-pressed={sortBy === s.key} onclick={() => (sortBy = s.key)} data-route-climbs-sort={s.key}>{t(s.name)}</button>
          {/each}
        </div>
        <p class="rcl-note">{t('A climb: at least the minimum up, and never more than 40 m down on the way.')}</p>
        <p class="rcl-note">{t('Difficulty: metres up × metres up ÷ (length in metres × 10), plus 1 point for every 1000 m the top lies above 1000 m. It is built like the FIETS index of a Dutch cycling magazine.')}</p>
      </details>

      {#if climbs.length}
        <p class="rcl-note">{t('Tap a climb: the profile above zooms to it and you see its gradient every 100 m.')}</p>
        <ul class="rcl-ul" data-route-climbs-list>
          {#each shown as c (c.key)}
            {@const isOpen = open === c.key}
            <li class="rcl-item" data-route-climb={c.n}>
              <button type="button" class="rcl-row" aria-expanded={isOpen} aria-controls="rcl-card-{trip.id}-{c.n}" onclick={() => toggle(c)} data-route-climb-open={c.n}>
                <span class="rcl-tick" style:background={colourOf(c.avg)} aria-hidden="true"></span>
                <span class="rcl-num" aria-hidden="true">{c.n}</span>
                <span class="rcl-main">
                  <b>{t('Climb {n}', { n: c.n })} · {t('km {a}–{b}', { a: num(c.fromKm, 1), b: num(c.toKm, 1) })}</b>
                  <small>{t('{m} m up · {l} km · {avg} % average, {max} % at most', { m: num(c.gain), l: num(c.lengthKm, 1), avg: num(c.avg, 1), max: num(c.max, 1) })}</small>
                  <small>{levelName(c.level)} ({num(c.score, 1)}){#if notes[noteKey(c)]}{' '}· {t('with note')}{/if}</small>
                </span>
                <span class="rcl-chev" class:rcl-up={isOpen} aria-hidden="true"><ChevronDown size={20} /></span>
              </button>

              {#if isOpen}
                {@const top = chartTop(c)}
                <div class="rcl-card" id="rcl-card-{trip.id}-{c.n}" data-route-climb-card={c.n}>
                  <h4 class="rcl-h4">{t('Gradient per 100 m')}{#if c.estimated}{' '}<span class="rcl-est">{t('estimated')}</span>{/if}</h4>
                  <figure class="rcl-fig">
                    <svg class="rcl-chart" viewBox="0 0 {c.bars.length * BAR_W} {CH_H}" preserveAspectRatio="none" role="img" aria-label={t('Gradient of climb {n} per 100 m: {avg} % average, {max} % at most', { n: c.n, avg: num(c.avg, 1), max: num(c.max, 1) })} data-route-climb-chart>
                      {#each [3, 6, 9, 12].filter((g) => g < top) as g (g)}
                        <line class="rcl-grid" x1="0" x2={c.bars.length * BAR_W} y1={CH_H - (g / top) * (CH_H - 4)} y2={CH_H - (g / top) * (CH_H - 4)} />
                      {/each}
                      {#each c.bars as b, i (i)}
                        <rect x={i * BAR_W + 0.5} y={CH_H - barH(b.pct, top)} width={BAR_W - 1} height={barH(b.pct, top)} fill={colourOf(b.pct)} data-route-climb-bar><title>{t('km {a}–{b}', { a: num(b.fromKm, 1), b: num(b.toKm, 1) })}: {num(b.pct, 1)} %</title></rect>
                      {/each}
                    </svg>
                    <figcaption class="rcl-axis"><span>{t('km {km}', { km: num(c.fromKm, 1) })}</span><span>{t('up to {p} %', { p: top })}</span><span>{t('km {km}', { km: num(c.toKm, 1) })}</span></figcaption>
                  </figure>
                  {#if c.estimated}<p class="rcl-note">{t('Estimated: the profile has a point only every {km} km.', { km: num(step, 1) })}</p>{/if}

                  <div class="rcl-stat">
                    <div><b>{num(c.lengthKm, 1)} km</b><small>{t('length')}</small></div>
                    <div><b>{num(c.gain)} m</b><small>{t('up')}</small></div>
                    <div><b>{num(c.top)} m</b><small>{t('top height')}</small></div>
                    <div><b>{num(c.avg, 1)} %</b><small>{t('average')}</small></div>
                    <div><b>{num(c.max, 1)} %</b><small>{t('steepest 100 m at km {km}', { km: num(c.maxAt, 1) })}</small></div>
                    <div><b>{num(c.score, 1)}</b><small>{t('difficulty: {level}', { level: levelName(c.level) })}</small></div>
                  </div>

                  <div class="rcl-acts">
                    <button type="button" class="btn sm" onclick={() => showInProfile(c)} data-route-climb-zoom={c.n}><ZoomIn size={16} aria-hidden="true" />{t('Show in the profile')}</button>
                  </div>

                  <label class="rcl-lab">{t('Your note on this climb')}
                    <textarea class="inp" rows="2" maxlength="1000" bind:value={draft} placeholder={t('e.g. small gear from the bridge, water at the church')} data-route-climb-note={c.n}></textarea>
                  </label>
                  <div class="rcl-acts">
                    <button type="button" class="btn sm" disabled={!draft.trim() || draft.trim() === (notes[noteKey(c)] ?? '')} onclick={() => saveNote(c)} data-route-climb-note-save={c.n}>{t('Save note')}</button>
                    {#if notes[noteKey(c)]}<button type="button" class="btn sm" onclick={() => deleteNote(c)} data-route-climb-note-del={c.n}><Trash2 size={16} aria-hidden="true" />{t('Delete note')}</button>{/if}
                    {#if savedMsg === c.key}<span class="rcl-ok" role="status">{t('Saved.')}</span>{/if}
                  </div>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
        {#if sorted.length > SHORT_LIST}
          <button type="button" class="link rcl-more" onclick={() => (all = !all)} aria-expanded={all} data-route-climbs-all>{all ? t('Show fewer climbs') : t('Show all {n} climbs', { n: sorted.length })}</button>
        {/if}
      {/if}
    </section>
  </div>
{/if}

<style>
  .rcl {
    display: grid;
    gap: 14px;
    min-width: 0;
  }
  .rcl-strip,
  .rcl-list {
    display: grid;
    gap: 8px;
    min-width: 0;
  }
  .rcl-h {
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .rcl-h4 {
    margin: 4px 0 0;
    font: 600 var(--fs-small) / 1.3 var(--font-body);
  }
  .rcl-sum {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 12px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-variant-numeric: tabular-nums;
  }
  .rcl-sum b {
    color: var(--ink);
  }
  .rcl-empty,
  .rcl-note {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: var(--lh);
  }
  .rcl-ctl {
    display: grid;
    gap: 6px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .rcl-ctl summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    font-weight: 600;
    cursor: pointer;
  }
  .rcl-ctl[open] {
    padding-bottom: 6px;
  }
  .rcl-lab {
    display: grid;
    gap: 4px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .rcl-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .rcl-chip {
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .rcl-chip[aria-pressed='true'] {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--accent);
  }
  .rcl-ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rcl-item + .rcl-item {
    border-top: 1px solid var(--line);
  }
  .rcl-row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 56px;
    padding: 6px 0;
    border: 0;
    background: transparent;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .rcl-tick {
    flex: none;
    align-self: stretch;
    width: 6px;
    border-radius: 3px;
  }
  .rcl-num {
    display: grid;
    flex: none;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 999px;
    background: var(--paper-2);
    font: 700 var(--fs-small) var(--font-body);
  }
  .rcl-main {
    display: grid;
    gap: 2px;
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .rcl-main small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .rcl-chev {
    display: grid;
    flex: none;
    place-items: center;
    width: 32px;
    color: var(--ink-3);
    transition: transform 0.2s var(--ease-out);
  }
  .rcl-chev.rcl-up {
    transform: rotate(180deg);
  }
  .rcl-card {
    display: grid;
    gap: 10px;
    padding: 4px 0 14px;
    min-width: 0;
  }
  .rcl-est {
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--warn-soft);
    color: var(--warn);
    font: 500 var(--fs-tiny) var(--font-body);
  }
  .rcl-fig {
    margin: 0;
    min-width: 0;
  }
  .rcl-chart {
    display: block;
    width: 100%;
    height: 130px;
    border-radius: 6px;
    background: var(--paper-2);
  }
  .rcl-grid {
    stroke: var(--line);
    stroke-width: 0.5;
    vector-effect: non-scaling-stroke;
  }
  .rcl-axis {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-top: 2px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-variant-numeric: tabular-nums;
  }
  .rcl-stat {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }
  .rcl-stat div {
    display: grid;
    gap: 2px;
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--paper-2);
    min-width: 0;
  }
  .rcl-stat b {
    font-variant-numeric: tabular-nums;
  }
  .rcl-stat small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    overflow-wrap: break-word;
  }
  .rcl-acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .rcl-card textarea {
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
  }
  .rcl-ok {
    color: var(--ok);
    font-size: var(--fs-small);
  }
  .rcl-more {
    justify-self: start;
    min-height: 44px;
  }
</style>
