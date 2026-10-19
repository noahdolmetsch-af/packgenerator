<script>
  /**
   * «Sporttasche» (mockup AK3, Noah 13.10.2026 «1-5a», «ich gebe hiermit alle mockups frei»):
   *   #/flow/bags          left the bags (one per sport) with their next fixed date, the reminder; right
   *                        the open bag: tick what is in, «Alles drin», «+ Teil», «nicht gebraucht?»
   *   #/flow/bags?b=<id>   that bag open (else the one with the nearest fixed date)
   * The rules are pure and tested (lib/flowbag.js); the fixed dates come from «Woche» (flowweek.js).
   */
  import { Plus, Check, X, Bell, ShoppingBag } from '@lucide/svelte';
  import AreaIntro from '../../lib/intro/AreaIntro.svelte'; // «Einstieg» on top (Noah «4a»)
  import { liveQuery } from 'dexie';
  import { db } from '../../lib/db.js';
  import PageHead from '../../lib/ui/PageHead.svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import MoreAktiv from '../../lib/flow/kit/MoreAktiv.svelte';
  import ActIcon from '../../lib/flow/ActIcon.svelte';
  import { morePages } from '../../lib/flow/morepages.js';
  import { flowQuery, seedIfNeeded } from '../../lib/flow/data.svelte.js';
  import { flowStates } from '../../lib/flow.js';
  import { weekGoals, FIXED_KEY, fixedList } from '../../lib/flowweek.js';
  import { BAGS_KEY, PACK_KEY, REMIND_KEY, bagsOf, packsOf, nextDate, packDay, packedIds, togglePacked, packAll, settle, often, addThing, removeThing, addBag, removeBag } from '../../lib/flowbag.js';
  import { bagName, thingName, thingNote } from '../../lib/flow/bagwords.js';
  import { putSetting } from '../../lib/flowdb.js';
  import { actName } from '../../lib/flow/ui.svelte.js';
  import { addDays } from '../../lib/flow.js';
  import { localDay } from '../../lib/localday.js';
  import { phone } from '../../lib/media.svelte.js';
  import { t, tn, locale } from '../../lib/i18n.svelte.js';

  let { params = new URLSearchParams() } = $props();
  const today = localDay();
  const now = Date.now();
  const q = flowQuery(today);
  const data = $derived($q);
  $effect(() => {
    seedIfNeeded(data);
  });
  const setQ = liveQuery(async () => {
    const [b, p, r, f] = await Promise.all([db.settings.get(BAGS_KEY), db.settings.get(PACK_KEY), db.settings.get(REMIND_KEY), db.settings.get(FIXED_KEY)]);
    return { bags: bagsOf(b?.value), packs: packsOf(p?.value), on: r?.value !== false, fixed: fixedList(f?.value) };
  });
  const sets = $derived($setQ);
  // after a packed day: what stayed out counts as forgotten once (flowbag.js settle)
  $effect(() => {
    if (!sets) return;
    const s = settle(sets.bags, sets.packs, today);
    if (s.changed) Promise.all([putSetting(db, BAGS_KEY, s.bags), putSetting(db, PACK_KEY, s.packs)]);
  });

  const states = $derived(data ? flowStates(data.acts, data.log, today, data.tripDays) : []);
  const pages = $derived(morePages({ openGoals: weekGoals(states).filter((g) => !g.met).length }));
  const bags = $derived(sets?.bags ?? []);
  const next = $derived(new Map(bags.map((b) => [b.id, sets ? nextDate(b, sets.fixed, today, now) : null])));
  const nearest = $derived([...bags].filter((b) => next.get(b.id)).sort((a, b) => (next.get(a.id).day + next.get(a.id).time).localeCompare(next.get(b.id).day + next.get(b.id).time))[0] ?? bags[0] ?? null);
  const openId = $derived(params.get('b') && bags.some((b) => b.id === params.get('b')) ? params.get('b') : (nearest?.id ?? null));
  const bag = $derived(bags.find((b) => b.id === openId) ?? null);
  const day = $derived(bag && sets ? packDay(bag, sets.fixed, today, now) : today);
  const inIds = $derived(bag && sets ? packedIds(sets.packs, bag.id, day) : []);
  const nIn = $derived(bag ? bag.items.filter((x) => inIds.includes(x.id)).length : 0);

  const fmt = (d, o) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', ...o });
  const wday = (d) => fmt(d, { weekday: 'short' }).replace('.', '');
  function whenText(n) {
    if (!n) return t('no fixed date');
    const w = `${wday(n.day)} ${n.time}`;
    return n.day === today ? t('today {when}', { when: n.time }) : n.day === addDays(today, 1) ? t('tomorrow {when}', { when: w }) : w;
  }

  const saveBags = (list) => putSetting(db, BAGS_KEY, list);
  const savePacks = (p) => putSetting(db, PACK_KEY, p);
  const tick = (id) => savePacks(togglePacked(sets.packs, bag.id, day, id));
  const all = () => savePacks(packAll(sets.packs, bag, day));

  let adding = $state(false);
  let thing = $state('');
  async function addOne(e) {
    e.preventDefault();
    await saveBags(addThing(bags, bag.id, thing));
    thing = '';
    adding = false;
  }
  let pruning = $state(false);
  let newBag = $state(null);
  const liveActs = $derived((data?.acts ?? []).filter((a) => !a.paused));
  async function saveNewBag(e) {
    e.preventDefault();
    const act = liveActs.find((a) => a.id === newBag.actId);
    const list = addBag(bags, { name: newBag.name || (act ? actName(act) : ''), actId: act?.id ?? null, icon: act?.icon ?? 'heart' });
    if (list === bags) return;
    await saveBags(list);
    location.hash = `#/flow/bags?b=${encodeURIComponent(list.at(-1).id)}`;
    newBag = null;
  }
  async function dropBag() {
    await saveBags(removeBag(bags, bag.id));
    pruning = false;
    location.hash = '#/flow/bags';
  }
  const remindDay = $derived(nearest && next.get(nearest.id) ? addDays(next.get(nearest.id).day, -1) : null);
