<script>
  /**
   * «Rennatlas» filters (Noah 24.11.2026): the groups of the mockup: Untergrund, Land, Dauer, Anmeldung,
   * each with the number of races it shows. The same groups stand in a column on a wide screen and in
   * the window «Filter» on a phone. Texts out of the file (ground, country) are shown as typed.
   */
  import { t, tn } from '../i18n.svelte.js';
  import { MAX_DAYS } from './atlas-view.js';

  let { filter, facet, counts, onchange } = $props();
  let moreLand = $state(false);
  const TOP = 8;
  const landList = $derived(moreLand || facet.land.length <= TOP + 1 ? facet.land : facet.land.filter((l, i) => i < TOP || filter.land.includes(l.key)));
  const hidden = $derived(facet.land.length - landList.length);
  const flip = (list, key) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);
  const daysText = $derived(
    filter.dmin <= 1 && filter.dmax >= MAX_DAYS ? t('Any length') : filter.dmax >= MAX_DAYS ? t('{n} days or more', { n: filter.dmin }) : filter.dmin <= 1 ? t('Up to {n} days', { n: filter.dmax }) : t('{a} to {b} days', { a: filter.dmin, b: filter.dmax }),
  );
  const pos = (n) => `${((n - 1) / (MAX_DAYS - 1)) * 100}%`;
  const SHOW = $derived([
    { key: 'all', name: 'All|race' },
    { key: 'fav', name: 'Favourites|race', n: facet.fav },
    { key: 'registered', name: 'Registered|race', n: facet.registered },
  ]);
  const SWITCHES = [
    { key: 'opens30', name: 'Opens in the next 30 days' },
    { key: 'open', name: 'Open now' },
    { key: 'fits', name: 'Fits my gaps' },
  ];
</script>

