<script>
  /**
   * v0.67.0 «Übergänge 1» (kit, rule U2, Ü3a): the calm page after a finished step: the trip and its
   * step bar, a tick with the title and one sentence, the key numbers (children), the line «Was
   * jetzt?», ONE main button and one quiet second way, and small print under it (foot).
   * On a computer it is one column of 560 px in the middle of the page (mockup Zwischen-Desktop).
   */
  import PageHead from './PageHead.svelte';
  import StepBar from './StepBar.svelte';
  import MainBar from './MainBar.svelte';
  import { t } from '../i18n.svelte.js';

  let { trip, tabs, status, current = null, context = '', title, text = '', sub = '', what = '', main, second = null, onpick = () => {}, foot = null, children = null } = $props();
</script>

<article class="between" aria-labelledby="between-h">
  <p class="trip">{context}</p>
  <StepBar {trip} {tabs} {status} {current} tone="light" {onpick} />
  <div class="head" id="between-h"><PageHead done {title} {text} {sub} /></div>
  {@render children?.()}
  {#if what}<p class="what"><span class="wl">{t('What now?')}</span> <span>{what}</span></p>{/if}
  <MainBar {main} {second} />
  {#if foot}<div class="foot">{@render foot()}</div>{/if}
</article>

<style>
  .between {
    max-width: 560px;
    margin: 0 auto;
    padding: 0 0 24px;
  }
  .trip {
    margin: 0 0 8px;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .head {
    margin: 28px 0 8px;
  }
  .what {
    display: flex;
    gap: 4px 10px;
    margin: 18px 0 0;
    font-size: var(--fs-body);
    color: var(--ink);
  }
  .wl {
    flex: none;
    color: var(--ink-3);
  }
  .foot {
    display: grid;
    justify-items: center;
    gap: 4px;
    margin: 14px 0 0;
    text-align: center;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  @media (min-width: 720px) {
    .between {
      padding: 24px 32px 28px;
      background: var(--paper);
      border: 1px solid var(--card-line);
      border-radius: var(--radius-card);
      box-shadow: var(--card-shadow);
    }
  }
  @media (max-width: 719px) {
    /* room for the main button at the bottom of the phone */
    .between {
      padding-bottom: 96px;
    }
  }
</style>
