<script>
  /**
   * Paket U4 · 1144 Nächte nach Wetter: for every planned night the rain and the cold where it is planned,
   * and a drier or warmer place within 40 km when the forecast clearly has one. Only a suggestion: the
   * plan is not changed; you move a night yourself under «Strategy».
   */
  import RaceBox from './RaceBox.svelte';
  import { nightsByWeather } from './sleep.js';
  import { nightRows, hm } from './race.js';
  import { raceHref } from './parts.js';
  import { t, num } from '../i18n.svelte.js';

  let { ctx, wx = null } = $props();
  const nights = $derived(nightRows(ctx.race, ctx.plan));
  const kmh = $derived(ctx.plan?.kmh > 0 ? ctx.plan.kmh : 18);
  const rows = $derived(nightsByWeather({ nights, wx, kmh, bagC: ctx.race.bagC }));
  const deg = (c) => (c == null ? '–' : `${Math.round(c)} °C`);
  const pct = (p) => (p == null ? '–' : `${Math.round(p)} %`);
</script>

<RaceBox id="night-wx" title={t('Nights by the weather')} what="Compares the rain and the cold of each planned night with the places up to 40 km before and after it, and suggests a drier or warmer one." why="A dry and less cold night means better sleep and fewer wet clothes; you decide whether to move it." from="The Open-Meteo forecast you loaded above (at points about every 50 km), your plan and your pace. The plan is not changed.">
  {#if !ctx.plan}
    <p class="rc-empty">{t('Set the start under «Strategy» to see where your nights are.')}</p>
  {:else if !wx}
    <p class="rc-empty">{t('Load the weather above.')}</p>
  {:else if !rows.length}
    <p class="rc-empty">{t('No night in this plan, or the nights are not in the forecast yet.')}</p>
  {:else}
    <ul class="rc-list">
      {#each rows as r, i (r.n)}
        <li data-night-wx={r.n}>
          <p class="rc-text"><b>{t('Night {n}', { n: i + 1 })}</b> · {t('km {km}', { km: num(r.km) })} · {t('rain {p}', { p: pct(r.rain) })} · {t('low {t}', { t: deg(r.low) })}</p>
          {#if r.best}
            <p class="rc-ok" data-night-wx-best>{r.best.shiftKm > 0 ? t('Drier or warmer {d} km further, at km {km} (about {h} later): rain {p}, low {c}.', { d: num(r.best.shiftKm), km: num(r.best.km), h: hm(r.best.shiftH), p: pct(r.best.rain), c: deg(r.best.low) }) : t('Drier or warmer {d} km earlier, at km {km} (about {h} sooner): rain {p}, low {c}.', { d: num(-r.best.shiftKm), km: num(r.best.km), h: hm(-r.best.shiftH), p: pct(r.best.rain), c: deg(r.best.low) })}</p>
          {:else}
            <p class="rc-note">{t('No clearly better place within 40 km.')}</p>
          {/if}
        </li>
      {/each}
    </ul>
    <p class="rc-note">{t('Only a suggestion: your plan stays as it is.')} <a href={raceHref(ctx.trip.id, 'strategy')}>{t('Move a night under «Strategy»')}</a></p>
  {/if}
</RaceBox>
