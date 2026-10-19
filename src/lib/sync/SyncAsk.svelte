<script>
  /**
   * P8 «Automatischer Abgleich», answer 3b (Noah 18.10.2026): when the phone and the computer both
   * changed the same entry, the app asks which version wins: this device's version and the other one
   * side by side (stacked on the phone), each with when it was changed and what differs. «Later» keeps
   * both as they are (the entry is not sent meanwhile); all can be answered the same way at once.
   * Noah 18.10.2026 «1b und a kann eingestellt werden 2a oder umschalten auf b möglich 3a»:
   * - and 20:07 «1a 2a 3a»: the window opens by itself; a setting (Ich › Daten und Backup) switches to a
   *   quiet hint at the bottom instead, and the window opens with «Decide».
   * - one question after the other; «Show all as a list» switches to every question at once (kept).
   */
  import { liveQuery } from 'dexie';
  import { X, Laptop, Smartphone, RefreshCw } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, tn, locale } from '../i18n.svelte.js';
  import { backClose } from '../ui/backclose.js';
  import { openQuestions, resolve } from './engine.js';
  import { sync, syncUi, runSync, setAskPrefs } from './auto.svelte.js';
  import { kindOf, titleOf, differences } from './show.js';

  let dialog = $state();
  let busy = $state(false);
  const qs = liveQuery(() => openQuestions(db));
  const list = $derived($qs ?? []);
  const q = $derived(list[0] ?? null);
  const here = globalThis.matchMedia?.('(pointer: coarse)').matches ? 'phone' : 'computer';
  const devName = (d) => (d === 'phone' ? t('Phone') : d === 'computer' ? t('Computer') : t('Other device'));
  const asList = $derived(sync.asList && list.length > 1);

  // new questions: the window by itself (setting) or the hint (default)
  const fresh = $derived(sync.asks > syncUi.seen);
  $effect(() => {
    if (fresh && sync.autoOpen && !syncUi.first) syncUi.open = true;
  });
  const hint = $derived(fresh && !syncUi.open && !sync.autoOpen && !syncUi.first && list.length > 0);
  $effect(() => {
    if (!dialog) return;
    if (syncUi.open && q && !dialog.open) dialog.showModal();
    if ((!syncUi.open || (!q && $qs)) && dialog.open) dialog.close();
  });
  function later() {
    syncUi.seen = sync.asks;
    syncUi.open = false;
  }
  async function pick(choice, which) {
    busy = true;
    try {
      for (const x of which) await resolve(db, x.key, choice);
      if (which.length >= list.length) {
        syncUi.seen = 0;
        syncUi.open = false;
      }
      runSync();
    } finally {
      busy = false;
    }
  }
  const when = (iso) => (iso ? new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '–');
</script>

