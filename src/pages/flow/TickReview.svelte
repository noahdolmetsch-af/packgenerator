<script>
  /**
   * «Auswertung wie Training» (Noah 20.10.2026 21:22 «das ist ab jetzt unser standard», 21:24 «zum auswerten von
   * meinen täglich abgehakten aktivitäten»): Aktiv › Ziele › Auswerten, #/flow/auswertung?act=<id>&p=30|90|365.
   * Built like the ride page Aktiv › Training › Fahrt: the title with a grey line, the key tiles on top, then
   * «Analysen» with the same cards, «…» and «Analysen anpassen» (group 'ticks'). All activities or one, the last
   * 30 days, 90 days or the year. Meditation counts like every other tick. Observation only. Loaded only when opened.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../../lib/db.js';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import PageHead from '../../lib/ui/PageHead.svelte';
  import Seg from '../../lib/ui/Seg.svelte';
  import Empty from '../../lib/ui/Empty.svelte';
  import AnaSheet from '../../lib/training/AnaSheet.svelte';
  import TickAnalyses from '../../lib/flow/auswertung/TickAnalyses.svelte';
  import AnswerAnalyses from '../../lib/flow/auswertung/AnswerAnalyses.svelte';
  import { historyQuery } from '../../lib/abdb.js';
  import { QUESTION, configOf } from '../../lib/abfragen.js';
  import { qText } from '../../lib/abfragen/words.js';
  import { normAct, entriesFor, tripDays } from '../../lib/flow.js';
  import { homeTrips } from '../../lib/home/heute.js';
  // Klick-Rundgang A05: the same names as the tiles in Aktiv (actName), not the nicknames of flowtiles.js
  import { actName as tileName } from '../../lib/flow/ui.svelte.js';
  import { PERIODS, fromOf, tilesOf, valueQuestions, valuesOf, valueTiles } from '../../lib/flow/auswertung.js';
  import { t, tn, num } from '../../lib/i18n.svelte.js';
  import { localDay } from '../../lib/localday.js';

  let { params = new URLSearchParams() } = $props();
  const today = localDay();

  const q = liveQuery(async () => {
    const [acts, log, trips] = await Promise.all([db.flowActs.toArray(), db.flowLog.toArray(), db.trips.toArray()]);
    return { acts: acts.map(normAct).sort((a, b) => a.order - b.order), log, days: tripDays(homeTrips(trips), today) };
  });
  const data = $derived($q);

  // «Deine Antworten»: the same page for the answers of the Check-Fragen with a number
  const histQ = historyQuery();
  const hist = $derived($histQ);
  const own = $derived(configOf(hist?.cfg).own);
  const qs = $derived(valueQuestions(hist?.rows ?? []).map((x) => ({ ...x, q: QUESTION[x.qid] ?? own.find((o) => o.id === x.qid) ?? null })).filter((x) => x.q));
  let what = $state(params.get('q') ? 'answers' : 'ticks');
  let qid = $state(params.get('q') ?? '');
  const qNow = $derived(qs.find((x) => x.qid === qid) ?? qs[0] ?? null);
  const vals = $derived(qNow ? valuesOf(hist.rows, qNow.qid) : []);

  let actId = $state(params.get('act') ?? '');
  let period = $state(PERIODS.includes(Number(params.get('p'))) ? Number(params.get('p')) : 90);
  // the choice stays in the address, so «Zurück» and a reload come back to it
  $effect(() => {
    const s = new URLSearchParams();
    if (what === 'answers') {
      if (qNow) s.set('q', qNow.qid);
    } else if (actId) s.set('act', actId);
    if (period !== 90) s.set('p', String(period));
    const qs = s.toString();
    try {
      history.replaceState(history.state, '', `${location.pathname}${location.search}#/flow/auswertung${qs ? `?${qs}` : ''}`);
    } catch {
      /* a test page without history */
    }
  });

  const acts = $derived(data?.acts ?? []);
  const act = $derived(acts.find((a) => a.id === actId) ?? null);
  const byId = $derived(new Map(acts.map((a) => [a.id, a])));
  // one activity: what counts for it (also trips and «zählt auch»); all: every tick of an activity that still exists
  const list = $derived(!data ? [] : act ? entriesFor(act, data.log, data.days) : data.log.filter((e) => byId.has(e.actId)));
  const from = $derived(fromOf(today, period));
  const k = $derived(tilesOf(list, from, today, today));
  const d = $derived({
    list,
    from,
    to: today,
    today,
    ids: acts.map((a) => a.id),
    ringOf: (id) => byId.get(id)?.ring ?? 'move',
    nameOf: (id) => tileName(byId.get(id)) || id,
  });
  const vk = $derived(valueTiles(vals, from, today));
  const dv = $derived({ vals, from, to: today, scale: qNow?.q?.form?.kind === 'scale' });
  const unit = $derived(qNow?.q?.form?.unit ? ` ${qNow.q.form.unit}` : '');
  const PERIOD_NAMES = { 30: '30 days|tk', 90: '90 days|tk', 365: 'Year|tk' };
  const periodOpts = $derived(PERIODS.map((p) => ({ key: String(p), name: t(PERIOD_NAMES[p]) })));
