<script>
  /**
   * «Strava verbinden» on Today (mockup SV1, Noah 13.10.2026 «a», approved «ich gebe alle bild mockups
   * frei»): until Strava is connected on this device, one card on top of the wall with «Connect» (the
   * Strava page) and «Later». «Later» hides it for good (settings STRAVA_CARD_KEY, in backups); the
   * tile «Strava» (Customise › add) and Bike › Care › Strava still lead to the connection.
   */
  import { liveQuery } from 'dexie';
  import { Bike, Link2, Lock } from '@lucide/svelte';
  import { db } from '../db.js';
  import { strava, STRAVA_HASH } from './client.svelte.js';
  import { t } from '../i18n.svelte.js';

  const STRAVA_CARD_KEY = 'strava.card';
  let { wide = true } = $props();
  const cardQ = liveQuery(() => db.settings.get(STRAVA_CARD_KEY));
  // undefined while the settings load: nothing shows, so the card never flashes after «Later»
  const later = $derived($cardQ === undefined ? null : $cardQ?.value === 'later');
  const show = $derived(!strava.key && later === false);
  const hide = () => db.settings.put({ key: STRAVA_CARD_KEY, value: 'later' });
</script>

{#if show}
  <section class="sc surf" class:wide aria-labelledby="sc-h" data-section="strava-connect">
    <span class="si" aria-hidden="true"><Bike size={24} /></span>
    <div class="m">
      <h2 id="sc-h">{t('Connect Strava')}</h2>
      <p>{t('Then every ride lands on the right bike by itself and counts in «This week».')}</p>
      <div class="acts">
        <a class="btn hi" href={STRAVA_HASH}><Link2 size={18} aria-hidden="true" />{t('Connect')}</a>
        <button type="button" class="btn btn-link" onclick={hide}>{t('Later')}</button>
      </div>
      <p class="lk"><Lock size={14} aria-hidden="true" />{t('Read only, disconnect at any time. Goes away once you are connected.')}</p>
    </div>
  </section>
{/if}

<style>
  .sc {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 16px;
    padding: 16px 18px;
  }
  .si {
    display: grid;
    flex: none;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: var(--warn-soft);
    color: var(--warn);
  }
  .m {
    min-width: 0;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.25 var(--font-body);
  }
  p {
    margin: 4px 0 0;
    color: var(--ink-2);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }
  .lk {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
</style>
