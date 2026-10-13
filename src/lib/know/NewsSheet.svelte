<script>
  /**
   * v0.78.0 «Fünf Orte» 2 / «Übergänge 2» (Noah Ü9a, mockup was-ist-neu-blatt): after an update the
   * app says what is new, in a calm sheet.
   * v0.110.0 Design-Refresh P10 (I11b, Noah 12.10.2026 «Runde 20 freigegeben», answer 2b): the new light
   * window, on a computer in the middle, on a phone from below. «Do not show again» (holds until the
   * next update; switched on again under Ich › Was ist neu), «All news», «Later» (closes only for this
   * start). Without the tick it comes again at the next start (Home.svelte, wasneu.js).
   * v0.118.0 «Was ist neu 2» (mockup W1, Noah 13.10.2026 «w1-w3 freigeben», answers 1a 2a 3a, wish): «New
   * since your last visit», every version since then fully open (its title, one sentence, the main points,
   * the small things in boxes), every line leads to its place (›), no «n more». The main button «Looos»
   * (only here) opens the place of the newest version's first point.
   */
  import { backClose } from '../ui/backclose.js';
  import { shortVersion, countNews } from '../whatsnew.js';
  import { NEWS_HREF } from './wasneu.js';
  import { writeMute, writeLater } from './wasneuStore.js';
  import { openData } from '../nav.js';
  import { t, tn } from '../i18n.svelte.js';
  import { X, ChevronRight } from '@lucide/svelte';
  import VersionNews from './VersionNews.svelte';
  import Btn from '../ui/Btn.svelte';
  import '../bikes/velo-dlg.css';

  let { entries = [], onclose } = $props();
  const e = $derived(entries[0] ?? null);
  const n = $derived(countNews(entries));
  const range = $derived(entries.length > 1 ? t('{from} to {to}|versions', { from: shortVersion(entries.at(-1).version), to: shortVersion(entries[0].version) }) : shortVersion(e?.version ?? ''));
  const sub = $derived(
    [tn(entries.length, '{n} update', '{n} updates'), range, tn(n.points, '{n} news item', '{n} news items') + (n.small ? ` ${t('and a few small things')}` : '')].join(' · '),
  );
  const first = $derived(e?.points.find((p) => p.href || p.action) ?? null);
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
  function go() {
    const p = first;
    dialog.close();
    if (p?.action === 'data') openData();
    else location.hash = p?.href ?? NEWS_HREF;
  }
  // a line of a version: the window closes, then its place opens (VersionNews follows the link)
  const leave = () => dialog?.close();
</script>

<dialog class="sheet vdlg from-below news" bind:this={dialog} use:backClose onclose={closed} aria-labelledby="news-h">
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="news-h">{t('New since your last visit')}</h2>
      <p class="vd-sub">{sub}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <div class="nw-sc">
    {#each entries as x (x.version)}<VersionNews e={x} level={3} onnav={leave} />{/each}
  </div>
  <label class="stop">
    <input type="checkbox" bind:checked={stop} />
    <span><b>{t('Do not show again')}</b><small>{t('until the next update · show again: Me › What is new')}</small></span>
  </label>
  <div class="vd-foot nw-foot">
    <Btn href={NEWS_HREF} label={t('All news')} onclick={() => dialog.close()} />
    <Btn label={t('Later')} onclick={() => dialog.close()} />
    <button type="button" class="btn k hi nw-go" onclick={go}><span class="kl">{t("Let's go|news")}</span><ChevronRight size={16} aria-hidden="true" /></button>
  </div>
</dialog>

<style>
  dialog.news[open] {
    display: flex;
    flex-direction: column;
    width: min(680px, calc(100vw - 24px));
    max-height: calc(100vh - 48px);
  }
  .nw-sc {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    margin: 0 -4px;
    padding: 0 4px;
  }
  .nw-go {
    padding-inline: 22px;
  }
  .stop {
    flex: none;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin: 6px 0 0;
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
  /* phone: «Looos» over the whole width, the other two side by side below it */
  @media (max-width: 719px) {
    dialog.news[open] {
      width: 100vw;
      max-height: calc(100dvh - 56px);
    }
    .nw-foot {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    .nw-foot :global(.nw-go) {
      grid-column: 1 / -1;
      order: -1;
      justify-content: center;
    }
    .nw-foot :global(.btn) {
      justify-content: center;
    }
  }
</style>
