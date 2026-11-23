<script>
  /**
   * «Erholung und Rituale» (Noah 22.11.2026 «a», Schritt J): sauna, cold water, friends, meditation, a nap, the forest … as TIMES (not
   * hours), with the goal of the activity beside it. In the week review (mode «week») and in the Sportjahr (mode «period», the mean per
   * week and the same days a year before). Never added to sport hours; time only where it was measured. Observation only, nothing is
   * rated. The rules are pure and tested (lib/flow/rituale.js). Nothing to show, nothing shown (the place to start is «My activities»).
   */
  import { tn, t, num } from '../i18n.svelte.js';

  /** rows: rituale(); names: Map id → shown name; prev: Map id → times in the window a year before (period only) */
  let { rows = [], names = new Map(), mode = 'week', prev = null } = $props();
  const nameOf = (r) => names.get(r.id) ?? r.id;
  const mean = (x) => num(x);
</script>

{#if rows.length}
  <section class="card ri" data-rituale={mode} aria-labelledby="ri-h-{mode}">
    <h2 id="ri-h-{mode}">{t('Rest and rituals')}</h2>
    <ul>
      {#each rows as r (r.id)}
        <li data-ritual={r.id}>
          <span class="l">{nameOf(r)}</span>
          <b class="num">{tn(r.n, '{n} time', '{n} times')}</b>
          <small>
            {#if mode === 'period' && r.n > 0}{t('Mean {n} a week', { n: mean(r.perWeek) })}{:else if r.n > 0}{tn(r.days, 'on {n} day', 'on {n} days')}{/if}
            {#if r.goal != null}{r.n > 0 ? ' · ' : ''}{t('Goal: {n} a week', { n: mean(r.goal) })}{/if}
            {#if r.measuredMin > 0}{' · '}{t('{n} min measured', { n: num(r.measuredMin) })}{/if}
            {#if mode === 'period' && prev?.has(r.id)}{' · '}{t('The year before: {n}', { n: num(prev.get(r.id)) })}{/if}
          </small>
        </li>
      {/each}
    </ul>
    <p class="cap">{t('Counted as times, never as sport hours. Only a look back, nothing is rated.')}</p>
  </section>
{/if}

<style>
  .ri {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    min-width: 0;
    margin: 0;
    padding: var(--sp-4);
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 6px;
  }
  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0 var(--sp-3);
    align-items: baseline;
    font-size: var(--fs-body);
  }
  .l {
    overflow-wrap: break-word;
  }
  li small {
    grid-column: 1 / -1;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .cap {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
</style>
