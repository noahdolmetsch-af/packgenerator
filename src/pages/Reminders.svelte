<script>
  /**
   * Ich › Erinnerungen (mockup ER3, Noah «1a 2a 3a 4a 5b er1-er3 freigabe» 14.10.2026, 4a): every reminder
   * of the app on one page, by area (Aktiv, Touren, Velo, Eigene), each with a switch and a tap to change it.
   * Right: whether the app may ask «Soll ich dich erinnern?», the places set to «Nie fragen» (with
   * «Zurücksetzen»), and where reminders show: always in Kalender › Merken (5b: not on Heute), and as a
   * calendar file with an alarm for the phone's calendar when switched on, and a link to «Erinnerungen aufs
   * Handy» (#/me/push, Paket B) for the messages on the phone.
   * Geburtstage and Pflanzen (Noah 15.10.2026) have their own areas; their window is KindSheet, and a
   * delete there offers Undo for 4 s.
   */
  import { liveQuery } from 'dexie';
  import AreaIntro from '../lib/intro/AreaIntro.svelte'; // «Anleitungen überall»: the guide of this page (lib/guides.js)
  import { ChevronLeft, ChevronRight, Activity, Route, Bike, ListTodo, Bell, CalendarPlus, Cake, Sprout, BellRing } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { t, tn, lang } from '../lib/i18n.svelte.js';
  import { MERKEN_KEY, updateTodo } from '../lib/merkendb.js';
  import { kmLeft } from '../lib/merken.js';
  import { AREAS, areaOf, ASK_KEY, OFFER_KEY, ICS_KEY, neverAsked, forget, remindIcs } from '../lib/remind.js';
  import { icsCalendar } from '../lib/flowmed.js';
  import { putSetting } from '../lib/remind/ask.svelte.js';
  import { dayLabel } from '../lib/merken/when.js';
  import { isKind, birthdayReminders, plantReminder } from '../lib/merken/kinds.js';
  import { localDay } from '../lib/localday.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import PageHead from '../lib/ui/PageHead.svelte';
  import TodoSheet from '../lib/merken/TodoSheet.svelte';
  import KindSheet from '../lib/merken/KindSheet.svelte';
  import '../lib/ich/ich.css';

  const q = liveQuery(async () => {
    const [m, a, o, i, bikes, acts] = await Promise.all([db.settings.get(MERKEN_KEY), db.settings.get(ASK_KEY), db.settings.get(OFFER_KEY), db.settings.get(ICS_KEY), db.bikes.toArray(), db.flowActs.toArray()]);
    return { todos: m?.value ?? [], answers: a?.value ?? {}, offer: o?.value ?? true, ics: !!i?.value, bikes, acts };
  });
  const d = $derived($q ?? { todos: [], answers: {}, offer: true, ics: false, bikes: [], acts: [] });
  const reminders = $derived(d.todos.filter((x) => !x.doneAt && (x.remind || x.repeat || x.src || isKind(x))));
  const ICON = { active: Activity, trips: Route, bike: Bike, own: ListTodo, birthday: Cake, plant: Sprout };
  const today = localDay();
  const hasIcs = $derived(reminders.some((x) => !x.off && ((x.due && x.remind && !x.kind) || (x.kind === 'birthday' && x.reminds?.length))));
  let editing = $state(null);

  const kmOf = (id) => d.bikes.find((b) => b.id === id)?.km ?? null;
  const bikeName = (id) => d.bikes.find((b) => b.id === id)?.name ?? '';
  function kindLine(x) {
    if (x.kind === 'birthday') {
      const rs = birthdayReminders({ ...x, off: false }, today);
      return [t('Every year'), ...(rs.length ? rs.map((r) => `${dayLabel(r.day, today)} ${r.at}`) : [t('No reminder')])].join(' · ');
    }
    const r = plantReminder({ ...x, off: false }, today);
    return [tn(x.plant.every, 'Water every day', 'Water every {n} days'), r ? `${dayLabel(r.day, today)} ${r.at}` : t('No reminder')].join(' · ');
  }
  function line(x) {
    if (isKind(x)) return kindLine(x);
    const r = x.repeat;
    const parts = [];
    if (r?.every === 'day') parts.push(t('Every day'));
    else if (r?.every === 'week') parts.push(t('Every week'));
    else if (r?.every === 'month') parts.push(r.n > 1 ? t('Every {n} months', { n: r.n }) : t('Every month'));
    else if (r?.every === 'km') {
      const left = kmLeft(x, kmOf(r.bikeId));
      parts.push(t('Every {km} km', { km: r.km }));
      if (left != null) parts.push(left > 0 ? t('{km} km to go', { km: left }) : t('due now'));
    } else if (r?.every === 'rain') parts.push(t('After a ride in the rain'));
    if (x.due) parts.push(dayLabel(x.due));
    if (x.remind?.at) parts.push(x.remind.before ? t('{time}, 1 day before', { time: x.remind.at }) : x.remind.at);
    return parts.join(' · ');
  }
  const neverRows = $derived(neverAsked(d.answers));
  function placeName(src) {
    const [kind, id] = src.split(':');
    if (kind === 'act') {
      const a = d.acts.find((x) => x.id === id);
      return a ? ((lang.v === 'de' && a.nameDe ? a.nameDe : a.name) || id) : id;
    }
    if (kind === 'care') return t('{bike}: chain', { bike: bikeName(id) || id });
    if (kind === 'trip') return t('Before a trip');
    return src;
  }
  const flip = (x) => updateTodo(db, x.id, { off: !x.off });
  const setOffer = (on) => putSetting(OFFER_KEY, on);
  const setIcs = (on) => putSetting(ICS_KEY, on);
  const reset = (src) => putSetting(ASK_KEY, forget(d.answers, src));

  function download() {
    const text = remindIcs(reminders, icsCalendar);
    const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'erinnerungen.ics';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
</script>

<div class="ich-page rem">
  <p class="back"><a href="#/me"><ChevronLeft size={16} aria-hidden="true" />{t('Me|place')}</a></p>
  <PageHead title={t('Reminders')} text={t('Everything the app reminds you of. Everything can be changed, everything can be switched off.')} />
  <AreaIntro place="reminders" />

  <div class="ich-cols">
    <div class="ich-main">
      <section class="ich-sec" aria-label={t('Reminders')}>
        <div class="card ich-list list">
          {#if !reminders.length}
            <p class="empty">{t('No reminders yet. After an entry, before a trip or in bike care the app asks whether it should remind you.')}</p>
          {/if}
          {#each AREAS as area (area.key)}
            {@const rows = reminders.filter((x) => areaOf(x) === area.key)}
            {#if rows.length}
              <h2 class="sec">{t(area.label)}</h2>
              <ul>
                {#each rows as x (x.id)}
                  {@const Icon = ICON[area.key]}
                  <li class="row" class:off={x.off}>
                    <button type="button" class="ich-row open" onclick={() => (editing = x)}>
                      <span class="ich-ib"><Icon size={18} aria-hidden="true" /></span>
                      <span class="ich-m"><b>{x.text}</b><small>{line(x)}</small></span>
                    </button>
                    <button type="button" class="switch" role="switch" aria-checked={!x.off} aria-label={t('Remind: {name}', { name: x.text })} onclick={() => flip(x)}><span class="knob"></span></button>
                  </li>
                {/each}
              </ul>
            {/if}
          {/each}
        </div>
      </section>
    </div>

    <div class="ich-side">
      <section class="ich-sec" aria-labelledby="rem-ask-h">
        <div class="ich-h"><div><h2 id="rem-ask-h">{t('How the app asks')}</h2></div></div>
        <ul class="card ich-list">
          <li class="ich-row">
            <span class="ich-m"><b>{t('Offer «Shall I remind you?»')}</b><small>{t('After an entry, before a trip, in bike care')}</small></span>
            <button type="button" class="switch" role="switch" aria-checked={d.offer} aria-label={t('Offer «Shall I remind you?»')} onclick={() => setOffer(!d.offer)}><span class="knob"></span></button>
          </li>
          <li class="ich-row ich-wrap">
            <span class="ich-m"><b>{t('Never asked')}</b><small>{neverRows.length ? neverRows.map(placeName).join(', ') : t('Nothing')}</small></span>
          </li>
          {#each neverRows as src (src)}
            <li class="ich-row sub">
              <span class="ich-m"><small>{placeName(src)}</small></span>
              <button type="button" class="lnk" onclick={() => reset(src)}>{t('Reset')}<ChevronRight size={16} aria-hidden="true" /></button>
            </li>
          {/each}
        </ul>
      </section>

      <section class="ich-sec" aria-labelledby="rem-where-h">
        <div class="ich-h"><div><h2 id="rem-where-h">{t('Where they show')}</h2></div></div>
        <ul class="card ich-list">
          <li>
            <a class="ich-row" href="#/calendar">
              <span class="ich-ib"><Bell size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Calendar › Remember')}</b><small>{t('Always')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- Paket B «Erinnerungen aufs Handy» (Web-Push): the messages on the phone have their own page -->
            <a class="ich-row" href="#/me/push" data-push-link>
              <span class="ich-ib"><BellRing size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Reminders on the phone')}</b><small>{t('Birthdays, plants, the evening before, the weather')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li class="ich-row">
            <span class="ich-ib"><CalendarPlus size={18} aria-hidden="true" /></span>
            <span class="ich-m"><b>{t('Google Calendar with alarm')}</b><small>{t('As a file, free')}</small></span>
            <button type="button" class="switch" role="switch" aria-checked={d.ics} aria-label={t('Google Calendar with alarm')} onclick={() => setIcs(!d.ics)}><span class="knob"></span></button>
          </li>
          {#if d.ics}
            <li class="ich-row sub">
              <span class="ich-m"><small>{t('Open the file on the phone: Google Calendar takes the reminders with an alarm.')}</small></span>
              <button type="button" class="btn" onclick={download} disabled={!hasIcs}>{t('Calendar file')}</button>
            </li>
          {/if}
        </ul>
      </section>
    </div>
  </div>
</div>

{#if editing && isKind(editing)}
  <KindSheet todo={editing} onclose={() => (editing = null)} ondone={(r) => r?.removed && offerDone(t('Deleted.'), r.undo, 4000)} />
{:else if editing}
  <TodoSheet todo={editing} onclose={() => (editing = null)} />
{/if}

<style>
  .list ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .sec {
    margin: 14px 16px 2px;
    color: var(--ink-2);
    font: 600 var(--fs-tiny) / 1.4 var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-right: 14px;
  }
  .row .open {
    flex: 1;
    min-width: 0;
    border: 0;
    background: none;
    text-align: left;
    font: inherit;
    color: inherit;
    cursor: pointer;
  }
  .row.off b {
    color: var(--ink-2);
  }
  .empty {
    margin: 0;
    padding: 16px;
    color: var(--ink-2);
  }
  .sub {
    padding-top: 0;
  }
  .lnk {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-weight: 500;
    cursor: pointer;
  }
  .switch {
    position: relative;
    flex: none;
    width: 48px;
    height: 28px;
    border: 0;
    border-radius: 99px;
    background: var(--line-strong, var(--line));
    cursor: pointer;
  }
  .switch .knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--paper);
    box-shadow: 0 1px 2px var(--shadow);
    transition: left 0.15s;
  }
  .switch[aria-checked='true'] {
    background: var(--accent);
  }
  .switch[aria-checked='true'] .knob {
    left: 23px;
  }
  @media (prefers-reduced-motion: reduce) {
    .switch .knob {
      transition: none;
    }
  }
</style>
