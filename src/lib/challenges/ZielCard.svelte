<script>
  /**
   * «Challenges» PR 3 (Noah 21.11.2026 «4a», «a» on 22.11.2026): one own daily goal as a card built like the habit cards
   * on Heute (HabitCard.svelte): the symbol, the name with today's amount against the goal, the last 7 days as dots, the
   * days in a row, and the green button «Tick off» = the goal of today is reached (a second tap takes it back).
   * Smaller or larger amounts are added under «More»: the buttons of the unit and your own number, with Undo.
   * The pencil opens the window (change, end, delete). The rules are in src/lib/tagesziel.js.
   */
  import { Check, Pencil, Target, ChevronDown } from '@lucide/svelte';
  import { toast } from '../flow/ui.svelte.js';
  import { UNITS, standing, addAmount, undoAmount, untick, missing, handSum, handOnly } from '../tagesziel.js';
  import { addDays } from '../flow.js';
  import { wd } from '../flow/words.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  /** c = the goal, today = the day, onput(next) saves the goal (the list is the parent's), onedit() opens the window */
  let { c, today, onput, onedit } = $props();

  const st = $derived(standing(c, today));
  const doneToday = $derived(!!st?.today.done);
  const running = $derived(st?.phase === 'running');
  const autoToday = $derived(c.auto?.[today] ?? 0);
  // a day that the sessions alone have reached has nothing to take back by hand
  const byItself = $derived(doneToday && handOnly(c, today) === 0);
  const week = $derived(Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)).map((day) => ({ day, on: c.from <= day && day <= c.until && handSum(c, day) >= c.goal })));
  const unitText = (n) => (c.unit === 'min' ? t('{n} min', { n }) : c.unit === 'steps' ? tn(n, '{n} step', '{n} steps') : c.word ? `${n} ${c.word}` : t('{n}×', { n }));
  let own = $state('');
  let bad = $state(false);
  let more = $state(false);

  async function tickIt() {
    if (!running) return;
    const before = c;
    const next = doneToday ? untick(c, today) : addAmount(c, today, missing(c, today));
    if (next === c) return;
    await onput(next);
    toast(doneToday ? t('Taken back.') : t('Done for today: {name}.', { name: c.name }), () => onput(before));
  }
  async function add(n) {
    const next = addAmount(c, today, n);
    if (next === c) return;
    await onput(next);
    toast(t('+{amount} added for today.', { amount: unitText(n) }), () => onput(undoAmount(next, today)));
  }
  function setOwn() {
    const n = Math.round(Number(String(own).replace(',', '.')));
    bad = !(n >= 1 && n <= UNITS[c.unit].max);
    if (bad) return;
    own = '';
    add(n);
  }
</script>

