<script>
  /**
   * «Wusstest du» WD1 + WD3: the small tag of a tip's kind, «Gut zu wissen», «Wusstest du» or «Passt zu
   * heute» (with the temperature when it is the heat or the cold). kind: 'tip' | 'know' | 'today'.
   */
  import { t, num } from '../i18n.svelte.js';

  let { kind = 'tip', deg = null } = $props();
  const LABEL = { tip: 'Good to know|tag', know: 'Did you know|tag', today: 'Fits today|tag' };
</script>

<span class="kt {kind}" data-kind={kind}>{t(LABEL[kind] ?? LABEL.tip)}{#if kind === 'today' && deg != null}{' · '}{num(deg)} °C{/if}</span>

<style>
  .kt {
    display: inline-block;
    margin-right: 6px;
    padding: 1px 7px;
    border-radius: 6px;
    font-size: var(--fs-tiny);
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    vertical-align: 1px;
    color: var(--ink-2);
    background: var(--ok-soft);
  }
  .know {
    background: var(--info-soft);
  }
  .today {
    background: var(--warn-soft);
  }
</style>
