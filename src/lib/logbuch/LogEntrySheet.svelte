<script>
  /**
   * «Verbesserungs-Logbuch» (Noah 21.11.2026 «freigabe»): the window of one entry. A new one or a change: the kind in four
   * groups (Falsch, Verständlich, Aufbau, Neu), how urgent, one sentence, the page and the block it is about. A change also
   * sets the state and deletes. Nothing leaves the device. entry: the row, or null for a new one.
   * prefill: { page, block } for a new entry. onsave(values) / onremove() / onclose().
   */
  import { keepTyped } from '../ui/keeptyped.js';
  import { backClose } from '../ui/backclose.js';
  import { GROUPS, routeOf } from './logbuch.js';
  import { artLabel, groupLabel, stateLabel, ROUTE_TEXT } from './words.js';
  import { t } from '../i18n.svelte.js';
  import { X, Check, Trash2 } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';

  let { entry = null, prefill = {}, onsave, onremove = null, onclose } = $props();

  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  // svelte-ignore state_referenced_locally
  let art = $state(entry?.art ?? '');
  // svelte-ignore state_referenced_locally
  let urgent = $state(entry?.urgent ?? 'later');
  // svelte-ignore state_referenced_locally
  let text = $state(entry?.text ?? '');
  // svelte-ignore state_referenced_locally
  let page = $state(entry?.page ?? prefill.page ?? '');
  // svelte-ignore state_referenced_locally
  let block = $state(entry?.block ?? prefill.block ?? '');
  // svelte-ignore state_referenced_locally
  let state = $state(entry?.state ?? 'open');
  let msg = $state('');
  const route = $derived(art ? routeOf(art) : '');
  const STATE_CHOICES = ['open', 'draft', 'done'];

  function save(event) {
    event.preventDefault();
    if (!art) return (msg = t('Pick a kind first.'));
    if (!text.trim()) return (msg = t('Write one sentence about it.'));
    onsave?.({ art, urgent, text, page, block, state });
    dialog.close();
  }
  function remove() {
    onremove?.();
    dialog.close();
  }
</script>

<dialog use:keepTyped={'logbuch:' + (entry?.id ?? 'new')} class="sheet vdlg lbs" bind:this={dialog} use:backClose {onclose} aria-labelledby="lbs-h" data-logbuch-sheet>
  <div class="vd-head">
    <div class="vd-t"><h2 id="lbs-h">{entry ? t('Change the entry') : t('What should be better?')}</h2></div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  <form onsubmit={save}>
    <div class="lbs-groups" role="radiogroup" aria-label={t('Kind|logbuch')}>
      {#each GROUPS as g (g.key)}
        <div class="lbs-g">
          <p class="lbl">{groupLabel(g.key)}</p>
          <div class="lbs-chips">
            {#each g.arts as a (a)}
              <button type="button" class="fchip" role="radio" aria-checked={art === a} data-art={a} onclick={() => (art = a)}>{artLabel(a)}</button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
    {#if route}<p class="hint" data-lb-route>{ROUTE_TEXT[route]()}</p>{/if}

    <label class="fld"><span class="lbl">{t('What is it?|logbuch')}</span><textarea class="inp" rows="3" maxlength="1000" bind:value={text} data-lb-text></textarea></label>

    {#if art !== 'gutso'}
      <p class="lbl sym" id="lbs-urg">{t('How urgent?')}</p>
      <div class="lbs-chips" role="radiogroup" aria-labelledby="lbs-urg">
        <button type="button" class="fchip" role="radio" aria-checked={urgent === 'now'} data-urgent="now" onclick={() => (urgent = 'now')}>{t('Bothers me now')}</button>
        <button type="button" class="fchip" role="radio" aria-checked={urgent === 'later'} data-urgent="later" onclick={() => (urgent = 'later')}>{t('Sometime')}</button>
      </div>
    {/if}

    <div class="lbs-two">
      <label class="fld"><span class="lbl">{t('Page|logbuch')}</span><input class="inp" bind:value={page} autocomplete="off" maxlength="200" placeholder="#/flow/training" data-lb-page /></label>
      <label class="fld"><span class="lbl">{t('Block|logbuch')}</span><input class="inp" bind:value={block} autocomplete="off" maxlength="80" placeholder={t('e.g. the week card')} data-lb-block /></label>
    </div>

    {#if entry && art !== 'gutso'}
      <p class="lbl sym" id="lbs-state">{t('State|logbuch')}</p>
      <div class="lbs-chips" role="radiogroup" aria-labelledby="lbs-state">
        {#each STATE_CHOICES as s (s)}
          <button type="button" class="fchip" role="radio" aria-checked={state === s} data-state={s} onclick={() => (state = s)}>{stateLabel(s)}</button>
        {/each}
      </div>
    {/if}
    {#if msg}<p class="msg" role="alert">{msg}</p>{/if}

    <div class="vd-foot">
      {#if entry && onremove}<button type="button" class="btn del" onclick={remove} data-lb-remove><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>{/if}
      <button type="submit" class="btn hi" data-lb-save><Check size={16} aria-hidden="true" />{t('Save')}</button>
    </div>
    <p class="hint">{t('Stays on this device and goes into your backup. Nothing is sent.')}</p>
  </form>
</dialog>

<style>
  .fld {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 12px;
  }
  .sym {
    margin: 14px 0 6px;
  }
  .lbs-g {
    margin-top: 8px;
  }
  .lbs-g .lbl {
    margin: 0 0 4px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .lbs-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .lbs-two {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 8px;
  }
  .fchip {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 4px 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .fchip[aria-checked='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
    font-weight: 600;
  }
  .hint {
    margin: 8px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .msg {
    margin: 10px 0 0;
    font-size: var(--fs-small);
    color: var(--bad);
  }
  .del {
    color: var(--bad);
  }
</style>
