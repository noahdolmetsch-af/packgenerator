<script>
  /**
   * v0.76.0 «Fünf Orte» 1 (Noah 10.10.2026, all a): «Ich», top right on every page, took the place of
   * the menu «More». First what you set for yourself (language, light or dark, colour world), then the
   * places of the app: home place, Inbox, notes, your data, what the app can do and has learned, help
   * and keyboard shortcuts. Numbers only where something waits (the Inbox, «Backup due»).
   * v0.77.0 KI-Helfer (K1a): its own row «Helfer» with the state (set up, switched off, paused, not set up).
   * v0.88.0 «Aufräumen und Ausprobieren» (Noah 0.88 alle a, mockups F, G): two rows «Clean up test data»
   * (how many found, the sheet archives them with Undo) and «Try it out» (the playground; the debrief's
   * «Lieber in der Spielwiese probieren» opens it here once).
   * Design-Refresh P9 (I1, Noah 12.10.2026 «Runde 16 freigegeben»): on top only what is due (Backup);
   * then four groups as in the mockup: Data (Data and backup, Inbox, Notes), Settings (Appearance,
   * Home place, Language), The app (what it can do, help, Helper, what it has learned) and More (try it
   * out, clean up test data, report a problem). «Data and backup» is its own page now (#/me/data, I2),
   * the home place a window (I10). Everything that was here stays.
   * Bezahlen (mockup BZ1, Noah 14.10.2026 «1a», «bz freigeben»): last row of «The app», #/me/pay.
   * KT «Kacheln antippbar» (Noah 14.10.2026, 3a): under «Help and keyboard shortcuts» a row shows the
   * short intro of the start page again (lib/home/IntroKT.svelte).
   * «Inspiration» (UC2-1): a row under Notes, #/inspiration (on a phone the only way there).
   * Impeccable (Noah 18.10.2026 «alle a-d umsetzen»): on top the card «Waiting for you» (backup, inbox, bills,
   * a key that runs out), each line with its button; nothing open: one calm line. «Help» folds the handbook,
   * the shortcuts and the intro; «App maintenance» and «More» are folded heads (one tap opens them as before).
   * Impeccable Runde 2 (Noah 18.10.2026 21:46): the AI helper's line no longer sends you to Ich while you are on
   * Ich; «Payments» carries a grey «not active yet» (yellow only means «something to do»); «Lists and checks» is
   * one row under Settings (the checks are one tap deeper, on that page); «Appearance and handling» names the
   * start place too.
   */
  import HintCard from '../lib/pageinfo/HintCard.svelte';
  import PageMore from '../lib/pageinfo/PageMore.svelte';
  import TipLine from '../lib/pageinfo/TipLine.svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { LAST_BACKUP, backupDue } from '../lib/backup.js';
  import { demoState } from '../lib/demo.js';
  import { HOME_PLACE } from '../lib/know.js';
  import { t, tn, lang, setLang, num, locale } from '../lib/i18n.svelte.js';
  import { lookLine } from '../lib/theme.svelte.js';
  import { ops } from '../lib/bedienung.svelte.js';
  import { START_PLACES } from '../lib/bedienung.js';
  import Seg from '../lib/ui/Seg.svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import HomePlaceSheet from '../lib/ich/HomePlaceSheet.svelte';
  import { HeartHandshake, Globe, Palette, House, Inbox, NotebookPen, Database, Info, Lightbulb, Keyboard, ChevronRight, ChevronDown, Sparkles, Archive, FlaskConical, TriangleAlert, Star, ListChecks, ClipboardList, History, CreditCard, Hand, BookOpen, LayoutGrid, Compass, ListTree, KeyRound, CircleHelp, Check, Bell, ListTodo, SlidersHorizontal, FileText, Scale, CalendarCheck, CalendarDays, BellRing, Mail, Backpack, Link2, Wrench, ExternalLink, CalendarClock, Target, ShieldCheck, ShoppingCart } from '@lucide/svelte';
  import { wide } from '../lib/media.svelte.js';
  import { WHATS_NEW, shortVersion } from '../lib/whatsnew.js';
  import { helper, isSetUp, isPaused, noCredit } from '../lib/helper/client.svelte.js';
  import { testDataState } from '../lib/testdatadb.js';
  import { PLAY_WISH } from '../lib/play.js';
  import { take } from '../lib/nav.js';
  import { movedHint } from '../lib/visitprefill.js';
  import { localDay } from '../lib/localday.js';
  import { INTRO_KEY } from '../lib/home/introkt.js';
  import TestDataSheet from '../lib/testdata/TestDataSheet.svelte';
  import PlaySheet from '../lib/testdata/PlaySheet.svelte';
  import MaintenanceCard from '../lib/maintenance/MaintenanceCard.svelte';
  import { MAINT_KEY, maintOf } from '../lib/maintenance/settings.js';
  import { keyRows } from '../lib/maintenance/check.js';
  import { listBills, billsSummary } from '../lib/pay/bills.js';
  import { formatAmount } from '../lib/pay/qrbill.js';
  import Btn from '../lib/ui/Btn.svelte';
  import { tick } from 'svelte';
  import '../lib/ich/ich.css';
  import { docs as docList } from '../lib/docs/client.svelte.js';
  import { dueCount } from '../lib/docs.js';
  import { agenda } from '../lib/agenda/client.svelte.js';
  // P3b (D3): how many documents expire soon (the yellow pill on «Documents»)
  const docDue = $derived(dueCount(docList.list, localDay()));
  import { weight } from '../lib/weight.svelte.js';
  import { latestOf } from '../lib/weight.js';

  // v0.125.0 A-J1: the hint «now under + New and at the bike» shows for 30 days from the first time
  const MOVED_KEY = 'aj1.problemMoved';
  const moved = (() => {
    let since = null;
    try {
      since = localStorage.getItem(MOVED_KEY);
    } catch {
      /* private mode: the hint just shows */
    }
    const m = movedHint(since, localDay());
    try {
      if (m.since !== since) localStorage.setItem(MOVED_KEY, m.since);
    } catch {
      /* ignore */
    }
    return m;
  })();

  const waitQ = liveQuery(async () => {
    const [notes, file, folder, n, demo, place, bikes, maint, bills] = await Promise.all([db.notes.where('status').equals('open').count(), db.meta.get(LAST_BACKUP), db.meta.get('backupFolder'), db.items.count(), demoState(db), db.settings.get(HOME_PLACE), db.bikes.count(), db.settings.get(MAINT_KEY), listBills(db)]);
    const last = [file?.at, folder?.lastWrite].filter(Boolean).sort().at(-1) ?? null;
    const due = backupDue(last);
    // Impeccable: what waits on top: the keys that run out within 30 days, the open bills
    const keys = keyRows(maintOf(maint?.value).keys, localDay()).filter((k) => k.due);
    return { inbox: notes, backup: n && !demo ? due.due : false, days: due.days, last, folder: !!folder?.name, home: place?.value?.name ?? '', demo: !!demo, play: !!demo?.play, bikes, keys, bills: billsSummary(bills) };
  });
  const testQ = liveQuery(() => testDataState(db));
  let tidyOpen = $state(false);
  let playOpen = $state(take(PLAY_WISH) === '1');
  $effect(() => {
    const onPlay = () => take(PLAY_WISH) && (playOpen = true);
    window.addEventListener('pg:play', onPlay);
    return () => window.removeEventListener('pg:play', onPlay);
  });
  let placeOpen = $state(false);
  const keys = () => window.dispatchEvent(new Event('pg:keys'));
  // KT: false asks Today for the intro again (true = seen); then off to Today
  async function introAgain() {
    await db.settings.put({ key: INTRO_KEY, value: false });
    location.hash = '#/';
  }
  // v0.118.0 «KI-Helfer ausblenden» (K4): off by default; the row says where to switch it on
  const helperState = $derived(!helper.loaded ? '' : !helper.show ? t('off · suggestions from Claude, only if you want') : !isSetUp() ? t('on · not set up') : noCredit() ? t('credit used up · hidden|helper') : isPaused() ? t('paused until next month') : t('on|helper'));
  const version = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '';
  const sub = $derived([t('Settings and the app, only on this device'), version ? t('Version {v}', { v: version }) : ''].filter(Boolean).join(' · '));
  // Impeccable: «Waiting for you»: at most one line per kind, each with the button that does it
  let maintOpen = $state(false);
  let moreOpen = $state(false);
  async function showMaint() {
    maintOpen = true;
    await tick();
    document.querySelector('[data-section="maintenance"]')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  const dateShort = (day) => new Date(`${day}T12:00:00`).toLocaleDateString(lang.v === 'de' ? 'de-CH' : 'en-GB', { day: 'numeric', month: 'short' });
  const waits = $derived.by(() => {
    const w = $waitQ;
    if (!w) return [];
    const out = [];
    if (w.backup) out.push({ key: 'backup', icon: Database, text: w.days != null ? tn(w.days, 'Backup: the last one {n} day ago', 'Backup: the last one {n} days ago') : t('Backup: none yet'), sub: t('everything is only on this device'), label: t('Make a backup'), href: '#/me/data' });
    if (w.inbox) out.push({ key: 'inbox', icon: Inbox, text: tn(w.inbox, 'Inbox: {n} note to file', 'Inbox: {n} notes to file'), sub: t('Notes from on the way'), label: t('File'), href: '#/inbox' });
    if (w.bills.count) out.push({ key: 'bills', icon: CreditCard, text: tn(w.bills.count, 'Bills: {n} open', 'Bills: {n} open'), sub: `${formatAmount(w.bills.sum)} CHF${w.bills.next ? ` · ${t('due {date}', { date: dateShort(w.bills.next) })}` : ''}`, label: t('Open'), href: '#/me/pay/bills' });
    for (const k of w.keys) out.push({ key: `key-${k.id}`, icon: KeyRound, text: k.days < 0 ? t('{name} ran out', { name: t(k.name) }) : tn(k.days, '{name} runs out in {n} day', '{name} runs out in {n} days', { name: t(k.name) }), sub: t('until {date}', { date: dateShort(k.until) }), label: t('Look|maint'), onclick: showMaint });
    return out;
  });
  const lastLine = $derived($waitQ?.days != null ? ($waitQ.days === 0 ? t('Last backup today.') : tn($waitQ.days, 'Last backup {n} day ago.', 'Last backup {n} days ago.')) : '');
  // TR6: the weight, voluntary, only for watts per kg
  const weightLine = $derived.by(() => {
    const w = latestOf(weight.entries);
    const day = w ? new Date(`${w.day}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'short' }) : '';
    return w ? t('{kg} kg · {day} · only on this device', { kg: num(w.kg), day }) : t('Voluntary, for watts per kg · only on this device');
  });
  // Impeccable Runde 2: «Inter · Sage · Normal · Start: Today»
  const startName = $derived(t(START_PLACES.find((p) => p.key === ops.start)?.name ?? 'Today|place'));
  const lookSub = $derived([lookLine(t), t('Start: {place}', { place: startName })].filter(Boolean).join(' · '));
  const dataLine = $derived([t('Backup, restore, import'), $waitQ?.folder ? t('auto-backup set up') : ''].filter(Boolean).join(' · '));
  const agendaOn = $derived(agenda.prefs.calendar || agenda.prefs.tasks);
</script>

<div class="mepage ich-page">
  <VeloHead title={t('Me|place')} {sub} />

  {#if $waitQ}
    <!-- I1, Impeccable: on top what waits, each line with its button; nothing open: one calm line -->
    {#if waits.length}
      <section class="ich-due waits" aria-labelledby="due-h" data-section="waiting">
        <h2 id="due-h">{t('Waiting for you')}</h2>
        <ul class="wl">
          {#each waits as w, i (w.key)}
            <li data-wait={w.key}>
              <span class="ich-ib"><w.icon size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{w.text}</b><small>{w.sub}</small></span>
              <Btn kind={i === 0 ? 'hi' : 'normal'} class="sm" label={w.label} href={w.href} onclick={w.onclick} />
            </li>
          {/each}
        </ul>
      </section>
    {:else}
      <p class="card alldone" data-section="waiting"><Check size={18} aria-hidden="true" /><span>{t('All done.')}{lastLine ? ` ${lastLine}` : ''}</span></p>
    {/if}
  {/if}

  <!-- «Mehr Inhalt» (Noah 15.10.2026, 1a–5a): the tip of the day, at the end the fold -->
  <HintCard page="me" />
  <TipLine page="me" name={t('Me|place')} />

  <div class="ich-cols">
    <div class="ich-main">
      {#if !wide.matches}
        <!-- «Woche planen» (Noah 15.10.2026 «1a»): on a phone «Woche» sits in the bottom bar, Material is here -->
        <ul class="card ich-list" data-me-gear>
          <li>
            <a class="ich-row" href="#/gear">
              <span class="ich-ib"><Backpack size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Gear|place')}</b><small>{t('Everything you own, clothes, building blocks, shopping')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
        </ul>
      {/if}
      <!-- Paket T «Freie Zeit» (Noah 19.10.2026 «alle bauen»): impulses, collections and six small pages -->
      <ul class="card ich-list" data-me-frei>
        <li>
          <a class="ich-row" href="#/me/frei">
            <span class="ich-ib"><Sparkles size={18} aria-hidden="true" /></span>
            <span class="ich-m"><b>{t('Free time')}</b><small>{t('Impulses, collections, evenings, first night and more')}</small></span>
            <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
          </a>
        </li>
      </ul>
      <ul class="card ich-list" data-me-alltag>
        <li>
          <!-- Paket V «Alltag» (Noah 19.10.2026 «3a oder b 4a 5a»): shopping list, contracts, «Not seen for a while» -->
          <a class="ich-row" href="#/me/alltag">
            <span class="ich-ib"><ShoppingCart size={18} aria-hidden="true" /></span>
            <span class="ich-m"><b>{t('Everyday life')}</b><small>{t('Shopping list, contracts and subscriptions, people you miss')}</small></span>
            <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
          </a>
        </li>
      </ul>
      <section class="ich-sec" aria-labelledby="me-data-h">
        <div class="ich-h"><div><h2 id="me-data-h">{t('Data')}</h2></div></div>
        <ul class="card ich-list">
          <li>
            <a class="ich-row" href="#/me/data">
              <span class="ich-ib"><Database size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Data and backup')}</b><small>{dataLine}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- P3b «Daten sicher» (D3): passport, insurance, emergency; reminders before they expire -->
            <a class="ich-row" href="#/me/docs">
              <span class="ich-ib"><FileText size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Documents')}</b><small>{docList.list.length ? tn(docList.list.length, '{n} document', '{n} documents') : t('Passport, insurance, emergency sheet')}{docDue ? ` · ${tn(docDue, '{n} expires soon', '{n} expire soon')}` : ''}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- Google Kalender und Aufgaben (GA): appointments and tasks from Google, also for «Woche planen» -->
            <a class="ich-row" href="#/me/agenda">
              <span class="ich-ib"><CalendarCheck size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Appointments and tasks')}</b><small>{agendaOn ? t('from your Google calendar and Google Tasks') : t('Connect Google Calendar and Google Tasks')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- package G #155: every connection in one place (Strava, Fitbit, Google, lake), with its switches -->
            <a class="ich-row" href="#/me/connections" data-row="connections">
              <span class="ich-ib"><Link2 size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Connections')}</b><small>{t('Strava, Fitbit, Google, lake: state and switches')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- Google Mail (GM): the Gmail inbox, read and send -->
            <a class="ich-row" href="#/me/mail">
              <span class="ich-ib"><Mail size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Mail')}</b><small>{t('Your Gmail: read, search, answer, write')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- AB1/AB5 «Deine Abfragen»: what the app asks you and how often -->
            <a class="ich-row" href="#/me/abfragen">
              <span class="ich-ib"><ClipboardList size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Your questions')}</b><small>{t('What the app asks you and how often')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- AB4: all values in one history -->
            <a class="ich-row" href="#/me/history">
              <span class="ich-ib"><History size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('History')}</b><small>{t('All values in one place: answers, Fitbit, Strava')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- Erkenntnisse (Noah 19.10.2026 «4b» + own page): what goes together in your data -->
            <a class="ich-row" href="#/me/insights" data-me-insights>
              <span class="ich-ib"><Lightbulb size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Insights')}</b><small>{t('What goes together: sleep, battery, rides, weather, appointments')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <a class="ich-row" href="#/inbox">
              <span class="ich-ib"><Inbox size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Inbox')}</b><small>{$waitQ?.inbox ? `${t('{n} to sort', { n: $waitQ.inbox })} · ${t('Notes from on the way')}` : t('Notes from on the way, to sort')}</small></span>
              {#if $waitQ?.inbox}<span class="pill act num" aria-hidden="true">{$waitQ.inbox}</span>{/if}
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- PL3 (Noah 14.10.2026 «PL1-PL3 freigeben», «1a»): Kalender › Merken, the own to-dos -->
            <a class="ich-row" href="#/calendar">
              <span class="ich-ib"><ListTodo size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Calendar › Remember')}</b><small>{t('Your to-dos and reminders')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <a class="ich-row" href="#/notes">
              <span class="ich-ib"><NotebookPen size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Notes')}</b><small>{t('Kept notes, topics and checklists')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- Paket N (Noah 19.10.2026 «4b»): Ich › Mein Kompass, goals in steps and the boxes -->
            <a class="ich-row" href="#/me/compass" data-row="compass">
              <span class="ich-ib"><Target size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('My compass')}</b><small>{t('Goals in steps, resolutions, dreams, ideas')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- «Inspiration» UC2-1: on a phone Ich › Inspiration (on a computer also in the sidebar) -->
            <a class="ich-row" href="#/inspiration">
              <span class="ich-ib"><Compass size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Inspiration')}</b><small>{t('Your own links, key words and notes')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- TR6/TR6b: Ich › Meine Daten › Gewicht -->
            <a class="ich-row" href="#/me/weight" data-row="weight">
              <span class="ich-ib"><Scale size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Weight|place')}</b><small>{weightLine}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- Paket P «Was mir gut tut» (Noah 19.10.2026) -->
            <a class="ich-row" href="#/me/wohl" data-row="wohl">
              <span class="ich-ib"><HeartHandshake size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('What is good for me')}</b><small>{t('Good days, experiments, life phases')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- Paket L «Werkzeugkasten»: calculator, units, time zones, compass, phrases, PDF, photos -->
            <a class="ich-row" href="#/me/tools" data-row="tools">
              <span class="ich-ib"><Wrench size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Toolbox')}</b><small>{t('Calculator, units, PDF, photos and more')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- Paket L «Werkzeuge und Links» (Noah 19.10.2026 «1b»): other apps and pages -->
            <a class="ich-row" href="#/me/links" data-row="weblinks">
              <span class="ich-ib"><ExternalLink size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Tools and links')}</b><small>{t('SBB, Maps, komoot, Trello and your own links')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
        </ul>
      </section>

      <section class="ich-sec" aria-labelledby="me-set-h">
        <div class="ich-h"><div><h2 id="me-set-h">{t('Settings')}</h2></div></div>
        <ul class="card ich-list">
          <li>
            <!-- v0.97.0 Design-Refresh R1: font, colour world, text size and light or dark on their own page -->
            <a class="ich-row" href="#/me/look">
              <span class="ich-ib"><Palette size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Appearance and handling')}</b><small>{lookSub}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- v0.134.0 «Listen und Typen» (LI1) and v0.111.0 the checks per trip type: Impeccable Runde 2, one row
                 until more lists come (the page holds both: categories and the checks) -->
            <a class="ich-row" href="#/me/lists">
              <span class="ich-ib"><ListChecks size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Lists and checks')}</b><small>{t('Categories, evening-before and after-trip check')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- ER3 (Noah 14.10.2026 «er1-er3 freigabe», 4a): every reminder on one page -->
            <a class="ich-row" href="#/me/reminders">
              <span class="ich-ib"><Bell size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Reminders')}</b><small>{t('What the app reminds you of, and when it asks')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- Erinnerungen aufs Handy (Web-Push): one main switch and one per kind, all off at the start -->
            <a class="ich-row" href="#/me/push">
              <span class="ich-ib"><BellRing size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Reminders on the phone')}</b><small>{t('Birthdays, plants, the evening before, the weather')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- Paket Q #148: weather warnings, avalanche danger, passes and news from your own sources -->
            <a class="ich-row" href="#/me/hinweise" data-row="hinweise">
              <span class="ich-ib"><TriangleAlert size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Alerts and news')}</b><small>{t('Weather warnings, avalanches, passes, news')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- «Mehr selbst einstellen» (IS 254–258): the numbers of the app and the suggestions on or off -->
            <a class="ich-row" href="#/me/werte">
              <span class="ich-ib"><SlidersHorizontal size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Own values')}</b><small>{t('Packing step, backup reminder, bike check, care, cold')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <button type="button" class="ich-row" aria-haspopup="dialog" onclick={() => (placeOpen = true)}>
              <span class="ich-ib"><House size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Home place')}</b><small>{$waitQ?.home || t('Not set yet: for the weather of a ride from home')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </button>
          </li>
          <li class="ich-row ich-wrap lang">
            <span class="ich-ib"><Globe size={18} aria-hidden="true" /></span>
            <span class="ich-m"><b id="me-lang">{t('Language')}</b></span>
            <Seg labelledby="me-lang" full={false} value={lang.v} options={[{ key: 'de', name: 'Deutsch' }, { key: 'en', name: 'English' }]} onchange={setLang} />
          </li>
        </ul>
      </section>
    </div>

    <div class="ich-side">
      <section class="ich-sec" aria-labelledby="me-app-h">
        <div class="ich-h"><div><h2 id="me-app-h">{t('The app')}</h2></div></div>
        <ul class="card ich-list">
          <li>
            <a class="ich-row" href="#/features">
              <span class="ich-ib"><Info size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('What the app can do')}</b></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- Paket R: what stays on the device, what the server keeps, costs, terms -->
            <a class="ich-row" href="#/me/privacy">
              <span class="ich-ib"><ShieldCheck size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Privacy and terms')}</b><small>{t('Free, your data stays with you')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <a class="ich-row" href="#/me/apps">
              <span class="ich-ib"><LayoutGrid size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Small apps')}</b><small>{t('Own icon on the phone, same data')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- v0.110.0 Design-Refresh P10 (I11): Ich › Was ist neu -->
            <a class="ich-row" href="#/me/news">
              <span class="ich-ib"><Star size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('What is new')}</b><small>{t('New in {version}', { version: shortVersion(WHATS_NEW[0].version) })}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- Paket N #68 (19.10.2026): Ich › Was kommt, the plan package by package -->
            <a class="ich-row" href="#/me/next" data-row="next">
              <span class="ich-ib"><CalendarClock size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('What comes next')}</b><small>{t('The plan of the app, package by package')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- Impeccable: one row «Help»; the handbook, the shortcuts and the intro one tap deeper -->
            <details class="hfold">
              <summary class="ich-row">
                <span class="ich-ib"><CircleHelp size={18} aria-hidden="true" /></span>
                <span class="ich-m"><b>{t('Help|me')}</b><small>{t('Handbook, keyboard shortcuts, show the intro again')}</small></span>
                <ChevronDown class="ich-chev fchev" size={18} aria-hidden="true" />
              </summary>
              <ul class="ich-list sub">
                <li>
                  <!-- Handbuch + Kleine Apps (mockup HB2, Noah 14.10.2026 «1b 2b», «hb freigeben») -->
                  <a class="ich-row" href="#/me/handbook">
                    <span class="ich-ib"><BookOpen size={18} aria-hidden="true" /></span>
                    <span class="ich-m"><b>{t('Handbook')}</b><small>{t('How to switch on every function, with an example')}</small></span>
                    <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <button type="button" class="ich-row" onclick={keys} aria-haspopup="dialog">
                    <span class="ich-ib"><Keyboard size={18} aria-hidden="true" /></span>
                    <span class="ich-m"><b>{t('Help and keyboard shortcuts')}</b></span>
                    <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
                  </button>
                </li>
                <li>
                  <!-- KT (3a): the short intro of the start page once more -->
                  <button type="button" class="ich-row" onclick={introAgain} data-intro-again>
                    <span class="ich-ib"><Hand size={18} aria-hidden="true" /></span>
                    <span class="ich-m"><b>{t('Show the start page intro again')}</b></span>
                    <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
                  </button>
                </li>
              </ul>
            </details>
          </li>
          <li>
            <a class="ich-row" href="#/helper">
              <span class="ich-ib"><Sparkles size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('AI helper')}</b><small>{helperState || t('Suggestions from Claude, only on request')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <a class="ich-row" href="#/debrief/learnings">
              <span class="ich-ib"><Lightbulb size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('What the app has learned')}</b></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- Termine buchen (mockup BU5, Noah 14.10.2026 «BU1–BU5 freigegeben»): Ich › Angebote -->
            <a class="ich-row" href="#/me/offers">
              <span class="ich-ib"><CalendarDays size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Offers')} <span class="pill warn">{t('Test|offers')}</span></b><small>{t('People book your free times: tennis, tours, bike service')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- Paket R (Noah 19.10.2026 «4a»): your bike mechanics and guides, a request by mail or link -->
            <a class="ich-row" href="#/me/pros">
              <span class="ich-ib"><Wrench size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Bike mechanic and guide')}</b><small>{t('Ask for a date by mail or their link')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <a class="ich-row" href="#/me/pay">
              <span class="ich-ib"><CreditCard size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Payments')} <span class="pill">{t('not active yet')}</span></b><small>{t('What is already there and what you could use it for')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
        </ul>
      </section>

      <!-- «App-Wartung» (Noah 13.10.2026, BF7 BF8): Strava's free limits and the monthly check -->
      <MaintenanceCard fold bind:open={maintOpen} />

      <!-- Impeccable: «More» folded; its head says what is inside -->
      <details class="ich-sec fold" bind:open={moreOpen}>
        <summary class="ich-h fsum"><div><h2 id="me-more-h">{t('More')}</h2><p class="ich-hs">{t('Try it out, clean up test data')}</p></div><ChevronDown class="fchev" size={20} aria-hidden="true" /></summary>
        <ul class="card ich-list">
          <li>
            <button type="button" class="ich-row" onclick={() => (playOpen = true)} aria-haspopup="dialog">
              <span class="ich-ib"><FlaskConical size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Try it out')}</b><small>{$waitQ?.play ? t('The playground is running') : t('Playground: try everything, afterwards all is as before')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </button>
          </li>
          <li>
            <button type="button" class="ich-row" onclick={() => (tidyOpen = true)} aria-haspopup="dialog">
              <span class="ich-ib"><Archive size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Clean up test data')}</b><small>{$testQ?.found.n ? tn($testQ.found.n, '{n} thing with «test» in its name', '{n} things with «test» in their name') : $testQ?.tidied ? t('Archived; «Undo» is here') : t('Nothing with «test» in its name')}</small></span>
              {#if $testQ?.found.n}<span class="pill act num" aria-hidden="true">{$testQ.found.n}</span>{/if}
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </button>
          </li>
        </ul>
      </details>
      <!-- v0.125.0 A-J1: «Report a problem» left Me; for 30 days a quiet line says where it is now (outside the fold) -->
      {#if $waitQ?.bikes && moved.show}
        <p class="moved" role="note"><TriangleAlert size={16} aria-hidden="true" /><span>{t('Looking for «Report a problem»? It is now under + New and at the bike:')} <a href="#/bikes?tab=care">{t('Bike care')}</a></span></p>
      {/if}
    </div>
  </div>

  <PageMore page="me" name={t('Me|place')} />
  {#if tidyOpen}<TestDataSheet onclose={() => (tidyOpen = false)} />{/if}
  {#if playOpen}<PlaySheet running={!!$waitQ?.demo} onclose={() => (playOpen = false)} />{/if}
  {#if placeOpen}<HomePlaceSheet current={$waitQ?.home || null} onclose={() => (placeOpen = false)} />{/if}
</div>

<style>
  .moved {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 0 4px 24px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .moved :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .mepage {
    max-width: 1100px;
  }
  .lang {
    min-height: 60px;
  }
  /* Impeccable «Waiting for you»: the lines one under the other on a phone, side by side on a computer */
  .waits {
    display: block;
  }
  .waits h2 {
    margin: 0 0 8px;
  }
  .wl {
    list-style: none;
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
  }
  .wl li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    min-width: 0;
    padding: 10px 0;
  }
  .wl li + li {
    border-top: 1px solid var(--line);
  }
  .wl .ich-ib {
    background: var(--paper);
  }
  .wl .ich-m small {
    color: var(--ink-2);
  }
  .wl li > :global(.btn) {
    flex: none;
    min-width: 128px;
  }
  @media (max-width: 719px) {
    .wl li > :global(.btn) {
      min-width: 112px;
    }
  }
  @media (min-width: 1000px) {
    .wl {
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 0 24px;
    }
    .wl li {
      align-content: space-between;
    }
    .wl li + li {
      border-top: 0;
    }
  }
  .alldone {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 24px;
    padding: 14px 18px;
    color: var(--ink-2);
  }
  .alldone :global(svg) {
    flex: none;
    color: var(--ok);
  }
  /* Impeccable: folded heads («More») and the row «Help»: one tap opens them, the chevron turns */
  .fold > .fsum {
    min-height: 44px;
    align-items: center;
    cursor: pointer;
    list-style: none;
  }
  .fold > .fsum::-webkit-details-marker {
    display: none;
  }
  .fold > .fsum :global(.fchev),
  .hfold :global(.fchev) {
    flex: none;
    color: var(--ink-3);
    transition: transform 0.18s ease-out;
  }
  .fold[open] > .fsum :global(.fchev),
  .hfold[open] :global(.fchev) {
    transform: rotate(180deg);
  }
  .fold:not([open]) {
    margin-bottom: 16px;
  }
  .hfold .sub {
    padding: 0 0 0 46px;
  }
  .hfold .sub > li {
    border-top: 1px solid var(--line);
  }
  @media (max-width: 419px) {
    .hfold .sub {
      padding-left: 12px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .fold > .fsum :global(.fchev),
    .hfold :global(.fchev) {
      transition: none;
    }
  }
  /* A phone: the language choice under its name, the whole width. */
  @media (max-width: 719px) {
    .lang > :global(.seg) {
      flex-basis: 100%;
    }
  }
</style>
