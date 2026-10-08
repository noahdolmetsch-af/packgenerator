<script>
  /**
   * v0.35.0 (Noah, every release from now on): "New in the last updates" at the top of "What the
   * app can do". The last versions open, each with 2-4 points in plain words and "Try it" to the
   * exact place; the older versions fold away (whatsnew.js).
   */
  import { ChevronRight } from '@lucide/svelte';
  import { t, locale } from '../i18n.svelte.js';
  import { openData } from '../nav.js';
  import { splitNews } from '../whatsnew.js';

  const { recent, older } = splitNews();
  const short = (v) => v.replace(/\.0$/, '');
  const day = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
  function go(p, e) {
    if (p.action !== 'data') return;
    e.preventDefault();
    openData();
  }
</script>

{#snippet version(e)}
  <div class="ver" data-version={e.version}>
    <h3><span class="num">{t('Version {v}', { v: short(e.version) })}</span> <span class="date">{day(e.date)}</span></h3>
    <ul>
      {#each e.points as p (p.text)}
        <li>
          <span class="pt">{t(p.text)}</span>
          <a class="try" href={p.href} onclick={(ev) => go(p, ev)}>{t('Try it')}<ChevronRight size={16} aria-hidden="true" /></a>
        </li>
      {/each}
    </ul>
  </div>
{/snippet}

<section class="news" id="news" aria-labelledby="news-h">
  <h2 id="news-h">{t('New in the last updates')}</h2>
  <div class="vers">
    {#each recent as e (e.version)}{@render version(e)}{/each}
  </div>
  {#if older.length}
    <details class="older">
      <summary><span>{t('Older updates')}</span><span class="n num">{older.length}</span><ChevronRight class="chev" size={18} aria-hidden="true" /></summary>
      <div class="vers">
        {#each older as e (e.version)}{@render version(e)}{/each}
      </div>
    </details>
  {/if}
</section>

<style>
  .news {
    margin: 0 0 24px;
    padding: 16px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  h2 {
    margin: 0 0 4px;
    font-size: var(--fs-section);
  }
  .vers {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 380px), 1fr));
    gap: 4px 24px;
  }
  .ver {
    min-width: 0;
  }
  h3 {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 10px;
    margin: 12px 0 2px;
    font-size: var(--fs-sub);
  }
  .date {
    font-size: var(--fs-small);
    font-weight: 400;
    color: var(--ink-3);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .pt {
    min-width: 0;
    font-size: 15px;
    color: var(--ink-2);
    overflow-wrap: anywhere;
  }
  /* Quiet: a text link with a chevron, a 44 px tap area. */
  .try {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    padding: 0 2px 0 8px;
    color: var(--ink);
    font-size: 14px;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 3px;
    white-space: nowrap;
  }
  .try :global(svg) {
    color: var(--ink-3);
  }
  .try:focus-visible {
    outline: var(--focus-ring);
  }
  .older {
    margin-top: 12px;
    border-top: 1px solid var(--line);
  }
  .older summary {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    cursor: pointer;
    list-style: none;
    font-weight: 600;
  }
  .older summary::-webkit-details-marker {
    display: none;
  }
  .older .n {
    margin-left: auto;
    font-weight: 400;
    color: var(--ink-3);
  }
  .older summary :global(.chev) {
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  .older[open] summary :global(.chev) {
    transform: rotate(90deg);
  }
  .older summary:focus-visible {
    outline: var(--focus-ring);
  }
</style>
