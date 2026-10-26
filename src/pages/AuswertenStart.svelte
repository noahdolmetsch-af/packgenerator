<script>
  /**
   * «Aktiv neu» (Noah 22.10.2026, spec «Aktiv-Bereich: Beschreibung», «Aktiv ist zum Machen, Auswerten zum
   * Anschauen»): the start of the place «Auswerten» (#/auswerten). What was below «Heute abhaken» on the old
   * Aktiv start moved here: the form card on top, «Aktivitäten von heute», «Im Fokus», «Überblick» and «Letzte
   * 7 Tage» (Overview), «Wi gaht's?» with today's values and the 7 days, then the tip of the day, the cards
   * Ideen, Meilensteine and Trophäen, «Das kann die App hier» and the tiles. The tabs above lead to the pages
   * (Form und Erholung, Körperwerte, Fahrten, Haken ausgewertet, …; lib/nav.js PLACE_TABS.analysis).
   */
  import { liveQuery } from 'dexie';
  import { Lightbulb, Trophy, Star, Sparkles, Mountain, ListChecks } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { averages, checkOf, FIXED } from '../lib/flowcheck.js';
  import { waitingThisMonth } from '../lib/kmbook.js';
  import { CHECK_HASH } from '../lib/strava/client.svelte.js';
  import Sec from '../lib/flow/kit/Sec.svelte';
  import MoreAktiv from '../lib/flow/kit/MoreAktiv.svelte';
  import Overview from '../lib/flow/garmin/Overview.svelte';
  import FormCard from '../lib/flow/form/FormCard.svelte';
  import TipLine from '../lib/pageinfo/TipLine.svelte';
  import PageMore from '../lib/pageinfo/PageMore.svelte';
  import PinnedLists from '../lib/merken/PinnedLists.svelte';
  import PageTiles from '../lib/sk/PageTiles.svelte';
  import { localDay } from '../lib/localday.js';
  import { t, tn, lang } from '../lib/i18n.svelte.js';

  const today = localDay();
  const q = liveQuery(async () => {
    const [checks, kmBook] = await Promise.all([db.flowChecks.toArray(), db.kmBook.toArray()]);
    return { checks, kmBook };
  });
  const data = $derived($q);
  // 0.136.0: Strava rides of this month without a bike wait in «Zum Prüfen» and count after «Passt»
  const kmWaiting = $derived(waitingThisMonth(data?.kmBook ?? [], today));
  /* WG: the daily check is «Wi gaht's?»; here today's values and the mean of 7 days */
  const check = $derived(checkOf(data?.checks.find((c) => c.day === today), today));
  const known = $derived(FIXED.some((f) => check[f.key] != null));
  const avg = $derived(averages(data?.checks ?? [], today, 7));
  const n1 = (v) => (v == null ? '–' : v.toLocaleString(lang.v === 'de' ? 'de-DE' : 'en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
  const pages = [
    { key: 'ideas', href: '#/flow/ideen', icon: Lightbulb, title: t('Ideas'), sub: t('for your balance') },
    { key: 'milestones', href: '#/flow/milestones', icon: Star, title: t('Milestones'), sub: t('every sport, step by step') },
    { key: 'trophies', href: '#/flow/trophies', icon: Trophy, title: t('Trophies'), sub: t('what you reached') },
    // «332 Use Cases» (Noah 24.10.2026 «2b»): the pages that were only tabs behind «Alle 11»
    { key: 'impulse', href: '#/flow/impulse', icon: Sparkles, title: t('Impulses'), sub: t('small ideas to start') },
    { key: 'gipfel', href: '#/flow/gipfelbuch', icon: Mountain, title: t('Summit book'), sub: t('passes and summits reached') },
    { key: 'ticks', href: '#/flow/auswertung', icon: ListChecks, title: t('Ticks evaluated|tab'), sub: t('your ticks and answers') },
  ];
</script>

<div class="aus" data-page="auswerten">
  <header class="ph">
    <h1 class="title">{t('Analysis|place')}</h1>
    <p class="sub">{t('Here you look at how you are: form, body values, rides and what you ticked. To tick off, go to Active.')}</p>
  </header>
  <!-- «Form und Erholung» (Noah 20.10.2026 «2b 3a»): the readiness of today, on top -->
  <FormCard {today} />
  <div class="lay">
    <div class="col">
      <!-- Garmin-Übersicht (Noah 20.10.2026 «1:1 nachbauen»): today, «Im Fokus», «Überblick» and «Letzte 7 Tage» -->
      <Overview {today}>
        {#if kmWaiting}<a class="kmwait" href={CHECK_HASH} data-km-waiting>{tn(kmWaiting, '{n} Strava ride without a bike waits in «To check»: it counts after «Fits»', '{n} Strava rides without a bike wait in «To check»: they count after «Fits»')} ›</a>{/if}
      </Overview>
    </div>
    <aside class="col">
      <Sec id="chk-h" title={t('Your questions')} sub={t('sleep, energy and mood · one tap per question')} more={{ href: '#/me/history', label: t('History') }}>
        <div class="card">
          {#if known}
            <div class="crow done" data-check-row="done">
              <span class="ct"><b>{t('Today|values')}</b><small>{FIXED.map((f) => `${t(f.short)} ${check[f.key] ?? '–'}`).join(' · ')}</small></span>
              <a class="btn" href="#/me/abfragen">{t('Change')}</a>
            </div>
          {:else}
            <div class="crow" data-check-row="open">
              <span class="ct"><b>{t('Still open today')}</b></span>
              <!-- 20.10.2026 (Noah: «Was startet das überhaupt?»): «Start» opens the questions themselves -->
              <a class="btn hi" href="#/check/morning" data-check-start>{t('Start|check')}</a>
            </div>
          {/if}
          {#if FIXED.some((f) => avg[f.key].mean != null)}<p class="avg num">{t('⌀ 7 days')}: {FIXED.map((f) => `${t(f.short)} ${n1(avg[f.key].mean)}`).join(' · ')}</p>{/if}
          <ul class="why" data-check-why>
            <li><b>{t('Why|check')}</b> {t('a few seconds a day show you over weeks what does you good.')}</li>
            <li><b>{t('Your data|check')}</b> {t('stays on your devices; nobody else sees it.')}</li>
            <li><b>{t('Where you see it')}</b> <a href="#/me/history">{t('in the history')}</a>, <a href="#/me/insights">{t('in your insights')}</a> {t('and in the Rückblick of a trip.')}</li>
          </ul>
        </div>
      </Sec>
    </aside>
  </div>
  <TipLine page="aktiv" name={t('Analysis|place')} />
  <MoreAktiv items={pages} />
  <PageMore page="aktiv" name={t('Analysis|place')} />
  <PinnedLists place="active" />
  <PageTiles page="flow" />
</div>

<style>
  .aus {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 1240px;
    margin: 0 auto;
    min-width: 0;
  }
  .ph .sub {
    margin: var(--sp-1) 0 0;
    color: var(--ink-3);
    font: 400 var(--fs-body) / 1.45 var(--font-body);
  }
  .lay {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-5);
    align-items: start;
  }
  @media (min-width: 1000px) {
    .lay {
      grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
    }
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    min-width: 0;
  }
  .kmwait {
    display: block;
    margin-top: 6px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .crow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
  }
  .ct {
    flex: 1 1 160px;
    min-width: 0;
    line-height: 1.35;
  }
  .ct b {
    display: block;
    font-weight: 500;
  }
  .ct small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .avg {
    margin: var(--sp-3) 0 0;
    padding-top: var(--sp-2);
    border-top: 1px solid var(--line);
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .why {
    display: grid;
    gap: 4px;
    margin: var(--sp-3) 0 0;
    padding: var(--sp-2) 0 0;
    border-top: 1px solid var(--line);
    list-style: none;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
  .why b {
    color: var(--ink);
    font-weight: 600;
  }
  .why a {
    color: var(--ink);
  }
  @media (max-width: 719px) {
    .aus {
      padding-bottom: 72px;
    }
  }
</style>
