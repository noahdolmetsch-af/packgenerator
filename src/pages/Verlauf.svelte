<script>
  /**
   * AB4 «Verlauf» (Noah 14.10.2026 «freigabe»), Ich › Daten › Verlauf (#/me/history): every value in
   * one place, by day, newest first: your answers, the old daily checks, the rides from Strava (Fitbit
   * later). A filter by area and by source; every row carries its source. An answer can be changed or
   * removed here, the analyses follow (there is no second place). Right: the weight of the last 8
   * weeks as a calm line and who reads this history. Only to look at, stays on this device.
   */
  import { Pencil, Hand, Watch, Bike, Smartphone, RotateCcw, Gauge, ChartLine, Info, X, Trash2, History } from '@lucide/svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import Skeleton from '../lib/ui/Skeleton.svelte';
  import AreaIcon from '../lib/abfragen/AreaIcon.svelte';
  import AnswerInput from '../lib/abfragen/AnswerInput.svelte';
  import { historyQuery, putAnswer, deleteAnswer } from '../lib/abdb.js';
  import { AREAS, QUESTION, configOf, filterHistory, byDay, answerRow } from '../lib/abfragen.js';
  import { rowText, valueText, areaName, dayLong, dayShort, timeText, srcText, unitText } from '../lib/abfragen/words.js';
  import { backClose } from '../lib/ui/backclose.js';
  import { actHref } from '../lib/strava/acthref.js';
  import { localDay } from '../lib/localday.js';
  import { addDays } from '../lib/flow.js';
  import { t } from '../lib/i18n.svelte.js';
  import '../lib/ich/ich.css';
  import '../lib/abfragen/ab.css';
  import '../lib/bikes/velo-dlg.css';

  const today = localDay();
  const query = historyQuery();
  const data = $derived($query);
  const own = $derived(configOf(data?.cfg).own);
  const qOf = (row) => QUESTION[row.qid] ?? own.find((x) => x.id === row.qid) ?? null;

  let area = $state('all');
  let src = $state('all');
  let days = $state(14);
  const rows = $derived(data?.rows ?? []);
  const areasThere = $derived(AREAS.filter((a) => rows.some((r) => r.area === a.key && r.kind !== 'ride')));
  const hasRides = $derived(rows.some((r) => r.kind === 'ride'));
  const filtered = $derived(filterHistory(rows, { src: src === 'all' ? null : src }).filter((r) => (area === 'all' ? true : area === 'rides' ? r.kind === 'ride' : r.area === area && r.kind !== 'ride')));
  const from = $derived(addDays(today, -days + 1));
  const shownDays = $derived(byDay(filtered.filter((r) => r.day >= from)));
  // Gesamttest 20.10.2026 (C11): a day with 20 answers made the page 18 phone screens long; 5 per day, then «n weitere»
  const PER_DAY = 5;
  let openDays = $state({});
  const older = $derived(filtered.some((r) => r.day < from));

  // the weight of the last 8 weeks (the answers to «Was zeigt die Waage heute»)
  const weights = $derived(rows.filter((r) => r.qid === 'koerper.waage' && typeof r.value === 'number' && r.day >= addDays(today, -55)).sort((a, b) => a.day.localeCompare(b.day)));
  const W = 300;
  const H = 90;
  const line = $derived.by(() => {
    if (weights.length < 2) return null;
    const vs = weights.map((r) => r.value);
    const lo = Math.min(...vs) - 0.5;
    const hi = Math.max(...vs) + 0.5;
    const pts = weights.map((r, i) => ({ x: 10 + (i * (W - 20)) / (weights.length - 1), y: 10 + ((hi - r.value) / (hi - lo)) * (H - 20), r }));
    return { pts, d: `M${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')}` };
  });

  // change or remove one answer
  let edit = $state(null);
  let editValue = $state(null);
  let editNote = $state('');
  let dialog = $state();
  function openEdit(row) {
    edit = row;
    editValue = row.value;
    editNote = row.note ?? '';
  }
  $effect(() => {
    if (edit && dialog && !dialog.open) dialog.showModal();
  });
  async function saveEdit() {
    const q = qOf(edit);
    if (!q) return dialog.close();
    const next = answerRow(q, editValue, { at: edit.at, day: edit.day, slot: edit.slot ?? null, note: editNote });
    if (next) {
      if (edit.from !== 'check') next.id = edit.id; // an old daily check gets an answer of the same day in front of it
      await putAnswer(next);
    }
    dialog.close();
  }
  async function removeEdit() {
    await deleteAnswer(edit.id);
    dialog.close();
  }
  const ICON_SRC = { hand: Hand, fitbit: Watch, strava: Bike, app: Smartphone };
  const SOURCES = $derived([
    { key: 'all', name: t('All|source') },
    { key: 'hand', name: t('by hand') },
    { key: 'fitbit', name: t('Fitbit') },
    { key: 'strava', name: t('Strava') },
  ]);
