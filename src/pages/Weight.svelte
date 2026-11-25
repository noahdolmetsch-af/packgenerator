<script>
  import { readLite } from '../lib/actlite.js';
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
  import LineChart from '../lib/charts/LineChart.svelte';
  import ChartSheet from '../lib/charts/ChartSheet.svelte';
  import { changeSentence } from '../lib/charts/sentence.js';
  import { shiftDay } from '../lib/training.js';
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
  const actsQ = liveQuery(() => readLite(db, (T) => T.toArray()));
  const entries = $derived(weight.entries);
  const last = $derived(latestOf(entries));
  const short = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'short' });
  const sub = $derived([last ? `${num(last.kg)} kg · ${short(last.day)}` : t('No entry yet'), t('only on this device')].join(' · '));
  const keys = $derived(keysOf(ana, 'weight'));

  const long = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  const kg1 = (v) => `${num(Math.round(v * 10) / 10)} kg`;
  /** The first and the last day, and the 1st of each month between (not too close to the ends), as labels under the days. */
  function dayLabels(days) {
    const n = days.length;
    const at = (i) => (n > 1 ? i / (n - 1) : 0.5);
    const out = new Map([[0, short(days[0])]]);
    const months = [];
    days.forEach((d, i) => {
      if (d.endsWith('-01') && i > 0 && at(i) > 0.12 && at(i) < 0.88) months.push(i);
    });
    const step = Math.max(1, Math.ceil(months.length / (phone.matches ? 1 : 4)));
    months.filter((_, k) => k % step === 0).forEach((i) => out.set(i, new Date(`${days[i]}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', month: 'short' })));
    if (n > 1) out.set(n - 1, short(days.at(-1)));
    return out;
  }

  // the weight: one column per day from the first to the last entry, the entries as dots, the mean over 7 days as the line
  const wt = $derived.by(() => {
    if (entries.length < 2) return null;
    const m = mean7(entries);
    const byDay = new Map(m.map((e) => [e.day, e]));
    const days = [];
    for (let d = m[0].day; d <= m.at(-1).day; d = shiftDay(d, 1)) days.push(d);
    const lab = dayLabels(days);
    const roundKg = (v) => Math.round(v * 10) / 10;
    return {
      days,
      cols: days.map((d, i) => ({ key: d, x: lab.get(i) ?? '' })),
      series: [
        { key: 'mean', color: 'var(--hi)', v: days.map((d) => byDay.get(d)?.mean ?? null) },
        { key: 'kg', color: 'var(--ink-3)', line: false, dots: true, v: days.map((d) => byDay.get(d)?.kg ?? null) },
      ],
      readout: (i) => {
        const e = byDay.get(days[i]);
        return { title: long(days[i]), items: e ? [{ label: t('Weight|place'), value: `${num(e.kg)} kg`, color: 'var(--ink-3)' }, { label: t('Mean 7 days'), value: `${num(e.mean)} kg`, color: 'var(--hi)' }] : [{ label: t('No entry'), value: '–' }] };
      },
      table: { head: [t('Day'), t('Weight|place'), t('Mean 7 days')], rows: [...m].reverse().map((e) => ({ key: e.day, cells: [short(e.day), `${num(e.kg)} kg`, `${num(e.mean)} kg`] })) },
      sentences: changeSentence(m.map((e) => ({ label: short(e.day), v: roundKg(e.mean) })), (v) => `${num(roundKg(v))} kg`),
      now: m.at(-1),
    };
  });
  // the watts per kg: one column per week
  const wk = $derived.by(() => {
    const list = wkgWeeks($actsQ ?? [], entries, today);
    if (list.length < 2) return list.length ? { one: list[0] } : null;
    const last = list.length - 1;
    const wkgText = (v) => comma(v, 2);
    return {
      list,
      cols: list.map((p, i) => ({ key: p.monday, x: i === 0 || i === last || (!phone.matches && i === Math.floor(last / 2)) ? t('KW {n}', { n: p.kw }) : '' })),
      series: [{ key: 'wkg', color: 'var(--ch-b)', dots: list.length <= 12, v: list.map((p) => p.wkg) }],
      readout: (i) => ({ title: `${t('KW {n}', { n: list[i].kw })} · ${short(list[i].monday)}`, items: [{ label: t('W/kg (FTP ÷ weight)'), value: wkgText(list[i].wkg), color: 'var(--ch-b)' }, { label: 'FTP', value: `${list[i].ftp} W` }, { label: t('Weight|place'), value: `${num(list[i].kg)} kg` }] }),
      table: { head: [t('Week|chart'), t('W/kg (FTP ÷ weight)'), 'FTP', t('Weight|place')], rows: [...list].reverse().map((p) => ({ key: p.monday, cells: [`${t('KW {n}', { n: p.kw })} · ${short(p.monday)}`, wkgText(p.wkg), `${p.ftp} W`, `${num(p.kg)} kg`] })) },
      sentences: changeSentence(list.map((p) => ({ label: t('KW {n}', { n: p.kw }), v: p.wkg })), (v) => `${comma(v, 2)} W/kg`),
      now: list.at(-1),
    };
  });
  // a tap on a day or a week opens its sheet
  let dayOpen = $state(null);
  let wkOpen = $state(null);
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
    <button type="button" class="btn hi" onclick={() => openForm()} data-weight-add><Plus size={20} aria-hidden="true" />{t('Enter weight')}</button>
  </div>

  {#if entries.length > 1}<AnaHead id="wt-h" title={t('Over time|weight')} groups={['weight']} />{/if}
  {#each keys as k (k)}
    {#if k === 'wtime' && wt}
      <AnaCard key="wtime" sub={t('Dots = entries · line = mean over 7 days')}>
        <LineChart id="weight" cols={wt.cols} series={wt.series} readout={wt.readout} sentences={wt.sentences} unit="kg" bridge onopen={(i) => (dayOpen = wt.days[i])} table={wt.table} hint={t('Point at a day for its numbers, tap it to change or add the entry.')} label={t('Weight, mean over 7 days now {c} kg', { c: num(wt.now.mean) })} />
        <p class="lg"><span><i class="lsw ln"></i>{t('Mean 7 days')}</span><span><i class="lsw dt"></i>{t('Entry')}</span></p>
        <p class="cap">{t('Only your entries. No goal, no rating.')}</p>
      </AnaCard>
    {:else if k === 'wkgtime' && wk}
      <AnaCard key="wkgtime" sub={t('FTP estimated ÷ weight, per week')}>
        {#if wk.list}
          <LineChart id="wkg" cols={wk.cols} series={wk.series} readout={wk.readout} sentences={wk.sentences} onopen={(i) => (wkOpen = i)} table={wk.table} hint={t('Point at a week for its numbers, tap it for what is behind.')} label={t('Watts per kg now {n}', { n: comma(wk.now.wkg, 2) })} height={170} />
          <p class="lg"><span><i class="lsw or"></i>{t('W/kg (FTP ÷ weight)')}</span></p>
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
{#if dayOpen && wt}
  {@const i = wt.days.indexOf(dayOpen)}
  {@const e = entries.find((x) => x.day === dayOpen)}
  <ChartSheet kicker={t('Weight|place')} title={long(dayOpen)} onclose={() => (dayOpen = null)} onprev={i > 0 ? () => (dayOpen = wt.days[i - 1]) : null} onnext={i < wt.days.length - 1 ? () => (dayOpen = wt.days[i + 1]) : null} prevLabel={t('Day before')} nextLabel={t('Next day')}>
    <ul class="shl" data-weight-chart-sheet>
      <li><span>{t('Weight|place')}</span><b class="num">{e ? `${num(e.kg)} kg` : '–'}</b></li>
      {#if e}<li><span>{t('Mean 7 days')}</span><b class="num">{num(mean7(entries).find((x) => x.day === dayOpen)?.mean)} kg</b></li>{/if}
    </ul>
    <button type="button" class="btn" onclick={() => { const d = dayOpen; dayOpen = null; openForm(d); }} data-weight-chart-edit>{e ? t('Change the entry') : t('Add an entry for this day')}</button>
  </ChartSheet>
{/if}
{#if wkOpen != null && wk?.list?.[wkOpen]}
  {@const p = wk.list[wkOpen]}
  <ChartSheet kicker={t('W/kg (FTP ÷ weight)')} title={`${t('KW {n}', { n: p.kw })} · ${short(p.monday)}`} onclose={() => (wkOpen = null)} onprev={wkOpen > 0 ? () => wkOpen-- : null} onnext={wkOpen < wk.list.length - 1 ? () => wkOpen++ : null} prevLabel={t('Week before')} nextLabel={t('Next week')}>
    <ul class="shl" data-wkg-chart-sheet>
      <li><span>{t('W/kg (FTP ÷ weight)')}</span><b class="num">{comma(p.wkg, 2)}</b></li>
      <li><span>FTP</span><b class="num">{p.ftp} W</b></li>
      <li><span>{t('Weight|place')}</span><b class="num">{num(p.kg)} kg</b></li>
    </ul>
  </ChartSheet>
{/if}
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
  .lsw {
    display: inline-block;
    width: 16px;
    height: 3px;
    border-radius: 2px;
  }
  .lsw.ln {
    background: var(--hi);
  }
  .lsw.dt {
    background: var(--ink-3);
  }
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
  .lsw.or {
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
