<script>
  /**
   * «Werte überall» WU3 (Noah 13.10.2026 «1-5a», mockups approved «ich gebe alle bild mockups frei»):
   * Aktiv › Goals: one year goal per value (km, metres climbed, active zone minutes), each with a
   * switch, a bar and a tick for the plan until today; the goal number can be changed. Below it the
   * footprint of the year. The minutes come with Fitbit (bundle B); until then that row says so.
   */
  import { liveQuery } from 'dexie';
  import { Bike, Mountain, Timer, Leaf } from '@lucide/svelte';
  import Sec from './kit/Sec.svelte';
  import { db } from '../db.js';
  import { withStravaRides } from '../kmbook.js';
  import { GOALS, YEAR_GOALS_KEY, CO2_PER_KM, goalsOf, yearSums, goalRow, co2Saved } from './yeargoals.js';
  import { t, num } from '../i18n.svelte.js';

  let { today } = $props();
  const ICON = { km: Bike, hm: Mountain, azm: Timer };
  const ridesQ = liveQuery(() => db.rides.toArray());
  const kmQ = liveQuery(() => db.kmBook.toArray());
  const goalsQ = liveQuery(() => db.settings.get(YEAR_GOALS_KEY));
  const goals = $derived(goalsOf($goalsQ?.value));
  const sums = $derived(yearSums(withStravaRides($ridesQ ?? [], $kmQ ?? []), today));
  const year = $derived(today.slice(0, 4));
  const save = (key, change) => db.settings.put({ key: YEAR_GOALS_KEY, value: { ...goals, [key]: { ...goals[key], ...change } } });
  let editing = $state(null);
  function setOf(key, e) {
    const v = Math.round(Number(String(e.currentTarget.value).replace(/[^\d]/g, '')));
    if (v > 0) save(key, { of: v });
    editing = null;
  }
  const unitText = (g, n) => (g.key === 'km' ? `${num(n)} km` : g.key === 'hm' ? t('{n} m climbed', { n: num(n) }) : t('{n} min', { n: num(n) }));
</script>

<Sec id="yg-h" title={t('Year goals {year}', { year })} sub={t('tick = plan until today')}>
  <ul class="card yg" data-section="year-goals">
    {#each GOALS as g (g.key)}
      {@const I = ICON[g.key]}
      {@const s = goals[g.key]}
      {@const r = g.fitbit ? null : goalRow(sums[g.key], s.of, today)}
      <li class:off={!s.on} data-goal={g.key}>
        <div class="r">
          <span class="ib" aria-hidden="true"><I size={18} /></span>
          <span class="m">
            <b>{t(g.label)}</b>
            {#if editing === g.key}
              <input class="inp sm num" type="text" inputmode="numeric" value={s.of} aria-label={t('Goal for {name}', { name: t(g.label) })} onchange={(e) => setOf(g.key, e)} onblur={() => (editing = null)} />
            {:else}
              <button type="button" class="ofb num" onclick={() => (editing = g.key)} aria-label={t('Change the goal for {name}', { name: t(g.label) })}>{r ? t('{have} of {of}', { have: unitText(g, r.have), of: num(s.of) }) : t('Goal {of}', { of: unitText(g, s.of) })}</button>
            {/if}
          </span>
          <label class="sw"><input type="checkbox" role="switch" checked={s.on} onchange={(e) => save(g.key, { on: e.currentTarget.checked })} /><span class="vh">{t('Show the goal for {name}', { name: t(g.label) })}</span></label>
        </div>
        {#if s.on}
          {#if r}
            <span class="bar" role="img" aria-label="{Math.round(r.fill * 100)} %"><i style="width:{Math.max(2, Math.round(r.fill * 100))}%"></i><span class="mk" style="left:{Math.round(r.plan * 100)}%"></span></span>
            <small class="num">{r.ahead >= 0 ? t('{n} ahead of the plan', { n: unitText(g, r.ahead) }) : t('{n} behind the plan', { n: unitText(g, -r.ahead) })}</small>
          {:else}
            <small class="soon">{t('Come with Fitbit: then the minutes of every activity count here.')}</small>
          {/if}
        {/if}
      </li>
    {/each}
  </ul>
</Sec>

<Sec id="fp-h" title={t('Footprint {year}', { year })} sub={t('all rides')}>
  <div class="card fp" data-section="footprint">
    <span class="ib lf" aria-hidden="true"><Leaf size={24} /></span>
    <div>
      <b class="big num">{t('≈ {n} kg CO₂ saved', { n: num(co2Saved(sums.km)) })}</b>
      <small class="num">{t('{km} km by bike instead of by car', { km: num(sums.km) })}</small>
      <small class="cap">{t('Estimated with {kg} kg CO₂ per car km.', { kg: num(CO2_PER_KM) })}</small>
    </div>
  </div>
</Sec>

<style>
  .yg {
    display: grid;
    gap: 16px;
    margin: 0;
    padding: 14px 16px;
    list-style: none;
  }
  .yg li {
    display: grid;
    gap: 6px;
  }
  .yg li.off .m b,
  .yg li.off .ofb {
    color: var(--ink-3);
  }
  .r {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ib {
    display: grid;
    flex: none;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .m {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }
  .ofb {
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    text-align: left;
    text-decoration: underline dotted;
    cursor: pointer;
  }
  .inp.sm {
    max-width: 10ch;
  }
  .sw input {
    width: 20px;
    height: 20px;
    accent-color: var(--hi);
  }
  .vh {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .bar {
    position: relative;
    display: block;
    height: 8px;
    border-radius: 99px;
    background: var(--paper-2);
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: 99px;
    background: var(--hi);
  }
  .bar .mk {
    position: absolute;
    top: -3px;
    width: 2px;
    height: 14px;
    background: var(--ink);
  }
  small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .fp {
    display: flex;
    gap: 14px;
    align-items: center;
  }
  .fp div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .lf {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: var(--hi-soft);
    color: var(--hi);
  }
  .big {
    font: 700 var(--fs-sub) / 1.2 var(--font-body);
  }
  .cap {
    font-size: var(--fs-tiny);
  }
</style>
