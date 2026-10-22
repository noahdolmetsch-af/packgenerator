<script>
  /**
   * «Aktiv neu» (Noah 22.10.2026 «für jede Sportart können eigene Meilensteine und Verläufe gesehen werden»):
   * the place for this sport's milestones on its page. For now each milestone of the sport with its number,
   * the next star and the stars reached; thread «Meilensteine als Belohnung» fills this slot with its sport
   * card (counters with «zählt: …», challenges, stars). The overview of all milestones lives in Auswerten.
   * act: the activity (Meditation too).
   */
  import { liveQuery } from 'dexie';
  import { Star } from '@lucide/svelte';
  import { db } from '../db.js';
  import { msContext, actMilestones, evaluate, isOff, TUNE_KEY } from '../flowms.js';
  import { msName } from '../flow/hobby/words.js';
  import { t, num } from '../i18n.svelte.js';

  let { act, today } = $props();
  const q = liveQuery(async () => {
    const [log, sessions, stars, tune] = await Promise.all([db.flowLog.where('actId').equals(act.id).toArray(), db.flowSessions.toArray(), db.flowStars.toArray(), db.settings.get(TUNE_KEY)]);
    return { log, sessions, stars, tune: tune?.value ?? {} };
  });
  const rows = $derived.by(() => {
    const d = $q;
    if (!d) return [];
    const ctx = msContext({ acts: [act], log: d.log, sessions: d.sessions, today });
    const stored = new Map(d.stars.map((x) => [x.id, x.day]));
    return actMilestones(act)
      .filter((m) => !isOff(m, d.tune))
      .map((m) => evaluate(m, ctx, stored, d.tune));
  });
  const fmt = (v, unit) => `${num(Math.round(v * 10) / 10)}${unit === 'h' ? ' h' : ''}`;
</script>

<div class="msl" data-milestone-slot={act.id}>
  {#if rows.length}
    <ul>
      {#each rows as r (r.id)}
        <li data-ms={r.id}>
          <span class="nm"><b>{msName(r.m)}</b><small>{r.next ? t('next star at {n}', { n: fmt(r.target, r.m.unit) }) : t('all stars reached')}</small></span>
          <span class="v num">{fmt(r.value, r.m.unit)}</span>
          <span class="bar" aria-hidden="true"><i style="width:{Math.round(r.progress * 100)}%"></i></span>
          <span class="st" aria-label={t('{n} of {m} stars', { n: r.reached.length, m: r.steps.length })}><Star size={14} aria-hidden="true" />{r.reached.length}/{r.steps.length}</span>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="none">{t('No milestones for this sport yet.')}</p>
  {/if}
  <a class="lnk" href="#/flow/milestones?act={encodeURIComponent(act.id)}" data-all-milestones>{t('All milestones')}</a>
</div>

<style>
  .msl {
    display: grid;
    gap: var(--sp-2);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 4px var(--sp-3);
    padding: var(--sp-2) 0;
    border-top: 1px solid var(--line);
  }
  .nm b {
    display: block;
    font-weight: 500;
  }
  .nm small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .v {
    font-weight: 600;
  }
  .bar {
    grid-column: 1 / -1;
    height: 6px;
    border-radius: 3px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    background: var(--sc, var(--hi));
  }
  .st {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    grid-row: 1;
    grid-column: 3;
  }
  .none {
    margin: 0;
    color: var(--ink-3);
  }
</style>
