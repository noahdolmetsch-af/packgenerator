<script>
  import { UNDO_MS } from '../lib/ui/undo.js';
  /**
   * v0.67.0 «Übergänge 1» (rule U2, Noah Ü3a–Ü5a, U21–U26; mockups Zwischen-*): the calm page after a
   * finished step of a trip, each with its own address so reload, back and a link from Today land here:
   *   #/trip/<id>/packed     «Gepackt»: the numbers, the start and its countdown, the reminder the
   *                          evening before (a switch, U21a), «Zur Startseite» (U26b).
   *   #/trip/<id>/ended      «Tour beendet»: after «Letzten Tag abschliessen», after «Tour beenden»
   *                          (with Undo), and by itself on the evening of the last day (U22 a+b).
   *                          A day ride gets its short debrief right here (Ü5a).
   *   #/trip/<id>/debriefed  «Rückblick fertig»: what was learned; the trip stays under Past trips.
   * Ü4a: the app opens it only right after the step; afterwards the trip shows its waiting state.
   */
  import { liveQuery } from 'dexie';
  import Skeleton from '../lib/ui/Skeleton.svelte';
  import { db } from '../lib/db.js';
  import { t, tn, num, locale, nameOf } from '../lib/i18n.svelte.js';
  import { tripStats, zoneName, RAIN } from '../lib/trips.js';
  import { hasBike, domainOf } from '../lib/domains.js';
  import { kindName } from '../lib/sports.js';
  import { tabsOf, stepsOf, tabStatus, tripDates } from '../lib/tabs.js';
  import { tripEnd, quickDebrief } from '../lib/debrief.js';
  import { tripNotes } from '../lib/notes.js';
  import { localDay } from '../lib/localday.js';
  import { openTrip, openNew } from '../lib/nav.js';
  import { packedAll, isDayTrip, daysFrom, canReopen } from '../lib/phase.js';
  import { takeUndo, reopenTrip } from '../lib/trip/ending.js';
  import Interstitial from '../lib/ui/Interstitial.svelte';
  import CheckSheet from '../lib/trip/CheckSheet.svelte';
  import CheckEdit from '../lib/trip/CheckEdit.svelte';
  import { checkKey, checkOf, checkCount, nextOpen } from '../lib/checks.js';
  import { typeIcon } from '../lib/trip/checkicons.js';
  import Celebrate from '../lib/ui/Celebrate.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { Bell, X, Minus, Plus, Route, Check, Undo2, Zap, ChevronRight, Briefcase, NotebookPen, Wrench, Save, BookOpen } from '@lucide/svelte';
  import StepBar from '../lib/ui/StepBar.svelte';
  import PageHead from '../lib/ui/PageHead.svelte';
  import MainBar from '../lib/ui/MainBar.svelte';
  import { chargeList, chargeCount } from '../lib/charge.js';
  import QuizEveRow from '../lib/lernen/QuizEveRow.svelte';
  import ProbePage from '../lib/probe/ProbePage.svelte';
  import ProbeRow from '../lib/probe/ProbeRow.svelte';
  import '../lib/review/review.css';

  let { id, kind } = $props();

  const tripsQ = liveQuery(() => db.trips.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const notesQ = liveQuery(() => db.notes.toArray());

  const today = localDay();
  const trip = $derived(($tripsQ ?? []).find((x) => x.id === id) ?? null);
  const items = $derived($itemsQ ?? []);
  const itemsById = $derived(Object.fromEntries(items.map((i) => [i.id, i])));
  const bike = $derived(trip && hasBike(trip) ? ($bikesQ ?? []).find((b) => b.id === trip.bikeId) ?? null : null);
  const debrief = $derived(trip ? ($debriefsQ ?? []).find((d) => d.tripId === trip.id) ?? null : null);
  const stats = $derived(trip && $itemsQ && $bagsQ ? tripStats(trip, items, $bagsQ, bike, 0) : null);
  const tabs = $derived(trip ? tabsOf(trip) : []);
  // Impeccable Heute 3: after «Tour beendet» the step bar shows Packen and Unterwegs as done
  const status = $derived(trip ? tabStatus(trip, { open: 0, debrief, today, km: debrief?.km ?? trip.route?.km ?? null, ended: kind !== 'packed' }) : {});
  const current = $derived(kind === 'packed' ? (tabs.includes('ride') ? 'ride' : 'pack') : 'debrief');
  const pick = () => openTrip(trip.id);
  const kg = (g) => (g / 1000).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const weekday = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { weekday: 'long' });
  const longDay = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' });
  const context = $derived(trip ? `${trip.title} · ${tripDates(trip)}` : '');

  /* ---------- v0.111.0 the check of the page (mockups V1–V6): a row that opens its sheet ---------- */
  const checkKind = $derived(kind === 'packed' ? 'eve' : 'after');
  const stdQ = liveQuery(() => db.settings.where('key').startsWithAnyOf(['eveStandard', 'afterStandard']).toArray());
  const domain = $derived(trip ? domainOf(trip) : null);
  const standard = $derived(domain ? (($stdQ ?? []).find((r) => r.key === checkKey(checkKind, domain))?.value ?? null) : null);
  const checkList = $derived(trip ? checkOf(trip, checkKind, standard) : []);
  const checkN = $derived(checkCount(checkList));
  const checkNext = $derived(nextOpen(checkList));
  const checkLine = $derived([t('{done} of {n} done', { done: checkN.done, n: checkN.total }), checkNext ? t('next: {name}', { name: t(checkNext.label) }) : null].filter(Boolean).join(' · '));
  // Klick-Rundgang H02: the trip's sport («Fahrrad»), not its packing area («Bikepacking»)
  const area = $derived(trip ? t(kindName(trip)) : '');
  const TypeIcon = $derived(typeIcon(domain));
  // Today's evening row comes with «?check»: the sheet opens right away (and a reload does not again)
  const askCheck = /\?check\b/.test(location.hash);
  if (askCheck) history.replaceState(history.state, '', location.href.replace(/\?check\b/, ''));
  let sheet = $state(askCheck ? 'check' : null); // 'check' | 'edit' | null

  /* ---------- Gepackt ---------- */
  const all = $derived(trip ? packedAll(trip) : false);
  const left = $derived(trip ? (trip.entries ?? []).filter((e) => !e.packed).length : 0);
  const until = $derived(trip?.startDate ? daysFrom(today, trip.startDate) : null);
  const bags = $derived(stats ? stats.zones.filter((z) => z.entries.length) : []);
  const startText = $derived(until == null ? '' : until <= 0 ? t('Start today') : until === 1 ? t('Start tomorrow') : tn(until, 'Start in {n} day', 'Start in {n} days'));
  const wx = $derived(trip?.wx?.min != null && trip?.wx?.max != null ? `${trip.wx.min}–${trip.wx.max} °C, ${t(RAIN[trip.wx.rain ?? 'none'])}` : '');
  const eveDay = $derived(trip?.startDate ? (() => { const d = new Date(`${trip.startDate}T12:00:00`); d.setDate(d.getDate() - 1); return localDay(d); })() : null);
  // v0.105.0 P5 (T11): «11.1 kg in 5 Taschen», what is left to charge
  const kgLine = $derived(stats && stats.gearG + stats.onMeG ? tn(bags.length, '{kg} kg in {n} bag', '{kg} kg in {n} bags', { kg: kg(stats.gearG + stats.onMeG) }) : '');
  const charge = $derived(trip ? chargeList(trip, items) : []);
  const charged = $derived(trip ? chargeCount(trip, charge) : { done: 0, total: 0 });
  async function setRemind(on) {
    await db.trips.update(trip.id, { remindEve: on, updatedAt: new Date().toISOString() });
  }
  const packedMain = $derived(trip && hasBike(trip) && until === 0 ? { label: t('Continue to On the way'), href: '#/ride', onclick: pick } : { label: t('To the start page'), href: '#/' });

  /* ---------- Tour beendet ---------- */
  let undo = $state(null); // { before } for 10 seconds after «Tour beenden»
  let undoTimer;
  $effect(() => {
    if (kind !== 'ended') return;
    const u = takeUndo(id);
    if (u) {
      undo = u;
      undoTimer = setTimeout(() => (undo = null), UNDO_MS);
    }
    return () => clearTimeout(undoTimer);
  });
  const end = $derived(trip ? tripEnd(trip) : null);
  const early = $derived(!!trip?.finished && !!end && trip.finished < end);
  const ridden = $derived(trip?.startDate ? Math.max(1, Math.min(Number(trip.days) || 1, daysFrom(trip.startDate, trip.finished && trip.finished < (end ?? '') ? trip.finished : (end ?? today)) + 1)) : 1);
  const km = $derived(debrief?.km ?? trip?.route?.km ?? null);
  const gain = $derived(trip?.route?.gainM ?? null);
  const notes = $derived(trip ? tripNotes(debrief, $notesQ ?? [], trip.id) : []);
  const endedText = $derived(!trip ? '' : early ? t('Ended after day {n} of {total}. Good to be back.', { n: ridden, total: Number(trip.days) || 1 }) : (Number(trip.days) || 1) > 1 ? tn(ridden, '{n} day on the way. Good to be back.', '{n} days on the way. Good to be back.') : t('Good to be back.'));
  const day = $derived(trip ? isDayTrip(trip) : false);
  const quickDone = $derived(debrief?.status === 'done');
  let quickUndo = $state(null);
  async function allGood() {
    const snap = $state.snapshot(trip);
    const prev = debrief ? structuredClone($state.snapshot(debrief)) : null;
    await db.transaction('rw', db.debriefs, db.trips, async () => {
      await db.debriefs.put(quickDebrief(snap, prev ? structuredClone(prev) : null));
      await db.trips.update(snap.id, { status: 'done' });
    });
    quickUndo = { prev, status: snap.status };
  }
  async function undoQuick() {
    const u = quickUndo;
    quickUndo = null;
    await db.transaction('rw', db.debriefs, db.trips, async () => {
      if (u.prev) await db.debriefs.put(u.prev);
      else await db.debriefs.delete(trip.id);
      await db.trips.update(trip.id, { status: u.status ?? 'planned' });
    });
  }
  async function undoEnd() {
    const u = undo;
    undo = null;
    clearTimeout(undoTimer);
    await reopenTrip($state.snapshot(trip), u.before);
  }
  const careHref = $derived(trip?.bikeId ? `#/bikes?tab=care&bike=${encodeURIComponent(trip.bikeId)}` : '#/bikes?tab=care');
  const debriefHref = $derived(trip ? `#/debrief/${encodeURIComponent(trip.id)}` : '#/debrief');
  const endedMain = $derived(day ? (quickDone ? { label: t('To the start page'), href: '#/' } : { label: t('All good'), onclick: allGood, arrow: false }) : { label: t('Continue to Debrief'), href: debriefHref, onclick: pick });
  const endedSecond = $derived(day ? (quickDone ? null : { label: t('Debrief in detail'), href: debriefHref, onclick: pick }) : { label: t('Later'), href: '#/' });

  /* ---------- Rückblick fertig ---------- */
  const learned = $derived.by(() => {
    if (!debrief) return [];
    const out = [];
    for (const m of debrief.missing ?? []) out.push({ key: `m:${m.id}`, icon: Plus, text: t('{name} was missing', { name: m.name }) });
    for (const [itemId, state] of Object.entries(debrief.items ?? {})) {
      const it = itemsById[itemId];
      if (!it) continue;
      out.push({ key: `i:${itemId}`, icon: state === 'broken' ? X : Minus, text: state === 'broken' ? t('{name} broke', { name: nameOf(it) }) : t('{name} not used', { name: nameOf(it) }) });
    }
    return out.slice(0, 6);
  });
  const doneSub = $derived(trip ? [km ? `${num(Math.round(km))} km` : null, tn(ridden, '{n} day', '{n} days'), stats?.baseG ? t('base {kg} kg', { kg: kg(stats.baseG) }) : null].filter(Boolean).join(' · ') : '');
