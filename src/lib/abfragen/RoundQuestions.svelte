<script>
  /**
   * Noah 04.11.2026 «ein Fragebogen» (Tagescheck, «2a»): the questions of a round on its page (Morning check / Evening review)
   * are the same as in the window «Morgen-Check / Abend-Check»: the questions of «Deine Abfragen» that have a time today in this
   * round. Today's answer is filled in (from the window, from the page or from the old daily check) and every tap is saved at
   * once (the page's way); the window then no longer asks what was answered. «Skip» puts the question away for today, in the
   * window too. Fitbit's night stays in its card at the side of the page.
   * Noah 23.11.2026 «Beides»: in the morning the random question (a random one of the switched-off sample questions, the window's
   * too) always stands in the list, and a closed line «More questions» offers every other question for one answer, switched on or not.
   */
  import { abQuery, ensureConfig, saveAnswers, saveSnooze, saveDataCfg } from '../abdb.js';
  import { roundQuestions, moreQuestions, allQuestions, configOf, answerRow, fromChecks, skipToday, stampOf, settingOf, dayOf, lastAnswer } from '../abfragen.js';
  import { pageRandom, neverAgain } from '../datenfragen.js';
  import { db } from '../db.js';
  import { t, tn } from '../i18n.svelte.js';
  import AnswerInput from './AnswerInput.svelte';
  import { qText, areaName, everyShort } from './words.js';
  import './ab.css';

  // prefill: { qid: raw answer } found by itself (a ride, a meditation), filled in where nothing is answered today, saved like a tap
  // hints: { qid: text } says where it comes from while it stands unchanged
  let { part = 'morning', today, prefill = {}, hints = {} } = $props();
  const query = $derived(abQuery(today));
  const data = $derived($query);
  $effect(() => {
    if (data && !data.stored) ensureConfig(stampOf());
  });

  // the random question: the random one of the switched-off sample questions (the window's too), in the morning only
  const pool = $derived(data?.stored ? allQuestions(data.cfg).filter((x) => x.sample && !x.own && !settingOf(data.cfg, x).on) : []);
  const pick = $derived(data?.stored && part === 'morning' ? pageRandom(pool, data.answers, data.dataCfg, today) : null);
  const list = $derived(
    data?.stored ? [...roundQuestions(data.cfg, part, today), ...(pick ? [{ q: pick, slot: `${today}T${configOf(data.cfg).rounds.morning}`, random: true }] : [])] : [],
  );
  // «More questions»: closed at first; eight at a time
  const STEP = 8;
  let moreOpen = $state(false);
  let moreN = $state(STEP);
  const more = $derived(data?.stored ? moreQuestions(data.cfg, part, today, pick ? [pick.id] : []) : []);
  const moreShown = $derived(moreOpen ? more.slice(0, moreN) : []);
  const skippedKey = `${today}T23:59`;
  const isSkipped = (qid) => data?.snooze?.[qid] === skippedKey;
  const shown = $derived(list.filter((d) => !isSkipped(d.q.id)));
  const skippedN = $derived(list.length - shown.length);

  // today's answers: the rows of the window and of this page, and the old daily check (sleep, battery, mood)
  const todays = $derived(data ? [...fromChecks(data.checks), ...data.answers].filter((r) => r.day === today) : []);
  const rowOf = (qid) => lastAnswer(todays, qid);
  // a row of the new answers (the page takes its id, so a changed answer replaces it and does not pile up)
  const ownRow = (qid) => (data?.answers ?? []).filter((r) => r.day === today && r.qid === qid).sort((a, b) => String(b.at ?? '').localeCompare(String(a.at ?? '')))[0] ?? null;

  let draft = $state({});
  let notes = $state({});
  let ready = $state({});
  let auto = $state({});
  let saved = {};
  const sigOf = (qid) => JSON.stringify([draft[qid] ?? null, String(notes[qid] ?? '').trim()]);
  // fill in what is answered today, once per question
  $effect(() => {
    if (!data) return;
    for (const d of [...list, ...moreShown]) {
      const id = d.q.id;
      if (ready[id]) continue;
      const r = rowOf(id);
      if (r?.value != null) draft[id] = r.value;
      if (r?.note) notes[id] = r.note;
      saved[id] = sigOf(id);
      if (!r && prefill[id] != null) {
        draft[id] = prefill[id];
        auto[id] = true;
      }
      ready[id] = true;
    }
  });

  let timer;
  $effect(() => {
    // the dependencies: every draft and note of the shown questions
    shown.forEach((d) => sigOf(d.q.id));
    moreShown.forEach((d) => sigOf(d.q.id));
    clearTimeout(timer);
    timer = setTimeout(flush, 450);
    return () => clearTimeout(timer);
  });
  // leaving the page (Done, back, a link) saves what the last tap changed
  $effect(() => () => {
    clearTimeout(timer);
    flush();
  });
  async function flush() {
    const rows = [];
    const hold = []; // answered under «More questions» and switched on at another time: the window does not ask again today
    for (const d of [...shown, ...moreShown]) {
      const id = d.q.id;
      if (!ready[id]) continue;
      const sig = sigOf(id);
      if (sig === saved[id]) continue;
      saved[id] = sig;
      const own = ownRow(id);
      const row = answerRow(d.q, draft[id], { at: stampOf(), day: today, slot: d.slot, note: notes[id] });
      if (row) {
        rows.push(own ? { ...row, id: own.id } : row);
        if (d.on) hold.push(id);
      } else if (own) await db.abAnswers.delete(own.id); // taken back with a second tap
    }
    if (rows.length) await saveAnswers(rows);
    if (hold.length) await saveSnooze({ ...(data?.snooze ?? {}), ...Object.fromEntries(hold.map((id) => [id, `${today}T23:58`])) });
  }

  const skip = (d) => {
    delete draft[d.q.id];
    delete notes[d.q.id];
    return saveSnooze(skipToday(data?.snooze, d.q.id, `${today}T12:00`));
  };
  // «Never again» (the random question): it is not picked any more, and no other one comes today (like in the window)
  const never = (d) => {
    delete draft[d.q.id];
    delete notes[d.q.id];
    return saveDataCfg(neverAgain(data?.dataCfg, d.q.id, today));
  };
  const skipBack = () => {
    const next = { ...(data?.snooze ?? {}) };
    for (const d of list) if (next[d.q.id] === skippedKey) delete next[d.q.id];
    return saveSnooze(next);
  };

  // yesterday's answer marked quietly
  const yday = $derived(((d) => (d.setUTCDate(d.getUTCDate() - 1), d.toISOString().slice(0, 10)))(new Date(`${today}T12:00:00Z`)));
  const yesterdayOf = (qid) => lastAnswer([...(data ? fromChecks(data.checks) : []), ...(data?.answers ?? [])].filter((a) => a.day === yday), qid)?.value ?? null;
