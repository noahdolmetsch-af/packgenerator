<script>
  /**
   * Packing day (Noah, 4.10.2026, answer 2a): the whole screen, one bag at a time, big text.
   * Tap an item when it is in the bag. Learnings that name an item show as a small hint under it
   * (answer 3a). The last step is the ready check. Everything is saved at once, so the phone can
   * go to sleep or the page can close in between.
   *
   * steps: from packSteps(). ontoggle(itemId), onready(row): save. onclose(): back to Pack.
   * v0.24.0 (Noah, fewer clicks): onpack(itemIds | null) ticks a whole bag (null: everything),
   * onreadyall() ticks the whole ready check. "All in, next" ticks the bag and goes on in one tap;
   * "Everything is packed" in the top bar ticks bags and ready check at once and closes.
   */
  import { formatWeight } from '../gear.js';
  import { readyDone, RAIN } from '../trips.js';
  import { t, nameOf } from '../i18n.svelte.js';

  let { trip, steps, itemsById, badges = {}, ready = [], wxGap = null, onwx = () => {}, ontoggle, onready, onpack = () => {}, onreadyall = () => {}, onclose, bike = true } = $props(); // bike: false for a trip without a bike (v0.21.0)
  const wxText = (w) => `${w.min === w.max ? w.min : `${w.min}–${w.max}`} °C, ${t(RAIN[w.rain ?? 'none'])}`;

  // Start at the first bag that still has something to pack.
  let at = $state(Math.max(0, steps.findIndex((s) => s.done < s.entries.length)));
  const last = $derived(steps.length); // the ready check comes after the bags
  const step = $derived(steps[at] ?? null);
  const total = $derived(steps.reduce((t, s) => t + s.entries.length, 0));
  const packed = $derived(steps.reduce((t, s) => t + s.done, 0));
  const readyN = $derived(ready.filter((r) => readyDone(r, trip)).length);
  const allIn = $derived(step ? step.done === step.entries.length : false);
  let openTip = $state(null);

  const readyAll = $derived(readyN === ready.length);
  // v0.24.0: one tap per bag ("All in, next"), one for the ready check, one for everything.
  function bagIn() {
    if (!allIn) onpack(step.entries.map((e) => e.itemId));
    go(at + 1);
  }
  function readyIn() {
    if (!readyAll) onreadyall();
    onclose();
  }
  function everything() {
    onpack(null);
    onreadyall();
    onclose();
  }
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
    // v0.27.0 (AP21): like the other dialogs, the keyboard focus moves in (first item still to pack)
    // and goes back to the button that opened the packing day when it closes. Tab stays inside (App).
    const opener = document.activeElement;
    const box = document.querySelector('.pd');
    (box?.querySelector('.items .it[aria-pressed="false"]') ?? box?.querySelector('.foot .btn.hi'))?.focus({ preventScroll: true });
    return () => {
      lock?.release?.();
      document.removeEventListener('visibilitychange', again);
      window.removeEventListener('keydown', esc);
      document.body.classList.remove('pd-open');
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    };
  });
</script>

