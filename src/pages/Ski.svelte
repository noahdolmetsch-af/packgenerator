<script>
  /**
   * v0.97.0 «Skitouren» (Noah 11.10.2026, mockups A–E approved): Touren › Skitouren.
   *   #/ski                  the page (A): the next ski tour with its backpack check, three rows, «Mehr»
   *   #/ski/check[/<trip>]   Rucksack-Check (B): the trip's list in the five ski groups, tap = packed
   *   #/ski/start[/<trip>]   Start-Check (C): five checks at the car park and the turnaround time
   *   #/ski/care             Saison-Pflege (D): three phases, «Erledigt» with day and metres climbed
   *   #/ski/after[/<trip>]   Nach der Tour (E): peak, metres, who came along, three questions → learnings
   *   #/ski/plan[/<trip>]    Tour planen (Paket P2): danger level, «Dein Morgen», conditions, the plan in numbers
   *   #/ski/season           Saison (Paket P2): goal, wish tours, ski days, transceiver practice, courses, skis
   * The rules are pure in lib/ski.js; the data comes from lib/ski/skidb.js.
   */
  import '../lib/ski/ski.css';
  import SkiHome from './ski/SkiHome.svelte';
  import SkiCheck from './ski/SkiCheck.svelte';
  import SkiStart from './ski/SkiStart.svelte';
  import SkiCare from './ski/SkiCare.svelte';
  import SkiAfter from './ski/SkiAfter.svelte';
  import SkiPlan from './ski/SkiPlan.svelte';
  import SkiSeason from './ski/SkiSeason.svelte';

  let { sub = '' } = $props();
  const parts = $derived(sub.split('?')[0].split('/').filter(Boolean));
  const id = $derived(decodeURIComponent(parts[1] ?? ''));
</script>

{#if parts[0] === 'check'}
  <SkiCheck {id} />
{:else if parts[0] === 'start'}
  <SkiStart {id} />
{:else if parts[0] === 'care'}
  <SkiCare />
{:else if parts[0] === 'plan'}
  {#key id}<SkiPlan {id} />{/key}
{:else if parts[0] === 'season'}
  <SkiSeason />
{:else if parts[0] === 'after'}
  {#key id}<SkiAfter {id} />{/key}
{:else}
  <SkiHome />
{/if}
