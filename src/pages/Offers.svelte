<script>
  /**
   * Termine buchen (mockups BU1, BU4, BU5; Noah 14.10.2026 21:31 «BU1–BU5 freigegeben»):
   * Ich › Angebote (#/me/offers) lists Noah's offers (Tennis-Lektion, geführte Tour, Velo-Service,
   * eigenes) and starts a new one; #/me/offers/<id> is one offer: the week with its free and booked
   * times (+ opens a time), the link for the people who book, the rules and who has booked.
   * Answers: 1a booked at once, 2b payment per offer (on site or online), 3 a und b the new booking on
   * Heute and here, 4 a und b people cancel up to 24 h before, Noah any time, 8a all three kinds now.
   * Names and contacts are fetched from the server and shown, never stored on the device.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import TennisTabs from '../lib/booking/TennisTabs.svelte';
  import { backClose } from '../lib/ui/backclose.js';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import { localDay } from '../lib/localday.js';
  import { KINDS, WISH_PRICES, kindOf, newOffer, shareUrl, mondayOf, weekDays, weekNo, addDays, slotsOn, newSlots, bookedBySlot, slotState, chf, dayOf, timeOf, contactHref, holdsPlace, isOpenRequest, waitingFree, invoiceDraft, invoiceDraftMany, toInvoice, freeAlternatives, mailToAll } from '../lib/booking/model.js';
  import { OFFERS_KEY, SEEN_KEY, createOffer, saveOffer, ownerBookings, ownerCancel, answerBooking, cancelSlot, errorText } from '../lib/booking/client.js';
  import { Volleyball, Tent, Wrench, CalendarDays, Link2, Copy, MessageCircle, ChevronLeft, ChevronRight, Clock, Users, Repeat, CreditCard, Bell, X, Plus, MapPin, FileImage } from '@lucide/svelte';
  import { rememberCustomer, listCustomers, saveCustomers, rateOf, packCover } from '../lib/booking/customers.js';
  import { applyVouchers } from '../lib/booking/vouchers.js';
  import { listOutcomes, setOutcome } from '../lib/booking/outcomes.js';
  import { listWaiting, addWaiting, removeWaiting } from '../lib/booking/waitlist.js';
  import { isTrial, hasTrial, canAddTrial, trialPrice, trialSlots, withoutTrial, earlierTrial, TRIAL_KEY } from '../lib/booking/trial.js';
  import { listInvoices, setPrefill, bookingIdsOf } from '../lib/pay/invoices.js';
  import { REMINDER_KEY, REMINDER_WORDS, REMINDER_WORDS_DE, reminderSetting, reminderMessage, saveReminder } from '../lib/booking/reminder.js';
  import '../lib/ich/ich.css';

  let { id = '' } = $props();

  const ICONS = { tennis: Volleyball, tent: Tent, wrench: Wrench, cal: CalendarDays };
  const offersQ = liveQuery(async () => (await db.settings.get(OFFERS_KEY))?.value ?? []);
  const offers = $derived($offersQ ?? null);
  const mine = $derived((offers ?? []).find((o) => o.id === id) ?? null);
  const today = localDay();

  let busy = $state(false);
  let error = $state('');
  let note = $state('');
  async function keep(list) {
    await db.settings.put({ key: OFFERS_KEY, value: JSON.parse(JSON.stringify(list)) });
  }

  /* ---------- the list (BU5) ---------- */
  async function start(kind) {
    if (busy) return;
    busy = true;
    error = '';
    const offer = newOffer(kind, t);
    const r = await createOffer(offer);
    busy = false;
    if (!r.ok) return (error = t(errorText(r.code)));
    await keep([...(offers ?? []), { id: r.id, owner: r.owner, offer: { ...offer, id: r.id } }]);
    location.hash = `#/me/offers/${r.id}`;
  }
  const payWord = (o) => (o.pay === 'online' ? t('pay online') : t('pay on site'));
  const lengthWord = (o) => (o.minutes >= 1440 && o.minutes % 1440 === 0 ? tn(o.minutes / 1440, '{n} day', '{n} days') : t('{n} min', { n: o.minutes }));
  const typesWord = (o) => o.types.map((x) => `${x.label} ${x.places > 1 ? t('up to {n}', { n: x.places }) : ''}`.trim()).join(' · ');
  const fmtDay = (day, opts = { weekday: 'short', day: 'numeric', month: 'numeric' }) => new Date(`${day}T12:00:00`).toLocaleDateString(locale(), opts);
  const fmtAt = (at) => `${fmtDay(dayOf(at))} · ${timeOf(at)}`;

  /* ---------- one offer (BU1, BU4) ---------- */
  let bookings = $state(null); // from the server, only while the page is open
  let loadErr = $state('');
  async function loadBookings() {
    if (!mine) return;
    const r = await ownerBookings(mine.id, mine.owner);
    if (!r.ok) {
      loadErr = t(errorText(r.code));
      return;
    }
    loadErr = '';
    bookings = r.bookings;
    // Seen here: the note on Heute goes away (3 a und b).
    const seen = (await db.settings.get(SEEN_KEY))?.value ?? [];
    const ids = [...new Set([...seen, ...r.bookings.map((b) => b.id)])].slice(-500);
    if (ids.length !== seen.length) await db.settings.put({ key: SEEN_KEY, value: ids });
  }
  let loadedFor = '';
  $effect(() => {
    if (mine && loadedFor !== mine.id) {
      loadedFor = mine.id;
      loadBookings();
    }
  });
  const booked = $derived(bookedBySlot(bookings ?? []));
  const upcoming = $derived((bookings ?? []).filter((b) => b.at && dayOf(b.at) >= today));

  /* lessons that are over: the invoice is prepared from the booking (Noah 03.11.2026 «3b»; nothing is sent here) */
  const invoicesQ = liveQuery(() => listInvoices());
  const invoices = $derived($invoicesQ ?? []);
  const nowAt = () => {
    const d = new Date();
    return `${localDay()}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const lessonsOver = $derived(toInvoice(bookings ?? [], invoices, nowAt()).sort((a, b) => String(b.at).localeCompare(String(a.at))));
  /* a lesson on a customer's lesson card needs no invoice of its own (Noah 04.11.2026 «5a») */
  let clistAll = $state([]);
  $effect(() => {
    bookings;
    listCustomers().then((l) => (clistAll = l));
  });
  const cover = $derived(packCover(clistAll, bookings ?? []));
  const invoiceOf = (b) => invoices.find((x) => bookingIdsOf(x).includes(b.id)) ?? null;
  /* late cancel and no-show (Noah 04.11.2026 «3a»): marked per lesson, only on this device; they change the amount in the draft */
  let outcomes = $state({});
  listOutcomes().then((o) => (outcomes = o));
  const outcomeOf = (b) => outcomes[b.id] ?? 'held';
  const outcomeTag = (o) => (o === 'late' ? t('cancelled late') : o === 'noshow' ? t('did not come') : '');
  async function markOutcome(b, value) {
    outcomes = await setOutcome(b.id, value);
  }
  let picked = $state([]); // booking ids ticked for one invoice
  const pickedLessons = $derived(lessonsOver.filter((b) => picked.includes(b.id)));
  const toggle = (b) => (picked = picked.includes(b.id) ? picked.filter((x) => x !== b.id) : [...picked, b.id]);
  async function writeOne(items) {
    const o = { ...mine.offer, id: mine.id };
    const clist = await listCustomers();
    const v = applyVouchers(invoiceDraftMany(o, [...items].sort((x, y) => String(x.at).localeCompare(String(y.at))).map((b) => ({ slot: o.slots.find((x) => x.id === b.slot), booking: b, outcome: outcomeOf(b), tag: outcomeTag(outcomeOf(b)) })), (b) => fmtAt(b.at), (name) => rateOf(clist, name)), clist, items.length);
    if (!setPrefill(v.draft)) return;
    if (v.used.length) await saveCustomers(v.customers);
    picked = [];
    location.hash = '#/me/pay/invoices/new';
  }
  async function writeInvoice(b) {
    const s = mine.offer.slots.find((x) => x.id === b.slot);
    const clist = await listCustomers();
    const v = applyVouchers(invoiceDraft({ ...mine.offer, id: mine.id }, s, b, fmtAt(b.at), rateOf(clist, b.name), outcomeOf(b), outcomeTag(outcomeOf(b))), clist, 1);
    if (!setPrefill(v.draft)) return;
    if (v.used.length) await saveCustomers(v.customers);
    location.hash = '#/me/pay/invoices/new';
  }

  let monday = $state(mondayOf(localDay()));
  const days = $derived(weekDays(monday));
  const typeOf = (o, s) => o.types.find((x) => x.key === s.type) ?? o.types[0];

  async function save(next) {
    busy = true;
    error = '';
    const r = await saveOffer(mine.id, mine.owner, next);
    busy = false;
    if (!r.ok) {
      error = t(errorText(r.code));
      return false;
    }
    await keep((offers ?? []).map((o) => (o.id === mine.id ? { ...o, offer: { ...r.offer } } : o)));
    return true;
  }

  // the link (BU1 right)
  const link = $derived(mine ? shareUrl(mine.id) : '');
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      note = t('Link copied.');
    } catch {
      note = link;
    }
  }
  const whatsapp = $derived(`https://wa.me/?text=${encodeURIComponent(`${mine?.offer.title ?? ''}: ${t('book a free time here')} ${link}`)}`);

  /* add times (the + of a day) */
  let addOpen = $state(null); // { day }
  let addTime = $state('18:00');
  let addType = $state('');
  let addWeekly = $state(true);
  let addVenue = $state('');
  let addDlg = $state();
  function openAdd(day) {
    addType = mine.offer.types[0].key;
    addVenue = mine.offer.venues?.[0] ?? '';
    addOpen = { day };
  }
  $effect(() => {
    if (addOpen && addDlg && !addDlg.open) addDlg.showModal();
  });
  async function addSlots(e) {
    e.preventDefault();
    if (!/^\d{2}:\d{2}$/.test(addTime)) return;
    const add = newSlots(mine.offer, { day: addOpen.day, time: addTime, type: addType, venue: addVenue, weeks: addWeekly ? 8 : 1 });
    if (await save({ ...mine.offer, slots: [...mine.offer.slots, ...add] })) addDlg.close();
  }

  /* one time: who comes, write to all, cancel (BU4) */
  let slotOpen = $state(null); // the slot
  let slotDlg = $state();
  let told = $state(null); // after cancelling a time: the people to tell
  $effect(() => {
    if (slotOpen && slotDlg && !slotDlg.open) slotDlg.showModal();
  });
  const here = $derived(slotOpen ? (bookings ?? []).filter((b) => b.slot === slotOpen.id) : []);
  const people = $derived(here.filter(holdsPlace));
  /* waiting list (Noah 04.11.2026 «7a»): people who wait for this time; only on this device */
  let waiting = $state([]);
  listWaiting().then((l) => (waiting = l));
  let waitName = $state('');
  let waitContact = $state('');
  const waitHere = $derived(slotOpen ? waiting.filter((w) => w.offer === id && w.slot === slotOpen.id) : []);
  async function addWait() {
    if (!slotOpen || !waitName.trim()) return;
    waiting = await addWaiting({ offer: id, slot: slotOpen.id, name: waitName, contact: waitContact });
    waitName = '';
    waitContact = '';
  }
  async function dropWait(w) {
    waiting = await removeWaiting(w.id);
  }
  const freeText = (s, w) => t('Hello {name}! A place is free again: {title} on {when}. Do you want it? Just answer me.', { name: w.name, title: mine?.offer.title ?? '', when: fmtAt(s.at) });
  const asking = $derived(here.filter(isOpenRequest));
  const everyone = $derived(here.filter((b) => b.status !== 'declined'));
  let replied = $state(null); // { b, decision }: after an answer, the message to send
  /* trial lesson (Noah 04.11.2026 «10a»): once per person; a second request gets the offer of a normal lesson */
  const usedTrial = (b) => (mine ? earlierTrial(mine.offer, bookings ?? [], b) : null);
  const replyText = (s, decision, b = null) => decision === 'confirm'
    ? t('{title} on {when} is confirmed. See you there!', { title: mine?.offer.title ?? '', when: fmtAt(s.at) })
    : b && usedTrial(b)
      ? t('{title} on {when}: the trial lesson is once per person. I would be happy to see you for a normal lesson. Please pick a time with the same link.', { title: mine?.offer.title ?? '', when: fmtAt(s.at) })
      : t('{title} on {when} does not work for me. Please pick another time with the same link.', { title: mine?.offer.title ?? '', when: fmtAt(s.at) });
  async function answer(b, decision) {
    busy = true;
    error = '';
    const r = await answerBooking(mine.id, mine.owner, b.id, decision);
    busy = false;
    if (!r.ok) return (error = t(errorText(r.code)));
    replied = { b, decision };
    if (decision === 'confirm') await rememberCustomer(b);
    await loadBookings();
  }
  /* wish requests (Noah 08.11.2026 «1c»): no time of their own; Noah confirms one of the wish times and writes to the parents himself */
  const wishes = $derived((bookings ?? []).filter((b) => b.wish && b.status === 'requested'));
  const wishDone = $derived((bookings ?? []).filter((b) => b.wish && b.status === 'confirmed' && b.pick != null && dayOf(b.wish.wishes[b.pick] ?? '') >= today));
  const SOURCE_NAMES = { flyer: 'Flyer', google: 'Google', friends: 'Recommendation', club: 'Club', other: 'Other' };
  const sourceName = (k) => t(SOURCE_NAMES[k] ?? 'Other');
  let wishReplied = $state(null); // { b, at }
  async function answerWish(b, decision, pick = null) {
    busy = true;
    error = '';
    const r = await answerBooking(mine.id, mine.owner, b.id, decision, pick);
    busy = false;
    if (!r.ok) return (error = t(errorText(r.code)));
    if (decision === 'confirm') {
      wishReplied = { b, at: b.wish.wishes[pick] };
      await rememberCustomer(b);
    }
    await loadBookings();
  }
  const priceLine = (p) => t('CHF {perKid} per child · CHF {total} in all · {where}', { perKid: chf(p.perKid), total: chf(p.total), where: p.hall ? t('hall price') : t('outdoor price') });
  const wishText = (r) => {
    const p = r.b.wish.price;
    const base = { name: r.b.name, title: mine?.offer.title ?? '', when: fmtAt(r.at) };
    return p ? t('Hello {name}! The lesson is booked: {title} on {when}. Price: CHF {perKid} per child. See you then!', { ...base, perKid: chf(p.perKid) }) : t('Hello {name}! The lesson is booked: {title} on {when}. See you then!', base);
  };
  /* rain or other reasons (Noah 04.11.2026 «1a»): the message offers free times Noah picks; nothing is sent here */
  const alternativesOf = (s) => (mine ? freeAlternatives(mine.offer, bookings ?? [], s.id, s.at > nowAt() ? s.at : nowAt(), 5) : []);
  let unpicked = $state([]); // ids of offered times Noah unticked (the first three start ticked)
  let pickedMore = $state([]); // ids of the 4th and 5th time Noah ticked
  const tickedAlts = (s) => alternativesOf(s).filter((a, i) => (i < 3 ? !unpicked.includes(a.id) : pickedMore.includes(a.id)));
  function flipAlt(a, i) {
    if (i < 3) unpicked = unpicked.includes(a.id) ? unpicked.filter((x) => x !== a.id) : [...unpicked, a.id];
    else pickedMore = pickedMore.includes(a.id) ? pickedMore.filter((x) => x !== a.id) : [...pickedMore, a.id];
  }
  const tellText = (s) => {
    const alts = tickedAlts(s);
    const base = t('{title} on {when} is cancelled. Sorry! You can book another time with the same link.', { title: mine?.offer.title ?? '', when: fmtAt(s.at) });
    return alts.length ? `${base} ${t('Free times:')} ${alts.map((a) => fmtAt(a.at)).join('; ')}.` : base;
  };
  const tellSubject = (s) => t('Cancelled: {title}, {when}', { title: mine?.offer.title ?? '', when: fmtAt(s.at) });
  const mailHref = (b, s) => (/@/.test(b.contact ?? '') ? contactHref(b.contact, tellText(s)) : null);
  const helloText = (s) => t('About {title} on {when}:', { title: mine?.offer.title ?? '', when: fmtAt(s.at) });
  let askCancel = $state(false);
  async function dropSlot() {
    const s = slotOpen;
    if (everyone.length) {
      busy = true;
      const r = await cancelSlot(mine.id, mine.owner, s.id);
      busy = false;
      if (!r.ok) return (error = t(errorText(r.code)));
      await keep((offers ?? []).map((o) => (o.id === mine.id ? { ...o, offer: { ...o.offer, slots: o.offer.slots.filter((x) => x.id !== s.id) } } : o)));
      told = { slot: s, people: r.bookings };
      await loadBookings();
    } else if (!(await save({ ...mine.offer, slots: mine.offer.slots.filter((x) => x.id !== s.id) }))) return;
    askCancel = false;
    if (!told) slotDlg.close();
  }
  async function dropOne(b) {
    const r = await ownerCancel(mine.id, mine.owner, b.id);
    if (!r.ok) return (error = t(errorText(r.code)));
    await loadBookings();
  }

  /* reminder to the customers (Noah 04.11.2026 «2a»/«2b», 08.11.2026): the switch for Heute and the text of the message */
  const reminderQ = liveQuery(async () => (await db.settings.get(REMINDER_KEY))?.value);
  const reminder = $derived(reminderSetting($reminderQ));
  const sampleOf = (text) => reminderMessage({ text, name: 'Mia', title: mine?.offer.title ?? '', day: t('tomorrow'), time: '17:00', place: mine?.offer.venues?.[0] || mine?.offer.place || '', hours: mine?.offer.cancelHours ?? null }, t);
  let remOpen = $state(false);
  let remDlg = $state();
  let remText = $state('');
  $effect(() => {
    if (remOpen && remDlg && !remDlg.open) remDlg.showModal();
  });
  function openReminder() {
    remText = reminder.text;
    remOpen = true;
  }
  const flipReminder = (on) => saveReminder({ ...reminder, on });
  async function saveReminderText(e) {
    e.preventDefault();
    await saveReminder({ ...reminder, text: remText.trim() });
    remDlg.close();
  }

  /* the rules (BU1 «So wird gebucht», Ändern) */
  let rulesOpen = $state(false);
  let rulesDlg = $state();
  let draft = $state(null);
  $effect(() => {
    if (rulesOpen && rulesDlg && !rulesDlg.open) rulesDlg.showModal();
  });
  function openRules() {
    const o = mine.offer;
    draft = { title: o.title, place: o.place, venuesText: (o.venues ?? []).join(', '), mode: o.mode ?? 'instant', minutes: o.minutes, pay: o.pay, cancelHours: o.cancelHours, types: o.types.map((x) => ({ ...x, chf: chf(x.price) })), trial: hasTrial(o), prices: priceTexts(o.prices ?? WISH_PRICES), hall: [...(o.hallVenues ?? [])] };
    rulesOpen = true;
  }
  /* wish offers (Noah 08.11.2026 «1a»): the price per child by number of children, outdoors and in the hall, and which places are halls */
  const priceTexts = (p) => ({ out: p.out.map((x) => chf(x)), hall: p.hall.map((x) => chf(x)) });
  const priceRappen = (texts) => texts.map((x) => Math.max(0, Math.min(1_000_000, Math.round(Number(String(x).replace(',', '.')) * 100) || 0)));
  const draftVenues = $derived(draft ? draft.venuesText.split(',').map((v) => v.trim()).filter(Boolean).slice(0, 4) : []);
  const toggleHall = (v) => (draft.hall = draft.hall.includes(v) ? draft.hall.filter((x) => x !== v) : [...draft.hall, v]);
  /* the switch «Trial lesson»: the kind is added to the draft with half the price of the first kind, or taken out */
  function flipTrial(on) {
    draft.trial = on;
    if (!on) return (draft.types = draft.types.filter((x) => !isTrial(x)));
    if (draft.types.some(isTrial)) return;
    const first = draft.types[0];
    const price = trialPrice({ types: [{ key: first.key, price: Math.max(0, Math.round(Number(String(first.chf).replace(',', '.')) * 100) || 0) }] });
    draft.types = [...draft.types, { key: TRIAL_KEY, label: t('Trial lesson'), places: 1, price, chf: chf(price) }];
  }
  const trialRoom = $derived(!!mine && (hasTrial(mine.offer) || canAddTrial(mine.offer)) && ['tennis', 'own'].includes(mine.offer.kind));
  const trialMoves = $derived(mine && draft && !draft.trial && hasTrial(mine.offer) ? trialSlots(mine.offer).length : 0);
  async function saveRules(e) {
    e.preventDefault();
    const types = draft.types.map((x) => ({ key: x.key, label: x.label.trim(), places: Math.max(1, Math.min(50, Math.round(Number(x.places) || 1))), price: Math.max(0, Math.round(Number(String(x.chf).replace(',', '.')) * 100) || 0) }));
    // a trial kind switched off: its times become times of the first other kind, none is lost
    const base = !draft.trial && hasTrial(mine.offer) ? withoutTrial(mine.offer) : mine.offer;
    const next = { ...base, title: draft.title.trim() || mine.offer.title, place: draft.place.trim(), mode: draft.mode, venues: draft.venuesText.split(',').map((v) => v.trim()).filter(Boolean).slice(0, 4), minutes: Math.max(0, Math.round(Number(draft.minutes) || 0)), pay: draft.pay, cancelHours: Math.max(0, Math.round(Number(draft.cancelHours) || 0)), types };
    if (draft.mode === 'wish') {
      next.prices = { out: priceRappen(draft.prices.out), hall: priceRappen(draft.prices.hall) };
      next.hallVenues = draft.hall.filter((v) => next.venues.includes(v));
    } else {
      delete next.prices;
      delete next.hallVenues;
    }
    if (await save(next)) rulesDlg.close();
  }
</script>

{#if !id}
  <!-- BU5: Ich › Angebote -->
  <div class="ich-page offers">
    <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Tennis')} sub={t('Offers and customers in one place: open free times, share the link, people book themselves.')} />
    <p class="of-band" role="note"><span class="pill warn">{t('Test|offers')}</span> {t('Online payment runs in test mode only; no real money moves.')}</p>
    {#if error}<p class="err" role="alert">{error}</p>{/if}
    <TennisTabs current="offers" />
    {#if offers?.length}
      <ul class="of-kinds">
        {#each offers as o (o.id)}
          {@const Icon = ICONS[kindOf(o.offer.kind).icon]}
          {@const next = o.offer.slots.filter((s) => dayOf(s.at) >= today).slice(0, 2)}
          <li>
            <a class="card of-kc" href={`#/me/offers/${o.id}`}>
              <span class="of-ib"><Icon size={22} aria-hidden="true" /></span>
              <b>{o.offer.title}</b>
              <small>{lengthWord(o.offer)} · {typesWord(o.offer)} · {payWord(o.offer)}</small>
              {#each next as s (s.id)}<span class="of-lr"><span>{fmtAt(s.at)}</span><small>{typeOf(o.offer, s).label}</small></span>{:else}<span class="of-lr"><span class="muted">{t('No free times yet')}</span></span>{/each}
            </a>
          </li>
        {/each}
      </ul>
    {/if}
    <section class="ich-sec" aria-labelledby="of-new-h">
      <div class="ich-h"><div><h2 id="of-new-h">{t('New offer')}</h2></div></div>
      <div class="card">
        <p class="of-p">{t('For each offer you choose: pay on site or online.')}</p>
        <div class="of-chips">
          {#each KINDS as k (k.kind)}
            {@const Icon = ICONS[k.icon]}
            <button type="button" class="btn" disabled={busy} onclick={() => start(k.kind)}><Icon size={18} aria-hidden="true" />{t(k.label)}</button>
          {/each}
        </div>
      </div>
    </section>
  </div>
{:else if offers && !mine}
  <div class="ich-page offers">
    <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Tennis'), href: '#/me/tennis' }]} title={t('Offer not found')} sub={t('It is not on this device. Load the backup that has it, or start a new offer.')} />
  </div>
{:else if mine}
  {@const o = mine.offer}
  <!-- BU1: the free times of one offer; BU4: who booked a time -->
  <div class="ich-page offers">
    <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Tennis'), href: '#/me/tennis' }]} title={o.title} sub={t('When you have time, people book themselves.')} />
    {#if error}<p class="err" role="alert">{error}</p>{/if}
    <div class="ich-cols">
      <div class="ich-main">
        <section class="card of-week" aria-labelledby="of-week-h">
          <div class="of-wh">
            <h2 id="of-week-h">{t('Free times · week {n}', { n: weekNo(monday) })}</h2>
            <span class="of-nav">
              <button type="button" class="ibtn" aria-label={t('Week before')} onclick={() => (monday = addDays(monday, -7))}><ChevronLeft size={18} aria-hidden="true" /></button>
              <button type="button" class="ibtn" aria-label={t('Next week')} onclick={() => (monday = addDays(monday, 7))}><ChevronRight size={18} aria-hidden="true" /></button>
            </span>
          </div>
          <div class="of-slots">
            {#each days as day (day)}
              <div class="of-dc" data-day={day}>
                <div class="of-dh"><b>{fmtDay(day, { weekday: 'short' })}</b>{fmtDay(day, { day: 'numeric', month: 'numeric' })}</div>
                {#each slotsOn(o, day) as s (s.id)}
                  {@const ty = typeOf(o, s)}
                  {@const n = booked[s.id] ?? 0}
                  {@const st = slotState(ty.places, n)}
                  {@const who = ty.places === 1 && n ? (bookings ?? []).find((b) => b.slot === s.id && holdsPlace(b))?.name : ''}
                  {@const ask = (bookings ?? []).filter((b) => b.slot === s.id && isOpenRequest(b)).length}
                  <button type="button" class="of-sl {st}" data-slot={s.id} onclick={() => (slotOpen = s)}>
                    <b>{timeOf(s.at)}</b>
                    {#if who}{who}{:else if ty.places > 1}{ty.label} · {t('{n} of {m}', { n, m: ty.places })}{:else}{t('free')}{/if}
                    {#if s.venue}<small>{s.venue}</small>{/if}
                    {#if ask}<small class="of-ask-n">{tn(ask, '{n} request', '{n} requests')}</small>{/if}
                  </button>
                {/each}
                {#if day >= today}<button type="button" class="of-sl add" aria-label={t('Open a time on {day}', { day: fmtDay(day) })} onclick={() => openAdd(day)}><Plus size={16} aria-hidden="true" /></button>{/if}
              </div>
            {/each}
          </div>
          <p class="of-legend"><span><i class="free"></i>{t('free')}</span> <span><i class="part"></i>{t('partly booked')}</span> <span><i class="full"></i>{t('booked')}</span> <span>{t('+ opens a time')}</span></p>
        </section>

        {#if lessonsOver.length}
          <section class="card" aria-labelledby="of-inv-h" data-lessons-over>
            <div class="of-wh"><h2 id="of-inv-h">{t('Lesson done? Write the invoice')}</h2><small class="muted">{tn(lessonsOver.length, '{n} lesson', '{n} lessons')}</small></div>
            <p class="muted">{t('The invoice is prepared with name, amount and lesson. You check it and send it yourself.')}</p>
            <p class="muted">{t('Cancelled late counts half, no-show counts the full price. You can change the amount in the form.')}</p>
            <ul class="of-list">
              {#each lessonsOver as b (b.id)}
                <li class="of-pp of-lo"><label class="of-pick"><input type="checkbox" checked={picked.includes(b.id)} onchange={() => toggle(b)} aria-label={t('Add to one invoice: {name}, {when}', { name: b.name, when: fmtAt(b.at) })} /><span>{b.name}<small>{fmtAt(b.at)}</small></span></label>
                  <select class="inp of-out" data-outcome aria-label={t('What happened: {name}, {when}', { name: b.name, when: fmtAt(b.at) })} value={outcomeOf(b)} onchange={(e) => markOutcome(b, e.currentTarget.value)}><option value="held">{t('Took place')}</option><option value="late">{t('Cancelled late')}</option><option value="noshow">{t('No-show')}</option></select>
                  {#if cover[b.id]}<small class="muted" data-on-card>{t('On the card: lesson {n} of {size}', cover[b.id])}</small>{/if}
                  <button type="button" class={cover[b.id] ? 'btn sm' : 'btn hi sm'} onclick={() => writeInvoice(b)}>{t('Prepare invoice')}</button></li>
              {/each}
            </ul>
            {#if lessonsOver.length > 1}
              <p class="muted">{t('Tick several lessons to put them on one invoice, for example at the end of the month.')}</p>
              {#if pickedLessons.length > 1}<button type="button" class="btn hi" data-one-invoice onclick={() => writeOne(pickedLessons)}>{tn(pickedLessons.length, 'One invoice for {n} lesson', 'One invoice for {n} lessons')}</button>{/if}
            {/if}
          </section>
        {/if}

        {#if wishes.length || wishDone.length || wishReplied}
          <section class="card" aria-labelledby="of-wish-h" data-wishes>
            <div class="of-wh"><h2 id="of-wish-h">{t('Wish requests')}</h2><small class="muted">{tn(wishes.length, '{n} open', '{n} open')}</small></div>
            {#if error}<p class="err" role="alert">{error}</p>{/if}
            {#if wishReplied}
              {@const href = contactHref(wishReplied.b.contact, wishText(wishReplied))}
              <p role="status">{t('Confirmed. Now tell {name}:', { name: wishReplied.b.name })}</p>
              <p class="of-note">{wishText(wishReplied)}</p>
              <div class="of-foot">{#if href}<a class="btn hi" {href}>{t('Write')}</a>{/if}<button type="button" class="btn" onclick={() => (wishReplied = null)}>{t('Done')}</button></div>
            {/if}
            {#if wishes.length}
              <p class="muted">{t('Book the court first, then confirm the time that fits. You write to the parents yourself.')}</p>
              <ul class="of-list">
                {#each wishes as b (b.id)}
                  <li class="of-pp of-rqrow" data-wish>
                    <span><b>{b.name}</b><small>{b.contact}</small>
                      <small>{tn(b.wish.kids, '{n} child', '{n} children')}{b.wish.kidNames ? `: ${b.wish.kidNames}` : ''}</small>
                      {#if b.wish.venues.length}<small>{t('Places|venues')}: {b.wish.venues.join(' · ')}</small>{/if}
                      {#if b.wish.price}<small data-wish-price><b>{priceLine(b.wish.price)}</b></small>{/if}
                      {#if b.wish.source}<small>{t('Found me through')}: {sourceName(b.wish.source)}</small>{/if}
                      {#if b.note}<small class="of-note">{b.note}</small>{/if}</span>
                    <span class="of-two">
                      {#each b.wish.wishes as w, i (w)}<button type="button" class="btn hi sm" disabled={busy} onclick={() => answerWish(b, 'confirm', i)} data-wish-pick={i}>{t('Confirm {when}', { when: fmtAt(w) })}</button>{/each}
                      <button type="button" class="btn sm" disabled={busy} onclick={() => answerWish(b, 'decline')}>{t('Decline')}</button>
                    </span>
                  </li>
                {/each}
              </ul>
            {/if}
            {#if wishDone.length}
              <h3 class="of-rq">{t('Confirmed')}</h3>
              <ul class="of-list">
                {#each wishDone as b (b.id)}<li class="of-pp"><span><b>{fmtAt(b.wish.wishes[b.pick])}</b><small>{b.name} · {tn(b.wish.kids, '{n} child', '{n} children')}</small></span></li>{/each}
              </ul>
            {/if}
          </section>
        {/if}

        <section class="card" aria-labelledby="of-bk-h">
          <div class="of-wh"><h2 id="of-bk-h">{t('Booked')}</h2>{#if bookings}<small class="muted">{tn(upcoming.length, '{n} ahead', '{n} ahead')}</small>{/if}</div>
          {#if loadErr}<p class="err" role="alert">{loadErr}</p>
          {:else if !bookings}<p class="muted">{t('Loading…')}</p>
          {:else if !upcoming.length}<p class="muted">{t('Nobody has booked yet.')}</p>
          {:else}
            <ul class="of-list">
              {#each upcoming as b (b.id)}
                {@const s = o.slots.find((x) => x.id === b.slot)}
                <li><button type="button" class="of-row" onclick={() => s && (slotOpen = s)}><span><b>{fmtAt(b.at)}</b><small>{b.name}{s ? ` · ${typeOf(o, s).label}` : ''}{isOpenRequest(b) ? ` · ${t('request')}` : ''}</small></span><ChevronRight size={16} aria-hidden="true" /></button></li>
              {/each}
            </ul>
          {/if}
        </section>
      </div>
      <div class="ich-side">
        <section class="card" aria-labelledby="of-link-h">
          <div class="of-wh"><h2 id="of-link-h">{t('Link for the people who book')}</h2><small class="muted">{t('no app, no account')}</small></div>
          <p class="of-link"><Link2 size={18} aria-hidden="true" /><span class="u">{link}</span></p>
          <div class="of-two">
            <a class="btn" href={whatsapp} target="_blank" rel="noopener"><MessageCircle size={18} aria-hidden="true" />{t('Send via WhatsApp')}</a>
            <button type="button" class="btn" onclick={copy}><Copy size={18} aria-hidden="true" />{t('Copy link')}</button>
          </div>
          {#if note}<p class="hint" role="status">{note}</p>{/if}
          <p class="of-fine">{t('They see only free times, never the names of others.')}</p>
          {#if mine.offer.kind === 'tennis'}<a class="btn" data-flyer-from-offer href={`#/me/tennis/flyer?o=${mine.id}`}><FileImage size={18} aria-hidden="true" />{t('Make a flyer')}</a>{/if}
        </section>

        <section class="card" aria-labelledby="of-rules-h">
          <div class="of-wh"><h2 id="of-rules-h">{t('How booking works')}</h2><button type="button" class="lkb" onclick={openRules}>{t('Change')}</button></div>
          <ul class="of-rules">
            <li><Clock size={18} aria-hidden="true" /><b>{t('Length')}</b><span>{lengthWord(o)}</span></li>
            <li><Users size={18} aria-hidden="true" /><b>{t('Places|seats')}</b><span>{o.types.map((x) => `${x.label} ${x.places}`).join(' · ')}</span></li>
            <li><CreditCard size={18} aria-hidden="true" /><b>{t('Price')}</b><span>{o.types.map((x) => `${x.label} ${chf(x.price)} CHF`).join(' · ')}</span></li>
            <li><Bell size={18} aria-hidden="true" /><b>{t('Booking')}</b><span>{o.mode === 'wish' ? t('wish times, you answer within 24 h') : o.mode === 'request' ? t('request, you answer within 24 h') : t('booked at once')}</span></li>
            <li><Repeat size={18} aria-hidden="true" /><b>{t('Payment')}</b><span>{o.pay === 'online' ? t('online (test mode)') : t('on site (cash, TWINT)')}</span></li>
            <li><Bell size={18} aria-hidden="true" /><b>{t('Cancelling')}</b><span>{t('people up to {n} h before · you any time', { n: o.cancelHours })}</span></li>
            {#if o.venues?.length}<li><MapPin size={18} aria-hidden="true" /><b>{t('Places|venues')}</b><span>{o.venues.join(' · ')}</span></li>{:else if o.place}<li><MapPin size={18} aria-hidden="true" /><b>{t('Place|venue')}</b><span>{o.place}</span></li>{/if}
          </ul>
        </section>

        <section class="card" aria-labelledby="of-rem-h" data-reminder-card>
          <div class="of-wh"><h2 id="of-rem-h">{t('Reminder to the customers')}</h2><button type="button" class="lkb" onclick={openReminder}>{t('Own text')}</button></div>
          <label class="of-check"><input type="checkbox" checked={reminder.on} onchange={(e) => flipReminder(e.currentTarget.checked)} data-reminder-switch /> {t('Remind me the day before and on the day')}</label>
          <p class="of-note" data-reminder-sample>{sampleOf(reminder.text)}</p>
          <p class="of-fine">{t('On the Today page a button opens your message app with this text ready. You send it yourself; the app sends nothing. It is the same text for all your offers.')}</p>
        </section>
      </div>
    </div>
  </div>

  {#if addOpen}
    <dialog class="sheet from-below of-sheet" bind:this={addDlg} use:backClose={() => addDlg.close()} onclose={() => (addOpen = null)} aria-labelledby="of-add-h">
      <form onsubmit={addSlots}>
        <div class="of-sh"><h2 id="of-add-h">{t('Open a time')}</h2><button type="button" class="ibtn" aria-label={t('Close')} onclick={() => addDlg.close()}><X size={20} aria-hidden="true" /></button></div>
        <p class="muted">{fmtDay(addOpen.day, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <label class="lbl" for="of-time">{t('Start')}</label>
        <input id="of-time" class="inp" type="time" bind:value={addTime} required />
        {#if o.types.length > 1}<p class="lbl">{t('Kind')}</p><Seg options={o.types.map((x) => ({ key: x.key, name: `${x.label} · ${x.places}` }))} value={addType} onchange={(k) => (addType = k)} label={t('Kind')} />{/if}
        {#if o.venues?.length > 1}<p class="lbl">{t('Place')}</p><Seg options={o.venues.map((v) => ({ key: v, name: v }))} value={addVenue} onchange={(k) => (addVenue = k)} label={t('Place')} />{/if}
        <label class="of-check"><input type="checkbox" bind:checked={addWeekly} /> {t('Every week the same (the next 8 weeks)')}</label>
        <div class="of-foot"><button type="submit" class="btn hi" disabled={busy}>{t('Open the time')}</button><button type="button" class="btn" onclick={() => addDlg.close()}>{t('Cancel')}</button></div>
      </form>
    </dialog>
  {/if}

  {#if slotOpen}
    {@const s = slotOpen}
    {@const ty = typeOf(o, s)}
    <dialog class="sheet from-below of-sheet" bind:this={slotDlg} use:backClose={() => slotDlg.close()} onclose={() => ((slotOpen = null), (told = null), (askCancel = false), (replied = null), (unpicked = []), (pickedMore = []))} aria-labelledby="of-slot-h">
      <div class="of-sh"><h2 id="of-slot-h">{fmtAt(s.at)} · {ty.label}</h2><button type="button" class="ibtn" aria-label={t('Close')} onclick={() => slotDlg.close()}><X size={20} aria-hidden="true" /></button></div>
      {#if told}
        <p>{tn(told.people.length, 'The time is cancelled. Tell {n} person:', 'The time is cancelled. Tell {n} people:')}</p>
        {#if alternativesOf(s).length}
          <h3 class="of-rq">{t('Which free times do you offer?')}</h3>
          <ul class="of-list" data-alts>
            {#each alternativesOf(s) as a, i (a.id)}
              <li class="of-pp"><label class="of-pick"><input type="checkbox" checked={i < 3 ? !unpicked.includes(a.id) : pickedMore.includes(a.id)} onchange={() => flipAlt(a, i)} /><span>{fmtAt(a.at)}<small>{typeOf(o, a).label}</small></span></label></li>
            {/each}
          </ul>
          <p class="muted">{t('These are the next free times of this offer.')}</p>
        {/if}
        <p class="of-note" data-tell-text>{tellText(s)}</p>
        {#if mailToAll(told.people.map((b) => b.contact), tellSubject(s), tellText(s))}
          <div class="of-foot"><a class="btn hi" data-mail-all href={mailToAll(told.people.map((b) => b.contact), tellSubject(s), tellText(s))}>{t('One e-mail to everyone')}</a></div>
          <p class="muted">{t('Everyone is in «bcc»: nobody sees the others.')}</p>
        {/if}
        <ul class="of-list">
          {#each told.people as b (b.id)}
            {@const href = contactHref(b.contact, tellText(s))}
            <li class="of-pp"><span>{b.name}<small>{b.contact}</small></span>{#if href}<a class="btn sm" {href}>{mailHref(b, s) ? t('By e-mail') : t('By SMS')}</a>{/if}</li>
          {/each}
        </ul>
        <div class="of-foot"><button type="button" class="btn hi" onclick={() => slotDlg.close()}>{t('Done')}</button></div>
      {:else}
        {#if replied}
          {@const href = contactHref(replied.b.contact, replyText(s, replied.decision, replied.b))}
          <p role="status">{replied.decision === 'confirm' ? t('Confirmed. Now tell {name}:', { name: replied.b.name }) : t('Declined. Now tell {name}:', { name: replied.b.name })}</p>
          <p class="of-note">{replyText(s, replied.decision, replied.b)}</p>
          <div class="of-foot">{#if href}<a class="btn hi" {href}>{t('Write')}</a>{/if}<button type="button" class="btn" onclick={() => (replied = null)}>{t('Done')}</button></div>
        {/if}
        {#if asking.length}
          <h3 class="of-rq">{tn(asking.length, '{n} request', '{n} requests')}</h3>
          <ul class="of-list">
            {#each asking as b (b.id)}
              <li class="of-pp of-rqrow">
                <span>{b.name}<small>{b.contact}</small>{#if b.note}<small class="of-note">{b.note}</small>{/if}{#if usedTrial(b)}<small class="of-warn" data-trial-used>{t('Had a trial lesson already: {when}. Once per person.', { when: fmtAt(usedTrial(b).at) })}</small>{/if}<small>{t('Answer by {when}', { when: new Date(b.answerBy).toLocaleString(locale(), { weekday: 'short', hour: '2-digit', minute: '2-digit' }) })}</small></span>
                <span class="of-two"><button type="button" class="btn hi sm" disabled={busy} onclick={() => answer(b, 'confirm')}>{t('Confirm')}</button><button type="button" class="btn sm" disabled={busy} onclick={() => answer(b, 'decline')}>{t('Decline')}</button></span>
              </li>
            {/each}
          </ul>
        {/if}
        <p class="muted">{[t('{n} of {m} booked', { n: people.length, m: ty.places }), ty.places > 1 && ty.price ? t('{price} CHF per person', { price: chf(ty.price) }) : ''].filter(Boolean).join(' · ')}</p>
        <ul class="of-list">
          {#each people as b (b.id)}
            {@const href = contactHref(b.contact, helloText(s))}
            <li class="of-pp">
              <span>{b.name}<small>{b.contact} · {b.pay === 'online' ? (b.paid ? t('paid (test)') : t('not paid')) : t('pays on site')}</small>{#if b.note}<small class="of-note">{b.note}</small>{/if}{#if usedTrial(b)}<small class="of-warn" data-trial-used>{t('Had a trial lesson already: {when}. Once per person.', { when: fmtAt(usedTrial(b).at) })}</small>{/if}</span>
              {#if href}<a class="btn sm" {href}>{t('Write')}</a>{/if}
              {#if invoiceOf(b)}<a class="lkb" href={`#/me/pay/invoices/${invoiceOf(b).id}`}>{t('Invoice {no}', { no: invoiceOf(b).no })}</a>{:else if b.at < nowAt()}<button type="button" class="lkb" onclick={() => writeInvoice(b)}>{t('Prepare invoice')}</button>{/if}
              <button type="button" class="lkb" onclick={() => dropOne(b)}>{t('Cancel|booking')}</button>
            </li>
          {/each}
          {#if people.length < ty.places}<li class="of-pp"><span class="muted">{tn(ty.places - people.length, '{n} place free', '{n} places free')}</span><small class="muted">{t('stays bookable')}</small></li>{/if}
        </ul>
        {#if ty.places >= 1 && (people.length >= ty.places || waitHere.length)}
          <h3 class="of-h3">{t('Waiting list')}</h3>
          {#if people.length < ty.places && waitHere.length}<p class="muted" data-place-free>{t('A place is free: write to the first one.')}</p>{/if}
          <ul class="of-list" data-waitlist>
            {#each waitHere as w (w.id)}
              {@const wh = contactHref(w.contact, freeText(s, w))}
              <li class="of-pp"><span>{w.name}{#if w.contact}<small>{w.contact}</small>{/if}</span>
                {#if wh && people.length < ty.places}<a class="btn hi sm" href={wh}>{t('Write')}</a>{/if}
                <button type="button" class="lkb" onclick={() => dropWait(w)}>{t('Remove')}</button></li>
            {/each}
            {#if !waitHere.length}<li class="muted">{t('Nobody is waiting. When a place is free again, Heute tells you.')}</li>{/if}
          </ul>
          <form class="of-wait" onsubmit={(e) => (e.preventDefault(), addWait())}>
            <label class="lbl" for="of-wn">{t('Name')}</label><input id="of-wn" class="inp" bind:value={waitName} maxlength="60" autocomplete="off" />
            <label class="lbl" for="of-wc">{t('Phone or e-mail')}</label><input id="of-wc" class="inp" bind:value={waitContact} maxlength="80" autocomplete="off" />
            <button type="submit" class="btn sm" data-wait-add>{t('Put on the waiting list')}</button>
          </form>
        {/if}
        {#if people.length > 1 && mailToAll(people.map((b) => b.contact), helloText(s), '')}
          <p><a class="btn sm" data-mail-group href={mailToAll(people.map((b) => b.contact), helloText(s), '')}>{t('One e-mail to all participants')}</a></p>
        {/if}
        {#if askCancel}
          <p class="of-ask" role="alert">{everyone.length ? tn(everyone.length, 'Cancel this time? {n} person has booked; afterwards you write to them.', 'Cancel this time? {n} people have booked; afterwards you write to them.') : t('Remove this free time?')}</p>
          <div class="of-foot"><button type="button" class="btn bad" disabled={busy} onclick={dropSlot}>{everyone.length ? t('Yes, cancel') : t('Yes, remove')}</button><button type="button" class="btn" onclick={() => (askCancel = false)}>{t('Keep it')}</button></div>
        {:else}
          <div class="of-foot"><button type="button" class="lkb of-red" onclick={() => (askCancel = true)}><X size={16} aria-hidden="true" />{everyone.length ? t('Cancel the time') : t('Remove the time')}</button></div>
        {/if}
      {/if}
    </dialog>
  {/if}

  {#if remOpen}
    <dialog class="sheet from-below of-sheet" bind:this={remDlg} use:backClose={() => remDlg.close()} onclose={() => (remOpen = false)} aria-labelledby="of-rem-sh">
      <form onsubmit={saveReminderText}>
        <div class="of-sh"><h2 id="of-rem-sh">{t('Reminder text')}</h2><button type="button" class="ibtn" aria-label={t('Close')} onclick={() => remDlg.close()}><X size={20} aria-hidden="true" /></button></div>
        <label class="lbl" for="of-rem-text">{t('Your own text (empty: the ready text)')}</label>
        <textarea id="of-rem-text" class="inp" rows="4" bind:value={remText} placeholder={sampleOf('')}></textarea>
        <p class="muted">{t('These words are filled in: {words}.', { words: (locale().startsWith('de') ? REMINDER_WORDS_DE : REMINDER_WORDS).map((w) => `{${w}}`).join(' ') })}</p>
        <p class="lbl">{t('Looks like this')}</p>
        <p class="of-note" data-reminder-preview>{sampleOf(remText)}</p>
        <div class="of-foot"><button type="submit" class="btn hi">{t('Save')}</button>{#if remText}<button type="button" class="btn" data-reminder-reset onclick={() => (remText = '')}>{t('Use the ready text')}</button>{/if}<button type="button" class="btn" onclick={() => remDlg.close()}>{t('Cancel')}</button></div>
      </form>
    </dialog>
  {/if}

  {#if rulesOpen && draft}
    <dialog class="sheet from-below of-sheet" bind:this={rulesDlg} use:backClose={() => rulesDlg.close()} onclose={() => (rulesOpen = false)} aria-labelledby="of-rules-sh">
      <form onsubmit={saveRules}>
        <div class="of-sh"><h2 id="of-rules-sh">{t('How booking works')}</h2><button type="button" class="ibtn" aria-label={t('Close')} onclick={() => rulesDlg.close()}><X size={20} aria-hidden="true" /></button></div>
        <label class="lbl" for="of-title">{t('Name')}</label><input id="of-title" class="inp" bind:value={draft.title} maxlength="60" />
        <label class="lbl" for="of-place">{t('Place|venue')}</label><input id="of-place" class="inp" bind:value={draft.place} maxlength="60" placeholder={t('e.g. sand court')} />
        <label class="lbl" for="of-min">{t('Length in minutes')}</label><input id="of-min" class="inp" type="number" min="0" inputmode="numeric" bind:value={draft.minutes} />
        <label class="lbl" for="of-venues">{t('Places to choose from (separated by commas)')}</label><input id="of-venues" class="inp" bind:value={draft.venuesText} placeholder={t('e.g. Court by the lake, Indoor hall')} />
        <p class="lbl">{t('Booking')}</p>
        <Seg options={[{ key: 'request', name: t('Request, I answer') }, ...(mine.offer.kind === 'tennis' || mine.offer.kind === 'own' ? [{ key: 'wish', name: t('Wish time, I answer') }] : []), { key: 'instant', name: t('Booked at once') }]} value={draft.mode} onchange={(k) => (draft.mode = k)} label={t('Booking')} />
        {#if draft.mode === 'wish'}
          <fieldset class="of-type" data-wish-prices>
            <legend>{t('Price per child')}</legend>
            <p class="muted">{t('Court included. The parents see the price for the number of children they enter. If a hall is among the ticked places, the hall price counts until you confirm.')}</p>
            <span class="of-two of-ph"><span></span><span><b>{t('Outdoors')}</b></span><span><b>{t('Hall')}</b></span></span>
            {#each [0, 1, 2, 3] as i (i)}
              <span class="of-two of-pr">
                <label class="lbl" for={`of-po-${i}`}>{tn(i + 1, '{n} child', '{n} children')}</label>
                <input id={`of-po-${i}`} class="inp" inputmode="decimal" bind:value={draft.prices.out[i]} aria-label={t('{n} children, outdoors', { n: i + 1 })} />
                <input id={`of-ph-${i}`} class="inp" inputmode="decimal" bind:value={draft.prices.hall[i]} aria-label={t('{n} children, hall', { n: i + 1 })} />
              </span>
            {/each}
            {#if draftVenues.length}
              <p class="lbl">{t('Which of your places is a hall?')}</p>
              {#each draftVenues as v (v)}<label class="of-check"><input type="checkbox" checked={draft.hall.includes(v)} onchange={() => toggleHall(v)} data-hall-place /> {v}</label>{/each}
            {/if}
          </fieldset>
        {/if}
        <p class="lbl">{t('Payment')}</p>
        <Seg options={[{ key: 'site', name: t('on site') }, { key: 'online', name: t('online (test)') }]} value={draft.pay} onchange={(k) => (draft.pay = k)} label={t('Payment')} />
        <label class="lbl" for="of-cancel">{t('People may cancel up to … hours before')}</label><input id="of-cancel" class="inp" type="number" min="0" inputmode="numeric" bind:value={draft.cancelHours} />
        {#if trialRoom}
          <label class="of-check"><input type="checkbox" checked={draft.trial} onchange={(e) => flipTrial(e.currentTarget.checked)} data-trial-switch /> {t('Offer a trial lesson')}</label>
          <p class="muted">{t('A kind «Trial lesson» next to the others: one place, half the price, and once per person. You open its times like any other time. If a person asks for a second one, the request says so and you can offer a normal lesson.')}</p>
          {#if trialMoves}<p class="muted" data-trial-moves>{tn(trialMoves, 'Switched off: {n} time of this kind becomes a time of the first kind.', 'Switched off: {n} times of this kind become times of the first kind.')}</p>{/if}
        {/if}
        {#each draft.types as x, i (x.key)}
          <fieldset class="of-type">
            <legend>{t('Kind {n}', { n: i + 1 })}</legend>
            <label class="lbl" for={`of-tl-${i}`}>{t('Name')}</label><input id={`of-tl-${i}`} class="inp" bind:value={x.label} maxlength="30" />
            <span class="of-two">
              <span><label class="lbl" for={`of-tp-${i}`}>{t('Places|seats')}</label><input id={`of-tp-${i}`} class="inp" type="number" min="1" max="50" inputmode="numeric" bind:value={x.places} /></span>
              <span><label class="lbl" for={`of-tc-${i}`}>{t('Price in CHF')}</label><input id={`of-tc-${i}`} class="inp" inputmode="decimal" bind:value={x.chf} /></span>
            </span>
          </fieldset>
        {/each}
        <div class="of-foot"><button type="submit" class="btn hi" disabled={busy}>{t('Save')}</button><button type="button" class="btn" onclick={() => rulesDlg.close()}>{t('Cancel')}</button></div>
      </form>
    </dialog>
  {/if}
{/if}

<style>
  .of-band {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 20px;
    color: var(--ink-2);
  }
  .of-kinds {
    list-style: none;
    margin: 0 0 24px;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
    gap: 14px;
  }
  .of-kc {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    color: inherit;
    text-decoration: none;
  }
  .of-kc b {
    font-size: var(--fs-sub);
  }
  .of-kc small,
  .muted {
    color: var(--ink-2);
  }
  .of-ib {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: var(--hi-soft);
    color: var(--hi);
  }
  .of-lr {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding-top: 8px;
    border-top: 1px solid var(--line);
  }
  .of-p {
    margin: 0 0 10px;
    color: var(--ink-2);
  }
  .of-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .of-chips .btn,
  .of-two .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .card + .card,
  .ich-main > section + section,
  .ich-side > section + section {
    margin-top: 18px;
  }
  .of-wh {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    margin: 0 0 12px;
  }
  .of-wh h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .of-nav {
    display: flex;
    gap: 4px;
  }
  .ibtn {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .of-slots {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
  }
  @media (max-width: 640px) {
    .of-slots {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  .of-dc {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .of-dh {
    text-align: center;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .of-dh b {
    display: block;
    color: var(--ink);
  }
  .of-sl {
    border: 0;
    border-radius: 10px;
    padding: 7px 8px;
    font: inherit;
    font-size: var(--fs-small);
    line-height: 1.3;
    text-align: left;
    overflow-wrap: break-word;
    cursor: pointer;
  }
  .of-sl b {
    display: block;
  }
  .of-sl.free {
    background: var(--hi-soft);
    color: var(--ink);
  }
  .of-sl.part {
    background: color-mix(in srgb, var(--hi) 28%, var(--paper));
    color: var(--ink);
  }
  .of-sl.full {
    background: var(--ink);
    color: var(--paper);
  }
  .of-sl.add {
    display: grid;
    place-items: center;
    min-height: 36px;
    border: 1.5px dashed var(--line);
    background: none;
    color: var(--ink-2);
  }
  .of-legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 12px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .of-legend span {
    white-space: nowrap;
    margin-right: 0.5rem;
  }
  .of-legend i {
    display: inline-block;
    width: 12px;
    height: 12px;
    margin-right: 4px;
    vertical-align: -1px;
    border-radius: 3px;
  }
  .of-legend i.free {
    background: var(--hi-soft);
  }
  .of-legend i.part {
    background: color-mix(in srgb, var(--hi) 28%, var(--paper));
  }
  .of-legend i.full {
    background: var(--ink);
  }
  .of-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .of-list > li + li {
    border-top: 1px solid var(--line);
  }
  .of-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    padding: 10px 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .of-row b,
  .of-row small,
  .of-pp small {
    display: block;
  }
  .of-row small,
  .of-pp small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .of-pp {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
  }
  .of-pp > span:first-child {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .of-link {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 12px;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--paper-2);
  }
  .of-link .u {
    min-width: 0;
    overflow-wrap: break-word;
    color: var(--ink-2);
  }
  .of-two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .of-two .btn {
    justify-content: center;
  }
  .of-fine {
    margin: 10px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .of-rules {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .of-rules li {
    display: grid;
    grid-template-columns: auto auto 1fr;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .of-rules li span {
    text-align: right;
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .of-sheet form,
  .of-sheet {
    display: grid;
    gap: 8px;
  }
  .of-sh {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }
  .of-sh h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .of-check {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
  }
  .of-type {
    margin: 6px 0 0;
    padding: 8px 12px 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
  }
  .of-foot {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 12px;
  }
  .of-red {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--bad);
  }
  .of-ask {
    margin: 12px 0 0;
    font-weight: 600;
  }
  .err {
    color: var(--bad);
  }
  .hint {
    margin: 8px 0 0;
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .lkb {
    min-height: 40px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .btn.bad {
    border-color: var(--bad);
    background: var(--bad);
    color: var(--paper);
  }
  .of-two.of-pr,
  .of-two.of-ph {
    grid-template-columns: minmax(70px, 1fr) minmax(0, 1.2fr) minmax(0, 1.2fr);
    align-items: center;
  }
  .of-pr .lbl {
    margin: 0;
  }
  @media (max-width: 640px) {
    .of-two:not(.of-pr):not(.of-ph) {
      grid-template-columns: 1fr;
    }
  }
.of-note { display: block; font-style: italic; }
  .of-warn { display: block; color: var(--warn); font-weight: 600; }
  .of-rq { margin: 8px 0 0; }
  .of-rqrow { flex-wrap: wrap; }
  .of-ask-n { color: var(--accent, inherit); font-weight: 600; }
.of-pick { display: flex; gap: 10px; align-items: center; min-width: 0; }
  .of-pick input { width: 22px; height: 22px; flex: none; }
  .of-lo { flex-wrap: wrap; }
  .of-lo .of-pick { flex: 1 1 100%; }
  .of-out { flex: 1 1 9rem; width: auto; min-height: 40px; }
  .of-h3 { margin: 12px 0 0; font-size: var(--fs-body); }
  .of-wait { display: grid; gap: 6px; margin-top: 8px; }
</style>
