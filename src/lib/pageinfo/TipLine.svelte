<script>
  /**
   * «Inhalte Flow» IF1 + IF3 (Noah 14.10.2026 «2a», mockups approved 04:32): the line «Good to know» with
   * one tip a day under the page title. × hides it for today, «All tips ›» opens the sheet with every tip
   * of the page (TipsSheet.svelte). WD1 + WD3 (approved 18:34, «1a»): a «Wusstest du» or «Passt zu heute»
   * tip carries its tag; a fitting «Passt zu heute» comes first on its day.
   * page: a key of PAGES (pageinfo.js); name: the page's name for the sheet title. A tip with button + href
   * (from the Einstieg, Noah 19.10 «2a») shows its link in the small line.
   */
  import { Leaf, X } from '@lucide/svelte';
  import TipsSheet from './TipsSheet.svelte';
  import KindTag from './KindTag.svelte';
  import TipLink from './TipLink.svelte';
  import { pageInfo, dayContext } from './store.svelte.js';
  import { tipOfDay, tipPlace, hideToday } from '../pageinfo.js';
  import { localDay } from '../localday.js';
  import { t } from '../i18n.svelte.js';

  let { page, name } = $props();
  const pi = pageInfo();
  const today = localDay();
  const dc = dayContext(today);
  const tip = $derived(pi.loaded ? tipOfDay(pi.info, page, today, dc.ctx) : null);
  const place = $derived(tipPlace(pi.info, page, today, dc.ctx));
  const deg = $derived(tip?.when === 'heat' ? dc.ctx.max : null);
  const tipText = (x) => (x.own ? x.text : t(x.text));
  let open = $state(false);
</script>

{#if tip}
  <div class="card tipl {tip.kind}" data-tip={tip.id} role="note">
    <Leaf size={18} aria-hidden="true" />
    <p>
      <span>{#if tip.kind === 'tip'}<b>{t('Good to know:')}</b>{:else}<KindTag kind={tip.kind} {deg} />{/if} {tipText(tip)} <TipLink {tip} /></span>
      <small>{#if tip.kind === 'today'}{t(tip.note)}{:else}{t('Tip {n} of {of} for {page}', { n: place.n, of: place.of, page: name })}{/if}{#if tip.button && tip.href}{' '}· <a class="lk" href={tip.href} data-tip-go>{t(tip.button)} ›</a>{/if} · <button type="button" class="lk" onclick={() => (open = true)}>{t('All tips ›')}</button></small>
    </p>
    <button type="button" class="ib" aria-label={t('Hide the tip for today')} onclick={() => pi.save((v) => hideToday(v, page, today))}><X size={18} aria-hidden="true" /></button>
  </div>
{/if}

{#if open}<TipsSheet {page} {name} onclose={() => (open = false)} />{/if}

<style>
  /* Gesamttest 20.10 Design 2: one look for help, whatever the kind of tip (the tag names the kind) */
  .tipl {
    display: flex;
    margin-bottom: 12px; /* «Mehr Inhalt»: on pages without a grid gap the next section keeps its distance */
    border: 1px solid var(--help-line);
    border-radius: var(--help-r);
    background: var(--help-bg);
    box-shadow: none;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 8px 12px 16px;
  }
  .tipl > :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--help-icon);
  }
  .tipl > p {
    flex: 1;
    min-width: 0;
    margin: 0;
    display: grid;
    gap: 2px;
  }
  .tipl > p small {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .lk {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    margin: -12px 0;
    border: 0;
    padding: 0 4px;
    background: none;
    color: inherit;
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -10px 0;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
</style>
