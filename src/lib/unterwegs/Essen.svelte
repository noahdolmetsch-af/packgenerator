<script>
  /**
   * Paket K #286 «Ess-Erinnerung» (Noah 19.10.2026 «5a b möglich»): the card on Unterwegs. Off until you
   * start it; then every 30, 45 or 60 minutes a sound, a vibration and the line «Zeit zum Essen» with
   * «Gegessen» and «In 10 Minuten». With the app closed the phone gets a message, when «Erinnerungen aufs
   * Handy» is on with the kind «Essen unterwegs» (switched here too). essen.js holds the rules.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, num } from '../i18n.svelte.js';
  import EatEvery from './EatEvery.svelte';
  import { EAT_KEY, eatOf, startEat, nextEat, eaten, snooze, isDue, minutesLeft, SNOOZE_MIN, eatStops, nextStop, GAP_MIN } from './essen.js';
  import { PUSH_KEY, pushOf } from '../push/schedule.js';
  import { Utensils, Check, Clock, BellRing, SkipForward } from '@lucide/svelte';
  import Seg from '../ui/Seg.svelte';
  import { softTone } from './ton.js';
  import './unterwegs.css';

  // plan: this tour's choice from Plan (essen.js tripEat: { on, every }); onplan(patch) changes it
  // Idee 57 (Touren b): fuelStops = trip.fuelStops (Planen › Verpflegung), day = the ride day; mode 'stops' reminds at them
  let { tripId = null, until = null, onstate = null, plan = null, onplan = null, fuelStops = [], day = 0 } = $props();
  const eatQ = liveQuery(() => db.settings.get(EAT_KEY));
  const pushQ = liveQuery(() => db.settings.get(PUSH_KEY));

  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 15000);
    return () => clearInterval(id);
  });
  const e = $derived(eatOf($eatQ?.value, now));
  const left = $derived(minutesLeft(e, now));
  const due = $derived(isDue(e, now));
  const push = $derived(pushOf($pushQ?.value));
  let every = $state(45);
  $effect(() => {
    if (e) every = e.every;
    else if (plan?.every) every = plan.every;
  });
  $effect(() => onstate?.({ next: nextEat(e), on: !!e }));

  const save = (v) => db.settings.put({ key: EAT_KEY, value: v });
  let sound = $state(true);
  $effect(() => {
    if (e) sound = e.sound;
  });
  const dayStops = $derived((Array.isArray(fuelStops) ? fuelStops : []).filter((x) => (x?.day ?? 0) === day));
  let mode = $state('every');
  $effect(() => {
    mode = e ? (e.mode ?? 'every') : plan?.mode ?? (dayStops.length ? 'stops' : 'every');
  });
  const stopsNow = (from) => eatStops(fuelStops, { day, startMs: from, until: Number.isFinite(until) ? until : Infinity });
  const start = () => save(startEat({ every, now: Date.now(), until, tripId, sound, mode, stops: mode === 'stops' ? stopsNow(Date.now()) : null }));
  function setMode(m) {
    mode = m;
    onplan?.({ mode: m });
    if (!e) return;
    if (m === 'stops') save({ ...e, mode: 'stops', stops: stopsNow(e.from) });
    else {
      const { mode: _m, stops: _s, snoozeTo: _z, ...rest } = e;
      save(rest);
    }
  }
  const ns = $derived(nextStop(e));
  const coming = $derived(e?.mode === 'stops' ? e.stops.filter((x) => x.at > e.last).slice(0, 4) : mode === 'stops' ? stopsNow(now).slice(0, 4) : []);
  const setSound = (on) => {
    sound = on;
    if (e) save({ ...e, sound: on });
    if (on) softTone();
  };
  const stop = () => save({ ...($eatQ?.value ?? {}), on: false });
  // Noah 21.10.2026 «ess-erinnerung soll ausgeschaltet werden können»: the whole card can be hidden (it also
  // stops a running reminder); a small line brings it back. Kept in the same setting (EAT_KEY, hidden).
  // Switched off for this tour in Plan: hidden here too, unless a reminder already runs.
  const offHere = $derived(plan?.on === false && !e);
  const hidden = $derived($eatQ?.value?.hidden === true || offHere);
  const hide = () => save({ ...($eatQ?.value ?? {}), on: false, hidden: true });
  const show = () => {
    if ($eatQ?.value?.hidden) save({ ...$eatQ.value, hidden: false });
    if (plan?.on === false) onplan?.({ on: true });
  };
  const ate = () => e && save(eaten(e, Date.now()));
  const later = () => e && save(snooze(e, Date.now()));
  const setEvery = (n) => {
    every = n;
    if (e) save({ ...e, every: n });
  };
  async function pushEat(on) {
    const p = pushOf($pushQ?.value);
    await db.settings.put({ key: PUSH_KEY, value: { ...p, kinds: { ...p.kinds, eat: on } } });
  }

  // sound and vibration once per due time, while the app is open
  let rang = 0;
  $effect(() => {
    const at = nextEat(e);
    if (!due || !at || rang === at) return;
    rang = at;
    try {
      navigator.vibrate?.([250, 120, 250, 120, 250]);
    } catch {
      /* no vibration here */
    }
    if (e?.sound !== false) softTone();
  });
  const timeOf = (ms) => new Date(ms).toTimeString().slice(0, 5);
</script>

