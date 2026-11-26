<script>
  /**
   * «Meditation: start first, the challenge underneath» (Noah 24.11.2026 «1-5a»/«ja», impeccable audit week F4): on the page
   * Meditation one row under the duration chips. Without a running meditation challenge: «Challenge: 30 days of meditation»
   * with the button «Start» (opens the same window as «Take over» under Challenges › Ideas, preset from SUGGESTIONS).
   * With one running: its card with «Tick off» and «Day n of m» (ZielCard), the pencil opens the same window.
   * Stores nothing of its own; the goals are the list `tagesziele` (zieldb.js).
   */
  import { Trophy } from '@lucide/svelte';
  import ZielCard from './ZielCard.svelte';
  import ZielSheet from './ZielSheet.svelte';
  import { zieleQuery, saveOne, stopOne, removeWithUndo } from './zieldb.js';
  import { running, SUGGESTIONS } from '../tagesziel.js';
  import { isMedGoal } from './medchallenge.js';
  import { t } from '../i18n.svelte.js';

  let { today } = $props();

  const q = zieleQuery();
  const list = $derived($q);
  const mine = $derived(list ? (running(list, today).find((c) => isMedGoal(c, t)) ?? null) : null);
  const idea = SUGGESTIONS[0];
  let open = $state(false);
  let edit = $state(null);
  let preset = $state(null);
</script>

{#if list}
  {#if mine}
    <div class="mc-card" data-med-challenge="running">
      <ZielCard c={mine} {today} onput={saveOne} onedit={() => ((edit = mine), (preset = null), (open = true))} />
    </div>
  {:else}
    <div class="mc" data-med-challenge="offer">
      <span class="ic" aria-hidden="true"><Trophy size={20} /></span>
      <span class="tx">
        <b>{t('Challenge: {name}', { name: t(idea.name) })}</b>
        <small>{t('Every day at least {n} min. Every session counts by itself.', { n: idea.goal })}</small>
      </span>
      <button type="button" class="btn sm" onclick={() => ((edit = null), (preset = idea), (open = true))} data-med-challenge-start>{t('Start|challenge')}</button>
    </div>
  {/if}
  <ZielSheet bind:open c={edit} {preset} {today} onsave={saveOne} onstop={stopOne} onremove={removeWithUndo} />
{/if}

<style>
  .mc {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 14px;
    margin-top: 16px;
    padding: 12px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper-2);
    min-width: 0;
  }
  .mc-card {
    margin-top: 16px;
    min-width: 0;
  }
  .ic {
    flex: none;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: var(--r-2);
    background: var(--paper);
    color: var(--ink-2);
  }
  .tx {
    flex: 1 1 11rem;
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.35;
  }
  .tx b {
    font-weight: 650;
  }
  .tx small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
