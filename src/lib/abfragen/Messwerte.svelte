<script>
  /**
   * «Aktiv neu» (Noah 20.10.2026: «Wir haben keine Werte zu Herzfrequenz, Puls, Leistung, Schlafdauer,
   * Aktivzonenminuten»): «Deine Messwerte» on Ich › Daten › Auswertung. Every measured value from Fitbit
   * and Strava with its latest day, the mean of 7 days and your normal (median of 30 days), plus an arrow
   * when the 7 days are clearly above or below the normal. One sentence per value what it means.
   * Only to look at, no grades.
   */
  import { ArrowUpRight, ArrowDownRight, ArrowRight, Watch, Bike } from '@lucide/svelte';
  import { tableQuery } from '../messwerte-data.js';
  import { normalOf, shown } from '../messwerte.js';
  import { localDay } from '../localday.js';
  import { t, num } from '../i18n.svelte.js';
  import { srcText } from './words.js';

  let { idp = 'mw' } = $props();
  const today = localDay();
  const q = tableQuery();
  const table = $derived($q ?? new Map());
  // the daily values (time, km and metres are sums of a week, they stay on Aktiv › «Deine Woche in Zahlen»)
  const KEYS = ['sleep', 'rhr', 'hrv', 'steps', 'azm', 'hr', 'watt'];
  const list = $derived(KEYS.map((k) => normalOf(table, k, today)));
  const any = $derived(list.some((r) => r.n));
  const val = (r, v) => (v == null ? '–' : `${shown(r.key, v, num)}${r.key === 'sleep' || !r.m.unit ? '' : ` ${t(r.m.unit)}`}`);
  const dir = (r) => (r.mean7 == null || r.normal == null ? null : r.mean7 > r.normal * 1.05 ? 'up' : r.mean7 < r.normal * 0.95 ? 'down' : 'same');
  const ICON = { fitbit: Watch, strava: Bike };
</script>

<section class="ich-sec" aria-labelledby="{idp}-h" data-section="messwerte">
  <div class="ich-h"><div><h2 id="{idp}-h">{t('Your measured values')}</h2><p class="ich-hs">{t('from Fitbit and Strava · latest day, mean of 7 days, your normal of 30 days')}</p></div></div>
  <div class="card pad">
    {#if !any}
      <p class="wait">{t('No measured values yet. They come with Fitbit (Me › Fitbit) and Strava (Velo › Care › Strava).')}</p>
    {:else}
      <ul class="mw">
        {#each list as r (r.key)}
          {@const I = ICON[r.m.src]}
          {@const d = dir(r)}
          <li data-mw={r.key}>
            <div class="top"><b>{t(r.m.name)}</b><span class="ab-src {r.m.src}"><I size={13} aria-hidden="true" />{srcText(r.m.src)}</span></div>
            <dl>
              <div><dt>{t('latest')}</dt><dd class="num">{val(r, r.last)}</dd></div>
              <div><dt>{t('mean of 7 days')}</dt><dd class="num">{val(r, r.mean7)}</dd></div>
              <div><dt>{t('your normal')}</dt><dd class="num">{r.normal == null ? t('from 7 days on') : val(r, r.normal)}</dd></div>
              <div class="dr"><dt>{d === 'up' ? t('above your normal') : d === 'down' ? t('below your normal') : d === 'same' ? t('as usual') : t('not yet|dir')}</dt><dd>{#if d === 'up'}<ArrowUpRight size={20} aria-hidden="true" />{:else if d === 'down'}<ArrowDownRight size={20} aria-hidden="true" />{:else}<ArrowRight size={20} aria-hidden="true" />{/if}</dd></div>
            </dl>
            <p class="about">{t(r.m.about)}</p>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</section>

<style>
  .mw {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .mw li {
    display: grid;
    gap: 6px;
    padding: 12px 0;
    border-top: 1px solid var(--line);
  }
  .mw li:first-child {
    border-top: 0;
    padding-top: 0;
  }
  .top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }
  dl {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
  }
  dl div {
    display: flex;
    flex-direction: column-reverse;
    gap: 2px;
    min-width: 0;
  }
  dt {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    line-height: 1.25;
    overflow-wrap: break-word;
  }
  dd {
    margin: 0;
    font-weight: 600;
  }
  .about,
  .wait {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
  @media (max-width: 479px) {
    dl {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
