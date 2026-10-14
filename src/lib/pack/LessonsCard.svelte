<script>
  /**
   * v0.102.0 Design-Refresh P4 «Touren» (T5 «Aus früheren Touren», approved 12.10.2026): the learnings
   * from the debriefs that fit this trip (debrief.js learningsFor: the season, the gear on the list),
   * the same ones the packing day shows. Read-only; they are kept and changed in the debrief.
   * SN2x U6 «Für nächstes Mal» (Noah 13.10.2026 «immer nur wenn relevant»): reminders: the points of earlier
   * debriefs that fit this trip (ganz.js remindersFor), each with the situation it is for and its trip.
   */
  import { t, tn } from '../i18n.svelte.js';
  import { Lightbulb, BellRing } from '@lucide/svelte';
  import { WHEN_WORD } from '../review/ganz.js';

  let { lessons = [], reminders = [] } = $props();
</script>

{#if reminders.length}
  <section class="lc nt" aria-labelledby="lcn-h" data-reminders>
    <h2 id="lcn-h">{t('For next time')}</h2>
    <p class="sub">{tn(reminders.length, '{n} point from earlier trips fits this trip', '{n} points from earlier trips fit this trip')}</p>
    <ul class="card rows">
      {#each reminders as r (r.fromId + r.id)}
        <li data-reminder={r.when}><span class="ic" aria-hidden="true"><BellRing size={16} /></span><span class="tx"><b>{r.text}</b><small>{[r.when !== 'any' ? t(WHEN_WORD[r.when]) : '', t('from «{trip}»', { trip: r.from })].filter(Boolean).join(' · ')}</small></span></li>
      {/each}
    </ul>
  </section>
{/if}

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
  .tx small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .nt + .lc {
    margin-top: 16px;
  }
</style>
