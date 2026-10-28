<script>
  /**
   * «Deine Gewohnheiten» on top of Heute (Noah 27.10.2026 «1a 2a und b 3b»): the long tile «meditation»
   * shows the habits the person chose, up to three under each other: meditation with its own card
   * (MedCard.svelte, starts the session), another activity of Aktiv or an item of «Das tut mir gut» with
   * HabitCard.svelte (ticks with one tap). Nothing chosen yet: the meditation activity, as before.
   * Chosen none, or all of them deleted: one short line with «Choose habits». The pencil calls onpick.
   */
  import { Pencil } from '@lucide/svelte';
  import MedCard from './MedCard.svelte';
  import HabitCard from './HabitCard.svelte';
  import { flowQuery } from '../flow/data.svelte.js';
  import { flowStates } from '../flow.js';
  import { isMedAct } from '../flow/hobby/medstart.js';
  import { routineQuery } from '../routine-data.js';
  import { habitsOf, normHabits, refKey } from './habits.js';
  import { t } from '../i18n.svelte.js';

  let { today, cfg = null, onpick = null } = $props();

  const fq = $derived(flowQuery(today));
  const rq = $derived(routineQuery(today));
  const states = $derived($fq ? flowStates($fq.acts, $fq.log, today, $fq.tripDays) : []);
  const items = $derived($rq?.routine.items ?? []);
  const refs = $derived($fq && $rq ? habitsOf(cfg, states.map((s) => s.act), items, isMedAct) : []);
  const stOf = (id) => states.find((s) => s.act.id === id) ?? null;
  const itemOf = (id) => items.find((x) => x.id === id) ?? null;
  /** chosen on purpose, but nothing left to show */
  const empty = $derived(!!$fq && !!$rq && normHabits(cfg) !== null && !refs.length);
</script>

{#if refs.length}
  <div class="hcs" data-habits>
    {#each refs as r (refKey(r))}
      {#if r.kind === 'act' && isMedAct(stOf(r.id)?.act)}
        <MedCard {today} actId={r.id} {onpick} />
      {:else if r.kind === 'act'}
        <HabitCard kind="act" {today} st={stOf(r.id)} log={$fq.log} {onpick} />
      {:else}
        <HabitCard kind="routine" {today} item={itemOf(r.id)} routine={$rq.routine} auto={$rq.auto} {onpick} />
      {/if}
    {/each}
  </div>
{:else if empty}
  <section class="none" data-habits-empty>
    <p>{t('Choose up to three habits for the top of Today: meditation, stretching, an item of «What does me good» …')}</p>
    {#if onpick}<button type="button" class="btn sm" onclick={onpick} data-habit-pick><Pencil size={16} aria-hidden="true" />{t('Choose habits')}</button>{/if}
  </section>
{/if}

<style>
  .hcs {
    display: grid;
    gap: 12px;
    min-width: 0;
  }
  .none {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
    padding: 12px 16px;
    border: 1px dashed var(--line-strong);
    border-radius: var(--radius-card);
    color: var(--ink-2);
  }
  .none p {
    flex: 1 1 16rem;
    margin: 0;
    font-size: var(--fs-small);
  }
</style>
