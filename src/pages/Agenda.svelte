<script>
  /**
   * Google Kalender und Aufgaben (package GA «Google Teil 2», Noah 15.10.2026 12:16 «3 beides», 12:17
   * «vorerst ohne mockup», 21:11 «3b»: the calendar comes with «Woche planen»): Ich › Termine und
   * Aufgaben (#/me/agenda). The next 14 days from the Google calendars Noah chooses, a new appointment,
   * and Google Tasks: see, tick, add, change, delete. The same Google login as Fitbit and Drive.
   * A copy stays on this device (db.gEvents, db.gTasks); «Woche planen» reads it (src/lib/agenda.js).
   */
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import { askDelete } from '../lib/ui/ask.js';
  import DateInput from '../lib/ui/DateInput.svelte';
  import { agenda, connect, fetchNow, checkAllowed, saveTask, deleteTask, saveEvent, deleteEvent, chooseCals, hide } from '../lib/agenda/client.svelte.js';
  import WeekGrid from '../lib/agenda/WeekGrid.svelte';
  import MoveSheet from '../lib/ui/MoveSheet.svelte';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import { shiftClock, daysBetween, addDaysTo, minutesOfClock, clockOf } from '../lib/ui/timedrag.js';
  import { mondayOf, isoWeek } from '../lib/training.js';
  import { byDay, taskGroups, timeOf, addDays, clockIn, ZONES, UNITS, remindRow, remindMinutes, SHOW_DAYS, EVENT_COLORS, COLOR_NAMES, REPEATS, emptyRepeat, repeatRule } from '../lib/agenda.js';
  import { readKey, STRAVA_HASH } from '../lib/strava/client.svelte.js';
  import { localDay } from '../lib/localday.js';
  import { mail, loadPrefs as loadMailPrefs } from '../lib/mail/client.svelte.js';
  import { eventQuery, MAIL_HASH } from '../lib/mail.js';
  import { CalendarDays, ListChecks, Link, Lock, RefreshCw, Plus, Check, Circle, CircleCheck, Pencil, Trash2, ExternalLink, MapPin, Clock, EyeOff, Mail, Copy, CopyPlus, Move, X, ChevronLeft, ChevronRight } from '@lucide/svelte';
  import '../lib/ich/ich.css';
  import ConnStatus from '../lib/ui/ConnStatus.svelte';
  import { lastOkFetchLine } from '../lib/ui/connstatus.js';
  import { t, tn, locale } from '../lib/i18n.svelte.js';

  const hasKey = readKey();
  loadMailPrefs();
  const today = localDay();
  const p = $derived(agenda.prefs);
  const on = $derived(p.calendar || p.tasks);

  let want = $state({ calendar: true, tasks: true });
  const services = $derived(Object.keys(want).filter((k) => want[k]));

  // the next 14 days; today always shows, other empty days stay out
  const days = $derived(byDay(agenda.events, today, addDays(today, SHOW_DAYS - 1)).filter((d) => d.events.length || d.day === today));
  let openEv = $state(null);

  // «List» or «Week» (Noah 28.10.2026): remembered on this device only
  const VIEW_KEY = 'pg.agenda.view';
  let view = $state((() => { try { return localStorage.getItem(VIEW_KEY) === 'week' ? 'week' : 'list'; } catch { return 'list'; } })());
  const setView = (v) => {
    view = v;
    try { localStorage.setItem(VIEW_KEY, v); } catch { /* the view just is not remembered */ }
  };
  let narrow = $state(false);
  $effect(() => {
    const mq = matchMedia('(max-width: 700px)');
    const set = () => (narrow = mq.matches);
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  });
  // a week of 7 days on a wide screen, 3 days on a phone; «anchor» is the first day shown
  let anchor = $state(today);
  const count = $derived(narrow ? 3 : 7);
  const first = $derived(narrow ? anchor : mondayOf(anchor));
  const weekDays = $derived(Array.from({ length: count }, (_, i) => addDays(first, i)));
  const step = (n) => (anchor = addDays(first, n * count));
  const colors = $derived(Object.fromEntries(p.calendars.map((c) => [c.id, c.color]).filter(([, c]) => c)));
  const range = $derived(`${new Date(`${weekDays[0]}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'short' })} – ${new Date(`${weekDays.at(-1)}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' })}`);
  let pickedEv = $state(null);
  const picked = $derived(pickedEv ? agenda.events.find((x) => x.id === pickedEv) ?? null : null);
  function newAt(day, time) {
    newEvent();
    const [h, m] = time.split(':').map(Number);
    ev.day = day;
    ev.from = time;
    ev.to = `${String(Math.min(23, h + 1)).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  let list = $state('');
  const groups = $derived(taskGroups(agenda.tasks.filter((x) => !x.parent || agenda.tasks.every((y) => y.id !== x.parent)), today, { list: list || null }));
  const subs = $derived(agenda.tasks.reduce((m, x) => (x.parent ? ((m[x.parent] ??= []).push(x), m) : m), {}));
  const lists = $derived(p.lists);
  const GROUP_NAMES = { late: 'Overdue', today: 'Today', soon: 'Next 7 days', later: 'Later', open: 'Without date', done: 'Done (last 30 days)' };

  let newTask = $state('');
  let newDue = $state('');
  let editTask = $state(null);
  let ev = $state(null); // the form for a new or changed appointment
  let msg = $state('');
  // Noah 1.11.2026: after «Fetch now» a clear line says whether it worked
  async function fetchButton() {
    msg = '';
    const ok = await fetchNow();
    if (ok) msg = t('Done: appointments and tasks are up to date from Google.');
  }

  const writable = $derived(p.calendars.filter((c) => c.write));
  const calName = (id) => p.calendars.find((c) => c.id === id)?.name ?? '';

  // The first fetch once per visit: when it fails, «Fetch now» tries again (no loop against the server).
  let firstTried = false;
  $effect(() => {
    if (firstTried || !hasKey || !agenda.loaded || agenda.busy || p.lastSync || !on) return;
    firstTried = true;
    fetchNow();
  });
  $effect(() => {
    if (hasKey && agenda.loaded && !on && !agenda.justConnected) checkAllowed();
  });

  function dayName(day) {
    if (day === today) return t('Today');
    if (day === addDays(today, 1)) return t('Tomorrow');
    return new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  }
  const short = (day) => (day === today ? t('today') : day === addDays(today, 1) ? t('tomorrow') : new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }));
  const ago = (iso) => {
    const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
    return m < 1 ? t('just now') : m < 60 ? tn(m, '{n} minute ago', '{n} minutes ago') : new Date(iso).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  };
  const span = (e) => (e.allDay ? (e.lastDay > e.day ? t('until {day}', { day: short(e.lastDay) }) : t('all day')) : `${timeOf(e)}–${timeOf({ start: e.end })}`);

  async function addTask(e) {
    e.preventDefault();
    if (!newTask.trim()) return;
    const res = await saveTask({ list: list || lists[0]?.id || '@default', title: newTask.trim(), ...(newDue ? { due: newDue } : {}) });
    if (res) {
      msg = t('«{name}» is in Google Tasks.', { name: newTask.trim() });
      newTask = '';
      newDue = '';
    }
  }
  const tick = (x) => saveTask({ list: x.list, id: x.id, done: !x.done });
  async function keepTask(e) {
    e.preventDefault();
    const x = editTask;
    if (!x.title.trim()) return;
    if (await saveTask({ list: x.list, id: x.id, title: x.title.trim(), notes: x.notes, due: x.due || null })) editTask = null;
  }
  async function dropTask(x) {
    if ((await askDelete({ title: t('Delete «{name}» in Google Tasks too?', { name: x.title }) })) !== 'delete') return;
    if (await deleteTask(x)) editTask = null;
  }

  const ZONE_NAMES = { 'Europe/Zurich': 'Zurich', 'Europe/London': 'London', 'Europe/Lisbon': 'Lisbon', 'Europe/Athens': 'Athens', 'Europe/Istanbul': 'Istanbul', 'America/New_York': 'New York', 'America/Los_Angeles': 'Los Angeles', 'Asia/Tokyo': 'Tokyo', 'Australia/Sydney': 'Sydney', UTC: 'UTC' };
  const zoneName = (z) => (ZONE_NAMES[z] ? t(ZONE_NAMES[z]) : z);
  const zones = $derived(ev && !ZONES.includes(ev.tz) ? [ev.tz, ...ZONES] : ZONES);
  const REPEAT_NAMES = { none: 'Does not repeat', daily: 'Every day', weekdays: 'Every weekday (Mon–Fri)', weekly: 'Every week', monthly: 'Every month', yearly: 'Every year', custom: 'Custom…' };
  const FREQ_NAMES = { daily: 'days|repeat', weekly: 'weeks|repeat', monthly: 'months|repeat', yearly: 'years|repeat' };
  const WEEKDAY_CODES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
  const WEEKDAY_NAMES = ['Mon|weekday', 'Tue|weekday', 'Wed|weekday', 'Thu|weekday', 'Fri|weekday', 'Sat|weekday', 'Sun|weekday'];
  const UNIT_NAMES = { minutes: 'minutes|unit', hours: 'hours|unit', days: 'days|unit', weeks: 'weeks|unit' };

  function newEvent() {
    openEv = null;
    ev = { cal: writable.find((c) => c.primary)?.id ?? writable[0]?.id ?? 'primary', title: '', day: today, lastDay: '', allDay: false, from: '09:00', to: '10:00', where: '', note: '', noteWas: '', remind: null, busy: true, visibility: 'default', tz: ZONES[0], repeat: false, rep: emptyRepeat(), color: '', copy: false };
  }
  // The form for an event of Google; the times are shown on the clock of the event's own time zone.
  function formOf(e) {
    const tz = e.tz || ZONES[0];
    const from = e.allDay ? null : clockIn(e.start, tz);
    const to = e.allDay ? null : clockIn(e.end, tz);
    return { cal: e.cal, gid: e.gid, title: e.title, day: from?.day ?? e.day, lastDay: e.lastDay > e.day ? e.lastDay : '', allDay: e.allDay, from: from?.time ?? '09:00', to: to?.time ?? '10:00', where: e.where, note: e.note ?? '', noteWas: e.note ?? '', remind: e.remind ? e.remind.map(remindRow) : null, busy: e.busy !== false, visibility: e.visibility ?? 'default', tz, repeat: !!e.repeat, rep: emptyRepeat(), color: e.color ?? '', copy: false };
  }
  const changeEvent = (e) => (ev = formOf(e));
  // «Duplicate» and «Copy to another calendar» open the form filled in; nothing goes to Google until «Enter in Google».
  function copyEvent(e, other = false) {
    const home = writable.some((c) => c.id === e.cal) ? e.cal : (writable.find((c) => c.primary) ?? writable[0])?.id ?? 'primary';
    const cal = other ? writable.find((c) => c.id !== e.cal)?.id ?? home : home;
    ev = { ...formOf(e), gid: undefined, cal, repeat: false, rep: emptyRepeat(), copy: true };
    openEv = null;
  }
  const canCopyTo = (e) => writable.some((c) => c.id !== e.cal);
  const addRemind = () => (ev.remind = [...ev.remind, { n: 30, unit: 'minutes', method: 'popup' }]);
  const dropRemind = (i) => (ev.remind = ev.remind.filter((_, j) => j !== i));
  // the form → what the server takes (the description is sent only when it was changed: Google keeps its formatting otherwise)
  function payload(f) {
    const { noteWas, copy, repeat, rep, remind, ...v } = f;
    if (v.gid && v.note === noteWas) delete v.note;
    return { ...v, title: f.title.trim(), lastDay: f.allDay && f.lastDay ? f.lastDay : undefined, remind: remind === null ? null : remind.slice(0, 5).map(remindMinutes), tz: f.allDay ? undefined : f.tz, color: f.color || (f.gid ? '' : undefined), repeat: repeat ? undefined : repeatRule(rep) ?? undefined };
  }
  async function keepEvent(e) {
    e.preventDefault();
    if (!ev.title.trim() || !ev.day) return;
    const res = await saveEvent(payload(ev));
    if (res) {
      msg = ev.gid ? t('Changed in your Google calendar.') : t('«{name}» is in your Google calendar.', { name: ev.title.trim() });
      ev = null;
    }
  }

  // «Termine ziehen» (Noah 24.11.2026 «1a 3a 4a»): moving an appointment is a change in Google too (same step as the form),
  // with Undo that writes it back. Calendars you may not write to, the app's own calendar and appointments over several days stay put, with the reason.
  const OWN_CAL = 'Packgenerator'; // the calendar the app makes itself (api/_lib/googleplan.js OWN_CAL_NAME): its entries are written from the app on every sync
  const canWrite = (e) => writable.some((c) => c.id === e.cal) || e.cal === 'primary';
  function lockOf(e) {
    if (!canWrite(e)) return t('This calendar is read-only, so the appointment cannot be moved here.');
    if (calName(e.cal) === OWN_CAL) return t('This appointment comes from the app. Move it where you planned it.');
    if (!e.allDay && e.lastDay > e.day) return t('This appointment lasts several days. Change it with «Change».');
    return '';
  }
  let moving = $state(null); // { e } while the «Move …» window is open
  async function applyMove(e, before, after) {
    msg = t('Saving in your Google calendar …');
    const res = await saveEvent(payload(after));
    msg = '';
    if (!res) return false;
    const when = after.allDay ? short(after.day) : `${short(after.day)}, ${after.from}`;
    offerDone(t('«{name}» moved to {when}. Also changed in your Google calendar.', { name: e.title, when }), async () => {
      if (await saveEvent(payload(before))) offerDone(t('«{name}» is back.', { name: e.title }));
    });
    return true;
  }
  // dragged in the week grid: { mode, day, fromDay, start, end, fromStart, fromEnd } in minutes of Zurich
  function dragged(e, m) {
    const f = formOf(e);
    const dDays = daysBetween(m.fromDay, m.day);
    const a = m.mode === 'size' ? { day: f.day, time: f.from } : shiftClock({ day: f.day, time: f.from }, dDays, m.start - m.fromStart);
    let to = shiftClock({ day: a.day, time: f.to }, 0, m.mode === 'size' ? m.end - m.fromEnd : m.start - m.fromStart);
    if (to.day !== a.day || minutesOfClock(to.time) <= minutesOfClock(a.time)) to = { day: a.day, time: m.mode === 'size' ? clockOf(Math.min(1439, minutesOfClock(a.time) + 15)) : '23:59' };
    return applyMove(e, f, { ...f, day: a.day, from: a.time, to: to.time });
  }
  // «Move …» in the details: day and time, the length stays
  function movedBy(e, day, time) {
    const f = formOf(e);
    if (e.allDay) return applyMove(e, f, { ...f, day, lastDay: f.lastDay ? addDaysTo(f.lastDay, daysBetween(f.day, day)) : '' });
    const len = minutesOfClock(f.to) - minutesOfClock(f.from);
    const end = shiftClock({ day, time }, 0, len > 0 ? len : 60);
    return applyMove(e, f, { ...f, day, from: time, to: end.day === day ? end.time : '23:59' });
  }
  async function dropEvent(e) {
    if ((await askDelete({ title: t('Delete «{name}» in your Google calendar too?', { name: e.title }) })) !== 'delete') return;
    const before = formOf(e);
    if (await deleteEvent(e)) {
      openEv = pickedEv = null;
      // Undo makes it again in Google (a new entry with the same words; an appointment that repeated comes back as a single one)
      offerDone(t('«{name}» deleted in your Google calendar.', { name: e.title }), async () => {
        if (await saveEvent(payload({ ...before, gid: undefined, repeat: false, rep: emptyRepeat() }))) offerDone(t('«{name}» is back.', { name: e.title }));
      });
    }
  }

  function toggleCal(id, yes) {
    const now = p.cals.length ? p.cals : [p.calendars.find((c) => c.primary)?.id].filter(Boolean);
    const next = yes ? [...new Set([...now, id])] : now.filter((x) => x !== id);
    if (next.length) chooseCals(next);
  }
  const shown = (id) => (p.cals.length ? p.cals.includes(id) : !!p.calendars.find((c) => c.id === id)?.primary);

  const errorText = (code) =>
    ({
      denied: t('The Google login was cancelled. Nothing changed.'),
      expired: t('The login took too long. Try again.'),
      scope: t('Google gave no access. Try again and tick calendar and tasks.'),
      unauthorized: t('This device has no key yet: connect Strava on this device first.'),
      not_set_up: t('Google is not set up on the server yet.'),
      network: t('No connection. What is on this device stays; try again later.'),
      timeout: t('Google did not answer in time. What is on this device stays; try again.'),
      google_login_needed: t('Google needs a new login.'),
      calendar_not_allowed: t('The calendar is not allowed yet: connect it again.'),
      tasks_not_allowed: t('Google Tasks is not allowed yet: connect it again.'),
      google_missing: t('It is no longer in Google.'),
    })[code] ?? t('Google answered with an error. Try again later.');
</script>

{#snippet detail(e)}
  <div class="more">
    <p class="ich-help"><Clock size={14} aria-hidden="true" /> {span(e)}{#if e.where}{' · '}<MapPin size={14} aria-hidden="true" /> {e.where}{/if}</p>
    {#if e.note}<p class="note-t">{e.note}</p>{/if}
    {#if lockOf(e)}<p class="ich-help" data-ev-lock><Lock size={14} aria-hidden="true" /> {lockOf(e)}</p>{/if}
    <div class="btns">
      {#if e.link}<a class="btn sm" href={e.link} target="_blank" rel="noopener"><ExternalLink size={16} aria-hidden="true" />{t('Open in Google')}</a>{/if}
      {#if mail.prefs.allowed && eventQuery(e)}<a class="btn sm" href={`${MAIL_HASH}?${new URLSearchParams({ q: eventQuery(e), for: e.title })}`}><Mail size={16} aria-hidden="true" />{t('Mails to it')}</a>{/if}
      {#if writable.length}
        <button type="button" class="btn sm" data-ev-dup onclick={() => copyEvent(e)}><Copy size={16} aria-hidden="true" />{t('Duplicate')}</button>
        {#if canCopyTo(e)}<button type="button" class="btn sm" onclick={() => copyEvent(e, true)}><CopyPlus size={16} aria-hidden="true" />{t('Copy to another calendar')}</button>{/if}
      {/if}
      {#if writable.some((c) => c.id === e.cal) || e.cal === 'primary'}
        <button type="button" class="btn sm" onclick={() => changeEvent(e)}><Pencil size={16} aria-hidden="true" />{t('Change')}</button>
        {#if !lockOf(e)}<button type="button" class="btn sm" data-ev-move onclick={() => (moving = { e })}><Move size={16} aria-hidden="true" />{t('Move …')}</button>{/if}
        <button type="button" class="btn sm danger" onclick={() => dropEvent(e)}><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>
      {/if}
    </div>
  </div>
{/snippet}

<div class="agendapage">
  <VeloHead crumbs={[{ label: t('Plan|place'), href: '#/week' }]} here={t('Appointments and tasks')} title={t('Appointments and tasks')} sub={t('Your Google calendar and Google Tasks in the app: see, tick, add. Also for «Plan the week». Voluntary, you can switch it off at any time.')} />

  {#if agenda.error}<p class="err" role="status">{errorText(agenda.error)}{#if p.calendar || p.tasks}{' '}{lastOkFetchLine(t, { lastOkAt: p.lastSync, when: ago })}{/if}</p>{/if}
  {#if msg}<p class="msg" role="status">{msg}</p>{/if}

  <div class="ich-cols" class:wide={view === 'week' && p.calendar}>
    <div class="ich-main">
      {#if !on}
        <section class="ich-sec" aria-labelledby="con-h">
          <div class="ich-h"><div><h2 id="con-h">{t('Connect with Google')}</h2><p class="ich-hs">{t('the same login as Fitbit and Drive')}</p></div></div>
          <div class="card ich-body">
            {#if hasKey}
              <ul class="ich-list pick">
                <li><label class="ich-row"><input type="checkbox" bind:checked={want.calendar} /><span class="ich-ib"><CalendarDays size={20} aria-hidden="true" /></span><span class="ich-m"><b>{t('Google Calendar')}</b><small>{t('see your appointments, enter new ones')}</small></span></label></li>
                <li><label class="ich-row"><input type="checkbox" bind:checked={want.tasks} /><span class="ich-ib"><ListChecks size={20} aria-hidden="true" /></span><span class="ich-m"><b>{t('Google Tasks')}</b><small>{t('see, tick, add and change tasks')}</small></span></label></li>
              </ul>
              <button type="button" class="btn hi big wide" disabled={!services.length} onclick={() => connect(services)}><Link size={16} aria-hidden="true" />{t('Connect with Google')}</button>
            {:else}
              <p class="ich-help">{t('This device needs the app key once. It comes with the Strava login; after that Google and Trello work here too.')}</p>
              <a class="btn hi big wide" href={STRAVA_HASH}>{t('Unlock this device (once)')}</a>
            {/if}
            <p class="note"><Lock size={14} aria-hidden="true" /><span><b>{t('Kept only on your devices; the server keeps nothing.')}</b> {t('The first time Google says «unverified app»: that is normal and free.')}</span></p>
          </div>
        </section>
      {/if}

      {#if p.calendar}
        <section class="ich-sec" aria-labelledby="ev-h">
          <div class="ich-h evh">
            <div><h2 id="ev-h">{t('Appointments')}</h2><p class="ich-hs">{view === 'week' ? t('Week {n}', { n: isoWeek(first) }) : t('the next 14 days')}</p></div>
            <div class="vbtns">
              <div class="chips" role="group" aria-label={t('View|calendar')}>
                <button type="button" class="chip" aria-pressed={view === 'list'} data-view="list" onclick={() => setView('list')}>{t('List|view')}</button>
                <button type="button" class="chip" aria-pressed={view === 'week'} data-view="week" onclick={() => setView('week')}>{t('Week|view')}</button>
              </div>
              {#if !ev}<button type="button" class="btn sm" onclick={newEvent}><Plus size={16} aria-hidden="true" />{t('New appointment')}</button>{/if}
            </div>
          </div>
          {#if ev}
            <form class="card ich-body form" onsubmit={keepEvent} aria-label={ev.gid ? t('Change appointment') : ev.copy ? t('Copy appointment') : t('New appointment')}>
              <label>{t('Title')}<input type="text" bind:value={ev.title} maxlength="200" required placeholder={t('e.g. Bike service')} /></label>
              <div class="two">
                <label>{t('Day')}<DateInput bind:value={ev.day} required /></label>
                {#if ev.allDay}<label>{t('Until (optional)')}<DateInput bind:value={ev.lastDay} min={ev.day} /></label>{/if}
              </div>
              <label class="tg"><input type="checkbox" bind:checked={ev.allDay} /> {t('All day')}</label>
              {#if !ev.allDay}
                <div class="two">
                  <label>{t('From|time')}<input type="time" bind:value={ev.from} required /></label>
                  <label>{t('To|time')}<input type="time" bind:value={ev.to} /></label>
                </div>
              {/if}
              {#if !ev.allDay}
                <label>{t('Time zone')}<select bind:value={ev.tz} data-ev-tz>{#each zones as z (z)}<option value={z}>{zoneName(z)}</option>{/each}</select></label>
              {/if}
              {#if !ev.repeat}
                <label>{t('Repeat|calendar')}
                  <select bind:value={ev.rep.mode} data-ev-repeat>{#each REPEATS as m (m)}<option value={m}>{t(REPEAT_NAMES[m])}</option>{/each}</select>
                </label>
                {#if ev.rep.mode === 'custom'}
                  <fieldset class="rem" data-ev-custom>
                    <legend>{t('Custom repeat')}</legend>
                    <div class="remrow">
                      <span>{t('Every|repeat')}</span>
                      <input type="number" min="1" max="99" bind:value={ev.rep.every} aria-label={t('Every|repeat')} />
                      <select bind:value={ev.rep.freq} aria-label={t('Unit|repeat')}>{#each ['daily', 'weekly', 'monthly', 'yearly'] as f (f)}<option value={f}>{t(FREQ_NAMES[f])}</option>{/each}</select>
                    </div>
                    {#if ev.rep.freq === 'weekly'}
                      <div class="wdays" role="group" aria-label={t('On these days')}>
                        {#each WEEKDAY_CODES as d, i (d)}
                          <label class="wd"><input type="checkbox" checked={ev.rep.days.includes(d)} onchange={(e) => (ev.rep.days = e.currentTarget.checked ? [...ev.rep.days, d] : ev.rep.days.filter((x) => x !== d))} />{t(WEEKDAY_NAMES[i])}</label>
                        {/each}
                      </div>
                    {/if}
                    <label>{t('Ends')}<select bind:value={ev.rep.end}><option value="never">{t('Never')}</option><option value="until">{t('On a day')}</option><option value="count">{t('After a number of times')}</option></select></label>
                    {#if ev.rep.end === 'until'}<label>{t('Last day')}<DateInput bind:value={ev.rep.until} min={ev.day} /></label>{/if}
                    {#if ev.rep.end === 'count'}<label>{t('Times')}<input type="number" min="1" max="999" bind:value={ev.rep.count} /></label>{/if}
                  </fieldset>
                {/if}
              {/if}
              <fieldset class="rem" data-ev-color>
                <legend>{t('Colour')}</legend>
                <div class="swatches">
                  <label class="swatch own" title={t('Colour of the calendar')}><input type="radio" name="evcolor" value="" bind:group={ev.color} /><span>{t('Calendar')}</span></label>
                  {#each Object.keys(EVENT_COLORS) as k (k)}
                    <label class="swatch" style:--c={EVENT_COLORS[k]} title={t(COLOR_NAMES[k])}><input type="radio" name="evcolor" value={k} bind:group={ev.color} aria-label={t(COLOR_NAMES[k])} /><span aria-hidden="true"></span></label>
                  {/each}
                </div>
              </fieldset>
              <label>{t('Where (optional)')}<input type="text" bind:value={ev.where} maxlength="200" /></label>
              <fieldset class="rem" data-ev-remind>
                <legend>{t('Reminders')}</legend>
                <label class="tg"><input type="checkbox" checked={ev.remind === null} onchange={(e) => (ev.remind = e.currentTarget.checked ? null : [{ n: 30, unit: 'minutes', method: 'popup' }])} /> {t('Google standard reminders')}</label>
                {#if ev.remind}
                  {#each ev.remind as r, i (i)}
                    <div class="remrow">
                      <select bind:value={r.method} aria-label={t('Kind of reminder')}><option value="popup">{t('Notification')}</option><option value="email">{t('E-mail')}</option></select>
                      <input type="number" min="0" max="40320" bind:value={r.n} aria-label={t('How long before')} />
                      <select bind:value={r.unit} aria-label={t('Unit|time')}>{#each Object.keys(UNITS) as u (u)}<option value={u}>{t(UNIT_NAMES[u])}</option>{/each}</select>
                      <button type="button" class="ib" aria-label={t('Remove reminder')} onclick={() => dropRemind(i)}><X size={16} aria-hidden="true" /></button>
                    </div>
                  {:else}
                    <p class="ich-help">{t('No reminder.')}</p>
                  {/each}
                  {#if ev.remind.length < 5}<button type="button" class="btn sm" onclick={addRemind}><Plus size={16} aria-hidden="true" />{t('Add reminder')}</button>{/if}
                {/if}
              </fieldset>
              {#if writable.length > 1 && !ev.gid}
                <label>{t('Calendar')}<select bind:value={ev.cal}>{#each writable as c (c.id)}<option value={c.id}>{c.name}</option>{/each}</select></label>
              {/if}
              <div class="two">
                <label>{t('Show me as')}<select bind:value={ev.busy} data-ev-busy><option value={true}>{t('Busy|show')}</option><option value={false}>{t('Free|show')}</option></select></label>
                <label>{t('Who sees it')}<select bind:value={ev.visibility}><option value="default">{t('Default|visibility')}</option><option value="public">{t('Public|view')}</option><option value="private">{t('Private|view')}</option></select></label>
              </div>
              <label>{t('Description (optional)')}<textarea bind:value={ev.note} rows="4" maxlength="4000" data-ev-note></textarea></label>
              {#if ev.repeat}<p class="ich-help">{t('This appointment repeats. A change here counts only for this one.')}</p>{/if}
              <div class="go">
                <button type="button" class="btn" onclick={() => (ev = null)}>{t('Cancel')}</button>
                <button type="submit" class="btn hi"><Check size={16} aria-hidden="true" />{ev.gid ? t('Save') : t('Enter in Google')}</button>
              </div>
            </form>
          {/if}
          {#if view === 'week'}
            <div class="wknav">
              <button type="button" class="btn sm" onclick={() => (anchor = today)}>{t('Today')}</button>
              <button type="button" class="btn sm" aria-label={t('Previous days|week')} onclick={() => step(-1)}><ChevronLeft size={16} aria-hidden="true" /></button>
              <button type="button" class="btn sm" aria-label={t('Next days|week')} onclick={() => step(1)}><ChevronRight size={16} aria-hidden="true" /></button>
              <span class="rng">{range}</span>
            </div>
            <WeekGrid events={agenda.events} days={weekDays} {today} {colors} picked={pickedEv} onpick={(e) => (pickedEv = pickedEv === e.id ? null : e.id)} onnew={newAt} {lockOf} onmove={dragged} />
            {#if picked}
              <div class="card ich-body pk">
                <h3>{picked.title}</h3>
                <p class="ich-help">{dayName(picked.day)}</p>
                {@render detail(picked)}
              </div>
            {/if}
            <p class="ich-help">{t('The copy on this device covers one week back and two months ahead.')}</p>
          {:else}
          <ul class="card ich-list days">
            {#each days as d (d.day)}
              <li class="day">
                <h3 class:now={d.day === today}>{dayName(d.day)}</h3>
                {#if !d.events.length}<p class="ich-help none">{t('Nothing entered.')}</p>{/if}
                <ul class="evs">
                  {#each d.events as e (e.id)}
                    <li>
                      <button type="button" class="ich-row row" aria-expanded={openEv === `${d.day}${e.id}`} onclick={() => (openEv = openEv === `${d.day}${e.id}` ? null : `${d.day}${e.id}`)}>
                        <span class="time">{e.allDay ? t('all day') : timeOf(e)}</span>
                        <span class="ich-m"><b>{e.title}</b>{#if e.where || p.cals.length > 1}<small>{[e.where, p.cals.length > 1 ? calName(e.cal) : ''].filter(Boolean).join(' · ')}</small>{/if}</span>
                      </button>
                      {#if openEv === `${d.day}${e.id}`}
                        {@render detail(e)}
                      {/if}
                    </li>
                  {/each}
                </ul>
              </li>
            {/each}
          </ul>
          {/if}
        </section>
      {/if}

      {#if p.tasks}
        <section class="ich-sec" aria-labelledby="tk-h">
          <div class="ich-h"><div><h2 id="tk-h">{t('Tasks')}</h2><p class="ich-hs">{t('from Google Tasks, changes go there too')}</p></div></div>
          {#if lists.length > 1}
            <div class="chips" role="group" aria-label={t('Task lists')}>
              <button type="button" class="chip" aria-pressed={!list} onclick={() => (list = '')}>{t('All')}</button>
              {#each lists as l (l.id)}<button type="button" class="chip" aria-pressed={list === l.id} onclick={() => (list = l.id)}>{l.title}</button>{/each}
            </div>
          {/if}
          <form class="add" onsubmit={addTask}>
            <input type="text" bind:value={newTask} maxlength="300" placeholder={t('New task')} aria-label={t('New task')} />
            <span class="due"><DateInput bind:value={newDue} aria-label={t('Due (optional)')} /></span>
            <button type="submit" class="btn hi" disabled={!newTask.trim()}><Plus size={16} aria-hidden="true" />{t('Add')}</button>
          </form>
          {#if !groups.length}
            <p class="ich-help">{agenda.busy ? t('Fetching…') : t('No open tasks. Well done.')}</p>
          {/if}
          {#each groups as g (g.key)}
            {#snippet rows()}
              <ul class="card ich-list">
                {#each g.rows as x (x.id)}
                  {@render task(x)}
                  {#each subs[x.id] ?? [] as s (s.id)}<li class="sub">{@render taskRow(s)}</li>{/each}
                {/each}
              </ul>
            {/snippet}
            {#if g.key === 'done'}
              <details class="donebox"><summary>{t(GROUP_NAMES.done)} · {g.rows.length}</summary>{@render rows()}</details>
            {:else}
              <h3 class="gh" class:late={g.key === 'late'}>{t(GROUP_NAMES[g.key])} · {g.rows.length}</h3>
              {@render rows()}
            {/if}
          {/each}
        </section>
      {/if}
    </div>

    {#if on}
      <div class="ich-side">
        <section class="ich-sec" aria-labelledby="st-h">
          <div class="ich-h"><div><h2 id="st-h">{t('From Google')}</h2><p class="ich-hs">{p.lastSync ? t('fetched {when}', { when: ago(p.lastSync) }) : t('not fetched yet')}</p></div></div>
          <div class="card ich-body">
            <button type="button" class="btn wide" disabled={agenda.busy} onclick={fetchButton}><RefreshCw size={16} aria-hidden="true" />{agenda.busy ? t('Fetching…') : t('Fetch now')}</button>
            <ConnStatus name="Google" busy={agenda.busy} since={agenda.since} />
            <p class="ich-help">{t('By itself when the app opens, at most every 15 minutes.')}</p>
          </div>
        </section>
        {#if p.calendar && p.calendars.length > 1}
          <section class="ich-sec" aria-labelledby="cal-h">
            <div class="ich-h"><div><h2 id="cal-h">{t('Which calendars')}</h2></div></div>
            <ul class="card ich-list">
              {#each p.calendars as c (c.id)}
                <li><label class="ich-row"><input type="checkbox" checked={shown(c.id)} onchange={(e) => toggleCal(c.id, e.currentTarget.checked)} /><span class="dot" style:background={c.color ?? 'var(--ink-3)'} aria-hidden="true"></span><span class="ich-m"><b>{c.name}</b>{#if !c.write}<small>{t('read only')}</small>{/if}</span></label></li>
              {/each}
            </ul>
          </section>
        {/if}
        <section class="ich-sec" aria-labelledby="also-h">
          <div class="ich-h"><div><h2 id="also-h">{t('Calendar and tasks')}</h2></div></div>
          <ul class="card ich-list">
            {#each [['calendar', CalendarDays, 'Google Calendar'], ['tasks', ListChecks, 'Google Tasks']] as [k, Icon, name] (k)}
              <li class="ich-row">
                <span class="ich-ib"><Icon size={18} aria-hidden="true" /></span>
                <span class="ich-m"><b>{t(name)}</b><small>{p[k] ? t('on') : t('off')}</small></span>
                {#if p[k]}
                  <button type="button" class="btn sm" onclick={() => hide(k)}><EyeOff size={16} aria-hidden="true" />{t('Hide')}</button>
                {:else}
                  <button type="button" class="btn sm" onclick={() => connect([k])}><Link size={16} aria-hidden="true" />{t('Connect')}</button>
                {/if}
              </li>
            {/each}
          </ul>
          <p class="ich-help">{t('Hiding only changes the app; everything stays in Google.')}</p>
        </section>
      </div>
    {/if}
  </div>
</div>

{#snippet taskRow(x)}
  {#if editTask?.id === x.id}
    <form class="ich-body form" onsubmit={keepTask} aria-label={t('Change task')}>
      <label>{t('Title')}<input type="text" bind:value={editTask.title} maxlength="300" required /></label>
      <label>{t('Due (optional)')}<DateInput bind:value={editTask.due} /></label>
      <label>{t('Note')}<textarea bind:value={editTask.notes} rows="3" maxlength="2000"></textarea></label>
      <div class="go">
        <button type="button" class="btn sm danger" onclick={() => dropTask(x)}><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>
        <span class="fill"></span>
        <button type="button" class="btn sm" onclick={() => (editTask = null)}>{t('Cancel')}</button>
        <button type="submit" class="btn sm hi">{t('Save')}</button>
      </div>
    </form>
  {:else}
    <div class="ich-row trow" class:done={x.done}>
      <button type="button" class="tick" aria-pressed={x.done} aria-label={x.done ? t('Not done: {name}', { name: x.title }) : t('Done: {name}', { name: x.title })} onclick={() => tick(x)}>
        {#if x.done}<CircleCheck size={24} aria-hidden="true" />{:else}<Circle size={24} aria-hidden="true" />{/if}
      </button>
      <span class="ich-m"><b>{x.title}</b>{#if x.due || x.notes}<small>{[x.due ? short(x.due) : '', x.notes ? x.notes.split('\n')[0].slice(0, 80) : ''].filter(Boolean).join(' · ')}</small>{/if}</span>
      <button type="button" class="ib" aria-label={t('Change «{name}»', { name: x.title })} onclick={() => (editTask = { ...x, due: x.due ?? '' })}><Pencil size={16} aria-hidden="true" /></button>
    </div>
  {/if}
{/snippet}

{#snippet task(x)}
  <li>{@render taskRow(x)}</li>
{/snippet}

{#if moving}
  <MoveSheet
    title={moving.e.title}
    day={moving.e.allDay ? moving.e.day : clockIn(moving.e.start, moving.e.tz || ZONES[0]).day}
    time={moving.e.allDay ? '' : clockIn(moving.e.start, moving.e.tz || ZONES[0]).time}
    timeless={moving.e.allDay}
    sync={t('The change is written to your Google calendar too. «Undo» writes it back.')}
    onsave={({ day, time }) => movedBy(moving.e, day, time)}
    onclose={() => (moving = null)}
  />
{/if}

<style>
  .agendapage {
    max-width: 1100px;
    min-width: 0;
  }
  .err {
    margin: 0 0 12px;
    color: var(--bad);
  }
  .msg {
    margin: 0 0 12px;
    color: var(--ink-2);
  }
  .ich-h {
    align-items: center;
  }
  .pick {
    margin: 0 0 12px;
  }
  .pick input,
  .ich-row input[type='checkbox'] {
    width: 20px;
    height: 20px;
    flex: none;
    accent-color: var(--hi);
  }
  .note {
    display: flex;
    gap: 8px;
    margin: 12px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .note :global(svg) {
    flex: none;
    margin-top: 3px;
  }
  .days > .day {
    padding: 10px 16px 6px;
  }
  .day h3,
  .gh {
    margin: 0 0 4px;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-3);
    text-transform: none;
  }
  .day h3.now {
    color: var(--ink);
  }
  .gh {
    margin: 14px 0 6px;
  }
  .gh.late {
    color: var(--bad);
  }
  .none {
    margin: 0 0 6px;
  }
  .evs {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .row {
    width: 100%;
    padding-left: 0;
    padding-right: 0;
    border: 0;
    background: transparent;
    font: inherit;
    text-align: left;
    color: inherit;
    cursor: pointer;
  }
  .time {
    flex: none;
    width: 64px;
    font-variant-numeric: tabular-nums;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .more {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 0 12px 76px;
  }
  .more p {
    margin: 0;
  }
  .more :global(svg) {
    vertical-align: -2px;
  }
  .note-t {
    white-space: pre-line;
    color: var(--ink-2);
  }
  .btns,
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chips {
    margin: 0 0 10px;
  }
  .chip {
    min-height: 36px;
    padding: 0 14px;
    border-radius: 99px;
    border: 1px solid var(--line);
    background: var(--paper);
    font: inherit;
    font-size: var(--fs-small);
    color: var(--ink);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    background: var(--hi);
    border-color: var(--hi);
    color: var(--hi-ink);
  }
  .danger {
    color: var(--bad);
  }
  .form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0 0 12px;
  }
  .form label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .form label.tg {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    color: var(--ink);
    font-size: inherit;
  }
  .form input:not([type='checkbox']),
  .form select,
  .form textarea,
  .add > input {
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
    background: var(--paper);
    font: inherit;
    color: var(--ink);
  }
  .form textarea {
    padding: 10px 12px;
    resize: vertical;
  }
  .two {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
  }
  .ich-cols.wide {
    grid-template-columns: minmax(0, 1fr);
  }
  .evh {
    flex-wrap: wrap;
  }
  .evh > div:first-child {
    flex: 1 1 9rem;
  }
  .vbtns {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .wknav {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 0 0 10px;
  }
  .rng {
    font-weight: 600;
  }
  .pk {
    margin: 12px 0;
  }
  .pk h3 {
    margin: 0 0 4px;
    font-size: var(--fs-sub);
  }
  .rem {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  .rem legend {
    padding: 0;
    margin-bottom: 4px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .remrow {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) minmax(0, 0.7fr) minmax(0, 1fr) auto;
    gap: 8px;
    align-items: center;
  }
  .remrow input {
    min-width: 0;
  }
  @media (max-width: 520px) {
    .remrow {
      grid-template-columns: minmax(0, 0.6fr) minmax(0, 1fr) auto;
    }
    .remrow select:first-child {
      grid-column: 1 / -1;
    }
  }
  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .swatch {
    position: relative;
    display: inline-flex;
    cursor: pointer;
  }
  .swatch input {
    position: absolute;
    opacity: 0;
    inset: 0;
    margin: 0;
    cursor: pointer;
  }
  .swatch span:not(:empty),
  .swatch span:empty {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    border-radius: 99px;
    box-sizing: border-box;
  }
  .swatch:not(.own) span {
    background: var(--c);
    border: 2px solid var(--paper);
    box-shadow: 0 0 0 1px var(--line);
  }
  .swatch.own span {
    padding: 0 10px;
    font-size: var(--fs-small);
    border: 1px solid var(--line);
    color: var(--ink-2);
  }
  .swatch:has(input:checked) span {
    box-shadow: 0 0 0 2px var(--ink);
  }
  .swatch:has(input:focus-visible) span {
    outline: 2px solid var(--ink);
    outline-offset: 2px;
  }
  .wdays {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .wd {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    font-size: var(--fs-small);
  }
  .go {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }
  .fill {
    flex: 1;
  }
  .add {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 6px;
  }
  .add > input {
    flex: 1 1 220px;
    min-width: 0;
  }
  .due {
    flex: 0 1 200px;
    min-width: 160px;
  }
  .trow {
    gap: 10px;
  }
  .trow.done b {
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .tick,
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -8px 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  .tick[aria-pressed='true'] {
    color: var(--ok);
  }
  .sub {
    padding-left: 34px;
  }
  .donebox {
    margin: 14px 0 0;
  }
  .donebox summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-3);
    cursor: pointer;
  }
  .dot {
    flex: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  .wide {
    width: 100%;
    justify-content: center;
  }
</style>
