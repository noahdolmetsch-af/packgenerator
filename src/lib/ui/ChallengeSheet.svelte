<script>
  /**
   * v0.102.0 «Vorschlag und Challenge» (D1b, Noah «d1-d5 freigeben»): «Set as a challenge»: what, how
   * often, until when; it counts by itself from the ticks and becomes a milestone. Voluntary, changeable
   * any time: a running challenge can be changed or stopped here.
   *
   * open (bindable), what (shown word), times, until (YYYY-MM-DD), running (bool), onsave({ times, until }), onstop().
   */
  import { Trophy } from '@lucide/svelte';
  import { backClose } from './backclose.js';
  import { t } from '../i18n.svelte.js';

  let { open = $bindable(false), what = '', times = 10, until = '', min = '', running = false, onsave, onstop } = $props();
  let dialog = $state();
  let n = $state(10);
  let date = $state('');
  $effect(() => {
    if (open && dialog && !dialog.open) {
      n = times;
      date = until;
      dialog.showModal();
    }
    if (!open && dialog?.open) dialog.close();
  });
  function save(e) {
    e.preventDefault();
    onsave?.({ times: Math.max(1, Math.round(Number(n) || 1)), until: date || until });
    open = false;
  }
</script>

<dialog class="sheet chs" bind:this={dialog} use:backClose onclose={() => (open = false)} aria-labelledby="chs-h">
  <form onsubmit={save}>
    <h2 id="chs-h" class="title">{running ? t('Your challenge') : t('Set as a challenge')}</h2>
    <p class="muted">{t('Voluntary, changeable any time.')}</p>
    <label><span class="lbl">{t('What')}</span><input class="inp" type="text" value={what} readonly /></label>
    <div class="two">
      <label><span class="lbl">{t('How often')}</span><input class="inp num" type="number" inputmode="numeric" min="1" max="365" bind:value={n} /></label>
      <label><span class="lbl">{t('Until when')}</span><input class="inp" type="date" {min} bind:value={date} /></label>
    </div>
    <p class="cnt">{t('Counts by itself when you tick «{what}» on the tile.', { what })}</p>
    <p class="ms"><span class="ic" aria-hidden="true"><Trophy size={16} /></span><span>{t('Becomes a milestone when you reach it.')}</span></p>
    <div class="acts">
      <button type="submit" class="btn hi">{running ? t('Save') : t('Start challenge')}</button>
      {#if running}<button type="button" class="btn" onclick={() => (onstop?.(), (open = false))}>{t('Stop challenge')}</button>{/if}
      <button type="button" class="btn btn-link" onclick={() => (open = false)}>{t('Cancel')}</button>
    </div>
  </form>
</dialog>

<style>
  form {
    display: grid;
    gap: 12px;
  }
  h2,
  p {
    margin: 0;
  }
  label {
    display: grid;
    gap: 4px;
  }
  .two {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .cnt {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ms {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
    font-size: var(--fs-small);
  }
  .ic {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