{#if hidden}
  <p class="tp-small tp-muted uw-eat-off" data-eat-hidden><Utensils size={16} aria-hidden="true" /> {offHere && $eatQ?.value?.hidden !== true ? t('Eat reminder is off for this tour.') : t('Eat reminder is hidden.')} <button type="button" class="tp-link" onclick={show} data-eat-show>{t('Show|eat')}</button></p>
{:else}
<section class="card uw-eat" class:due aria-labelledby="eat-h" data-eat>
  <div class="uw-row">
    <span class="ib" aria-hidden="true"><Utensils size={20} /></span>
    <div class="grow">
      <h2 id="eat-h" class="sh">{t('Eat reminder')}</h2>
      <p class="tp-small tp-muted">
        {#if !e}{t('Reminds you to eat while you ride. Off until you start it.')}
        {:else if due && ns?.name}{t('Now: {name}', { name: ns.name })}
        {:else if due}{t('Time to eat')}
        {:else if left != null}{t('Next in {n} min · at {time}', { n: num(left), time: timeOf(nextEat(e)) })}
        {:else}{t('No more reminders before the planned end.')}{/if}
      </p>
    </div>
    <button type="button" class="tp-link hide" onclick={hide} data-eat-hide>{t('Hide|eat')}</button>
  </div>
  {#if due}
    <p class="uw-due" role="alert"><BellRing size={20} aria-hidden="true" /> <b>{ns?.name ? t('Planned stop: {name}', { name: ns.name }) : t('Time to eat')}</b> <span>{ns?.name ? t('Eat something and fill up water.') : t('A bite now keeps the strength up.')}</span></p>
    <div class="uw-row acts">
      <button type="button" class="btn hi" onclick={ate} data-eat-done><Check size={18} aria-hidden="true" />{t('Eaten')}</button>
      <button type="button" class="btn" onclick={later}><Clock size={18} aria-hidden="true" />{t('In {n} minutes', { n: SNOOZE_MIN })}</button>
      {#if ns?.name}<button type="button" class="btn" onclick={ate} data-eat-skip><SkipForward size={18} aria-hidden="true" />{t('Skip the stop')}</button>{/if}
    </div>
  {/if}
  {#if dayStops.length}
    <div class="uw-mode" data-eat-mode>
      <span class="tp-small">{t('When?|eat')}</span>
      <Seg full={false} label={t('When the reminder comes')} value={mode} options={[{ key: 'every', name: t('Every {n} min', { n: every }) }, { key: 'stops', name: t('At stops') }]} onchange={setMode} />
    </div>
  {/if}
  {#if mode === 'stops' && dayStops.length}
    {#if coming.length}
      <ul class="uw-stops" data-eat-stops>
        {#each coming as x (x.at)}<li class:gap={x.gap}>{#if x.gap}{t('Hint after {n} min without a stop', { n: GAP_MIN })}{:else}<b>{x.name || t('Stop|eat')}</b>{#if x.km != null}{' · '}km {num(Math.round(x.km))}{/if}{/if}<small class="num"> · {t('about {time}', { time: timeOf(x.at) })}</small></li>{/each}
      </ul>
    {/if}
    <p class="tp-small tp-muted">{t('The stops come from Plan › Food and drink. With your place on the live map the reminder comes 500 m before the stop, otherwise at the estimated time.')}</p>
  {:else}
    <EatEvery value={every} onpick={setEvery} />
    {#if !dayStops.length}<p class="tp-small tp-muted" data-eat-nostops>{t('With a food plan (Plan › Food and drink) the reminder can come at the planned stops.')}</p>{/if}
  {/if}
  <label class="tp-small"><input type="checkbox" role="switch" checked={sound} onchange={(ev) => setSound(ev.currentTarget.checked)} data-eat-sound /> {t('Soft tone')}</label>
  <div class="uw-row acts">
    {#if !e}<button type="button" class="btn ink" onclick={start} data-eat-start>{t('Start eat reminder')}</button>
    {:else}
      {#if !due}<button type="button" class="btn" onclick={ate}><Check size={18} aria-hidden="true" />{t('Just ate')}</button>{/if}
      <button type="button" class="btn" onclick={stop} data-eat-stop>{t('Stop')}</button>
    {/if}
  </div>
  <p class="tp-small tp-muted closed">
    {#if push.on}
      <label><input type="checkbox" role="switch" checked={push.kinds.eat} onchange={(ev) => pushEat(ev.currentTarget.checked)} /> {t('Also as a message when the app is closed')}</label>
    {:else}
      {t('With the app closed:')} <a class="tp-link" href="#/me/push">{t('switch on Reminders on the phone')}</a>
    {/if}
  </p>
</section>
{/if}

<style>
  .uw-eat-off {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 16px;
  }
  .hide {
    align-self: flex-start;
    white-space: nowrap;
  }
  .uw-eat {
    display: grid;
    gap: 10px;
    margin: 0 0 16px;
  }
  .uw-eat.due {
    border-color: var(--accent, var(--ink));
  }
  .ib {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--paper-2);
  }
  .sh {
    margin: 0;
  }
  .grow p {
    margin: 2px 0 0;
  }
  .uw-due {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 0;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--paper-2);
    font-size: var(--fs-sub);
  }
  .closed {
    margin: 0;
  }
  .uw-mode {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .uw-stops {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .uw-stops li {
    padding: 6px 0;
    border-top: 1px solid var(--line);
  }
  .uw-stops li.gap {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .closed label {
    display: flex;
    align-items: center;
    gap: 8px;
  }
</style>
