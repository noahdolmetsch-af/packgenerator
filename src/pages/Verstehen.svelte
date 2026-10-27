<script>
  /**
   * «App verstehen» (Noah 26.10.2026 21:11 UTC «mini kurs … in der app einsehbar mit links und übungen …
   * unter ich - app verstehen»): Ich › App verstehen (#/me/verstehen). Seven lessons in any order (lib/verstehen.js),
   * each folded: why, the steps, one exercise and its links. «Done» can be ticked and unticked; nothing reminds.
   */
  import { onMount } from 'svelte';
  import { t } from '../lib/i18n.svelte.js';
  import { db } from '../lib/db.js';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import { ChevronDown, ExternalLink, CircleCheck, Circle } from '@lucide/svelte';
  import { LESSONS, HANDBOOK, ACCOUNTS, isOutside, readDone, saveDone, toggleDone } from '../lib/verstehen.js';
  import '../lib/ich/ich.css';

  let done = $state([]);
  onMount(async () => {
    try {
      done = await readDone(db);
    } catch {
      done = [];
    }
  });

  async function tick(id) {
    done = toggleDone(done, id);
    try {
      await saveDone(db, done);
    } catch {
      /* the tick stays on screen; it is only a reminder for you */
    }
  }
</script>

<div class="vs-page ich-page" data-verstehen>
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Understand the app')} sub={t('Seven short lessons, so you can keep the app going yourself')} />

  <div class="ich-main">
    <section class="ich-sec" aria-labelledby="vs-intro">
      <div class="ich-h"><div><h2 id="vs-intro">{t('Two parts')}</h2></div></div>
      <div class="card ich-body vs-intro">
        <p>{t('Packing, planning, trips, bikes, gear and notes run only on this device. They need no server and no helper, and keep running for years.')}</p>
        <p>{t('Strava, Fitbit and Google, AI, sync and reminders need a small server and outside accounts. One of them can stop now and then; the rest goes on.')}</p>
        <p>{t('The biggest risk is losing your data without a backup. Lesson 2 shows how to avoid it.')}</p>
        <p class="vs-docs">
          <a href={HANDBOOK} target="_blank" rel="noopener">{t('Emergency handbook')} <ExternalLink size={14} aria-hidden="true" /></a>
          <a href={ACCOUNTS} target="_blank" rel="noopener">{t('Account list')} <ExternalLink size={14} aria-hidden="true" /></a>
        </p>
      </div>
    </section>

    <section class="ich-sec" aria-labelledby="vs-lessons">
      <div class="ich-h">
        <div>
          <h2 id="vs-lessons">{t('Lessons')}</h2>
          <p class="ich-hs" data-vs-count>{t('{n} of {total} done', { n: done.length, total: LESSONS.length })}</p>
        </div>
      </div>
      <p class="vs-help">{t('Pick any lesson, in any order. Each one takes 15 to 20 minutes. Tick «Done» when you like; it is only for you.')}</p>
      <ol class="vs-list">
        {#each LESSONS as l, i (l.id)}
          {@const isDone = done.includes(l.id)}
          <li class="card vs-lesson" data-lesson={l.id} class:done={isDone}>
            <details>
              <summary>
                <span class="vs-num" aria-hidden="true">{i + 1}</span>
                <span class="vs-head"><b>{t(l.title)}</b><small>{t(l.goal)}</small></span>
                {#if isDone}<span class="vs-badge">{t('Done|lesson')}</span>{/if}
                <ChevronDown class="vs-chev" size={20} aria-hidden="true" />
              </summary>
              <div class="vs-body">
                {#each l.lines as line (line)}<p>{t(line)}</p>{/each}
                <h3>{t('Step by step')}</h3>
                <ol class="vs-steps">
                  {#each l.steps as s (s)}<li>{t(s)}</li>{/each}
                </ol>
                <div class="vs-ex">
                  <h3>{t('Exercise')}</h3>
                  <p>{t(l.exercise)}</p>
                </div>
                <ul class="vs-links">
                  {#each l.links as k (k.href)}
                    <li>
                      {#if isOutside(k.href)}
                        <a href={k.href} target="_blank" rel="noopener">{t(k.label)} <ExternalLink size={14} aria-hidden="true" /></a>
                      {:else}
                        <a href={k.href}>{t(k.label)}</a>
                      {/if}
                    </li>
                  {/each}
                </ul>
                <button type="button" class="btn vs-tick" aria-pressed={isDone} onclick={() => tick(l.id)}>
                  {#if isDone}<CircleCheck size={18} aria-hidden="true" />{t('Done|lesson')}{:else}<Circle size={18} aria-hidden="true" />{t('Mark as done')}{/if}
                </button>
              </div>
            </details>
          </li>
        {/each}
      </ol>
    </section>
  </div>
</div>

<style>
  .vs-page {
    max-width: 760px;
  }
  .vs-intro p {
    margin: 0 0 8px;
  }
  .vs-docs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
  }
  .vs-docs a,
  .vs-links a {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
  }
  .vs-help {
    margin: 0 2px 12px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .vs-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  .vs-lesson {
    padding: 0;
    min-width: 0;
  }
  summary {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    min-height: 56px;
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  .vs-num {
    flex: none;
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--accent-soft);
    color: var(--ink);
    font-weight: 700;
  }
  .done .vs-num {
    background: var(--accent);
    color: var(--paper);
  }
  .vs-head {
    flex: 1;
    min-width: 0;
    display: grid;
  }
  .vs-head small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .vs-badge {
    flex: none;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--accent);
  }
  summary :global(.vs-chev) {
    flex: none;
    transition: transform 0.15s;
  }
  details[open] summary :global(.vs-chev) {
    transform: rotate(180deg);
  }
  .vs-body {
    padding: 0 16px 16px 56px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .vs-body p {
    margin: 0 0 8px;
  }
  .vs-body h3 {
    margin: 14px 0 6px;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .vs-steps {
    margin: 0;
    padding-left: 20px;
  }
  .vs-steps li + li {
    margin-top: 4px;
  }
  .vs-ex {
    margin-top: 12px;
    padding: 2px 12px 8px;
    border-radius: 10px;
    background: var(--paper-2);
  }
  .vs-links {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0 18px;
  }
  .vs-tick {
    margin-top: 8px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  @media (max-width: 520px) {
    .vs-body {
      padding-left: 16px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    summary :global(.vs-chev) {
      transition: none;
    }
  }
</style>
