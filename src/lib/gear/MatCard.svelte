<script>
  /**
   * v0.47.2 «Material-Ansichten» (Noah 8a, 9a): one item as a card. On the phone a compact row
   * (icon, name, dots, weight, star), on the computer a card in the grid (coloured band, weight big,
   * «× dabei» and the share used, dots). Below, at most one hint and only with data: the lighter
   * alternative, else the last trip. In «Nie gebraucht» the plain sentence and "Leave at home".
   */
  import FavStar from './FavStar.svelte';
  import Dots from './Dots.svelte';
  import { formatWeight, itemWeight, OWNERSHIP } from '../gear.js';
  import { leaveHome } from '../blocks2026.js';
  import { neverText } from './material.js';
  import { catIcon, catColor } from './caticon.js';
  import { t, nameOf } from '../i18n.svelte.js';

  let { item, u, alt = null, proven = false, view = 'all', selected = false, reasons = [], onopen, onhome = null } = $props();
  const Icon = $derived(catIcon(item.category));
  const wish = $derived(item.ownership === 'wishlist' || item.ownership === 'to-buy');
  const share = $derived(u?.taken ? Math.round((u.used / u.taken) * 100) : null);
  const hint = $derived(
    wish
      ? reasons.join(' · ')
      : alt
        ? t('lighter: {name} {w}', { name: nameOf(alt.item), w: formatWeight(alt.g) })
        : u?.last
          ? t('last: {trip}', { trip: u.last.title })
          : '',
  );
</script>

<article class="mcard" class:sel={selected} data-id={item.id} style:--c={catColor(item.category)}>
  <button type="button" class="mopen" aria-current={selected ? 'true' : undefined} onclick={() => onopen?.(item)}>
    <span class="tile" aria-hidden="true"><Icon size={22} /></span>
    <span class="body">
      <span class="nm" id="mc-{item.id}">{nameOf(item)}{#if item.qty > 1}<small> × {item.qty}</small>{/if}</span>
      {#if item.brand}<span class="br">{item.brand}</span>{/if}
      <span class="wt num" class:nw={item.weightG == null}>{item.weightG == null ? t('not weighed') : formatWeight(itemWeight(item))}</span>
      {#if wish}
        <span class="use"><span class="pill">{t(OWNERSHIP[item.ownership] ?? '')}</span></span>
      {:else if view === 'never' && u?.taken}
        <span class="use never">{neverText(u)}</span>
      {:else if u?.taken}
        <span class="use num">{[t('{n}× along', { n: u.taken }), share != null ? t('{p} % used', { p: share }) : ''].filter(Boolean).join(' · ')}</span>
      {/if}
      {#if !wish && u?.dots?.length}<span class="dw"><Dots dots={u.dots} /></span>{/if}
      {#if hint}<span class="hint" class:alt={!!alt && !wish}>{hint}</span>{/if}
    </span>
  </button>
  {#if proven}<span class="pill ok tag">{t('Proven')}</span>{/if}
  <span class="star"><FavStar {item} describedby="mc-{item.id}" /></span>
  {#if view === 'never' && onhome}
    <div class="acts">
      {#if leaveHome(item)}<span class="home">{t('Stays at home')}</span>{:else}<button type="button" class="btn sm" onclick={() => onhome(item)}>{t('Leave at home')}</button>{/if}
    </div>
  {/if}
</article>

<style>
  .mcard {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    background: var(--paper);
    border-bottom: 1px solid var(--line);
  }
  .mopen {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 0 12px;
    align-items: center;
    width: 100%;
    min-height: 60px;
    padding: 10px 4px 10px 12px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  @media (hover: hover) {
    .mopen:hover {
      background: var(--paper-2);
    }
  }
  .tile {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--c) 16%, var(--paper));
    color: color-mix(in srgb, var(--c) 80%, var(--ink));
  }
  .body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 2px 10px;
    min-width: 0;
  }
  .nm {
    grid-column: 1;
    font-weight: 600;
    line-height: 1.3;
    overflow-wrap: break-word;
    min-width: 0;
  }
  .nm small {
    font-weight: 400;
    color: var(--ink-3);
  }
  .br {
    display: none;
  }
  .wt {
    grid-column: 2;
    grid-row: 1;
    font-weight: 600;
    text-align: right;
    white-space: nowrap;
  }
  .wt.nw {
    color: var(--ink-3);
    font-weight: 400;
    font-size: 13px;
  }
  .use,
  .dw,
  .hint {
    grid-column: 1 / -1;
  }
  .use {
    color: var(--ink-3);
    font-size: 13px;
  }
  .use.never {
    color: var(--ink-2);
  }
  .hint {
    color: var(--ink-3);
    font-size: 13px;
    overflow-wrap: break-word;
  }
  .hint.alt {
    color: var(--warn);
  }
  .tag {
    position: absolute;
    left: 58px;
    bottom: 6px;
    display: none;
  }
  .star :global(.fav) {
    width: 44px;
    min-height: 44px;
  }
  .acts {
    grid-column: 1 / -1;
    padding: 0 12px 10px 64px;
  }
  .home {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sel {
    box-shadow: inset 3px 0 0 var(--hi);
  }

  /* The computer: a card in the grid, a coloured band on top. */
  @media (min-width: 720px) {
    .mcard {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      border: 1px solid var(--card-line);
      border-radius: var(--radius-card);
      box-shadow: var(--card-shadow);
      overflow: hidden;
    }
    .sel {
      box-shadow: 0 0 0 2px var(--hi);
      border-color: var(--hi);
    }
    .mopen {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      padding: 0;
    }
    .tile {
      width: 100%;
      height: 64px;
      border-radius: 0;
    }
    .body {
      padding: 10px 14px 12px;
      grid-template-columns: minmax(0, 1fr) auto;
      align-content: start;
      flex: 1;
    }
    .nm {
      grid-column: 1 / -1;
      font-size: 16px;
      font-weight: 500;
    }
    .br {
      display: block;
      grid-column: 1 / -1;
      color: var(--ink-3);
      font-size: 12.5px;
    }
    .wt {
      grid-column: 1;
      grid-row: auto;
      font: 800 24px/1.1 var(--font-brand);
      text-align: left;
      margin-top: 4px;
    }
    .wt.nw {
      font: 400 13px var(--font-body);
      align-self: end;
    }
    .use {
      grid-column: 2;
      align-self: end;
      text-align: right;
      font-size: 12.5px;
    }
    .use.never {
      grid-column: 1 / -1;
      text-align: left;
    }
    .dw {
      margin-top: 4px;
    }
    .hint {
      font-size: 12.5px;
      margin-top: 2px;
    }
    .tag {
      display: inline-flex;
      top: 8px;
      left: 10px;
      bottom: auto;
    }
    .star {
      position: absolute;
      top: 0;
      right: 0;
    }
    .acts {
      padding: 0 14px 12px;
    }
  }
</style>
