<script>
  /**
   * v0.35.0 (Noah, every release from now on): "New in the last updates" at the top of "What the
   * app can do". The last versions open, each with 1-4 points in plain words and "Try it" to the
   * exact place; the older versions fold away (whatsnew.js), back to the first version, in calm
   * groups by version range (each folded again). A version is a small neutral badge; the date
   * shows only when it differs from the version above (no repeated labels).
   */
  import { ChevronRight } from '@lucide/svelte';
  import { t, locale } from '../i18n.svelte.js';
  import { openData } from '../nav.js';
  import { splitNews, groupOlder, shortVersion } from '../whatsnew.js';

  const { recent, older } = splitNews();
  const groups = groupOlder(older);
  const day = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
  function go(p, e) {
    if (p.action !== 'data') return;
    e.preventDefault();
    openData();
  }
</script>

{#snippet version(e, prev)}
  <div class="ver" data-version={e.version}>
    <h3>
      <span class="badge num"><span class="sr">{t('Version {v}', { v: shortVersion(e.version) })}</span><span aria-hidden="true">{shortVersion(e.version)}</span></span>
      {#if !prev || prev.date !== e.date}<span class="date">{day(e.date)}</span>{/if}
    </h3>
    <ul>
      {#each e.points as p (p.text)}
        <li>
          <span class="pt">{t(p.text)}</span>
          {#if p.href}
            <a class="try" href={p.href} onclick={(ev) => go(p, ev)}>{t('Try it')}<ChevronRight size={16} aria-hidden="true" /></a>
          {/if}
        </li>
      {/each}
    </ul>
  </div>
{/snippet}

{#snippet list(entries)}
  <div class="vers">
    {#each entries as e, i (e.version)}{@render version(e, entries[i - 1])}{/each}
  </div>
{/snippet}

<section class="news" id="news" aria-labelledby="news-h">
  <h2 id="news-h">{t('New in the last updates')}</h2>
  {@render list(recent)}
  {#if older.length}
    <details class="older">
      <summary><span>{t('Older updates')}</span><span class="n num">{older.length}</span><ChevronRight class="chev" size={18} aria-hidden="true" /></summary>
      {#each groups as g (g.key)}
        <details class="range" data-range={g.key}>
          <summary>
            <span class="num">{g.from === g.to ? g.from : t('{from} to {to}|versions', { from: g.from, to: g.to })}</span>
            <span class="n num">{g.entries.length}</span>
            <ChevronRight class="chev" size={18} aria-hidden="true" />
          </summary>
          {@render list(g.entries)}
        </details>
      {/each}
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
    align-items: center;
    gap: 2px 10px;
    min-height: 24px;
    margin: 12px 0 2px;
    font-size: var(--fs-small);
    font-weight: 400;
  }
  /* A small neutral badge for the version. */
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 99px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }
  .date {
    font-size: var(--fs-small);
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
    min-height: 44px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
    box-sizing: border-box;
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
    margin: -8px 0;
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
  summary {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    cursor: pointer;
    list-style: none;
  }
  .older > summary {
    font-weight: 600;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary .n {
    margin-left: auto;
    font-weight: 400;
    color: var(--ink-3);
  }
  summary :global(.chev) {
    flex: none;
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  details[open] > summary :global(.chev) {
    transform: rotate(90deg);
  }
  summary:focus-visible {
    outline: var(--focus-ring);
  }
  /* The version ranges: light rows inside "Older updates", each folded again. */
  .range {
    border-top: 1px solid var(--line);
  }
  .range > summary {
    padding-left: 12px;
    font-size: 15px;
    font-weight: 500;
    color: var(--ink-2);
  }
  .range[open] {
    padding-bottom: 8px;
  }
  .range > .vers {
    padding-left: 12px;
  }
</style>
