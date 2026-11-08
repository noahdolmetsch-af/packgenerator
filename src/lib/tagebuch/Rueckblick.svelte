<script>
  /**
   * «Tagebuch» › Rückblick (Noah 20.10.2026 «1a 2a 4b»): the mood curve of the last 90 days and what goes
   * together with it (observation only, never a cause), the words of a month as a cloud, calm series that
   * stay once reached, and Gemini (only with a tick, each time): sum up a month, ask your diary.
   * «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): the mood curve is the shared line chart: the smileys as the
   * axis, the mood of a day when pointing, a tap opens the day, «As table» lists the days with an entry.
   */
  import { ChevronLeft, ChevronRight, Sparkles, Flame, Award, Plus } from '@lucide/svelte';
  import LineChart from '../charts/LineChart.svelte';
  import ChartSheet from '../charts/ChartSheet.svelte';
  import { moodOf, moodSeries, moodPairs, topWords, cloudSize, longestStreak, milestones } from './insights.js';
  import { askContext, periodContext, diaryAi } from './ai.js';
  import { geminiError } from '../assistent/gemini.js';
  import { moodContext, saveEntry } from './journaldb.js';
  import { shiftMonth, stats } from './journal.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t, tn, lang, locale } from '../i18n.svelte.js';

  let { entries = [], today } = $props();

  /* ---------- mood ---------- */
  const DAYS = 90;
  const series = $derived(moodSeries(entries, today, DAYS));
  let ctx = $state({ rideDays: new Set(), sleep: {} });
  moodContext().then((c) => (ctx = c));
  const pairs = $derived(moodPairs(entries, ctx).slice(0, 4));
  const dayAt = (i) => {
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - (DAYS - 1 - i));
    return d.toISOString().slice(0, 10);
  };
  const dayName = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'long' });
  const dayShort = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'short' });
  const byDay = $derived(Object.fromEntries(series.map((p) => [p.day, p.mood])));
  const days = $derived(Array.from({ length: DAYS }, (_, i) => dayAt(i)));
  const cols = $derived(days.map((d, i) => ({ key: d, x: (DAYS - 1 - i) % 30 === 0 ? dayShort(d) : '' })));
  const lc = $derived([{ key: 'mood', color: 'var(--accent)', dots: true, v: days.map((d) => byDay[d] ?? null) }]);
  const SCALE = { lo: 1, hi: 5, step: 1, ticks: [1, 2, 3, 4, 5] };
  const moodName = (v) => t(moodOf(Math.round(v))?.name ?? '');
  const read = (i) => {
    const m = byDay[days[i]];
    return { title: dayName(days[i]), items: [{ label: t('Mood'), value: m == null ? '–' : `${face(m)} ${num(m)}`, color: 'var(--accent)' }] };
  };
  const table = $derived({
    head: [t('Day'), t('Mood')],
    rows: [...series].reverse().map((p) => ({ key: p.day, cells: [dayName(p.day), `${face(p.mood)} ${num(p.mood)}`] })),
  });
  let sel = $state(null);
  const selDay = $derived(sel != null ? days[sel] : null);
  const selEntries = $derived(selDay ? entries.filter((e) => e.day === selDay) : []);
  const avg = $derived(series.length ? Math.round((series.reduce((s, p) => s + p.mood, 0) / series.length) * 10) / 10 : null);
  const face = (v) => moodOf(Math.round(v))?.emoji ?? '';
  const num = (v) => v.toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  /* ---------- word cloud ---------- */
  let month = $state(today.slice(0, 7));
  const monthName = (m) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', month: 'long', year: 'numeric' });
  const monthEntries = $derived(entries.filter((e) => e.day.startsWith(month)));
  const words = $derived(topWords(monthEntries, 30));
  const cloud = $derived([...words].sort((a, b) => a.word.localeCompare(b.word)));

  /* ---------- series ---------- */
  const st = $derived(stats(entries, today));
  const best = $derived(longestStreak(entries));
  const marks = $derived(milestones(entries));
  const done = $derived(marks.filter((m) => m.done));
  const next = $derived(marks.find((m) => !m.done && m.key.startsWith('entries')) ?? marks.find((m) => !m.done));

  /* ---------- Gemini ---------- */
  let aiOk = $state(false);
  let busy = $state('');
  let msg = $state('');
  let answer = $state(null); // { kind, text, month? }
  let question = $state('');
  const L = () => (lang.v === 'en' ? 'en' : 'de');
  async function summary() {
    if (!aiOk || busy) return;
    const context = periodContext(entries, `${month}-01`, `${month}-31`);
    if (!context) return (msg = t('No entries in this month yet.'));
    busy = 'summary';
    msg = '';
    answer = null;
    const r = await diaryAi('summary', { context, lang: L() });
    busy = '';
    aiOk = false;
    if (r.ok) answer = { kind: 'summary', text: r.text.trim(), month };
    else msg = geminiError(r.error);
  }
  async function ask(ev) {
    ev?.preventDefault();
    if (!aiOk || busy || !question.trim()) return;
    busy = 'ask';
    msg = '';
    answer = null;
    const r = await diaryAi('ask', { question: question.trim(), context: askContext(entries, question), lang: L() });
    busy = '';
    aiOk = false;
    if (r.ok) answer = { kind: 'ask', text: r.text.trim() };
    else msg = geminiError(r.error);
  }
  async function keep() {
    const m = answer.month;
    await saveEntry({ day: today, title: t('Review of {month}', { month: monthName(m) }), text: answer.text, tags: [t('Review')] });
    answer = null;
    offerDone(t('Saved in your diary.'));
  }
