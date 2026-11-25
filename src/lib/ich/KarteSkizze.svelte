<script>
  /**
   * «Karte der App» als Mindmap (Noah 24.11.2026 «beide», 25.11.2026 «kreislauf fallen lassen»): the app on the left, the places as branches on a
   * spine; a tap on a branch opens its tabs, a tap on a tab its pages. The pages are shown by the snippet `pages` of the map page (the same rows
   * with the same dots as in the list). Data: lib/appskizze.js.
   */
  import { t } from '../i18n.svelte.js';
  import { ChevronDown } from '@lucide/svelte';
  import { markOf } from '../appmap.js';
  import { buildMind } from '../appskizze.js';

  let { map, marks, pages } = $props();
  let openBranch = $state(null);

  const mind = $derived(buildMind(map));
  const countOpen = (points) => points.filter((p) => markOf(p, marks) === 'open').length;
</script>

<svg class="sk-defs" width="0" height="0" aria-hidden="true" focusable="false">
  <filter id="sk-rough" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="4" result="n" />
    <feDisplacementMap in="SourceGraphic" in2="n" scale="3" />
  </filter>
</svg>

<div class="sk-mind" data-am-mind role="group" aria-label={t('The places of the app as branches')}>
  <div class="sk-root"><b>{t('App|topic')}</b></div>
  <ul class="sk-branches">
    {#each mind as b (b.key)}
      {@const on = openBranch === b.key}
      <li class="sk-branch" class:on>
        <button type="button" class="sk-bbox" class:on aria-expanded={on} data-am-branch={b.key} onclick={() => (openBranch = on ? null : b.key)}>
          <span class="sk-bt"><b>{t(b.label)}</b><small>{t('{n} of {m} opened', { n: countOpen(b.points), m: b.points.length })}</small></span>
          <ChevronDown class="sk-chev" size={20} aria-hidden="true" />
        </button>
        {#if on}
          <ul class="sk-twigs" data-am-twigs={b.key}>
            {#each b.tabs as tab (tab.key)}
              <li>
                <details class="sk-twig" data-am-twig={tab.key} open={b.tabs.length === 1}>
                  <summary><span>{t(tab.label)}</span><small>{tab.pages.length}</small><ChevronDown class="sk-chev" size={16} aria-hidden="true" /></summary>
                  {@render pages(tab.pages)}
                </details>
              </li>
            {/each}
          </ul>
        {/if}
      </li>
    {/each}
  </ul>
</div>
<p class="sk-help">{t('Tap a branch to see its tabs, then a tab to see its pages. Only one branch is open at a time.')}</p>

<style>
  .sk-defs {
    position: absolute;
  }
  .sk-help {
    margin: 12px 2px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }

  /* the mind map: the app on the left, the places as branches on a spine */
  .sk-mind {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
    gap: 0 28px;
    margin: 4px 0 0;
  }
  .sk-root {
    position: relative;
    margin-top: 10px;
    padding: 14px 16px;
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--ink);
    color: var(--paper);
    font-size: var(--fs-body);
    filter: url(#sk-rough);
  }
  .sk-root::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 100%;
    width: 26px;
    border-top: 2px solid var(--hi);
  }
  .sk-branches {
    list-style: none;
    margin: 0;
    padding: 0 0 0 24px;
    border-left: 2px solid var(--hi);
  }
  .sk-branch {
    position: relative;
    margin: 10px 0;
  }
  .sk-branch::before {
    content: '';
    position: absolute;
    top: 28px;
    left: -24px;
    width: 22px;
    border-top: 2px solid var(--hi);
  }
  .sk-bbox::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    border: 2px solid var(--ink);
    border-radius: var(--r-ctl);
    background: var(--paper);
    filter: url(#sk-rough);
  }
  .sk-bbox.on::before {
    border-color: var(--hi);
    background: color-mix(in srgb, var(--hi) 12%, var(--paper));
  }
  .sk-bbox {
    position: relative;
    z-index: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 56px;
    padding: 8px 14px;
    box-sizing: border-box;
    border: 0;
    background: transparent;
    color: var(--ink);
    text-align: left;
    font: inherit;
    cursor: pointer;
  }
  .sk-bt {
    display: grid;
    flex: 1;
    min-width: 0;
    gap: 2px;
  }
  .sk-bt b {
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .sk-bbox.on :global(.sk-chev),
  .sk-twig[open] > summary :global(.sk-chev) {
    transform: rotate(180deg);
  }
  .sk-twigs {
    list-style: none;
    margin: 4px 0 0 16px;
    padding: 0 0 0 14px;
    border-left: 2px solid var(--line);
  }
  .sk-twig > summary {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    font-weight: 600;
    list-style: none;
    cursor: pointer;
  }
  .sk-twig > summary::-webkit-details-marker {
    display: none;
  }
  .sk-twig > summary small {
    margin-left: auto;
    color: var(--ink-3);
    font-weight: 400;
  }
</style>
