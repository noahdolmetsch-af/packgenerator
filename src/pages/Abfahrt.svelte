<script>
  /**
   * Paket K #87 «Blatt Vor der Abfahrt» (Noah 19.10.2026 «5a und b»): #/ride/abfahrt, opened from
   * Unterwegs. One page with what you need at hand on the tour day: the tour (day, start, km, metres up,
   * the line of the route), tickets and papers from Dokumente, emergency numbers and your own emergency
   * contacts (add, rename, delete), the way home. Everything is on the device, so it works offline;
   * «Als PDF» makes the same page to print (pdf-lib, loaded only then).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { t, locale, num } from '../lib/i18n.svelte.js';
  import { localDay } from '../lib/localday.js';
  import { nextTrip } from '../lib/debrief.js';
  import { stage, dayIndex, stageCount } from '../lib/ride.js';
  import { sunTimes } from '../lib/blockplan.js';
  import { homeOf } from '../lib/dayride.js';
  import { readyDone } from '../lib/trips.js';
  import { sbbUrl } from '../lib/sk/links.js';
  import { askDelete, deleteWithUndo } from '../lib/ui/ask.js';
  import PathHead from '../lib/ui/PathHead.svelte';
  import { EMERGENCY, CONTACTS_KEY, sheetDocs, contactsOf, addContact, editContact, dropContact, telHref, routePath } from '../lib/unterwegs/abfahrt.js';
  import { FileDown, Phone, FileText, Plus, Pencil, Trash2, Check, House, Printer } from '@lucide/svelte';
  import '../lib/unterwegs/unterwegs.css';

  const today = localDay();
  const tripsQ = liveQuery(() => db.trips.toArray());
  const docsQ = liveQuery(() => db.docs.toArray());
  const contactsQ = liveQuery(() => db.settings.get(CONTACTS_KEY));
  const homeQ = liveQuery(() => db.settings.get('homePlace'));
  const chosen = (() => {
    try {
      return localStorage.getItem('pack.currentTrip');
    } catch {
      return null;
    }
  })();
  const trips = $derived($tripsQ ?? []);
  const trip = $derived(trips.find((x) => x.id === chosen && x.startDate) ?? nextTrip(trips, today) ?? trips.find((x) => x.id === chosen) ?? null);
  const day = $derived(trip ? Math.max(0, Math.min(stageCount(trip) - 1, dayIndex(trip, today))) : 0);
  const st = $derived(trip ? stage(trip, day, null, { today }) : null);
  const home = $derived(homeOf($homeQ?.value));
  const place = $derived(st?.from ?? trip?.place ?? trip?.route?.start ?? home ?? null);
  const sunset = $derived.by(() => {
    if (!st?.date || !place) return '';
    const s = sunTimes(st.date, place.lat, place.lon);
    return s ? new Date(s.set).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : '';
  });
  const dateText = $derived(st?.date ? new Date(`${st.date}T12:00:00`).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' }) : '');
  const path = $derived(routePath(trip?.route?.line));
  const docs = $derived(sheetDocs($docsQ ?? [], trip?.sheetDocs ?? []));
  const contacts = $derived(contactsOf($contactsQ?.value));
  const openChecks = $derived(trip ? (trip.ready ?? []).filter((r) => !r.itemId && !readyDone(r, trip)) : []);

  /* own emergency contacts */
  const saveContacts = (list) => db.settings.put({ key: CONTACTS_KEY, value: { contacts: list } });
  let adding = $state(false);
  let cName = $state('');
  let cPhone = $state('');
  let cMsg = $state('');
  let editing = $state(null);
  async function add(e) {
    e.preventDefault();
    const list = editing ? editContact(contacts, editing, { name: cName, phone: cPhone }) : addContact(contacts, { name: cName, phone: cPhone });
    if (!list) return (cMsg = t('Name and phone number, please.'));
    await saveContacts(list);
    cName = cPhone = cMsg = '';
    adding = false;
    editing = null;
  }
  async function drop(c) {
    if ((await askDelete({ title: t('Delete this contact?'), text: t('You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    const before = contacts;
    await deleteWithUndo({ run: () => saveContacts(dropContact(before, c.id)), undo: () => saveContacts(before), text: t('"{name}" deleted.', { name: c.name }), name: c.name });
  }

  /* the PDF */
  let pdfBusy = $state(false);
  let pdfMsg = $state('');
  async function pdf() {
    pdfBusy = true;
    pdfMsg = '';
    try {
      const { sheetPdf } = await import('../lib/unterwegs/abfahrtpdf.js');
      const facts = [
        [t('Day'), dateText],
        [t('Start'), [st?.start, trip.place?.name].filter(Boolean).join(' · ')],
        ...(st?.km ? [[t('Route'), `${num(st.km)} km · ${st.gainM ?? '–'} ${t('m up|short')} · ${t('Arrive about')} ${st.arrive}`]] : []),
        ...(sunset ? [[t('Sunset'), sunset]] : []),
        ...(home ? [[t('Home place'), home.name]] : []),
      ];
      const sections = [
        { head: t('Emergency numbers'), rows: [...EMERGENCY.map((x) => `${x.nr}  ${t(x.label)}`), ...contacts.map((c) => `${c.phone}  ${c.name}`)] },
        ...(docs.length ? [{ head: t('Tickets and papers'), rows: docs.map((d) => d.name) }] : []),
        ...(openChecks.length ? [{ head: t('Still open'), rows: openChecks.map((r) => t(r.label)) }] : []),
      ];
      const bytes = await sheetPdf({ title: t('Before you leave: {trip}', { trip: trip.title || t('Your trip') }), sub: t('Made with the Pack Generator on {date}', { date: new Date().toLocaleDateString(locale()) }), facts, path, sections });
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: `${(trip.title || 'Tour').replace(/[^\p{L}\d-]+/gu, '-')}-Abfahrt.pdf` });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      pdfMsg = t('The PDF is saved. Open it to print.');
    } catch {
      pdfMsg = t('The PDF could not be made. Try again.');
    } finally {
      pdfBusy = false;
    }
  }
  const openDoc = (d) => {
    if (!d.data) return;
    const w = window.open();
    if (w) w.location.href = d.data;
  };
</script>

<div class="abf" data-abfahrt>
  <PathHead crumbs={[{ label: t('On the way'), href: '#/ride' }]} title={t('Before you leave|sheet')} sub={trip ? trip.title : t('No trip yet')}>
    {#if trip}<button type="button" class="btn hi" onclick={pdf} disabled={pdfBusy} data-abfahrt-pdf><FileDown size={18} aria-hidden="true" />{pdfBusy ? t('Making …') : t('As PDF')}</button>{/if}
  </PathHead>
  {#if pdfMsg}<p class="tp-small" role="status">{pdfMsg}</p>{/if}
  <p class="tp-small tp-muted">{t('Everything on this page is on your device and works without internet. «As PDF» makes it to print.')}</p>

  {#if trip}
    <section class="card">
      <h2 class="sh">{t('The tour')}</h2>
      <div class="uw-kv">
        <div><b>{dateText || '–'}</b><span>{t('Day')}</span></div>
        <div><b class="num">{st?.start ?? '–'}</b><span>{t('Start')}{trip.place?.name ? ` · ${trip.place.name}` : ''}</span></div>
        {#if st?.km}<div><b class="num">{num(st.km)} km</b><span>{st.gainM ?? '–'} {t('m up|short')} · {t('Arrive about')} {st.arrive}</span></div>{/if}
        {#if sunset}<div><b class="num">{sunset}</b><span>{t('Sunset')}</span></div>{/if}
      </div>
      {#if path}
        <svg class="map" viewBox="0 0 300 160" role="img" aria-label={t('The line of the route')}>
          <path d={path.d} fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />
          <circle cx={path.start[0]} cy={path.start[1]} r="5" class="s" />
          <circle cx={path.end[0]} cy={path.end[1]} r="5" class="e" />
        </svg>
        <p class="uw-fine">{t('Filled dot: start · ring: finish. North is up.')}</p>
      {/if}
      {#if openChecks.length}<p class="tp-small">{t('Still open: {list}', { list: openChecks.map((r) => t(r.label)).join(', ') })}</p>{/if}
    </section>
  {/if}

  <section class="card">
    <h2 class="sh">{t('Emergency numbers')}</h2>
    <ul class="nrs">
      {#each EMERGENCY as x (x.nr)}
        <li><a class="btn nr" href={telHref(x.nr)}><Phone size={16} aria-hidden="true" /><b class="num">{x.nr}</b></a><span>{t(x.label)}</span></li>
      {/each}
    </ul>
    <h3 class="uw-h3">{t('Your emergency contacts')}</h3>
    {#if contacts.length}
      <ul class="nrs">
        {#each contacts as c (c.id)}
          <li>
            <a class="btn nr" href={telHref(c.phone)}><Phone size={16} aria-hidden="true" /><b class="num">{c.phone}</b></a><span class="grow">{c.name}</span>
            <button type="button" class="tp-icon-btn" aria-label={t('Change {name}', { name: c.name })} onclick={() => ((editing = c.id), (cName = c.name), (cPhone = c.phone), (adding = true))}><Pencil size={16} aria-hidden="true" /></button>
            <button type="button" class="tp-icon-btn" aria-label={t('Delete {name}', { name: c.name })} onclick={() => drop(c)}><Trash2 size={16} aria-hidden="true" /></button>
          </li>
        {/each}
      </ul>
    {:else if !adding}
      <p class="tp-small tp-muted">{t('Someone to call if something happens. Stays on this device and in your backup.')}</p>
    {/if}
    {#if adding}
      <form class="cf" onsubmit={add}>
        <input class="inp" bind:value={cName} placeholder={t('Name')} aria-label={t('Name')} />
        <input class="inp" bind:value={cPhone} type="tel" inputmode="tel" placeholder="+41 …" aria-label={t('Phone number')} />
        <div class="uw-row"><button type="submit" class="btn ink"><Check size={16} aria-hidden="true" />{t('Save')}</button><button type="button" class="btn" onclick={() => ((adding = false), (editing = null), (cName = cPhone = ''))}>{t('Cancel')}</button></div>
        {#if cMsg}<p class="tp-small" role="alert">{cMsg}</p>{/if}
      </form>
    {:else}
      <button type="button" class="tp-link" onclick={() => (adding = true)} data-contact-add><Plus size={14} aria-hidden="true" /> {t('Add a contact')}</button>
    {/if}
  </section>

  <section class="card">
    <h2 class="sh">{t('Tickets and papers')}</h2>
    {#if docs.length}
      <ul class="docs">
        {#each docs as d (d.id)}<li><button type="button" class="tp-link" onclick={() => openDoc(d)}><FileText size={16} aria-hidden="true" /> {d.name}</button></li>{/each}
      </ul>
    {:else}
      <p class="tp-small tp-muted">{t('Papers in Dokumente marked «in the packing list», or in the groups Travel, IDs or Insurance and emergency, show here.')}</p>
    {/if}
    <a class="tp-link" href="#/me/docs">{t('Open Dokumente')}</a>
  </section>

  <section class="card">
    <h2 class="sh"><House size={18} aria-hidden="true" /> {t('Home|way')}</h2>
    {#if home}
      <p>{t('Home place: {place}', { place: home.name })}</p>
      <a class="tp-link" href={sbbUrl(home, null)} target="_blank" rel="noopener noreferrer">{t('Timetable to {place} (SBB)', { place: home.name })}</a>
      <p class="uw-fine">{t('On the way, «Home» on On the way shows the next trains from where you are.')}</p>
    {:else}
      <p class="tp-small tp-muted">{t('Set your home place in Me › Settings, then the way home shows here.')}</p>
    {/if}
  </section>
  <p class="uw-fine"><Printer size={14} aria-hidden="true" /> {t('Tip: save the PDF on the phone too, then it opens even when the app does not.')}</p>
</div>

<style>
  .abf {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
    max-width: 760px;
  }
  .abf > p {
    margin: 0;
  }
  .sh {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 8px;
  }
  .map {
    display: block;
    width: 100%;
    max-width: 420px;
    height: auto;
    margin-top: 12px;
    border-radius: 12px;
    background: var(--paper-2);
    color: var(--ink);
  }
  .map .s {
    fill: currentColor;
  }
  .map .e {
    fill: var(--paper);
    stroke: currentColor;
    stroke-width: 3;
  }
  .nrs,
  .docs {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .nrs li {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .nrs .grow {
    flex: 1;
    min-width: 0;
  }
  .nr {
    min-width: 108px;
    justify-content: flex-start;
    gap: 6px;
  }
  .cf {
    display: grid;
    gap: 8px;
  }
</style>
