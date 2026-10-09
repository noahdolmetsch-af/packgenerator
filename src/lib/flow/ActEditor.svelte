<script>
  /**
   * v0.51.0 «Im Flow»: edit an activity, everything in the frontend (mockup ImFlow-Bearbeiten-Phone):
   * name, symbol, ring, the goal (count × rolling window, sub-goals like Yoga Studio + Zuhause), how
   * much one tap counts, the minimum duration, the season (tap a month to move it between summer and
   * winter; a season without a goal rests) and «zählt auch» (commute, bike trips, another activity).
   * A new activity is the same form, empty. Pause keeps the history; delete removes it too.
   */
  import { ChevronLeft, Minus, Plus, Check, Sun, Snowflake, Trash2, X } from '@lucide/svelte';
  import Seg from '../ui/Seg.svelte';
  import ActIcon, { ACT_ICONS } from './ActIcon.svelte';
  import { db } from '../db.js';
  import { saveAct, deleteAct } from '../flowdb.js';
  import { normAct, blankAct, actState, toggleMonth, halfOf, WINDOWS, SUMMER } from '../flow.js';
  import { actName, goalName } from './ui.svelte.js';
  import { actGoalText, goalsText, oneGoal } from './words.js';
  import { t, locale, lang } from '../i18n.svelte.js';

  let { id, acts = [], log = [], today, tripDays = [] } = $props();
  const isNew = $derived(id === 'new');
  const orig = $derived(isNew ? null : (acts.find((a) => a.id === id) ?? null));
  let a = $state(null);
  let loadedFor = null;
  $effect(() => {
    if (loadedFor === id) return;
    if (!isNew && !orig) return;
    loadedFor = id;
    a = structuredClone($state.snapshot(isNew ? blankAct(acts.length) : normAct(orig)));
    name = isNew ? '' : actName(orig);
    half = a.season ? (halfOf(a, today) ?? 'summer') : 'summer';
    minOwn = [0, 15, 30].includes(a.minMin) ? '' : String(a.minMin);
  });
  let name = $state('');
  let half = $state('summer');
  let minOwn = $state('');
  let asking = $state(false);
  let moreCounts = $state(false);
  let err = $state('');

  const RING_OPTS = [
    { key: 'move', name: t('Move|ring') },
    { key: 'mind', name: t('Mindful|ring') },
    { key: 'rest', name: t('Recovery|ring') },
  ];
  const WIN_NAME = (d) => (d === 1 ? t('Day|window') : t('{n} days', { n: d }));
  // the goals the form edits: all year, or the chosen half of the season
  const goals = $derived(a ? (a.season && half === 'winter' ? a.season.winter : a.goals) : []);
  const setGoals = (list) => {
    if (a.season && half === 'winter') a.season.winter = list;
    else a.goals = list;
  };
  const upd = (i, patch) => setGoals(goals.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  function addSub() {
    const base = goals.length ? goals : [];
    setGoals([...base, { id: `g${Date.now().toString(36)}`, label: '', count: 1, days: base[0]?.days ?? 7 }]);
  }
  const removeSub = (i) => setGoals(goals.filter((_, j) => j !== i));
  function seasonOn(on) {
    a.season = on ? { summer: [...SUMMER], winter: structuredClone($state.snapshot(a.goals)) } : null;
    half = on ? (halfOf(a, today) ?? 'summer') : 'summer';
  }
  const MONTHS = $derived(Array.from({ length: 12 }, (_, i) => new Date(Date.UTC(2026, i, 1)).toLocaleDateString(locale(), { month: 'short', timeZone: 'UTC' })));
  const MONTHS_LONG = $derived(Array.from({ length: 12 }, (_, i) => new Date(Date.UTC(2026, i, 1)).toLocaleDateString(locale(), { month: 'long', timeZone: 'UTC' })));
  const nowMonth = Number(today.slice(5, 7));
  /** «April – October» for a run of months (wrapping over the new year), else a list. */
  function monthsText(ms) {
    if (!ms.length) return t('none|months');
    if (ms.length === 12) return t('all year');
    const set = new Set(ms);
    const starts = ms.filter((m) => !set.has(m === 1 ? 12 : m - 1));
    if (starts.length === 1) {
      let end = starts[0];
      while (set.has(end === 12 ? 1 : end + 1)) end = end === 12 ? 1 : end + 1;
      return `${MONTHS_LONG[starts[0] - 1]} – ${MONTHS_LONG[end - 1]}`;
    }
    return ms.map((m) => MONTHS[m - 1]).join(', ');
  }
  const winter = $derived(a?.season ? Array.from({ length: 12 }, (_, i) => i + 1).filter((m) => !a.season.summer.includes(m)) : []);
  const others = $derived(acts.filter((x) => x.id !== a?.id && x.ring === a?.ring));
  const toggleCount = (k) => (a.counts = a.counts.includes(k) ? a.counts.filter((x) => x !== k) : [...a.counts, k]);
  const st = $derived(a && !isNew ? actState(normAct({ ...a }), log, today, tripDays) : null);
  const minKey = $derived(a ? ([0, 15, 30].includes(a.minMin) && !minOwn ? a.minMin : 'own') : 0);

  async function save() {
    const nm = name.trim();
    if (!nm) {
      err = t('Give the activity a name.');
      document.getElementById('ed-name')?.focus();
      return;
    }
    const out = $state.snapshot(a);
    if (orig && nm === actName(orig)) {
      out.name = orig.name;
      if (orig.nameDe) out.nameDe = orig.nameDe;
    } else {
      out.name = nm;
      delete out.nameDe;
    }
    if (minKey === 'own') out.minMin = Math.max(0, Math.round(Number(minOwn) || 0));
    await saveAct(db, out);
    location.hash = '#/flow';
  }
  async function pause() {
    await saveAct(db, { ...$state.snapshot(a), name: orig.name, paused: !orig.paused });
    location.hash = '#/flow/goals';
  }
  async function remove() {
    await deleteAct(db, a.id);
    location.hash = '#/flow/goals';
  }
</script>

{#if a}
  <div class="ed">
    <p class="back"><a href={isNew ? '#/flow/goals' : '#/flow'}><ChevronLeft size={16} aria-hidden="true" />{isNew ? t('Goals|flow') : t('In the flow')}</a></p>
    <h1 class="title">{isNew ? t('New activity') : name || actName(orig)}</h1>
    {#if st}<p class="page-sub">{RING_OPTS.find((r) => r.key === a.ring).name} · {actGoalText(normAct(a), today, { min: false })}{#if !st.resting}{" · "}{t('stand {n}/{m}', { n: st.stand.n, m: st.stand.of })}{/if}</p>{/if}

    <section class="surf cp" aria-label={t('Name and symbol')}>
      <label class="lbl" for="ed-name">{t('Name')}</label>
      <input id="ed-name" class="inp big" type="text" bind:value={name} maxlength="40" autocomplete="off" oninput={() => (err = '')} />
      {#if err}<p class="err" role="alert">{err}</p>{/if}
      <p class="lbl" id="ed-icon">{t('Symbol')}</p>
      <div class="icons" role="group" aria-labelledby="ed-icon">
        {#each Object.keys(ACT_ICONS) as k (k)}
          <button type="button" class="icb {a.ring}" aria-pressed={a.icon === k} aria-label={k} onclick={() => (a.icon = k)}><ActIcon icon={k} ring={a.ring} box={false} size={20} /></button>
        {/each}
      </div>
      <p class="lbl" id="ed-ring">{t('Category · ring')}</p>
      <Seg full={false} labelledby="ed-ring" value={a.ring} onchange={(k) => (a.ring = k)} options={RING_OPTS} />
    </section>

    <section class="surf cp" aria-labelledby="ed-goal">
      <div class="sh-row"><h2 id="ed-goal" class="sh">{t('Goal')}</h2><span class="quiet">{t('rolling')}</span></div>
      {#if a.season}
        <Seg full={false} small label={t('Season')} value={half} onchange={(k) => (half = k)} options={[{ key: 'summer', name: t('Summer') }, { key: 'winter', name: t('Winter') }]} />
      {/if}
      {#each goals as q, i (q.id)}
        <div class="goal" data-goal={i}>
          {#if goals.length > 1}
            <div class="subname"><input class="inp" type="text" value={goalName(q)} placeholder={t('Sub-goal, e.g. at home')} aria-label={t('Name of sub-goal {n}', { n: i + 1 })} oninput={(e) => upd(i, { label: e.currentTarget.value, labelDe: undefined })} /><button type="button" class="ib" onclick={() => removeSub(i)} aria-label={t('Remove sub-goal {n}', { n: i + 1 })}><X size={18} aria-hidden="true" /></button></div>
          {/if}
          <div class="step">
            <button type="button" class="rb" onclick={() => upd(i, { count: Math.max(0, q.count - 1) })} aria-label={t('One less')}><Minus size={18} aria-hidden="true" /></button>
            <span class="cnum num" aria-live="polite" data-count={q.count}>{q.count}</span>
            <button type="button" class="rb" onclick={() => upd(i, { count: q.count + 1 })} aria-label={t('One more|count')}><Plus size={18} aria-hidden="true" /></button>
            <span class="quiet">{q.count ? t('× in') : t('rests in this season')}</span>
          </div>
          <Seg full={false} small label={t('Window')} value={q.days} onchange={(d) => upd(i, { days: d })} options={WINDOWS.map((d) => ({ key: d, name: WIN_NAME(d) }))} />
        </div>
      {/each}
      {#if !goals.length}<p class="hint">{t('No goal in this season: the activity rests.')}</p>{/if}
      <button type="button" class="lk" onclick={addSub}><Plus size={16} aria-hidden="true" />{goals.length ? t('Sub-goal') : t('Goal')}</button>
      <p class="hint">{t('Always counts the last {n} days, whatever the weekday.', { n: goals[0]?.days ?? 7 })}</p>
      <p class="lbl" id="ed-min">{t('Minimum duration')}</p>
      <Seg full={false} small labelledby="ed-min" value={minKey} onchange={(k) => (k === 'own' ? (minOwn = String(a.minMin || 20)) : ((minOwn = ''), (a.minMin = k)))} options={[{ key: 0, name: t('none|duration') }, { key: 15, name: '15 min' }, { key: 30, name: '30 min' }, { key: 'own', name: t('own|duration') }]} />
      {#if minKey === 'own'}<label class="inl"><input class="inp n" type="number" min="1" inputmode="numeric" bind:value={minOwn} aria-label={t('Minimum duration')} /> min</label>{/if}
      <label class="inl tap"><span>{t('One tap counts')}</span><input class="inp n" type="number" min="1" inputmode="numeric" value={a.perTap} oninput={(e) => (a.perTap = Math.max(1, Math.round(Number(e.currentTarget.value) || 1)))} /></label>
    </section>

    <section class="surf cp" aria-labelledby="ed-season">
      <div class="sh-row">
        <h2 id="ed-season" class="sh">{t('Season')}</h2>
        <input type="checkbox" class="switch" checked={!!a.season} onchange={(e) => seasonOn(e.currentTarget.checked)} aria-labelledby="ed-season" />
      </div>
      <p class="hint top">{t('Per sport: another goal in summer than in winter. Tap a month to move it.')}</p>
      {#if a.season}
        <div class="months" role="group" aria-label={t('Summer months')}>
          {#each MONTHS as m, i (i)}
            <button type="button" class="mo" class:sum={a.season.summer.includes(i + 1)} class:now={i + 1 === nowMonth} aria-pressed={a.season.summer.includes(i + 1)} aria-label={`${MONTHS_LONG[i]}: ${a.season.summer.includes(i + 1) ? t('Summer') : t('Winter')}`} onclick={() => (a.season.summer = toggleMonth(a.season.summer, i + 1))}>{m.slice(0, 1).toUpperCase()}</button>
          {/each}
        </div>
        <ul class="halves">
          <li><Sun size={18} class="sun" aria-hidden="true" /><span class="m"><b>{t('Summer')}</b><small>{monthsText(a.season.summer)}{#if a.season.summer.includes(nowMonth)}{" · "}{t('now')}{/if}</small></span><button type="button" class="chip" aria-pressed={half === 'summer'} onclick={() => (half = 'summer')}>{goalsText(a.goals)}</button></li>
          <li><Snowflake size={18} class="snow" aria-hidden="true" /><span class="m"><b>{t('Winter')}</b><small>{monthsText(winter)}{#if winter.includes(nowMonth)}{" · "}{t('now')}{/if}</small></span><button type="button" class="chip" aria-pressed={half === 'winter'} onclick={() => (half = 'winter')}>{goalsText(a.season.winter)}</button></li>
        </ul>
      {/if}
    </section>

    <section class="surf cp" aria-labelledby="ed-counts">
      <h2 id="ed-counts" class="sh">{t('Also counts')}</h2>
      <div class="chips">
        <button type="button" class="chip" aria-pressed={a.counts.includes('commute')} onclick={() => toggleCount('commute')}>{#if a.counts.includes('commute')}<Check size={16} aria-hidden="true" />{/if}{t('Commute')}</button>
        <button type="button" class="chip" aria-pressed={a.counts.includes('trip')} onclick={() => toggleCount('trip')}>{#if a.counts.includes('trip')}<Check size={16} aria-hidden="true" />{/if}{t('Bike trip')}</button>
        {#each others.filter((o) => moreCounts || a.counts.includes(o.id)) as o (o.id)}
          <button type="button" class="chip" aria-pressed={a.counts.includes(o.id)} onclick={() => toggleCount(o.id)}>{#if a.counts.includes(o.id)}<Check size={16} aria-hidden="true" />{/if}{actName(o)}</button>
        {/each}
        {#if !moreCounts && others.some((o) => !a.counts.includes(o.id))}<button type="button" class="lk" onclick={() => (moreCounts = true)}><Plus size={16} aria-hidden="true" />{t('another activity')}</button>{/if}
      </div>
      <p class="hint">{t('Commute: a tap on «Commute» counts as one ride. Trips from the Pack Generator count by themselves, one per day.')}</p>
    </section>

    <button type="button" class="btn hi save" onclick={save}>{t('Save')}</button>
    {#if !isNew}
      <div class="more">
        <button type="button" class="lk" onclick={pause}>{orig.paused ? t('Resume') : t('Pause|activity')}</button>
        {#if asking}
          <span class="ask">{t('Delete with its history?')} <button type="button" class="btn sm" onclick={remove}>{t('Delete')}</button> <button type="button" class="lk" onclick={() => (asking = false)}>{t('Cancel')}</button></span>
        {:else}
          <button type="button" class="lk" onclick={() => (asking = true)}><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>
        {/if}
      </div>
    {/if}
  </div>
{:else if !isNew}
  <p>{t('This activity no longer exists.')} <a href="#/flow">{t('In the flow')}</a></p>
{/if}

<style>
  .ed {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-width: 640px;
    margin: 0 auto;
  }
  .back {
    margin: 0;
  }
  .back a {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 32px;
    color: var(--accent);
    text-decoration: none;
    font-size: var(--fs-small);
  }
  .ed .page-sub {
    margin: 0;
  }
  .cp {
    padding: 16px 18px;
  }
  .sh-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }
  .sh {
    margin: 0 0 10px;
    font-size: var(--fs-section);
    font-weight: 500;
  }
  .sh-row .sh {
    margin: 0;
  }
  .quiet {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hint {
    margin: 10px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .hint.top {
    margin: 0 0 10px;
  }
  .cp .lbl {
    margin-top: 14px;
  }
  .cp .lbl:first-child {
    margin-top: 0;
  }
  .big {
    min-height: 48px;
    border: 0;
    border-radius: 10px;
    background: var(--paper-2);
  }
  .err {
    margin: 6px 0 0;
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .icons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .icb {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    border: 1.5px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    cursor: pointer;
  }
  .icb.move {
    color: var(--hi);
  }
  .icb.mind {
    color: var(--accent);
  }
  .icb.rest {
    color: var(--l3);
  }
  .icb[aria-pressed='true'] {
    border-color: currentColor;
    border-width: 2px;
  }
  .icb.move[aria-pressed='true'] {
    background: var(--hi-soft);
  }
  .icb.mind[aria-pressed='true'] {
    background: var(--accent-soft);
  }
  .icb.rest[aria-pressed='true'] {
    background: var(--l3-soft);
  }
  .goal {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px 0;
    border-bottom: 1px solid var(--line);
  }
  .subname {
    display: flex;
    gap: 6px;
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .step {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .rb {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1.5px solid var(--line);
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .cnum {
    min-width: 28px;
    text-align: center;
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: var(--fs-page);
  }
  .lk {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 2px;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    font-weight: 500;
    cursor: pointer;
  }
  .inl {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    color: var(--ink-2);
  }
  .inl .n {
    width: 90px;
  }
  .switch {
    flex: none;
    appearance: none;
    width: 52px;
    height: 30px;
    margin: 0;
    border-radius: 15px;
    background: var(--line-strong);
    position: relative;
    cursor: pointer;
  }
  .switch::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--paper);
    transition: transform 0.15s;
  }
  .switch:checked {
    background: var(--accent);
  }
  .switch:checked::after {
    transform: translateX(22px);
  }
  .months {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 3px;
  }
  .mo {
    min-width: 0;
    height: 44px;
    padding: 0;
    border: 1.5px solid transparent;
    border-radius: 8px;
    background: var(--l3-soft);
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .mo.sum {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .mo.now {
    border-color: var(--hi);
  }
  .halves {
    margin: 10px 0 0;
    padding: 0;
    list-style: none;
  }
  .halves li {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 56px;
    border-top: 1px solid var(--line);
  }
  .halves li:first-child {
    border-top: 0;
  }
  .halves :global(.sun) {
    color: var(--warn);
  }
  .halves :global(.snow) {
    color: var(--l3);
  }
  .m {
    flex: 1;
    min-width: 0;
    line-height: 1.3;
  }
  .m b {
    display: block;
    font-weight: 500;
  }
  .m small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 14px;
    border: 1.5px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--accent);
    font-weight: 500;
  }
  .halves .chip {
    flex: none;
    background: var(--paper-2);
    border-color: transparent;
  }
  .halves .chip[aria-pressed='true'] {
    border-color: var(--accent);
  }
  .save {
    min-height: 52px;
    border-radius: 12px;
    font-size: var(--fs-body);
  }
  .more {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .ask {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    color: var(--ink-2);
  }
</style>
