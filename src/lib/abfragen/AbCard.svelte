<script>
  /**
   * AB3 «Deine Abfragen» on Heute (Noah 14.10.2026 «freigabe»; replaces SN2l, the weekly weight
   * question): a calm card under the greeting with what is due now. One tap per question, everything
   * can be skipped; «Speichern» puts the answers into the history under Daten, «Jetzt nicht» hides the
   * card until the next question time, «Anpassen» leads to Ich › Deine Abfragen.
   * The weight is the same as the body weight under Ich › Meine Daten (abdb.js saveAnswers).
   *
   * Noah 19.10.2026 «Tagescheck und Abendcheck als eigene Maske»: Heute no longer starts with the open
   * questions. They come as their own window (Morgen-Check / Abend-Check) with «Später» (the window comes
   * back in one hour), «Heute nicht» (put away until the next question time, as «Jetzt nicht» before) and
   * «Speichern». ✕, Escape and back count as «Später». The full page of the round is one tap away.
   *
   * Noah 24.11.2026 «Wi gaht's? am Abend» (screenshot: cut off, three questions at once, opens by itself): the window opens only
   * when asked («Start» on Heute, no longer by itself: Heute starts with its content, the calm card says what waits); one question per
   * screen with «Weiter» («Zurück», «Speichern» on the last); head and foot stay, only the middle scrolls, and a soft shadow says that
   * more follows («Nie abgeschnitten»); ✕ and Escape just close it (the card stays), «Heute nicht» puts the questions away until
   * tomorrow; in the evening the questions of the morning stay away (notMorningAtNight).
   */
  import { ClipboardList, X, ChevronRight } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { connQuery, abQuery, hintQuery, ensureConfig, saveAnswers, saveSnooze, saveDataCfg } from '../abdb.js';
  import { fitbitFill, dueList, snoozeAll, skipToday, quietToday, isQuiet, QUIET_KEY, QUIET_ROUND, answerRow, lastAnswer, stampOf, settingOf, fromChecks, dayOf, configOf, isEveningRound, windowPart, LATER_KEY, fitNow, notMorningAtNight, allQuestions } from '../abfragen.js';
  import { kgOf } from '../review/actdata.js';
  import { dataDue, ruleOn, DATA_QUESTIONS, noteSkip, clearSkips, setGap, neverAgain, FEWER_GAP } from '../datenfragen.js'; // 03.11.2026 «Fragen aus deinen Daten»
  import { t, tn, num as fmt } from '../i18n.svelte.js';
  import AnswerInput from './AnswerInput.svelte';
  import { sourcesOf, groupsFor } from './verbindungen.js';
  import { actLabel as actName } from './words.js';
  import CheckLine from '../wohl/CheckLine.svelte'; // Paket P: ride numbers, recipe, morning tip, a moment from the jar
  import { askText, areaName, timeText, dayShort, srcText, unitText, everyShort } from './words.js';
  import '../bikes/velo-dlg.css';
  import './ab.css';

  // Paket C: busy tells Heute that this window is open or still loading, so the window of windows.js
  // (HomeWindow: Vorabend, Wochenrückblick) waits; the round comes first, never two windows at once.
  // «Heute neu» A (Noah 20.10.2026 «2»): due and evening tell Heute's «Up now» how many questions wait; ask = true
  // (the row's «Start») opens the window again after «Later»
  let { today, busy = $bindable(false), due = $bindable(0), areas = $bindable([]), evening: eveOut = $bindable(false), ask = $bindable(false) } = $props();
  let now = $state(stampOf());
  $effect(() => {
    const id = setInterval(() => (now = stampOf()), 60_000);
    return () => clearInterval(id);
  });
  const query = $derived(abQuery(today));
  const data = $derived($query);
  // «Verbindungen»: what the app knows, offered as one-tap answers of the sentence questions (abfragen/verbindungen.js)
  const connQ = connQuery(today);
  const sources = $derived(sourcesOf($connQ ?? {}, today, { tr: t, actName }));
  const linksOf = (qid) => groupsFor(qid, sources, { tr: t });
  // this morning's goal, quietly above the question that asks if it was reached
  const goalToday = $derived(data ? [...data.answers].filter((r) => r.day === today && r.qid === 'ziele.ziel' && r.value).at(-1)?.value ?? '' : '');
  const hintOf = (qid) => (qid === 'erreicht.ziel' && goalToday ? t('This morning: «{goal}»', { goal: goalToday }) : qid === 'visionen.naeher' && !sources.visions.length ? t('No visions yet. Write one in Notes with the template «Vision».') : '');
  $effect(() => {
    if (data && !data.stored) ensureConfig(now);
  });

  // Noah 14.10. 00:52:22 1a 2a 3b 4ab — 1a: several questions due at once come together in ONE card (as in AB3);
  // 2a: a missed one stays until it is answered or tapped away («Jetzt nicht»). An answer in the old daily
  // check counts too (from the start of its day).
  const answered = $derived(data ? [...data.answers, ...fromChecks(data.checks).map((r) => ({ qid: r.qid, at: `${r.day}T00:00` }))] : []);
  // Klick-Rundgang H15: in the evening a missed evening question asks about today (fitNow)
  // 03.11.2026 «Fragen aus deinen Daten» (Noah «2a»): a question about a value that stands out sits first in the same window, with its reason
  // the guess to test (Noah 04.11.2026): the strongest hint of «What goes together» that fits today. Loaded on first use
  // (the insights code stays out of the start), worked out on this device only, and only while the rule is on.
  let hint = $state(null);
  const guessOn = $derived(!!data?.stored && ruleOn(data.dataCfg, 'vermutung'));
  $effect(() => {
    if (!guessOn) {
      hint = null;
      return;
    }
    let gone = false;
    const sub = hintQuery().subscribe({
      next: async (h) => {
        const [E, W] = await Promise.all([import('../erkenntnisse.js'), import('../erkenntnisse/words.js')]);
        if (gone) return;
        const ownAll = E.ownNumberQuestions(configOf(h.cfg).own);
        const own = E.ownNumberQuestions(ownAll, h.ownOff);
        const series = E.seriesOf({ rows: h.rows, health: h.health, log: h.log, days: E.lastDays(today, E.WINDOW_DAYS + 1), weather: h.weather, events: h.events, own });
        const row = E.testHint(series, today, { own });
        hint = row ? { ...row, sentence: W.sentenceOf(t, fmt, (key) => ownAll.find((q) => `own:${q.id}` === key)?.text ?? '', row) } : null;
      },
      error: () => (hint = null),
    });
    return () => {
      gone = true;
      sub.unsubscribe();
    };
  });
  // the sample questions that are switched off: the pool of the random question
  const pool = $derived(data?.stored ? allQuestions(data.cfg).filter((x) => x.sample && !x.own && !settingOf(data.cfg, x).on) : []);
  const fromData = $derived(data?.stored ? dataDue({ health: data.health, acts: data.acts, sport: data.sport, ticks: data.ticks, wx: data.wx, cal: data.cal, tasks: data.tasks, hint, pool, answers: data.answers, checks: data.checks, snooze: data.snooze, cfg: data.dataCfg, custom: allQuestions(data.cfg).filter((x) => x.rule), today, slot: `${today}T${configOf(data.cfg).rounds.morning}` }) : []);
  // the random question never opens the window on its own: it joins when something else is due, and comes last
  const shown = $derived.by(() => {
    if (!data?.stored) return [];
    const rounds = configOf(data.cfg).rounds;
    const night = (rows) => notMorningAtNight(rows, now, rounds); // in the evening the morning questions stay away (Noah 24.11.2026)
    const rules = night(fromData.filter((d) => !d.random));
    const due = night(fitNow(dueList(data.cfg, answered, now, data.snooze), now));
    const base = [...rules, ...due];
    return base.length ? [...base, ...night(fromData.filter((d) => d.random))] : [];
  });

  let draft = $state({});
  let notes = $state({});
  // 0.171 (Noah 20.10.2026 «Fitbit … das haben wir bereits»): what Fitbit measured on the question's day fills in
  // (changeable); left as it is, the answer is saved with the source Fitbit
  const healthOf = (day) => (data?.health ?? []).find((h) => h.date === day) ?? null;
  const fillOf = (d) => fitbitFill(d.q, healthOf(dayOf(d.slot)));
  let filledBy = $state({});
  $effect(() => {
    for (const d of visible) {
      const f = fillOf(d);
      if (f?.value != null && draft[d.q.id] === undefined && filledBy[d.q.id] === undefined) {
        draft[d.q.id] = f.value;
        filledBy[d.q.id] = f.value;
      }
    }
  });
  const fitText = (h) =>
    h.key === 'sleep' ? t('Fitbit: {h} h {m} min asleep', { h: Math.floor(h.v / 60), m: h.v % 60 }) : h.key === 'rhr' ? t('Fitbit: resting pulse {v}', { v: h.v }) : h.key === 'steps' ? t('Fitbit: {v} steps', { v: h.v }) : t('Fitbit: {v} active zone minutes', { v: h.v });
  const filled = $derived(visible.some((d) => (draft[d.q.id] != null && draft[d.q.id] !== '') || String(notes[d.q.id] ?? '').trim()));
  let saving = $state(false);

  // the weight: the last answer, else the body weight under Ich › Meine Daten
  const lastKg = $derived.by(() => {
    const a = data ? lastAnswer(data.answers, 'koerper.waage') : null;
    if (a) return { kg: a.value, day: a.day };
    const kg = kgOf(data?.weightG);
    return kg ? { kg, day: null } : null;
  });

  async function save() {
    if (saving) return;
    saving = true;
    try {
      const at = stampOf();
      const rows = visible.map((d) => answerRow(d.q, draft[d.q.id], { at, slot: d.slot, note: notes[d.q.id], src: filledBy[d.q.id] !== undefined && draft[d.q.id] === filledBy[d.q.id] ? 'fitbit' : 'hand' })).filter(Boolean);
      const folded = ordered.slice(visible.length);
      await saveAnswers(rows);
      // an answer ends the count of skips of a rule from data (Noah 04.11.2026 «2a»)
      const ruled = rows.map((r) => DATA_QUESTIONS[r.qid]?.rule ?? fromData.find((d) => d.custom && d.q.id === r.qid)?.rule).filter(Boolean);
      if (ruled.length) await saveDataCfg(ruled.reduce((c, id) => clearSkips(c, id), data?.dataCfg ?? null));
      if (folded.length) await saveSnooze(snoozeAll(data?.snooze, folded));
      more = false;
      for (const r of rows) {
        delete draft[r.qid];
        delete notes[r.qid];
      }
    } finally {
      saving = false;
    }
  }
  // Noah 20.10.2026 «eine frage überspringen button, sehr klein und dezent»: this one question is put away
  // for the rest of the day (Noah 21.10.2026: no reminder after a skip); the next waiting question moves up
  function skip(d) {
    delete draft[d.q.id];
    delete notes[d.q.id];
    saveSnooze(skipToday(data?.snooze, d.q.id, now));
    if (d.rule && !d.random) saveDataCfg(noteSkip(data?.dataCfg, d.rule, today));
  }
  // skipped three times: «Yes, less often» asks that rule only every FEWER_GAP days; «No, keep it» ends the count
  const lessOften = (d) => saveDataCfg(clearSkips(setGap(data?.dataCfg, d.rule, FEWER_GAP), d.rule));
  // «Never again» (the random question): this question is not picked any more, and no other random one comes today
  function never(d) {
    delete draft[d.q.id];
    delete notes[d.q.id];
    saveDataCfg(neverAgain(data?.dataCfg, d.q.id, today));
  }
  const keepAsIs = (d) => saveDataCfg(clearSkips(data?.dataCfg, d.rule));
  // «Heute nicht» and ✕ (Noah 21.10.2026 «nie mehr eine Erinnerung»): the shown questions away, and neither the window
  // nor Heute's hint come back before tomorrow; in the morning only until the evening check (Noah 26.10.2026 «1a»)
  const notToday = () => {
    asked = false;
    step = 0;
    saveSnooze(quietToday(data?.snooze, shown, now, configOf(data?.cfg).rounds));
  };
  const evening = $derived(isEveningRound(now, configOf(data?.cfg).rounds));
  const part = $derived(windowPart(now, configOf(data?.cfg).rounds)); // 'morning' | 'rest' | 'evening': the title of the window
  const quiet = $derived(isQuiet(data?.snooze, now, configOf(data?.cfg).rounds));
  // the window opens only when asked (Noah 24.11.2026): `asked` is the «Start» of Heute; what waits shows on the calm card there
  let asked = $state(false);
  const waits = $derived(shown.length > 0 && !quiet);
  const open = $derived(asked && waits);
  $effect(() => {
    if (data?.stored && !waits) {
      asked = false;
      step = 0;
    }
  });
  $effect(() => {
    due = quiet ? 0 : Math.min(shown.length, FIRST); // Noah 2: the row on Heute names the 3 questions of the window
    // P6 AB3 (Noah 21.10.2026 «2b»): what is due, by area, for the check row on Heute
    areas = quiet ? [] : [...new Set(ordered.slice(0, FIRST).map((d) => areaName(d.q.area, data?.cfg)).filter(Boolean))];
    eveOut = evening;
  });
  $effect(() => {
    if (!ask) return;
    ask = false;
    asked = true;
    const { [LATER_KEY]: _, [QUIET_KEY]: __, [QUIET_ROUND]: ___, ...rest } = data?.snooze ?? {};
    saveSnooze(rest);
  });
  // «Heute neu» A (Noah 20.10.2026 «2 Morgen-Check mit nur 3 Fragen, wobei andere Fragen optional eingeblendet und
  // beantwortet werden können»): the window shows 3 questions (today's first); «Show more questions» shows the rest.
  // «Save» puts the ones not shown away until their next time, so the window does not come back for them.
  const FIRST = 3;
  let more = $state(false);
  const ordered = $derived([...shown].sort((a, b) => (dayOf(b.slot) === today) - (dayOf(a.slot) === today)));
  const visible = $derived(more ? ordered : ordered.slice(0, FIRST));
  const hiddenN = $derived(Math.max(0, ordered.length - visible.length));
  // one question per screen with «Weiter» (Noah 24.11.2026 «Eine Frage pro Bildschirm»); an answer you typed stays when you step back
  let step = $state(0);
  const cur = $derived(Math.max(0, Math.min(step, visible.length - 1)));
  const last = $derived(cur >= visible.length - 1);
  $effect(() => {
    busy = !data?.stored || open;
  });

  // UI-Ziele #12 (Noah 20.10.2026 «freigabe»): yesterday's answer marked quietly; after a pick the next question comes into view
  const yday = $derived(((d) => (d.setUTCDate(d.getUTCDate() - 1), d.toISOString().slice(0, 10)))(new Date(`${today}T12:00:00Z`)));
  const yesterdayOf = (qid) => lastAnswer((data?.answers ?? []).filter((a) => a.day === yday), qid)?.value ?? null;
  // after an answer the main button («Weiter», on the last question «Speichern») takes the focus: one more tap goes on
  function next() {
    dialog?.querySelector('[data-ab-next], [data-ab-save]')?.focus({ preventScroll: true });
  }
  let dialog = $state();
  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // the focus stays on the window, not on ✕: a thick ring made the ✕ look like the main button (Noah 24.11.2026)
      dialog.focus({ preventScroll: true });
    } else if (!open && dialog.open) dialog.close();
  });
  // ✕, Escape and back (Noah 24.11.2026): the window closes, nothing is put away; typed answers stay and the card on Heute still says what waits
  function away() {
    asked = false;
    step = 0;
  }
