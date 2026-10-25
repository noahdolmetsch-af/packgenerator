<script>
  /**
   * Paket C: one part of a «Ruhig und persönlich» page: its title (the name «What the app can do» uses)
   * and one line, always in sight; a tap opens the part in place (no fold that hides the name).
   * id: the part's key (?open=<id> opens it from a link); icon: a lucide component.
   */
  import { ChevronDown } from '@lucide/svelte';

  let { id, title, lead = '', icon: Icon = null, open = $bindable(false), children } = $props();
</script>

<li class="rh-card" class:open data-part={id}>
  <h2 class="rh-h">
    <button type="button" class="rh-head" aria-expanded={open} aria-controls="rh-{id}" onclick={() => (open = !open)}>
      {#if Icon}<span class="rh-ic"><Icon size={18} aria-hidden="true" /></span>{/if}
      <span class="rh-t"><span class="rh-name">{title}</span>{#if lead}<small>{lead}</small>{/if}</span>
      <ChevronDown class="rh-chev" size={20} aria-hidden="true" />
    </button>
  </h2>
  {#if open}<div class="rh-body" id="rh-{id}">{@render children()}</div>{/if}
</li>
