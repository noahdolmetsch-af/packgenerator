<script>
  /**
   * What the app can do (v0.30.0, Noah 3a, #/features): every tip of Good to know by area, with ✓
   * for what is used (seen in the data, its button tapped, or "I know it") and how much of it that
   * is. Each row has the same ONE button as its tile on Today. Tips hidden with "I know it" stay here.
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
  import { t } from '../lib/i18n.svelte.js';
  import { Check } from '@lucide/svelte';
  import { TIP_ICON } from '../lib/know/icons.js';
  import TipButton from '../lib/know/TipButton.svelte';

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
</script>

<div class="feat">
  <p class="back"><a href="#/">← {t('Today|place')}</a></p>
  <h1 class="title big">{t('What the app can do')}</h1>
  {#if all}
    <div class="prog">
      <p><b class="num">{t('{n} of {total} used', { n: all.used, total: all.total })}</b> · {t('✓ = seen in your data, tapped, or "I know it".')}</p>
      <div class="bar" role="progressbar" aria-label={t('What the app can do')} aria-valuemin="0" aria-valuemax={all.total} aria-valuenow={all.used}><i style:width="{Math.round((all.used / all.total) * 100)}%"></i></div>
    </div>
    <div class="groups">
      {#each all.groups as g (g.key)}
        <section class="grp" aria-labelledby="f-{g.key}">
          <h2 id="f-{g.key}">{t(g.label)}</h2>
          <ul>
            {#each g.tips as x (x.id)}
              {@const Icon = TIP_ICON[x.icon]}
              <li data-feature={x.id} class:used={x.used}>
                <span class="ico" aria-hidden="true"><Icon size={22} strokeWidth={2} /></span>
                <div class="txt">
                  <b>{t(x.title)}</b>
                  <span class="say">{t(x.text)}</span>
                  <span class="state">{#if x.used}<Check size={16} strokeWidth={3} aria-hidden="true" />{x.known ? t('You know it') : t('Used|tips')}{:else}{t('Not used yet')}{/if}</span>
                  <div class="acts"><TipButton id={x.id} {next}/></div>
                </div>
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    </div>
  {/if}
</div>

<style>
  .feat {
    max-width: 1360px;
    margin: 0 auto;
  }
  .big {
    font-size: var(--fs-page);
    line-height: var(--lh-title);
    margin: 0 0 6px;
  }
  .back {
    margin: 0 0 6px;
  }
  .back a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink);
  }
  .prog {
    margin: 0 0 20px;
    max-width: 640px;
  }
  .prog p {
    margin: 0 0 8px;
    color: var(--ink-2);
    overflow-wrap: anywhere;
  }
  .prog b {
    color: var(--ink);
  }
  .bar {
    height: 10px;
    border-radius: 99px;
    background: var(--paper-2);
    border: 1px solid var(--line);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    background: var(--ok);
  }
  .groups {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 400px), 1fr));
    gap: 20px;
    align-items: start;
  }
  .grp {
    padding: 16px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    min-width: 0;
  }
  .grp h2 {
    margin: 0 0 8px;
    font-size: var(--fs-section);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    display: flex;
    gap: 12px;
    padding: 12px 0;
    border-top: 1px solid var(--line);
  }
  li:first-child {
    border-top: 0;
  }
  .ico {
    flex: none;
    display: inline-flex;
    padding-top: 2px;
    color: var(--ink-3);
  }
  .txt {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    flex: 1;
  }
  .txt b {
    font-size: 17px;
    overflow-wrap: anywhere;
  }
  .say {
    font-size: 15px;
    color: var(--ink-2);
    overflow-wrap: anywhere;
  }
  .state {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  li.used .state {
    color: var(--ok);
    font-weight: 600;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
  }
</style>
