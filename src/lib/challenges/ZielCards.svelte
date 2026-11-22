<script>
  /**
   * «Challenges» (Noah 22.11.2026: nothing may drop from Heute, planned things may be added): the own daily goals that run
   * today, each as its card with the green button «Tick off», under the card «Outdoors» on Heute (HabitCards.svelte). Without
   * a running goal nothing is shown. The pencil opens the same window as on the page Challenges.
   */
  import ZielCard from './ZielCard.svelte';
  import ZielSheet from './ZielSheet.svelte';
  import { zieleQuery, saveOne, stopOne, removeWithUndo } from './zieldb.js';
  import { running } from '../tagesziel.js';

  let { today } = $props();

  const q = zieleQuery();
  const now = $derived(running($q ?? [], today));
  let open = $state(false);
  let edit = $state(null);
</script>

{#each now as c (c.id)}
  <ZielCard {c} {today} onput={saveOne} onedit={() => ((edit = c), (open = true))} />
{/each}
{#if now.length}
  <ZielSheet bind:open c={edit} {today} onsave={saveOne} onstop={stopOne} onremove={removeWithUndo} />
{/if}
