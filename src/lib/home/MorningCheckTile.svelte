<script>
  /**
   * v0.127.0 «Tages-Check» 2 (mockup T3): the tile «Morgen-Check» on Heute. Before the check: a short
   * line and «Start»; once answered: when, the goal of the day and sleep, energy and mood of today.
   * From 20:30 it leads to the evening review. The whole tile opens the page (#/check/…).
   */
  import { Sun, Moon, ChevronRight } from '@lucide/svelte';
  import TileHead from './TileHead.svelte';
  import { balanceQuery } from '../flow/data.svelte.js';
  import { checkOf, GOALS, isEvening, eveningDone } from '../flowcheck.js';
  import { zurichTime } from '../flowmed.js';
  import { t } from '../i18n.svelte.js';

  let { today, size = 'l', isnew = false } = $props();
  const q = $derived(balanceQuery(today));
  const data = $derived($q);
  const c = $derived(checkOf(data?.checks.find((x) => x.day === today), today));
  const morning = $derived(c.sleep != null || c.energy != null || c.mood != null);
  let evening = $state(isEvening());
  $effect(() => {
    const id = setInterval(() => (evening = isEvening()), 60_000);
    return () => clearInterval(id);
  });
  const goal = $derived(c.goal ? (c.goal.id ? t(GOALS.find((g) => g.id === c.goal.id)?.label ?? c.goal.id) : c.goal.text) : '');
  const at = $derived(zurichTime(c.mAt));
  const sub = $derived(
    morning
      ? [at ? t('done {time}', { time: at }) : t('done today'), goal ? t('Goal: {goal}', { goal }) : ''].filter(Boolean).join(' · ')
      : t('not yet today · about 40 seconds'),
  );
  const NUMS = [
    { key: 'sleep', label: 'Sleep|flow' },
    { key: 'energy', label: 'Energy' },
    { key: 'mood', label: 'Mood' },
  ];
</script>

{#if data}
  <a class="mc surf {size}" href={evening ? '#/check/evening' : '#/check/morning'} aria-labelledby="mc-h" data-section="morningcheck" data-done={morning}>
    <TileHead icon={Sun} id="mc-h" title={t('Morning check')} {isnew} />
    <p class="sub">{sub}</p>
    {#if morning}
      <div class="vals">
        {#each NUMS as n (n.key)}
          <div data-val={n.key}><small>{t(n.label)}</small><b class="num">{c[n.key] ?? '–'}</b></div>
        {/each}
      </div>
    {/if}
    {#if evening}
      <p class="ev"><Moon size={16} aria-hidden="true" />{eveningDone(c) ? t('Evening review: satisfaction {n} of 10', { n: c.sat }) : t('Evening review: how was your day?')}<ChevronRight size={16} aria-hidden="true" /></p>
    {:else if morning}
      <p class="ev">{t('From 20:30 the evening review comes here.')}</p>
    {:else}
      <span class="go">{t('Start|check')}<ChevronRight size={16} aria-hidden="true" /></span>
    {/if}
  </a>
{/if}

<style>
  .mc {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
    padding: 16px 18px;
    box-sizing: border-box;
    color: var(--ink);
    text-decoration: none;
  }
  .mc:hover {
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
