<script>
  /**
   * «Nussgipfel-Rechner» (Noah 03.11.2026, Idee 26): the kcal a ride used, said in nut croissants: «That is about
   * 4 nut croissants.» A small line after the kcal on Food and water, on the live map and on a tour's weather card.
   * It can be switched off in Ich › Darstellung › Bedienung («Nut croissant sums»).
   */
  import { Croissant } from '@lucide/svelte';
  import { ops } from '../bedienung.svelte.js';
  import { t, num } from '../i18n.svelte.js';
  import { nussgipfelOf } from './nussgipfel.js';

  let { kcal = 0 } = $props();
  const n = $derived(nussgipfelOf(kcal));
</script>

{#if ops.nussgipfel && n != null}
  <small class="nuss" data-nussgipfel={n}>
    <Croissant size={14} aria-hidden="true" />
    {n === 0 ? t('That is less than one nut croissant.') : n === 1 ? t('That is about one nut croissant.') : t('That is about {n} nut croissants.', { n: num(n) })}
  </small>
{/if}

<style>
  .nuss {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
