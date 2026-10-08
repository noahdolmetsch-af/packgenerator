<script>
  /**
   * Plan (v0.29.0, Noah 1a, 4b, 5a): "Is my list right for this trip?"
   * The trip band with the four steps, the trip conditions as four fields, what the weather changed
   * (applied by itself, each row with its reason and Undo, one Undo for the whole change), and the
   * packing list by bags: each bag shows the names of its items in one line, a tap opens it.
   * Rarely needed things (weight in detail, before the trip, ballast, weather suggestions) fold into rows with ›.
   */
  import { Bike, Clock3, CloudSun, UserRound, Briefcase, ChevronRight, ChevronDown, Plus, Minus, MoreHorizontal, Mountain, Layers, Weight, ArrowRight, Undo2, GripVertical, Wrench, Package } from '@lucide/svelte';
  import DecisionReview from './DecisionReview.svelte';
  import TripBand from '../trip/TripBand.svelte';
  import Sum from '../ui/Sum.svelte';
  import { planningGroups } from '../preparation.js';
  import { t, tn, nameOf, num, locale } from '../i18n.svelte.js';
  import { formatWeight } from '../gear.js';
  import { RAIN, heavyHigh, isDayTrip, daysUntil } from '../trips.js';
  import { bagVolumes } from '../bagsuggest.js';
  import { phone } from '../media.svelte.js';
  import { hasContext } from '../context.js';
  import { rainOf } from '../layers.js';
  import { pastTrips } from '../hubs.js';
  import { localDay } from '../localday.js';
  import '../trip/trip.css';
  let { trip, stats, bike, bikeTrip, domainLabel, items, itemsById, trips, candidates, targets, templates, hasPhoto = false, openLayers, canUndo, changeNote = '', ctxChanged = false, ctxRows = {}, reasons = {}, readyCount, readyTotal, over, step, debriefStep, carry = new Set(), q = $bindable(''), zoneKey = $bindable('seat'), review = $bindable(false), actions, settings, picker, moreWeights, preparation, ballastContent, suggest = null, notice = null, made = false } = $props();
  let grouping = $state('bags');
  let opened = $state({});
  let itemMenu = $state(null);
  let sheet = $state(null);
  let sheetEl = $state();
  let menuEl = $state();
  let note = $state('');
  const groups = $derived(planningGroups(stats, items, grouping));
  // v0.26.1 (Noah 15b): litres only when every bag in use and every item in them has litres; else nothing.
  const volumes = $derived(bagVolumes(stats, itemsById));
  const kg = (g) => `${(g / 1000).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
  const wxText = $derived(trip.wx?.min != null && trip.wx?.max != null ? `${trip.wx.min}–${trip.wx.max} °C · ${t(RAIN[trip.wx.rain ?? 'none'])}` : t('No weather set'));
  // v0.25.0 (M3): days and the night for a trip with its context; older trips their hours.
  const NIGHT = { none: 'no overnight stay', lodging: 'Lodging', outdoor: 'Outdoor' };
  const days = $derived(Math.max(1, Number(trip.days) || 1));
  const durationText = $derived(hasContext(trip) ? `${tn(days, '{n} day', '{n} days')} · ${t(NIGHT[trip.overnight])}` : tn(days, '{n} day', '{n} days'));
  const perDay = $derived.by(() => {
    const r = trip.route;
    if (r?.km) return [`${num(Math.round(r.km / days))} km`, r.gainM ? `${num(Math.round(r.gainM / days))} ${t('m up|short')}` : null, trip.hours ? t('{n} h', { n: num(trip.hours) }) : null].filter(Boolean).join(' · ');
    return trip.hours ? t('{n} h per day', { n: num(trip.hours) }) : t('Duration not set');
  });
  const tpl = $derived(templates.find((x) => x.id === trip.templateId) ?? null);
  const startText = $derived(tpl ? tpl.name : trip.copiedFrom ? t('Last trip') : t('Standard set'));
  const until = $derived(trip.startDate ? daysUntil(trip.startDate) : null);
  const whenText = $derived(until == null ? '' : until > 1 ? tn(until, 'in {n} day', 'in {n} days') : until === 1 ? t('tomorrow') : until === 0 ? t('today') : '');
  const kicker = $derived([bikeTrip ? t('Trip') : domainLabel, whenText, startText].filter(Boolean).join(' · '));
  const zoneTitle = (g) => grouping === 'category' ? t(g.zone.name) : (trip.purpose?.[g.key] || t(g.key === 'mounted' ? 'On the bike|zone' : g.zone.name));
  const icon = (key) => key === 'body' ? UserRound : key === 'mounted' ? Bike : Briefcase;
  const flip = (key) => opened = { ...opened, [key]: !opened[key] };
  const groupG = (g) => g.entries.reduce((s, e) => s + (itemsById[e.itemId]?.weightG ?? 0) * (e.qty || 1), 0);
  const groupMissing = (g) => g.entries.filter((e) => itemsById[e.itemId]?.weightG == null).length;
  const preview = (g) => g.entries.map((e) => `${itemsById[e.itemId] ? nameOf(itemsById[e.itemId]) : e.itemId}${(e.qty || 1) > 1 ? ` × ${e.qty}` : ''}`).join(' · ');
  function show(mode) { sheet = mode; itemMenu = null; }
  $effect(() => { if (sheet && sheetEl && !sheetEl.open) sheetEl.showModal(); });
  async function add(id) { try { await actions.addTo(zoneKey, id); note = t('Added to this trip.'); } catch { note = t('Could not save. Please try again.'); } }
  // v0.24.1 (Noah 6a): the ticked items in one write; NotPacked clears its ticks when this succeeds.
  async function addMany(ids) { try { await actions.addMany(zoneKey, ids); note = tn(ids.length, '{n} item added to this trip.', '{n} items added to this trip.'); } catch (err) { note = t('Could not save. Please try again.'); throw err; } }
  // v0.24.1 (Noah 2a): a bike day ride packs everything in one tap and goes to On the way.
  const dayRide = $derived(bikeTrip && isDayTrip(trip));
  async function apply(choices) { await actions.apply(choices); review = false; note = t('Selection saved. Your packing list is up to date.'); window.scrollTo({ top: 0 }); }
  function changeTrip(id) { review = false; opened = {}; actions.choose(id); }
  function closeMenu(event) { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus(); }
  const menu = (fn) => () => { menuEl.open = false; fn(); };
  // v0.29.0 (Noah 4b): the rows the weather (the trip's context) brings, with their reason.
  const wxRows = $derived(bikeTrip ? trip.entries.filter((e) => { const i = itemsById[e.itemId]; return i && (typeof i.coldBelow === 'number' || rainOf(i)) && reasons[e.itemId]?.line; }) : []);
  const pastN = $derived(pastTrips(trips, [], localDay()).length);
  const ctxIds = $derived(Object.keys(ctxRows));
  const changedText = (id) => { const c = ctxRows[id]; return !c ? '' : c.kind === 'added' ? t('new for this trip') : t('{from} → {to}', { from: c.from, to: c.to }); };
  const primary = $derived(over ? 'debrief' : step === debriefStep ? 'end' : step === 2 ? 'ride' : dayRide ? 'go' : 'pack');
</script>

{#snippet go()}
  {#if primary === 'debrief'}<button class="btn hi go" onclick={() => location.hash = `#/debrief/${encodeURIComponent(trip.id)}`}>{t('Next: Debrief')}<ArrowRight size={20} aria-hidden="true" /></button>
  {:else if primary === 'end'}<button class="btn hi go" onclick={actions.end}>{t('Next: Debrief')}<ArrowRight size={20} aria-hidden="true" /></button>
  {:else if primary === 'ride'}<button class="btn hi go" onclick={actions.ride}>{t('Next: On the way')}<ArrowRight size={20} aria-hidden="true" /></button>
  {:else if primary === 'go'}<button class="btn hi go" onclick={actions.packAndGo}>{t("All packed, let's go")}<ArrowRight size={20} aria-hidden="true" /></button>
  {:else}<button class="btn hi go" onclick={actions.pack}>{t('Next: Pack')}<ArrowRight size={20} aria-hidden="true" /></button>{/if}
{/snippet}
{#snippet plus()}<button type="button" class="tp-icon-btn" aria-label={t('Add material')} onclick={() => show('add')}><Plus size={22} aria-hidden="true" /></button>{/snippet}

<div class="calm-pack trip-page" class:review-mode={review}>
  {#if review}
    <TripBand {trip} tab="plan" {kicker} action={null} />
    {#key trip.id}<DecisionReview {trip} {items} onapply={apply} oncancel={() => review = false} onconditions={() => show('conditions')} />{/key}
  {:else}
    <TripBand {trip} tab="plan" {kicker} action={go} aside={plus} weighHint={!made} hint={primary === 'go' ? t('A day ride: everything packed in one tap. Or pack bag by bag under Pack.') : primary === 'pack' ? t('List ready? Then pack bag by bag.') : primary === 'ride' ? t('Everything is packed.') : ''} />
    {@render notice?.()}
    {#if trip.skipped}<p class="tp-status">{bikeTrip ? t('Not riding') : t('Not going')}</p>{/if}
    <div class="tp-grid2">
      <div class="left">
        <!-- Noah: the conditions as four fields; a tap changes them. A template is one way to start, not a must. -->
        <section class="tp-card cond" aria-label={t('Trip conditions')}>
          <div class="cgrid">
            <button type="button" class="cell" onclick={actions.edit}><Clock3 size={18} aria-hidden="true" /><span><small>{t('Duration')}</small>{durationText}</span></button>
            <button type="button" class="cell" onclick={() => show('conditions')}><Mountain size={18} aria-hidden="true" /><span><small>{t('Per day')}</small>{perDay}</span></button>
            <button type="button" class="cell" onclick={() => show('conditions')}><CloudSun size={18} aria-hidden="true" /><span><small>{t('Weather')}</small>{wxText}</span></button>
            <a class="cell" href="#/pack/templates"><Layers size={18} aria-hidden="true" /><span><small>{t('Start with')}</small>{startText}</span><span class="sr"> · {t('Templates')}</span></a>
          </div>
          <p class="cfoot tp-muted tp-small">{t('Tap a field to change it.')}</p>
        </section>
        <!-- Noah 4b: the weather changes the list by itself; here is what it brought, each with its reason. -->
        {#if wxRows.length || changeNote || ctxChanged}
          <section class="tp-card wxcard" aria-labelledby="wx-h">
            <h2 id="wx-h"><CloudSun size={18} aria-hidden="true" />{t('Fitted to the weather')}<span class="r">{wxText}</span></h2>
            {#if wxRows.length}
              <ul class="wxrows">
                {#each wxRows as e (e.itemId)}
                  <li><span class="nm"><b>{nameOf(itemsById[e.itemId])}{(e.qty || 1) > 1 ? ` × ${e.qty}` : ''}</b><small>{reasons[e.itemId].line}</small></span>{#if ctxRows[e.itemId]}<button type="button" class="tp-link" aria-label={t('Undo for {name}', { name: nameOf(itemsById[e.itemId]) })} onclick={() => actions.undoRow(e.itemId)}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>{/if}</li>
                {/each}
              </ul>
            {/if}
            {#if changeNote}
              <!-- v0.27.0 (PF03): what the last change of the trip did to the list, one Undo for all of it. -->
              <div class="wxfoot"><p class="change-note tp-small" role="status">{t('Changed: {list}', { list: changeNote })}</p><button type="button" class="btn sm" onclick={actions.undoWx}><Undo2 size={16} aria-hidden="true" />{t('Undo the whole change')}</button></div>
            {:else if ctxChanged}
              <!-- v0.30.1 (Noah A2): a change that brings nothing says so (it used to look like a dead button). -->
              <p class="tp-muted tp-small wxnote" role="status">{trip.wx?.rain === 'rain' || trip.wx?.rain === 'showers' ? t('Nothing on the list changes. Rain gear comes along by itself when it is set to "When it rains" in Gear, or is in a building block named Rain.') : t('Nothing on the list changes with this.')}</p>
            {:else}<p class="tp-muted tp-small wxnote">{t('Applied by itself. Undo is in the row after a change.')}</p>{/if}
          </section>
        {/if}
        {@render suggest?.()}
      </div>
      <div class="right">
        <section class="tp-sec list-head">
          <h2>{t('Packing list')}</h2>
          <div class="list-toolbar">
            <label class="group-control"><select aria-label={t('Group packing list')} bind:value={grouping}><option value="bags">{t('By bags')}</option><option value="category">{t('By category')}</option></select><ChevronDown size={16} aria-hidden="true" /></label>
            <button class="tp-link add-mat" onclick={() => show('add')}><Plus size={18} aria-hidden="true" />{t('Add material')}</button>
            <!-- v0.27.0 (Noah 1a): Undo is announced when it appears (a live region). -->
            <span class="undo-live" role="status" aria-live="polite">{#if canUndo}<button class="tp-link undo" onclick={actions.undo}><Undo2 size={18} aria-hidden="true" />{t('Undo')}</button>{/if}</span>
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <details class="list-menu" bind:this={menuEl} onkeydown={(e) => e.key === 'Escape' && closeMenu(e)}><summary aria-label={t('More: other trip, edit trip, templates, print')}><MoreHorizontal size={24} aria-hidden="true" /></summary>
              <div class="list-menu-content">
                <label>{t('Open another trip')}<select class="sel" value={trip.id} onchange={(e) => { changeTrip(e.currentTarget.value); menuEl.open = false; }}>{#each trips as tr}<option value={tr.id}>{tr.title}</option>{/each}</select></label>
                <!-- v0.30.1 (Noah N9): the past trips, easy to find next to the trip chooser. -->
                {#if pastN}<a href="#/pack/past">{t('Past trips ({n})', { n: pastN })}</a>{/if}
                <button onclick={menu(actions.newTrip)}>{t('New trip')}</button>
                <button onclick={menu(actions.edit)}>{t('Edit trip')}</button>
                <button onclick={menu(() => show('conditions'))}>{t('Edit trip conditions')}</button>
                {#if bikeTrip}<button onclick={menu(() => show('bags'))}>{t('Bags for this trip')}</button><button onclick={menu(actions.compare)}>{t('Compare bikes')}</button><button onclick={menu(actions.template)}>{t('Save as template')}</button>{/if}
                <button onclick={menu(() => show('purposes'))}>{t('Name your bags')}</button>
                {#if hasPhoto}<button onclick={menu(actions.photo)}>{t('Setup photo')}</button>{/if}
                <a href="#/pack/templates">{t('Templates')}</a>
                <button onclick={() => window.print()}>{t('Print / PDF')}</button><button onclick={actions.share}>{t('Share link')}</button>
                <button onclick={menu(() => show('ready'))}>{t('Ready check')} {readyCount}/{readyTotal}</button>
                {#if stats.packed}<button onclick={actions.resetPacked}>{t('Untick packed items')}</button>{/if}
                <button onclick={actions.skip}>{bikeTrip ? trip.skipped ? t('Riding it after all') : t('Not riding') : trip.skipped ? t('Going after all') : t('Not going')}</button>
              </div>
            </details>
          </div>
        </section>
        <div class="bag-groups blist" class:cols={!phone.matches}>
          {#each groups as group (group.key)}
            {@const Icon = icon(group.key)}
            {@const isOpen = !!opened[group.key]}
            {@const g = groupG(group)}
            {@const miss = groupMissing(group)}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <section class="bag-group" class:open={isOpen} aria-label={zoneTitle(group)} ondragover={(e) => { if (grouping === 'bags') e.preventDefault(); }} ondrop={(e) => { if (grouping !== 'bags') return; e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) actions.addTo(group.key, id); }}>
              <button class="bag-heading" aria-expanded={isOpen} aria-controls={`calm-bag-${group.key}`} onclick={() => flip(group.key)}>
                <Icon size={20} strokeWidth={1.8} aria-hidden="true" /><strong>{zoneTitle(group)}</strong>
                <small class="num">{tn(group.entries.length, '{n} item', '{n} items')}{group.entries.length ? ` · ${miss === group.entries.length ? t('not weighed') : (miss ? '~' : '') + formatWeight(g)}` : ''}</small>
                {#if isOpen}<ChevronDown size={18} aria-hidden="true" />{:else}<ChevronRight size={18} aria-hidden="true" />{/if}
              </button>
              {#if !isOpen && group.entries.length}<p class="preview">{preview(group)}</p>{/if}
              {#if isOpen}
                <div id={`calm-bag-${group.key}`}>
                  {#if grouping === 'bags' && group.noBag}<p class="calm-error">{t('This trip has no bag here. Move these items or choose a bag in "Bags for this trip".')}</p>{/if}
                  {#if grouping === 'bags' && volumes?.[group.key]}<p class="calm-muted">{t('{used} of {cap} L', { used: num(volumes[group.key].used), cap: num(volumes[group.key].cap) })}</p>{/if}
                  {#if grouping === 'bags' && heavyHigh(group, itemsById).length}<p class="calm-muted">{t('Heavy item high or far back: move to the frame bag?')}</p>{/if}
                  <ul class="planning-rows">
                    {#each group.entries as entry (entry.itemId)}
                      {@const item = itemsById[entry.itemId]}
                      {@const name = item ? nameOf(item) : entry.itemId}
                      {@const qty = entry.qty || 1}
                      {@const open = itemMenu === entry.itemId}
                      {@const why = reasons[entry.itemId]}
                      {@const ctx = ctxRows[entry.itemId]}
                      <!-- v0.24.1 (Noah 1a): a calm row, name (× n above 1) and weight; a tap opens amount, move and take out. -->
                      <li class="planning-row" class:open class:changed={!!ctx} draggable={grouping === 'bags' && !phone.matches} ondragstart={(e) => { e.dataTransfer.setData('text/plain', entry.itemId); e.dataTransfer.effectAllowed = 'copyMove'; }}>
                        <GripVertical class="drag-handle" size={18} aria-hidden="true" />
                        <button class="row-main" aria-label={t('Amount, move or take out: {name}', { name })} aria-describedby={why?.line || why?.note ? `calm-r-${entry.itemId} calm-w-${entry.itemId}` : `calm-w-${entry.itemId}`} aria-expanded={open} aria-controls={`calm-act-${entry.itemId}`} onclick={() => itemMenu = open ? null : entry.itemId}>
                          <span class="item-name"><span>{name}</span>{#if qty > 1}{' '}<span class="item-qty">× {qty}</span>{/if}{#if why?.line || why?.note}<small class="carry-hint row-reason" id={`calm-r-${entry.itemId}`}>{why.line}{#if why.note}{#if why.line}<br />{/if}{t('Note: {text}', { text: why.note })}{/if}</small>{/if}{#if carry.has(entry.itemId)}<small class="carry-hint">{t('Buy {name} on the way?', { name })}</small>{/if}</span>
                          <span class="item-weight" id={`calm-w-${entry.itemId}`}>{#if item?.weightG == null}<i class="tp-badge">{t('not weighed')}</i>{:else}{formatWeight(item.weightG * qty)}{/if}</span>
                          <ChevronDown class="row-chevron" size={18} aria-hidden="true" />
                        </button>
                        {#if ctx}<p class="row-ctx"><i class="tp-badge hi">{changedText(entry.itemId)}</i><button type="button" class="tp-link" aria-label={t('Undo for {name}', { name })} onclick={() => actions.undoRow(entry.itemId)}><Undo2 size={15} aria-hidden="true" />{t('Undo')}</button></p>{/if}
                        {#if open}<div class="item-actions" id={`calm-act-${entry.itemId}`}>
                          <div class="amount" role="group" aria-label={t('Amount for {name}', { name })}><button aria-label={t('One less {name}', { name })} disabled={qty <= 1} onclick={() => actions.qty(entry.itemId, qty - 1)}><Minus size={16} /></button><span>{qty}</span><button aria-label={t('One more {name}', { name })} disabled={qty >= 20} onclick={() => actions.qty(entry.itemId, qty + 1)}><Plus size={16} /></button></div>
                          <label>{t('Move to')}<select class="sel" aria-label={t('Move {name} to', { name })} value={entry.slot} onchange={(e) => actions.move(entry.itemId, e.currentTarget.value)}>{#each targets as tg}<option value={tg.key}>{trip.purpose?.[tg.key] || t(tg.zone.name)}</option>{/each}{#if !targets.some(t => t.key === entry.slot)}<option value={entry.slot}>{entry.slot}</option>{/if}</select></label>
                          <button class="text-button" onclick={() => { actions.remove(entry.itemId); itemMenu = null; }}>{t('Take out')}</button>
                          <!-- v0.27.0 (Noah 1a, PF02): the alternative stays reachable after the automatic apply. -->
                          {#each why?.alts ?? [] as alt (alt)}<button class="text-button" onclick={() => { actions.swap(why.slot, entry.itemId, alt); itemMenu = null; note = t('{old} swapped for {new}. Undo is at the top of the list.', { old: name, new: nameOf(itemsById[alt]) }); }}>{t('Swap for {name}', { name: nameOf(itemsById[alt]) })}</button>{/each}
                          {#if item?.note && !why?.note}<p>{item.note}</p>{/if}
                        </div>{/if}
                      </li>
                    {:else}<li class="empty-bag"><p>{t('This bag is still empty.')}</p></li>{/each}
                  </ul>
                  <p class="addrow"><button class="tp-link" onclick={() => { zoneKey = grouping === 'bags' && targets.some((x) => x.key === group.key) ? group.key : targets[0]?.key; show('add'); }}><Plus size={16} aria-hidden="true" />{t('Add an item')}</button></p>
                </div>
              {/if}
            </section>
          {/each}
        </div>
        <div class="folds">
          {#if bikeTrip}<button type="button" class="tp-fold fold-btn detail-link" onclick={() => { review = true; window.scrollTo({ top: 0 }); }}><CloudSun size={20} aria-hidden="true" /><span>{t('Review weather suggestions')}</span><span class="r">{#if openLayers.length}<i class="tp-badge hi">{tn(openLayers.length, '{n} open', '{n} open')}</i>{/if}<ChevronRight class="chev" size={18} aria-hidden="true" /></span></button>{/if}
          <details class="tp-fold weight-details"><summary><Weight size={20} aria-hidden="true" /><span>{t('Weight')}</span><span class="r num">{t('Base')} {stats.baseMissing ? '~' : ''}{kg(stats.baseG)}{#if stats.unweighed}<i class="tp-badge">{t('{n} not weighed', { n: stats.unweighed })}</i>{/if}<ChevronRight class="chev" size={18} aria-hidden="true" /></span></summary>
            <div class="in"><div class="weight-grid"><div><span>{t('Base')}</span><Sum g={stats.baseG} missing={stats.baseMissing} /></div><div><span>{t('On you')}</span><Sum g={stats.wornG} missing={stats.wornMissing} /></div><div><span>{t('Food and water')}</span><Sum g={stats.consumablesG} missing={stats.consumablesMissing} /></div><div><span>{t('Items')}</span><b>{stats.count}</b></div></div>{@render moreWeights?.()}<p class="tp-muted tp-small">{stats.unweighed ? t('{n} weights missing · displayed weights are known values.', { n: stats.unweighed }) : t('All material weights are recorded.')}</p></div>
          </details>
          {@render preparation?.()}{@render ballastContent?.()}
        </div>
      </div>
    </div>
  {/if}
  {#if note && sheet !== 'add'}<p class="calm-status" role="status">{note}</p>{/if}
</div>

{#if sheet}
  <dialog class="calm-sheet" bind:this={sheetEl} onclose={() => { sheet = null; note = ''; }} aria-labelledby="calm-sheet-h">
    <header><h2 id="calm-sheet-h">{sheet === 'add' ? t('Add material') : sheet === 'conditions' ? t('Edit trip conditions') : sheet === 'bags' ? t('Bags for this trip') : sheet === 'purposes' ? t('Name your bags') : t('Ready check')}</h2><button class="text-button" onclick={() => sheetEl.close()}>{t('Close')}</button></header>
    {#if sheet === 'add'}
      <label class="add-target">{t('Adding to')}<select class="sel" aria-label={t('Adding to')} bind:value={zoneKey}>{#each targets as tg}<option value={tg.key}>{trip.purpose?.[tg.key] || (tg.bag ? tg.bag.name : t(tg.zone.name))}</option>{/each}</select></label>
      {@render picker(add, addMany)}
      <!-- v0.24.1 (Noah 6a): what was added is said inside the sheet (the page behind it is inert). -->
      {#if note}<p class="calm-status" role="status">{note}</p>{/if}
    {:else}{@render settings(sheet)}{/if}
    <footer><button class="primary" onclick={() => sheetEl.close()}>{t('Done')}</button>{#if sheet === 'conditions' && bikeTrip}<button class="text-button" onclick={() => { sheetEl.close(); review = true; }}>{t('Review weather suggestions')}</button>{/if}</footer>
  </dialog>
{/if}

<style>
  .left, .right { min-width: 0; }
  .cond { padding: 6px; }
  .cgrid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 4px; }
  .cell { display: flex; gap: 10px; align-items: center; min-height: 56px; padding: 8px 10px; border: 0; border-radius: 8px; background: none; color: var(--ink); font: 500 15px/1.25 var(--font-body); text-align: left; text-decoration: none; cursor: pointer; min-width: 0; overflow-wrap: anywhere; }
  .cell:nth-child(-n + 2) { border-bottom: 1px solid var(--line); border-radius: 8px 8px 0 0; }
  .cell :global(svg) { color: var(--ink-3); flex: none; }
  .cell small { display: block; font-size: 12px; font-weight: 400; color: var(--ink-3); }
  @media (hover: hover) { .cell:hover { background: var(--paper-2); } }
  .cfoot { margin: 4px 10px 6px; }
  .wxrows { list-style: none; margin: 8px 0 0; padding: 0; }
  .wxrows li { display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 6px 0; border-top: 1px solid var(--paper-2); }
  .wxrows li:first-child { border-top: 0; }
  .wxrows .nm { flex: 1; min-width: 0; overflow-wrap: anywhere; }
  .wxrows b { font-weight: 600; }
  .wxrows small { display: block; color: var(--ink-3); font-size: 14px; }
  .wxfoot { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; margin-top: 8px; padding-top: 10px; border-top: 1px solid var(--paper-2); }
  .wxfoot p { margin: 0; flex: 1 1 200px; overflow-wrap: anywhere; }
  .wxnote { margin: 8px 0 0; }
  .list-head { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 16px; }
  .list-head h2 { flex: 1 1 auto; }
  .list-toolbar { display: flex; align-items: center; gap: 4px 16px; flex-wrap: wrap; }
  .group-control { position: relative; display: inline-flex; align-items: center; }
  .group-control select { appearance: none; background: none; border: 0; font: 400 14px var(--font-body); color: var(--ink-3); min-height: 44px; padding: 10px 22px 10px 0; cursor: pointer; }
  .group-control :global(svg) { position: absolute; right: 0; pointer-events: none; color: var(--ink-3); }
  .undo-live { display: contents; }
  .blist { display: grid; gap: 10px; }
  .blist.cols { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .bag-group { background: var(--paper); border: 1px solid var(--line); border-radius: 12px; padding: 4px 14px 8px; min-width: 0; }
  .blist.cols .bag-group.open { grid-column: 1 / -1; }
  .bag-heading { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 48px; padding: 4px 0; border: 0; background: none; color: var(--ink); text-align: left; font: 600 16px var(--font-body); cursor: pointer; }
  .bag-heading :global(svg) { color: var(--ink-3); flex: none; }
  .bag-heading strong { font-weight: 600; min-width: 0; overflow-wrap: anywhere; }
  .bag-heading small { margin-left: auto; font-size: 14px; font-weight: 400; color: var(--ink-3); white-space: nowrap; }
  .preview { margin: 0 0 4px 32px; font-size: 14px; line-height: 1.5; color: var(--ink-2); display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
  .addrow { margin: 4px 0 0 32px; }
  .row-ctx { display: flex; align-items: center; gap: 10px; margin: -6px 0 6px 8px; }
  .folds { margin-top: 10px; }
  .fold-btn { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 56px; padding: 6px 16px; color: var(--ink); font: 500 16px var(--font-body); text-align: left; cursor: pointer; }
  .fold-btn :global(svg:first-child) { color: var(--ink-3); flex: none; }
  .fold-btn .r { margin-left: auto; display: flex; align-items: center; gap: 8px; color: var(--ink-3); }
  @media (max-width: 719px) {
    .cell { font-size: 14px; padding: 8px 6px; gap: 8px; }
    .list-toolbar .add-mat { display: none; }
  }
</style>
