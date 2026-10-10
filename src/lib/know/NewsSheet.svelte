<script>
  /**
   * v0.78.0 «Fünf Orte» 2 / «Übergänge 2» (Noah Ü9a, mockup was-ist-neu-blatt): after an update the
   * app says once what is new, in a calm sheet: the points of the new versions (at most four), each
   * with «Show» to the exact place, then «Fine, go on» and «All news». It comes once per update (Today
   * stores the version, whatsnew.js newsHint); a first visit or a restored backup shows the quiet line.
   */
  import { backClose } from '../ui/backclose.js';
  import { shortVersion } from '../whatsnew.js';
  import { openData } from '../nav.js';
  import { t } from '../i18n.svelte.js';
  import { Sparkles, ChevronRight } from '@lucide/svelte';

  let { entries = [], onclose } = $props();
  const MAX = 4;
  const points = $derived(entries.flatMap((e) => e.points).slice(0, MAX));
  const more = $derived(entries.reduce((n, e) => n + e.points.length, 0) - points.length);
  let dialog = $state();
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  function go(p) {
    dialog.close();
    if (p.action === 'data') openData();
    else if (p.href) location.hash = p.href;
  }
</script>

<dialog class="sheet news" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="news-h">
  <div class="head">
    <span class="ico" aria-hidden="true"><Sparkles size={22} /></span>
    <div>
      <h2 id="news-h">{t('New in {version}', { version: shortVersion(entries[0]?.version ?? '') })}</h2>
      <p class="sub">{t('Shows once after each update')}</p>
    </div>
  </div>
  <ul>
    {#each points as p, i (i)}
      <li>
        <p>{t(p.text)}</p>
        {#if p.href || p.action}<button type="button" class="btn sm" onclick={() => go(p)}>{t('Show')}</button>{/if}
      </li>
    {/each}
  </ul>
  {#if more > 0}<p class="sub">{t('{n} more in the list of news', { n: more })}</p>{/if}
  <div class="acts">
    <button type="button" class="btn hi" onclick={() => dialog.close()}>{t('Fine, go on')}</button>
    <a class="lk" href="#/features?news" onclick={() => dialog.close()}>{t('All news')}<ChevronRight size={16} aria-hidden="true" /></a>
  </div>
</dialog>

<style>
  .head {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-3);
    margin-bottom: var(--sp-3);
  }
  .ico {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: var(--hi-soft);
    color: var(--hi);
  }
  h2 {
    margin: 0;
    font: 700 var(--fs-section) / 1.2 var(--font-body);
  }
  .sub {
    margin: 2px 0 0;
    color: var(--ink-2);
    font: 400 var(--fs-small) / 1.4 var(--font-body);
  }
  ul {
    display: grid;
    gap: var(--sp-2);
    margin: 0 0 var(--sp-3);
    padding: 0;
    list-style: none;
  }
  li {
    padding: var(--sp-3) var(--sp-4);
    border-radius: 12px;
    background: var(--paper-2);
  }
  li p {
    margin: 0;
    font: 400 var(--fs-body) / 1.45 var(--font-body);
  }
  li .btn {
    margin-top: var(--sp-2);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-3) var(--sp-4);
    margin-top: var(--sp-4);
  }
  .lk {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-1);
    min-height: 44px;
    color: var(--ink);
    font: 500 var(--fs-body) / 1.2 var(--font-body);
  }
</style>
