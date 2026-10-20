<script>
  /**
   * Paket U «Rennen» · 33 Briefing-Blatt (#/race/brief/<id>): one print-friendly page with the plan per
   * day, checkpoints and cut-offs, beds per night, drop bags, the biggest gaps, Sundays, emergency numbers
   * and your why. 24 Rennbericht (?report=1): the same page as a report of what you logged — times
   * against the plan, food, sleep, contact points and stops. «Print or save as PDF» = window.print().
   */
  import { liveQuery } from 'dexie';
  import { Printer } from '@lucide/svelte';
  import Crumb from '../flow/kit/Crumb.svelte';
  import { db } from '../db.js';
  import { checkpointRows, nightRows, foodStats, stopAnalysis, contactSummary, countriesOf, samples, COUNTRY, CONTACT_LEVELS, hhmm, hm } from './race.js';
  import { sleepNear, POI_KIND } from './outside.js';
  import { biggestGaps } from './files.js';
  import { sectionAnalysis } from './more.js';
  import { gainBetween, tripDays, sundays, sleptMin, rideTimes } from './ride-lib.js';
  import { raceHref } from './parts.js';
  import { t, num, dateOf, locale } from '../i18n.svelte.js';

  let { ctx } = $props();
  const id = ctx.trip.id;
  const isReport = () => typeof location !== 'undefined' && /[?&]report=1\b/.test(location.hash);
  let report = $state(isReport());
  $effect(() => {
    const on = () => (report = isReport());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  });

  const plan = $derived(ctx.plan);
  const race = $derived(ctx.race);
  const total = $derived(ctx.route?.km ?? 0);
  const when = (ms) => (ms == null || !Number.isFinite(ms) ? '–' : `${new Date(ms).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric' })} ${hhmm(ms)}`);
  const rows = $derived(checkpointRows(race, plan));
  const nights = $derived(nightRows(race, plan));
  const bedOf = (n) => (n.kind === 'through' ? null : sleepNear(ctx.pois, n.km)[0] ?? null);
  const depots = $derived(ctx.pois.filter((p) => p.kind === 'depot'));
  const gaps = $derived(total ? biggestGaps(ctx.pois, total, ['shop', 'water', 'sleep', 'bike']) : []);
  const days = $derived(tripDays(ctx.trip));
  const suns = $derived(sundays(days));
  const codes = $derived(Array.isArray(race.countries) ? race.countries : countriesOf(samples(ctx.pts, 25, 40)));
  const countries = $derived(codes.map((c) => COUNTRY[c]).filter(Boolean));
  const NIGHT = { bivy: 'Bivy', hotel: 'Hotel or room', through: 'Ride through' };

  /* report */
  const sections = $derived(plan ? sectionAnalysis(rows, plan.start) : []);
  const food = $derived(foodStats(race.food, { start: plan?.start, now: plan ? Math.min(Date.now(), plan.end + 24 * 36e5) : Date.now(), blocks: plan?.blocks ?? [] }));
  const log = $derived(Array.isArray(ctx.stored.sleepLog) ? ctx.stored.sleepLog : []);
  const contacts = $derived(contactSummary(race.contacts));
  const ridesQ = liveQuery(() => db.rides.where('tripId').equals(id).toArray());
  const daysKey = $derived(days.join(','));
  const actsQ = $derived.by(() => {
    const ds = daysKey ? daysKey.split(',') : [];
    return liveQuery(() => (ds.length ? db.activities.where('day').anyOf(ds).toArray() : []));
  });
  const stops = $derived(stopAnalysis(rideTimes($ridesQ ?? [], $actsQ ?? [], days)));
</script>

