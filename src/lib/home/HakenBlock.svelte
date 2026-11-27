<script>
  /**
   * «Heute abhaken» as the FIRST block of Heute (Noah 23.11.2026 «2a», his most used function): ALL activities of today as small
   * fields, one tap ticks (with Undo, like on Aktiv), a long press opens duration, place or stopwatch, «All ›» opens the whole page.
   * Since 27.11.2026 (Noah «1a», thread «Abhaken auf einen Blick verbessern») nothing is hidden: no limit of 4 or 8, nothing behind
   * «All», and the activities that also stand as habit cards are in the grid too. Three fields per row on a phone, as many as fit on a
   * computer; the order is the one of Aktiv and never changes after a tick. It reads the same ticks as «Aktiv heute», the week and
   * the page Mein Tag; nothing is copied or stored here.
   */
  import { Check, ChevronRight } from '@lucide/svelte';
  import TickGrid from '../flow/TickGrid.svelte';
  import MedStartSheet from '../flow/MedStartSheet.svelte';
  import { flowQuery, seedIfNeeded } from '../flow/data.svelte.js';
  import { flowStates } from '../flow.js';
  import TileHead from './TileHead.svelte';
  import ChallengeLine from './ChallengeLine.svelte';
  import { hakenPick } from './haken.js';
  import { t } from '../i18n.svelte.js';

  let { today } = $props();
  const q = $derived(flowQuery(today));
  const data = $derived($q);
  $effect(() => {
    seedIfNeeded(data);
  });
  const states = $derived(data ? flowStates(data.acts, data.log, today, data.tripDays) : []);
  const pick = $derived(hakenPick(states));
  let medFor = $state(null);
  const medSt = $derived(medFor ? (states.find((s) => s.act.id === medFor) ?? null) : null);
</script>

{#if data && pick.shown.length}
  <section class="hk surf" aria-labelledby="hk-h" data-section="haken">
    <TileHead icon={Check} id="hk-h" title={t('Tick off today')} side={t('{done} of {total}|haken', { done: pick.done, total: pick.total })} />
    <TickGrid states={pick.shown} {today} cols={3} compact dense onmed={(s) => (medFor = s.act.id)} />
    <ChallengeLine {today} />
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
  /* a phone: the fields need the width, so the names stay whole */
  @media (max-width: 599px) {
    .hk {
      padding-inline: 14px;
    }
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
