<script>
  /**
   * «Grosser Titel wird beim Scrollen klein» (Paket A Seitenwechsel 5, Noah 03.11.2026 «b»): scroll down a page and its big title
   * leaves the screen; its name stays on as one small line at the top, so you know where you are without scrolling
   * back. The line is a copy for the eyes only (drawn from an attribute, aria-hidden: the page keeps its one real heading) and does not catch taps. It
   * takes no room (a sticky box of no height), so nothing on any page moves. On a phone it sits under the top bar, on a
   * computer at the top of the page. It fades in (about 0.18 s); «Reduce motion» and the switch «Bewegung: Aus» show it at once.
   * A page that keeps a bar of its own at the top while you scroll (a search and filter row, say) keeps it: the small line
   * then stays away, so it never covers a bar with buttons.
   * The title is the first big heading of the page (`main h1`); a page without one has no line.
   */
  import { onMount } from 'svelte';

  let text = $state('');
  let shown = $state(false);
  let top = $state(0); // under the sticky top bar of a phone (0 on a computer)
  let left = $state(0); // the title's own left edge, so the small line starts where the big one did

  onMount(() => {
    const col = document.querySelector('main')?.parentElement;
    let h1 = null;
    let io = null;
    let frame = 0;
    let gone = false; // the big title is above the top bar
    let tick = 0;
    const offset = () => {
      const bar = document.querySelector('header.top');
      return bar && getComputedStyle(bar).position === 'sticky' ? Math.max(0, Math.round(bar.getBoundingClientRect().height)) : 0;
    };
    const unwatch = () => {
      io?.disconnect();
      io = null;
      gone = false;
    };
    // is a bar of the page itself (sticky or fixed, inside <main>) standing where the small line would go?
    const crowded = () => {
      const main = document.querySelector('main');
      for (const el of document.elementsFromPoint(Math.round(innerWidth / 2), top + 14)) {
        for (let n = el; n && n !== main && n !== document.body; n = n.parentElement) {
          if (n.closest('[data-mini-title-wrap]')) break;
          const p = getComputedStyle(n).position;
          if ((p === 'sticky' || p === 'fixed') && main?.contains(n)) return true;
        }
      }
      return false;
    };
    const decide = () => {
      tick = 0;
      shown = gone && !crowded();
    };
    const onScroll = () => {
      if (gone && !tick) tick = requestAnimationFrame(decide);
    };
    const watch = () => {
      frame = 0;
      const next = [...document.querySelectorAll('main h1')].find((x) => x.getBoundingClientRect().height > 12) ?? null; // not a hidden heading for screen readers only
      if (next === h1 && next?.textContent?.trim() === text) return;
      unwatch();
      h1 = next;
      text = h1?.textContent?.trim() ?? '';
      shown = false;
      if (!h1 || !text || typeof IntersectionObserver === 'undefined') return;
      top = offset();
      left = Math.max(0, Math.round(h1.getBoundingClientRect().left - (col?.getBoundingClientRect().left ?? 0)));
      // the big title counts as gone when it is above the top bar (not when it is only below the screen)
      io = new IntersectionObserver(
        ([e]) => {
          gone = !e.isIntersecting && e.boundingClientRect.bottom <= top + 2;
          decide();
        },
        { rootMargin: `-${top}px 0px 0px 0px`, threshold: 0 },
      );
      io.observe(h1);
    };
    const later = () => {
      if (!frame) frame = requestAnimationFrame(watch);
    };
    const mo = new MutationObserver(later);
    const main = document.querySelector('main');
    if (main) mo.observe(main, { childList: true, subtree: true, characterData: true });
    addEventListener('hashchange', later);
    addEventListener('resize', later);
    addEventListener('scroll', onScroll, { passive: true });
    watch();
    return () => {
      mo.disconnect();
      unwatch();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(tick);
      removeEventListener('scroll', onScroll);
      removeEventListener('hashchange', later);
      removeEventListener('resize', later);
    };
  });
</script>

{#if text}
  <div class="mt-wrap" style="top:{top}px" aria-hidden="true" data-mini-title-wrap>
    <div class="mt" class:on={shown} style="padding-left:{left}px" data-mini-title><span data-t={text}></span></div>
  </div>
{/if}

<style>
  .mt-wrap {
    position: sticky;
    z-index: 4;
    height: 0;
    pointer-events: none;
  }
  .mt {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    box-sizing: border-box;
    padding: 6px var(--gut, 16px) 6px 0;
    background: var(--paper);
    border-bottom: 1px solid var(--line);
    color: var(--ink);
    font: 600 var(--fs-small) / 1.4 var(--font-body);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-6px);
  }
  .mt.on {
    opacity: 1;
    visibility: visible;
    transform: none;
  }
  /* the words are drawn from the attribute, not set as text: the page then has its title once (search, tests and readers find one heading) */
  .mt span::before {
    content: attr(data-t);
  }
  .mt span {
    display: block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  @media (prefers-reduced-motion: no-preference) {
    .mt {
      transition: opacity 180ms var(--ease-out), transform 180ms var(--ease-out), visibility 0s linear 180ms;
    }
    .mt.on {
      transition: opacity 180ms var(--ease-out), transform 180ms var(--ease-out), visibility 0s;
    }
  }
  @media print {
    .mt-wrap {
      display: none;
    }
  }
</style>
