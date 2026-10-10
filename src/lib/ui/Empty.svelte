<script>
  /**
   * v0.67.0 «Übergänge 1» (kit, rule U7): an empty view says in one sentence why it is empty and
   * offers the matching action. text: the sentence; action: { label, href?, onclick? }.
   */
  let { text, action = null, icon = null } = $props();
</script>

<div class="empty">
  {#if icon}{@const Icon = icon}<Icon size={22} aria-hidden="true" />{/if}
  <p>{text}</p>
  {#if action}
    {#if action.href}<a class="btn" href={action.href} onclick={action.onclick}>{action.label}</a>
    {:else}<button type="button" class="btn" onclick={action.onclick}>{action.label}</button>{/if}
  {/if}
</div>

<style>
  .empty {
    display: grid;
    justify-items: start;
    gap: 10px;
    padding: 16px;
    border: 1px dashed var(--line-strong);
    border-radius: var(--radius-card);
    background: var(--paper);
    color: var(--ink-2);
  }
  p {
    margin: 0;
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .empty .btn {
    min-height: 44px;
  }
</style>