</script>

<div class="ich-page vpage">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Data'), href: '#/me/data' }]} title={t('History')} sub={t('All values in one place: your answers, Fitbit and Strava. Only to look at, stays on this device.')} />

  <div class="ich-cols">
    <div class="ich-main">
      <div class="filt">
        <div class="chips" role="group" aria-label={t('Value')}>
          <button type="button" class="ab-opt" aria-pressed={area === 'all'} onclick={() => (area = 'all')}>{t('All|values')}</button>
          {#each areasThere as a (a.key)}<button type="button" class="ab-opt" aria-pressed={area === a.key} onclick={() => (area = a.key)}>{areaName(a.key)}</button>{/each}
          {#if hasRides}<button type="button" class="ab-opt" aria-pressed={area === 'rides'} onclick={() => (area = 'rides')}>{t('Trips')}</button>{/if}
        </div>
        <div class="f2"><span class="flab" id="vh-src">{t('Source')}</span><Seg labelledby="vh-src" full={false} value={src} options={SOURCES} onchange={(k) => (src = k)} /></div>
      </div>

      {#if !data}
        <Skeleton rows={4} />
      {:else if !shownDays.length}
        <Empty icon={History} text={src === 'fitbit' ? t('Nothing from Fitbit yet: the values come with the connection to Fitbit, later.') : t('No values yet. Your answers on Today land here.')} action={{ label: t('Your questions'), href: '#/me/abfragen' }} />
      {:else}
        <ul class="card hist">
          {#each shownDays as g (g.day)}
            <li class="hd">{dayLong(g.day)}</li>
            {#each openDays[g.day] ? g.rows : g.rows.slice(0, PER_DAY) as r (r.id)}
              {@const q = qOf(r)}
              {@const I = ICON_SRC[r.src] ?? Hand}
              <li class="h" data-row={r.qid}>
                <span class="ht num">{timeText(r.at) || '–'}</span>
                <span class="ich-ib sm">{#if r.kind === 'ride'}<Bike size={16} aria-hidden="true" />{:else}<AreaIcon area={r.area} size={16} />{/if}</span>
                <span class="hm"><b>{#if r.kind === 'ride' && r.ride?.id != null}<a class="actl" href={actHref(r.ride.id)} data-act-link={r.ride.id}>{rowText(r, own)}</a>{:else}{rowText(r, own)}{/if}</b>{#if r.note}<small>{r.note}</small>{:else if r.from === 'check'}<small>{t('from the daily check')}</small>{/if}</span>
                <span class="hv num">{valueText(r, q)}</span>
                <span class="ab-src {r.src}"><I size={13} aria-hidden="true" />{srcText(r.src)}</span>
                {#if r.kind !== 'ride' && q}<button type="button" class="ed" aria-label={t('Change «{q}»', { q: rowText(r, own) })} onclick={() => openEdit(r)}><Pencil size={16} aria-hidden="true" /></button>{:else}<span class="ed"></span>{/if}
              </li>
            {/each}
            {#if !openDays[g.day] && g.rows.length > PER_DAY}<li class="hmore"><button type="button" class="lk" onclick={() => (openDays = { ...openDays, [g.day]: true })} data-day-more>{t('Show {n} more', { n: g.rows.length - PER_DAY })}</button></li>{/if}
          {/each}
        </ul>
        {#if older}<button type="button" class="btn more" onclick={() => (days += 30)}>{t('Load older values')}</button>{/if}
      {/if}
    </div>

    <div class="ich-side">
      <section class="ich-sec" aria-labelledby="vh-w-h">
        <div class="ich-h"><div><h2 id="vh-w-h">{t('Weight')}</h2><p class="ich-hs">{t('last 8 weeks · only to look at')}</p></div></div>
        <div class="card side">
          {#if line}
            <svg class="spark" viewBox="0 0 {W} {H}" role="img" aria-label={t('Weight of the last 8 weeks')}>
              <path d={line.d} />
              {#each line.pts as p (p.r.id)}<circle cx={p.x} cy={p.y} r="4"><title>{dayShort(p.r.day)}: {p.r.value} {unitText('kg')}</title></circle>{/each}
            </svg>
            <div class="sl"><span>{dayShort(weights[0].day)}</span><span class="num">{t('{v} on {day}', { v: `${weights.at(-1).value} ${unitText('kg')}`, day: dayShort(weights.at(-1).day) })}</span></div>
          {:else}
            <p class="q">{t('Two weights and the line shows here. The question comes once a week.')}</p>
          {/if}
        </div>
      </section>
      <section class="ich-sec" aria-labelledby="vh-r-h">
        <div class="ich-h"><div><h2 id="vh-r-h">{t('Who reads this history')}</h2></div></div>
        <div class="card side">
          <ul class="reads">
            <li><RotateCcw size={16} aria-hidden="true" /><span>{t('Rückblick of a trip')}</span><small>{t('mood, sleep, resting pulse of the day')}</small></li>
            <li><Gauge size={16} aria-hidden="true" /><span>{t('Watts per kg')}</span><small>{t('the weight of the day of the trip')}</small></li>
            <li><ChartLine size={16} aria-hidden="true" /><span>{t('Balance')}</span><small>{t('all answers and values')}</small></li>
          </ul>
          <p class="hint"><Info size={15} aria-hidden="true" /><span>{t('Change a value here and the analyses change with it. There is no second place.')}</span></p>
        </div>
      </section>
      <p class="links"><a class="ab-lnk" href="#/me/analysis">{t('How it is analysed')}</a> <a class="ab-lnk" href="#/me/abfragen">{t('Your questions')}</a></p>
    </div>
  </div>
</div>

{#if edit}
  {@const q = qOf(edit)}
  <dialog class="sheet vdlg from-below" bind:this={dialog} use:backClose onclose={() => (edit = null)} aria-labelledby="vh-e-h">
    <div class="vd-head">
      <div class="vd-t">
        <h2 id="vh-e-h">{t('Change the answer')}</h2>
        <p class="vd-sub">{dayLong(edit.day)}{#if edit.at}{' · '}{timeText(edit.at)}{/if}</p>
      </div>
      <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    <p class="eq"><b>{rowText(edit, own)}</b></p>
    {#if q}<AnswerInput {q} bind:value={editValue} bind:note={editNote} id="vh-e-in" label={rowText(edit, own)} />{/if}
    <div class="vd-foot">
      {#if edit.from !== 'check'}<button type="button" class="btn del" onclick={removeEdit} data-edit-delete><Trash2 size={16} aria-hidden="true" />{t('Remove|answer')}</button>{/if}
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="button" class="btn hi" onclick={saveEdit} data-edit-save>{t('Save')}</button>
    </div>
  </dialog>
{/if}

<style>
  .hmore {
    padding: var(--sp-2) 0;
  }
  .hmore .lk {
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
  }
  .actl {
    color: inherit;
    text-decoration: underline;
    text-decoration-color: var(--line);
    text-underline-offset: 3px;
  }
  .vpage {
    max-width: 1180px;
  }
  .filt {
    display: grid;
    gap: 10px;
    margin-bottom: 14px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .f2 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .flab {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hist {
    list-style: none;
    margin: 0;
    padding: 4px 16px 8px;
  }
  .hd {
    padding: 14px 0 6px;
    color: var(--ink-3);
    font: 600 var(--fs-tiny) var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .h {
    display: grid;
    grid-template-columns: 48px 32px minmax(0, 1fr) auto auto 44px;
    gap: 10px;
    align-items: center;
    min-height: 52px;
    padding: 4px 0;
    border-top: 1px solid var(--line);
  }
  .hd + .h {
    border-top: 0;
  }
  .ht {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ich-ib.sm {
    width: 32px;
    height: 32px;
  }
  .hm {
    display: grid;
    min-width: 0;
  }
  .hm b {
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .hm small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .hv {
    font-weight: 600;
    text-align: right;
    overflow-wrap: break-word;
    max-width: 220px;
  }
  .ed {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  button.ed:hover {
    background: var(--paper-2);
  }
  .more {
    width: 100%;
    margin-top: 10px;
  }
  .side {
    padding: 14px 16px;
  }
  .spark {
    display: block;
    width: 100%;
    height: auto;
  }
  .spark path {
    fill: none;
    stroke: var(--ink-2);
    stroke-width: 2;
    stroke-linejoin: round;
  }
  .spark circle {
    fill: var(--paper);
    stroke: var(--ink-2);
    stroke-width: 2;
  }
  .sl {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-top: 4px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .q {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .reads {
    list-style: none;
    margin: 0 0 10px;
    padding: 0;
  }
  .reads li {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr) auto;
    gap: 8px;
    align-items: center;
    min-height: 44px;
    border-top: 1px solid var(--line);
  }
  .reads li:first-child {
    border-top: 0;
  }
  .reads small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    text-align: right;
  }
  .hint {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hint :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 0 16px;
    margin: 0 2px;
  }
  .eq {
    margin: 0 0 10px;
  }
  .del {
    margin-right: auto;
  }
  @media (max-width: 719px) {
    .h {
      grid-template-columns: 44px 32px minmax(0, 1fr) 44px;
      row-gap: 2px;
    }
    .hv {
      grid-column: 3;
      grid-row: 2;
      text-align: left;
    }
    .h > .ab-src {
      grid-column: 3;
      grid-row: 3;
      justify-self: start;
    }
    .ed {
      grid-column: 4;
      grid-row: 1;
    }
    .reads li {
      grid-template-columns: 22px minmax(0, 1fr);
      row-gap: 0;
      padding: 6px 0;
    }
    .reads small {
      grid-column: 2;
      text-align: left;
    }
  }
</style>
