<script>
  /**
   * WG «Wi gaht's?» takes over the daily check (Noah 14.10.2026 «a) ja, alle drei übernehmen», mockup T3):
   * the tile of the two fixed rounds on Heute (tile id 'morningcheck', so a stored wall keeps it).
   * «Morgen-Runde» before the evening time, «Abend-Runde» from it (Ich › «Wi gaht's?» › «Feste Runden»).
   * Before answering: a short line and «Start»; once answered: when, today's goal (ziele.ziel) and today's
   * sleep, energy and mood (erholung.schlaf, erholung.akku, spass.stimmung; else the day's check). In the
   * morning a line about the evening round, in the evening the satisfaction (erreicht.zufrieden).
   * Observation only: plain numbers, no judgement. The whole tile opens «Wi gaht's?» (#/me/abfragen).
   * Tages-Check back (Noah 18.10.2026 «1 a und b»): it opens the page of its round, Morgen-Check (#/check/morning) or
   * Abend-Rückblick (#/check/evening); the answers stay in «Wi gaht's?».
   */
  import { Sun, Moon, ChevronRight } from '@lucide/svelte';
  import TileHead from './TileHead.svelte';
  import { abQuery } from '../abdb.js';
  import { QUESTION, configOf, dueList, fromChecks, isEveningRound, lastAnswer, partOf, stampOf } from '../abfragen.js';
  import { checkOf, GOALS } from '../flowcheck.js';
  import { t } from '../i18n.svelte.js';

  let { today, size = 'l', isnew = false } = $props();
  const q = $derived(abQuery(today));
  const data = $derived($q);
  let now = $state(stampOf());
  $effect(() => {
    const id = setInterval(() => (now = stampOf()), 60_000);
    return () => clearInterval(id);
  });
  const rounds = $derived(configOf(data?.cfg).rounds);
  const evening = $derived(isEveningRound(now, rounds));
  const part = $derived(evening ? 'evening' : 'morning');
  // today's answers of «Wi gaht's?» (the greeting's two questions are not part of a round)
  const todays = $derived((data?.answers ?? []).filter((a) => a.day === today && !QUESTION[a.qid]?.hello));
  const mine = $derived(todays.filter((a) => partOf(a, rounds) === part));
  // Noah 18.10.2026 «1 a und b»: the morning and evening pages are back; what they saved counts too
  const row = $derived(data?.checks.find((c) => c.day === today) ?? null);
  const byPage = $derived(!!row && (part === 'evening' ? row.sat != null : ['sleep', 'energy', 'mood', 'extra'].some((k) => row[k] != null)));
  const done = $derived(mine.length > 0 || byPage);
  const at = $derived(mine.map((a) => String(a.at ?? '').slice(11, 16)).filter(Boolean).sort()[0] ?? '');
  const check = $derived(checkOf(data?.checks.find((c) => c.day === today), today));
  const pageGoal = $derived(check.goal ? (check.goal.id ? t(GOALS.find((g) => g.id === check.goal.id)?.label ?? '') : check.goal.text) : '');
  const goal = $derived(lastAnswer(todays, 'ziele.ziel')?.value ?? pageGoal);
  const sat = $derived(lastAnswer(todays, 'erreicht.zufrieden')?.value ?? row?.sat ?? null);
  const NUMS = [
    { key: 'sleep', qid: 'erholung.schlaf', label: 'Sleep|flow' },
    { key: 'energy', qid: 'erholung.akku', label: 'Energy' },
    { key: 'mood', qid: 'spass.stimmung', label: 'Mood' },
  ];
  const vals = $derived(NUMS.map((n) => ({ ...n, v: lastAnswer(todays, n.qid)?.value ?? check[n.key] ?? null })));
  const known = $derived(vals.some((x) => x.v != null));
  // what is due now, as on the card of «Wi gaht's?» (an answer in the old daily check counts too)
  const due = $derived.by(() => {
    if (!data?.stored) return 0;
    const answered = [...data.answers, ...fromChecks(data.checks).map((r) => ({ qid: r.qid, at: `${r.day}T00:00` }))];
    return dueList(data.cfg, answered, now, data.snooze).length;
  });
  const sub = $derived(
    done
      ? [at ? t('done {time}', { time: at }) : t('done today'), goal ? t('Goal: {goal}', { goal }) : ''].filter(Boolean).join(' · ')
      : due
        ? t('{n} due now', { n: due })
        : t('not yet today · about 40 seconds'),
  );
</script>

{#if data}
  <a class="rt surf {size}" href={part === 'evening' ? '#/check/evening' : '#/check/morning'} aria-labelledby="rt-h" data-section="morningcheck" data-part={part} data-done={done}>
    <TileHead icon={evening ? Moon : Sun} id="rt-h" title={evening ? t('Evening round') : t('Morning round')} {isnew} />
    <p class="sub">{sub}</p>
    {#if known}
      <div class="vals">
        {#each vals as n (n.key)}
          <div data-val={n.key}><small>{t(n.label)}</small><b class="num">{n.v ?? '–'}</b></div>
        {/each}
      </div>
    {/if}
    {#if !done}
      <span class="go">{t('Start|check')}<ChevronRight size={16} aria-hidden="true" /></span>
    {:else if evening}
      {#if sat != null}<p class="ev" data-sat><Moon size={16} aria-hidden="true" />{t('Satisfaction {n} of 10', { n: sat })}</p>{/if}
    {:else}
      <p class="ev">{t('From {time} the evening round comes here.', { time: rounds.evening })}</p>
    {/if}
  </a>
{/if}

<style>
  .rt {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
    padding: 16px 18px;
    box-sizing: border-box;
    color: var(--ink);
    text-decoration: none;
  }
  .rt:hover {
    background: var(--paper-2);
  }
  .sub {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .vals {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .vals div {
    min-width: 0;
    padding: 8px 10px;
    border-radius: 12px;
    background: var(--paper-2);
  }
  .vals small {
    display: block;
    overflow: hidden;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .vals b {
    display: block;
    font: 700 var(--fs-sub) / 1.3 var(--font-body);
  }
  .ev {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .go {
    display: inline-flex;
    align-self: flex-start;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    color: var(--ink);
    font-weight: 600;
  }
</style>
