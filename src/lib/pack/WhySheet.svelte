<script>
  /**
   * Paket P3 «Warum? und Regeln» (mockup RG1): the «Why?» window of a row in Pack. Each reason of the row
   * in one sentence with the rule behind it and where to change it («Change the limit»), and the way to
   * every rule of the app (#/me/regeln «How the app decides»). Only reads; changing happens where the rule lives.
   */
  import { liveQuery } from 'dexie';
  import { X, ArrowRight, ListChecks } from '@lucide/svelte';
  import { db } from '../db.js';
  import { SETS_KEY } from '../sets.js';
  import { rainLimit } from '../rainlimit.svelte.js';
  import { whyLines } from '../regeln.js';
  import { backClose } from '../ui/backclose.js';
  import { t, nameOf } from '../i18n.svelte.js';

  let { item, reason, onclose } = $props();

  const setsQ = liveQuery(() => db.settings.get(SETS_KEY));
  const lines = $derived(whyLines(item, reason, { setsValue: $setsQ?.value ?? [], rainLimit: rainLimit() }));
  let dialog;
  $effect(() => {
    if (!dialog.open) dialog.showModal();
  });
  const go = () => dialog.close();
</script>

<dialog class="sheet from-below why" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="why-h" data-why-sheet>
  <div class="head">
    <div>
      <p class="kick">{t('Why is this on the list?')}</p>
      <h2 id="why-h">{nameOf(item)}</h2>
    </div>
    <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  {#if lines.length}
    <ul class="wl">
      {#each lines as l, i (i)}
        <li data-why-line>
          <b>{l.text}</b>
          <span>{l.rule}</span>
          <a class="tp-link" href={l.href} onclick={go}>{t(l.link)}<ArrowRight size={14} aria-hidden="true" /></a>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="none">{reason?.line ?? ''}</p>
  {/if}
  <p class="fine">{t('Everything is a suggestion: you can take the item out or change the rule.')}</p>
  <div class="foot">
    <a class="btn" href="#/me/regeln" onclick={go} data-why-all><ListChecks size={16} aria-hidden="true" />{t('All rules of the app')}</a>
    <button type="button" class="btn hi" onclick={() => dialog.close()}>{t('Done')}</button>
  </div>
</dialog>

<style>
  .why {
    width: min(480px, calc(100vw - 24px));
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 10px;
  }
  .kick {
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  h2 {
    margin: 2px 0 0;
    font-size: var(--fs-section);
    overflow-wrap: break-word;
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -6px -6px 0 0;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .wl {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .wl li {
    display: grid;
    gap: 2px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
    overflow-wrap: break-word;
  }
  .wl li:first-child {
    border-top: 0;
  }
  .wl span {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .wl a {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    font-size: var(--fs-small);
  }
  .none {
    margin: 0;
  }
  .fine {
    margin: 8px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .foot .btn {
    min-height: 44px;
    text-decoration: none;
  }
  @media (max-width: 719px) {
    .foot .btn.hi {
      flex: 1;
    }
  }
</style>
