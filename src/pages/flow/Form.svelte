<script>
  /**
   * «Form und Erholung» (Noah 20.10.2026 «1a 2b 3a 4a 5a»), #/flow/form: the page behind the card on Aktiv.
   * - today: the readiness 0–100, what today suits and every part that counted (resting pulse, HRV, sleep,
   *   the morning check's felt sleep and energy, the form);
   * - 12 weeks: fitness (load of 42 days), fatigue (7 days), form (fitness − fatigue) and the resting pulse;
   * - Tour-Bereitschaft (4a): the next or the running tour with the resting pulse per tour day, and the
   *   last multi-day tours to compare;
   * - how the app counts (load: power, else Strava effort, else pulse, 1a).
   * Loaded only when opened (Flow.svelte). Only to look at, no diagnosis.
   */
  import { Info, ChevronDown, Mountain } from '@lucide/svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import Sec from '../../lib/flow/kit/Sec.svelte';
  import FormVerlauf from '../../lib/flow/form/FormVerlauf.svelte';
  import { formQuery } from '../../lib/form-data.js';
  import { RAMP_MAX, FIT_DAYS, FAT_DAYS, shownForm } from '../../lib/form.js';
  import { levelWord, levelLine, partText, tourText, PART_NAMES } from '../../lib/flow/form/words.js';
  import { localDay } from '../../lib/localday.js';
  import { t, num, locale } from '../../lib/i18n.svelte.js';
  import { strava, STRAVA_HASH } from '../../lib/strava/client.svelte.js';
  import { suggest, watchSuggest } from '../../lib/clear/suggest.svelte.js'; // Einzelidee 36: «Performance tips» can be off
  watchSuggest();

  const today = localDay();
  const q = formQuery(today);
  const f = $derived($q);
  const r = $derived(f?.ready);
  const s = $derived(f?.series ?? []);
  // UI-Test T3 (G3-01): today's numbers rounded so that form = fitness − Müdigkeit on screen (form.js shownForm)
  const shown = $derived(shownForm(s.at(-1)));
  const rows = $derived(r ? [...r.parts, ...(r.formPts != null ? [{ key: 'form', v: r.form, delta: r.form, points: r.formPts }] : [])] : []);

  const wd = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric', timeZone: 'UTC' });
  const last7 = $derived(Array.from({ length: 7 }, (_, i) => f?.table.get(s[s.length - 7 + i]?.day)?.rhr ?? null));
  const tourMax = (days) => Math.max(1, ...days.map((d) => d.rhr ?? 0));
  const tourMin = (days) => Math.min(...days.map((d) => d.rhr ?? 999)) - 4;
</script>

