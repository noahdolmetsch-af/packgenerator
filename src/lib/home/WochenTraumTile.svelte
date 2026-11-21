<script>
  /**
   * «Traum der Woche» (Noah 07.11.2026 «1a … 3a»): one dream that fits right now, on Heute. A dream with a date
   * shows its countdown and, once its days are in the forecast, the weather for exactly those days; a dream
   * without a date shows its dry window. Home.svelte leaves the tile away while no dream fits (wochentraum.js).
   */
  import { Moon, Sparkles, ChevronRight } from '@lucide/svelte';
  import TileHead from './TileHead.svelte';
  import { dayRange } from '../dreams/wetterfenster.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';

  let { pick, isnew = false } = $props();

  const dayText = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const when = $derived(!pick ? '' : pick.until > 0 ? tn(pick.until, 'In {n} day', 'In {n} days') : pick.until === 0 ? t('Starts today') : t('Under way'));
  const range = $derived(!pick ? '' : pick.start === pick.end ? dayText(pick.start) : `${dayText(pick.start)} – ${dayText(pick.end)}`);
  const dayLine = (d) =>
    [d.good ? t('dry|day') : t('wet|day'), d.wx.min != null ? t('night {v} °C', { v: num(Math.round(d.wx.min)) }) : '', d.wx.wind != null ? t('wind {v} km/h', { v: num(Math.round(d.wx.wind)) }) : ''].filter(Boolean).join(' · ');
  const WHY = { rain: 'rain|why', cold: 'a cold night|why', wind: 'strong wind|why' };
  const why = $derived(pick ? [...new Set(pick.days.flatMap((d) => d.why))].map((k) => t(WHY[k])).join(', ') : '');
</script>

{#if pick}
  <section class="wt surf" aria-labelledby="wt-h" data-section="wochentraum">
    <div class="hd"><TileHead icon={Sparkles} id="wt-h" title={t('Dream of the week')} {isnew} /></div>
    <p class="nm" data-wt-name>{pick.dream.title}{#if pick.night}<span class="nt" title={t('Rides through the night')}><Moon size={14} aria-hidden="true" /></span>{/if}</p>
    {#if pick.dated}
      <p class="was" data-wt-when><b>{when}</b> · {range}</p>
      {#if pick.known}
        <ul class="days" data-wt-days>
          {#each pick.days as d (d.date)}
            <li class:bad={!d.good}>
              <span class="dn">{dayText(d.date)}</span>
              <span>{dayLine(d)}</span>
            </li>
          {/each}
        </ul>
        <p class="vd" class:bad={!pick.good} data-wt-verdict>{pick.good ? (pick.night ? t('Days and night look good.') : t('The days look good.')) : t('Not ideal: {why}', { why })}</p>
      {:else if pick.wait > 0}
        <p class="was" data-wt-wait>{tn(pick.wait, 'The forecast reaches these days in {n} day.', 'The forecast reaches these days in {n} days.')}</p>
      {:else}
        <p class="was" data-wt-wait>{t('The forecast for these days is not loaded yet.')}</p>
      {/if}
    {:else}
      <p class="was" data-wt-when>{t('Fits now')} · {t('dry {days}', { days: dayRange(pick.window, locale()) })}</p>
    {/if}
    <a class="btn hi open" href="#/trips/dreams" data-wt-open>{t('Open the dream')}<ChevronRight size={16} aria-hidden="true" /></a>
  </section>
{/if}

<style>
  .wt {
    display: flex;
    flex-direction: column;
    gap: 6px;
    height: 100%;
    padding: 14px 18px;
    box-sizing: border-box;
  }
  .hd :global(.th) {
    flex: 1;
  }
  .nm {
    margin: 0;
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .nt {
    margin-left: 6px;
    vertical-align: -2px;
    color: var(--ink-3);
  }
  .was,
  .vd {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .days {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 2px;
    font-size: var(--fs-small);
  }
  .days li {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 10px;
  }
  .dn {
    min-width: 7.5em;
    font-weight: 600;
  }
  .bad {
    color: var(--warn, var(--ink));
  }
  .open {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    text-decoration: none;
  }
</style>
