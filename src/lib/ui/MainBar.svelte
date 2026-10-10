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
   */
  import { ArrowRight } from '@lucide/svelte';

  let { main = null, second = null, aside = null, hint = '', place = 'page', children = null } = $props();
</script>

<div class="mainbar {place}">
  {#if aside}<span class="aside">{@render aside()}</span>{/if}
  {#if children}{@render children()}
  {:else if main}
    {#if main.href}<a class="btn hi go" href={main.href} onclick={main.onclick}>{main.label}{#if main.arrow !== false}<ArrowRight size={20} aria-hidden="true" />{/if}</a>
    {:else}<button type="button" class="btn hi go" disabled={main.disabled} onclick={main.onclick}>{main.label}{#if main.arrow !== false}<ArrowRight size={20} aria-hidden="true" />{/if}</button>{/if}
  {/if}
  {#if second}
    {#if second.href}<a class="btn second" href={second.href} onclick={second.onclick}>{second.label}</a>
    {:else}<button type="button" class="btn second" onclick={second.onclick}>{second.label}</button>{/if}
  {/if}
  {#if hint}<small class="hint">{hint}</small>{/if}
</div>

<style>
  .mainbar :global(.btn.hi) {
    min-height: 52px;
    padding: 10px 20px;
    font-size: var(--fs-sub);
    border-radius: 8px;
    gap: 8px;
  }
  .second {
    min-height: 52px;
    padding: 10px 18px;
    font-size: var(--fs-body);
    border-radius: 8px;
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
  .page .hint {
    flex-basis: 100%;
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
  .band .hint {
    color: var(--brand-ink-2);
    text-align: right;
  }
  .band :global(:focus-visible) {
    outline-color: var(--focus-on-dark);
  }
  @media (min-width: 720px) {
    .band :global(.btn.hi) {
      min-width: 260px;
    }
  }
  /* Phone (rule U1): the next step stays at the bottom, above the bottom bar. */
  @media (max-width: 719px) {
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
      background: color-mix(in srgb, var(--ground) 97%, transparent);
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
    .hint {
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
