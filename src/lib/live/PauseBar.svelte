<script>
  /**
   * Pausieren auf der Live-Karte (Noah 20.10.2026, like komoot «Pausiert» and Strava «Angehalten»): a big
   * «Pause» button over the map; while paused a coloured band across the map says that the time stands,
   * with «Go on» and «Stop the ride». After an auto-pause the band says so; it goes on by itself.
   * standing: you have stood a while without a pause → a short hint that «Pause» stops the time.
   * Noah 21.10.2026: an auto-pause comes as a slim line that slides in from the top («dezent»), over the
   * map and the data pages; your own pause keeps the big band.
   * Touren c 60 «Pausengrund»: in your own pause three chips say why (rest, repair, waiting; a second tap takes
   * it away), and the arrival «if you ride on now» stands under the times (eta: the time as text, or '').
   */
  import { Pause, Play, Square } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { WHYS } from '../tourenc/pausewhy.js';

  let { paused = false, auto = false, standing = false, movingS = 0, pausedS = 0, limit = 4, bottom = 12, why = '', eta = '', onwhy = null, onpause, onresume, onstop } = $props();
  const hm = (s) => `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`;
</script>

{#if paused && auto}
  <div class="pb-slim" role="status" data-live-paused="auto">
    <Pause size={18} aria-hidden="true" />
    <span class="pb-slim-text"><b>{t('Auto-pause')}</b> · {t('the riding time stands')} · {hm(movingS)}</span>
    <button type="button" class="btn sm" onclick={onresume} data-live-resume>{t('Go on')}</button>
  </div>
{:else if paused}
  <div class="pb-band" role="status" data-live-paused={auto ? 'auto' : 'hand'}>
    <p class="pb-head"><Pause size={22} aria-hidden="true" /><b>{auto ? t('Auto-pause') : t('Paused|ride')}</b></p>
    <p class="pb-text">{auto ? t('You ride slower than {kmh} km/h: the riding time stands and goes on by itself when you ride on.', { kmh: limit }) : t('The riding time stands. Nothing is recorded until you go on.')}</p>
    <p class="pb-times"><span>{t('Riding time')} <b>{hm(movingS)}</b></span><span>{t('Paused|ride')} <b>{hm(pausedS)}</b></span></p>
    {#if onwhy}
      <div class="pb-why" role="group" aria-label={t('Why the pause?')} data-live-why>
        <span class="pb-whyl">{t('Why?')}</span>
        {#each WHYS as w (w.key)}<button type="button" class="pb-chip" aria-pressed={why === w.key} onclick={() => onwhy(why === w.key ? '' : w.key)} data-live-why-key={w.key}>{t(w.name)}</button>{/each}
      </div>
    {/if}
    {#if eta}<p class="pb-eta" data-live-pause-eta>{t('If you ride on now: arrival about {at}', { at: eta })}</p>{/if}
    <div class="pb-acts">
      <button type="button" class="btn hi pb-go" onclick={onresume} data-live-resume><Play size={20} aria-hidden="true" />{t('Go on')}</button>
      <button type="button" class="btn" onclick={onstop} data-live-stop-paused><Square size={18} aria-hidden="true" />{t('Stop the ride')}</button>
    </div>
  </div>
{:else}
  {#if standing}
    <p class="pb-hint" role="status" style:bottom="{bottom + 64}px" data-live-pause-hint>{t('You are standing: «Pause» stops the riding time.')}</p>
  {/if}
  <button type="button" class="pb-btn" style:bottom="{bottom}px" onclick={onpause} aria-label={t('Pause the ride')} data-live-pause><Pause size={26} aria-hidden="true" /></button>
{/if}

<style>
  .pb-band {
    position: absolute;
    left: 8px;
    right: 60px; /* the «⋯» button stays free */
    top: var(--pb-top, 52px); /* under the bar of the data pages */
    z-index: 2; /* over the map, under the pulled-up sheet and the «⋯» menu */
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
  .pb-why {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .pb-whyl {
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .pb-chip {
    min-height: 36px;
    padding: 4px 12px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .pb-chip[aria-pressed='true'] {
    background: var(--hi);
    border-color: var(--hi);
    color: var(--hi-ink);
  }
  .pb-eta {
    margin: 0;
    font-size: var(--fs-small);
  }
  .pb-slim {
    position: absolute;
    left: 8px;
    right: 60px; /* the «⋯» button stays free */
    top: var(--pb-top, 52px);
    z-index: 3; /* over the map and the data pages */
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px 6px 12px;
    border-radius: 10px;
    background: var(--warn-soft);
    border: 1px solid var(--warn);
    color: var(--ink);
    font-size: var(--fs-small);
    box-shadow: 0 1px 4px var(--shadow);
    animation: pb-in 0.25s var(--ease-out);
  }
  .pb-slim-text {
    flex: 1 1 auto;
    min-width: 0;
    overflow-wrap: break-word;
  }
  @keyframes pb-in {
    from {
      transform: translateY(-12px);
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .pb-slim {
      animation: none;
    }
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
    left: 10px;
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
