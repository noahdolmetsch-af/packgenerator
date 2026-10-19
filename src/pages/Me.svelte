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
  import Seg from '../lib/ui/Seg.svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import HomePlaceSheet from '../lib/ich/HomePlaceSheet.svelte';
  import { Globe, Palette, House, Inbox, NotebookPen, Database, Info, Lightbulb, Keyboard, ChevronRight, Sparkles, Archive, FlaskConical, TriangleAlert, Star, ListChecks, ClipboardList, History, CreditCard, Hand, BookOpen, LayoutGrid, Compass, ListTree, FileText, Scale, CalendarCheck, CalendarDays, BellRing, Mail } from '@lucide/svelte';
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
    const [notes, file, folder, n, demo, place, bikes] = await Promise.all([db.notes.where('status').equals('open').count(), db.meta.get(LAST_BACKUP), db.meta.get('backupFolder'), db.items.count(), demoState(db), db.settings.get(HOME_PLACE), db.bikes.count()]);
    const last = [file?.at, folder?.lastWrite].filter(Boolean).sort().at(-1) ?? null;
    const due = backupDue(last);
    return { inbox: notes, backup: n && !demo ? due.due : false, days: due.days, folder: !!folder?.name, home: place?.value?.name ?? '', demo: !!demo, play: !!demo?.play, bikes };
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
  const helperState = $derived(!helper.loaded ? '' : !helper.show ? t('off · switch on under Me › AI helper') : !isSetUp() ? t('on · not set up') : noCredit() ? t('credit used up · hidden|helper') : isPaused() ? t('paused until next month') : t('on|helper'));
  const version = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '';
  const sub = $derived([t('Settings and the app, only on this device'), version ? t('Version {v}', { v: version }) : ''].filter(Boolean).join(' · '));
  // TR6: the weight, voluntary, only for watts per kg
  const weightLine = $derived.by(() => {
    const w = latestOf(weight.entries);
    const day = w ? new Date(`${w.day}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'short' }) : '';
    return w ? t('{kg} kg · {day} · only on this device', { kg: num(w.kg), day }) : t('Voluntary, for watts per kg · only on this device');
  });
  const dataLine = $derived([t('Backup, restore, import'), $waitQ?.folder ? t('auto-backup set up') : ''].filter(Boolean).join(' · '));
  const agendaOn = $derived(agenda.prefs.calendar || agenda.prefs.tasks);
</script>

<div class="mepage ich-page">
  <VeloHead title={t('Me|place')} {sub} />

  {#if $waitQ?.backup}
    <!-- I1: on top only what is due -->
    <section class="ich-due" aria-labelledby="due-h">
      <div>
        <h2 id="due-h">{t('Backup due')}</h2>
        <p>{$waitQ.days != null ? tn($waitQ.days, 'last backup {n} day ago', 'last backup {n} days ago') : t('no backup yet')} · {t('everything is only on this device')}</p>
      </div>
      <a class="btn hi" href="#/me/data">{t('Make a backup')}</a>
    </section>
  {/if}

  <!-- «Mehr Inhalt» (Noah 15.10.2026, 1a–5a): the tip of the day, at the end the fold -->
  <HintCard page="me" />
  <TipLine page="me" name={t('Me|place')} />

  <div class="ich-cols">
    <div class="ich-main">
      <section class="ich-sec" aria-labelledby="me-data-h">
        <div class="ich-h"><div><h2 id="me-data-h">{t('Data')}</h2></div></div>
        <ul class="card ich-list">
          <li>
            <a class="ich-row" href="#/me/data">
              <span class="ich-ib"><Database size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Data and backup')}</b><small>{dataLine}</small></span>
              {#if $waitQ?.backup}<span class="pill warn duepill">{t('Backup due')}</span>{/if}
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
            <a class="ich-row" href="#/inbox">
              <span class="ich-ib"><Inbox size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Inbox')}</b><small>{$waitQ?.inbox ? `${t('{n} to sort', { n: $waitQ.inbox })} · ${t('Notes from on the way')}` : t('Notes from on the way, to sort')}</small></span>
              {#if $waitQ?.inbox}<span class="pill act num" aria-hidden="true">{$waitQ.inbox}</span>{/if}
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
        </ul>
      </section>

      <section class="ich-sec" aria-labelledby="me-set-h">
        <div class="ich-h"><div><h2 id="me-set-h">{t('Settings')}</h2></div></div>
        <ul class="card ich-list">
          <li>
            <!-- v0.97.0 Design-Refresh R1: font, colour world, text size and light or dark on their own page -->
            <a class="ich-row" href="#/me/look">
              <span class="ich-ib"><Palette size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Appearance')}</b><small>{lookLine(t)}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- v0.111.0 (mockup V4): the evening-before and after-trip check of every trip type -->
            <a class="ich-row" href="#/me/checks">
              <span class="ich-ib"><ListChecks size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Checks per trip type')}</b><small>{t('The evening before and after the trip')}</small></span>
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
            <!-- Handbuch + Kleine Apps (mockup HB2, Noah 14.10.2026 «1b 2b», «hb freigeben») -->
            <a class="ich-row" href="#/me/handbook">
              <span class="ich-ib"><BookOpen size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Handbook')}</b><small>{t('How to switch on every function, with an example')}</small></span>
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
            <!-- v0.134.0 «Listen und Typen» (LI1): the app's lists, changeable -->
            <a class="ich-row" href="#/me/lists">
              <span class="ich-ib"><ListTree size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Lists and types')}</b><small>{t('Rename, add, hide, order')}</small></span>
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
            <a class="ich-row" href="#/me/pay">
              <span class="ich-ib"><CreditCard size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Payments')} <span class="pill warn">{t('prepared|pay')}</span></b><small>{t('What is already there and what you could use it for')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
        </ul>
      </section>

      <!-- «App-Wartung» (Noah 13.10.2026, BF7 BF8): Strava's free limits and the monthly check -->
      <MaintenanceCard />

      <section class="ich-sec" aria-labelledby="me-more-h">
        <div class="ich-h"><div><h2 id="me-more-h">{t('More')}</h2></div></div>
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
        <!-- v0.125.0 A-J1: «Report a problem» left Me; for 30 days a quiet line says where it is now -->
        {#if $waitQ?.bikes && moved.show}
          <p class="moved" role="note"><TriangleAlert size={16} aria-hidden="true" /><span>{t('Looking for «Report a problem»? It is now under + New and at the bike:')} <a href="#/bikes?tab=care">{t('Bike care')}</a></span></p>
        {/if}
      </section>
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
    margin: 8px 4px 0;
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
  /* on a narrow phone the band on top already says it; the row keeps its words whole */
  @media (max-width: 419px) {
    .duepill {
      display: none;
    }
  }
  /* A phone: the language choice under its name, the whole width. */
  @media (max-width: 719px) {
    .lang > :global(.seg) {
      flex-basis: 100%;
    }
  }
</style>
