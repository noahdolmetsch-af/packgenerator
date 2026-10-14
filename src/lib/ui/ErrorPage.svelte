<script>
  /**
   * v0.127.0 A-U2 «Leer, Laden, Fehler: überall gleich» (mockup A-U2 «Fehlerseite», Noah 13.10.2026
   * «A-U1–A-U5 freigeben»): when a page throws, App.svelte's <svelte:boundary> shows this card instead of
   * a white page. It says the data is safe and offers three ways: «To Today», «Reload» and «Report a
   * problem» (a note in the Inbox with the error text, nothing leaves the device). Nothing is changed in
   * the data.
   */
  import { t } from '../i18n.svelte.js';
  import { openNote } from '../nav.js';

  let { error = null, name = '', onreset } = $props();
  const text = $derived(String(error?.message ?? error ?? '').slice(0, 300));
  function home(e) {
    // already on Today: the address does not change, so the page is rebuilt here
    if (location.hash === '' || location.hash === '#/' || location.hash === '#') {
      e.preventDefault();
      onreset?.();
    }
  }
  function report() {
    openNote(`${t('Error on the page «{page}» (version {v}): {text}', { page: name || t('Today|place'), v: __APP_VERSION__, text })}`);
  }
</script>

<section class="fail" role="alert" aria-labelledby="fail-h" data-error-page>
  <h1 id="fail-h">{t('Something went wrong here')}</h1>
  <p>{name ? t('Your data is safe. The page «{page}» could not be loaded.', { page: name }) : t('Your data is safe. This page could not be loaded.')}</p>
  <a class="btn hi fp-go" href="#/" onclick={home}>{t('To Today')}</a>
  <button type="button" class="btn fp-go" onclick={() => location.reload()}>{t('Reload')}</button>
  <button type="button" class="lk" onclick={report}>{t('Report a problem (the error text goes along)')}</button>
</section>

<style>
  .fail {
    display: grid;
    gap: var(--sp-3);
    max-width: 480px;
    margin: var(--sp-5) auto;
    padding: var(--sp-5) var(--sp-4);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    text-align: center;
  }
  h1 {
    margin: 0;
    font-size: var(--fs-sub);
    font-weight: 600;
  }
  p {
    margin: 0 0 var(--sp-2);
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .fp-go {
    justify-content: center;
    width: 100%;
  }
  .lk {
    min-height: 44px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
</style>
