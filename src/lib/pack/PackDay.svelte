<script>
  /**
   * Packing day (Noah, 4.10.2026, answer 2a): the whole screen, one bag at a time, big text.
   * Tap an item when it is in the bag. Learnings that name an item show as a small hint under it
   * (answer 3a). The last step is the ready check. Everything is saved at once, so the phone can
   * go to sleep or the page can close in between.
   *
   * steps: from packSteps(). ontoggle(itemId), onready(row): save. onclose(): back to Pack.
   */
  import { formatWeight } from '../gear.js';
  import { readyDone } from '../trips.js';

  let { trip, steps, itemsById, tips = {}, ready = [], ontoggle, onready, onclose } = $props();

  // Start at the first bag that still has something to pack.
  let at = $state(Math.max(0, steps.findIndex((s) => s.done < s.entries.length)));
  const last = $derived(steps.length); // the ready check comes after the bags
  const step = $derived(steps[at] ?? null);
  const total = $derived(steps.reduce((t, s) => t + s.entries.length, 0));
  const packed = $derived(steps.reduce((t, s) => t + s.done, 0));
  const readyN = $derived(ready.filter((r) => readyDone(r, trip)).length);
  const allIn = $derived(step ? step.done === step.entries.length : false);
  let openTip = $state(null);

  const go = (n) => {
    at = Math.min(last, Math.max(0, n));
    openTip = null;
    document.querySelector('.pd .body')?.scrollTo(0, 0);
  };

  // Keep the screen on while packing (where the browser allows it).
  $effect(() => {
    let lock = null;
    const get = async () => {
      try {
        lock = await navigator.wakeLock?.request('screen');
      } catch {
        /* not allowed here: the screen may go dark, nothing is lost */
      }
    };
    get();
    const again = () => document.visibilityState === 'visible' && get();
    document.addEventListener('visibilitychange', again);
    const esc = (e) => e.key === 'Escape' && onclose();
    window.addEventListener('keydown', esc);
    document.body.classList.add('pd-open');
    return () => {
      lock?.release?.();
      document.removeEventListener('visibilitychange', again);
      window.removeEventListener('keydown', esc);
      document.body.classList.remove('pd-open');
    };
  });
</script>

