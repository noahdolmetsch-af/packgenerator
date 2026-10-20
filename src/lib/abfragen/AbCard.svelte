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
   */
  import { ClipboardList, X, ChevronRight } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { abQuery, ensureConfig, saveAnswers, saveSnooze } from '../abdb.js';
  import { dueList, snoozeAll, answerRow, lastAnswer, stampOf, settingOf, fromChecks, dayOf, configOf, isEveningRound, LATER_KEY, laterStamp } from '../abfragen.js';
  import { kgOf } from '../review/actdata.js';
  import { t, tn } from '../i18n.svelte.js';
  import AnswerInput from './AnswerInput.svelte';
  import CheckLine from '../wohl/CheckLine.svelte'; // Paket P: ride numbers, recipe, morning tip, a moment from the jar
  import { qText, areaName, timeText, dayShort, srcText, unitText, everyShort } from './words.js';
  import '../bikes/velo-dlg.css';
  import './ab.css';

  // Paket C: busy tells Heute that this window is open or still loading, so the window of windows.js
  // (HomeWindow: Vorabend, Wochenrückblick) waits; the round comes first, never two windows at once.
  // «Heute neu» A (Noah 20.10.2026 «2»): due and evening tell Heute's «Up now» how many questions wait; ask = true
  // (the row's «Start») opens the window again after «Later»
  let { today, busy = $bindable(false), due = $bindable(0), evening: eveOut = $bindable(false), ask = $bindable(false) } = $props();
  let now = $state(stampOf());
  $effect(() => {
    const id = setInterval(() => (now = stampOf()), 60_000);
    return () => clearInterval(id);
  });
  const query = $derived(abQuery(today));
  const data = $derived($query);
  $effect(() => {
    if (data && !data.stored) ensureConfig(now);
  });

  // Noah 14.10. 00:52:22 1a 2a 3b 4ab — 1a: several questions due at once come together in ONE card (as in AB3);
  // 2a: a missed one stays until it is answered or tapped away («Jetzt nicht»). An answer in the old daily
  // check counts too (from the start of its day).
  const answered = $derived(data ? [...data.answers, ...fromChecks(data.checks).map((r) => ({ qid: r.qid, at: `${r.day}T00:00` }))] : []);
  const shown = $derived(data?.stored ? dueList(data.cfg, answered, now, data.snooze) : []);

  let draft = $state({});
  let notes = $state({});
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
      const rows = visible.map((d) => answerRow(d.q, draft[d.q.id], { at, slot: d.slot, note: notes[d.q.id] })).filter(Boolean);
      const folded = ordered.slice(visible.length);
      await saveAnswers(rows);
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
  // until its next time (like «Heute nicht», for one); the next waiting question moves up
  function skip(d) {
    delete draft[d.q.id];
    delete notes[d.q.id];
    saveSnooze({ ...(data?.snooze ?? {}), [d.q.id]: d.last ?? d.slot });
  }
  // «Heute nicht»: every shown question put away until its next time (was «Jetzt nicht»)
  const notToday = () => saveSnooze(snoozeAll(data?.snooze, shown));
  // «Später»: the window waits one hour (LATER_KEY in the snooze record; dueList reads only question ids)
  const later = () => saveSnooze({ ...(data?.snooze ?? {}), [LATER_KEY]: laterStamp(now) });
  const waiting = $derived(!!data?.snooze?.[LATER_KEY] && now < data.snooze[LATER_KEY]);
  const evening = $derived(isEveningRound(now, configOf(data?.cfg).rounds));
  const open = $derived(shown.length > 0 && !waiting);
  $effect(() => {
    due = Math.min(shown.length, FIRST); // Noah 2: the row on Heute names the 3 questions of the window
    eveOut = evening;
  });
  $effect(() => {
    if (!ask) return;
    ask = false;
    const { [LATER_KEY]: _, ...rest } = data?.snooze ?? {};
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
  $effect(() => {
    busy = !data?.stored || open;
  });

  let dialog = $state();
  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  });
  // ✕, Escape and back: «Später», nothing is lost
  function away() {
    if (open) later();
  }
