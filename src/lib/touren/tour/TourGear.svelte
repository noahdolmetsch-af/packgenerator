<script>
  /**
   * Tour-Seite › Gepäck (Noah 20.10.2026 «1a 2b und a möglich 3a und b optional 5a»).
   *   - A ride (or a joined tour) without a packing list: «Gepäck eintragen» chooses the things and makes the
   *     ride a trip of the Packmodus (tourgear.js packTour), so the app remembers it when you pack next time.
   *   - A trip: every thing with its mark (used, not used, broken) and an optional note, «What was missing?»;
   *     food and drink on their own with their own «What was missing?». «Change» chooses again.
   * d: the tour (tourdata.js loadTour); name: its name; wx: the weather in a few numbers (tourwx.js wxSummary).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../../db.js';
  import { t, tn, num, nameOf } from '../../i18n.svelte.js';
  import { loadTemplates } from '../../templates.js';
  import { gearGroups, sourcesOf, packTour, setTripGear, restoreGear, setMark, setItemText, addMissing, dropMissing, putMissingBack, newMaterialItem, MARKS, MARK_NAMES, FOOD } from '../tourgear.js';
  import { tourHref } from '../tour.js';
  import { gearWeight, tripBefore } from '../tourextra.js';
  import { openNew, openTrip } from '../../nav.js';
  import { tabHref } from '../../tabs.js';
  import { offerDone } from '../../ui/rename.svelte.js';
  import GearPickSheet from './GearPickSheet.svelte';
  import { Backpack, Plus, Pencil, X, ChevronRight, Utensils, Check, Ban, TriangleAlert } from '@lucide/svelte';

  let { d, name, wxLine = '' } = $props();

  const trip = $derived(d.kind === 't' ? d.trip : null);
  const groups = $derived(gearGroups(trip?.entries ?? [], d.debrief, d.items ?? [], nameOf));
  const flat = (side) => [...side.used, ...side.unused, ...side.broken, ...side.open].sort((a, b) => a.name.localeCompare(b.name));
  const gearList = $derived(flat(groups.gear));
  const foodList = $derived(flat(groups.food));
  const missing = $derived((d.debrief?.missing ?? []).filter((m) => !m.food));
  const missingFood = $derived((d.debrief?.missing ?? []).filter((m) => m.food));
  // 0.174 (UI-Ziele #8): a long list nobody looked at yet waits behind one line «76 Teile warten auf dein Urteil · Durchgehen»
  // tour critique 4b (Noah 21.10.2026): after the tour only the exceptions stand here (not used, broken, what was
  // missing); the whole list opens with «Show all» or lives in the Packen tab
  let going = $state(false);
  const folded = $derived(!going && gearList.length > 0);
  const exceptions = $derived(gearList.filter((it) => it.mark === 'unused' || it.mark === 'broken'));
  const waiting = $derived(!d.debrief ? groups.gear.open.length : 0);
  const counts = (side) => [...MARKS, 'open'].map((m) => [m, side[m].length]).filter(([, n]) => n);
  // UI-Test 26.10.2026 T1: before the ride (state «Geplant») nothing was used yet: no verdict, no marks
  const before = $derived(d.kind === 't' && d.state === 'plan');
  const partTrip = $derived(d.kind !== 't' && d.partOf?.href?.includes('t%3A') ? d.partOf : null);

  /* ---- 4a: the weight of the gear, against the trip before ---- */
  const kg = (g) => (g < 950 ? `${num(Math.round(g / 10) * 10)} g` : `${num(Math.round(g / 100) / 10)} kg`);
  const weight = $derived.by(() => {
    if (!trip || !(trip.entries ?? []).length) return '';
    const w = gearWeight(trip.entries, d.items ?? []);
    if (!w.g && !w.foodG) return w.missing ? tn(w.missing, '{n} thing has no weight yet.', '{n} things have no weight yet.') : '';
    const prev = tripBefore($tripsQ ?? [], trip);
    const pw = prev ? gearWeight(prev.entries, d.items ?? []) : null;
    const diff = pw && pw.g ? w.g - pw.g : null;
    return [
      t('{kg} gear', { kg: kg(w.g) }),
      w.foodG ? t('{kg} food and drink', { kg: kg(w.foodG) }) : '',
      diff != null && Math.abs(diff) >= 100 ? (diff < 0 ? t('{kg} lighter than «{name}»', { kg: kg(-diff), name: prev.title }) : t('{kg} heavier than «{name}»', { kg: kg(diff), name: prev.title })) : '',
      w.missing ? tn(w.missing, '{n} without weight', '{n} without weight') : '',
    ].filter(Boolean).join(' · ');
  });

  /* ---- choosing ---- */
  let picking = $state(false);
  const tripsQ = liveQuery(() => db.trips.toArray());
  let templates = $state([]);
  $effect(() => {
    if (picking) loadTemplates(db).then((x) => (templates = x));
  });
  const sources = $derived(sourcesOf({ templates, trips: $tripsQ ?? [], self: trip?.id ?? null }));
  async function addItem(text, category) {
    const items = await db.items.toArray();
    const rec = newMaterialItem(text, category, items);
    await db.items.put(rec);
    return rec.id;
  }
  async function save(ids) {
    if (trip) {
      const before = await setTripGear(db, trip.id, ids);
      offerDone(t('Gear saved.'), () => restoreGear(db, trip.id, before));
      return;
    }
    const bike = (d.bikes ?? []).find((b) => b.id === d.row?.bikeId) ?? null;
    const res = await packTour(db, d, ids, { name, bike, kind: d.row?.kind ?? 'bike', km: d.row?.km ?? null });
    location.hash = tourHref(`t:${res.tripId}`);
    offerDone(t('Gear saved. The ride is now a trip with a packing list.'), async () => {
      await res.undo();
      location.hash = tourHref(d.key);
    });
  }

  /* ---- marks and notes ---- */
  let editing = $state(null);
  const MARK_ICON = { used: Check, unused: Ban, broken: TriangleAlert };
  const mark = (it, m) => setMark(db, trip, it.id, m);
  const saveText = (it, v) => {
    editing = null;
    if (v.trim() !== (it.text ?? '')) setItemText(db, trip, it.id, v);
  };

  /* ---- what was missing ---- */
  let miss = $state('');
  let missF = $state('');
  async function addMiss(food) {
    const v = food ? missF : miss;
    if (!v.trim()) return;
    await addMissing(db, trip, v, { food });
    if (food) missF = '';
    else miss = '';
  }
  async function dropMiss(m) {
    const gone = await dropMissing(db, trip, m.id);
    offerDone(t('"{name}" removed.', { name: m.name }), () => putMissingBack(db, trip, gone));
  }
