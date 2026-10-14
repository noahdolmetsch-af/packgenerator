<script>
  /**
   * Taschen-Setups TS3 (Noah 14.10.2026 «3 a und b»): two setups of a bike side by side, place by
   * place: the bag and its things, the weight, and the difference B minus A; then bike, empty bags,
   * contents, water and the total, and what is only in A or only in B. A and B can be chosen and
   * swapped. On a phone each place shows A over B. Lighter is not better: only to compare.
   */
  import { bikesHash, SLOT } from '../bikes.js';
  import { setupsOf, setupCalc, usageOf, lastUsedId, compareTwo } from '../setups.js';
  import { ArrowLeftRight, Table2 } from '@lucide/svelte';
  import VeloHead from './VeloHead.svelte';
  import { t, num, dateOf, nameOf, bagName } from '../i18n.svelte.js';

  let { bike, a = null, b = null, trips = [], items = [], containers = [] } = $props();

  const setups = $derived(setupsOf(bike, trips));
  const used = $derived(usageOf(bike, trips));
  const firstId = $derived(setups.some((s) => s.id === a) ? a : lastUsedId(bike, trips));
  const secondId = $derived(setups.some((s) => s.id === b && s.id !== firstId) ? b : setups.find((s) => s.id !== firstId)?.id ?? firstId);
  const calcOf = (id) => setupCalc(setups.find((s) => s.id === id), bike, items, containers);
  const ca = $derived(calcOf(firstId));
  const cb = $derived(calcOf(secondId));
  const cmp = $derived(compareTwo(ca, cb));
  const byId = $derived(Object.fromEntries(items.map((i) => [i.id, i])));
  const nm = (s) => (s.std ? t('Standard|setup') : s.name);
  const w = (g) => (g == null ? '–' : Math.abs(g) >= 1000 ? `${num(Math.round(g / 10) / 100)} kg` : `${num(Math.round(g))} g`);
  const diff = (g) => (Math.round(g) === 0 ? '±0' : `${g > 0 ? '+' : '−'}${w(Math.abs(g))}`);
  const TOT = { bikeG: 'Bike', bagsG: 'Bags empty', contentG: 'Contents', waterG: 'Water', totalG: 'Total|setup' };
  const go = (na, nb) => (location.hash = bikesHash({ tab: 'rig', view: 'compare', bike: bike.id, a: na, b: nb }));
  const sub = (s) => {
    const u = used[s.id];
    return [w(setupCalc(s, bike, items, containers).totalG), u ? t('last {date}', { date: dateOf(u.last.startDate) }) : t('never used')].join(' · ');
  };
  const names = (bag) => bag.items.map((x) => (x.item ? nameOf(x.item) : x.itemId)).join(' · ');
  const label = (bag) => (bag.bag ? bagName(bag.bag.name) : t(SLOT[bag.key]?.name ?? bag.key));
  const list = (ids) => ids.map((id) => (byId[id] ? nameOf(byId[id]) : id)).join(' · ') || '–';
</script>

<VeloHead crumbs={[{ label: t('My setup|tab'), href: bikesHash({ tab: 'rig', bike: bike.id }) }]} here={bike.name} title={t('Compare setups')} sub={t('Two side by side · difference = B minus A, per place on the bike')}>
  <a class="btn" href={bikesHash({ tab: 'rig', view: 'table', bike: bike.id })}><Table2 size={16} aria-hidden="true" />{t('All as a table')}</a>
</VeloHead>

