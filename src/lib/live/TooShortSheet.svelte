<script>
  /**
   * Noah 28.10.2026 «nicht speichern, klar melden, kann zu testzwecken umgangen werden (trotzdem speichern)»:
   * a ride with fewer than 2 GPS points is not kept, and this window says so clearly, with what to do next
   * time. «Save anyway» keeps it in Trips all the same (for tests); only when there was at least one point.
   * «OK» is the safe choice and has the focus. Escape, back, ✕ and a tap beside it mean «OK».
   * Props: points (the GPS points the ride had), ondone('save' | null).
   */
  import { tick } from 'svelte';
  import { X, Save } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t, num } from '../i18n.svelte.js';
  import '../ui/daumen.css';

  let { points = 0, ondone } = $props();

  let dialog;
  let okBtn = $state();
  let answer = null;

  $effect(() => {
    dialog.showModal();
    tick().then(() => okBtn?.focus());
  });
  const pick = (a) => {
    answer = a;
    dialog.close();
  };
</script>

<dialog class="sheet from-below tooshort" bind:this={dialog} use:backClose onclose={() => ondone?.(answer)} aria-labelledby="tooshort-h" aria-describedby="tooshort-t" data-live-too-short-ask>
  <div class="head">
    <h2 id="tooshort-h">{t('Not saved')}</h2>
    <button type="button" class="ib" aria-label={t('Close')} onclick={() => pick(null)}><X size={20} aria-hidden="true" /></button>
  </div>
  <p class="txt" id="tooshort-t">
    <b class="num">{t('Too few GPS points ({n}).', { n: num(points) })}</b><br />
    {t('A ride needs at least 2 GPS points. Tip: start outside and wait until the dot on the map is blue.')}
  </p>
  {#if points > 0}<p class="note">{t('«Save anyway» keeps it in Trips all the same, for example to try the app.')}</p>{/if}
  <div class="foot daumen-foot">
    <button type="button" class="btn hi" bind:this={okBtn} onclick={() => pick(null)} data-live-too-short-ok>{t('OK')}</button>
    {#if points > 0}<button type="button" class="btn" onclick={() => pick('save')} data-live-too-short-save><Save size={16} aria-hidden="true" />{t('Save anyway')}</button>{/if}
  </div>
</dialog>

<style>
  .tooshort {
    width: min(460px, calc(100vw - 24px));
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  h2 {
    margin: 2px 0 0;
    font-size: var(--fs-section);
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
  .txt {
    margin: 8px 0 0;
    line-height: 1.45;
    color: var(--ink-2);
  }
  .txt b {
    color: var(--ink);
    font-size: var(--fs-sub);
  }
  .note {
    margin: 10px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .foot .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  @media (max-width: 719px) {
    .foot .btn {
      flex: 1 1 auto;
      justify-content: center;
    }
  }
</style>
