<script>
  /**
   * «Standardwoche» (Noah 26.11.2026, Thread «Wochenplan-Vorschläge verlässlich machen»): your normal week at a glance, inside the weekly plan.
   * What the planner makes of the goals without TrainingPeaks, a ski tour or moves of one week: every place is fixed (the unit stands there),
   * a wish (the unit goes there when the place is free) or free (the planner chose it). A tap opens the window of the place; on a computer
   * a place can be pulled to another day and part of the day. The goals (hours, number per kind) stand above the list and say whether the week holds them.
   * There is no second planner here: this view reads and writes the same goals (`training.weekplan`) the weekly plan plans from.
   *
   * cfg: the goals of the season; week: planWeek() of the example week; summer; dayName(d, style); nameOf(type);
   * onchange(nextCfg, text): the page saves it (with Undo).
   */
  import { Lock, Heart, ArrowLeftRight, Plus } from '@lucide/svelte';
  import { t, num } from '../i18n.svelte.js';
  import StandardSlotSheet from './StandardSlotSheet.svelte';
  import { GOAL_TYPES, FIXABLE, setSlot, moveSlot, removeSlot, slotsOf, plannedMins } from './wochenplan.js';
  import { TIME_PARTS, hoursOf } from './wochenplan-text.js';

  let { cfg, week, summer = false, dayName, nameOf, onchange } = $props();

  const HIDE = ['med', 'stretch'];
  const kindOf = (u) => (u.fixed ? 'fix' : u.why?.key === 'wish' ? 'wish' : 'free');
  const entries = $derived(week.units.filter((u) => !HIDE.includes(u.type)).sort((a, b) => a.d - b.d || a.t.localeCompare(b.t)));
  const onDay = (d) => entries.filter((u) => u.d === d);
  const partOf = (time) => (time < '12:00' ? 0 : time < '17:00' ? 1 : 2);
  const PART_NAME = ['Morning', 'Midday', 'Evening'];
  const inCell = (d, p) => entries.filter((u) => u.d === d && partOf(u.t) === p);
  const editable = (u) => FIXABLE.includes(u.type);

  // the goals: the hours and the number per kind of unit, and whether the week holds them
  const mins = $derived(plannedMins(week.units));
  const placed = (type) => week.units.filter((u) => u.type === type).length;
  const goals = $derived(GOAL_TYPES.filter((ty) => cfg.counts[ty] > 0).map((ty) => ({ type: ty, want: cfg.counts[ty], have: placed(ty) })));
  const missing = $derived(goals.filter((g) => g.have < g.want));
  const holds = $derived(week.warnings.length === 0 && goals.every((g) => g.have >= g.want));
  const hoursText = (m) => num(hoursOf(m));

  // the window of a place
  let sheet = $state(null);
  const sports = $derived(FIXABLE.map((ty) => ({ type: ty, name: nameOf(ty) })));
  const taken = (type) => slotsOf(cfg, type).map((x) => x.d);
  function open(u) {
    if (!editable(u)) return;
    const k = kindOf(u);
    sheet = { type: u.type, d: u.d, t: u.t, kind: k === 'free' ? 'wish' : k, choose: false, exists: k !== 'free' };
  }
  const add = (d) => (sheet = { type: '', d, t: '', kind: 'fix', choose: true, exists: false });
  function save(x) {
    const next = setSlot(x.from != null && x.from !== x.d ? removeSlot(cfg, x.type, x.from) : cfg, x.type, x.d, x.t, x.kind, summer);
    if (next === cfg) return;
    onchange(next, x.kind === 'fix' ? t('{what} is fixed on {day} at {time}.', { what: nameOf(x.type), day: dayName(x.d, 'long'), time: x.t }) : t('{what}: wish on {day} at {time}.', { what: nameOf(x.type), day: dayName(x.d, 'long'), time: x.t }));
  }
  function remove() {
    const s = sheet;
    if (!s) return;
    onchange(removeSlot(cfg, s.type, s.d), t('{what} on {day} is no longer a place of the standard week.', { what: nameOf(s.type), day: dayName(s.d, 'long') }));
  }

  // pulling a place (computer): to another day, and to another part of the day
  let pulled = $state(null);
  let over = $state(null);
  function drop(d, p) {
    const u = pulled;
    pulled = over = null;
    if (!u || !editable(u)) return;
    const time = partOf(u.t) === p ? u.t : TIME_PARTS[p].t;
    const k = kindOf(u);
    if (d !== u.d && taken(u.type).includes(d)) return onchange(cfg, t('{what} already has a place on {day}.', { what: nameOf(u.type), day: dayName(d, 'long') }));
    const next = k !== 'free' && d !== u.d ? moveSlot(cfg, u.type, u.d, d, time, summer) : setSlot(cfg, u.type, d, time, k === 'free' ? 'wish' : k, summer);
    if (next !== cfg) onchange(next, t('{what} now on {day} at {time}.', { what: nameOf(u.type), day: dayName(d, 'long'), time }));
  }

  // list on a phone, grid on a computer
  let wide = $state(false);
  $effect(() => {
    const q = window.matchMedia('(min-width: 900px)');
    const set = () => (wide = q.matches);
    set();
    q.addEventListener('change', set);
    return () => q.removeEventListener('change', set);
  });
