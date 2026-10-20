<script>
  /**
   * AB4 «Verlauf» (Noah 14.10.2026 «freigabe»), Ich › Daten › Verlauf (#/me/history): every value in
   * one place, by day, newest first: your answers, the old daily checks, the rides from Strava (Fitbit
   * later). A filter by area and by source; every row carries its source. An answer can be changed or
   * removed here, the analyses follow (there is no second place). Only to look at, stays on this device.
   * «Aktiv neu» (Noah 20.10.2026 «3a 4b»): a diary, one card per day: the Fitbit values of the day (sleep,
   * resting pulse, HRV, steps, active zone minutes), every Strava activity as a whole row with time, km,
   * metres, pulse and power (a tap opens its page), then the answers. The weight card and «Wer diesen
   * Verlauf liest» are gone (4b).
   */
  import { Pencil, Hand, Watch, Bike, Smartphone, X, Trash2, History, ChevronRight } from '@lucide/svelte';
  import { tableQuery } from '../lib/messwerte-data.js';
  import { METRIC, shown } from '../lib/messwerte.js';
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
  import { t, num } from '../lib/i18n.svelte.js';
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
  const filtered = $derived(filterHistory(rows, { src: src === 'all' ? null : src }).filter((r) => (area === 'all' ? true : area === 'rides' ? r.kind === 'ride' : r.area === area && r.kind !== 'ride')));
  const from = $derived(addDays(today, -days + 1));
  // Gesamttest 20.10.2026 (C11): a day with 20 answers made the page 18 phone screens long; 5 per day, then «n weitere»
  const PER_DAY = 5;
  let openDays = $state({});
  const older = $derived(filtered.some((r) => r.day < from));

  // «Aktiv neu» 3a: the Fitbit values and the Strava activities of every day (messwerte.js)
  const tq = tableQuery();
  const table = $derived($tq ?? new Map());
  const FIT = ['sleep', 'rhr', 'hrv', 'steps', 'azm'];
  const fitOf = (day) => {
    const r = table.get(day);
    return r ? FIT.filter((k) => r[k] != null).map((k) => ({ k, v: r[k] })) : [];
  };
  const actsOf = (day) => table.get(day)?.acts ?? [];
  const showFit = $derived(src === 'all' || src === 'fitbit');
  const showActs = $derived((src === 'all' || src === 'strava') && (area === 'all' || area === 'rides'));
  const showAnswers = $derived(src !== 'fitbit' && area !== 'rides');
  const hasFit = $derived([...table.values()].some((r) => FIT.some((k) => r[k] != null)));
  const hasActs = $derived([...table.values()].some((r) => r.acts.length));
  // the days of the diary: answers, Fitbit and activities, newest first
  const answerRows = $derived(filtered.filter((r) => r.kind !== 'ride'));
  const answersBy = $derived(new Map(byDay(answerRows).map((g) => [g.day, g.rows])));
  const diary = $derived.by(() => {
    const set = new Set();
    if (showAnswers) for (const r of answerRows) if (r.day >= from) set.add(r.day);
    for (const [d, r] of table) {
      if (d < from || d > today) continue;
      if ((showFit && FIT.some((k) => r[k] != null)) || (showActs && r.acts.length)) set.add(d);
    }
    return [...set].sort((a, b) => b.localeCompare(a)).map((day) => ({ day, fit: showFit && area === 'all' ? fitOf(day) : [], acts: showActs ? actsOf(day) : [], rows: showAnswers ? (answersBy.get(day) ?? []) : [] }));
  });
  const olderAny = $derived(older || [...table.keys()].some((d) => d < from));
  const fitText = (k, v) => `${shown(k, v, num)}${k === 'sleep' || !METRIC[k].unit ? '' : ` ${t(METRIC[k].unit)}`}`;
  const FIT_NAME = { sleep: 'Sleep|metric', rhr: 'Resting pulse', hrv: 'HRV', steps: 'Steps', azm: 'Active zone minutes' };
  const actLine = (a) =>
    [a.movingS ? shown('time', a.movingS, num) : '', a.km ? `${num(Math.round(a.km * 10) / 10)} km` : '', a.hm ? `${num(Math.round(a.hm))} m` : '', a.hrAvg ? `♥ ${Math.round(a.hrAvg)} ${t('bpm')}` : '', a.wAvg && a.wDevice ? `${Math.round(a.wAvg)} W` : ''].filter(Boolean).join(' · ');

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
          {#if hasActs}<button type="button" class="ab-opt" aria-pressed={area === 'rides'} onclick={() => (area = 'rides')}>{t('Activities|filter')}</button>{/if}
        </div>
        <div class="f2"><span class="flab" id="vh-src">{t('Source')}</span><Seg labelledby="vh-src" full={false} value={src} options={SOURCES} onchange={(k) => (src = k)} /></div>
      </div>

      {#if !data}
        <Skeleton rows={4} />
      {:else if !diary.length}
        <Empty icon={History} text={src === 'fitbit' && !hasFit ? t('No values from Fitbit yet. Connect Fitbit under Me › Fitbit; the values then come by themselves.') : t('No values yet. Your answers on Today land here.')} action={src === 'fitbit' && !hasFit ? { label: t('Fitbit'), href: '#/me/fitbit' } : { label: t('Your questions'), href: '#/me/abfragen' }} />
      {:else}
        <div class="diary">
          {#each diary as g (g.day)}
            <section class="card day" data-day={g.day} aria-label={dayLong(g.day)}>
              <h2 class="hd">{dayLong(g.day)}</h2>
              {#if g.fit.length}
                <ul class="fit" data-fit={g.day}>
                  {#each g.fit as f (f.k)}<li data-fit-k={f.k}><small>{t(FIT_NAME[f.k])}</small><b class="num">{fitText(f.k, f.v)}</b></li>{/each}
                  <li class="fsrc"><span class="ab-src fitbit"><Watch size={13} aria-hidden="true" />{srcText('fitbit')}</span></li>
                </ul>
              {/if}
              {#if g.acts.length}
                <ul class="acts">
                  {#each g.acts as a (a.id)}
                    <li>
                      <a class="act" href={actHref(a.id)} data-act-link={a.id}>
                        <span class="ht num">{a.time || '–'}</span>
                        <span class="ich-ib sm"><Bike size={16} aria-hidden="true" /></span>
                        <span class="hm"><b>{a.name || t('Activity from Strava')}</b><small class="num">{actLine(a)}</small></span>
                        <span class="ab-src strava"><Bike size={13} aria-hidden="true" />{srcText('strava')}</span>
                        <ChevronRight size={18} aria-hidden="true" />
                      </a>
                    </li>
                  {/each}
                </ul>
              {/if}
              {#if g.rows.length}
                <ul class="hist">
                  {#each openDays[g.day] ? g.rows : g.rows.slice(0, PER_DAY) as r (r.id)}
                    {@const q = qOf(r)}
                    {@const I = ICON_SRC[r.src] ?? Hand}
                    <li class="h" data-row={r.qid}>
                      <span class="ht num">{timeText(r.at) || '–'}</span>
                      <span class="ich-ib sm"><AreaIcon area={r.area} size={16} /></span>
                      <span class="hm"><b>{rowText(r, own)}</b>{#if r.note}<small>{r.note}</small>{:else if r.from === 'check'}<small>{t('from the daily check')}</small>{/if}</span>
                      <span class="hv num">{valueText(r, q)}</span>
                      <span class="ab-src {r.src}"><I size={13} aria-hidden="true" />{srcText(r.src)}</span>
                      {#if q}<button type="button" class="ed" aria-label={t('Change «{q}»', { q: rowText(r, own) })} onclick={() => openEdit(r)}><Pencil size={16} aria-hidden="true" /></button>{:else}<span class="ed"></span>{/if}
                    </li>
                  {/each}
                  {#if !openDays[g.day] && g.rows.length > PER_DAY}<li class="hmore"><button type="button" class="lk" onclick={() => (openDays = { ...openDays, [g.day]: true })} data-day-more>{t('Show {n} more', { n: g.rows.length - PER_DAY })}</button></li>{/if}
                </ul>
              {/if}
            </section>
          {/each}
        </div>
        {#if olderAny}<button type="button" class="btn more" onclick={() => (days += 30)}>{t('Load older values')}</button>{/if}
      {/if}
    </div>

    <div class="ich-side">
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
  .diary {
    display: grid;
    gap: 12px;
  }
  .day {
    padding: 4px 16px 8px;
  }
  .hist,
  .acts,
  .fit {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .fit {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 16px;
    padding: 6px 0 10px;
  }
  .fit li {
    display: grid;
    line-height: 1.25;
  }
  .fit small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .fit b {
    font-weight: 600;
  }
  .fit .fsrc {
    margin-left: auto;
  }
  .act {
    display: grid;
    grid-template-columns: 48px 32px minmax(0, 1fr) auto 20px;
    gap: 10px;
    align-items: center;
    min-height: 56px;
    padding: 4px 0;
    border-top: 1px solid var(--line);
    color: var(--ink);
    text-decoration: none;
  }
  .act:hover {
    background: var(--paper-2);
  }
  .act :global(svg:last-child) {
    color: var(--ink-3);
  }
  .hd {
    margin: 0;
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
  .fit + .acts .act,
  .hd + .acts .act,
  .hd + .hist .h {
    border-top: 0;
  }
  .fit + .acts .act {
    border-top: 1px solid var(--line);
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
    .act {
      grid-template-columns: 44px 32px minmax(0, 1fr) 20px;
    }
    .act > .ab-src {
      display: none;
    }
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
  }
</style>
