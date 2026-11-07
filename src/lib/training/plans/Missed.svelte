<script>
  /**
   * «Training verbessern» 5 «Verpasst? Verschieben» (Noah 03.11.2026): a session planned earlier this week that was
   * not done gets one calm row: move it to a day that is left, or let it go. No red alarm, no guilt; both have Undo.
   */
  import { CalendarClock } from '@lucide/svelte';
  import { t } from '../../i18n.svelte.js';

  // missed: sessions; targets: [{ day, label }] days from today to the end of the week
  let { missed = [], targets = [], name = (s) => s.name, hours = (m) => `${m} min`, dayLabel = (d) => d, onmove, onskip } = $props();
</script>

{#if missed.length}
  <section class="card ms" aria-labelledby="ms-h" data-section="missed">
    <span class="mi" aria-hidden="true"><CalendarClock size={20} /></span>
    <div class="mc">
      <h2 id="ms-h" class="mh">{t('Missed one? Move it')}</h2>
      <p class="mp">{t('No problem. Move it to a day that is left, or let it go.')}</p>
      <ul class="ml">
        {#each missed.slice(0, 3) as s (s.id)}
          <li data-missed={s.id}>
            <span class="mn">{name(s)} · {hours(s.mins)} · {dayLabel(s.day)}</span>
            <span class="mb">
              {#each targets as g (g.day)}<button type="button" class="btn sm" onclick={() => onmove(s, g.day)} data-missed-move={g.day}>{g.label}</button>{/each}
              <button type="button" class="btn btn-link sm" onclick={() => onskip(s)} data-missed-skip>{t('Let it go|session')}</button>
            </span>
          </li>
        {/each}
      </ul>
    </div>
  </section>
{/if}

<style>
  .ms { display: flex; gap: 12px; margin-bottom: 16px; }
  .mi { color: var(--accent); padding-top: 2px; }
  .mc { flex: 1; min-width: 0; }
  .mh { margin: 0; font-size: var(--fs-sub); }
  .mp { margin: 2px 0 8px; color: var(--ink-2); font-size: var(--fs-small); }
  .ml { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
  .mn { display: block; margin-bottom: 6px; }
  .mb { display: flex; flex-wrap: wrap; gap: 6px; }
</style>
