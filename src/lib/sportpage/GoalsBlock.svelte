<script>
  /**
   * Paket O, basic block «Ziele»: an activity of Aktiv shows its goals (rolling windows, flow.js) with how far
   * you are and the way to change them; a sport of a trip gets its own goal here (how often in how many days).
   */
  import { ChevronRight } from '@lucide/svelte';
  import { timesIn } from '../sportshelp.js';
  import { goalName } from '../flow/ui.svelte.js';
  import { t, tn } from '../i18n.svelte.js';

  let { sport, goals = [], own = null, dayMap, today, onsave } = $props();

  let count = $state(1);
  let days = $state(7);
  let editing = $state(false);
  const save = async (e) => {
    e.preventDefault();
    await onsave(Number(count) > 0 ? { count: Math.round(Number(count)), days: Math.max(1, Math.round(Number(days) || 7)) } : null);
    editing = false;
  };
  const list = $derived(own ? [{ id: 'own', count: own.count, days: own.days }] : goals);
</script>

{#if list.length}
  <ul class="ilist">
    {#each list as g (g.id)}
      {@const n = timesIn(dayMap, today, g.days)}
      <li data-goal><span class="ent"><b>{goalName(g) || tn(g.days, '{count}× in {n} day', '{count}× in {n} days', { count: g.count })}</b><span class="pill {n >= g.count ? 'ok' : ''}">{t('{n} of {m}', { n, m: g.count })}</span></span></li>
    {/each}
  </ul>
{:else}
  <p class="none">{t('No goal yet. Everything is a suggestion: set one if it helps you.')}</p>
{/if}
{#if sport.kind === 'act' && !own}
  <a class="lnk" href="#/flow/edit/{encodeURIComponent(sport.key)}">{t('Change the goals in Aktiv')} <ChevronRight size={14} aria-hidden="true" /></a>
{/if}
{#if sport.kind === 'trip'}
  {#if editing}
    <form class="add" onsubmit={save} data-goal-form>
      <label>{t('How often')}<input type="number" min="0" bind:value={count} /></label>
      <label>{t('In how many days')}<input type="number" min="1" bind:value={days} /></label>
      <button type="submit" class="btn hi">{t('Save')}</button>
      <button type="button" class="btn" onclick={() => (editing = false)}>{t('Cancel')}</button>
    </form>
    <p class="small">{t('0 takes the goal away.')}</p>
  {:else}
    <button type="button" class="chip dash" onclick={() => ((count = own?.count ?? 1), (days = own?.days ?? 7), (editing = true))} data-set-goal>{own ? t('Change the goal') : t('Set a goal')}</button>
  {/if}
{/if}
