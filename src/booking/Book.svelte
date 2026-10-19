<script>
  /**
   * Termine buchen (mockups BU2 + BU3, Noah 14.10.2026 21:31 «BU1–BU5 freigegeben»): the booking page
   * for the people who book, without the app and without an account. BU2: choose a day, a time, type
   * name and phone or e-mail, «Book the time». BU3: booked, with the calendar file and cancelling up
   * to cancelHours before (4a). Online payment goes to Stripe (test mode) and comes back here
   * (?session_id=…). The own booking can be opened again with its link (?b=…&k=…#<offer>); this
   * browser also remembers it (localStorage, only here).
   * Only free places are shown, never names of others.
   */
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import { loadOffer, book, confirmPaid, myBooking, cancelMine, errorText } from '../lib/booking/client.js';
  import { kindOf, dayOf, timeOf, chf, icsOf, BOOK_PAGE } from '../lib/booking/model.js';
  import { Volleyball, Tent, Wrench, CalendarDays, Lock, Check, X, CreditCard, Copy } from '@lucide/svelte';

  const ICONS = { tennis: Volleyball, tent: Tent, wrench: Wrench, cal: CalendarDays };
  const MINE_LS = 'pg.booked';

  const params = new URLSearchParams(location.search);
  const offerId = decodeURIComponent(location.hash.replace(/^#\/?/, ''));

  let offer = $state(null);
  let error = $state('');
  let loading = $state(true);
  let day = $state('');
  let slotId = $state('');
  let name = $state('');
  let contact = $state('');
  let busy = $state(false);
  let done = $state(null); // the own booking (BU3)
  let cancelled = $state(false);
  let ask = $state(false);
  let copied = $state('');

  const fmtDay = (d, opts = { weekday: 'short', day: 'numeric', month: 'numeric' }) => new Date(`${d}T12:00:00`).toLocaleDateString(locale(), opts);
  const fmtAt = (at) => `${fmtDay(dayOf(at))} · ${timeOf(at)}`;
  const days = $derived(offer ? [...new Set(offer.slots.map((s) => dayOf(s.at)))] : []);
  const freeOn = (d) => offer.slots.some((s) => dayOf(s.at) === d && s.free > 0);
  const times = $derived(offer ? offer.slots.filter((s) => dayOf(s.at) === day) : []);
  const slot = $derived(offer?.slots.find((s) => s.id === slotId) ?? null);
  const typeOf = (s) => offer.types.find((x) => x.key === s.type) ?? offer.types[0];
  const lengthWord = (o) => (o.minutes >= 1440 && o.minutes % 1440 === 0 ? tn(o.minutes / 1440, '{n} day', '{n} days') : t('{n} min', { n: o.minutes }));

  function remember(b) {
    try {
      const all = JSON.parse(localStorage.getItem(MINE_LS) || '[]').filter((x) => x.b !== b.id);
      localStorage.setItem(MINE_LS, JSON.stringify([...all, { offer: b.offer, b: b.id, k: b.key, at: b.at }].slice(-20)));
    } catch {
      /* private window: the link still works */
    }
  }
  function forget(b) {
    try {
      localStorage.setItem(MINE_LS, JSON.stringify(JSON.parse(localStorage.getItem(MINE_LS) || '[]').filter((x) => x.b !== b.id)));
    } catch {
      /* nothing kept */
    }
  }
  const earlier = (() => {
    try {
      return JSON.parse(localStorage.getItem(MINE_LS) || '[]').filter((x) => x.offer === offerId && x.at >= new Date().toISOString().slice(0, 10));
    } catch {
      return [];
    }
  })();
  const ownLink = (b) => `${BOOK_PAGE}?b=${encodeURIComponent(b.id)}&k=${encodeURIComponent(b.key)}#${b.offer}`;

  async function start() {
    if (!offerId) {
      loading = false;
      error = t('This link is incomplete. Ask for the link again.');
      return;
    }
    const sid = params.get('session_id');
    const b = params.get('b');
    if (sid || b) {
      const r = sid ? await confirmPaid(sid) : await myBooking(offerId, b, params.get('k') ?? '');
      history.replaceState(null, '', `${location.pathname}#${offerId}`);
      if (r.ok) {
        done = { ...r.booking, offer: offerId };
        remember(done);
      } else error = t(errorText(r.code));
    }
    const r = await loadOffer(offerId);
    loading = false;
    if (!r.ok) {
      if (!done) error = t(errorText(r.code));
      return;
    }
    offer = r.offer;
    const firstFree = days.find(freeOn) ?? days[0] ?? '';
    day = firstFree;
    slotId = offer.slots.find((s) => dayOf(s.at) === day && s.free > 0)?.id ?? '';
    if (params.get('pay') === 'cancel') error = t('The payment was cancelled. Nothing is booked.');
    if (done) document.title = t('Booked');
  }
  start();

  function pickDay(d) {
    day = d;
    slotId = offer.slots.find((s) => dayOf(s.at) === d && s.free > 0)?.id ?? '';
  }

  async function submit(e) {
    e.preventDefault();
    if (busy || !slot) return;
    error = '';
    if (name.trim().length < 2 || contact.trim().length < 3) return (error = t(errorText('bad_person')));
    busy = true;
    const r = await book({ id: offerId, slot: slot.id, name, contact, returnTo: `${BOOK_PAGE}#${offerId}` });
    busy = false;
    if (!r.ok) {
      error = t(errorText(r.code));
      if (r.code === 'slot_full' || r.code === 'slot_gone') {
        const again = await loadOffer(offerId);
        if (again.ok) offer = again.offer;
      }
      return;
    }
    if (r.url) {
      location.href = r.url;
      return;
    }
    done = { ...r.booking, offer: offerId, canCancel: true };
    remember(done);
    scrollTo(0, 0);
  }

  async function cancel() {
    busy = true;
    const r = await cancelMine(offerId, done.id, done.key);
    busy = false;
    ask = false;
    if (!r.ok) return (error = t(errorText(r.code)));
    forget(done);
    cancelled = true;
  }

  function calendar() {
    const file = icsOf({ title: offer?.title ?? t('Booking'), place: offer?.place ?? '', at: done.at, minutes: offer?.minutes ?? 60, uid: done.id });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([file], { type: 'text/calendar' }));
    a.download = 'termin.ics';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      copied = t('Link copied.');
    } catch {
      copied = text;
    }
  }