<div class="fp">
  <header class="hd">
    <Crumb path={[{ href: '#/flow', label: t('Active|place') }]} here={t('Form and recovery')} />
    <h1 class="ptitle" tabindex="-1" data-page-title>{t('Form and recovery')}</h1>
    <p class="sub">{t('How ready you are today, from your activities, Fitbit and the morning check. Only to look at, no diagnosis.')}</p>
  </header>

  {#if f}
    <section class="card now" data-form-now aria-label={t('Readiness')}>
      {#if r}
        <span class="sc num" data-form-score>{num(r.score)}<small>/100</small></span>
        <span class="tx">
          <b>{levelWord(r.level)}</b>
          <span>{levelLine(r.level)}</span>
        </span>
      {:else}
        <span class="tx"><b>{t('Readiness')}</b><span>{t('Comes with your first activities from Strava or with Fitbit: then the app shows each morning what today suits.')}</span></span>
      {/if}
    </section>

    {#if r}
      <Sec id="parts-h" title={t('What counts today')} sub={t('against your normal of the last 30 days · + helps, − holds back')}>
        <ul class="card parts" data-form-parts>
          {#each rows as p (p.key)}
            {@const pts = p.points}
            <li data-part={p.key}>
              <b>{t(PART_NAMES[p.key])}</b>
              <span>{partText(p)}</span>
              {#if pts != null}<small class="pt num" class:up={pts > 0} class:down={pts < 0}>{pts > 0 ? '+' : pts < 0 ? '−' : '±'}{num(Math.abs(Math.round(pts)))}</small>{/if}
            </li>
          {/each}
        </ul>
        {#if f.alarm && suggest.on.performance}<p class="note" data-form-alarm>{t('Resting pulse up and HRV down two days in a row: an easy day may help.')}</p>{/if}
        {#if f.rampHigh && suggest.on.performance}<p class="note" data-form-ramp>{t('Your fitness rose by {n} in 7 days. More than {m} a week often leads to overload.', { n: num(r.ramp), m: RAMP_MAX })}</p>{/if}
      </Sec>
    {/if}

    <Sec id="curve-h" title={t('Over time|form')} sub={t('fitness, fatigue and form · resting pulse')}>
      <div class="card chart" data-form-curve>
        {#if s.some((x) => x.load > 0)}
          <!-- UI-Test T3 (G3-01): the one calculation in words, the same on Training -->
          <p class="sum num" data-form-sum>{t('Form {form} = fitness {fit} − fatigue {fat}', { form: shown.form > 0 ? `+${num(shown.form)}` : num(shown.form), fit: num(shown.fit), fat: num(shown.fat) })}</p>
          <!-- «Diagramme zum Antippen» K1 (Noah 27.10.2026 «1-5 a»): axes, the exact day on pointing, the day on a tap -->
          <FormVerlauf {f} {today} />
        {:else}
          <p class="wait">{t('The curve comes with your first activities from Strava.')}</p>
          <!-- Klick-Rundgang A07: the empty text shows the way -->
          {#if !strava.key}<a class="btn sm" href={STRAVA_HASH} data-form-strava>{t('Connect Strava')}</a>{/if}
        {/if}
      </div>
    </Sec>

    <Sec id="tour-h" title={t('Tour readiness')} sub={t('before and during a tour of several days: the resting pulse per tour day')}>
      <div class="card tour" data-form-tours>
        {#if f.tour}
          <p class="tl" data-tour-now><Mountain size={18} aria-hidden="true" /><span>{tourText(f.tour)}</span></p>
          {@const mx = tourMax(f.tour.days)}
          {@const mn = tourMin(f.tour.days)}
          {#if f.tour.phase === 'before'}<p class="ph2" data-tour-before>{t('Resting pulse of the last 7 days: {list}', { list: last7.map((v) => v ?? '–').join(' · ') })}</p>{/if}
          <ul class="td">
            {#each f.tour.days as d, i (d.day)}
              <li class:fut={d.future}><span class="num">{d.rhr ?? '–'}</span><span class="col"><i style="height:{d.rhr ? Math.max(8, Math.round(((d.rhr - mn) / (mx - mn)) * 100)) : 0}%"></i></span><small>{t('Day {n}', { n: i + 1 })}</small></li>
            {/each}
          </ul>
        {/if}
        {#if f.past.length}
          <p class="ph2">{t('Your last tours: resting pulse per day')}</p>
          <ul class="past">
            {#each f.past as p (p.trip.id)}
              <li data-past-tour>
                <b>{p.trip.title || t('Tour')}</b><small>{wd(p.days[0].day)}</small>
                <span class="num">{p.days.map((d) => d.rhr ?? '–').join(' · ')}</span>
              </li>
            {/each}
          </ul>
        {/if}
        {#if !f.tour && !f.past.length}
          <p class="wait">{t('No tour in the next 7 days. When one comes, its days show here, with your resting pulse per tour day.')}</p>
        {/if}
        <p class="hint">{t('A resting pulse rising day after day on a tour often means: more sleep, more food, an easier stage.')}</p>
      </div>
    </Sec>

    <details class="card how">
      <summary><Info size={16} aria-hidden="true" /><span>{t('How the app counts')}</span><ChevronDown class="cv" size={16} aria-hidden="true" /></summary>
      <p>{t('Load: every activity counts, every sport. With a power meter from the power against your FTP, else from Strava’s relative effort, else from pulse and time.')}</p>
      <p>{t('Fitness is the mean load of about {a} days, fatigue of about {b} days. Form = fitness − fatigue: below 0 you are tired, above 0 fresh.', { a: FIT_DAYS, b: FAT_DAYS })}</p>
      <p>{t('Readiness starts at 60. Form, resting pulse, HRV and sleep against your normal, and how you felt in the morning check, add or take away points. 75 and more suits a hard ride, under 35 a rest day.')}</p>
      <p>{t('Fitness rising by more than {n} a week is a lot: a calm hint, no rule.', { n: RAMP_MAX })}</p>
    </details>
  {/if}
</div>

<style>
  .fp {
    display: grid;
    gap: var(--sp-5);
    max-width: 760px;
  }
  .hd {
    display: grid;
    gap: 4px;
  }
  .ptitle {
    margin: 0;
    font: 600 var(--fs-page) / var(--lh-title) var(--font-title);
  }
  .sub {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .now {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 18px;
  }
  .sc {
    font: 700 var(--fs-display) / 1 var(--font-body);
  }
  .sc small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .tx {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .parts {
    margin: 0;
    padding: 0 16px;
    list-style: none;
  }
  .parts li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 2px 12px;
    padding: 12px 0;
    border-top: 1px solid var(--line);
  }
  .parts li:first-child {
    border-top: 0;
  }
  .parts span {
    grid-column: 1;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .pt {
    grid-area: 1 / 2 / 3 / 3;
    align-self: center;
    font-weight: 700;
  }
  .pt.up {
    color: var(--ok);
  }
  .pt.down {
    color: var(--bad);
  }
  .note,
  .wait,
  .hint {
    margin: 8px 2px 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
  .chart,
  .tour {
    display: grid;
    gap: 8px;
    padding: 14px 16px;
  }
  .tl {
    display: flex;
    gap: 8px;
    margin: 0;
  }
  .tl :global(svg) {
    flex: none;
    color: var(--hi);
  }
  .td {
    display: flex;
    gap: 8px;
    margin: 0;
    padding: 0;
    overflow-x: auto;
    list-style: none;
  }
  .td li {
    display: grid;
    flex: 0 0 48px;
    justify-items: center;
    gap: 3px;
    font-size: var(--fs-tiny);
  }
  .td .col {
    display: flex;
    align-items: flex-end;
    width: 18px;
    height: 60px;
  }
  .td .col i {
    display: block;
    width: 100%;
    border-radius: 4px 4px 0 0;
    background: var(--bad);
  }
  .td li.fut {
    color: var(--ink-3);
  }
  .ph2 {
    margin: 6px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .past {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .past li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 2px 8px;
  }
  .past small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .past span {
    grid-column: 1 / -1;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .how {
    padding: 0 16px;
  }
  .how summary {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 48px;
    cursor: pointer;
    list-style: none;
  }
  .how summary::-webkit-details-marker {
    display: none;
  }
  .how[open] :global(.cv) {
    transform: rotate(180deg);
  }
  .how p {
    margin: 0 0 10px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .sum {
    margin: 4px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
