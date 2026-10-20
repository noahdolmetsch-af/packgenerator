<script>
  /**
   * «Wochenrückblick» (mockups W1–W6, Noah 15.10.2026 «1-5 a»): Aktiv › Heute › Woche › Wochenrückblick.
   *   #/flow/review           the week shown by default (weekreview.js defaultMonday: on a Monday the week
   *                           just finished, from Tuesday on the running week)
   *   #/flow/review?w=<day>   the week of that day; ‹ › step a week back and forth
   * Six cards: the week in five numbers (W1), the strip Monday to Sunday (W2), two or three calm sentences
   * (W3), the highlights (W4), one suggestion for next week (W5) and, only with the KI-Helfer switched on,
   * the week as text to copy for Claude (W6). A card without data shows nothing. Observation only.
   * The rules are pure and tested (lib/weekreview.js).
   */
  import { liveQuery } from 'dexie';
  import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Minus, Moon, Smile, Copy, Check, Mountain, Timer, Zap, Star } from '@lucide/svelte';
  import { db } from '../../lib/db.js';
  import PageHead from '../../lib/ui/PageHead.svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import KindIcon from '../../lib/strava/KindIcon.svelte';
  import { zones } from '../../lib/strava/zones.svelte.js';
  import { helper } from '../../lib/helper/client.svelte.js';
  import { normAct, tripDays } from '../../lib/flow.js';
  import { homeTrips } from '../../lib/home/heute.js';
  import { PLAN_KEY, planOf, mondayOf, shiftDay, isoWeek, hmm, typeKey } from '../../lib/training.js';
  import { SLEEP_Q, MOOD_Q, weekParam, weekHref, weekFive, weekStrip, weekNotes, weekHighs, weekAhead, diffText, hasAnything, summaryText } from '../../lib/weekreview.js';
  import { localDay } from '../../lib/localday.js';
  import GoalCheck from '../../lib/compass/GoalCheck.svelte'; // Paket N #1047: «Wie läuft's?» for your goals, this week only
  import { t, tn, num, locale } from '../../lib/i18n.svelte.js';

  let { params = new URLSearchParams() } = $props();
  const today = localDay();

  // everything once (a person's data is small); the week only picks from it
  const q = liveQuery(async () => {
    const [acts, flowActs, log, checks, answers, plan, trips] = await Promise.all([
      db.activities.toArray(),
      db.flowActs.toArray(),
      db.flowLog.toArray(),
      db.flowChecks.toArray(),
      db.abAnswers.where('qid').anyOf([SLEEP_Q, MOOD_Q]).toArray(),
      db.settings.get(PLAN_KEY),
      db.trips.toArray(),
    ]);
    return { acts, flowActs: flowActs.map(normAct), log, checks, answers, sessions: planOf(plan?.value), tripDays: tripDays(homeTrips(trips), today) };
  });
  const data = $derived($q);

  const monday = $derived(weekParam(params.get('w'), today));
  const sunday = $derived(shiftDay(monday, 6));
  const fmt = (d, o) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', ...o });
  const range = $derived(`${fmt(monday, { day: 'numeric', month: monday.slice(5, 7) === sunday.slice(5, 7) ? undefined : 'long' })}–${fmt(sunday, { day: 'numeric', month: 'long' })}`);
  const running = $derived(monday === mondayOf(today));
  const prevHref = $derived(weekHref(shiftDay(monday, -7), today));
  const nextHref = $derived(running ? null : weekHref(shiftDay(monday, 7), today));

  const any = $derived(data ? hasAnything(data, monday) : false);
  const five = $derived(data ? weekFive(data, monday, today) : []);
  const strip = $derived(data ? weekStrip(data, monday, today) : []);
  const notes = $derived(data ? weekNotes(data, monday, today, zones.bounds) : []);
  const highs = $derived(data ? weekHighs(data.acts, monday) : null);
  const ahead = $derived(data ? weekAhead(data.acts, data.sessions, monday) : null);
  const hasSleep = $derived(strip.some((d) => d.sleep != null));
  const hasMood = $derived(strip.some((d) => d.mood != null));

  /* W1 */
  const FIVE = { hours: 'Hours|five', km: 'km', hm: 'Hm', n: 'Sessions', goals: 'Goals reached' };
  const valueOf = (f) => (f.key === 'hours' ? hmm(f.value) : f.key === 'goals' ? t('{n} of {m}', { n: f.value, m: f.of }) : num(f.value));
  const unitOf = (f) => (f.key === 'hours' ? 'h' : f.key === 'km' ? 'km' : f.key === 'hm' ? 'm' : '');
  const changeOf = (f) => `${diffText(f.diff, { seconds: f.key === 'hours', fmt: num })}${unitOf(f) && f.diff ? ` ${unitOf(f)}` : ''}`;

  /* W2 */
  const KIND_WORD = { train: 'Training|strip', rest: 'Recovery|strip', mind: 'Meditation' };
  const dayLabel = (d) => `${fmt(d.day, { weekday: 'long', day: 'numeric', month: 'long' })}: ${d.kinds.length ? d.kinds.map((k) => t(KIND_WORD[k])).join(', ') : d.future ? t('still to come') : t('nothing|strip')}${d.sleep != null ? `, ${t('sleep {n}', { n: num(d.sleep) })}` : ''}${d.mood != null ? `, ${t('mood {n}', { n: num(d.mood) })}` : ''}`;

  /* W3 */
  function noteText(n) {
    const v = n.vars;
    if (n.key === 'plan-all') return tn(v.n, 'The planned session is done.', 'All {n} planned sessions are done.');
    if (n.key === 'plan-open') return t('{n} of {m} planned sessions done; {day} stayed open.', { n: v.n, m: v.m, day: fmt(v.day, { weekday: 'long' }) });
    if (n.key === 'sleep-low') return t('Sleep was a little below your own mean ({a} against {b}).', { a: num(v.a), b: num(v.b) });
    if (n.key === 'sleep-high') return t('Sleep was a little above your own mean ({a} against {b}).', { a: num(v.a), b: num(v.b) });
    if (n.key === 'streak') return t('{n} days in a row with training, without a day off.', { n: v.n });
    if (n.key === 'hours-more') return t('{a} h moving, more than your usual {b} h.', { a: hmm(v.a), b: hmm(v.b) });
    if (n.key === 'hours-less') return t('{a} h moving, less than your usual {b} h.', { a: hmm(v.a), b: hmm(v.b) });
    if (n.key === 'hours-none') return t('No activity from Strava this week; usually about {b} h.', { b: hmm(v.b) });
    if (n.key === 'base-more') return t('{n} % in Z1–Z2, more than your mean of {m} %.', v);
    if (n.key === 'base-less') return t('{n} % in Z1–Z2, less than your mean of {m} %.', v);
    return '';
  }

  /* W4 */
  const actName = (a) => a.name || t(typeKey(a.type));
  const BEST = { km: 'Longest distance', hm: 'Most climbing', time: 'Longest time', w20: 'Best 20 minutes' };
  const bestValue = (b) => (b.key === 'km' ? `${num(b.value)} km` : b.key === 'hm' ? `${num(b.value)} m` : b.key === 'time' ? `${hmm(b.value)} h` : `${num(b.value)} W`);
  const bestWas = (b) => (b.key === 'km' ? `${num(b.was)} km` : b.key === 'hm' ? `${num(b.was)} m` : b.key === 'time' ? `${hmm(b.was)} h` : `${num(b.was)} W`);

  /* W5 */
  const aheadText = $derived(
    !ahead ? '' : ahead.key === 'calmer' ? t('The load rose three weeks in a row. Next week could be a calmer one.') : ahead.key === 'back' ? t('A quieter week lies behind you. Next week can bring your usual rhythm again, about {h} h.', { h: hmm(ahead.usualSecs) }) : t('Keep your rhythm: about {h} h, like this week.', { h: hmm(ahead.secs) }),
  );

  /* W6: only with the KI-Helfer switched on; shown first, copied only on a tap, never sent by itself */
  const text = $derived(data && helper.show ? summaryText({ monday, five, strip, notes, highs, ahead }, { t, num, day: (d) => fmt(d, { day: 'numeric', month: 'long' }), noteText }) : '');
  let copied = $state(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => (copied = false), 2500);
    } catch {
      copied = false;
    }
  }
