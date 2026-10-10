<script>
  /**
   * v0.74.0 «Fünf Orte» 1 (mockup orte-tastenkuerzel): the keyboard shortcuts, opened with «?» or from
   * Ich › Hilfe und Tastenkürzel. Letters work only when no field is active (App.svelte). The tabs
   * 1–4 come with release 2 (tabs per place); only what works is listed.
   */
  import { backClose } from '../ui/backclose.js';
  import { PLACES } from '../nav.js';
  import { t } from '../i18n.svelte.js';
  import { Keyboard } from '@lucide/svelte';

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

<dialog class="sheet keys" bind:this={dialog} use:backClose onclose={() => (open = false)} onclick={(e) => e.target === dialog && close()} aria-labelledby="keys-h">
  <div class="kh">
    <span class="ki"><Keyboard size={22} aria-hidden="true" /></span>
    <div class="kt">
      <h2 id="keys-h">{t('Keyboard shortcuts')}</h2>
      <p>{t('Open with ?. Letters only when no field is active.')}</p>
    </div>
    <button type="button" class="btn sm" onclick={close}>{t('Close')}</button>
  </div>
  <div class="cols">
    <section aria-labelledby="keys-places">
      <h3 id="keys-places">{t('Places')}</h3>
      <dl>
        {#each PLACES as p (p.key)}
          <div class="kr"><dt>{t(p.label)}</dt><dd><kbd>g</kbd> <kbd>{p.letter}</kbd></dd></div>
        {/each}
      </dl>
    </section>
    <section aria-labelledby="keys-all">
      <h3 id="keys-all">{t('Everywhere')}</h3>
      <dl>
        {#each ALL as [name, key] (key)}
          <div class="kr"><dt>{t(name)}</dt><dd><kbd>{key}</kbd></dd></div>
        {/each}
      </dl>
    </section>
  </div>
</dialog>

<style>
  .keys {
    width: min(760px, calc(100vw - 24px));
  }
  .kh {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-3);
    margin-bottom: var(--sp-4);
  }
  .ki {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink);
  }
  .kt {
    flex: 1;
    min-width: 0;
  }
  h2 {
    margin: 0;
    font: 700 var(--fs-section) / 1.2 var(--font-body);
  }
  .kt p {
    margin: var(--sp-1) 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .cols {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: var(--sp-2) var(--sp-5);
  }
  h3 {
    margin: 0;
    padding-bottom: var(--sp-1);
    border-bottom: 1px solid var(--line);
    color: var(--ink-2);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  dl {
    margin: 0 0 var(--sp-3);
  }
  .kr {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-3);
    min-height: 40px;
    border-bottom: 1px solid var(--line);
  }
  dd {
    margin: 0;
    white-space: nowrap;
  }
  kbd {
    display: inline-block;
    min-width: 26px;
    padding: 2px 6px;
    border: 1px solid var(--line-strong);
    border-radius: 5px;
    box-shadow: 0 1px 0 var(--line-strong);
    background: var(--paper);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    text-align: center;
  }
</style>