<div class="af" data-atlas-filters>
  <section class="af-g" aria-label={t('Show|race')}>
    <b>{t('Show|race')}</b>
    <div class="af-chips">
      {#each SHOW as o (o.key)}
        <button type="button" class="af-chip" aria-pressed={filter.show === o.key} onclick={() => onchange({ show: o.key })} data-atlas-show={o.key}>{t(o.name)}{#if o.n != null}<i>{o.n}</i>{/if}</button>
      {/each}
    </div>
  </section>
  {#if facet.surface.length}
    <section class="af-g" aria-label={t('Ground|race')}>
      <b>{t('Ground|race')}</b>
      <div class="af-chips">
        {#each facet.surface as s (s.key)}
          <button type="button" class="af-chip" aria-pressed={filter.surface.includes(s.key)} onclick={() => onchange({ surface: flip(filter.surface, s.key) })} data-atlas-surface={s.key}>{s.key}<i>{s.n}</i></button>
        {/each}
      </div>
    </section>
  {/if}
  {#if facet.land.length}
    <section class="af-g" aria-label={t('Country|race')}>
      <b>{t('Country|race')}</b>
      <div class="af-chips">
        {#each landList as l (l.key)}
          <button type="button" class="af-chip" aria-pressed={filter.land.includes(l.key)} onclick={() => onchange({ land: flip(filter.land, l.key) })} data-atlas-land={l.key}>{l.key}<i>{l.n}</i></button>
        {/each}
        {#if hidden > 0}<button type="button" class="af-chip more" onclick={() => (moreLand = true)}>{tn(hidden, '{n} more country', '{n} more countries')}</button>{/if}
      </div>
    </section>
  {/if}
  <section class="af-g" aria-label={t('Length|race')}>
    <b>{t('Length|race')}</b>
    <div class="af-v">{daysText}</div>
    <div class="af-rng">
      <span class="af-track"><span class="af-fill" style:left={pos(filter.dmin)} style:width={`calc(${pos(filter.dmax)} - ${pos(filter.dmin)})`}></span></span>
      <input type="range" min="1" max={MAX_DAYS} step="1" value={filter.dmin} aria-label={t('Shortest length in days')} oninput={(e) => onchange({ dmin: Math.min(Number(e.currentTarget.value), filter.dmax) })} data-atlas-dmin />
      <input type="range" min="1" max={MAX_DAYS} step="1" value={filter.dmax} aria-label={t('Longest length in days')} oninput={(e) => onchange({ dmax: Math.max(Number(e.currentTarget.value), filter.dmin) })} data-atlas-dmax />
    </div>
    <div class="af-ends"><span>1</span><span>{t('{n} days', { n: MAX_DAYS })}</span></div>
  </section>
  <section class="af-g" aria-label={t('Registration|race')}>
    <b>{t('Registration|race')}</b>
    {#each SWITCHES as s (s.key)}
      <button type="button" class="af-tog" role="switch" aria-checked={filter[s.key]} onclick={() => onchange({ [s.key]: !filter[s.key] })} data-atlas-switch={s.key}>
        <span class="af-sw" aria-hidden="true"></span>{t(s.name)}<b>{counts[s.key]}</b>
      </button>
    {/each}
  </section>
</div>

<style>
  .af {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .af-g {
    display: grid;
    gap: 8px;
    padding: 12px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .af-g > b {
    font-size: var(--fs-label);
  }
  .af-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .af-chip {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 32px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    font-size: var(--fs-small);
    cursor: pointer;
    white-space: nowrap;
  }
  .af-chip i {
    font-style: normal;
    font-size: var(--fs-tiny);
    opacity: 0.7;
  }
  .af-chip[aria-pressed='true'] {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--paper);
  }
  .af-chip.more {
    color: var(--ink-2);
    border-style: dashed;
  }
  .af-chip:focus-visible,
  .af-tog:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  .af-v {
    font-weight: 700;
  }
  .af-rng {
    position: relative;
    height: 28px;
    margin: 0 8px;
  }
  .af-track {
    position: absolute;
    inset: 11px 0 auto;
    height: 6px;
    border-radius: 3px;
    background: var(--line);
  }
  .af-fill {
    position: absolute;
    top: 0;
    height: 6px;
    border-radius: 3px;
    background: var(--accent);
  }
  .af-rng input {
    position: absolute;
    inset: 0 -8px;
    width: calc(100% + 16px);
    margin: 0;
    background: none;
    pointer-events: none;
    appearance: none;
  }
  .af-rng input::-webkit-slider-runnable-track {
    background: none;
    height: 28px;
  }
  .af-rng input::-moz-range-track {
    background: none;
  }
  .af-rng input::-webkit-slider-thumb {
    appearance: none;
    pointer-events: auto;
    width: 22px;
    height: 22px;
    margin-top: 3px;
    border-radius: 50%;
    border: 3px solid var(--accent);
    background: var(--paper);
    cursor: pointer;
  }
  .af-rng input::-moz-range-thumb {
    pointer-events: auto;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 3px solid var(--accent);
    background: var(--paper);
    cursor: pointer;
  }
  .af-ends {
    display: flex;
    justify-content: space-between;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .af-tog {
    all: unset;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 40px;
    cursor: pointer;
    font-size: var(--fs-small);
  }
  .af-tog b {
    margin-left: auto;
    color: var(--ink-3);
    font-weight: 600;
  }
  .af-sw {
    position: relative;
    flex: none;
    width: 38px;
    height: 22px;
    border-radius: 11px;
    background: var(--line);
    transition: background 0.15s;
  }
  .af-sw::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--paper);
    transition: translate 0.15s;
  }
  .af-tog[aria-checked='true'] .af-sw {
    background: var(--accent);
  }
  .af-tog[aria-checked='true'] .af-sw::after {
    translate: 16px 0;
  }
  @media (prefers-reduced-motion: reduce) {
    .af-sw,
    .af-sw::after {
      transition: none;
    }
  }
</style>
