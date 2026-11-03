<script>
  /**
   * «Training verbessern» 2 (Noah 2.11.2026 «2»): «Suggestion for this week» in Aktiv › Training › Woche. It builds a
   * week from the goal, the race, today's readiness and the sports of Aktiv, says why, and takes it over only on a tap
   * (with Undo). «Another suggestion» shows the next layout. Everything is a suggestion.
   */
  import { Sparkles, Pencil, X, Plus, Minus } from '@lucide/svelte';
  import { t, num, lang } from '../../i18n.svelte.js';
  import { suggestWeek, weeklySports, VARIANTS, SRC } from '../suggest.js';
  import { KIND_NAMES, ZONE_NAMES, shiftDay, weekOf } from '../../training.js';

  let { acts = [], flowActs = [], plan = [], goal = null, monday, today, level = null, daysToRace = null, onapply } = $props();

  let open = $state(false);
  let variant = $state(0);
  let hoursSet = $state(null); // hours per week set with + / −, or null = from the goal

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
  const sug = $derived(suggestWeek({ monday, today, goal, daysToRace, level, recentMins: recent, mainKind, sports, variant, nameOf: sportName, hoursSet }));
  // «Training verbessern» 2 (Noah 3.11.2026): every day of the suggestion can be changed here, before it is taken over:
  // swap the session for another sport, change minutes and zone, remove it, move it, add more sessions on a day
  let edits = $state(null); // the changed list, or null while the suggestion is untouched
  let form = $state(null); // { id (null = new), act, day, mins, zone }
  const list = $derived(edits ?? sug.sessions);
  const days = $derived(weekOf(monday).filter((d) => d >= today));
  const actOf = (s) => (s.sport ? `sport:${s.sport}` : `kind:${s.kind}`);
  const KINDS = ['bike', 'run', 'hike'];
  const sportsAll = $derived(flowActs.filter((a) => !a.paused));
  const sortList = (l) => [...l].sort((a, b) => a.day.localeCompare(b.day));
  const startEdit = (s) => (form = { id: s.id, act: actOf(s), day: s.day, mins: s.mins, zone: s.zone ?? 0 });
  const startAdd = (day) => (form = { id: null, act: `kind:${mainKind}`, day: day ?? days[0], mins: 45, zone: 2 });
  function saveForm(e) {
    e.preventDefault();
    const mins = Math.round(Number(form.mins));
    if (!(mins >= 5 && mins <= 1440) || !form.day) return;
    const [type, key] = form.act.split(/:(.*)/s);
    const old = list.find((x) => x.id === form.id);
    const changed = !old || actOf(old) !== form.act;
    const next = {
      ...(old ?? {}),
      id: old?.id ?? `${SRC}-new-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      src: SRC,
      day: form.day,
      kind: type === 'sport' ? 'other' : key,
      sport: type === 'sport' ? key : undefined,
      name: changed ? '' : old.name,
      mins,
      zone: Number(form.zone) || null,
    };
    edits = sortList([...list.filter((x) => x.id !== next.id), next]);
    form = null;
  }
  const dropOne = (id) => ((edits = list.filter((x) => x.id !== id)), (form = null));
  const stepHours = (d) => ((hoursSet = Math.min(40, Math.max(1, (hoursSet ?? sug.hours) + d))), (edits = null), (form = null));
  const reset = () => ((edits = null), (form = null));
  const label = (s) => (s.sport ? sportName(flowActs.find((a) => a.id === s.sport) ?? { name: '' }) : s.name ? t(s.name) : t(KIND_NAMES[s.kind]));
  const fmt = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(lang.v, { timeZone: 'UTC', weekday: 'short' });
  const hm = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  const hasWeek = $derived(plan.some((s) => s.day >= monday && s.day < shiftDay(monday, 7) && s.day >= today));

  function take() {
    onapply(list.map((s) => ({ ...s, name: s.sport ? '' : s.name ? t(s.name) : '' })));
    open = false;
  }
</script>

{#snippet editor()}
  <li class="sugw-form" data-sug-form>
    <form onsubmit={saveForm}>
      <label>{t('Sport')}
        <select class="sel" bind:value={form.act} data-sug-act>
          {#each KINDS as k (k)}<option value="kind:{k}">{t(KIND_NAMES[k])}</option>{/each}
          {#each sportsAll as a (a.id)}<option value="sport:{a.id}">{sportName(a)}</option>{/each}
        </select>
      </label>
      <label>{t('Day')}
        <select class="sel" bind:value={form.day} data-sug-day>
          {#each days as d (d)}<option value={d}>{new Date(`${d}T12:00:00Z`).toLocaleDateString(lang.v, { timeZone: 'UTC', weekday: 'long' })}</option>{/each}
        </select>
      </label>
      <label>{t('Minutes')}<input class="inp num" type="number" min="5" max="1440" step="5" bind:value={form.mins} data-sug-mins /></label>
      <label>{t('Zone')}
        <select class="sel" bind:value={form.zone} data-sug-zone>
          <option value={0}>{t('no zone')}</option>
          {#each ZONE_NAMES as n, i (n)}<option value={i + 1}>Z{i + 1} {t(n)}</option>{/each}
        </select>
      </label>
      <div class="sugw-row">
        <button type="submit" class="btn hi sm" data-sug-save>{t('Save')}</button>
        <button type="button" class="btn btn-link sm" onclick={() => (form = null)}>{t('Cancel')}</button>
      </div>
    </form>
  </li>
{/snippet}

{#if !open}
  <button type="button" class="btn sm sugw-open" onclick={() => ((open = true), (variant = 0), (hoursSet = null), reset())} data-suggest-open><Sparkles size={16} aria-hidden="true" />{t('Suggestion for this week')}</button>
{:else}
  <div class="sugw" data-suggest>
    <h3 class="sugw-h">{t('Suggestion for this week')}</h3>
    {#if sug.sessions.length || edits}
      <div class="sugw-hours" data-sug-hours>
        <span>{t('Hours per week')}</span>
        <button type="button" class="ib" aria-label={t('Fewer hours')} onclick={() => stepHours(-0.5)} data-sug-minus><Minus size={16} aria-hidden="true" /></button>
        <b class="num">{num(hoursSet ?? sug.hours)}</b>
        <button type="button" class="ib" aria-label={t('More hours')} onclick={() => stepHours(0.5)} data-sug-plus><Plus size={16} aria-hidden="true" /></button>
      </div>
      <ul class="sugw-why">{#each sug.why as w (w.key)}<li>{t(w.key, w.vars)}</li>{/each}</ul>
      <ul class="sugw-list">
        {#each list as s (s.id)}
          <li data-sug-row={s.id}>
            <b>{fmt(s.day)}</b>
            <span>{label(s)}</span>
            <span class="num">{hm(s.mins)}{#if s.zone}{' · '}Z{s.zone}{/if}</span>
            <span class="sugw-ic">
              <button type="button" class="ib" aria-label={t('Change this session')} onclick={() => startEdit(s)} data-sug-edit><Pencil size={15} aria-hidden="true" /></button>
              <button type="button" class="ib" aria-label={t('Remove this session')} onclick={() => dropOne(s.id)} data-sug-drop><X size={15} aria-hidden="true" /></button>
            </span>
          </li>
          {#if form?.id === s.id}{@render editor()}{/if}
        {/each}
      </ul>
      {#if form && form.id === null}{@render editor()}{:else}
        <button type="button" class="btn btn-link sm sugw-add" onclick={() => startAdd()} data-sug-add><Plus size={15} aria-hidden="true" />{t('Add a session')}</button>
      {/if}
      <p class="sugw-sum num">{t('{n} h in total', { n: num(Math.round(list.reduce((a, x) => a + x.mins, 0) / 6) / 10) })}</p>
      <div class="sugw-row">
        <button type="button" class="btn hi sm" onclick={take} data-suggest-take>{hasWeek ? t('Take over (replaces the planned days)') : t('Take over')}</button>
        {#if VARIANTS > 1}<button type="button" class="btn sm" onclick={() => ((variant = (variant + 1) % VARIANTS), reset())} data-suggest-more>{t('Another suggestion')}</button>{/if}
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
    background: var(--paper-2);
  }
  .sugw-h {
    margin: 0;
    font-size: var(--fs-body);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .sugw-why {
    display: grid;
    gap: 0.2rem;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .sugw-list li {
    display: grid;
    grid-template-columns: 2.6rem 1fr auto auto;
    gap: 0.5rem;
    padding: 0.35rem 0;
    border-top: 1px solid var(--line);
  }
  .sugw-sum,
  .none {
    margin: 0;
    font-size: var(--fs-small);
  }
  .sugw-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }
  .sugw-hours {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .sugw-hours span {
    flex: 1;
  }
  .sugw-ic {
    display: flex;
    gap: 2px;
  }
  .sugw-add {
    justify-self: start;
  }
  .sugw-list li.sugw-form {
    display: block;
  }
  .sugw-form form {
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  }
  .sugw-form .sugw-row {
    grid-column: 1 / -1;
  }
  .sugw-form label {
    display: grid;
    gap: 0.2rem;
    font-size: var(--fs-small);
  }
</style>
