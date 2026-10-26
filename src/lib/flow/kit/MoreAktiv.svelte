<script>
  /**
   * v0.130.0 «Mehr in Aktiv» (mockups AK1–AK3, Noah 13.10.2026 «1a»): the cards of Aktiv's own pages
   * (Woche, later Erholung and Sporttasche) on Aktiv › Heute and on each of those pages; the open one
   * has a frame. items: [{ key, href, icon, title, sub }].
   */
  import { t } from '../../i18n.svelte.js';

  // stack: one card under the other (Auswerten's right column on a computer, «Computer-Breite» 26.10.2026)
  let { items = [], on = '', stack = false } = $props();
</script>

<nav class="ma" class:four={items.length === 4} class:stack aria-label={t('More in Active')}>
  {#each items as x (x.key)}
    {@const Icon = x.icon}
    <a class="card" href={x.href} data-more={x.key} aria-current={x.key === on ? 'page' : undefined}>
      <Icon size={20} aria-hidden="true" />
      <span><b>{x.title}</b>{#if x.sub}<small>{x.sub}</small>{/if}</span>
    </a>
  {/each}
</nav>

<style>
  .ma {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--sp-3);
  }
  .ma.four {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .ma.stack {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-2);
  }
  a {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-height: 56px;
    padding: 12px 14px;
    color: var(--ink);
    text-decoration: none;
  }
  a:hover {
    background: var(--paper-2);
  }
  a[aria-current='page'] {
    outline: 2px solid var(--hi);
    outline-offset: -2px;
  }
  a :global(svg) {
    flex: none;
    color: var(--ink-2);
  }
  span {
    min-width: 0;
  }
  b {
    display: block;
    font-weight: 600;
  }
  small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  @media (max-width: 640px) {
    .ma {
      gap: var(--sp-2);
    }
    .ma.four {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    a {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      padding: 10px;
    }
    small {
      display: none;
    }
  }
</style>
