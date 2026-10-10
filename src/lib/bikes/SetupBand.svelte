<script>
  /**
   * v0.31.0 (Noah 9a, variant A): the dark band of Bikes → Setup, like the band of the trip pages
   * (trip/TripBand.svelte): the bike's name, km, weight, bags and "n care due"; the bikes as tabs
   * in the band, "+ Bike" at the end, "Edit" next to the name.
   */
  import { tick } from 'svelte';
  import { Gauge, Weight, Briefcase, Pencil, Plus, Scale } from '@lucide/svelte';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import { formatVolume, bikeTypeName } from '../bikes.js';
  import { formatWeight } from '../gear.js';

  let { bikes, bike, setup, kind, due = 0, careHref = '', onbike, onadd, onedit } = $props();

  const kg = (g) => `${(g / 1000).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
  const bagsG = $derived(setup.bagCount && setup.unweighed < setup.bagCount ? formatWeight(setup.bagsG) : '');
  let strip = $state();
  // The chosen bike's tab stays in view in a long row of tabs.
  $effect(() => {
    bike.id;
    tick().then(() => strip?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }));
  });
  // v0.40.0: more tabs to the right than fit: the row fades out there.
  let more = $state(false);
  const measure = () => (more = !!strip && strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 2);
  $effect(() => {
    bikes.length;
    tick().then(measure);
    addEventListener('resize', measure);
    return () => removeEventListener('resize', measure);
  });
  function keys(e) {
    const i = bikes.findIndex((b) => b.id === bike.id);
    const to = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
    if (to == null || to < 0 || to >= bikes.length) return;
    e.preventDefault();
    onbike?.(bikes[to].id);
    tick().then(() => strip?.querySelector('[aria-selected="true"]')?.focus());
  }
</script>

<section class="band setup-band" aria-label={t('Bike')}>
  <p class="kick">{[bike.type ? t(bikeTypeName(bike.type)) : '', bike.use].filter(Boolean).join(' · ')}</p>
  <h2 class="name">
    <span>{bike.name}</span>
    <button type="button" class="edit" onclick={() => onedit?.()} aria-label={t('Edit {bike}', { bike: bike.name })} title={t('Edit')}><Pencil size={18} aria-hidden="true" /></button>
  </h2>
  <p class="meta num">
    <span><Gauge size={16} aria-hidden="true" />{#if bike.km != null}<b>{num(bike.km)} km</b>{:else}{t('km not set')}{/if}</span>
    <span><Weight size={16} aria-hidden="true" />{#if kind === 'missing'}{t('bike not weighed')}{:else}<b>{kind === 'estimate' ? '~' : ''}{kg(bike.weightG)}</b> {kind === 'estimate' ? t('estimate') : t('measured')}{/if}</span>
    <span><Briefcase size={16} aria-hidden="true" />{tn(setup.bagCount, '{n} bag', '{n} bags')} · {formatVolume(setup.volumeL)}{bagsG ? ` · ${bagsG}` : ''}{#if setup.unweighed}<i class="nw" title={tn(setup.unweighed, '{n} bag not weighed', '{n} bags not weighed')}><Scale size={13} aria-hidden="true" />{setup.unweighed}<span class="sr">{tn(setup.unweighed, '{n} bag not weighed', '{n} bags not weighed')}</span></i>{/if}</span>
    {#if due}<a class="badge due" href={careHref}>{tn(due, '{n} care due', '{n} care due')}</a>{/if}
  </p>
  <div class="tabsrow">
    <div class="strip" class:more bind:this={strip} onscroll={measure} role="tablist" aria-label={t('Bike')} tabindex="-1" onkeydown={keys}>
      {#each bikes as b (b.id)}
        <button type="button" role="tab" aria-selected={b.id === bike.id} tabindex={b.id === bike.id ? 0 : -1} title={b.name} onclick={() => onbike?.(b.id)}><span class="bn">{b.name}</span></button>
      {/each}
    </div>
    <button type="button" class="add" onclick={() => onadd?.()} aria-label={t('Add bike')} title={t('Add bike')}><Plus size={16} aria-hidden="true" /><span class="addt">{t('Bike')}</span></button>
  </div>
</section>

<style>
  .band {
    background: var(--brand);
    color: var(--brand-ink);
    border-radius: 12px;
    padding: 16px 16px 0;
    margin: 0 0 16px;
    min-width: 0;
  }
  .kick {
    margin: 0;
    min-height: 1em;
    font-size: 13px;
    font-weight: 600;
    color: var(--brand-ink-2);
  }
  .name {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 2px 0 6px;
    font: 700 24px/1.15 var(--font-body);
    letter-spacing: -0.01em;
  }
  .name span {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .edit {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--brand-ink-2);
    cursor: pointer;
  }
  .edit:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 14px;
    margin: 0 0 6px;
    font-size: 14px;
    color: var(--brand-ink-2);
  }
  .meta > span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .meta b {
    color: var(--brand-ink);
    font-weight: 600;
  }
  .nw {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-style: normal;
    font-size: 12px;
    color: var(--brand-ink-2);
  }
  .badge.due {
    position: relative;
    display: inline-flex;
    align-items: center;
    padding: 2px 9px;
    border-radius: 99px;
    background: rgba(255, 91, 20, 0.22);
    color: #ffc7ab;
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
  }
  /* 44 px tap area around the small badge, without moving the layout. */
  .badge.due::after {
    content: '';
    position: absolute;
    left: -6px;
    right: -6px;
    top: 50%;
    height: 44px;
    transform: translateY(-50%);
  }
  .tabsrow {
    display: flex;
    align-items: stretch;
    margin: 8px -16px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
  }
  .strip {
    flex: 1;
    min-width: 0;
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .strip::-webkit-scrollbar {
    display: none;
  }
  /* v0.40.0 (design check): a long name is shortened with "…" (the full name as title); a row
     wider than the band fades out at the right, so it shows there is more to swipe. */
  .strip .bn {
    max-width: 16ch;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .strip.more {
    mask-image: linear-gradient(to right, #000 calc(100% - 32px), transparent);
    -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 32px), transparent);
  }
  .strip button,
  .add {
    position: relative;
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 52px;
    padding: 0 14px;
    border: 0;
    background: none;
    color: var(--brand-ink-2);
    font: 500 15px var(--font-body);
    white-space: nowrap;
    cursor: pointer;
  }
  .strip button[aria-selected='true'] {
    color: #fff;
    font-weight: 600;
  }
  .strip button[aria-selected='true']::after {
    content: '';
    position: absolute;
    left: 14px;
    right: 14px;
    bottom: 0;
    height: 3px;
    border-radius: 3px 3px 0 0;
    background: var(--hi-bright);
  }
  .add {
    border-left: 1px solid rgba(255, 255, 255, 0.12);
    min-width: 52px;
  }
  .band :global(:focus-visible) {
    outline: 2px solid var(--focus-on-dark);
    outline-offset: -2px;
  }
  @media (hover: hover) {
    .strip button:hover,
    .add:hover {
      color: #fff;
    }
  }
  @media (max-width: 359px) {
    .addt {
      display: none;
    }
  }
  @media (min-width: 720px) {
    .band {
      padding: 22px 26px 0;
    }
    .name {
      font-size: 32px;
    }
    .meta {
      font-size: 15px;
    }
    .tabsrow {
      margin: 14px -26px 0;
      padding: 0 10px;
    }
    .strip button,
    .add {
      padding: 0 20px;
      font-size: 16px;
    }
    .strip button[aria-selected='true']::after {
      left: 20px;
      right: 20px;
    }
    .add {
      border-left: 0;
    }
    .strip {
      flex: 0 1 auto;
    }
  }
  /* v0.47.0 (Noah 16:58 "Schriftlayout vereinheitlichen"): the band on the Gletscher type scale, like
     every page title: the bike name in the brand face, a quiet uppercase kicker, numbers medium, one
     card radius, the chosen tab medium instead of bold. */
  .band {
    border-radius: var(--radius-card);
  }
  .kick {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .name {
    font: 800 clamp(28px, 1.6vw + 20px, 40px)/1.05 var(--font-brand);
    letter-spacing: 0;
  }
  .meta b {
    font-weight: 500;
  }
  .badge.due {
    font-weight: 500;
  }
  .strip button[aria-selected='true'] {
    font-weight: 500;
  }
  @media print {
    .band {
      display: none;
    }
  }
</style>
