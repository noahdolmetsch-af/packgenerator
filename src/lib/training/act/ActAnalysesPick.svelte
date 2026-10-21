<script>
  /**
   * «Auswertung wie Training» part 3 (Noah 20.10.2026 «das ist ab jetzt unser standard … in alle übrigen
   * bereiche»): the analyses of the ride page (ActAnalyses, the same cards, ⋯ and «Analysen anpassen») for the
   * Strava activities of a tour or a Rückblick. ids: the activities' ids; with several, chips choose one
   * (the longest first). Draws nothing without an activity. Mounts its own «Analysen anpassen».
   */
  import { liveQuery } from 'dexie';
  import { db } from '../../db.js';
  import { localDay } from '../../localday.js';
  import { t } from '../../i18n.svelte.js';
  import { typeKey } from '../../training.js';
  import { dayShort } from '../../flow/words.js';
  import ActAnalyses from './ActAnalyses.svelte';
  import AnaSheet from '../AnaSheet.svelte';

  let { ids = [] } = $props();
  const today = localDay();
  const key = $derived([...new Set(ids.filter((x) => x != null && x !== '').map(String))].sort().join('|'));
  const actsQ = $derived(liveQuery(async () => (key ? (await db.activities.bulkGet(key.split('|'))).filter(Boolean) : [])));
  const allQ = liveQuery(() => db.activities.toArray());
  const acts = $derived([...($actsQ ?? [])].sort((a, b) => (b.movingS ?? 0) - (a.movingS ?? 0)));
  let pick = $state('');
  const act = $derived(acts.find((a) => a.id === pick) ?? acts[0] ?? null);
</script>

{#if act}
  <div class="aap" data-act-analyses={act.id}>
    {#if acts.length > 1}
      <div class="chips" role="group" aria-label={t('Activity of the analyses')}>
        {#each acts as a (a.id)}<button type="button" class="chip" aria-pressed={act.id === a.id} onclick={() => (pick = a.id)}>{a.name || t(typeKey(a.type))} · {dayShort(a.day)}</button>{/each}
      </div>
    {/if}
    <ActAnalyses {act} all={$allQ ?? []} {today} />
    <p class="more"><a class="btn btn-link" href="#/flow/training/a/{encodeURIComponent(act.id)}">{t('The whole ride in Training')}</a></p>
  </div>
  <AnaSheet />
{/if}

<style>
  .aap {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    min-width: 0;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    min-height: 36px;
    padding: 6px 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .more {
    margin: 0;
  }
</style>
