<script>
  /**
   * 0.155.0 «Aktiv» on Heute (mockup HA1b «ganze Zeile», in HN4 where «Schon probiert?» was; Noah 14.10.2026
   * «HN4 freigegeben»). HN4b 3a (Noah 22:12 «3a»): the resting pulse and the active zone minutes are not here
   * (the compact balance shows them), so the tile shows the sleep of last night (Fitbit first, 20.10.2026), the last activity, the next
   * fixed date and the ways into Aktiv. Observation only, no judgement: a value that is not known shows «–»,
   * nothing is estimated. compact: the smaller form inside the day card (morning).
   */
  import { liveQuery } from 'dexie';
  import { Activity, Moon, Bike, CalendarDays, ChevronRight, Flower2, Target, Star, BedDouble, ShoppingBag } from '@lucide/svelte';
  import { db } from '../db.js';
  import { abQuery } from '../abdb.js';
  import { flowQuery } from '../flow/data.svelte.js';
  import { actName } from '../flow/ui.svelte.js';
  import { FIXED_KEY, fixedList } from '../flowweek.js';
  import { withStravaRides } from '../kmbook.js';
  import { lastActivity, nextFixed, feltSleep, fitbitSleep, addDay } from './heuteneu.js';
  import { t, num, locale } from '../i18n.svelte.js';

  let { today, rides = [], size = 'long', compact = false, hm = '00:00' } = $props();
  const kmQ = liveQuery(() => db.kmBook.toArray());
  const fixQ = liveQuery(async () => fixedList((await db.settings.get(FIXED_KEY))?.value));
  const abq = $derived(abQuery(today));
  const fq = $derived(flowQuery(today));
  const last = $derived(lastActivity(withStravaRides(rides, $kmQ ?? [])));
  const sleep = $derived(feltSleep($abq?.answers ?? [], today));
  // Fitbit überall (Noah 20.10.2026 22:21): the measured sleep first, the felt one as well when given
  const hq = $derived(liveQuery(() => (db.healthDays ? db.healthDays.where('date').equals(today).toArray() : [])));
  const sleepH = $derived(fitbitSleep($hq ?? [], today));
  const next = $derived(nextFixed($fixQ ?? [], today, hm));
  const nextAct = $derived(next ? (($fq?.acts ?? []).find((a) => a.id === next.actId) ?? null) : null);
  const dayWord = (d) => (d === today ? t('today') : d === addDay(today, -1) ? t('yesterday') : d === addDay(today, 1) ? t('tomorrow') : new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }));
  const nextDay = (d) => (d === today ? t('today') : d === addDay(today, 1) ? t('tomorrow') : new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' }));
  const SHORT = [
    { href: '#/flow/act/meditation', icon: Flower2, label: 'Meditation' },
    { href: '#/flow/week', icon: CalendarDays, label: 'Week|aktiv' },
    { href: '#/flow/goals', icon: Target, label: 'Activities|aktiv' },
    { href: '#/flow/activity', icon: Star, label: 'Activity|tab' },
    { href: '#/flow/rest', icon: BedDouble, label: 'Recovery|aktiv' },
    { href: '#/flow/bags', icon: ShoppingBag, label: 'Sports bag' },
  ];
</script>

<section class="ak surf {size}" class:compact aria-labelledby={compact ? 'ak-hc' : 'ak-h'} data-section={compact ? 'aktiv-mini' : 'aktiv'}>
  <div class="hd">
    <span class="ico" aria-hidden="true"><Activity size={16} /></span>
    <h2 id={compact ? 'ak-hc' : 'ak-h'}>{t('Active|place')}</h2>
    <span class="sd">{t('today · observation only')}</span>
    <a class="go" href="#/flow" aria-hidden="true" tabindex="-1" title={t('Open')}><ChevronRight size={16} strokeWidth={2.4} /></a>
  </div>
  <ul class="vals">
    <li data-val="sleep">
      <span class="k"><Moon size={14} aria-hidden="true" />{t('Sleep last night')}</span>
      {#if sleepH != null}<span class="big num">{num(sleepH)} <small>h</small></span><span class="su">{t('measured with Fitbit|body')}{#if sleep != null}{' '}· {t('felt {n} of 10', { n: sleep })}{/if}</span>
      {:else if sleep != null}<span class="big num">{t('felt {n} of 10', { n: sleep })}</span><span class="su">{t('from «Wi gaht\'s?»')}</span>
      {:else}<span class="big none">–</span><span class="su">{t('comes with Fitbit or «Wi gaht\'s?»')}</span>{/if}
    </li>
    <li data-val="last">
      <span class="k"><Bike size={14} aria-hidden="true" />{t('Last activity')}</span>
      {#if last}<span class="big num">{num(last.km)} <small>km</small></span><span class="su">{dayWord(last.date)}{#if last.hr}{' '}· {t('avg pulse {n}', { n: last.hr })}{/if}{#if last.source === 'strava'}{' '}· Strava{/if}</span>
      {:else}<span class="big none">–</span><span class="su">{t('no ride yet')}</span>{/if}
    </li>
  </ul>
  {#if next}
    <p class="next" data-next><CalendarDays size={16} aria-hidden="true" /><span>{t('Next up:')} <b>{nextDay(next.day)} {next.time} · {nextAct ? actName(nextAct) : next.actId}</b> · {t('fixed date')}</span></p>
  {/if}
  {#if !compact}
    <ul class="sc">
      {#each SHORT as s (s.href)}
        {@const I = s.icon}
        <li><a href={s.href}><I size={18} aria-hidden="true" /><span>{t(s.label)}</span></a></li>
      {/each}
    </ul>
  {/if}
  <div class="ft">
    {#if !compact}<span class="obs">{t('Observation only, no judgement')}</span>{/if}
    <a class="op" href="#/flow">{t('Open Aktiv')}<ChevronRight size={14} strokeWidth={2.6} aria-hidden="true" /></a>
  </div>
</section>

<style>
  .ak {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    padding: 14px 18px 12px;
    box-sizing: border-box;
    color: var(--ink);
  }
  .ak.compact {
    padding: 0;
    border: 0;
    background: none;
    box-shadow: none;
  }
  .hd {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ico {
    display: grid;
    flex: none;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .sd {
    flex: 1;
    min-width: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .go {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: var(--ink-2);
  }
  .vals {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .vals li {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .k {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    font-weight: 600;
  }
  .k :global(svg) {
    flex: none;
    color: var(--ink-3);
  }
  .big {
    font: 600 var(--fs-sub) / 1.2 var(--font-body);
  }
  .big small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-weight: 500;
  }
  .big.none {
    color: var(--ink-3);
    font-weight: 500;
  }
  .su {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    line-height: 1.3;
    overflow-wrap: break-word;
  }
  .next {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .next :global(svg) {
    flex: none;
    color: var(--ink-3);
  }
  .next b {
    color: var(--ink);
    font-weight: 600;
  }
  .sc {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .sc a {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 44px;
    padding: 8px 2px;
    border: 1px solid var(--card-line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    font-size: var(--fs-tiny);
    font-weight: 500;
    text-align: center;
    text-decoration: none;
  }
  .sc a span {
    max-width: 100%;
    overflow-wrap: break-word;
  }
  .sc a :global(svg) {
    color: var(--ink-2);
  }
  .ft {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 10px;
    margin-top: auto;
  }
  .obs {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .op {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    margin-left: auto;
    color: var(--accent);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  @media (max-width: 719px) {
    .ak:not(.compact) {
      padding: 14px 14px 12px;
    }
    .go {
      width: 44px;
      height: 44px;
      margin: -6px -8px -6px 0;
    }
    .sc {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .big {
      font-size: var(--fs-sub);
    }
  }
</style>
