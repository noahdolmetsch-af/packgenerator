<script>
  /**
   * «Challenges and meditation» in front (Noah 23.11.2026 «1-3a», Leitfaden «Meditation wieder stärker nach vorn, zusammen
   * mit den laufenden Challenges»): ONE quiet line at the bottom of the block «Tick off today». Left the challenge
   * «Outdoors» (only while it runs): minutes today against the goal and «+30 min» with Undo. Right the meditation (always, when
   * the activity exists): days in a row, «still open today» or «done today», and the start button of the card. It reads the same
   * data as the cards further down (OutdoorCard, MedCard) and stores nothing of its own; the big cards stay as the details.
   */
  import { liveQuery } from 'dexie';
  import { TreePine, Flower2, Check, Timer as TimerIcon } from '@lucide/svelte';
  import { db } from '../db.js';
  import { putSetting } from '../flowdb.js';
  import { toast, actName, clockState } from '../flow/ui.svelte.js';
  import { PUSH_KEY } from '../push/schedule.js';
  import { outdoorRemindOn } from '../outdoorpush.js';
  import { resyncPhone } from '../ruhig/store.js';
  import { OUTDOOR_KEY, outdoorOf, standing, addMin, undoMin } from '../outdoor.js';
  import { medQuery, seedMed, flowQuery } from '../flow/data.svelte.js';
  import { flowStates } from '../flow.js';
  import { beginMed, tplStart, medTemplates, lastStart, isMedAct } from '../flow/hobby/medstart.js';
  import { daysGrid, streaks } from '../flowmed.js';
  import { t, tn } from '../i18n.svelte.js';

  let { today } = $props();

  /* the challenge */
  const oq = $derived(
    liveQuery(async () => {
      const [set, push] = await Promise.all([db.settings.get(OUTDOOR_KEY), db.settings.get(PUSH_KEY)]);
      const rec = outdoorOf(set?.value);
      const acts = rec?.from ? await db.activities.where('day').between(rec.from, rec.until, true, true).toArray() : [];
      return { rec, acts, remind: outdoorRemindOn(push?.value) };
    }),
  );
  const od = $derived($oq);
  const live = $derived(od?.rec?.from && !od.rec.closed && !od.rec.stopped ? od.rec : null);
  const st = $derived(live ? standing(live, od.acts, today) : null);
  const running = $derived(st?.phase === 'running' ? st : null);
  const oname = $derived(!live ? '' : live.name === 'Outdoors' ? t('Outdoors') : live.name);
  async function add(n) {
    const next = addMin(live, today, n);
    if (next === live) return;
    const save = async (v) => {
      await putSetting(db, OUTDOOR_KEY, v);
      if (od.remind) resyncPhone();
    };
    await save(next);
    toast(t('+{n} min added for today.', { n }), () => save(undoMin(next, today)));
  }

  /* the meditation */
  const fq = $derived(flowQuery(today));
  const mst = $derived($fq ? (flowStates($fq.acts, $fq.log, today, $fq.tripDays).find((s) => isMedAct(s.act) && !s.act.paused) ?? null) : null);
  const actId = $derived(mst?.act.id ?? 'meditation');
  const mq = $derived(medQuery(actId, today));
  const data = $derived($mq);
  $effect(() => {
    if (mst) seedMed(data, actId);
  });
  const week = $derived(data ? daysGrid(data.log, actId, today, 7) : []);
  const todayMin = $derived(week.at(-1)?.min ?? 0);
  const done = $derived(!!week.at(-1)?.on);
  const str = $derived(data ? streaks(data.log, actId, today) : { now: 0 });
  const ls = $derived(data ? lastStart(data, actId) : null);
  const tpls = $derived(medTemplates(data));
  const main = $derived(ls ? ls.start : tpls[0] ? tplStart(tpls[0]) : null);
  const start = $derived(main ? (done ? { ...main, minutes: 10 } : main) : null);
  const clock = $derived(!!clockState.tm);
  const showMed = $derived(!!mst && !!data);
</script>

{#if running || showMed}
  <div class="cl" data-challenge-line>
    {#if running}
      <div class="row" data-cl-outdoor>
        <span class="ic" aria-hidden="true"><TreePine size={18} /></span>
        <span class="tx">
          <b>{oname}</b>
          <small>
            {#if running.today.done}<Check size={14} strokeWidth={3} aria-hidden="true" /> {t('Done today: {min} of {goal} min', { min: running.today.total, goal: live.goalMin })}
            {:else}{t('{min} of {goal} min today', { min: running.today.total, goal: live.goalMin })}{/if}
          </small>
        </span>
        {#if !running.today.done}<button type="button" class="btn sm go" onclick={() => add(30)} data-cl-add="30">{t('+{n} min', { n: 30 })}</button>{/if}
      </div>
    {/if}
    {#if showMed}
      <div class="row" data-cl-med>
        <span class="ic" aria-hidden="true"><Flower2 size={18} /></span>
        <span class="tx">
          <a href="#/flow/act/{encodeURIComponent(actId)}"><b>{actName(mst.act)}</b></a>
          <small>
            {done ? t('done today ✓ · {n} min', { n: todayMin }) : t('still open today')}{#if str.now}{' · '}{tn(str.now, '{n} day in a row', '{n} days in a row')}{/if}
          </small>
        </span>
        {#if start}
          <button type="button" class="btn sm go" class:hi={!done} onclick={() => beginMed(actId, data, start)} data-cl-med-start>
            <TimerIcon size={14} aria-hidden="true" />
            {#if clock}{t('Open the running session')}{:else if done}{t('Again · {n} min', { n: start.minutes })}{:else}{t('Start now · {n} min', { n: start.minutes })}{/if}
          </button>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .cl {
    display: grid;
    gap: 6px;
    min-width: 0;
    padding-top: 12px;
    border-top: 1px solid var(--card-line);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    min-width: 0;
  }
  .ic {
    flex: none;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: var(--accent);
    color: var(--paper);
  }
  .tx {
    flex: 1 1 10rem;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .tx b,
  .tx a {
    color: var(--ink);
    text-decoration: none;
    font: 650 var(--fs-body)/1.25 var(--font-body);
  }
  .tx a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    margin: -10px 0 -8px;
  }
  .tx small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .go {
    margin-left: auto;
  }
</style>
