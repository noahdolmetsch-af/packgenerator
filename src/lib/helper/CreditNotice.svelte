<script>
  /*
   * Empty AI credit (Noah 18.10.2026 «1a und wenn das guthaben aufgebraucht ist, erlischt das feld in der
   * app überall»): the clear sentence once, at the bottom of every page. After «OK» it does not come again
   * until the credit is empty another time; the helper's fields stay hidden until an answer works again.
   */
  import { Info, X } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { helper, creditTold } from './client.svelte.js';
</script>

{#if helper.credit?.empty && !helper.credit.told && helper.show}
  <div class="cn" role="status" data-cn="credit">
    <span class="cn-ic"><Info size={18} aria-hidden="true" /></span>
    <p class="cn-t">{t('The AI credit is used up. Everything else works as usual.')}</p>
    <button type="button" class="btn cn-ok" onclick={creditTold}>{t('OK')}</button>
    <button type="button" class="cn-x" aria-label={t('Close')} onclick={creditTold}><X size={18} aria-hidden="true" /></button>
  </div>
{/if}

<style>
  .cn {
    position: fixed;
    left: 50%;
    bottom: calc(var(--sp-3) + env(safe-area-inset-bottom, 0px) + 64px);
    transform: translateX(-50%);
    z-index: 60;
    display: flex;
    align-items: center;
    gap: 10px;
    width: min(560px, calc(100vw - 32px));
    padding: 10px 12px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .cn-ic {
    flex: none;
    display: grid;
    color: var(--ink-2);
  }
  .cn-t {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .cn-x {
    flex: none;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
</style>
