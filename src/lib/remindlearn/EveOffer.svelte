<script>
  /**
   * Idee A2: «You usually do the evening check at 21:30. Move the reminder to 21:15?» with «Move it» and
   * «No, thanks»; after «Move it» one tap on «Undo» puts the old time back. Shown on «Gepackt» and on
   * Ich › Erinnerungen aufs Handy, only when remindlearn/learn.js has an offer.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { OWN_KEY, normOwn, setOwn, timeText } from '../ownvalues.js';
  import { LEARN_KEY, eveOffer, declineEve } from './learn.js';
  import { Clock } from '@lucide/svelte';

  const q = liveQuery(() => db.settings.bulkGet([LEARN_KEY, OWN_KEY]));
  const learn = $derived($q?.[0]?.value ?? null);
  const own = $derived($q?.[1]?.value ?? null);
  const current = $derived(normOwn(own).eveRemindAt);
  const offer = $derived($q ? eveOffer(learn, current) : null);
  let moved = $state(null); // { from, to } after «Move it», for Undo

  async function take() {
    const from = current;
    await db.settings.put({ key: OWN_KEY, value: setOwn(own, 'eveRemindAt', offer.at) });
    moved = { from, to: offer.at };
  }
  async function undo() {
    const raw = (await db.settings.get(OWN_KEY))?.value ?? null;
    await db.settings.put({ key: OWN_KEY, value: setOwn(raw, 'eveRemindAt', moved.from) });
    moved = null;
  }
  async function no() {
    await db.settings.put({ key: LEARN_KEY, value: declineEve(learn, offer.at) });
  }
</script>

{#if moved}
  <div class="card eo" role="status" data-eve-offer>
    <span class="eo-ib" aria-hidden="true"><Clock size={18} /></span>
    <p class="eo-t">{t('The evening reminder now comes at {time}.', { time: timeText(moved.to) })}</p>
    <button type="button" class="btn" onclick={undo}>{t('Undo')}</button>
  </div>
{:else if offer}
  <div class="card eo" data-eve-offer>
    <span class="eo-ib" aria-hidden="true"><Clock size={18} /></span>
    <p class="eo-t">{t('You usually do the evening check at {usual}. Move the reminder to {at}?', { usual: timeText(offer.usual), at: timeText(offer.at) })}</p>
    <span class="eo-acts">
      <button type="button" class="btn hi" onclick={take}>{t('Move it')}</button>
      <button type="button" class="btn" onclick={no}>{t('No, thanks')}</button>
    </span>
  </div>
{/if}

<style>
  .eo {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 12px;
    padding: 12px 16px;
    margin: 12px 0;
  }
  .eo-ib {
    display: grid;
    flex: none;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--hi-soft);
    color: var(--hi);
  }
  .eo-t {
    flex: 1 1 220px;
    min-width: 0;
    margin: 0;
  }
  .eo-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
