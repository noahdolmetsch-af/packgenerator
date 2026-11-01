<script>
  /**
   * «Bäckerei am Morgen» (Noah 28.10.2026 «3b»): for every planned night, the first bakery on the route
   * after you get up that is open when you get there. Race mode shows the same after midnight («3a»).
   */
  import RaceBox from './RaceBox.svelte';
  import { nightRows, hhmm } from './race.js';
  import { morningBakery } from './night-lib.js';
  import { t, num } from '../i18n.svelte.js';

  let { ctx } = $props();
  const nights = $derived(nightRows(ctx.race, ctx.plan));
  const pois = $derived(ctx.pois ?? []);
  const rows = $derived(nights.map((n) => ({ n, b: morningBakery(pois, ctx.plan ? ctx.plan.kmAt(n.to) : n.km, ctx.plan?.etaOf ?? null) })));
  const opens = (s) => (s.open === true ? (s.closes ? t('open, closes {time}', { time: s.closes }) : t('open')) : s.open === false ? (s.opens ? t('opens {time}', { time: s.opens }) : t('closed')) : t('opening hours unknown'));
</script>

<RaceBox id="bakery" title={t('Bakery in the morning')} what="For every planned night, the first bakery on the route after you get up, open when you get there." why="Something warm to look forward to after a cold night, and you know where breakfast is." from="OpenStreetMap bakeries you loaded above, their opening hours and the pace of your plan.">
  {#if !ctx.plan}
    <p class="rc-empty">{t('Set the start under «Strategy» to see where your nights are.')}</p>
  {:else if !pois.length}
    <p class="rc-empty">{t('Load the places from OpenStreetMap above.')}</p>
  {:else if !nights.length}
    <p class="rc-empty">{t('No night in this plan.')}</p>
  {:else}
    <ul class="rc-list">
      {#each rows as r, i (r.n.n)}
        <li data-bakery-night={r.n.n}>
          <p class="rc-text"><b>{t('Night {n}', { n: i + 1 })}</b> · {t('up at {time}', { time: hhmm(r.n.to) })}</p>
          {#if r.b}
            <p class:rc-ok={r.b.state.open === true} data-bakery-row>{r.b.poi.name || t('Bakery')} · {t('in {km} km', { km: num(r.b.km) })}{r.b.at ? ` · ${t('there around {time}', { time: hhmm(r.b.at) })}` : ''} · {opens(r.b.state)}</p>
          {:else}
            <p class="rc-note" data-bakery-none>{t('No bakery in the next 80 km. Look for a shop or petrol station instead.')}</p>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</RaceBox>
