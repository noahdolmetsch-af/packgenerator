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
  import { Globe, Palette, House, Inbox, NotebookPen, Database, Info, Lightbulb, Keyboard, ChevronRight, Sparkles, Archive, FlaskConical, TriangleAlert, Star, ListChecks } from '@lucide/svelte';
  import { WHATS_NEW, shortVersion } from '../lib/whatsnew.js';
  import { helper, isSetUp, isPaused } from '../lib/helper/client.svelte.js';
  import { testDataState } from '../lib/testdatadb.js';
  import { PLAY_WISH } from '../lib/play.js';
  import { take, openNew } from '../lib/nav.js';
  import TestDataSheet from '../lib/testdata/TestDataSheet.svelte';
  import PlaySheet from '../lib/testdata/PlaySheet.svelte';
  import '../lib/ich/ich.css';

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
  // v0.118.0 «KI-Helfer ausblenden» (K4): off by default; the row says where to switch it on
  const helperState = $derived(!helper.loaded ? '' : !helper.show ? t('off · switch on under Me › AI helper') : !isSetUp() ? t('on · not set up') : isPaused() ? t('paused until next month') : t('on|helper'));
  const version = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '';
  const sub = $derived([t('Settings and the app, only on this device'), version ? t('Version {v}', { v: version }) : ''].filter(Boolean).join(' · '));
  const dataLine = $derived([t('Backup, restore, import'), $waitQ?.folder ? t('auto-backup set up') : ''].filter(Boolean).join(' · '));
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
        </ul>
      </section>

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
          {#if $waitQ?.bikes}
            <li>
              <!-- the same window as Velo › Pflege › «Report a problem» and «Neu» › «Problem with a bike» -->
              <button type="button" class="ich-row" onclick={() => openNew('problem')} aria-haspopup="dialog">
                <span class="ich-ib"><TriangleAlert size={18} aria-hidden="true" /></span>
                <span class="ich-m"><b>{t('Report a problem')}</b><small>{t('Noise, play, damage')}</small></span>
                <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
              </button>
            </li>
          {/if}
        </ul>
      </section>
    </div>
  </div>

  {#if tidyOpen}<TestDataSheet onclose={() => (tidyOpen = false)} />{/if}
  {#if playOpen}<PlaySheet running={!!$waitQ?.demo} onclose={() => (playOpen = false)} />{/if}
  {#if placeOpen}<HomePlaceSheet current={$waitQ?.home || null} onclose={() => (placeOpen = false)} />{/if}
</div>

<style>
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
