<script>
  /**
   * «Training verbessern» 2 (Noah 2.11.2026 «2»): «Suggestion for this week» in Aktiv › Training › Woche. It builds a
   * week from the goal, the race, today's readiness and the sports of Aktiv, says why, and takes it over only on a tap
   * (with Undo). «Another suggestion» shows the next layout. Everything is a suggestion.
   */
  import { Sparkles } from '@lucide/svelte';
  import { t, num, lang } from '../../i18n.svelte.js';
  import { suggestWeek, weeklySports, VARIANTS } from '../suggest.js';
  import { KIND_NAMES, shiftDay } from '../../training.js';

  let { acts = [], flowActs = [], plan = [], goal = null, monday, today, level = null, daysToRace = null, onapply } = $props();

  let open = $state(false);
  let variant = $state(0);

  const sportName = (s) => (lang.v === 'de' && s.nameDe ? s.nameDe : s.name) || t('Activity');
  const sports = $derived(weeklySports(flowActs, monday));
  // minutes per week of the four weeks before the shown one (weeks with nothing do not count)
  const recent = $derived.by(() => {
    const weeks = [1, 2, 3, 4].map((i) => acts.filter((a) => a.day >= shiftDay(monday, -7 * i) && a.day < shiftDay(monday, -7 * (i - 1))).reduce((s, a) => s + (a.movingS || 0) / 60, 0)).filter((m) => m > 0);
    return weeks.length ? weeks.reduce((a, b) => a + b, 0) / weeks.length : null;
  });
  // the kind the person does most (bike, run or hike) in the last two months
  const mainKind = $derived.by(() => {
    const n = { bike: 0, run: 0, hike: 0 };
    acts.filter((a) => a.day >= shiftDay(today, -60) && a.kind in n).forEach((a) => n[a.kind]++);
    const top = Object.entries(n).sort((a, b) => b[1] - a[1])[0];
    return top[1] ? top[0] : 'bike';
  });
  const sug = $derived(suggestWeek({ monday, today, goal, daysToRace, level, recentMins: recent, mainKind, sports, variant, nameOf: sportName }));
  const label = (s) => (s.sport ? sportName(flowActs.find((a) => a.id === s.sport) ?? { name: '' }) : s.name ? t(s.name) : t(KIND_NAMES[s.kind]));
  const fmt = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(lang.v, { timeZone: 'UTC', weekday: 'short' });
  const hm = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  const hasWeek = $derived(plan.some((s) => s.day >= monday && s.day < shiftDay(monday, 7) && s.day >= today));

  function take() {
    onapply(sug.sessions.map((s) => ({ ...s, name: s.sport ? '' : s.name ? t(s.name) : '' })));
    open = false;
  }
</script>

{#if !open}
  <button type="button" class="btn sm sugw-open" onclick={() => ((open = true), (variant = 0))} data-suggest-open><Sparkles size={16} aria-hidden="true" />{t('Suggestion for this week')}</button>
{:else}
  <div class="sugw" data-suggest>
    <h3 class="sugw-h">{t('Suggestion for this week')}</h3>
    {#if sug.sessions.length}
      <ul class="sugw-why">{#each sug.why as w (w.key)}<li>{t(w.key, w.vars)}</li>{/each}</ul>
      <ul class="sugw-list">
        {#each sug.sessions as s (s.id)}
          <li><b>{fmt(s.day)}</b><span>{label(s)}</span><span class="num">{hm(s.mins)}{#if s.zone} · Z{s.zone}{/if}</span></li>
        {/each}
      </ul>
      <p class="sugw-sum num">{t('{n} h in total', { n: num(Math.round(sug.mins / 6) / 10) })}</p>
      <div class="sugw-row">
        <button type="button" class="btn hi sm" onclick={take} data-suggest-take>{hasWeek ? t('Take over (replaces the planned days)') : t('Take over')}</button>
        {#if VARIANTS > 1}<button type="button" class="btn sm" onclick={() => (variant = (variant + 1) % VARIANTS)} data-suggest-more>{t('Another suggestion')}</button>{/if}
        <button type="button" class="btn btn-link sm" onclick={() => (open = false)}>{t('Close')}</button>
      </div>
    {:else}
      <p class="none">{t('No day is left in this week. Look at next week.')}</p>
      <button type="button" class="btn btn-link sm" onclick={() => (open = false)}>{t('Close')}</button>
    {/if}
  </div>
{/if}

<style>
  .sugw-open {
    margin-top: 0.7rem;
  }
  .sugw {
    margin-top: 0.7rem;
    display: grid;
    gap: 0.5rem;
    padding: 0.8rem;
    border-radius: 0.7rem;
    background: var(--hi-soft, #e9f1ec);
  }
  .sugw-h {
    margin: 0;
    font-size: 1rem;
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .sugw-why {
    display: grid;
    gap: 0.2rem;
    font-size: 0.9rem;
    color: var(--l2);
  }
  .sugw-list li {
    display: grid;
    grid-template-columns: 2.6rem 1fr auto;
    gap: 0.5rem;
    padding: 0.35rem 0;
    border-top: 1px solid var(--line, rgba(0, 0, 0, 0.1));
  }
  .sugw-sum,
  .none {
    margin: 0;
    font-size: 0.9rem;
  }
  .sugw-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }
</style>
