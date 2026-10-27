<script>
  /**
   * Live Navigation M9 (Noah 26.10.2026): «Fahrt beenden» asks once, in the app's own window. It says what
   * happens: the ride is kept as «Live Navigation» in Touren and its km go to the bike (with Undo).
   * «Ride on» is the safe choice and has the focus. Escape, back, ✕ and a tap beside it mean «Ride on».
   * Props: km, movingS (the riding time so far), ondone('end' | null).
   */
  import { tick } from 'svelte';
  import { X, Square } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t, num } from '../i18n.svelte.js';
  import { durText } from './after.js';
  import '../ui/daumen.css';

  let { km = 0, movingS = 0, ondone } = $props();

  let dialog;
  let onBtn = $state();
  let answer = null;

  $effect(() => {
    dialog.showModal();
    tick().then(() => onBtn?.focus());
  });
  const pick = (a) => {
    answer = a;
    dialog.close();
  };
</script>

<dialog class="sheet from-below endride" bind:this={dialog} use:backClose onclose={() => ondone?.(answer)} aria-labelledby="endride-h" aria-describedby="endride-t" data-live-end-ask>
  <div class="head">
    <h2 id="endride-h">{t('End the ride?')}</h2>
    <button type="button" class="ib" aria-label={t('Close')} onclick={() => pick(null)}><X size={20} aria-hidden="true" /></button>
  </div>
  <p class="txt" id="endride-t">
    <b class="num">{num(Math.round((Number(km) || 0) * 10) / 10)} km · {durText(movingS)}</b><br />
    {t('The ride is saved in Trips as «Live Navigation» and its km go to your bike (with Undo).')}
  </p>
  <div class="foot daumen-foot">
    <button type="button" class="btn hi" onclick={() => pick('end')} data-live-end-yes><Square size={16} aria-hidden="true" />{t('End and save')}</button>
    <button type="button" class="btn" bind:this={onBtn} onclick={() => pick(null)} data-live-end-no>{t('Ride on')}</button>
  </div>
</dialog>

<style>
  .endride {
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