</script>

{#snippet thing(it)}
  <li class="gi" data-gear-row={it.id} data-mark={it.mark}>
    <div class="gl">
      <span class="gn">{it.name}{#if it.qty > 1}<span class="tp-muted num"> × {it.qty}</span>{/if}</span>
      <div class="marks" role="group" aria-label={t('How was «{name}»?', { name: it.name })}>
        {#each MARKS as m (m)}
          {@const Icon = MARK_ICON[m]}
          <button type="button" class="mk {m}" aria-pressed={it.mark === m} aria-label={t(MARK_NAMES[m])} title={t(MARK_NAMES[m])} onclick={() => mark(it, m)} data-set-mark={m}><Icon size={14} aria-hidden="true" />{#if it.mark === m}<span class="ml">{t(MARK_NAMES[m])}</span>{/if}</button>
        {/each}
        <button type="button" class="mk note" aria-pressed={editing === it.id} aria-label={t('Note on «{name}»', { name: it.name })} onclick={() => (editing = editing === it.id ? null : it.id)} data-note-open={it.id}><Pencil size={14} aria-hidden="true" /></button>
      </div>
    </div>
    {#if editing === it.id}
      <!-- svelte-ignore a11y_autofocus -->
      <input class="inp gnote" type="text" value={it.text} autofocus placeholder={t('e.g. too warm, would take it again, too heavy')} aria-label={t('Note on «{name}»', { name: it.name })} onchange={(e) => saveText(it, e.currentTarget.value)} onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()} data-note-input={it.id} />
    {:else if it.text}
      <p class="gt" data-note-text={it.id}>{it.text}</p>
    {/if}
  </li>
{/snippet}

{#snippet missingBox(list, food)}
  <div class="miss" data-missing={food ? 'food' : 'gear'}>
    <h4 class="h4">{t('What was missing?')}</h4>
    {#if list.length}
      <ul class="ml-list">{#each list as m (m.id)}<li><span>{m.name}</span><button type="button" class="px" aria-label={t('Remove «{name}»', { name: m.name })} onclick={() => dropMiss(m)}><X size={14} aria-hidden="true" /></button></li>{/each}</ul>
    {/if}
    <form class="madd" onsubmit={(e) => (e.preventDefault(), addMiss(food))}>
      {#if food}
        <input class="inp" type="text" bind:value={missF} placeholder={t('e.g. more water, a salty snack')} aria-label={t('Food or drink that was missing')} data-missing-input="food" />
      {:else}
        <input class="inp" type="text" bind:value={miss} placeholder={t('e.g. gloves, a second tube')} aria-label={t('What was missing?')} data-missing-input="gear" />
      {/if}
      <button type="submit" class="btn" data-missing-add={food ? 'food' : 'gear'}><Plus size={16} aria-hidden="true" />{t('Add')}</button>
    </form>
  </div>
{/snippet}

{#if trip}
  <div class="card pad gear" data-tour-gear>
    {#if wxLine}<p class="wxl tp-small" data-gear-weather>{wxLine}</p>{/if}
    <div class="gh">
      {#if weight}<p class="wt num" data-gear-weight>{weight}</p>{/if}
      <p class="sum tp-muted tp-small num" data-gear-sum>
        {#if gearList.length && before}{tn(gearList.length, '{n} thing on the list', '{n} things on the list')}{:else if gearList.length}{counts(groups.gear).map(([m, n]) => `${num(n)} ${t(MARK_NAMES[m])}`).join(' · ')}{:else}{t('No gear yet.')}{/if}
      </p>
      <button type="button" class="btn" onclick={() => (picking = true)} data-gear-change><Backpack size={16} aria-hidden="true" />{gearList.length || foodList.length ? t('Change gear') : t('Enter the gear')}</button>
    </div>
    {#if before}
      <div class="before" data-gear-before>
        <Check size={20} aria-hidden="true" />
        <div><p class="bt">{t('After the ride: tick off')}</p><p class="bs">{t('After the ride you can mark here what you used.')}</p></div>
      </div>
      <a class="btn btn-link packl" href={tabHref('pack', trip)} onclick={() => openTrip(trip.id)} data-gear-packtab>{t('The whole list is under Pack')}<ChevronRight size={16} aria-hidden="true" /></a>
    {:else if folded}
      {#if exceptions.length}<ul class="glist2" data-gear-ex>{#each exceptions as it (it.id)}{@render thing(it)}{/each}</ul>{/if}
      {#if waiting}
        <p class="wait" data-gear-wait><b class="num">{tn(waiting, '{n} thing waits for your verdict', '{n} things wait for your verdict')}</b><button type="button" class="btn" onclick={() => (going = true)} data-gear-go>{t('Go through')}<ChevronRight size={16} aria-hidden="true" /></button></p>
        <p class="tp-muted tp-small">{t('Mark only the exceptions: whatever you do not mark counts as used.')}</p>
      {:else}
        <p class="all" data-gear-all><span class="tp-muted tp-small">{exceptions.length ? t('Everything else was used.') : t('Everything was used.')}</span><button type="button" class="btn btn-link" onclick={() => (going = true)} data-gear-go>{tn(gearList.length, 'Show all {n} thing', 'Show all {n} things')}<ChevronRight size={16} aria-hidden="true" /></button></p>
      {/if}
      <a class="btn btn-link packl" href={tabHref('pack', trip)} onclick={() => openTrip(trip.id)} data-gear-packtab>{t('The whole list is under Pack')}<ChevronRight size={16} aria-hidden="true" /></a>
    {:else}
    {#if !d.debrief && gearList.length}<p class="tp-muted tp-small">{t('Not looked at yet. Mark only the exceptions: whatever you do not mark counts as used.')}</p>{/if}
    {#if gearList.length || foodList.length}<p class="tp-muted tp-small leg">{t('For each thing tap the hook (used), the circle (not used) or the triangle (broken); the pencil adds a note.')}</p>{/if}
    {#if gearList.length}<ul class="glist2">{#each gearList as it (it.id)}{@render thing(it)}{/each}</ul>{/if}
    {#if going}<button type="button" class="btn btn-link" onclick={() => (going = false)} data-gear-less>{t('Only the exceptions')}</button>{/if}
    {/if}
    {#if !before}
    {@render missingBox(missing, false)}

    <h3 class="h3 food"><Utensils size={16} aria-hidden="true" />{t('Food and drink')}</h3>
    {#if foodList.length}
      <ul class="glist2" data-food>{#each foodList as it (it.id)}{@render thing(it)}{/each}</ul>
    {:else}
      <p class="tp-muted tp-small" data-no-food>{t('Nothing chosen yet. «Change gear» has food and drink at the end.')}</p>
    {/if}
    {@render missingBox(missingFood, true)}
    <p class="tp-muted tp-small">{t('What you did not use, what broke and your notes come back the next time you pack.')}</p>
    {/if}
  </div>
{:else if partTrip}
  <div class="card pad" data-no-gear>
    <p class="tp-muted"><Backpack size={18} aria-hidden="true" /> {t('The gear of this ride is with the trip «{name}».', { name: partTrip.name })}</p>
    <a class="btn" href={partTrip.href}>{t('To the trip')}<ChevronRight size={16} aria-hidden="true" /></a>
  </div>
{:else}
  <!-- Noah 20.10.2026 «den leeren Gepäckbereich kompakter»: a small tinted hint, not a big white card -->
  <div class="hint" data-no-gear>
    <Backpack size={20} aria-hidden="true" />
    <div class="hm">
      <p class="ht">{t('Gear of this ride not entered')}</p>
      <p class="hs">{t('Enter what was along and keep what worked. The ride then becomes a trip with a packing list.')}</p>
      <div class="ha">
        <button type="button" class="btn hi" onclick={() => (picking = true)} data-gear-enter><Plus size={16} aria-hidden="true" />{t('Enter the gear')}</button>
        <button type="button" class="btn btn-link" onclick={() => openNew('list')}>{t('Plan the next trip')}</button>
      </div>
    </div>
  </div>
{/if}

{#if picking}
  <GearPickSheet items={d.items ?? []} chosen={(trip?.entries ?? []).map((e) => e.itemId)} {sources} onsave={save} onadd={addItem} onclose={() => (picking = false)} />
{/if}

<style>
  .wait {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 14px;
    margin: 12px 0 4px;
    padding: 12px 14px;
    border-radius: var(--radius-card);
    background: var(--warm-soft);
  }
  .wait .btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .all {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 12px;
    margin: 10px 0 0;
  }
  .all .btn,
  .packl {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .gh {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 16px;
  }
  .sum {
    margin: 0;
  }
  .leg {
    margin: 8px 0 0;
  }
  .wt {
    flex-basis: 100%;
    margin: 0;
    font-weight: 600;
  }
  .hint {
    display: flex;
    gap: 12px;
    padding: 14px 16px;
    border-radius: var(--help-r);
    background: var(--help-bg);
    color: var(--ink-2);
  }
  .hint > :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--ink-3);
  }
  .hm {
    flex: 1;
    min-width: 0;
  }
  .ht {
    margin: 0;
    color: var(--ink);
    font-weight: 600;
  }
  .hs {
    margin: 2px 0 10px;
    font-size: var(--fs-small);
  }
  .ha {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
  }
  .wxl {
    margin: 0 0 10px;
    color: var(--ink-2);
  }
  .glist2 {
    margin: 10px 0 0;
    padding: 0;
    list-style: none;
  }
  .gi {
    padding: 6px 0;
    border-bottom: 1px solid var(--card-line);
  }
  .gl {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 12px;
  }
  .gn {
    flex: 1 1 160px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .marks {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .mk {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 36px;
    padding: 0 10px;
    border: 1px solid var(--card-line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    font: 500 var(--fs-small) / 1 var(--font-body);
    cursor: pointer;
  }
  .mk[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .mk.broken[aria-pressed='true'] {
    border-color: var(--bad);
    background: var(--bad);
  }
  .gnote {
    width: 100%;
    margin: 6px 0 2px;
  }
  .gt {
    margin: 4px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-style: italic;
  }
  .h3.food {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 22px 0 0;
  }
  .miss {
    margin: 14px 0 0;
  }
  .h4 {
    margin: 0 0 6px;
    font: 600 var(--fs-small) / 1.3 var(--font-body);
  }
  .ml-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 8px;
    padding: 0;
    list-style: none;
  }
  .ml-list li {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 0 0 0 10px;
    border: 1px solid var(--card-line);
    border-radius: 999px;
    background: var(--paper-2);
    font-size: var(--fs-small);
  }
  .px {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--ink-2);
    cursor: pointer;
  }
  .madd {
    display: flex;
    gap: 8px;
  }
  .madd .inp {
    flex: 1;
    min-width: 0;
  }
  .mk:not([aria-pressed='true']) {
    width: 36px;
    justify-content: center;
    padding: 0;
  }
  /* UI-Test T1 (Noah «schöner machen»): before the ride a calm tinted box, like «Die Auswertung kommt nach der Tour» */
  .before {
    display: flex;
    gap: 12px;
    margin: 4px 0 6px;
    padding: 14px 16px;
    border-radius: var(--radius-card);
    background: var(--paper-2);
  }
  .before > :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--ink-3);
  }
  .bt {
    margin: 0;
    font-weight: 600;
  }
  .bs {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