</script>

<div class="ta">
  <header class="ph">
    <Crumb path={[{ href: '#/flow', label: t('Active|place') }, { href: '#/flow/goals', label: t('Activities|flow') }]} here={t('Evaluate|tk')} />
    <PageHead title={what === 'answers' ? t('Your answers evaluated') : t('Your ticks evaluated')} sub={what === 'answers' ? t('your answers to the check questions · only to look at, nothing is rated') : t('everything you tick off · only to look at, nothing is rated')} />
  </header>

  {#if data === undefined}
    <p class="hint" role="status">{t('Loading …')}</p>
  {:else if !data.log.length && !qs.length}
    <Empty text={t('Nothing ticked yet. Tick an activity under «Heute abhaken», then it shows here.')} action={{ label: t('Tick off today|tk'), href: '#/flow' }} />
  {:else}
    <div class="pick card">
      {#if qs.length}
        <div class="pr">
          <span class="pl" id="tk-what">{t('What|tk')}</span>
          <Seg options={[{ key: 'ticks', name: t('Your ticks') }, { key: 'answers', name: t('Your answers') }]} value={what} onchange={(v) => (what = v)} labelledby="tk-what" full={false} />
        </div>
      {/if}
      <div class="pr">
        <span class="pl" id="tk-period">{t('Period|tk')}</span>
        <Seg options={periodOpts} value={String(period)} onchange={(v) => (period = Number(v))} labelledby="tk-period" full={false} />
      </div>
      {#if what === 'answers' && qNow}
        <label class="pr">
          <span class="pl">{t('Question|tk')}</span>
          <select class="inp" value={qNow.qid} onchange={(e) => (qid = e.currentTarget.value)} data-tk-q>
            {#each qs as x (x.qid)}<option value={x.qid}>{qText(x.q)}</option>{/each}
          </select>
        </label>
      {:else}
        <label class="pr">
          <span class="pl">{t('Activity|tk')}</span>
          <select class="inp" bind:value={actId} data-tk-act>
            <option value="">{t('All activities|tk')}</option>
            {#each acts as a (a.id)}<option value={a.id}>{tileName(a)}</option>{/each}
          </select>
        </label>
      {/if}
    </div>
  {/if}

  {#if data && (data.log.length || qs.length) && what === 'answers' && qNow}
    <div class="card vals num" data-section="values">
      <span data-val="n"><b>{num(vk.n)}</b><small>{t('Answers')}</small></span>
      <span data-val="days"><b>{num(vk.days)}</b><small>{t('Days|tk')}</small></span>
      <span data-val="mean"><b>{vk.mean == null ? '–' : `${num(vk.mean)}${unit}`}</b><small>Ø</small></span>
      <span data-val="min"><b>{vk.min == null ? '–' : `${num(vk.min)}${unit}`}</b><small>{t('Lowest|an')}</small></span>
      <span data-val="max"><b>{vk.max == null ? '–' : `${num(vk.max)}${unit}`}</b><small>{t('Highest|an')}</small></span>
      {#if vk.last}<span data-val="last"><b>{num(vk.last.v)}{unit}</b><small>{t('Last answer|tk')}</small></span>{/if}
    </div>
    {#if vk.n}
      <AnswerAnalyses d={dv} />
    {:else}
      <p class="hint" role="status">{t('No answer in this period. Choose a longer period or another question.')}</p>
    {/if}
  {:else if data && (data.log.length || qs.length)}
    <div class="card vals num" data-section="values">
      <span data-val="days"><b>{num(k.days)}</b><small>{t('Days with a tick')}</small></span>
      <span data-val="ticks"><b>{num(k.ticks)}</b><small>{t('Ticks')}</small></span>
      {#if act && act.perTap > 1}<span data-val="amount"><b>{num(k.amount)}</b><small>{t('Amount|tk')}</small></span>{/if}
      <span data-val="week"><b>{num(k.perWeek)}</b><small>{t('Ø per week|tk')}</small></span>
      {#if k.min > 0}<span data-val="min"><b>{t('{n} min', { n: num(k.min) })}</b><small>{t('Minutes|tk')}</small></span>{/if}
      <span data-val="longest"><b>{tn(k.longest, '{n} day', '{n} days')}</b><small>{t('Longest run|tk')}</small></span>
      <span data-val="current"><b>{tn(k.current, '{n} day', '{n} days')}</b><small>{t('Current run|tk')}</small></span>
      {#if !act}<span data-val="acts"><b>{num(k.acts)}</b><small>{t('Activities|tk')}</small></span>{/if}
    </div>
    <p class="hint">{t('A run counts the days in a row with at least one tick; today still counts when it is not ticked yet.')}</p>

    {#if k.ticks}
      <TickAnalyses {d} />
    {:else}
      <p class="hint" role="status">{t('No tick in this period. Choose a longer period or another activity.')}</p>
    {/if}
  {/if}
</div>
<AnaSheet />

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
  .pick {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 24px;
    padding: 14px 16px;
  }
  .pr {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .pl {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .pick select {
    min-width: 220px;
    max-width: 100%;
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
  .hint {
    margin: -8px 2px 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
