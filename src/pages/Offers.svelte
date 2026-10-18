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
  import { backClose } from '../lib/ui/backclose.js';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import { localDay } from '../lib/localday.js';
  import { KINDS, kindOf, newOffer, shareUrl, mondayOf, weekDays, weekNo, addDays, slotsOn, newSlots, bookedBySlot, slotState, chf, dayOf, timeOf, contactHref } from '../lib/booking/model.js';
  import { OFFERS_KEY, SEEN_KEY, createOffer, saveOffer, ownerBookings, ownerCancel, cancelSlot, errorText } from '../lib/booking/client.js';
  import { Volleyball, Tent, Wrench, CalendarDays, Link2, Copy, MessageCircle, ChevronLeft, ChevronRight, Clock, Users, Repeat, CreditCard, Bell, X, Plus, MapPin } from '@lucide/svelte';
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
  let addDlg = $state();
  function openAdd(day) {
    addType = mine.offer.types[0].key;
    addOpen = { day };
  }
  $effect(() => {
    if (addOpen && addDlg && !addDlg.open) addDlg.showModal();
  });
  async function addSlots(e) {
    e.preventDefault();
    if (!/^\d{2}:\d{2}$/.test(addTime)) return;
    const add = newSlots(mine.offer, { day: addOpen.day, time: addTime, type: addType, weeks: addWeekly ? 8 : 1 });
    if (await save({ ...mine.offer, slots: [...mine.offer.slots, ...add] })) addDlg.close();
  }

  /* one time: who comes, write to all, cancel (BU4) */
  let slotOpen = $state(null); // the slot
  let slotDlg = $state();
  let told = $state(null); // after cancelling a time: the people to tell
  $effect(() => {
    if (slotOpen && slotDlg && !slotDlg.open) slotDlg.showModal();
  });
  const people = $derived(slotOpen ? (bookings ?? []).filter((b) => b.slot === slotOpen.id) : []);
  const tellText = (s) => t('{title} on {when} is cancelled. Sorry! You can book another time with the same link.', { title: mine?.offer.title ?? '', when: fmtAt(s.at) });
  const helloText = (s) => t('About {title} on {when}:', { title: mine?.offer.title ?? '', when: fmtAt(s.at) });
  let askCancel = $state(false);
  async function dropSlot() {
    const s = slotOpen;
    if (people.length) {
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

  /* the rules (BU1 «So wird gebucht», Ändern) */
  let rulesOpen = $state(false);
  let rulesDlg = $state();
  let draft = $state(null);
  $effect(() => {
    if (rulesOpen && rulesDlg && !rulesDlg.open) rulesDlg.showModal();
  });
  function openRules() {
    const o = mine.offer;
    draft = { title: o.title, place: o.place, minutes: o.minutes, pay: o.pay, cancelHours: o.cancelHours, types: o.types.map((x) => ({ ...x, chf: chf(x.price) })) };
    rulesOpen = true;
  }
  async function saveRules(e) {
    e.preventDefault();
    const types = draft.types.map((x) => ({ key: x.key, label: x.label.trim(), places: Math.max(1, Math.min(50, Math.round(Number(x.places) || 1))), price: Math.max(0, Math.round(Number(String(x.chf).replace(',', '.')) * 100) || 0) }));
    const next = { ...mine.offer, title: draft.title.trim() || mine.offer.title, place: draft.place.trim(), minutes: Math.max(0, Math.round(Number(draft.minutes) || 0)), pay: draft.pay, cancelHours: Math.max(0, Math.round(Number(draft.cancelHours) || 0)), types };
    if (await save(next)) rulesDlg.close();
  }
</script>

{#if !id}
  <!-- BU5: Ich › Angebote -->
  <div class="ich-page offers">
    <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Your offers')} sub={t('One pattern for everything: open free times, share the link, people book themselves.')} />
    <p class="of-band" role="note"><span class="pill warn">{t('Test|offers')}</span> {t('Online payment runs in test mode only; no real money moves.')}</p>
    {#if error}<p class="err" role="alert">{error}</p>{/if}
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
    <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Offers'), href: '#/me/offers' }]} title={t('Offer not found')} sub={t('It is not on this device. Load the backup that has it, or start a new offer.')} />
  </div>
{:else if mine}
  {@const o = mine.offer}
  <!-- BU1: the free times of one offer; BU4: who booked a time -->
  <div class="ich-page offers">
    <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Offers'), href: '#/me/offers' }]} title={o.title} sub={t('When you have time, people book themselves.')} />
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
                  {@const who = ty.places === 1 && n ? (bookings ?? []).find((b) => b.slot === s.id)?.name : ''}
                  <button type="button" class="of-sl {st}" data-slot={s.id} onclick={() => (slotOpen = s)}>
                    <b>{timeOf(s.at)}</b>
                    {#if who}{who}{:else if ty.places > 1}{ty.label} · {t('{n} of {m}', { n, m: ty.places })}{:else}{t('free')}{/if}
                  </button>
                {/each}
                {#if day >= today}<button type="button" class="of-sl add" aria-label={t('Open a time on {day}', { day: fmtDay(day) })} onclick={() => openAdd(day)}><Plus size={16} aria-hidden="true" /></button>{/if}
              </div>
            {/each}
          </div>
          <p class="of-legend"><span><i class="free"></i>{t('free')}</span> <span><i class="part"></i>{t('partly booked')}</span> <span><i class="full"></i>{t('booked')}</span> <span>{t('+ opens a time')}</span></p>
        </section>

        <section class="card" aria-labelledby="of-bk-h">
          <div class="of-wh"><h2 id="of-bk-h">{t('Booked')}</h2>{#if bookings}<small class="muted">{tn(upcoming.length, '{n} ahead', '{n} ahead')}</small>{/if}</div>
          {#if loadErr}<p class="err" role="alert">{loadErr}</p>
          {:else if !bookings}<p class="muted">{t('Loading…')}</p>
          {:else if !upcoming.length}<p class="muted">{t('Nobody has booked yet.')}</p>
          {:else}
            <ul class="of-list">
              {#each upcoming as b (b.id)}
                {@const s = o.slots.find((x) => x.id === b.slot)}
                <li><button type="button" class="of-row" onclick={() => s && (slotOpen = s)}><span><b>{fmtAt(b.at)}</b><small>{b.name}{s ? ` · ${typeOf(o, s).label}` : ''}</small></span><ChevronRight size={16} aria-hidden="true" /></button></li>
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
        </section>

        <section class="card" aria-labelledby="of-rules-h">
          <div class="of-wh"><h2 id="of-rules-h">{t('How booking works')}</h2><button type="button" class="lkb" onclick={openRules}>{t('Change')}</button></div>
          <ul class="of-rules">
            <li><Clock size={18} aria-hidden="true" /><b>{t('Length')}</b><span>{lengthWord(o)}</span></li>
            <li><Users size={18} aria-hidden="true" /><b>{t('Places')}</b><span>{o.types.map((x) => `${x.label} ${x.places}`).join(' · ')}</span></li>
            <li><CreditCard size={18} aria-hidden="true" /><b>{t('Price')}</b><span>{o.types.map((x) => `${x.label} ${chf(x.price)} CHF`).join(' · ')}</span></li>
            <li><Repeat size={18} aria-hidden="true" /><b>{t('Payment')}</b><span>{o.pay === 'online' ? t('online (test mode)') : t('on site (cash, TWINT)')}</span></li>
            <li><Bell size={18} aria-hidden="true" /><b>{t('Cancelling')}</b><span>{t('people up to {n} h before · you any time', { n: o.cancelHours })}</span></li>
            {#if o.place}<li><MapPin size={18} aria-hidden="true" /><b>{t('Place')}</b><span>{o.place}</span></li>{/if}
          </ul>
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
        <label class="of-check"><input type="checkbox" bind:checked={addWeekly} /> {t('Every week the same (the next 8 weeks)')}</label>
        <div class="of-foot"><button type="submit" class="btn hi" disabled={busy}>{t('Open the time')}</button><button type="button" class="btn" onclick={() => addDlg.close()}>{t('Cancel')}</button></div>
      </form>
    </dialog>
  {/if}

  {#if slotOpen}
    {@const s = slotOpen}
    {@const ty = typeOf(o, s)}
    <dialog class="sheet from-below of-sheet" bind:this={slotDlg} use:backClose={() => slotDlg.close()} onclose={() => ((slotOpen = null), (told = null), (askCancel = false))} aria-labelledby="of-slot-h">
      <div class="of-sh"><h2 id="of-slot-h">{fmtAt(s.at)} · {ty.label}</h2><button type="button" class="ibtn" aria-label={t('Close')} onclick={() => slotDlg.close()}><X size={20} aria-hidden="true" /></button></div>
      {#if told}
        <p>{tn(told.people.length, 'The time is cancelled. Tell {n} person:', 'The time is cancelled. Tell {n} people:')}</p>
        <ul class="of-list">
          {#each told.people as b (b.id)}
            {@const href = contactHref(b.contact, tellText(s))}
            <li class="of-pp"><span>{b.name}<small>{b.contact}</small></span>{#if href}<a class="btn sm" {href}>{t('Write')}</a>{/if}</li>
          {/each}
        </ul>
        <div class="of-foot"><button type="button" class="btn hi" onclick={() => slotDlg.close()}>{t('Done')}</button></div>
      {:else}
        <p class="muted">{t('{n} of {m} booked', { n: people.length, m: ty.places })}</p>
        <ul class="of-list">
          {#each people as b (b.id)}
            {@const href = contactHref(b.contact, helloText(s))}
            <li class="of-pp">
              <span>{b.name}<small>{b.contact} · {b.pay === 'online' ? (b.paid ? t('paid (test)') : t('not paid')) : t('pays on site')}</small></span>
              {#if href}<a class="btn sm" {href}>{t('Write')}</a>{/if}
              <button type="button" class="lkb" onclick={() => dropOne(b)}>{t('Cancel|booking')}</button>
            </li>
          {/each}
          {#if people.length < ty.places}<li class="of-pp"><span class="muted">{tn(ty.places - people.length, '{n} place free', '{n} places free')}</span><small class="muted">{t('stays bookable')}</small></li>{/if}
        </ul>
        {#if askCancel}
          <p class="of-ask" role="alert">{people.length ? tn(people.length, 'Cancel this time? {n} person has booked; afterwards you write to them.', 'Cancel this time? {n} people have booked; afterwards you write to them.') : t('Remove this free time?')}</p>
          <div class="of-foot"><button type="button" class="btn bad" disabled={busy} onclick={dropSlot}>{people.length ? t('Yes, cancel') : t('Yes, remove')}</button><button type="button" class="btn" onclick={() => (askCancel = false)}>{t('Keep it')}</button></div>
        {:else}
          <div class="of-foot"><button type="button" class="lkb of-red" onclick={() => (askCancel = true)}><X size={16} aria-hidden="true" />{people.length ? t('Cancel the time') : t('Remove the time')}</button></div>
        {/if}
      {/if}
    </dialog>
  {/if}

  {#if rulesOpen && draft}
    <dialog class="sheet from-below of-sheet" bind:this={rulesDlg} use:backClose={() => rulesDlg.close()} onclose={() => (rulesOpen = false)} aria-labelledby="of-rules-sh">
      <form onsubmit={saveRules}>
        <div class="of-sh"><h2 id="of-rules-sh">{t('How booking works')}</h2><button type="button" class="ibtn" aria-label={t('Close')} onclick={() => rulesDlg.close()}><X size={20} aria-hidden="true" /></button></div>
        <label class="lbl" for="of-title">{t('Name')}</label><input id="of-title" class="inp" bind:value={draft.title} maxlength="60" />
        <label class="lbl" for="of-place">{t('Place')}</label><input id="of-place" class="inp" bind:value={draft.place} maxlength="60" placeholder={t('e.g. sand court')} />
        <label class="lbl" for="of-min">{t('Length in minutes')}</label><input id="of-min" class="inp" type="number" min="0" inputmode="numeric" bind:value={draft.minutes} />
        <p class="lbl">{t('Payment')}</p>
        <Seg options={[{ key: 'site', name: t('on site') }, { key: 'online', name: t('online (test)') }]} value={draft.pay} onchange={(k) => (draft.pay = k)} label={t('Payment')} />
        <label class="lbl" for="of-cancel">{t('People may cancel up to … hours before')}</label><input id="of-cancel" class="inp" type="number" min="0" inputmode="numeric" bind:value={draft.cancelHours} />
        {#each draft.types as x, i (x.key)}
          <fieldset class="of-type">
            <legend>{t('Kind {n}', { n: i + 1 })}</legend>
            <label class="lbl" for={`of-tl-${i}`}>{t('Name')}</label><input id={`of-tl-${i}`} class="inp" bind:value={x.label} maxlength="30" />
            <span class="of-two">
              <span><label class="lbl" for={`of-tp-${i}`}>{t('Places')}</label><input id={`of-tp-${i}`} class="inp" type="number" min="1" max="50" inputmode="numeric" bind:value={x.places} /></span>
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
  @media (max-width: 640px) {
    .of-two {
      grid-template-columns: 1fr;
    }
  }
</style>