</script>

{#snippet entry(u)}
  {@const k = kindOf(u)}
  {#if editable(u)}
    <button type="button" class="en k-{k}" class:pull={pulled?.id === u.id} draggable={wide ? 'true' : 'false'} ondragstart={(e) => { pulled = u; e.dataTransfer?.setData('text/plain', u.id); }} ondragend={() => (pulled = over = null)} onclick={() => open(u)} data-sw-entry={u.id} data-sw-kind-of={k}>
      <span class="tm num">{u.t}</span>
      <span class="nm"><b>{nameOf(u.type)}</b><small>{#if k === 'fix'}<Lock size={14} aria-hidden="true" />{t('Fixed|place')}{:else if k === 'wish'}<Heart size={14} aria-hidden="true" />{t('Wish|place')}{:else}<ArrowLeftRight size={14} aria-hidden="true" />{t('The app chooses')}{/if}</small></span>
    </button>
  {:else}
    <div class="en k-free still" data-sw-entry={u.id}>
      <span class="tm num">{u.t}</span>
      <span class="nm"><b>{nameOf(u.type)}</b><small>{t('follows on its own')}</small></span>
    </div>
  {/if}
{/snippet}

<section class="card stw" aria-labelledby="sw-h" data-sw>
  <h2 id="sw-h">{t('Standard week')}</h2>
  <p class="sub">{wide ? t('Your normal week. Tap a place to change it or pull it to another day.') : t('Your normal week. Tap a place to change it.')}</p>

  <div class="goals" data-sw-goals>
    <p class="gl" data-sw-hours><b>{t('Plan: {a} h of {b} h', { a: hoursText(mins), b: cfg.hours })}</b>{#if holds}<span class="okw">{t('The week holds your goals.')}</span>{/if}</p>
    {#if missing.length}
      <ul class="gchips" data-sw-missing>
        {#each missing as g (g.type)}<li class="gc more" data-sw-goal={g.type}>{nameOf(g.type)} <b class="num">{g.have} / {g.want}</b></li>{/each}
      </ul>
    {/if}
    <details class="gall" data-sw-all>
      <summary>{t('Goals per kind of unit')}</summary>
      <ul class="gchips">
        {#each goals as g (g.type)}
          <li class="gc" class:ok={g.have >= g.want} class:more={g.have < g.want} data-sw-goal-all={g.type}>{nameOf(g.type)} <b class="num">{g.have} / {g.want}</b></li>
        {/each}
      </ul>
    </details>
    {#if week.warnings.length}<p class="hint" data-sw-warn>{t('Some places do not fit together. «Week» shows which.')}</p>{/if}
  </div>

  {#if !wide}
    <div class="list" data-sw-list>
      {#each [0, 1, 2, 3, 4, 5, 6] as d (d)}
        <div class="day" data-sw-day-row={d}>
          <b class="dn">{dayName(d, 'short')}</b>
          <div class="ents">
            {#each onDay(d) as u (u.id)}{@render entry(u)}{/each}
            <button type="button" class="addb" onclick={() => add(d)} aria-label={t('New place on {day}', { day: dayName(d, 'long') })} data-sw-add={d}><Plus size={16} aria-hidden="true" />{t('Add a place')}</button>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="grid" data-sw-grid>
      <span></span>
      {#each [0, 1, 2, 3, 4, 5, 6] as d (d)}
        <span class="gh"><b>{dayName(d, 'short')}</b><button type="button" class="addi" onclick={() => add(d)} aria-label={t('New place on {day}', { day: dayName(d, 'long') })} data-sw-add={d}><Plus size={16} aria-hidden="true" /></button></span>
      {/each}
      {#each [0, 1, 2] as p (p)}
        <span class="gr">{t(PART_NAME[p])}</span>
        {#each [0, 1, 2, 3, 4, 5, 6] as d (d)}
          <div class="cell" class:over={over === `${d}-${p}`} role="group" aria-label={`${dayName(d, 'long')}, ${t(PART_NAME[p])}`} ondragover={(e) => { if (pulled) { e.preventDefault(); over = `${d}-${p}`; } }} ondrop={(e) => { e.preventDefault(); drop(d, p); }} data-sw-cell={`${d}-${p}`}>
            {#each inCell(d, p) as u (u.id)}{@render entry(u)}{/each}
          </div>
        {/each}
      {/each}
    </div>
  {/if}

  <ul class="legend">
    <li><Lock size={14} aria-hidden="true" />{t('Fixed: stands there')}</li>
    <li><Heart size={14} aria-hidden="true" />{t('Wish: goes there when it is free')}</li>
    <li><ArrowLeftRight size={14} aria-hidden="true" />{t('The app chooses the best place')}</li>
  </ul>
</section>

{#if sheet}
  <StandardSlotSheet slot={sheet} {sports} {taken} {dayName} {nameOf} {summer} onsave={save} onremove={remove} onclose={() => (sheet = null)} />
{/if}

<style>
  .stw {
    display: flex;
    padding: var(--sp-4);
    min-width: 0;
    flex-direction: column;
    gap: var(--sp-3);
  }
  .stw h2,
  .stw .sub {
    margin: 0;
  }
  .stw h2 {
    font: 600 var(--fs-body) var(--font-body);
  }
  .goals {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }
  .gl {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 12px;
  }
  .okw {
    color: var(--ok);
    font-weight: 600;
  }
  .gchips {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .gc {
    padding: 3px 10px;
    border: 1px solid var(--line);
    border-radius: var(--r-pill);
    font-size: var(--fs-small);
    background: var(--paper);
  }
  .gc.ok {
    border-color: var(--ok);
    background: var(--ok-soft);
  }
  .gc.more {
    border-color: var(--warn);
    background: var(--warn-soft);
  }
  .gall summary {
    cursor: pointer;
    min-height: 32px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .gall .gchips {
    margin-top: 6px;
  }
  .hint {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .list {
    display: flex;
    flex-direction: column;
  }
  .day {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 10px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .day:first-child {
    border-top: 0;
  }
  .dn {
    padding-top: 10px;
  }
  .ents {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .en {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 48px;
    padding: 8px 12px;
    border: 1.5px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .en.k-fix {
    border-left: 5px solid var(--brand);
  }
  .en.k-wish {
    border-color: var(--ok);
    background: var(--ok-soft);
  }
  .en.k-free {
    border-style: dashed;
  }
  .en.still {
    cursor: default;
    background: var(--paper-2);
  }
  .en.pull {
    opacity: 0.5;
  }
  .tm {
    font-weight: 700;
  }
  .nm {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .nm small {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .addb {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 6px 12px;
    border: 1.5px dashed var(--line-strong);
    border-radius: 12px;
    background: none;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .grid {
    display: grid;
    grid-template-columns: 72px repeat(7, minmax(0, 1fr));
    gap: 6px;
    align-items: start;
  }
  .gh {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }
  .addi {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 50%;
    background: var(--paper-2);
    color: var(--ink);
    cursor: pointer;
  }
  .gr {
    padding-top: 8px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .cell {
    min-height: 80px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px;
    border: 1px dashed var(--line);
    border-radius: 12px;
    background: var(--paper-2);
  }
  .cell.over {
    border-color: var(--brand);
    background: var(--paper);
  }
  .grid .en {
    min-height: 0;
    padding: 5px 8px;
    gap: 8px;
    flex-wrap: wrap;
  }
  .grid .nm b {
    font-size: var(--fs-small);
  }
  .legend {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .legend li {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
</style>
