<script>
  /**
   * v0.116.0 «Strava-Verbindung» (mockup S4): the tile «Strava» on Today. The last fetch: «3 neue
   * Fahrten geholt · +118 km», the km per bike, «alle zugeordnet» or how many wait in «Zum Prüfen».
   * Without a connection on this device: one line and the way to the Strava page.
   * «Training» TR1 (Noah 13.10.2026 «1-5a» 5a: this tile becomes «Letzte Aktivität»): the newest
   * activity from Strava with time, km, Hm, Ø heart rate and the time in the zones; a tap opens it
   * (TR3), «Alle Aktivitäten» the list (TR2). «Zum Prüfen» stays below when rides wait.
   * Release analysis P2: the last fetch's km per bike («+118 km · Velo A +80») stays under the activity,
   * and «Strava ›» still leads to the Strava page (connect, «Jetzt holen»).
   */
  import { liveQuery } from 'dexie';
  import { RefreshCw, Check, ChevronRight } from '@lucide/svelte';
  import TileHead from '../home/TileHead.svelte';
  import ZoneBar from './ZoneBar.svelte';
  import KindIcon from './KindIcon.svelte';
  import { db } from '../db.js';
  import { strava, STRAVA_HASH, CHECK_HASH } from './client.svelte.js';
  import { zones } from './zones.svelte.js';
  import { byNewest, zoneSecs, mainZone, hmm, ZONE_NAMES, typeKey } from '../training.js';
  import { t, tn, num, dateOf, locale } from '../i18n.svelte.js';
  import { stravaName } from '../stravanames.js';
  import { localDay } from '../localday.js';
  import { dayWhen } from './when.js';

  let { isnew = false } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const openQ = liveQuery(() => db.kmBook.where('state').equals('open').toArray());
  const lastQ = liveQuery(async () => (await db.activities.orderBy('day').reverse().limit(12).toArray()).sort(byNewest)[0] ?? null);
  const nameOf = (id) => ($bikesQ ?? []).find((b) => b.id === id)?.name ?? '–';
  const last = $derived(strava.last);
  // UI-Test T9 (G1-07): rides already in the app show even when this device has no key yet; the tile
  // then offers to unlock the device instead of «Connect» next to «3 to check»
  const act = $derived($lastQ);
  const secs = $derived(act ? zoneSecs(act.hist, zones.bounds) : null);
  const mz = $derived(mainZone(secs));
  const gearName = (a) => strava.prefs.gear.find((g) => g.id === a.gearId)?.name ?? '';
  const waiting = $derived(($openQ ?? []).filter((e) => e.source === 'strava').length);
  const when = $derived.by(() => {
    if (!last?.at) return '';
    const d = new Date(last.at);
    return localDay(d) === localDay() ? d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : dateOf(localDay(d));
  });
  const per = $derived(Object.entries(last?.perBike ?? {}).sort((a, b) => b[1].km - a[1].km));
  const subLine = $derived(act ? [dayWhen(act.day, act.time), act.kind === 'bike' && gearName(act) ? gearName(act) : t(typeKey(act.type)), mz != null ? t(ZONE_NAMES[mz]) : ''].filter(Boolean).join(' · ') : '');
</script>

<div class="st surf" data-section="strava">
  {#if act}
    <a class="hd" href="#/flow/training"><TileHead icon={RefreshCw} id="st-h" title={t('Last activity')} side={t('from Strava')} {isnew} /></a>
    <a class="act" href="#/flow/training/a/{encodeURIComponent(act.id)}" data-last-activity>
      <span class="nm"><KindIcon kind={act.kind} size={16} /><b title={stravaName(act.name) || t(typeKey(act.type))}>{stravaName(act.name) || t(typeKey(act.type))}</b></span>
      <span class="sub">{subLine}</span>
      <span class="vals num">
        <span><b>{hmm(act.movingS)}</b><small>{t('Time|duration')}</small></span>
        {#if act.km}<span><b>{num(act.km)}</b><small>km</small></span>{/if}
        {#if act.hm != null}<span><b>{num(act.hm)}</b><small>{t('Hm|short')}</small></span>{/if}
        {#if act.hrAvg != null}<span><b>{act.hrAvg}</b><small>{t('Ø heart rate')}</small></span>{/if}
      </span>
    </a>
    {#if secs}<div class="zn"><ZoneBar {secs} legend /></div>{/if}
    {#if last?.n && last.km}<p class="per num" data-fetch-km>{[`+${num(Math.round(last.km))} km`, ...per.map(([id, p]) => `${nameOf(id)} +${num(Math.round(p.km))}`)].join(' · ')}</p>{/if}
    <div class="ft">
      <a class="go" href="#/flow/training?view=list">{t('All activities')}<ChevronRight size={16} aria-hidden="true" /></a>
      {#if waiting}<a class="go" href={CHECK_HASH}>{tn(waiting, '{n} to check', '{n} to check')} ›</a>{/if}
      <a class="go" href={STRAVA_HASH} data-strava-page>{strava.key ? 'Strava' : t('Not connected on this device')} ›</a>
    </div>
  {:else}
  <a class="hd" href={STRAVA_HASH}><TileHead icon={RefreshCw} id="st-h" title="Strava" side={strava.key ? when : ''} {isnew} /></a>
  {#if !strava.key}
    <p class="big">{t('Rides from Strava by themselves')}</p>
    <a class="go" href={STRAVA_HASH}>{t('Connect')} ›</a>
  {:else if strava.busy}
    <p class="big" role="status">{t('Fetching rides …')}</p>
  {:else if last}
    <p class="big">{#if last.n}{tn(last.n, '{n} new ride fetched', '{n} new rides fetched')}{#if last.km}{' · '}+{num(Math.round(last.km))} km{/if}{:else}{t('No new rides')}{/if}</p>
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
    container-type: inline-size;
  }
  .hd {
    display: flex;
    align-items: center;
    min-height: 44px;
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
  .act {
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: var(--ink);
    text-decoration: none;
  }
  .act:hover .nm b {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .nm {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .nm b {
    /* 0.136.0: a long name ends in «…» (the whole name is on the activity's page and in the tooltip) */
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font: 700 var(--fs-sub) / 1.3 var(--font-body);
  }
  .sub {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .vals {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(64px, 1fr));
    gap: 6px;
    margin-top: 6px;
  }
  .vals span {
    display: flex;
    flex-direction: column;
    padding: 6px 10px;
    border-radius: var(--radius);
    background: var(--paper-2);
  }
  .vals b {
    font: 700 var(--fs-sub) / 1.2 var(--font-body);
  }
  .vals small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .zn {
    margin-top: 6px;
  }
  /* a narrow tile (a phone, size «breit»): the bar without its legend */
  @container (max-width: 260px) {
    .zn :global(.lg) {
      display: none;
    }
  }
  .ft {
    display: flex;
    flex-wrap: wrap;
    gap: 0 16px;
    margin-top: auto;
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
