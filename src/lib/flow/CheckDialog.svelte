<script>
  /**
   * v0.51.0 «Im Flow»: the daily check (Noah 10a). Sleep, energy and mood every day, plus a 4th
   * question that rotates through a pool of ten (editable here). One tap per question on 1–10 (one
   * row, taller rather than wider on a small phone, Noah 9a); a dot under a number is yesterday. The
   * next question moves up by itself; after the 4th answer the check closes. «Later» keeps the row
   * on Today.
   */
  import { X, Check, Plus, Trash2 } from '@lucide/svelte';
  import { db } from '../db.js';
  import { ui, qText } from './ui.svelte.js';
  import { saveCheck, saveQuestions } from '../flowdb.js';
  import { FIXED, rotating, checkOf, answer, answered, nextOpen, yesterdayOf, complete } from '../flowcheck.js';
  import { t } from '../i18n.svelte.js';

  let { checks = [], pool = [], today } = $props();
  let dlg = $state();
  let editing = $state(false);


  let draft = $state([]);

  const rot = $derived(rotating(pool, today));
  const cur = $derived(checkOf(checks.find((c) => c.day === today), today));
  const open = $derived(nextOpen(cur));
  const qs = $derived([...FIXED.map((f) => ({ key: f.key, text: t(f.text), lo: t(f.lo), hi: t(f.hi) })), { key: 'extra', text: qText(rot.q), lo: qText(rot.q, 'lo'), hi: qText(rot.q, 'hi'), rotates: true, qid: rot.q.id }]);
  let closing = null;

  $effect(() => {
    if (ui.checkOpen && dlg && !dlg.open) {
      editing = false;
      dlg.showModal();
    }
    if (!ui.checkOpen && dlg?.open) dlg.close();
  });
  const close = () => {
    clearTimeout(closing);
    ui.checkOpen = false;
  };
  async function pick(q, v) {
    const next = answer(cur, q.key, v, today, q.qid);
    await saveCheck(db, next);
    if (complete(next)) {
      clearTimeout(closing);
      closing = setTimeout(close, 650);
    } else {
      const k = nextOpen(next);
      requestAnimationFrame(() => document.getElementById(`chk-${k}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    }
  }
  function startEdit() {
    draft = pool.map((p) => ({ ...p, text: qText(p) }));
    editing = true;
  }
  async function saveEdit() {
    const clean = draft
      .map((p) => {
        const orig = pool.find((o) => o.id === p.id);
        const same = orig && p.text === qText(orig);
        if (same) return orig;
        const { textDe, ...rest } = p;
        return { ...rest, text: p.text.trim() };
      })
      .filter((p) => p.text.trim());
    if (clean.length) await saveQuestions(db, clean);
    editing = false;
  }
</script>

<dialog class="sheet from-below check" bind:this={dlg} onclose={() => (ui.checkOpen = false)} aria-labelledby="chk-h">
  {#if ui.checkOpen}
    <!-- v0.105.0 Design-Refresh P8 «Aktiv» (A4): a light window: the title, how many are answered, the
         close button; the questions numbered, yesterday's answer at the right; «Später», «Bearbeiten»
         (the rotating questions) and «Speichern» (the answers are saved at once, it closes) -->
    <div class="hd">
      <div class="ht">
        <h2 id="chk-h">{t('Daily check')}</h2>
        <p class="dl">{t('How are you today?')} · <span class="num">{t('{n} of {m} answered', { n: answered(cur), m: 4 })}</span></p>
      </div>
      <button type="button" class="ic" onclick={close} aria-label={t('Close')}><X size={18} aria-hidden="true" /></button>
    </div>

    {#each qs as q, i (q.key)}
      {@const y = yesterdayOf(checks, today, q.key, q.qid)}
      <section class="q" class:now={open === q.key} id="chk-{q.key}" aria-labelledby="chk-q-{q.key}">
        <div class="qh">
          <h3 id="chk-q-{q.key}">{i + 1}. {q.text}</h3>
          {#if cur[q.key] != null}<Check size={18} class="ok" aria-label={t('answered')} />{:else if y != null}<small class="num">{t('{n}, yesterday', { n: y })}</small>{:else if q.rotates}<span class="pill">{t('changes daily')}</span>{/if}
        </div>
        <div class="scale" role="group" aria-labelledby="chk-q-{q.key}">
          {#each Array.from({ length: 10 }, (_, i) => i + 1) as v (v)}
            <button type="button" class="sv num" class:y={y === v} aria-pressed={cur[q.key] === v} aria-label={y === v ? t('{n}, yesterday', { n: v }) : String(v)} onclick={() => pick(q, v)}>{v}</button>
          {/each}
        </div>
        <div class="ends"><span>{q.lo}</span><span>{q.hi}</span></div>
      </section>
    {/each}
    <p class="obs">{t('Question 4 changes every day. Only for you, an observation, no rating.')}</p>

    {#if editing}
      <section class="pool" aria-labelledby="pool-h">
        <div class="ph">
          <h3 id="pool-h">{t('Rotating questions')} <span class="n num">{pool.length}</span></h3>
        </div>
          <ol class="ed">
            {#each draft as p, i (p.id)}
              <li>
                <input class="inp" type="text" bind:value={p.text} aria-label={t('Question {n}', { n: i + 1 })} />
                <button type="button" class="ic" onclick={() => (draft = draft.filter((x) => x.id !== p.id))} aria-label={t('Remove question {n}', { n: i + 1 })} disabled={draft.length < 2}><Trash2 size={18} aria-hidden="true" /></button>
              </li>
            {/each}
          </ol>
          <button type="button" class="lk" onclick={() => (draft = [...draft, { id: `q-${Date.now().toString(36)}`, text: '', lo: '', hi: '' }])}><Plus size={16} aria-hidden="true" />{t('Question')}</button>
      </section>
    {/if}

    <div class="acts">
      <button type="button" class="btn" onclick={close}>{t('Later')}</button>
      {#if !editing}<button type="button" class="btn" onclick={startEdit}>{t('Edit')}</button>{/if}
      <button type="button" class="btn hi" onclick={editing ? saveEdit : close}>{t('Save')}</button>
    </div>
  {/if}
</dialog>

<style>
  .check {
    width: min(640px, calc(100vw - 24px));
    padding: var(--sp-5);
    border-color: var(--card-line);
    border-radius: var(--radius-card);
  }
  @media (max-width: 719px) {
    .check {
      max-height: 100dvh;
      padding: var(--sp-4);
    }
  }
  .hd {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-3);
    margin-bottom: var(--sp-2);
  }
  .ht {
    flex: 1;
    min-width: 0;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .dl {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ic {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink);
    cursor: pointer;
  }
  .ic:disabled {
    opacity: 0.4;
  }
  .q {
    padding: var(--sp-3) 0;
    border-top: 1px solid var(--line);
  }
  .qh {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-2);
    margin-bottom: var(--sp-2);
  }
  .qh h3 {
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .qh small {
    flex: none;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .qh :global(.ok) {
    flex: none;
    color: var(--ok);
  }
  .scale {
    display: grid;
    grid-template-columns: repeat(10, minmax(0, 1fr));
    gap: 4px;
  }
  .sv {
    position: relative;
    min-width: 0;
    height: 44px;
    padding: 0;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink-2);
    font: 600 var(--fs-body) / 1 var(--font-body);
    cursor: pointer;
  }
  .sv:hover {
    background: var(--paper-2);
  }
  .sv.y::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: 4px;
    width: 4px;
    height: 4px;
    margin-left: -2px;
    border-radius: 50%;
    background: var(--ink-3);
  }
  .sv[aria-pressed='true'] {
    border-color: var(--hi);
    background: var(--hi);
    color: var(--hi-ink);
  }
  .sv[aria-pressed='true'].y::after {
    background: var(--hi-ink);
  }
  @media (max-width: 359px) {
    .scale {
      gap: 2px;
    }
    .sv {
      height: 52px;
      font-size: var(--fs-small);
    }
  }
  .ends {
    display: flex;
    justify-content: space-between;
    gap: var(--sp-3);
    margin-top: 4px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .obs {
    margin: var(--sp-2) 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--sp-2);
    margin-top: var(--sp-4);
  }
  .pool {
    margin-top: var(--sp-3);
    padding: var(--sp-3) var(--sp-4);
    border-radius: var(--radius-card);
    background: var(--paper-2);
  }
  .ph h3 {
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .ph .n {
    color: var(--ink-3);
    font-weight: 400;
  }
  .lk {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .ed {
    margin: 4px 0 0;
    padding: 0;
    list-style: none;
  }
  .ed li {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
  }
  .ed .inp {
    flex: 1;
    min-width: 0;
  }
</style>
