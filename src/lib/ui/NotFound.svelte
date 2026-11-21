<script>
  /**
   * Gesamttest 19.11.2026 (Noah «a»): an address that leads to no page (a typo, an old link) shows this card
   * instead of Today without a word. It says the data is safe and offers the way to Today. Same look as ErrorPage.
   */
  import { t } from '../i18n.svelte.js';
</script>

<section class="nf" aria-labelledby="nf-h" data-not-found>
  <h1 id="nf-h">{t('Page not found')}</h1>
  <p>{t('This address does not lead to a page. Maybe the link is old or has a typo. Your data is safe.')}</p>
  <a class="btn hi nf-go" href="#/">{t('To Today')}</a>
</section>

<style>
  .nf {
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
  .nf-go {
    justify-content: center;
    width: 100%;
  }
</style>
