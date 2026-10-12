<script>
  /**
   * v0.102.0 Design-Refresh P4 «Touren» (T4 «Wetter am Event», T5 «Wetter an den Zeltplätzen», approved
   * 12.10.2026): one tile per day: the weekday, an icon, max / min and the rain (mm · %) or «trocken».
   * days: [{ date, min, max, rainMm, rainPct, label? }] (a forecast day of weather.js); label replaces the date.
   */
  import { toWx } from '../weather.js';
  import { t, locale, num } from '../i18n.svelte.js';
  import { Sun, CloudSun, CloudRain } from '@lucide/svelte';

  let { days = [] } = $props();

  const wd = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', timeZone: 'UTC' }).replace(',', '');
  const rainOf = (d) => toWx([{ ...d, min: d.min ?? 0, max: d.max ?? 0 }])?.rain ?? 'none';
  const deg = (v) => (v == null ? '–' : `${Math.round(v)}°`);
</script>

<ol class="dtiles" style:--n={Math.min(days.length, 4)}>
  {#each days as d (d.date)}
    {@const rain = rainOf(d)}
    {@const Icon = rain === 'rain' ? CloudRain : rain === 'showers' ? CloudSun : Sun}
    <li class:wet={rain !== 'none'}>
      <span class="wd">{d.label || wd(d.date)}</span>
      <Icon size={20} aria-hidden="true" />
      <b class="num">{deg(d.max)} / {deg(d.min)}</b>
      <span class="rn num">{(d.rainMm ?? 0) >= 1 || (d.rainPct ?? 0) >= 30 ? [d.rainMm ? `${num(Math.round(d.rainMm))} mm` : '', d.rainPct != null ? `${num(d.rainPct)} %` : ''].filter(Boolean).join(' · ') : t('dry')}</span>
    </li>
  {/each}
</ol>

<style>
  .dtiles {
    display: grid;
    grid-template-columns: repeat(var(--n, 3), minmax(0, 1fr));
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: grid;
    justify-items: center;
    gap: 4px;
    padding: 12px 6px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    text-align: center;
    min-width: 0;
  }
  li.wet {
    background: var(--info-soft);
  }
  li :global(svg) {
    color: var(--ink-2);
  }
  .wd {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  b {
    font: 600 var(--fs-body) / 1.2 var(--font-body);
  }
  .rn {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
</style>
