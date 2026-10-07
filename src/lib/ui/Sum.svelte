<script>
  /**
   * v0.22.0 (AP04, honest weights): a weight sum with its gaps in sight. Unknown is not zero.
   * Every weight known → the plain sum ("2.69 kg"). Some unknown → "known: 2.69 kg" and right
   * next to it, as text (a tooltip alone does not reach a touch screen), "7 not weighed".
   *
   * g: the known grams; missing: how many weights are unknown; fmt: the number formatter
   * (formatWeight by default); miss: own text for the count (default "{n} not weighed");
   * estimate: the sum rests on an estimate (e.g. the bike weight from Strava) → "~" in front.
   */
  import { formatWeight } from '../gear.js';
  import { t } from '../i18n.svelte.js';

  let { g, missing = 0, fmt = formatWeight, miss = '', estimate = false } = $props();
  // "known: {w}" split around the number, so the number keeps its own weight and size.
  const parts = $derived(t('known: {w}', { w: '\u0000' }).split('\u0000'));
  const value = $derived(`${estimate ? '~' : ''}${fmt(g)}`);
</script>

<span class="sum">
  {#if missing}
    <span class="kn">{parts[0]}</span><b class="num">{value}</b>{#if parts[1]}<span class="kn">{parts[1]}</span>{/if}
    <small class="miss">{miss || t('{n} not weighed', { n: missing })}</small>
  {:else}
    <b class="num">{value}</b>
  {/if}
</span>

<style>
  .sum {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: 4px;
    min-width: 0;
  }
  .kn {
    font-size: 13px;
    font-weight: 400;
    color: var(--ink-2);
  }
  /* Grey, not orange (design answer 8b), but always in sight. */
  .miss {
    margin-left: 2px;
    font-size: 13px;
    font-weight: 400;
    color: var(--ink-3);
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .miss::before {
    content: '· ';
  }
</style>
