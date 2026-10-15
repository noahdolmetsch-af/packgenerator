<script>
  /**
   * v0.163.x «Pfeile und Ziehen»: the handle to drag a row of a sortable list (see sortable.js, which
   * does the dragging on the list). The arrow keys on the handle move the row one place too.
   * name: the row's name for the screen reader; onstep(dir): -1 up, +1 down.
   */
  import { GripVertical } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { name = '', onstep, size = 18 } = $props();

  function key(e) {
    const dir = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
    if (!dir || !onstep) return;
    e.preventDefault();
    const btn = e.currentTarget;
    const id = btn.closest('li')?.dataset.sortId;
    Promise.resolve(onstep(dir)).then(() =>
      requestAnimationFrame(() => (id ? document.querySelector(`[data-sort-id="${CSS.escape(id)}"] [data-sort-grip]`) : btn)?.focus()),
    );
  }
</script>

<button type="button" class="sort-grip noswipe" data-sort-grip aria-label={t('Drag {name}', { name })} onkeydown={key}><GripVertical {size} aria-hidden="true" /></button>

<style>
  .sort-grip {
    flex: none;
    display: grid;
    place-items: center;
    width: 32px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--ink-3);
    cursor: grab;
    touch-action: none;
  }
  /* a phone or a finger: 44 px to hit */
  @media (max-width: 719px), (pointer: coarse) {
    .sort-grip {
      width: 44px;
    }
  }
  .sort-grip:active {
    cursor: grabbing;
  }
  .sort-grip:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
</style>
