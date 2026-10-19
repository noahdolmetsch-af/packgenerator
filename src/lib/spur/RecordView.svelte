<script>
  /**
   * Paket S «Reise-Spur» (answer 1b, «so sieht b aus»): while recording the screen is dark and big:
   * time, km and points, the GPS accuracy, whether the screen stays on. «Hier bin ich» and «Stopp».
   * «Kleiner» goes back to the page; the recording goes on as long as the page stays open.
   */
  import { onMount } from 'svelte';
  import { MapPin, Square, Minimize2, Sun } from '@lucide/svelte';
  import { t, tn, num } from '../i18n.svelte.js';
  import { rec, stopRecording } from './recorder.svelte.js';
  import PlaceSheet from './PlaceSheet.svelte';

  let { trip = null, onclose } = $props();
  let dialog;
  let now = $state(Date.now());
  let place = $state(false);
  let done = $state(null);

  onMount(() => {
    dialog.showModal();
    const id = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(id);
  });
  const two = (n) => String(n).padStart(2, '0');
  const clock = $derived.by(() => {
    const s = Math.max(0, Math.floor((now - rec.startAt) / 1000));
    return `${Math.floor(s / 3600)}:${two(Math.floor(s / 60) % 60)}:${two(s % 60)}`;
  });
  const since = $derived(rec.lastAt ? Math.round((now - rec.lastAt) / 1000) : null);

  async function stop() {
    done = await stopRecording();
    if (!done) dialog.close();
  }
</script>

<dialog class="recview" bind:this={dialog} onclose={() => onclose?.()} oncancel={(e) => e.preventDefault()} data-backdrop="own" aria-labelledby="rv-h">
  {#if done}
    <h2 id="rv-h">{t('Recording saved')}</h2>
    <p class="big num">{num(Math.round(done.km * 10) / 10)} km</p>
    <p>{tn(done.pts.length, '{n} point', '{n} points')}</p>
    <p class="soft">{t('It shows on the tour map. A Strava or Garmin ride of the same time counts first.')}</p>
    <div class="row"><button type="button" class="btn hi" onclick={() => dialog.close()}>{t('Done')}</button>{#if trip}<a class="btn" href="#/spur/{trip.id}" onclick={() => dialog.close()}>{t('Open the tour map')}</a>{/if}</div>
  {:else}
    <h2 id="rv-h" class="kick">{rec.on ? t('Recording') : t('Not recording')}</h2>
    <p class="clock num" aria-live="off">{clock}</p>
    <p class="big num">{num(rec.km)} km</p>
    <p class="soft num">{tn(rec.pts, '{n} point', '{n} points')}{rec.acc != null ? ` · GPS ± ${rec.acc} m` : ` · ${t('looking for GPS …')}`}</p>
    {#if since != null && since > 90}<p class="warn" role="status">{t('No new point for {n} s.', { n: since })}</p>{/if}
    {#if rec.error}<p class="warn" role="alert">{t(rec.error)}</p>{/if}
    <p class="soft"><Sun size={16} aria-hidden="true" /> {rec.lock ? t('The screen stays on.') : t('This browser may turn the screen off: then there is a gap.')}</p>
    <div class="row">
      <button type="button" class="btn here" onclick={() => (place = true)}><MapPin size={22} aria-hidden="true" />{t('I am here')}</button>
      <button type="button" class="btn stop" onclick={stop}><Square size={22} aria-hidden="true" />{t('Stop')}</button>
    </div>
    <button type="button" class="btn small" onclick={() => dialog.close()}><Minimize2 size={18} aria-hidden="true" />{t('Smaller (keeps recording)')}</button>
  {/if}
</dialog>

{#if place}<PlaceSheet {trip} onclose={() => (place = false)} />{/if}

<style>
  .recview {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100dvh;
    max-width: none;
    max-height: none;
    margin: 0;
    border: 0;
    padding: max(24px, env(safe-area-inset-top)) 20px max(24px, env(safe-area-inset-bottom));
    --rv-bg: #0b1210;
    --rv-ink: #eef4f0;
    --rv-soft: #b9cbc2;
    --rv-rec: #ff8a7a;
    --rv-warn: #ffd27a;
    --rv-stop: #c7392b;
    --rv-white: #fff;
    --rv-line: #4b5d55;
    --fs-rec-clock: clamp(56px, 16vw, 120px);
    --fs-rec-big: clamp(36px, 10vw, 72px);
    --fs-rec-btn: 20px;
    --fs-rec-kick: 18px;
    background: var(--rv-bg);
    color: var(--rv-ink);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    text-align: center;
  }
  .recview:not([open]) {
    display: none;
  }
  .kick {
    font-size: var(--fs-rec-kick);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--rv-rec);
    margin: 0;
  }
  .clock {
    font-size: var(--fs-rec-clock);
    font-weight: 700;
    margin: 0;
    line-height: 1;
  }
  .big {
    font-size: var(--fs-rec-big);
    font-weight: 700;
    margin: 0;
  }
  .soft {
    color: var(--rv-soft);
    margin: 0;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .warn {
    color: var(--rv-warn);
    margin: 0;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-top: 16px;
  }
  .row .btn {
    min-height: 64px;
    min-width: 150px;
    font-size: var(--fs-rec-btn);
    gap: 8px;
  }
  .here {
    background: var(--rv-ink);
    color: var(--rv-bg);
    border-color: var(--rv-ink);
  }
  .stop {
    background: var(--rv-stop);
    color: var(--rv-white);
    border-color: var(--rv-stop);
  }
  .small {
    margin-top: 8px;
    background: transparent;
    color: var(--rv-ink);
    border-color: var(--rv-line);
    gap: 6px;
  }
</style>
