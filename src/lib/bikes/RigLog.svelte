<script>
  /**
   * Velos › Setup › Setup-Logbuch (UC3-3, Noah 14.10.2026 «2 ja und weiter ausbauen»): what you changed
   * on the bike, newest first, each change with before and after, why, the km since, the weight it
   * adds and how the first trip after it felt (your sentence from that trip's debrief).
   * Entries come from you, or from the workshop: a job that replaced a part asks «Into the log?».
   * After 3 trips with a change the app asks once whether to go back. Nothing is written by itself.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { bikesHash } from '../bikes.js';
  import { PART } from '../care.js';
  import { localDay } from '../localday.js';
  import { LOG_KINDS, logView, logYear, backHint, visitOffers } from '../rig.js';
  import { Plus, Lightbulb, X, ArrowRight, Route, Scale, Wrench, Pencil, MessageSquare } from '@lucide/svelte';
  import VeloHead from './VeloHead.svelte';
  import RigLogDialog from './RigLogDialog.svelte';
  import { t, tn, num, dateOf } from '../i18n.svelte.js';

  let { bike } = $props();

  const tripsQ = liveQuery(() => db.trips.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const kmQ = liveQuery(() => db.kmBook.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const today = localDay();

  const all = $derived(logView(bike, { trips: $tripsQ ?? [], debriefs: $debriefsQ ?? [], kmBook: $kmQ ?? [], today }));
  let kind = $state('all');
  const shown = $derived(kind === 'all' ? all : all.filter((e) => e.kind === kind));
  const year = Number(today.slice(0, 4));
  const sum = $derived(logYear(bike.setupLog ?? [], year));
  const back = $derived(backHint(bike, $tripsQ ?? [], today));
  const offers = $derived(visitOffers(bike, $visitsQ ?? [], today));
  let why = $state(false);
  let dialog = $state.raw(null); // { entry } (null entry = new); raw: the entry goes to IndexedDB as it is

  const kindName = (k) => t(LOG_KINDS.find((x) => x.key === k)?.name ?? 'Other|setup');
  const grams = (g) => (g == null ? '' : `${g > 0 ? '+' : g < 0 ? '−' : '±'}${num(Math.abs(g))} g`);
  const partName = (key) => t(PART[key]?.name ?? key);

  const log = () => bike.setupLog ?? [];
  const write = (list, extra = {}) => db.bikes.update(bike.id, { setupLog: list, ...extra });
  const save = (e) => write(log().some((x) => x.id === e.id) ? log().map((x) => (x.id === e.id ? e : x)) : [...log(), e]);
  const remove = (e) => write(log().filter((x) => x.id !== e.id));
  const answerBack = () => write(log().map((x) => (x.id === back.id ? { ...x, backAsked: true } : x)));
  /** «Go back»: a new entry the other way round, then the question is answered. */
  function goBack() {
    const e = log().find((x) => x.id === back.id);
    answerBack();
    dialog = { entry: { kind: e?.kind ?? 'other', title: `${back.after} → ${back.before}`, before: back.after, after: back.before, why: t('Back after {n} trips', { n: back.n }) } };
  }
  const fromVisit = (o) => ({ date: o.date, kind: o.kind, title: [partName(o.part), o.model].filter(Boolean).join(' '), after: o.model, source: { type: 'visit', id: o.visitId, label: t('Workshop job of {date}', { date: dateOf(o.date) }) }, part: o.part });
  const skipVisit = (o) => db.bikes.update(bike.id, { logSkipped: [...new Set([...(bike.logSkipped ?? []), `${o.visitId}:${o.part}`])] });
  const sourceText = (e) => (e.source?.type === 'visit' ? e.source.label || t('Workshop job') : e.source?.label || '');
</script>

<VeloHead
  crumbs={[{ label: t('Bike'), href: bikesHash({ tab: 'setup', bike: bike.id }) }, { label: t('My setup|tab'), href: bikesHash({ tab: 'rig', bike: bike.id }) }]}
  here={t('Setup log')}
  title={t('Setup log')}
  sub={`${bike.name} · ${t('what you changed and how it felt')}`}
