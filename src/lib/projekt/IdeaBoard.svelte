<script>
  /**
   * Paket P7 «Projekt-Ablage», mockup B «Ideen»: the ideas of the list of plans as a board in four columns
   * (Idee, Geplant, Im Bau, Live), chips for the five goals on top. Each column shows six and «Alle n zeigen».
   * The titles are Noah's list as it is (German), never through t().
   */
  import { STATES, column } from './ablage.js';
  import { t } from '../i18n.svelte.js';

  let { ideas = [], goals = [] } = $props();

  let goal = $state(0);
  let open = $state({});
  const SHOW = 6;
  const goalName = (n) => goals.find((g) => g.n === n)?.name ?? '';
</script>

<div class="ib-wrap" data-idea-board>
  <div class="ib-chips" role="group" aria-label={t('Goal')}>
    <button type="button" class="ib-chip" aria-pressed={goal === 0} onclick={() => (goal = 0)} data-idea-goal="0">{t('All|ideas')}</button>
    {#each goals as g (g.n)}
      <button type="button" class="ib-chip" aria-pressed={goal === g.n} onclick={() => (goal = g.n)} data-idea-goal={g.n}>{g.n} {g.name}</button>
    {/each}
  </div>
  <div class="ib-cols">
    {#each STATES as s (s.key)}
      {@const rows = column(ideas, s.key, goal)}
      <section class="ib-col" aria-labelledby="ib-{s.key}" data-idea-col={s.key}>
        <h3 id="ib-{s.key}" class="ib-h"><span class="ib-dot ib-{s.key}" aria-hidden="true"></span>{t(s.name)} <span class="num ib-n">{rows.length}</span></h3>
        {#if rows.length}
          <ul class="ib-list">
            {#each open[s.key] ? rows : rows.slice(0, SHOW) as x, i (`${x.goal}:${i}:${x.title}`)}
              <li class="ib-card" data-idea>
                <b>{x.title}</b>
                <small>{goalName(x.goal)}{#if x.size}{' · '}{x.size}{/if}</small>
                {#if x.use}<span class="ib-use">{x.use}</span>{/if}
              </li>
            {/each}
          </ul>
          {#if rows.length > SHOW}
            <button type="button" class="btn btn-link ib-more" onclick={() => (open = { ...open, [s.key]: !open[s.key] })} data-idea-more={s.key}>
              {open[s.key] ? t('Show fewer') : t('Show all {n}', { n: rows.length })}
            </button>
          {/if}
        {:else}
          <p class="ib-none">{t('None here.')}</p>
        {/if}
      </section>
    {/each}
  </div>
</div>

<style>
  .ib-wrap {
    display: grid;
    gap: 12px;
    min-width: 0;
  }
  .ib-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .ib-chip {
    min-height: 44px;
    padding: 4px 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
    overflow-wrap: break-word;
  }
  .ib-chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .ib-cols {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
    gap: 10px;
    align-items: start;
  }
  .ib-col {
    min-width: 0;
    padding: 10px;
    border-radius: var(--radius-card);
    background: var(--paper-2);
  }
  .ib-h {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 8px;
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .ib-n {
    color: var(--ink-3);
    font-weight: 400;
  }
  .ib-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ink-3);
  }
  .ib-dot.ib-wish {
    background: var(--st-plan);
  }
  .ib-dot.ib-work {
    background: var(--warm);
  }
  .ib-dot.ib-live {
    background: var(--ok);
  }
  .ib-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .ib-card {
    display: grid;
    gap: 2px;
    padding: 8px 10px;
    border-radius: var(--r-ctl);
    background: var(--paper);
    border: 1px solid var(--line);
    overflow-wrap: break-word;
    font-size: var(--fs-small);
  }
  .ib-card small,
  .ib-use {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .ib-more {
    min-height: 44px;
    margin-top: 4px;
  }
  .ib-none {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
