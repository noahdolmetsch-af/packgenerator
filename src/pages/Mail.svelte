<script>
  /**
   * Google Mail (package GM «Google Teil 3», Noah 15.10.2026 12:04 «emails versenden in der app, email
   * eingang, kalendereinträge + zugehörige emails», 12:16 «4a» read and send together, 12:17 «vorerst ohne
   * mockup»): Ich › Mail (#/me/mail). The inbox, a search, one mail to read, an answer or a new mail.
   * «#/me/mail?q=…&for=…» shows the mails to an appointment (from «Termine und Aufgaben»).
   * Nothing is kept on the device; a mail goes out only after the tap on «Senden».
   */
  import { onMount } from 'svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import { mail, loadPrefs, checkAllowed, loadList, openMail, sendMail, connect, savePrefs } from '../lib/mail/client.svelte.js';
  import { replySubject, quoteOf, whenOf, sizeOf } from '../lib/mail.js';
  import { readKey, STRAVA_HASH } from '../lib/strava/client.svelte.js';
  import { Mail, Search, PenLine, Reply, Send, ExternalLink, Paperclip, Link, Lock, X, RefreshCw, CalendarDays, Inbox, Tag, Forward } from '@lucide/svelte';
  // «Mail in die App» (Noah 19.10.2026 «1a»): «In die App übernehmen» puts the mail with its attachments into the
  // Eingang; «Aus der App anhängen» (5a) sends a packing list, a trip plan or a document along
  import { takeMail, intake } from '../lib/mail/intake.svelte.js';
  import { MAIL_LABEL } from '../lib/mailin.js';
  import { db } from '../lib/db.js';
  import '../lib/ich/ich.css';
  import { t, tn, locale } from '../lib/i18n.svelte.js';

  const hasKey = readKey();
  const params = new URLSearchParams(location.hash.split('?')[1] ?? '');
  const forEvent = params.get('for');
  let q = $state(params.get('q') ?? '');
  let openId = $state(null);
  let draft = $state(null); // { to, cc, subject, text, replyTo? }
  let msg = $state('');
  let taken = $state({}); // mail id → true when it is in the Eingang now
  async function intoApp(m) {
    msg = '';
    const res = await takeMail(m.id, { mail: $state.snapshot(mail.open) });
    if (res) taken = { ...taken, [m.id]: true };
    else msg = t('This mail could not be taken into the app. Try again later.');
  }
  // 5a: what can go along: the packing list and plan of a trip (a small PDF), or a document
  let pick = $state(''); // '' | 'trip:<id>' | 'doc:<id>'
  let options = $state({ trips: [], docs: [] });
  async function loadOptions() {
    const trips = (await db.trips.toArray()).filter((x) => !x.skipped).sort((a, b) => String(b.startDate ?? '').localeCompare(String(a.startDate ?? ''))).slice(0, 12);
    const docs = (await db.docs.toArray()).filter((d) => !d.noteId).sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))).slice(0, 30);
    options = { trips: trips.map((x) => ({ id: x.id, name: x.title || x.startDate })), docs: docs.filter((d) => (d.bytes ?? 0) <= 3 * 1024 * 1024).map((d) => ({ id: d.id, name: d.name })) };
  }
  function attach() {
    if (!pick || !draft || (draft.files ?? []).length >= 3) return;
    const [kind, id] = pick.split(':');
    const name = (kind === 'trip' ? options.trips : options.docs).find((x) => x.id === id)?.name ?? '';
    if (!(draft.files ?? []).some((f) => f.key === pick)) draft.files = [...(draft.files ?? []), { key: pick, kind, id, name }];
    pick = '';
  }
  /** The attachments as the server takes them: [{ name, type, data (base64) }]. */
  async function filesOf(list) {
    const out = [];
    const b64 = (dataUrl) => String(dataUrl).slice(String(dataUrl).indexOf(',') + 1);
    for (const f of list ?? []) {
      if (f.kind === 'doc') {
        const d = await db.docs.get(f.id);
        if (d?.data) out.push({ name: `${d.name || 'dokument'}.${d.kind === 'photo' ? 'jpg' : 'pdf'}`, type: d.kind === 'photo' ? 'image/jpeg' : 'application/pdf', data: b64(d.data) });
      } else {
        const tr = await db.trips.get(f.id);
        if (!tr) continue;
        const items = new Map((await db.items.toArray()).map((i) => [i.id, i]));
        const { textPdf } = await import('../lib/docs/textpdf.js');
        const day = (x) => (x ? x.split('-').reverse().join('.') : '');
        const lines = [tr.title || t('Trip'), `${day(tr.startDate)} · ${tn(tr.days ?? 1, '{n} day', '{n} days')}${tr.bike ? ` · ${tr.bike}` : ''}`, '', t('Packing list'), ...(tr.entries ?? []).map((e) => `• ${items.get(e.itemId)?.name ?? e.name ?? e.itemId}${(e.qty ?? 1) > 1 ? ` × ${e.qty}` : ''}`), ...((tr.planNotes ?? []).length ? ['', t('Plan'), ...tr.planNotes.map((n) => `• ${n.text}`)] : [])];
        out.push({ name: `${(tr.title || 'tour').replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40)}.pdf`, type: 'application/pdf', data: b64(await textPdf(lines, { title: lines[0] })) });
      }
    }
    return out;
  }

  onMount(async () => {
    // «#/me/mail?attach=trip:<id>» or «doc:<id>»: a new mail with that already attached (5a)
    loadOptions()
      .then(() => {
        const a = params.get('attach');
        if (a && /^(trip|doc):/.test(a)) {
          newMail();
          pick = a;
          attach();
        }
      })
      .catch(() => {});
    const p = await loadPrefs();
    if (!hasKey) return;
    const ok = p.allowed || (await checkAllowed());
    if (ok) loadList({ q });
  });

  const gmailLink = (m) => `https://mail.google.com/mail/u/0/#all/${encodeURIComponent(m.thread)}`;
  const when = (iso) => whenOf(iso, new Date(), locale());

  function search(e) {
    e.preventDefault();
    openId = null;
    loadList({ q: q.trim() });
  }
  function clearSearch() {
    q = '';
    openId = null;
    history.replaceState(null, '', `${location.pathname}#/me/mail`);
    loadList({ q: '' });
  }
  async function toggle(m) {
    if (openId === m.id) return (openId = null);
    openId = m.id;
    if (mail.open?.id !== m.id) await openMail(m.id);
  }
  function answer(m) {
    draft = { to: m.from, cc: '', subject: replySubject(m.subject), text: (mail.prefs.sig ? `\n\n${mail.prefs.sig}` : '') + quoteOf(m, when(m.date)), replyTo: m.id, files: [] };
    openId = null;
    scrollTo({ top: 0, behavior: 'smooth' });
  }
  const newMail = () => (draft = { to: '', cc: '', subject: '', text: mail.prefs.sig ? `\n\n${mail.prefs.sig}` : '', files: [] });
  async function send(e) {
    e.preventDefault();
    const files = draft.files?.length ? await filesOf($state.snapshot(draft.files)) : [];
    const id = await sendMail({ to: draft.to, cc: draft.cc || undefined, subject: draft.subject, text: draft.text, ...(draft.replyTo ? { replyTo: draft.replyTo } : {}), ...(files.length ? { files } : {}) });
    if (id) {
      msg = t('Sent to {to}.', { to: draft.to });
      draft = null;
    }
  }

  const errorText = (code) =>
    ({
      denied: t('The Google login was cancelled. Nothing changed.'),
      expired: t('The login took too long. Try again.'),
      scope: t('Google gave no access. Try again and allow mail.'),
      unauthorized: t('This device has no key yet: connect Strava on this device first.'),
      not_set_up: t('Google is not set up on the server yet.'),
      network: t('No connection. Try again later.'),
      google_login_needed: t('Google needs a new login.'),
      mail_not_allowed: t('Mail is not allowed yet: connect it again.'),
      bad_request: t('Please check the address and the text.'),
      google_missing: t('This mail is no longer in Gmail.'),
    })[code] ?? t('Google answered with an error. Try again later.');
