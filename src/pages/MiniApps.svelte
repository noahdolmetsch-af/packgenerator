<script>
  /**
   * Ich › Kleine Apps (#/me/apps; mockup HB2, Noah 14.10.2026 «1b 2b», «hb freigeben»): the small apps
   * (miniapps.js) with their icon, «Open» (their own address) and how to put them on the home screen.
   */
  import { MINI_APPS_HANDBOOK } from '../lib/handbook.js';
  import { miniAppPath } from '../lib/miniapps.js';
  import { t } from '../lib/i18n.svelte.js';
  import { ChevronRight } from '@lucide/svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import '../lib/ich/ich.css';

  const path = typeof location !== 'undefined' ? location.pathname : '/';
  const H = MINI_APPS_HANDBOOK;
</script>

<div class="ich-page mini-apps">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t(H.title)} sub={t('Own icon on the phone, same data')} />
  <p class="ma-intro">{H.intro.map((s) => t(s)).join(' ')}</p>
  <ul class="ma-list">
    {#each H.apps as a (a.key)}
      <li class="card ma-app" data-app={a.key}>
        <div class="ma-head">
          <img src={`${miniAppPath(a.key, path)}icon-192.png`} alt="" width="48" height="48" />
          <b>{t(a.title)}</b>
          <a class="btn sm hi" href={miniAppPath(a.key, path)}>{t('Open')}<ChevronRight size={16} aria-hidden="true" /></a>
        </div>
        <ol>{#each a.steps as s (s)}<li>{t(s)}</li>{/each}</ol>
        <p class="ma-ex">{t(a.example)}</p>
      </li>
    {/each}
  </ul>
</div>

<style>
  .ma-intro {
    max-width: 65ch;
    margin: 0 0 var(--sp-4);
    color: var(--ink-2);
  }
  .ma-list {
    display: grid;
    gap: var(--sp-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  @media (min-width: 1000px) {
    .ma-list {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  .ma-app {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-2);
    min-width: 0;
    padding: var(--sp-3) var(--sp-4);
  }
  .ma-head {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
  }
  .ma-head img {
    flex: none;
    border-radius: 12px;
  }
  .ma-head b {
    flex: 1;
    min-width: 0;
  }
  .ma-app ol {
    margin: 0;
    padding-left: 1.2em;
    overflow-wrap: break-word;
  }
  .ma-app p {
    margin: 0;
  }
  .ma-ex {
    font-style: italic;
  }
</style>
