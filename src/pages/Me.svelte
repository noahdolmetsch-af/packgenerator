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
  import { Leaf, HeartHandshake, Globe, Palette, House, Inbox, NotebookPen, Database, Info, Lightbulb, Keyboard, ChevronRight, ChevronDown, Sparkles, Archive, FlaskConical, TriangleAlert, Star, ListChecks, ClipboardList, History, CreditCard, Hand, BookOpen, LayoutGrid, Compass, ListTree, CircleHelp, Check, Bell, ListTodo, SlidersHorizontal, FileText, Scale, CalendarCheck, CalendarDays, BellRing, Mail, Backpack, Link2, Wrench, ExternalLink, CalendarClock, FolderOpen, Images, Target, ShieldCheck, GraduationCap, ShoppingCart, MessageCircle, Search as SearchIcon } from '@lucide/svelte';
  import { wide } from '../lib/media.svelte.js';
  import QuickLinks from '../lib/ui/QuickLinks.svelte';
  import { WHATS_NEW, shortVersion, newerThan, BEFORE } from '../lib/whatsnew.js';
  import NewsBanner from '../lib/know/NewsBanner.svelte';
  import StravaConnect from '../lib/strava/StravaConnect.svelte';
  import { messageOn } from '../lib/know/wasneu.js';
  import { readUpdate, readMute } from '../lib/know/wasneuStore.js';
  import { helper, isSetUp, isPaused, noCredit } from '../lib/helper/client.svelte.js';
  import { testDataState } from '../lib/testdatadb.js';
  import { PLAY_WISH, DAYS } from '../lib/play.js';
  import { take } from '../lib/nav.js';
  import { movedHint } from '../lib/visitprefill.js';
  import { localDay } from '../lib/localday.js';
  import { INTRO_KEY } from '../lib/home/introkt.js';
  import TestDataSheet from '../lib/testdata/TestDataSheet.svelte';
  import PlaySheet from '../lib/testdata/PlaySheet.svelte';
  import MaintenanceCard from '../lib/maintenance/MaintenanceCard.svelte';
  import { listBills, billsSummary } from '../lib/pay/bills.js';
  import { formatAmount } from '../lib/pay/qrbill.js';
  import Btn from '../lib/ui/Btn.svelte';
  import VersionRow from '../lib/ich/VersionRow.svelte';
  import '../lib/ich/ich.css';
  import { docs as docList } from '../lib/docs/client.svelte.js';
  import { dueCount } from '../lib/docs.js';
  import { agenda } from '../lib/agenda/client.svelte.js';
  // P3b (D3): how many documents expire soon (the yellow pill on «Documents»)
  const docDue = $derived(dueCount(docList.list, localDay()));
  // «Heute neu» A 5b (Noah 20.10.2026): the banner «New in …» after an update lives here under Ich, not on Heute
  let newsBanner = $state(
    (() => {
      try {
        const u = readUpdate();
        return messageOn({ update: u, mute: readMute(), today: localDay() }) ? newerThan(u.from ?? BEFORE) : [];
      } catch {
        return [];
      }
    })(),
  );
  import { weight } from '../lib/weight.svelte.js';
  import { latestOf } from '../lib/weight.js';
  import { SYNC_WISH, NUDGE_KEY, needsNudge } from '../lib/sync/nudge.js';

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
    const [notes, file, folder, n, demo, place, bikes, bills] = await Promise.all([db.notes.where('status').equals('open').count(), db.meta.get(LAST_BACKUP), db.meta.get('backupFolder'), db.items.count(), demoState(db), db.settings.get(HOME_PLACE), db.bikes.count(), listBills(db)]);
    const [cfg, nudge] = await Promise.all([db.meta.get('syncCfg'), db.meta.get(NUDGE_KEY)]);
    const last = [file?.at, folder?.lastWrite].filter(Boolean).sort().at(-1) ?? null;
    const due = backupDue(last);
    // Impeccable: what waits on top: the open bills. Keys with an end date never come here (Noah 20.10.2026
    // «nie im Front-End, höchstens unter Ich»): they show only in App maintenance below.
    return { inbox: notes, backup: n && !demo ? due.due : false, days: due.days, last, folder: !!folder?.name, home: place?.value?.name ?? '', demo: !!demo, play: !!demo?.play, bikes, bills: billsSummary(bills), sync: needsNudge({ items: n, demo: !!demo, cfg, nudge }) };
  });
  const testQ = liveQuery(() => testDataState(db));
  let tidyOpen = $state(false);
  // «Ausprobieren» (Noah 27.10.2026 «4a»): the wish may name the day of the example trip (play.js DAYS)
  const playWish = (v) => (DAYS.includes(v) ? v : v ? 'today' : null);
  let playDayWish = $state(playWish(take(PLAY_WISH)));
  let playOpen = $state(!!playDayWish);
  $effect(() => {
    const onPlay = () => {
      const d = playWish(take(PLAY_WISH));
      if (d) (playDayWish = d), (playOpen = true);
    };
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
  const dateShort = (day) => new Date(`${day}T12:00:00`).toLocaleDateString(lang.v === 'de' ? 'de-CH' : 'en-GB', { day: 'numeric', month: 'short' });
  const waits = $derived.by(() => {
    const w = $waitQ;
    if (!w) return [];
    const out = [];
    if (w.backup) out.push({ key: 'backup', icon: Database, text: w.days != null ? tn(w.days, 'Backup: the last one {n} day ago', 'Backup: the last one {n} days ago') : t('Backup: none yet'), sub: t('everything is only on this device'), label: t('Make a backup'), href: '#/me/data' });
    if (w.inbox) out.push({ key: 'inbox', icon: Inbox, text: tn(w.inbox, 'Inbox: {n} note to file', 'Inbox: {n} notes to file'), sub: t('Notes from on the way'), label: t('File'), href: '#/inbox' });
    if (w.bills.count) out.push({ key: 'bills', icon: CreditCard, text: tn(w.bills.count, 'Bills: {n} open', 'Bills: {n} open'), sub: `${formatAmount(w.bills.sum)} CHF${w.bills.next ? ` · ${t('due {date}', { date: dateShort(w.bills.next) })}` : ''}`, label: t('Open'), href: '#/me/pay/bills' });
    // Noah 19.10.2026 «1a»: while the sync is off, a line with «Switch on» (it opens Data and backup at «Phone and computer»)
    if (w.sync) out.push({ key: 'sync', icon: Link2, text: t('Sync phone and computer: off'), sub: t('New entries stay on this device'), label: t('Switch on'), onclick: openSync, skip: { label: t('Only one device'), onclick: hideSync } });
    return out;
  });
  function openSync() {
    try {
      localStorage.setItem(SYNC_WISH, '1');
    } catch {
      /* private mode: the page opens at the top */
    }
    location.hash = '#/me/data';
  }
  const hideSync = () => db.meta.put({ key: NUDGE_KEY, off: true, at: new Date().toISOString() });
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
  <!-- «332 Use Cases» (Noah 26.10.2026 «tastenkürzel (unter ich), was mir gut tut» sichtbar) -->
  <QuickLinks label={t('On this page')} links={[{ key: 'wohl', href: '#/me/wohl', label: t('What is good for me') }, { key: 'keys', onclick: () => window.dispatchEvent(new Event('pg:keys')), label: t('Keyboard shortcuts') }]} />

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
              {#if w.skip}<Btn kind="quiet" class="sm" label={w.skip.label} onclick={w.skip.onclick} data-wait-skip />{/if}
            </li>
          {/each}
        </ul>
      </section>
    {:else}
      <p class="card alldone" data-section="waiting"><Check size={18} aria-hidden="true" /><span>{t('All done.')}{lastLine ? ` ${lastLine}` : ''}</span></p>
    {/if}
  {/if}

  {#if newsBanner.length}<NewsBanner entries={newsBanner} onclose={() => (newsBanner = [])} />{/if}
  <!-- «Heute neu» A 5b: «Strava verbinden» lives here under Ich until connected or «Later» -->
  <StravaConnect wide={wide.matches} />
  <!-- «Mehr Inhalt» (Noah 15.10.2026, 1a–5a): the tip of the day, at the end the fold -->
  <HintCard page="me" />
  <TipLine page="me" name={t('Me|place')} />

  <div class="ich-cols">
    <div class="ich-main">
      <!-- UI-Ziele #6 (Noah 20.10.2026 «freigabe», 4a): Ich keeps data, settings and help. Freie Zeit, Alltag,
           Termine, Mail, Notizen, Eingang and Kompass are under Planen; Wi gaht's?, Erkenntnisse, Was mir gut tut
           and Gewicht under Auswerten; Material under Velos. One quiet line says where they went. -->
      <p class="card moved-to" role="note" data-me-moved><Info size={16} aria-hidden="true" /><span>{t('Looking for appointments, notes, the diary or the Inbox? They are under')} <a href="#/week">{t('Plan|place')}</a>{t('; your questions, insights and weight under')} <a href="#/auswerten">{t('Analysis|place')}</a>{t(', the gear under')} <a href="#/gear">{t('Bikes|place')}</a>. {t('The toolbox is a tab of')} <a href="#/me/tools">{t('Trips|place')}</a>{t(', Inspiration and your links are tabs of')} <a href="#/inspiration">{t('Plan|place')}</a>.</span></p>
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
            <!-- package G #155: every connection in one place (Strava, Fitbit, Google, lake), with its switches -->
            <a class="ich-row" href="#/me/connections" data-row="connections">
              <span class="ich-ib"><Link2 size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Connections')}</b><small>{t('Strava, Fitbit, Google, lake: state and switches')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- Paket P8 «Fotoalbum»: all photos of the app by month and place -->
            <a class="ich-row" href="#/me/album" data-row="album">
              <span class="ich-ib"><Images size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Photo album')}</b><small>{t('All photos by month and place')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- Paket D «Mit Freunden» (Noah 24.10.2026 «3b»): ask friends, the lending shelf, share a template -->
            <a class="ich-row" href="#/me/freunde" data-row="freunde">
              <span class="ich-ib"><HeartHandshake size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('With friends')}</b><small>{t('Ask friends, lending shelf, share a template')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- Mini-Tools (Noah 28.10.2026 «2a»): ask a group by link, the answers are counted -->
            <a class="ich-row" href="#/me/mini" data-row="minitools">
              <span class="ich-ib"><CalendarCheck size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Mini tools')}</b><small>{t('Find a date with others')}</small></span>
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
            <!-- Paket C «Ruhig und persönlich» (996 Ideen, Noah 24.10.2026 «5a»): workspace, calm view, letters, meaning -->
            <a class="ich-row" href="#/me/ruhig" data-row="ruhig">
              <span class="ich-ib"><Leaf size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Calm and personal')}</b><small>{t('Less app, letters to yourself, what you can do')}</small></span>
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
          <li>
            <a class="ich-row" href="#/helper">
              <span class="ich-ib"><Sparkles size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('AI helper')}</b><small>{helperState || t('Suggestions from Claude, only on request')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <a class="ich-row" href="#/me/suche" data-me-row="suche">
              <span class="ich-ib"><SearchIcon size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Search|page')}</b><small>{t('Speaking, and who answers in the search')}</small></span>
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
        </ul>
      </section>
    </div>

    <div class="ich-side">
      <section class="ich-sec" aria-labelledby="me-app-h">
        <div class="ich-h"><div><h2 id="me-app-h">{t('Help|me')}</h2></div></div>
        <ul class="card ich-list">
          <li>
            <a class="ich-row" href="#/features">
              <span class="ich-ib"><Info size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Help and functions')}</b><small>{t('What the app can do, handbook, keyboard shortcuts, how it decides')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <!-- «App verstehen» (Noah 26.10.2026 «unter ich - app verstehen»): seven lessons with links and exercises -->
            <a class="ich-row" href="#/me/verstehen" data-me-row="verstehen">
              <span class="ich-ib"><GraduationCap size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Understand the app')}</b><small>{t('Seven lessons: keep the app going yourself')}</small></span>
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
            <!-- «Neueste Version» (Noah 27.10.2026 «1-5 a»): this device's version, the online one, «Neueste laden» -->
            <VersionRow />
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
            <!-- Paket N #68 (19.10.2026), P7 (0.184.0): Ich › Projekt-Ablage, everything about the app on one page -->
            <a class="ich-row" href="#/me/next" data-row="next">
              <span class="ich-ib"><FolderOpen size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Project shelf')}</b><small>{t('Ideas, the way, what waits for you')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          
          
          <!-- «Suche mit Sprache und Antworten» (Noah 21.10.2026 «5b»): microphone and who answers in the search -->
          
          <!-- «Meine KI-Projekte» (Noah 19.10.2026 «2a»): own links to AI projects and chats -->
          
          
          
          
          
        </ul>
      </section>

      <!-- «App-Wartung» (Noah 13.10.2026, BF7 BF8): Strava's free limits and the monthly check -->
      <MaintenanceCard fold bind:open={maintOpen} />

      <!-- Impeccable: «More» folded; its head says what is inside -->
      <details class="ich-sec fold" bind:open={moreOpen}>
        <summary class="ich-h fsum"><div><h2 id="me-more-h">{t('More')}</h2><p class="ich-hs">{t('AI projects, try it out, test data')}</p></div><ChevronDown class="fchev" size={20} aria-hidden="true" /></summary>
        <ul class="card ich-list">
          <li>
            <a class="ich-row" href="#/me/ki-projekte" data-me-row="aiprojects">
              <span class="ich-ib"><MessageCircle size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('My AI projects')}</b><small>{t('Your own links to projects, threads and chats')}</small></span>
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
          <!-- Klick-Rundgang Q05 (Noah 22.10.2026 «3a»): «App verkaufen» is dropped, so Angebote, Velomech und Guide
               and Bezahlen are no longer listed here; the pages stay reachable by address and search. -->
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
  {#if playOpen}<PlaySheet running={!!$waitQ?.demo} day={playDayWish ?? 'today'} onclose={() => ((playOpen = false), (playDayWish = null))} />{/if}
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
  /* UI-Ziele #6: one quiet line where the moved rows went */
  .moved-to {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 0 0 var(--sp-4);
    padding: 10px 14px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .moved-to :global(svg) {
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
  .fold > .fsum :global(.fchev) {
    flex: none;
    color: var(--ink-3);
    transition: transform 0.18s ease-out;
  }
  .fold[open] > .fsum :global(.fchev) {
    transform: rotate(180deg);
  }
  .fold:not([open]) {
    margin-bottom: 16px;
  }
  @media (prefers-reduced-motion: reduce) {
    .fold > .fsum :global(.fchev) {
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
