<script>
  /**
   * Touren-Idee 44 «Touren nebeneinander» (Noah 26.10.2026 «1a»: an own page, as in the mockup): Touren › Vergleichen
   * (#/trips/compare). Pick two trips: the days side by side with a hint where they overlap, the gear both lists hold
   * but you own too few pieces of for the shared days, and what is still open before each start. Rules: tourplan/compare.js.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { t, tn, locale, nameOf } from '../lib/i18n.svelte.js';
  import { localDay } from '../lib/localday.js';
  import { switchTrip } from '../lib/nav.js';
  import PathHead from '../lib/ui/PathHead.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { TriangleAlert, Check, Package, ListChecks, ChevronRight } from '@lucide/svelte';
  import { compareChoices, firstPair, pickTrip, spanOf, overlapDays, timeline, sharedGear, openTasks } from '../lib/tourplan/compare.js';

  const today = localDay();
  const tripsQ = liveQuery(() => db.trips.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const trips = $derived($tripsQ ?? []);
  const itemsById = $derived(Object.fromEntries(($itemsQ ?? []).map((x) => [x.id, x])));
  const choices = $derived(compareChoices(trips, today));

  let picked = $state(null); // null until the first tap: then the next two trips are shown
  const chosen = $derived((picked ?? firstPair(choices)).filter((id) => choices.some((x) => x.id === id)));
  const a = $derived(choices.find((x) => x.id === chosen[0]) ?? null);
  const b = $derived(choices.find((x) => x.id === chosen[1]) ?? null);
  const tap = (id) => (picked = pickTrip(chosen, id));

  const overlap = $derived(a && b ? overlapDays(a, b) : []);
  const line = $derived(a && b ? timeline(a, b) : null);
  const shared = $derived(a && b ? sharedGear(a, b, itemsById) : []);
  const short = $derived(shared.filter((x) => x.short));
  const enough = $derived(shared.filter((x) => !x.short));
  const tasks = $derived(a && b ? [openTasks(a), openTasks(b)] : []);

  const dayShort = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric' });
  const dayMonth = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'numeric' });
  const spanText = (x) => {
    const s = spanOf(x);
    return s ? (s.start === s.end ? dayMonth(s.start) : `${dayMonth(s.start)}–${dayMonth(s.end)}`) : t('no date');
  };
  const cell = (row) => (row.total == null ? (row.state === 'ok' ? t('set') : t('open')) : row.state === 'none' ? '–' : t('{n} of {m}', { n: row.done, m: row.total }));
  const open = (x) => switchTrip(x.id, '#/pack');
</script>

<div class="page cmp" data-page="trips-compare">
  <PathHead crumbs={[{ label: t('Trips|place'), href: '#/trips' }]} title={t('Trips side by side')} sub={t('Two trips at a glance')} />
  <p class="intro">{t('Pick two trips: where the days overlap, which gear both lists need and what is still open.')}</p>

  {#if choices.length < 2}
    <div data-compare-empty>
      <Empty icon={ListChecks} text={t('You need two coming trips to compare. Plan a second one under Trips.')} action={{ label: t('Back to Trips'), href: '#/trips' }} />
    </div>
  {:else}
    <section class="card cc" aria-label={t('Choose two trips')}>
      <div class="chips" role="group" aria-label={t('Choose two trips')}>
        {#each choices as x (x.id)}
          <button type="button" class="chip" class:on={chosen.includes(x.id)} aria-pressed={chosen.includes(x.id)} data-compare-trip={x.id} onclick={() => tap(x.id)}>
            <span class="nm">{x.title}</span><small>{spanText(x)}</small>
          </button>
        {/each}
      </div>
      {#if !(a && b)}
        <p class="hint" data-compare-pick>{t('Choose one more trip.')}</p>
      {:else}
        {#if line}
          <div class="tl" style:--n={line.length} data-compare-timeline aria-hidden="true">
            {#each line as d (d.day)}
              <div class="col"><span class="dl">{dayShort(d.day)}</span><i class:a={d.a && !d.b} class:b={d.b && !d.a} class:x={d.a && d.b}></i></div>
            {/each}
          </div>
        {/if}
        <p class="legend"><span class="tag ta">{a.title} · {spanText(a)}</span> <span class="tag tb">{b.title} · {spanText(b)}</span></p>
        {#if !spanOf(a) || !spanOf(b)}
          <p class="hint">{t('A trip without a date: the days cannot be compared.')}</p>
        {:else if overlap.length}
          <p class="warn" role="status" data-compare-overlap>
            <TriangleAlert size={18} aria-hidden="true" />
            <span><b>{tn(overlap.length, '{n} day overlaps', '{n} days overlap')}</b> ({overlap.map(dayMonth).join(', ')}). {t('Are the dates right?')}</span>
          </p>
        {:else}
          <p class="ok" data-compare-overlap="0"><Check size={18} aria-hidden="true" /><span>{t('No day overlaps.')}</span></p>
        {/if}
      {/if}
    </section>

    {#if a && b}
      <div class="two">
        <section class="card cc" data-compare-gear>
          <h2><Package size={18} aria-hidden="true" />{t('Shared gear')}</h2>
          <p class="hs">{t('On both lists')}</p>
          {#if !shared.length}
            <p class="hint">{t('No item is on both lists.')}</p>
          {:else}
            <ul class="rows">
              {#each short as x (x.item.id)}
                <li class="row" data-compare-short>
                  <span class="ib w"><TriangleAlert size={18} aria-hidden="true" /></span>
                  <span class="tx"><b>{nameOf(x.item)}</b><small>{t('You own {have}, both trips together need {need}', { have: x.have, need: x.need })}</small></span>
                </li>
              {/each}
            </ul>
            {#if enough.length}
              <details class="more">
                <summary>{tn(enough.length, '{n} more item is enough for both', '{n} more items are enough for both')}<ChevronRight class="chev" size={16} aria-hidden="true" /></summary>
                <ul class="rows">
                  {#each enough as x (x.item.id)}
                    <li class="row"><span class="ib ok"><Check size={18} aria-hidden="true" /></span><span class="tx"><b>{nameOf(x.item)}</b><small>{overlap.length ? t('You own {have}: enough for both', { have: x.have }) : t('Not on the road at the same time')}</small></span></li>
                  {/each}
                </ul>
              </details>
            {/if}
            {#if short.length}<p class="hint">{t('Change the lists on each trip: take another piece or leave one at home.')}</p>{/if}
          {/if}
        </section>

        <section class="card cc" data-compare-tasks>
          <h2><ListChecks size={18} aria-hidden="true" />{t('Open tasks')}</h2>
          <p class="hs">{t('What is still missing before the start')}</p>
          <div class="tw">
            <table>
              <thead><tr><th scope="col"><span class="sr">{t('Task')}</span></th><th scope="col">{a.title}</th><th scope="col">{b.title}</th></tr></thead>
              <tbody>
                {#each tasks[0] as row, n (row.key)}
                  <tr data-compare-row={row.key}>
                    <th scope="row">{t(row.label)}</th>
                    {#each [tasks[0][n], tasks[1][n]] as c, k (k)}
                      <td class={c.state}>{cell(c)}</td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <div class="go">
            <button type="button" class="btn" onclick={() => open(a)}>{t('Open «{name}»', { name: a.title })}</button>
            <button type="button" class="btn" onclick={() => open(b)}>{t('Open «{name}»', { name: b.title })}</button>
          </div>
        </section>
      </div>
    {/if}
  {/if}
</div>

<style>
  .cmp .intro {
    margin: 0 0 12px;
  }
  .cc {
    padding: 12px 16px;
    margin: 0 0 12px;
    min-width: 0;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chip {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    min-height: 44px;
    max-width: 100%;
    padding: 6px 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    text-align: left;
    cursor: pointer;
  }
  .chip .nm {
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .chip small {
    color: var(--ink-3);
  }
  .chip.on {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .tl {
    display: grid;
    grid-template-columns: repeat(var(--n), minmax(0, 1fr));
    gap: 2px;
    margin: 12px 0 6px;
  }
  .col {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  .dl {
    font-size: var(--fs-tiny);
    color: var(--ink-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: clip;
    text-align: center;
  }
  .tl i {
    display: block;
    height: 14px;
    border-radius: 3px;
    background: var(--line);
  }
  .tl i.a,
  .tag.ta {
    background: var(--ok-soft);
  }
  .tl i.b,
  .tag.tb {
    background: var(--warm-soft);
  }
  .tl i.x {
    background: var(--warn);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 6px 0;
  }
  .tag {
    padding: 2px 8px;
    border-radius: 8px;
    font-size: var(--fs-small);
    color: var(--ink);
    overflow-wrap: break-word;
  }
  .warn,
  .ok {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 8px 0 0;
  }
  .warn {
    color: var(--warn);
  }
  .ok {
    color: var(--ink-2);
  }
  .hint {
    margin: 8px 0 0;
    color: var(--ink-3);
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .hs {
    margin: 2px 0 8px;
    color: var(--ink-3);
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .row {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .tx {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .tx small {
    display: block;
    color: var(--ink-3);
  }
  .ib.w {
    color: var(--warn);
  }
  .ib.ok {
    color: var(--accent);
  }
  .more summary {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    cursor: pointer;
    list-style: none;
  }
  .more summary::-webkit-details-marker {
    display: none;
  }
  .more[open] :global(.chev) {
    transform: rotate(90deg);
  }
  .tw {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    padding: 8px 6px;
    border-top: 1px solid var(--line);
    text-align: left;
    vertical-align: top;
    overflow-wrap: break-word;
  }
  thead th {
    border-top: 0;
    font-weight: 600;
  }
  tbody th {
    font-weight: 400;
    color: var(--ink-2);
  }
  td.ok {
    color: var(--accent);
  }
  td.open {
    color: var(--warn);
  }
  .go {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }
  .go .btn {
    max-width: 100%;
    overflow-wrap: break-word;
  }
  @media (min-width: 900px) {
    .two {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      align-items: start;
    }
  }
</style>
