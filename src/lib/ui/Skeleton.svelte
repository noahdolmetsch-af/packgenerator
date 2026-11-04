<script>
  /**
   * v0.127.0 A-U2 «Leer, Laden, Fehler: überall gleich» (mockup «Laden», Noah 13.10.2026 «A-U1–A-U5
   * freigeben»): while a page reads its data, a calm card in the shape of what comes, so nothing jumps
   * and no empty text flashes up. kind 'home': one big card and two small ones (Today); 'list': a card whose
   * height follows `rows` (lists). Screen readers hear «Loading …» once.
   * «Neuer Schwung» Laden (block B8 «Schimmer», Noah 27.10.2026): the cards come in one after another.
   * «Laden als Strasse» (Noah 03.11.2026 «b», Paket D, Idee 14): instead of grey bars a small bike rides along a
   * dashed road in every card; with «Bewegung reduzieren» it stands still in the middle of the road.
   */
  import { t } from '../i18n.svelte.js';
  import RoadBike from './RoadBike.svelte';

  let { kind = 'list', rows = 3 } = $props();
</script>

{#snippet road(size, delay = 0)}
  <div class="road" style="--d:{delay}ms"><span class="sk-bike"><RoadBike {size} /></span></div>
{/snippet}

<div class="skel" data-kind={kind} role="status" aria-label={t('Loading…')} data-skeleton>
  <div class="sk-card" style="--rows:{Math.max(1, rows)}">{@render road(52)}</div>
  {#if kind === 'home'}
    <div class="sk-two">
      <div class="sk-card small">{@render road(38, 300)}</div>
      <div class="sk-card small">{@render road(38, 700)}</div>
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
    align-items: end;
    min-height: calc(42px + var(--rows, 1) * 16px);
    padding: var(--sp-4);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    overflow: hidden;
  }
  .sk-card.small {
    min-height: 0;
  }
  .sk-two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-3);
  }
  /* the road: a dashed line; the bike stands on it */
  .road {
    position: relative;
    container-type: inline-size;
    height: 48px;
    background: repeating-linear-gradient(90deg, var(--line) 0 14px, transparent 14px 26px) 0 100% / 100% 3px no-repeat;
  }
  .small .road {
    height: 34px;
  }
  .sk-bike {
    position: absolute;
    left: 50%;
    bottom: 3px;
    translate: -50% 0;
  }
  @media (prefers-reduced-motion: no-preference) {
    .sk-card {
      animation: sk-in 400ms var(--ease-out) both;
    }
    .sk-two .sk-card:nth-child(1) {
      animation-delay: 80ms;
    }
    .sk-two .sk-card:nth-child(2) {
      animation-delay: 160ms;
    }
    .sk-bike {
      left: 0;
      translate: none;
      animation: sk-ride 2.6s linear var(--d, 0ms) infinite;
    }
  }
  @keyframes sk-in {
    from {
      opacity: 0;
    }
  }
  /* from just outside the left edge to just outside the right one */
  @keyframes sk-ride {
    from {
      transform: translateX(-64px);
    }
    to {
      transform: translateX(calc(100cqw + 8px));
    }
  }
</style>
