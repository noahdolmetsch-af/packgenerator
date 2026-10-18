<script>
  import { UNDO_MS } from '../ui/undo.js';
  /**
   * v0.116.0 «Strava-Verbindung» (decision 2a, mockup S5): «Zum Prüfen», Velo › Pflege › Strava › Zum Prüfen.
   * The rides from Strava that wait (no bike in Strava, an unknown Strava bike, a contradiction): each
   * with the suggested bike and one tap «Passt», or «Anderes Velo», or «Zählt nicht». They count only
   * after that. «Alle Vorschläge übernehmen» for all with a suggestion; every tap has «Undo».
   * Beside: the questions «Velo in Strava geändert» as on the bike's page, and the way to the setting
   * «App ordnet selbst nach Fahrtart zu».
   */
  import { liveQuery } from 'dexie';
  import { Bike, Check, ChevronRight, Lightbulb } from '@lucide/svelte';
  import VeloHead from '../bikes/VeloHead.svelte';
  import Empty from '../ui/Empty.svelte';
  import { db } from '../db.js';
  import { sortBikes, bikesHash } from '../bikes.js';
  import { reasonText } from '../kmbook.js';
  import { restoreEntries } from '../kmbookdb.js';
  import { strava, checkRide, STRAVA_HASH } from './client.svelte.js';
  import StravaChanges from './StravaChanges.svelte';
  import { t, tn, num, dateOf } from '../i18n.svelte.js';

  let { bikeId = null } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const openQ = liveQuery(() => db.kmBook.where('state').equals('open').toArray());
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const nameOf = (id) => bikes.find((b) => b.id === id)?.name ?? '–';
  const list = $derived(($openQ ?? []).filter((e) => e.source === 'strava').sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id))));
  const withSug = $derived(list.filter((e) => e.bikeId && bikes.some((b) => b.id === e.bikeId)));
  const care = $derived(bikesHash({ tab: 'care', bike: bikeId, open: !!bikeId }));
  const crumbs = $derived([
    { label: t('Bike'), href: bikesHash({ tab: 'setup', bike: bikeId }) },
    { label: t('Care|tab'), href: care },
    { label: 'Strava', href: STRAVA_HASH },
  ]);

  /** Why this bike: the ride type rule, the usual bike for this ride type, or the import's reason. */
  function why(e) {
    const s = e.reason?.suggest;
    const type = e.type ? t('Ride type «{type}»', { type: e.type }) : '';
    if (s?.why === 'rule') return [type, t('your rule')].filter(Boolean).join(' · ');
    if (s?.why === 'usual') return [type, tn(s.n, 'like {n} ride so far', 'like {n} rides so far')].filter(Boolean).join(' · ');
    return reasonText(e.reason, nameOf);
  }

  let other = $state(null); // the entry whose «Anderes Velo» is open
  let notice = $state(null); // { text, put }
  let timer;
  async function choose(e, bikeId, text) {
    other = null;
    const prev = await checkRide(db, $state.snapshot(e), bikeId);
    clearTimeout(timer);
    notice = { text, put: prev ? [prev] : [] };
    timer = setTimeout(() => (notice = null), UNDO_MS);
  }
  async function undo() {
    const put = $state.snapshot(notice?.put ?? []);
    notice = null;
    if (put.length) await restoreEntries(db, { put });
  }
  async function all() {
    const put = [];
    for (const e of $state.snapshot(withSug)) {
      const prev = await checkRide(db, e, e.bikeId);
      if (prev) put.push(prev);
    }
    clearTimeout(timer);
    notice = { text: tn(put.length, '{n} suggestion taken over.', '{n} suggestions taken over.'), put };
    timer = setTimeout(() => (notice = null), UNDO_MS);
  }
</script>

