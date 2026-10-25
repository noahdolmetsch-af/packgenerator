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
  import { byDay, taskGroups, timeOf, addDays, SHOW_DAYS } from '../lib/agenda.js';
  import { readKey, STRAVA_HASH } from '../lib/strava/client.svelte.js';
  import { localDay } from '../lib/localday.js';
  import { mail, loadPrefs as loadMailPrefs } from '../lib/mail/client.svelte.js';
  import { eventQuery, MAIL_HASH } from '../lib/mail.js';
  import { CalendarDays, ListChecks, Link, Lock, RefreshCw, Plus, Check, Circle, CircleCheck, Pencil, Trash2, ExternalLink, MapPin, Clock, EyeOff, Mail } from '@lucide/svelte';
  import '../lib/ich/ich.css';
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

  function newEvent() {
    openEv = null;
    ev = { cal: writable.find((c) => c.primary)?.id ?? writable[0]?.id ?? 'primary', title: '', day: today, lastDay: '', allDay: false, from: '09:00', to: '10:00', where: '' };
  }
  function changeEvent(e) {
    ev = { cal: e.cal, gid: e.gid, title: e.title, day: e.day, lastDay: e.lastDay > e.day ? e.lastDay : '', allDay: e.allDay, from: timeOf(e) || '09:00', to: e.allDay ? '10:00' : timeOf({ start: e.end }), where: e.where, note: e.note };
  }
  async function keepEvent(e) {
    e.preventDefault();
    if (!ev.title.trim() || !ev.day) return;
    const res = await saveEvent({ ...ev, title: ev.title.trim(), lastDay: ev.allDay && ev.lastDay ? ev.lastDay : undefined });
    if (res) {
      msg = ev.gid ? t('Changed in your Google calendar.') : t('«{name}» is in your Google calendar.', { name: ev.title.trim() });
      ev = null;
    }
  }
  async function dropEvent(e) {
    if ((await askDelete({ title: t('Delete «{name}» in your Google calendar too?', { name: e.title }) })) !== 'delete') return;
    if (await deleteEvent(e)) openEv = null;
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
      google_login_needed: t('Google needs a new login.'),
      calendar_not_allowed: t('The calendar is not allowed yet: connect it again.'),
      tasks_not_allowed: t('Google Tasks is not allowed yet: connect it again.'),
      google_missing: t('It is no longer in Google.'),
    })[code] ?? t('Google answered with an error. Try again later.');
</script>