<div class="pd" role="dialog" aria-modal="true" aria-label="Packing day: {trip.title}">
  <header class="top">
    <span class="where">
      <b>{trip.title}</b>
      <span class="num">{at < last ? `Bag ${at + 1} of ${steps.length}` : 'Ready check'} · {packed} of {total} packed</span>
    </span>
    <button type="button" class="close" onclick={onclose}>Close</button>
  </header>
  <div class="prog" role="img" aria-label="{packed} of {total} items packed"><i style:width="{total ? (packed / total) * 100 : 0}%"></i></div>
  <nav class="dots" aria-label="Bags">
    {#each steps as s, n (s.key)}
      <button type="button" class:cur={n === at} class:full={s.done === s.entries.length} aria-current={n === at ? 'step' : undefined} onclick={() => go(n)}>{s.title}</button>
    {/each}
    <button type="button" class:cur={at === last} class:full={ready.length && readyN === ready.length} aria-current={at === last ? 'step' : undefined} onclick={() => go(last)}>Ready check</button>
  </nav>

  <div class="body">
    {#if step}
      <h1 class="title">{step.title}</h1>
      <p class="sub num">{step.sub ? `${step.sub} · ` : ''}{step.done} of {step.entries.length} in{allIn ? ' · all in' : ''}</p>
      <ul class="items">
        {#each step.entries as e (e.itemId)}
          {@const it = itemsById[e.itemId]}
          {@const tip = tips[e.itemId]}
          <li class:in={e.packed}>
            <button type="button" class="it" aria-pressed={!!e.packed} onclick={() => ontoggle(e.itemId)}>
              <span class="box" aria-hidden="true">{e.packed ? '✓' : ''}</span>
              <span class="nm">{it?.name ?? e.itemId}{#if (e.qty || 1) > 1}<b class="q"> × {e.qty}</b>{/if}</span>
              {#if it?.weightG != null}<span class="w num">{formatWeight(it.weightG * (e.qty || 1))}</span>{/if}
            </button>
            {#if tip}
              <button type="button" class="tip" class:open={openTip === e.itemId} aria-expanded={openTip === e.itemId} onclick={() => (openTip = openTip === e.itemId ? null : e.itemId)}>
                <span class="tl">Learning</span>{tip.rule}
              </button>
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <h1 class="title">Ready check</h1>
      <p class="sub num">{readyN} of {ready.length} done</p>
      <ul class="items">
        {#each ready as r (r.id)}
          {@const done = readyDone(r, trip)}
          <li class:in={done}>
            <button type="button" class="it" aria-pressed={done} disabled={!!r.itemId && done} onclick={() => onready(r)}>
              <span class="box" aria-hidden="true">{done ? '✓' : ''}</span>
              <span class="nm">{r.label}</span>
            </button>
          </li>
        {/each}
      </ul>
      {#if packed === total && readyN === ready.length}<p class="go">Everything is in. Have a good ride!</p>{/if}
    {/if}
  </div>

  <footer class="foot">
    <button type="button" class="btn" disabled={at === 0} onclick={() => go(at - 1)}>Back</button>
    {#if at < last}
      <button type="button" class="btn hi" onclick={() => go(at + 1)}>{at + 1 < last ? `Next: ${steps[at + 1].title}` : 'Next: ready check'}</button>
    {:else}
      <button type="button" class="btn hi" onclick={onclose}>Done</button>
    {/if}
  </footer>
</div>

<style>
  :global(body.pd-open) {
    overflow: hidden;
  }
  .pd {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    flex-direction: column;
    background: var(--paper);
    color: var(--ink);
  }
  .top {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    border-bottom: 1px solid var(--line);
  }
  .where {
    display: flex;
    flex-direction: column;
    min-width: 0;
    font-size: 14px;
  }
  .where b {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .where .num {
    color: var(--ink-3);
  }
  .close {
    flex: none;
    min-height: 44px;
    padding: 0 14px;
    border: 1.5px solid var(--ink);
    border-radius: 6px;
    background: var(--paper);
    color: var(--ink);
    font: 700 15px var(--font-body);
    cursor: pointer;
  }
  .prog {
    height: 6px;
    background: var(--paper-2, #e6ebe3);
  }
  .prog i {
    display: block;
    height: 100%;
    background: var(--ink);
    transition: width 0.2s;
  }
  .dots {
    display: flex;
    gap: 6px;
    padding: 10px 16px;
    overflow-x: auto;
    border-bottom: 1px solid var(--line);
  }
  .dots button {
    flex: none;
    padding: 6px 10px;
    border: 1.5px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    font: 600 13px var(--font-body);
    white-space: nowrap;
    cursor: pointer;
  }
  .dots button.full {
    border-color: var(--ink-3);
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .dots button.cur {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
    text-decoration: none;
  }
  .body {
    flex: 1;
    overflow-y: auto;
    padding: 18px 16px 24px;
  }
  .body > * {
    max-width: 720px;
    margin-left: auto;
    margin-right: auto;
  }
  h1 {
    margin-top: 0;
    margin-bottom: 4px;
    font-size: clamp(32px, 9vw, 52px);
    line-height: 1;
    overflow-wrap: anywhere;
  }
  .sub {
    margin-top: 0;
    margin-bottom: 14px;
    font-size: 16px;
    color: var(--ink-2);
  }
  .items {
    list-style: none;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .it {
    display: flex;
    gap: 14px;
    align-items: center;
    width: 100%;
    min-height: 64px;
    padding: 10px 14px;
    border: 1.5px solid var(--line);
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    font: 600 21px/1.25 var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  .box {
    flex: none;
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border: 2px solid var(--ink);
    border-radius: 6px;
    font-size: 22px;
  }
  .nm {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .q {
    font-weight: 900;
  }
  .w {
    flex: none;
    font-size: 15px;
    font-weight: 400;
    color: var(--ink-3);
  }
  .in .it {
    background: var(--paper-2, #e6ebe3);
    border-color: transparent;
    color: var(--ink-3);
  }
  .in .nm {
    text-decoration: line-through;
  }
  .in .box {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .tip {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
    margin-top: 4px;
    padding: 4px 14px 4px 62px;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: 400 15px/1.4 var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  .tip.open {
    white-space: normal;
  }
  .tl {
    margin-right: 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .go {
    font: 900 24px var(--font-title);
    text-transform: uppercase;
  }
  .foot {
    display: flex;
    gap: 10px;
    padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
    border-top: 1px solid var(--line);
    background: var(--paper);
  }
  .foot .btn {
    min-height: 52px;
    font-size: 17px;
  }
  .foot .btn.hi {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  @media (min-width: 720px) {
    .foot {
      justify-content: center;
    }
    .foot .btn.hi {
      flex: 0 1 480px;
    }
  }
</style>
