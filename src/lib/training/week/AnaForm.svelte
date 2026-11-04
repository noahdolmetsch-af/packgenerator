<script>
  /**
   * TR7d «Fitness, Müdigkeit und Form»: from the load of every activity (power, else Relative Effort) the
   * 42-day mean (fitness), the 7-day mean (fatigue) and their difference of the day before (form), one point
   * per week for 16 weeks. Observation only.
   * UI-Test 26.10.2026 T3 (G3-01): the same calculation as the page «Form» (form-data.js formOf, form.js
   * formWeeksOf), so both show the same fitness, «Müdigkeit» and form for today; form = fitness − Müdigkeit.
   * «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): an axis with round steps, the three numbers of a week when
   * pointing, a tap opens the week, «Als Tabelle» the same as rows.
   */
  import { liveQuery } from 'dexie';
  import AnaCard from '../AnaCard.svelte';
  import LineChart from '../../charts/LineChart.svelte';
  import ChartSheet from '../../charts/ChartSheet.svelte';
  import { t, num, locale } from '../../i18n.svelte.js';
  import { loadTable } from '../../messwerte-data.js';
  import { formOf } from '../../form-data.js';
  import { formWeeksOf } from '../../form.js';
  import { mondays, WEEKS } from './weeks.js';

  // acts: given to every week card; this one reads the day table like the page «Form»
  let { acts: _acts = [], today = '' } = $props();
  const q = $derived(liveQuery(async () => (today ? formWeeksOf(formOf({ table: await loadTable(), today, days: WEEKS * 7 }).series, today, mondays(today, WEEKS)) : null)));
  const data = $derived($q ?? null);
  const has = $derived(!!data && data.weeks.some((w) => w.fit > 0 || w.fat > 0));
  const signed = (v) => (v > 0 ? `+${v}` : String(v));
  const dm = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const wkText = (x) => `${t('Wk {n}', { n: x.kw })} · ${dm(x.monday)}`;
  const C = { fit: 'var(--ch-w)', fat: 'var(--ch-hr)', form: 'var(--pz4)' };

  const weeks = $derived(data?.weeks ?? []);
  const cols = $derived(weeks.map((x, i) => ({ key: x.monday, x: i % 5 === 0 ? t('Wk {n}', { n: x.kw }) : '' })));
  const series = $derived([
    { key: 'fit', color: C.fit, v: weeks.map((x) => x.fit) },
    { key: 'fat', color: C.fat, dashed: true, v: weeks.map((x) => x.fat) },
    { key: 'form', color: C.form, v: weeks.map((x) => x.form) },
  ]);
  const items = (i) => [
    { label: t('Fitness|form'), value: num(weeks[i].fit), color: C.fit },
    { label: t('Fatigue|form'), value: num(weeks[i].fat), color: C.fat },
    { label: t('Form|form'), value: signed(weeks[i].form), color: C.form },
  ];
  const readout = (i) => ({ title: wkText(weeks[i]), items: items(i) });
  const table = $derived({ head: [t('Week'), t('Fitness|form'), t('Fatigue|form'), t('Form|form')], rows: [...weeks].reverse().map((x) => ({ key: x.monday, cells: [wkText(x), num(x.fit), num(x.fat), signed(x.form)] })) });
  const label = $derived(
    has
      ? t('Fitness {f}, fatigue {a}, form {s} today; {n} weeks', { f: data.now.fit, a: data.now.fat, s: signed(data.now.form), n: WEEKS })
      : '',
  );
  let open = $state(null);
</script>

{#if has}
  <AnaCard key="form" wide sub={t('{n} weeks · from the load of every activity', { n: WEEKS })}>
    <LineChart id="form" {cols} {series} {readout} {table} {label} maxTop={0} onopen={(i) => (open = i)} hint={t('Point at a week for its numbers, tap it for the week.')} />
    <ul class="leg">
      <li><i class="k ctl"></i>{t('Fitness {n} (42-day mean)', { n: data.now.fit })}</li>
      <li><i class="k atl"></i>{t('Fatigue {n} (7-day mean)', { n: data.now.fat })}</li>
      <li><i class="k tsb"></i>{t('Form {n} (fitness – fatigue)', { n: signed(data.now.form) })}</li>
    </ul>
    <p class="sum num" data-form-sum>{t('Form {form} = fitness {fit} − fatigue {fat}', { form: signed(data.now.form), fit: num(data.now.fit), fat: num(data.now.fat) })}</p>
    <p class="cap">{t('Form above zero = rather rested, below zero = rather tired. Just to look at. Rides without a power meter count with Relative Effort from the heart rate.')}</p>
  </AnaCard>
{/if}

{#if open != null && weeks[open]}
  <ChartSheet kicker={t('Fitness, fatigue and form')} title={wkText(weeks[open])} onclose={() => (open = null)} onprev={open > 0 ? () => open-- : null} onnext={open < weeks.length - 1 ? () => open++ : null} prevLabel={t('Week before')} nextLabel={t('Next week')}>
    <ul class="shl" data-form-sheet>
      {#each items(open) as it (it.label)}<li><span>{it.label}</span><b class="num">{it.value}</b></li>{/each}
    </ul>
    <p class="cap">{t('Form {form} = fitness {fit} − fatigue {fat}', { form: signed(weeks[open].form), fit: num(weeks[open].fit), fat: num(weeks[open].fat) })}</p>
  </ChartSheet>
{/if}

<style>
  .shl {
    display: grid;
    gap: 6px;
    margin: 0 0 10px;
    padding: 0;
    list-style: none;
  }
  .shl li {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }
  .shl span {
    color: var(--ink-2);
  }
  .leg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .leg li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .k {
    display: inline-block;
    width: 14px;
    height: 0;
    border-top: 3px solid;
  }
  .k.ctl {
    border-color: var(--ch-w);
  }
  .k.atl {
    border-top-style: dashed;
    border-color: var(--ch-hr);
  }
  .k.tsb {
    border-color: var(--pz4);
  }
  .sum {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
