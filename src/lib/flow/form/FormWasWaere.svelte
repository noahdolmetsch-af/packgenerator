<script>
  /**
   * «Was wäre, wenn …» (Noah 03.11.2026, Cockpit-Idee 2) on «Form und Erholung»: pick a day in the next week,
   * compare a pause, a short and a long session (and the plan, if one is planned that day) by fitness,
   * fatigue and form 1, 3 and 7 days later. A model with a range, never a forecast: only what load can
   * explain. Resting pulse, HRV and sleep are not here on purpose. Rules and numbers: wenn.js.
   * Noah 23.11.2026 «ja»: the answer is a few plain sentences (each option against a pause, after a week); minutes, zone, the
   * other values and the table with its ranges are folded under «Change it and see all numbers». Nothing is gone.
   */
  import Seg from '../../ui/Seg.svelte';
  import { dayLoads } from '../../form.js';
  import { addDays } from '../../health.js';
  import { plannedByDay, actsByDayOf } from './landschaft.js';
  import { optionsFor, whatIf, CHOOSE_DAYS, CHECKS, DEFAULTS, MINS_MIN, MINS_MAX } from './wenn.js';
  import { ChevronDown } from '@lucide/svelte';
  import { t, tn, num, locale } from '../../i18n.svelte.js';

  let { f, today } = $props();

  const dayOf = (i) => addDays(today, i);
  const choices = Array.from({ length: CHOOSE_DAYS }, (_, i) => dayOf(i + 1));
  const long = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const signed = (v) => (v > 0 ? `+${num(v)}` : v < 0 ? `−${num(-v)}` : num(0));

  let day = $state(dayOf(1));
  let short = $state(DEFAULTS.short);
  let longM = $state(DEFAULTS.long);
  let zone = $state(DEFAULTS.zone);
  let metric = $state('form');

  const acts = $derived([...f.table.values()].flatMap((r) => r.acts ?? []));
  const loads = $derived(dayLoads(acts, f.opts));
  const hasLoad = $derived([...loads.values()].some((v) => v > 0));
  const planned = $derived(plannedByDay(f.plan ?? [], actsByDayOf(acts), today));
  const options = $derived(optionsFor({ planned, day, short, long: longM, zone }));
  const result = $derived(whatIf({ loads, planned, today, day, options }));
  const fmt = (m) => (metric === 'form' ? signed(m.v) : num(m.v));
  const range = (m) => (m.lo === m.hi ? '' : `${metric === 'form' ? signed(m.lo) : num(m.lo)} … ${metric === 'form' ? signed(m.hi) : num(m.hi)}`);
  const name = (o) =>
    o.key === 'plan' ? t('As planned|ww') : o.key === 'pause' ? t('Pause|ww') : o.key === 'short' ? t('Short: {n} min|ww', { n: num(o.mins) }) : t('Long: {n} min|ww', { n: num(o.mins) });

  // plain sentences: every option against a pause, the form after a week (the last check)
  const SAME = 1; // up to this many points counts as «about the same»
  const lines = $derived.by(() => {
    const p = result.find((o) => o.key === 'pause');
    if (!p) return [];
    const k = CHECKS.length - 1;
    return result
      .filter((o) => o.key !== 'pause')
      .map((o) => {
        const d = o.points[k].form.v - p.points[k].form.v;
        const cmp = Math.abs(d) <= SAME ? t('about the same as with a pause|ww') : d > 0 ? t('{d} points higher than with a pause|ww', { d: num(d) }) : t('{d} points lower than with a pause|ww', { d: num(-d) });
        return { key: o.key, name: name(o), text: t('After a week your form is {cmp} (a model).|ww', { cmp }) };
      });
  });
  const checkName = (k) => (k === 1 ? t('The day after|ww') : tn(k, 'After {n} day|ww', 'After {n} days|ww'));
</script>

