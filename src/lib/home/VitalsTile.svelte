<script>
  /**
   * «Körperwerte» on Heute (Noah 21.10.2026 06:49 «Körperwerte und countdown ok»): the most important Fitbit
   * values of today in one row (vitals.js); a tap on a value opens its tab of Körperwerte, the head the page.
   * A value of an earlier day says which day. Only to look at: no colour for good or bad.
   */
  import { liveQuery } from 'dexie';
  import { HeartPulse, ChevronRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { addDays } from '../health.js';
  import { vitalsToday } from './vitals.js';
  import TileHead from './TileHead.svelte';
  import { health } from '../health/client.svelte.js';
  import { fitbitEmpty } from '../health/emptyline.js';
  import { t, num, locale } from '../i18n.svelte.js';

  let { today, isnew = false } = $props();
  const hq = $derived(liveQuery(() => (db.healthDays ? db.healthDays.where('date').aboveOrEqual(addDays(today, -6)).toArray() : [])));
  const vit = $derived(vitalsToday($hq ?? [], today));
  const fmt = (r) => (r.v == null ? '–' : num(r.v));
  const dayWord = (d) => (d === today ? '' : d === addDays(today, -1) ? t('yesterday') : new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' }));
  const shortDay = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', timeZone: 'UTC' });
</script>

<section class="vt surf" aria-labelledby="vt-h" data-section="vitals">
  <div class="hd">
    <TileHead icon={HeartPulse} id="vt-h" title={t('Body values')} {isnew} info="tile.vitals" />
    <a class="go" href="#/flow/stats/hr" data-vitals-all>{t('All body values')}<ChevronRight size={16} aria-hidden="true" /></a>
  </div>
  {#if vit.any}
    <ul class="vals">
      {#each vit.rows as r (r.key)}
        <li>
          <a href="#/flow/stats/{r.tab}" data-vital={r.key}>
            <span class="k">{t(r.label)}</span>
            <b class="num">{fmt(r)}{#if r.v != null && r.unit}<small> {r.unit}</small>{/if}</b>
            {#if r.day && r.day !== today}<span class="d">{dayWord(r.day)}</span>{/if}
          </a>
        </li>
      {/each}
    </ul>
  {:else}
    {@const e = fitbitEmpty(health)}
    <p class="empty" data-fitbit-empty={e.why}>{e.text ? t(e.text, { date: e.date ? shortDay(e.date) : '' }) : t('Connect Fitbit and your body values show here.')} <a href={e.href}>{t(e.link)}</a></p>
  {/if}
</section>

<style>
  .vt {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
    padding: 14px 18px;
    box-sizing: border-box;
  }
  .hd {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .hd :global(.th) {
    flex: 1;
  }
  .go {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--hi);
    font-weight: 600;
    font-size: var(--fs-small);
    text-decoration: none;
  }
  .vals {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .vals a {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-height: 44px;
    padding: 8px 10px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink);
    text-decoration: none;
  }
  .k,
  .d {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    overflow-wrap: break-word;
  }
  .vals b {
    font-size: var(--fs-sub);
    font-weight: 600;
  }
  .vals small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-weight: 500;
  }
  .empty {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .empty a {
    color: var(--hi);
    font-weight: 600;
  }
  @media (max-width: 719px) {
    .vals {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
</style>
