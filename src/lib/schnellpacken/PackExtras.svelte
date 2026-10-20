<script module>
  // which folds are open, per trip: kept outside the card, because Planen draws the card anew after each save
  const folds = $state({});
</script>

<script>
  /**
   * Paket SP «Schneller packen» (Noah 20.10.2026 «1a 2a 3a 4a»): the card on Planen of a trip, four folds,
   * each a suggestion that can stay empty:
   *   - Zu zweit (1124): who carries what, the weight per person; the companion is only a typed name
   *   - In der Wäsche (1125): clothes of this trip still in the wash; a reminder in Merken two days before
   *   - Erst am Morgen (1126): what you pack only on the departure morning; it comes as a list on Unterwegs
   *   - Packzeit (1127): start and stop the clock, the time and the trend against the last trip
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { t, tn, nameOf, locale } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { formatWeight } from '../gear.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { loadTodos, addTodo } from '../merkendb.js';
  import { EXTRAS_KEY, twoOf, whoCarries, switchCarry, splitWeights, clothesOf, inWash, washDay, washSrc, morningOf, packTimeOf, startClock, stopClock, packTrend, minutesOf } from './spack.js';
  import { Zap, Users, Shirt, Sunrise, Timer, ChevronRight, Play, Square, Check } from '@lucide/svelte';

  let { trip, trips = [], itemsById = {} } = $props();
  const extrasQ = liveQuery(() => db.settings.get(EXTRAS_KEY));
  const timeOff = $derived(!!$extrasQ?.value?.timeOff);
  const save = (fields) => db.trips.update(trip.id, touched(fields));
  const isOpen = (k) => folds[`${trip.id}:${k}`] ?? false;
  const toggle = (k) => (e) => (folds[`${trip.id}:${k}`] = e.currentTarget.open);
  const rows = $derived((trip.entries ?? []).map((e) => ({ e, item: itemsById[e.itemId] })).filter((r) => r.item));

  /* 1124 two */
  const two = $derived(twoOf(trip));
  const split = $derived(splitWeights(trip, itemsById));
  let nameDraft = $state('');
  function setName(e) {
    e.preventDefault();
    const name = nameDraft.trim();
    if (!name) return;
    save({ two: { ...(two ?? { carry: {} }), name } });
    nameDraft = '';
  }
  async function endTwo() {
    const before = $state.snapshot(trip.two);
    await save({ two: null });
    offerDone(t('Packing alone again.'), () => save({ two: before }));
  }

  /* 1125 laundry */
  const clothes = $derived(clothesOf(trip, itemsById));
  const washing = $derived(inWash(trip, itemsById));
  async function wash(item) {
    const on = !item.laundry;
    await db.items.update(item.id, { laundry: on || null });
    const due = washDay(trip, localDay());
    if (!on || !due) return;
    const open = (await loadTodos(db)).some((x) => x.src === washSrc(trip) && !x.doneAt);
    if (open) return;
    const made = await addTodo(db, { text: t('Wash the clothes for {title}', { title: trip.title ?? '' }), due, src: washSrc(trip), area: 'own' });
    if (made) offerDone(t('Reminder in Merken for {date}.', { date: new Date(`${due}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric' }) }), made.undo);
  }

  /* 1126 morning */
  const morning = $derived(morningOf(trip, itemsById));
  const morningItem = (item) => db.items.update(item.id, { morning: item.morning ? null : true });

  /* 1127 packing time */
  const pt = $derived(packTimeOf(trip));
  const trend = $derived(packTrend(trip, trips));
  let now = $state(Date.now());
  $effect(() => {
    if (!pt.start) return;
    const id = setInterval(() => (now = Date.now()), 15000);
    return () => clearInterval(id);
  });
  const running = $derived(pt.start ? minutesOf((pt.ms ?? 0) + Math.max(0, now - new Date(pt.start).getTime())) : 0);
  const start = () => ((now = Date.now()), save(startClock(trip)));
  const stop = () => {
    const f = stopClock(trip);
    if (f) save(f);
  };
  const trendText = $derived.by(() => {
    if (!trend || pt.ms == null) return trend ? t('Last time: {n} min ({title})', { n: minutesOf(trend.ms), title: trend.title }) : '';
    const d = Math.round(trend.diffMs / 6e4);
    if (d < 0) return tn(-d, '{n} min faster than last time', '{n} min faster than last time');
    if (d > 0) return tn(d, '{n} min slower than last time', '{n} min slower than last time');
    return t('As fast as last time');
  });
  const setTimeOff = (off) => db.settings.put({ key: EXTRAS_KEY, value: { ...($extrasQ?.value ?? {}), timeOff: off } });
</script>

{#if trip && !trip.finished}
  <section class="card spk" aria-labelledby="spk-h" data-pack-extras>
    <h3 id="spk-h"><Zap size={16} aria-hidden="true" />{t('Pack faster')}</h3>
    {#if washing.length}<p class="wash" role="note" data-still-wash><Shirt size={16} aria-hidden="true" />{t('Still in the wash: {list}', { list: washing.map((i) => nameOf(i)).join(', ') })}</p>{/if}

    <details class="fold" data-two open={isOpen('two')} ontoggle={toggle('two')}>
      <summary><Users size={18} aria-hidden="true" /><span class="lab">{t('Packing for two')}</span><span class="r tp-small tp-muted">{two?.name ? t('with {name}', { name: two.name }) : t('not set')}</span><ChevronRight class="chev" size={16} aria-hidden="true" /></summary>
      <div class="body">
        {#if !two?.name}
          <p class="tp-small tp-muted">{t('Share the tent, the stove or the tools: type who comes along, then tap what they carry. Only the name is kept, nothing from the other person.')}</p>
          <form class="nm" onsubmit={setName}>
            <input class="inp" bind:value={nameDraft} placeholder={t('Name, e.g. Lea')} aria-label={t('Who comes along?')} data-two-name />
            <button type="submit" class="btn ink"><Check size={16} aria-hidden="true" />{t('Save')}</button>
          </form>
        {:else}
          <p class="sum" data-two-sum><b>{t('You')}</b> {formatWeight(split.me)} · <b>{two.name}</b> {formatWeight(split.them)}{#if split.unweighed}{' · '}<span class="tp-muted">{tn(split.unweighed, '{n} item without weight', '{n} items without weight')}</span>{/if}</p>
          <p class="tp-small tp-muted">{t('Tap an item to switch who carries it.')}</p>
          <div class="tp-chips">
            {#each rows as r (r.e.itemId)}
              <button type="button" class="tp-chip" aria-pressed={whoCarries(trip, r.item.id) === 'them'} onclick={() => save({ two: switchCarry(trip, r.item.id) })} data-two-item={r.item.id}>{nameOf(r.item)}{#if whoCarries(trip, r.item.id) === 'them'}{' · '}{two.name}{/if}</button>
            {/each}
          </div>
          <button type="button" class="tp-link" onclick={endTwo}>{t('Pack alone again')}</button>
        {/if}
      </div>
    </details>

    <details class="fold" data-wash open={isOpen('wash')} ontoggle={toggle('wash')}>
      <summary><Shirt size={18} aria-hidden="true" /><span class="lab">{t('In the wash')}</span><span class="r tp-small tp-muted">{washing.length ? tn(washing.length, '{n} piece', '{n} pieces') : t('nothing')}</span><ChevronRight class="chev" size={16} aria-hidden="true" /></summary>
      <div class="body">
        <p class="tp-small tp-muted">{t('Tap the clothes still in the wash. Two days before the trip a reminder comes in Merken.')}</p>
        {#if clothes.length}
          <div class="tp-chips">{#each clothes as r (r.e.itemId)}<button type="button" class="tp-chip" aria-pressed={r.wash} onclick={() => wash(r.item)} data-wash-item={r.item.id}>{nameOf(r.item)}</button>{/each}</div>
        {:else}<p class="tp-small">{t('No clothes on this trip yet.')}</p>{/if}
      </div>
    </details>

    <details class="fold" data-morning open={isOpen('morning')} ontoggle={toggle('morning')}>
      <summary><Sunrise size={18} aria-hidden="true" /><span class="lab">{t('Only on the morning')}</span><span class="r tp-small tp-muted">{morning.length ? tn(morning.length, '{n} item', '{n} items') : t('nothing')}</span><ChevronRight class="chev" size={16} aria-hidden="true" /></summary>
      <div class="body">
        <p class="tp-small tp-muted">{t('Phone, food from the fridge, filled bottles: tap what goes in only on the departure morning. On that morning On the way shows them as a short list. The mark stays with the item for every trip.')}</p>
        <div class="tp-chips">{#each rows as r (r.e.itemId)}<button type="button" class="tp-chip" aria-pressed={!!r.item.morning} onclick={() => morningItem(r.item)} data-morning-item={r.item.id}>{nameOf(r.item)}</button>{/each}</div>
      </div>
    </details>

    {#if !timeOff}
      <details class="fold" data-packtime open={isOpen('time') || !!pt.start} ontoggle={toggle('time')}>
        <summary><Timer size={18} aria-hidden="true" /><span class="lab">{t('Packing time')}</span><span class="r tp-small tp-muted">{pt.start ? t('running · {n} min', { n: running }) : pt.ms ? t('{n} min', { n: minutesOf(pt.ms) }) : t('not measured')}</span><ChevronRight class="chev" size={16} aria-hidden="true" /></summary>
        <div class="body">
          {#if pt.start}
            <button type="button" class="btn hi" onclick={stop} data-pack-stop><Square size={16} aria-hidden="true" />{t('Done packing')}</button>
          {:else}
            <button type="button" class="btn" onclick={start} data-pack-start><Play size={16} aria-hidden="true" />{pt.ms ? t('Go on packing') : t('Start packing')}</button>
          {/if}
          {#if trendText}<p class="tp-small" data-pack-trend>{trendText}</p>{/if}
          <button type="button" class="tp-link" onclick={() => setTimeOff(true)}>{t('Hide the packing time')}</button>
        </div>
      </details>
    {:else}
      <p class="tp-small tp-muted off">{t('Packing time is hidden.')} <button type="button" class="tp-link" onclick={() => setTimeOff(false)}>{t('Show again')}</button></p>
    {/if}
  </section>
{/if}

<style>
  .spk {
    padding: 12px 16px;
    margin: 12px 0;
  }
  h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 6px;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .wash {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin: 0 0 8px;
    padding: 8px 10px;
    border-radius: var(--r-ctl);
    background: var(--warn-soft);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .fold {
    border-top: 1px solid var(--line);
  }
  .fold summary {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    cursor: pointer;
    list-style: none;
  }
  .fold summary::-webkit-details-marker {
    display: none;
  }
  .fold .lab {
    flex: 1 1 auto;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .fold .r {
    text-align: right;
  }
  .fold[open] :global(.chev) {
    transform: rotate(90deg);
  }
  .body {
    display: grid;
    gap: 8px;
    padding: 0 0 12px;
  }
  .body p {
    margin: 0;
  }
  .nm {
    display: flex;
    gap: 8px;
  }
  .nm .inp {
    flex: 1 1 auto;
    min-width: 0;
  }
  .body .btn,
  .nm .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    justify-self: start;
  }
  .body .tp-link {
    justify-self: start;
  }
  .off {
    margin: 8px 0 0;
    padding-top: 8px;
    border-top: 1px solid var(--line);
  }
</style>
