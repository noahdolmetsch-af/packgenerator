<script>
  /**
   * «Auswerten neu» Teil 1 (Noah 24.11.2026 «1b 2a 3b 4a 5a», «eigenes normal», «über die Jahre verteilt»): the start of Auswerten.
   * Content first: the answer for today (the same as on the page «Form»: tagesantwort.js) with its reason, then the three
   * body values of today against YOUR OWN usual range of the last 12 months (the last 4 weeks as the second number),
   * then the four questions that lead to the pages below. The old start stands unchanged at #/auswerten/uebersicht.
   * Observation only: it says where a value stands, never why.
   */
  import { ChevronRight, TriangleAlert, Mountain } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { formQuery } from '../lib/form-data.js';
  import { RAMP_MAX } from '../lib/form.js';
  import { dayAnswer } from '../lib/flow/form/tagesantwort.js';
  import { levelWord, answerLine, answerWhy, tourText, PART_NAMES } from '../lib/flow/form/words.js';
  import { valueCards } from '../lib/auswerten/heute.js';
  import { QUESTIONS } from '../lib/auswerten/fragen.js';
  import NormalBand from '../lib/auswerten/NormalBand.svelte';
  import { shown } from '../lib/messwerte.js';
  import { addTodo } from '../lib/merkendb.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import TipLine from '../lib/pageinfo/TipLine.svelte';
  import PageMore from '../lib/pageinfo/PageMore.svelte';
  import PageTiles from '../lib/sk/PageTiles.svelte';
  import { localDay } from '../lib/localday.js';
  import { t, num } from '../lib/i18n.svelte.js';

  const today = localDay();
  const q = formQuery(today);
  const f = $derived($q);
  const r = $derived(f?.ready);
  const ans = $derived(dayAnswer(r));
  const why = $derived(answerWhy(ans));
  const cards = $derived(f ? valueCards(f.table, today) : []);

  const UNIT = { hrv: 'ms', rhr: 'bpm', sleep: '' };
  const val = (key, v) => (v == null ? '–' : `${shown(key, v, num)}${UNIT[key] ? ` ${UNIT[key]}` : ''}`);
  const PLACE = { below: 'Lower than usual for you', usual: 'Usual for you', above: 'Higher than usual for you' };
  const label = (c) => `${t(PART_NAMES[c.key])}: ${c.place ? t(PLACE[c.place]) : ''}`;

  let noted = $state(false);
  async function note() {
    if (!ans || noted) return;
    noted = true;
    const res = await addTodo(db, { text: answerLine(ans.level), due: today, area: 'sport', src: 'auswerten:heute' });
    offerDone(t('In Merken for today.'), async () => {
      await res?.undo();
      noted = false;
    });
  }
</script>

