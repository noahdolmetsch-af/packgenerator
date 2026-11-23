<script>
  /**
   * The data of the six questions («Fragen», Plan «ganze App» Schritt 4a): reads the signals of the last year and answers each
   * question with `answerOf` (fragen.js, the one place that counts). The page «Fragen» and the assistant (#/assistent) both use it,
   * so a question has one way to its answer. It draws nothing: it hands `{ ready, answers, nothing, okQs, fewQs, stand }` to its snippet.
   * `stand(key)` is the calm line under an answer: from today, the data reach up to the last value.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { analyseData } from '../analyse/data.svelte.js';
  import { analyseGroups, itemsByKey } from '../analyse/catalog.js';
  import { QUESTIONS, answerOf, allFew } from './fragen.js';
  import { serviceDue, checkState } from '../care.js';
  import { addDays } from '../analyse.js';
  import { tripEnd } from '../tripstate.js';
  import { localDay } from '../localday.js';
  import { t, locale } from '../i18n.svelte.js';

  let { children } = $props();

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
  // the answers that stand come first as full cards; the questions that still need data are slim rows under them
  const okQs = $derived(QUESTIONS.filter((q) => answers[q.key]?.state !== 'few'));
  const fewQs = $derived(QUESTIONS.filter((q) => answers[q.key]?.state === 'few'));

  /** The signal whose last value tells how far the data of a question reaches («Stand heute, Daten bis gestern»). */
  const LAST = { koerper: 'rhr', tempo: 'spd', tour: 'sleep', zusammen: 'sleep', jahr: 'kmAll' };
  function lastDay(key) {
    const get = byKey.get(LAST[key])?.get;
    if (!get) return null;
    for (let i = 0; i < 400; i++) {
      const d = addDays(today, -i);
      const v = get(d);
      if (typeof v === 'number' && Number.isFinite(v) && (key !== 'jahr' || v > 0)) return d;
    }
    return null;
  }
  /** The calm line under an answer: it is from today, and the data reach up to this day. */
  function stand(key) {
    if (!LAST[key]) return t('As of today');
    const d = lastDay(key);
    if (!d) return t('As of today');
    if (d === today) return t('As of today, data up to today');
    if (d === addDays(today, -1)) return t('As of today, data up to yesterday');
    return t('As of today, data up to {date}', { date: new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' }) });
  }
</script>

{@render children({ ready, answers, nothing, okQs, fewQs, stand })}
