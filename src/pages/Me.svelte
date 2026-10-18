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
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { LAST_BACKUP, backupDue } from '../lib/backup.js';
  import { demoState } from '../lib/demo.js';
  import { HOME_PLACE } from '../lib/know.js';
  import { t, tn, lang, setLang } from '../lib/i18n.svelte.js';
  import { lookLine } from '../lib/theme.svelte.js';
  import Seg from '../lib/ui/Seg.svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import HomePlaceSheet from '../lib/ich/HomePlaceSheet.svelte';
  import { Globe, Palette, House, Inbox, NotebookPen, Database, Info, Lightbulb, Keyboard, ChevronRight, ChevronDown, Sparkles, Archive, FlaskConical, TriangleAlert, Star, ListChecks, ClipboardList, History, CreditCard, Hand, BookOpen, LayoutGrid, Compass, ListTree, KeyRound, CircleHelp, Check, Bell, ListTodo, SlidersHorizontal } from '@lucide/svelte';
  import { WHATS_NEW, shortVersion } from '../lib/whatsnew.js';
  import { helper, isSetUp, isPaused } from '../lib/helper/client.svelte.js';
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
  const helperState = $derived(!helper.loaded ? '' : !helper.show ? t('off · switch on under Me › AI helper') : !isSetUp() ? t('on · not set up') : isPaused() ? t('paused until next month') : t('on|helper'));
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
  const dataLine = $derived([t('Backup, restore, import'), $waitQ?.folder ? t('auto-backup set up') : ''].filter(Boolean).join(' · '));
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

  <div class="ich-cols">
    <div class="ich-main">
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
            <!-- «Inspiration» UC2-1: on a phone Ich › Inspiration (on a computer also in the sidebar) -->
            <a class="ich-row" href="#/inspiration">
              <span class="ich-ib"><Compass size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Inspiration')}</b><small>{t('Your own links, key words and notes')}</small></span>
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
            <!-- ER3 (Noah 14.10.2026 «er1-er3 freigabe», 4a): every reminder on one page -->
            <a class="ich-row" href="#/me/reminders">
              <span class="ich-ib"><Bell size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Reminders')}</b><small>{t('What the app reminds you of, and when it asks')}</small></span>
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
            <a class="ich-row" href="#/me/pay">
              <span class="ich-ib"><CreditCard size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Payments')} <span class="pill warn">{t('prepared|pay')}</span></b><small>{t('What is already there and what you could use it for')}</small></span>
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
