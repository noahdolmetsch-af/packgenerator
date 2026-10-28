<script>
  /**
   * «Nächstes Ziel» back (Noah 27.10.2026 «3a»): one line on top of «Meine Sportarten» with the milestone
   * closest to its next star (as the old page «Ziele» had it, before «Aktiv neu»): its name, the sport, how far
   * it is and what is still missing. A tap opens the sport's page (or all milestones for one over all sports).
   * acts, tripDays: from flowQuery; today: the local day.
   */
  import { liveQuery } from 'dexie';
  import { Star, ChevronRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { msContext, allMilestones, TUNE_KEY } from '../flowms.js';
  import { msName, tileName } from './hobby/words.js';
  import { sportHref } from './mysports.js';
  import { t, num } from '../i18n.svelte.js';

  let { acts = [], tripDays = [], today } = $props();
  const q = liveQuery(async () => {
    const [log, sessions, stars, tune] = await Promise.all([db.flowLog.toArray(), db.flowSessions.toArray(), db.flowStars.toArray(), db.settings.get(TUNE_KEY)]);
    return { log, sessions, stars, tune: tune?.value ?? {} };
  });
  const best = $derived.by(() => {
    const d = $q;
    if (!d || !acts.length) return null;
    const ctx = msContext({ acts, log: d.log, sessions: d.sessions, today, tripDays });
    const stored = new Map(d.stars.map((x) => [x.id, x.day]));
    return allMilestones(ctx, stored, d.tune).filter((r) => !r.off && r.next && r.value > 0).sort((a, b) => b.progress - a.progress)[0] ?? null;
  });
  const act = $derived(best?.m.actId ? acts.find((a) => a.id === best.m.actId) : null);
  const name = $derived(best ? `${msName(best.m)}${act ? ` · ${tileName(act)}` : ''}` : '');
  const fmt = (v) => `${num(Math.round(v * 10) / 10)}${best?.m.unit === 'h' ? ' h' : ''}`;
  const href = $derived(act ? sportHref(act) : '#/flow/milestones');
</script>

{#if best}
  <a class="card ngr" {href} data-next-goal>
    <span class="ic" aria-hidden="true"><Star size={18} /></span>
    <span class="tx">
      <small>{t('Next goal')}</small>
      <b>{name}</b>
      <small class="num">{t('{value} of {target} · {pct} %', { value: fmt(best.value), target: fmt(best.target), pct: Math.round(best.progress * 100) })}</small>
    </span>
    <span class="bar" aria-hidden="true"><i style="width:{Math.round(best.progress * 100)}%"></i></span>
    <ChevronRight size={18} aria-hidden="true" />
  </a>
{/if}

<style>
  .ngr {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 4px var(--sp-3);
    min-height: 44px;
    color: var(--ink);
    text-decoration: none;
  }
  .ic {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--hi);
  }
  .tx {
    display: grid;
    min-width: 0;
    line-height: 1.3;
  }
  .tx b {
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .tx small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .bar {
    grid-column: 2 / 3;
    grid-row: 2;
    height: 6px;
    border-radius: 3px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    background: var(--hi);
  }
</style>
