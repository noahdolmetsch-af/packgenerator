<script>
  /**
   * Paket M «Aus Touren lernen», #38 «Sichtbar machen, was die App gelernt hat»: #/gelernt (this month),
   * #/gelernt/<YYYY-MM> (a month), #/gelernt/<YYYY> (the year letter).
   * - Monatskarte: what the app learned from you in a month, 3–6 short lines with numbers (lernen/gelernt.js).
   * - Jahresbrief: «Dein Jahr 2026», a calm letter in plain words from templates and numbers (no AI),
   *   to print or share (window.print with a print style: only the letter is printed).
   * Reading only; nothing here changes your data.
   */
  import { liveQuery } from 'dexie';
  import { ChevronLeft, ChevronRight, Printer, Share2, Lightbulb, Route, Backpack, Home, Gauge, Shirt, Images } from '@lucide/svelte';
  import PageHead from '../lib/ui/PageHead.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import Btn from '../lib/ui/Btn.svelte';
  import { db } from '../lib/db.js';
  import { homeTrips } from '../lib/home/heute.js';
  import { PACE_KEY } from '../lib/pace.js';
  import { CLOTHING_OFFSET } from '../lib/wardrobe.js';
  import { monthCard, yearLetter, monthsWithData, yearsWithData } from '../lib/lernen/gelernt.js';
  import { localDay } from '../lib/localday.js';
  import { monthLong } from '../lib/review/fmt.js';
  import { t, tn, num } from '../lib/i18n.svelte.js';
  import '../lib/review/review.css';

  let { sub = '' } = $props();
  const today = localDay();
  const dataQ = liveQuery(async () => {
    const [trips, debriefs, rides, learnings, items, pace, offset] = await Promise.all([db.trips.toArray(), db.debriefs.toArray(), db.rides.toArray(), db.learnings.toArray(), db.items.toArray(), db.settings.get(PACE_KEY), db.settings.get(CLOTHING_OFFSET)]);
    return { trips: homeTrips(trips), debriefs, rides, learnings: learnings.filter((l) => !l.archivedAt), items, pace: pace?.value ?? null, offset: offset ?? null };
  });
  const data = $derived($dataQ);

  // the month or year of the address when the page opens; then the arrows choose
  // svelte-ignore state_referenced_locally
  const sub0 = sub;
  const isYear = /^\d{4}$/.test(sub0);
  let mode = $state(isYear ? 'year' : 'month');
  let month = $state(/^\d{4}-\d\d$/.test(sub0) ? sub0 : today.slice(0, 7));
  let year = $state(isYear ? sub0 : today.slice(0, 4));
  function address() {
    try {
      history.replaceState(history.state, '', `#/gelernt/${mode === 'year' ? year : month}`);
    } catch {
      /* the address stays */
    }
  }
  const months = $derived(data ? monthsWithData({ ...data, today }) : [today.slice(0, 7)]);
  const years = $derived(data ? yearsWithData({ ...data, today }) : [today.slice(0, 4)]);
  const mi = $derived(months.indexOf(month));
  const yi = $derived(years.indexOf(year));
  const card = $derived(data ? monthCard({ ...data, month, today }) : null);
  const letter = $derived(data ? yearLetter({ ...data, year, today }) : null);

  const signed = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');
  const ICON = { trips: Route, learnings: Lightbulb, templates: Backpack, home: Home, pace: Gauge, clothing: Shirt };
  function lineText(l) {
    if (l.key === 'trips') {
      const km = num(l.km);
      if (!l.n) return { text: tn(l.rides, '{n} ride, {km} km', '{n} rides, {km} km', { km }) };
      return { text: tn(l.n, '{n} trip done, {km} km', '{n} trips done, {km} km', { km }), sub: l.rides ? tn(l.rides, 'plus {n} ride of your own', 'plus {n} rides of your own') : '' };
    }
    if (l.key === 'learnings') return { text: tn(l.n, '{n} new learning', '{n} new learnings'), sub: l.first ? `«${l.first}»` : '' };
    if (l.key === 'templates') return { text: tn(l.n, '{n} template updated from your debriefs', '{n} templates updated from your debriefs') };
    if (l.key === 'home') return { text: tn(l.n, '{n} thing stays at home now', '{n} things stay at home now'), sub: l.names.join(', ') };
    if (l.key === 'pace') return { text: t('Your pace: {kmh} km/h and {climb} m climbing per hour', { kmh: num(l.kmh), climb: num(l.climbMh) }), sub: l.n ? tn(l.n, 'learned from {n} ride this month', 'learned from {n} rides this month') : l.mine ? t('Used for every riding time now') : '' };
    return { text: t('Clothing border moved: {from} → {to} °C', { from: signed(l.from), to: signed(l.to) }), sub: l.to > l.from ? t('You felt cold more often: the layers start earlier.') : t('You felt warm more often: the layers start later.') };
  }

  // the letter as plain sentences (also what «Share» sends)
  const paras = $derived.by(() => {
    const y = letter;
    if (!y) return [];
    if (y.empty) return [t('No trips this year yet. The letter writes itself as soon as you are on the way.')];
    const out = [];
    if (y.trips) out.push(tn(y.trips, 'This year you were out on {n} trip: {km} km and {gain} m of climbing, {days} days on the way.', 'This year you were out on {n} trips: {km} km and {gain} m of climbing, {days} days on the way.', { km: num(y.km), gain: num(y.gainM), days: num(y.days) }));
    else if (y.rides) out.push(tn(y.rides, 'This year you rode {n} ride: {km} km and {gain} m of climbing.', 'This year you rode {n} rides: {km} km and {gain} m of climbing.', { km: num(y.km), gain: num(y.gainM) }));
    if (y.trips && y.rides) out.push(tn(y.rides, 'Plus {n} ride of your own.', 'Plus {n} rides of your own.'));
    if (y.longest) out.push(t('Your longest tour was «{title}» with {km} km.', { title: y.longest.title, km: num(y.longest.km) }));
    if (y.topMonth) out.push(t('You rode the most in {month}: {km} km.', { month: monthLong(y.topMonth.month), km: num(y.topMonth.km) }));
    if (y.best) out.push(t('The tour that fit best: «{title}».', { title: y.best.title }) + (y.best.note ? ` ${t('You wrote: «{note}»', { note: y.best.note })}` : ''));
    if (y.learnings) out.push(tn(y.learnings, 'The app learned {n} new thing from you.', 'The app learned {n} new things from you.') + (y.firstLearning ? ` ${t('The first one: «{rule}».', { rule: y.firstLearning })}` : ''));
    if (y.less.length) out.push(t('You take less with you now: {names}.', { names: y.less.join(', ') }));
    if (y.templatesN) out.push(tn(y.templatesN, 'Your debriefs updated {n} template.', 'Your debriefs updated {n} templates.'));
    out.push(t('On to the next year.'));
    return out;
  });
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  async function share() {
    try {
      await navigator.share({ title: t('Your year {year}', { year }), text: [t('Your year {year}', { year }), ...paras].join('\n\n') });
    } catch {
      /* closed or not possible: nothing to do */
    }
  }
