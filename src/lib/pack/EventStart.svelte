<script>
  /**
   * v0.102.0 Design-Refresh P4 «Touren» (T4 «Bis zum Start», approved 12.10.2026): an event on Plan shows
   * how long until the start and how much of its preparation is still open, with the names of the open
   * points in one line. The points themselves stay in «Vor der Tour» below (ticked off there).
   * A trip has no start time, so the boxes are days, open and done (the mockup's hours need a time).
   * prep: readiness.js eventPrep; open: the open rows of care.js prepFor.
   */
  import { daysTo } from '../touren.js';
  import { localDay } from '../localday.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  let { trip, prep = null, open = [] } = $props();

  const until = $derived(Math.max(0, daysTo(trip.startDate, localDay()) ?? 0));
  const when = $derived(trip.startDate ? new Date(`${trip.startDate}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) : '');
  const sub = $derived([when, trip.place?.name ?? ''].filter(Boolean).join(' · '));
  const names = $derived(open.slice(0, 3).map((r) => r.task.task).join(', ') + (open.length > 3 ? ' …' : ''));
</script>

{#if trip.startDate}
  <section class="es" aria-labelledby="es-h">
    <h2 id="es-h">{t('Until the start')}</h2>
    {#if sub}<p class="sub">{sub}</p>{/if}
    <div class="card body">
      <ul class="boxes">
        <li><b class="num">{until}</b><span>{tn(until, 'day', 'days')}</span></li>
        <li><b class="num">{prep?.open ?? 0}</b><span>{t('open|count')}</span></li>
        <li><b class="num">{prep?.done ?? 0}</b><span>{t('done|count')}</span></li>
      </ul>
      <p class="foot">{open.length ? t('Still open: {list}', { list: names }) : prep?.total ? t('All preparation done.') : t('No preparation tasks for this event.')}</p>
    </div>
  </section>
{/if}

<style>
  .es {
    min-width: 0;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .sub {
    margin: 2px 0 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .body {
    display: grid;
    gap: 12px;
  }
  .boxes {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .boxes li {
    display: grid;
    justify-items: center;
    gap: 2px;
    padding: 14px 6px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    min-width: 0;
  }
  .boxes b {
    font: 600 var(--fs-title) / 1.1 var(--font-body);
  }
  .boxes span {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .foot {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
</style>
