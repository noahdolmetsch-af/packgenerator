<script>
  /**
   * Paket K #99 «Sonne, Mond und Orte»: the fold in «Mehr» on Unterwegs. Sunrise, sunset and when it is
   * really dark, the moon of tonight, and short texts about places along the route from Wikipedia (only
   * when you tap «Orte laden»; then kept on the trip for offline). himmel.js and orte.js hold the rules.
   */
  import { db } from '../db.js';
  import { t, locale, lang } from '../i18n.svelte.js';
  import { touched } from '../trips.js';
  import { daylight, moon, PHASES } from './himmel.js';
  import { askPoints, loadPlaces } from './orte.js';
  import { Sunrise, Sunset, Moon, BookOpen, ExternalLink } from '@lucide/svelte';
  import './unterwegs.css';

  let { trip, date, place = null } = $props();
  const hm = (ms) => (ms == null ? '–' : new Date(ms).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }));
  const day = $derived(place && date ? daylight(date, place.lat, place.lon) : null);
  const m = $derived(moon(date ? new Date(`${date}T22:00:00`).getTime() : Date.now()));
  const fullDay = $derived(new Date(m.nextFull).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric' }));
  const points = $derived(askPoints(trip.route, trip.place ?? place));
  const saved = $derived(trip.placeTexts ?? null);
  let busy = $state(false);
  let msg = $state('');
  async function load() {
    msg = '';
    busy = true;
    try {
      const res = await loadPlaces(points, lang.v === 'en' ? 'en' : 'de');
      await db.trips.update(trip.id, touched({ placeTexts: res }));
      if (!res.list.length) msg = t('No articles found near the route.');
    } catch {
      msg = navigator.onLine === false ? t('No connection. Loading the places needs the internet once.') : t('The places could not be loaded. Try again later.');
    } finally {
      busy = false;
    }
  }
</script>

<div class="uw-sky" data-himmel>
  {#if day}
    <div class="uw-kv">
      <div><b class="num">{hm(day.rise)}</b><span><Sunrise size={14} aria-hidden="true" /> {t('Sunrise')}</span></div>
      <div><b class="num">{hm(day.set)}</b><span><Sunset size={14} aria-hidden="true" /> {t('Sunset')}</span></div>
      <div><b class="num">{hm(day.dark)}</b><span>{t('Dark from')}</span></div>
    </div>
  {:else}
    <p class="tp-small tp-muted">{t('With a start place or a route the sun times of the day appear here.')}</p>
  {/if}
  <p class="moon"><Moon size={18} aria-hidden="true" /> <span><b>{t(PHASES[m.phase])}</b> · {t('{n} % lit', { n: Math.round(m.lit * 100) })} · {t('next full moon {day}', { day: fullDay })}</span></p>

  <h3 class="uw-h3"><BookOpen size={18} aria-hidden="true" /> {t('Places along the way')}</h3>
  {#if saved?.list?.length}
    <ul class="pl">
      {#each saved.list as p (p.title)}
        <li><b>{p.title}</b> <span>{p.text}</span> <a class="tp-link" href={p.url} target="_blank" rel="noopener noreferrer">{t('Wikipedia')}<ExternalLink size={12} aria-hidden="true" /><span class="sr">{t('(opens elsewhere)')}</span></a></li>
      {/each}
    </ul>
  {/if}
  {#if points.length}
    <button type="button" class="btn sm" disabled={busy} onclick={load} data-orte-load>{busy ? t('Loading …') : saved ? t('Load again') : t('Load places')}</button>
    <p class="uw-fine">{t('Start, middle and finish of the route go to Wikipedia only when you tap. The texts stay on this trip for offline.')}</p>
  {:else}
    <p class="tp-small tp-muted">{t('With a route or a start place the app finds short texts about places on the way.')}</p>
  {/if}
  {#if msg}<p class="tp-small" role="status">{msg}</p>{/if}
</div>

<style>
  .moon {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 12px 0 0;
  }
  .uw-kv span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .pl {
    list-style: none;
    margin: 0 0 10px;
    padding: 0;
  }
  .pl li {
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
    overflow-wrap: break-word;
  }
</style>
