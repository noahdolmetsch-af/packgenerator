<script>
  /**
   * «Heute neu» N2 (Noah 20.10.2026 15:49 «5a»): the Aktiv tiles on Heute, right under «Dein Körper heute».
   * One tap ticks an activity (TickGrid, as on Aktiv), the long press or «•••» opens duration, place or the
   * stopwatch, a tap on Meditation opens its start sheet. Activities with a goal first, in their order;
   * 4 on a phone, 8 on a computer. Analyse PR 1 (Noah 27.10.2026 «umbenennen: mehr»): the link below is
   * «Mehr» and opens Auswerten › Analyse, all your values and activities in charts.
   */
  import { Flame, ChevronRight } from '@lucide/svelte';
  import TickGrid from '../flow/TickGrid.svelte';
  import MedStartSheet from '../flow/MedStartSheet.svelte';
  import { flowQuery, seedIfNeeded } from '../flow/data.svelte.js';
  import { flowStates } from '../flow.js';
  import { phone } from '../media.svelte.js';
  import TileHead from './TileHead.svelte';
  import { t } from '../i18n.svelte.js';

  let { today } = $props();
  const q = $derived(flowQuery(today));
  const data = $derived($q);
  $effect(() => {
    seedIfNeeded(data);
  });
  const states = $derived(data ? flowStates(data.acts, data.log, today, data.tripDays) : []);
  const N = $derived(phone.matches ? 4 : 8);
  const sorted = $derived([...states.filter((s) => !s.resting), ...states.filter((s) => s.resting)]);
  const shown = $derived(sorted.slice(0, N));
  const done = $derived(states.filter((s) => s.todayDone).length);
  let medFor = $state(null);
  const medSt = $derived(medFor ? (states.find((s) => s.act.id === medFor) ?? null) : null);
</script>

<section class="ak surf" aria-labelledby="ak-h" data-section="acts">
  <div class="hd">
    <TileHead icon={Flame} id="ak-h" title={t('Active today')} side={states.length ? t('{n} done today|acts', { n: done }) : ''} info="tile.acts" />
  </div>
  {#if shown.length}
    <TickGrid states={shown} {today} cols={phone.matches ? 2 : 4} onmed={(s) => (medFor = s.act.id)} />
  {:else if data}
    <p class="empty">{t('Add your activities in Aktiv, then you tick them off here in one tap.')}</p>
  {/if}
  <a class="lk" href="#/auswerten/analyse" data-acts-all title={t('All your values and activities in charts')}>{t('More|acts tile')}<ChevronRight size={16} aria-hidden="true" /></a>
</section>
{#if medSt}<MedStartSheet st={medSt} {today} onclose={() => (medFor = null)} />{/if}

<style>
  .ak {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    padding: 14px 18px;
    box-sizing: border-box;
  }
  .empty {
    color: var(--ink-3);
    font-size: var(--fs-small);
    margin: 0;
  }
  .lk {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    min-height: 44px;
    margin-top: auto;
    color: var(--hi);
    font-weight: 600;
    font-size: var(--fs-small);
    text-decoration: none;
  }
</style>