<div class="pd" role="dialog" aria-modal="true" aria-label={t('Packing day: {title}', { title: trip.title })}>
  <header class="top">
    <span class="where">
      <b>{trip.title}</b>
      <span class="num">{at < last ? t('Bag {n} of {total}', { n: at + 1, total: steps.length }) : t('Ready check')} · {t('{n} of {total} packed', { n: packed, total })}</span>
    </span>
    <span class="tops">
      {#if packed < total || !readyAll}<button type="button" class="close all" onclick={everything}>{t('Everything is packed')}</button>{/if}
      <button type="button" class="close" onclick={onclose}>{t('Close')}</button>
    </span>
  </header>
  <div class="prog" role="img" aria-label={t('{n} of {total} items packed', { n: packed, total })}><i style:width="{total ? (packed / total) * 100 : 0}%"></i></div>
  <nav class="dots" aria-label={t('Bags')}>
    {#each steps as s, n (s.key)}
      <button type="button" class:cur={n === at} class:full={s.done === s.entries.length} aria-current={n === at ? 'step' : undefined} onclick={() => go(n)}>{s.title}</button>
    {/each}
    <button type="button" class:cur={at === last} class:full={ready.length && readyN === ready.length} aria-current={at === last ? 'step' : undefined} onclick={() => go(last)}>{t('Ready check')}</button>
  </nav>

  <div class="body">
    {#if wxGap && at === 0}
      <div class="wxgap" role="note">
        <p><b>{t('The forecast is {wx}.', { wx: wxText(wxGap.fc) })}</b> {t('This trip is packed for {wx}.', { wx: wxText(wxGap.have) })}</p>
        <button type="button" class="btn hi" onclick={onwx}>{t('Pack for the forecast first')}</button>
      </div>
    {/if}
    {#if step}
      <h1 class="title">{step.title}</h1>
      <p class="sub num">{step.sub ? `${step.sub} · ` : ''}{t('{n} of {total} in', { n: step.done, total: step.entries.length })}{allIn ? ` · ${t('all in')}` : ''}</p>
      <ul class="items">
        {#each step.entries as e (e.itemId)}
          {@const it = itemsById[e.itemId]}
          {@const bs = badges[e.itemId]}
          <li class:in={e.packed}>
            <button type="button" class="it" aria-pressed={!!e.packed} onclick={() => ontoggle(e.itemId)}>
              <span class="box" aria-hidden="true">{e.packed ? '✓' : ''}</span>
              <span class="nm">{it ? nameOf(it) : e.itemId}{#if (e.qty || 1) > 1}<b class="q"> × {e.qty}</b>{/if}</span>
              {#if it?.weightG != null}<span class="w num">{formatWeight(it.weightG * (e.qty || 1))}</span>{/if}
            </button>
            {#if bs}
              <!-- v0.19.5 (answer 3a): short badges, the sentences on tap. -->
              <button type="button" class="tip" class:open={openTip === e.itemId} aria-expanded={openTip === e.itemId} onclick={() => (openTip = openTip === e.itemId ? null : e.itemId)}>
                {#if openTip === e.itemId}
                  {#each bs as b (b.key)}<span class="tx"><span class="tl">{b.key === 'tip' ? t('Learning') : b.label}</span>{b.text}</span>{/each}
                {:else}
                  {#each bs as b (b.key)}<span class="bdg {b.tone}">{b.label}</span>{/each}
                {/if}
              </button>
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <h1 class="title">{t('Ready check')}</h1>
      <p class="sub num">{t('{n} of {total} done', { n: readyN, total: ready.length })}</p>
      <ul class="items">
        {#each ready as r (r.id)}
          {@const done = readyDone(r, trip)}
          <li class:in={done}>
            <button type="button" class="it" aria-pressed={done} disabled={!!r.itemId && done} onclick={() => onready(r)}>
              <span class="box" aria-hidden="true">{done ? '✓' : ''}</span>
              <span class="nm">{t(r.label)}</span>
            </button>
          </li>
        {/each}
      </ul>
      {#if packed === total && readyN === ready.length}<p class="go">{bike ? t('Everything is in. Have a good ride!') : t('Everything is in. Have a good trip!')}</p>{/if}
    {/if}
  </div>

  <footer class="foot">
    <button type="button" class="btn" disabled={at === 0} onclick={() => go(at - 1)}>{t('Back')}</button>
    {#if at < last}
      {@const nextName = at + 1 < last ? steps[at + 1].title : t('Ready check')}
      <button type="button" class="btn hi" onclick={bagIn}>{allIn ? t('Next: {step}', { step: nextName }) : t('All in, next: {step}', { step: nextName })}</button>
    {:else}
      <button type="button" class="btn hi" onclick={readyIn}>{readyAll ? t('Done') : t('All done, finish')}</button>
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
  /* v0.27.0 (AP21): a long trip name gets two lines instead of being cut after a few letters (320 px). */
  .where {
    flex: 1;
    min-width: 120px;
  }
  .where b {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    overflow-wrap: anywhere;
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
  .tops {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
  }
  .close.all {
    border-color: var(--ink-3);
    font-weight: 600;
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
  /* v0.27.0 (AP21): the bag tabs are 44 px high for a thumb (were 29 px). */
  .dots button {
    flex: none;
    min-height: 44px;
    padding: 6px 12px;
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
    font-size: var(--fs-page);
    line-height: var(--lh-title);
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
    /* minmax(0, …): a long learning hint (one line, cut with …) must not widen the items past the screen */
    grid-template-columns: minmax(0, 1fr);
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
    border: 1px solid var(--line);
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
    font-size: var(--fs-small);
    font-weight: 700;
    color: var(--ink-3);
  }
  .go {
    font: 900 var(--fs-sub) var(--font-title);
  }
  .wxgap {
    margin-bottom: 16px;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: #e3eef8;
    font-size: 17px;
  }
  .wxgap p {
    margin: 0 0 10px;
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
  /* v0.24.0: "All in, next: <bag>" may take two lines on a narrow phone instead of being cut off. */
  .foot .btn.hi {
    flex: 1;
    min-width: 0;
    white-space: normal;
    line-height: 1.2;
    overflow-wrap: anywhere;
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