</script>

<div class="hob">
  <header class="ph">
    <Crumb path={[{ href: '#/flow', label: t('Active|place') }]} here={t('Sport bag')} />
    <MoreAktiv items={pages} on="bags" />
    <PageHead title={t('Sport bag')} text={t('A short packing list for each sport, so nothing is missing in everyday life')} />
  </header>
  <AreaIntro place="bags" />

  {#if sets}
    <div class="lay">
      <div class="col">
        <ul class="bags">
          {#each bags as b (b.id)}
            <li>
              <a class="card bagt" href="#/flow/bags?b={encodeURIComponent(b.id)}" data-bag={b.id} aria-current={b.id === openId ? 'page' : undefined}>
                <ActIcon icon={b.icon} ring="move" />
                <span class="t"><b>{bagName(b)}</b><small>{whenText(next.get(b.id))}</small></span>
                <span class="n">{tn(b.items.length, '{n} thing', '{n} things')}</span>
              </a>
            </li>
          {/each}
        </ul>
        {#if phone.matches}{@render openBag()}{/if}
        {#if newBag}
          <form class="card nb" onsubmit={saveNewBag} data-new-bag>
            <label>{t('For which activity?')}<select bind:value={newBag.actId}><option value="">{t('none|act')}</option>{#each liveActs as a (a.id)}<option value={a.id}>{actName(a)}</option>{/each}</select></label>
            <label>{t('Name')}<input bind:value={newBag.name} placeholder={liveActs.find((a) => a.id === newBag.actId) ? actName(liveActs.find((a) => a.id === newBag.actId)) : ''} /></label>
            <div class="fb"><button type="submit" class="btn hi">{t('Save')}</button><button type="button" class="btn" onclick={() => (newBag = null)}>{t('Cancel')}</button></div>
          </form>
        {:else}
          <button type="button" class="chip dash" onclick={() => (newBag = { actId: '', name: '' })} data-add-bag><Plus size={16} aria-hidden="true" />{t('new bag')}</button>
        {/if}
        <div class="note" data-remind>
          <Bell size={18} aria-hidden="true" />
          <span>
            <b>{t('Reminder the evening before')}</b>
            {#if !sets.on}{t('is off.')}{:else if remindDay}{t('{day} from 17:00 on Heute: «Tomorrow {name} {time}, pack the bag».', { day: wday(remindDay), name: bagName(nearest), time: next.get(nearest.id).time })}{:else}{t('Add fixed dates under «Week», then Heute reminds you the evening before.')}{/if}
            <button type="button" class="lnk" onclick={() => putSetting(db, REMIND_KEY, sets.on ? false : null)} data-remind-toggle>{sets.on ? t('Switch off') : t('Switch on')}</button>
          </span>
        </div>
      </div>

      <div class="col">
        {#if !phone.matches}{@render openBag()}{/if}
      </div>
    </div>
  {/if}
</div>

{#snippet openBag()}
    {#if bag}
      <section class="card open" aria-labelledby="bag-h" data-open-bag={bag.id}>
        <div class="hl">
          <h2 id="bag-h">{bagName(bag)}{#if next.get(bag.id)}{' · '}{wday(next.get(bag.id).day)} {next.get(bag.id).time}{/if}</h2>
          <span class="num" data-count>{t('{n} of {m} in', { n: nIn, m: bag.items.length })}</span>
        </div>
        <span class="bar" aria-hidden="true"><i style="width:{bag.items.length ? Math.round((nIn / bag.items.length) * 100) : 0}%"></i></span>
        <ul class="items">
          {#each bag.items as x (x.id)}
            {@const on = inIds.includes(x.id)}
            <li class:warn={often(x)} data-item={x.id}>
              {#if pruning}
                <button type="button" class="it" onclick={() => saveBags(removeThing(bags, bag.id, x.id))} aria-label={t('Remove {name}', { name: thingName(x) })}><span class="bx rm"><X size={16} aria-hidden="true" /></span><span class="t"><b>{thingName(x)}</b></span></button>
              {:else}
                <button type="button" class="it" role="checkbox" aria-checked={on} onclick={() => tick(x.id)}>
                  <span class="bx" class:y={on}>{#if on}<Check size={16} aria-hidden="true" />{/if}</span>
                  <span class="t"><b>{thingName(x)}{#if often(x)}<span class="tag">{t('often forgotten')}</span>{/if}</b>{#if often(x)}<small>{t('{n}× forgotten', { n: x.forgot })}</small>{:else if thingNote(x)}<small>{thingNote(x)}</small>{/if}</span>
                </button>
              {/if}
            </li>
          {:else}
            <li class="none">{t('Nothing in this bag yet. Add the first thing.')}</li>
          {/each}
        </ul>
        {#if adding}
          <form class="add" onsubmit={addOne}>
            <label class="vh" for="bag-thing">{t('New thing')}</label>
            <input id="bag-thing" bind:value={thing} placeholder={t('e.g. hair tie')} />
            <button type="submit" class="btn hi">{t('Add')}</button>
            <button type="button" class="btn" onclick={() => (adding = false)}>{t('Cancel')}</button>
          </form>
        {/if}
        <div class="chips">
          {#if !adding && !pruning}<button type="button" class="chip dash" onclick={() => (adding = true)} data-add-thing><Plus size={16} aria-hidden="true" />{t('Thing')}</button>{/if}
          <button type="button" class="chip dash" aria-pressed={pruning} onclick={() => (pruning = !pruning)} data-prune>{pruning ? t('Done|prune') : t('not needed? tap')}</button>
          {#if pruning}<button type="button" class="chip dash" onclick={dropBag} data-drop-bag>{t('Delete this bag')}</button>{/if}
        </div>
        {#if !pruning && bag.items.length}
          <button type="button" class="btn hi big" onclick={all} disabled={nIn === bag.items.length} data-all><Check size={20} aria-hidden="true" />{nIn === bag.items.length ? t('All in the bag') : t('All in')}</button>
        {/if}
      </section>
    {:else}
      <p class="card none"><ShoppingBag size={18} aria-hidden="true" /> {t('No bag yet. Add one for your sport.')}</p>
    {/if}
{/snippet}

<style>
  /* the look of «Woche» (Week.svelte); the bags as in mockup AK3 */
  .hob {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 1240px;
    margin: 0 auto;
    min-width: 0;
  }
  .hob :global(.pagehead) {
    margin: 0;
  }
  .ph {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
  }
  .lay {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-5);
    align-items: start;
  }
  @media (min-width: 1000px) {
    .lay {
      grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
    }
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    min-width: 0;
  }
  .vh {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .bags {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .bagt {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 64px;
    padding: 12px 14px;
    color: var(--ink);
    text-decoration: none;
  }
  .bagt:hover {
    background: var(--paper-2);
  }
  .bagt[aria-current='page'] {
    outline: 2px solid var(--hi);
    outline-offset: -2px;
  }
  .bagt .t {
    flex: 1;
    min-width: 0;
  }
  .t b {
    display: block;
    font-weight: 600;
  }
  .t small,
  .n {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .n {
    white-space: nowrap;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 6px 14px;
    border: 1.5px dashed var(--line-strong);
    border-radius: 99px;
    background: none;
    color: var(--ink-2);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
    cursor: pointer;
  }
  .col > .chip {
    align-self: flex-start;
  }
  .chip[aria-pressed='true'] {
    border-style: solid;
    border-color: var(--ink);
    color: var(--ink);
  }
  .note {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin: 0;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .note :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--hi);
  }
  .lnk {
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--hi);
    font: inherit;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
  }
  .nb {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-3);
    padding: var(--sp-4);
  }
  .nb label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .nb select,
  .nb input,
  .add input {
    min-height: 44px;
    min-width: 0;
  }
  .fb {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    grid-column: 1 / -1;
  }
  .open {
    padding: var(--sp-4) var(--sp-5);
  }
  .hl {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-2);
  }
  .hl h2 {
    margin: 0;
    font: 600 var(--fs-h3, 1.2rem) / 1.25 var(--font-body);
  }
  .hl span {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .bar {
    display: block;
    height: 6px;
    margin: var(--sp-2) 0 var(--sp-1);
    border-radius: 3px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    background: var(--hi);
  }
  .items {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .items li {
    border-top: 1px solid var(--line);
  }
  .items li:first-child {
    border-top: 0;
  }
  .it {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 52px;
    padding: 8px 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .bx {
    display: grid;
    flex: none;
    place-items: center;
    width: 26px;
    height: 26px;
    border: 1.5px solid var(--line-strong);
    border-radius: 8px;
  }
  .bx.y {
    border-color: var(--hi);
    background: var(--hi);
    color: var(--paper);
  }
  .bx.rm {
    color: var(--ink-3);
  }
  .warn .t b {
    color: var(--warn);
  }
  .tag {
    margin-left: 6px;
    padding: 2px 6px;
    border-radius: 6px;
    background: var(--warn-soft);
    color: var(--warn);
    font-size: var(--fs-tiny);
    font-weight: 600;
  }
  .add {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    margin-top: var(--sp-3);
  }
  .add input {
    flex: 1 1 160px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    margin-top: var(--sp-3);
  }
  .big {
    width: 100%;
    min-height: 52px;
    margin-top: var(--sp-4);
    justify-content: center;
    font-size: var(--fs-body);
  }
  .none {
    margin: 0;
    padding: var(--sp-3) 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
