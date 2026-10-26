<script>
  /**
   * Paket W on Unterwegs (Noah 20.10.2026 «2a 3a»): two quiet lines for the day, only when they have
   * something to say.
   *   - Plan B (1117): heavy rain or a storm in the saved forecast of today or tomorrow and a plan B is set:
   *     the hint with «Take plan B» (the shorter GPX becomes the route, with Undo) or «Trains home».
   *   - Check-in (1118): tonight's accommodation with its check-in time against the planned arrival.
   */
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { t, num, locale } from '../i18n.svelte.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { telHref } from '../unterwegs/abfahrt.js';
  import { planBOf, badWeather, badText, hoursOfDay, triggerText, swapPlanB, staysOf, checkinOf, callState } from './haustuer.js';
  import { CloudRain, BedDouble, Train, Route as RouteIcon, Phone, TriangleAlert, Undo2 } from '@lucide/svelte';

  let { trip, st, nextSt = null, onhome = null } = $props();
  const pb = $derived(planBOf(trip));
  const on = $derived(!!trip.planB?.on);
  const badToday = $derived(st?.date ? badWeather(hoursOfDay(trip.rideWx?.[st.date], st.date), trip.planB?.trigger) : null);
  const badNext = $derived(nextSt?.date ? badWeather(hoursOfDay(trip.rideWx?.[nextSt.date], nextSt.date), trip.planB?.trigger) : null);
  const bad = $derived(badToday ? { when: t('Today'), ...badToday } : badNext ? { when: new Date(`${nextSt.date}T12:00:00`).toLocaleDateString(locale(), { weekday: 'long' }), ...badNext } : null);

  async function swap() {
    const fields = swapPlanB(trip);
    if (!fields) return;
    const before = { route: $state.snapshot(trip.route) ?? null, planB: $state.snapshot(trip.planB) };
    await db.trips.update(trip.id, touched(fields));
    offerDone(fields.planB.on ? t('Plan B is the route now.') : t('Back to the planned route.'), () => db.trips.update(trip.id, touched(before)));
  }

  const stay = $derived(st ? staysOf(trip).find((s) => s.n === st.day) ?? null : null);
  const check = $derived(stay ? checkinOf(stay, st) : null);
  const hmNow = () => new Date().toTimeString().slice(0, 5);
  const call = $derived(stay ? callState(stay, hmNow()) : '');
</script>

{#if (pb && (bad || on)) || stay}
  <section class="card rdoor" aria-label={t('From the door and back')} data-ride-door>
    {#if pb && (bad || on)}
      <div class="row" class:warn={bad && !on} data-ride-planb>
        <CloudRain size={20} aria-hidden="true" />
        <div class="txt">
          {#if on}
            <b>{t('Plan B is the route now')}</b>
            <span class="tp-small">{t('The shorter variant replaces the planned route on this trip.')}</span>
          {:else}
            <b>{t('{when}: {what}', { when: bad.when, what: badText(bad, t) })}</b>
            {#if bad.own && triggerText(pb.trigger, t)}<span class="tp-small" data-ride-trigger>{t('As agreed before the trip: switch {when}.', { when: triggerText(pb.trigger, t) })}</span>{/if}
            <span class="tp-small">{pb.kind === 'train' ? t('Your plan B: the train home.') : pb.route ? t('Your plan B: the shorter variant, {km} km.', { km: num(Math.round(pb.route.km)) }) : t('Your plan B:')}{#if pb.note}{' '}{pb.note}{/if}</span>
          {/if}
          <span class="acts">
            {#if pb.kind === 'train' && onhome}<button type="button" class="btn sm" onclick={onhome}><Train size={16} aria-hidden="true" />{t('Trains home')}</button>{/if}
            {#if pb.route}<button type="button" class="btn sm" onclick={swap} data-planb-swap>{#if on}<Undo2 size={16} aria-hidden="true" />{t('Back to the planned route')}{:else}<RouteIcon size={16} aria-hidden="true" />{t('Take plan B')}{/if}</button>{/if}
          </span>
        </div>
      </div>
    {/if}
    {#if stay}
      <div class="row" class:warn={check?.late} data-ride-checkin>
        <BedDouble size={20} aria-hidden="true" />
        <div class="txt">
          <b>{stay.name || t('Accommodation tonight')}{#if stay.until}{' · '}{t('check-in until {until}', { until: stay.until })}{/if}</b>
          {#if check}
            {#if check.late}<span class="tp-small"><TriangleAlert size={14} aria-hidden="true" /> {t('Planned arrival {arrive}, {min} min too late.', { arrive: check.arrive, min: check.lateMin })} {t('Call ahead, or start earlier tomorrow.')}</span>
            {:else}<span class="tp-small">{t('Planned arrival {arrive}: in time.', { arrive: check.arrive })}</span>{/if}
          {/if}
          {#if stay.callBy}<span class="tp-small" class:callwarn={call === 'soon'} data-ride-callby={call || 'later'}>{call === 'past' ? t('You wanted to get in touch by {time}. Did you?', { time: stay.callBy }) : t('Get in touch by {time}, before you lose signal.', { time: stay.callBy })}</span>{/if}
          {#if stay.phone}<span class="acts"><a class="btn sm" href={telHref(stay.phone)}><Phone size={16} aria-hidden="true" />{t('Call the accommodation')}</a></span>{/if}
        </div>
      </div>
    {/if}
  </section>
{/if}

<style>
  .callwarn {
    color: var(--warn, var(--accent));
    font-weight: 600;
  }
  .rdoor {
    display: grid;
    gap: 10px;
    padding: 12px 14px;
    margin: 0 0 12px;
  }
  .row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    min-width: 0;
  }
  .row + .row {
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }
  .row.warn {
    margin: -4px -6px;
    padding: 8px 6px;
    border-radius: var(--r-ctl);
    background: var(--warn-soft);
  }
  .row > :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .txt {
    display: grid;
    gap: 2px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 6px;
  }
  .acts .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
</style>
