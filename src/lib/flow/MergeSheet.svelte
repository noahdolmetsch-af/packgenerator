<script>
  /**
   * «Sportarten zusammenlegen» (Noah 21.11.2026 «Ja, bauen», Sportjahr S8): the window that joins two sports into one. It says
   * which sport goes into which, how much moves over (ticks, details, timer templates, Strava sports) and what stays (the name,
   * the goals and the group of the sport that remains). After «Merge» the caller offers Undo (zusammen.js mergeActs/undoMerge).
   *
   * from: the sport that goes; targets: [{ id, name }] the sports it can go into; into: the one chosen first;
   * counts: { log, sessions, templates, strava } of the sport that goes; onconfirm(intoId).
   */
  import { backClose } from '../ui/backclose.js';
  import { t, tn } from '../i18n.svelte.js';
  import { X, Merge } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';

  let { fromName, targets = [], into = '', counts = null, onconfirm, onclose } = $props();

  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  let to = $state(into || targets[0]?.id || '');
  const target = $derived(targets.find((x) => x.id === to));

  function confirm() {
    if (!to) return;
    onconfirm?.(to);
    dialog.close();
  }
</script>

<dialog class="sheet vdlg mrg" bind:this={dialog} use:backClose {onclose} aria-labelledby="mrg-h" data-merge-sheet>
  <div class="vd-head">
    <div class="vd-t"><h2 id="mrg-h">{t('Merge «{name}» into another sport', { name: fromName })}</h2></div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  {#if targets.length}
    <fieldset class="where">
      <legend class="lbl">{t('Which sport stays?')}</legend>
      {#each targets as g (g.id)}
        <label class="opt">
          <input type="radio" name="mrg-to" value={g.id} bind:group={to} data-merge-to={g.id} />
          <span><b>{g.name}</b></span>
        </label>
      {/each}
    </fieldset>
    {#if counts}
      <p class="hint" data-merge-counts>
        {#if counts.log || counts.sessions || counts.templates}
          {t('{ticks} and everything saved with them go over to «{into}».', { ticks: tn(counts.log, '{n} tick', '{n} ticks'), into: target?.name ?? '' })}
        {:else}
          {t('«{name}» has no ticks yet, so only the sport itself goes.', { name: fromName })}
        {/if}
        {#if counts.strava}{' '}{t('Strava sports that counted for «{name}» count for «{into}» from now on.', { name: fromName, into: target?.name ?? '' })}{/if}
      </p>
    {/if}
    <p class="hint">{t('«{into}» keeps its name, its goals and its group. «{name}» leaves the lists.', { into: target?.name ?? '', name: fromName })}</p>
    <p class="hint">{t('You can undo this for a few seconds.')}</p>
  {:else}
    <p class="hint">{t('There is no other sport to merge with.')}</p>
  {/if}

  <div class="vd-foot">
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
    <button type="button" class="btn hi" onclick={confirm} disabled={!to} data-merge-go><Merge size={16} aria-hidden="true" />{t('Merge|sports')}</button>
  </div>
</dialog>

<style>
  .where {
    margin: 0;
    padding: 0;
    border: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 50vh;
    overflow-y: auto;
  }
  .where legend {
    margin: 0 0 6px;
    padding: 0;
  }
  .opt {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    padding: 6px 12px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    cursor: pointer;
  }
  .opt:has(input:checked) {
    border: 2px solid var(--ink);
    background: var(--paper-2);
  }
  .opt input {
    width: 20px;
    height: 20px;
    margin: 0;
    accent-color: var(--ink);
  }
  .opt b {
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .hint {
    margin: 10px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
