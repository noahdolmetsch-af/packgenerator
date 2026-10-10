<script>
  /**
   * v0.68.0 «Q1 Jeder km zählt» (Q1.6 a, answer 4a): the weekly card on Today, right under the trip.
   * «Compare km: Strava says X, the app says Y», with «Take the Strava value», «Correction with a
   * reason» and «later» (once a week); beside it «Assign rides»: the unclear rides with the bike
   * buttons right there (they count only after you confirmed them). In the first week of a month the
   * report line per bike. Shown only when there is something to do; every action can be undone.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { sortBikes, bikesHash } from '../bikes.js';
  import { ensureParts, isMore, parseKm } from '../care.js';
  import { partAreas } from '../care/overview.js';
  import { reconcile, matches, isoWeek, reasonText, makeEntry, monthReport, prevMonth, SOURCE_NAME, entryDetail, entryTitle } from '../kmbook.js';
  import { addEntries, updateEntry, restoreEntries, KM_WEEK, KM_MONTH } from '../kmbookdb.js';
  import KmChips from '../care/KmChips.svelte';
  import { t, tn, num, dateOf, locale } from '../i18n.svelte.js';

  let { today } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bookQ = liveQuery(() => db.kmBook.toArray());
  const weekQ = liveQuery(() => db.meta.get(KM_WEEK));
  const monthQ = liveQuery(() => db.meta.get(KM_MONTH));
  const bikes = $derived(sortBikes($bikesQ ?? []).filter((b) => b.q1 !== false));
  const entries = $derived($bookQ ?? []);
  const nameOf = (id) => ($bikesQ ?? []).find((b) => b.id === id)?.name ?? t('another bike');
  const week = $derived(isoWeek(today));
  const later = $derived($weekQ?.week === week);
  const recs = $derived(reconcile(bikes, entries));
  const off = $derived(recs.filter((r) => r.strava != null && !matches(r.diff)));
  const main = $derived(later ? null : off[0] ?? null);
  const rest = $derived(recs.filter((r) => r.strava != null && r !== main));
  const open = $derived(entries.filter((e) => e.state === 'open').sort((a, b) => b.date.localeCompare(a.date)));
  // the weekly reminder: a bike with a Strava value that is a week old, nothing else to do
  const stale = $derived(!later && !main && !open.length ? recs.find((r) => r.bike.strava?.at && Date.parse(`${today}T00:00:00Z`) - Date.parse(`${r.bike.strava.at}T00:00:00Z`) >= 7 * 864e5) ?? null : null);
  // the monthly report (first week of a month, until read)
  const month = $derived(prevMonth(today));
  const showMonth = $derived(today.slice(8) <= '07' && $monthQ?.month !== month && entries.some((e) => e.date.startsWith(month)));
  const report = $derived(showMonth ? monthReport(bikes.filter((b) => entries.some((e) => e.bikeId === b.id && e.date.startsWith(month))), entries, (b) => partAreas(ensureParts(b), isMore).main.flatMap((g) => g.parts), month) : []);
  const monthName = $derived(new Date(`${month}-15T12:00:00Z`).toLocaleDateString(locale(), { month: 'long', timeZone: 'UTC' }));
  const visible = $derived(!!main || open.length > 0 || !!stale || report.length > 0);

  /* ---------- actions, each with Undo ---------- */
  let notice = $state(null);
  let timer;
  function say(text, undo = null) {
    clearTimeout(timer);
    notice = { id: Date.now(), text, undo };
    timer = setTimeout(() => (notice = null), undo ? 9000 : 5000);
  }
  async function undo() {
    const u = $state.snapshot(notice?.undo);
    notice = null;
    if (u) await restoreEntries(db, u);
  }
  /** «Take the Strava value»: the open rides that explain the difference count now (Strava's bike holds);
   *  otherwise one entry «+N km, source Strava». */
  async function takeStrava(r) {
    if (r.explained) {
      const prev = [];
      for (const e of r.open) prev.push(await updateEntry(db, e.id, { state: 'counted', by: 'user', sure: 'user', reason: null }));
      say(tn(prev.length, '{n} ride confirmed: {bike} matches Strava now.', '{n} rides confirmed: {bike} matches Strava now.', { bike: r.bike.name }), { put: prev });
      return;
    }
    const ids = await addEntries(db, [makeEntry({ bikeId: r.bike.id, date: r.date ?? today, km: r.diff, kind: 'reading', source: 'strava', by: 'user', sure: 'user', note: t('Strava value of {date}', { date: dateOf(r.date) }) })]);
    say(t('{bike}: {km} km from Strava written to the ride ledger.', { bike: r.bike.name, km: `${r.diff > 0 ? '+' : ''}${num(r.diff)}` }), { del: ids });
  }
  let corr = $state(false);
  let cKm = $state('');
  let cWhy = $state('');
  let cErr = $state('');
  function openCorr(r) {
    corr = !corr;
    cKm = String(r.diff);
    cWhy = '';
    cErr = '';
  }
  async function saveCorr(e, r) {
    e.preventDefault();
    const raw = String(cKm).trim();
    const k = parseKm(raw.replace(/^[-−+]/, ''));
    if (k == null || Number.isNaN(k)) return (cErr = t('Type the km as a whole number, e.g. 12400.'));
    if (!cWhy.trim()) return (cErr = t('Say why: the reason stays with the correction.'));
    const km = /^[-−]/.test(raw) ? -k : k;
    const ids = await addEntries(db, [makeEntry({ bikeId: r.bike.id, date: today, km, kind: 'correction', source: 'hand', by: 'user', sure: 'user', note: cWhy.trim() })]);
    corr = false;
    say(t('Correction saved: {km} km.', { km: num(km) }), { del: ids });
  }
  const putOff = () => db.meta.put({ key: KM_WEEK, week });
  const readMonth = () => db.meta.put({ key: KM_MONTH, month });
  async function assign(e, bikeId) {
    const prev = await updateEntry(db, e.id, { bikeId, state: 'counted', by: 'user', sure: 'user', reason: null });
    say(t('{bike}: {km} km count now.', { bike: nameOf(bikeId), km: num(e.km) }), { put: [prev] });
  }
  let otherFor = $state(null);
  const offers = (e) => [...new Set([e.bikeId, e.reason?.said, e.reason?.bike, ...(e.reason?.bikes ?? [])].filter((id) => id && ($bikesQ ?? []).some((b) => b.id === id)))].slice(0, 2);
  const importHref = (id) => bikesHash({ tab: 'care', bike: id, view: 'import' });
