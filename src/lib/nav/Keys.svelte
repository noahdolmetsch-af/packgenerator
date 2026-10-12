<script>
  /**
   * v0.76.0 «Fünf Orte» 1 (mockup orte-tastenkuerzel): the keyboard shortcuts, opened with «?» or from
   * Ich › Hilfe und Tastenkürzel. Letters work only when no field is active (App.svelte). The tabs
   * 1–4 come with release 2 (tabs per place); only what works is listed.
   */
  import { backClose } from '../ui/backclose.js';
  import { PLACES } from '../nav.js';
  import { t } from '../i18n.svelte.js';
  import { X, Lightbulb } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';

  let { open = $bindable(false) } = $props();
  let dialog = $state();
  $effect(() => {
    if (open && dialog && !dialog.open) dialog.showModal();
    if (!open && dialog?.open) dialog.close();
  });
  const close = () => (open = false);
  const ALL = [
    ['Search', '/'],
    ['New', 'n'],
    ['Me|place', 'i'],
    ['This help', '?'],
    ['Close, back', 'Esc'],
  ];
</script>

<!-- Design-Refresh P9 (I12, Noah 12.10.2026 «Runde 20 freigegeben»): the window look of the new style:
     title with a quiet line and ✕, «Places» and «Everywhere» as two soft panels with the keys right,
     the tip for a phone, «Close» bottom right. The same shortcuts as before. -->
<dialog class="sheet keys vdlg" bind:this={dialog} use:backClose onclose={() => (open = false)} onclick={(e) => e.target === dialog && close()} aria-labelledby="keys-h">
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="keys-h">{t('Keyboard shortcuts')}</h2>
      <p class="vd-sub">{t('Open with ?. Letters only when no field is active.')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={close}><X size={20} aria-hidden="true" /></button>
  </div>
  <div class="cols">
    <section aria-labelledby="keys-places">
      <h3 id="keys-places">{t('Places')}</h3>
      <dl class="vd-panel">
        {#each PLACES as p (p.key)}
          <div class="kr"><dt>{t(p.label)}</dt><dd><kbd>g</kbd> <kbd>{p.letter}</kbd></dd></div>
        {/each}
      </dl>
    </section>
    <section aria-labelledby="keys-all">
      <h3 id="keys-all">{t('Everywhere')}</h3>
      <dl class="vd-panel">
        {#each ALL as [name, key] (key)}
          <div class="kr"><dt>{t(name)}</dt><dd><kbd>{key}</kbd></dd></div>
        {/each}
      </dl>
    </section>
  </div>
  <p class="vd-note"><Lightbulb size={16} aria-hidden="true" /><span>{t('On a phone without a keyboard you need no shortcuts: the bar at the bottom and «+» on top do the same.')}</span></p>
  <div class="vd-foot">
    <button type="button" class="btn hi" onclick={close}>{t('Close')}</button>
  </div>
</dialog>

<style>
  .keys {
    width: min(640px, calc(100vw - 24px));
  }
  .cols {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--sp-3);
  }
  h3 {
    margin: 0 0 6px;
    color: var(--ink);
    font: 500 var(--fs-body) / 1.3 var(--font-body);
  }
  dl {
    margin: 0;
  }
  .kr {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-3);
    min-height: 48px;
  }
  .kr + .kr {
    border-top: 1px solid var(--line);
  }
  dd {
    margin: 0;
    white-space: nowrap;
  }
  kbd {
    display: inline-block;
    min-width: 26px;
    padding: 2px 6px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--paper);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    text-align: center;
  }
</style>
