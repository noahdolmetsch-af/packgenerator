<script>
  /**
   * Paket C «Ruhig und persönlich»: the one quiet line on top of the pages (not on Heute, rule 11), only
   * when you started something yourself: the Ruhige Ansicht («You are doing: …», nothing else), else the
   * Arbeitsraum (its functions as chips), else a letter of yours whose moment came. Reads little: the
   * trips and the ride ledger only while a closed letter waits. Features load only for a workspace.
   */
  import { liveQuery } from 'dexie';
  import { Moon, Briefcase, Mail, X } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { SPACE_KEY, CALM_KEY, spaceOf, spaceActive, calmOf } from './weniger.js';
  import { LETTERS_KEY, lettersOf, dueLetters } from './spaeter.js';

  let { hash = '' } = $props();
  const today = localDay();
  const q = liveQuery(async () => {
    const [space, calm, letters] = await db.settings.bulkGet([SPACE_KEY, CALM_KEY, LETTERS_KEY]);
    const closed = lettersOf(letters?.value).filter((l) => !l.opened);
    let due = 0;
    if (closed.length) {
      const [trips, km] = await Promise.all([db.trips.toArray(), db.kmBook.toArray()]);
      const rideDays = [...new Set(km.filter((e) => e?.date && e.kind === 'ride' && e.state !== 'removed' && Number(e.km) > 0).map((e) => String(e.date).slice(0, 10)))].sort();
      due = dueLetters(closed, { trips, rideDays, today }).length;
    }
    return { space: spaceOf(space?.value), calm: calmOf(calm?.value), due };
  });
  const here = $derived(hash.startsWith('#/me/ruhig'));
  const space = $derived($q && spaceActive($q.space, today) ? $q.space : null);
  let names = $state({});
  $effect(() => {
    if (!space) return;
    import('../features.js').then(({ FEATURE, featureHref }) => {
      names = Object.fromEntries(space.ids.filter((id) => FEATURE[id]).map((id) => [id, { title: FEATURE[id].title, href: featureHref(FEATURE[id]) }]));
    });
  });
  // the calm view asks nothing: the «Soll ich dich erinnern?» card rests while it is on
  $effect(() => {
    const on = !!$q?.calm;
    if (on) document.documentElement.dataset.ruhe = '1';
    else delete document.documentElement.dataset.ruhe;
  });
  const endSpace = () => db.settings.put({ key: SPACE_KEY, value: JSON.parse(JSON.stringify({ ...space, on: false })) });
</script>

{#if $q?.calm}
  <div class="rhl calm" role="status" data-ruhig-line="calm">
    <Moon size={16} aria-hidden="true" />
    <span class="rhl-t">{t('You are doing')}: <b>{$q.calm.what}</b></span>
    {#if $q.calm.href && $q.calm.href !== hash}<a class="rhl-a" href={$q.calm.href}>{t('Open')}</a>{/if}
    <button type="button" class="rhl-x" onclick={() => db.settings.put({ key: CALM_KEY, value: null })} aria-label={t('Done|calm')}>{t('Done|calm')}</button>
  </div>
{:else if space}
  <div class="rhl" data-ruhig-line="space">
    <Briefcase size={16} aria-hidden="true" />
    <span class="rhl-t"><b>{space.name || t('Workspace')}</b></span>
    <nav class="rhl-chips" aria-label={t('Workspace')}>
      {#each space.ids as id (id)}{#if names[id]?.href}<a class="rhl-c" href={names[id].href} aria-current={names[id].href === hash ? 'page' : undefined}>{t(names[id].title)}</a>{/if}{/each}
    </nav>
    <button type="button" class="rhl-x icon" onclick={endSpace} aria-label={t('End the workspace')}><X size={16} aria-hidden="true" /></button>
  </div>
{:else if $q?.due && !here}
  <a class="rhl letter" href="#/me/ruhig/spaeter?open=letters" data-ruhig-line="letter">
    <Mail size={16} aria-hidden="true" />
    <span class="rhl-t">{t('A letter of yours is waiting for this moment')}</span>
  </a>
{/if}

<style>
  .rhl {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 var(--sp-3);
    padding: 6px 8px 6px 12px;
    min-height: 44px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    color: var(--ink);
    font-size: var(--fs-small);
    text-decoration: none;
  }
  .rhl.calm,
  .rhl.letter {
    background: var(--accent-soft);
    border-color: transparent;
  }
  .rhl-t {
    flex: none;
    max-width: 50%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .rhl.calm .rhl-t,
  .rhl.letter .rhl-t {
    flex: 1;
    max-width: none;
    white-space: normal;
  }
  .rhl-chips {
    flex: 1;
    min-width: 0;
    display: flex;
    gap: 6px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .rhl-c {
    flex: none;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid var(--line-strong);
    color: var(--ink);
    text-decoration: none;
    white-space: nowrap;
  }
  .rhl-c[aria-current='page'] {
    background: var(--accent-soft);
    border-color: var(--accent);
    font-weight: 600;
  }
  .rhl-a,
  .rhl-x {
    flex: none;
    min-height: 36px;
    padding: 4px 12px;
    border-radius: 999px;
    border: 1px solid var(--line-strong);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-decoration: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
  }
  .rhl-x.icon {
    width: 36px;
    padding: 0;
    justify-content: center;
    border-color: transparent;
    background: none;
  }
  :global(html[data-ruhe] .rmc) {
    display: none;
  }
</style>
