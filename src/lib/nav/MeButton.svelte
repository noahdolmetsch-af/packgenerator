<script>
  /**
   * v0.76.0 «Fünf Orte» 1 (Noah O1.x, 4a of 10.10.2026 02:39): «Ich», a round button top right. It took
   * the place of «More». A small dot says that notes wait in the Inbox; the number is in its label.
   * It opens #/me.
   * v0.98.0 Design-Refresh R2 (G4/G5 A★): light, a soft round face; in the sidebar a card at the bottom
   * («Ich · Daten, Eingang, Hilfe»).
   */
  import { UserRound } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { inbox = 0, current = false, card = false } = $props();
</script>

<a class="me" class:mecard={card} href="#/me" aria-current={current ? 'page' : undefined} aria-keyshortcuts="i" aria-label={inbox ? t('Me, Inbox: {n} to sort', { n: inbox }) : t('Me|place')}>
  <span class="face"><UserRound size={20} strokeWidth={2.2} aria-hidden="true" />{#if inbox}<span class="dot" aria-hidden="true"></span>{/if}</span>
  {#if card}<span class="tx" aria-hidden="true"><b>{t('Me|place')}</b><small>{t('Data, Inbox, Help')}</small></span>{/if}
</a>

<style>
  .me {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    color: var(--ink);
    text-decoration: none;
  }
  .face {
    position: relative;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--hi-soft);
    color: var(--hi);
  }
  .me:hover .face {
    background: var(--paper-2);
  }
  .me[aria-current='page'] .face {
    box-shadow: 0 0 0 2px var(--hi);
  }
  .dot {
    position: absolute;
    top: -1px;
    right: -1px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--hi);
    box-shadow: 0 0 0 2px var(--paper);
  }
  /* the sidebar: a card at the bottom */
  .mecard {
    justify-content: flex-start;
    gap: 10px;
    width: 100%;
    height: auto;
    min-height: 56px;
    padding: var(--sp-2) 10px;
    border: 1px solid var(--line);
    border-radius: 12px;
    box-sizing: border-box;
  }
  .mecard:hover {
    background: var(--paper-2);
  }
  .mecard[aria-current='page'] {
    border-color: var(--ink);
  }
  .tx {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .tx b {
    font-weight: 600;
  }
  .tx small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
</style>
