<script>
  /**
   * Paket A part 1, UC-264-I2 «Ziel darf enden»: the foot of a goal in My compass. «Reached», «Changed» and
   * «Let go» are equal ways to finish, each with a short reason if you like. A finished goal shows how it ended
   * and «Open again». put(goal) is GoalCard's save.
   */
  import { Check, Shuffle, Wind, RotateCcw } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { GOAL_ENDS, endGoal, reopenGoal, goalEnd } from './stand.js';

  let { goal, put } = $props();
  const ICON = { reached: Check, changed: Shuffle, letgo: Wind };
  const end = $derived(goalEnd(goal));
  let why = $state('');
  const name = (k) => t(GOAL_ENDS.find((x) => x.key === k)?.name ?? '');
</script>

{#if end}
  <div class="ge" data-goal-end={end.how}>
    <p class="was"><b>{name(end.how)}</b>{end.why ? ` · ${end.why}` : ''}</p>
    {#if !end.why}
      <form class="why" onsubmit={(e) => (e.preventDefault(), why.trim() && put(endGoal(goal, end.how, why)))}>
        <input class="inp" type="text" maxlength="200" bind:value={why} placeholder={t('Why, in a few words (if you like)')} aria-label={t('Why')} />
        <button type="submit" class="btn sm" disabled={!why.trim()}>{t('Save')}</button>
      </form>
    {/if}
    <button type="button" class="btn" onclick={() => put(reopenGoal(goal))}><RotateCcw size={16} aria-hidden="true" />{t('Open again')}</button>
  </div>
{:else}
  <div class="ways" role="group" aria-label={t('Finish the goal')}>
    {#each GOAL_ENDS as w (w.key)}
      {@const Icon = ICON[w.key]}
      <button type="button" class="btn" onclick={() => put(endGoal(goal, w.key))} data-goal-end-how={w.key}><Icon size={16} aria-hidden="true" />{t(w.name)}</button>
    {/each}
  </div>
{/if}

<style>
  .ge,
  .ways {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .was {
    flex: 1 1 100%;
    margin: 0;
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .why {
    display: flex;
    flex: 1 1 100%;
    flex-wrap: wrap;
    gap: 8px;
  }
  .why .inp {
    flex: 1 1 180px;
    min-width: 0;
  }
</style>
