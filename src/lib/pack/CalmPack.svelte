<script>
  import { CalendarDays, Bike, Clock3, CloudRain, CloudSun, UserRound, Backpack, Briefcase, ChevronRight, ChevronDown, PlusCircle, MoreHorizontal, Minus, Plus, Info, Weight, Pencil, ArrowRight, Undo2, GripVertical } from '@lucide/svelte';
  import DecisionReview from './DecisionReview.svelte';
  import Sum from '../ui/Sum.svelte';
  import { planningGroups } from '../preparation.js';
  import { t, tn, nameOf, locale } from '../i18n.svelte.js';
  import { formatWeight } from '../gear.js';
  import { RAIN, tooFull, heavyHigh } from '../trips.js';
  import { phone } from '../media.svelte.js';
  let { trip, stats, bike, bikeTrip, domainLabel, items, itemsById, trips, candidates, targets, templates, hasPhoto = false, openLayers, canUndo, readyCount, readyTotal, over, step, debriefStep, q = $bindable(''), zoneKey = $bindable('seat'), review = $bindable(false), actions, settings, picker, moreWeights, preparation, ballastContent } = $props();
  let grouping = $state('bags');
  let opened = $state({ frame: true });
  let itemMenu = $state(null);
  let sheet = $state(null);
  let sheetEl = $state();
  let menuEl = $state();
  let note = $state('');
  const groups = $derived(planningGroups(stats, items, grouping));
  const date = $derived(trip.startDate ? new Date(`${trip.startDate}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : t('No date set'));
  const wxText = $derived(trip.wx?.min != null && trip.wx?.max != null ? `${trip.wx.min}–${trip.wx.max} °C · ${t(RAIN[trip.wx.rain ?? 'none'])}` : t('No weather set'));
  const phases = $derived(bikeTrip ? ['Plan|stage', 'Pack|stage', 'On the road', 'Debrief'] : ['Plan|stage', 'Pack|stage', 'Debrief']);
  const zoneTitle = (g) => grouping === 'category' ? t(g.zone.name) : (trip.purpose?.[g.key] || t(g.key === 'mounted' ? 'On the bike|zone' : g.zone.name));
  const icon = (key) => key === 'body' ? UserRound : key === 'mounted' ? Bike : Briefcase;
  const flip = (key) => opened = { ...opened, [key]: !opened[key] };
  function show(mode) { sheet = mode; itemMenu = null; }
  $effect(() => { if (sheet && sheetEl && !sheetEl.open) sheetEl.showModal(); });
  async function add(id) { try { await actions.addTo(zoneKey, id); note = t('Added to this trip.'); } catch { note = t('Could not save. Please try again.'); } }
  async function apply(choices) { await actions.apply(choices); review = false; note = t('Selection saved. Your packing list is up to date.'); window.scrollTo({ top: 0 }); }
  function changeTrip(id) { review = false; opened = { frame: true }; actions.choose(id); }
  function closeMenu(event) { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus(); }
  function stage(i) { if (i === 0) review = false; else if (i === 1) actions.pack(); else if (bikeTrip && i === 2) actions.ride(); else location.hash = `#/debrief/${encodeURIComponent(trip.id)}`; }
</script>

<div class="calm-pack" class:review-mode={review}>
  <nav class="phase-nav next" aria-label={t('Steps of this trip')}>
    <ol class="steps">{#each phases as phase, i}<li><button class:active={!over && i === 0 || over && i === phases.length - 1} aria-current={!over && i === 0 || over && i === phases.length - 1 ? 'step' : undefined} onclick={() => stage(i)}>{t(phase)}</button></li>{/each}</ol>
  </nav>
  <header class="tour-context head">
    {#if review}<h1>{trip.title}</h1>{:else}<h1>{t('Your packing list')}</h1><h2>{trip.title}</h2>{/if}
    <div class="context-line tags">
      <span><CalendarDays size={22} />{date}</span><span>{#if bikeTrip}<Bike size={24} />{bike?.name ?? t('No bike')}{:else}<Backpack size={22} />{domainLabel}{/if}</span>
      <span><Clock3 size={22} />{trip.hours ? t('{n} hours', { n: trip.hours }) : t('Duration not set')}{trip.days > 1 ? ` · ${tn(trip.days, '{n} day', '{n} days')}` : review ? ` · ${t('no overnight stay')}` : ''}</span>
      <button class="text-button edit-trip" onclick={actions.edit}><Pencil size={18} />{t('Edit trip')}</button>
      {#if !review}<span class="weather"><CloudRain size={24} />{wxText}</span>{/if}
    </div>
    {#if review}<button class="context-weather" onclick={() => show('conditions')}><CloudRain size={38} strokeWidth={1.7} />{wxText}</button>{/if}
    {#if trip.skipped}<p class="calm-muted">{bikeTrip ? t('Not riding') : t('Not going')}</p>{/if}
  </header>
  {#if review}
    {#key trip.id}<DecisionReview {trip} {items} onapply={apply} oncancel={() => review = false} onconditions={() => show('conditions')} />{/key}
  {:else}
    <div class="list-toolbar">
      <label class="group-control"><select aria-label={t('Group packing list')} bind:value={grouping}><option value="bags">{t('By bags')}</option><option value="category">{t('By category')}</option></select><ChevronDown size={18} /></label>
      <button class="text-button" onclick={() => show('add')}><PlusCircle size={22} />{t('Add material')}</button>
      {#if canUndo}<button class="text-button undo" onclick={actions.undo}><Undo2 size={18} />{t('Undo')}</button>{/if}
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <details class="list-menu" bind:this={menuEl} onkeydown={(e) => e.key === 'Escape' && closeMenu(e)}><summary aria-label={t('More: other trip, packing day, templates, print')}><MoreHorizontal size={24} /></summary>
        <div class="list-menu-content">
          <label>{t('Open another trip')}<select class="sel" value={trip.id} onchange={(e) => { changeTrip(e.currentTarget.value); menuEl.open = false; }}>{#each trips as tr}<option value={tr.id}>{tr.title}</option>{/each}</select></label>
          <button onclick={() => { menuEl.open = false; actions.newTrip(); }}>{t('New trip')}</button>
          <button onclick={() => { menuEl.open = false; show('conditions'); }}>{t('Edit trip conditions')}</button>
          {#if bikeTrip}<button onclick={() => { menuEl.open = false; show('bags'); }}>{t('Bags for this trip')}</button><button onclick={actions.compare}>{t('Compare bikes')}</button><button onclick={actions.template}>{t('Save as template')}</button>{/if}
          <button onclick={() => { menuEl.open = false; show('purposes'); }}>{t('Name your bags')}</button>
          {#if hasPhoto}<button onclick={() => { menuEl.open = false; actions.photo(); }}>{t('Setup photo')}</button>{/if}
          <a href="#/pack/templates">{t('Templates')}</a>
          <button onclick={() => window.print()}>{t('Print / PDF')}</button><button onclick={actions.share}>{t('Share link')}</button>
          <button onclick={() => show('ready')}>{t('Ready check')} {readyCount}/{readyTotal}</button>
          {#if stats.packed}<button onclick={actions.resetPacked}>{t('Untick packed items')}</button>{/if}
          <button onclick={actions.skip}>{bikeTrip ? trip.skipped ? t('Riding it after all') : t('Not riding') : trip.skipped ? t('Going after all') : t('Not going')}</button>
        </div>
      </details>
    </div>
    <div class="bag-groups blist">
      {#each groups as group (group.key)}
        {@const Icon = icon(group.key)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <section class="bag-group" aria-label={zoneTitle(group)} ondragover={(e) => { if (grouping === 'bags') e.preventDefault(); }} ondrop={(e) => { if (grouping !== 'bags') return; e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) actions.addTo(group.key, id); }}>
          <button class="bag-heading" aria-expanded={!!opened[group.key]} aria-controls={`calm-bag-${group.key}`} onclick={() => flip(group.key)}>{#if opened[group.key]}<ChevronDown size={22} />{:else}<ChevronRight size={22} />{/if}<Icon size={28} strokeWidth={1.7} /><strong>{zoneTitle(group)}</strong><small>{tn(group.entries.length, '{n} item', '{n} items')}</small></button>
          {#if opened[group.key]}
            <div id={`calm-bag-${group.key}`}>
              {#if grouping === 'bags' && group.noBag}<p class="calm-error">{t('This trip has no bag here. Move these items or choose a bag in "Bags for this trip".')}</p>{/if}
              {#if grouping === 'bags' && tooFull(group)}<p class="calm-error">{t('Probably too full: about {vol} for {cap}.', { vol: `${group.vol} L`, cap: `${group.bag.volumeL} L` })}</p>{/if}
              {#if grouping === 'bags' && heavyHigh(group, itemsById).length}<p class="calm-muted">{t('Heavy item high or far back: move to the frame bag?')}</p>{/if}
              <ul class="planning-rows">
                {#each group.entries as entry (entry.itemId)}
                  {@const item = itemsById[entry.itemId]}
                  {@const name = item ? nameOf(item) : entry.itemId}
                  <li class="planning-row" draggable={grouping === 'bags' && !phone.matches} ondragstart={(e) => { e.dataTransfer.setData('text/plain', entry.itemId); e.dataTransfer.effectAllowed = 'copyMove'; }}>
                    <GripVertical class="drag-handle" size={20} />
                    <span class="item-name">{name}</span>
                    <div class="amount" role="group" aria-label={t('Amount for {name}', { name })}><button aria-label={t('One less {name}', { name })} disabled={(entry.qty || 1) <= 1} onclick={() => actions.qty(entry.itemId, (entry.qty || 1) - 1)}><Minus size={16} /></button><span>{entry.qty || 1}</span><button aria-label={t('One more {name}', { name })} disabled={(entry.qty || 1) >= 20} onclick={() => actions.qty(entry.itemId, (entry.qty || 1) + 1)}><Plus size={16} /></button></div>
                    <span class="item-weight">{item?.weightG == null ? t('not weighed') : formatWeight(item.weightG * (entry.qty || 1))}</span>
                    <button class="item-more" aria-label={t('Actions for {name}', { name })} aria-expanded={itemMenu === entry.itemId} onclick={() => itemMenu = itemMenu === entry.itemId ? null : entry.itemId}><MoreHorizontal size={22} /></button>
                    {#if itemMenu === entry.itemId}<div class="item-actions"><label>{t('Move')}<select class="sel" aria-label={t('Move {name} to', { name })} value={entry.slot} onchange={(e) => actions.move(entry.itemId, e.currentTarget.value)}>{#each targets as tg}<option value={tg.key}>{trip.purpose?.[tg.key] || t(tg.zone.name)}</option>{/each}{#if !targets.some(t => t.key === entry.slot)}<option value={entry.slot}>{entry.slot}</option>{/if}</select></label><button class="text-button" onclick={() => { actions.remove(entry.itemId); itemMenu = null; }}>{t('Take out')}</button>{#if item?.note}<p>{item.note}</p>{/if}</div>{/if}
                  </li>
                {:else}<li class="empty-bag"><p>{t('This bag is still empty.')}</p><button class="text-button" onclick={() => { zoneKey = grouping === 'bags' ? group.key : targets[0]?.key; show('add'); }}>{t('Add material')}</button></li>{/each}
              </ul>
            </div>
          {/if}
        </section>
      {/each}
    </div>
    {#if bikeTrip}<button class="detail-link" onclick={() => { review = true; window.scrollTo({ top: 0 }); }}><ChevronRight size={22} /><CloudSun size={28} /><strong>{t('Review weather suggestions')}</strong>{#if openLayers.length}<small>{tn(openLayers.length, '{n} open', '{n} open')}</small>{/if}<ChevronRight size={20} /></button>{/if}
    <details class="weight-details"><summary><ChevronRight size={22} /><Weight size={28} /><strong>{t('View weight details')}</strong></summary><div class="weight-grid"><div><span>{t('Base')}</span><Sum g={stats.baseG} missing={stats.baseMissing} /></div><div><span>{t('On you')}</span><Sum g={stats.wornG} missing={stats.wornMissing} /></div><div><span>{t('Food and water')}</span><Sum g={stats.consumablesG} missing={stats.consumablesMissing} /></div><div><span>{t('Items')}</span><b>{stats.count}</b></div></div>{@render moreWeights?.()}</details>
    {@render preparation?.()}{@render ballastContent?.()}
    <footer class="list-footer next"><p class="weight-note"><Info size={22} />{stats.unweighed ? t('{n} weights missing · displayed weights are known values.', { n: stats.unweighed }) : t('All material weights are recorded.')}</p><div class="footer-actions"><a href="#/" class="text-button">{t('Back to trip overview')}</a>{#if step === debriefStep}<button class="primary go" onclick={over ? () => location.hash = `#/debrief/${encodeURIComponent(trip.id)}` : actions.end}>{t('Next: debrief')}<ArrowRight size={20} /></button>{:else if step === 2}<button class="primary go" onclick={actions.ride}>{t('Next: ride day')}<ArrowRight size={20} /></button>{:else}<button class="primary go" onclick={actions.pack}>{t('Start packing check')}<ArrowRight size={20} /></button>{/if}</div></footer>
  {/if}
  {#if note}<p class="calm-status" role="status">{note}</p>{/if}
</div>

{#if sheet}
  <dialog class="calm-sheet" bind:this={sheetEl} onclose={() => { sheet = null; note = ''; }} aria-labelledby="calm-sheet-h">
    <header><h2 id="calm-sheet-h">{sheet === 'add' ? t('Add material') : sheet === 'conditions' ? t('Edit trip conditions') : sheet === 'bags' ? t('Bags for this trip') : sheet === 'purposes' ? t('Name your bags') : t('Ready check')}</h2><button class="text-button" onclick={() => sheetEl.close()}>{t('Close')}</button></header>
    {#if sheet === 'add'}
      <label class="add-target">{t('Adding to')}<select class="sel" aria-label={t('Adding to')} bind:value={zoneKey}>{#each targets as tg}<option value={tg.key}>{trip.purpose?.[tg.key] || (tg.bag ? tg.bag.name : t(tg.zone.name))}</option>{/each}</select></label>
      {@render picker(add)}
    {:else}{@render settings(sheet)}{/if}
    <footer><button class="primary" onclick={() => sheetEl.close()}>{t('Done')}</button>{#if sheet === 'conditions' && bikeTrip}<button class="text-button" onclick={() => { sheetEl.close(); review = true; }}>{t('Review weather suggestions')}</button>{/if}</footer>
  </dialog>
{/if}
