<script>
  /**
   * Paket A part 4, UC-008-I1 «Grund für Nichtnutzung»: in Material › «Nie gebraucht», why an item was along
   * but not used: forgotten, did not fit, reserve or wrong season. Each reason shows its own next step,
   * instead of a flat «throw it out». Changing it back is one tap (Undo).
   */
  import { db } from '../db.js';
  import { t, nameOf } from '../i18n.svelte.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { saveFailed } from '../ui/ask.js';
  import { NEVER_WHY, setNeverWhy, neverNext } from '../stand/stand.js';

  let { item } = $props();
  const next = $derived(neverNext(item));
  async function pick(key) {
    const before = $state.snapshot(item);
    try {
      await db.items.put({ ...setNeverWhy($state.snapshot(item), key), updatedAt: new Date().toISOString() });
      offerDone(t('Saved.'), async () => {
        await db.items.put(before);
        offerDone(t('Changed back.'));
      });
    } catch (err) {
      offerDone(saveFailed(err));
    }
  }
</script>

<span class="nw" data-never-why={item.id}>
  <select class="sel" value={item.neverWhy ?? ''} aria-label={t('Why was «{name}» not used?', { name: nameOf(item) })} onchange={(e) => pick(e.currentTarget.value)}>
    {#each NEVER_WHY as w (w.key)}<option value={w.key}>{t(w.name)}</option>{/each}
  </select>
  {#if next}<small data-never-next>{t(next)}</small>{/if}
</span>

<style>
  .nw {
    display: grid;
    gap: 4px;
    flex: 1 1 200px;
    min-width: 0;
  }
  small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