<div class="heute" data-page="auswerten-heute">
  <header class="ph">
    <h1 class="title">{t('Analysis|place')}</h1>
    <p class="sub">{t('What your watch says today, against your own usual.')}</p>
  </header>

  <!-- The answer for today -->
  {#if f}
    <section class="card ans" data-heute-answer data-level={ans?.level ?? 'none'} aria-labelledby="h-ans">
      {#if ans}
        <h2 id="h-ans" class="lv">{levelWord(ans.level)}<span class="sc num" data-form-score>{num(r.score)}<span class="of">/100</span></span></h2>
        <p class="line" data-form-line>{answerLine(ans.level)}</p>
        {#if why.length}
          <ul class="why" data-heute-why>{#each why as w (w)}<li>{w}</li>{/each}</ul>
        {/if}
        {#if f.alarm || f.rampHigh || f.tour}
          <ul class="notes">
            {#if f.alarm}<li data-form-alarm><TriangleAlert size={16} aria-hidden="true" /><span>{t('Resting pulse up and HRV down two days in a row: an easy day may help.')}</span></li>{/if}
            {#if f.rampHigh}<li data-form-ramp><TriangleAlert size={16} aria-hidden="true" /><span>{t('Your fitness rose by {n} in 7 days. More than {m} a week often leads to overload.', { n: num(r.ramp), m: RAMP_MAX })}</span></li>{/if}
            {#if f.tour}<li data-form-tour><Mountain size={16} aria-hidden="true" /><span>{tourText(f.tour)}</span></li>{/if}
          </ul>
        {/if}
        <div class="acts">
          <button class="btn hi" type="button" onclick={note} disabled={noted} data-heute-note>{t('Note it for today')}</button>
          <a class="btn" href="#/check/morning" data-heute-differ>{t('I see it differently')}</a>
          <a class="more" href="#/flow/form" data-heute-why-link>{t('Why does the app say this?')} <ChevronRight size={16} aria-hidden="true" /></a>
        </div>
        <p class="obs">{t('A suggestion, not a duty. Observation, not a cause.')}</p>
      {:else}
        <h2 id="h-ans" class="lv">{t('Readiness')}</h2>
        <p class="line">{t('Comes with your first activities from Strava or with Fitbit: then the app shows each morning what today suits.')}</p>
        <div class="acts"><a class="btn hi" href="#/auswerten/quellen">{t('Connect your data')}</a></div>
      {/if}
    </section>

    <!-- Your normal: the body values of today against the last 12 months -->
    <section class="card nrm" aria-labelledby="h-nrm" data-heute-normal>
      <h2 id="h-nrm" class="h2">{t('Your normal')}</h2>
      <p class="sub2">{t('Against your own last 12 months, not against other people. The darker band is your middle half.')}</p>
      {#if cards.length}
        <ul class="vals">
          {#each cards as c (c.key)}
            <li data-value={c.key}>
              <div class="top">
                <b>{t(PART_NAMES[c.key])}</b>
                <span class="v num">{c.last ? val(c.key, c.last.value) : '–'}</span>
                {#if c.last && !c.last.isToday}<small class="when">{t('last known')}</small>{/if}
              </div>
              {#if c.normal}
                <NormalBand normal={c.normal} value={c.last?.value ?? null} label={label(c)} />
                <p class="det">
                  {#if c.place}<b data-place={c.place}>{t(PLACE[c.place])}</b>{/if}
                  <span>{t('Usual: {lo} to {hi}', { lo: shown(c.key, c.normal.q1, num), hi: shown(c.key, c.normal.q3, num) })}{#if c.normal28}{' · '}{t('Last 4 weeks: {n}', { n: shown(c.key, c.normal28.median, num) })}{/if}</span>
                  {#if c.share != null}<span>{t('{n} of 100 days were lower', { n: num(c.share) })}</span>{/if}
                </p>
              {:else}
                <p class="det">{t('Your usual range comes after 30 days with this value.')}</p>
              {/if}
            </li>
          {/each}
        </ul>
        <a class="more" href="#/auswerten/verlauf" data-heute-years>{t('Your normal over the years')} <ChevronRight size={16} aria-hidden="true" /></a>
      {:else}
        <p class="det">{t('No values from your watch yet. They come with Fitbit.')}</p>
        <a class="more" href="#/auswerten/quellen">{t('Connect your data')} <ChevronRight size={16} aria-hidden="true" /></a>
      {/if}
    </section>
  {/if}

  <!-- The four questions that lead to the pages below -->
  <section class="qs" aria-labelledby="h-qs" data-heute-questions>
    <h2 id="h-qs" class="h2">{t('Your four questions')}</h2>
    <ul class="grid">
      {#each QUESTIONS as qu (qu.key)}
        <li><a class="card q" href={qu.href} data-question={qu.key}><b>{t(qu.title)}</b><span>{t(qu.text)}</span><ChevronRight size={20} aria-hidden="true" /></a></li>
      {/each}
    </ul>
    <p class="old"><a href="#/auswerten/uebersicht" data-heute-old>{t('The old overview')} ›</a><a href="#/auswerten/sportjahr" data-sportjahr-link>{t('Sports year')} ›</a><a href="#/flow" data-aktiv-link>{t('Tick off today')} ›</a></p>
  </section>

  <TipLine page="aktiv" name={t('Analysis|place')} />
  <PageMore page="aktiv" name={t('Analysis|place')} />
  <PageTiles page="flow" />
</div>

<style>
  .heute {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 880px;
    margin: 0 auto;
    min-width: 0;
  }
  .ph .sub {
    margin: var(--sp-1) 0 0;
    color: var(--ink-3);
    font: 400 var(--fs-body) / 1.45 var(--font-body);
  }
  .ans,
  .nrm,
  .q {
    padding: var(--sp-4);
  }
  .lv {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-3);
    margin: 0;
    font: 600 var(--fs-h2, 1.35rem) / 1.2 var(--font-display, var(--font-body));
    color: var(--ink);
  }
  .sc {
    color: var(--ink-3);
    font: 500 var(--fs-body) / 1 var(--font-body);
  }
  .of {
    font-weight: 400;
  }
  .line {
    margin: var(--sp-2) 0 0;
    color: var(--ink);
    font: 500 var(--fs-body) / 1.45 var(--font-body);
  }
  .why,
  .notes {
    margin: var(--sp-2) 0 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .notes li {
    display: flex;
    gap: var(--sp-2);
    align-items: flex-start;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
    margin-top: var(--sp-3);
  }
  .acts .btn {
    min-height: 44px;
  }
  .more {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    gap: 2px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .obs,
  .sub2,
  .det {
    margin: var(--sp-1) 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .h2 {
    margin: 0;
    font: 600 var(--fs-h3, 1.1rem) / 1.25 var(--font-body);
    color: var(--ink);
  }
  .vals {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    margin: var(--sp-3) 0 var(--sp-1);
    padding: 0;
    list-style: none;
  }
  .top {
    display: flex;
    align-items: baseline;
    gap: var(--sp-2);
    margin-bottom: var(--sp-1);
  }
  .top .v {
    margin-left: auto;
    font: 600 var(--fs-body) / 1 var(--font-body);
  }
  .when {
    color: var(--ink-3);
  }
  .det b {
    color: var(--ink-2);
    font-weight: 600;
  }
  .det b,
  .det span {
    display: block;
  }
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-2);
    margin: var(--sp-2) 0 0;
    padding: 0;
    list-style: none;
  }
  @media (min-width: 640px) {
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .q {
    position: relative;
    display: grid;
    gap: 2px;
    min-height: 64px;
    padding-right: 40px;
    color: var(--ink);
    text-decoration: none;
  }
  .q span {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .q :global(svg) {
    position: absolute;
    right: var(--sp-3);
    top: 50%;
    transform: translateY(-50%);
    color: var(--ink-3);
  }
  .q:hover {
    background: var(--paper-2);
  }
  .old {
    display: flex;
    flex-wrap: wrap;
    gap: 0 var(--sp-4);
    margin: var(--sp-2) 0 0;
    font-size: var(--fs-small);
  }
  .old a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
  }
</style>