</script>

<div class="rb" data-tb-review>
  <section class="rb-card" aria-labelledby="rb-mood-h" data-tb-mood-curve>
    <h2 id="rb-mood-h" class="rb-h">{t('Mood')} <small>{t('last {n} days', { n: DAYS })}</small></h2>
    {#if series.length < 2}
      <p class="rb-p">{t('Choose a smiley when you write. After a few days, your mood curve shows here.')}</p>
    {:else}
      <p class="rb-p">{t('Average {face} {n} on {d} days.', { face: face(avg), n: num(avg), d: series.length })}</p>
      <LineChart id="mood" bridge {cols} series={lc} scale={SCALE} tick={(v) => moodOf(v)?.emoji ?? ''} readout={read} {table} unit="" height={150} label={t('Mood curve of the last {n} days', { n: DAYS })} onopen={(i) => (sel = i)} hint={t('Point at a day for its mood, tap it for the day.')} />
    {/if}
    {#if pairs.length}
      <h3 class="rb-h3">{t('What goes together')}</h3>
      <ul class="rb-pairs" data-tb-pairs>
        {#each pairs as p (p.key)}
          <li>{t(p.label, p.vars)}: <b>{face(p.yes)} {num(p.yes)}</b> <span>{t('otherwise {face} {n}', { face: face(p.no), n: num(p.no) })}</span> <small>({tn(p.nYes, '{n} day', '{n} days')})</small></li>
        {/each}
      </ul>
      <p class="rb-note">{t('Only an observation from your entries, not a cause.')}</p>
    {/if}
  </section>

  <section class="rb-card" aria-labelledby="rb-words-h" data-tb-cloud>
    <div class="rb-row">
      <button type="button" class="rb-ic" aria-label={t('Month before')} onclick={() => (month = shiftMonth(month, -1))} data-tb-cloud-prev><ChevronLeft size={20} aria-hidden="true" /></button>
      <h2 id="rb-words-h" class="rb-h">{t('Your words in {month}', { month: monthName(month) })}</h2>
      <button type="button" class="rb-ic" aria-label={t('Month after')} disabled={month >= today.slice(0, 7)} onclick={() => (month = shiftMonth(month, 1))} data-tb-cloud-next><ChevronRight size={20} aria-hidden="true" /></button>
    </div>
    {#if cloud.length}
      <p class="rb-cloud">{#each cloud as w (w.word)}<span class={`s${cloudSize(w.n, words[0].n)}`} title={tn(w.n, '{n} time', '{n} times')} data-tb-word={w.word}>{w.word}</span> {/each}</p>
    {:else}
      <p class="rb-p">{t('Words you use more than once in this month show here.')}</p>
    {/if}
  </section>

  <section class="rb-card" aria-labelledby="rb-series-h" data-tb-series>
    <h2 id="rb-series-h" class="rb-h">{t('Series|diary')}</h2>
    <div class="rb-nums">
      <span><Flame size={18} aria-hidden="true" /><b>{st.streak}</b> {t('days in a row now')}</span>
      <span><Award size={18} aria-hidden="true" /><b>{best}</b> {t('days in a row at most')}</span>
    </div>
    {#if done.length}
      <div class="rb-chips">{#each done as m (m.key)}<span class="rb-chip on" data-tb-milestone={m.key}>{t(m.label, m.vars)}</span>{/each}</div>
    {/if}
    {#if next}<p class="rb-note">{t('Next: {what}', { what: t(next.label, next.vars) })}</p>{/if}
  </section>

  <section class="rb-card" aria-labelledby="rb-ai-h" data-tb-ai-review>
    <h2 id="rb-ai-h" class="rb-h"><Sparkles size={18} aria-hidden="true" />{t('With Gemini')}</h2>
    <label class="rb-ok"><input type="checkbox" bind:checked={aiOk} data-tb-ai-ok /><span>{t('Send diary text to Gemini (Google) for one step. Free; photos and places stay here. The tick goes off after each step.')}</span></label>
    <button type="button" class="btn sm" disabled={!aiOk || !!busy} onclick={summary} data-tb-ai-summary>{busy === 'summary' ? t('Gemini is thinking …') : t('Sum up {month}', { month: monthName(month) })}</button>
    <form class="rb-ask" onsubmit={ask}>
      <input class="inp" bind:value={question} maxlength="300" placeholder={t('Ask your diary, e.g. When was I last in the mountains?')} aria-label={t('Ask your diary')} data-tb-ai-q />
      <button type="submit" class="btn sm" disabled={!aiOk || !!busy || !question.trim()} data-tb-ai-ask>{busy === 'ask' ? t('Gemini is thinking …') : t('Ask')}</button>
    </form>
    {#if msg}<p class="rb-note" role="status" data-tb-ai-msg>{msg}</p>{/if}
    {#if answer}
      <div class="rb-answer" data-tb-ai-answer>
        <p>{answer.text}</p>
        <small class="rb-note">{t('Written by Gemini from your entries. It can be wrong.')}</small>
        {#if answer.kind === 'summary'}<button type="button" class="btn sm" onclick={keep} data-tb-ai-keep><Plus size={16} aria-hidden="true" />{t('Keep it as an entry')}</button>{/if}
      </div>
    {/if}
  </section>
</div>

{#if selDay}
  <ChartSheet kicker={t('Mood')} title={dayName(selDay)} onclose={() => (sel = null)} onprev={sel > 0 ? () => sel-- : null} onnext={sel < DAYS - 1 ? () => sel++ : null} prevLabel={t('Day before')} nextLabel={t('Next day')}>
    <ul class="shl" data-mood-sheet>
      <li><span>{t('Mood')}</span><b class="num">{byDay[selDay] != null ? `${face(byDay[selDay])} ${num(byDay[selDay])} · ${moodName(byDay[selDay])}` : '–'}</b></li>
      <li><span>{t('Entries')}</span><b class="num">{selEntries.length}</b></li>
    </ul>
    {#if byDay[selDay] == null}<p class="rb-note">{t('No mood noted on this day.')}</p>{/if}
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
  .shl b {
    white-space: nowrap;
  }
  .rb {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .rb-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: var(--paper);
  }
  .rb-h {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    margin: 0;
    font: 700 var(--fs-sub) / 1.3 var(--font-title);
    overflow-wrap: break-word;
  }
  .rb-h small {
    color: var(--ink-3);
    font: 400 var(--fs-small) / 1.3 var(--font-body, inherit);
  }
  .rb-h3 {
    margin: 4px 0 0;
    font-size: var(--fs-body);
  }
  .rb-p,
  .rb-note {
    margin: 0;
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .rb-note {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .rb-pairs {
    margin: 0;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .rb-pairs span,
  .rb-pairs small {
    color: var(--ink-3);
  }
  .rb-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .rb-ic {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    flex: none;
    padding: 0;
    border: 0;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-2);
    cursor: pointer;
  }
  .rb-ic:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .rb-cloud {
    margin: 0;
    line-height: 1.9;
    text-align: center;
    overflow-wrap: break-word;
  }
  .rb-cloud span {
    margin: 0 4px;
    color: var(--ink-2);
  }
  .rb-cloud .s1 {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .rb-cloud .s2 {
    font-size: var(--fs-body);
  }
  .rb-cloud .s3 {
    font-size: var(--fs-sub);
  }
  .rb-cloud .s4 {
    font-size: var(--fs-section);
    color: var(--ink);
  }
  .rb-cloud .s5 {
    font-size: var(--fs-page);
    font-weight: 700;
    color: var(--accent);
  }
  .rb-nums {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
  }
  .rb-nums span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-2);
  }
  .rb-nums b {
    font-size: var(--fs-section);
    color: var(--ink);
  }
  .rb-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .rb-chip {
    padding: 6px 12px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--ink);
    font-size: var(--fs-small);
  }
  .rb-ok {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .rb-ok input {
    width: 20px;
    height: 20px;
    margin-top: 1px;
    flex: none;
  }
  .rb-ask {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .rb-ask .inp {
    flex: 1;
    min-width: 180px;
  }
  .rb-answer {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
    border-radius: 14px;
    background: var(--paper-2);
  }
  .rb-answer p {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
</style>
