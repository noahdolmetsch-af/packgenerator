<script>
  /**
   * v0.78.0 «Fünf Orte» 2 / «Übergänge 2» (Noah Ü9a, mockup was-ist-neu-blatt): after an update the
   * app says what is new, in a calm sheet.
   * v0.110.0 Design-Refresh P10 (I11b, Noah 12.10.2026 «Runde 20 freigegeben», answer 2b): the new light
   * window, on a computer in the middle, on a phone from below. «New in 0.110: name», one sentence, the
   * points (at most four, of every version since the last visit), «Do not show again» (holds until the
   * next update; switched on again under Ich › Was ist neu), «All news», «Later» (closes only for this
   * start) and «Try it ›». Without the tick it comes again at the next start (Home.svelte, wasneu.js).
   */
  import { backClose } from '../ui/backclose.js';
  import { shortVersion } from '../whatsnew.js';
  import { NEWS_HREF } from './wasneu.js';
  import { writeMute, writeLater } from './wasneuStore.js';
  import { openData } from '../nav.js';
  import { t } from '../i18n.svelte.js';
  import { Star, X, ChevronRight } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';

  let { entries = [], onclose } = $props();
  const MAX = 4;
  const e = $derived(entries[0] ?? null);
  const points = $derived(entries.flatMap((x) => x.points).slice(0, MAX));
  const more = $derived(entries.reduce((n, x) => n + x.points.length, 0) - points.length);
  const first = $derived(points.find((p) => p.href || p.action) ?? null);
  let dialog = $state();
  let stop = $state(false);
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  function closed() {
    // «Do not show again» until the next update; else «Later»: only for this start
    if (e) (stop ? writeMute : writeLater)(e.version);
    onclose?.();
  }
  function tryIt() {
    const p = first;
    dialog.close();
    if (p?.action === 'data') openData();
    else location.hash = p?.href ?? NEWS_HREF;
  }
</script>

<dialog class="sheet vdlg from-below news" bind:this={dialog} use:backClose onclose={closed} aria-labelledby="news-h">
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="news-h">{e?.title ? t('New in {v}: {name}', { v: shortVersion(e.version), name: t(e.title) }) : t('New in {version}', { version: shortVersion(e?.version ?? '') })}</h2>
      <p class="vd-sub">{t('at each start after an update, on computer and phone')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  {#if e?.lead}<p class="lead">{t(e.lead)}</p>{/if}
  <ul class="vd-panel pts">
    {#each points as p, i (i)}
      <li><span class="ico" aria-hidden="true"><Star size={16} /></span><p>{t(p.text)}</p></li>
    {/each}
  </ul>
  {#if more > 0}<p class="vd-sub">{t('{n} more in the list of news', { n: more })}</p>{/if}
  <label class="stop">
    <input type="checkbox" bind:checked={stop} />
    <span><b>{t('Do not show again')}</b><small>{t('until the next update · show again: Me › What is new')}</small></span>
  </label>
  <div class="vd-foot">
    <a class="btn" href={NEWS_HREF} onclick={() => dialog.close()}>{t('All news')}</a>
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Later')}</button>
    <button type="button" class="btn hi" onclick={tryIt}>{t('Try it')}<ChevronRight size={16} aria-hidden="true" /></button>
  </div>
</dialog>

<style>
  .lead {
    margin: 0 0 12px;
    overflow-wrap: break-word;
  }
  .pts li {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 8px 0;
  }
  .ico {
    flex: none;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: var(--r-ctl);
    background: var(--line);
    color: var(--ink-2);
  }
  .pts p {
    margin: 0;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .stop {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin: 12px 0 0;
    padding: 12px 0 0;
    border-top: 1px solid var(--line);
    cursor: pointer;
  }
  .stop input {
    flex: none;
    width: 20px;
    height: 20px;
    margin: 2px 0 0;
    accent-color: var(--hi);
  }
  .stop span {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .stop b {
    font-weight: 500;
  }
  .stop small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
</style>
