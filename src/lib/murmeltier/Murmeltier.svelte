<script>
  /**
   * «Ein Murmeltier als Begleiter» (Noah 03.11.2026, Idee 28): the one drawn marmot of the app (the little companion
   * on empty pages and beside tips; the secret of the logo reuses it). One drawing, four states:
   *   'sit'     sits upright (the day), 'sleep' sleeps with «Zzz» (the night 22:00–05:59 by itself with 'auto'),
   *   'peek'    only head and paws look over a mound, 'whistle' like 'peek', with a speech bubble (say).
   * state 'auto' (default): sleeping at night, sitting by day. size: width in px. say: the words in the bubble
   * of 'whistle' (an English key goes through t() in the caller; the marmot does not translate). Hidden from
   * screen readers; still with «reduce motion» (and Motion «Off» through the global switch).
   */
  import { partOfDay } from '../dayclock.js';

  let { state = 'auto', size = 56, say = '' } = $props();
  const night = partOfDay(new Date().getHours()) === 'night';
  const mode = $derived(state === 'auto' ? (night ? 'sleep' : 'sit') : state);
  const FUR = '#a8835a';
  const DARK = '#6e4f31';
  const BELLY = '#e7d3b4';
</script>

<span class="mm {mode}" style="width:{size}px" data-murmeltier={mode} aria-hidden="true">
  <svg viewBox="0 0 64 60" width="100%">
    {#if mode === 'peek' || mode === 'whistle'}
      <g class="head">
        <ellipse cx="32" cy="30" rx="15" ry="13" fill={FUR} />
        <circle cx="19" cy="19" r="4.5" fill={FUR} /><circle cx="45" cy="19" r="4.5" fill={FUR} />
        <circle cx="19" cy="19" r="2.2" fill={DARK} /><circle cx="45" cy="19" r="2.2" fill={DARK} />
        <ellipse cx="32" cy="35" rx="8" ry="6" fill={BELLY} />
        <circle cx="25" cy="27" r="1.9" fill="#26231f" /><circle cx="39" cy="27" r="1.9" fill="#26231f" />
        <ellipse cx="32" cy="32" rx="2.6" ry="1.9" fill="#26231f" />
        {#if mode === 'whistle'}<ellipse cx="32" cy="37" rx="1.8" ry="2.2" fill="#26231f" />{:else}<rect x="30.4" y="36" width="3.2" height="3.6" rx="0.8" fill="#fff" stroke={DARK} stroke-width="0.6" />{/if}
      </g>
      <ellipse cx="22" cy="46" rx="4.5" ry="3.2" fill={DARK} /><ellipse cx="42" cy="46" rx="4.5" ry="3.2" fill={DARK} />
      <path d="M2 56C10 44 22 44 32 44S54 44 62 56z" fill="#7d8f5a" />
    {:else}
      <ellipse cx="32" cy="42" rx="17" ry="15" fill={FUR} />
      <ellipse cx="32" cy="46" rx="10" ry="10" fill={BELLY} />
      <ellipse cx="32" cy="22" rx="14" ry="12" fill={FUR} />
      <circle cx="20" cy="12" r="4.4" fill={FUR} /><circle cx="44" cy="12" r="4.4" fill={FUR} />
      <circle cx="20" cy="12" r="2.1" fill={DARK} /><circle cx="44" cy="12" r="2.1" fill={DARK} />
      <ellipse cx="32" cy="27" rx="7.5" ry="5.5" fill={BELLY} />
      {#if mode === 'sleep'}
        <path d="M22 20q3 3 6 0M36 20q3 3 6 0" stroke="#26231f" stroke-width="1.6" fill="none" stroke-linecap="round" />
      {:else}
        <circle cx="25" cy="20" r="1.9" fill="#26231f" /><circle cx="39" cy="20" r="1.9" fill="#26231f" />
      {/if}
      <ellipse cx="32" cy="24" rx="2.5" ry="1.8" fill="#26231f" />
      {#if mode !== 'sleep'}<rect x="30.4" y="27" width="3.2" height="3.6" rx="0.8" fill="#fff" stroke={DARK} stroke-width="0.6" />{/if}
      <ellipse cx="21" cy="40" rx="4" ry="6" fill={DARK} /><ellipse cx="43" cy="40" rx="4" ry="6" fill={DARK} />
      <ellipse cx="24" cy="56" rx="6" ry="3" fill={DARK} /><ellipse cx="40" cy="56" rx="6" ry="3" fill={DARK} />
    {/if}
  </svg>
  {#if mode === 'sleep'}<span class="zz">z<span>z</span></span>{/if}
  {#if mode === 'whistle' && say}<span class="say">{say}</span>{/if}
</span>

<style>
  .mm {
    position: relative;
    display: inline-block;
    flex: none;
    line-height: 0;
  }
  .zz {
    position: absolute;
    top: -6px;
    right: -6px;
    color: var(--ink-3);
    font-weight: 700;
    font-size: var(--fs-small);
    line-height: 1;
  }
  .zz span {
    margin-left: 1px;
    scale: 0.8;
    display: inline-block;
  }
  .say {
    position: absolute;
    left: 64%;
    top: -8px;
    padding: 3px 8px;
    border-radius: 10px;
    background: var(--paper);
    box-shadow: 0 1px 4px var(--shadow);
    color: var(--ink);
    font: 600 var(--fs-small) / 1.2 var(--font-body);
    white-space: nowrap;
  }
  @media (prefers-reduced-motion: no-preference) {
    .zz {
      animation: mm-zz 2.4s ease-in-out infinite;
    }
    .peek svg,
    .whistle svg {
      animation: mm-up 420ms var(--ease-out) both;
    }
    .say {
      animation: mm-pop 300ms var(--ease-out) 380ms both;
    }
  }
  @keyframes mm-zz {
    50% {
      transform: translateY(-4px);
      opacity: 0.5;
    }
  }
  @keyframes mm-up {
    from {
      transform: translateY(14px);
      opacity: 0;
    }
  }
  @keyframes mm-pop {
    from {
      transform: scale(0.6);
      opacity: 0;
    }
  }
</style>
