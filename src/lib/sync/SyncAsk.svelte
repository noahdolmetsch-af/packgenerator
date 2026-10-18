<script>
  /**
   * P8 «Automatischer Abgleich», answer 3b (Noah 18.10.2026): when the phone and the computer both
   * changed the same entry, the app asks which version wins. One question at a time: the entry, then
   * this device's version and the other one side by side (stacked on the phone), each with when it
   * was changed and what differs. «Later» keeps both as they are (the entry is not sent meanwhile);
   * with more than one question, all the rest can be answered the same way at once.
   * It opens by itself when a round brings new questions, and from Ich › Daten und Backup.
   */
  import { liveQuery } from 'dexie';
  import { X, Laptop, Smartphone } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, locale } from '../i18n.svelte.js';
  import { backClose } from '../ui/backclose.js';
  import { openQuestions, resolve } from './engine.js';
  import { sync, syncUi, runSync } from './auto.svelte.js';
  import { kindOf, titleOf, differences } from './show.js';

  let dialog = $state();
  let busy = $state(false);
  const qs = liveQuery(() => openQuestions(db));
  const list = $derived($qs ?? []);
  const q = $derived(list[0] ?? null);
  const here = globalThis.matchMedia?.('(pointer: coarse)').matches ? 'phone' : 'computer';
  const devName = (d) => (d === 'phone' ? t('Phone') : d === 'computer' ? t('Computer') : t('Other device'));

  // opens by itself when new questions come (not again for the same ones after «Later»)
  $effect(() => {
    if (sync.asks > syncUi.seen) syncUi.open = true;
  });
  $effect(() => {
    if (!dialog) return;
    if (syncUi.open && q && !dialog.open) dialog.showModal();
    if ((!syncUi.open || (!q && $qs)) && dialog.open) dialog.close();
  });
  function later() {
    syncUi.seen = sync.asks;
    syncUi.open = false;
  }
  async function pick(choice, all = false) {
    busy = true;
    try {
      for (const x of all ? list : [q]) await resolve(db, x.key, choice);
      if (all || list.length <= 1) {
        syncUi.seen = 0;
        syncUi.open = false;
      }
      runSync();
    } finally {
      busy = false;
    }
  }
  const when = (iso) => (iso ? new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '–');
  const diff = $derived(q ? differences(q.mine, q.theirs) : []);
</script>

<dialog class="sheet syncask" bind:this={dialog} use:backClose onclose={later} aria-labelledby="sa-h" data-sync-ask>
  {#if q}
    <div class="hd">
      <div class="hm">
        <p class="eyebrow">{t('Sync')}{#if list.length > 1} · {t('{n} of {all}', { n: 1, all: list.length })}{/if}</p>
        <h2 id="sa-h">{t('Changed on both devices')}</h2>
      </div>
      <button type="button" class="x" aria-label={t('Close')} onclick={later}><X size={18} aria-hidden="true" /></button>
    </div>
    <p class="lead">{t('Which version should count? The other one is replaced.')}</p>
    <p class="entry"><span class="kind">{kindOf(q.t)}</span> <b>{titleOf(q.mine ?? q.theirs, q.id)}</b></p>

    <div class="two">
      <button type="button" class="ver" disabled={busy} onclick={() => pick('mine')} data-choice="mine">
        <span class="vh">{#if here === 'phone'}<Smartphone size={18} aria-hidden="true" />{:else}<Laptop size={18} aria-hidden="true" />{/if}<b>{t('This device')}</b> <small>({devName(here)})</small></span>
        <small class="at">{t('changed {when}', { when: when(q.mineAt) })}</small>
        {#if !q.mine}<span class="gone">{t('deleted here')}</span>{:else}
          <ul>{#each diff as d (d.key)}<li><span>{d.label}</span> <b>{d.mine}</b></li>{/each}</ul>{/if}
        <span class="take">{t('Keep this one')}</span>
      </button>
      <button type="button" class="ver" disabled={busy} onclick={() => pick('theirs')} data-choice="theirs">
        <span class="vh">{#if q.dev === 'phone'}<Smartphone size={18} aria-hidden="true" />{:else}<Laptop size={18} aria-hidden="true" />{/if}<b>{t('Other device')}</b> <small>({devName(q.dev)})</small></span>
        <small class="at">{t('changed {when}', { when: when(q.theirsAt) })}</small>
        {#if !q.theirs}<span class="gone">{t('deleted there')}</span>{:else}
          <ul>{#each diff as d (d.key)}<li><span>{d.label}</span> <b>{d.theirs}</b></li>{/each}</ul>{/if}
        <span class="take">{t('Take this one')}</span>
      </button>
    </div>

    <div class="acts">
      <button type="button" class="btn" onclick={later}>{t('Decide later')}</button>
      {#if list.length > 1}
        <details class="all">
          <summary>{t('Same answer for all {n}', { n: list.length })}</summary>
          <div class="allb">
            <button type="button" class="btn" disabled={busy} onclick={() => pick('mine', true)}>{t('All from this device')}</button>
            <button type="button" class="btn" disabled={busy} onclick={() => pick('theirs', true)}>{t('All from the other device')}</button>
          </div>
        </details>
      {/if}
    </div>
    <p class="note">{t('Before the first sync the app kept a copy of your data: Data and backup › Before updates.')}</p>
  {/if}
</dialog>

<style>
  .syncask {
    max-width: 640px;
    width: min(640px, calc(100vw - 24px));
  }
  .hd {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  .hm {
    flex: 1;
    min-width: 0;
  }
  .eyebrow {
    margin: 0 0 2px;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
  h2 {
    margin: 0 0 4px;
    font-weight: 700;
    font-size: var(--fs-section);
    line-height: 1.2;
    overflow-wrap: break-word;
  }
  .x {
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
  .lead {
    margin: 0 0 10px;
    font-size: var(--fs-body);
    color: var(--ink-2);
  }
  .entry {
    margin: 0 0 12px;
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .kind {
    display: inline-block;
    margin-right: 4px;
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--paper-2);
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 14px;
  }
  .ver {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    min-width: 0;
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    text-align: left;
    font: inherit;
    cursor: pointer;
  }
  .ver:hover,
  .ver:focus-visible {
    border-color: var(--hi);
  }
  .vh {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .at {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ver ul {
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--fs-small);
  }
  .ver li {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 3px 0;
    border-top: 1px solid var(--line);
    overflow-wrap: break-word;
  }
  .ver li span {
    color: var(--ink-2);
  }
  .gone {
    font-size: var(--fs-small);
    color: var(--ink-2);
    font-style: italic;
  }
  .take {
    margin-top: auto;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--hi);
    color: var(--hi-ink);
    font-weight: 700;
    text-align: center;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }
  .acts .btn {
    min-height: 44px;
  }
  .all summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    cursor: pointer;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .allb {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 6px;
  }
  .note {
    margin: 12px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  @media (max-width: 600px) {
    .two {
      grid-template-columns: 1fr;
    }
  }
</style>
