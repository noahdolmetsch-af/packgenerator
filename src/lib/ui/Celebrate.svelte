<script>
  /**
   * v0.67.0 «Übergänge 1» (kit, rule U6): a finished step celebrates quietly: a tick and one
   * sentence. No confetti, no pop-up. title: the short word («Gepackt»); text: the one sentence.
   * size 'big': the head of an interstitial (an h1); 'small': a line inside a card.
   */
  import { Check } from '@lucide/svelte';

  let { title, text = '', size = 'small' } = $props();
</script>

<div class="celebrate {size}" role={size === 'small' ? 'status' : undefined}>
  <span class="tick" aria-hidden="true"><Check size={size === 'big' ? 30 : 18} strokeWidth={2.5} /></span>
  {#if size === 'big'}<h1 tabindex="-1" data-page-title>{title}</h1>{:else}<b>{title}</b>{/if}
  {#if text}<p>{text}</p>{/if}
</div>

<style>
  .celebrate {
    display: grid;
    justify-items: center;
    gap: 8px;
    text-align: center;
  }
  .tick {
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--accent-soft);
    color: var(--accent);
  }
  h1 {
    margin: 4px 0 0;
    font: 800 var(--fs-page)/1.05 var(--font-brand);
    color: var(--ink);
    overflow-wrap: break-word;
  }
  p {
    margin: 0;
    max-width: 30em;
    color: var(--ink-2);
    font-size: var(--fs-body);
  }
  .small {
    grid-template-columns: auto minmax(0, 1fr);
    justify-items: start;
    align-items: center;
    gap: 2px 10px;
    text-align: left;
  }
  .small .tick {
    grid-row: span 2;
    width: 34px;
    height: 34px;
  }
  .small p {
    font-size: var(--fs-small);
  }
</style>
