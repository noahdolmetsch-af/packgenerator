<script module>
  // which folds are open, per trip: kept outside the card, because Planen draws the card anew after each save
  const folds = $state({});
</script>

<script>
  /**
   * Paket W «Von der Haustür bis zurück» (Noah 20.10.2026 «1a 2a 3a 4a»): the card on Planen of a trip.
   * Three folds, each a suggestion and each can stay empty:
   *   - Plan B for bad weather (1117): a shorter variant (GPX and/or a note) or the train home
   *   - Check-in of the accommodation per night (1118), with a warning when the planned arrival is late
   *   - «Gut angekommen» (1116): who gets the short message at the end of the day
   * Saved on the trip (trip.planB, trip.stays, trip.arrivedTo); nothing new on Heute.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import { readGpxFile } from '../route.js';
  import { stage, stageCount } from '../ride.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import Seg from '../ui/Seg.svelte';
  import { CONTACTS_KEY, contactsOf } from '../unterwegs/abfahrt.js';
  import { PLANB_KINDS, planBOf, staysOf, setStay, checkinOf, nightsOf, toggleArrived, badWeather, badText, hoursOfDay, TRIGGER_MM, TRIGGER_GUST, triggerOf } from './haustuer.js';
  import { DoorOpen, CloudRain, BedDouble, HeartHandshake, ChevronRight, Upload, Trash2, Check, TriangleAlert } from '@lucide/svelte';

  let { trip } = $props();
  const contactsQ = liveQuery(() => db.settings.get(CONTACTS_KEY));
  const contacts = $derived(contactsOf($contactsQ?.value));
  const chosen = $derived(new Set(Array.isArray(trip.arrivedTo) ? trip.arrivedTo : []));
  const save = (fields) => db.trips.update(trip.id, touched(fields));

  /* Plan B */
  const pb = $derived(planBOf(trip));
  const kind = $derived(trip.planB?.kind ?? null);
  let gpxMsg = $state('');
  function setKind(k) {
    save({ planB: { ...(trip.planB ?? {}), kind: k, note: trip.planB?.note ?? '', route: trip.planB?.route ?? null } });
  }
  function setNote(e) {
    save({ planB: { kind: kind ?? 'short', ...(trip.planB ?? {}), note: e.currentTarget.value } });
  }
  async function pickGpx(e) {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    gpxMsg = '';
    try {
      const route = await readGpxFile(file);
      await save({ planB: { ...(trip.planB ?? {}), kind: 'short', note: trip.planB?.note ?? '', route } });
    } catch (err) {
      gpxMsg = err?.message ?? String(err);
    }
  }
  // Touren-Ideen 46 «Plan B mit Auslöser»: you agree beforehand when you switch; '' = the app's rule
  const trig = $derived(triggerOf(trip.planB?.trigger));
  function setTrigger(field, value) {
    const next = { ...trig, [field]: value === '' ? null : Number(value) };
    save({ planB: { kind: kind ?? 'short', note: trip.planB?.note ?? '', route: trip.planB?.route ?? null, ...(trip.planB ?? {}), trigger: next } });
  }
  async function dropPlanB() {
    if ((await askDelete({ title: t('Delete plan B?'), text: t('You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    const before = $state.snapshot(trip.planB);
    await deleteWithUndo({ run: () => save({ planB: null }), undo: () => save({ planB: before }), text: t('"{name}" deleted.', { name: t('Plan B') }), name: t('Plan B') });
  }
  // a hint already here when a saved forecast of a trip day is bad (Unterwegs loads it)
  const bad = $derived.by(() => {
    for (const [date, wx] of Object.entries(trip.rideWx ?? {})) {
      const b = badWeather(hoursOfDay(wx, date), trip.planB?.trigger);
      if (b) return { date, ...b };
    }
    return null;
  });

  /* check-in per night */
  const nights = $derived(nightsOf(stageCount(trip)));
  const stays = $derived(staysOf(trip));
  const stayOf = (n) => stays.find((s) => s.n === n) ?? { n, name: '', until: '', phone: '', callBy: '' };
  const placeOf = (n) => trip.stages?.days?.[n]?.name ?? '';
  function setField(n, field, value) {
    save({ stays: setStay(stays, n, { ...stayOf(n), [field]: value }) });
  }
  const rows = $derived(Array.from({ length: nights }, (_, n) => ({ n, stay: stayOf(n), check: checkinOf(stayOf(n), stage(trip, n)) })));
  const lateN = $derived(rows.filter((r) => r.check?.late).length);
  const setCount = $derived(stays.filter((s) => s.until).length);

  const isOpen = (k, dflt) => folds[`${trip.id}:${k}`] ?? dflt;
  const toggle = (k) => (e) => (folds[`${trip.id}:${k}`] = e.currentTarget.open);
  const kmh = (v) => (v === Infinity ? '∞' : num(v));
</script>

{#if trip && !trip.finished}
  <section class="card door" aria-labelledby="door-h" data-door>
    <h3 id="door-h"><DoorOpen size={16} aria-hidden="true" />{t('From the door and back')}</h3>
    <p class="tp-small tp-muted sub">{t('Plan B, check-in and «Arrived safely»: all optional, for when the day goes differently.')}</p>

    <details class="fold" data-door-planb open={isOpen('planb', !!bad)} ontoggle={toggle('planb')}>
      <summary><CloudRain size={18} aria-hidden="true" /><span class="lab">{t('Plan B for bad weather')}</span><span class="r tp-small tp-muted">{trip.planB?.on ? t('Plan B is the route now') : pb ? (pb.kind === 'train' ? t('Train home') : pb.route ? t('{km} km variant', { km: num(Math.round(pb.route.km)) }) : t('Note')) : t('not set')}</span><ChevronRight class="chev" size={16} aria-hidden="true" /></summary>
      <div class="body">
        {#if bad && pb}<p class="warn" role="note" data-door-bad><TriangleAlert size={16} aria-hidden="true" />{t('Forecast for {date}: {what}. Your plan B is ready.', { date: new Date(`${bad.date}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric' }), what: badText(bad, t) })}</p>{/if}
        <p class="tp-small tp-muted">{t('When heavy rain or a storm is forecast for a trip day, the app reminds you on the way and in the evening window.')}</p>
        <Seg full={false} label={t('Plan B')} options={PLANB_KINDS.map((k) => ({ key: k.key, name: t(k.name) }))} value={kind} onchange={setKind} />
        {#if kind === 'short'}
          <label class="lk"><Upload size={16} aria-hidden="true" />{trip.planB?.route ? t('Replace GPX') : t('Add a shorter GPX route')}<input type="file" accept=".gpx,application/gpx+xml" onchange={pickGpx} class="sr" /></label>
          {#if trip.planB?.route}<p class="tp-small" data-door-route>{trip.planB.route.name || t('Shorter variant')} · {num(Math.round(trip.planB.route.km))} km{#if trip.planB.route.gainM}{' · '}{num(Math.round(trip.planB.route.gainM))} Hm{/if}</p>{/if}
          {#if gpxMsg}<p class="tp-small" role="alert">{gpxMsg}</p>{/if}
        {:else if kind === 'train'}
          <p class="tp-small">{t('On the way, «Home» shows the next 3 trains from where you are.')}</p>
        {/if}
        {#if kind}
          <div class="trig" data-door-trigger>
            <p class="tp-small fl" id="door-trig-h">{t('When do you switch? Agree on it now, so you need not decide in the rain.')}</p>
            <span class="tp-small tp-muted">{t('Rain over the day')}</span>
            <Seg small full={false} label={t('Rain over the day')} options={[{ key: '', name: t('App decides') }, ...TRIGGER_MM.map((n) => ({ key: String(n), name: t('from {n} mm', { n }) }))]} value={trig.mm == null ? '' : String(trig.mm)} onchange={(k) => setTrigger('mm', k)} />
            <span class="tp-small tp-muted">{t('Gusts')}</span>
            <Seg small full={false} label={t('Gusts')} options={[{ key: '', name: t('App decides') }, ...TRIGGER_GUST.map((n) => ({ key: String(n), name: t('from {n} km/h', { n }) }))]} value={trig.gust == null ? '' : String(trig.gust)} onchange={(k) => setTrigger('gust', k)} />
          </div>
          <label class="tp-small fl" for="door-note">{t('Note|planb')}</label>
          <textarea id="door-note" class="inp" rows="2" value={trip.planB?.note ?? ''} onchange={setNote} placeholder={t('e.g. from Le Locle along the lake, or the train from Biel')}></textarea>
          <button type="button" class="tp-link del" onclick={dropPlanB}><Trash2 size={14} aria-hidden="true" />{t('Delete plan B')}</button>
        {/if}
      </div>
    </details>

    {#if nights > 0}
      <details class="fold" data-door-checkin open={isOpen('checkin', lateN > 0)} ontoggle={toggle('checkin')}>
        <summary><BedDouble size={18} aria-hidden="true" /><span class="lab">{t('Check-in of the accommodation')}</span><span class="r tp-small" class:late={lateN > 0}>{lateN ? tn(lateN, '{n} arrival too late', '{n} arrivals too late') : setCount ? tn(setCount, '{n} night set', '{n} nights set') : t('not set')}</span><ChevronRight class="chev" size={16} aria-hidden="true" /></summary>
        <div class="body">
          <p class="tp-small tp-muted">{t('Until when can you check in? The app compares it with your planned arrival.')}</p>
          {#each rows as r (r.n)}
            <fieldset class="night" data-night={r.n}>
              <legend class="tp-small"><b>{t('Night {n}', { n: r.n + 1 })}</b>{#if placeOf(r.n)}{' · '}{placeOf(r.n)}{/if}</legend>
              <div class="grid">
                <input class="inp" value={r.stay.name} onchange={(e) => setField(r.n, 'name', e.currentTarget.value)} placeholder={t('Accommodation, e.g. Hotel Post')} aria-label={t('Accommodation of night {n}', { n: r.n + 1 })} />
                <input class="inp" type="time" value={r.stay.until} onchange={(e) => setField(r.n, 'until', e.currentTarget.value)} aria-label={t('Check-in until (night {n})', { n: r.n + 1 })} data-checkin-until />
                <input class="inp" type="tel" inputmode="tel" value={r.stay.phone} onchange={(e) => setField(r.n, 'phone', e.currentTarget.value)} placeholder="+41 …" aria-label={t('Phone of the accommodation (night {n})', { n: r.n + 1 })} />
              </div>
              <label class="tp-small callby">{t('Get in touch by (before you lose signal)')}<input class="inp" type="time" value={r.stay.callBy ?? ''} onchange={(e) => setField(r.n, 'callBy', e.currentTarget.value)} data-checkin-callby /></label>
              {#if r.check}
                {#if r.check.late}
                  <p class="warn" role="note" data-checkin-late><TriangleAlert size={16} aria-hidden="true" />{t('Planned arrival {arrive}, {min} min after check-in ends at {until}.', { arrive: r.check.arrive, min: r.check.lateMin, until: r.check.until })}{#if r.check.needKmh != null}{' '}{t('You would need {need} km/h instead of {plan} km/h; start earlier or call ahead.', { need: kmh(r.check.needKmh), plan: num(r.check.planKmh ?? 0) })}{/if}</p>
                {:else}
                  <p class="tp-small ok" data-checkin-ok><Check size={14} aria-hidden="true" />{t('Planned arrival {arrive}, check-in until {until}.', { arrive: r.check.arrive, until: r.check.until })}</p>
                {/if}
              {/if}
            </fieldset>
          {/each}
        </div>
      </details>
    {/if}

    <details class="fold" data-door-arrived open={isOpen('arrived', false)} ontoggle={toggle('arrived')}>
      <summary><HeartHandshake size={18} aria-hidden="true" /><span class="lab">{t('Arrived safely')}</span><span class="r tp-small tp-muted">{chosen.size ? tn(contacts.filter((c) => chosen.has(c.id)).length, '{n} person', '{n} people') : t('not set')}</span><ChevronRight class="chev" size={16} aria-hidden="true" /></summary>
      <div class="body">
        <p class="tp-small tp-muted">{t('Who gets a short message when you arrive? On the way, one tap opens your phone’s share sheet with a ready text.')}</p>
        {#if contacts.length}
          <div class="tp-chips" role="group" aria-label={t('Who should know?')}>
            {#each contacts as c (c.id)}
              <button type="button" class="tp-chip" aria-pressed={chosen.has(c.id)} onclick={() => save({ arrivedTo: toggleArrived(trip, c.id) })}>{#if chosen.has(c.id)}<Check size={14} aria-hidden="true" />{/if}{c.name}</button>
            {/each}
          </div>
        {:else}
          <p class="tp-small">{t('No people yet. Add them under On the way › Before you leave › Your emergency contacts.')} <a href="#/ride/abfahrt">{t('Open')}</a></p>
        {/if}
      </div>
    </details>
  </section>
{/if}

<style>
  .trig {
    display: grid;
    gap: 6px;
    justify-items: start;
  }
  .trig .fl {
    margin: 0;
  }
  .callby {
    display: grid;
    gap: 4px;
    margin-top: 6px;
  }
  .door {
    padding: 12px 16px;
    margin: 12px 0;
  }
  h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .sub {
    margin: 2px 0 6px;
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
  .lk {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    color: var(--hi);
    font-weight: 600;
    cursor: pointer;
  }
  .lk:focus-within {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  .fl {
    color: var(--ink-2);
  }
  textarea.inp {
    width: 100%;
    box-sizing: border-box;
  }
  .del {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .night {
    margin: 0;
    padding: 8px 0 0;
    border: 0;
    min-width: 0;
  }
  .night legend {
    padding: 0;
    overflow-wrap: break-word;
  }
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1.4fr);
    gap: 8px;
    margin-top: 6px;
  }
  @media (max-width: 639px) {
    .grid {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
    .grid .inp:first-child {
      grid-column: 1 / -1;
    }
  }
  .grid .inp {
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
  }
  .warn {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin: 6px 0 0;
    padding: 8px 10px;
    border-radius: var(--r-ctl);
    background: var(--warn-soft);
    color: var(--ink);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .warn :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .ok {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 6px 0 0;
    color: var(--ink-2);
  }
  .late {
    color: var(--bad);
    font-weight: 600;
  }
</style>
