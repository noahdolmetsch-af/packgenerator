<script>
  /**
   * Paket W 1116 «Gut angekommen» (Noah 20.10.2026 «1a»): the window from Unterwegs. Pick the people of
   * this trip (your emergency contacts, the same list as «Vor der Abfahrt»), check the ready text and tap
   * «Share»: the phone's share sheet opens (SMS, WhatsApp, mail). The app itself sends nothing; no server.
   * The place goes along only when ticked, and the location is read only then (never stored).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { t } from '../i18n.svelte.js';
  import { backClose } from '../ui/backclose.js';
  import { CONTACTS_KEY, contactsOf, addContact } from '../unterwegs/abfahrt.js';
  import { whereAmI } from '../unterwegs/here.js';
  import { arrivedPeople, toggleArrived, arrivedText, smsHref, arrivePlace } from './haustuer.js';
  import { X, Send, Copy, MessageSquare, Plus, Check, MapPin, HeartHandshake } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';
  import '../unterwegs/unterwegs.css';

  let { trip, day = 0, onclose } = $props();
  const contactsQ = liveQuery(() => db.settings.get(CONTACTS_KEY));
  const contacts = $derived(contactsOf($contactsQ?.value));
  const people = $derived(arrivedPeople(trip, contacts));

  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });

  const nowHM = () => new Date().toTimeString().slice(0, 5);
  let withPlace = $state(false);
  let here = $state(null);
  let own = $state(null); // the text once the user changed it
  let msg = $state('');
  const auto = $derived(arrivedText({ t, names: people.map((p) => p.name), place: arrivePlace(trip, day), time: nowHM(), here: withPlace ? here : null }));
  const text = $derived(own ?? auto);

  async function pick(id) {
    await db.trips.update(trip.id, touched({ arrivedTo: toggleArrived(trip, id) }));
  }
  async function placeOn(e) {
    withPlace = e.currentTarget.checked;
    msg = '';
    if (withPlace && !here) {
      here = await whereAmI();
      if (!here) {
        withPlace = false;
        msg = t('Your location is not available. The text goes without it.');
      }
    }
  }

  /* a new person right here (it joins your emergency contacts) */
  let adding = $state(false);
  let cName = $state('');
  let cPhone = $state('');
  async function add(e) {
    e.preventDefault();
    const id = `nc-${Date.now().toString(36)}`;
    const list = addContact(contacts, { name: cName, phone: cPhone }, id);
    if (!list) return (msg = t('Name and phone number, please.'));
    await db.settings.put({ key: CONTACTS_KEY, value: { contacts: list } });
    await db.trips.update(trip.id, touched({ arrivedTo: [...(trip.arrivedTo ?? []), id] }));
    cName = cPhone = msg = '';
    adding = false;
  }

  async function share() {
    msg = '';
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return (msg = t('Shared. Thanks for letting them know.'));
      }
    } catch (e) {
      if (e?.name === 'AbortError') return;
    }
    copy();
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      msg = t('Text copied. Paste it into a message.');
    } catch {
      msg = t('Copying did not work here. Select the text above and copy it.');
    }
  }
</script>

<dialog class="sheet vdlg from-below uw-dlg" bind:this={dialog} use:backClose {onclose} aria-labelledby="ar-h" data-arrived>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="ar-h"><HeartHandshake size={20} aria-hidden="true" />&nbsp;{t('Arrived safely')}</h2>
      <p class="vd-sub">{t('A short message with a ready text. Your phone sends it; the app sends nothing itself.')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  <h3 class="uw-h3">{t('Who should know?')}</h3>
  {#if contacts.length}
    <div class="tp-chips" role="group" aria-label={t('Who should know?')}>
      {#each contacts as c (c.id)}
        <button type="button" class="tp-chip" aria-pressed={people.some((p) => p.id === c.id)} onclick={() => pick(c.id)} data-arrived-person={c.name}>{#if people.some((p) => p.id === c.id)}<Check size={14} aria-hidden="true" />{/if}{c.name}</button>
      {/each}
    </div>
    <p class="uw-fine">{t('Chosen for this trip; next time they are already ticked.')}</p>
  {:else if !adding}
    <p class="uw-p">{t('No one yet. Add a person with a phone number; they also appear as your emergency contacts.')}</p>
  {/if}
  {#if adding}
    <form class="ar-add" onsubmit={add}>
      <input class="inp" bind:value={cName} placeholder={t('Name')} aria-label={t('Name')} />
      <input class="inp" bind:value={cPhone} type="tel" inputmode="tel" placeholder="+41 …" aria-label={t('Phone number')} />
      <div class="uw-row"><button type="submit" class="btn ink"><Check size={16} aria-hidden="true" />{t('Save')}</button><button type="button" class="btn" onclick={() => ((adding = false), (cName = cPhone = ''))}>{t('Cancel')}</button></div>
    </form>
  {:else}
    <button type="button" class="tp-link ar-more" onclick={() => (adding = true)} data-arrived-add><Plus size={14} aria-hidden="true" /> {t('Add a person')}</button>
  {/if}

  <h3 class="uw-h3">{t('The text')}</h3>
  <textarea class="inp ar-text" rows="4" value={text} oninput={(e) => (own = e.currentTarget.value)} aria-label={t('The text')} data-arrived-text></textarea>
  <label class="ar-place"><input type="checkbox" checked={withPlace} onchange={placeOn} /><MapPin size={16} aria-hidden="true" /> {t('Add where I am (a map link)')}</label>
  {#if own != null}<button type="button" class="tp-link" onclick={() => (own = null)}>{t('Back to the ready text')}</button>{/if}
  <p class="uw-fine" role="status">{msg}</p>

  <div class="vd-foot">
    <button type="button" class="btn" onclick={copy} data-arrived-copy><Copy size={16} aria-hidden="true" />{t('Copy')}</button>
    {#if people.length}<a class="btn" href={smsHref(people.map((p) => p.phone), text)} data-arrived-sms><MessageSquare size={16} aria-hidden="true" />{t('SMS')}</a>{/if}
    <button type="button" class="btn hi" onclick={share} data-arrived-share><Send size={16} aria-hidden="true" />{t('Share')}</button>
  </div>
</dialog>

<style>
  .ar-add {
    display: grid;
    gap: 8px;
    margin-top: 8px;
  }
  .ar-more {
    margin-top: 8px;
  }
  .ar-text {
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
  }
  .ar-place {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    margin-top: 6px;
    overflow-wrap: break-word;
  }
  .vd-foot .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
</style>
