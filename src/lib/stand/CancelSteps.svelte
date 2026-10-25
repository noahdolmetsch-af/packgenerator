<script>
  /**
   * Paket A part 2, UC-259-I2 «Kündigung ist ein Vorgang»: in the contract window, the cancellation as three
   * steps, each with its own day: written, sent by me, end confirmed. A note keeps the proof. Only «End
   * confirmed» stops the contract; until then the reminder stays. edit is the window's contract (bindable).
   */
  import { Check } from '@lucide/svelte';
  import { t, dateOf } from '../i18n.svelte.js';
  import { CANCEL_STEPS, cancelOf, cancelStep } from './stand.js';

  let { edit = $bindable(), today } = $props();
  const k = $derived(cancelOf(edit.cancel) ?? {});
</script>

<fieldset class="cs" data-cancel-steps>
  <legend class="fz-lab">{t('Cancelling')}</legend>
  <div class="steps">
    {#each CANCEL_STEPS as s (s.key)}
      <button type="button" class="st" aria-pressed={!!k[s.key]} onclick={() => (edit = cancelStep(edit, s.key, today))} data-cancel-step={s.key}>
        <span class="box" aria-hidden="true">{#if k[s.key]}<Check size={14} />{/if}</span>
        <span><b>{t(s.name)}</b>{#if k[s.key]}<small>{dateOf(k[s.key])}</small>{/if}</span>
      </button>
    {/each}
  </div>
  <input class="inp" maxlength="200" value={k.proof ?? ''} onchange={(e) => (edit = { ...edit, cancel: cancelOf({ ...k, proof: e.currentTarget.value }) })} placeholder={t('Proof, e.g. registered letter number')} aria-label={t('Proof of the cancellation')} data-cancel-proof />
  <p class="hint">{k.sent && !k.confirmed ? t('Sent, but not confirmed yet: the reminder stays until the end is confirmed.') : t('Only «End confirmed» stops the contract.')}</p>
</fieldset>

<style>
  .cs {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  .steps {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .st {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 4px 12px;
    border: 1.5px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .st small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .box {
    display: grid;
    flex: none;
    place-items: center;
    width: 20px;
    height: 20px;
    border: 1.5px solid var(--ink-3);
    border-radius: 6px;
  }
  .st[aria-pressed='true'] .box {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--paper);
  }
  .hint {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
