<script>
  /** v0.72.0 «Feinschliff»: the toast of rename.svelte.js, «Renamed to "…" · Undo».
   * v0.99.0 Design-Refresh R3 (G3): a tick in front, the arrow before «Rückgängig», like every note.
   * B22 «Rückgängig gleitet» (Noah 27.10.2026): the notes glide up from below and stack, each keeps its
   * own Undo; a thin line shows the time left; swiping a note sideways or × closes it. */
  import { Check, Undo2, X } from '@lucide/svelte';
  import { toasts, undoToast, closeToast } from './rename.svelte.js';
  import { t } from '../i18n.svelte.js';

  // Swipe sideways to close (finger, mouse or pen); a short move snaps back.
  const SWIPE = 72;
  let drag = $state({ id: null, x: 0 });
  let start = null;
  function down(e, id) {
    if (e.target.closest('button')) return;
    start = { x: e.clientX, y: e.clientY, id };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function move(e) {
    if (!start) return;
    const dx = e.clientX - start.x;
    if (Math.abs(e.clientY - start.y) > Math.abs(dx) && drag.id == null) return;
    drag = { id: start.id, x: dx };
  }
  function up() {
    if (start && drag.id === start.id && Math.abs(drag.x) > SWIPE) closeToast(start.id);
    start = null;
    drag = { id: null, x: 0 };
  }
</script>

{#if toasts.list.length}
  <div class="rstack">
    <!-- the newest note comes first for the screen reader and the keyboard; on screen it is at the bottom -->
    {#each [...toasts.list].reverse() as x, i (x.id)}
      {@const last = i === 0}
      <div
        class={last ? 'rtoast' : 'rtoast-old'}
        class:dragging={drag.id === x.id}
        role="status"
        style:translate={drag.id === x.id ? `${drag.x}px 0` : null}
        style:opacity={drag.id === x.id ? Math.max(0.3, 1 - Math.abs(drag.x) / 200) : null}
        onpointerdown={(e) => down(e, x.id)}
        onpointermove={move}
        onpointerup={up}
        onpointercancel={up}
      >
        <Check size={18} aria-hidden="true" />
        <span>{x.text}</span>
        {#if x.undo}<button type="button" class="undo" onclick={() => undoToast(x.id)}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>{/if}
        <button type="button" class="close" aria-label={t('Dismiss message')} onclick={() => closeToast(x.id)}><X size={16} aria-hidden="true" /></button>
        <i class="left" style:animation-duration={`${x.ms}ms`} aria-hidden="true"></i>
      </div>
    {/each}
  </div>
{/if}

<style>
  .rstack {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: 24px;
    z-index: 40;
    width: min(520px, calc(100vw - 32px));
    display: flex;
    flex-direction: column-reverse;
    gap: 6px;
  }
  .rtoast,
  .rtoast-old {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 4px 6px 16px;
    background: var(--brand);
    color: var(--brand-ink);
    border-radius: 12px;
    box-shadow: 0 8px 24px var(--shadow);
    font: 500 var(--fs-body)/1.35 var(--font-body);
    touch-action: pan-y;
  }
  /* an older note waits above the newest one, a little smaller and calmer */
  .rtoast-old {
    scale: 0.96;
    box-shadow: none;
  }
  .rtoast span,
  .rtoast-old span {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .undo,
  .close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex: none;
    min-height: 44px;
    border: 0;
    border-radius: 8px;
    background: none;
    cursor: pointer;
  }
  .undo {
    padding: 0 12px;
    color: var(--hi-bright);
    font: 700 var(--fs-body)/1 var(--font-body);
  }
  .close {
    min-width: 44px;
    padding: 0;
    color: inherit;
    opacity: 0.75;
  }
  /* the time left: a thin line that runs out */
  .left {
    position: absolute;
    left: 0;
    bottom: 0;
    height: 3px;
    width: 100%;
    background: var(--hi-bright);
    opacity: 0.7;
    transform-origin: left;
    scale: 0 1;
  }
  @media (prefers-reduced-motion: no-preference) {
    .rtoast {
      animation: up 0.25s cubic-bezier(0.23, 1, 0.32, 1);
    }
    .rtoast-old {
      transition: scale 0.25s;
    }
    .left {
      animation: run linear forwards;
    }
    .rtoast:not(.dragging),
    .rtoast-old:not(.dragging) {
      transition: translate 0.2s, opacity 0.2s, scale 0.25s;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .left {
      display: none;
    }
  }
  @keyframes up {
    from {
      translate: 0 16px;
      opacity: 0;
    }
  }
  @keyframes run {
    from {
      scale: 1 1;
    }
    to {
      scale: 0 1;
    }
  }
  @media (max-width: 719px) {
    .rstack {
      bottom: calc(84px + env(safe-area-inset-bottom));
    }
  }
</style>
