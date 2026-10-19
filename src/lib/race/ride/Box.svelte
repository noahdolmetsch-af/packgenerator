<script>
  /**
   * Paket U «Rennen», Race mode: a RaceBox you can fold (the chevron). Which boxes are folded is a
   * per-device convenience (localStorage, may be missing); everything works without it.
   */
  import { ChevronDown, ChevronUp } from '@lucide/svelte';
  import RaceBox from '../RaceBox.svelte';
  import { t } from '../../i18n.svelte.js';

  let { id, title, what = '', why = '', from = '', soft = false, children } = $props();
  const KEY = 'race-ride-fold';
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '[]');
    } catch {
      return [];
    }
  };
  let folded = $state(read().includes(id));
  function toggle() {
    folded = !folded;
    try {
      const set = new Set(read());
      if (folded) set.add(id);
      else set.delete(id);
      localStorage.setItem(KEY, JSON.stringify([...set]));
    } catch {
      /* folding just is not remembered */
    }
  }
</script>

<RaceBox {id} {title} {what} {why} {from} {soft}>
  {#snippet actions()}
    <button type="button" class="rc-icon" aria-expanded={!folded} aria-label={folded ? t('Open {name}', { name: title }) : t('Fold {name}', { name: title })} onclick={toggle} data-race-fold={id}>
      {#if folded}<ChevronDown size={18} aria-hidden="true" />{:else}<ChevronUp size={18} aria-hidden="true" />{/if}
    </button>
  {/snippet}
  {#if !folded}{@render children?.()}{/if}
</RaceBox>
