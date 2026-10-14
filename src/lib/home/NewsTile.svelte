<script>
  /**
   * v0.94.0 «Kachel-Wand» (mockup A, Noah's vision: the newest features prominent on the start page):
   * the tile «New in the app».
   * v0.110.0 Design-Refresh P10 (I11e, Noah 12.10.2026 «Runde 20 freigegeben», answer 5b): the tile «New»,
   * tinted, with the icon, «New in 0.110 · 13 days left», the name, one sentence and «Try it», «What is
   * new» and «Take away». After an update it sits on top of the wall for 14 days (Home.svelte,
   * wasneu.js pinNews); like every tile it can be moved, resized or taken away. Small: only the version.
   * 0.133.3: in a narrow tile (half width on a phone) the text goes under the icon instead of beside it,
   * so a long word in the title («Inspiration») is never broken mid-letter.
   */
  import { Sparkles, ChevronRight } from '@lucide/svelte';
  import { WHATS_NEW, shortVersion } from '../whatsnew.js';
  import { NEWS_HREF } from '../know/wasneu.js';
  import { openData } from '../nav.js';
  import { t, tn } from '../i18n.svelte.js';

  let { size = 'w', days = 0, onremove = null } = $props();
  const e = WHATS_NEW[0];
  const first = e.points.find((p) => p.href || p.action) ?? null;
  function tryIt(ev) {
    if (first?.action !== 'data') return;
    ev.preventDefault();
    openData();
  }
</script>

{#if size === 's'}
  <a class="news s" href={NEWS_HREF} data-news={e.version}>
    <span class="tag"><Sparkles size={14} aria-hidden="true" />{t('New · {v}', { v: shortVersion(e.version) })}</span>
    <span class="go">{t('New in the app')}</span>
  </a>
{:else}
  <section class="news" class:long={size === 'long'} data-news={e.version} aria-labelledby="news-tile-h">
    <span class="ic" aria-hidden="true"><Sparkles size={20} /></span>
    <div class="m">
      <p class="when">{days > 0 ? tn(days, 'New in {v} · {n} day left', 'New in {v} · {n} days left', { v: shortVersion(e.version) }) : t('New in {version}', { version: shortVersion(e.version) })}</p>
      <h3 id="news-tile-h">{e.title ? t(e.title) : t('New in the app')}</h3>
      <p class="pt">{e.lead ? t(e.lead) : t(e.points[0].text)}</p>
      <div class="acts">
        <a class="btn sm hi" href={first?.href ?? NEWS_HREF} onclick={tryIt}>{t('Try it')}<ChevronRight size={16} aria-hidden="true" /></a>
        <a class="btn sm" href={NEWS_HREF}>{t('What is new')}</a>
        {#if onremove}<button type="button" class="btn sm" onclick={onremove}>{t('Take away|tile')}</button>{/if}
      </div>
    </div>
  </section>
{/if}

<style>
  .news {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 6px 14px;
    height: 100%;
    min-height: 84px;
    padding: 12px 14px;
    box-sizing: border-box;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--hi-soft);
    box-shadow: var(--card-shadow);
    color: var(--ink);
    overflow: hidden;
  }
  .news.s {
    flex-direction: column;
    flex-wrap: nowrap;
    gap: 4px;
    background: var(--paper);
    text-decoration: none;
  }
  .ic {
    flex: none;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
  }
  .m {
    flex: 1 1 120px;
    min-width: 0;
  }
  .when {
    margin: 0;
    color: var(--hi);
    font: 600 var(--fs-tiny) / 1.4 var(--font-body);
  }
  h3 {
    margin: 2px 0 0;
    font: 600 var(--fs-sub) / 1.25 var(--font-body);
    overflow-wrap: break-word;
  }
  .pt {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 4px 0 0;
    font-size: var(--fs-small);
    line-height: 1.4;
    overflow-wrap: break-word;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }
  .acts .btn:not(.hi) {
    background: var(--paper);
  }
  .tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    align-self: flex-start;
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--hi-soft);
    color: var(--badge-ink);
    font: 700 var(--fs-tiny)/1.5 var(--font-body);
  }
  .go {
    margin-top: auto;
    color: var(--hi);
    font: 600 var(--fs-small) var(--font-body);
  }
  .news.s:hover .go {
    text-decoration: underline;
  }
</style>
