<script>
  /**
   * v0.94.0 «Kachel-Wand» (mockup A, Noah's vision: the newest features prominent on the start page):
   * the tile «New in the app»: the newest version and its first point, «Show all» opens the list on
   * «What the app can do». Small: only the version.
   */
  import { Sparkles } from '@lucide/svelte';
  import { WHATS_NEW, shortVersion } from '../whatsnew.js';
  import { t } from '../i18n.svelte.js';

  let { size = 'w' } = $props();
  const e = WHATS_NEW[0];
</script>

<a class="news" class:s={size === 's'} href="#/features?news" data-news={e.version}>
  <span class="tag"><Sparkles size={14} aria-hidden="true" />{t('New · {v}', { v: shortVersion(e.version) })}</span>
  {#if size !== 's'}<span class="pt">{t(e.points[0].text)}</span>{/if}
  <span class="go">{size === 's' ? t('New in the app') : t('Show what is new ›')}</span>
</a>

<style>
  .news {
    display: flex;
    flex-direction: column;
    gap: 4px;
    height: 100%;
    min-height: 84px;
    padding: 10px 12px;
    border: 1px solid var(--hi-soft);
    border-radius: 14px;
    background: color-mix(in srgb, var(--hi-soft) 45%, var(--paper));
    color: var(--ink);
    text-decoration: none;
    overflow: hidden;
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
  .pt {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: var(--fs-small);
    line-height: 1.35;
  }
  .go {
    margin-top: auto;
    color: var(--hi);
    font: 600 var(--fs-small) var(--font-body);
  }
  .news:hover .go {
    text-decoration: underline;
  }
</style>
