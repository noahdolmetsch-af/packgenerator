<script>
  /**
   * «Wegweiser statt Katalog» PR 23: at the end of a page, a quiet fold with the functions of this page that show only in
   * the right situation (src/lib/erscheint.js). A function whose part is on screen is left out; «Show it in the example»
   * starts the playground on the right day, like «Ausprobieren» in «What is new».
   */
  import { liveQuery } from 'dexie';
  import { onMount } from 'svelte';
  import { t } from '../i18n.svelte.js';
  import { db } from '../db.js';
  import { NOT_KEY, notForMeOf } from '../ruhig/weniger.js';
  import { PLAY_WISH } from '../play.js';
  import { erscheintHier } from '../erscheint.js';

  let { hash = '' } = $props();
  const notQ = liveQuery(async () => notForMeOf((await db.settings.get(NOT_KEY))?.value));
  const all = $derived($notQ ? erscheintHier(hash, $notQ) : []);
  // which parts are on screen now (checked again while the page changes)
  let onScreen = $state({});
  const check = () => {
    const next = {};
    for (const e of all) if (e.shown && document.querySelector(e.shown)) next[e.id] = true;
    if (JSON.stringify(next) !== JSON.stringify(onScreen)) onScreen = next;
  };
  onMount(() => {
    let timer = 0;
    const obs = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(check, 300);
    });
    obs.observe(document.querySelector('main') ?? document.body, { childList: true, subtree: true });
    check();
    return () => (obs.disconnect(), clearTimeout(timer));
  });
  $effect(() => {
    all;
    check();
  });
  const items = $derived(all.filter((e) => !onScreen[e.id]));

  function play(day) {
    try {
      localStorage.setItem(PLAY_WISH, day);
    } catch {
      /* no storage: Me opens without the sheet */
    }
    if (location.hash === '#/me') window.dispatchEvent(new Event('pg:play'));
    else location.hash = '#/me';
  }
</script>

{#if items.length}
  <details class="ew" data-erscheint-wenn-fold>
    <summary>{t('Only in the right situation · {n}', { n: items.length })}</summary>
    <ul>
      {#each items as e (e.id)}
        <li data-erscheint-wenn={e.id}>
          <span><b>{t(e.title)}</b> {t(e.when)}</span>
          {#if e.play}<button type="button" class="link" onclick={() => play(e.play)} data-erscheint-play={e.id}>{t('Show it in the example')}</button>{/if}
        </li>
      {/each}
    </ul>
  </details>
{/if}

<style>
  .ew {
    margin: 16px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    cursor: pointer;
    font-weight: 600;
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 8px;
  }
  li {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 10px;
    overflow-wrap: anywhere;
  }
  b {
    color: var(--ink);
  }
  .link {
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
  }
</style>
