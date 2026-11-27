<script>
  /**
   * «Haken-Verlauf» (Noah 27.11.2026 «3a»): the card on top of Auswerten › Woche. All activities (rows) against the days (columns): at a glance
   * on which days you ticked what. 10 days at first; 30 days, 3 months and a year with a tap (the choice stays on this device). From
   * 32 days on a column is a week and its shade says on how many days of it there was a tick. Only looking: a tick is added or
   * taken back on Heute (Tick off) or with «Later» in the tick window, never here. The rules are flow/hakenverlauf.js.
   * acts, log: the activities and the log the page already read; today: the local day.
   */
  import { liveQuery } from 'dexie';
  import ChipChoice from '../ui/ChipChoice.svelte';
  import { db } from '../db.js';
  import { tripDays, addDays } from '../flow.js';
  import { homeTrips } from '../home/heute.js';
  import { SPANS, SPAN_DEFAULT, WEEK_FROM, spanOf, rowsOf, daysWithTick, shadeOf } from './hakenverlauf.js';
  import { actName } from './ui.svelte.js';
  import { dnum, wd } from './words.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';

  let { acts = [], log = [], today } = $props();

  const KEY = 'pg.hakenverlauf';
  const read = () => {
    try {
      return spanOf(localStorage.getItem(KEY));
    } catch {
      return SPAN_DEFAULT;
    }
  };
  let span = $state(read());
  const pick = (v) => {
    span = spanOf(v);
    try {
      localStorage.setItem(KEY, String(span));
    } catch {
      /* not saved: the choice still counts until the page is left */
    }
  };

  // a bike trip day counts for «Cycling outdoors» like on Heute (flow.js tripDays)
  const tq = liveQuery(async () => {
    const [trips, rode] = await Promise.all([db.trips.toArray(), db.kmBook.where('date').equals(today).count()]);
    return tripDays(homeTrips(trips), today, { rodeToday: rode > 0 });
  });
  const tripList = $derived($tq ?? []);

  const OPTIONS = $derived([
    { value: 10, label: t('10 days|hv') },
    { value: 30, label: t('30 days|hv') },
    { value: 90, label: t('3 months|hv') },
    { value: 365, label: t('Year|hv') },
  ]);

  const res = $derived(rowsOf({ acts, log, tripDayList: tripList, today, n: span }));
  const cols = $derived(res.cols);
  const week = $derived(span >= WEEK_FROM);
  const dots = $derived(!week && span <= 12);
  const withTick = $derived(daysWithTick(res.groups));
  const quietNames = $derived(res.quiet.map(actName).join(', '));
  const RING = { move: 'Move|ring', mind: 'Mindful|ring', rest: 'Recovery|ring' };
  const loc = $derived(locale());
  const monthOf = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString(loc, { month: 'short', timeZone: 'UTC' }).replace('.', '');

  /* the head: the weekday and the day number (10 days), the number of each Monday (30 days), the month (3 months, a year: every third) */
  const marks = $derived.by(() => {
    if (!week) {
      return cols
        .map((c, i) => {
          if (dots) return { i, top: wd(c.from).slice(0, 1), low: String(dnum(c.from)), span: 1 };
          return new Date(`${c.from}T12:00:00Z`).getUTCDay() === 1 ? { i, top: '', low: String(dnum(c.from)), span: Math.min(5, cols.length - i) } : null;
        })
        .filter(Boolean);
    }
    // a week belongs to the month of its Thursday (like the week number); a label runs up to the next one
    const month = (c) => addDays(c.from, 3).slice(0, 7);
    const wide = span > 100;
    const out = [];
    cols.forEach((c, i) => {
      const m = Number(month(c).slice(5, 7));
      if (i && month(cols[i - 1]) === month(c)) return;
      if (wide && (m - 1) % 3 !== 0) return;
      out.push({ i, top: '', low: monthOf(addDays(c.from, 3)), span: 1 });
    });
    // a label needs room: one that would sit closer than 3 columns to the next is left out
    return out
      .map((m, k) => ({ ...m, room: (out[k + 1]?.i ?? cols.length) - m.i }))
      .filter((m) => m.room >= 3)
      .map((m) => ({ ...m, span: Math.min(wide ? 8 : 4, m.room) }));
  });
  const sentence = $derived(
    span >= 365 ? t('On {a} of {n} days in the last year you ticked something.', { a: num(withTick), n: num(span) }) : t('On {a} of the last {n} days you ticked something.', { a: num(withTick), n: num(span) }),
  );
</script>

