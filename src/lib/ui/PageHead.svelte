<script>
  /**
   * v0.67.0 «Übergänge 1» (kit, rules U4, U5): the same head on every page: the context line (trip,
   * dates), the title, and the one line «Was jetzt?» that says what to do here. done: a finished step
   * (the quiet celebration: tick, title, one sentence). children: something small under the head.
   */
  import Celebrate from './Celebrate.svelte';
  import { t } from '../i18n.svelte.js';

  let { title, context = '', text = '', sub = '', what = '', done = false, children = null } = $props();
</script>

<header class="pagehead" class:done>
  {#if context}<p class="ctx">{context}</p>{/if}
  {#if done}<Celebrate size="big" {title} {text} />
  {:else}<h1 tabindex="-1" data-page-title>{title}</h1>{#if text}<p class="text">{text}</p>{/if}{/if}
  {#if sub}<p class="sub num">{sub}</p>{/if}
  {@render children?.()}
  {#if what}<p class="what"><span class="wl">{t('What now?')}</span> <span>{what}</span></p>{/if}
</header>

<style>
  .pagehead {
    margin: 0 0 16px;
  }
  .ctx {
    margin: 0 0 6px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  h1 {
    margin: 0;
    font: 700 var(--fs-title)/1.15 var(--font-body);
    overflow-wrap: break-word;
  }
  .text,
  .sub {
    margin: 6px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-body);
  }
  .done .sub {
    text-align: center;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .what {
    display: flex;
    gap: 4px 10px;
    margin: 16px 0 0;
    font-size: var(--fs-body);
    color: var(--ink);
  }
  .wl {
    flex: none;
    color: var(--ink-3);
  }
</style>
