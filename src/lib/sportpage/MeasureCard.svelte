<script>
  /**
   * Paket O «Verlauf und Fortschritt»: one measure (Beinpresse in kg, Saunagänge, a pace): the last value,
   * the best with a star, «+10 kg in 6 Wochen», this month against the month before, the curve and the
   * quick entry with the last values pre-filled and + / −. Auto measures (from Strava) only show.
   */
  import { Minus, Plus, Star, Pencil, Trash2, ChevronDown } from '@lucide/svelte';
  import LineChart from '../charts/LineChart.svelte';
  import ChartSheet from '../charts/ChartSheet.svelte';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { putItem, patchItem, dropItems, restoreItems } from '../sportsdb.js';
  import { lastOf, bestOf, changeOf, monthCompare, parseValue, stepValue, valueText, newValue, UNITS, UNIT_KEYS } from '../sportsprogress.js';
  import { measureName, withUnit } from './words.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';

  let { measure, values = [], today, color = 'var(--accent)' } = $props();

  const name = $derived(measureName(measure));
  const last = $derived(lastOf(values));
  const best = $derived(bestOf(values, measure.unit));
  const change = $derived(changeOf(values, measure.unit));
  const month = $derived(monthCompare(values, measure.unit, today));
  const fmt = (n) => num(n);
  const show = (v) => withUnit(v, measure.unit, fmt);
  const dayText = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'short' });
  const signed = (d) => (d > 0 ? '+' : d < 0 ? '−' : '±') + withUnit(Math.abs(d), measure.unit === 'grade' ? 'count' : measure.unit, fmt).replace(' ×', '');

  // the quick entry: the last values pre-filled
  let v = $state(null);
  let reps = $state(null);
  let sets = $state(null);
  let day = $state('');
  let open = $state(false);
  let editing = $state(null);
  $effect(() => {
    if (v == null && !measure.auto) {
      v = last ? valueText(last.v, measure.unit) : '';
      reps = last?.reps ?? null;
      sets = last?.sets ?? null;
      day = today;
    }
  });
  const kg = $derived(measure.unit === 'kg');
  function bump(dir) {
    const now = parseValue(v, measure.unit) ?? (measure.unit === 'grade' ? 10 : 0);
    v = valueText(stepValue(now, measure.unit, dir), measure.unit);
  }
  const parsed = $derived(parseValue(v, measure.unit));
  async function save(e) {
    e.preventDefault();
    if (parsed == null) return;
    await putItem(newValue(measure, { day: day || today, v: parsed, reps: Number(reps), sets: Number(sets) }));
  }
  async function delValue(x) {
    const label = `${dayText(x.day)} · ${show(x.v)}`;
    if ((await askDelete({ title: t('Delete «{name}»?', { name: label }), text: t('Only this value goes.') })) !== 'delete') return;
    await deleteWithUndo({ run: () => dropItems([x.id]), undo: restoreItems, text: t('"{name}" deleted.', { name: label }), name: label });
  }
  async function delMeasure() {
    const n = values.length;
    if ((await askDelete({ title: t('Delete «{name}»?', { name }), text: n ? tn(n, 'Its {n} value goes too.', 'Its {n} values go too.') : t('It has no values yet.') })) !== 'delete') return;
    await deleteWithUndo({ run: () => dropItems([measure.id, ...values.map((x) => x.id)]), undo: restoreItems, text: t('"{name}" deleted.', { name }), name });
  }
  async function saveEdit(e) {
    e.preventDefault();
    const n = editing.name.trim();
    if (n) await patchItem(measure.id, { name: n, unit: editing.unit });
    editing = null;
  }
  const label = $derived(t('Curve of {name}: {n} values', { name, n: values.length }));
  const newest = $derived([...values].reverse());

  // «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): the curve is the shared line chart. One column per value
  // (the last 24, oldest left), the exact value when pointing, a tap opens it, «As table» lists them.
  const shownVals = $derived(values.slice(-24));
  const cols = $derived(shownVals.map((x, i) => ({ key: String(x.id ?? i), x: i === 0 || i === shownVals.length - 1 ? dayText(x.day) : '' })));
  const series = $derived([{ key: 'v', color, v: shownVals.map((x) => x.v) }]);
  const setsText = (x) => [x.sets ? tn(x.sets, '{n} set', '{n} sets') : '', x.reps ? tn(x.reps, '{n} rep', '{n} reps') : ''].filter(Boolean).join(' × ');
  const readout = (i) => ({ title: dayText(shownVals[i].day), items: [{ label: t('Value'), value: show(shownVals[i].v), color }, ...(setsText(shownVals[i]) ? [{ label: t('Sets'), value: setsText(shownVals[i]) }] : [])] });
  const table = $derived({ head: [t('Day'), name], rows: [...shownVals].reverse().map((x, k) => ({ key: `${x.id ?? k}`, cells: [dayText(x.day), `${show(x.v)}${setsText(x) ? ` · ${setsText(x)}` : ''}`] })) });
  let sel = $state(null);
</script>

