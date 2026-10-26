<script>
  /**
   * Gruppenfahrt für Events (Noah 26.10.2026 «5», «5a»): what the QR code of a contact card opens
   * (#/karte/<card>). The card travels only after the # of the link, so no server sees it. Shown with the
   * ways to reach the person; with the app on this device «Keep» puts it under Ich › Mit Freunden ›
   * Kontaktkarte, in the event you write (only with you).
   */
  import { untrack } from 'svelte';
  import { Contact, AtSign, Phone } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { t } from '../lib/i18n.svelte.js';
  import Empty from '../lib/ui/Empty.svelte';
  import { readCard } from '../lib/live/event.js';
  import { PEOPLE_KEY, peopleOf, addPerson, instaLink, telLink } from '../lib/freunde/people.js';
  import '../lib/live/event.css';

  let { hash = '' } = $props();
  const card = readCard(untrack(() => hash));
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
  {:else}
    <p class="kc-kick">{t('Contact card')}</p>
    <h1 tabindex="-1" data-page-title>{card.name}</h1>
    <section class="card ev-box">
      {#if card.bike || card.note}<p>{[card.bike, card.note].filter(Boolean).join(' · ')}</p>{/if}
      <div class="ev-acts">
        {#if card.insta}<a class="btn" href={instaLink(card.insta)} target="_blank" rel="noopener noreferrer"><AtSign size={18} aria-hidden="true" />{card.insta}</a>{/if}
        {#if card.phone}<a class="btn" href={telLink(card.phone)}><Phone size={18} aria-hidden="true" />{card.phone}</a>{/if}
      </div>
    </section>
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
  .kc-kick {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
</style>
