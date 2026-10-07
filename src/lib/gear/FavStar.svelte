<script>
  /**
   * v0.22.0 (AP05): the favourite star as a button. One tap marks or unmarks an item, saved at
   * once (it stays after a reload). aria-pressed tells the state, the name says what a tap does.
   * Used in the Gear rows and in Pack's "Not packed". describedby: id of the element with the item's name.
   */
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';

  let { item, describedby = undefined, size = 'md' } = $props();
  const on = $derived(!!item.favorite);
  let busy = $state(false);

  async function flip(e) {
    e.stopPropagation();
    if (busy) return;
    busy = true;
    try {
      // Same values as the item dialog: true, or null when not a favourite. The note and the list
      // names stay, so marking it again brings them back.
      await db.items.update(item.id, { favorite: on ? null : true, updatedAt: new Date().toISOString() });
    } finally {
      busy = false;
    }
  }
</script>

<button
  type="button"
  class="fav {size}"
  class:on
  aria-pressed={on}
  aria-label={on ? t('Remove from favourites') : t('Mark as favourite')}
  aria-describedby={describedby}
  title={on ? t('Remove from favourites') : t('Mark as favourite')}
  onclick={flip}
><span aria-hidden="true">{on ? '★' : '☆'}</span></button>

<style>
  .fav {
    flex: none;
    display: inline-grid;
    place-items: center;
    width: 40px;
    min-height: 40px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-3);
    font: 400 20px/1 var(--font-body);
    cursor: pointer;
    border-radius: 6px;
  }
  .fav.sm {
    width: 32px;
    min-height: 32px;
    font-size: 18px;
  }
  .fav.on {
    color: var(--hi);
  }
  @media (hover: hover) {
    .fav:hover {
      background: var(--paper-2);
      color: var(--hi);
    }
  }
  @media (max-width: 719px) {
    .fav.sm {
      width: 40px;
      min-height: 40px;
    }
  }
</style>
