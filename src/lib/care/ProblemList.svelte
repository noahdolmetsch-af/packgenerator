<script>
  /**
   * v0.47.1 (Noah): the open problems and repairs of all bikes as ONE flat list, newest on top (they
   * were in each bike's «Due now», ranked by state). Each row keeps a small chip for the bike and for
   * the way to fix it (route: myself, with a guide, bike shop, part needed). The priority is a button
   * in the row (v0.46.1), Done and the other answers as before (••• menu).
   */
  import { Check, ChevronDown } from '@lucide/svelte';
  import MoreMenu from './MoreMenu.svelte';
  import { FIXES, stepFor, PRIORITIES, PRIORITY_NAME, isLate } from '../problems.js';
  import { setFix } from '../problemsdb.js';
  import { db } from '../db.js';
  import { t, dateOf } from '../i18n.svelte.js';

  // v0.48.0 (Pflege C): filterable adds «Open | All» and «All bikes»; with «All» the solved problems
  // of the last 60 days show faint. Each row says where it came from (Inbox, a debrief, noticed myself).
  let { repairs = [], bikes = [], today, onrepair, bikeIdOf = (r) => r.bikeId, filterable = false } = $props();
  let show = $state('open');
  let only = $state('');
  const isOpen = (r) => r.status === 'open' || r.status === 'needed';
  const recent = (r) => !r.statusDate || Date.parse(`${today}T00:00:00Z`) - Date.parse(`${r.statusDate}T00:00:00Z`) <= 60 * 864e5;
  const FROM = { 'Quick note': 'Inbox', Problem: 'noticed myself', Care: 'from a replacement', Debrief: 'a debrief' };

  const bikeOf = (r) => bikes.find((b) => b.id === bikeIdOf(r)) ?? null;
  /** Newest first: by the day it was logged, then by its number (made later = higher). */
  const newer = (a, b) => (b.logDate ?? '').localeCompare(a.logDate ?? '') || (Number(b.id) || 0) - (Number(a.id) || 0);
  const list = $derived([...repairs].filter((r) => (filterable && show === 'all' ? isOpen(r) || (r.status === 'done' && recent(r)) : isOpen(r)) && (!only || bikeIdOf(r) === only)).sort(newer));
  const openCount = $derived(repairs.filter(isOpen).length);
  import Seg from '../ui/Seg.svelte';

  let prioOpen = $state(null);
  let prioSaved = $state(null);
  async function setPriority(task, p) {
    prioOpen = null;
    if (task.priority !== p) await db.maintenance.update(task.id, { priority: p });
    prioSaved = { id: task.id, text: t('Priority: {p}', { p: t(PRIORITY_NAME[p]) }) };
  }
</script>

