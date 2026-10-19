<script>
  /**
   * v0.31.0 (Noah 9a, variant A): the head of Bikes → Setup: the bike's name, km, weight, bags and
   * "n care due"; the bikes as tabs, "+ Bike" at the end, "Edit" next to the name.
   * Design-Refresh P7 «Velo» (V1, Noah 12.10.2026 «v1-v4 freigabe»): no dark band any more. A quiet
   * line under the page title, the bikes as light chips (the chosen one dark, with a bike icon),
   * «+ Velo» dashed, then the bike's name as the section title with its numbers below.
   * VS3 (Noah 14.10.2026 «1a»): the standard bike (first in the order) has a star; one quiet line
   * «Standard bike and order · Change» opens the order window.
   */
  import { tick } from 'svelte';
  import { Gauge, Weight, Briefcase, Pencil, Plus, Scale, Bike, Star } from '@lucide/svelte';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import { formatVolume, bikeTypeName } from '../bikes.js';
  import { formatWeight } from '../gear.js';
  import './standardvelo.css';
  import MoreActions from '../ui/MoreActions.svelte';

  let { bikes, bike, setup, kind, cost = '', due = 0, careHref = '', sub = '', onbike, onadd, onedit, onorder = null, menu = [], link = null } = $props();

  const kg = (g) => `${(g / 1000).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
  const bagsG = $derived(setup.bagCount && setup.unweighed < setup.bagCount ? formatWeight(setup.bagsG) : '');
  let strip = $state();
  let row = $state();
  // the chosen bike stands first on a phone: show the row from its start again
  $effect(() => {
    void bike.id;
    if (row) row.scrollLeft = 0;
  });
  function keys(e) {
    const i = bikes.findIndex((b) => b.id === bike.id);
    const to = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
    if (to == null || to < 0 || to >= bikes.length) return;
    e.preventDefault();
    onbike?.(bikes[to].id);
    tick().then(() => strip?.querySelector('[aria-selected="true"]')?.focus());
  }
  const kick = $derived([bike.type ? t(bikeTypeName(bike.type)) : '', bike.use].filter(Boolean).join(' · '));
</script>

<section class="setup-band" aria-label={t('Bike')}>
  {#if sub}<p class="page-sub vb-sub">{sub}</p>{/if}
  <div class="tabsrow" bind:this={row}>
    <div class="strip" bind:this={strip} role="tablist" aria-label={t('Bike')} tabindex="-1" onkeydown={keys}>
      {#each bikes as b (b.id)}
        <button type="button" role="tab" aria-selected={b.id === bike.id} tabindex={b.id === bike.id ? 0 : -1} title={b.name} onclick={() => onbike?.(b.id)}>{#if b.id === bike.id}<Bike size={16} aria-hidden="true" />{/if}<span class="bn">{b.name}</span>{#if b.id === bikes[0]?.id && bikes.length > 1}<Star size={13} class="sv-star" aria-hidden="true" />{/if}</button>
      {/each}
    </div>
    <button type="button" class="add" onclick={() => onadd?.()} aria-label={t('Add bike')} title={t('Add bike')}><Plus size={16} aria-hidden="true" /><span class="addt">{t('Bike')}</span></button>
  </div>
  {#if onorder && bikes.length > 1}
    <p class="sv-line"><Star size={14} class="sv-star" aria-hidden="true" /><span>{t('Standard bike and order')}</span><button type="button" class="link" onclick={() => onorder()}>{t('Change')}</button></p>
  {/if}
  <h2 class="name">
    <span>{bike.name}</span>
    <button type="button" class="edit" onclick={() => onedit?.()} aria-label={t('Edit {name}', { name: bike.name })} title={t('Edit')}><Pencil size={16} aria-hidden="true" /><span class="et" aria-hidden="true">{t('Edit')}</span></button>
    <!-- Impeccable Runde 2 (Velos 2): the bike's «…», with «Link zu Hersteller und Garantie eintragen» -->
    {#if menu.length}<span class="bmenu"><MoreActions title={bike.name} label={t('More for {title}', { title: bike.name })} actions={menu} /></span>{/if}
  </h2>
  <p class="meta num">
    {#if kick}<span class="kick">{kick}</span>{/if}
    <span><Gauge size={15} aria-hidden="true" />{#if bike.km != null}<b>{num(bike.km)} km</b>{:else}{t('km not set')}{/if}</span>
    <span><Weight size={15} aria-hidden="true" />{#if kind === 'missing'}{t('bike not weighed')}{:else}<b>{kind === 'estimate' ? '~' : ''}{kg(bike.weightG)}</b> {kind === 'estimate' ? t('estimate') : t('measured')}{/if}</span>
    <span><Briefcase size={15} aria-hidden="true" />{tn(setup.bagCount, '{n} bag', '{n} bags')} · {formatVolume(setup.volumeL)}{bagsG ? ` · ${bagsG}` : ''}{#if setup.unweighed}<i class="nw" title={tn(setup.unweighed, '{n} bag not weighed', '{n} bags not weighed')}><Scale size={13} aria-hidden="true" />{setup.unweighed}<span class="sr">{tn(setup.unweighed, '{n} bag not weighed', '{n} bags not weighed')}</span></i>{/if}</span>
    {#if cost}<span class="vb-cost" data-cost>{cost}</span>{/if}
    {#if link}<a class="vb-link" data-sk-link={link.kind} href={link.url} target="_blank" rel="noopener noreferrer">{link.name} ↗</a>{/if}
    {#if due}<a class="pill warn due" href={careHref}>{tn(due, '{n} care due', '{n} care due')}</a>{/if}
  </p>
</section>

<style>
  .setup-band {
    margin: 0 0 16px;
    min-width: 0;
  }
  .sv-line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: -8px 0 16px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sv-line .link {
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--accent);
    font: 500 var(--fs-small) var(--font-body);
    text-decoration: underline;
    cursor: pointer;
  }
  .vb-sub {
    margin: -6px 0 12px;
  }
  .tabsrow {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 20px;
  }
  /* The tabs and «+ Velo» wrap as one row of chips. */
  .strip {
    display: contents;
  }
  .tabsrow button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    max-width: 100%;
    padding: 6px 14px;
    box-sizing: border-box;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.25 var(--font-body);
    cursor: pointer;
  }
  .strip .bn {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .strip button[aria-selected='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .tabsrow .add {
    border-style: dashed;
    border-color: var(--line-strong);
    color: var(--ink-2);
  }
  @media (hover: hover) {
    .tabsrow button:not([aria-selected='true']):hover {
      background: var(--paper-2);
    }
  }
  @media (pointer: coarse) {
    .tabsrow button {
      min-height: 44px;
    }
  }
  .name {
    display: flex;
    align-items: center;
    gap: 2px;
    margin: 0;
    font: 600 var(--fs-sub) / 1.25 var(--font-body);
    color: var(--ink);
  }
  .name span {
    min-width: 0;
    overflow-wrap: break-word;
  }
  /* «Alles selbst bearbeiten» (Noah 19.10.2026): the pencil says «Bearbeiten», so name, photo and delete are easy to find */
  .edit {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 44px;
    height: 44px;
    padding: 0 10px;
    font-size: var(--fs-small);
    font-weight: 500;
    border: 0;
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .edit:hover {
    color: var(--ink);
    background: var(--paper-2);
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 14px;
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .meta > span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .meta b {
    color: var(--ink-2);
    font-weight: 600;
  }
  .meta > .vb-cost {
    color: var(--ink-2);
    font-weight: 600;
  }
  .bmenu {
    flex: none;
    display: inline-flex;
    font: 400 var(--fs-body) / 1 var(--font-body);
  }
  /* quiet like the pencil beside it: no frame until hover or focus */
  .bmenu :global(.btn.dots) {
    border-color: transparent;
    background: none;
    color: var(--ink-3);
  }
  .bmenu :global(.btn.dots:hover),
  .bmenu :global(.btn.dots:focus-visible) {
    background: var(--paper-2);
    color: var(--ink);
  }
  .vb-link {
    position: relative;
    display: inline-flex;
    align-items: center;
    color: var(--accent);
    font-weight: 500;
    text-decoration: underline;
    text-underline-offset: 3px;
    overflow-wrap: break-word;
  }
  .nw {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-style: normal;
    font-size: var(--fs-tiny);
  }
  .due {
    position: relative;
    text-decoration: none;
  }
  /* 44 px tap area around the small badge and the link, without moving the layout. */
  .vb-link::after,
  .due::after {
    content: '';
    position: absolute;
    left: -6px;
    right: -6px;
    top: 50%;
    height: 44px;
    transform: translateY(-50%);
  }
  /* Impeccable Runde 2 (Ausstattung 2): on a phone the bikes are one row to swipe, the chosen one first
     and the right end fading out, like BikeChips on the other Velo pages. */
  @media (max-width: 599px) {
    .tabsrow {
      flex-wrap: nowrap;
      overflow-x: auto;
      overscroll-behavior-x: contain;
      scrollbar-width: none;
      padding-right: 32px;
      -webkit-mask-image: linear-gradient(to right, var(--ink) calc(100% - 40px), transparent);
      mask-image: linear-gradient(to right, var(--ink) calc(100% - 40px), transparent);
    }
    .tabsrow::-webkit-scrollbar {
      display: none;
    }
    .tabsrow button {
      flex: none;
      max-width: 80vw;
    }
    .strip .bn {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .strip button[aria-selected='true'] {
      order: -1;
    }
  }
  @media print {
    .tabsrow {
      display: none;
    }
  }
</style>
