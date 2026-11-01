<script>
  /**
   * «Kochen» after training (Noah 29.10.2026 «a»): a small card when you rode today or yesterday, with the
   * groups that fit after a ride («Carbs», «Protein bombs»). A tap opens that group in the list. It reads
   * the rides and stores nothing; «Hide» hides it for today.
   */
  import { Bike, X } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { trainingOf } from '../kochen/training.js';
  import { groupName } from '../kochen/kochen.js';
  import { localDay } from '../localday.js';
  import { t } from '../i18n.svelte.js';

  /** groups: the person's groups (kochen.js groupsOf); onpick(group): opens that group in the list. */
  let { groups = [], onpick } = $props();

  const ridesQ = liveQuery(() => db.rides.toArray());
  const today = $derived(localDay());
  const hint = $derived(trainingOf($ridesQ ?? [], today));
  let hidden = $state(false);
  const shown = $derived(hint ? hint.groups.map((k) => groups.find((g) => g.std === k)).filter(Boolean) : []);
</script>

{#if hint && shown.length && !hidden}
  <section class="fz-box kt" aria-labelledby="kt-h" data-ko-training>
    <h2 class="fz-h2" id="kt-h"><Bike size={18} aria-hidden="true" />{hint.day === 'today' ? t('You rode {km} km today', { km: hint.km }) : t('You rode {km} km yesterday', { km: hint.km })}</h2>
    <p class="fz-note">{t('After a ride, protein and carbs help. Just a suggestion:')}</p>
    <div class="fz-chips">
      {#each shown as g (g.id)}
        <button type="button" class="fz-chip" onclick={() => onpick?.(g)} data-ko-training-group={g.std}>{groupName(g, t)}</button>
      {/each}
      <button type="button" class="fz-chip" onclick={() => (hidden = true)} data-ko-training-hide><X size={14} aria-hidden="true" />{t('Hide for today')}</button>
    </div>
  </section>
{/if}

<style>
  .kt :global(.fz-chip) {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .kt h2 {
    display: flex;
    align-items: center;
    gap: 8px;
  }
</style>