</script>

{#if !$tripsQ}
  <Skeleton rows={3} />
{:else if !trip}
  <h1 class="lost">{t('Trip not found')}</h1>
  <Empty icon={Route} text={t('This trip does not exist any more.')} action={{ label: t('Back to Trips'), href: '#/trips' }} />
{:else if kind === 'probe' || kind === 'heim'}
  <!-- Paket B: «Generalprobe» and «Gut ankommen» (lib/probe) -->
  <ProbePage {trip} {kind} {items} {debrief} />
{:else if kind === 'packed'}
  <!-- v0.106.0 Design-Refresh P5 (T11 «Alles gepackt», approved 12.10.2026): the steps on top, one card in
       the middle with the count tile, the celebration and what happens next, «Bis zum Start» under it. -->
  <article class="pk" aria-labelledby="pk-h">
    <p class="trip">{context}</p>
    <StepBar {trip} tabs={stepsOf(trip)} {status} {current} tone="light" onpick={pick} />
    <section class="card hero" id="pk-h">
      {#if stats?.count}
        <p class="tally"><b class="num">{t('{n} of {total}', { n: stats.count - left, total: stats.count })}</b><small>{all ? t('{trip} · all packed', { trip: trip.title }) : trip.title}</small></p>
      {/if}
      <PageHead done title={all ? t('Packed') : t('Almost packed')}
        text={all ? (until > 0 ? t('Everything is in the bags. They can stay like that until {day}.', { day: weekday(trip.startDate) }) : t('Everything is in the bags.')) : tn(left, '{n} thing is not ticked yet. That is fine, you decide.', '{n} things are not ticked yet. That is fine, you decide.')}
        sub={kgLine} />
      <p class="what">{until > 0 ? (hasBike(trip) ? t('On the way opens by itself on {day}.', { day: weekday(trip.startDate) }) : t('On {day} it starts. Until then there is nothing to do.', { day: weekday(trip.startDate) })) : t('Today it starts. Have a good trip!')}</p>
    </section>

    <section class="until" aria-labelledby="until-h">
      <h2 id="until-h" class="sh">{t('Until the start')}</h2>
      {#if until != null && until >= 0}<p class="ssub">{startText}{wx ? ` · ${wx}` : ''}</p>{/if}
      <ul class="card rows">
        {#if until != null && until >= 0}
          <!-- v0.111.0 mockup V1 (Noah «v1-v4 ok»): the evening-before check, its sheet on a tap -->
          <li><button type="button" class="row" aria-haspopup="dialog" data-row="check" onclick={() => (sheet = 'check')}><span class="ic" aria-hidden="true"><TypeIcon size={18} /></span><span class="bt"><b>{t('Evening-before check {area}', { area })}</b><small class="num">{checkLine}</small></span><span class="mini" aria-hidden="true"><i style:width="{checkN.total ? (checkN.done / checkN.total) * 100 : 0}%"></i></span><ChevronRight size={18} aria-hidden="true" /></button></li>
        {/if}
        <!-- Paket M «Quiz am Vorabend»: only the evening before, when the quiz is on (lernen/QuizEveRow.svelte) -->
        <QuizEveRow {trip} {today} />
        <ProbeRow {trip} kind="probe" {items} {debrief} />
        {#if charge.length}
          <li><a class="row" href="#/pack?charge" onclick={pick}><span class="ic" aria-hidden="true"><Zap size={18} /></span><span class="bt"><b>{t('Charge the evening before')}</b><small class="num">{t('{done} of {n} charged', { done: charged.done, n: charged.total })}</small></span><ChevronRight size={18} aria-hidden="true" /></a></li>
        {/if}
        {#if until > 0}
          <!-- U21a: the reminder the evening before, as a switch (on by default; Today shows it from 18:00) -->
          <li><label class="row"><span class="ic" aria-hidden="true"><Bell size={18} /></span><span class="bt"><b>{t('Reminder the evening before')}</b><small>{t('{day}, from 18:00 at the top of Today', { day: longDay(eveDay) })}</small></span><input type="checkbox" role="switch" checked={trip.remindEve !== false} onchange={(e) => setRemind(e.currentTarget.checked)} /></label></li>
        {/if}
        <li><a class="row" href="#/pack?day" onclick={pick}><span class="ic" aria-hidden="true"><Briefcase size={18} /></span><span class="bt"><b>{t('See the packing list')}</b>{#if stats}<small class="num">{tn(bags.length, '{n} bag', '{n} bags')} · {tn(stats.count, '{n} item', '{n} items')}</small>{/if}</span><ChevronRight size={18} aria-hidden="true" /></a></li>
      </ul>
    </section>
    <MainBar main={packedMain} second={{ label: t('Back to Trips'), href: '#/trips' }} step={tabs.includes(current) ? t('Step {n} of {m}', { n: tabs.indexOf(current) + 1, m: tabs.length }) : ''} />
  </article>
{:else if kind === 'ended'}
  <!-- v0.109.0 Design-Refresh P6 (T14 «Tour zu Ende», approved 12.10.2026): like «Gepackt» (T11): the steps on
       top, one card with the number tile, the celebration and what comes next, the notes on the way as rows
       under it; the main button stays in the bar at the bottom (G7). -->
  <article class="pk" aria-labelledby="end-h">
    <p class="trip">{context}</p>
    <StepBar {trip} tabs={stepsOf(trip)} {status} {current} tone="light" onpick={pick} />
    <section class="card hero" id="end-h">
      <p class="tally">
        {#if km}<b class="num">{num(Math.round(km))} km</b>{:else}<b class="num">{tn(ridden, '{n} day', '{n} days')}</b>{/if}
        <small class="num">{[trip.title, km ? tn(ridden, '{n} day', '{n} days') : null, gain ? `${num(Math.round(gain))} ${t('m up|short')}` : null].filter(Boolean).join(' · ')}</small>
      </p>
      <PageHead done title={t('Trip ended')} text={endedText} />
      <p class="what">{day ? (quickDone ? t('Nothing more. The debrief is saved.') : t('A short debrief: «All good» when nothing was different.')) : t('First the after-trip check, then the debrief, about 3 minutes.')}</p>
      <!-- Klick-Rundgang 22.10.2026 H10: only a route gives numbers; without one the page says so and offers the upload -->
      {#if !km && gain}<p class="what small">{t('Numbers from your route. With an uploaded ride they get exact.')}</p>
      {:else if !km}<p class="what small">{t('No km yet: upload the ride, then km and time show here.')} <a class="tp-link" href="#/debrief/ride" data-upload-ride>{t('Upload a ride')}</a></p>{/if}
      {#if day && quickDone}
        <div class="saved"><Celebrate title={t('Debrief saved')} text={t('Every item counts as used.')} />{#if quickUndo}<button type="button" class="tp-link" onclick={undoQuick}>{t('Undo')}</button>{/if}</div>
      {/if}
    </section>
    <!-- v0.111.0 mockup V5 (Noah «v5-6 ok»): «Bevor du auspackst», the after-trip check and the notes on the way -->
    <section class="until" aria-labelledby="unpack-h">
      <h2 id="unpack-h" class="sh">{t('Before you unpack')}</h2>
      <p class="ssub">{t('At home, before everything goes into the cupboard')}</p>
      <ul class="card rows">
        <li><button type="button" class="row" aria-haspopup="dialog" data-row="check" onclick={() => (sheet = 'check')}><span class="ic" aria-hidden="true"><TypeIcon size={18} /></span><span class="bt"><b>{t('After-trip check {area}', { area })}</b><small class="num">{checkLine}</small></span><span class="mini" aria-hidden="true"><i style:width="{checkN.total ? (checkN.done / checkN.total) * 100 : 0}%"></i></span><ChevronRight size={18} aria-hidden="true" /></button></li>
        <ProbeRow {trip} kind="heim" {items} {debrief} />
        <!-- Paket Q #77: the way goes on to the bike after the trip -->
        {#if hasBike(trip)}<li><a class="row" href={careHref} data-row="care"><span class="ic" aria-hidden="true"><Wrench size={18} /></span><span class="bt"><b>{t('Bike care')}</b><small>{bike?.name ?? t('Clean, oil, what is due')}</small></span><ChevronRight size={18} aria-hidden="true" /></a></li>{/if}
        {#if notes.length}
          <li><a class="row" href={debriefHref} onclick={pick} data-row="noted"><span class="ic" aria-hidden="true"><NotebookPen size={18} /></span><span class="bt"><b>{t('Noted on the way')}</b><small>{[tn(notes.length, '{n} note', '{n} notes'), notes.slice(0, 2).map((n) => `«${n.text}»`).join(', ')].join(' · ')}</small></span><ChevronRight size={18} aria-hidden="true" /></a></li>
        {/if}
      </ul>
    </section>
    <MainBar main={endedMain} second={endedSecond} step={tabs.includes(current) ? t('Step {n} of {m}', { n: tabs.indexOf(current) + 1, m: tabs.length }) : ''} hint={t('Trip ended')} />
    <div class="foot">
      {#if !day}<span>{t('With «Later», Today reminds you tomorrow.')}</span>{:else if !quickDone}<a class="tp-link" href="#/">{t('Later')}</a>{/if}
      {#if canReopen(trip, today) && !quickDone}<button type="button" class="tp-link" onclick={() => reopenTrip($state.snapshot(trip))}>{t('Still on the way? Reopen the trip')}</button>
      {:else if !trip.finished && hasBike(trip)}<a class="tp-link" href="#/ride" onclick={pick}>{t('Still on the way? Back to On the way')}</a>{/if}
    </div>
  </article>
  {#if undo}
    <div class="toast" role="status"><Check size={18} aria-hidden="true" /><span>{t('{trip} ended.', { trip: trip.title })}</span><button type="button" class="undo" onclick={undoEnd}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button></div>
  {/if}
{:else}
  <Interstitial {trip} {tabs} {status} {current} {context} onpick={pick}
    title={t('Debrief finished|title')} text={t('Thank you. The next packing list knows more now.')} sub={doneSub}
    what={t('Nothing more. {trip} is now under «Past trips».', { trip: trip.title })}
    main={{ label: t('Back to Trips'), href: '#/trips' }} second={{ label: t('Plan a new trip'), onclick: () => openNew('list') }}>
    <section class="card bc notes" aria-labelledby="learned-h">
      <h2 id="learned-h" class="kick">{t('Learned')}</h2>
      {#if learned.length}
        <ul class="rows">{#each learned as l (l.key)}{@const Icon = l.icon}<li><Icon size={16} aria-hidden="true" /><span class="nm">{l.text}</span></li>{/each}</ul>
      {:else}<p class="tp-muted">{t('Everything was as planned: every item was used.')}</p>{/if}
    </section>
    <!-- Paket Q #77/#78: back home, the next small steps (bike, backup, logbook) -->
    <section class="until" aria-labelledby="home-h" data-section="back-home">
      <h2 id="home-h" class="sh">{t('Back home')}</h2>
      <ul class="card rows">
        {#if hasBike(trip)}<li><a class="row" href={careHref} data-row="care"><span class="ic" aria-hidden="true"><Wrench size={18} /></span><span class="bt"><b>{t('Bike care')}</b><small>{bike?.name ?? t('Clean, oil, what is due')}</small></span><ChevronRight size={18} aria-hidden="true" /></a></li>{/if}
        <li><a class="row" href="#/me/data" data-row="backup"><span class="ic" aria-hidden="true"><Save size={18} /></span><span class="bt"><b>{t('Make a backup')}</b><small>{t('So the trip is safe on your other device too')}</small></span><ChevronRight size={18} aria-hidden="true" /></a></li>
        <li><a class="row" href="#/debrief/logbook" data-row="logbook"><span class="ic" aria-hidden="true"><BookOpen size={18} /></span><span class="bt"><b>{t('Logbook')}</b><small>{t('All your trips in one list')}</small></span><ChevronRight size={18} aria-hidden="true" /></a></li>
      </ul>
    </section>
    {#snippet foot()}<a class="tp-link" href={debriefHref} onclick={pick}>{t('See the debrief')}</a>{/snippet}
  </Interstitial>
{/if}

{#if trip && (kind === 'packed' || kind === 'ended') && sheet === 'check'}
  <CheckSheet {trip} kind={checkKind} {items} trips={$tripsQ ?? []} debriefs={$debriefsQ ?? []} {standard} notes={notes.length} debriefDone={debrief?.status === 'done'} debriefHref={kind === 'ended' && !day ? debriefHref : ''} onedit={() => (sheet = 'edit')} onclose={() => (sheet = null)} />
{:else if trip && (kind === 'packed' || kind === 'ended') && sheet === 'edit'}
  <CheckEdit kind={checkKind} {domain} {trip} list={checkList} {items} trips={$tripsQ ?? []} debriefs={$debriefsQ ?? []} onclose={() => (sheet = 'check')} />
{/if}

<style>
  /* v0.105.0 P5 (T11): «Gepackt» */
  .pk {
    max-width: 1080px;
    margin: 0 auto;
    padding: 0 0 24px;
  }
  .trip {
    margin: 0 0 8px;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .hero {
    max-width: 620px;
    margin: 20px auto 0;
    text-align: center;
  }
  .tally {
    display: grid;
    justify-items: center;
    gap: 2px;
    max-width: 340px;
    margin: 0 auto 4px;
    padding: 18px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .tally b {
    font: 700 var(--fs-section) / 1.1 var(--font-body);
  }
  .tally small {
    /* 0.132.1: a long name without spaces breaks inside the box (a grid item never shrinks below its longest word otherwise) */
    max-width: 100%;
    min-width: 0;
    text-align: center;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    overflow-wrap: break-word;
  }
  .hero .what {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .hero .what.small {
    margin-top: 6px;
    font-size: var(--fs-tiny);
  }
  .saved {
    display: grid;
    justify-items: center;
    gap: 4px;
    margin-top: 14px;
  }
  .foot {
    display: grid;
    justify-items: center;
    gap: 4px;
    max-width: 620px;
    margin: 18px auto 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    text-align: center;
  }
  .until {
    max-width: 620px;
    margin: 24px auto 0;
  }
  .sh {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .ssub {
    margin: 2px 0 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .until .rows {
    list-style: none;
    margin: 8px 0 0;
    padding-top: 4px;
    padding-bottom: 4px;
  }
  .until .rows li {
    display: block;
    min-height: 0;
    padding: 0;
    border-top: 0;
  }
  .until .rows li + li {
    border-top: 1px solid var(--line);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 60px;
    padding: 6px 0;
    color: var(--ink);
    text-decoration: none;
    cursor: pointer;
  }
  .row :global(svg) {
    flex: none;
  }
  button.row {
    width: 100%;
    border: 0;
    background: none;
    font: inherit;
    text-align: left;
  }
  /* v0.111.0 (V1, V5): the small bar of a check row */
  .mini {
    flex: none;
    width: 60px;
    height: 6px;
    border-radius: 99px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .mini i {
    display: block;
    height: 100%;
    background: var(--hi);
  }
  .row > :global(svg) {
    color: var(--ink-3);
  }
  .ic {
    display: grid;
    flex: none;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .bt {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .bt b {
    display: block;
    font-weight: 500;
  }
  .bt small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  @media (max-width: 719px) {
    .pk {
      padding-bottom: 96px;
    }
  }
  .lost {
    margin: 0 0 12px;
    font: 700 var(--fs-title)/1.2 var(--font-body);
  }
  .bc {
    margin: 0 0 12px;
  }
  .rows {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
  }
  .rows li {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 40px;
    padding: 4px 0;
    border-top: 1px solid var(--line);
    font-size: var(--fs-body);
  }
  .rows .nm {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .rows :global(svg) {
    flex: none;
    color: var(--ink-3);
  }
  .kick {
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-3);
  }
  .small {
    margin: 8px 0 0;
    font-size: var(--fs-small);
  }
  .row input[role='switch'] {
    flex: none;
    width: 52px;
    height: 30px;
    margin: 0;
    appearance: none;
    border-radius: 99px;
    background: var(--line-strong);
    position: relative;
    cursor: pointer;
  }
  .row input[role='switch']::after {
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
  .row input[role='switch']:checked {
    background: var(--accent);
  }
  .row input[role='switch']:checked::after {
    transform: translateX(22px);
  }
  .row input[role='switch']:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  .toast {
    position: fixed;
    left: 50%;
    bottom: calc(150px + env(safe-area-inset-bottom));
    transform: translateX(-50%);
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 12px;
    width: max-content;
    max-width: calc(100vw - 32px);
    padding: 4px 8px 4px 16px;
    border-radius: 10px;
    background: var(--ink);
    color: var(--paper);
    box-shadow: 0 8px 24px var(--shadow);
    overflow-wrap: break-word;
  }
  /* v0.99.0 Design-Refresh R3 (G3): «Rückgängig» a light word with its arrow, like every note */
  .toast .undo {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 10px;
    border: 0;
    border-radius: var(--r-ctl);
    background: transparent;
    color: var(--hi-bright);
    font: 600 var(--fs-body) var(--font-body);
    cursor: pointer;
  }
  @media (min-width: 720px) {
    .toast {
      bottom: 32px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .row input[role='switch']::after {
      transition: none;
    }
  }
</style>
