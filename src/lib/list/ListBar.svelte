<script>
  /**
   * SL4 (answer 5a): the head of a long list stays on top while you scroll: the search and the chips, and,
   * once you scrolled into the groups, the group you are in («Yesterday, 13 Oct · 18 updates»).
   * It watches the [data-group] sections next to it (same parent) and tells which one you are in (`active`,
   * the group's id), so the jump bar can mark it.
   *
   *   <ListBar bind:active current={label} count={n}>search and chips</ListBar>
   */
  import { activeOf } from './listen.js';

  let { active = $bindable(null), current = '', count = '', children } = $props();
  let bar = $state();
  let stuck = $state(false);
  // on a phone the app's top bar stays on top too: this head sits right under it
  let off = $state(0);

  $effect(() => {
    if (!bar) return;
    let raf = 0;
    const place = () => {
      off = document.querySelector('header.top')?.offsetHeight ?? 0;
      // a group you jump to lands under both heads
      document.documentElement.style.setProperty('--ls-top', `${off + bar.offsetHeight + 8}px`);
    };
    const measure = () => {
      raf = 0;
      const box = bar.getBoundingClientRect();
      const root = bar.parentElement;
      const groups = root ? [...root.querySelectorAll('[data-group]')] : [];
      stuck = box.top <= off + 1 && window.scrollY > 0;
      if (!groups.length) return;
      const tops = groups.map((g) => g.getBoundingClientRect().top);
      const line = box.bottom + 12;
      // at the very end of the page the last group cannot reach the line: then it is the last one in view
      const end = window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      const id = tops[0] > line ? null : groups[activeOf(tops, end ? window.innerHeight * 0.6 : line)].dataset.group;
      if (id !== active) active = id;
    };
    const on = () => (raf ||= requestAnimationFrame(measure));
    const size = () => {
      place();
      on();
    };
    place();
    measure();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', size);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', size);
      document.documentElement.style.removeProperty('--ls-top');
      if (raf) cancelAnimationFrame(raf);
    };
  });
</script>

<div class="ls-bar" class:stuck bind:this={bar} style:top="{off}px">
  {@render children()}
  {#if stuck && current}
    <p class="ls-cur" aria-live="polite"><b>{current}</b>{#if count}<span class="num">{count}</span>{/if}</p>
  {/if}
</div>

<style>
  .ls-bar {
    position: sticky;
    top: 0;
    z-index: 4;
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0 calc(-1 * var(--ls-pad, 4px)) 16px;
    padding: 6px var(--ls-pad, 4px);
    background: var(--tint, var(--ground));
  }
  .ls-bar.stuck {
    box-shadow: 0 6px 12px -10px var(--shadow, rgba(0, 0, 0, 0.3));
  }
  .ls-cur {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin: 0 2px;
    font-size: var(--fs-small);
  }
  .ls-cur b {
    font-weight: 600;
  }
  .ls-cur span {
    color: var(--ink-3);
  }
  @media print {
    .ls-bar {
      position: static;
      display: none;
    }
  }
</style>
