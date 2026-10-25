<script>
  /**
   * Paket A part 1, UC-255-I1: in the to-do window, «Waiting for something?». A choice takes the to-do out of
   * «Overdue» and puts it under «Waiting» with the reason and the day to check again (3 days, changeable).
   * wait: { on, note, check } | null, bound by TodoSheet.
   */
  import { Hourglass } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import DateInput from '../ui/DateInput.svelte';
  import { WAIT_ON, newWait } from './stand.js';

  let { wait = $bindable(null), today } = $props();
  const pick = (on) => (wait = on ? (wait ? { ...wait, on } : newWait(on, today)) : null);
</script>

<fieldset class="fld wp" data-wait-pick>
  <legend class="lbl"><Hourglass size={16} aria-hidden="true" />{t('Waiting for something?')}</legend>
  <div class="chips">
    <button type="button" class="chip" aria-pressed={!wait} onclick={() => pick(null)}>{t('No')}</button>
    {#each WAIT_ON as w (w.key)}<button type="button" class="chip" aria-pressed={wait?.on === w.key} onclick={() => pick(w.key)} data-wait-on={w.key}>{t(w.name)}</button>{/each}
  </div>
  {#if wait}
    <div class="wrow">
      <input class="inp" type="text" maxlength="120" value={wait.note ?? ''} oninput={(e) => (wait = { ...wait, note: e.currentTarget.value })} placeholder={t('On what, e.g. «Offer from the shop»')} aria-label={t('On what')} data-wait-note />
      <label class="chk"><span>{t('Check again on')}</span><span class="dt"><DateInput class="inp" value={wait.check ?? ''} min={today} onchange={(v) => (wait = { ...wait, check: v || null })} aria-label={t('Check again on')} /></span></label>
    </div>
    <p class="hint">{t('It leaves «Overdue» and waits under «Waiting» until that day.')}</p>
  {/if}
</fieldset>

<style>
  .fld {
    display: block;
    margin: 14px 0 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  .lbl {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    padding: 0;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 14px;
    border: 1.5px solid var(--line);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .hint {
    margin: 6px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .wrow {
    display: grid;
    gap: 8px;
    margin-top: 8px;
  }
  .chk {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    font-size: var(--fs-small);
  }
  .dt {
    min-width: 170px;
  }
</style>
