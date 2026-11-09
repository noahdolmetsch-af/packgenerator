<script>
  /**
   * «Fragen» (Plan «ganze App», Schritt 4a, Noah 08.11.2026 «D b»): #/auswerten/fragen, the first tab of Auswerten. Six
   * questions about your own data, each answered in one sentence with the number and the limit behind it («Beobachtung,
   * keine Ursache»). With too little data the card says so and does not guess. The numbers come from the rules that exist
   * (lib/fragen/fragen.js reads signals.js, compare.js, care.js); «Warum?» shows how it was counted, «Mehr dazu» opens the
   * page of the numbers. Only to look at: never a rating, never advice on health. «Das fällt auf» is not here (Schritt 7b).
   */
  import { liveQuery } from 'dexie';
  import { ChevronRight, MessageCircle, Plug } from '@lucide/svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { db } from '../lib/db.js';
  import { analyseData } from '../lib/analyse/data.svelte.js';
  import { analyseGroups, itemsByKey } from '../lib/analyse/catalog.js';
  import { QUESTIONS, answerOf, allFew, MIN_SIDE, MIN_NIGHTS, MIN_AFTER } from '../lib/fragen/fragen.js';
  import { numHref } from '../lib/analyse/zahlweg.js';
  import { MIN_VALUES } from '../lib/analyse/signals.js';
  import { tripPageHref } from '../lib/analyse/tourliste.js';
  import { serviceDue, checkState } from '../lib/care.js';
  import { shown } from '../lib/messwerte.js';
  import { addDays } from '../lib/analyse.js';
  import { tripEnd } from '../lib/tripstate.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn, num } from '../lib/i18n.svelte.js';

  const today = localDay();
  // a year back is enough for every question here (the longest looks 180 days back)
  const data = analyseData({ from: () => addDays(today, -400) });
  const groups = $derived(analyseGroups({ table: data.table, weights: data.weights, ctx: data.ctx, acts: data.acts, log: data.log, ownKeys: data.ownKeys, period: 30 }));
  const byKey = $derived(itemsByKey(groups));
  const bikesQ = liveQuery(() => (db.bikes ? db.bikes.toArray() : []));
  const bikes = $derived($bikesQ);

  const dueOf = (b) => [...serviceDue(b).map((x) => x.name), ...checkState(b).rows.filter((r) => r.due).map((r) => r.name)];
  const ctx = $derived({
    today,
    get: (key) => (d) => byKey.get(key)?.get?.(d) ?? null,
    trips: data.trips,
    endOf: tripEnd,
    bikes: bikes ?? [],
    dueOf,
  });
  const ready = $derived(!data.loading && bikes !== undefined);
  const answers = $derived(ready ? Object.fromEntries(QUESTIONS.map((q) => [q.key, answerOf(q.key, ctx)])) : {});
  const nothing = $derived(ready && allFew(Object.values(answers)));

  const n1 = (v) => num(Math.round(v * 10) / 10);
  const hours = (v) => shown('sleep', v, num);
  const signed = (v, f) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${f(Math.abs(v))}`;

  /** The names of the six groups (the question of the group) and the question itself. */
  const GROUP = {
    body: () => t('How am I doing?'),
    ride: () => t('How do I ride?'),
    tour: () => t('How did the tour go?'),
    together: () => t('What goes together?'),
    bike: () => t('Bike and gear'),
    develop: () => t('How am I developing?'),
  };
  const ASK = {
    koerper: () => t('Is my resting pulse in my usual range?'),
    tempo: () => t('Am I getting faster?'),
    tour: () => t('How was I before and after my last tour?'),
    zusammen: () => t('Do I sleep shorter after a day with a ride?'),
    velo: () => t('What is due on my bikes?'),
    jahr: () => t('How is this year against last year?'),
  };

  /** The answer in one sentence (a number with its unit inside). */
  function sentence(key, a) {
    switch (key) {
      case 'koerper': {
        if (a.state === 'few') return t('Too few days with a resting pulse for a statement: {n} of {need}.', { n: a.n, need: a.need });
        const range = { low: num(Math.round(a.low)), high: num(Math.round(a.high)) };
        const main = a.run
          ? a.run.side === 'above'
            ? tn(a.run.n, 'Your resting pulse has been above your usual for {n} day ({low} to {high} bpm).', 'Your resting pulse has been above your usual for {n} days ({low} to {high} bpm).', range)
            : tn(a.run.n, 'Your resting pulse has been below your usual for {n} day ({low} to {high} bpm).', 'Your resting pulse has been below your usual for {n} days ({low} to {high} bpm).', range)
          : a.mean7 != null
            ? t('Your resting pulse is in your usual range ({low} to {high} bpm); the last 7 days average {mean} bpm.', { ...range, mean: n1(a.mean7) })
            : t('Your resting pulse is in your usual range ({low} to {high} bpm).', range);
        return a.sleep7 != null ? `${main} ${t('Sleep over the last 7 days: {h} on average.', { h: hours(a.sleep7) })}` : main;
      }
      case 'tempo': {
        if (a.state === 'few') return t('Too few rides for a statement: {a} and {b} days with a speed, {need} are needed on each side.', { a: a.nNow, b: a.nPrev, need: a.need });
        if (Math.abs(a.diff) < 0.1) return t('In the last 90 days you ride about as fast as in the 90 days before ({v} km/h).', { v: n1(a.now) });
        return a.diff > 0
          ? t('In the last 90 days you ride {d} km/h faster on average than in the 90 days before.', { d: n1(a.diff) })
          : t('In the last 90 days you ride {d} km/h slower on average than in the 90 days before.', { d: n1(-a.diff) });
      }
      case 'tour': {
        if (a.state === 'few') {
          if (a.why === 'none') return t('No finished tour yet. After your first tour this shows how you slept and how your resting pulse was before and after.');
          if (a.why === 'recent') return t('The tour «{name}» ended only a short while ago: fewer than {n} days after it, too few for a statement.', { name: a.name, n: MIN_AFTER });
          return t('For the tour «{name}» there are no sleep or resting pulse values before and after it.', { name: a.name });
        }
        const parts = [];
        if (a.sleep) parts.push(t('sleep {a} → {b}', { a: hours(a.sleep.before), b: hours(a.sleep.after) }));
        if (a.rhr) parts.push(t('resting pulse {a} → {b} bpm', { a: n1(a.rhr.before), b: n1(a.rhr.after) }));
        return t('Before and after «{name}» (7 days before the start, the days after the end): {parts}.', { name: a.name, parts: parts.join(', ') });
      }
      case 'zusammen': {
        if (a.state === 'few') return t('Too few nights for a statement: {a} after a ride day and {b} after other days, {need} are needed on each side.', { a: a.nAfter, b: a.nOther, need: a.need });
        const both = { a: hours(a.after), b: hours(a.other) };
        if (Math.abs(a.diff) < 5) return t('After days with a ride you sleep about as long as after other days ({a} against {b}).', both);
        const d = hours(Math.abs(a.diff));
        return a.diff < 0 ? t('After days with a ride you sleep {d} shorter on average ({a} against {b}).', { d, ...both }) : t('After days with a ride you sleep {d} longer on average ({a} against {b}).', { d, ...both });
      }
      case 'velo': {
        if (a.state === 'few') return t('No bike yet. Add a bike and the app tells you what is due.');
        if (!a.total) return tn(a.n, 'Nothing is due on your bike.', 'Nothing is due on your {n} bikes.');
        return t('Due: {list}.', { list: a.due.map((b) => `«${b.name}»: ${b.due.join(', ')}`).join('; ') });
      }
      case 'jahr': {
        if (a.state === 'few') return t('Too few rides this year or last year for a comparison: {a} and {b} days with a ride, {need} are needed on each side.', { a: a.nNow, b: a.nPrev, need: a.need });
        return t('This year {now} km so far, last year on the same date {prev} km ({diff} km).', { now: num(Math.round(a.now)), prev: num(Math.round(a.prev)), diff: signed(a.diff, (v) => num(Math.round(v))) });
      }
      default:
        return '';
    }
  }

  /** The limit under the answer: always «observation», plus the amount of data behind it. */
  function limit(key, a) {
    if (a.state === 'few') return t('Nothing is guessed. The question answers itself as soon as there is enough data.');
    switch (key) {
      case 'koerper':
        return t('Observation, not a cause. {n} days with a value; your usual is the middle 80 % of the last 60 days.', { n: a.n });
      case 'tempo':
        return t('Observation, not a cause. Routes can differ. {a} against {b} days with a ride.', { a: a.nNow, b: a.nPrev });
      case 'tour':
        return a.tours < 5 ? tn(a.tours, 'Observation. With {n} tour this is not yet a pattern.', 'Observation. With {n} tours this is not yet a pattern.') : t('Observation, not a cause. The days after the end that are lived so far: {n}.', { n: a.afterDays });
      case 'zusammen':
        return t('Observation, not a cause. {a} against {b} nights of the last 4 months.', { a: a.nAfter, b: a.nOther });
      case 'velo':
        return t('Only parts whose last service you noted count. A part without a note is not guessed.');
      case 'jahr':
        return t('Observation. The distance of all sports from Strava, up to the same date.');
      default:
        return '';
    }
  }

  /** How it was counted («Warum?»). */
  const HOW = {
    koerper: () => t('Your usual range is the middle 80 % of your last 60 days (the 10th to the 90th percentile). «Above» or «below» means at least 3 days in a row outside it. It needs {n} days with a value.', { n: MIN_VALUES }),
    tempo: () => t('The mean of the speed of your ride days in the last 90 days against the 90 days before. It needs {n} ride days on each side.', { n: MIN_SIDE }),
    tour: () => t('The mean of sleep and resting pulse in the 7 days before the start of your last finished tour against the days after its end. It needs {n} days after the tour.', { n: MIN_AFTER }),
    zusammen: () => t('The sleep of the night after a day with distance against the night after the other days, over the last 4 months. It needs {n} nights on each side.', { n: MIN_NIGHTS }),
    velo: () => t('The care points of each bike whose interval in km is used up, from the care list of the bike.'),
    jahr: () => t('The running total of your distance since 1 January against the running total of last year up to the same date. It needs {n} ride days on each side.', { n: MIN_SIDE }),
  };

  /** Where the numbers behind an answer are («Mehr dazu»). */
  function more(key, a) {
    switch (key) {
      case 'koerper':
        return { href: numHref({ key: 'rhr' }), label: t('Resting pulse') };
      case 'tempo':
        return { href: numHref({ key: 'spd' }), label: t('Speed') };
      case 'tour':
        return a.id != null && a.state === 'ok' ? { href: tripPageHref(a.id), label: t('The tour') } : { href: '#/auswerten/analyse?tab=vergleiche', label: t('Comparisons') };
      case 'zusammen':
        return { href: '#/auswerten/analyse?tab=diagramm', label: t('Own diagram') };
      case 'velo':
        return { href: '#/bikes?tab=care', label: t('Bike care') };
      case 'jahr':
        return { href: numHref({ key: 'kmAll', range: 'y' }), label: t('Distance') };
      default:
        return null;
    }
  }
</script>

<div class="fr" data-page="fragen" data-fragen>
  <header class="ph">
    <h1 class="title">{t('Questions')}</h1>
    <p class="sub">{t('Six questions about your own data. Each answer is one sentence with the number and its limit. An answer never says «because» and never gives advice on health.')}</p>
  </header>

  <a class="ask" href="#/assistent" data-fragen-frei>
    <MessageCircle size={20} aria-hidden="true" />
    <span class="am"><b>{t('Ask in your own words')}</b><small>{t('The assistant answers questions about your data, for example «How much did I ride in October?»')}</small></span>
    <ChevronRight size={18} aria-hidden="true" />
  </a>

  {#if !ready}
    <p class="load" role="status">{t('Counting …')}</p>
  {:else if nothing}
    <Empty icon={Plug} title={t('Not enough data for questions yet')} text={t('The questions answer themselves as soon as there are days with values, rides, a finished tour or a bike. Connect Fitbit or Strava, answer «Wi gaht\'s?» or add a bike to start.')} action={{ label: t('See where your numbers come from'), href: '#/auswerten/quellen' }} />
  {/if}

  {#if ready}
    <ul class="qs">
      {#each QUESTIONS as q (q.key)}
        {@const a = answers[q.key]}
        {@const m = more(q.key, a)}
        <li class="card q" data-frage={q.key} data-state={a.state}>
          <p class="g">{GROUP[q.group]()}</p>
          <h2 class="ask-t">{ASK[q.key]()}</h2>
          <p class="ans" class:few={a.state === 'few'} data-frage-antwort>{sentence(q.key, a)}</p>
          <p class="lim">{limit(q.key, a)}</p>
          <details class="why">
            <summary>{t('Why? How it was counted')}</summary>
            <p>{HOW[q.key]()}</p>
          </details>
          {#if m}<a class="more" href={m.href} data-frage-mehr>{t('More about this')}: {m.label} ›</a>{/if}
        </li>
      {/each}
    </ul>

    <!-- «Als Nächstes»: where the numbers come from, then the values themselves -->
    <section class="next" aria-labelledby="fr-next-h">
      <h2 id="fr-next-h" class="nh">{t('What next?')}</h2>
      <p class="nl">
        <a href="#/auswerten/quellen" data-fragen-quellen>{t('See where your numbers come from')} ›</a>
        <a href="#/auswerten/analyse" data-fragen-analyse>{t('Look at your values')} ›</a>
      </p>
    </section>
  {/if}
</div>

<style>
  .fr {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 920px;
    margin: 0 auto;
    min-width: 0;
  }
  .ph .sub {
    margin: var(--sp-1) 0 0;
    color: var(--ink-3);
    font: 400 var(--fs-body) / 1.45 var(--font-body);
  }
  .ask {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-height: 56px;
    padding: var(--sp-3) var(--sp-4);
    border: 1px dashed var(--line);
    border-radius: var(--r-lg, 14px);
    color: var(--ink);
    text-decoration: none;
  }
  .ask .am {
    flex: 1;
    min-width: 0;
    line-height: 1.35;
  }
  .ask b {
    display: block;
    font-weight: 500;
  }
  .ask small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .load {
    color: var(--ink-3);
  }
  .qs {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  @media (min-width: 1000px) {
    .qs {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .q {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    min-width: 0;
  }
  .g {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 500;
  }
  .ask-t {
    margin: 0;
    font: 600 var(--fs-h3, 1.05rem) / 1.3 var(--font-body);
  }
  .ans {
    margin: 0;
    line-height: 1.5;
  }
  .ans.few {
    color: var(--ink-2);
  }
  .lim {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
  .why summary {
    display: flex;
    align-items: center;
    min-height: 44px;
    cursor: pointer;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 500;
  }
  .why p {
    margin: 0 0 var(--sp-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .more {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink);
    font-size: var(--fs-small);
    font-weight: 500;
  }
  .nh {
    margin: 0 0 var(--sp-2);
    font: 600 var(--fs-h3, 1.05rem) / 1.3 var(--font-body);
  }
  .nl {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-1) var(--sp-5);
    margin: 0;
  }
  .nl a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink);
  }
  @media (max-width: 719px) {
    .fr {
      padding-bottom: 72px;
    }
  }
</style>
