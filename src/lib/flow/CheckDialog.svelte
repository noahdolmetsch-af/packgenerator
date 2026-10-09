<script>
  /**
   * v0.51.0 «Im Flow»: the daily check (Noah 10a). Sleep, energy and mood every day, plus a 4th
   * question that rotates through a pool of ten (editable here). One tap per question on 1–10 (one
   * row, taller rather than wider on a small phone, Noah 9a); a dot under a number is yesterday. The
   * next question moves up by itself; after the 4th answer the check closes. «Later» keeps the row
   * on Today.
   */
  import { X, Check, Pencil, Plus, Trash2 } from '@lucide/svelte';
  import { db } from '../db.js';
  import { ui, qText } from './ui.svelte.js';
  import { saveCheck, saveQuestions } from '../flowdb.js';
  import { FIXED, KEYS, rotating, checkOf, answer, answered, nextOpen, yesterdayOf, complete } from '../flowcheck.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  let { checks = [], pool = [], today } = $props();
  let dlg = $state();
  let editing = $state(false);
  let showAll = $state(false);
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
  const dateLine = $derived(new Date(`${today}T12:00:00`).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' }));
</script>

<dialog class="sheet from-below check" bind:this={dlg} onclose={() => (ui.checkOpen = false)} aria-labelledby="chk-h">
  {#if ui.checkOpen}
    <div class="bar">
      <button type="button" class="ic" onclick={close} aria-label={t('Close')}><X size={22} aria-hidden="true" /></button>
      <span class="bt">{t('Daily check')}</span>
      <span class="cnt num">{t('{n} of {m}', { n: Math.min(4, answered(cur) + (open ? 1 : 0)), m: 4 })}</span>
    </div>
    <div class="prog" aria-hidden="true">
      {#each KEYS as k (k)}<i class:on={cur[k] != null} class:now={open === k}></i>{/each}
    </div>
    <h2 id="chk-h" class="title">{t('How are you today?')}</h2>
    <p class="dl">{dateLine} · {t('one tap per question')}</p>

    {#each qs as q (q.key)}
      {@const y = yesterdayOf(checks, today, q.key, q.qid)}
      <section class="q" class:now={open === q.key} id="chk-{q.key}" aria-labelledby="chk-q-{q.key}">
        <div class="qh">
          <h3 id="chk-q-{q.key}">{q.text}</h3>
          {#if cur[q.key] != null}<Check size={20} class="ok" aria-label={t('answered')} />{:else if q.rotates}<span class="pill">{t('changes daily')}</span>{/if}
        </div>
        <div class="scale" role="group" aria-labelledby="chk-q-{q.key}">
          {#each Array.from({ length: 10 }, (_, i) => i + 1) as v (v)}
            <button type="button" class="sv num" class:y={y === v} aria-pressed={cur[q.key] === v} aria-label={y === v ? t('{n}, yesterday', { n: v }) : String(v)} onclick={() => pick(q, v)}>{v}</button>
          {/each}
        </div>
        <div class="ends"><span>{q.lo}</span><span>{q.hi}</span></div>
      </section>
    {/each}

    <button type="button" class="later" onclick={close}>{t('Later')}</button>

    <section class="pool" aria-labelledby="pool-h">
      <div class="ph">
        <h3 id="pool-h">{t('Rotating questions')} <span class="n num">{pool.length}</span></h3>
        {#if editing}
          <button type="button" class="lk" onclick={saveEdit}><Check size={16} aria-hidden="true" />{t('Save')}</button>
        {:else}
          <button type="button" class="lk" onclick={startEdit}><Pencil size={16} aria-hidden="true" />{t('Edit')}</button>
        {/if}
      </div>
      {#if editing}
        <ol class="ed">
          {#each draft as p, i (p.id)}
            <li>
              <input class="inp" type="text" bind:value={p.text} aria-label={t('Question {n}', { n: i + 1 })} />
              <button type="button" class="ic" onclick={() => (draft = draft.filter((x) => x.id !== p.id))} aria-label={t('Remove question {n}', { n: i + 1 })} disabled={draft.length < 2}><Trash2 size={18} aria-hidden="true" /></button>
            </li>
          {/each}
        </ol>
        <button type="button" class="lk" onclick={() => (draft = [...draft, { id: `q-${Date.now().toString(36)}`, text: '', lo: '', hi: '' }])}><Plus size={16} aria-hidden="true" />{t('Question')}</button>
      {:else}
        <ol class="ql">
          {#each showAll ? pool : pool.slice(0, 5) as p, i (p.id)}
            <li class:today={p.id === rot.q.id}><span class="nr num">{i + 1}</span><span class="qt">{qText(p)}</span>{#if p.id === rot.q.id}<span class="pill act">{t('today')}</span>{/if}</li>
          {/each}
        </ol>
        {#if pool.length > 5}<button type="button" class="lk quiet" aria-expanded={showAll} onclick={() => (showAll = !showAll)}>{showAll ? t('Show fewer') : tn(pool.length - 5, '… and {n} more · in turn, each every {d} days', '… and {n} more · in turn, each every {d} days', { d: pool.length })}</button>{/if}
      {/if}
    </section>
  {/if}
</dialog>

<style>
  .check {
    width: min(640px, calc(100vw - 24px));
    padding: 0 16px 20px;
    background: var(--ground);
  }
  @media (max-width: 719px) {
    .check {
      max-height: 100dvh;
      height: 100dvh;
      border-radius: 0;
    }
  }
  .bar {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 -16px;
    padding: 6px 12px 6px 6px;
    background: var(--brand);
    color: var(--brand-ink);
  }
  .bar .ic {
    color: var(--brand-ink);
  }
  .bt {
    flex: 1;
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: var(--fs-section);
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .cnt {
    color: var(--brand-ink-2);
    font-size: var(--fs-small);
  }
  .ic {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .ic:disabled {
    opacity: 0.4;
  }
  .prog {
    display: flex;
    gap: 6px;
    margin: 12px 0 10px;
  }
  .prog i {
    flex: 1;
    height: 5px;
    border-radius: 3px;
    background: var(--line);
  }
  .prog i.on {
    background: var(--accent);
  }
  .prog i.now {
    background: var(--hi);
  }
  h2.title {
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: var(--fs-page);
  }
  .dl {
    margin: 4px 0 12px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .q {
    margin-top: 10px;
    padding: 12px 12px 10px;
    border: 1.5px solid transparent;
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .q.now {
    border-color: var(--hi);
  }
  .qh {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }
  .qh h3 {
    margin: 0;
    font-size: var(--fs-sub);
    font-weight: 500;
    line-height: 1.3;
  }
  .qh :global(.ok) {
    flex: none;
    color: var(--ok);
  }
  .scale {
    display: grid;
    grid-template-columns: repeat(10, minmax(0, 1fr));
    gap: 3px;
  }
  .sv {
    position: relative;
    min-width: 0;
    height: 48px;
    padding: 0;
    border: 0;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-body);
    cursor: pointer;
  }
  .sv:hover {
    background: var(--line);
  }
  .sv.y::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: 6px;
    width: 4px;
    height: 4px;
    margin-left: -2px;
    border-radius: 50%;
    background: var(--ink-3);
  }
  .sv[aria-pressed='true'] {
    background: var(--accent);
    color: var(--paper);
    font-weight: 600;
  }
  .sv[aria-pressed='true'].y::after {
    background: var(--paper);
  }
  @media (max-width: 359px) {
    .scale {
      gap: 2px;
    }
    .sv {
      height: 54px;
      font-size: var(--fs-small);
    }
  }
  .ends {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 6px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .later {
    display: block;
    min-height: 44px;
    margin: 10px auto;
    padding: 0 16px;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    cursor: pointer;
  }
  .pool {
    margin-top: 8px;
    padding: 12px 14px;
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .ph {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .ph h3 {
    margin: 0;
    font-size: var(--fs-sub);
    font-weight: 500;
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
    color: var(--accent);
    font: inherit;
    cursor: pointer;
  }
  .lk.quiet {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ql,
  .ed {
    margin: 4px 0 0;
    padding: 0;
    list-style: none;
  }
  .ql li {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    border-top: 1px solid var(--line);
  }
  .ql li:first-child {
    border-top: 0;
  }
  .nr {
    width: 18px;
    color: var(--ink-3);
  }
  .ql li.today .nr {
    color: var(--hi);
    font-weight: 600;
  }
  .qt {
    flex: 1;
    min-width: 0;
  }
  .ed li {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
  }
</style>
