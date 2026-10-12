<script>
  /**
   * What the app can do (v0.30.0, #/features). v0.35.0: «New in the last updates» on top (WhatsNew).
   * v0.96.0 «F1 Alles finden» (Noah 11.10.2026, mockup A «1-5 a»): every function of the app
   * (features.js), in 6 groups by the situation you are in, or switched to 5 by the page it lives on
   * (Noah «1 a und b beides umstellbar», 11.10. «1-2 freigeben»). In each group what you never used
   * comes first, 4 rows («2 mit 4 zeilen»), «All n ›» opens the rest; used rows are quiet with ✓. Each row: «Take me there»
   * opens the place (or starts the action), «Try it» plays it in the playground without touching
   * your data. A search field and chips (wrapping on a phone) narrow the list. #/features?f=<id> opens at one function.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { usedTips, TIPS_KEY } from '../lib/tips.js';
  import { catalogue, seenOf, findFeatures, FEATURE_GROUPS, PAGE_GROUPS } from '../lib/features.js';
  import { goFeature } from '../lib/know/featureRun.js';
  import { HOME_PLACE } from '../lib/know.js';
  import { paceOf, PACE_KEY } from '../lib/pace.js';
  import { TEMPLATES_KEY } from '../lib/templates.js';
  import { SETS_KEY } from '../lib/sets.js';
  import { LAST_BACKUP } from '../lib/backup.js';
  import { demoState } from '../lib/demo.js';
  import { nextTrip } from '../lib/debrief.js';
  import { sortBikes } from '../lib/bikes.js';
  import { standalone } from '../lib/install.js';
  import { localDay } from '../lib/localday.js';
  import { t } from '../lib/i18n.svelte.js';
  import { Check, ChevronRight, Compass, Backpack, BookOpen, Bike, Leaf, Save, Search } from '@lucide/svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import TipButton from '../lib/know/TipButton.svelte';
  import WhatsNew from '../lib/know/WhatsNew.svelte';
  import PlaySheet from '../lib/testdata/PlaySheet.svelte';

  const GROUP_ICON = { compass: Compass, backpack: Backpack, book: BookOpen, bike: Bike, leaf: Leaf, save: Save };
  /** Rows shown per group before «All n ›». */
  const SHOWN = 4;

  const dataQ = liveQuery(async () => {
    const [trips, items, bikes, visits, debriefs, notesN, setting, file, folder, demo, counts] = await Promise.all([
      db.trips.toArray(),
      db.items.toArray(),
      db.bikes.toArray(),
      db.visits.toArray(),
      db.debriefs.toArray(),
      db.notes.count(),
      db.settings.bulkGet([TIPS_KEY, HOME_PLACE, PACE_KEY, TEMPLATES_KEY, SETS_KEY]),
      db.meta.get(LAST_BACKUP),
      db.meta.get('backupFolder'),
      demoState(db),
      Promise.all([db.rides.count(), db.events.count(), db.learnings.count(), db.kmBook.filter((r) => !!r.importId).count(), db.maintenance.count(), db.flowLog.count(), db.flowChecks.count(), db.flowStars.count(), db.flowSessions.count()]),
    ]);
    const [tips, home, pace, tpl, sets] = setting.map((r) => r?.value ?? null);
    const [rides, events, learnings, imports, problems, flowLog, flowChecks, flowStars, flowSessions] = counts;
    const n = { trips: trips.length, rides, events, learnings, imports, problems, visits: visits.length, flowLog, flowChecks, flowStars, flowSessions, notes: notesN };
    return { trips, items, bikes, visits, debriefs, notesN, tips, homePlace: home, pace: paceOf(pace), templates: tpl ?? [], sets: sets ?? [], lastBackup: file?.at ?? folder?.lastWrite ?? null, demo, counts: n, folder: !!folder };
  });
  const langSet = (() => {
    try {
      return localStorage.getItem('lang') != null;
    } catch {
      return false;
    }
  })();
  const d = $derived($dataQ);
  const used = $derived(d ? new Set([...usedTips({ ...d, langSet, standalone: standalone() }), ...seenOf({ counts: d.counts, folder: d.folder, play: !!d.demo?.play })]) : new Set());
  let by = $state('situation');
  const all = $derived(d ? catalogue(d.tips, used, by) : null);
  const next = $derived(d ? nextTrip(d.trips, localDay()) : null);
  const bikeId = $derived(d ? (sortBikes(d.bikes)[0]?.id ?? null) : null);

  // #/features?f=<id>: open at that function (from the search or a tip with a form of its own)
  const wanted = typeof location !== 'undefined' ? (location.hash.match(/[?&]f=([^&]+)/)?.[1] ?? null) : null;
  const wantId = wanted ? decodeURIComponent(wanted) : null;
  let q = $state('');
  let only = $state('all');
  let opened = $state({});
  let play = $state(null); // the day the playground starts on («Try it»)
  const hits = $derived(q.trim().length >= 2 ? new Set(findFeatures(q, t).map((x) => x.featureId)) : null);
  const groups = $derived(
    all
      ? all.groups
          .filter((g) => only === 'all' || g.key === only)
          .map((g) => ({ ...g, rows: hits ? g.items.filter((x) => hits.has(x.id)) : g.items }))
          .filter((g) => g.rows.length)
      : [],
  );
  // a computer with room: the news and «How to read the list» in a column on the right (mockup A)
  const sideQ = typeof window !== 'undefined' ? window.matchMedia('(min-width: 1180px)') : null;
  let sideOn = $state(sideQ?.matches ?? false);
  $effect(() => {
    const on = (e) => (sideOn = e.matches);
    sideQ?.addEventListener('change', on);
    return () => sideQ?.removeEventListener('change', on);
  });
  const isOpen = (g) => !!hits || only !== 'all' || !!opened[g.key] || (wantId != null && g.items.findIndex((x) => x.id === wantId) >= SHOWN);
  let scrolled = false; // once, when the list is there (not on every change of the data)
  $effect(() => {
    if (!all || !wantId || scrolled) return;
    scrolled = true;
    queueMicrotask(() => document.querySelector(`[data-feature="${CSS.escape(wantId)}"]`)?.scrollIntoView({ block: 'center' }));
  });