<section class="card hv" aria-labelledby="hv-h" data-haken-verlauf>
  <h2 id="hv-h" class="h2">{t('Tick history')}</h2>
  <ChipChoice options={OPTIONS} value={span} onchange={pick} aria-label={t('Period of the tick history')} data-hv-span />
  {#if res.groups.length}
    <p class="det" data-hv-sentence>{sentence}</p>
    <div class="grid" style:--n={cols.length} class:week class:dots class:few={dots} data-hv-grid data-hv-span-days={span}>
      <div class="row head" aria-hidden="true">
        <span class="nm"></span>
        <div class="cells">
          {#each marks as m (m.i)}
            <span class="mk" class:now={cols[m.i].today} style:grid-column="{m.i + 1} / span {m.span}" style:grid-row="1"><b>{m.top}</b><i>{m.low}</i></span>
          {/each}
        </div>
        <span class="sum"></span>
      </div>
      {#each res.groups as g (g.ring)}
        <h3 class="gh" data-hv-group={g.ring}>{t(RING[g.ring])}</h3>
        <ul class="rows">
          {#each g.rows as r (r.act.id)}
            <li class="row" data-hv-act={r.act.id}>
              <span class="nm">{actName(r.act)}</span>
              <div class="cells" aria-hidden="true">
                {#each cols as c, i (c.key)}
                  <span class="c" class:now={c.today} class:we={c.weekend} class:on={r.cells[i] > 0} style:--s={week ? shadeOf(r.cells[i]) : 1}></span>
                {/each}
              </div>
              <span class="sum num" aria-hidden="true">{num(r.n)}</span>
              <span class="sr">{tn(r.n, '{name}: {n} day with a tick', '{name}: {n} days with a tick', { name: actName(r.act) })}</span>
            </li>
          {/each}
        </ul>
      {/each}
    </div>
    {#if quietNames}<p class="det" data-hv-quiet>{t('No tick in this period: {names}', { names: quietNames })}</p>{/if}
  {:else}
    <p class="det" data-hv-none>{t('No tick in this period yet. Tick something on Heute, and this grid fills itself.')} <a href="#/flow">{t('To Active')}</a></p>
  {/if}
</section>

<style>
  .hv {
    padding: var(--sp-4);
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    min-width: 0;
  }
  .h2 {
    margin: 0;
    font: 600 var(--fs-h3, 1.1rem) / 1.25 var(--font-body);
    color: var(--ink);
  }
  .det {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .grid {
    --nw: 116px;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  @media (min-width: 900px) {
    .grid {
      --nw: 210px;
    }
  }
  .rows {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .gh {
    margin: var(--sp-3) 0 var(--sp-1);
    color: var(--ink-3);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
    letter-spacing: 0.04em;
  }
  .row {
    position: relative;
    display: grid;
    grid-template-columns: var(--nw) minmax(0, 1fr) 28px;
    align-items: stretch;
    column-gap: var(--sp-2);
    border-top: 1px solid var(--line);
  }
  .rows .row:first-child {
    border-top: 0;
  }
  .nm {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    align-self: center;
    padding: 6px 0;
    min-width: 0;
    color: var(--ink);
    font-size: var(--fs-small);
    line-height: 1.25;
  }
  .sum {
    align-self: center;
    text-align: right;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .cells {
    display: grid;
    grid-template-columns: repeat(var(--n), minmax(0, 1fr));
    min-width: 0;
  }
  .few .cells {
    max-width: calc(var(--n) * 44px);
  }
  .head {
    border-top: 0;
    margin-top: var(--sp-1);
  }
  .mk {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    white-space: nowrap;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    line-height: 1.15;
    padding-bottom: 4px;
    min-width: 0;
  }
  .grid:not(.dots) .mk {
    align-items: flex-start;
  }
  .mk b {
    font-weight: 600;
  }
  .mk i {
    font-style: normal;
  }
  .mk.now {
    color: var(--ink);
    font-weight: 700;
  }
  /* a cell: a tinted column for the weekend and today, the tick on top of it */
  .c {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 34px;
  }
  .c.we {
    background: color-mix(in srgb, var(--paper-2) 70%, transparent);
  }
  .c.now {
    background: color-mix(in srgb, var(--accent) 14%, transparent);
  }
  .c::after {
    content: '';
    display: block;
    width: 62%;
    height: 18px;
    border-radius: var(--r-1);
    background: var(--paper-2);
  }
  .c.on::after {
    background: var(--accent);
  }
  .week .c::after {
    width: 100%;
    height: 22px;
    border-radius: 0;
    background: var(--paper-2);
  }
  .week .c.on::after {
    background: color-mix(in srgb, var(--accent) calc(var(--s) * 100%), var(--paper-2));
  }
  .dots .c::after {
    width: 12px;
    height: 12px;
    border-radius: var(--r-pill);
    background: transparent;
    box-shadow: inset 0 0 0 1.5px var(--line);
  }
  .dots .c.on::after {
    background: var(--accent);
    box-shadow: none;
  }
  @media (min-width: 600px) {
    .grid {
      max-width: 100%;
    }
    .dots .c::after {
      width: 14px;
      height: 14px;
    }
  }
</style>