<div class="agendapage">
  <VeloHead crumbs={[{ label: t('Plan|place'), href: '#/week' }]} here={t('Appointments and tasks')} title={t('Appointments and tasks')} sub={t('Your Google calendar and Google Tasks in the app: see, tick, add. Also for «Plan the week». Voluntary, you can switch it off at any time.')} />

  {#if agenda.error}<p class="err" role="status">{errorText(agenda.error)}</p>{/if}
  {#if msg}<p class="msg" role="status">{msg}</p>{/if}

  <div class="ich-cols">
    <div class="ich-main">
      {#if !on}
        <section class="ich-sec" aria-labelledby="con-h">
          <div class="ich-h"><div><h2 id="con-h">{t('Connect with Google')}</h2><p class="ich-hs">{t('the same login as Fitbit and Drive')}</p></div></div>
          <div class="card ich-body">
            {#if hasKey}
              <ul class="ich-list pick">
                <li><label class="ich-row"><input type="checkbox" bind:checked={want.calendar} /><span class="ich-ib"><CalendarDays size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Google Calendar')}</b><small>{t('see your appointments, enter new ones')}</small></span></label></li>
                <li><label class="ich-row"><input type="checkbox" bind:checked={want.tasks} /><span class="ich-ib"><ListChecks size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Google Tasks')}</b><small>{t('see, tick, add and change tasks')}</small></span></label></li>
              </ul>
              <button type="button" class="btn hi big wide" disabled={!services.length} onclick={() => connect(services)}><Link size={16} aria-hidden="true" />{t('Connect with Google')}</button>
            {:else}
              <p class="ich-help">{t('First connect Strava on this device: it gives this device the key the Google connection uses too.')}</p>
              <a class="btn hi big wide" href={STRAVA_HASH}>{t('Connect Strava first')}</a>
            {/if}
            <p class="note"><Lock size={14} aria-hidden="true" /><span><b>{t('Kept only on your devices; the server keeps nothing.')}</b> {t('The first time Google says «unverified app»: that is normal and free.')}</span></p>
          </div>
        </section>
      {/if}

      {#if p.calendar}
        <section class="ich-sec" aria-labelledby="ev-h">
          <div class="ich-h">
            <div><h2 id="ev-h">{t('Appointments')}</h2><p class="ich-hs">{t('the next 14 days')}</p></div>
            {#if !ev}<button type="button" class="btn sm" onclick={newEvent}><Plus size={15} aria-hidden="true" />{t('New appointment')}</button>{/if}
          </div>
          {#if ev}
            <form class="card ich-body form" onsubmit={keepEvent} aria-label={ev.gid ? t('Change appointment') : t('New appointment')}>
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
              <label>{t('Where (optional)')}<input type="text" bind:value={ev.where} maxlength="200" /></label>
              {#if writable.length > 1 && !ev.gid}
                <label>{t('Calendar')}<select bind:value={ev.cal}>{#each writable as c (c.id)}<option value={c.id}>{c.name}</option>{/each}</select></label>
              {/if}
              <div class="go">
                <button type="button" class="btn" onclick={() => (ev = null)}>{t('Cancel')}</button>
                <button type="submit" class="btn hi"><Check size={16} aria-hidden="true" />{ev.gid ? t('Save') : t('Enter in Google')}</button>
              </div>
            </form>
          {/if}
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
                        <div class="more">
                          <p class="ich-help"><Clock size={14} aria-hidden="true" /> {span(e)}{#if e.where}{' · '}<MapPin size={14} aria-hidden="true" /> {e.where}{/if}</p>
                          {#if e.note}<p class="note-t">{e.note}</p>{/if}
                          <div class="btns">
                            {#if e.link}<a class="btn sm" href={e.link} target="_blank" rel="noopener"><ExternalLink size={15} aria-hidden="true" />{t('Open in Google')}</a>{/if}
                            {#if mail.prefs.allowed && eventQuery(e)}<a class="btn sm" href={`${MAIL_HASH}?${new URLSearchParams({ q: eventQuery(e), for: e.title })}`}><Mail size={15} aria-hidden="true" />{t('Mails to it')}</a>{/if}
                            {#if writable.some((c) => c.id === e.cal) || e.cal === 'primary'}
                              <button type="button" class="btn sm" onclick={() => changeEvent(e)}><Pencil size={15} aria-hidden="true" />{t('Change')}</button>
                              <button type="button" class="btn sm danger" onclick={() => dropEvent(e)}><Trash2 size={15} aria-hidden="true" />{t('Delete')}</button>
                            {/if}
                          </div>
                        </div>
                      {/if}
                    </li>
                  {/each}
                </ul>
              </li>
            {/each}
          </ul>
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
            <button type="button" class="btn wide" disabled={agenda.busy} onclick={() => fetchNow()}><RefreshCw size={15} aria-hidden="true" />{agenda.busy ? t('Fetching…') : t('Fetch now')}</button>
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
                  <button type="button" class="btn sm" onclick={() => hide(k)}><EyeOff size={15} aria-hidden="true" />{t('Hide')}</button>
                {:else}
                  <button type="button" class="btn sm" onclick={() => connect([k])}><Link size={15} aria-hidden="true" />{t('Connect')}</button>
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
        <button type="button" class="btn sm danger" onclick={() => dropTask(x)}><Trash2 size={15} aria-hidden="true" />{t('Delete')}</button>
        <span class="fill"></span>
        <button type="button" class="btn sm" onclick={() => (editTask = null)}>{t('Cancel')}</button>
        <button type="submit" class="btn sm hi">{t('Save')}</button>
      </div>
    </form>
  {:else}
    <div class="ich-row trow" class:done={x.done}>
      <button type="button" class="tick" aria-pressed={x.done} aria-label={x.done ? t('Not done: {name}', { name: x.title }) : t('Done: {name}', { name: x.title })} onclick={() => tick(x)}>
        {#if x.done}<CircleCheck size={22} aria-hidden="true" />{:else}<Circle size={22} aria-hidden="true" />{/if}
      </button>
      <span class="ich-m"><b>{x.title}</b>{#if x.due || x.notes}<small>{[x.due ? short(x.due) : '', x.notes ? x.notes.split('\n')[0].slice(0, 80) : ''].filter(Boolean).join(' · ')}</small>{/if}</span>
      <button type="button" class="ib" aria-label={t('Change «{name}»', { name: x.title })} onclick={() => (editTask = { ...x, due: x.due ?? '' })}><Pencil size={16} aria-hidden="true" /></button>
    </div>
  {/if}
{/snippet}

{#snippet task(x)}
  <li>{@render taskRow(x)}</li>
{/snippet}

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
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
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
