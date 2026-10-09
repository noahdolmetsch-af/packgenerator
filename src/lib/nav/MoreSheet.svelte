<script>
  /**
   * v0.38.0 (Noah 11a, 12a, 13a): "More", top right on every page (it took the place of the profile
   * icon). The rarer pages in four light groups: Plan, Look back, Gear, App. The Inbox lives here,
   * its count shows on the "More" button. Numbers only where something waits: the Inbox and "Backup
   * due". On a phone a sheet from below, on a computer a panel under the bar in four columns.
   * Each page of the app is in exactly one menu (nav/menu.js); the search finds them too.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { LAST_BACKUP, backupDue } from '../backup.js';
  import { demoState } from '../demo.js';
  import { openData } from '../nav.js';
  import { MORE_GROUPS } from './menu.js';
  import { phone } from '../media.svelte.js';
  import { t, lang, setLang } from '../i18n.svelte.js';
  import { FileText, Layers, CalendarCheck, BookOpen, GitCompareArrows, Gauge, Star, Inbox, HardDriveDownload, Sparkles, Shirt, ChartColumn } from '@lucide/svelte';

  let { open = $bindable(false), inbox = 0, current = '' } = $props();

  const ICON = { file: FileText, layers: Layers, calendar: CalendarCheck, book: BookOpen, compare: GitCompareArrows, gauge: Gauge, star: Star, shirt: Shirt, inbox: Inbox, data: HardDriveDownload, sparkles: Sparkles, chart: ChartColumn };

  // "Backup due" (the same rule as Today's line): only with items and no demo running.
  const backupQ = liveQuery(async () => {
    const [file, folder, n, demo] = await Promise.all([db.meta.get(LAST_BACKUP), db.meta.get('backupFolder'), db.items.count(), demoState(db)]);
    const last = [file?.at, folder?.lastWrite].filter(Boolean).sort().at(-1) ?? null;
    return n && !demo ? backupDue(last).due : false;
  });

  let dialog = $state();
  $effect(() => {
    if (open && dialog && !dialog.open) dialog.showModal();
    if (!open && dialog?.open) dialog.close();
  });
  const close = () => (open = false);
  // A tap on the dimmed page behind the panel closes it.
  const backdrop = (e) => e.target === dialog && close();
  function data() {
    close();
    openData();
  }
</script>

<dialog class="sheet more" class:phone={phone.matches} bind:this={dialog} onclose={() => (open = false)} onclick={backdrop} aria-labelledby="more-h">
  <div class="mh">
    <h2 id="more-h" class="title">{t('More')}</h2>
    <button type="button" class="btn sm" onclick={close}>{t('Close')}</button>
  </div>
  <div class="groups">
    {#each MORE_GROUPS as g (g.key)}
      <section class="grp" aria-labelledby="more-g-{g.key}">
        <h3 id="more-g-{g.key}" class="gh">{t(g.name)}</h3>
        <ul>
          {#each g.rows as r (r.id)}
            {@const Icon = ICON[r.icon]}
            <li>
              {#if r.action === 'data'}
                <button type="button" class="row" onclick={data}><Icon size={20} aria-hidden="true" /><span class="nm">{t(r.title)}</span>{#if $backupQ}<span class="badge">{t('Backup due')}</span>{/if}</button>
              {:else}
                <a class="row" href={r.href} aria-current={current === r.href ? 'page' : undefined} onclick={close}>
                  <Icon size={20} aria-hidden="true" /><span class="nm">{t(r.short ?? r.title)}</span>
                  {#if r.id === 'inbox' && inbox}<span class="badge num" aria-label={t('Inbox, {n} to sort', { n: inbox })}>{inbox}</span>{/if}
                </a>
              {/if}
            </li>
          {/each}
          {#if g.key === 'app'}
            <!-- v0.20.0: German or English, remembered on this device (v0.23.1, Noah 1b: in the menu). -->
            <li class="lang-row">
              <span id="lang-lbl">{t('Language')}</span>
              <span class="lang" role="group" aria-labelledby="lang-lbl">
                <button type="button" aria-pressed={lang.v === 'de'} onclick={() => setLang('de')} lang="de" title="Deutsch">DE</button>
                <button type="button" aria-pressed={lang.v === 'en'} onclick={() => setLang('en')} lang="en" title="English">EN</button>
              </span>
            </li>
          {/if}
        </ul>
      </section>
    {/each}
  </div>
</dialog>

<style>
  /* Computer: a panel under the bar, top right, four columns. */
  .more {
    margin: 72px var(--gut) auto auto;
    width: min(1100px, calc(100vw - 2 * var(--gut)));
    max-height: calc(100vh - 96px);
    padding: 16px 24px 20px;
  }
  .mh {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 4px;
  }
  .mh h2 {
    font-size: var(--fs-sub);
  }
  .groups {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0 28px;
  }
  .gh {
    margin: 12px 0 0;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--line);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    color: var(--ink-3);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    border-bottom: 1px solid var(--line);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 48px;
    padding: 8px 2px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 400 16px var(--font-body);
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }
  .row :global(svg) {
    flex: none;
    color: var(--ink-2);
  }
  .row:hover,
  .row:focus-visible {
    background: var(--paper-2);
  }
  .row[aria-current='page'] {
    font-weight: 600;
  }
  .nm {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  /* Small and neutral: something waits here. */
  .badge {
    flex: none;
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--paper-2);
    border: 1px solid var(--line);
    color: var(--ink);
    font: 600 13px/1.5 var(--font-body);
  }
  .lang-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 52px;
    border-bottom: 0;
    font-size: 16px;
  }
  .lang {
    display: flex;
    border: 1.5px solid var(--line-strong);
    border-radius: 8px;
    overflow: hidden;
  }
  .lang button {
    min-width: 48px;
    min-height: 44px;
    padding: 0 8px;
    border: 0;
    background: var(--paper);
    color: var(--ink);
    font: 600 15px var(--font-body);
    cursor: pointer;
  }
  .lang button[aria-pressed='true'] {
    background: var(--ink);
    color: var(--paper);
  }
  /* Phone: a sheet from below, one column. */
  .more.phone {
    margin: auto 0 0;
    width: 100vw;
    max-width: 100vw;
    max-height: 88vh;
    border-radius: 16px 16px 0 0;
    padding: 14px var(--gut) calc(16px + env(safe-area-inset-bottom));
  }
  .more.phone .groups {
    grid-template-columns: minmax(0, 1fr);
  }
  @media (max-width: 1000px) {
    .groups {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
