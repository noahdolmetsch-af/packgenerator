<script>
  /**
   * «Meditation» on Heute, small (mockup HN4 «ME1 verkleinert», Noah 14.10.2026 «1a 2a 3a 4b HN4
   * freigegeben»; order 21:27 «meditation, dann Tageskarte, dann Tourkarte»): one row under the greeting:
   * the lotus, «Meditation» with today's state (✓ and minutes, or «still open today») and the goal, the last
   * 7 days as dots, the streak, one button and «Other duration». Not done today: «Like last time · 20 min»;
   * done: «Again · 10 min». The button starts the session (one tap, rule A: nothing opens by itself).
   * Like every card on the wall it can be moved or taken away (a suggestion, never a must).
   */
  import { Timer as TimerIcon, Check, Flower2 } from '@lucide/svelte';
  import MedStartSheet from '../flow/MedStartSheet.svelte';
  import { medQuery, seedMed, flowQuery } from '../flow/data.svelte.js';
  import { flowStates } from '../flow.js';
  import { actName, clockState } from '../flow/ui.svelte.js';
  import { beginMed, tplStart, medTemplates, lastStart, isMedAct } from '../flow/hobby/medstart.js';
  import { daysGrid, streaks } from '../flowmed.js';
  import { actGoalText, wd } from '../flow/words.js';
  import { t, tn } from '../i18n.svelte.js';

  let { today } = $props();
  const fq = $derived(flowQuery(today));
  const st = $derived($fq ? (flowStates($fq.acts, $fq.log, today, $fq.tripDays).find((s) => isMedAct(s.act) && !s.act.paused) ?? null) : null);
  const actId = $derived(st?.act.id ?? 'meditation');
  const q = $derived(medQuery(actId, today));
  const data = $derived($q);
  $effect(() => {
    if (st) seedMed(data, actId);
  });
  const week = $derived(data ? daysGrid(data.log, actId, today, 7) : []);
  const todayMin = $derived(week.at(-1)?.min ?? 0);
  const done = $derived(!!week.at(-1)?.on);
  const str = $derived(data ? streaks(data.log, actId, today) : { now: 0 });
  const tpls = $derived(medTemplates(data));
  const ls = $derived(data ? lastStart(data, actId) : null);
  const main = $derived(ls ? ls.start : tpls[0] ? tplStart(tpls[0]) : null);
  /** «Again» after a session today is a short one (10 min), else like last time. */
  const start = $derived(main ? (done ? { ...main, minutes: 10 } : main) : null);
  const running = $derived(!!clockState.tm);
  let sheet = $state(false);
  const go = () => start && beginMed(actId, data, start);
</script>

{#if st && data}
  <section class="mc" aria-labelledby="mc-h" data-med-card>
    <span class="mi" aria-hidden="true"><Flower2 size={20} /></span>
    <span class="mt">
      <a id="mc-h" href="#/flow/act/{encodeURIComponent(actId)}">{actName(st.act)}</a>
      <small>{done ? t('done today ✓ · {n} min', { n: todayMin }) : t('still open today')} · {t('Goal|flow')} {actGoalText(st.act, today)}</small>
    </span>
    <span class="dots" role="img" aria-label={t('{n} of 7 days', { n: week.filter((g) => g.on).length })}>
      {#each week as g (g.day)}<span><i class:ok={g.on} aria-hidden="true">{#if g.on}<Check size={11} strokeWidth={3} />{/if}</i>{wd(g.day)}</span>{/each}
    </span>
    {#if str.now}<span class="ser">{tn(str.now, '{n} day in a row', '{n} days in a row')}</span>{/if}
    <span class="acts">
      {#if start}
        <button type="button" class="btn hi" onclick={go} data-med-card-start>
          <TimerIcon size={16} aria-hidden="true" />
          {#if running}{t('Open the running session')}{:else if done}{t('Again · {n} min', { n: start.minutes })}{:else if ls}{t('Like last time · {n} min', { n: start.minutes })}{:else}{t('Start now · {n} min', { n: start.minutes })}{/if}
        </button>
      {/if}
      <button type="button" class="l" onclick={() => (sheet = true)} data-med-card-other>{t('Other duration')}</button>
    </span>
  </section>
  {#if sheet}<MedStartSheet {st} {today} onclose={() => (sheet = false)} />{/if}
{/if}

<style>
  .mc {
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
  .mt a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    margin: -10px 0 -8px;
    color: var(--ink);
    text-decoration: none;
    font: 650 var(--fs-body)/1.25 var(--font-body);
  }
  .mt small {
    color: var(--ink-3);
    font-size: var(--fs-small);
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
  @media (max-width: 719px) {
    .mc {
      padding: 12px;
    }
    .dots {
      width: 100%;
      margin-left: 0;
      justify-content: space-between;
    }
    .acts {
      width: 100%;
    }
    .acts {
      flex-wrap: wrap;
      gap: 4px 12px;
    }
    /* Gesamttest 20.10.2026 (C1): «Wie letztes Mal · 20 Min» broke into two lines beside «Andere Dauer» */
    .acts .btn {
      flex: 1 1 auto;
      justify-content: center;
      white-space: nowrap;
    }
  }
</style>
