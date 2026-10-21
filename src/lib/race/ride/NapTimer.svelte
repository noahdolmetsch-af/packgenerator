<script>
  /**
   * Paket U4 · 1140 Powernaps: a nap timer (10, 20 or 30 minutes) with an alarm, the hours awake and a
   * nap suggestion after X hours. The alarm of a web app only rings while the app is open and the screen
   * is on (the timer keeps the screen on when the phone allows it); so the box always says so and shows
   * the time to set on the phone's own alarm. When the nap ends it goes into the sleep log (Undo).
   * napUntil (ISO) and napAfterH live in the race record, so a reload keeps the timer.
   */
  import { onDestroy } from 'svelte';
  import { AlarmClock, BellOff } from '@lucide/svelte';
  import { NAP_MIN, napNeed, napLeft } from '../sleep.js';
  import { awakeH } from '../ride-lib.js';
  import { hhmm, hm, newId } from '../race.js';
  import { putRace } from '../store.js';
  import { offerDone } from '../../ui/rename.svelte.js';
  import { t, num } from '../../i18n.svelte.js';

  let { ctx, now } = $props();
  let tick = $state(Date.now());
  let ringing = $state(false);
  let audio = null;
  let lock = null;
  let ring = null;

  const log = $derived(Array.isArray(ctx.stored.sleepLog) ? ctx.stored.sleepLog : []);
  const until = $derived(Date.parse(ctx.stored.napUntil ?? ''));
  const running = $derived(Number.isFinite(until));
  const left = $derived(running ? napLeft(until, tick) : null);
  const afterH = $derived(Number(ctx.stored.napAfterH) > 0 ? Number(ctx.stored.napAfterH) : 18);
  const awake = $derived(awakeH(log, ctx.plan?.start, now));
  const need = $derived(napNeed({ awakeH: awake, hour: new Date(now).getHours(), afterH }));
  const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  $effect(() => {
    if (!running) return;
    tick = Date.now();
    const id = setInterval(() => (tick = Date.now()), 1000);
    return () => clearInterval(id);
  });
  $effect(() => {
    if (running && left === 0 && !ringing) startRing();
  });

  function sound() {
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      audio ??= new C();
      audio.resume?.();
    } catch {
      audio = null;
    }
  }
  function beep() {
    try {
      if (!audio) return;
      const g = audio.createGain();
      g.gain.value = 0.3;
      g.connect(audio.destination);
      for (let i = 0; i < 3; i++) {
        const o = audio.createOscillator();
        o.frequency.value = 880;
        o.connect(g);
        const at = audio.currentTime + i * 0.4;
        o.start(at);
        o.stop(at + 0.25);
      }
    } catch {
      /* no sound on this phone */
    }
  }
  function startRing() {
    ringing = true;
    const go = () => {
      beep();
      try {
        navigator.vibrate?.([400, 200, 400]);
      } catch {
        /* no vibration */
      }
    };
    go();
    ring = setInterval(go, 2500);
  }
  function stopRing() {
    ringing = false;
    if (ring) clearInterval(ring);
    ring = null;
  }
  async function keepScreen(on) {
    try {
      if (on && !lock && navigator.wakeLock) lock = await navigator.wakeLock.request('screen');
      if (!on && lock) {
        await lock.release();
        lock = null;
      }
    } catch {
      lock = null;
    }
  }

  async function start(min) {
    sound();
    keepScreen(true);
    await ctx.save({ napUntil: new Date(Date.now() + min * 60_000).toISOString(), napMin: min });
  }
  async function cancel() {
    stopRing();
    keepScreen(false);
    await ctx.save({ napUntil: null, napMin: null });
  }
  async function awakeNow() {
    stopRing();
    keepScreen(false);
    const min = Number(ctx.stored.napMin) || Math.max(1, Math.round((Date.now() - (until - 20 * 60_000)) / 60_000));
    const before = await ctx.save({ napUntil: null, napMin: null, sleepLog: [...log, { id: newId('s'), at: new Date().toISOString(), min }] });
    offerDone(t('{n} minutes of sleep noted.', { n: min }), () => putRace(ctx.trip.id, before));
  }
  onDestroy(() => {
    stopRing();
    keepScreen(false);
    try {
      audio?.close?.();
    } catch {
      /* closed already */
    }
  });
</script>

<div class="nt" data-nap>
  <p class="rc-text" data-nap-awake>{t('Awake for {h}', { h: hm(awake) })}</p>
  {#if need && !running}
    <p class="rc-warn" data-nap-need={need}>{need === 'night' ? t('The small hours are the hardest: a short nap now helps more than coffee.') : t('Awake for more than {h} hours: a power nap of 20 minutes helps.', { h: num(afterH) })}</p>
  {/if}
  {#if ringing}
    <div class="nt-ring" role="alert" data-nap-ring>
      <b>{t('Time to wake up')}</b>
      <button type="button" class="btn hi nt-big" onclick={awakeNow} data-nap-awake-btn><BellOff size={20} aria-hidden="true" />{t('I am awake')}</button>
    </div>
  {:else if running}
    <p class="nt-left" data-nap-left>{mmss(left ?? 0)}</p>
    <p class="rc-note">{t('Wake up at {time}', { time: hhmm(until) })}</p>
    <div class="rc-acts">
      <button type="button" class="btn" onclick={awakeNow} data-nap-done>{t('Awake already')}</button>
      <button type="button" class="btn" onclick={cancel} data-nap-cancel>{t('Stop the timer')}</button>
    </div>
  {:else}
    <div class="rc-acts" role="group" aria-label={t('Power nap')}>
      {#each NAP_MIN as m (m)}<button type="button" class="btn" onclick={() => start(m)} data-nap-start={m}><AlarmClock size={18} aria-hidden="true" />{t('{n} min', { n: m })}</button>{/each}
    </div>
  {/if}
  <p class="rc-note" data-nap-warn>{t('The alarm only rings while the app stays open and the screen is on. To be safe, also set the alarm on your phone:')} {running ? t('wake at {time}.', { time: hhmm(until) }) : t('now + the minutes of your nap.')}</p>
  <label class="rc-lab">{t('Suggest a nap after (hours awake)')}
    <input class="inp rc-num" type="number" min="4" max="48" step="1" value={afterH} onchange={(e) => { const v = Math.round(Number(e.currentTarget.value)); if (v >= 4 && v <= 48) ctx.save({ napAfterH: v }); }} data-nap-after />
  </label>
</div>

<style>
  .nt {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .nt-left {
    margin: 0;
    font: 800 var(--fs-page) var(--font-body);
    text-align: center;
  }
  .nt-ring {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
    padding: 12px;
    border-radius: 8px;
    background: var(--paper-2);
  }
  .nt :global(.nt-big) {
    min-height: 56px;
    font-size: var(--fs-title);
  }
</style>
