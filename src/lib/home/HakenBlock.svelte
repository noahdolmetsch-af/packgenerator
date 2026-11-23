<script>
  /**
   * «Heute abhaken» as the FIRST block of Heute (Noah 23.11.2026 «2a», his most used function): the things you do today as
   * buttons, one tap ticks (with Undo, like on Aktiv), «All ›» opens the whole list. It reads the same ticks as «Aktiv heute»,
   * the week and the page Mein Tag; nothing is copied or stored here. An activity that already stands on top as a habit card
   * (HabitCards) is not shown twice; a quiet line names them (the rule of «Aktiv heute», Noah 04.11.2026 «1a»).
   * `top`: the habit cards are on the wall; `cfg`: the chosen habits (HABITS_KEY).
   */
  import { Check, ChevronRight } from '@lucide/svelte';
  import TickGrid from '../flow/TickGrid.svelte';
  import MedStartSheet from '../flow/MedStartSheet.svelte';
  import { flowQuery, seedIfNeeded } from '../flow/data.svelte.js';
  import { flowStates } from '../flow.js';
  import { phone } from '../media.svelte.js';
  import { routineQuery } from '../routine-data.js';
  import { isMedAct } from '../flow/hobby/medstart.js';
  import { actName } from '../flow/ui.svelte.js';
  import { habitActIds } from './habits.js';
  import TileHead from './TileHead.svelte';
  import { hakenPick } from './haken.js';
  import { t } from '../i18n.svelte.js';

  let { today, top = false, cfg = null } = $props();
  const rq = $derived(routineQuery(today));
  const q = $derived(flowQuery(today));
  const data = $derived($q);
  $effect(() => {
    seedIfNeeded(data);
  });
  const states = $derived(data ? flowStates(data.acts, data.log, today, data.tripDays) : []);
  const upIds = $derived(top && $rq ? new Set(habitActIds(cfg, states.map((s) => s.act), $rq.routine.items ?? [], isMedAct)) : new Set());
  // the habits load a moment after the activities: wait for them, or a tile shows for a blink and then moves up to the habit cards
  const ready = $derived(!top || !!$rq);
  const pick = $derived(ready ? hakenPick(states, upIds, phone.matches ? 4 : 8) : { shown: [], up: [], done: 0, total: 0 });
  let medFor = $state(null);
  const medSt = $derived(medFor ? (states.find((s) => s.act.id === medFor) ?? null) : null);
</script>

{#if data && ready && (pick.shown.length || pick.up.length)}
  <section class="hk surf" aria-labelledby="hk-h" data-section="haken">
    <TileHead icon={Check} id="hk-h" title={t('Tick off today')} side={pick.total ? (pick.open ? t('{n} open|haken', { n: pick.open }) : t('All done|haken')) : ''} />
    {#if pick.shown.length}<TickGrid states={pick.shown} {today} cols={phone.matches ? 2 : 4} compact onmed={(s) => (medFor = s.act.id)} />{/if}
    {#if pick.up.length}<p class="up" data-haken-up>{t('{list}: up with your habits', { list: pick.up.map((s) => actName(s.act)).join(', ') })}</p>{/if}
    <a class="lk" href="#/flow" data-haken-all>{t('All|haken')}<ChevronRight size={16} aria-hidden="true" /></a>
  </section>
{/if}
{#if medSt}<MedStartSheet st={medSt} {today} onclose={() => (medFor = null)} />{/if}

<style>
  .hk {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 18px;
    box-sizing: border-box;
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
    min-width: 44px;
    color: var(--hi);
    font-weight: 600;
    font-size: var(--fs-small);
    text-decoration: none;
  }
</style>
