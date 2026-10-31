<script>
  /**
   * «Pfad auf jeder Seite» Schritt 2: the small «i» next to a tile or a page; it opens the sheet «Where does this
   * come from?»: the path, what it is, where the data comes from, what belongs to it, and a button that goes there.
   * Switched off together with the path line (Ich › Darstellung › Bedienung). info: an entry of spotinfo.js.
   */
  import { Info, X, ChevronRight } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { backClose } from '../ui/backclose.js';
  import { ALL_PLACES, PLACE_TABS } from '../nav.js';
  import { placeLabel, tabLabel } from '../anpassen.svelte.js';
  import { FEATURE, featureHref } from '../features.js';
  import { goFeature } from '../know/featureRun.js';
  import { ops } from '../bedienung.svelte.js';
  import '../bikes/velo-dlg.css';

  let { info, id = '' } = $props();

  let dialog = $state();
  // the sheet lives under <body>, not inside the tile: a tile's own headings and links stay the tile's
  const toBody = (node) => {
    document.body.appendChild(node);
    return { destroy: () => node.remove() };
  };
  const feat = $derived(info.fid ? FEATURE[info.fid] : null);
  const place = $derived(ALL_PLACES.find((p) => p.key === info.place));
  const tab = $derived((PLACE_TABS[info.place] ?? []).find((x) => x.key === info.tab));
  const name = $derived(feat ? t(feat.title) : info.name ? t(info.name) : '');
  const text = $derived(feat ? t(feat.text) : info.text ? t(info.text) : '');
  const steps = $derived([
    ...(place ? [{ label: placeLabel(place), href: place.href }] : []),
    ...(tab ? [{ label: tabLabel(info.place, tab), href: tab.href }] : []),
  ]);
  const last = $derived(steps.at(-1)?.label === name ? '' : name);
  const goHref = $derived(info.href ?? (feat ? featureHref(feat) : null));
  const related = $derived((info.related ?? []).map((r) => FEATURE[r]).filter(Boolean));

  const open = () => dialog?.showModal();
  const close = () => dialog?.close();
  function go() {
    close();
    if (feat) goFeature(feat);
    else if (goHref) location.hash = goHref;
  }
</script>

{#if ops.path}
  <button type="button" class="idot" aria-label={t('Where does this come from?')} onclick={open} data-info-open={id || info.fid || info.name}>
    <Info size={16} aria-hidden="true" />
  </button>
  <dialog class="sheet vdlg from-below idlg" bind:this={dialog} use:toBody use:backClose aria-labelledby="idlg-h" data-info-sheet>
    <div class="vd-head">
      <div class="vd-t">
        <h2 id="idlg-h">{name}</h2>
        <p class="vd-sub">{t('Where does this come from?')}</p>
      </div>
      <button type="button" class="vd-x" aria-label={t('Close')} onclick={close}><X size={20} aria-hidden="true" /></button>
    </div>
    <h3 class="lb">{t('Path')}</h3>
    <p class="path" data-info-path>
      {#each steps as s, n (n)}<a href={s.href} onclick={close}>{s.label}</a><ChevronRight class="sep" size={12} aria-hidden="true" />{/each}<span>{last || name}</span>
    </p>
    {#if text}<p class="tx">{text}</p>{/if}
    {#if info.from?.length}
      <h3 class="lb">{t('The data comes from')}</h3>
      <ul class="ls" data-info-from>{#each info.from as f (f)}<li>{t(f)}</li>{/each}</ul>
    {/if}
    {#if related.length}
      <h3 class="lb">{t('Belongs together')}</h3>
      <ul class="ls" data-info-related>
        {#each related as r (r.id)}<li><button type="button" class="lk" onclick={() => { close(); goFeature(r); }}>{t(r.title)}</button></li>{/each}
      </ul>
    {/if}
    {#if feat}<p class="also">{t('You also find it in the search, in «What the app can do» and in Quick Links.')}</p>{/if}
    <div class="vd-foot">
      <button type="button" class="btn" onclick={close}>{t('Close')}</button>
      {#if goHref || feat}<button type="button" class="btn primary" onclick={go} data-info-go>{info.go ? t(info.go) : t('Go there')}</button>{/if}
    </div>
  </dialog>
{/if}

<style>
  .idot {
    position: relative;
    display: inline-grid;
    flex: none;
    place-items: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  .idot:hover {
    color: var(--ink);
  }
  /* 44 px tap area around the small sign, without moving the layout */
  .idot::after {
    content: '';
    position: absolute;
    inset: -10px;
  }
  .lb {
    margin: 14px 0 4px;
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    color: var(--ink-3);
    text-transform: none;
  }
  .path {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 2px;
    margin: 0;
    font-size: var(--fs-body);
  }
  .path a {
    color: var(--ink-2);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .path :global(.sep) {
    color: var(--ink-3);
  }
  .tx {
    margin: 10px 0 0;
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .ls {
    margin: 0;
    padding-left: 18px;
  }
  .ls li {
    margin: 2px 0;
    overflow-wrap: break-word;
  }
  .lk {
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
    text-align: left;
  }
  .also {
    margin: 12px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