</script>

<div class="rv-page gelernt">
  <div class="noprint">
    <PageHead title={t('What the app learned')} text={t('A month card and a letter for the year show what your trips taught the app.')} />
    <Seg options={[{ key: 'month', name: t('Month|gelernt') }, { key: 'year', name: t('Year|gelernt') }]} value={mode} label={t('Month or year')} onchange={(k) => ((mode = k), address())} />
  </div>

  {#if data && mode === 'month'}
    <section class="rv-sec mcard" aria-labelledby="gm-h" data-monthcard>
      <div class="pick">
        <button type="button" class="arrow" aria-label={t('Older month')} disabled={mi < 0 || mi >= months.length - 1} onclick={() => ((month = months[mi + 1]), address())}><ChevronLeft size={20} aria-hidden="true" /></button>
        <h2 id="gm-h">{monthLong(month)}</h2>
        <button type="button" class="arrow" aria-label={t('Newer month')} disabled={mi <= 0} onclick={() => ((month = months[mi - 1]), address())}><ChevronRight size={20} aria-hidden="true" /></button>
      </div>
      {#if card.empty}
        <p class="rv-sub quiet">{t('This month the app has not learned anything new yet. It learns from trips, debriefs and rides.')}</p>
      {:else}
        <ul class="rv-box">
          {#each card.lines as l (l.key)}
            {@const w = lineText(l)}
            {@const Icon = ICON[l.key]}
            <li class="rv-row" data-line={l.key}>
              <span class="rv-ic" aria-hidden="true"><Icon size={18} /></span>
              <span class="rv-m"><span class="rv-t num">{w.text}</span>{#if w.sub}<span class="rv-s">{w.sub}</span>{/if}</span>
            </li>
          {/each}
        </ul>
      {/if}
      <p class="rv-sub">{t('Only numbers from your own data. Nothing here changes anything.')}</p>
    </section>
  {:else if data && letter}
    <div class="pick noprint">
      <button type="button" class="arrow" aria-label={t('Older year')} disabled={yi < 0 || yi >= years.length - 1} onclick={() => ((year = years[yi + 1]), address())}><ChevronLeft size={20} aria-hidden="true" /></button>
      <span class="yname num">{year}</span>
      <button type="button" class="arrow" aria-label={t('Newer year')} disabled={yi <= 0} onclick={() => ((year = years[yi - 1]), address())}><ChevronRight size={20} aria-hidden="true" /></button>
    </div>
    <article class="letter surf" aria-labelledby="gy-h" data-letter>
      <h2 id="gy-h">{t('Your year {year}', { year })}</h2>
      {#each paras as p, i (i)}<p>{p}</p>{/each}
      <p class="sign">{t('Your Pack Generator')}</p>
    </article>
    <div class="rowacts noprint">
      <Btn icon={Printer} label={t('Print')} explain={t('Print the letter or save it as PDF')} onclick={() => window.print()} />
      {#if canShare}<Btn icon={Share2} label={t('Share')} explain={t('Send the letter as text')} onclick={share} />{/if}
      <Btn icon={Images} label={t('Year as pictures')} explain={t('Your year of trips as a picture story')} href="#/jahr/{year}" />
    </div>
  {/if}
</div>

<style>
  .gelernt {
    display: flex;
    flex-direction: column;
    gap: 18px;
    max-width: 720px;
  }
  .pick {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 10px;
  }
  .pick h2,
  .yname {
    flex: 1 1 auto;
    margin: 0;
    text-align: center;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .arrow {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .arrow:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .quiet {
    margin: 0 2px 10px;
  }
  .mcard .rv-sub {
    margin-top: 10px;
  }
  .letter {
    padding: 24px 24px 20px;
    font-size: var(--fs-body);
    line-height: 1.6;
  }
  .letter h2 {
    margin: 0 0 14px;
    font: 600 var(--fs-title) / 1.2 var(--font-body);
  }
  .letter p {
    margin: 0 0 10px;
    overflow-wrap: break-word;
  }
  .sign {
    margin-top: 18px !important;
    color: var(--ink-2);
    font-style: italic;
  }
  @media print {
    :global(body *) {
      visibility: hidden;
    }
    .letter,
    .letter :global(*) {
      visibility: visible;
    }
    .letter {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      border: 0;
      box-shadow: none;
      color: CanvasText;
      background: Canvas;
    }
    .noprint {
      display: none;
    }
  }
</style>
