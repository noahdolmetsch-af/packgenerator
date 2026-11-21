<script>
  /**
   * «Aktivität anlegen?» (Noah 21.11.2026 «4a», Thread «Sportjahr», S7): in «Meine Sportarten», when Strava has
   * sports (hiking, swimming …) for which there is no activity yet. One tap makes the activity (movement, no goal,
   * nothing demanded) and counts the Strava activities of that sport back in time; «Nicht fragen» says no for good.
   * Both with Undo. Everything stays changeable in the editor of the activity. Rules: flow/stravaneu.js.
   */
  import { liveQuery } from 'dexie';
  import { Plus } from '@lucide/svelte';
  import { db } from '../db.js';
  import { saveAct, removeAct } from '../flowdb.js';
  import { TICKS_KEY, prefsOf, setSport, savePrefs } from '../stravaticks.js';
  import { openSports, waiting, newActFor, ICON_OF } from './stravaneu.js';
  import ActIcon from './ActIcon.svelte';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t, tn } from '../i18n.svelte.js';

  const q = liveQuery(async () => {
    const [activities, acts, ticks] = await Promise.all([db.activities.toArray(), db.flowActs.toArray(), db.settings.get(TICKS_KEY)]);
    return { activities, acts, map: prefsOf(ticks?.value).map };
  });
  const d = $derived($q);
  const rows = $derived(d ? openSports(d) : []);
  const mapNow = async () => prefsOf((await db.settings.get(TICKS_KEY))?.value).map;

  async function create(r) {
    const before = await mapNow();
    const name = t(r.label);
    const act = newActFor(r, d.acts, name);
    await saveAct(db, act);
    await setSport(r.key, act.id);
    offerDone(t('«{name}» made, {n} activities from Strava count.', { name, n: r.count }), async () => {
      await removeAct(db, act.id);
      await savePrefs({ map: before });
    });
  }
  async function never(r) {
    const before = await mapNow();
    await setSport(r.key, null);
    offerDone(t('Strava «{name}» is no longer asked about.', { name: t(r.label) }), () => savePrefs({ map: before }));
  }
</script>

{#if rows.length}
  <section class="card sn" aria-labelledby="sn-h" data-strava-neu>
    <h2 id="sn-h">{tn(waiting(rows), '{n} activity from Strava without a sport', '{n} activities from Strava without a sport')}</h2>
    <p class="hint">{t('Make a sport of it and they count in your goals and in the sports year. Nothing is demanded: the new sport has no goal.')}</p>
    <ul>
      {#each rows as r (r.key)}
        <li data-sn-sport={r.key}>
          <ActIcon icon={ICON_OF[r.key] ?? 'heart'} ring="move" />
          <span class="nm"><b>{t(r.label)}</b><small>{tn(r.count, '{n} activity', '{n} activities')}</small></span>
          <button type="button" class="btn hi" data-sn-make={r.key} onclick={() => create(r)}><Plus size={16} aria-hidden="true" />{t('Make sport')}</button>
          <button type="button" class="btn" data-sn-never={r.key} onclick={() => never(r)}>{t('Do not ask')}</button>
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .sn {
    display: grid;
    gap: 10px;
    min-width: 0;
    padding: 16px 18px;
  }
  .sn h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .sn ul {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .sn li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 10px;
    min-height: 44px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .nm {
    display: grid;
    flex: 1 1 8rem;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .nm small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
