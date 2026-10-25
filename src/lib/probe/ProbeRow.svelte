<script>
  /**
   * Paket B: the one row that leads to «Generalprobe» (from 7 days before the start: on «Gepackt» and
   * in Packen) and to «Gut ankommen» (on «Tour beendet»). card: a small card of its own instead of a
   * list row (Packen). The page itself: ProbePage.svelte.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, tn } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { betweenHref } from '../phase.js';
  import { LAST_BACKUP } from '../backup.js';
  import { chargeList, chargeCount } from '../charge.js';
  import { ClipboardCheck, House, ChevronRight } from '@lucide/svelte';
  import { PROBE_STEPS, HOME_STEPS, rowsOf, summary, probeDue } from './probe.js';

  let { trip, kind = 'probe', items = [], debrief = null, card = false } = $props();

  const today = localDay();
  const offlineQ = liveQuery(() => db.meta.get('offlineSaved'));
  const backupQ = liveQuery(() => db.meta.get(LAST_BACKUP));
  const show = $derived(!!trip && (kind === 'heim' || (probeDue(trip, today) && !trip.finished)));
  const sum = $derived.by(() => {
    if (!show) return null;
    const charge = chargeList(trip, items);
    const c = chargeCount(trip, charge);
    const ctx = { today, offlineAt: $offlineQ?.value?.[trip.id]?.at ?? null, backupAt: $backupQ?.at ?? null, debriefDone: debrief?.status === 'done', chargeDone: c.done, chargeTotal: c.total };
    return summary(rowsOf(kind === 'heim' ? HOME_STEPS : PROBE_STEPS, trip, trip[kind === 'heim' ? 'home' : 'probe'], ctx));
  });
  const sub = $derived(!sum ? '' : sum.done ? (sum.gap ? tn(sum.gap, '{n} gap left', '{n} gaps left') : t('All checked')) : kind === 'heim' ? t('Wet things, laundry, give back: {done} of {n}', { done: sum.ok + sum.gap, n: sum.total }) : t('Try the trip at home once: {done} of {n}', { done: sum.ok + sum.gap, n: sum.total }));
</script>

{#if show && sum}
  {#if card}
    <a class="card pbc" href={betweenHref(trip, kind)} data-probe-row={kind}><span class="ic" aria-hidden="true"><ClipboardCheck size={18} /></span><span class="bt"><b>{t('Dress rehearsal')}</b><small class="num">{sub}</small></span><ChevronRight size={18} aria-hidden="true" /></a>
  {:else}
    <li><a class="row pbr" href={betweenHref(trip, kind)} data-probe-row={kind}><span class="ic" aria-hidden="true">{#if kind === 'heim'}<House size={18} />{:else}<ClipboardCheck size={18} />{/if}</span><span class="bt"><b>{kind === 'heim' ? t('Arrive well') : t('Dress rehearsal')}</b><small class="num">{sub}</small></span><ChevronRight size={18} aria-hidden="true" /></a></li>
  {/if}
{/if}

<style>
  .pbr,
  .pbc {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 60px;
    padding: 6px 0;
    color: var(--ink);
    text-decoration: none;
  }
  .pbc {
    padding: 10px 16px;
    margin: 0 0 12px;
  }
  .pbr > :global(svg),
  .pbc > :global(svg) {
    flex: none;
    color: var(--ink-3);
  }
  .ic {
    display: grid;
    flex: none;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .bt {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .bt b {
    display: block;
    font-weight: 500;
  }
  .bt small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
