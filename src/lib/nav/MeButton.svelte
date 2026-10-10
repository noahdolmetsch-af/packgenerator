<script>
  /**
   * v0.71.0 «Fünf Orte» 1 (Noah O1.x, 4a of 10.10.2026 02:39): «Ich», a round button top right (in
   * the sidebar on a computer). It took the place of «More». A small dot says that notes wait in the
   * Inbox; the number is in its label. It opens #/me.
   */
  import { UserRound } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { inbox = 0, current = false } = $props();
</script>

<a class="me" href="#/me" aria-current={current ? 'page' : undefined} aria-keyshortcuts="i" aria-label={inbox ? t('Me, Inbox: {n} to sort', { n: inbox }) : t('Me|place')}>
  <UserRound size={22} strokeWidth={2.2} aria-hidden="true" />
  {#if inbox}<span class="dot" aria-hidden="true"></span>{/if}
</a>

<style>
  .me {
    position: relative;
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--brand-ink);
    color: var(--brand);
    text-decoration: none;
  }
  .me:hover {
    background: var(--brand-ink-2);
  }
  .me[aria-current='page'] {
    box-shadow: 0 0 0 3px var(--hi-bright);
  }
  .me:focus-visible {
    outline: 3px solid var(--focus-on-dark);
    outline-offset: 2px;
  }
  .dot {
    position: absolute;
    top: 1px;
    right: 1px;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: var(--hi-bright);
    box-shadow: 0 0 0 2px var(--brand);
  }
</style>
