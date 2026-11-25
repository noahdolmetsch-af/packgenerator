<script>
  /**
   * «Dein Stand in Zahlen» on Velos und Material (Noah 24.11.2026 «b»): this month's km, what is due in care, the last ride,
   * and the twelve months of km below (the shared bar chart, the same months as «Letzte 12 Monate» on Heute). Reads what is
   * already there; the first area, the pattern for the others (README in docs/decisions/stand-in-zahlen.md).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import StandZahlen from '../ui/StandZahlen.svelte';
  import MonthBars from '../review/MonthBars.svelte';
  import { withStravaRides, bikeActs } from '../kmbook.js';
  import { activeBikes } from '../bikeretire.js';
  import { withVisits } from '../workshop.js';
  import { bikeCare } from '../readiness.js';
  import { dueCards } from '../care/overview.js';
  import { bikesHash } from '../bikes.js';
  import { RIDES_HREF } from '../nav.js';
  import { localDay } from '../localday.js';
  import { velosStand } from './velos.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';

  const today = localDay();
  const rideQ = liveQuery(() => db.rides.toArray());
  const bookQ = liveQuery(() => db.kmBook.toArray());
  const actQ = liveQuery(() => bikeActs(db));
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const tasksQ = liveQuery(() => db.maintenance.toArray());

  const loaded = $derived([$rideQ, $bookQ, $actQ, $bikesQ, $visitsQ, $tasksQ].every((x) => x !== undefined));
  const rides = $derived(loaded ? withStravaRides($rideQ, $bookQ, $actQ) : []);
  // the same open work as the cards below: the due rows over all bikes (cards/overview.js)
  const due = $derived.by(() => {
    if (!loaded) return 0;
    const visits = $visitsQ ?? [];
    const checks = activeBikes($bikesQ ?? []).map((b) => ({ bike: b, care: bikeCare(withVisits(b, visits), { tasks: $tasksQ ?? [], visits, today }) }));
    return dueCards(checks, 1).total;
  });
  const s = $derived(velosStand({ rides, due, today }));

  const monthName = (m) => new Date(`${m}-15T12:00:00`).toLocaleDateString(locale(), { month: 'long' });
  const monthLong = (m) => new Date(`${m}-15T12:00:00`).toLocaleDateString(locale(), { month: 'long', year: 'numeric' });
  const monthShort = (m) => new Date(`${m}-15T12:00:00`).toLocaleDateString(locale(), { month: 'short' });
  const now = today.slice(0, 7);
  const tiles = $derived([
    { value: num(s.km), unit: 'km', label: t('in {month}', { month: monthName(now) }), href: bikesHash({ tab: 'care', view: 'km' }) },
    { value: num(s.due), label: s.due === 0 ? t('nothing due in care') : tn(s.due, 'job due in care', 'jobs due in care'), href: bikesHash({ tab: 'care' }), tone: s.due ? 'warn' : 'good' },
    s.lastDays == null
      ? { value: '–', label: t('no ride yet'), href: RIDES_HREF }
      : s.lastDays === 0
        ? { value: t('today'), label: t('last ride'), href: RIDES_HREF }
        : { value: num(s.lastDays), unit: tn(s.lastDays, 'day|stand', 'days|stand'), label: t('since the last ride'), href: RIDES_HREF },
  ]);
  const cols = $derived(
    s.months.map((m, i) => ({
      key: m.month,
      title: monthLong(m.month),
      x: i % 2 === (s.months.length - 1) % 2 ? monthShort(m.month) : '',
      top: '',
      parts: [{ v: m.km }],
      items: [{ label: 'km', value: num(m.km) }],
    })),
  );
</script>

{#if loaded && activeBikes($bikesQ ?? []).length}
  {#if s.any}
    <StandZahlen area="velos" name={t('Bikes')} {tiles} chartLabel={t('Kilometres per month, the last 12 months')}>
      <MonthBars {cols} mark={now} first={t('Month')} unit="km" id="stand-velos" label={t('Kilometres per month, the last 12 months')} height={90} />
    </StandZahlen>
  {:else}
    <StandZahlen area="velos" name={t('Bikes')} {tiles} foot={t('No ride in the last 12 months. Upload a ride or enter kilometres in the ride ledger.')} />
  {/if}
{/if}
