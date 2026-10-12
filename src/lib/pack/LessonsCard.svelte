<script>
  /**
   * v0.102.0 Design-Refresh P4 «Touren» (T5 «Aus früheren Touren», approved 12.10.2026): the learnings
   * from the debriefs that fit this trip (debrief.js learningsFor: the season, the gear on the list),
   * the same ones the packing day shows. Read-only; they are kept and changed in the debrief.
   */
  import { t, tn } from '../i18n.svelte.js';
  import { Lightbulb } from '@lucide/svelte';

  let { lessons = [] } = $props();
</script>

{#if lessons.length}
  <section class="lc" aria-labelledby="lc-h">
    <h2 id="lc-h">{t('From earlier trips')}</h2>
    <p class="sub">{tn(lessons.length, '{n} learning fits', '{n} learnings fit')}</p>
    <ul class="card rows">
      {#each lessons as l (l.id)}
        <li><span class="ic" aria-hidden="true"><Lightbulb size={16} /></span><span class="tx"><b>{l.rule}</b></span></li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .lc {
    min-width: 0;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .sub {
    margin: 2px 0 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .rows {
    display: grid;
    margin: 0;
    padding-top: 4px;
    padding-bottom: 4px;
    list-style: none;
  }
  .rows li {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
  }
  .rows li:first-child {
    border-top: 0;
  }
  .ic {
    display: grid;
    flex: none;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--hi-soft);
    color: var(--hi-ink);
  }
  .tx {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .tx b {
    display: block;
    font-weight: 500;
  }
</style>