<div class="sk">
  <VeloHead {crumbs} here={t('To check')} title={t('To check')} sub={list.length ? tn(list.length, '{n} ride without a bike in Strava. One tap on «Fits» is enough. Only then do the km count.', '{n} rides without a bike in Strava. One tap on «Fits» is enough. Only then do the km count.') : ''} />
  {#if notice}
    <p class="note" role="status"><span>{notice.text}</span><button type="button" class="lnk" onclick={undo}>{t('Undo')}</button></p>
  {/if}
  <div class="cols">
    <div class="main">
      {#if !list.length}
        <Empty icon={Check} text={t('Nothing to check. Every ride from Strava has its bike.')} action={{ label: t('Back to Strava'), href: STRAVA_HASH }} />
      {:else}
        <ul class="rides">
          {#each list as e (e.id)}
            <li class="card ride" data-ride={e.stravaId}>
              <div class="rh">
                <span class="m"><b>{e.name || t('Ride')}</b><small class="num">{dateOf(e.date)} · {num(e.km)} km</small></span>
                <span class="chip">{e.gear ? t('Strava bike «{gear}»', { gear: e.gear }) : t('no bike in Strava')}</span>
              </div>
              {#if e.bikeId && bikes.some((b) => b.id === e.bikeId)}
                <div class="sug">
                  <span class="sb"><Bike size={16} aria-hidden="true" /><b>{t('Suggestion: {bike}', { bike: nameOf(e.bikeId) })}</b></span>
                  {#if why(e)}<small>{why(e)}</small>{/if}
                  <button type="button" class="btn hi" onclick={() => choose(e, e.bikeId, t('{bike}: the ride counts now.', { bike: nameOf(e.bikeId) }))}><Check size={16} aria-hidden="true" />{t('Fits')}</button>
                </div>
              {:else}
                <p class="sug none"><small>{why(e) || t('No suggestion: choose the bike.')}</small></p>
              {/if}
              <div class="ra">
                <button type="button" class="lnk" aria-expanded={other === e.id || !e.bikeId} onclick={() => (other = other === e.id ? null : e.id)}>{t('Other bike')}</button>
                <button type="button" class="lnk" onclick={() => choose(e, null, t('Left out: does not count.'))}>{t('Does not count')}</button>
              </div>
              {#if other === e.id || !e.bikeId}
                <select class="sel" aria-label={t('Bike for {ride}', { ride: e.name || dateOf(e.date) })} value="" onchange={(ev) => ev.currentTarget.value && choose(e, ev.currentTarget.value, t('{bike}: the ride counts now.', { bike: nameOf(ev.currentTarget.value) }))}>
                  <option value="">{t('Choose a bike')}</option>
                  {#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
                </select>
              {/if}
            </li>
          {/each}
        </ul>
        {#if withSug.length > 1}
          <p class="allrow"><button type="button" class="btn" onclick={all}><Check size={16} aria-hidden="true" />{tn(withSug.length, 'Take over the {n} suggestion', 'Take over all {n} suggestions')}</button><small>{t('changeable later')}</small></p>
        {/if}
      {/if}
    </div>
    <aside class="side">
      {#if strava.changes.length}<section aria-labelledby="sk-c-h">
        <div class="vh"><h2 id="sk-c-h">{t('Also at the bike')}</h2><p class="vh-s">{t("the same notice is on the bike's page")}</p></div>
        <StravaChanges />
      </section>{/if}
      <section aria-labelledby="sk-a-h">
        <div class="vh"><h2 id="sk-a-h">{t('Rather automatic?')}</h2></div>
        <a class="card orow" href={STRAVA_HASH}><span class="ib"><Lightbulb size={18} aria-hidden="true" /></span><span class="m"><b>{t('The app assigns by ride type')}</b><small>{t('in the Strava settings › change «Ride without a bike»')}</small></span><ChevronRight size={18} aria-hidden="true" /></a>
      </section>
    </aside>
  </div>
</div>

<style>
  .sk {
    margin: 0 0 24px;
  }
  .cols,
  .main,
  .side {
    min-width: 0;
  }
  .cols,
  .main,
  .side {
    display: grid;
    gap: 16px;
    align-content: start;
  }
  @media (min-width: 1000px) {
    .cols {
      grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
      gap: 24px;
      align-items: start;
    }
  }
  .vh {
    margin: 0 2px 10px;
  }
  .vh h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.25 var(--font-body);
  }
  .vh-s {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .rides {
    display: grid;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .ride {
    display: grid;
    gap: 10px;
    padding: 14px 16px;
  }
  .rh {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 6px 12px;
  }
  .m {
    flex: 1 1 12em;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .m b {
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .m small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .chip {
    flex: none;
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--warn-soft);
    color: var(--ink);
    font: 600 var(--fs-tiny) / 1.6 var(--font-body);
  }
  .sug {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    margin: 0;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--hi-soft);
  }
  .sug.none {
    background: var(--paper-2);
  }
  .sb {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .sug small {
    flex: 1 1 12em;
    min-width: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .sug .btn {
    margin-left: auto;
  }
  .ra {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
  }
  .lnk {
    min-height: 44px;
    padding: 0 2px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .allrow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin: 0;
  }
  .allrow small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .note {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 12px;
    margin: 0 0 16px;
    padding: 4px 16px;
    border-radius: var(--radius-card);
    background: var(--ok-soft);
  }
  .orow {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 60px;
    padding: 8px 16px;
    color: var(--ink);
    text-decoration: none;
  }
  .orow:hover b {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .ib {
    flex: none;
    display: inline-grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: var(--radius);
    background: var(--paper-2);
    color: var(--ink-2);
  }
</style>
