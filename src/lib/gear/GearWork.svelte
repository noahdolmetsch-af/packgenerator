<script>
  /**
   * Velos aufräumen (Noah 23.11.2026): work on shoes and cleats («Cleat linker Schuh») is no work on the bike. It stood as work
   * due on the bike; now it stands here, in Material, as a quiet list. «Done» closes the job, «Zum Velo» gives it back to its
   * bike; both come with Undo. Nothing is lost: the job is the same record, it only belongs to the gear (care/gearwork.js).
   * Only shown when there is such a job. A suggestion: the rule looks for shoes and cleats in the text.
   */
  import { liveQuery } from 'dexie';
  import { Check, Bike } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, tn } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { isGearWork } from '../care/gearwork.js';
  import { isPrep } from '../care.js';

  const q = liveQuery(() => db.maintenance.toArray());
  const rows = $derived(($q ?? []).filter((x) => !isPrep(x) && isGearWork(x) && (x.status === 'open' || x.status === 'needed')));

  /** Put the old values of the fields back (Undo). */
  const restore = (x, keys) => () => db.maintenance.update(x.id, Object.fromEntries(keys.map((k) => [k, x[k] ?? null])));

  async function done(x) {
    await db.maintenance.update(x.id, { status: 'done', statusDate: localDay(), gear: true });
    offerDone(t('«{name}» is done.', { name: x.task }), restore(x, ['status', 'statusDate', 'gear']));
  }
  async function toBike(x) {
    await db.maintenance.update(x.id, { gear: false });
    offerDone(t('«{name}» is back with the bike.', { name: x.task }), restore(x, ['gear']));
  }
</script>

{#if rows.length}
  <section class="card gw" aria-labelledby="gw-h" data-gear-work>
    <h2 id="gw-h" class="gw-h">{t('Work on gear')} <small class="num">{rows.length}</small></h2>
    <p class="gw-s">{t('Shoes and cleats belong to you, not to a bike: they do not count in the bike care. «To the bike» gives a job back.')}</p>
    <ul class="gw-l">
      {#each rows as x (x.id)}
        <li data-gear-work-row={x.id}>
          <span class="gw-m"><b>{x.task}</b><small>{[x.status === 'needed' ? t('work needed') : t('open repair'), x.subject && x.bikeId ? t('noted on {bike}', { bike: x.subject }) : ''].filter(Boolean).join(' · ')}</small></span>
          <span class="gw-a">
            <button type="button" class="btn sm" onclick={() => toBike(x)} data-gear-work-back><Bike size={16} aria-hidden="true" />{t('To the bike')}</button>
            <button type="button" class="btn sm hi" onclick={() => done(x)} data-gear-work-done><Check size={16} aria-hidden="true" />{t('Done|task')}</button>
          </span>
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .gw {
    margin: var(--sp-4) 0;
    padding: var(--sp-3);
  }
  .gw-h {
    margin: 0;
    font: 600 var(--fs-section) / 1.3 var(--font-body);
  }
  .gw-h small {
    color: var(--ink-3);
    font-weight: 400;
  }
  .gw-s {
    margin: 4px 0 var(--sp-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .gw-l {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .gw-l li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .gw-m {
    display: grid;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .gw-m small {
    color: var(--ink-2);
  }
  .gw-a {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .gw-a .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
</style>
