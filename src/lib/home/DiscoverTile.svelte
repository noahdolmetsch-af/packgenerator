<script>
  /**
   * «Heute als Begleiter» PR 5 (Noah 28.10.2026 «1a 2a 3a»): «Discover». One function that fits the moment and that you
   * never opened; «Try it», «Later» (back tomorrow) and «Not for me» (never again, with Undo). Only a suggestion: move or
   * remove the card under «Customise the start page». The logic is in discover.js.
   */
  import { liveQuery } from 'dexie';
  import { Compass } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { db } from '../db.js';
  import { momentOf } from '../moment.js';
  import { featureData, usedOf } from '../know/featureData.js';
  import { NOT_KEY, notForMeOf, setNotForMe, unsetNotForMe } from '../ruhig/weniger.js';
  import { DISCOVER_KEY, discoverOf, putOff, pickDiscover } from './discover.js';
  import { momentName } from './momentcard.js';
  import { goFeature } from '../know/featureRun.js';
  import TileHead from './TileHead.svelte';

  let { today, hour = 12, weekday = 3, trips = [], debriefDone = () => false, careDue = 0, inbox = 0, isnew = false } = $props();
  const now = $derived(momentOf({ today, hour, weekday, trips, debriefDone, careDue, inbox }));
  const dataQ = liveQuery(featureData);
  const recQ = liveQuery(async () => discoverOf((await db.settings.get(DISCOVER_KEY))?.value));
  const notQ = liveQuery(async () => notForMeOf((await db.settings.get(NOT_KEY))?.value));
  const pick = $derived($dataQ && $recQ && $notQ ? pickDiscover({ moment: now.key, today, used: usedOf($dataQ), notForMe: $notQ, rec: $recQ }) : null);
  let undo = $state(null); // { id, title } right after «Not for me»
  let shown = $state(null); // the function the card showed last, kept while the note with Undo is up

  $effect(() => {
    if (pick) shown = pick;
  });

  const rec = () => $recQ ?? discoverOf(null);
  async function later() {
    await db.settings.put({ key: DISCOVER_KEY, value: putOff(rec(), pick.feature.id, today) });
  }
  async function notForMe() {
    const f = pick.feature;
    await db.settings.put({ key: NOT_KEY, value: setNotForMe($notQ ?? {}, f.id, '', today) });
    undo = { id: f.id, title: t(f.title) };
  }
  async function undoNot() {
    await db.settings.put({ key: NOT_KEY, value: unsetNotForMe($notQ ?? {}, undo.id) });
    undo = null;
  }
  const tryIt = () => goFeature(pick.feature, {});
</script>

{#if pick || undo}
  <section class="di surf" aria-labelledby="di-h" data-section="discover">
    <TileHead icon={Compass} id="di-h" title={t('Discover|tile')} {isnew} />
    {#if undo}
      <p class="note" role="status" data-discover-undo>
        {t('{name} does not come again.', { name: undo.title })}
        <button type="button" class="link" onclick={undoNot}>{t('Undo|discover')}</button>
      </p>
    {:else}
      <p class="kind">{t('Fits {moment} · {n} of {total}', { moment: t(momentName(now.key)), n: pick.n, total: pick.total })}</p>
      <h3 data-discover={pick.feature.id}>{t(pick.feature.title)}</h3>
      <p class="text">{t(pick.feature.text)}</p>
      <p class="acts">
        <button type="button" class="btn hi" onclick={tryIt} data-discover-try>{t('Try it')}</button>
        <button type="button" class="btn" onclick={later} data-discover-later>{t('Later|discover')}</button>
        <button type="button" class="btn" onclick={notForMe} data-discover-not>{t('Not for me|discover')}</button>
      </p>
      <p class="why">{t('One idea a day, only functions you never opened. «Not for me» hides it for good; you find it again in «What the app can do».')}</p>
    {/if}
  </section>
{/if}

<style>
  .di {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 18px;
    box-sizing: border-box;
  }
  .kind,
  .why,
  .note {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  h3 {
    margin: 0;
    font: 600 var(--fs-sub)/1.3 var(--font-body);
    color: var(--ink);
  }
  .text {
    margin: 0;
    color: var(--ink);
    overflow-wrap: break-word;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0;
  }
  .link {
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
    min-height: 44px;
  }
</style>
