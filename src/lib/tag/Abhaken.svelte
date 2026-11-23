<script>
  /**
   * «Mein Tag» step 3c (Noah 23.11.2026 «ja»): the shared tick-off list as the third tab of Mein Tag.
   * The same block as «Tick off today» on Aktiv (src/pages/Flow.svelte): one tile for each thing you do
   * (sports, habits, meditation), a tap ticks it (duration and feeling are optional on the page «Geschafft»),
   * and the running challenges under it. Nothing is copied: the ticks are the ones of Aktiv, Heute and the week.
   */
  import TickGrid from '../flow/TickGrid.svelte';
  import SyncLine from '../flow/SyncLine.svelte';
  import OutdoorCard from '../home/OutdoorCard.svelte';
  import ZielCards from '../challenges/ZielCards.svelte';
  import TickSuggest from '../strava/TickSuggest.svelte';
  import Empty from '../ui/Empty.svelte';
  import { flowQuery, seedIfNeeded } from '../flow/data.svelte.js';
  import { flowStates } from '../flow.js';
  import { phone } from '../media.svelte.js';
  import { t } from '../i18n.svelte.js';

  let { today } = $props();
  const q = flowQuery(today);
  const data = $derived($q);
  $effect(() => {
    seedIfNeeded(data);
  });
  const states = $derived(data ? flowStates(data.acts, data.log, today, data.tripDays) : []);
  const live = $derived(states.filter((s) => !s.resting));
</script>

{#if data && !live.length}
  <Empty title={t('Nothing to tick off yet')} text={t('Add the first sport or habit, then it stands here with one tap.')} action={{ label: t('New sport'), href: '#/flow/new' }} />
{:else if data}
  <div data-tag-abhaken>
    <TickGrid states={live} {today} cols={phone.matches ? 2 : 4} compact help />
    <SyncLine />
    <div class="chal">
      <OutdoorCard {today} offerLine={false} />
      <ZielCards {today} />
    </div>
    <TickSuggest />
    <p class="more"><a href="#/flow">{t('All sports, goals and the week in Aktiv')}</a></p>
  </div>
{/if}

<style>
  .chal {
    display: grid;
    gap: 10px;
    margin: 12px 0 0;
  }
  .more {
    margin: 14px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
</style>
