<script>
  /**
   * SN2x «SN2 extra» (answer 1a): one group of the whole Rückblick that folds open. Closed it is one white
   * row with its icon, its name and one line with the most important; one tap opens it. The page remembers
   * which groups were open (TripSaved). key: the group's key (data-group); open: bindable.
   */
  import { ChevronDown } from '@lucide/svelte';

  let { key, title, line = '', icon: Icon = null, open = false, ontoggle = () => {}, children } = $props();
  // svelte-ignore state_referenced_locally
  const hid = `grp-${key}`;
</script>

<section class="grp" class:open data-group={key} aria-labelledby={hid}>
  <h2 class="gh" id={hid}>
    <button type="button" class="gb" aria-expanded={open} aria-controls="{hid}-b" onclick={() => ontoggle(!open)}>
      {#if Icon}<span class="gi" aria-hidden="true"><Icon size={20} /></span>{/if}
      <span class="gt"><span class="gn">{title}</span>{#if line}<span class="gl">{line}</span>{/if}</span>
      <ChevronDown class="gc" size={20} aria-hidden="true" />
    </button>
  </h2>
  {#if open}<div class="gbody" id="{hid}-b">{@render children()}</div>{/if}
</section>

<style>
  .grp {
    min-width: 0;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .grp.open {
    background: color-mix(in srgb, var(--paper-2) 55%, var(--paper));
  }
  .gh {
    margin: 0;
    font: inherit;
  }
  .gb {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    min-height: 64px;
    padding: 12px 16px;
    border: 0;
    border-radius: var(--radius-card);
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .gb:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: -2px;
  }
  .gi {
    display: grid;
    flex: none;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .gt {
    display: grid;
    flex: 1 1 auto;
    min-width: 0;
    gap: 2px;
  }
  .gn {
    font: 600 var(--fs-sub) / 1.25 var(--font-body);
    overflow-wrap: break-word;
  }
  .gl {
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .gb :global(.gc) {
    flex: none;
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  .open .gb :global(.gc) {
    transform: rotate(180deg);
  }
  .gbody {
    padding: 4px 16px 18px;
    border-top: 1px solid var(--line);
    padding-top: 16px;
  }
  @media (max-width: 559px) {
    .gbody {
      padding: 14px 10px 14px;
    }
  }
</style>
