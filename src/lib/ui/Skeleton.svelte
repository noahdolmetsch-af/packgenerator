<script>
  /**
   * v0.127.0 A-U2 «Leer, Laden, Fehler: überall gleich» (mockup «Laden», Noah 13.10.2026 «A-U1–A-U5
   * freigeben»): while a page reads its data, calm grey bars in the shape of what comes, so nothing jumps
   * and no empty text flashes up. kind 'home': one big card and two small ones (Today); 'list': a card with
   * `rows` lines (lists). Screen readers hear «Loading …» once.
   */
  import { t } from '../i18n.svelte.js';

  let { kind = 'list', rows = 3 } = $props();
</script>

<div class="skel" data-kind={kind} role="status" aria-label={t('Loading…')} data-skeleton>
  <div class="sk-card">
    <i class="sk short"></i>
    {#each { length: Math.max(1, rows) } as _, i (i)}<i class="sk" class:mid={i % 2 === 1}></i>{/each}
  </div>
  {#if kind === 'home'}
    <div class="sk-two">
      <div class="sk-card"><i class="sk"></i></div>
      <div class="sk-card"><i class="sk"></i></div>
    </div>
  {/if}
</div>

<style>
  .skel {
    display: grid;
    gap: var(--sp-3);
  }
  .sk-card {
    display: grid;
    gap: 12px;
    padding: var(--sp-4);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .sk-two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-3);
  }
  .sk {
    display: block;
    height: 12px;
    border-radius: 6px;
    background: linear-gradient(90deg, var(--paper-2) 0%, color-mix(in srgb, var(--paper-2) 50%, var(--paper)) 50%, var(--paper-2) 100%);
    background-size: 200% 100%;
    animation: sk 1.4s ease-in-out infinite;
  }
  .sk.short {
    width: 40%;
  }
  .sk.mid {
    width: 80%;
  }
  @keyframes sk {
    from {
      background-position: 100% 0;
    }
    to {
      background-position: -100% 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .sk {
      animation: none;
    }
  }
</style>
