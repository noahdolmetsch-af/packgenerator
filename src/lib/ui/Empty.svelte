<script>
  /**
   * v0.67.0 «Übergänge 1» (kit, rule U7): an empty view says in one sentence why it is empty and
   * offers the matching action. text: the sentence; action: { label, href?, onclick? }.
   * v0.99.0 Design-Refresh R3 (G3 «Leer»): a calm card in the middle, the icon in a soft circle, an
   * optional short title above the sentence and the action as a normal button below.
   */
  let { text, title = '', action = null, icon = null } = $props();
</script>

<div class="empty">
  {#if icon}{@const Icon = icon}<span class="ring" aria-hidden="true"><Icon size={22} /></span>{/if}
  {#if title}<b class="head">{title}</b>{/if}
  <p>{text}</p>
  {#if action}
    {#if action.href}<a class="btn" href={action.href} onclick={action.onclick}>{action.label}</a>
    {:else}<button type="button" class="btn" onclick={action.onclick}>{action.label}</button>{/if}
  {/if}
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
</style>
