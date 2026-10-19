<script>
  /**
   * «Inspiration» UC2-2 (answer 5a): the packing rules you took over from your inspiration, as quiet
   * hints on the packing page (at most 2, newest first). «✕» hides one from packing; it stays a learning.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { inspoHints } from '../inspiration.js';
  import InspoHint from './InspoHint.svelte';
  import { suggest, watchSuggest } from '../clear/suggest.svelte.js';
  watchSuggest(); // Paket Q #361: «Rules from your inspiration» can be switched off

  const hintsQ = liveQuery(() => db.learnings.filter((l) => !!l.inspo).toArray());
  const hints = $derived(inspoHints($hintsQ ?? []));
  const hide = (l) => db.learnings.update(l.id, { packHint: false });
</script>

{#if hints.length && suggest.on.inspo}
  <div class="ph-list" data-inspo-hints>
    {#each hints as l (l.id)}
      <InspoHint rule={l.rule} url={l.inspo.url} title={l.inspo.title} onhide={() => hide(l)} />
    {/each}
  </div>
{/if}

<style>
  .ph-list {
    display: grid;
    gap: 8px;
    margin-top: 12px;
  }
</style>
