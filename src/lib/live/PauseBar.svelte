<script>
  /**
   * Pausieren auf der Live-Karte (Noah 20.10.2026, like komoot «Pausiert» and Strava «Angehalten»): a big
   * «Pause» button over the map; while paused a coloured band across the map says that the time stands,
   * with «Go on» and «Stop the ride». After an auto-pause the band says so; it goes on by itself.
   * standing: you have stood a while without a pause → a short hint that «Pause» stops the time.
   */
  import { Pause, Play, Square } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { paused = false, auto = false, standing = false, movingS = 0, pausedS = 0, limit = 4, bottom = 12, onpause, onresume, onstop } = $props();
  const hm = (s) => `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`;
</script>

{#if paused}
  <div class="pb-band" role="status" data-live-paused={auto ? 'auto' : 'hand'}>
    <p class="pb-head"><Pause size={22} aria-hidden="true" /><b>{auto ? t('Auto-pause') : t('Paused|ride')}</b></p>
    <p class="pb-text">{auto ? t('You ride slower than {kmh} km/h: the riding time stands and goes on by itself when you ride on.', { kmh: limit }) : t('The riding time stands. Nothing is recorded until you go on.')}</p>
    <p class="pb-times"><span>{t('Riding time')} <b>{hm(movingS)}</b></span><span>{t('Paused|ride')} <b>{hm(pausedS)}</b></span></p>
    <div class="pb-acts">
      <button type="button" class="btn hi pb-go" onclick={onresume} data-live-resume><Play size={20} aria-hidden="true" />{t('Go on')}</button>
      <button type="button" class="btn" onclick={onstop} data-live-stop-paused><Square size={18} aria-hidden="true" />{t('Stop the ride')}</button>
    </div>
  </div>
{:else}
  {#if standing}
    <p class="pb-hint" role="status" style:bottom="{bottom + 8}px" data-live-pause-hint>{t('You are standing: «Pause» stops the riding time.')}</p>
  {/if}
  <button type="button" class="pb-btn" style:bottom="{bottom}px" onclick={onpause} aria-label={t('Pause the ride')} data-live-pause><Pause size={26} aria-hidden="true" /></button>
{/if}

<style>
  .pb-band {
    position: absolute;
    left: 8px;
    right: 8px;
    top: 8px;
    z-index: 4;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--warn-soft);
    border: 2px solid var(--warn);
    color: var(--ink);
    box-shadow: 0 2px 8px var(--shadow);
  }
  .pb-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: var(--fs-title);
    color: var(--ink);
  }
  .pb-text {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .pb-times {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin: 0;
    font-size: var(--fs-body);
  }
  .pb-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .pb-acts :global(.btn) {
    min-height: 48px;
  }
  .pb-go {
    flex: 1 1 140px;
  }
  .pb-btn {
    position: absolute;
    left: 10px;
    z-index: 2;
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: 2px solid var(--warn);
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 1px 4px var(--shadow);
    cursor: pointer;
    transition: bottom 0.15s var(--ease-out);
  }
  .pb-hint {
    position: absolute;
    left: 74px;
    right: 64px;
    z-index: 2;
    margin: 0;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    font-size: var(--fs-small);
    box-shadow: 0 1px 4px var(--shadow);
  }
</style>
