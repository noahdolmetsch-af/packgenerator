<script>
  /**
   * AB3 «Deine Abfragen» on Heute (Noah 14.10.2026 «freigabe»; replaces SN2l, the weekly weight
   * question): a calm card under the greeting with what is due now. One tap per question, everything
   * can be skipped; «Speichern» puts the answers into the history under Daten, «Jetzt nicht» hides the
   * card until the next question time, «Anpassen» leads to Ich › Deine Abfragen.
   * The weight is the same as the body weight under Ich › Meine Daten (abdb.js saveAnswers).
   */
  import { ClipboardList } from '@lucide/svelte';
  import { abQuery, ensureConfig, saveAnswers, saveSnooze } from '../abdb.js';
  import { dueList, snoozeAll, answerRow, lastAnswer, stampOf, settingOf, fromChecks, dayOf } from '../abfragen.js';
  import { kgOf } from '../review/actdata.js';
  import { t } from '../i18n.svelte.js';
  import AnswerInput from './AnswerInput.svelte';
  import { qText, areaName, timeText, dayShort, srcText, unitText, everyShort } from './words.js';
  import './ab.css';

  let { today } = $props();
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
  const filled = $derived(shown.some((d) => (draft[d.q.id] != null && draft[d.q.id] !== '') || String(notes[d.q.id] ?? '').trim()));
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
      const rows = shown.map((d) => answerRow(d.q, draft[d.q.id], { at, slot: d.slot, note: notes[d.q.id] })).filter(Boolean);
      await saveAnswers(rows);
      for (const r of rows) {
        delete draft[r.qid];
        delete notes[r.qid];
      }
    } finally {
      saving = false;
    }
  }
  const later = () => saveSnooze(snoozeAll(data?.snooze, shown));
</script>

{#if shown.length}
  <section class="card abc" aria-labelledby="abc-h" data-section="abfragen">
    <div class="hd">
      <span class="ib"><ClipboardList size={18} aria-hidden="true" /></span>
      <span class="m"><b id="abc-h">{t('Your questions')}</b><small>{t('{n} due now', { n: shown.length })} · {t('one tap each, all can be skipped')}</small></span>
      <a class="ab-lnk" href="#/me/abfragen">{t('Adjust|questions')}</a>
    </div>
    {#each shown as d, i (d.q.id)}
      {@const qid = `abc-q-${i}`}
      <div class="dq" data-q={d.q.id}>
        <div class="dqh">
          <b id={qid}>{qText(d.q)}</b>
          <span class="meta">
            {#if d.q.own}{everyShort(settingOf(data.cfg, d.q).every)}{:else}{areaName(d.q.area)}{/if} · <span class="num">{dayOf(d.slot) === today ? '' : `${dayShort(dayOf(d.slot))} `}{timeText(d.slot)}</span>
            {#each (d.q.src ?? []).filter((s) => s !== 'hand') as s (s)}<span class="ab-src {s}">{srcText(s)}</span>{/each}
          </span>
        </div>
        <AnswerInput q={d.q} bind:value={draft[d.q.id]} bind:note={notes[d.q.id]} id="{qid}-in" label={qText(d.q)} />
        {#if d.q.id === 'koerper.waage' && lastKg}
          <small class="last num">{lastKg.day ? t('last {v} on {day}', { v: `${lastKg.kg} ${unitText('kg')}`, day: dayShort(lastKg.day) }) : t('body weight under Me › My data: {v}', { v: `${lastKg.kg} ${unitText('kg')}` })}</small>
        {/if}
      </div>
    {/each}
    <div class="ft">
      <a class="ab-lnk" href="#/me/history">{t('History under Data')}</a>
      <span class="btns">
        <button type="button" class="btn" onclick={later} data-ab-later>{t('Not now')}</button>
        <button type="button" class="btn hi" onclick={save} disabled={!filled || saving} data-ab-save>{t('Save')}</button>
      </span>
    </div>
  </section>
{/if}

<style>
  .abc {
    margin: 0 0 18px;
    padding: 14px 16px;
    min-width: 0;
  }
  .hd {
    display: flex;
    align-items: center;
    gap: 12px;
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
  .m {
    flex: 1;
    min-width: 0;
    display: grid;
  }
  .m b {
    font-weight: 600;
  }
  .m small {
    color: var(--ink-3);
    font-size: var(--fs-small);
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
  .last {
    display: block;
    margin-top: 6px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ft {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .btns {
    display: flex;
    gap: 8px;
  }
  @media (max-width: 719px) {
    .btns {
      flex: 1 0 100%;
    }
    .btns .btn {
      flex: 1;
      min-height: 48px;
    }
  }
</style>
