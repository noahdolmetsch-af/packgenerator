<script>
  /**
   * Gruppenfahrt für Events (Noah 26.10.2026 «5», mockup G7, «5a»): Ich › Mit Freunden › Kontaktkarte.
   * New people at an event: show your card, they scan the QR code with the phone camera, done. The QR code
   * is a link with the card after the #, so nothing goes to a server. Their card you scan from a photo
   * (Chrome on Android) or add by hand. The people are kept by event, only with you (your devices, the sealed sync and your backup); events are renamed,
   * sorted (arrows and drag) and deleted (their people stay), people are changed and deleted (asked first, Undo).
   */
  import { liveQuery } from 'dexie';
  import { Pencil, Trash2, Plus, Camera, Phone, AtSign, Mail } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import QrCode from '../ich/QrCode.svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import GroupDeleteSheet from '../ui/GroupDeleteSheet.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { cardLink, readCard } from '../live/event.js';
  import { CARD_KEY, PEOPLE_KEY, SHOWN, SHOW_DEFAULT, peopleOf, cardShown, addPerson, groupFor, updatePerson, removePerson, renameGroup, moveGroup, deleteGroup, byGroup, instaLink, telLink, mailLink } from './people.js';
  import '../live/event.css';

  let { me = '' } = $props();
  const cardQ = liveQuery(async () => (await db.settings.get(CARD_KEY))?.value ?? null);
  const peopleQ = liveQuery(async () => peopleOf((await db.settings.get(PEOPLE_KEY))?.value));
  const list = $derived($peopleQ ?? peopleOf(null));
  const savePeople = (v) => db.settings.put({ key: PEOPLE_KEY, value: v });

  let card = $state({ name: '', ...Object.fromEntries(SHOWN.map((f) => [f, ''])), show: { ...SHOW_DEFAULT } });
  let seen = false;
  $effect(() => {
    if (seen || $cardQ === undefined) return;
    seen = true;
    card = { ...card, ...($cardQ ?? {}), name: $cardQ?.name || me || '', show: { ...card.show, ...($cardQ?.show ?? {}) } };
  });
  const saveCard = () => db.settings.put({ key: CARD_KEY, value: $state.snapshot(card) });
  const shown = $derived(cardShown(card));
  const link = $derived(shown.name ? cardLink(shown, `${location.origin}${location.pathname}`) : '');
  /* Kontakt-QR-Code (Noah 27.10.2026 «2b»): one card, tick every part on or off before you show it. */
  const LABEL = { phone: 'Phone number', wa: 'WhatsApp number', email: 'E-mail', insta: 'Instagram', strava: 'Strava', komoot: 'Komoot', web: 'Website', addr: 'Address', bike: 'Bike', note: 'A line about you' };
  const TYPE = { phone: 'tel', wa: 'tel', email: 'email', web: 'url' };
  const HINT = { wa: 'Often the same as your phone number', strava: 'Link or number of your profile', komoot: 'Link or user name', web: 'e.g. example.ch', addr: 'Street, postcode and town' };
  const MAXLEN = (f) => (f === 'note' || f === 'addr' ? 120 : f === 'web' || f === 'strava' || f === 'komoot' ? 100 : 60);

  /* someone else's card: scanned from a photo, or by hand */
  let fileEl = $state(null);
  let scanErr = $state('');
  let got = $state(null);
  let event = $state('');
  async function scan(e) {
    const f = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    scanErr = '';
    if (!f) return;
    if (!('BarcodeDetector' in window)) return (scanErr = t('This browser cannot read QR codes. Scan the code with the phone camera instead; the link opens the card.'));
    try {
      const codes = await new window.BarcodeDetector({ formats: ['qr_code'] }).detect(await createImageBitmap(f));
      const c = codes.map((x) => readCard(String(x.rawValue).slice(String(x.rawValue).indexOf('#')))).find(Boolean);
      if (!c) return (scanErr = t('No contact card found in this picture.'));
      got = c;
    } catch {
      scanErr = t('The picture could not be read.');
    }
  }
  function byHand() {
    got = { name: '', insta: '', phone: '', bike: '', note: '' };
  }
  async function keep() {
    if (!got?.name?.trim()) return (scanErr = t('Write a name.'));
    await savePeople(addPerson(list, got, event));
    offerDone(t('«{name}» is kept.', { name: got.name.trim() }));
    got = null;
  }

  /* the people and their events */
  const groups = $derived(byGroup(list));
  let renaming = $state(null);
  let deleting = $state(null);
  let editing = $state(null);
  async function confirmDelete(to) {
    const g = deleting;
    const before = list;
    await savePeople(deleteGroup(list, g.id, to ?? ''));
    offerDone(t('«{name}» deleted.', { name: g.name }), () => savePeople(before));
  }
  async function removeP(p) {
    const a = await askDelete({ title: t('Delete «{name}»?', { name: p.name }), text: t('The person is deleted from your list.') });
    if (a !== 'delete') return;
    await deleteWithUndo({
      name: p.name,
      text: t('«{name}» deleted.', { name: p.name }),
      run: async () => {
        const before = list;
        await savePeople(removePerson(list, p.id));
        return before;
      },
      undo: (before) => savePeople(before),
    });
  }
  async function saveEdit() {
    const e = editing;
    const [l, gid] = groupFor(list, e.event);
    await savePeople(updatePerson(l, e.id, { name: e.name.trim() || e.old, insta: e.insta.trim(), phone: e.phone.trim(), bike: e.bike, memo: e.memo.trim(), group: gid }));
    editing = null;
  }
  const evName = (id) => list.groups.find((g) => g.id === id)?.name ?? '';
