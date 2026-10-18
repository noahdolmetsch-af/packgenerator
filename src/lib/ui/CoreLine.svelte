<script>
  /**
   * 0.160.0 «Paket Aktiv», UI1 (Noah 14.10.2026 «1a»): one key line under a page title with the most
   * important of the page. parts: [{ v, label }] → «<b>v</b> label · …»; parts without v and label stay out.
   */
  let { parts = [] } = $props();
  const shown = $derived(parts.filter((p) => p && (p.v != null || p.label)));
</script>

{#if shown.length}
  <p class="core" data-core-line>
    {#each shown as p, i (i)}{#if i}<span class="dot" aria-hidden="true">{' · '}</span>{/if}<span class="cp">{#if p.v != null}<b class="num">{p.v}</b>{' '}{/if}{p.label ?? ''}</span>{/each}
  </p>
{/if}

<style>
  .core {
    margin: var(--sp-1) 0 0;
    color: var(--ink-2);
    font: 400 var(--fs-body) / 1.45 var(--font-body);
  }
  .cp {
    white-space: nowrap;
  }
  .core b {
    color: var(--ink);
    font-weight: 600;
  }
  .dot {
    color: var(--ink-3);
  }
  @media (max-width: 719px) {
    .cp {
      white-space: normal;
    }
  }
</style>
