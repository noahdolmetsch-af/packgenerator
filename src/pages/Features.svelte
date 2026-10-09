<script>
  /**
   * What the app can do (v0.30.0, Noah 3a, #/features): every tip of Good to know by area, with ✓
   * for what is used (seen in the data, its button tapped, or "I know it") and how much of it that
   * is. Each row has the same ONE button as its tile on Today. Tips hidden with "I know it" stay here.
   * v0.35.0 (Noah): "New in the last updates" on top (know/WhatsNew.svelte, whatsnew.js).
   * v0.40.0 (Noah 9a): unused tips as rows with ›, used ones folded by area; the update list one row.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { overview, usedTips, TIPS_KEY } from '../lib/tips.js';
  import { HOME_PLACE } from '../lib/know.js';
  import { paceOf, PACE_KEY } from '../lib/pace.js';
  import { TEMPLATES_KEY } from '../lib/templates.js';
  import { SETS_KEY } from '../lib/sets.js';
  import { LAST_BACKUP } from '../lib/backup.js';
  import { demoState } from '../lib/demo.js';
  import { nextTrip } from '../lib/debrief.js';
  import { standalone } from '../lib/install.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn } from '../lib/i18n.svelte.js';
  import { Check, ChevronRight } from '@lucide/svelte';
  import { TIP_ICON } from '../lib/know/icons.js';
  import TipButton from '../lib/know/TipButton.svelte';
  import WhatsNew from '../lib/know/WhatsNew.svelte';

  const dataQ = liveQuery(async () => {
    const [trips, items, bikes, visits, debriefs, notesN, setting, file, folder, demo] = await Promise.all([
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
    ]);
    const [tips, home, pace, tpl, sets] = setting.map((r) => r?.value ?? null);
    return { trips, items, bikes, visits, debriefs, notesN, tips, homePlace: home, pace: paceOf(pace), templates: tpl ?? [], sets: sets ?? [], lastBackup: file?.at ?? folder?.lastWrite ?? null, demo };
  });
  const langSet = (() => {
    try {
      return localStorage.getItem('lang') != null;
    } catch {
      return false;
    }
  })();
  const d = $derived($dataQ);
  const used = $derived(d ? usedTips({ ...d, langSet, standalone: standalone() }) : new Set());
  const all = $derived(d ? overview(d.tips, used) : null);
  const next = $derived(d ? nextTrip(d.trips, localDay()) : null);
  // v0.40.0 (Noah 9a): the unused tips as rows (the first SHOWN, then "+ n more"), the used ones by area.
  const SHOWN = 6;
  let allOpen = $state(false);
  const unused = $derived(all ? all.groups.flatMap((g) => g.tips.filter((x) => !x.used)) : []);
  const unusedIdx = (x) => unused.indexOf(x);
  const usedGroups = $derived(all ? all.groups.map((g) => ({ ...g, used: g.tips.filter((x) => x.used) })).filter((g) => g.used.length) : []);
</script>

{#snippet tipRow(x)}
  {@const Icon = TIP_ICON[x.icon]}
  <li data-feature={x.id} class:used={x.used} class:later={!x.used && unusedIdx(x) >= SHOWN && !allOpen}>
    <TipButton id={x.id} {next} cls="lrow tiprow">
      <span class="ic" aria-hidden="true"><Icon size={18} strokeWidth={2} /></span>
      <span class="m"><span class="t">{t(x.title)}</span><span class="s">{t(x.text)}</span></span>
      {#if x.used}<span class="state"><Check size={15} strokeWidth={3} aria-hidden="true" /><span class="sr">{x.known ? t('You know it') : t('Used|tips')}</span></span>{/if}
      <ChevronRight class="chev" size={18} aria-hidden="true" />
    </TipButton>
  </li>
{/snippet}

<div class="feat">
  <!-- v0.40.0 (Noah 9a): what you have not used yet as rows; what you use folded by area (1.5 phone
       screens instead of 9). Every tip keeps its one action: a tap on the row starts it. -->
  <h1 class="title">{t('What the app can do')}</h1>
  {#if all}<p class="page-sub"><span class="num">{t('{n} of {total} used', { n: all.used, total: all.total })}</span></p>{/if}
  <!-- v0.35.0 (Noah): what is new in the last versions; v0.40.0: one row, folded. -->
  <WhatsNew />
  {#if all}
    {#if unused.length}
      <section class="grp" aria-labelledby="f-unused">
        <h2 class="sec-head" id="f-unused"><span>{t('Not used yet')}</span><span class="n">{unused.length}</span></h2>
        <ul class="rowlist">
          {#each unused as x (x.id)}{@render tipRow(x)}{/each}
          {#if unused.length > SHOWN && !allOpen}
            <li><button type="button" class="lrow morerow" onclick={() => (allOpen = true)}>{tn(unused.length - SHOWN, '+ {n} more', '+ {n} more')}</button></li>
          {/if}
        </ul>
      </section>
    {/if}
    {#if usedGroups.length}
      <section class="grp" aria-labelledby="f-used">
        <h2 class="sec-head" id="f-used"><span>{t('Already used')}</span><span class="n">{all.used}</span></h2>
        <ul class="rowlist">
          {#each usedGroups as g (g.key)}
            <li>
              <details class="area" data-group={g.key}>
                <summary class="lrow">
                  <span class="m"><span class="t">{t(g.label)}</span><span class="s">{g.used.map((x) => t(x.title)).join(' · ')}</span></span>
                  <span class="v num">{g.used.length} ✓</span>
                  <ChevronRight class="chev" size={18} aria-hidden="true" />
                </summary>
                <ul class="inner">{#each g.used as x (x.id)}{@render tipRow(x)}{/each}</ul>
              </details>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  {/if}
</div>

<style>
  .feat {
    max-width: 880px;
    margin: 0 auto;
  }
  .grp :global(.sec-head) {
    margin-top: 16px;
  }
  .grp li.later {
    display: none;
  }
  :global(.lrow.tiprow) {
    width: 100%;
  }
  .state {
    flex: none;
    display: inline-flex;
    color: var(--ok);
  }
  .morerow {
    justify-content: center;
    color: var(--ink-3);
    font-size: 14px;
  }
  .area > summary {
    list-style: none;
  }
  .area > summary::-webkit-details-marker {
    display: none;
  }
  .area[open] > summary {
    background: var(--paper-2);
  }
  .inner {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .inner > li {
    border-top: 1px solid var(--line);
  }
</style>