{#if list.length || (filterable && repairs.length)}
  <section class="problems" class:filterable aria-labelledby="problems-h">
    <div class="phead">
      <h2 id="problems-h" class="zlabel">{t('Problems')} <span class="pill act num">{openCount}</span></h2>
      {#if filterable}
        <div class="pf">
          <Seg small full={false} label={t('Show problems')} value={show} onchange={(v) => (show = v)} options={[{ key: 'open', name: t('Open|problems') }, { key: 'all', name: t('All|problems') }]} />
          {#if bikes.length > 1}<select class="sel mini" aria-label={t('Bike')} bind:value={only}><option value="">{t('All bikes')}</option>{#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}</select>{/if}
        </div>
      {/if}
    </div>
    {#if !list.length}<p class="none">{t('No open problem.')}</p>{/if}
    <ul class="plist" aria-label={t('Problems, newest first')}>
      {#each list as task (task.id)}
        {@const bike = bikeOf(task)}
        {@const late = task.status === 'needed' || isLate(task, today)}
        <li class="prob" class:solved={!isOpen(task)} data-repair-id={task.id}>
          <div class="main">
            <b class="rn">{task.task}</b>
            <span class="meta">
              {#if bike}<i class="nbadge">{bike.name}</i>{/if}
              <i class="nbadge route">{t(FIXES[task.fix ?? 'self'])}</i>
              {#if late}<i class="nbadge"><span class="udot warn" aria-hidden="true"></span>{t('work needed|part')}</i>{/if}
              <span class="when">{dateOf(task.logDate)}{FROM[task.source] ? ` · ${t('from: {where}', { where: t(FROM[task.source]) })}` : ''}</span>
              {#if !isOpen(task)}<i class="pill ok">{t('solved')}</i>{/if}
            </span>
            {#if stepFor(task) || task.note}<span class="sub">{[stepFor(task) ? t(stepFor(task)) : '', task.note].filter(Boolean).join(' · ')}</span>{/if}
            <span class="sub">
              <button type="button" class="prio" class:hi={task.priority === 'high'} aria-expanded={prioOpen === task.id} aria-controls="prio-{task.id}" onclick={() => ((prioOpen = prioOpen === task.id ? null : task.id), (prioSaved = null))}>{t('Priority: {p}', { p: t(PRIORITY_NAME[task.priority] ?? 'Medium') })}<ChevronDown size={14} aria-hidden="true" /></button>{#if task.dueDate} · {t('by {date}', { date: dateOf(task.dueDate) })}{:else if task.beforeRide} · {t('Before the next ride')}{/if}
            </span>
          </div>
          {#if isOpen(task)}<span class="acts">
            <button type="button" class="btn sm" onclick={() => onrepair(task, 'done')}><Check size={16} aria-hidden="true" />{t('Done|task')}</button>
            <MoreMenu label={task.task} actions={[
              ...PRIORITIES.filter((p) => p !== task.priority).map((p) => ({ name: t('Priority: {p}', { p: t(PRIORITY_NAME[p]) }), run: () => setPriority(task, p) })),
              ...Object.keys(FIXES).filter((f) => f !== (task.fix ?? '')).map((f) => ({ name: t('Fix: {how}', { how: t(FIXES[f]) }), run: () => setFix(task, f, bike) })),
              { name: t('Work needed'), run: () => onrepair(task, 'needed') }, { name: t('Not needed any more'), run: () => onrepair(task, 'gone') }]} />
          </span>{/if}
          {#if prioOpen === task.id}
            <div class="extra" id="prio-{task.id}">
              <span class="seg" role="group" aria-label={t('Priority: {task}|repair', { task: task.task })}>
                {#each PRIORITIES as p (p)}<button type="button" aria-pressed={(task.priority ?? 'medium') === p} onclick={() => setPriority(task, p)}>{t(PRIORITY_NAME[p])}</button>{/each}
              </span>
            </div>
          {:else if prioSaved?.id === task.id}
            <p class="extra saved-prio" role="status">✓ {prioSaved.text}</p>
          {/if}
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .phead {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 12px;
  }
  .phead .zlabel {
    flex: 1 1 auto;
  }
  .pf {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .pf .sel {
    width: auto;
  }
  .none {
    margin: 8px 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .prob.solved {
    opacity: 0.6;
  }
  .filterable {
    padding: 14px 16px;
    background: var(--paper);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
  }
  .problems {
    margin: 0 0 18px;
  }
  .plist {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--line);
  }
  .prob {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 6px 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--line);
  }
  .main {
    flex: 1 1 220px;
    min-width: 0;
    display: grid;
    gap: 4px;
  }
  .rn {
    font-weight: 500;
    font-size: var(--fs-body);
    color: var(--ink);
    overflow-wrap: break-word;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 6px;
  }
  .meta i {
    font-style: normal;
  }
  .when,
  .sub {
    font-size: var(--fs-small);
    color: var(--ink-3);
    overflow-wrap: break-word;
  }
  .acts {
    flex: none;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }
  .acts :global(.btn.sm) {
    min-height: 44px;
  }
  .prio {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    color: var(--accent);
    font-weight: 500;
    cursor: pointer;
  }
  .prio:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .prio.hi {
    color: var(--ink);
    font-weight: 600;
  }
  .extra {
    flex-basis: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
  }
  .saved-prio {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .seg {
    display: inline-flex;
    border: 1.5px solid var(--line-strong);
    border-radius: 8px;
    overflow: hidden;
  }
  .seg button {
    min-height: 44px;
    padding: 4px 12px;
    border: 0;
    background: var(--paper);
    font-family: var(--font-body);
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink);
    cursor: pointer;
  }
  .seg button + button {
    border-left: 1px solid var(--line);
  }
  .seg button[aria-pressed='true'] {
    background: var(--ink);
    color: var(--paper);
  }
</style>