<article class="rc bf" data-page="race-brief" data-race-report={report ? '1' : undefined}>
  <div class="bf-noprint">
    <Crumb path={[{ href: '#/race', label: t('Races') }, { href: raceHref(id), label: ctx.trip.title }]} here={report ? t('Race report') : t('Briefing sheet')} />
  </div>
  <h1 class="rc-h1" tabindex="-1" data-page-title>{ctx.trip.title}</h1>
  <p class="rc-intro">
    {report ? t('Race report') : t('Briefing sheet')}{#if ctx.trip.startDate}{' '}· {dateOf(ctx.trip.startDate)}{#if days.length > 1}{' '}– {dateOf(days.at(-1))}{/if}{/if}{#if total}{' '}· {num(Math.round(total))} km{/if}
  </p>
  {#if report}<p class="rc-text">{t('A report of your race, made from what you logged.')}</p>{/if}
  <div class="rc-acts bf-noprint">
    <button type="button" class="btn hi" onclick={() => window.print()} data-race-print><Printer size={16} aria-hidden="true" />{t('Print or save as PDF')}</button>
    <a class="btn" href={report ? `#/race/brief/${encodeURIComponent(id)}` : `#/race/brief/${encodeURIComponent(id)}?report=1`}>{report ? t('Briefing sheet') : t('Race report')}</a>
  </div>

  {#if report}
    <section class="bf-sec">
      <h2 class="rc-h2">{t('Times against the plan')}</h2>
      {#if sections.some((s) => s.actualH != null)}
        <div class="rc-scroll">
          <table class="rc-table">
            <thead><tr><th>{t('Section')}</th><th class="num">{t('km')}</th><th class="num">{t('Plan')}</th><th class="num">{t('Actual')}</th><th class="num">±</th></tr></thead>
            <tbody>
              {#each sections as s, i (i)}<tr><td>{s.name || t('Checkpoint')}</td><td class="num">{num(Math.round(s.fromKm))}–{num(Math.round(s.toKm))}</td><td class="num">{s.planH == null ? '–' : hm(s.planH)}</td><td class="num">{s.actualH == null ? '–' : hm(s.actualH)}</td><td class="num" class:rc-warn={s.diffH > 0} class:rc-ok={s.diffH < 0}>{s.diffH == null ? '–' : `${s.diffH > 0 ? '+' : ''}${hm(s.diffH)}`}</td></tr>{/each}
            </tbody>
          </table>
        </div>
      {:else}<p class="rc-empty">{t('No checkpoint times logged.')}</p>{/if}
    </section>
    <section class="bf-sec">
      <h2 class="rc-h2">{t('Food')}</h2>
      <p class="rc-text">{race.food.length ? t('{n} times eaten · {h} per hour · {g} gaps over 1.5 h', { n: race.food.length, h: food.perH == null ? '–' : num(food.perH), g: food.gaps.length }) : t('No food logged.')}</p>
    </section>
    <section class="bf-sec">
      <h2 class="rc-h2">{t('Sleep')}</h2>
      {#if log.length}
        <p class="rc-text">{t('{h} sleep in {n} parts', { h: hm(sleptMin(log) / 60), n: log.length })}</p>
        <p class="rc-note">{log.map((x) => `${when(Date.parse(x.at))}: ${x.min} min`).join(' · ')}</p>
      {:else}<p class="rc-empty">{t('No sleep logged.')}</p>{/if}
    </section>
    <section class="bf-sec">
      <h2 class="rc-h2">{t('Contact points')}</h2>
      {#if race.contacts.length}
        <p class="rc-text">{contacts.map((c) => `${t(c.name)}: ${t(CONTACT_LEVELS[c.max])}`).join(' · ')}</p>
        {#each race.contacts.filter((c) => c.setup) as c (c.id)}<p class="rc-note">{t('Day {n}', { n: c.stage })}: {c.setup}</p>{/each}
      {:else}<p class="rc-empty">{t('No contact points logged.')}</p>{/if}
    </section>
    <section class="bf-sec">
      <h2 class="rc-h2">{t('Stops')}</h2>
      {#if stops}
        <p class="rc-text">{t('{m} riding of {tot} in total · {s} % standing still · {l} stops of 20 min or more', { m: hm(stops.movingH), tot: hm(stops.totalH), s: stops.share, l: stops.long })}</p>
        {#if stops.learn}<p class="rc-note">{t(stops.learn)}</p>{/if}
      {:else}<p class="rc-empty">{t('No rides of this race yet. Upload the GPX under Rides or connect Strava under Training.')}</p>{/if}
    </section>
  {:else}
    <section class="bf-sec">
      <h2 class="rc-h2">{t('Plan per day')}</h2>
      {#if plan?.days.length}
        <div class="rc-scroll">
          <table class="rc-table" data-race-brief-days>
            <thead><tr><th>{t('Day')}</th><th class="num">{t('km')}</th><th class="num">{t('From–to')}</th><th class="num">{t('m up')}</th></tr></thead>
            <tbody>
              {#each plan.days as d (d.day)}{@const up = gainBetween(ctx.route?.profile, d.from, d.to)}<tr><td>{dateOf(d.day)}</td><td class="num">{num(d.km)}</td><td class="num">{num(Math.round(d.from))}–{num(Math.round(d.to))}</td><td class="num">{up == null ? '–' : num(up)}</td></tr>{/each}
            </tbody>
          </table>
        </div>
      {:else}<p class="rc-empty">{t('No plan yet: a start time and a route are needed.')}</p>{/if}
    </section>
    <section class="bf-sec">
      <h2 class="rc-h2">{t('Checkpoints')}</h2>
      {#if rows.length}
        <div class="rc-scroll">
          <table class="rc-table">
            <thead><tr><th>{t('Checkpoint')}</th><th class="num">{t('km')}</th><th>{t('Planned')}</th><th>{t('Cut-off')}</th></tr></thead>
            <tbody>
              {#each rows as r (r.id)}<tr><td>{r.name || t('Checkpoint')}</td><td class="num">{num(Math.round(r.km))}</td><td>{when(r.eta)}</td><td class:rc-warn={r.bufferH != null && r.bufferH < 2}>{r.cutMs ? when(r.cutMs) : '–'}</td></tr>{/each}
            </tbody>
          </table>
        </div>
      {:else}<p class="rc-empty">{t('No checkpoints yet. Add them under «Prepare».')}</p>{/if}
    </section>
    <section class="bf-sec">
      <h2 class="rc-h2">{t('Beds per night')}</h2>
      {#if nights.length}
        <ul class="rc-list">
          {#each nights as n (n.n)}{@const b = bedOf(n)}
            <li class="rc-row"><span class="rc-row-main"><b>{when(n.from)} · km {num(n.km)} · {t(NIGHT[n.kind])}</b><small>{n.place || (b ? `${b.name || t('Place to sleep')} (km ${num(Math.round(b.km))})` : t('No place to sleep known nearby.'))}{b?.phone ? ` · ${b.phone}` : ''}</small></span></li>
          {/each}
        </ul>
      {:else}<p class="rc-empty">{t('No nights in the plan.')}</p>{/if}
    </section>
    {#if race.dropBags.length || depots.length}
      <section class="bf-sec">
        <h2 class="rc-h2">{t('Drop bags and depots')}</h2>
        <ul class="rc-list">
          {#each race.dropBags as d (d.id)}<li class="rc-row"><span class="rc-row-main"><b>{d.where || d.text || ''}{d.km ? ` · km ${num(Math.round(d.km))}` : ''}</b>{#if d.what}<small>{d.what}</small>{/if}</span></li>{/each}
          {#each depots as p (p.id ?? p.km)}<li class="rc-row"><span class="rc-row-main"><b>{p.name || t('Depot')} · km {num(Math.round(p.km))}</b></span></li>{/each}
        </ul>
      </section>
    {/if}
    {#if gaps.length}
      <section class="bf-sec">
        <h2 class="rc-h2">{t('Biggest gaps')}</h2>
        <ul class="rc-list">
          {#each gaps as g (g.kind)}<li class="rc-row"><span class="rc-row-main"><b>{t('{km} km without {kind}', { km: num(g.km), kind: t(POI_KIND[g.kind]?.name ?? 'Other stop') })}</b><small>km {num(g.fromKm)}–{num(g.toKm)}</small></span></li>{/each}
        </ul>
      </section>
    {/if}
    {#if suns.length}
      <section class="bf-sec">
        <h2 class="rc-h2">{t('Sundays')}</h2>
        <p class="rc-text">{suns.map(dateOf).join(', ')}</p>
        {#each countries as c (c.code)}<p class="rc-note">{t(c.name)}: {t(c.sunday)}</p>{/each}
      </section>
    {/if}
    {#if countries.length}
      <section class="bf-sec">
        <h2 class="rc-h2">{t('Emergency numbers')}</h2>
        <ul class="rc-list">
          {#each countries as c (c.code)}<li class="rc-row"><span class="rc-row-main"><b>{t(c.name)}</b><small>{t(c.sos)}</small></span></li>{/each}
        </ul>
      </section>
    {/if}
    {#if race.why.some((w) => w.text)}
      <section class="bf-sec">
        <h2 class="rc-h2">{t('My why')}</h2>
        {#each race.why.filter((w) => w.text) as w (w.id)}<p class="rc-text">{w.text}</p>{/each}
      </section>
    {/if}
  {/if}
</article>

<style>
  .bf {
    max-width: 800px;
  }
  .bf-sec {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
    break-inside: avoid;
  }
  @media print {
    .bf-noprint {
      display: none !important;
    }
    .bf {
      max-width: none;
      color: var(--ink);
    }
    .bf :global(.rc-scroll) {
      overflow: visible;
    }
  }
</style>
