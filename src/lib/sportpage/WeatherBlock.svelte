<script>
  /**
   * Paket O, basic block «Wetter»: today and tomorrow at home (the saved home forecast, never fetched here),
   * with a tip for the sport: the wind tip for the bike sports (#195 «Wind-Tipp»: out against the wind, home
   * with it at your back), rain and cold for the others.
   */
  import { Wind, CloudRain, Thermometer } from '@lucide/svelte';
  import { windTip, addDays } from '../sportshelp.js';
  import { t, num } from '../i18n.svelte.js';

  let { sport, days = [], today } = $props();
  const list = $derived([today, addDays(today, 1)].map((d) => days.find((x) => x.date === d)).filter(Boolean));
  const outdoor = $derived(sport.bike || sport.kind === 'trip' || ['run', 'tennis', 'climb'].includes(sport.key));
</script>

{#if !list.length}
  <p class="none">{t('No weather yet. Set your home place on Today, then the forecast shows here.')}</p>
{:else}
  <ul class="ilist">
    {#each list as d, i (d.date)}
      {@const w = windTip(d)}
      <li data-wx={d.date}>
        <span class="ent">
          <b>{i === 0 ? t('Today') : t('Tomorrow')}</b>
          <span class="row small num">
            {#if d.min != null}<span><Thermometer size={14} aria-hidden="true" /> {num(Math.round(d.min))}–{num(Math.round(d.max))} °C</span>{/if}
            {#if d.rainPct != null}<span><CloudRain size={14} aria-hidden="true" /> {num(d.rainPct)} %</span>{/if}
            {#if w}<span><Wind size={14} aria-hidden="true" /> {t('from the {dir}', { dir: t(w.from) })}{#if w.gust != null}, {t('gusts {n} km/h', { n: num(w.gust) })}{/if}</span>{/if}
          </span>
        </span>
      </li>
      {#if i === 0}
        {#if sport.bike && w}
          <p class="small" data-wind-tip>{w.strong ? t('Strong wind from the {dir}: ride out against it, then home with it at your back. Take a sheltered loop.', { dir: t(w.from) }) : t('Wind from the {dir}: ride out towards the {dir} first, then home with the wind at your back.', { dir: t(w.from) })}</p>
        {:else if outdoor && d.rainPct != null && d.rainPct >= 60}
          <p class="small">{t('Likely rain today: take the rain jacket, or move it to a dry day.')}</p>
        {:else if sport.key === 'ski' && d.max != null && d.max > 5}
          <p class="small">{t('Warm today: start early, the snow gets soft at noon.')}</p>
        {:else if !outdoor}
          <p class="small">{t('Indoors: the weather hardly matters. Switch this block off if you like.')}</p>
        {/if}
      {/if}
    {/each}
  </ul>
{/if}
