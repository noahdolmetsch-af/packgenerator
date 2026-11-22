<script>
  /**
   * «Verbesserungs-Logbuch» (Noah 21.11.2026 «freigabe»): the window of one entry. A new one or a change: the kind in four
   * groups (Falsch, Verständlich, Aufbau, Neu), how urgent, one sentence, the page and the block it is about. A change also
   * sets the state and deletes. Nothing leaves the device. entry: the row, or null for a new one.
   * prefill: { page, block } for a new entry. onsave(values) / onremove() / onclose().
   * context: from the button «Verbessern» (step 2): { page, pageTitle, block, at, device, width } are known, so the window shows them
   * in a line («Wird mit gespeichert») instead of two fields; the block can be taken off with its ×.
   */
  import { keepTyped } from '../ui/keeptyped.js';
  import { backClose } from '../ui/backclose.js';
  import { GROUPS, routeOf } from './logbuch.js';
  import { artLabel, groupLabel, stateLabel, ROUTE_TEXT } from './words.js';
  import { t } from '../i18n.svelte.js';
  import SpeakButton from '../ui/SpeakButton.svelte';
  import { appendSpoken } from '../speak.js';
  import { locale } from '../i18n.svelte.js';
  import { X, Check, Trash2 } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';

  let { entry = null, prefill = {}, context = null, onsave, onremove = null, onclose } = $props();

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
  // svelte-ignore state_referenced_locally
  let keepBlock = $state(!!context?.block);
  let msg = $state('');
  const ctxLine = $derived(
    context
      ? [
          t('Page «{title}» ({address})', { title: context.pageTitle || context.page, address: context.page }),
          keepBlock && context.block ? t('Block «{name}»', { name: context.block }) : '',
          when,
          `${context.device === 'computer' ? t('Computer|logbuch') : t('Phone|logbuch')} (${context.width} px)`,
        ]
          .filter(Boolean)
          .join(' · ')
      : ''
  );
  const when = $derived(
    context?.at ? new Date(context.at).toLocaleString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
  );
  const route = $derived(art ? routeOf(art) : '');
  const STATE_CHOICES = ['open', 'draft', 'done'];

  function save(event) {
    event.preventDefault();
    if (!art) return (msg = t('Pick a kind first.'));
    if (!text.trim()) return (msg = t('Write one sentence about it.'));
    onsave?.(context ? { art, urgent, text, page: context.page, pageTitle: context.pageTitle, block: keepBlock ? context.block : '', state, photo: context.photo ?? null, photoNote: context.photoNote ?? null } : { art, urgent, text, page, block, state });
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
    {#if context && !entry}
      {#if context.block}
      <p class="lbs-chip">
        {#if keepBlock}
          <span class="chip" data-lb-block-chip>{t('Block: {name}', { name: context.block })}<button type="button" class="chip-x" aria-label={t('Take off the block')} onclick={() => (keepBlock = false)} data-lb-block-off><X size={14} aria-hidden="true" /></button></span>
        {:else}
          <span class="hint" data-lb-block-none>{t('Whole page, no block.')}</span>
        {/if}
      </p>
    {/if}
    {/if}
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
    <!-- Diktat: speak instead of type, where the browser can -->
    <div class="spk"><SpeakButton onsaid={(w) => (text = appendSpoken(text ?? '', w))} /></div>

    {#if art !== 'gutso'}
      <p class="lbl sym" id="lbs-urg">{t('How urgent?')}</p>
      <div class="lbs-chips" role="radiogroup" aria-labelledby="lbs-urg">
        <button type="button" class="fchip" role="radio" aria-checked={urgent === 'now'} data-urgent="now" onclick={() => (urgent = 'now')}>{t('Bothers me now')}</button>
        <button type="button" class="fchip" role="radio" aria-checked={urgent === 'later'} data-urgent="later" onclick={() => (urgent = 'later')}>{t('Sometime')}</button>
      </div>
    {/if}

    {#if context && !entry}
      <div class="lbs-photo" data-lb-photo-box>
        {#if context.photo}<img src={context.photo} alt={t('Photo of the page')} data-lb-photo /><span>{t('Photo of the page, the block in orange')}</span>{:else}<span data-lb-nophoto>{t('Photo not possible')}</span>{/if}
      </div>
      <p class="lbs-ctx" data-lb-context>
        <b>{t('Saved with it:')}</b>
        {ctxLine}
      </p>
    {:else}
    <div class="lbs-two">
      <label class="fld"><span class="lbl">{t('Page|logbuch')}</span><input class="inp" bind:value={page} autocomplete="off" maxlength="200" placeholder="#/flow/training" data-lb-page /></label>
      <label class="fld"><span class="lbl">{t('Block|logbuch')}</span><input class="inp" bind:value={block} autocomplete="off" maxlength="80" placeholder={t('e.g. the week card')} data-lb-block /></label>
    </div>
    {/if}

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
  .spk {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
  }
  .spk:not(:has(button)) {
    display: none;
  }
  .lbs-chip {
    margin: 12px 0 0;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px 4px 12px;
    border-radius: 999px;
    background: var(--improve-soft);
    color: var(--improve);
    font-weight: 600;
    font-size: var(--fs-small);
  }
  .chip-x {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    margin: -10px -6px -10px 0;
    border: 0;
    background: none;
    color: inherit;
    cursor: pointer;
  }
  .lbs-photo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lbs-photo img {
    width: 88px;
    max-height: 120px;
    object-fit: cover;
    object-position: top;
    border: 2px solid var(--improve);
    border-radius: 8px;
  }
  .lbs-ctx {
    margin: 12px 0 0;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
</style>
