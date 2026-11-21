<script>
  /**
   * «Meine Datenquellen» (Noah 07.11.2026 «1a», Tour A–Z, Schritt 0, PR B): #/auswerten/quellen. Where the numbers of the app come
   * from, how fresh they are and where there are gaps: Fitbit, Strava, «Wi gaht's?», tours, bikes, and the limits of the data
   * (weather only as a day value at home, no costs per tour yet). Reading only. Setting up stays in Me › Connections.
   * The rows are decided in lib/quellen/quellen.js; this page brings the numbers and the words.
   */
  import { liveQuery } from 'dexie';
  import { HeartPulse, Activity, ClipboardCheck, Route, Bike, CloudSun, Wallet, ChevronRight, Plug } from '@lucide/svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { db } from '../lib/db.js';
  import { strava, readKey } from '../lib/strava/client.svelte.js';
  import { health } from '../lib/health/client.svelte.js';
  import { homeTrips } from '../lib/home/heute.js';
  import { quellenRows, allEmpty } from '../lib/quellen/quellen.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import '../lib/ich/ich.css';

  const today = localDay();
  const since = new Date(Date.parse(`${today}T12:00:00Z`) - 15 * 864e5).toISOString().slice(0, 10);
  const q = liveQuery(async () => {
    const [fitDays, fitCount, fitLast, stravaCount, checkDays, checkCount, trips, debriefs, bikes, maintenance] = await Promise.all([
      db.healthDays.where('date').aboveOrEqual(since).primaryKeys(),
      db.healthDays.count(),
      db.healthDays.orderBy('date').last(),
      db.activities.count(),
      db.flowChecks.where('day').aboveOrEqual(since).primaryKeys(),
      db.flowChecks.count(),
      db.trips.toArray(),
      db.debriefs.toArray(),
      db.bikes.toArray(),
      db.maintenance.count(),
    ]);
    const lastCheck = checkCount ? (await db.flowChecks.orderBy('day').last())?.day ?? null : null;
    return { fitDays: fitDays.map(String), fitCount, fitLast: fitLast?.date ?? null, stravaCount, checkDays: checkDays.map(String), checkCount, lastCheck, trips: homeTrips(trips).length, debriefs: debriefs.filter((d) => d.status === 'done').length, bikes: bikes.length, maintenance };
  });
  const d = $derived($q);
  const hasKey = readKey();
  const rows = $derived(
    d
      ? quellenRows(
          {
            fitbit: { on: !!health.prefs.connected, days: d.fitDays, count: d.fitCount, last: d.fitLast },
            strava: { on: !!hasKey && !!strava.prefs.lastSync, lastSync: strava.prefs.lastSync, count: d.stravaCount },
            check: { count: d.checkCount, last: d.lastCheck, days: d.checkDays },
            trips: { trips: d.trips, debriefs: d.debriefs },
            bikes: { bikes: d.bikes, maintenance: d.maintenance },
          },
          today,
        )
      : [],
  );

  const ICONS = { fitbit: HeartPulse, strava: Activity, check: ClipboardCheck, touren: Route, velos: Bike, wetter: CloudSun, kosten: Wallet };
  const when = (iso) => (iso ? new Date(iso.length > 10 ? iso : `${iso}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' }) : '');
  const whenAt = (iso) => (iso ? new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

  /** The name of a source (a proper name stays as it is). */
  const NAMES = {
    fitbit: () => 'Fitbit',
    strava: () => 'Strava',
    check: () => t('«Wi gaht\'s?» daily check'),
    touren: () => t('Tours and debriefs'),
    velos: () => t('Bikes: kilometres and care'),
    wetter: () => t('Weather'),
    kosten: () => t('Costs'),
  };
  /** The line under the name: what is held and how fresh it is. */
  function line(r) {
    switch (r.key) {
      case 'fitbit':
        return r.state === 'off' ? t('Not connected') : [r.last ? t('values up to {day}', { day: when(r.last) }) : '', r.n ? tn(r.n, '{n} day held', '{n} days held') : ''].filter(Boolean).join(' · ');
      case 'strava':
        return r.state === 'off' ? t('Not connected') : [r.last ? t('last fetch {when}', { when: whenAt(r.last) }) : '', r.n ? tn(r.n, '{n} ride or activity', '{n} rides and activities') : ''].filter(Boolean).join(' · ');
      case 'check':
        return r.state === 'empty' ? t('No answer yet') : [r.last ? t('last answer {day}', { day: when(r.last) }) : '', tn(r.n, '{n} answer', '{n} answers')].filter(Boolean).join(' · ');
      case 'touren':
        return r.state === 'empty' ? t('No tour yet') : [tn(r.n, '{n} tour', '{n} tours'), t('{n} with a debrief', { n: r.n - r.gap.without })].join(' · ');
      case 'velos':
        return r.state === 'empty' ? t('No bike yet') : [tn(r.n, '{n} bike', '{n} bikes'), tn(r.gap.maintenance, '{n} care entry', '{n} care entries')].join(' · ');
      case 'wetter':
        return t('Only day values at your home place. No weather per hour of a ride.');
      case 'kosten':
        return t('Not recorded yet. There is no budget per tour.');
      default:
        return '';
    }
  }
  /** The quiet note about a gap, or ''. */
  function gap(r) {
    if (r.state === 'gap') return tn(r.gap.n, '{n} day without a value in the last {of} days', '{n} days without a value in the last {of} days', { of: r.gap.of });
    if (r.state === 'old') return tn(r.gap.days, 'No new data for {n} day', 'No new data for {n} days');
    return '';
  }
</script>

<div class="qu" data-quellen>
  <VeloHead crumbs={[{ label: t('Analysis|place'), href: '#/auswerten' }]} here={t('My data sources')} title={t('My data sources')} sub={t('Where your numbers come from, how fresh they are and where there are gaps. An answer never promises more than these data carry.')} />

  {#if d && allEmpty(rows)}
    <Empty icon={Plug} title={t('No data source yet')} text={t('Nothing is connected and nothing is recorded yet. Connect Strava or Fitbit, or answer «Wi gaht\'s?» once, and your numbers show up here.')} action={{ label: t('Manage connections'), href: '#/me/connections' }} />
  {:else if d}
    <section class="ich-sec" aria-labelledby="qu-h">
      <div class="ich-h"><div><h2 id="qu-h">{t('Sources')}</h2><p class="ich-hs">{t('state, amount and gaps')}</p></div></div>
      <ul class="card ich-list">
        {#each rows as r (r.key)}
          {@const Icon = ICONS[r.key]}
          <li>
            {#if r.href}
              <a class="ich-row" href={r.href} data-quelle={r.key}>
                <span class="ich-ib"><Icon size={18} aria-hidden="true" /></span>
                <span class="ich-m"><b>{NAMES[r.key]()}</b><small>{line(r)}</small>{#if gap(r)}<small class="qu-gap" data-quelle-gap={r.key}>{gap(r)}</small>{/if}</span>
                <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
              </a>
            {:else}
              <div class="ich-row" data-quelle={r.key}>
                <span class="ich-ib"><Icon size={18} aria-hidden="true" /></span>
                <span class="ich-m"><b>{NAMES[r.key]()}</b><small>{line(r)}</small></span>
                <span class="pill">{t('limit')}</span>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    </section>

    <section class="ich-sec" aria-labelledby="qu-next-h">
      <div class="ich-h"><div><h2 id="qu-next-h">{t('What next?')}</h2></div></div>
      <ul class="card ich-list">
        <li><a class="ich-row" href="#/me/connections" data-quellen-verbinden><span class="ich-ib"><Plug size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Manage connections')}</b><small>{t('Connect, switch off or fetch again')}</small></span><ChevronRight class="ich-chev" size={18} aria-hidden="true" /></a></li>
        <li><a class="ich-row" href="#/auswerten/analyse" data-quellen-analyse><span class="ich-ib"><Activity size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Look at your values')}</b><small>{t('Every value as a tile, with its period')}</small></span><ChevronRight class="ich-chev" size={18} aria-hidden="true" /></a></li>
      </ul>
    </section>
  {/if}
</div>

<style>
  .qu-gap {
    color: var(--warn, var(--ink-2));
  }
</style>
