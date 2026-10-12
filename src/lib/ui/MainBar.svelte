<script>
  /**
   * v0.67.0 «Übergänge 1» (kit, rule U1): the ONE main button of a view, named by where it leads
   * («Weiter zu Packen», «Zur Startseite»), and at most one quiet second way («Später», «Zurück»).
   * On a phone it stays at the bottom, above the bottom bar, in reach of the thumb.
   *
   * main: { label, href?, onclick?, icon?, disabled?, arrow? } (the orange button), or the snippet
   *   `children` for a page that renders its own (the trip band passes its action through).
   * second: { label, href?, onclick? } the quiet way back or later.
   * aside: a small extra next to the main button on a phone (+, the packing ring, the pencil).
   * hint: a short line under the button on a computer.
   * place: 'band' (right column of the trip band on a computer) | 'page' (a row at the end of the page).
   * v0.100.0 Design-Refresh P1 (G7 «Was als Nächstes kommt, immer unten»): on a computer the bar sits
   * at the bottom of the window, light, next to the sidebar: step: «Schritt 2 von 4» on the left, the
   * quiet way back and the main button on the right. Between 720 and 899 px it sits above the bottom bar
   * like on a phone; a phone turned sideways keeps it in the trip band.
   */
  import { ArrowRight } from '@lucide/svelte';

  let { main = null, second = null, aside = null, hint = '', step = '', place = 'page', children = null } = $props();
</script>

<div class="mainbar {place}">
  {#if step || hint}<span class="lead">{#if step}<span class="step">{step}</span>{/if}{#if hint}<small class="hint">{hint}</small>{/if}</span>{/if}
  {#if aside}<span class="aside">{@render aside()}</span>{/if}
  {#if children}{@render children()}
  {:else if main}
    {#if main.href}<a class="btn hi go" href={main.href} onclick={main.onclick}>{main.label}{#if main.arrow !== false}<ArrowRight size={20} aria-hidden="true" />{/if}</a>
    {:else}<button type="button" class="btn hi go" disabled={main.disabled} onclick={main.onclick}>{main.label}{#if main.arrow !== false}<ArrowRight size={20} aria-hidden="true" />{/if}</button>{/if}
  {/if}
  {#if second}
    {#if second.href}<a class="btn btn-link second" href={second.href} onclick={second.onclick}>{second.label}</a>
    {:else}<button type="button" class="btn btn-link second" onclick={second.onclick}>{second.label}</button>{/if}
  {/if}
</div>

<style>
  .mainbar :global(.btn.hi) {
    min-height: 52px;
    padding: 10px 20px;
    font-size: var(--fs-sub);
    border-radius: var(--r-ctl);
    gap: 8px;
  }
  .second {
    min-height: 52px;
    padding: 10px 18px;
    font-size: var(--fs-body);
    border-radius: var(--r-ctl);
  }
  .hint {
    font-size: var(--fs-small);
  }
  .aside {
    display: none;
  }
  /* page: a row at the end of the content */
  .page {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 12px;
    margin: 20px 0 0;
  }
  .page .lead {
    flex-basis: 100%;
    order: 3;
    color: var(--ink-3);
  }
  .lead {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 8px;
    min-width: 0;
  }
  .step {
    display: none;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  /* band, on a computer: the right column of the dark trip band */
  .band {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    gap: 6px;
  }
  .band .lead {
    justify-content: flex-end;
    color: var(--ink-3);
    text-align: right;
  }
  .band .second {
    display: none;
  }
  @media (min-width: 720px) {
    .band :global(.btn.hi) {
      min-width: 260px;
    }
  }
  /* Phone (rule U1): the next step stays at the bottom, above the bottom bar (v0.100.0: also up to
     899 px, where the bottom bar is too). */
  @media (max-width: 899px) and (min-height: 501px), (max-width: 719px) {
    .mainbar {
      position: fixed;
      left: 0;
      right: 0;
      bottom: calc(62px + env(safe-area-inset-bottom));
      z-index: 5;
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      gap: 10px;
      align-items: center;
      margin: 0;
      padding: 10px var(--gut);
      background: var(--paper);
      border-top: 1px solid var(--line);
      color: var(--ink);
    }
    .mainbar :global(.btn.hi) {
      flex: 1;
      min-width: 0;
      white-space: normal;
      line-height: 1.2;
    }
    .second {
      flex: none;
      max-width: 40%;
      white-space: normal;
      line-height: 1.2;
    }
    .aside {
      display: contents;
    }
    .lead {
      display: none;
    }
    .mainbar :global(:focus-visible) {
      outline-color: var(--focus);
    }
  }
  @media (max-height: 500px) {
    .mainbar :global(.btn.hi) {
      min-width: 0;
      min-height: 44px;
      padding: 6px 16px;
      font-size: var(--fs-body);
    }
    .second {
      min-height: 44px;
      padding: 6px 12px;
    }
    .hint {
      display: none;
    }
  }
  /* v0.100.0 P1 (G7): a computer: a light bar at the bottom of the window, next to the sidebar;
     «Schritt 2 von 4» and the short hint on the left, the quiet way back and the main button right. */
  @media (min-width: 900px) and (min-height: 501px) {
    .mainbar {
      position: fixed;
      left: 252px;
      right: 0;
      bottom: 0;
      z-index: 5;
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      align-items: center;
      justify-content: flex-end;
      gap: 16px;
      margin: 0;
      padding: 12px max(var(--gut), 48px);
      background: var(--paper);
      border-top: 1px solid var(--line);
    }
    .lead,
    .band .lead {
      flex: 1;
      flex-basis: auto;
      order: 0;
      justify-content: flex-start;
      text-align: left;
      color: var(--ink-3);
    }
    .step {
      display: inline;
    }
    .step + .hint::before {
      content: '· ';
    }
    .second,
    .band .second {
      display: inline-flex;
      order: 1;
    }
    .mainbar :global(.btn.hi) {
      order: 2;
      min-width: 0;
      min-height: 48px;
    }
    .band :global(.btn.hi) {
      min-width: 0;
    }
  }
  @media (max-height: 500px) and (max-width: 719px) {
    .mainbar {
      bottom: calc(48px + env(safe-area-inset-bottom));
      padding: 4px max(var(--gut), env(safe-area-inset-right)) 4px max(var(--gut), env(safe-area-inset-left));
    }
  }
  @media print {
    .mainbar {
      display: none;
    }
  }
</style>
