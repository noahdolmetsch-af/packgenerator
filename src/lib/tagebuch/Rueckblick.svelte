<script>
  /**
   * «Tagebuch» › Rückblick (Noah 20.10.2026 «1a 2a 4b»): the mood curve of the last 90 days and what goes
   * together with it (observation only, never a cause), the words of a month as a cloud, calm series that
   * stay once reached, and Gemini (only with a tick, each time): sum up a month, ask your diary.
   */
  import { ChevronLeft, ChevronRight, Sparkles, Flame, Award, Plus } from '@lucide/svelte';
  import { MOODS, moodOf, moodSeries, moodPairs, topWords, cloudSize, longestStreak, milestones } from './insights.js';
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
  const W = 600;
  const H = 160;
  const P = 28;
  const dayIndex = (d) => Math.round((Date.parse(`${d}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 864e5) + DAYS - 1;
  const x = (d) => P + (dayIndex(d) / (DAYS - 1)) * (W - P - 8);
  const y = (m) => 8 + ((5 - m) / 4) * (H - 24);
  const line = $derived(series.map((p, i) => `${i ? 'L' : 'M'}${x(p.day).toFixed(1)},${y(p.mood).toFixed(1)}`).join(' '));
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
      <svg class="rb-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('Mood curve of the last {n} days', { n: DAYS })}>
        {#each MOODS as m (m.v)}
          <line x1={P} x2={W - 8} y1={y(m.v)} y2={y(m.v)} class="rb-grid" />
          <text x="2" y={y(m.v) + 5} class="rb-emo">{m.emoji}</text>
        {/each}
        <path d={line} class="rb-line" />
        {#each series as p (p.day)}<circle cx={x(p.day)} cy={y(p.mood)} r="3.5" class="rb-dot" />{/each}
      </svg>
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

<style>
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
  .rb-svg {
    width: 100%;
    height: auto;
  }
  .rb-grid {
    stroke: var(--line);
    stroke-width: 1;
  }
  .rb-emo {
    font-size: var(--fs-small);
  }
  .rb-line {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2;
    stroke-linejoin: round;
  }
  .rb-dot {
    fill: var(--accent);
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
