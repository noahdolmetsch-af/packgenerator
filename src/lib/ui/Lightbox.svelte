<script>
  /**
   * A photo big, on the whole screen (Noah, 4.10.2026, answer 1a): swipe or the arrows for the
   * next one, Esc or Close to go back. list: [{ src, name, sub }]. actions: an optional snippet
   * under the photo, it gets the shown photo.
   */
  let { list, start = 0, onclose, actions = null } = $props();

  // svelte-ignore state_referenced_locally
  let at = $state(Math.min(Math.max(0, start), list.length - 1));
  const cur = $derived(list[Math.min(at, list.length - 1)]);
  const go = (n) => (at = (n + list.length) % list.length);
  let dialog;
  let x0 = null;

  $effect(() => {
    dialog.showModal();
    const key = (e) => {
      if (e.key === 'ArrowRight') go(at + 1);
      if (e.key === 'ArrowLeft') go(at - 1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  // The list can get shorter (a photo was removed): close when it is empty.
  $effect(() => {
    if (!list.length) dialog.close();
  });

  const down = (e) => (x0 = e.clientX);
  function up(e) {
    if (x0 == null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 50 && list.length > 1) go(at + (dx < 0 ? 1 : -1));
  }
</script>

<dialog class="lb" bind:this={dialog} onclose={onclose} aria-label="Photo: {cur?.name ?? ''}">
  {#if cur}
    <header class="top">
      <span class="nm"><b>{cur.name}</b>{#if cur.sub}<small>{cur.sub}</small>{/if}</span>
      {#if list.length > 1}<span class="num n">{at + 1} / {list.length}</span>{/if}
      <button type="button" class="close" onclick={() => dialog.close()}>Close</button>
    </header>
    <div class="pic" onpointerdown={down} onpointerup={up} onpointercancel={() => (x0 = null)} role="presentation">
      <img src={cur.src} alt={cur.name} draggable="false" />
      {#if list.length > 1}
        <button type="button" class="nav prev" aria-label="Previous photo" onclick={() => go(at - 1)}>‹</button>
        <button type="button" class="nav next" aria-label="Next photo" onclick={() => go(at + 1)}>›</button>
      {/if}
    </div>
    {#if actions}<footer class="foot">{@render actions(cur)}</footer>{/if}
  {/if}
</dialog>

<style>
  .lb {
    width: 100vw;
    height: 100dvh;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    background: #101614;
    color: #f4f6f2;
  }
  .lb[open] {
    display: flex;
    flex-direction: column;
  }
  .lb::backdrop {
    background: #101614;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
  }
  .nm {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .nm b {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .nm small {
    color: #b8c2bc;
    font-size: 13px;
  }
  .n {
    color: #b8c2bc;
    font-size: 14px;
  }
  .close {
    min-height: 44px;
    padding: 0 14px;
    border: 1.5px solid #f4f6f2;
    border-radius: 6px;
    background: none;
    color: #f4f6f2;
    font: 700 15px var(--font-body);
    cursor: pointer;
  }
  .pic {
    position: relative;
    flex: 1;
    min-height: 0;
    display: grid;
    place-items: center;
    touch-action: pan-y;
    user-select: none;
  }
  .pic img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  .nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 48px;
    height: 64px;
    border: 0;
    border-radius: 6px;
    background: rgba(16, 22, 20, 0.55);
    color: #fff;
    font-size: 40px;
    line-height: 1;
    cursor: pointer;
  }
  .prev {
    left: 8px;
  }
  .next {
    right: 8px;
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    justify-content: center;
    padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
  }
</style>