{#if hasLoad}
  <div class="ww" data-whatif>
    <label class="fld day"><span>{t('Which day?|ww')}</span>
      <select class="inp" bind:value={day} data-ww-day>
        {#each choices as d (d)}<option value={d}>{long(d)}</option>{/each}
      </select>
    </label>
    {#if lines.length}
      <p class="lead">{t('Compared with a pause on {day}:|ww', { day: long(day) })}</p>
      <ul class="sen" data-ww-sentence>
        {#each lines as l (l.key)}<li data-ww-line={l.key}><b>{l.name}</b> {l.text}</li>{/each}
      </ul>
    {/if}

    <details class="more" data-ww-more>
      <summary><span>{t('Change it and see all numbers|ww')}</span><ChevronDown class="cv" size={16} aria-hidden="true" /></summary>
      <div class="row">
        <label class="fld"><span>{t('Short, minutes|ww')}</span><input class="inp" type="number" inputmode="numeric" min={MINS_MIN} max={MINS_MAX} bind:value={short} data-ww-short /></label>
        <label class="fld"><span>{t('Long, minutes|ww')}</span><input class="inp" type="number" inputmode="numeric" min={MINS_MIN} max={MINS_MAX} bind:value={longM} data-ww-long /></label>
        <label class="fld"><span>{t('Zone|ww')}</span>
          <select class="inp" bind:value={zone} data-ww-zone>{#each [1, 2, 3, 4, 5] as z (z)}<option value={z}>Z{z}</option>{/each}</select>
        </label>
      </div>
      <Seg small full={false} label={t('Show|layer')} value={metric} onchange={(v) => (metric = v)} options={[{ key: 'form', name: t('Form|form') }, { key: 'fat', name: t('Fatigue|form') }, { key: 'fit', name: t('Fitness|form') }]} />
      {#if result.length}
        <div class="tw">
          <table data-ww-table>
            <thead>
              <tr>
                <td></td>
                {#each result as o (o.key)}<th scope="col" data-ww-col={o.key}>{name(o)}<small class="num">{t('~load {n}|ls', { n: num(o.load) })}</small></th>{/each}
              </tr>
            </thead>
            <tbody>
              {#each CHECKS as k, i (k)}
                <tr>
                  <th scope="row">{checkName(k)}<small>{long(result[0].points[i].day)}</small></th>
                  {#each result as o (o.key)}
                    {@const m = o.points[i][metric]}
                    <td data-ww-cell="{o.key}-{k}"><b class="num">{fmt(m)}</b>{#if range(m)}<small class="num">{range(m)}</small>{/if}</td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </details>
    <p class="hint" data-ww-note>{t('A model, not a forecast: the small numbers are the range if all coming loads are 25 % lower or higher than estimated. Planned and new sessions count by minutes and zone.|ww')}</p>
    <p class="hint">{t('Resting pulse, HRV and sleep cannot be predicted from a plan, so they are not here. Only fitness, fatigue and form.|ww')} <a href="#/flow/training">{t('Plan it in Training|ww')}</a></p>
  </div>
{:else}
  <p class="wait" data-ww-empty>{t('«What if» comes with your first activities from Strava: it needs your load to start from.|ww')}</p>
{/if}

<style>
  .ww {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
    gap: 8px;
  }
  .fld {
    display: grid;
    gap: 4px;
    min-width: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .fld :global(.inp) {
    min-width: 0;
    width: 100%;
  }
  .day {
    max-width: 14rem;
  }
  .lead {
    margin: 0;
    color: var(--ink-2);
  }
  .sen {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .more summary {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    cursor: pointer;
    list-style: none;
    color: var(--ink-2);
  }
  .more summary::-webkit-details-marker {
    display: none;
  }
  .more[open] :global(.cv) {
    transform: rotate(180deg);
  }
  .more > :global(*:not(summary)) {
    margin-top: 8px;
  }
  .tw {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-variant-numeric: tabular-nums;
  }
  th,
  td {
    padding: 8px 6px;
    text-align: right;
    vertical-align: top;
    border-bottom: 1px solid var(--line);
  }
  thead th {
    color: var(--ink-3);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
  }
  tbody th {
    text-align: left;
    font-weight: 400;
    font-size: var(--fs-small);
  }
  small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-weight: 400;
  }
  td b {
    font-size: var(--fs-body);
  }
  .hint,
  .wait {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hint a {
    color: inherit;
  }
</style>
