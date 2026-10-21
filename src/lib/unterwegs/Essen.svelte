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
  import { EAT_KEY, EVERY, eatOf, startEat, nextEat, eaten, snooze, isDue, minutesLeft, SNOOZE_MIN } from './essen.js';
  import { PUSH_KEY, pushOf } from '../push/schedule.js';
  import { Utensils, Check, Clock, BellRing } from '@lucide/svelte';
  import { softTone } from './ton.js';
  import './unterwegs.css';

  let { tripId = null, until = null, onstate = null } = $props();
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
  });
  $effect(() => onstate?.({ next: nextEat(e), on: !!e }));

  const save = (v) => db.settings.put({ key: EAT_KEY, value: v });
  let sound = $state(true);
  $effect(() => {
    if (e) sound = e.sound;
  });
  const start = () => save(startEat({ every, now: Date.now(), until, tripId, sound }));
  const setSound = (on) => {
    sound = on;
    if (e) save({ ...e, sound: on });
    if (on) softTone();
  };
  const stop = () => save({ ...($eatQ?.value ?? {}), on: false });
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

<section class="card uw-eat" class:due aria-labelledby="eat-h" data-eat>
  <div class="uw-row">
    <span class="ib" aria-hidden="true"><Utensils size={20} /></span>
    <div class="grow">
      <h2 id="eat-h" class="sh">{t('Eat reminder')}</h2>
      <p class="tp-small tp-muted">
        {#if !e}{t('Reminds you to eat while you ride. Off until you start it.')}
        {:else if due}{t('Time to eat')}
        {:else if left != null}{t('Next in {n} min · at {time}', { n: num(left), time: timeOf(nextEat(e)) })}
        {:else}{t('No more reminders before the planned end.')}{/if}
      </p>
    </div>
  </div>
  {#if due}
    <p class="uw-due" role="alert"><BellRing size={20} aria-hidden="true" /> <b>{t('Time to eat')}</b> <span>{t('A bite now keeps the strength up.')}</span></p>
    <div class="uw-row acts">
      <button type="button" class="btn hi" onclick={ate} data-eat-done><Check size={18} aria-hidden="true" />{t('Eaten')}</button>
      <button type="button" class="btn" onclick={later}><Clock size={18} aria-hidden="true" />{t('In {n} minutes', { n: SNOOZE_MIN })}</button>
    </div>
  {/if}
  <div class="uw-row acts">
    <span class="tp-small">{t('Every')}</span>
    {#each EVERY as n (n)}<button type="button" class="tp-chip" aria-pressed={every === n} onclick={() => setEvery(n)}>{t('{n} min', { n })}</button>{/each}
  </div>
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

<style>
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
  .closed label {
    display: flex;
    align-items: center;
    gap: 8px;
  }
</style>