</script>

<div class="wrv">
  <header class="ph">
    <Crumb path={[{ href: '#/flow', label: t('Analysis|place') }, { href: '#/flow/week', label: t('Week') }]} here={t('Week in review')} />
    <PageHead title={t('Week in review')} text={t('Observation only: what was, nothing is rated.')} />
    <nav class="wnav" aria-label={t('Choose the week')}>
      <a class="wstep" href={prevHref} aria-label={t('Week before')} data-week-prev><ChevronLeft size={18} aria-hidden="true" /></a>
      <span class="wlabel num" data-week={monday}>{t('Wk {n}', { n: isoWeek(monday) })} · {range}{#if running}{' · '}{t('until today')}{/if}</span>
      {#if nextHref}<a class="wstep" href={nextHref} aria-label={t('Week after')} data-week-next><ChevronRight size={18} aria-hidden="true" /></a>{:else}<span class="wstep off" aria-hidden="true"><ChevronRight size={18} /></span>{/if}
    </nav>
  </header>

  {#if !nextHref}<GoalCheck link />{/if}

  {#if data}
    {#if !any}
      <p class="card quiet" data-wr-empty>{t('Nothing recorded in this week yet. Activities from Strava, ticks in Aktiv and answers to «How are you?» show here.')}</p>
    {/if}

    <!-- Paket M «3 Beobachtungen pro Woche» (#294, #14, #247): from Sunday on, then frozen (lernen/beobachtungen.js) -->
    {#await import('../../lib/lernen/Beobachtungen.svelte') then m}<m.default {monday} {today} />{/await}

    <section class="card wcard" data-wr="five" aria-labelledby="wr-five">
      <h2 id="wr-five">{t('Your week in 5 numbers')}</h2>
      <ul class="five">
        {#each five as f (f.key)}
          {@const Arrow = f.diff > 0 ? ArrowUp : f.diff < 0 ? ArrowDown : Minus}
          <li data-five={f.key}>
            <span class="fl">{t(FIVE[f.key])}</span>
            <b class="fv num">{valueOf(f)}{#if unitOf(f)}{' '}<small>{unitOf(f)}</small>{/if}</b>
            <span class="fd num"><Arrow size={14} aria-hidden="true" />{changeOf(f)}</span>
          </li>
        {/each}
      </ul>
      <p class="cap">{t('Change against the week before. Hours, km and Hm from Strava.')}</p>
    </section>

    <section class="card wcard" data-wr="strip" aria-labelledby="wr-strip">
      <h2 id="wr-strip">{t('Week strip')}</h2>
      <ol class="strip">
        {#each strip as d (d.day)}
          <li class:fut={d.future} class:now={d.day === today} data-strip-day={d.day} aria-label={dayLabel(d)}>
            <span class="sd">{fmt(d.day, { weekday: 'short' }).replace('.', '')}</span>
            <span class="cell" aria-hidden="true">{#each d.kinds as k (k)}<i class="k-{k}"></i>{/each}</span>
            {#if hasSleep}<span class="sv num" aria-hidden="true">{d.sleep != null ? num(d.sleep) : '·'}</span>{/if}
            {#if hasMood}<span class="sv num" aria-hidden="true">{d.mood != null ? num(d.mood) : '·'}</span>{/if}
          </li>
        {/each}
      </ol>
      <p class="legend">
        <span><i class="dot k-train"></i>{t('Training|strip')}</span>
        <span><i class="dot k-rest"></i>{t('Recovery|strip')}</span>
        <span><i class="dot k-mind"></i>{t('Meditation')}</span>
        <span><i class="dot k-none"></i>{t('nothing|strip')}</span>
        {#if hasSleep}<span><Moon size={14} aria-hidden="true" />{t('first line: sleep 1–10')}</span>{/if}
        {#if hasMood}<span><Smile size={14} aria-hidden="true" />{hasSleep ? t('second line: mood 1–10') : t('line: mood 1–10')}</span>{/if}
      </p>
    </section>

    <div class="two">
      {#if notes.length}
        <section class="card wcard" data-wr="notes" aria-labelledby="wr-notes">
          <h2 id="wr-notes">{t('Went well · missing')}</h2>
          <ul class="notes">
            {#each notes as n (n.key)}<li data-note={n.key}>{noteText(n)}</li>{/each}
          </ul>
        </section>
      {/if}

      {#if highs}
        <section class="card wcard" data-wr="highs" aria-labelledby="wr-highs">
          <h2 id="wr-highs">{t('Highlights')}</h2>
          <ul class="highs">
            {#if highs.longest}
              <li data-high="longest"><KindIcon kind={highs.longest.kind} size={18} /><span class="hl">{t('Longest activity')}<a href="#/flow/training/a/{encodeURIComponent(highs.longest.id)}">{actName(highs.longest)}</a></span><b class="num">{hmm(highs.longest.movingS)} h{#if highs.longest.km}{' · '}{num(highs.longest.km)} km{/if}</b></li>
            {/if}
            {#if highs.w20}
              <li data-high="w20"><Zap size={18} aria-hidden="true" /><span class="hl">{t('Best 20 minutes')}<a href="#/flow/training/a/{encodeURIComponent(highs.w20.id)}">{actName(highs.w20)}</a></span><b class="num">{num(highs.w20.w20)} W</b></li>
            {/if}
            {#if highs.hm}
              <li data-high="hm"><Mountain size={18} aria-hidden="true" /><span class="hl">{t('Most climbing')}<a href="#/flow/training/a/{encodeURIComponent(highs.hm.id)}">{actName(highs.hm)}</a></span><b class="num">{num(highs.hm.hm)} m</b></li>
            {/if}
            {#each highs.bests as b (b.key)}
              <li data-high="best-{b.key}"><Star size={18} aria-hidden="true" /><span class="hl">{t('New best: {what}', { what: t(BEST[b.key]) })}<small>{t('before: {v}', { v: bestWas(b) })}</small></span><b class="num">{bestValue(b)}</b></li>
            {/each}
          </ul>
        </section>
      {/if}

      {#if ahead}
        <section class="card wcard" data-wr="ahead" aria-labelledby="wr-ahead">
          <h2 id="wr-ahead">{t('Looking ahead')}</h2>
          <p class="say">{aheadText}</p>
          <p class="cap"><Timer size={14} aria-hidden="true" />{ahead.plan.n ? tn(ahead.plan.n, 'Week {kw}: {n} session planned already ({h} h).', 'Week {kw}: {n} sessions planned already ({h} h).', { kw: ahead.kw, h: hmm(ahead.plan.mins * 60) }) : t('Week {kw}: nothing planned yet.', { kw: ahead.kw })}</p>
          <a class="more" href="#/flow/training" data-to-plan>{t('To the training plan')}<ChevronRight size={16} aria-hidden="true" /></a>
          <p class="cap">{t('Only a suggestion: you decide.')}</p>
        </section>
      {/if}

      {#if helper.show && any}
        <section class="card wcard" data-wr="ask" aria-labelledby="wr-ask">
          <h2 id="wr-ask">{t('How was my week?')}</h2>
          <p class="cap">{t('This text is what you would give to Claude. Nothing is sent: copy it and paste it yourself.')}</p>
          <textarea class="out" readonly rows="9" aria-label={t('The text for Claude')} data-ask-text value={text}></textarea>
          <button type="button" class="btn cpy" onclick={copy} data-ask-copy>{#if copied}<Check size={16} aria-hidden="true" />{t('Copied')}{:else}<Copy size={16} aria-hidden="true" />{t('Copy for Claude')}{/if}</button>
        </section>
      {/if}
    </div>
  {/if}
</div>

<style>
  /* the look of the other Aktiv pages (Week.svelte): calm cards, tokens only */
  .wrv {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 1240px;
    margin: 0 auto;
    min-width: 0;
  }
  .wrv :global(.pagehead) {
    margin: 0;
  }
  .ph {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
  }
  .wnav {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-width: 0;
  }
  .wstep {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 44px;
    height: 44px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
  }
  .wstep.off {
    color: var(--line);
  }
  .wlabel {
    min-width: 0;
    color: var(--ink-2);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
  }
  .quiet {
    margin: 0;
    padding: var(--sp-3) var(--sp-4);
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .wcard {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    min-width: 0;
    margin: 0;
    padding: var(--sp-4);
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .cap {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .cap :global(svg) {
    flex: none;
  }
  .five {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  @media (min-width: 700px) {
    .five {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
  }
  .five li {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    padding: var(--sp-3);
    border-radius: var(--radius);
    background: var(--paper-2);
  }
  .fl {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .fv {
    font: 600 var(--fs-section) / 1.2 var(--font-body);
  }
  .fv small {
    font: 500 var(--fs-small) / 1 var(--font-body);
    color: var(--ink-2);
  }
  .fd {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .strip {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .strip li {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }
  .sd {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .strip li.now .sd {
    color: var(--hi);
    font-weight: 600;
  }
  .cell {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 48px;
    overflow: hidden;
    border-radius: var(--radius);
    background: var(--paper-2);
  }
  .fut .cell {
    border: 1.5px dashed var(--line);
    background: none;
  }
  .cell i {
    flex: 1;
  }
  .sv {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .k-train {
    background: var(--hi);
  }
  .k-rest {
    background: var(--l3);
  }
  .k-mind {
    background: var(--l4);
  }
  .k-none {
    background: var(--paper-2);
    border: 1px solid var(--line);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2) var(--sp-4);
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .dot {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }
  .two {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-4);
    align-items: start;
  }
  @media (min-width: 1000px) {
    .two {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .notes,
  .highs {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .notes li {
    padding: 10px 0 10px 14px;
    border-top: 1px solid var(--line);
    position: relative;
    overflow-wrap: break-word;
  }
  .notes li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 19px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--ink-3);
  }
  .notes li:first-child,
  .highs li:first-child {
    border-top: 0;
  }
  .highs li {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: var(--sp-3);
    align-items: center;
    padding: 10px 0;
    border-top: 1px solid var(--line);
    color: var(--ink-2);
  }
  .hl {
    display: flex;
    flex-direction: column;
    min-width: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hl a,
  .hl small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hl a {
    color: var(--ink);
    font-size: var(--fs-body);
  }
  .highs b {
    color: var(--ink);
    font-weight: 600;
  }
  .say {
    margin: 0;
  }
  .more {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: 2px;
    min-height: 44px;
    color: var(--ink);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
  }
  .out {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: var(--sp-3);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--paper-2);
    color: var(--ink-2);
    font: 400 var(--fs-small) / 1.45 var(--font-body);
    resize: vertical;
  }
  .cpy {
    align-self: flex-start;
  }
</style>
