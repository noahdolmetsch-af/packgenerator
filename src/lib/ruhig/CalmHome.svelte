<script>
  /**
   * Ruhige Ansicht › step 5 (Noah 02.11.2026 «bauen alles»): on Today the calm view shows only the one thing
   * you do, big and alone. «Show Today anyway» opens the normal Today for this visit (nothing is ended or lost).
   * Wraps Today: `children` is the normal Today.
   */
  import { liveQuery } from 'dexie';
  import { Moon } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { CALM_KEY, calmOf, calmOver, calmLeft, calmUntil } from './weniger.js';
  import { endCalm } from './store.js';
  import { guessHref } from './calmtarget.js';

  let { children } = $props();
  const q = liveQuery(async () => calmOf((await db.settings.get(CALM_KEY))?.value));
  let showAll = $state(false);
  let now = $state(Date.now());
  $effect(() => {
    if (!$q?.until) return;
    now = Date.now();
    const id = setInterval(() => (now = Date.now()), 20000);
    return () => clearInterval(id);
  });
  let guess = $state('');
  $effect(() => {
    const c = $q;
    guess = '';
    if (!c || c.href) return;
    const what = c.what;
    guessHref(what, t).then((h) => {
      if ($q?.what === what) guess = h;
    });
  });
  const on = $derived(!!$q && !calmOver($q, now) && !showAll);
  const target = $derived($q?.href || guess);
  const left = $derived(calmLeft($q, now));
  const more = () => db.settings.put({ key: CALM_KEY, value: { ...$q, until: calmUntil(15, now) } });
</script>

{#if on}
  <section class="chm" data-calm-home aria-labelledby="chm-h">
    <Moon size={28} aria-hidden="true" />
    <p class="chm-l" id="chm-h">{t('You are doing')}</p>
    <p class="chm-w">{$q.what}</p>
    {#if left}<p class="chm-t" data-calm-home-left>{t('{n} min left', { n: left })}</p>{/if}
    <div class="chm-r">
      {#if target}<a class="btn hi" href={target} data-calm-home-open>{t('Open')}</a>{/if}
      <button type="button" class="btn" onclick={() => endCalm($q)} data-calm-home-done>{t('Done|calm')}</button>
    </div>
    <button type="button" class="chm-any" onclick={() => (showAll = true)} data-calm-home-all>{t('Show Today anyway')}</button>
  </section>
{:else}
  {@render children()}
{/if}

<style>
  .chm {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
    margin: var(--sp-5, 24px) auto;
    padding: var(--sp-5, 24px);
    max-width: 520px;
    border-radius: var(--radius-card);
    background: var(--accent-soft);
    color: var(--ink);
  }
  .chm-l {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-soft, var(--ink));
  }
  .chm-w {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    overflow-wrap: anywhere;
  }
  .chm-t {
    margin: 0;
    font-size: var(--fs-small);
  }
  .chm-r {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin-top: 8px;
  }
  .chm-any {
    margin-top: 12px;
    min-height: 44px;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
</style>