</script>

{#if shown.length && !quiet}
  <dialog class="sheet vdlg from-below abm" bind:this={dialog} use:backClose={away} onclose={away} aria-labelledby="abc-h" tabindex="-1" data-section="abfragen" data-round={evening ? 'evening' : 'morning'}>
    <div class="vd-head">
      <span class="ib"><ClipboardList size={20} aria-hidden="true" /></span>
      <div class="vd-t">
        <h2 id="abc-h">{evening ? t('Evening check') : part === 'rest' ? t('Still open from this morning') : t('Morning check')}</h2>
        <!-- Noah 21.10.2026 «immer das datum und die uhrzeit der befragung, damit wir testen können» -->
        <p class="vd-sub num" data-ab-when>{dayShort(today)} · {timeText(now)}</p>
        <p class="vd-sub" data-ab-step>{visible.length > 1 ? t('Question {n} of {m}', { n: cur + 1, m: visible.length }) : tn(visible.length, '{n} question', '{n} questions')} · {t('one tap each, all can be skipped')}</p>
      </div>
      <button type="button" class="vd-x" aria-label={t('Close')} onclick={away}><X size={20} aria-hidden="true" /></button>
    </div>
    <div class="mid" data-ab-mid>
    {#each visible as d, i (d.q.id)}
      {#if i === cur}
      {@const qid = `abc-q-${i}`}
      {@const fit = fillOf(d)}
      <div class="dq" data-q={d.q.id}>
        <div class="dqh">
          <b id={qid}>{askText(d.q, today, data?.cfg)}</b>
          <span class="meta">
            {#if d.q.own && !d.q.rule}{everyShort(settingOf(data.cfg, d.q).every)}{:else}{areaName(d.q.area, data.cfg)}{/if} · {#if d.random}<span data-random>{t('a random question')}</span>{:else if d.why}<span data-from-data>{t('from your data')}</span>{:else}<span class="num">{dayOf(d.slot) === today ? timeText(d.slot) : t('question from {when}', { when: `${dayShort(dayOf(d.slot))} ${timeText(d.slot)}` })}</span>{/if}
            {#each (d.q.src ?? []).filter((s) => s !== 'hand' && s !== 'fitbit') as s (s)}<span class="ab-src {s}">{srcText(s)}</span>{/each}
            {#if d.random}<button type="button" class="skip" onclick={() => never(d)} data-never>{t('Never again|question')}</button>{/if}
            <button type="button" class="skip" onclick={() => skip(d)} aria-label={t('Skip «{q}»', { q: askText(d.q, today, data?.cfg) })} data-ab-skip>{t('Skip|question')}</button>
          </span>
        </div>
        {#if d.why}<small class="last why" data-why><b>{t('Why am I asking this?')}</b> {t(d.why.text, d.why.vars)}{#each d.why.facts ?? [] as f}{' '}{t(f.text, f.vars)}{/each} <a class="ab-lnk" href="#/me/abfragen" data-why-adjust>{d.random ? t('Change this') : t('Change this rule')}</a></small>{/if}
        {#if d.fewer}
          <div class="fewer" data-fewer>
            <small>{t('You skipped this question three times. Ask less often?')}</small>
            <button type="button" class="btn sm" onclick={() => lessOften(d)} data-fewer-yes>{t('Yes, less often')}</button>
            <button type="button" class="btn sm" onclick={() => keepAsIs(d)} data-fewer-no>{t('No, keep it')}</button>
          </div>
        {/if}
        <AnswerInput links={linksOf(d.q.id)} hint={hintOf(d.q.id)} q={d.q} bind:value={draft[d.q.id]} bind:note={notes[d.q.id]} id="{qid}-in" label={askText(d.q, today, data?.cfg)} quick last={yesterdayOf(d.q.id)} onanswer={next} />
        {#if fit}<small class="last fit num" data-fitbit={fit.hint.key}><span class="ab-src fitbit">Fitbit</span> {fitText(fit.hint)}{fit.value != null ? ` · ${t('filled in, changeable')}` : ''}</small>{/if}
        {#if d.q.id === 'koerper.waage' && lastKg}
          <small class="last num">{lastKg.day ? t('last {v} on {day}', { v: `${lastKg.kg} ${unitText('kg')}`, day: dayShort(lastKg.day) }) : t('body weight under Me › My data: {v}', { v: `${lastKg.kg} ${unitText('kg')}` })}</small>
        {/if}
      </div>
      {/if}
    {/each}
    {#if last}
      {#if hiddenN}<button type="button" class="btn more" onclick={() => (more = true)} data-ab-more>{tn(hiddenN, 'Show {n} more question', 'Show {n} more questions')}</button>{/if}
      <CheckLine {today} {evening} />
      <div class="lks">
        <a class="ab-lnk" href={evening ? '#/check/evening' : '#/check/morning'} data-ab-page>{evening ? t('Whole evening review') : t('Whole morning check')}<ChevronRight size={14} aria-hidden="true" /></a>
        <a class="ab-lnk" href="#/me/abfragen">{t('Adjust|questions')}</a>
        <a class="ab-lnk" href="#/me/history">{t('History under Data')}</a>
      </div>
    {/if}
    </div>
    <div class="ft">
      <div class="fm">
        {#if cur > 0}<button type="button" class="btn" onclick={() => (step = cur - 1)} data-ab-back>{t('Back|round')}</button>{/if}
        {#if last}
          <button type="button" class="btn hi" onclick={save} disabled={!filled || saving} data-ab-save>{t('Save')}</button>
        {:else}
          <button type="button" class="btn hi" onclick={() => (step = cur + 1)} data-ab-next>{t('Next|round')}</button>
        {/if}
      </div>
      <button type="button" class="not" onclick={notToday} data-ab-today>{t('Not today|mask')}</button>
    </div>
  </dialog>
{/if}

<style>
  /* «Nie abgeschnitten» (Noah 24.11.2026): head and foot with the main button stay, only the middle scrolls, and a soft shadow at the
     edge says that more follows. The window never grows past the screen (dvh). */
  dialog.sheet.vdlg.abm {
    padding: 0;
    max-height: min(88dvh, 760px);
  }
  dialog.sheet.vdlg.abm[open] {
    display: flex;
    flex-direction: column;
  }
  dialog.abm:focus {
    outline: none;
  }
  /* the shared window style (app.css «Nie abgeschnitten») makes .vd-head sticky with negative margins; this window keeps its head in
     the flex column itself, so its rules name the dialog too and win */
  dialog.sheet.vdlg.abm .vd-head {
    position: relative;
    top: auto;
    z-index: auto;
    flex: none;
    margin: 0;
    padding: 20px 20px 12px;
  }
  dialog.sheet.vdlg.abm .vd-head::after {
    display: none;
  }
  .mid {
    flex: 1 1 auto;
    /* the same height for every question: «Weiter» stays where the thumb or the mouse is (the window does not jump between steps) */
    min-height: min(32dvh, 240px, calc(88dvh - 230px));
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 4px 20px 14px;
    /* the soft shadows at the top and the bottom edge show only while there is more to scroll to */
    background:
      linear-gradient(var(--paper) 30%, transparent) 0 0 / 100% 28px no-repeat local,
      linear-gradient(transparent, var(--paper) 70%) 0 100% / 100% 28px no-repeat local,
      radial-gradient(farthest-side at 50% 0, var(--shadow), transparent) 0 0 / 100% 12px no-repeat scroll,
      radial-gradient(farthest-side at 50% 100%, var(--shadow), transparent) 0 100% / 100% 12px no-repeat scroll;
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .dq {
    min-width: 0;
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
  /* «Überspringen»: small and quiet, still 44 px to tap (the hit area is bigger than the word) */
  .fewer {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
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
  .last.fit {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .why {
    margin: 0 0 8px;
  }
  /* the link inside the sentence: a tall box made the last line higher than the others (Gesamttest 25.11.2026, C5) */
  .why .ab-lnk {
    display: inline;
    min-height: 0;
    padding: 2px 0;
  }
  .why b {
    font-weight: 600;
    color: var(--ink-2);
  }
  .last {
    display: block;
    margin-top: 6px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .more {
    margin-top: 12px;
    width: 100%;
  }
  .lks {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin-top: 14px;
  }
  .lks .ab-lnk {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
  }
  /* the foot: the main button on the right, «Heute nicht» quietly on the left; it never scrolls away */
  .ft {
    flex: none;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    padding: 12px 20px calc(14px + env(safe-area-inset-bottom));
    border-top: 1px solid var(--line);
    background: var(--paper);
  }
  .fm {
    display: flex;
    gap: 8px;
    margin-left: auto;
    order: 2;
  }
  .not {
    order: 1;
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink-3);
    font: 400 var(--fs-small) / 1.2 var(--font-body);
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }
  .not:hover {
    color: var(--ink-2);
  }
  @media (max-width: 719px) {
    /* on a phone the window sits on the bottom edge, so «Weiter» stays under the thumb whatever the height of the question */
    .mid {
      min-height: 0;
    }
    .fm {
      flex: 1 1 100%;
      order: 1;
    }
    .fm .btn {
      flex: 1 1 0;
      min-height: 48px;
    }
    .not {
      order: 2;
      margin: 0 auto;
    }
  }
</style>
