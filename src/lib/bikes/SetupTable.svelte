<script>
  /**
   * Taschen-Setups TS4 (Noah 14.10.2026 «3 a und b»): all setups of a bike as one table. Rows: the
   * places on the bike, then empty bags, contents, water, bike, the total and front / middle / rear.
   * Columns: the setups. Two ticks and «2 nebeneinander» opens the comparison (TS3). On a phone the
   * table scrolls sideways and the first column stays.
   */
  import { bikesHash, SLOT } from '../bikes.js';
  import { setupsOf, setupCalc, usageOf, lastUsedId, tablePlaces, STD } from '../setups.js';
  import { Columns2 } from '@lucide/svelte';
  import VeloHead from './VeloHead.svelte';
  import { t, tn, num, dateOf, bagName } from '../i18n.svelte.js';

  let { bike, trips = [], items = [], containers = [] } = $props();

  const setups = $derived(setupsOf(bike, trips));
  const used = $derived(usageOf(bike, trips));
  const calcs = $derived(setups.map((s) => setupCalc(s, bike, items, containers)));
  const places = $derived(tablePlaces(calcs));
  // svelte-ignore state_referenced_locally
  let ticked = $state([lastUsedId(bike, trips), setups.find((s) => s.id !== lastUsedId(bike, trips))?.id].filter(Boolean));
  const nm = (s) => (s.std ? t('Standard|setup') : s.name);
  const w = (g) => (g == null ? '–' : g >= 1000 ? `${num(Math.round(g / 10) / 100)} kg` : `${num(Math.round(g))} g`);
  const kg1 = (g) => `${num(Math.round(g / 100) / 10)} kg`;
  const when = (s) => (used[s.id] ? t('last {date}', { date: dateOf(used[s.id].last.startDate) }) : t('never used'));
  function tick(id, on) {
    ticked = on ? [...ticked.filter((x) => x !== id), id].slice(-2) : ticked.filter((x) => x !== id);
  }
  const href = $derived(ticked.length === 2 ? bikesHash({ tab: 'rig', view: 'compare', bike: bike.id, a: ticked[0], b: ticked[1] }) : null);
  const ROWS = [
    { key: 'bagsG', name: 'Bags empty', from: 'from Gear' },
    { key: 'contentG', name: 'Contents', from: 'from Gear' },
    { key: 'waterG', name: 'Water' },
    { key: 'bikeG', name: 'Bike' },
  ];
</script>

<VeloHead crumbs={[{ label: t('My setup|tab'), href: bikesHash({ tab: 'rig', bike: bike.id }) }]} here={bike.name} title={t('All setups')} sub={[bike.name, tn(setups.length, '{n} setup', '{n} setups'), t('rows = places on the bike, columns = setups')].join(' · ')}>
  {#if href}<a class="btn hi" href={href}><Columns2 size={16} aria-hidden="true" />{t('2 side by side')}</a>{:else}<span class="hint">{t('Tick two setups to see them side by side.')}</span>{/if}
</VeloHead>

<div class="card tw">
  <table class="st">
    <thead>
      <tr>
        <th scope="col" class="fc">{t('Place')}</th>
        {#each setups as s (s.id)}
          <th scope="col">
            <b>{nm(s)}</b><small>{when(s)}{s.id === STD ? ` · ${t('Standard|setup')}` : ''}</small>
            <label class="ck"><input type="checkbox" checked={ticked.includes(s.id)} onchange={(e) => tick(s.id, e.currentTarget.checked)} />{t('side by side')}</label>
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each places as key (key)}
        <tr>
          <th scope="row" class="fc">{t(SLOT[key]?.name ?? key)}</th>
          {#each calcs as c, i (setups[i].id)}
            {@const b = c.list.find((x) => x.key === key)}
            <td>{#if b}<b class="num">{w(b.sumG)}</b><small>{b.bag ? bagName(b.bag.name) : ''} · {tn(b.items.length, '{n} item', '{n} items')}</small>{:else}–{/if}</td>
          {/each}
        </tr>
      {/each}
      {#each ROWS as r, n (r.key)}
        <tr class:first={n === 0}>
          <th scope="row" class="fc">{t(r.name)}{#if r.from}<small>{t(r.from)}</small>{/if}</th>
          {#each calcs as c, i (setups[i].id)}<td><b class="num">{w(c[r.key])}</b></td>{/each}
        </tr>
      {/each}
      <tr class="sum">
        <th scope="row" class="fc">{t('Total|setup')}</th>
        {#each calcs as c, i (setups[i].id)}<td><b class="num">{kg1(c.totalG)}</b></td>{/each}
      </tr>
      <tr>
        <th scope="row" class="fc">{t('front / middle / rear')}</th>
        {#each calcs as c, i (setups[i].id)}<td class="num">{c.shares.front} / {c.shares.middle} / {c.shares.rear} %</td>{/each}
      </tr>
    </tbody>
  </table>
</div>
<p class="hint">{t('Tick two and «2 side by side» shows the difference per bag.')}</p>

<style>
  .hint {
    margin: 8px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .tw {
    overflow-x: auto;
    padding: 0;
  }
  .st {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-body);
  }
  .st th,
  .st td {
    padding: 10px 14px;
    text-align: left;
    vertical-align: top;
    border-top: 1px solid var(--line);
    min-width: 140px;
  }
  .st thead th {
    border-top: 0;
  }
  .st small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .st b {
    display: block;
  }
  .fc {
    position: sticky;
    left: 0;
    z-index: 1;
    min-width: 120px;
    background: var(--paper);
    border-right: 1px solid var(--line);
    font-weight: 600;
  }
  .first th,
  .first td {
    border-top: 2px solid var(--line-strong);
  }
  .sum th,
  .sum td {
    background: var(--paper-2);
    font-size: var(--fs-sub);
  }
  .ck {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    margin-top: 4px;
    font-size: var(--fs-small);
    font-weight: 400;
    cursor: pointer;
  }
  .ck input {
    width: 18px;
    height: 18px;
  }
</style>