{#snippet versions(x)}
  {@const diff = differences(x.mine, x.theirs)}
  <div class="two">
    <button type="button" class="ver" disabled={busy} onclick={() => pick('mine', [x])} data-choice="mine">
      <span class="vh">{#if here === 'phone'}<Smartphone size={18} aria-hidden="true" />{:else}<Laptop size={18} aria-hidden="true" />{/if}<b>{t('This device')}</b> <small>({devName(here)})</small></span>
      <small class="at">{t('changed {when}', { when: when(x.mineAt) })}</small>
      {#if !x.mine}<span class="gone">{t('deleted here')}</span>{:else}
        <ul>{#each diff as d (d.key)}<li><span>{d.label}</span> <b>{d.mine}</b></li>{/each}</ul>{/if}
      <span class="take">{t('Keep this one')}</span>
    </button>
    <button type="button" class="ver" disabled={busy} onclick={() => pick('theirs', [x])} data-choice="theirs">
      <span class="vh">{#if x.dev === 'phone'}<Smartphone size={18} aria-hidden="true" />{:else}<Laptop size={18} aria-hidden="true" />{/if}<b>{t('Other device')}</b> <small>({devName(x.dev)})</small></span>
      <small class="at">{t('changed {when}', { when: when(x.theirsAt) })}</small>
      {#if !x.theirs}<span class="gone">{t('deleted there')}</span>{:else}
        <ul>{#each diff as d (d.key)}<li><span>{d.label}</span> <b>{d.theirs}</b></li>{/each}</ul>{/if}
      <span class="take">{t('Take this one')}</span>
    </button>
  </div>
{/snippet}

{#if hint}
  <div class="synchint" role="status" data-sync-hint>
    <RefreshCw size={18} aria-hidden="true" />
    <span>{tn(list.length, '{n} entry changed on both devices.', '{n} entries changed on both devices.')}</span>
    <button type="button" class="go" onclick={() => (syncUi.open = true)}>{t('Decide')}</button>
    <button type="button" class="hx" aria-label={t('Later')} onclick={later}><X size={18} aria-hidden="true" /></button>
  </div>
{/if}

<dialog class="sheet syncask" bind:this={dialog} use:backClose onclose={later} aria-labelledby="sa-h" data-sync-ask data-view={asList ? 'list' : 'one'}>
  {#if q}
    <div class="hd">
      <div class="hm">
        <p class="eyebrow">{t('Sync')}{#if list.length > 1 && !asList} · {t('{n} of {all}', { n: 1, all: list.length })}{/if}</p>
        <h2 id="sa-h">{t('Changed on both devices')}</h2>
      </div>
      <button type="button" class="x" aria-label={t('Close')} onclick={later}><X size={18} aria-hidden="true" /></button>
    </div>
    <p class="lead">{t('Which version should count? The other one is replaced.')}</p>
    {#if list.length > 1}
      <button type="button" class="switch" onclick={() => setAskPrefs(db, { list: !sync.asList })}>{asList ? t('Show one at a time') : t('Show all as a list')}</button>
    {/if}

    {#if asList}
      <ol class="qlist">
        {#each list as x (x.key)}
          <li data-question={x.id}>
            <p class="entry"><span class="kind">{kindOf(x.t)}</span> <b>{titleOf(x.mine ?? x.theirs, x.id)}</b></p>
            {@render versions(x)}
          </li>
        {/each}
      </ol>
    {:else}
      <p class="entry"><span class="kind">{kindOf(q.t)}</span> <b>{titleOf(q.mine ?? q.theirs, q.id)}</b></p>
      {@render versions(q)}
    {/if}

    <div class="acts">
      <button type="button" class="btn" onclick={later}>{t('Decide later')}</button>
      {#if list.length > 1}
        <details class="all">
          <summary>{t('Same answer for all {n}', { n: list.length })}</summary>
          <div class="allb">
            <button type="button" class="btn" disabled={busy} onclick={() => pick('mine', list)}>{t('All from this device')}</button>
            <button type="button" class="btn" disabled={busy} onclick={() => pick('theirs', list)}>{t('All from the other device')}</button>
          </div>
        </details>
      {/if}
    </div>
    <p class="note">{t('Before the first sync the app kept a copy of your data: Data and backup › Before updates.')}</p>
  {/if}
</dialog>

<style>
  .synchint {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: 24px;
    z-index: 39;
    width: min(520px, calc(100vw - 32px));
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 6px 6px 14px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 8px 24px var(--shadow);
    font-size: var(--fs-body);
  }
  .synchint span {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .go {
    flex: none;
    min-height: 44px;
    padding: 0 14px;
    border: 0;
    border-radius: var(--r-ctl);
    background: var(--hi);
    color: var(--hi-ink);
    font-weight: 700;
    font-size: var(--fs-body);
    cursor: pointer;
  }
  .hx {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .switch {
    margin: 0 0 10px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    text-decoration: underline;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .qlist {
    margin: 0 0 4px;
    padding: 0;
    list-style: none;
  }
  .qlist li + li {
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  @media (max-width: 719px) {
    .synchint {
      bottom: calc(84px + env(safe-area-inset-bottom));
    }
  }
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
