<script>
  /**
   * Paket M «Aus Touren lernen» · «Quiz am Vorabend» (wish #207, Noah 19.10.2026), #/quiz and #/quiz/<tripId>:
   * three questions about the gear and the route of the next trip (or the chosen one), with the streak
   * («Serie: 4 Touren») and the last results. Everything is a suggestion: the quiz can be switched off, own
   * questions are added, changed, ordered (arrows and drag), switched off and deleted, and each kind of
   * suggested question can be hidden. The evening before a trip a small card on «Gepackt» leads here.
   * Rules: lib/lernen/quiz.js; stored in db.settings 'quiz'.
   */
  import { liveQuery } from 'dexie';
  import { Plus, Pencil, Trash2, Pin, Flame, Brain } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import PageHead from '../lib/ui/PageHead.svelte';
  import Skeleton from '../lib/ui/Skeleton.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import SortArrows from '../lib/ui/SortArrows.svelte';
  import SortGrip from '../lib/ui/SortGrip.svelte';
  import { sortable } from '../lib/ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../lib/ui/ask.js';
  import QuizCard from '../lib/lernen/QuizCard.svelte';
  import QuizOwnSheet from '../lib/lernen/QuizOwnSheet.svelte';
  import { QUIZ_KEY, TYPES, quizOf, buildQuiz, quizTrip, counts, logResult, todayResult, streak, lastResults, putOwn, newOwn, dropOwn, patchOwn, moveOwn, setType } from '../lib/lernen/quiz.js';
  import { homeTrips } from '../lib/home/heute.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import '../lib/review/review.css';
  import '../lib/trip/trip.css';

  let { tripId = '' } = $props();
  const today = localDay();

  const q = liveQuery(async () => {
    const [trips, items, containers, bikes, rec] = await Promise.all([db.trips.toArray(), db.items.toArray(), db.containers.toArray(), db.bikes.toArray(), db.settings.get(QUIZ_KEY)]);
    return { trips: homeTrips(trips), items, containers, bikes, value: rec?.value ?? null };
  });
  const data = $derived($q);
  const cfg = $derived(quizOf(data?.value));
  const upcoming = $derived((data?.trips ?? []).filter((x) => x.startDate && x.startDate >= today && !x.skipped && !x.idea).sort((a, b) => a.startDate.localeCompare(b.startDate)));
  const trip = $derived(data ? (tripId ? data.trips.find((x) => x.id === tripId) ?? null : quizTrip(data.trips, today)) : null);
  // the questions are drawn once per visit and trip (a change in the list below does not swap them mid-quiz)
  let drawn = $state(null);
  $effect(() => {
    if (!data || !trip) return;
    if (drawn?.tripId === trip.id) return;
    drawn = { tripId: trip.id, counts: counts(cfg.log, trip, today), list: buildQuiz($state.snapshot(trip), { items: data.items, containers: data.containers, bikes: data.bikes, trips: data.trips }, cfg, today) };
  });
  const done = $derived(todayResult(cfg.log, today));
  const streakN = $derived(data ? streak(data.trips, cfg.log, today) : 0);
  const results = $derived(data ? lastResults(data.trips, cfg.log, 5) : []);
  const day = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });

  async function save(next) {
    await db.settings.put({ key: QUIZ_KEY, value: $state.snapshot(next) });
  }
  const setOn = (on) => save({ ...cfg, on });
  async function finish({ counts: c, ...r }) {
    if (c) await save(logResult(cfg, { trip: $state.snapshot(trip), today, ...r }));
  }
  function pickTrip(id) {
    location.hash = id ? `#/quiz/${encodeURIComponent(id)}` : '#/quiz';
  }

  /* own questions */
  let sheet = $state(null); // { question } | null
  async function saveOwn(x) {
    await save(putOwn(cfg, x.id ? x : newOwn(x)));
  }
  async function removeOwn(o) {
    if ((await askDelete({ title: t('Delete «{name}»?', { name: o.text }), text: t('The question leaves the quiz. You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    const at = cfg.own.findIndex((x) => x.id === o.id);
    await deleteWithUndo({
      run: async () => (await save(dropOwn(cfg, o.id)), { o: $state.snapshot(o), at }),
      undo: async ({ o: back, at: i }) => {
        const c = quizOf((await db.settings.get(QUIZ_KEY))?.value);
        const own = [...c.own];
        own.splice(Math.min(i, own.length), 0, back);
        await save({ ...c, own });
      },
      text: t('«{name}» deleted.', { name: o.text }),
      name: o.text,
    });
  }
  const move = (from, to) => save(moveOwn(cfg, from, to));
</script>

<div class="rv-page qz">
  <PageHead title={t('Quiz the evening before')} text={t('Three questions about the gear and the route of your next trip, from your own data. The evening before a trip it waits on «Packed». Only for fun: you can switch it off.')} />

  {#if !data}
    <Skeleton rows={3} />
  {:else}
    <label class="rv-box onrow">
      <span class="rv-m"><b class="rv-t">{t('Quiz the evening before')}</b><small class="rv-s">{cfg.on ? t('On: the evening before a trip it shows on «Packed».') : t('Off: no card the evening before. You can still play here.')}</small></span>
      <input type="checkbox" role="switch" checked={cfg.on} onchange={(e) => setOn(e.currentTarget.checked)} data-quiz-on />
    </label>

    <div class="rv-lay">
      <div class="rv-col">
        <section class="rv-sec" aria-labelledby="qz-now">
          <div class="rv-h"><div><h2 id="qz-now">{trip ? t('Quiz for {trip}', { trip: trip.title }) : t('Quiz')}</h2>{#if trip?.startDate}<p class="rv-sub num">{day(trip.startDate)}{#if done && done.tripId === trip.id}{' · '}{t('done today: {n} of {m} right', { n: done.right, m: done.of })}{/if}</p>{/if}</div></div>
          {#if upcoming.length > 1 || (trip && !upcoming.some((x) => x.id === trip.id))}
            <label class="pick"><span class="tp-muted tp-small">{t('Trip|quiz')}</span>
              <select class="inp" value={trip?.id ?? ''} onchange={(e) => pickTrip(e.currentTarget.value)} data-quiz-trip>
                {#if trip && !upcoming.some((x) => x.id === trip.id)}<option value={trip.id}>{trip.title}</option>{/if}
                {#each upcoming as x (x.id)}<option value={x.id}>{x.title} · {day(x.startDate)}</option>{/each}
              </select>
            </label>
          {/if}
          {#if !trip}
            <Empty icon={Brain} text={t('No trip ahead. Plan one, and its quiz is here.')} action={{ label: t('To the trips'), href: '#/trips' }} />
          {:else if drawn?.tripId === trip.id}
            {#key drawn}
              <QuizCard questions={drawn.list} {streakN} counted={drawn.counts} onfinish={finish} />
            {/key}
          {/if}
        </section>

        <section class="rv-sec" aria-labelledby="qz-own">
          <div class="rv-h"><div><h2 id="qz-own">{t('Your questions|quiz')}</h2><p class="rv-sub">{t('They take part in the draw; «Always ask» puts one into every quiz. Order with the arrows or by dragging.')}</p></div></div>
          {#if cfg.own.length}
            <ul class="rv-box own" use:sortable={{ onmove: move }} data-quiz-own>
              {#each cfg.own as o, i (o.id)}
                <li class="orow" data-sort-id={o.id} data-own-id={o.id}>
                  <SortGrip name={o.text} onstep={(d) => move(i, i + d)} />
                  <span class="rv-m"><span class="rv-t" class:off={!o.on}>{o.text}</span><small class="rv-s">{o.wrong.length ? tn(o.wrong.length + 1, '{n} answer', '{n} answers') : t('Know it? card')}{#if o.pin}{' · '}{t('always asked')}{/if}</small></span>
                  <button type="button" class="tp-icon-btn ib" aria-pressed={o.pin} aria-label={t('Always ask «{name}»', { name: o.text })} onclick={() => save(patchOwn(cfg, o.id, { pin: !o.pin }))} data-own-pin><Pin size={16} aria-hidden="true" /></button>
                  <input type="checkbox" role="switch" checked={o.on} aria-label={t('Ask «{name}»', { name: o.text })} onchange={(e) => save(patchOwn(cfg, o.id, { on: e.currentTarget.checked }))} data-own-on />
                  <button type="button" class="tp-icon-btn ib" aria-label={t('Change «{name}»', { name: o.text })} onclick={() => (sheet = { question: $state.snapshot(o) })} data-own-edit><Pencil size={16} aria-hidden="true" /></button>
                  <button type="button" class="tp-icon-btn ib" aria-label={t('Delete «{name}»', { name: o.text })} onclick={() => removeOwn(o)} data-own-delete><Trash2 size={16} aria-hidden="true" /></button>
                  <SortArrows name={o.text} {i} n={cfg.own.length} onstep={(d) => move(i, i + d)} />
                </li>
              {/each}
            </ul>
          {:else}
            <p class="tp-muted tp-small">{t('No questions of your own yet. Something you always forget? Ask yourself.')}</p>
          {/if}
          <button type="button" class="btn addq" onclick={() => (sheet = { question: null })} data-quiz-add><Plus size={16} aria-hidden="true" />{t('Add a question')}</button>
        </section>
      </div>

      <div class="rv-col">
        <section class="rv-sec" aria-labelledby="qz-streak">
          <div class="rv-h"><div><h2 id="qz-streak">{t('Streak and results')}</h2><p class="rv-sub">{t('A trip counts when you did its quiz before it, once a day.')}</p></div></div>
          <div class="rv-box pad streakbox">
            <p class="sk num" data-quiz-streak={streakN}><Flame size={20} aria-hidden="true" /><b>{tn(streakN, 'Streak: {n} trip', 'Streak: {n} trips')}</b></p>
            {#if results.length}
              <ul class="res">
                {#each results as r (r.day + r.tripId)}<li class="num"><span>{day(r.day)} · {r.title}</span><b>{t('{n} of {m}', { n: r.right, m: r.of })}</b></li>{/each}
              </ul>
            {:else}<p class="tp-muted tp-small">{t('No results yet.')}</p>{/if}
          </div>
        </section>

        <section class="rv-sec" aria-labelledby="qz-types">
          <div class="rv-h"><div><h2 id="qz-types">{t('Suggested questions')}</h2><p class="rv-sub">{t('Hide a kind you do not want to be asked.')}</p></div></div>
          <ul class="rv-box">
            {#each TYPES as x (x.key)}
              <li><label class="rv-row"><span class="rv-m"><span class="rv-t">{t(x.name)}</span></span><input type="checkbox" role="switch" checked={!cfg.offTypes.includes(x.key)} onchange={(e) => save(setType(cfg, x.key, e.currentTarget.checked))} data-quiz-type={x.key} /></label></li>
            {/each}
          </ul>
        </section>
      </div>
    </div>
  {/if}
</div>

{#if sheet}
  <QuizOwnSheet question={sheet.question} onsave={saveOwn} onclose={() => (sheet = null)} />
{/if}

<style>
  .qz :global(.pagehead) {
    margin-bottom: 14px;
  }
  .onrow {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 60px;
    margin: 0 0 22px;
    cursor: pointer;
  }
  .pick {
    display: grid;
    gap: 4px;
    margin: 0 0 12px;
    min-width: 0;
  }
  .pick .inp {
    min-height: 44px;
    max-width: 100%;
  }
  .orow {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 60px;
    padding: 6px 0;
    min-width: 0;
    background: var(--paper);
  }
  .rv-t.off {
    color: var(--ink-3);
  }
  .ib {
    flex: none;
    width: 40px;
    height: 44px;
  }
  .ib[aria-pressed='true'] {
    color: var(--hi);
  }
  .addq {
    margin-top: 10px;
  }
  .streakbox {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .sk {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: var(--fs-sub);
  }
  .res {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--fs-small);
  }
  .res li {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    min-width: 0;
  }
  .res span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--ink-2);
  }
  @media (max-width: 719px) {
    .orow {
      flex-wrap: wrap;
    }
    .orow .rv-m {
      flex: 1 1 calc(100% - 60px);
    }
  }
  /* the app's switch (as on «Gepackt», Between.svelte) */
  .qz :global(input[role='switch']) {
    flex: none;
    width: 52px;
    height: 30px;
    margin: 0;
    appearance: none;
    border-radius: 99px;
    background: var(--line-strong);
    position: relative;
    cursor: pointer;
  }
  .qz :global(input[role='switch']::after) {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--paper);
    transition: transform 0.15s;
  }
  .qz :global(input[role='switch']:checked) {
    background: var(--accent);
  }
  .qz :global(input[role='switch']:checked::after) {
    transform: translateX(22px);
  }
  .qz :global(input[role='switch']:focus-visible) {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
</style>
