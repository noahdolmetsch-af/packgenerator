<script>
  /**
   * Erinnerung nach einem Ereignis (996 Ideen UC-269-I1, Noah 25.10.2026 «bauen 13»): beside the time
   * reminder, a note can come back after the next trip (any, or one chosen) or after the next workshop
   * visit. It then shows on top of Notes until «Done». Logic: context.js (newAfter, afterHit).
   * value: bindable note.after or undefined.
   */
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { AFTER, newAfter, lastDay } from './context.js';
  import { CalendarClock, BellOff } from '@lucide/svelte';

  let { value = $bindable() } = $props();
  let trips = $state([]);
  let visits = $state([]);
  const today = localDay();
  $effect(() => {
    Promise.all([db.trips.toArray(), db.visits.toArray()])
      .then(([tr, vi]) => ((trips = tr), (visits = vi)))
      .catch(() => {});
  });
  // the trips still to come or running: one can be chosen, else any next trip counts
  const coming = $derived(trips.filter((x) => !x.idea && !x.skipped && x.startDate && (lastDay(x) ?? '') >= today).sort((a, b) => a.startDate.localeCompare(b.startDate)).slice(0, 12));
  const on = $derived(!!value && !value.done);
  function pick(kind) {
    value = newAfter(kind, { today, visits }) ?? undefined;
  }
  function trip(id) {
    value = newAfter('trip', { today, tripId: id || null }) ?? undefined;
  }
</script>

<div class="aft" data-note-after>
  <p class="ah"><CalendarClock size={16} aria-hidden="true" /> {t('Or after an event')}</p>
  <div class="vd-chips" role="group" aria-label={t('Or after an event')}>
    {#each AFTER as a (a.key)}
      <button type="button" class="vd-chip" aria-pressed={on && value.kind === a.key} onclick={() => pick(a.key)} data-after={a.key}>{t(a.label)}</button>
    {/each}
  </div>
  {#if on && value.kind === 'trip' && coming.length}
    <label class="fld"><span class="lbl">{t('Which trip')}</span>
      <select class="inp" value={value.tripId ?? ''} onchange={(e) => trip(e.currentTarget.value)} data-after-trip>
        <option value="">{t('The next one that ends')}</option>
        {#each coming as x (x.id)}<option value={x.id}>{x.title || t('Trip')}</option>{/each}
      </select>
    </label>
  {/if}
  {#if on}
    <p class="q">{value.kind === 'trip' ? t('The note comes back on top of Notes the day after the trip ends.') : t('The note comes back on top of Notes once a workshop visit is saved.')}</p>
    <button type="button" class="btn sm" onclick={() => (value = undefined)} data-after-off><BellOff size={16} aria-hidden="true" />{t('Not after an event')}</button>
  {/if}
</div>

<style>
  .aft {
    display: grid;
    gap: 8px;
    margin: 0 0 12px;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    justify-items: start;
  }
  .ah {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
  }
  .fld {
    margin: 0;
  }
  .q {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