</script>

{#if data?.stored}
  <div class="rq" data-round-questions={part}>
    {#each shown as d, i (d.q.id)}
      {@const qid = `rq-${part}-${i}`}
      <div class="dq" data-q={d.q.id}>
        <div class="dqh">
          <b id={qid}>{qText(d.q)}</b>
          <span class="meta">
            {#if d.q.own}{everyShort(settingOf(data.cfg, d.q).every)}{:else}{areaName(d.q.area, data.cfg)}{/if}
            {#if d.random}· <span data-random>{t('a random question')}</span><button type="button" class="skip" onclick={() => never(d)} data-never>{t('Never again|question')}</button>{/if}
            <button type="button" class="skip" onclick={() => skip(d)} aria-label={t('Skip «{q}»', { q: qText(d.q) })} data-ab-skip>{t('Skip|question')}</button>
          </span>
        </div>
        <AnswerInput q={d.q} bind:value={draft[d.q.id]} bind:note={notes[d.q.id]} id="{qid}-in" label={qText(d.q)} quick last={yesterdayOf(d.q.id)} />
        {#if auto[d.q.id] && hints[d.q.id] && draft[d.q.id] === prefill[d.q.id]}<small class="hint" data-auto={d.q.id}>{hints[d.q.id]}</small>{/if}
      </div>
    {/each}
    {#if skippedN}
      <button type="button" class="lk" onclick={skipBack} data-skip-back>{tn(skippedN, 'Show {n} skipped question again', 'Show {n} skipped questions again')}</button>
    {/if}
    {#if more.length}
      <div class="more" data-more-questions={part}>
        <button type="button" class="lk" aria-expanded={moreOpen} onclick={() => (moreOpen = !moreOpen)} data-more-toggle>{t('More questions')}<span class="num cnt">{more.length}</span></button>
        {#if moreOpen}
          <small class="hint">{t('Answer any of them once. This does not switch the question on.')}</small>
          {#each moreShown as d, i (d.q.id)}
            {@const qid = `rq-${part}-m${i}`}
            <div class="dq" data-q={d.q.id} data-more-q>
              <div class="dqh">
                <b id={qid}>{qText(d.q)}</b>
                <span class="meta">{#if d.q.own}{everyShort(settingOf(data.cfg, d.q).every)}{:else}{areaName(d.q.area, data.cfg)}{/if}{#if !d.on}<span>· {t('switched off|question')}</span>{/if}</span>
              </div>
              <AnswerInput q={d.q} bind:value={draft[d.q.id]} bind:note={notes[d.q.id]} id="{qid}-in" label={qText(d.q)} quick last={yesterdayOf(d.q.id)} />
            </div>
          {/each}
          {#if more.length > moreN}
            <button type="button" class="lk" onclick={() => (moreN += STEP)} data-more-next>{tn(more.length - moreN, 'Show {n} more question', 'Show {n} more questions')}</button>
          {/if}
        {/if}
      </div>
    {/if}
    <a class="lk" href="#/me/abfragen" data-ab-adjust>{t('Adjust your questions')}</a>
  </div>
{/if}

<style>
  .rq {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .dq {
    padding-top: 12px;
    border-top: 1px solid var(--line);
    min-width: 0;
  }
  .dq:first-child {
    padding-top: 0;
    border-top: 0;
  }
  .dqh {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 4px 10px;
    margin-bottom: 8px;
  }
  .dqh b {
    flex: 1 1 260px;
    min-width: 0;
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .meta {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .skip {
    position: relative;
    padding: 0 2px;
    border: 0;
    background: none;
    color: var(--ink-3);
    font: 400 var(--fs-tiny) / 1.2 var(--font-body);
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }
  .skip::after {
    content: '';
    position: absolute;
    inset: -14px -8px;
  }
  .skip:hover {
    color: var(--ink-2);
  }
  .hint {
    display: block;
    margin-top: 6px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .more {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .cnt {
    margin-left: 6px;
    color: var(--ink-3);
    font-weight: 400;
  }
  .lk {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }
</style>