</script>

<div class="mailpage">
  <VeloHead crumbs={[{ label: t('Plan|place'), href: '#/week' }]} here={t('Mail')} title={t('Mail')} sub={t('Your Gmail inbox in the app: read, search, answer, write. Nothing is kept on the device; a mail goes out only when you tap «Send».')} />

  {#if mail.error}<p class="err" role="status">{errorText(mail.error)}</p>{/if}
  {#if msg}<p class="msg" role="status">{msg}</p>{/if}

  <div class="ich-cols">
    <div class="ich-main">
      {#if !mail.prefs.allowed}
        <section class="ich-sec" aria-labelledby="con-h">
          <div class="ich-h"><div><h2 id="con-h">{t('Connect Gmail')}</h2><p class="ich-hs">{t('the same login as Fitbit and Drive')}</p></div></div>
          <div class="card ich-body">
            {#if hasKey}
              <button type="button" class="btn hi big wide" disabled={!mail.loaded} onclick={() => connect()}><Link size={16} aria-hidden="true" />{t('Connect with Google')}</button>
            {:else}
              <p class="ich-help">{t('This device needs the app key once. It comes with the Strava login; after that Google and Trello work here too.')}</p>
              <a class="btn hi big wide" href={STRAVA_HASH}>{t('Unlock this device (once)')}</a>
            {/if}
            <p class="note"><Lock size={14} aria-hidden="true" /><span><b>{t('Read and send only; no mail is kept by the app or the server.')}</b> {t('Google says «unverified app» the first time: that is normal and free.')}</span></p>
          </div>
        </section>
      {:else}
        <div class="acts">
          {#if !draft}<button type="button" class="btn hi" onclick={newMail}><PenLine size={16} aria-hidden="true" />{t('New mail')}</button>{/if}
          <form class="find" role="search" onsubmit={search}>
            <Search size={16} aria-hidden="true" />
            <input type="search" bind:value={q} placeholder={t('Search in Gmail')} aria-label={t('Search in Gmail')} />
            {#if mail.q}<button type="button" class="ib" aria-label={t('Back to the inbox')} onclick={clearSearch}><X size={16} aria-hidden="true" /></button>{/if}
          </form>
        </div>

        {#if draft}
          <form class="card ich-body form" onsubmit={send} aria-label={draft.replyTo ? t('Answer|verb') : t('New mail')}>
            <label>{t('To|mail')}<input type="text" bind:value={draft.to} required autocomplete="email" placeholder="name@example.ch" /></label>
            <label>{t('Cc (optional)')}<input type="text" bind:value={draft.cc} /></label>
            <label>{t('Subject')}<input type="text" bind:value={draft.subject} maxlength="300" /></label>
            <label>{t('Text|mail')}<textarea bind:value={draft.text} rows="9" required></textarea></label>
            <!-- 5a: a packing list, a trip plan or a document along (at most 3, together at most 3 MB) -->
            <div class="attach">
              <label>{t('Attach from the app')}<select bind:value={pick} onchange={attach} disabled={(draft.files ?? []).length >= 3}>
                <option value="">{t('Choose …')}</option>
                {#if options.trips.length}<optgroup label={t('Packing list and plan of a trip')}>{#each options.trips as x (x.id)}<option value={`trip:${x.id}`}>{x.name}</option>{/each}</optgroup>{/if}
                {#if options.docs.length}<optgroup label={t('Documents')}>{#each options.docs as x (x.id)}<option value={`doc:${x.id}`}>{x.name}</option>{/each}</optgroup>{/if}
              </select></label>
              {#if draft.files?.length}
                <ul class="files" aria-label={t('Attachments')}>
                  {#each draft.files as f (f.key)}<li><Paperclip size={14} aria-hidden="true" /> {f.name}{f.kind === 'trip' ? ` · ${t('PDF')}` : ''} <button type="button" class="ib" aria-label={t('Remove {name}', { name: f.name })} onclick={() => (draft.files = draft.files.filter((x) => x.key !== f.key))}><X size={14} aria-hidden="true" /></button></li>{/each}
                </ul>
              {/if}
            </div>
            <div class="go">
              <button type="button" class="btn" onclick={() => (draft = null)}>{t('Cancel')}</button>
              <button type="submit" class="btn hi" disabled={mail.busy === 'send' || !draft.to.trim() || !draft.text.trim()}><Send size={16} aria-hidden="true" />{mail.busy === 'send' ? t('Sending…') : t('Send')}</button>
            </div>
          </form>
        {/if}

        <section class="ich-sec" aria-labelledby="in-h">
          <div class="ich-h">
            <div><h2 id="in-h">{mail.q ? (forEvent ? t('Mails to «{name}»', { name: forEvent }) : t('Found')) : t('Inbox|mail')}</h2>{#if mail.q}<p class="ich-hs">{mail.q}</p>{/if}</div>
            <button type="button" class="ib" aria-label={t('Fetch now')} disabled={!!mail.busy} onclick={() => loadList({ q: mail.q })}><RefreshCw size={16} aria-hidden="true" /></button>
          </div>
          {#if mail.busy === 'list' && !mail.list.length}
            <p class="ich-help">{t('Fetching…')}</p>
          {:else if !mail.list.length}
            <p class="ich-help">{mail.q ? t('No mail found.') : t('The inbox is empty.')}</p>
          {:else}
            <ul class="card ich-list">
              {#each mail.list as m (m.id)}
                <li class:on={openId === m.id}>
                  <button type="button" class="ich-row row" class:unread={m.unread} aria-expanded={openId === m.id} onclick={() => toggle(m)}>
                    <span class="dot" class:off={!m.unread} aria-hidden="true"></span>
                    <span class="ich-m"><b>{m.fromName || m.from}</b><span class="subj">{m.subject}</span><small>{m.snippet}</small></span>
                    <span class="when">{when(m.date)}</span>
                  </button>
                  {#if openId === m.id}
                    <div class="more">
                      {#if mail.busy === 'open' && mail.open?.id !== m.id}
                        <p class="ich-help">{t('Fetching…')}</p>
                      {:else if mail.open?.id === m.id}
                        <p class="ich-help">{t('From {from}', { from: m.from })}{#if mail.open.to}{' · '}{t('to {to}', { to: mail.open.to })}{/if}</p>
                        <div class="text">{mail.open.text || m.snippet}</div>
                        {#if mail.open.files?.length}
                          <ul class="files" aria-label={t('Attachments')}>
                            {#each mail.open.files as f (f.name)}<li><Paperclip size={14} aria-hidden="true" /> {f.name} <small>{sizeOf(f.size)}</small></li>{/each}
                          </ul>
                        {/if}
                        <div class="btns">
                          <button type="button" class="btn sm hi" onclick={() => answer(mail.open)}><Reply size={15} aria-hidden="true" />{t('Answer|verb')}</button>
                          {#if taken[m.id]}
                            <a class="btn sm" href="#/inbox"><Inbox size={15} aria-hidden="true" />{t('In the Inbox · open')}</a>
                          {:else}
                            <button type="button" class="btn sm" disabled={intake.busy === 'take'} onclick={() => intoApp(m)}><Inbox size={15} aria-hidden="true" />{intake.busy === 'take' ? t('Taking it in …') : t('Into the app')}</button>
                          {/if}
                          <a class="btn sm" href={gmailLink(m)} target="_blank" rel="noopener"><ExternalLink size={15} aria-hidden="true" />{t('Open in Gmail')}</a>
                        </div>
                      {/if}
                    </div>
                  {/if}
                </li>
              {/each}
            </ul>
            {#if mail.next}<button type="button" class="btn wide more-b" disabled={!!mail.busy} onclick={() => loadList({ q: mail.q, more: true })}>{mail.busy === 'more' ? t('Fetching…') : t('Show more')}</button>{/if}
          {/if}
        </section>
      {/if}
    </div>

    {#if mail.prefs.allowed}
      <div class="ich-side">
        <section class="ich-sec" aria-labelledby="how-h">
          <div class="ich-h"><div><h2 id="how-h">{t('How it works')}</h2></div></div>
          <ul class="card ich-list">
            <li class="ich-row"><span class="ich-ib"><Lock size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Nothing kept')}</b><small>{t('The app fetches only what this page shows; a mail stays only when you tap «Into the app».')}</small></span></li>
            <li class="ich-row"><span class="ich-ib"><Send size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Sent only by you')}</b><small>{t('A mail goes out only after your tap on «Send».')}</small></span></li>
            <li><a class="ich-row" href="#/me/agenda"><span class="ich-ib"><CalendarDays size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Mails to an appointment')}</b><small>{t('Appointments and tasks › an appointment › «Mails to it»')}</small></span></a></li>
          </ul>
        </section>
        <!-- «Mail in die App» 2a + 1a: the label and the +pack address, with the clicks for the Gmail filter -->
        <section class="ich-sec" aria-labelledby="in-app-h">
          <div class="ich-h"><div><h2 id="in-app-h">{t('Mails into the app by themselves')}</h2><p class="ich-hs">{t('they land in the Inbox; you sort them')}</p></div></div>
          <div class="card ich-body steps">
            <p class="ich-help"><Tag size={15} aria-hidden="true" /> <b>{t('Label')}</b> · {t('Give a mail the Gmail label «{label}»: on the phone open the mail › ⋮ › «Change labels». The app fetches it when the Inbox opens.', { label: MAIL_LABEL })}</p>
            <p class="ich-help"><Forward size={15} aria-hidden="true" /> <b>{t('Forward')}</b> · {t('Forward a mail to your own address with «+pack», e.g. firstname.name+pack@gmail.com. Gmail delivers it to you; a filter puts the label on. Set the filter up once:')}</p>
            <ol>
              <li>{t('On the computer open Gmail in Chrome; in the search bar at the top click the sliders icon on the right.')}</li>
              <li>{t('Under «To» type your address with +pack, e.g. firstname.name+pack@gmail.com.')}</li>
              <li>{t('Click «Create filter».')}</li>
              <li>{t('Tick «Apply the label» › «New label» › type «{label}» › «Create».', { label: MAIL_LABEL })}</li>
              <li>{t('Click «Create filter». Done: from now on it works from every device.')}</li>
            </ol>
          </div>
        </section>
        <section class="ich-sec" aria-labelledby="sig-h">
          <div class="ich-h"><div><h2 id="sig-h">{t('Signature')}</h2><p class="ich-hs">{t('optional, under every new mail')}</p></div></div>
          <div class="card ich-body form">
            <label>{t('Signature')}<textarea rows="3" maxlength="500" value={mail.prefs.sig} onchange={(e) => savePrefs({ sig: e.currentTarget.value })}></textarea></label>
          </div>
        </section>
      </div>
    {/if}
  </div>
</div>

<style>
  .attach select {
    display: block;
    width: 100%;
  }
  .steps ol {
    margin: 6px 0 0;
    padding-left: 1.3em;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .steps li + li {
    margin-top: 4px;
  }
  .mailpage {
    max-width: 1100px;
    min-width: 0;
  }
  .err {
    margin: 0 0 12px;
    color: var(--bad);
  }
  .msg {
    margin: 0 0 12px;
    color: var(--ink-2);
  }
  .ich-h {
    align-items: center;
  }
  .note {
    display: flex;
    gap: 8px;
    margin: 12px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .note :global(svg) {
    flex: none;
    margin-top: 3px;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 14px;
  }
  .acts :global(svg),
  .btns :global(svg) {
    flex: none;
  }
  .find {
    flex: 1 1 240px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 4px 0 12px;
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink-3);
  }
  .find input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    font: inherit;
    color: var(--ink);
    outline: none;
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  .row {
    width: 100%;
    border: 0;
    background: transparent;
    font: inherit;
    text-align: left;
    color: inherit;
    cursor: pointer;
    align-items: flex-start;
  }
  .row .ich-m b {
    font-weight: 500;
  }
  .row.unread .ich-m b,
  .row.unread .subj {
    font-weight: 700;
  }
  .subj {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .row small {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .dot {
    flex: none;
    width: 8px;
    height: 8px;
    margin-top: 8px;
    border-radius: 50%;
    background: var(--hi);
  }
  .dot.off {
    background: transparent;
  }
  .when {
    flex: none;
    font-size: var(--fs-small);
    color: var(--ink-3);
    white-space: nowrap;
  }
  .more {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0 16px 14px 36px;
  }
  .more p {
    margin: 0;
  }
  .text {
    white-space: pre-line;
    overflow-wrap: break-word;
    max-height: 60vh;
    overflow: auto;
    color: var(--ink);
  }
  .files {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: var(--fs-small);
  }
  .files small {
    color: var(--ink-3);
  }
  .btns {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0 0 14px;
  }
  .form label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .form input,
  .form textarea {
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
    background: var(--paper);
    font: inherit;
    color: var(--ink);
  }
  .form textarea {
    padding: 10px 12px;
    resize: vertical;
  }
  .go {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }
  .wide {
    width: 100%;
    justify-content: center;
  }
  .more-b {
    margin-top: 10px;
  }
</style>
