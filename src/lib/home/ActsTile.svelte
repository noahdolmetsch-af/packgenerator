<script>
  /**
   * «Heute neu» N2 (Noah 20.10.2026 15:49 «5a»): the Aktiv tiles on Heute, right under «Dein Körper heute».
   * One tap ticks an activity (TickGrid, as on Aktiv), the long press or «•••» opens duration, place or the
   * stopwatch, a tap on Meditation opens its start sheet. Activities with a goal first, in their order;
   * 4 on a phone, 8 on a computer. Analyse PR 1 (Noah 27.10.2026 «umbenennen: mehr»): the link below is
   * «Mehr» and opens Auswerten › Analyse, all your values and activities in charts.
   * Noah 04.11.2026 «1a» (thread «Bereinigen: Doppeltes und Fehler auf Heute»): an activity that already stands on top of
   * Heute as a habit card (HabitCards) is not shown a second time here; a quiet line says which ones are up there.
   * `top`: the habit cards are on the wall; `cfg`: the chosen habits (HABITS_KEY).
   */
  import { Flame, ChevronRight } from '@lucide/svelte';
  import TickGrid from '../flow/TickGrid.svelte';
  import MedStartSheet from '../flow/MedStartSheet.svelte';
  import { flowQuery, seedIfNeeded } from '../flow/data.svelte.js';
  import { flowStates } from '../flow.js';
  import { phone } from '../media.svelte.js';
  import TileHead from './TileHead.svelte';
  import NextStars from './NextStars.svelte';
  import WeekStars from './WeekStars.svelte';
  import NudgeCards from './NudgeCards.svelte';
  import { routineQuery } from '../routine-data.js';
  import { isMedAct } from '../flow/hobby/medstart.js';
  import { actName } from '../flow/ui.svelte.js';
  import { habitActIds } from './habits.js';
  import { t } from '../i18n.svelte.js';

  let { today, top = false, cfg = null } = $props();
  const rq = $derived(routineQuery(today));
  const q = $derived(flowQuery(today));
  const data = $derived($q);
  $effect(() => {
    seedIfNeeded(data);
  });
  const states = $derived(data ? flowStates(data.acts, data.log, today, data.tripDays) : []);
  const N = $derived(phone.matches ? 4 : 8);
  const upIds = $derived(top && $rq ? new Set(habitActIds(cfg, states.map((s) => s.act), $rq.routine.items ?? [], isMedAct)) : new Set());
  const up = $derived(states.filter((s) => upIds.has(s.act.id)));
  const rest = $derived(states.filter((s) => !upIds.has(s.act.id)));
  const sorted = $derived([...rest.filter((s) => !s.resting), ...rest.filter((s) => s.resting)]);
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
  {:else if data && !up.length}
    <p class="empty">{t('Add your activities in Aktiv, then you tick them off here in one tap.')}</p>
  {/if}
  {#if up.length}<p class="up" data-acts-up>{t('{list}: up with your habits', { list: up.map((s) => actName(s.act)).join(', ') })}</p>{/if}
  <NudgeCards {today} />
  <WeekStars {today} />
  <NextStars {today} />
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
  .up {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
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
