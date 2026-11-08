<script>
  /**
   * «Tour-Pfad» (Noah 08.11.2026 «1 go A», Tour von A bis Z, Schritt 1): Touren › Tour-Pfad (#/trips/pfad?t=<id>). One tour
   * as a path of four phases (Planen, Vorbereiten, Unterwegs, Danach). Every row is a link to a page that exists and shows
   * its state; one main button leads to the first open row of the current phase. A view only: no new data, nothing is
   * stored. The rule is lib/tourpfad/stand.js, the words are lib/tourpfad/saetze.js, the block is ui/Pfad.svelte.
   */
  import { liveQuery } from 'dexie';
  import { Route } from '@lucide/svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Pfad from '../lib/ui/Pfad.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { db } from '../lib/db.js';
  import { homeTrips } from '../lib/home/heute.js';
  import { tourStand } from '../lib/tourpfad/stand.js';
  import { PHASE_TITLE, rowWords, phaseCount, headLine } from '../lib/tourpfad/saetze.js';
  import { localDay } from '../lib/localday.js';
  import { t } from '../lib/i18n.svelte.js';
  import '../lib/ich/ich.css';

  const today = localDay();
  const q = liveQuery(async () => ({ trips: await db.trips.toArray(), debriefs: await db.debriefs.toArray() }));
  let hash = $state(location.hash);
  $effect(() => {
    const on = () => (hash = location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  });
  const wanted = $derived(new URLSearchParams(hash.split('?')[1] ?? '').get('t') ?? '');
  const trips = $derived($q?.trips ?? []);
  // the tour asked for; else the nearest tour that is still ahead or running; else the last one
  const trip = $derived.by(() => {
    const own = trips.find((x) => x.id === wanted);
    if (own) return own;
    const list = homeTrips(trips).filter((x) => !x.skipped);
    const ahead = list.filter((x) => x.startDate && !x.finished && (x.startDate >= today || list.length)).sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''));
    return ahead.find((x) => x.startDate >= today) ?? [...ahead].reverse()[0] ?? null;
  });
  const debrief = $derived(trip ? ($q?.debriefs ?? []).find((x) => x.tripId === trip.id) : null);
  const stand = $derived(trip ? tourStand(trip, { today, debriefDone: debrief?.status === 'done' }) : null);
  const titles = $derived(PHASE_TITLE());
  const phases = $derived(
    (stand?.phases ?? []).map((p) => ({ key: p.key, title: titles[p.key], count: phaseCount(p), state: p.state, rows: p.rows.map((r) => ({ key: r.key, state: r.state, href: r.href, hint: r.hint, ...rowWords(r) })) })),
  );
  const next = $derived(stand?.next ? { href: stand.next.href, label: t('Go on with {title}', { title: rowWords(stand.next).title }) } : null);
</script>

<div class="tp" data-tourpfad>
  <VeloHead crumbs={[{ label: t('Trips|place'), href: '#/trips' }]} here={t('Tour path')} title={trip?.title ?? t('Tour path')} sub={trip && stand ? headLine(stand) : t('Where your tour stands, from the idea to the debrief.')} />
  {#if !$q}
    <p class="ich-help">{t('Loading…')}</p>
  {:else if !trip}
    <Empty icon={Route} title={t('No tour yet')} text={t('A tour gets its path as soon as you plan it: goal, route, packing, the way and the debrief in one line.')} action={{ label: t('Plan a tour'), href: '#/trips' }} />
  {:else if stand && !phases.length}
    <Empty icon={Route} title={t('This tour is not riding')} text={t('A tour that is not riding has no path. Open it again from the trips if it is on.')} action={{ label: t('Back to Trips'), href: '#/trips' }} />
  {:else}
    <Pfad {phases} {next} />
    <p class="ich-help">{t('Every row opens the page where you do it. The path only shows where you are; it changes nothing.')}</p>
  {/if}
</div>

<style>
  .tp {
    display: grid;
    gap: var(--sp-4);
    max-width: 760px;
  }
</style>