</script>

<div class="pub">
  <header class="pubtop">
    <span class="mark" aria-hidden="true">PG</span><span>{t('Book a time')}</span>
    <small><Lock size={14} aria-hidden="true" />{t('no account needed')}</small>
  </header>
  <main class="pubw">
    {#if offer || done}
      {@const Icon = ICONS[kindOf(offer?.kind).icon]}
      <div class="coach">
        <span class="av2"><Icon size={26} aria-hidden="true" /></span>
        <div>
          <h1>{offer?.title ?? t('Booking')}</h1>
          {#if offer}<p>{[offer.place, offer.types.map((x) => x.label).join(t(' or ')), lengthWord(offer)].filter(Boolean).join(' · ')}</p>{/if}
        </div>
      </div>
    {/if}

    {#if error}<p class="err" role="alert">{error}</p>{/if}

    {#if loading}
      <p class="muted">{t('Loading…')}</p>
    {:else if done && cancelled}
      <section class="card conf">
        <h2>{t('Cancelled')}</h2>
        <p class="muted">{t('Your booking for {when} is cancelled.', { when: fmtAt(done.at) })}</p>
        <button type="button" class="btn" onclick={() => ((done = null), (cancelled = false))}>{t('Book another time')}</button>
      </section>
    {:else if done}
      <!-- BU3 -->
      <section class="card conf" aria-labelledby="conf-h">
        <span class="big-ok" aria-hidden="true"><Check size={36} /></span>
        <h2 id="conf-h">{t('Booked')}</h2>
        <p class="muted">{fmtAt(done.at)} · {done.type}{offer?.place ? ` · ${offer.place}` : ''}</p>
        <dl class="sum">
          <dt>{t('Who')}</dt><dd>{done.name}</dd>
          <dt>{t('Price')}</dt><dd>{chf(done.price)} CHF · {done.pay === 'online' ? (done.paid ? t('paid (test mode)') : t('not paid yet')) : t('pay on site')}</dd>
        </dl>
        <p class="keep">{t('Keep this link: with it you can see or cancel your booking.')}</p>
        <p class="lnk"><span>{ownLink(done)}</span><button type="button" class="ibtn" aria-label={t('Copy link')} onclick={() => copy(ownLink(done))}><Copy size={18} aria-hidden="true" /></button></p>
        {#if copied}<p class="muted" role="status">{copied}</p>{/if}
        {#if ask}
          <p class="ask" role="alert">{t('Cancel this booking?')}</p>
          <div class="two"><button type="button" class="btn bad" disabled={busy} onclick={cancel}>{t('Yes, cancel')}</button><button type="button" class="btn" onclick={() => (ask = false)}>{t('Keep it')}</button></div>
        {:else}
          <div class="two">
            <button type="button" class="btn" onclick={calendar}><CalendarDays size={18} aria-hidden="true" />{t('Add to calendar')}</button>
            {#if done.canCancel !== false}<button type="button" class="btn" onclick={() => (ask = true)}><X size={18} aria-hidden="true" />{t('Cancel|booking')}</button>{/if}
          </div>
          {#if done.canCancel === false}<p class="muted">{t('It is too late to cancel online. Please get in touch directly.')}</p>{/if}
        {/if}
      </section>
    {:else if offer}
      {#if earlier.length}
        <p class="mine">{t('Your booking:')} {#each earlier as x (x.b)}<a href={`?b=${encodeURIComponent(x.b)}&k=${encodeURIComponent(x.k)}#${offerId}`} onclick={(e) => (e.preventDefault(), (location.href = `${location.pathname}?b=${encodeURIComponent(x.b)}&k=${encodeURIComponent(x.k)}#${offerId}`))}>{fmtAt(x.at)}</a>{/each}</p>
      {/if}
      {#if !offer.slots.some((s) => s.free > 0)}
        <section class="card"><h2>{t('No free times right now')}</h2><p class="muted">{t('Look again later, new times are added regularly.')}</p></section>
      {:else}
        <div class="pgrid">
          <!-- BU2 -->
          <section class="card" aria-labelledby="pick-h">
            <h2 id="pick-h">{t('1. Choose a day')}</h2>
            <div class="days" role="group" aria-label={t('Day')}>
              {#each days as d (d)}
                <button type="button" class="dy" aria-pressed={d === day} disabled={!freeOn(d)} onclick={() => pickDay(d)}>{fmtDay(d, { weekday: 'short' })}<b>{fmtDay(d, { day: 'numeric', month: 'numeric' })}</b></button>
              {/each}
            </div>
            <h3 class="lb">{t('2. Choose a time')}</h3>
            <div class="times" role="group" aria-label={t('Time')}>
              {#each times as s (s.id)}
                {@const ty = typeOf(s)}
                <button type="button" class="tm" aria-pressed={s.id === slotId} disabled={!s.free} onclick={() => (slotId = s.id)}>
                  <b>{timeOf(s.at)}</b>
                  <small>{ty.label} · {s.free ? (ty.places > 1 ? tn(s.free, '{n} place left', '{n} places left') : t('free')) : t('taken')}</small>
                </button>
              {/each}
            </div>
          </section>
          {#if slot}
            {@const ty = typeOf(slot)}
            <form class="card" onsubmit={submit} aria-labelledby="form-h" novalidate>
              <h2 id="form-h">{fmtAt(slot.at)}</h2>
              <p class="muted">{[ty.label, lengthWord(offer), offer.place].filter(Boolean).join(' · ')}</p>
              <label class="lbl" for="bk-name">{t('Your name')}</label>
              <input id="bk-name" class="inp" bind:value={name} autocomplete="name" maxlength="60" placeholder={t('First and last name')} />
              <label class="lbl" for="bk-contact">{t('Phone or e-mail')}</label>
              <input id="bk-contact" class="inp" bind:value={contact} autocomplete="tel" maxlength="80" placeholder={t('so you can be reached')} />
              <dl class="sum">
                <dt>{t('Price')}</dt><dd>{chf(ty.price)} CHF</dd>
                <dt>{t('Payment')}</dt><dd>{#if offer.pay === 'online' && ty.price > 0}<CreditCard size={16} aria-hidden="true" /> {t('online')} <span class="pill warn">{t('Test mode')}</span>{:else}{t('on site, cash or TWINT')}{/if}</dd>
              </dl>
              <button type="submit" class="btn hi go" disabled={busy}><Check size={20} aria-hidden="true" />{t('Book the time')}</button>
              <p class="muted fine">{t('Cancel up to {n} h before with the link you get.', { n: offer.cancelHours })}</p>
            </form>
          {/if}
        </div>
      {/if}
    {/if}
  </main>
</div>

<style>
  :global(body) {
    background: var(--ground, var(--paper-2));
  }
  .pub {
    min-height: 100vh;
  }
  .pubtop {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 60px;
    padding: 0 16px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
    font-weight: 600;
  }
  .pubtop small {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-left: auto;
    font-weight: 400;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .mark {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: var(--ink);
    color: var(--paper);
    font-size: var(--fs-small);
    font-weight: 700;
  }
  .pubw {
    max-width: 980px;
    margin: 0 auto;
    padding: 24px 16px 64px;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
  }
  .coach {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .coach h1 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .coach p {
    margin: 2px 0 0;
    color: var(--ink-2);
  }
  .av2 {
    flex: none;
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--hi);
    color: var(--paper);
  }
  .pgrid {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
    gap: 18px;
    align-items: start;
  }
  @media (max-width: 720px) {
    .pgrid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  h2 {
    margin: 0 0 10px;
    font-size: var(--fs-sub);
  }
  .lb {
    margin: 16px 0 8px;
    font-size: var(--fs-label);
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink-2);
  }
  .days {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 2px;
  }
  .dy {
    flex: 0 0 64px;
    padding: 8px 4px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .dy b {
    display: block;
    color: var(--ink);
    font-size: var(--fs-body);
  }
  .dy[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .dy[aria-pressed='true'] b {
    color: var(--paper);
  }
  .dy:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .times {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
  }
  .tm {
    padding: 10px 12px;
    border: 1.5px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .tm b {
    display: block;
    font-size: var(--fs-sub);
  }
  .tm small {
    color: var(--ink-2);
  }
  .tm[aria-pressed='true'] {
    border-color: var(--hi);
    background: var(--hi-soft);
  }
  .tm:disabled {
    opacity: 0.5;
    text-decoration: line-through;
    cursor: default;
  }
  form {
    display: grid;
    gap: 6px;
  }
  .sum {
    display: grid;
    grid-template-columns: auto 1fr;
    margin: 12px 0 0;
  }
  .sum dt,
  .sum dd {
    margin: 0;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .sum dt {
    color: var(--ink-2);
  }
  .sum dd {
    text-align: right;
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .go {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 56px;
    margin-top: 12px;
    font-size: var(--fs-sub);
  }
  .muted {
    margin: 0;
    color: var(--ink-2);
  }
  .fine {
    margin-top: 6px;
    font-size: var(--fs-small);
  }
  .err {
    margin: 0;
    color: var(--bad);
  }
  .conf {
    max-width: 520px;
    width: 100%;
    margin: 0 auto;
    text-align: center;
  }
  .conf .sum,
  .conf .keep,
  .conf .lnk {
    text-align: left;
  }
  .big-ok {
    display: grid;
    place-items: center;
    width: 72px;
    height: 72px;
    margin: 4px auto 12px;
    border-radius: 50%;
    background: var(--hi);
    color: var(--paper);
  }
  .keep {
    margin: 14px 0 6px;
    font-size: var(--fs-small);
  }
  .lnk {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    padding: 8px 10px;
    border-radius: 10px;
    background: var(--paper-2);
    font-size: var(--fs-small);
  }
  .lnk span {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
    color: var(--ink-2);
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
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 16px;
  }
  .two .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .btn.bad {
    border-color: var(--bad);
    background: var(--bad);
    color: var(--paper);
  }
  .ask {
    margin: 16px 0 0;
    font-weight: 600;
  }
  .mine {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
