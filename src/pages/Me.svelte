<script>
  /**
   * v0.71.0 «Fünf Orte» 1 (Noah 10.10.2026, all a): «Ich», top right on every page, took the place of
   * the menu «More». First what you set for yourself (language, light or dark, colour world), then the
   * places of the app: home place, Inbox, notes, your data, what the app can do and has learned, help
   * and keyboard shortcuts. Numbers only where something waits (the Inbox, «Backup due»).
   * The helper (KI-Helfer) shows here once it is switched on (Noah O2.1a: what is not built is hidden).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { LAST_BACKUP, backupDue } from '../lib/backup.js';
  import { demoState } from '../lib/demo.js';
  import { HOME_PLACE } from '../lib/know.js';
  import { openData } from '../lib/nav.js';
  import { t, lang, setLang } from '../lib/i18n.svelte.js';
  import { theme, PALETTES, MODES, setPalette, setMode } from '../lib/theme.svelte.js';
  import PageHead from '../lib/ui/PageHead.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import HomePlaceForm from '../lib/know/HomePlaceForm.svelte';
  import { Globe, SunMoon, Palette, House, Inbox, NotebookPen, Database, Info, Lightbulb, Keyboard, ChevronRight } from '@lucide/svelte';

  const waitQ = liveQuery(async () => {
    const [notes, file, folder, n, demo, place] = await Promise.all([db.notes.where('status').equals('open').count(), db.meta.get(LAST_BACKUP), db.meta.get('backupFolder'), db.items.count(), demoState(db), db.settings.get(HOME_PLACE)]);
    const last = [file?.at, folder?.lastWrite].filter(Boolean).sort().at(-1) ?? null;
    return { inbox: notes, backup: n && !demo ? backupDue(last).due : false, home: place?.value?.name ?? '' };
  });
  let placeOpen = $state(false);
  const keys = () => window.dispatchEvent(new Event('pg:keys'));
  const version = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '';
</script>

<div class="me">
  <PageHead title={t('Me|place')} text={t('Settings and the app, only on this device')} />

  <section class="grp" aria-label={t('Settings')}>
    <div class="row set">
      <Globe size={20} aria-hidden="true" />
      <span class="nm" id="me-lang">{t('Language')}</span>
      <Seg labelledby="me-lang" full={false} value={lang.v} options={[{ key: 'de', name: 'Deutsch' }, { key: 'en', name: 'English' }]} onchange={setLang} />
    </div>
    <div class="row set">
      <SunMoon size={20} aria-hidden="true" />
      <span class="nm" id="me-mode">{t('Light or dark')}</span>
      <Seg labelledby="me-mode" full={false} value={theme.mode} options={MODES.map((m) => ({ key: m.key, name: t(m.name) }))} onchange={setMode} />
    </div>
    <div class="row set">
      <Palette size={20} aria-hidden="true" />
      <span class="nm" id="me-pal">{t('Colours')}</span>
      <Seg labelledby="me-pal" full={false} value={theme.palette} options={PALETTES.map((p) => ({ key: p.key, name: t(p.name) }))} onchange={setPalette} />
    </div>
  </section>

  <section class="grp" aria-label={t('The app')}>
    <ul>
      <li>
        <button type="button" class="row go" aria-expanded={placeOpen} onclick={() => (placeOpen = !placeOpen)}>
          <House size={20} aria-hidden="true" />
          <span class="nm">{t('Home place')}<small>{$waitQ?.home || t('Not set yet: for the weather of a ride from home')}</small></span>
          <ChevronRight class="chev" size={18} aria-hidden="true" />
        </button>
        {#if placeOpen}<div class="pf"><HomePlaceForm onchosen={() => (placeOpen = false)} /></div>{/if}
      </li>
      <li>
        <a class="row go" href="#/inbox">
          <Inbox size={20} aria-hidden="true" />
          <span class="nm">{t('Inbox')}<small>{t('Notes from on the way, to sort')}</small></span>
          {#if $waitQ?.inbox}<span class="badge num"><span class="sr">{t('{n} to sort', { n: $waitQ.inbox })}</span><span aria-hidden="true">{$waitQ.inbox}</span></span>{/if}
          <ChevronRight class="chev" size={18} aria-hidden="true" />
        </a>
      </li>
      <li>
        <a class="row go" href="#/notes">
          <NotebookPen size={20} aria-hidden="true" />
          <span class="nm">{t('Notes')}<small>{t('Kept notes, topics and checklists')}</small></span>
          <ChevronRight class="chev" size={18} aria-hidden="true" />
        </a>
      </li>
      <li>
        <button type="button" class="row go" onclick={openData}>
          <Database size={20} aria-hidden="true" />
          <span class="nm">{t('Data and backup')}<small>{t('Backup, restore, import')}</small></span>
          {#if $waitQ?.backup}<span class="badge warn">{t('Backup due')}</span>{/if}
          <ChevronRight class="chev" size={18} aria-hidden="true" />
        </button>
      </li>
      <li>
        <a class="row go" href="#/features">
          <Info size={20} aria-hidden="true" />
          <span class="nm">{t('What the app can do')}</span>
          <ChevronRight class="chev" size={18} aria-hidden="true" />
        </a>
      </li>
      <li>
        <a class="row go" href="#/debrief/learnings">
          <Lightbulb size={20} aria-hidden="true" />
          <span class="nm">{t('What the app has learned')}</span>
          <ChevronRight class="chev" size={18} aria-hidden="true" />
        </a>
      </li>
      <li>
        <button type="button" class="row go" onclick={keys} aria-haspopup="dialog">
          <Keyboard size={20} aria-hidden="true" />
          <span class="nm">{t('Help and keyboard shortcuts')}</span>
          <ChevronRight class="chev" size={18} aria-hidden="true" />
        </button>
      </li>
    </ul>
  </section>

  {#if version}<p class="ver num">{t('Version {v}', { v: version })} · {t('Data only on this device')}</p>{/if}
</div>

<style>
  .me {
    max-width: 680px;
  }
  .grp {
    margin: 0 0 var(--sp-4);
    padding: var(--sp-2) var(--sp-4);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li + li,
  .set + .set {
    border-top: 1px solid var(--line);
  }
  .row {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    width: 100%;
    min-height: 52px;
    padding: var(--sp-2) 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: 400 var(--fs-body) var(--font-body);
    text-align: left;
    text-decoration: none;
  }
  .row > :global(svg:first-child) {
    flex: none;
    color: var(--ink-2);
  }
  .set {
    flex-wrap: wrap;
  }
  /* A phone: the choice under its name, the whole width. */
  @media (max-width: 719px) {
    .set > :global(.seg) {
      flex-basis: 100%;
    }
  }
  .go {
    cursor: pointer;
  }
  .go:hover .nm {
    text-decoration: underline;
  }
  .nm {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .nm small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .row :global(.chev) {
    flex: none;
    color: var(--ink-3);
  }
  .badge {
    flex: none;
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--hi-soft);
    color: var(--badge-ink);
    font: 600 var(--fs-small) / 1.5 var(--font-body);
  }
  .badge.warn {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .pf {
    padding: 0 0 var(--sp-3);
  }
  .ver {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    text-align: center;
  }
</style>
