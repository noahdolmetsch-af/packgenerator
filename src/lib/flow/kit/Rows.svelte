<script>
  /**
   * v0.105.0 Design-Refresh P8 «Aktiv»: a white card with rows: the icon in a grey square, a name, a
   * quiet line and a chevron (or a value at the right). A row is a link (href), a button (onclick, with
   * expanded for a row that folds something open below it: the snippet `open(row)`) or plain text.
   * rows: [{ key, icon, title, sub, value, href, onclick, expanded }]
   */
  import { ChevronRight, ChevronDown } from '@lucide/svelte';

  let { rows = [], open = null, label = '' } = $props();
</script>

<ul class="rows card" aria-label={label || undefined}>
  {#each rows as r (r.key)}
    {@const Icon = r.icon}
    <li data-row={r.key}>
      {#snippet body()}
        {#if Icon}<span class="ib" aria-hidden="true"><Icon size={18} /></span>{/if}
        <span class="tx"><b>{r.title}</b>{#if r.sub}<small>{r.sub}</small>{/if}</span>
        {#if r.value != null && r.value !== ''}<span class="v num">{r.value}</span>{/if}
      {/snippet}
      {#if r.href}
        <a class="rw" href={r.href}>{@render body()}<ChevronRight class="cv" size={18} aria-hidden="true" /></a>
      {:else if r.onclick}
        <button type="button" class="rw" aria-expanded={r.expanded ?? undefined} onclick={r.onclick}>{@render body()}{#if r.expanded != null}<ChevronDown class="cv {r.expanded ? 'up' : ''}" size={18} aria-hidden="true" />{:else}<ChevronRight class="cv" size={18} aria-hidden="true" />{/if}</button>
      {:else}
        <div class="rw">{@render body()}</div>
      {/if}
      {#if r.expanded && open}<div class="op">{@render open(r)}</div>{/if}
    </li>
  {/each}
</ul>

<style>
  .rows {
    margin: 0;
    padding: 0 var(--sp-4);
    list-style: none;
  }
  li + li {
    border-top: 1px solid var(--line);
  }
  .rw {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    width: 100%;
    min-height: 56px;
    padding: var(--sp-2) 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    text-decoration: none;
    box-sizing: border-box;
  }
  button.rw {
    cursor: pointer;
  }
  .ib {
    display: grid;
    flex: none;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .tx {
    flex: 1;
    min-width: 0;
    line-height: 1.3;
  }
  .tx b {
    display: block;
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .tx small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .v {
    flex: none;
    color: var(--ink);
  }
  .rw :global(.cv) {
    flex: none;
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  .rw :global(.cv.up) {
    transform: rotate(180deg);
  }
  .op {
    padding: 0 0 var(--sp-3);
  }
</style>
