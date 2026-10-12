<script>
  /**
   * v0.112.0 «Strava-Verbindung» (mockup S4): the tile «Strava» on Today. The last fetch: «3 neue
   * Fahrten geholt · +118 km», the km per bike, «alle zugeordnet» or how many wait in «Zum Prüfen».
   * Without a connection on this device: one line and the way to the Strava page.
   */
  import { liveQuery } from 'dexie';
  import { RefreshCw, Check } from '@lucide/svelte';
  import TileHead from '../home/TileHead.svelte';
  import { db } from '../db.js';
  import { strava, STRAVA_HASH, CHECK_HASH } from './client.svelte.js';
  import { t, tn, num, dateOf, locale } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';

  let { isnew = false } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const openQ = liveQuery(() => db.kmBook.where('state').equals('open').toArray());
  const nameOf = (id) => ($bikesQ ?? []).find((b) => b.id === id)?.name ?? '–';
  const last = $derived(strava.last);
  const waiting = $derived(($openQ ?? []).filter((e) => e.source === 'strava').length);
  const when = $derived.by(() => {
    if (!last?.at) return '';
    const d = new Date(last.at);
    return localDay(d) === localDay() ? d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : dateOf(localDay(d));
  });
  const per = $derived(Object.entries(last?.perBike ?? {}).sort((a, b) => b[1].km - a[1].km));
</script>

<div class="st surf" data-section="strava">
  <a class="hd" href={STRAVA_HASH}><TileHead icon={RefreshCw} id="st-h" title="Strava" side={strava.key ? when : ''} {isnew} /></a>
  {#if !strava.key}
    <p class="big">{t('Rides from Strava by themselves')}</p>
    <a class="go" href={STRAVA_HASH}>{t('Connect')} ›</a>
  {:else if strava.busy}
    <p class="big" role="status">{t('Fetching rides …')}</p>
  {:else if last}
    <p class="big">{#if last.n}{tn(last.n, '{n} new ride fetched', '{n} new rides fetched')}{#if last.km} · +{num(Math.round(last.km))} km{/if}{:else}{t('No new rides')}{/if}</p>
    {#if per.length}<p class="per num">{per.map(([id, p]) => `${nameOf(id)} +${num(Math.round(p.km))}`).join(' · ')}</p>{/if}
    {#if waiting}
      <a class="go" href={CHECK_HASH}>{tn(waiting, '{n} to check', '{n} to check')} ›</a>
    {:else if last.n}
      <p class="ok"><Check size={14} aria-hidden="true" />{t('all assigned')}</p>
    {/if}
  {:else}
    <p class="big">{t('Connected · nothing fetched yet')}</p>
    <a class="go" href={STRAVA_HASH}>{t('Fetch now')} ›</a>
  {/if}
</div>

<style>
  .st {
    display: flex;
    flex-direction: column;
    gap: 6px;
    height: 100%;
    padding: 14px 18px;
    box-sizing: border-box;
  }
  .hd {
    color: var(--ink);
    text-decoration: none;
  }
  .hd:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .big {
    margin: 4px 0 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .per {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ok {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: var(--ok);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
  }
  .go {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    min-height: 44px;
    color: var(--accent);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
  }
</style>
