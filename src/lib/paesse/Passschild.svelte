<script>
  /**
   * «Pässe sammeln» (Paket E, Idee 24): the yellow sign of a pass: name, height, the day it was ridden.
   * The colours are those of the real sign (yellow, black), the same in the light and in the dark look.
   */
  import { t, num } from '../i18n.svelte.js';

  let { name, m = null, date = '' } = $props();
</script>

<span class="sign" data-pass-sign>
  <b class="nm">{name}</b>
  <span class="hm num">{m ? t('{m} m', { m: num(m) }) : '–'}</span>
  {#if date}<small class="dt num">{date}</small>{/if}
</span>

<style>
  .sign {
    --sign-yellow: #f7c600;
    --sign-ink: #1d1d1b;
    display: grid;
    gap: 2px;
    justify-items: center;
    min-width: 0;
    padding: 10px 12px 8px;
    border: 3px solid var(--sign-ink);
    border-radius: 10px;
    background: var(--sign-yellow);
    color: var(--sign-ink);
    text-align: center;
    box-shadow: inset 0 0 0 2px var(--sign-yellow), inset 0 0 0 3px color-mix(in srgb, var(--sign-ink) 40%, transparent);
  }
  .nm {
    max-width: 100%;
    font: 700 var(--fs-body) / 1.15 var(--font-body);
    overflow-wrap: break-word;
  }
  .hm {
    font: 600 var(--fs-small) / 1.2 var(--font-body);
  }
  .dt {
    font-size: var(--fs-tiny);
    color: color-mix(in srgb, var(--sign-ink) 80%, transparent);
  }
</style>