<div class="meas" data-measure={name}>
  <div class="hl">
    {#if editing}
      <form class="add" onsubmit={saveEdit}>
        <label>{t('Name')}<input bind:value={editing.name} /></label>
        <label>{t('Unit')}<select bind:value={editing.unit}>{#each UNIT_KEYS as u (u)}<option value={u}>{t(UNITS[u].name)}</option>{/each}</select></label>
        <button type="submit" class="btn hi">{t('Save')}</button>
        <button type="button" class="btn" onclick={() => (editing = null)}>{t('Cancel')}</button>
      </form>
    {:else}
      <h3>{name}{#if measure.auto}<small> · {t('from Strava')}</small>{/if}</h3>
      {#if !measure.auto}
        <span class="row">
          <button type="button" class="ibtn" aria-label={t('Change «{name}»', { name })} onclick={() => (editing = { name: measure.name, unit: measure.unit })}><Pencil size={16} aria-hidden="true" /></button>
          <button type="button" class="ibtn" aria-label={t('Delete «{name}»', { name })} onclick={delMeasure}><Trash2 size={16} aria-hidden="true" /></button>
        </span>
      {/if}
    {/if}
  </div>
  {#if last}
    <p class="row"><span class="big num" data-last>{show(last.v)}</span>{#if last.reps || last.sets}<span class="small">{[last.sets ? tn(last.sets, '{n} set', '{n} sets') : '', last.reps ? tn(last.reps, '{n} rep', '{n} reps') : ''].filter(Boolean).join(' × ')}</span>{/if}<span class="small">{dayText(last.day)}</span></p>
    <p class="small row">
      {#if best}<span data-best><Star size={14} class="star" aria-hidden="true" /> {t('Best: {v} ({date})', { v: show(best.v), date: dayText(best.day) })}</span>{/if}
    </p>
    {#if change && change.diff !== 0}
      <p class={change.better ? 'up' : 'down'} data-change>{t('{name} {diff} in {weeks}', { name, diff: signed(change.diff), weeks: tn(change.weeks, '{n} week', '{n} weeks') })}</p>
    {/if}
    {#if month.now != null && month.before != null}
      <p class="small" data-month>{t('Last 30 days {now}, the 30 before {before}', { now: show(month.now), before: show(month.before) })}{#if month.better != null}{' · '}<span class={month.better ? 'up' : 'down'}>{month.better ? t('better') : t('lower')}</span>{/if}</p>
    {/if}
    {#if values.length > 1}
      <LineChart id="measure" {cols} {series} {readout} {table} {label} tick={(x) => show(x)} topText={(x) => show(x)} height={130} onopen={(i) => (sel = i)} hint={t('Point at a value for its numbers, tap it for the day.')} />
    {/if}
  {:else}
    <p class="none">{t('No value yet. Enter the first one below.')}</p>
  {/if}

  {#if !measure.auto}
    <form class="add" onsubmit={save} data-quick={name}>
      <div class="pm">
        <button type="button" class="ibtn" aria-label={t('Less')} onclick={() => bump(-1)}><Minus size={18} aria-hidden="true" /></button>
        <label class="vh" for="mv-{measure.id}">{t('Value of {name}', { name })}</label>
        <input id="mv-{measure.id}" bind:value={v} inputmode={measure.unit === 'pace' || measure.unit === 'grade' ? 'text' : 'decimal'} placeholder={measure.unit === 'pace' ? '5:30' : measure.unit === 'grade' ? '6a+' : ''} />
        <button type="button" class="ibtn" aria-label={t('More')} onclick={() => bump(1)}><Plus size={18} aria-hidden="true" /></button>
        <span class="small">{UNITS[measure.unit]?.short ? t(UNITS[measure.unit].short) : ''}</span>
      </div>
      {#if kg}
        <label>{t('Sets')}<input type="number" min="0" bind:value={sets} /></label>
        <label>{t('Repetitions')}<input type="number" min="0" bind:value={reps} /></label>
      {/if}
      <label>{t('Day')}<input type="date" bind:value={day} max={today} /></label>
      <button type="submit" class="btn hi" disabled={parsed == null}>{t('Save')}</button>
    </form>
  {/if}
  {#if values.length}
    <button type="button" class="lnk" aria-expanded={open} onclick={() => (open = !open)}><ChevronDown size={14} aria-hidden="true" /> {tn(values.length, 'All {n} value', 'All {n} values')}</button>
    {#if open}
      <ul class="ilist">
        {#each newest.slice(0, 60) as x (x.id)}
          <li><span class="ent"><b class="num">{show(x.v)}{#if x.sets || x.reps}{' '}· {[x.sets, x.reps].filter(Boolean).join(' × ')}{/if}</b><small>{dayText(x.day)}</small></span>{#if !measure.auto}<button type="button" class="ibtn" aria-label={t('Delete the value of {date}', { date: dayText(x.day) })} onclick={() => delValue(x)}><Trash2 size={16} aria-hidden="true" /></button>{/if}</li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

{#if sel != null && shownVals[sel]}
  {@const x = shownVals[sel]}
  <ChartSheet kicker={name} title={dayText(x.day)} onclose={() => (sel = null)} onprev={sel > 0 ? () => sel-- : null} onnext={sel < shownVals.length - 1 ? () => sel++ : null} prevLabel={t('Value before')} nextLabel={t('Next value')}>
    <ul class="shl" data-measure-sheet>
      <li><span>{name}</span><b class="num">{show(x.v)}</b></li>
      {#if setsText(x)}<li><span>{t('Sets')}</span><b class="num">{setsText(x)}</b></li>{/if}
      {#if best && best.id === x.id}<li><span>{t('Best')}</span><b class="num">★</b></li>{/if}
    </ul>
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
</style>
