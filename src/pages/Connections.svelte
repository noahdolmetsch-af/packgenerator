<script>
  /**
   * Package G «Daten kommen von selbst», #155 «Seite Verbindungen unter Ich» (#/me/connections): every
   * connection of the app in one place, with its state and when data last came in. Here are also the
   * switches of package G: Strava ticks Aktiv (#156, «erst vorschlagen» possible), which Strava sport
   * goes to which activity (#191), indoor rides for a bike (#202), the own Google calendar «Packgenerator»
   * with the reminder to pack (#85, #163), notes in Google Tasks (#1003), .ics in and out (#84), the old
   * Fitbit data from the export file (#157, #158) and the lake temperature (#9).
   * Everything is a suggestion: each part can be switched off, nothing is a must.
   */
  import { liveQuery } from 'dexie';
  import { Activity, HeartPulse, CalendarDays, Mail, Waves, ChevronRight, RefreshCw, Download, Upload, ListChecks, Bike } from '@lucide/svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import TickSuggest from '../lib/strava/TickSuggest.svelte';
  import LakeCard from '../lib/lake/LakeCard.svelte';
  import FitbitImport from '../lib/fitbit/FitbitImport.svelte';
  import { db } from '../lib/db.js';
  import { strava, STRAVA_HASH, PREFS_KEY as STRAVA_KEY, prefsOf as stravaPrefsOf, savePrefs as saveStrava, readKey } from '../lib/strava/client.svelte.js';
  import { health, FITBIT_HASH } from '../lib/health/client.svelte.js';
  import { agenda, AGENDA_HASH, saveEvent } from '../lib/agenda/client.svelte.js';
  import { TICKS_KEY, prefsOf as ticksOf, savePrefs as saveTicks, seenSports, setSport, applyTicks } from '../lib/stravaticks.js';
  import { OWN_KEY, prefsOf as ownOf, savePrefs as saveOwn, syncCal, syncNotes, connectOwn, tripItems } from '../lib/googleown.js';
  import { tripsIcs, parseIcs } from '../lib/icsio.js';
  import { LAKE_CACHE_KEY } from '../lib/lake.js';
  import { actName } from '../lib/flow/ui.svelte.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import '../lib/ich/ich.css';

  const today = localDay();
  const q = liveQuery(async () => {
    const [ticks, own, stravaRec, acts, activities, bikes, lake] = await Promise.all([
      db.settings.get(TICKS_KEY),
      db.settings.get(OWN_KEY),
      db.settings.get(STRAVA_KEY),
      db.flowActs.toArray(),
      db.activities.toArray(),
      db.bikes.toArray(),
      db.meta.get(LAKE_CACHE_KEY),
    ]);
    return { ticks: ticksOf(ticks?.value), own: ownOf(own?.value), sp: stravaPrefsOf(stravaRec?.value), acts: acts.filter((a) => !a.paused).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), activities, bikes: bikes.filter((b) => !b.retired && !b.archived), lake: lake?.value ?? null };
  });
  const d = $derived($q);
  const sports = $derived(d ? seenSports(d.activities, d.acts, d.ticks.map) : []);
  const hasKey = readKey();

  const when = (iso) => (iso ? new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
  const lakeAt = $derived(d?.lake?.data?.now?.at ?? d?.lake?.fetchedAt ?? null);
  const rows = $derived([
    { key: 'strava', Icon: Activity, name: 'Strava', on: !!hasKey && !!strava.prefs.lastSync, line: strava.prefs.lastSync ? t('last fetch {when}', { when: when(strava.prefs.lastSync) }) : t('Rides and activities, ticks Aktiv'), href: STRAVA_HASH },
    { key: 'fitbit', Icon: HeartPulse, name: t('Fitbit via Google'), on: !!health.prefs.connected, line: health.prefs.connected ? (health.last?.date ? t('values up to {day}', { day: health.last.date }) : t('connected')) : t('Sleep, steps, heart rate as observation'), href: FITBIT_HASH },
    { key: 'agenda', Icon: CalendarDays, name: t('Google Calendar and Tasks'), on: agenda.prefs.calendar || agenda.prefs.tasks, line: agenda.prefs.lastSync ? t('last fetch {when}', { when: when(agenda.prefs.lastSync) }) : t('Appointments and tasks, the calendar «Packgenerator»'), href: AGENDA_HASH },
    { key: 'mail', Icon: Mail, name: t('Mail'), on: null, line: t('Your Gmail: read, search, answer, write'), href: '#/me/mail' },
    { key: 'lake', Icon: Waves, name: t('Lake temperature'), on: !!lakeAt, line: lakeAt ? t('last value {when} · City of Zurich and Eawag, no login', { when: when(lakeAt) }) : t('City of Zurich and Eawag, no login'), href: '#/flow' },
  ]);

  const MODES = $derived([
    { key: 'auto', name: t('Tick by itself') },
    { key: 'suggest', name: t('Suggest first') },
    { key: 'off', name: t('Off|switch') },
  ]);
  let msg = $state('');
  let busy = $state('');
  async function run(key, f) {
    busy = key;
    msg = '';
    try {
      msg = (await f()) ?? '';
    } catch (err) {
      msg = errorText(err?.code);
    } finally {
      busy = '';
    }
  }
  const errorText = (code) =>
    ({
      calendar_not_allowed: t('Google does not allow the calendar yet: tap «Allow in Google» once.'),
      tasks_not_allowed: t('Google does not allow Google Tasks yet: connect it under Appointments and tasks.'),
      not_connected: t('Google is not connected yet: connect it under Appointments and tasks.'),
      google_login_needed: t('Google needs a new login: Appointments and tasks › Connect.'),
      unauthorized: t('This device has no key yet: connect Strava on this device first.'),
      network: t('No connection. Try again later.'),
    })[code] ?? t('Google answered with an error. Try again later.');

  async function setMode(mode) {
    await saveTicks({ mode });
    if (mode !== 'off') await applyTicks();
  }
  const setIndoor = (v) => saveStrava(db, { indoorBike: v || null });

  async function calOn(on) {
    await saveOwn({ cal: on });
    if (on && d?.own.owncal) await run('cal', async () => (await syncCal({ force: true }), t('The tours are in your calendar «Packgenerator».')));
  }
  async function notesOn(on) {
    await saveOwn({ notes: on });
    if (on) await run('notes', async () => {
      const r = await syncNotes();
      return r ? t('Notes and Google Tasks are the same now: {n} new in Google, {m} new in the app.', { n: r.created, m: r.added }) : '';
    });
  }

  function saveFile(text, name) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function icsOut() {
    const trips = await db.trips.toArray();
    const keep = new Set(tripItems(trips, today).map((i) => i.key));
    const list = trips.filter((tr) => keep.has(`trip:${String(tr.id).replace(/[^\w:.-]/g, '-').slice(0, 100)}`));
    saveFile(tripsIcs(list, { title: (n) => t('Tour: {name}', { name: n || t('Tour') }), note: t('From the Pack Generator. Two days before, it reminds you to pack.') }), `touren-${today}.ics`);
    msg = tn(list.length, '{n} tour saved as a calendar file.', '{n} tours saved as a calendar file.');
  }

  let found = $state(null);
  async function icsIn(e) {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    found = parseIcs(await file.text()).filter((x) => x.lastDay >= today);
    msg = found.length ? '' : t('No coming appointment in this file.');
  }
  async function icsTake() {
    const cal = d?.own.calId ?? 'primary';
    await run('ics', async () => {
      let n = 0;
      for (const ev of found) if (await saveEvent({ cal, title: ev.title, day: ev.day, lastDay: ev.lastDay, allDay: ev.allDay, from: ev.from ?? undefined, to: ev.to ?? undefined, where: ev.where, note: ev.note })) n++;
      found = null;
      return tn(n, '{n} appointment is in your Google calendar now.', '{n} appointments are in your Google calendar now.');
    });
  }
</script>

<div class="conn">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} here={t('Connections')} title={t('Connections')} sub={t('Where data comes into the app by itself, and what the app may do with it. Each one can be switched off.')} />
  <div class="ich-cols">
    <div class="ich-main">
      <section class="ich-sec" aria-labelledby="cn-all-h">
        <div class="ich-h"><div><h2 id="cn-all-h">{t('All connections')}</h2><p class="ich-hs">{t('state and last data')}</p></div></div>
        <ul class="card ich-list">
          {#each rows as r (r.key)}
            <li>
              <a class="ich-row" href={r.href} data-conn={r.key}>
                <span class="ich-ib"><r.Icon size={18} aria-hidden="true" /></span>
                <span class="ich-m"><b>{r.name}</b><small>{r.line}</small></span>
                {#if r.on === true}<span class="pill ok">{t('on|conn')}</span>{:else if r.on === false}<span class="pill">{t('off|conn')}</span>{/if}
                <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
              </a>
            </li>
          {/each}
        </ul>
      </section>

      {#if d}
        <section class="ich-sec" aria-labelledby="cn-tick-h" data-section="strava-ticks">
          <div class="ich-h"><div><h2 id="cn-tick-h">{t('Strava ticks Aktiv')}</h2><p class="ich-hs">{t('a hike, a run or a ski tour ticks the matching activity')}</p></div></div>
          <div class="card ich-body">
            <Seg options={MODES} value={d.ticks.mode} onchange={setMode} label={t('Strava ticks Aktiv')} chips />
            <p class="ich-help">{d.ticks.mode === 'auto' ? t('Every new Strava activity ticks its activity by itself. A tick you delete does not come back.') : d.ticks.mode === 'suggest' ? t('New Strava activities wait on Aktiv for «Count» or «Do not count».') : t('Strava ticks nothing. Rides still count for your bikes.')}</p>
            <TickSuggest link={false} />
          </div>
          {#if sports.length && d.ticks.mode !== 'off'}
            <details class="card ich-body fold" data-section="strava-map">
              <summary>{t('Which Strava sport counts for which activity')}</summary>
              <p class="ich-help">{t('A suggestion from the names. Change it here; «none» counts nothing.')}</p>
              <ul class="map">
                {#each sports as s (s.key)}
                  <li>
                    <label for={`sp-${s.key}`}><b>{t(s.label)}</b><small>{tn(s.count, '{n} activity', '{n} activities')}</small></label>
                    <select id={`sp-${s.key}`} value={s.actId ?? ''} onchange={(e) => setSport(s.key, e.currentTarget.value)}>
                      <option value="">{t('none|act')}</option>
                      {#each d.acts as a (a.id)}<option value={a.id}>{actName(a)}</option>{/each}
                    </select>
                  </li>
                {/each}
              </ul>
            </details>
          {/if}
        </section>

        <section class="ich-sec" aria-labelledby="cn-indoor-h" data-section="indoor-bike">
          <div class="ich-h"><div><h2 id="cn-indoor-h">{t('Indoor rides')}</h2><p class="ich-hs">{t('rides on the trainer without a bike in Strava')}</p></div></div>
          <div class="card ich-body">
            <label class="row"><Bike size={18} aria-hidden="true" /><span>{t('count for')}</span>
              <select value={d.sp.indoorBike ?? ''} onchange={(e) => setIndoor(e.currentTarget.value)} data-indoor>
                <option value="">{t('no bike (do not count)')}</option>
                {#each d.bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
              </select>
            </label>
            <p class="ich-help">{t('Then the km on the trainer count for care and goals of that bike, from the next Strava fetch on.')}</p>
          </div>
        </section>

        <section class="ich-sec" aria-labelledby="cn-cal-h" data-section="own-cal">
          <div class="ich-h"><div><h2 id="cn-cal-h">{t('Calendar «Packgenerator»')}</h2><p class="ich-hs">{t('your tours in your own Google calendar')}</p></div></div>
          <div class="card ich-list">
            <label class="ich-row"><input type="checkbox" role="switch" checked={d.own.cal} onchange={(e) => calOn(e.currentTarget.checked)} /><span class="ich-ib"><CalendarDays size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Enter tours in the calendar «Packgenerator»')}</b><small>{d.own.calAt ? t('last time {when}', { when: when(d.own.calAt) }) : t('The app makes the calendar once; it shows on your phone too.')}</small></span></label>
            <label class="ich-row"><input type="checkbox" role="switch" checked={d.own.remind} onchange={(e) => saveOwn({ remind: e.currentTarget.checked, lastCal: null })} /><span class="ich-ib"><ListChecks size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Reminder to pack')}</b><small>{t('two days before the tour, at 18:00')}</small></span></label>
          </div>
          {#if d.own.cal}
            <div class="card ich-body">
              {#if !d.own.owncal}
                <p class="ich-help">{t('Google has to allow the app once to make its own calendar. It sees and changes only that calendar.')}</p>
                {#if hasKey}<button type="button" class="btn hi" onclick={() => run('allow', () => connectOwn())}>{t('Allow in Google')}</button>{:else}<a class="btn hi" href={STRAVA_HASH}>{t('Connect Strava first')}</a>{/if}
              {:else}
                <button type="button" class="btn" disabled={busy === 'cal'} onclick={() => run('cal', async () => (await syncCal({ force: true }), t('The tours are in your calendar «Packgenerator».')))}><RefreshCw size={16} aria-hidden="true" />{t('Enter now')}</button>
              {/if}
            </div>
          {/if}
        </section>

        <section class="ich-sec" aria-labelledby="cn-notes-h" data-section="notes-tasks">
          <div class="ich-h"><div><h2 id="cn-notes-h">{t('Notes in Google Tasks')}</h2><p class="ich-hs">{t('the list «Packgenerator Notizen», both ways')}</p></div></div>
          <div class="card ich-list">
            <label class="ich-row"><input type="checkbox" role="switch" checked={d.own.notes} onchange={(e) => notesOn(e.currentTarget.checked)} /><span class="ich-ib"><ListChecks size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Open notes as tasks')}</b><small>{d.own.notesAt ? t('last time {when}', { when: when(d.own.notesAt) }) : t('Ticked in Google = done in the app, and the other way round.')}</small></span></label>
          </div>
          {#if d.own.notes}<div class="card ich-body"><button type="button" class="btn" disabled={busy === 'notes'} onclick={() => notesOn(true)}><RefreshCw size={16} aria-hidden="true" />{t('Compare now')}</button></div>{/if}
        </section>

        <section class="ich-sec" aria-labelledby="cn-ics-h" data-section="ics">
          <div class="ich-h"><div><h2 id="cn-ics-h">{t('Calendar file (.ics)')}</h2><p class="ich-hs">{t('for any calendar, also without Google')}</p></div></div>
          <div class="card ich-body">
            <div class="btns">
              <button type="button" class="btn" onclick={icsOut}><Download size={16} aria-hidden="true" />{t('Save tours as .ics')}</button>
              <label class="btn"><Upload size={16} aria-hidden="true" />{t('Read appointments from .ics')}<input class="cn-file" type="file" accept=".ics,text/calendar" onchange={icsIn} /></label>
            </div>
            {#if found?.length}
              <p class="ich-help">{tn(found.length, '{n} coming appointment in the file:', '{n} coming appointments in the file:')} {found.slice(0, 5).map((x) => x.title).join(', ')}{found.length > 5 ? ' …' : ''}</p>
              {#if agenda.prefs.calendar}
                <div class="btns"><button type="button" class="btn hi" disabled={busy === 'ics'} onclick={icsTake}>{d.own.calId ? t('Into the calendar «Packgenerator»') : t('Into your Google calendar')}</button><button type="button" class="btn" onclick={() => (found = null)}>{t('Cancel')}</button></div>
              {:else}
                <p class="ich-help">{t('To take them over, connect Google Calendar first:')} <a href={AGENDA_HASH}>{t('Appointments and tasks')}</a></p>
              {/if}
            {/if}
          </div>
        </section>
      {/if}
      {#if msg}<p class="msg" role="status">{msg}</p>{/if}
    </div>

    <div class="ich-side">
      <section class="ich-sec" id="lake" aria-label={t('Lake temperature')}>
        <LakeCard headingLevel={2} />
      </section>
      <section class="ich-sec" data-section="fitbit-file">
        <FitbitImport />
      </section>
    </div>
  </div>
</div>

<style>
  .conn {
    display: grid;
    gap: var(--s3, 12px);
  }
  .fold summary {
    cursor: pointer;
    font-weight: 600;
    min-height: 44px;
    display: flex;
    align-items: center;
  }
  .map {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .map li,
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .map label {
    flex: 1;
    min-width: 140px;
    display: grid;
  }
  .map small {
    color: var(--ink-2);
  }
  select {
    min-height: 44px;
    max-width: 100%;
  }
  .btns {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .btns .btn {
    min-height: 44px;
  }
  .cn-file {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .msg {
    margin: 0;
    color: var(--ink-2);
  }
</style>
