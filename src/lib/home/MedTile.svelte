<script>
  /**
   * v0.94.0 «Kachel-Wand» (mockup A «Meditation ▷ wie letztes Mal», Meditation Wünsche Q5 a): a tap
   * opens the meditation start sheet (lib/flow/MedStartSheet.svelte, the same as on Aktiv): one button
   * starts like last time. Without a meditation activity the tile leads to Aktiv.
   */
  import SmallTile from './SmallTile.svelte';
  import MedStartSheet from '../flow/MedStartSheet.svelte';
  import { flowQuery } from '../flow/data.svelte.js';
  import { flowStates } from '../flow.js';
  import { isMedAct } from '../flow/hobby/medstart.js';
  import { TILE } from './tiles.js';
  import { t } from '../i18n.svelte.js';

  let { today, size = 's', isnew = false } = $props();
  const q = $derived(flowQuery(today));
  const data = $derived($q);
  const st = $derived(data ? (flowStates(data.acts, data.log, today, data.tripDays).find((s) => isMedAct(s.act) && !s.act.paused) ?? null) : null);
  let open = $state(false);
</script>

{#if st}
  <SmallTile tile={TILE.meditation} {size} hot {isnew} sub={st.todayDone ? t('Done today ✓') : t('▷ like last time')} onclick={() => (open = true)} />
  {#if open}<MedStartSheet {st} {today} onclose={() => (open = false)} />{/if}
{:else}
  <SmallTile tile={TILE.meditation} {size} hot {isnew} sub={t('In Active')} href="#/flow" />
{/if}