>
  <button type="button" class="btn hi" onclick={() => (dialog = { entry: null })}><Plus size={16} aria-hidden="true" />{t('Write down a change')}</button>
</VeloHead>

<div class="chips" role="group" aria-label={t('Show')}>
  <button type="button" class="chip" aria-pressed={kind === 'all'} onclick={() => (kind = 'all')}>{t('All')}</button>
  {#each LOG_KINDS as k (k.key)}<button type="button" class="chip" aria-pressed={kind === k.key} onclick={() => (kind = k.key)}>{t(k.name)}</button>{/each}
</div>

<div class="cols">
  <div class="tl" aria-label={t('Changes')} role="list">
    {#each shown as e (e.id)}
      <article class="card te" role="listitem" aria-labelledby="te-{e.id}">
        <div class="top"><span class="tag">{kindName(e.kind)}</span><span class="dt">{dateOf(e.date)}</span><button type="button" class="iconb" aria-label={t('Change {name}', { name: e.title })} onclick={() => (dialog = { entry: e })}><Pencil size={16} aria-hidden="true" /></button></div>
        <h3 id="te-{e.id}">{e.title}</h3>
        {#if e.before || e.after}
          <div class="ba"><span><small>{t('before')}</small>{e.before || '–'}</span><ArrowRight size={18} aria-hidden="true" /><span><small>{t('after')}</small>{e.after || '–'}</span></div>
        {/if}
        {#if e.why}<p class="why"><b>{t('Why:')}</b> {e.why}</p>{/if}
        <div class="facts">
          {#if e.kmSince != null}<span><Route size={14} aria-hidden="true" />{t('{km} km since', { km: num(e.kmSince) })}</span>{/if}
          {#if e.deltaG != null}<span><Scale size={14} aria-hidden="true" />{t('Weight {g}', { g: grams(e.deltaG) })}</span>{/if}
          {#if sourceText(e)}<span><Wrench size={14} aria-hidden="true" />{sourceText(e)}</span>{/if}
        </div>
        {#if e.firstTrip}
          <p class="feel"><MessageSquare size={16} aria-hidden="true" /><span>{t('First trip after it: {trip}', { trip: e.firstTrip.title })}{#if e.feel}<br />{t('Debrief: «{text}»', { text: e.feel })}{/if}</span></p>
        {/if}
      </article>
    {:else}
      <p class="card hint">{kind === 'all' ? t('No change written down yet. A new chainring, other tyres, another bag: write it down and see later how it felt.') : t('No change of this kind yet.')}</p>
    {/each}
  </div>

  <aside class="side">
    <section class="card blk" aria-labelledby="ly-h">
      <header class="bh"><h2 id="ly-h">{t('This year')}</h2><p>{bike.name}</p></header>
      <div class="two">
        <div><b class="num">{sum.n}</b><small>{tn(sum.n, 'change|count', 'changes|count')}</small></div>
        <div><b class="num">{grams(sum.deltaG) || '±0 g'}</b><small>{t('weight of the bike')}</small></div>
      </div>
      {#if sum.n}<p class="hint">{LOG_KINDS.filter((k) => sum.byKind[k.key]).map((k) => `${t(k.name)} ${sum.byKind[k.key]}`).join(' · ')}</p>{/if}
    </section>

    {#each offers.slice(0, 3) as o (o.visitId + o.part)}
      <div class="sug">
        <Wrench size={18} aria-hidden="true" />
        <span class="t">{t('Workshop on {date}: {part} replaced. Into the log?', { date: dateOf(o.date), part: [partName(o.part), o.model].filter(Boolean).join(' ') })}
          <span class="acts"><button type="button" class="lnk" onclick={() => (dialog = { entry: fromVisit(o) })}>{t('Into the log')}</button> · <button type="button" class="lnk" onclick={() => skipVisit(o)}>{t('No')}</button></span></span>
      </div>
    {/each}

    {#if back}
      <div class="sug">
        <Lightbulb size={18} aria-hidden="true" />
        <span class="t">{t('After {n} trips with {after}: back to {before}? Only if you want.', { n: back.n, after: back.after, before: back.before })}
          <span class="acts"><button type="button" class="lnk" onclick={goBack}>{t('Go back')}</button> · <button type="button" class="lnk" aria-expanded={why} onclick={() => (why = !why)}>{t('Why?')}</button></span>
          {#if why}<small class="whyx">{t('Rule: the newest change has a before and an after, and {n} trips on this bike started after it. The app asks once.', { n: 3 })}</small>{/if}
        </span>
        <button type="button" class="x" aria-label={t('Dismiss hint')} onclick={answerBack}><X size={16} aria-hidden="true" /></button>
      </div>
    {/if}

    <section class="card blk" aria-labelledby="lf-h">
      <header class="bh"><h2 id="lf-h">{t('Where the entries come from')}</h2></header>
      <ul class="src">
        <li><b>{t('Workshop|tab')}</b><span>{t('A workshop job that replaced a part asks «Into the log?»')}</span></li>
        <li><b>{t('You')}</b><span>{t('«Write down a change» for everything you change yourself')}</span></li>
        <li><b>{t('Debrief')}</b><span>{t('Your sentence about the first trip after it')}</span></li>
      </ul>
    </section>
  </aside>
</div>

{#if dialog}
  <RigLogDialog entry={dialog.entry} onsave={save} ondelete={remove} onclose={() => (dialog = null)} />
{/if}

<style>
  .hint {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 16px;
  }
  .chip {
    min-height: 40px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .cols {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }
  .tl {
    position: relative;
    padding-left: 26px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }
  .tl::before {
    content: '';
    position: absolute;
    left: 8px;
    top: 10px;
    bottom: 10px;
    width: 2px;
    background: var(--line);
  }
  .te {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .te::before {
    content: '';
    position: absolute;
    left: -24px;
    top: 22px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--ink-2);
    box-shadow: 0 0 0 3px var(--ground);
  }
  .top {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .tag {
    font-size: var(--fs-tiny);
    font-weight: 600;
    background: var(--paper-2);
    border-radius: 6px;
    padding: 2px 8px;
  }
  .dt {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .top .iconb {
    margin-left: auto;
  }
  .iconb {
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .te h3 {
    margin: 0;
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .ba {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 8px;
    align-items: center;
    color: var(--ink-3);
  }
  .ba span {
    background: var(--paper-2);
    border-radius: 10px;
    padding: 6px 10px;
    color: var(--ink);
    overflow-wrap: break-word;
  }
  .ba small {
    display: block;
    font-size: var(--fs-tiny);
    color: var(--ink-3);
  }
  .why {
    margin: 0;
    font-size: var(--fs-small);
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .facts span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border: 1px solid var(--line);
    border-radius: 99px;
    padding: 3px 10px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .feel {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 0;
    background: var(--ok-soft);
    border-radius: 10px;
    padding: 8px 10px;
    font-size: var(--fs-small);
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }
  .blk {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .bh {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 4px 12px;
  }
  .bh h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .bh p {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    text-align: center;
  }
  .two div {
    background: var(--paper-2);
    border-radius: 12px;
    padding: 8px;
  }
  .two b {
    display: block;
    font-size: var(--fs-sub);
  }
  .two small {
    font-size: var(--fs-tiny);
    color: var(--ink-3);
  }
  .sug {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    background: var(--warn-soft);
    border-radius: 12px;
    padding: 10px 12px;
    font-size: var(--fs-small);
  }
  .sug .t {
    flex: 1;
    min-width: 0;
  }
  .acts {
    white-space: nowrap;
  }
  .whyx {
    display: block;
    margin-top: 6px;
    color: var(--ink-2);
  }
  .lnk {
    border: 0;
    background: none;
    padding: 0;
    min-height: 32px;
    font: inherit;
    font-weight: 600;
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
  }
  .x {
    display: inline-grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .src {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: var(--fs-small);
  }
  .src li {
    display: flex;
    flex-direction: column;
  }
  .src span {
    color: var(--ink-3);
  }
  @media (max-width: 800px) {
    .cols {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
