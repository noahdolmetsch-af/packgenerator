<script>
  /**
   * v0.68.0 «Q1 Jeder km zählt» (Q1.7 a): the quality mark «Q1 Gapless km» at the top of a bike, with
   * its four points: km match Strava, every part has a start point, every change has a source and a
   * date, parts take their km along. Plus the monthly report line (answer 4a). «Set start points»
   * opens the first part without one. «Hide» turns it off for this bike (a suggestion, never a must).
   */
  import { Check, CircleAlert } from '@lucide/svelte';
  import { q1Status, monthReport, prevMonth, SOURCE_NAME } from '../kmbook.js';
  import { partName } from '../care.js';
  import { t, tn, num, dateOf, locale } from '../i18n.svelte.js';

  let { bike, entries = [], parts = [], bikes = [], today, onstart, onhide } = $props();

  const q = $derived(q1Status(bike, entries, parts));
  const [km, start, source, carry] = $derived(q.points);
  const STATE = { done: 'met', almost: 'almost met', open: 'not met yet' };
  const nameOf = (id) => bikes.find((b) => b.id === id)?.name ?? t('another bike');
  const month = $derived(today.slice(8) <= '07' ? prevMonth(today) : today.slice(0, 7));
  const report = $derived(monthReport([bike], entries, () => parts, month)[0]);
  const monthName = $derived(new Date(`${month}-15T12:00:00Z`).toLocaleDateString(locale(), { month: 'long', year: 'numeric', timeZone: 'UTC' }));
</script>

<section class="q1 card" aria-labelledby="q1-h-{bike.id}">
  <div class="qh">
    <h3 id="q1-h-{bike.id}">{t('Q1 Gapless km')}</h3>
    <span class="tag {q.state}">{t(STATE[q.state])}</span>
    {#if q.missing.length}<span class="tag almost">{tn(q.missing.length, '{n} part without a start point', '{n} parts without a start point')}</span>{/if}
    <span class="grow"></span>
    {#if q.missing.length}<button type="button" class="btn" onclick={() => onstart?.(q.missing[0].key)}>{t('Set start points')}</button>{/if}
  </div>
  <ul class="pts">
    <li class:ok={km.ok}>
      {#if km.ok}<Check size={16} aria-hidden="true" />{:else}<CircleAlert size={16} aria-hidden="true" />{/if}
      <span><b>{t('km match Strava')}</b>
        <small>
          {#if km.strava == null}{t('No Strava value yet: import activities.csv.')}
          {:else if km.ok}{t('{km} km, 0 km difference, as of {date}', { km: num(Math.round(km.app)), date: dateOf(km.date) })}
          {:else}{t('Strava {s} km, app {a} km: {d} km difference', { s: num(Math.round(km.strava)), a: num(Math.round(km.app ?? 0)), d: num(Math.round(km.diff ?? 0)) })}{#if km.open} · {tn(km.open, '{n} ride waits', '{n} rides wait')}{/if}{/if}
        </small>
      </span>
    </li>
    <li class:ok={start.ok}>
      {#if start.ok}<Check size={16} aria-hidden="true" />{:else}<CircleAlert size={16} aria-hidden="true" />{/if}
      <span><b>{t('Every part has a start point')}</b><small>{start.ok ? tn(parts.length, '{n} part', 'all {n} parts') : t('missing: {parts}', { parts: start.missing.map(partName).join(', ') })}</small></span>
    </li>
    <li class:ok={source.ok}>
      {#if source.ok}<Check size={16} aria-hidden="true" />{:else}<CircleAlert size={16} aria-hidden="true" />{/if}
      <span><b>{t('Every change has a source and a date')}</b><small>{tn(source.n, '{n} entry in the ride ledger', '{n} entries in the ride ledger')}</small></span>
    </li>
    <li class:ok={carry.ok}>
      <Check size={16} aria-hidden="true" />
      <span><b>{t('Parts take their km along')}</b>
        <small>{#if carry.carried.length}{carry.carried.map((p) => t('{part} from {bike}: {km} km brought along', { part: partName(p), bike: nameOf(p.history.findLast((h) => h.action === 'replace')?.from), km: num(p.history.findLast((h) => h.action === 'replace')?.carried) })).join(' · ')}{:else}{t('No part came from another bike.')}{/if}</small>
      </span>
    </li>
  </ul>
  <p class="rep">
    {t('Report {month}:', { month: monthName })}
    {report.rides ? tn(report.rides, '{n} ride', '{n} rides') + ` · ${num(Math.round(report.km))} km · ` : ''}{report.diff == null ? t('no Strava value') : t('{km} km difference to Strava', { km: num(Math.round(report.diff)) })} · {tn(report.missing, '{n} part without a start point', '{n} parts without a start point')}{#if report.last} · {t('last source {source}, {date}', { source: t(SOURCE_NAME[report.last.source] ?? report.last.source), date: dateOf(report.last.date) })}{/if}
    <button type="button" class="lnk" onclick={onhide}>{t('Hide for this bike')}</button>
  </p>
</section>

<style>
  .q1 {
    margin: 12px 0;
  }
  .qh {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
  }
  .qh h3 {
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .grow {
    flex: 1;
  }
  .tag {
    padding: 1px 9px;
    border-radius: 999px;
    font: 500 var(--fs-tiny) / 1.6 var(--font-body);
    white-space: nowrap;
  }
  .tag.done {
    background: var(--accent-soft);
    color: var(--ok);
  }
  .tag.almost {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .tag.open {
    background: var(--bad-soft);
    color: var(--bad);
  }
  .pts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 24px;
    list-style: none;
    margin: 10px 0 0;
    padding: 0;
  }
  .pts li {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    color: var(--warn);
  }
  .pts li.ok {
    color: var(--ok);
  }
  .pts li :global(svg) {
    flex: none;
    margin-top: 3px;
  }
  .pts span {
    display: flex;
    flex-direction: column;
    min-width: 0;
    color: var(--ink);
  }
  .pts b {
    font-weight: 500;
  }
  .pts small,
  .rep {
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .rep {
    margin: 10px 0 0;
    padding-top: 8px;
    border-top: 1px solid var(--line);
  }
  .lnk {
    min-height: 44px;
    padding: 0 6px;
    border: 0;
    background: none;
    color: var(--accent);
    font: 600 var(--fs-small) var(--font-body);
    text-decoration: underline;
    cursor: pointer;
  }
  @media (max-width: 640px) {
    .pts {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