</script>

<section class="card ev-box" aria-labelledby="cc-h" data-contact-card>
  <h2 id="cc-h">{t('Contact card')}</h2>
  <p class="ev-muted">{t('New people at an event: show your card, they scan the QR code, done. Nothing goes to a server.')}</p>
  <p class="ev-muted">{t('Tick before you show it: only what is ticked goes into the QR code. The other person can save you to their contacts with one tap. A shared card cannot be taken back.')}</p>
  <div class="cc-grid">
    <div class="ev-box">
      <label class="ev-fld"><span>{t('First name')}</span><input type="text" bind:value={card.name} maxlength="60" onchange={saveCard} data-card-name /></label>
      {#each SHOWN as f (f)}
        <div class="ev-fld">
          <label class="ev-fld"><span>{t(LABEL[f])}</span><input type={TYPE[f] ?? 'text'} bind:value={card[f]} maxlength={MAXLEN(f)} placeholder={HINT[f] ? t(HINT[f]) : undefined} onchange={saveCard} data-card-field={f} /></label>
          <label class="ev-sw"><input type="checkbox" bind:checked={card.show[f]} onchange={saveCard} data-card-show={f} /> {t('On the card')}</label>
        </div>
      {/each}
    </div>
    <div class="ev-box cc-qr" data-qr-text={link}>
      {#if link}
        <QrCode text={link} label={t('Your contact card')} />
        <p class="ev-strong">{shown.name}</p>
        <p class="ev-muted">{t('On the card: {list}', { list: SHOWN.filter((f) => shown[f]).map((f) => t(LABEL[f])).join(', ') || t('only your name') })}</p>
      {:else}
        <p class="ev-muted">{t('Write your first name; then the QR code appears.')}</p>
      {/if}
    </div>
  </div>
</section>

<section class="card ev-box" aria-labelledby="cc-p-h" data-people>
  <h2 id="cc-p-h">{t('People from events')}</h2>
  <div class="ev-acts">
    <button type="button" class="btn" onclick={() => fileEl?.click()} data-card-scan><Camera size={18} aria-hidden="true" />{t('Scan a card from a photo')}</button>
    <button type="button" class="btn" onclick={byHand} data-card-byhand><Plus size={18} aria-hidden="true" />{t('Add a person by hand')}</button>
    <input type="file" accept="image/*" capture="environment" hidden bind:this={fileEl} onchange={scan} />
  </div>
  {#if scanErr}<p class="rc-warn" role="alert">{scanErr}</p>{/if}
  {#if got}
    <div class="ev-box" data-card-new>
      <div class="ev-row2">
        <label class="ev-fld"><span>{t('Name')}</span><input type="text" bind:value={got.name} maxlength="60" data-card-new-name /></label>
        <label class="ev-fld"><span>{t('Instagram')}</span><input type="text" bind:value={got.insta} maxlength="60" /></label>
        <label class="ev-fld"><span>{t('Phone number')}</span><input type="tel" bind:value={got.phone} maxlength="60" /></label>
        <label class="ev-fld"><span>{t('Met at (event)')}</span><input type="text" bind:value={event} maxlength="40" list="cc-events" placeholder={t('e.g. Jura event')} data-card-new-event /></label>
      </div>
      <datalist id="cc-events">{#each list.groups as g (g.id)}<option value={g.name}></option>{/each}</datalist>
      <div class="ev-acts">
        <button type="button" class="btn hi" onclick={keep} data-card-keep>{t('Keep')}</button>
        <button type="button" class="btn" onclick={() => (got = null)}>{t('Cancel')}</button>
      </div>
    </div>
  {/if}

  {#if list.people.length}
    {#each groups as x (x.group?.id ?? 'none')}
      <div class="ev-box" data-people-group={x.group?.name ?? ''}>
        <h3>{x.group?.name ?? t('Without an event')}</h3>
        <ul class="ev-list">
          {#each x.people as p (p.id)}
            <li data-person={p.name}>
              {#if editing?.id === p.id}
                <div class="ev-box ev-grow">
                  <div class="ev-row2">
                    <label class="ev-fld"><span>{t('Name')}</span><input type="text" bind:value={editing.name} maxlength="60" data-person-name /></label>
                    <label class="ev-fld"><span>{t('Instagram')}</span><input type="text" bind:value={editing.insta} maxlength="60" /></label>
                    <label class="ev-fld"><span>{t('Phone number')}</span><input type="tel" bind:value={editing.phone} maxlength="60" /></label>
                    <label class="ev-fld"><span>{t('Met at (event)')}</span><input type="text" bind:value={editing.event} maxlength="40" list="cc-events" /></label>
                  </div>
                  <label class="ev-fld"><span>{t('Your note')}</span><input type="text" bind:value={editing.memo} maxlength="120" placeholder={t('e.g. rides ultra races, tip for the sleeping bag')} data-person-memo /></label>
                  <div class="ev-acts"><button type="button" class="btn hi" onclick={saveEdit} data-person-save>{t('Save')}</button><button type="button" class="btn" onclick={() => (editing = null)}>{t('Cancel')}</button></div>
                </div>
              {:else}
                <span class="ev-txt"><b>{p.name}</b><small>{[p.bike, p.note, p.memo ? `«${p.memo}»` : ''].filter(Boolean).join(' · ')}</small></span>
                <span class="ev-acts">
                  {#if p.insta}<a class="btn sm" href={instaLink(p.insta)} target="_blank" rel="noopener noreferrer" aria-label={t('Instagram of {name}', { name: p.name })}><AtSign size={16} aria-hidden="true" /></a>{/if}
                  {#if p.phone}<a class="btn sm" href={telLink(p.phone)} aria-label={t('Call {name}', { name: p.name })}><Phone size={16} aria-hidden="true" /></a>{/if}
                  {#if mailLink(p.email)}<a class="btn sm" href={mailLink(p.email)} aria-label={t('E-mail to {name}', { name: p.name })}><Mail size={16} aria-hidden="true" /></a>{/if}
                  <button type="button" class="btn sm" onclick={() => (editing = { ...p, old: p.name, event: evName(p.group), memo: p.memo ?? '' })} aria-label={t('Change «{name}»', { name: p.name })} data-person-edit><Pencil size={16} aria-hidden="true" /></button>
                  <button type="button" class="btn sm" onclick={() => removeP(p)} aria-label={t('Delete «{name}»', { name: p.name })} data-person-del><Trash2 size={16} aria-hidden="true" /></button>
                </span>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/each}
    {#if list.groups.length}
      <h3>{t('Your events')}</h3>
      <ul class="ev-list" use:sortable={{ onmove: (from, to) => savePeople(moveGroup(list, from, to)) }} data-people-events>
        {#each list.groups as g, i (g.id)}
          <li data-sort-id={g.id}>
            <SortGrip name={g.name} onstep={(d) => savePeople(moveGroup(list, i, i + d))} />
            <span class="ev-txt"><b>{g.name}</b><small>{t('{n} people', { n: list.people.filter((p) => p.group === g.id).length })}</small></span>
            <SortArrows name={g.name} {i} n={list.groups.length} onstep={(d) => savePeople(moveGroup(list, i, i + d))} />
            <button type="button" class="btn sm" aria-label={t('Rename «{name}»', { name: g.name })} onclick={() => (renaming = g)} data-event-rename><Pencil size={16} aria-hidden="true" /></button>
            <button type="button" class="btn sm" aria-label={t('Delete «{name}»', { name: g.name })} onclick={() => (deleting = g)} data-event-delete><Trash2 size={16} aria-hidden="true" /></button>
          </li>
        {/each}
      </ul>
    {/if}
  {:else}
    <p class="ev-muted">{t('Nobody kept yet. Scan the card of someone you met, or add a person by hand.')}</p>
  {/if}
  <p class="ev-muted">{t('Only with you: on your devices and in your backup, never in a group. Rename, sort and delete like everywhere.')}</p>
</section>

{#if renaming}
  <RenameSheet title={t('Rename «{name}»', { name: renaming.name })} value={renaming.name} max={40} onsave={async (n) => void (await savePeople(renameGroup(list, renaming.id, n)))} onclose={() => (renaming = null)} />
{/if}
{#if deleting}
  <GroupDeleteSheet
    title={t('Delete «{name}»?', { name: deleting.name })}
    count={list.people.filter((p) => p.group === deleting.id).length}
    what={(n) => t('{n} people', { n })}
    none={t('Without an event')}
    noneHint={t('They stay and show under «Without an event».')}
    targets={list.groups.filter((g) => g.id !== deleting.id).map((g) => ({ id: g.id, name: g.name }))}
    onconfirm={confirmDelete}
    onclose={() => (deleting = null)}
  />
{/if}

<style>
  .cc-grid {
    display: grid;
    gap: var(--sp-4);
  }
  .cc-qr {
    justify-items: center;
    text-align: center;
  }
  @media (min-width: 760px) {
    .cc-grid {
      grid-template-columns: minmax(0, 1fr) minmax(0, 260px);
    }
  }
</style>
