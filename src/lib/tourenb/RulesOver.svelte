<script>
  /**
   * Idee 50 «Regel mit Ablaufdatum» (Touren b): a block's rule that held for one tour or until a day is over.
   * The app asks once whether it stays: «Immer behalten» (no end any more) or «Nicht mehr vorschlagen» (the rule
   * off; the block and its items stay). Shown on Bausteine and in Packen; nothing changes until you answer.
   */
  import { liveQuery } from 'dexie';
  import { CalendarClock } from '@lucide/svelte';
  import { db } from '../db.js';
  import { editSets } from '../gear/assign.js';
  import { allSets, blockLabel, SETS_KEY } from '../sets.js';
  import { shortDay } from '../trip/checkhints.js';
  import { localDay } from '../localday.js';
  import { rulesOver, setUntil, ruleOff } from './ruleuntil.js';
  import { t } from '../i18n.svelte.js';

  const setsQ = liveQuery(() => db.settings.get(SETS_KEY));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const today = localDay();
  const over = $derived(rulesOver($setsQ?.value, $tripsQ ?? [], today));
  const cards = $derived(allSets($setsQ?.value));
  const nameOfBlock = (key) => {
    const c = cards.find((x) => x.key === key);
    return c ? blockLabel(c) : key;
  };
  const tripTitle = (id) => ($tripsQ ?? []).find((x) => x.id === id)?.title || t('Untitled trip');
  let msg = $state('');
  async function keep(r) {
    await editSets(db, (v) => ({ value: setUntil(v, r.key, null) }));
    msg = t('«{name}» now holds always.', { name: nameOfBlock(r.key) });
  }
  async function off(r) {
    await editSets(db, (v) => ({ value: ruleOff(v, r.key) }));
    msg = t('«{name}» is no longer suggested. You can switch it on again on Building blocks.', { name: nameOfBlock(r.key) });
  }
</script>

{#if over.length || msg}
  <section class="tp-card ro" aria-labelledby="ro-h" data-rules-over>
    <h2 id="ro-h"><CalendarClock size={18} aria-hidden="true" /> {t('Should the rule stay?')}</h2>
    <ul class="ro-list">
      {#each over as r (r.key)}
        <li data-rule-over={r.key}>
          <span class="ro-t"><b>{nameOfBlock(r.key)}</b> <small>{r.until?.tripId ? t('held only for {trip}', { trip: tripTitle(r.until.tripId) }) : t('held until {day}', { day: shortDay(r.until.date) })}</small></span>
          <span class="ro-a">
            <button type="button" class="btn sm" onclick={() => keep(r)} data-rule-keep>{t('Keep always')}</button>
            <button type="button" class="btn sm" onclick={() => off(r)} data-rule-off>{t('No longer suggest')}</button>
          </span>
        </li>
      {/each}
    </ul>
    {#if msg}<p class="ro-msg tp-small" role="status">{msg}</p>{/if}
  </section>
{/if}

<style>
  .ro {
    margin: 0 0 var(--sp-4);
  }
  .ro h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 6px;
    font-size: var(--fs-sub);
  }
  .ro-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .ro-list li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 10px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
  }
  .ro-t small {
    color: var(--ink-2);
  }
  .ro-a {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .ro-msg {
    margin: 6px 0 0;
  }
</style>