</script>

{#snippet row(x)}
  <li data-feature={x.id} class="frow" class:used={x.used} class:want={x.id === wantId}>
    <div class="fm">
      <span class="ft">{t(x.title)}</span>
      <span class="fs">{t(x.text)}</span>
      {#if x.used}
        <span class="fused"><Check size={14} strokeWidth={3} aria-hidden="true" />{t('Used|tips')}</span>
      {:else}
        <span class="pill warn fnever">{t('Never used|features')}</span>
      {/if}
    </div>
    <div class="fa">
      {#if x.tip}
        <TipButton id={x.tip} {next} cls="btn sm fgo">{t('Take me there')}<ChevronRight size={16} aria-hidden="true" /></TipButton>
      {:else}
        <button type="button" class="btn sm fgo" onclick={() => goFeature(x, { bikeId })}>{t('Take me there')}<ChevronRight size={16} aria-hidden="true" /></button>
      {/if}
      {#if x.play && !x.used && !d?.demo}
        <button type="button" class="ftry" onclick={() => (play = x.play)}>{t('Try it')}</button>
      {/if}
    </div>
  </li>
{/snippet}

<div class="feat">
  <!-- Design-Refresh P9 (I7 neu, Noah 12.10.2026 «Runde 20 freigegeben»: «Seite lassen wie sie ist, nur neues
       Design»): the path back to Ich, the same parts as before in the new style. -->
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('What the app can do')} sub={all ? t('{total} functions · you use {n}', { total: all.total, n: all.used }) : ''} />
  <div class="cols">
    <div class="mainc">
      <label class="ffind">
        <Search size={18} aria-hidden="true" />
        <input type="search" bind:value={q} placeholder={t('What do you want to do? e.g. «warranty»')} aria-label={t('Find a function')} autocomplete="off" />
      </label>
      {#if !sideOn}<WhatsNew />{/if}
      <!-- Noah «1 a und b beides umstellbar»: by situation or by the page a function lives on -->
      <div class="fby" role="group" aria-label={t('Sort')}>
        <button type="button" class="fbyb" aria-pressed={by === 'situation'} onclick={() => { by = 'situation'; only = 'all'; }}>{t('By situation')}</button>
        <button type="button" class="fbyb" aria-pressed={by === 'page'} onclick={() => { by = 'page'; only = 'all'; }}>{t('By page')}</button>
      </div>
      <div class="fchips" role="group" aria-label={by === 'page' ? t('Page|features') : t('Situation')}>
        <button type="button" class="fchip" aria-pressed={only === 'all'} onclick={() => (only = 'all')}>{t('All|features')}</button>
        {#each by === 'page' ? PAGE_GROUPS : FEATURE_GROUPS as g (g.key)}
          <button type="button" class="fchip" aria-pressed={only === g.key} onclick={() => (only = only === g.key ? 'all' : g.key)}>{t(g.label)}</button>
        {/each}
      </div>
      {#if all && !groups.length}
        <p class="fnone" role="status">{t('No function found for «{q}».', { q: q.trim() })}</p>
      {/if}
      <div class="fgrid">
        {#each groups as g (g.key)}
          {@const Icon = GROUP_ICON[g.icon]}
          {@const open = isOpen(g)}
          <section class="fgroup" data-group={g.key} aria-labelledby="fg-{g.key}">
            <header class="fgh">
              <span class="fgi" aria-hidden="true"><Icon size={20} /></span>
              <h2 id="fg-{g.key}">{t(g.label)}</h2>
              <span class="fgn num">{t('{n} of {total} used', { n: g.used, total: g.total })}</span>
            </header>
            <ul class="flist">
              {#each open ? g.rows : g.rows.slice(0, SHOWN) as x (x.id)}{@render row(x)}{/each}
            </ul>
            {#if !open && g.rows.length > SHOWN}
              <button type="button" class="fall" onclick={() => (opened = { ...opened, [g.key]: true })}>{t('All {n}|features', { n: g.rows.length })}<ChevronRight size={16} aria-hidden="true" /></button>
            {/if}
          </section>
        {/each}
      </div>
    </div>
    {#if sideOn}
    <aside class="side">
      <WhatsNew />
      <section class="howto" aria-labelledby="howto-h">
        <h2 id="howto-h">{t('How to read the list')}</h2>
        <p>{t('On top of each group is what you have never used. Used things are quiet, with ✓. «Take me there» opens the place in the app; «Try it» plays it in the playground without changing your data.')}</p>
      </section>
    </aside>
    {/if}
  </div>
</div>
{#if play}<PlaySheet running={!!d?.demo} kind="weekend" day={play} onclose={() => (play = null)} />{/if}

<style>
  .feat {
    max-width: 1200px;
    margin: 0 auto;
  }
  .cols {
    display: grid;
    gap: var(--sp-5);
  }
  .mainc {
    min-width: 0;
    display: grid;
    gap: var(--sp-3);
    align-content: start;
  }
  .side {
    display: grid;
    gap: var(--sp-3);
    align-content: start;
  }
  @media (min-width: 1180px) {
    .cols {
      grid-template-columns: minmax(0, 1fr) 320px;
    }
  }
  .ffind {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 48px;
    padding: 0 var(--sp-3);
    border: 1.5px solid var(--line-strong);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink-3);
  }
  .ffind:has(input:focus-visible) {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  .ffind input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--ink);
    font: 400 var(--fs-body) var(--font-body);
  }
  .fby {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .fbyb {
    min-height: 44px;
    padding: 0 var(--sp-4);
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-label) var(--font-body);
    cursor: pointer;
  }
  .fbyb[aria-pressed='true'] {
    background: var(--ink);
    color: var(--paper);
  }
  .fchips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .fchip {
    flex: none;
    min-height: 44px;
    padding: 0 var(--sp-3);
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .fchip[aria-pressed='true'] {
    background: var(--accent-soft);
    border-color: var(--accent-soft);
    color: var(--ink);
    font-weight: 600;
  }
  .fnone {
    margin: var(--sp-2) 0;
    color: var(--ink-3);
  }
  .fgrid {
    display: grid;
    gap: var(--sp-4);
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
    align-items: start;
  }
  .fgroup {
    min-width: 0;
    padding: var(--sp-4);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .fgh {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    padding-bottom: var(--sp-2);
    border-bottom: 1px solid var(--line);
  }
  .fgi {
    flex: none;
    display: inline-flex;
    color: var(--ink-2);
  }
  .fgh h2 {
    flex: 1;
    min-width: 0;
    margin: 0;
    font: 600 var(--fs-sub)/1.25 var(--font-body);
    overflow-wrap: break-word;
  }
  .fgn {
    flex: none;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .flist {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .frow {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: var(--sp-2) var(--sp-3);
    padding: var(--sp-3) 0;
    border-top: 1px solid var(--line);
  }
  .frow:first-child {
    border-top: 0;
  }
  .frow.want {
    background: var(--hi-soft);
  }
  .fm {
    flex: 1 1 12em;
    min-width: 0;
    display: grid;
    gap: 2px;
    justify-items: start;
  }
  .ft {
    font-weight: 500;
    line-height: 1.3;
    overflow-wrap: break-word;
  }
  .fs {
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.4;
    overflow-wrap: break-word;
  }
  .used .ft,
  .used .fs {
    color: var(--ink-3);
  }
  .fused {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .fnever {
    margin-top: 4px;
  }
  .fa {
    flex: none;
    display: grid;
    gap: 2px;
    justify-items: end;
  }
  .fa :global(.fgo) {
    min-height: 44px;
    border-color: var(--line);
    color: var(--ink);
    font-weight: 500;
  }
  .ftry {
    min-height: 44px;
    padding: 0 var(--sp-1);
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .fall {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-label) var(--font-body);
    cursor: pointer;
  }
  .howto {
    padding: var(--sp-4);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .howto h2 {
    margin: 0 0 var(--sp-2);
    font: 600 var(--fs-sub)/1.25 var(--font-body);
  }
  .howto p {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.5;
  }
</style>
