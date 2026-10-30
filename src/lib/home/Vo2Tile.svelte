<script>
  /**
   * «VO2max auf Heute» (Noah 28.10.2026 «2 a und b»): the last VO2max from Fitbit or Apple Health (vo2.js), its day
   * and the value about four weeks before, only to look at: no colour for good or bad. A tap on «Course» opens its
   * tab of Körperwerte. Home.svelte leaves the tile away while there is no value in the last 90 days.
   */
  import { liveQuery } from 'dexie';
  import { Gauge, ChevronRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { addDays } from '../health.js';
  import { vo2Of, VO2_DAYS } from './vo2.js';
  import TileHead from './TileHead.svelte';
  import { t, num, locale } from '../i18n.svelte.js';

  let { today, isnew = false } = $props();
  const hq = $derived(liveQuery(() => (db.healthDays ? db.healthDays.where('date').aboveOrEqual(addDays(today, -2 * VO2_DAYS)).toArray() : [])));
  const vo = $derived(vo2Of($hq ?? [], today));
  const shortDay = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const dayWord = (d) => (d === today ? t('today') : d === addDays(today, -1) ? t('yesterday') : shortDay(d));
  const signed = (d) => `${d > 0 ? '+' : d < 0 ? '−' : '±'}${num(Math.abs(d))}`;
</script>

<section class="vo surf" aria-labelledby="vo-h" data-section="vo2max">
  <div class="hd">
    <TileHead icon={Gauge} id="vo-h" title={t('VO2max')} {isnew} />
    <a class="go" href="#/flow/stats/vo2max" data-vo2-all>{t('Course|vo2')}<ChevronRight size={16} aria-hidden="true" /></a>
  </div>
  {#if vo}
    <p class="val" data-vo2-value><b class="num">{num(vo.v)}</b> <small>ml/kg/min</small> <span class="d">{dayWord(vo.day)}</span></p>
    {#if vo.before}
      <p class="was" data-vo2-before>{t('{diff} since {day} ({v})', { diff: signed(vo.diff), day: shortDay(vo.before.day), v: num(vo.before.v) })}</p>
    {:else}
      <p class="was">{t('The change shows once there is a value from four weeks before.')}</p>
    {/if}
  {/if}
</section>

<style>
  .vo {
    display: flex;
    flex-direction: column;
    gap: 6px;
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
  .val {
    margin: 0;
    color: var(--ink);
  }
  .val b {
    font-size: var(--fs-num);
    font-weight: 600;
  }
  .val small,
  .d {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .d {
    display: block;
  }
  .was {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
</style>