{#if setups.length < 2}
  <p class="card hint">{t('Only one setup yet. Make a second one under «My setup» to compare.')}</p>
{:else}
  <div class="pick">
    <label class="ab"><span class="lt a" aria-hidden="true">A</span><span class="vh">{t('Setup A')}</span>
      <select class="sel" value={firstId} onchange={(e) => go(e.currentTarget.value, e.currentTarget.value === secondId ? firstId : secondId)}>{#each setups as s (s.id)}<option value={s.id}>{nm(s)} · {sub(s)}</option>{/each}</select>
    </label>
    <button type="button" class="btn swp" aria-label={t('Swap A and B')} onclick={() => go(secondId, firstId)}><ArrowLeftRight size={18} aria-hidden="true" /></button>
    <label class="ab"><span class="lt b" aria-hidden="true">B</span><span class="vh">{t('Setup B')}</span>
      <select class="sel" value={secondId} onchange={(e) => go(e.currentTarget.value === firstId ? secondId : firstId, e.currentTarget.value)}>{#each setups as s (s.id)}<option value={s.id}>{nm(s)} · {sub(s)}</option>{/each}</select>
    </label>
  </div>

  <section class="card cmp" aria-label={t('Compare setups')}>
    {#each cmp.rows as r (r.key)}
      <div class="r">
        <div class="pl"><b>{t(SLOT[r.key]?.name ?? r.key)}</b><small>{r.a ? r.a.n : '–'} / {r.b ? r.b.n : '–'}</small></div>
        <div class="sa">{#if r.a}<span class="bn"><b>{label(r.a)}</b><small>{names(r.a)}</small></span><b class="num w">{w(r.a.sumG)}</b>{:else}<i class="none">{t('no bag here')}</i>{/if}</div>
        <div class="df"><span class="num dpill" class:zero={Math.round(r.diff) === 0}>{diff(r.diff)}</span></div>
        <div class="sb">{#if r.b}<span class="bn"><b>{label(r.b)}</b><small>{names(r.b)}</small></span><b class="num w">{w(r.b.sumG)}</b>{:else}<i class="none">{t('no bag here')}</i>{/if}</div>
      </div>
    {/each}
    {#each cmp.totals as x (x.key)}
      <div class="r tr" class:sum={x.key === 'totalG'}>
        <div class="pl"><b>{t(TOT[x.key])}</b></div>
        <div class="sa"><b class="num w">{w(x.a)}</b></div>
        <div class="df"><span class="num dpill" class:zero={Math.round(x.diff) === 0}>{diff(x.diff)}</span></div>
        <div class="sb"><b class="num w">{w(x.b)}</b></div>
      </div>
    {/each}
  </section>

  <section class="card only">
    <div><h2>{t('Only in A ({n})', { n: cmp.onlyA.length })}</h2><p>{list(cmp.onlyA)}</p></div>
    <div><h2>{t('Only in B ({n})', { n: cmp.onlyB.length })}</h2><p>{list(cmp.onlyB)}</p></div>
    <p class="hint">{t('Front / middle / rear: A {a} % · B {b} %. Lighter is not better: only to compare.', { a: `${ca.shares.front} / ${ca.shares.middle} / ${ca.shares.rear}`, b: `${cb.shares.front} / ${cb.shares.middle} / ${cb.shares.rear}` })}</p>
  </section>
{/if}

<style>
  .hint {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .vh {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .pick {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 10px;
    margin: 0 0 14px;
  }
  .ab {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    padding: 8px 12px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper);
  }
  .ab .sel {
    flex: 1;
    min-width: 0;
  }
  .lt {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    background: var(--ink);
    color: var(--paper);
    font: 700 var(--fs-small) / 1 var(--font-body);
  }
  .lt.b {
    background: var(--ok);
  }
  .swp {
    width: 44px;
    padding: 0;
    justify-content: center;
  }
  .cmp {
    display: flex;
    flex-direction: column;
    margin: 0 0 14px;
  }
  .r {
    display: grid;
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 2fr) 96px minmax(0, 2fr);
    gap: 12px;
    align-items: start;
    padding: 12px 0;
    border-top: 1px solid var(--line);
  }
  .r:first-child {
    border-top: 0;
  }
  .pl b {
    display: block;
    font-size: var(--fs-body);
  }
  .pl small,
  .bn small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .sa,
  .sb {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }
  .bn {
    min-width: 0;
  }
  .w {
    flex: none;
  }
  .none {
    color: var(--ink-3);
  }
  .df {
    text-align: center;
  }
  .dpill {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--paper-2);
    font-weight: 600;
  }
  .dpill.zero {
    color: var(--ink-3);
    font-weight: 400;
  }
  .tr.sum {
    margin-top: 6px;
    padding: 12px;
    border: 0;
    border-radius: 12px;
    background: var(--paper-2);
  }
  .tr.sum .dpill {
    background: none;
  }
  .only {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 12px 24px;
  }
  .only h2 {
    margin: 0 0 4px;
    font-size: var(--fs-sub);
  }
  .only p {
    margin: 0;
    overflow-wrap: break-word;
  }
  .only .hint {
    grid-column: 1 / -1;
  }
  @media (max-width: 719px) {
    .pick {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .pick .ab:last-child {
      grid-column: 1 / 2;
    }
    .swp {
      grid-row: 1 / 3;
      grid-column: 2;
    }
    .r {
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 4px 10px;
    }
    .pl {
      grid-column: 1;
    }
    .df {
      grid-column: 2;
      grid-row: 1;
    }
    .sa,
    .sb {
      grid-column: 1 / -1;
    }
    .sa::before {
      content: 'A';
    }
    .sb::before {
      content: 'B';
    }
    .sa::before,
    .sb::before {
      flex: none;
      width: 20px;
      color: var(--ink-3);
      font-weight: 700;
    }
    .bn {
      flex: 1;
    }
    .only {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
