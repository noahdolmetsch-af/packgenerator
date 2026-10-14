<script>
  /** SL4: «Back to top», only after TOP_AFTER screens of scrolling; on a phone a round button above the bar. */
  import { ArrowUp } from '@lucide/svelte';
  import { TOP_AFTER } from './listen.js';
  import { t } from '../i18n.svelte.js';

  let show = $state(false);
  $effect(() => {
    const on = () => (show = window.scrollY > TOP_AFTER * window.innerHeight);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  });
  const up = () => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
</script>

{#if show}
  <button type="button" class="ls-top" onclick={up} aria-label={t('Back to top')}><ArrowUp size={18} aria-hidden="true" /><span>{t('Back to top')}</span></button>
{/if}

<style>
  .ls-top {
    position: fixed;
    right: 32px;
    bottom: 32px;
    z-index: 5;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 48px;
    padding: 0 18px;
    border: 0;
    border-radius: 999px;
    background: var(--ink);
    color: var(--paper);
    font: 600 var(--fs-body) var(--font-body);
    box-shadow: 0 6px 18px var(--shadow, rgba(0, 0, 0, 0.2));
    cursor: pointer;
  }
  .ls-top:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  @media (max-width: 719px) {
    .ls-top {
      right: 16px;
      bottom: calc(84px + env(safe-area-inset-bottom));
      width: 52px;
      height: 52px;
      padding: 0;
      justify-content: center;
    }
    .ls-top span {
      display: none;
    }
  }
  @media print {
    .ls-top {
      display: none;
    }
  }
</style>
