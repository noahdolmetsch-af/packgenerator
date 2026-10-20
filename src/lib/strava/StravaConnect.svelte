<script>
  /**
   * «Strava verbinden» on Today (mockup SV1, Noah 13.10.2026 «a», approved «ich gebe alle bild mockups
   * frei»): until Strava is connected on this device, one card on top of the wall with «Connect» (the
   * Strava page) and «Later». «Later» hides it for good (settings STRAVA_CARD_KEY, in backups); the
   * tile «Strava» (Customise › add) and Bike › Care › Strava still lead to the connection.
   * «Heute neu» A 5b (Noah 20.10.2026): the card moved from Today to the top of Ich.
   */
  import { liveQuery } from 'dexie';
  import { Bike, Link2, Lock } from '@lucide/svelte';
  import { db } from '../db.js';
  import { strava, STRAVA_HASH } from './client.svelte.js';
  import { t } from '../i18n.svelte.js';

  const STRAVA_CARD_KEY = 'strava.card';
  // shown: tells Today the card is on top, so the long-press tip waits (one hint at a time, Tagespaket 0.125.0)
  let { wide = true, shown = $bindable(false) } = $props();
  const cardQ = liveQuery(async () => (await db.settings.get(STRAVA_CARD_KEY)) ?? null);
  // undefined while the settings load: nothing shows, so the card never flashes after «Later»
  const later = $derived($cardQ === undefined ? null : $cardQ?.value === 'later');
  const show = $derived(!strava.key && later === false);
  $effect(() => { shown = show; });
  const hide = () => db.settings.put({ key: STRAVA_CARD_KEY, value: 'later' });
</script>

{#if show}
  <section class="sc surf" class:wide aria-labelledby="sc-h" data-section="strava-connect">
    <span class="si" aria-hidden="true"><Bike size={20} /></span>
    <div class="m">
      <h2 id="sc-h">{t('Connect Strava')}</h2>
      <p>{t('Then every ride lands on the right bike by itself and counts in «This week».')} <span class="lk"><Lock size={12} aria-hidden="true" />{t('Read only, disconnect at any time. Goes away once you are connected.')}</span></p>
    </div>
    <div class="acts">
      <a class="btn sm" href={STRAVA_HASH}><Link2 size={16} aria-hidden="true" />{t('Connect')}</a>
      <button type="button" class="btn btn-link sm" onclick={hide}>{t('Later')}</button>
    </div>
  </section>
{/if}

<style>
  .sc {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    align-items: center;
    margin-bottom: 12px;
    padding: 10px 14px;
  }
  .si {
    display: grid;
    flex: none;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--warn-soft);
    color: var(--warn);
  }
  .m {
    flex: 1 1 260px;
    min-width: 0;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  p {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lk {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .acts {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  /* phone: one slim row (title, Connect, Later), so the trip card stays in the first screen (Noah 2b) */
  @media (max-width: 719px) {
    .sc {
      flex-wrap: nowrap;
      padding: 6px 6px 6px 12px;
    }
    .si,
    p {
      display: none;
    }
    .m {
      flex: 1 1 auto;
    }
  }
</style>
