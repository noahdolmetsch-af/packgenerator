<script>
  /**
   * «Nacht-Blatt» (Noah 02.11.2026 «1b»: only when you open it from the «⋯» menu): one calm page for the night
   * on the live map. Ride on or sleep (races: from your tiredness, the hours awake and the next bed), the bed
   * ahead, the last open shop, the stops of today and your three goals. Nothing here changes your ride.
   */
  import { Moon, Store, Clock, Flag, X } from '@lucide/svelte';
  import KindIcon from '../map/KindIcon.svelte';
  import { backClose } from '../ui/backclose.js';
  import { rideOrSleep, hhmm, hm } from '../race/race.js';
  import { minText } from '../unterwegs/heimweg.js';
  import { t } from '../i18n.svelte.js';

  let { race = null, awake = 0, now = Date.now(), km = null, pace = {}, bed = null, shop = null, movingS = 0, pausedS = 0, onclose } = $props();
  let dialog = $state();
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const kmh = $derived(pace?.kmh > 0 ? pace.kmh : 18);
  const bedAhead = $derived(bed?.best ?? null);
  const pick = $derived(
    race
      ? rideOrSleep({ tired: race.tired.at(-1)?.v ?? 2, hour: new Date(now).getHours(), awakeH: awake, kmToBed: bedAhead?.distKm ?? 20, kmh, bagC: race.bagC })
      : null,
  );
  const PICK = { sleep: 'Sleep now', nap: 'A short nap (20 minutes)', ride: 'Ride on' };
  const whyText = (k) => t(k, { h: k.includes('awake') ? Math.round(awake) : hm(pick.toBedH) });
  const goals = $derived(race ? [['Vision|goal', race.tiers.vision], ['Super|goal', race.tiers.super], ['At least|goal', race.tiers.least]].filter(([, v]) => v) : []);
  const shopRow = $derived(shop?.state === 'ok' ? shop.last : shop?.next ?? null);
</script>

<dialog class="sheet from-below lv-night" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="lv-night-h" data-live-night-sheet>
  <div class="lv-night-head">
    <h2 id="lv-night-h"><Moon size={20} aria-hidden="true" />{t('Night sheet')}</h2>
    <button type="button" class="rc-icon" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <p class="rc-note">{t('A calm look at the night. It only shows; you decide.')}</p>

  {#if pick}
    <section class="lv-night-part" data-night-verdict={pick.pick}>
      <h3 class="lv-night-h3">{t('Ride on or sleep?')}</h3>
      <p class="lv-night-pick"><b>{t(PICK[pick.pick])}</b></p>
      {#if pick.why.length}<ul class="lv-night-why">{#each pick.why as k (k)}<li>{whyText(k)}</li>{/each}</ul>{/if}
    </section>
  {/if}

  <section class="lv-night-part" data-night-bed>
    <h3 class="lv-night-h3">{t('Bed|night')}</h3>
    {#if bed?.planned}
      <p class="lv-line"><Moon size={18} aria-hidden="true" /><span>{t('Bed of the plan: km {km}', { km: Math.round(bed.planned.km) })}{#if bed.planned.name}{' '}· {bed.planned.name}{/if}</span></p>
    {/if}
    {#if bedAhead}
      <p class="lv-line"><KindIcon kind="sleep" size={18} /><span>{bedAhead.name || t('Place to sleep')} · {t('{d} km', { d: Math.round(bedAhead.distKm * 10) / 10 })} · {t('there about {at}', { at: hhmm(bedAhead.eta) })}</span></p>
    {:else if !bed?.planned}
      <p class="rc-empty">{t('No bed found ahead yet. Load the stops along the route.')}</p>
    {/if}
  </section>

  <section class="lv-night-part" data-night-shop>
    <h3 class="lv-night-h3">{t('Last open shop before the night')}</h3>
    {#if shopRow}
      <p class="lv-line"><Store size={18} aria-hidden="true" /><span>{shopRow.poi.name || t('Shop')} · {t('{d} km', { d: Math.round(shopRow.distKm * 10) / 10 })} · {t('there about {at}', { at: hhmm(shopRow.eta) })}{#if shopRow.closes}{' '}· {t('Open until {at}', { at: shopRow.closes })}{/if}</span></p>
      {#if shop.state === 'dark'}<p class="rc-note">{t('It is dark. The nearest shop ahead:')}</p>
      {:else if shop.state === 'none'}<p class="rc-note">{t('No open shop is left before the night. The nearest ahead:')}</p>{/if}
    {:else}
      <p class="rc-empty">{t('Load the stops along the route to see the last open shop before the night.')}</p>
    {/if}
  </section>

  <section class="lv-night-part" data-night-pauses>
    <h3 class="lv-night-h3">{t('Today so far')}</h3>
    <p class="lv-line"><Clock size={18} aria-hidden="true" /><span>{t('Riding {a}, stopped {b}', { a: minText(Math.round(movingS / 60)), b: minText(Math.round(pausedS / 60)) })}</span></p>
  </section>

  {#if race}
    <section class="lv-night-part" data-night-goals>
      <h3 class="lv-night-h3"><Flag size={16} aria-hidden="true" />{t('Three goals')}</h3>
      {#if goals.length}
        <ul class="lv-night-goals">{#each goals as [k, v] (k)}<li><b>{t(k)}</b> {v}</li>{/each}</ul>
      {:else}
        <p class="rc-empty">{t('You have not written your goals yet. Race › Prepare › Three goals.')}</p>
      {/if}
    </section>
  {/if}
</dialog>

<style>
  .lv-night-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .lv-night-head h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
  }
  .lv-night-part {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .lv-line {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
  }
  .lv-line > :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .lv-night-h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: var(--fs-body);
  }
  .lv-night-pick {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .lv-night-why,
  .lv-night-goals {
    margin: 0;
    padding-left: 18px;
  }
  .lv-night-goals {
    list-style: none;
    padding-left: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
</style>
