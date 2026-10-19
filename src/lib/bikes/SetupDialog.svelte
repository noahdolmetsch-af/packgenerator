<script>
  /**
   * Taschen-Setups (TS1): the small windows of the setup list.
   *  - kind 'new':    a name and what it starts from (a copy of one setup, or empty bags)
   *  - kind 'tobike': «Auf anderes Velo kopieren», the other bike and the name there
   *  - kind 'delete': the one question before deleting (then 4 s «Rückgängig»)
   *  - kind 'fromtrip': only a name, to save a trip's bags as a new setup (TS5)
   * setups: the bike's setups ({ id, name }); setup: the setup it is about; bikes: the other bikes.
   * onsave({ name, from, bikeId }) does the write; the window closes itself.
   */
  import { backClose } from '../ui/backclose.js';
  import { X } from '@lucide/svelte';
  import './velo-dlg.css';
  import { t } from '../i18n.svelte.js';

  let { kind = 'new', setups = [], setup = null, bikes = [], name: start = '', onsave, onclose } = $props();

  // svelte-ignore state_referenced_locally
  let name = $state(start);
  // svelte-ignore state_referenced_locally
  let from = $state(setup?.id ?? setups[0]?.id ?? '');
  // svelte-ignore state_referenced_locally
  let bikeId = $state(bikes[0]?.id ?? '');
  let error = $state('');
  let dialog;
  $effect(() => {
    dialog.showModal();
  });
  const title = $derived(kind === 'delete' ? t('Delete setup «{name}»?', { name: setup?.name ?? '' }) : kind === 'tobike' ? t('Copy to another bike') : kind === 'fromtrip' ? t('Save as a new setup') : t('New setup'));

  function save(event) {
    event.preventDefault();
    if (kind !== 'delete' && !name.trim()) {
      error = t('Give the setup a name.');
      return;
    }
    onsave?.({ name: name.trim(), from, bikeId });
    dialog.close();
  }
</script>

<dialog class="sheet vdlg sdlg" bind:this={dialog} use:backClose {onclose} aria-labelledby="sd-h">
  <form onsubmit={save} novalidate>
    <div class="vd-head">
      <div class="vd-t">
        <h2 id="sd-h">{title}</h2>
        <p class="vd-sub meta">
          {kind === 'delete' ? t('Trips that used it show «Standard» afterwards. You can undo it for 4 seconds.') : kind === 'tobike' ? t('Places the other bike does not have keep their things «without a bag».') : kind === 'fromtrip' ? t('The bags of this trip and what is in each of them. The trip then uses the new setup.') : t('Which bags are on the bike and what goes in which bag.')}
        </p>
      </div>
      <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={18} aria-hidden="true" /></button>
    </div>
    {#if kind !== 'delete'}
      <div class="fields">
        {#if kind === 'tobike'}
          <label><span class="lbl">{t('Bike')}</span><select class="sel" bind:value={bikeId}>{#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}</select></label>
        {/if}
        <label><span class="lbl">{t('Name')}</span><input class="inp" bind:value={name} maxlength="60" placeholder={t('e.g. Bikepacking 3 days')} /></label>
        {#if kind === 'new'}
          <label>
            <span class="lbl">{t('Starts from')}</span>
            <select class="sel" bind:value={from}>
              {#each setups as s (s.id)}<option value={s.id}>{t('Copy of «{name}»', { name: s.name })}</option>{/each}
              <option value="">{t('Empty: no bags yet')}</option>
            </select>
          </label>
        {/if}
      </div>
    {/if}
    <p class="err" role="alert">{error}</p>
    <div class="vd-foot">
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi" class:del={kind === 'delete'}>{kind === 'delete' ? t('Delete') : kind === 'tobike' ? t('Copy') : kind === 'fromtrip' ? t('Save') : t('Create')}</button>
    </div>
  </form>
</dialog>

<style>
  .sdlg {
    width: min(480px, calc(100vw - 24px));
  }
  .fields {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .err:empty {
    display: none;
  }
  .err {
    color: var(--bad);
    margin: 8px 0 0;
  }
</style>
