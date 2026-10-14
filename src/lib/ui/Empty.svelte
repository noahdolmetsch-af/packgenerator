<script>
  /**
   * v0.67.0 «Übergänge 1» (kit, rule U7): an empty view says in one sentence why it is empty and
   * offers the matching action. text: the sentence; action: { label, href?, onclick? }.
   * v0.99.0 Design-Refresh R3 (G3 «Leer»): a calm card in the middle, the icon in a soft circle, an
   * optional short title above the sentence and the action as a normal button below.
   * v0.127.0 A-U2 «Leer, Laden, Fehler: überall gleich» (mockup «Leerzustand», Noah 13.10.2026 «A-U1–A-U5
   * freigeben»): the one building block for every empty list and page. The first action is the main
   * button, `action2` a second one beside it, `children` a quiet line below (e.g. a link). `level` makes
   * the title a heading (h2–h4, `headId` its id), e.g. inside a section that names itself by it.
   */
  let { text, title = '', level = 0, headId = undefined, action = null, action2 = null, icon = null, children = null } = $props();
</script>

{#snippet btn(a, main)}
  {#if a.href}<a class="btn" class:hi={main} href={a.href} onclick={a.onclick} data-explain={a.explain}>{a.label}</a>
  {:else}<button type="button" class="btn" class:hi={main} onclick={a.onclick} data-explain={a.explain}>{a.label}</button>{/if}
{/snippet}

<div class="empty" data-empty>
  {#if icon}{@const Icon = icon}<span class="ring" aria-hidden="true"><Icon size={22} /></span>{/if}
  {#if title && level}<svelte:element this={`h${level}`} class="head" id={headId}>{title}</svelte:element>
  {:else if title}<b class="head">{title}</b>{/if}
  <p>{text}</p>
  {#if action || action2}
    <div class="acts">
      {#if action}{@render btn(action, true)}{/if}
      {#if action2}{@render btn(action2, false)}{/if}
    </div>
  {/if}
  {#if children}<div class="more">{@render children()}</div>{/if}
</div>

<style>
  .empty {
    display: grid;
    justify-items: center;
    gap: 10px;
    padding: var(--sp-5) var(--sp-4);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    color: var(--ink-2);
    text-align: center;
  }
  .ring {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .head {
    margin: 0;
    color: var(--ink);
    font-size: var(--fs-sub);
    font-weight: 600;
  }
  p {
    margin: 0;
    max-width: 30em;
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--sp-2);
  }
  .more {
    max-width: 30em;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
</style>
