<script>
  /**
   * «Inspiration» UC2-2 «Aus der Notiz wird …» (mockup UC2-2-notiz-wird, answers 4a and 5a): a card's
   * note becomes a packing rule, a wishlist item or a note. A window on a computer, a sheet from below
   * on a phone. The packing rule shows how it looks while packing («So sieht es beim Packen aus»).
   * link: the card's link; text: its note; make: the choice to start with ('rule' | 'wish' | 'note').
   */
  import { backClose } from '../ui/backclose.js';
  import { X, Quote } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';
  import { MAKES, sourceOf } from '../inspiration.js';
  import { t } from '../i18n.svelte.js';
  import InspoHint from './InspoHint.svelte';

  let { link, text = '', make = 'rule', onmake, onclose } = $props();

  // svelte-ignore state_referenced_locally
  let choice = $state(MAKES.some((m) => m.key === make) ? make : 'rule');
  // svelte-ignore state_referenced_locally
  let words = $state(`${text ?? ''}`.trim() || link.title);
  let editing = $state(false);
  let busy = $state(false);
  let error = $state('');
  let dialog;
  $effect(() => {
    dialog.showModal();
  });

  async function take(event) {
    event.preventDefault();
    if (!words.trim()) return (error = t('Write what you take over.'));
    busy = true;
    try {
      await onmake?.(choice, words.trim());
      dialog.close();
    } catch (err) {
      error = err?.message || t('This could not be saved.');
    } finally {
      busy = false;
    }
  }
</script>

<dialog class="sheet vdlg from-below td" class:td-wide={choice === 'rule'} bind:this={dialog} use:backClose {onclose} aria-labelledby="td-h">
  <form class="td-cols" onsubmit={take} novalidate>
    <div class="td-main">
      <div class="vd-head">
        <div class="vd-t"><h2 id="td-h">{t('The note becomes …')}</h2></div>
        <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={18} aria-hidden="true" /></button>
      </div>
      <div class="td-quote">
        <span class="td-q" aria-hidden="true"><Quote size={14} /></span>
        <p>«{words}»<small>{t('your note on «{title}»', { title: link.title })}</small></p>
      </div>
      <fieldset class="td-opts">
        <legend class="sr">{t('The note becomes …')}</legend>
        {#each MAKES as m (m.key)}
          <label class="td-opt" class:on={choice === m.key}>
            <input type="radio" name="td-make" value={m.key} bind:group={choice} />
            <span class="td-m"><b>{t(m.name)}</b><small>{t(m.text)}</small></span>
          </label>
          {#if choice === m.key}
            <div class="td-prev">
              {#if m.key === 'rule'}<b>{t('While packing: {rule}', { rule: words })}</b>
              {:else if m.key === 'wish'}<b>{t('Wishlist: {name}', { name: words })}</b>
              {:else}<b>{t('Notes: {text}', { text: words })}</b>{/if}
              <small>{t('Source: {source}', { source: sourceOf(link) })}</small>
              {#if editing}
                <label class="td-edit"><span class="lbl">{t('Text')}</span><textarea class="inp" rows="2" bind:value={words}></textarea></label>
              {:else}
                <button type="button" class="btn btn-link td-chg" onclick={() => (editing = true)}>{t('Change text')}</button>
              {/if}
            </div>
          {/if}
        {/each}
      </fieldset>
      <p class="td-err" role="alert">{error}</p>
      <div class="vd-foot">
        <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
        <button type="submit" class="btn hi" disabled={busy}>{t('Take over')}</button>
      </div>
      <p class="td-note">{t('Only a suggestion: change or delete it any time.')}</p>
    </div>
    {#if choice === 'rule'}
      <aside class="td-side" aria-labelledby="td-ph">
        <h3 id="td-ph">{t('How it looks while packing')}</h3>
        <div class="td-sheet" aria-hidden="true">
          <span class="td-line w70"></span>
          <span class="td-line w90"></span>
          <span class="td-line w60"></span>
          <span class="td-line w80"></span>
        </div>
        <InspoHint rule={words} url={link.url} title={link.title} preview />
      </aside>
    {/if}
  </form>
</dialog>

<style>
  dialog.td.td-wide {
    width: min(980px, calc(100vw - 24px));
  }
  .td-cols {
    display: grid;
    gap: 20px;
  }
  .td-wide .td-cols {
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
  }
  .td-quote {
    display: flex;
    gap: 8px;
    margin: 0 0 12px;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--paper-2);
  }
  .td-quote p {
    margin: 0;
    overflow-wrap: break-word;
  }
  .td-quote small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .td-q {
    flex: none;
    color: var(--ink-3);
    padding-top: 3px;
  }
  .td-opts {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    border: 0;
  }
  .td-opt {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 8px 14px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper);
    cursor: pointer;
  }
  .td-opt.on {
    border: 2px solid var(--hi);
  }
  .td-opt input {
    flex: none;
    width: 20px;
    height: 20px;
    accent-color: var(--hi);
  }
  .td-m {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .td-m small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .td-prev {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: -4px 0 4px 46px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    overflow-wrap: break-word;
  }
  .td-prev b {
    font-weight: 500;
  }
  .td-prev small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .td-chg {
    align-self: flex-start;
    padding-inline: 0;
    color: var(--hi);
  }
  .td-edit {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 6px;
  }
  .td-edit textarea {
    resize: vertical;
    font: inherit;
  }
  .td-err:empty {
    display: none;
  }
  .td-err {
    margin: 8px 0 0;
    color: var(--bad);
  }
  .td-note {
    margin: 12px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .td-side {
    align-self: start;
    display: grid;
    gap: 12px;
    padding: 14px;
    border-radius: 16px;
    background: var(--paper-2);
  }
  .td-side h3 {
    margin: 0;
    color: var(--ink-2);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .td-sheet {
    display: grid;
    gap: 10px;
    padding: 14px;
    border-radius: 12px;
    background: var(--paper);
  }
  .td-line {
    display: block;
    height: 10px;
    border-radius: 5px;
    background: var(--line);
  }
  .w60 {
    width: 60%;
  }
  .w70 {
    width: 70%;
  }
  .w80 {
    width: 80%;
  }
  .w90 {
    width: 90%;
  }
  @media (max-width: 719px) {
    .td-wide .td-cols {
      grid-template-columns: minmax(0, 1fr);
    }
    .td-prev {
      margin-left: 0;
    }
  }
</style>
