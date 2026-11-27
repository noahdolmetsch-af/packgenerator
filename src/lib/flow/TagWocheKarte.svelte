<script>
  /**
   * «Dein Tag und deine Woche» (Noah 27.11.2026 «1b 2a 3b 4a 5b», Fragen 8 bis 12, 18 und 22): the card on Auswerten › Woche about NOW. The day against
   * your typical day, the week against the last four, the mix of the kinds of sport, what rests longest, the free days, your weekday and hour,
   * and this month against last year. Rules: flow/tagwoche.js, words: flow/tagwoche-text.js. Only looking: nothing is graded; without measured
   * minutes the ticks are counted. The mix needs the kind of the sports (flow/arten.js); a row opens the window for all of them (ArtSheet).
   * units: the shared units (training), acts, log, activities, health: from the page; today: the local day.
   */
  import ArtSheet from './ArtSheet.svelte';
  import { dayLine, weekLine, mixLine, pauseLine, freeLine, rhythmLine, yearLine } from './tagwoche.js';
  import { tagwocheRows } from './tagwoche-text.js';
  import { coveredBy, isWalk } from './dieselbe.js';
  import { actName } from './ui.svelte.js';
  import { normAct } from '../flow.js';
  import { artOf } from './arten.js';
  import { locale, t } from '../i18n.svelte.js';

  let { units = [], acts = [], log = [], activities = [], health = [], today } = $props();
  let artOpen = $state(false);

  const clock = (v) => String(v ?? '').match(/(\d{2}):(\d{2})/)?.[0] ?? null;
  /** The sessions with a start time: Strava, and the watch's own workouts that Strava does not cover. */
  const timed = $derived.by(() => {
    const out = activities.filter((a) => a?.day && clock(a.time)).map((a) => ({ day: a.day, time: clock(a.time) }));
    for (const h of health) {
      if (!h?.date || !Array.isArray(h.exercises)) continue;
      for (const ex of h.exercises) {
        if (!clock(ex?.start) || isWalk(ex) || coveredBy(h.date, ex, activities)) continue;
        out.push({ day: h.date, time: clock(ex.start) });
      }
    }
    return out;
  });
  const normed = $derived(acts.map(normAct));
  const names = $derived(new Map(normed.map((a) => [a.id, actName(a)])));
  const rows = $derived(
    tagwocheRows({
      day: dayLine(units, today),
      week: weekLine(units, today),
      mix: mixLine(units, acts.map((a) => ({ ...a, art: artOf(a) })), today),
      pause: pauseLine(log, normed, today),
      free: freeLine(units, today),
      rhythm: rhythmLine(units, timed, today),
      year: yearLine(units, today),
      nameOf: (a) => names.get(a.id) ?? a.name ?? '',
      loc: locale(),
      today,
    }),
  );
</script>

<section class="card tw" aria-labelledby="tw-h" data-tagwoche>
  <h2 id="tw-h" class="h2">{t('Your day and your week')}</h2>
  <p class="det">{t('Against your own usual, not against a goal. Without measured minutes the ticks are counted.')}</p>
  {#if rows.length}
    <ul class="tl">
      {#each rows as r (r.key)}
        <li data-tw={r.key}>
          <span class="k">{r.label}</span>
          <div class="tx">
            <span>{r.text}</span>
            {#if r.action}<button type="button" class="lnk" data-tw-art onclick={() => (artOpen = true)}>{r.action.text} ›</button>{/if}
          </div>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="det" data-tw-none>{t('Nothing to say yet. After a few weeks of ticks this card shows more.')}</p>
  {/if}
</section>
{#if artOpen}<ArtSheet {acts} onclose={() => (artOpen = false)} />{/if}

<style>
  .tw {
    padding: var(--sp-4);
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    min-width: 0;
  }
  .h2 {
    margin: 0;
    font: 600 var(--fs-h3, 1.1rem) / 1.25 var(--font-body);
    color: var(--ink);
  }
  .det {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .tl {
    display: flex;
    flex-direction: column;
    margin: var(--sp-1) 0 0;
    padding: 0;
    list-style: none;
  }
  .tl li {
    display: grid;
    grid-template-columns: 92px minmax(0, 1fr);
    gap: var(--sp-2);
    padding: var(--sp-3) 0;
    border-top: 1px solid var(--line);
  }
  .tl li:first-child {
    border-top: 0;
  }
  .k {
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 600;
    line-height: 1.45;
    overflow-wrap: break-word;
  }
  .tx {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    color: var(--ink);
    line-height: 1.4;
    overflow-wrap: break-word;
  }
  .lnk {
    align-self: flex-start;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
  }
</style>
