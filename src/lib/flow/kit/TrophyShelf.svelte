<script>
  /**
   * v0.105.0 Design-Refresh P8 «Aktiv» (B12 «Trophäen-Regal», A8 and A14): the stars reached lately as
   * round badges with their name and when, the next one dashed; under it «Nächstes» with how far.
   * items: [{ id, name, when, done }]; next: { name, value, target } | null (value and target already as words, e.g. val()).
   * v0.123.0 «Trophäen-Vitrine» (TV2): more: the address of the showcase; a link «See all trophies ›» under it.
   */
  import { Star, ChevronRight } from '@lucide/svelte';
  import { t } from '../../i18n.svelte.js';

  let { items = [], next = null, more = '' } = $props();
</script>

<div class="ts">
  <ul>
    {#each items as x (x.id)}
      <li class:open={!x.done}>
        <span class="b" aria-hidden="true"><Star size={18} /></span>
        <b>{x.name}</b>
        <small>{x.when}</small>
      </li>
    {/each}
  </ul>
  {#if next}<p class="nx"><span>{t('Next: {name}', { name: next.name })}</span><span class="num">{t('{n} of {m}', { n: next.value, m: next.target })}</span></p>{/if}
  {#if more}<a class="more" href={more} data-trophies>{t('See all trophies')}<ChevronRight size={16} aria-hidden="true" /></a>{/if}
</div>

<style>
  ul {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(76px, 1fr));
    gap: var(--sp-3) var(--sp-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: grid;
    justify-items: center;
    gap: 4px;
    min-width: 0;
    text-align: center;
  }
  .b {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 2px solid var(--hi);
    border-radius: 50%;
    background: var(--hi-soft);
    color: var(--hi);
  }
  .open .b {
    border-style: dashed;
    border-color: var(--ink-3);
    background: none;
    color: var(--ink-3);
  }
  b {
    font: 600 var(--fs-tiny) / 1.25 var(--font-body);
    overflow-wrap: break-word;
    hyphens: auto;
    max-width: 100%;
  }
  small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .more {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    margin-top: var(--sp-1);
    color: var(--ink);
    font-weight: 600;
    font-size: var(--fs-small);
  }
  .nx {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 4px 12px;
    margin: var(--sp-3) 0 0;
    padding-top: var(--sp-2);
    border-top: 1px solid var(--line);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
