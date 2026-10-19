<script>
  /**
   * v0.102.0 Design-Refresh P4 «Touren» (T4 «Bis zum Start», approved 12.10.2026): an event on Plan shows
   * how long until the start and how much of its preparation is still open, with the names of the open
   * points in one line. The points themselves stay in «Vor der Tour» below (ticked off there).
   * A trip has no start time, so the boxes are days, open and done (the mockup's hours need a time).
   * prep: readiness.js eventPrep; open: the open rows of care.js prepFor.
   * Impeccable 18.10.2026 (Planen 2): what is overdue shows here, not only in «Vor der Tour» at the end of
   * the page: the box «7 offen» gets the line «2 überfällig» (warning colour and a sign, not colour alone),
   * «Noch offen: …» names the overdue ones first. onopen(): a tap on the box opens «Vor der Tour».
   */
  import { daysTo } from '../touren.js';
  import { localDay } from '../localday.js';
  import { t, tn, locale } from '../i18n.svelte.js';
  import { TriangleAlert, ChevronRight } from '@lucide/svelte';

  let { trip, prep = null, open = [], onopen = null } = $props();

  const until = $derived(Math.max(0, daysTo(trip.startDate, localDay()) ?? 0));
  const when = $derived(trip.startDate ? new Date(`${trip.startDate}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) : '');
  const sub = $derived([when, trip.place?.name ?? ''].filter(Boolean).join(' · '));
  // the overdue ones first, the rest in their order
  const sorted = $derived([...open.filter((r) => r.overdue), ...open.filter((r) => !r.overdue)]);
  const names = $derived(sorted.slice(0, 3).map((r) => r.task.task).join(', ') + (sorted.length > 3 ? ' …' : ''));
  const late = $derived(prep?.overdue ?? open.filter((r) => r.overdue).length);
</script>

{#if trip.startDate}
  <section class="es" aria-labelledby="es-h">
    <h2 id="es-h">{t('Until the start')}</h2>
    {#if sub}<p class="sub">{sub}</p>{/if}
    <div class="card body">
      <ul class="boxes">
        <li><b class="num">{until}</b><span>{tn(until, 'day', 'days')}</span></li>
        <li class:obx={onopen && prep?.open}>
          {#if onopen && prep?.open}<button type="button" class="obox" onclick={onopen} aria-label={late ? t('{n} open, {m} overdue: show them', { n: prep.open, m: late }) : t('{n} open: show them', { n: prep.open })}>
            <b class="num">{prep.open}</b><span>{t('open|count')}</span>
            {#if late}<span class="late" data-overdue><TriangleAlert size={14} aria-hidden="true" />{tn(late, '{n} overdue', '{n} overdue')}</span>{/if}
            <ChevronRight class="ochev" size={16} aria-hidden="true" />
          </button>
          {:else}<b class="num">{prep?.open ?? 0}</b><span>{t('open|count')}</span>{#if late}<span class="late" data-overdue><TriangleAlert size={14} aria-hidden="true" />{tn(late, '{n} overdue', '{n} overdue')}</span>{/if}{/if}
        </li>
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
  /* Planen 2: the open box is a button to «Vor der Tour»; overdue in the warning colour with a sign */
  .boxes li.obx {
    display: flex;
    padding: 0;
  }
  .obox {
    position: relative;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 2px;
    flex: 1 1 auto;
    min-width: 0;
    min-height: 44px;
    padding: 14px 6px;
    border: 0;
    border-radius: inherit;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  .obox :global(.ochev) {
    position: absolute;
    top: 8px;
    right: 6px;
    color: var(--ink-3);
  }
  @media (hover: hover) {
    .obox:hover {
      box-shadow: inset 0 0 0 1px var(--line-strong);
    }
  }
  .boxes .late {
    display: block;
    margin-top: 2px;
    color: var(--warn);
    font-weight: 600;
    text-align: center;
  }
  .late :global(svg) {
    margin-right: 3px;
    vertical-align: -2px;
  }
  .foot {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
</style>
