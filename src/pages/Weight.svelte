<script>
  /**
   * TR6/TR6b «Gewicht» (Noah 13.10.2026 «a», 14.10.2026 «TR5–TR7 freigegeben»): Ich › Meine Daten ›
   * Gewicht (#/me/weight). Voluntary, only for watts per kg; stays on this device, never sent to Strava
   * or a server. Enter a weight (a day and kg), change or remove an entry, see the weight over time with
   * a 7-day mean and watts per kg over the weeks. Both charts can be hidden («…»). Observation only:
   * no goal, no rating. The weekly ask on Heute is not here (it comes via «Deine Abfragen»).
   */
  import { liveQuery } from 'dexie';
  import { Plus, Scale } from '@lucide/svelte';
  import Crumb from '../lib/flow/kit/Crumb.svelte';
  import PageHead from '../lib/ui/PageHead.svelte';
  import AnaCard from '../lib/training/AnaCard.svelte';
  import AnaHead from '../lib/training/AnaHead.svelte';
  import AnaSheet from '../lib/training/AnaSheet.svelte';
  import { ana } from '../lib/training/analyses.svelte.js';
  import { keysOf } from '../lib/training/analyses.js';
  import LineChart from '../lib/weight/LineChart.svelte';
  import { backClose } from '../lib/ui/backclose.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import { db } from '../lib/db.js';
  import { weight, saveWeight } from '../lib/weight.svelte.js';
  import { cleanKg, latestOf, KG_MIN, KG_MAX } from '../lib/weight.js';
  import { mean7, wkgWeeks } from '../lib/weightcharts.js';
  import { phone } from '../lib/media.svelte.js';
  import { localDay } from '../lib/localday.js';
  import { t, num, locale } from '../lib/i18n.svelte.js';

  const today = localDay();
  const actsQ = liveQuery(() => db.activities.toArray());
  const entries = $derived(weight.entries);
  const last = $derived(latestOf(entries));
  const short = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'short' });
  const sub = $derived([last ? `${num(last.kg)} kg · ${short(last.day)}` : t('No entry yet'), t('only on this device')].join(' · '));
  const keys = $derived(keysOf(ana, 'weight'));

  // x from 0 to 1 over the days between the first and the last point
  const dayNo = (d) => Date.parse(`${d}T12:00:00Z`) / 864e5;
  function xs(days) {
    const a = dayNo(days[0]);
    const b = dayNo(days.at(-1));
    return (d) => (b > a ? (dayNo(d) - a) / (b - a) : 0.5);
  }
  /** The first and the last day, and the 1st of each month between (not too close to the ends). */
  function dayLabels(days) {
    const x = xs(days);
    const out = [{ x: 0, text: short(days[0]) }];
    const max = phone.matches ? 1 : 4;
    const months = [];
    for (let m = days[0].slice(0, 7); m <= days.at(-1).slice(0, 7); ) {
      const first = `${m}-01`;
      if (first > days[0] && x(first) > 0.12 && x(first) < 0.88) months.push(first);
      const [y, mo] = m.split('-').map(Number);
      m = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`;
    }
    const step = Math.max(1, Math.ceil(months.length / max));
    months.filter((_, i) => i % step === 0).forEach((d) => out.push({ x: x(d), text: new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', month: 'short' }) }));
    if (days.length > 1) out.push({ x: 1, text: short(days.at(-1)) });
    return out;
  }
  const range = (vals, step) => {
    const lo = Math.floor(Math.min(...vals) / step) * step;
    const hi = Math.ceil(Math.max(...vals) / step) * step;
    const out = [];
    for (let v = lo; v <= hi + step / 2; v += step) out.push(Math.round(v * 100) / 100);
    return out.length > 6 ? out.filter((_, i) => i % Math.ceil(out.length / 5) === 0) : out;
  };

  const wt = $derived.by(() => {
    if (entries.length < 2) return null;
    const m = mean7(entries);
    const days = m.map((e) => e.day);
    const x = xs(days);
    const span = Math.max(...m.map((e) => e.kg)) - Math.min(...m.map((e) => e.kg));
    return {
      dots: m.map((e) => ({ x: x(e.day), y: e.kg })),
      line: m.map((e) => ({ x: x(e.day), y: e.mean })),
      ticks: range(m.map((e) => e.kg), span > 6 ? 2 : span > 3 ? 1 : 0.5),
      labels: dayLabels(days),
      now: m.at(-1),
    };
  });
  const wk = $derived.by(() => {
    const list = wkgWeeks($actsQ ?? [], entries, today);
    if (list.length < 2) return list.length ? { one: list[0] } : null;
    const x = (i) => i / (list.length - 1);
    const lab = phone.matches ? [0, list.length - 1] : [0, Math.floor((list.length - 1) / 2), list.length - 1];
    return {
      line: list.map((p, i) => ({ x: x(i), y: p.wkg })),
      ticks: range(list.map((p) => p.wkg), 0.1),
      labels: [...new Set(lab)].map((i) => ({ x: x(i), text: t('KW {n}', { n: list[i].kw }) })),
      now: list.at(-1),
    };
  });
  const wkNow = $derived(wk?.now ?? wk?.one ?? null);
  const comma = (v, d = 1) => Number(v).toLocaleString(locale(), { minimumFractionDigits: d, maximumFractionDigits: d });

  // the sheet: a day and kg, «Speichern», «Abbrechen», «Entfernen» (that day's entry)
  let dialog = $state();
  let form = $state({ day: today, kg: '', had: false });
  let err = $state('');
  function openForm(day = today) {
    const e = entries.find((x) => x.day === day);
    form = { day, kg: e ? num(e.kg) : last ? num(last.kg) : '', had: !!e };
    err = '';
    dialog?.showModal();
  }
  async function save(e) {
    e.preventDefault();
    const kg = cleanKg(form.kg);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.day) || form.day > today) return (err = t('Pick a day up to today.'));
    if (kg == null) return (err = t('Please a weight between {a} and {b} kg.', { a: KG_MIN, b: KG_MAX }));
    const before = entries.find((x) => x.day === form.day)?.kg ?? null;
    await saveWeight(form.day, kg);
    dialog.close();
    offerDone(t('{kg} kg saved for {day}.', { kg: num(kg), day: short(form.day) }), () => saveWeight(form.day, before));
  }
  async function remove() {
    const day = form.day;
    const before = entries.find((x) => x.day === day)?.kg ?? null;
    await saveWeight(day, null);
    dialog.close();
    if (before != null) offerDone(t('Entry of {day} removed.', { day: short(day) }), () => saveWeight(day, before));
  }
</script>

<div class="wtp">
  <header class="ph">
    <Crumb path={[{ href: '#/me', label: t('Me|place') }]} here={t('Weight|place')} />
    <PageHead title={t('Weight|place')} {sub} />
  </header>

  <div class="top card">
    <span class="ib" aria-hidden="true"><Scale size={20} /></span>
    <p>{t('Voluntary, only for watts per kg in Training and the tours. Stays only on this device, never goes to Strava or a server. No entry = no W/kg.')}</p>
    <button type="button" class="btn hi" onclick={() => openForm()} data-weight-add><Plus size={18} aria-hidden="true" />{t('Enter weight')}</button>
  </div>

  {#if entries.length > 1}<AnaHead id="wt-h" title={t('Over time|weight')} groups={['weight']} />{/if}
  {#each keys as k (k)}
    {#if k === 'wtime' && wt}
      <AnaCard key="wtime" sub={t('Dots = entries · line = mean over 7 days')}>
        <LineChart dots={wt.dots} line={wt.line} ticks={wt.ticks} labels={wt.labels} fmt={(v) => num(v)} label={t('Weight from {a} to {b} kg, mean over 7 days now {c} kg', { a: num(Math.min(...wt.dots.map((d) => d.y))), b: num(Math.max(...wt.dots.map((d) => d.y))), c: num(wt.now.mean) })} />
        <p class="lg"><span><i class="sw ln"></i>{t('Mean 7 days')}</span><span><i class="sw dt"></i>{t('Entry')}</span></p>
        <p class="cap">{t('Only your entries. No goal, no rating.')}</p>
      </AnaCard>
    {:else if k === 'wkgtime' && wk}
      <AnaCard key="wkgtime" sub={t('FTP estimated ÷ weight, per week')}>
        {#if wk.line}
          <LineChart line={wk.line} ticks={wk.ticks} labels={wk.labels} fmt={(v) => comma(v)} color="var(--ch-b)" label={t('Watts per kg now {n}', { n: comma(wk.now.wkg, 2) })} height={170} />
          <p class="lg"><span><i class="sw or"></i>{t('W/kg (FTP ÷ weight)')}</span></p>
        {/if}
        <p class="cap num">{t('Today {w} W ÷ {kg} kg = {r} W/kg. Weeks without a ride with a power meter keep the value of the week before.', { w: wkNow.ftp, kg: num(wkNow.kg), r: comma(wkNow.wkg, 2) })}</p>
      </AnaCard>
    {/if}
  {/each}
  {#if entries.length < 2}<p class="hint">{entries.length ? t('From the second entry on a curve shows here.') : t('Enter your weight once; with more entries a curve shows here.')}</p>{/if}

  {#if entries.length}
    <section class="list" aria-labelledby="wt-list-h">
      <h2 id="wt-list-h">{t('Entries')}</h2>
      <ul class="card">
        {#each [...entries].reverse().slice(0, 12) as e (e.day)}
          <li><button type="button" class="row" onclick={() => openForm(e.day)} data-weight-day={e.day}><span>{short(e.day)}</span><b class="num">{num(e.kg)} kg</b></button></li>
        {/each}
      </ul>
    </section>
  {/if}
</div>

<dialog class="sheet wts" bind:this={dialog} use:backClose aria-labelledby="wts-h" data-weight-sheet>
  <form onsubmit={save}>
    <div class="hd"><h2 id="wts-h" class="title">{t('Weight|place')}</h2><span class="muted">{t('voluntary')}</span></div>
    <div class="two">
      <label><span class="lbl">{t('Day')}</span><input class="inp" type="date" max={today} bind:value={form.day} /></label>
      <label><span class="lbl">{t('Weight in kg')}</span><span class="kg"><input class="inp num" type="text" inputmode="decimal" autocomplete="off" bind:value={form.kg} data-weight-kg /><span>kg</span></span></label>
    </div>
    <p class="muted small">{t('Only for watts per kg in Training and the tours. Stays only on this device, never goes to Strava or a server.')}</p>
    {#if err}<p class="err" role="alert">{err}</p>{/if}
    <div class="acts">
      <button type="submit" class="btn hi">{t('Save')}</button>
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      {#if entries.some((x) => x.day === form.day)}<button type="button" class="btn end" onclick={remove}>{t('Remove|weight')}</button>{/if}
    </div>
  </form>
</dialog>
<AnaSheet />

<style>
  .wtp {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 1240px;
    margin: 0 auto;
    min-width: 0;
  }
  .wtp :global(.pagehead) {
    margin: 0;
  }
  .top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 16px;
    padding: 16px 18px;
  }
  .top p {
    flex: 1 1 280px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ib {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--hi-soft, var(--line));
    color: var(--hi);
    flex: none;
  }
  .lg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .lg span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .sw {
    display: inline-block;
    width: 16px;
    height: 3px;
    border-radius: 2px;
  }
  .sw.ln {
    background: var(--hi);
  }
  .sw.dt {
    background: var(--hi);
    opacity: 0.45;
  }
  .sw.or {
    background: var(--ch-b);
  }
  .hint {
    margin: 0;
    color: var(--ink-3);
  }
  .list h2 {
    margin: 0 2px var(--sp-2);
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .list ul {
    list-style: none;
    margin: 0;
    padding: 4px 16px;
  }
  .list li + li {
    border-top: 1px solid var(--line);
  }
  .row {
    display: flex;
    justify-content: space-between;
    width: 100%;
    min-height: 44px;
    align-items: center;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  .wts form {
    display: grid;
    gap: 12px;
  }
  .hd {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .hd h2 {
    margin: 0;
  }
  .two {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  label {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  .kg {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .kg input {
    flex: 1;
    min-width: 0;
  }
  .small {
    margin: 0;
    font-size: var(--fs-small);
  }
  .err {
    margin: 0;
    color: var(--warn-ink, var(--z5));
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .acts .end {
    margin-left: auto;
  }
</style>