</script>

{#if visible}
  <section class="kmc card" class:alert={!!main} aria-labelledby="kmc-h" data-section="km">
    <div class="cols">
      <div class="left">
        {#if main}
          <p class="eyebrow">{t('Weekly check')} · {main.bike.name}</p>
          <h2 id="kmc-h" class="h">{t('Compare km: Strava says {s} km, the app says {a} km', { s: num(Math.round(main.strava)), a: num(Math.round(main.app ?? 0)) })}</h2>
          <div class="nums">
            <div><span class="bignum num">{num(Math.round(main.strava))}</span><small>Strava</small></div>
            <div><span class="bignum num">{num(Math.round(main.app ?? 0))}</span><small>{t('App')}</small></div>
            <div class="d"><span class="bignum num">{num(Math.abs(Math.round(main.diff)))} km</span><small>{t('Difference')}</small></div>
          </div>
          <p class="why">
            {t('Strava value from activities.csv of {date}.', { date: dateOf(main.date) })}
            {#if main.explained}{main.open.length === 1 ? t('Probably the unclear ride of {date} ({km} km). If you confirm it, it matches.', { date: dateOf(main.open[0].date), km: num(main.open[0].km) }) : t('Probably the {n} unclear rides. If you confirm them, it matches.', { n: main.open.length })}{/if}
          </p>
          <div class="acts">
            <button type="button" class="btn hi" onclick={() => takeStrava(main)}>{t('Take the Strava value')}</button>
            <button type="button" class="btn" aria-expanded={corr} onclick={() => openCorr(main)}>{t('Correction with a reason')}</button>
            <button type="button" class="lnk" onclick={putOff}>{t('later')}</button>
          </div>
          {#if corr}
            <form class="corr" onsubmit={(e) => saveCorr(e, main)}>
              <label><span class="lbl">km</span><input class="inp num" type="text" inputmode="decimal" bind:value={cKm} /></label>
              <label class="wide"><span class="lbl">{t('Reason')}</span><input class="inp" type="text" bind:value={cWhy} placeholder={t('e.g. ride counted twice, both units ran')} /></label>
              {#if cErr}<p class="err" role="alert">{cErr}</p>{/if}
              <div class="acts"><button type="submit" class="btn ink">{t('Save')}</button></div>
            </form>
          {/if}
          <p class="foot">{main.explained ? t('Taking it over confirms the ride in the ride ledger. Nothing is overwritten, everything stays changeable.') : t('Taking it over writes an entry «{km} km, source Strava» into the ride ledger. Nothing is overwritten, everything stays changeable.', { km: `${main.diff > 0 ? '+' : ''}${num(main.diff)}` })}</p>
        {:else if stale}
          <p class="eyebrow">{t('Weekly check')}</p>
          <h2 id="kmc-h" class="h">{t('Compare km: import the rides of this week')}</h2>
          <p class="why">{t('The last Strava value is of {date}. A new activities.csv shows whether every km is counted.', { date: dateOf(stale.date) })}</p>
          <div class="acts"><a class="btn" href={importHref(stale.bike.id)}>{t('Import rides')}</a><button type="button" class="lnk" onclick={putOff}>{t('later')}</button></div>
        {:else if open.length}
          <h2 id="kmc-h" class="h">{tn(open.length, '{n} ride waits for its bike', '{n} rides wait for their bike')}</h2>
          <p class="why">{t('They count only after you confirmed them.')}</p>
        {:else}
          <h2 id="kmc-h" class="h">{t('Report {month}', { month: monthName })}</h2>
        {/if}
        {#if report.length}
          <div class="rep">
            {#if main || stale || open.length}<p class="lbl">{t('Report {month}', { month: monthName })}</p>{/if}
            <ul>
              {#each report as m (m.bike.id)}
                <li><b>{m.bike.name}</b>: {tn(m.rides, '{n} ride', '{n} rides')} · {num(Math.round(m.km))} km · {m.diff == null ? t('no Strava value') : t('{km} km difference to Strava', { km: num(Math.round(m.diff)) })} · {tn(m.missing, '{n} part without a start point', '{n} parts without a start point')}{#if m.last} · {t('last source {source}, {date}', { source: t(SOURCE_NAME[m.last.source] ?? m.last.source), date: dateOf(m.last.date) })}{/if}</li>
              {/each}
            </ul>
            <button type="button" class="lnk" onclick={readMonth}>{t('Read')}</button>
          </div>
        {/if}
      </div>

      {#if open.length || rest.length}
        <div class="right">
          {#if open.length}
            <p class="lbl">{t('Assign rides')} <span class="pill act num">{open.length}</span></p>
            <ul class="open">
              {#each open.slice(0, 3) as e (e.id)}
                <li>
                  <div class="ot"><b>{entryTitle(e)}</b> · {dateOf(e.date)}<span class="num">{num(e.km)} km</span></div>
                  {#if entryDetail(e)}<small>{entryDetail(e)}</small>{/if}
                  <span class="chips">
                    {#if e.gear}<span class="ck g">{t('Strava bike: {bike}', { bike: e.gear })}</span>{/if}
                    {#if e.reason?.said && e.reason?.by === 'profile'}<span class="ck">{t('Profile rule: {bike}', { bike: nameOf(e.reason.said) })}</span>{/if}
                    <KmChips sure="unclear" />
                  </span>
                  <small class="rs">{t('Counts only after you confirm it.')} {reasonText(e.reason, nameOf)}</small>
                  <span class="pick" role="group" aria-label={t('Which bike?')}>
                    {#each offers(e) as id (id)}<button type="button" class="btn sm" onclick={() => assign(e, id)}>{nameOf(id)}</button>{/each}
                    <button type="button" class="btn sm" aria-expanded={otherFor === e.id} onclick={() => (otherFor = otherFor === e.id ? null : e.id)}>{t('other …')}</button>
                    {#if otherFor === e.id}
                      <select class="sel mini" aria-label={t('Bike')} onchange={(ev) => ev.currentTarget.value && assign(e, ev.currentTarget.value)}>
                        <option value="">{t('Choose a bike')}</option>
                        {#each $bikesQ ?? [] as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
                      </select>
                    {/if}
                  </span>
                </li>
              {/each}
            </ul>
            {#if open.length > 3}<a class="lnk" href={bikesHash({ tab: 'care', bike: open[3].bikeId, open: !!open[3].bikeId })}>{t('{n} more in the ride ledger', { n: open.length - 3 })}</a>{/if}
          {/if}
          {#if rest.length}
            <div class="others">
              <span><b>{t('Other bikes')}</b><small>{rest.map((r) => r.bike.name).join(', ')}</small></span>
              {#if rest.every((r) => matches(r.diff))}<span class="ok">{t('match, 0 km')}</span>
              {:else}<span class="nok">{rest.filter((r) => !matches(r.diff)).map((r) => `${r.bike.name} ${r.diff > 0 ? '+' : ''}${num(Math.round(r.diff))} km`).join(' · ')}</span>{/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </section>
{/if}

{#if notice}
  {#key notice.id}<p class="notice" role="status"><span>{notice.text}</span>{#if notice.undo}<button type="button" class="undo" onclick={undo}>{t('Undo')}</button>{/if}</p>{/key}
{/if}

<style>
  .kmc {
    margin: 0 0 20px;
  }
  .kmc.alert {
    border-left: 4px solid var(--hi);
  }
  .cols {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
    gap: 16px 28px;
  }
  .cols > :only-child {
    grid-column: 1 / -1;
  }
  .eyebrow {
    margin: 0 0 4px;
    color: var(--ink-3);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .h {
    margin: 0 0 8px;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .nums {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    margin: 4px 0 8px;
  }
  .nums div {
    display: flex;
    flex-direction: column;
  }
  .nums small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .nums .d .bignum {
    color: var(--hi);
  }
  .why,
  .foot {
    margin: 0 0 10px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .foot {
    margin: 8px 0 0;
    color: var(--ink-3);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .lnk {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 6px;
    border: 0;
    background: none;
    color: var(--accent);
    font: 600 var(--fs-small) var(--font-body);
    text-decoration: underline;
    cursor: pointer;
  }
  .corr {
    display: grid;
    grid-template-columns: 120px minmax(0, 1fr);
    gap: 8px 12px;
    margin-top: 10px;
  }
  .corr .err,
  .corr .acts {
    grid-column: 1 / -1;
  }
  .err {
    margin: 0;
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .rep {
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid var(--line);
    font-size: var(--fs-small);
  }
  .rep ul {
    margin: 0;
    padding-left: 18px;
    color: var(--ink-2);
  }
  .open {
    display: grid;
    gap: 8px;
    list-style: none;
    margin: 0 0 8px;
    padding: 0;
  }
  .open li {
    display: grid;
    gap: 4px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--paper-2);
    font-size: var(--fs-small);
  }
  .ot {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .ot .num {
    margin-left: auto;
    font-weight: 600;
  }
  .open small {
    color: var(--ink-3);
  }
  .open small.rs {
    color: var(--ink);
    font-weight: 500;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 6px;
  }
  .ck {
    padding: 0 8px;
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    font: 500 var(--fs-tiny) / 1.8 var(--font-body);
  }
  .ck.g {
    background: var(--hi-soft);
    color: var(--badge-ink);
  }
  .pick {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .pick .btn {
    min-height: 44px;
  }
  .sel.mini {
    width: auto;
    min-height: 44px;
  }
  .others {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 12px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    font-size: var(--fs-small);
  }
  .others span {
    display: flex;
    flex-direction: column;
  }
  .others small {
    color: var(--ink-3);
  }
  .others .ok {
    padding: 0 10px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--ok);
    font-weight: 500;
  }
  .others .nok {
    color: var(--warn);
  }
  .notice {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(16px + env(safe-area-inset-bottom));
    z-index: 30;
    display: flex;
    align-items: center;
    gap: 12px;
    width: max-content;
    max-width: min(560px, calc(100vw - 32px));
    margin: 0;
    padding: 10px 14px;
    border-radius: var(--radius);
    background: var(--ink);
    color: var(--paper);
    font-size: var(--fs-small);
    box-shadow: 0 4px 16px var(--shadow);
  }
  .undo {
    min-height: 40px;
    padding: 0 10px;
    border: 1px solid var(--paper);
    border-radius: 6px;
    background: none;
    color: var(--paper);
    font: 600 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  @media (max-width: 760px) {
    .cols {
      grid-template-columns: minmax(0, 1fr);
    }
    .notice {
      bottom: calc(84px + env(safe-area-inset-bottom));
    }
  }
</style>
