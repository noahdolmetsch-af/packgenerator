<script>
  /**
   * Paket O, basic block «Verlauf und Fortschritt»: how often and when (ticks of Aktiv, trips, Strava), the
   * own measures with their progress (MeasureCard), the app's suggestions while there are none (Noah «2b,
   * wenn nichts eingetragen a»), and the values from Strava that come by themselves.
   */
  import { Plus } from '@lucide/svelte';
  import MeasureCard from './MeasureCard.svelte';
  import { putItem } from '../sportsdb.js';
  import { suggestMeasures, valuesOf, stravaMeasures, UNITS, UNIT_KEYS } from '../sportsprogress.js';
  import { timesIn, lastDay } from '../sportshelp.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  let { sport, dayMap, items = [], activities = [], today, color } = $props();

  const measures = $derived(items.filter((x) => x.kind === 'measure').sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.at).localeCompare(String(b.at))));
  const sugg = $derived(suggestMeasures(sport.id, measures));
  const auto = $derived(stravaMeasures(activities, sport.id));
  const last = $derived(lastDay(dayMap));
  const total = $derived([...dayMap.values()].reduce((s, n) => s + n, 0));
  const fmt = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });
  const recent = $derived([...dayMap.keys()].sort().reverse().slice(0, 5));

  let adding = $state(false);
  let name = $state('');
  let unit = $state('kg');
  async function addMeasure(e) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    await putItem({ sport: sport.id, kind: 'measure', name: n, unit, order: (measures.at(-1)?.order ?? 0) + 1 });
    name = '';
    adding = false;
  }
  const takeSugg = (s, i) => putItem({ sport: sport.id, kind: 'measure', name: t(s.name), unit: s.unit, order: (measures.at(-1)?.order ?? 0) + 1 + i });
</script>

<p class="row" data-log-summary>
  {#if last}
    <span><b class="num">{tn(timesIn(dayMap, today, 30), '{n}× in 30 days', '{n}× in 30 days')}</b></span>
    <span class="small">{tn(total, '{n} time in all', '{n} times in all')} · {t('last {date}', { date: fmt(last) })}</span>
  {:else}
    <span class="small">{t('Not done yet. Ticks in Aktiv, finished trips, Strava and your values below count here.')}</span>
  {/if}
</p>
{#if recent.length}<p class="small">{recent.map(fmt).join(' · ')}</p>{/if}

<h3>{t('Your progress')}</h3>
{#if measures.length}
  <div class="grid2">
    {#each measures as m (m.id)}<MeasureCard measure={m} values={valuesOf(items, m.id)} {today} {color} />{/each}
  </div>
{:else}
  <p class="small">{t('Track what you want to see grow: a weight, repetitions, minutes, a level. Suggestions for this sport:')}</p>
  <div class="row" data-suggest>
    {#each sugg as s, i (s.name)}
      <button type="button" class="chip dash" onclick={() => takeSugg(s, i)}><Plus size={14} aria-hidden="true" />{t(s.name)} ({t(UNITS[s.unit].name)})</button>
    {/each}
  </div>
{/if}
{#if adding}
  <form class="add" onsubmit={addMeasure} data-add-measure-form>
    <label>{t('What do you measure?')}<input bind:value={name} placeholder={t('e.g. leg press')} /></label>
    <label>{t('Unit')}<select bind:value={unit}>{#each UNIT_KEYS as u (u)}<option value={u}>{t(UNITS[u].name)}</option>{/each}</select></label>
    <button type="submit" class="btn hi" disabled={!name.trim()}>{t('Add')}</button>
    <button type="button" class="btn" onclick={() => (adding = false)}>{t('Cancel')}</button>
  </form>
{:else}
  <button type="button" class="chip dash" onclick={() => (adding = true)} data-add-measure><Plus size={14} aria-hidden="true" />{t('Own measure')}</button>
{/if}

{#if auto.length}
  <h3>{t('From Strava, by themselves')}</h3>
  <div class="grid2">
    {#each auto as a (a.measure.id)}<MeasureCard measure={a.measure} values={a.values} {today} {color} />{/each}
  </div>
{/if}
