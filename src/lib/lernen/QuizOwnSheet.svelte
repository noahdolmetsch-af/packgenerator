<script>
  /**
   * Paket M «Quiz am Vorabend»: add or change a question of your own (rule 18). The question and the right
   * answer are needed; 1–3 wrong answers are optional (without any it is a «Weisst du's?» card). «Immer
   * fragen» puts it into every quiz. From below on a phone, a small window on a computer (velo-dlg.css).
   */
  import { X, Check } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { keepTyped } from '../ui/keeptyped.js';
  import { t } from '../i18n.svelte.js';
  import '../bikes/velo-dlg.css';

  let { question = null, onsave, onclose } = $props();
  let dialog;
  // svelte-ignore state_referenced_locally
  const start = question ?? { text: '', right: '', wrong: [], pin: false };
  let text = $state(start.text);
  let right = $state(start.right);
  let w1 = $state(start.wrong[0] ?? '');
  let w2 = $state(start.wrong[1] ?? '');
  let w3 = $state(start.wrong[2] ?? '');
  let pin = $state(!!start.pin);
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const ok = $derived(!!text.trim() && !!right.trim());
  function save() {
    if (!ok) return;
    onsave?.({ ...(question ?? {}), text: text.trim(), right: right.trim(), wrong: [w1, w2, w3].map((x) => x.trim()).filter(Boolean), pin });
    dialog.close();
  }
</script>

<dialog use:keepTyped={'quiz:' + (question?.id ?? 'new')} class="sheet vdlg from-below" bind:this={dialog} use:backClose {onclose} aria-labelledby="qo-h" data-quiz-sheet>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="qo-h">{question ? t('Change your question') : t('Add a question')}</h2>
      <p class="vd-sub">{t('Without wrong answers it becomes a «Know it?» card: you see the answer and say if you knew it.')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  <label class="fld"><span class="lbl">{t('Question|quiz')}</span><input class="inp" type="text" maxlength="200" bind:value={text} placeholder={t('e.g. Where is the spare tube?')} data-qo-text /></label>
  <label class="fld"><span class="lbl">{t('Right answer')}</span><input class="inp" type="text" maxlength="200" bind:value={right} placeholder={t('e.g. Frame bag')} data-qo-right /></label>
  <fieldset class="fld wr">
    <legend class="lbl">{t('Wrong answers (optional, up to 3)')}</legend>
    <input class="inp" type="text" maxlength="200" bind:value={w1} aria-label={t('Wrong answer {n}', { n: 1 })} data-qo-wrong="1" />
    <input class="inp" type="text" maxlength="200" bind:value={w2} aria-label={t('Wrong answer {n}', { n: 2 })} data-qo-wrong="2" />
    <input class="inp" type="text" maxlength="200" bind:value={w3} aria-label={t('Wrong answer {n}', { n: 3 })} data-qo-wrong="3" />
  </fieldset>
  <label class="optrow">
    <span class="m"><b>{t('Always ask|quiz')}</b><small>{t('comes in every quiz; otherwise it takes part in the draw')}</small></span>
    <input type="checkbox" role="switch" bind:checked={pin} data-qo-pin />
  </label>

  <div class="vd-foot">
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
    <button type="button" class="btn hi" onclick={save} disabled={!ok} data-qo-save><Check size={16} aria-hidden="true" />{t('Save')}</button>
  </div>
</dialog>

<style>
  .fld {
    display: grid;
    gap: 6px;
    margin: 0 0 14px;
    min-width: 0;
  }
  .fld .inp {
    min-height: 44px;
    box-sizing: border-box;
    min-width: 0;
  }
  fieldset.fld {
    padding: 0;
    border: 0;
  }
  .optrow {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 48px;
    margin: 0 0 8px;
    cursor: pointer;
  }
  .optrow .m {
    display: grid;
    flex: 1;
    min-width: 0;
    gap: 2px;
  }
  .optrow small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  /* the app's switch (as on «Gepackt», Between.svelte) */
  .optrow input[role='switch'] {
    flex: none;
    width: 52px;
    height: 30px;
    margin: 0;
    appearance: none;
    border-radius: 99px;
    background: var(--line-strong);
    position: relative;
    cursor: pointer;
  }
  .optrow input[role='switch']::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--paper);
    transition: transform 0.15s;
  }
  .optrow input[role='switch']:checked {
    background: var(--accent);
  }
  .optrow input[role='switch']:checked::after {
    transform: translateX(22px);
  }
  .optrow input[role='switch']:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
</style>
