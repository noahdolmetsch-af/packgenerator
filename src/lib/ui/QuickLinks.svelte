<script>
  /**
   * «Alles finden 2» (Noah 22.10.2026 «1a», new proposal): pages that stood far down a long page (Rückblick › Heatmap,
   * Neuland …; Verschleiss › Velo verpacken …) as one row of chips right under the title. The rows further down stay.
   * links: [{ href, label, key }] (labels already translated); label: the row's name for screen readers.
   * «Touren sichtbar» / «Alltag sichtbar» (Noah 24.10.2026 «1a 2b 3a»): a chip can also do something on the page:
   * { onclick } runs it, { jump: 'css selector' } scrolls to that part of the page. A jump chip shows only while its
   * part is on the page (some parts come only in some situations).
   */
  let { links = [], label = '' } = $props();

  let present = $state(new Set());
  const jumps = $derived(links.filter((l) => l.jump).map((l) => l.jump));
  $effect(() => {
    if (!jumps.length) return;
    const look = () => (present = new Set(jumps.filter((s) => document.querySelector(s))));
    look();
    let raf = 0;
    const obs = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(look);
    });
    obs.observe(document.querySelector('main') ?? document.body, { childList: true, subtree: true });
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  });
  const shown = $derived(links.filter((l) => !l.jump || present.has(l.jump)));

  function jump(sel) {
    const el = document.querySelector(sel);
    if (!el) return;
    if (el.tagName === 'DETAILS') el.open = true; // a fold opens, so what the chip names is visible
    el.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    const focusable = el.matches('button, a, input, textarea, select, [tabindex]') ? el : (el.tagName === 'DETAILS' ? el.querySelector(':scope > summary') : el.querySelector('h2, h3, button, a'));
    if (focusable && !focusable.matches('button, a, input, textarea, select')) focusable.setAttribute('tabindex', '-1');
    focusable?.focus({ preventScroll: true });
  }
</script>

{#if shown.length}
  <nav class="ql" aria-label={label} data-quick-links>
    {#each shown as l (l.key ?? l.href ?? l.jump)}
      {#if l.jump}<button type="button" onclick={() => jump(l.jump)} data-quick={l.key}>{l.label}</button>
      {:else if l.onclick}<button type="button" onclick={l.onclick} data-quick={l.key}>{l.label}</button>
      {:else}<a href={l.href} data-quick={l.key}>{l.label}</a>{/if}
    {/each}
  </nav>
{/if}

<style>
  .ql {
    display: flex;
    gap: 6px;
    margin: 0 0 12px;
    overflow-x: auto;
    scrollbar-width: none;
    padding-bottom: 2px;
  }
  .ql a,
  .ql button {
    flex: none;
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    font-weight: 500;
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
  }
  .ql a:hover,
  .ql button:hover {
    border-color: var(--ink-3);
  }
</style>