<section class="zc" class:done={doneToday} aria-labelledby="zc-{c.id}" data-ziel-card={c.id}>
  <span class="mi" aria-hidden="true"><Target size={20} /></span>
  <span class="mt">
    <span id="zc-{c.id}" class="hd">{c.name}{#if running}<span class="no"> · {t('Day {n} of {total}', { n: st.dayNo, total: st.total })}</span>{:else if st.phase === 'soon'}<span class="no"> · {t('starts on {day}', { day: new Date(`${c.from}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', timeZone: 'UTC' }) })}</span>{:else}<span class="no"> · {t('over')}</span>{/if}</span>
    {#if running}
      <small data-ziel-now>{doneToday ? t('Done today: {have} of {goal}', { have: unitText(st.today.total), goal: unitText(c.goal) }) : t('{have} of {goal} today', { have: unitText(st.today.total), goal: unitText(c.goal) })}{#if autoToday}{` · ${t('{n} min from meditation', { n: autoToday })}`}{/if}</small>
    {:else}
      <small>{tn(st.doneN, '{n} day reached', '{n} days reached')} · {tn(st.total, 'of {n} day', 'of {n} days')}</small>
    {/if}
  </span>
  <button type="button" class="pen" aria-label={t('Change the challenge')} title={t('Change the challenge')} onclick={onedit} data-ziel-edit><Pencil size={16} aria-hidden="true" /></button>
  <span class="dots" role="img" aria-label={t('{n} of 7 days', { n: week.filter((g) => g.on).length })}>
    {#each week as g (g.day)}<span><i class:ok={g.on} aria-hidden="true">{#if g.on}<Check size={14} strokeWidth={2.5} />{/if}</i>{wd(g.day)}</span>{/each}
  </span>
  {#if st.streak > 1}<span class="ser">{tn(st.streak, '{n} day in a row', '{n} days in a row')}</span>{/if}
  {#if running}
    <span class="acts">
      <button type="button" class="btn" class:hi={!doneToday} aria-pressed={doneToday} onclick={tickIt} disabled={byItself} data-ziel-tick>
        <Check size={16} aria-hidden="true" />
        {byItself ? t('Ticked by itself') : doneToday ? t('Ticked · take back') : t('Tick off|habit')}
      </button>
      <button type="button" class="l" aria-expanded={more} onclick={() => (more = !more)} data-ziel-more><ChevronDown size={14} aria-hidden="true" />{t('More')}</button>
    </span>
    {#if more}
      <span class="adds" data-ziel-adds>
        {#each UNITS[c.unit].chips as n (n)}<button type="button" class="btn sm" onclick={() => add(n)} data-ziel-add={n}>{t('+{amount}', { amount: unitText(n) })}</button>{/each}
        <label class="own"><span class="lbl">{t('Own number')}</span><input type="text" inputmode="numeric" autocomplete="off" maxlength="6" class="inp" placeholder={t('e.g. 75')} bind:value={own} aria-invalid={bad} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), setOwn())} data-ziel-own /></label>
        <button type="button" class="btn sm" onclick={setOwn}>{t('Set')}</button>
        {#if bad}<small class="bad" role="alert">{t('Whole number from 1 to {n}.', { n: UNITS[c.unit].max })}</small>{/if}
      </span>
    {/if}
  {/if}
</section>

<style>
  .zc {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 16px;
    padding: 12px 16px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    color: var(--ink);
    min-width: 0;
  }
  .zc.done {
    border-color: var(--accent);
  }
  .mi {
    flex: none;
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: var(--accent);
    color: var(--paper);
  }
  .mt {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .hd {
    font: 650 var(--fs-body)/1.25 var(--font-body);
    overflow-wrap: break-word;
  }
  .no {
    color: var(--ink-3);
    font-weight: 500;
  }
  .mt small,
  .bad {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .bad {
    color: var(--bad);
  }
  .pen {
    flex: none;
    order: 9;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .dots {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }
  .dots > span {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .dots i {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border: 2px solid var(--line-strong);
    border-radius: 50%;
    color: var(--paper);
  }
  .dots i.ok {
    border-color: var(--accent);
    background: var(--accent);
  }
  .ser {
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
    white-space: nowrap;
  }
  .acts {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .l {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--accent);
    font: 600 var(--fs-small)/1.2 var(--font-body);
    text-decoration: underline;
    white-space: nowrap;
    cursor: pointer;
  }
  .adds {
    flex: 1 1 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .own {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .own input {
    width: 6rem;
  }
  @media (max-width: 719px) {
    .zc {
      padding: 12px;
    }
    .mt {
      flex: 1 1 0;
    }
    .pen {
      order: 0;
      margin: -6px -6px -6px 0;
    }
    .dots {
      width: 100%;
      margin-left: 0;
      justify-content: space-between;
    }
    .acts {
      width: 100%;
      flex-wrap: wrap;
      gap: 4px 12px;
    }
    .acts .btn {
      flex: 1 1 auto;
      justify-content: center;
      white-space: nowrap;
    }
  }
</style>
