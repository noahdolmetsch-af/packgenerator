<script>
  import { readLite } from '../actlite.js';
  /**
   * «Zählen?» (Noah 21.11.2026, Klügere Auswertungen K4): in «Meine Sportarten», when the watch knows workouts (Tennis, Hockey,
   * treadmill …) that have no tick. Never silent: one tap on «Count» makes the tick with the minutes of the workout (source Fitbit),
   * «Do not count» leaves it out for good, both with Undo. «Count all» does a whole sport at once. «Walk» is not asked about.
   * A workout that Strava or a tick already holds is not asked about (the same session once). Rules: flow/fitbittraining.js.
   */
  import { liveQuery } from 'dexie';
  import { Check } from '@lucide/svelte';
  import { db } from '../db.js';
  import { putEntries, removeEntries } from '../flowdb.js';
  import { normAct } from '../flow.js';
  import { suggestions, grouped, entryOf, HANDLED_KEY, withHandled, withoutHandled } from './fitbittraining.js';
  import { dayShort } from './words.js';
  import ActIcon from './ActIcon.svelte';
  import { offerDone } from '../ui/rename.svelte.js';
  import { localDay } from '../localday.js';
  import { t, tn, num } from '../i18n.svelte.js';

  const today = localDay();
  const q = liveQuery(async () => {
    const [health, acts, log, activities, handled] = await Promise.all([db.healthDays.toArray(), db.flowActs.toArray(), db.flowLog.toArray(), readLite(db, (T) => T.toArray()), db.settings.get(HANDLED_KEY)]);
    return { health, acts, log, activities, handled: handled?.value ?? [] };
  });
  const d = $derived($q);
  const list = $derived(d ? suggestions({ ...d, today }) : []);
  const groups = $derived(grouped(list));
  const actOf = (id) => normAct(d.acts.find((a) => a.id === id));
  const iconOf = (id) => d.acts.find((a) => a.id === id)?.icon ?? 'heart';
  let all = $state({}); // actId → shows every row (else the newest 4)
  const SHOW = 4;

  const handledNow = async () => (await db.settings.get(HANDLED_KEY))?.value ?? [];
  async function setHandled(v) {
    if (v.length) await db.settings.put({ key: HANDLED_KEY, value: v });
    else await db.settings.delete(HANDLED_KEY);
  }
  async function count(rows) {
    const entries = rows.map((s) => entryOf(s, actOf(s.actId)));
    const before = await handledNow();
    await putEntries(db, entries);
    await setHandled(withHandled(before, rows.map((s) => s.id)));
    const name = actOf(rows[0].actId).nameDe || actOf(rows[0].actId).name;
    offerDone(tn(rows.length, '{n} workout counts for «{name}».', '{n} workouts count for «{name}».', { name }), async () => {
      await removeEntries(db, entries);
      await setHandled(before);
    });
  }
  async function skip(rows) {
    const before = await handledNow();
    await setHandled(withHandled(before, rows.map((s) => s.id)));
    offerDone(tn(rows.length, '{n} workout is no longer asked about.', '{n} workouts are no longer asked about.'), () => setHandled(before));
  }
  const when = (s) => `${dayShort(s.day)} · ${s.start}`;
</script>

{#if groups.length}
  <section class="card fz" aria-labelledby="fz-h" data-fitbit-zaehlen>
    <h2 id="fz-h">{t('Count?')}</h2>
    <p class="hint">{tn(list.length, 'Your watch knows {n} workout that is not counted yet. They count in your goals and in the sports year only if you say yes.', 'Your watch knows {n} workouts that are not counted yet. They count in your goals and in the sports year only if you say yes.')}</p>
    {#each groups as g (g.actId)}
      <div class="grp" data-fz-sport={g.actId}>
        <div class="gh">
          <ActIcon icon={iconOf(g.actId)} ring="move" />
          <span class="nm"><b>{actOf(g.actId).nameDe || actOf(g.actId).name}</b><small>{tn(g.rows.length, '{n} workout', '{n} workouts')} · {t('{n} min', { n: num(g.min) })}</small></span>
          {#if g.rows.length > 1}
            <button type="button" class="btn hi" data-fz-all={g.actId} onclick={() => count(g.rows)}><Check size={16} aria-hidden="true" />{t('Count all')}</button>
          {/if}
        </div>
        <ul>
          {#each all[g.actId] ? g.rows : g.rows.slice(0, SHOW) as s (s.id)}
            <li data-fz-row={s.id}>
              <span class="nm"><b>{when(s)}</b><small>{t('{n} min', { n: num(s.min) })}{#if s.hr}{' · '}{t('pulse {n}', { n: num(s.hr) })}{/if}</small></span>
              <button type="button" class="btn hi" data-fz-count={s.id} onclick={() => count([s])}>{t('Count it|fz')}</button>
              <button type="button" class="btn" data-fz-skip={s.id} onclick={() => skip([s])}>{t('Do not count')}</button>
            </li>
          {/each}
        </ul>
        {#if g.rows.length > SHOW && !all[g.actId]}
          <button type="button" class="btn sm" data-fz-more={g.actId} onclick={() => (all = { ...all, [g.actId]: true })}>{t('Show all {n}', { n: g.rows.length })}</button>
        {/if}
      </div>
    {/each}
  </section>
{/if}

<style>
  .fz {
    display: grid;
    gap: 10px;
    min-width: 0;
    padding: 16px 18px;
  }
  .fz h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .hint {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .grp {
    display: grid;
    gap: 6px;
    border-top: 1px solid var(--line);
    padding-top: 10px;
  }
  .gh {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 10px;
  }
  .grp ul {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .grp li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 10px;
    min-height: 44px;
    padding: 6px 0;
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
  .grp > .btn {
    justify-self: start;
  }
</style>
