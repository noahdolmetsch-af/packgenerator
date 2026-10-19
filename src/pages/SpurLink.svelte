<script>
  /**
   * Paket S «Reise-Spur» (Noah 19.10.2026 «4a»): what the family sees behind the read link, without
   * an account and without the app's data: the tour's map, km and the days with their places (and
   * notes, when they were sent along). Nothing of the reader's device is used or stored.
   * #/spur-link/<id>/<key> (the key never leaves the reader's browser).
   */
  import { onMount } from 'svelte';
  import { MapPin, Route as RouteIcon } from '@lucide/svelte';
  import { t, tn, num, locale } from '../lib/i18n.svelte.js';
  import Skeleton from '../lib/ui/Skeleton.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { parseLink, openLink, LINK_ERRORS } from '../lib/spur/link.js';
  import TourMap from '../lib/spur/TourMap.svelte';
  import { zurichTime } from '../lib/spur/spur.js';
  import { liveOf, liveFresh } from '../lib/live/familylive.js';

  let { hash = '' } = $props();
  let tour = $state(null);
  let err = $state('');
  let dayPick = $state(null);

  onMount(async () => {
    const l = parseLink(hash);
    if (!l) return (err = t(LINK_ERRORS.broken));
    try {
      tour = await openLink(l.id, l.key);
    } catch (e) {
      err = t(LINK_ERRORS[e?.code] ?? LINK_ERRORS.server_error);
    }
  });
  const dayName = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'long' }) : '');
  const lines = $derived((tour?.days ?? []).flatMap((d) => d.lines.map((pts, i) => ({ id: `${d.day}-${i}`, pts, n: d.n, day: d.day, src: 'strava' }))));
  // Paket U3 «Live-Karte» (Noah «4a»): while the rider's live map runs, the place now (under 30 min old)
  const live = $derived.by(() => {
    const l = liveOf(tour);
    return l && liveFresh(l) ? { ...l, time: zurichTime(Date.parse(l.at)) } : null;
  });
  const livePt = $derived(live ? [{ id: 'live', kind: 'place', pos: live.pos, text: t('Live: here at {time}', { time: live.time }), n: tour.days.length, day: null, time: live.time }] : []);
  const dayPoints = $derived((tour?.days ?? []).flatMap((d) => [...d.places.map((p, i) => ({ id: `p-${d.day}-${i}`, kind: 'place', pos: p.pos, text: p.text, n: d.n, day: d.day, at: null, time: p.time })), ...d.notes.filter((x) => x.pos).map((x, i) => ({ id: `x-${d.day}-${i}`, kind: 'note', pos: x.pos, text: x.text, n: d.n, day: d.day, time: x.time }))]));
  const points = $derived([...dayPoints, ...livePt]);
  const focus = $derived.by(() => {
    const d = tour?.days.find((x) => x.day === dayPick);
    return d ? { lines: d.lines, points: d.places.map((p) => p.pos) } : null;
  });
  let picked = $state(null);
</script>

<div class="spurlink">
  {#if err}
    <Empty icon={RouteIcon} title={t('Tour not available')} text={err} />
  {:else if !tour}
    <Skeleton rows={4} />
  {:else}
    <header>
      <p class="kick">{t('Travel track')}</p>
      <h1 data-page-title tabindex="-1">{tour.title}</h1>
      <p class="sub num">{[tour.days.length > 1 ? `${dayName(tour.days[0].day)} – ${dayName(tour.days.at(-1).day)}` : dayName(tour.days[0]?.day), tour.km ? `${num(tour.km)} km` : '', tn(tour.days.length, '{n} day', '{n} days')].filter(Boolean).join(' · ')}</p>
      {#if live}<p class="live" role="status" data-family-live><span class="dot" aria-hidden="true"></span>{t('Live: here at {time}', { time: live.time })}</p>{/if}
      {#if tour.at}<p class="tp-small tp-muted">{t('Updated {when}', { when: new Date(tour.at).toLocaleString(locale(), { dateStyle: 'medium', timeStyle: 'short' }) })}</p>{/if}
    </header>
    {#if tour.days.length > 1}
      <div class="tp-chips" role="group" aria-label={t('Days')}>
        <button type="button" class="tp-chip" aria-pressed={dayPick == null} onclick={() => (dayPick = null)}>{t('All days')}</button>
        {#each tour.days as d (d.day)}<button type="button" class="tp-chip" aria-pressed={dayPick === d.day} onclick={() => (dayPick = d.day)}>{t('Day {n}', { n: d.n })}</button>{/each}
      </div>
    {/if}
    {#if lines.length || points.length}
      <TourMap lines={dayPick ? lines.filter((l) => l.day === dayPick) : lines} points={dayPick ? points.filter((p) => p.day === dayPick || p.id === 'live') : points} {focus} height={460} onpick={(p) => (picked = p)} />
    {/if}
    {#if picked}<p class="card pick">{t('Day {n}', { n: picked.n })}{picked.time ? ` · ${picked.time}` : ''}: {picked.text || t('I am here')} <button type="button" class="tp-link" onclick={() => (picked = null)}>{t('Close')}</button></p>{/if}
    <ol class="days">
      {#each tour.days as d (d.day)}
        <li class="card">
          <h2>{t('Day {n}', { n: d.n })} · {dayName(d.day)}</h2>
          <p class="tp-small tp-muted num">{d.km ? `${num(d.km)} km` : t('No ride')}</p>
          {#if d.places.length || d.notes.length}
            <ul>
              {#each [...d.places.map((p) => ({ ...p, k: 'p' })), ...d.notes.map((x) => ({ ...x, k: 'x' }))].sort((a, b) => String(a.time).localeCompare(String(b.time))) as s, i (i)}
                <li><span class="num tm">{s.time}</span> {#if s.k === 'p'}<MapPin size={14} aria-hidden="true" />{/if} {s.text || t('I am here')}</li>
              {/each}
            </ul>
          {/if}
        </li>
      {/each}
    </ol>
    <p class="tp-small tp-muted foot">{t('Shared from the Pack Generator. Read only; photos stay on the rider’s phone.')}</p>
  {/if}
</div>

<style>
  .spurlink {
    display: grid;
    gap: 14px;
    max-width: 900px;
    margin: 0 auto;
  }
  header h1 {
    margin: 0;
  }
  .kick {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .sub {
    margin: 4px 0 0;
    color: var(--ink-2);
  }
  .days {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 10px;
  }
  .days h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .days ul {
    list-style: none;
    padding: 0;
    margin: 8px 0 0;
    display: grid;
    gap: 6px;
  }
  .tm {
    display: inline-block;
    min-width: 44px;
    color: var(--ink-2);
    font-weight: 600;
  }
  .live {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 6px 0 0;
    font-weight: 600;
    color: var(--ok);
  }
  .live .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--ok);
  }
  .foot {
    text-align: center;
  }
</style>
