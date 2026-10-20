<script>
  /**
   * Paket Z «Aus jeder Tour lernen» (Noah 20.10.2026 «1a 2b 3a 4a») on the Rückblick of a trip:
   *   - Panne (1120): note a breakdown; it can become a bike-care job and comes back at the next packing
   *   - Schlafplätze (1122): rate where you slept (1–5 stars, a note, the place); saved as your own points
   *   - Tour-Postkarte (1123): one picture with a photo, the line and the numbers, to share
   * Everything is a suggestion and can stay empty.
   */
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { t, tn } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { whereAmI } from '../unterwegs/here.js';
  import { stage, stageCount } from '../ride.js';
  import { ownQuery, saveOwn, putOwn, newPoint } from '../map/ownpoints.js';
  import { BREAK_KINDS, breakKind, breakdownsOf, newBreakdown, repairFor, sleepSpots, starText } from './tourlernen.js';
  import { Wrench, BedDouble, Image as ImageIcon, Trash2, Plus, Check, Star, ChevronRight } from '@lucide/svelte';

  let { trip, bike = null } = $props();
  const pointsQ = ownQuery();
  const breaks = $derived(breakdownsOf(trip));
  const mySpots = $derived(sleepSpots($pointsQ ?? []).filter((p) => p.tripId === trip.id));
  const save = (fields) => db.trips.update(trip.id, touched(fields));
  const uid = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

  /* 1120 breakdown */
  let bOpen = $state(false);
  let bKind = $state('flat');
  let bPart = $state('');
  let bPlace = $state('');
  let bTask = $state(true);
  let msg = $state('');
  async function addBreak(e) {
    e.preventDefault();
    const b = newBreakdown({ kind: bKind, part: bPart, place: bPlace }, { id: uid('bd') });
    if (!b) return;
    if (bTask) {
      const k = breakKind(b.kind);
      const job = repairFor(b, trip, { id: uid('rp'), text: [t(k.task), b.part].filter(Boolean).join(': '), bike, today: localDay() });
      await db.maintenance.put(job);
      b.taskId = job.id;
    }
    await save({ breakdowns: [...breaks, b] });
    msg = bTask ? t('Saved. A bike-care job is waiting, and next time the spare part is suggested.') : t('Saved. Next time the spare part is suggested.');
    bPart = bPlace = '';
    bOpen = false;
  }
  async function dropBreak(b) {
    if ((await askDelete({ title: t('Delete this breakdown?'), text: t('The bike-care job stays; delete it in Velopflege if you no longer need it.') })) !== 'delete') return;
    const before = $state.snapshot(trip.breakdowns);
    await deleteWithUndo({ run: () => save({ breakdowns: breaks.filter((x) => x.id !== b.id) }), undo: () => save({ breakdowns: before }), text: t('"{name}" deleted.', { name: t(breakKind(b.kind).name) }), name: t(breakKind(b.kind).name) });
  }

  /* 1122 sleep spots */
  let sOpen = $state(false);
  let sName = $state('');
  let sStars = $state(4);
  let sNote = $state('');
  let sWhere = $state('night-0');
  let sBusy = $state(false);
  const nights = $derived(Math.max(1, stageCount(trip) - 1));
  const whereOpts = $derived([
    ...Array.from({ length: nights }, (_, n) => ({ key: `night-${n}`, name: trip.stages?.days?.[n]?.name || t('End of day {n}', { n: n + 1 }) })),
    { key: 'here', name: t('Where I am now') },
  ]);
  async function addSpot(e) {
    e.preventDefault();
    sBusy = true;
    msg = '';
    let at = null;
    if (sWhere === 'here') at = await whereAmI();
    else {
      const n = Number(sWhere.split('-')[1]) || 0;
      const st = stage(trip, n);
      at = st?.to ?? trip.place ?? null;
    }
    sBusy = false;
    if (!at || !Number.isFinite(at.lat)) return (msg = t('No place found for this spot. Choose «Where I am now» or add a route to the trip.'));
    const p = { ...newPoint({ lat: at.lat, lon: at.lon, name: sName, note: sNote, kind: 'sleep' }), stars: sStars, tripId: trip.id };
    const before = await saveOwn((list) => [...list, p]);
    offerDone(t('Sleep spot saved. It comes back when you plan a trip nearby.'), () => putOwn(before));
    sName = sNote = '';
    sOpen = false;
  }
  async function dropSpot(p) {
    if ((await askDelete({ title: t('Delete this sleep spot?'), text: t('You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    let before = [];
    await deleteWithUndo({ run: async () => (before = await saveOwn((list) => list.filter((x) => x.id !== p.id))), undo: () => putOwn(before), text: t('"{name}" deleted.', { name: p.name || t('Place to sleep') }), name: p.name || t('Place to sleep') });
  }

  /* 1123 postcard */
  let card = $state(false);
</script>

<section class="card learn" aria-labelledby="ln-h" data-tour-learn>
  <h2 id="ln-h" class="sh">{t('For next time')}</h2>
  <p class="tp-small tp-muted sub">{t('A breakdown, a good place to sleep, a postcard: the app brings it back when it fits.')}</p>

  <div class="part" data-learn-break>
    <h3><Wrench size={16} aria-hidden="true" />{t('Breakdown')}</h3>
    {#if breaks.length}
      <ul class="rows">
        {#each breaks as b (b.id)}
          <li><span class="grow"><b>{t(breakKind(b.kind).name)}</b>{#if b.part}{' · '}{b.part}{/if}{#if b.place}{' · '}<small>{b.place}</small>{/if}{#if b.taskId}{' · '}<small class="tp-muted">{t('in bike care')}</small>{/if}</span><button type="button" class="tp-icon-btn" aria-label={t('Delete {name}', { name: t(breakKind(b.kind).name) })} onclick={() => dropBreak(b)}><Trash2 size={16} aria-hidden="true" /></button></li>
        {/each}
      </ul>
    {/if}
    {#if bOpen}
      <form class="frm" onsubmit={addBreak}>
        <div class="tp-chips" role="group" aria-label={t('What broke?')}>
          {#each BREAK_KINDS as k (k.key)}<button type="button" class="tp-chip" aria-pressed={bKind === k.key} onclick={() => (bKind = k.key)} data-break-kind={k.key}>{t(k.name)}</button>{/each}
        </div>
        <input class="inp" bind:value={bPart} placeholder={t('Part, e.g. rear tube')} aria-label={t('Part')} />
        <input class="inp" bind:value={bPlace} placeholder={t('Where, e.g. after the pass')} aria-label={t('Where')} />
        <label class="chk"><input type="checkbox" bind:checked={bTask} />{t('Add a bike-care job')}</label>
        <div class="row"><button type="submit" class="btn ink" data-break-save><Check size={16} aria-hidden="true" />{t('Save')}</button><button type="button" class="btn" onclick={() => (bOpen = false)}>{t('Cancel')}</button></div>
      </form>
    {:else}
      <button type="button" class="tp-link" onclick={() => (bOpen = true)} data-break-add><Plus size={14} aria-hidden="true" /> {breaks.length ? t('Another breakdown') : t('Note a breakdown')}</button>
    {/if}
  </div>

  <div class="part" data-learn-sleep>
    <h3><BedDouble size={16} aria-hidden="true" />{t('Where you slept')}</h3>
    {#if mySpots.length}
      <ul class="rows">
        {#each mySpots as p (p.id)}
          <li><span class="grow"><span class="stars" aria-label={tn(p.stars ?? 0, '{n} star', '{n} stars')}>{starText(p.stars)}</span>{' '}<b>{p.name || t('Place to sleep')}</b>{#if p.note}{' · '}<small>{p.note}</small>{/if}</span><button type="button" class="tp-icon-btn" aria-label={t('Delete {name}', { name: p.name || t('Place to sleep') })} onclick={() => dropSpot(p)}><Trash2 size={16} aria-hidden="true" /></button></li>
        {/each}
      </ul>
    {/if}
    {#if sOpen}
      <form class="frm" onsubmit={addSpot}>
        <input class="inp" bind:value={sName} placeholder={t('e.g. Hotel Post or bivy by the lake')} aria-label={t('Name')} />
        <div class="starrow" role="group" aria-label={t('Stars')}>
          {#each [1, 2, 3, 4, 5] as n (n)}<button type="button" class="st" aria-pressed={sStars >= n} aria-label={tn(n, '{n} star', '{n} stars')} onclick={() => (sStars = n)} data-star={n}><Star size={22} aria-hidden="true" /></button>{/each}
        </div>
        <input class="inp" bind:value={sNote} placeholder={t('Note, e.g. quiet, water at the church')} aria-label={t('Note|sleep')} />
        <label class="tp-small fl" for="ln-where">{t('Place')}</label>
        <select id="ln-where" class="inp" bind:value={sWhere}>{#each whereOpts as o (o.key)}<option value={o.key}>{o.name}</option>{/each}</select>
        <div class="row"><button type="submit" class="btn ink" disabled={sBusy} data-sleep-save><Check size={16} aria-hidden="true" />{t('Save')}</button><button type="button" class="btn" onclick={() => (sOpen = false)}>{t('Cancel')}</button></div>
      </form>
    {:else}
      <button type="button" class="tp-link" onclick={() => (sOpen = true)} data-sleep-add><Plus size={14} aria-hidden="true" /> {t('Rate a place to sleep')}</button>
    {/if}
  </div>

  <div class="part">
    <button type="button" class="btn pc" onclick={() => (card = true)} data-postcard-open><ImageIcon size={18} aria-hidden="true" />{t('Tour postcard')}<ChevronRight size={16} aria-hidden="true" /></button>
  </div>
  <p class="tp-small" role="status">{msg}</p>
</section>
{#if card}{#await import('./PostcardSheet.svelte') then m}<m.default {trip} onclose={() => (card = false)} />{:catch}{/await}{/if}

<style>
  .learn {
    padding: 14px 16px;
    margin: 12px 0;
  }
  .sub {
    margin: 2px 0 8px;
  }
  .part {
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 6px;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .rows {
    list-style: none;
    margin: 0 0 6px;
    padding: 0;
  }
  .rows li {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
  }
  .grow {
    flex: 1 1 auto;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .stars {
    color: var(--warn);
    letter-spacing: 1px;
  }
  .frm {
    display: grid;
    gap: 8px;
  }
  .frm .inp {
    width: 100%;
    box-sizing: border-box;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .row .btn,
  .pc {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .chk {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .starrow {
    display: flex;
    gap: 4px;
  }
  .st {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-3);
    cursor: pointer;
  }
  .st[aria-pressed='true'] {
    color: var(--warn);
  }
  .fl {
    color: var(--ink-2);
  }
</style>