</script>

{#if shown.length}
  <dialog class="sheet vdlg from-below abm" bind:this={dialog} use:backClose={away} onclose={away} aria-labelledby="abc-h" data-section="abfragen" data-round={evening ? 'evening' : 'morning'}>
    <div class="vd-head">
      <span class="ib"><ClipboardList size={18} aria-hidden="true" /></span>
      <div class="vd-t">
        <h2 id="abc-h">{evening ? t('Evening check') : t('Morning check')}</h2>
        <p class="vd-sub">{t('{n} due now', { n: visible.length })} · {t('one tap each, all can be skipped')}</p>
      </div>
      <button type="button" class="vd-x" aria-label={t('Later|mask')} onclick={later}><X size={20} aria-hidden="true" /></button>
    </div>
    {#each visible as d, i (d.q.id)}
      {@const qid = `abc-q-${i}`}
      <div class="dq" data-q={d.q.id}>
        <div class="dqh">
          <b id={qid}>{qText(d.q)}</b>
          <span class="meta">
            {#if d.q.own}{everyShort(settingOf(data.cfg, d.q).every)}{:else}{areaName(d.q.area, data.cfg)}{/if} · <span class="num">{dayOf(d.slot) === today ? '' : `${dayShort(dayOf(d.slot))} `}{timeText(d.slot)}</span>
            {#each (d.q.src ?? []).filter((s) => s !== 'hand') as s (s)}<span class="ab-src {s}">{srcText(s)}</span>{/each}
            <button type="button" class="skip" onclick={() => skip(d)} aria-label={t('Skip «{q}»', { q: qText(d.q) })} data-ab-skip>{t('Skip|question')}</button>
          </span>
        </div>
        <AnswerInput q={d.q} bind:value={draft[d.q.id]} bind:note={notes[d.q.id]} id="{qid}-in" label={qText(d.q)} />
        {#if d.q.id === 'koerper.waage' && lastKg}
          <small class="last num">{lastKg.day ? t('last {v} on {day}', { v: `${lastKg.kg} ${unitText('kg')}`, day: dayShort(lastKg.day) }) : t('body weight under Me › My data: {v}', { v: `${lastKg.kg} ${unitText('kg')}` })}</small>
        {/if}
      </div>
    {/each}
    {#if hiddenN}<button type="button" class="btn more" onclick={() => (more = true)} data-ab-more>{tn(hiddenN, 'Show {n} more question', 'Show {n} more questions')}</button>{/if}
    <CheckLine {today} {evening} />
    <div class="lks">
      <a class="ab-lnk" href={evening ? '#/check/evening' : '#/check/morning'} data-ab-page>{evening ? t('Whole evening review') : t('Whole morning check')}<ChevronRight size={14} aria-hidden="true" /></a>
      <a class="ab-lnk" href="#/me/abfragen">{t('Adjust|questions')}</a>
      <a class="ab-lnk" href="#/me/history">{t('History under Data')}</a>
    </div>
    <div class="ft">
      <button type="button" class="btn" onclick={notToday} data-ab-today>{t('Not today|mask')}</button>
      <button type="button" class="btn" onclick={later} data-ab-later>{t('Later|mask')}</button>
      <button type="button" class="btn hi" onclick={save} disabled={!filled || saving} data-ab-save>{t('Save')}</button>
    </div>
    <small class="hint">{t('«Later» brings this window back in one hour. «Not today» puts these questions away until their next time.')}</small>
  </dialog>
{/if}

<style>
  .abm {
    max-height: min(88vh, 900px);
    overflow-y: auto;
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
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
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
  .ft {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .hint {
    display: block;
    margin-top: 8px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    overflow-wrap: break-word;
  }
  @media (max-width: 719px) {
    .ft .btn {
      flex: 1 1 30%;
      min-height: 48px;
    }
  }
</style>
