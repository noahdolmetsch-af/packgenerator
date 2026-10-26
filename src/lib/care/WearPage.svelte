<script>
  /**
   * «Verschleiss» (Noah 20.10.2026, answers «1 pro Teil, 2a+b, 3a, 4a+b, 5a»):
   * Bikes › Care › «Wear» (#/bikes?tab=care&view=wear&bike=<id>). Loaded only when opened (Bikes.svelte).
   * - the counter like a trip meter: the total km always stay; since the last service (km, days) and
   *   every period between two services;
   * - one row per wear part: a bar (km on the part / how long it lasts), «X km left», «about in March»
   *   from the km of the last 8 weeks, what the parts before it lasted, the cost per 1000 km;
   * - how long a part lasts: a start value that learns from the own changes, changeable per part,
   *   back to the suggestion, a part taken off or added to the page.
   * Everything comes from the part histories and the workshop visits (wear.js); nothing is counted twice.
   */
  import { liveQuery } from 'dexie';
  import { Gauge, Pencil, RotateCcw, EyeOff, Plus, Trash2, ChevronRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, tn, num, dateOf, locale } from '../i18n.svelte.js';
  import { bikesHash, sortBikes } from '../bikes.js';
  import { localDay } from '../localday.js';
  import { withVisits } from '../workshop.js';
  import { partName } from '../care.js';
  import { wearRows, weeklyKm, lifeChange, addableParts, servicePeriods, serviceDropDay, WEEKS } from '../wear.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import VeloHead from '../bikes/VeloHead.svelte';
  import QuickLinks from '../ui/QuickLinks.svelte';
  import ChainRotation from './ChainRotation.svelte';
  import GriffMore from './GriffMore.svelte';
  import WetChainHint from './WetChainHint.svelte';
  import ChainPlan from './ChainPlan.svelte'; // «Kette vorausschauend» (25.10.2026)
  import StandCheck from './StandCheck.svelte'; // Einzelidee Heute 6: after the standstill
  import { brandStats, bestFor } from '../griff.js';
  import './griff.css';

  let { bikeId = null } = $props();

  const today = localDay();
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const kmQ = liveQuery(() => db.kmBook.toArray());
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const bike = $derived(bikes.find((b) => b.id === bikeId) ?? bikes[0] ?? null);
  const view = $derived(bike ? withVisits(bike, $visitsQ ?? []) : null);
  const entries = $derived($kmQ ?? []);
  const rows = $derived(view ? wearRows(view, { entries, today }) : []);
  const perWeek = $derived(bike ? weeklyKm(entries, bike.id, today) : null);
  const periods = $derived(bike ? servicePeriods(bike, today) : []);
  // Paket VG 1133: km per brand from the own used-up parts of all bikes
  const stats = $derived(brandStats(bikes.map((b) => withVisits(b, $visitsQ ?? []))));
  const now = $derived(periods.find((p) => p.now) ?? null);
  const hidden = $derived(bike ? (bike.parts ?? []).filter((p) => bike.life && Object.hasOwn(bike.life, p.key) && bike.life[p.key] === null) : []);
  const addable = $derived(bike ? addableParts(bike).filter((p) => !hidden.some((h) => h.key === p.key)) : []);

  const month = (day) => new Date(`${day}T00:00:00Z`).toLocaleDateString(locale(), { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const STATE = { due: 'replace now', soon: 'soon', ok: 'fine|wear', unknown: 'km unknown' };
  const SOURCE = { own: 'your value', std: 'start value' };
  const srcText = (life) => (life.source === 'learned' ? tn(life.n, 'learned from {n} change', 'learned from {n} changes') : life.source ? t(SOURCE[life.source]) : '');
  const whyText = (r) => (r.why === 'measured' ? t('your last measurement says so') : r.why === 'work' ? t('work needed') : '');

  let editing = $state(null); // part key
  let lifeText = $state('');
  let msg = $state('');
  let addKey = $state('');
  let addLife = $state('');

  async function storeLife(key, value, text) {
    const before = bike.life ? { ...bike.life } : null;
    await db.bikes.update(bike.id, lifeChange(bike, key, value));
    offerDone(text, () => db.bikes.update(bike.id, { life: before ?? {} }));
  }
  function edit(r) {
    editing = r.key;
    lifeText = String(r.life.km ?? '');
    msg = '';
  }
  async function saveLife(e, r) {
    e.preventDefault();
    const n = Math.round(Number(String(lifeText).replace(/['’,\s]/g, '')));
    if (!(n >= 50 && n <= 200000)) return (msg = t('Type the km as a whole number, e.g. 3000.'));
    await storeLife(r.key, n, t('{part}: lasts {km} km.', { part: r.name, km: num(n) }));
    editing = null;
  }
  const backToStd = (r) => storeLife(r.key, null, t('{part}: back to the suggestion.', { part: r.name }));
  const hide = (r) => storeLife(r.key, 'off', t('{part} is off this page. Its history stays.', { part: r.name }));
  const show = (p) => storeLife(p.key, null, t('{part} is back on this page.', { part: partName(p) }));
  async function addPart(e) {
    e.preventDefault();
    const n = Math.round(Number(String(addLife).replace(/['’,\s]/g, '')));
    if (!addKey) return (msg = t('Choose a part.'));
    if (!(n >= 50 && n <= 200000)) return (msg = t('Type the km as a whole number, e.g. 3000.'));
    const p = bike.parts.find((x) => x.key === addKey);
    await storeLife(addKey, n, t('{part} is on this page now.', { part: partName(p) }));
    addKey = '';
    addLife = '';
    msg = '';
  }
  async function dropPeriod(p) {
    if ((await askDelete({ title: t('Remove the service of {date}?', { date: dateOf(p.from) }), text: t('Only this point on the counter goes. The km stay.'), label: t('Remove') })) !== 'delete') return;
    await deleteWithUndo({
      name: dateOf(p.from),
      text: t('Service of {date} removed.', { date: dateOf(p.from) }),
      run: async () => {
        const b = await db.bikes.get(bike.id);
        const patch = serviceDropDay(b, p.from);
        if (patch) await db.bikes.update(b.id, patch);
        return b.service ?? {};
      },
      undo: (before) => db.bikes.update(bike.id, { service: before }),
    });
  }
</script>

<div class="wearp">
  <VeloHead
    crumbs={[{ label: t('Bike'), href: bikesHash({ tab: 'setup', bike: bike?.id ?? null }) }, { label: t('Care|tab'), href: bikesHash({ tab: 'care', bike: bike?.id ?? null, open: !!bike }) }]}
    title={t('Wear|page')}
    sub={t('km per part, what the parts before lasted, and when the next change is due')}
  />
  {#if !bike}
    <p class="quiet">{t('No bike yet. Add a bike under Bikes first.')}</p>
  {:else}
    {#if bikes.length > 1}
      <nav class="chips" aria-label={t('Choose a bike')}>
        {#each bikes as b (b.id)}<a class="chip" aria-current={b.id === bike.id ? 'page' : undefined} href={bikesHash({ tab: 'care', view: 'wear', bike: b.id })}>{b.name}</a>{/each}
      </nav>
    {/if}

    <!-- «Alles finden 2» (new proposal): the pages of «Mehr zum Velo» (4 screens down) as one row on top -->
    <QuickLinks label={t('More for the bike')} links={[['photos', 'Wear photos'], ['sell', 'Sale listing'], ['bikepack', 'Pack the bike'], ['stock', 'Spare parts at home']].map(([view, title]) => ({ key: view, href: bikesHash({ tab: 'care', view, bike: bike.id }), label: t(title) }))} />
    <WetChainHint {bike} />
    <StandCheck {bike} />
    <ChainPlan {bike} />

    <details class="wcard how" data-wear-how>
      <summary>{t('How it works')}</summary>
      <ul>
        <li>{t('The total km of the bike always stay, like the odometer of a car.')}</li>
        <li>{t('A workshop visit sets the counters back: a replaced part starts again at 0 km, a serviced part at 0 km since the service. «Service of the whole bike» sets the bike counter to 0.')}</li>
        <li>{t('How long a part lasts starts with a suggestion and learns from your own changes. You can type your own value.')}</li>
        <li>{t('The date is a guess from your km of the last {n} weeks.', { n: WEEKS })}</li>
      </ul>
    </details>

    <section class="wcard" aria-labelledby="w-count" data-wear-counter>
      <h2 id="w-count">{t('Counter')}</h2>
      <p class="big num">{typeof bike.km === 'number' ? t('{km} km in total', { km: num(bike.km) }) : t('km not known yet')}</p>
      {#if now}
        <p class="num" data-wear-since>{now.km != null ? t('Since the last service on {date}: {km} km · {days} days', { date: dateOf(now.from), km: num(now.km), days: num(now.days) }) : t('Since the last service on {date}: {days} days', { date: dateOf(now.from), days: num(now.days) })}</p>
      {:else}
        <p class="quiet">{t('No service recorded yet. Log a workshop visit or tap «Service done» in Bike care.')}</p>
      {/if}
      {#if perWeek}<p class="quiet num">{t('Your pace: about {km} km a week (last {n} weeks).', { km: num(perWeek), n: WEEKS })}</p>{/if}
      {#if periods.length > 1}
        <details class="fold">
          <summary>{tn(periods.length, '{n} service period', '{n} service periods')}</summary>
          <ul class="periods">
            {#each periods as p (p.from)}
              <li data-wear-period={p.from}>
                <span class="num">{dateOf(p.from)} → {p.now ? t('today') : dateOf(p.to)}</span>
                <span class="num">{p.km != null ? `${num(p.km)} km · ` : ''}{tn(p.days, '{n} day', '{n} days')}</span>
                {#if p.visitId}<a class="lnk" href={bikesHash({ tab: 'shop', bike: bike.id, visit: p.visitId })}>{t('Visit')}</a>{:else}<button type="button" class="ib" aria-label={t('Remove the service of {date}', { date: dateOf(p.from) })} onclick={() => dropPeriod(p)}><Trash2 size={16} aria-hidden="true" /></button>{/if}
              </li>
            {/each}
          </ul>
        </details>
      {/if}
    </section>

    <section class="wcard" aria-labelledby="w-parts" data-wear-parts>
      <h2 id="w-parts"><Gauge size={18} aria-hidden="true" />{t('Parts')}</h2>
      {#if !rows.length}
        <p class="quiet">{t('No wear parts on this bike yet. Add parts in Bike care.')}</p>
      {/if}
      <ul class="rows">
        {#each rows as r (r.key)}
          <li class="row {r.state}" data-wear={r.key} data-wear-state={r.state}>
            <div class="top">
              <b>{r.name}</b>{#if r.model}<small class="model">{r.model}</small>{/if}
              <span class="badge {r.state}">{t(STATE[r.state])}</span>
            </div>
            {#if r.km != null && r.life.km}
              <div class="bar" role="img" aria-label={t('{km} of {life} km', { km: num(r.km), life: num(r.life.km) })}><span style:width="{Math.min(100, Math.round(r.frac * 100))}%"></span></div>
              <p class="num line">
                {t('{km} of {life} km', { km: num(r.km), life: num(r.life.km) })} ·
                {r.left > 0 ? t('{km} km left', { km: num(r.left) }) : t('{km} km over', { km: num(-r.left) })}{#if r.due && r.left > 0}{' · '}{t('about in {month}', { month: month(r.due) })}{/if}
              </p>
            {:else if r.state === 'unknown'}
              <p class="quiet">{t('The app does not know when this part was mounted.')} <a class="lnk" href={bikesHash({ tab: 'care', bike: bike.id, open: true })}>{t('Set a start point in Bike care')}</a></p>
            {/if}
            {#if whyText(r)}<p class="quiet">{whyText(r)}</p>{/if}
            {#if (r.state === 'soon' || r.state === 'due') && bestFor(stats, r.key)}<p class="quiet" data-wear-best>{t('Lasted longest for you: {brand}, about {km} km', { brand: bestFor(stats, r.key).brand, km: num(bestFor(stats, r.key).km) })}</p>{/if}
            {#if r.since}<p class="quiet num">{t('Since the last service on {date}: {km} km', { date: dateOf(r.since.date), km: num(r.since.km) })}</p>{/if}
            <p class="quiet src">{r.life.km ? t('Lasts about {km} km', { km: num(r.life.km) }) : ''}{r.life.km ? ` · ${srcText(r.life)}` : ''}{#if r.cost}{' · '}{t('CHF {chf} per 1000 km', { chf: num(r.cost.chf) })}{/if}</p>
            {#if r.past.length}
              <details class="fold">
                <summary>{tn(r.past.length, '{n} part before', '{n} parts before')}</summary>
                <ul class="past">{#each r.past as p (p.from)}<li class="num">{dateOf(p.from)} → {dateOf(p.to)}: {t('{km} km', { km: num(p.km) })}{#if p.model}{' · '}{p.model}{/if}</li>{/each}</ul>
              </details>
            {/if}
            {#if editing === r.key}
              <form class="edit" onsubmit={(e) => saveLife(e, r)}>
                <label><span class="lbl">{t('Lasts how many km?')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={lifeText} data-wear-life /></label>
                <button type="submit" class="btn sm">{t('Save')}</button>
                <button type="button" class="btn sm quiet" onclick={() => (editing = null)}>{t('Cancel')}</button>
              </form>
              {#if msg}<p class="err" role="alert">{msg}</p>{/if}
            {:else}
              <div class="acts">
                <button type="button" class="lnk" onclick={() => edit(r)} data-wear-edit><Pencil size={14} aria-hidden="true" />{t('Change how long it lasts')}</button>
                {#if r.life.source === 'own'}<button type="button" class="lnk" onclick={() => backToStd(r)} data-wear-std><RotateCcw size={14} aria-hidden="true" />{t('Back to the suggestion')}</button>{/if}
                <button type="button" class="lnk" onclick={() => hide(r)} data-wear-hide><EyeOff size={14} aria-hidden="true" />{t('Take off this page')}</button>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
      {#if addable.length}
        <form class="add" onsubmit={addPart}>
          <span class="lbl">{t('Follow another part')}</span>
          <select class="sel" aria-label={t('Part')} bind:value={addKey} data-wear-add-part>
            <option value="">{t('Choose a part')}</option>
            {#each addable as p (p.key)}<option value={p.key}>{partName(p)}</option>{/each}
          </select>
          <input class="inp num" type="text" inputmode="numeric" aria-label={t('Lasts how many km?')} placeholder={t('km, e.g. 5000')} bind:value={addLife} data-wear-add-life />
          <button type="submit" class="btn sm" data-wear-add><Plus size={14} aria-hidden="true" />{t('Add|part')}</button>
        </form>
        {#if msg && !editing}<p class="err" role="alert">{msg}</p>{/if}
      {/if}
      {#if hidden.length}
        <p class="quiet hid">{t('Off this page:')} {#each hidden as p, i (p.key)}<button type="button" class="lnk" onclick={() => show(p)} data-wear-show={p.key}>{partName(p)}</button>{i < hidden.length - 1 ? ', ' : ''}{/each}</p>
      {/if}
    </section>
    <!-- Paket VG «Das Velo im Griff»: chain rotation (1135), what lasts longest (1133), the pages and the reminders -->
    <div class="gp">
      <ChainRotation {bike} />
      <GriffMore {bike} {stats} />
    </div>
    <p class="quiet"><a class="lnk" href={bikesHash({ tab: 'shop', bike: bike.id })}>{t('Workshop visits and receipts')}<ChevronRight size={14} aria-hidden="true" /></a></p>
  {/if}
</div>

<style>
  .wearp {
    min-width: 0;
  }
  .wcard {
    margin: 0 0 14px;
    padding: 14px 16px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    min-width: 0;
  }
  .how summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    cursor: pointer;
    font-weight: 500;
  }
  .how ul {
    margin: 0;
    padding-left: 18px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 8px;
    font-size: var(--fs-body);
  }
  .big {
    margin: 0 0 4px;
    font-size: var(--fs-sub);
    font-weight: 600;
  }
  p {
    margin: 0 0 6px;
    overflow-wrap: break-word;
  }
  .quiet {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 14px;
  }
  .rows,
  .periods,
  .past {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .row {
    padding: 12px 0;
    border-top: 1px solid var(--line);
    min-width: 0;
  }
  .row:first-child {
    border-top: 0;
    padding-top: 0;
  }
  .top {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px 8px;
    margin: 0 0 6px;
  }
  .model {
    color: var(--ink-2);
  }
  .badge {
    margin-left: auto;
    padding: 1px 8px;
    border-radius: 999px;
    font-size: var(--fs-small);
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .badge.due {
    background: var(--bad-soft);
    color: var(--bad);
  }
  .badge.soon {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .badge.ok {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .bar {
    height: 8px;
    border-radius: 4px;
    background: var(--paper-2);
    overflow: hidden;
    margin: 0 0 6px;
  }
  .bar span {
    display: block;
    height: 100%;
    background: var(--ok);
  }
  .soon .bar span {
    background: var(--warn);
  }
  .due .bar span {
    background: var(--bad);
  }
  .fold summary {
    min-height: 40px;
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: var(--fs-small);
  }
  .periods li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    min-height: 40px;
    font-size: var(--fs-small);
  }
  .past li {
    font-size: var(--fs-small);
    padding: 2px 0;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
  }
  .lnk {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 40px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .ib {
    min-width: 40px;
    min-height: 40px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .edit,
  .add {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px;
    margin: 8px 0 0;
  }
  .edit label {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .edit .inp,
  .add .inp {
    width: 9rem;
    min-height: 44px;
  }
  .add {
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .add .lbl {
    flex: 1 0 100%;
  }
  .add .sel {
    flex: 1 1 160px;
    min-width: 0;
    min-height: 44px;
  }
  .err {
    color: var(--bad);
    font-size: var(--fs-small);
  }
</style>
