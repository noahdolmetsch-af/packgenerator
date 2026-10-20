<script>
  /**
   * Strombudget pro Tour und Powerbank-Rechner (Noah 19.10.2026 16:53 «2a»): Material › Strom (#/gear/power,
   * #/gear/power?trip=ID). Do the devices of a trip last, which power bank and which charger to take.
   * The numbers come from the battery data of each device (#346, Paket H) or typical values (marked
   * «estimated»). Days, nights with a socket, riding and dark hours are suggestions from the trip and can be
   * changed; on a trip they are kept with it (trip.power) so Pack shows the same answer. The rule: src/lib/power.js.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { t, tn, nameOf, locale } from '../lib/i18n.svelte.js';
  import { formatWeight } from '../lib/gear.js';
  import { tripFacts } from '../lib/situation.js';
  import { upcomingTrips } from '../lib/gear/assign.js';
  import { nextTrip } from '../lib/debrief.js';
  import { slotFor, addEntries, touched } from '../lib/trips.js';
  import { localDay } from '../lib/localday.js';
  import { powerRole, powerInputs, powerBudget, tripDevices, missingOnTrip, usableWh, batteryOf, portsOf, BANK_USABLE } from '../lib/power.js';
  import PathHead from '../lib/ui/PathHead.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import ItemDialog from '../lib/gear/ItemDialog.svelte';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import { saveFailed } from '../lib/ui/ask.js';
  import { BatteryCharging, Plug, Zap, Check, TriangleAlert } from '@lucide/svelte';

  const itemsQ = liveQuery(() => db.items.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());
  const items = $derived($itemsQ ?? []);
  const trips = $derived($tripsQ ?? []);
  const today = localDay();
  const choices = $derived(upcomingTrips(trips, today));
  const asked = new URLSearchParams(location.hash.split('?')[1] ?? '').get('trip');
  let tripId = $state(asked ?? null);
  // the trip from the link, else the next one; «» = without a trip
  const chosenId = $derived(tripId ?? nextTrip(trips, today)?.id ?? '');
  const trip = $derived(trips.find((x) => x.id === chosenId) ?? null);

  // without a trip: every own device, ticked off one by one
  let without = $state({});
  const ownDevices = $derived(items.filter((i) => i.ownership !== 'gone' && i.ownership !== 'wishlist' && powerRole(i) === 'device').sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'de')));
  const devices = $derived(trip ? tripDevices(trip, items) : ownDevices.filter((i) => !without[i.id]).map((item) => ({ item, qty: 1 })));

  // the inputs: from the trip (saved or suggested), or typed for a trip without one
  let free = $state({ days: 3, socketNights: 0, rideH: 6, nightH: 1 });
  const inputs = $derived(trip ? powerInputs(trip, tripFacts(trip)) : { ...free, cold: false });
  const budget = $derived(powerBudget(devices, items, inputs));
  const missing = $derived(trip ? missingOnTrip(trip, budget) : []);
  const banks = $derived(items.filter((i) => i.ownership !== 'gone' && i.ownership !== 'wishlist' && powerRole(i) === 'bank'));
  const chargers = $derived(items.filter((i) => i.ownership !== 'gone' && i.ownership !== 'wishlist' && powerRole(i) === 'charger'));
  let open = $state(null);
  let problem = $state('');

  const wh = (n) => t('{n} Wh', { n: Math.round(n * 10) / 10 });
  const named = (list) => list.map((i) => nameOf(i)).join(' + ');

  async function setInput(key, raw) {
    const v = Number(String(raw).replace(',', '.'));
    if (!Number.isFinite(v) || v < 0) return;
    if (!trip) {
      free = { ...free, [key]: key === 'days' ? Math.max(1, Math.round(v)) : v };
      return;
    }
    problem = '';
    try {
      await db.trips.update(trip.id, touched({ power: { ...(trip.power ?? {}), [key]: v } }));
    } catch (err) {
      problem = saveFailed(err);
    }
  }
  async function resetInputs() {
    if (!trip?.power) return;
    const before = trip.power;
    await db.trips.update(trip.id, touched({ power: null }));
    offerDone(t('Back to the values from the trip.'), async () => {
      await db.trips.update(trip.id, touched({ power: before }));
      offerDone(t('Changed back.'));
    });
  }
  async function addMissing() {
    if (!trip || !missing.length) return;
    const before = trip.entries;
    const byId = new Map(items.map((i) => [i.id, i]));
    let entries = trip.entries ?? [];
    for (const id of missing) entries = addEntries(entries, [id], slotFor(byId.get(id)?.defaultBag, trip.setup), { packed: false });
    try {
      await db.trips.update(trip.id, touched({ entries }));
      offerDone(tn(missing.length, '{n} item is on the packing list.', '{n} items are on the packing list.'), async () => {
        await db.trips.update(trip.id, touched({ entries: before }));
        offerDone(t('Changed back.'));
      });
    } catch (err) {
      problem = saveFailed(err);
    }
  }
  const USE = { ride: 'while riding', night: 'in the dark', day: 'all day', little: 'about 1 h' };
</script>

<div class="page pwr">
  <PathHead crumbs={[{ label: t('Gear|place'), href: '#/gear' }]} title={t('Power|electric')} sub={t('Power budget and power bank')} />
  <p class="intro">{t('Do your devices last the trip? The app adds up what phone, lights and bike computer use per day and says which power bank and which charger to take. All values are suggestions: change them here or in the device.')}</p>
  {#if problem}<p class="err" role="alert">{problem}</p>{/if}

  <section class="box" aria-labelledby="pw-in">
    <h2 id="pw-in" class="title">{t('Trip')}</h2>
    <label class="fld wide">
      <span>{t('For which trip')}</span>
      <select value={chosenId} onchange={(e) => (tripId = e.currentTarget.value)}>
        {#each choices as c (c.id)}<option value={c.id}>{c.title || t('Trip')}{c.startDate ? ` · ${c.startDate}` : ''}</option>{/each}
        {#if trip && !choices.some((c) => c.id === trip.id)}<option value={trip.id}>{trip.title || t('Trip')}</option>{/if}
        <option value="">{t('Without a trip: all my devices')}</option>
      </select>
    </label>
    <div class="grid">
      <label class="fld"><span>{t('Days')}</span><input class="inp num" type="number" min="1" max="60" inputmode="numeric" value={inputs.days} disabled={!!trip} onchange={(e) => setInput('days', e.currentTarget.value)} /></label>
      <label class="fld"><span>{t('Nights with a socket')}</span><input class="inp num" type="number" min="0" max="60" inputmode="numeric" value={inputs.socketNights} onchange={(e) => setInput('socketNights', e.currentTarget.value)} /></label>
      <label class="fld"><span>{t('Riding hours a day')}</span><input class="inp num" type="number" min="0" max="24" step="0.5" inputmode="decimal" value={inputs.rideH} onchange={(e) => setInput('rideH', e.currentTarget.value)} /></label>
      <label class="fld"><span>{t('Hours with a light a day')}</span><input class="inp num" type="number" min="0" max="24" step="0.5" inputmode="decimal" value={inputs.nightH} onchange={(e) => setInput('nightH', e.currentTarget.value)} /></label>
    </div>
    {#if trip}
      <p class="note">{t('The days come from the trip. A night in a hotel or hut counts as a night with a socket, a bivouac without.')}{#if trip.power}{' '}<button type="button" class="text-button" onclick={resetInputs}>{t('Use the values from the trip')}</button>{/if}</p>
    {/if}
    {#if inputs.cold}<p class="note">{t('Below 5 °C a power bank gives about 10 % less; that is counted.')}</p>{/if}
  </section>

  {#if $itemsQ}
    <section class="box res" aria-labelledby="pw-res" data-power-result>
      <h2 id="pw-res" class="title"><Zap size={20} aria-hidden="true" /> {t('Result')}</h2>
      {#if !devices.length}
        <p class="none">{trip ? t('This trip has no devices to charge yet.') : t('No devices yet. Items in Electronics and Lights count as devices.')}</p>
      {:else}
        <p class="big">{t('Your devices use about {wh} a day.', { wh: wh(budget.dailyWh) })} {budget.stretch > 1 ? tn(budget.stretch, 'The longest stretch without a socket is {n} day.', 'The longest stretch without a socket is {n} days.') : t('You can charge every night.')}</p>
        <div class="ans" class:ok={budget.banks.enough}>
          <BatteryCharging size={22} aria-hidden="true" />
          <div>
            {#if budget.needWh <= 0}
              <b>{t('No power bank needed.')}</b>
              <span>{t('Each device lasts until the next socket.')}</span>
            {:else if budget.banks.enough}
              <b>{t('Take: {names}', { names: named(budget.banks.pick) })}</b>
              <span>{t('Needed from the power bank: {need}; it gives about {have}.', { need: wh(budget.needWh), have: wh(budget.banks.usable) })}</span>
            {:else}
              <b>{budget.banks.size.count > 1 ? t('Not enough: take {n} × {mah} mAh more', { n: budget.banks.size.count, mah: budget.banks.size.mah.toLocaleString(locale()) }) : t('Not enough: take a {mah} mAh power bank more', { mah: budget.banks.size.mah.toLocaleString(locale()) })}</b>
              <span>{t('Needed from the power bank: {need}; yours give about {have}.', { need: wh(budget.needWh), have: wh(budget.banks.usable) })} {t('Borrow one, or add it to the wish list.')}</span>
            {/if}
          </div>
        </div>
        {#if budget.charger}
          <div class="ans" class:ok={!budget.charger.tooLong}>
            <Plug size={22} aria-hidden="true" />
            <div>
              <b>{budget.charger.pick ? t('Charger: {name}', { name: nameOf(budget.charger.pick) }) : t('Charger: one with {n} sockets', { n: Math.min(budget.charger.n, 3) })}</b>
              <span>{tn(budget.charger.n, 'Charging {n} thing takes about {h} h a night.', 'Charging {n} things takes about {h} h a night.', { h: budget.charger.hours })}{#if budget.charger.tooLong}{' '}{t('That is too long for one night: take a charger with more sockets.')}{/if}</span>
            </div>
          </div>
        {/if}
        {#if missing.length}
          <button type="button" class="btn hi" onclick={addMissing}><Check size={16} aria-hidden="true" /> {t('Put on the packing list')}</button>
        {/if}
      {/if}
    </section>

    {#if devices.length || ownDevices.length}
      <section class="box" aria-labelledby="pw-dev">
        <h2 id="pw-dev" class="title">{t('Devices')} <small class="num">{devices.length}</small></h2>
        <ul class="rows">
          {#each trip ? budget.devices : ownDevices.map((i) => budget.devices.find((r) => r.item.id === i.id) ?? { item: i, off: true }) as r (r.item.id)}
            <li class:off={r.off}>
              {#if !trip}<input type="checkbox" checked={!r.off} aria-label={t('Count {name}', { name: nameOf(r.item) })} onchange={(e) => (without = { ...without, [r.item.id]: !e.currentTarget.checked })} />{/if}
              <span class="nm">{r.qty > 1 ? `${r.qty} × ` : ''}{nameOf(r.item)}
                {#if !r.off}<small>{t('Battery {wh}', { wh: wh(r.wh) })} · {t('lasts {n} h', { n: r.runH })} · {t(USE[r.use])} · {t('{wh} a day', { wh: wh(r.daily) })}{#if r.fromBank > 0}{' '}· {t('{wh} from the power bank', { wh: wh(r.fromBank) })}{/if}{#if r.guessed}{' '}· <i>{t('estimated')}</i>{/if}</small>{/if}
              </span>
              <button type="button" class="btn sm" onclick={() => (open = r.item)}>{r.guessed ? t('Add values') : t('Open|item')}</button>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <section class="box" aria-labelledby="pw-own">
      <h2 id="pw-own" class="title">{t('Your power banks and chargers')}</h2>
      {#if banks.length || chargers.length}
        <ul class="rows">
          {#each banks as b (b.id)}
            <li><span class="nm">{nameOf(b)}<small>{t('{mah} mAh, gives about {wh}', { mah: batteryOf(b).mah.toLocaleString(locale()), wh: wh(usableWh(b)) })}{b.weightG ? ` · ${formatWeight(b.weightG)}` : ''}</small></span><button type="button" class="btn sm" onclick={() => (open = b)}>{t('Open|item')}</button></li>
          {/each}
          {#each chargers as c (c.id)}
            <li><span class="nm">{nameOf(c)}<small>{tn(portsOf(c), '{n} socket', '{n} sockets')}{c.weightG ? ` · ${formatWeight(c.weightG)}` : ''}</small></span><button type="button" class="btn sm" onclick={() => (open = c)}>{t('Open|item')}</button></li>
          {/each}
        </ul>
      {:else}
        <Empty text={t('No power bank or charger yet. Add them in Gear; the app knows them by the name (Power bank, Charger, Plug).')} />
      {/if}
      <p class="note">{t('How it counts: battery × hours in use ÷ hours one charge lasts. A night with a socket fills everything up. A power bank gives about {pct} % of what is printed on it.', { pct: Math.round(BANK_USABLE * 100) })}</p>
    </section>
  {:else}
    <p class="none"><TriangleAlert size={16} aria-hidden="true" /> {t('Loading …')}</p>
  {/if}
</div>

{#if open}<ItemDialog item={open} {items} onclose={() => (open = null)} />{/if}

<style>
  .pwr {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
  .intro {
    margin: 0;
    color: var(--ink-2);
    max-width: 70ch;
  }
  .box {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    min-width: 0;
    gap: 10px;
    align-content: start;
    padding: 16px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  h2.title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: var(--fs-sub);
  }
  h2 small {
    color: var(--ink-2);
    font-weight: 500;
  }
  .grid {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  .fld {
    display: grid;
    min-width: 0;
    gap: 4px;
    font-size: var(--fs-small);
  }
  .fld select,
  .fld input {
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--input);
    color: var(--ink);
    font: inherit;
    padding: 0 8px;
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }
  .big {
    margin: 0;
    overflow-wrap: break-word;
  }
  .ans {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .ans :global(svg) {
    flex: none;
    color: var(--warn);
  }
  .ans.ok :global(svg) {
    color: var(--ok);
  }
  .ans div {
    display: grid;
    gap: 2px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .ans span,
  .note,
  .nm small,
  .none {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .note,
  .none {
    margin: 0;
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .rows li {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    border-bottom: 1px solid var(--line);
  }
  .rows li.off .nm {
    color: var(--ink-2);
  }
  .rows input[type='checkbox'] {
    width: 22px;
    height: 22px;
    flex: none;
  }
  .nm {
    display: grid;
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .err {
    color: var(--bad);
  }
</style>
