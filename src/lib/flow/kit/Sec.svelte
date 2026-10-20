<script>
  /**
   * v0.105.0 Design-Refresh P8 «Aktiv»: one section of an Aktiv page as in the mockups: the heading,
   * a quiet line under it and, at the right, one quiet link («Alle ›», «Ganze Liste ›», «Kacheln ändern»).
   * more: { href, label } or { onclick, label, expanded }. edit: { href, label }, a second quiet link
   * before it (Noah 20.10.2026 «1a»: «Bearbeiten ›» in the head of «Heute abhaken»).
   */
  import { ChevronRight } from '@lucide/svelte';

  let { title, id, sub = '', more = null, edit = null, children } = $props();
</script>

<section class="sec" aria-labelledby={id}>
  <div class="sh">
    <div class="st">
      <h2 {id}>{title}</h2>
      {#if sub}<p>{sub}</p>{/if}
    </div>
    {#if edit?.href}
      <a class="mr" href={edit.href} data-sec-edit>{edit.label}<ChevronRight size={16} aria-hidden="true" /></a>
    {/if}
    {#if more?.href}
      <a class="mr" href={more.href}>{more.label}<ChevronRight size={16} aria-hidden="true" /></a>
    {:else if more?.onclick}
      <button type="button" class="mr" aria-expanded={more.expanded ?? undefined} onclick={more.onclick}>{more.label}<ChevronRight size={16} aria-hidden="true" /></button>
    {/if}
  </div>
  {@render children()}
</section>

<style>
  .sec {
    min-width: 0;
  }
  .sh {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 0 12px;
    margin: 0 2px var(--sp-2);
  }
  .st {
    flex: 1 1 200px;
    min-width: 0;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .st p {
    margin: 2px 0 0;
    color: var(--ink-3);
    font: 400 var(--fs-small) / 1.4 var(--font-body);
  }
  .mr {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    margin: -12px 0 -10px;
    padding: 0 0 0 8px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
    text-decoration: none;
    cursor: pointer;
  }
</style>
