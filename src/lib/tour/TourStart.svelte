<script>
  /**
   * «Rundgang» (Noah 15.10.2026 12:36 «2»: in the playground with the example trip, also possible with your
   * own data): the small choice before the tour starts. Opens on the event 'pg:tour-ask' (askTour in run.js).
   * Back or «Cancel» closes it; nothing starts.
   */
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import { ASK_EVENT, startTour } from './run.js';
  import { TOUR_NAMES, stepCount } from '../tour.js';
  import '../bikes/velo-dlg.css';

  let ask = $state(null);
  let dialog = $state();
  let busy = $state(false);
  $effect(() => {
    const on = (e) => ((ask = e.detail?.id ?? 'app'), (busy = false));
    window.addEventListener(ASK_EVENT, on);
    return () => window.removeEventListener(ASK_EVENT, on);
  });
  $effect(() => {
    if (ask && dialog && !dialog.open) dialog.showModal();
  });
  async function go(play) {
    busy = true;
    const id = ask;
    dialog?.close();
    await startTour(id, { play });
  }
</script>

{#if ask}
  <dialog class="sheet vdlg tourstart" bind:this={dialog} use:backClose onclose={() => (ask = null)} aria-labelledby="ts-h">
    <div class="vd-head">
      <div class="vd-t">
        <h2 id="ts-h">{t(TOUR_NAMES[ask])}</h2>
        <p class="vd-sub">{t('{n} short steps, about 2 minutes', { n: stepCount(ask) })}</p>
      </div>
    </div>
    <p class="lead">{t('Each step lights up one part of a page and says what it is for. You only watch and tap «Next».')}</p>
    <div class="opts">
      <button type="button" class="opt" disabled={busy} onclick={() => go(true)} data-choice="play">
        <b>{t('With an example trip')}</b>
        <small>{t('In the playground: full pages, your data stays untouched.')}</small>
      </button>
      <button type="button" class="opt" disabled={busy} onclick={() => go(false)} data-choice="own">
        <b>{t('With my own data')}</b>
        <small>{t('Shows your own pages. Nothing is changed.')}</small>
      </button>
    </div>
    <div class="vd-foot">
      <button type="button" class="btn" onclick={() => dialog?.close()}>{t('Cancel')}</button>
    </div>
  </dialog>
{/if}

<style>
  .lead {
    margin: 0 0 12px;
    color: var(--ink-2);
  }
  .opts {
    display: grid;
    gap: 10px;
  }
  .opt {
    display: grid;
    gap: 2px;
    text-align: left;
    padding: 12px 14px;
    border: 1px solid var(--line-strong);
    border-radius: 14px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .opt:hover,
  .opt:focus-visible {
    border-color: var(--hi);
  }
  .opt small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .vd-foot {
    display: flex;
    justify-content: flex-end;
    margin-top: 14px;
  }
</style>
