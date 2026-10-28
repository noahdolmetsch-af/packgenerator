<script>
  /**
   * Gruppenfahrt für Events (Noah 26.10.2026 «5», «5a»): what the QR code of a contact card opens
   * (#/karte/<card>). The card travels only after the # of the link, so no server sees it. Shown with the
   * ways to reach the person; with the app on this device «Keep» puts it under Ich › Mit Freunden ›
   * Kontaktkarte, in the event you write (only with you).
   * Kontakt-QR-Code (Noah 27.10.2026 «1a»): a row for each way to reach the person (call, WhatsApp, e-mail,
   * Instagram, Strava, Komoot, web, address on the map) and «Save to contacts», a contact file made here.
   * Step 3 («3a»): payment details (TWINT, Swiss QR bill) in their own box, shown only after a tap.
   */
  import { untrack } from 'svelte';
  import { Contact, AtSign, Phone, MessageCircle, Mail, Activity, Mountain, Globe, MapPin, Download, ChevronRight } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { t, locale } from '../lib/i18n.svelte.js';
  import Empty from '../lib/ui/Empty.svelte';
  import CardPay from '../lib/freunde/CardPay.svelte';
  import { readCard } from '../lib/live/event.js';
  import { PEOPLE_KEY, peopleOf, addPerson, instaLink, telLink, waLink, mailLink, stravaLink, komootLink, webLink, mapLink, cardVcf, expired } from '../lib/freunde/people.js';
  import { localDay } from '../lib/localday.js';
  import '../lib/live/event.css';

  let { hash = '' } = $props();
  const card = readCard(untrack(() => hash));
  /* Kontakt-QR-Code «4a»: after its last day the card says «expired» and shows nothing more (soft, no server) */
  const over = card ? expired(card.until, localDay()) : false;
  const untilText = (d) => new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' });
  /* the ways to reach the person, in the order of the card; a part without a usable link is left out */
  const ways = card
    ? [
        { f: 'phone', icon: Phone, label: 'Call', href: telLink(card.phone) },
        { f: 'wa', icon: MessageCircle, label: 'WhatsApp', href: waLink(card.wa) },
        { f: 'email', icon: Mail, label: 'E-mail', href: mailLink(card.email) },
        { f: 'insta', icon: AtSign, label: 'Instagram', href: instaLink(card.insta) },
        { f: 'strava', icon: Activity, label: 'Strava', href: stravaLink(card.strava) },
        { f: 'komoot', icon: Mountain, label: 'Komoot', href: komootLink(card.komoot) },
        { f: 'web', icon: Globe, label: 'Website', href: webLink(card.web) },
        { f: 'addr', icon: MapPin, label: 'Address', href: mapLink(card.addr) },
      ].filter((w) => w.href)
    : [];
  const outside = (h) => h.startsWith('http');
  function saveContact() {
    const url = URL.createObjectURL(new Blob([cardVcf(card)], { type: 'text/vcard' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${card.name.replace(/[^\p{L}\d _-]/gu, '').trim() || 'kontakt'}.vcf`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  let event = $state('');
  let kept = $state(false);
  async function keep() {
    const now = peopleOf((await db.settings.get(PEOPLE_KEY))?.value);
    await db.settings.put({ key: PEOPLE_KEY, value: addPerson(now, card, event) });
    kept = true;
  }
</script>

<div class="page kc-page" data-card-page>
  {#if !card}
    <Empty icon={Contact} title={t('Contact card not readable')} text={t('This link is not complete. Ask for the card again.')} />
  {:else if over}
    <div data-card-expired><Empty icon={Contact} title={t('This card has expired')} text={t('Ask {name} for a new card.', { name: card.name })} /></div>
  {:else}
    <p class="kc-kick">{t('Contact card')}</p>
    <h1 tabindex="-1" data-page-title>{card.name}</h1>
    {#if card.until}<p class="kc-line" data-card-valid>{t('Shared until {day}', { day: untilText(card.until) })}</p>{/if}
    {#if card.bike || card.note}<p class="kc-line">{[card.bike, card.note].filter(Boolean).join(' · ')}</p>{/if}
    <div><button type="button" class="btn hi kc-save" onclick={saveContact} data-card-vcf><Download size={20} aria-hidden="true" />{t('Save to contacts')}</button></div>
    {#if ways.length}
      <section class="card kc-ways" aria-label={t('Ways to reach {name}', { name: card.name })}>
        <ul>
          {#each ways as w (w.f)}
            {@const Icon = w.icon}
            <li>
              <a href={w.href} target={outside(w.href) ? '_blank' : undefined} rel={outside(w.href) ? 'noopener noreferrer' : undefined} data-card-way={w.f}>
                <span class="kc-ico"><Icon size={18} aria-hidden="true" /></span>
                <span class="kc-tx"><b>{t(w.label)}</b><small>{card[w.f]}</small></span>
                <ChevronRight size={18} aria-hidden="true" />
              </a>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
    {#if card.pay}<CardPay pay={card.pay} name={card.name} />{/if}
    <section class="card ev-box" aria-labelledby="kc-k-h">
      <h2 id="kc-k-h">{t('Keep in the Pack Generator')}</h2>
      {#if kept}
        <p class="ev-strong" role="status" data-card-kept>{t('Kept. You find the person under Me › With friends › Contact card.')}</p>
        <div><a class="btn" href="#/me/freunde?tab=card">{t('Open')}</a></div>
      {:else}
        <label class="ev-fld"><span>{t('Met at (event)')}</span><input type="text" bind:value={event} maxlength="40" placeholder={t('e.g. Jura event')} data-card-event /></label>
        <div><button type="button" class="btn hi" onclick={keep} data-card-keep>{t('Keep')}</button></div>
        <p class="ev-muted">{t('Only with you: on your devices and in your backup, never in a group.')}</p>
      {/if}
    </section>
  {/if}
</div>

<style>
  .kc-page {
    display: grid;
    gap: var(--sp-4);
    max-width: 640px;
    margin: 0 auto;
    padding: var(--sp-4);
  }
  .kc-page h1 {
    margin: 0;
  }
  .kc-line {
    margin: 0;
    color: var(--ink-2);
  }
  .kc-save {
    width: 100%;
  }
  .kc-ways ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .kc-ways li + li {
    border-top: 1px solid var(--line);
  }
  .kc-ways a {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-height: 56px;
    padding: var(--sp-2) 0;
    color: var(--ink);
    text-decoration: none;
  }
  .kc-ico {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    flex: none;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .kc-tx {
    flex: 1;
    min-width: 0;
    display: grid;
  }
  .kc-tx small {
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .kc-kick {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
</style>
