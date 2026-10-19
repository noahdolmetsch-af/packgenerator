<script>
  /**
   * Paket N #1047 (Noah 19.10.2026 «5 a und nutzer kann b ausschalten und ausblenden»): one goal with its
   * steps. You type steps (one per line) and the app spreads their dates up to the goal's day (5a). When
   * the AI helper is on and AI suggestions are not switched off on this page, «Suggest steps» asks it (5b);
   * you tick which suggestions to take. Each step: tick done, change its date, remove it.
   * onchange(goal) saves; onremove(id) deletes (the page asks first and offers Undo).
   */
  import DateInput from '../ui/DateInput.svelte';
  import { addSteps, takeSuggested, goalProgress, stepsPayload, spreadOpen } from '../compass.js';
  import { ask, isOn, errorText, helper } from '../helper/client.svelte.js';
  import { localDay } from '../localday.js';
  import { t, tn, locale, isDe } from '../i18n.svelte.js';
  import { Sparkles, Trash2, Plus, Check, Target } from '@lucide/svelte';

  let { goal, ai = { off: false, hidden: false }, onchange, onremove } = $props();
  const today = localDay();
  const p = $derived(goalProgress(goal, today));
  let lines = $state('');
  let asking = $state(false);
  let sugg = $state(null); // [{ text, date, take }]
  let msg = $state('');
  const aiShown = $derived(!ai.hidden && !ai.off && isOn());

  const dayText = (d) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' }) : '');
  const put = (g) => onchange?.(g);
  function add(e) {
    e.preventDefault();
    if (!lines.trim()) return;
    put(addSteps(goal, lines, today));
    lines = '';
  }
  async function suggest() {
    msg = '';
    asking = true;
    const r = await ask('steps', stepsPayload(goal, today, isDe() ? 'de' : 'en'));
    asking = false;
    if (!r.ok) return (msg = errorText(r.error, { capChf: helper.capChf, loc: locale() }));
    sugg = (r.result?.steps ?? []).map((s) => ({ ...s, take: true }));
    if (!sugg.length) ((sugg = null), (msg = t('The helper had no steps to suggest.')));
  }
  function takeIt() {
    put(takeSuggested(goal, sugg, today));
    sugg = null;
  }
  const setStep = (id, patch) => put({ ...goal, steps: goal.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const dropStep = (id) => put({ ...goal, steps: goal.steps.filter((s) => s.id !== id) });
</script>

<article class="card goal" data-goal={goal.id} class:gdone={goal.done}>
  <header>
    <span class="gi"><Target size={18} aria-hidden="true" /></span>
    <div class="gt">
      <input class="inp gtitle" type="text" value={goal.title} maxlength="80" aria-label={t('Goal')} onchange={(e) => e.currentTarget.value.trim() && put({ ...goal, title: e.currentTarget.value.trim() })} />
      <small>{goal.due ? t('by {day}', { day: dayText(goal.due) }) : t('no day yet')} · {t('{done} of {total} steps', p)}{p.late ? ` · ${tn(p.late, '{n} step overdue', '{n} steps overdue')}` : ''}</small>
    </div>
  </header>
  <div class="due">
    <label><span class="lbl">{t('Reach it by')}</span><DateInput value={goal.due} onchange={(v) => put({ ...goal, due: v || '', steps: spreadOpen(goal.steps, today, v || '') })} /></label>
  </div>
  {#if goal.steps.length}
    <ul class="steps">
      {#each [...goal.steps].sort((a, b) => Number(a.done) - Number(b.done) || (a.date || '9999').localeCompare(b.date || '9999')) as s (s.id)}
        <li class:late={!s.done && s.date && s.date < today}>
          <label class="ck"><input type="checkbox" checked={s.done} onchange={(e) => setStep(s.id, { done: e.currentTarget.checked })} /><span class:done={s.done}>{s.text}</span></label>
          <span class="sd"><DateInput value={s.date} aria-label={t('Date of «{name}»', { name: s.text })} onchange={(v) => setStep(s.id, { date: v || '' })} /></span>
          <button type="button" class="rm" aria-label={t('Remove {name}', { name: s.text })} onclick={() => dropStep(s.id)}><Trash2 size={16} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
  {/if}
  <form class="addst" onsubmit={add}>
    <label class="lbl" for="st-{goal.id}">{t('Add steps, one per line')}</label>
    <textarea id="st-{goal.id}" class="inp" rows="2" bind:value={lines} placeholder={t('e.g. Draw the route')}></textarea>
    <p class="hint">{t('The app spreads the dates up to the goal day; you can change each one.')}</p>
    <div class="row">
      <button type="submit" class="btn"><Plus size={16} aria-hidden="true" />{t('Add steps')}</button>
      {#if aiShown}<button type="button" class="btn" disabled={asking} onclick={suggest} data-ai-steps><Sparkles size={16} aria-hidden="true" />{asking ? t('Asking …') : t('Suggest steps')}</button>{/if}
    </div>
  </form>
  {#if sugg}
    <div class="sugg" data-suggestions>
      <p class="lbl">{t('Suggestions of the AI helper: tick what you take')}</p>
      {#each sugg as s, i (i)}<label class="ck"><input type="checkbox" bind:checked={s.take} /><span>{s.text}{s.date ? ` · ${dayText(s.date)}` : ''}</span></label>{/each}
      <div class="row"><button type="button" class="btn hi" onclick={takeIt}><Check size={16} aria-hidden="true" />{t('Take the ticked steps')}</button><button type="button" class="btn" onclick={() => (sugg = null)}>{t('Discard')}</button></div>
    </div>
  {/if}
  {#if msg}<p class="err" role="alert">{msg}</p>{/if}
  <div class="foot">
    <button type="button" class="btn" onclick={() => onremove?.(goal.id)}>{t('Delete')}</button>
    <button type="button" class="btn" aria-pressed={!!goal.done} onclick={() => put({ ...goal, done: !goal.done })}><Check size={16} aria-hidden="true" />{goal.done ? t('Reached · open again') : t('Reached')}</button>
  </div>
</article>

<style>
  .goal {
    display: grid;
    gap: 10px;
    padding: var(--sp-3) var(--sp-4);
  }
  .gdone {
    opacity: 0.7;
  }
  header {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  .gi {
    color: var(--accent);
    padding-top: 10px;
  }
  .gt {
    display: grid;
    gap: 2px;
    flex: 1 1 auto;
    min-width: 0;
  }
  .gtitle {
    font-weight: 600;
    width: 100%;
    box-sizing: border-box;
  }
  .gt small,
  .hint {
    color: var(--ink-3);
    font-size: var(--fs-small);
    margin: 0;
  }
  .due label {
    display: grid;
    gap: 4px;
    max-width: 16em;
  }
  .steps {
    display: grid;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .steps li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
  }
  .steps li.late .sd {
    color: var(--warn);
  }
  .ck {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1 1 12em;
    min-width: 0;
    min-height: 44px;
  }
  .ck input {
    width: 20px;
    height: 20px;
  }
  .done {
    text-decoration: line-through;
    color: var(--ink-3);
  }
  .sd {
    flex: 0 0 auto;
  }
  .rm {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .addst {
    display: grid;
    gap: 6px;
  }
  .addst textarea {
    width: 100%;
    box-sizing: border-box;
  }
  .row,
  .foot {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .foot {
    justify-content: flex-end;
    border-top: 1px solid var(--line);
    padding-top: 8px;
  }
  .sugg {
    display: grid;
    gap: 4px;
    padding: 8px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
</style>
