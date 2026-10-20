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
  import { formQuery } from '../../lib/form-data.js';
  import { RAMP_MAX, FIT_DAYS, FAT_DAYS } from '../../lib/form.js';
  import { levelWord, levelLine, partText, tourText, PART_NAMES } from '../../lib/flow/form/words.js';
  import { dm } from '../../lib/flow/garmin/words.js';
  import { localDay } from '../../lib/localday.js';
  import { t, num, locale } from '../../lib/i18n.svelte.js';

  const today = localDay();
  const q = formQuery(today);
  const f = $derived($q);
  const r = $derived(f?.ready);
  const s = $derived(f?.series ?? []);
  const rows = $derived(r ? [...r.parts, ...(r.formPts != null ? [{ key: 'form', v: r.form, delta: r.form, points: r.formPts }] : [])] : []);

  // the chart: 84 days, fitness and fatigue as lines, form as bars around 0
  const W = 336;
  const H = 150;
  const top = $derived(Math.max(10, ...s.map((x) => Math.max(x.fit, x.fat))));
  const fmin = $derived(Math.min(-10, ...s.map((x) => x.form)));
  const fmax = $derived(Math.max(10, ...s.map((x) => x.form)));
  const X = (i) => (s.length > 1 ? (i / (s.length - 1)) * W : 0);
  const Y = (v) => 8 + (1 - v / top) * (H - 16);
  const path = (k) => s.map((x, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(x[k]).toFixed(1)}`).join('');
  const FH = 70;
  const zeroY = $derived(4 + (fmax / (fmax - fmin)) * (FH - 8));
  const fy = (v) => 4 + ((fmax - v) / (fmax - fmin)) * (FH - 8);
  const rhr = $derived(s.map((x) => f?.table.get(x.day)?.rhr ?? null));
  const rv = $derived(rhr.filter((v) => v != null));
  const rlo = $derived(rv.length ? Math.min(...rv) - 2 : 0);
  const rhi = $derived(rv.length ? Math.max(...rv) + 2 : 1);
  const rpath = $derived.by(() => {
    let out = '';
    rhr.forEach((v, i) => {
      if (v == null) return;
      out += `${out ? 'L' : 'M'}${X(i).toFixed(1)} ${(4 + (1 - (v - rlo) / (rhi - rlo)) * 52).toFixed(1)}`;
    });
    return out;
  });
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
        {#if f.alarm}<p class="note" data-form-alarm>{t('Resting pulse up and HRV down two days in a row: an easy day may help.')}</p>{/if}
        {#if f.rampHigh}<p class="note" data-form-ramp>{t('Your fitness rose by {n} in 7 days. More than {m} a week often leads to overload.', { n: num(r.ramp), m: RAMP_MAX })}</p>{/if}
      </Sec>
    {/if}

    <Sec id="curve-h" title={t('12 weeks')} sub={t('fitness, fatigue and form · resting pulse')}>
      <div class="card chart" data-form-curve>
        {#if s.some((x) => x.load > 0)}
          <ul class="lg">
            <li><i class="c-fit"></i>{t('Fitness|form')} <b class="num">{num(Math.round(r?.fit ?? 0))}</b></li>
            <li><i class="c-fat"></i>{t('Fatigue|form')} <b class="num">{num(Math.round(r?.fat ?? 0))}</b></li>
            <li><i class="c-form"></i>{t('Form|form')} <b class="num">{num(Math.round(r?.form ?? 0))}</b></li>
          </ul>
          <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" class="lines" role="img" aria-label={t('Fitness and fatigue over 12 weeks')}>
            <path d={path('fit')} class="fit" />
            <path d={path('fat')} class="fat" />
          </svg>
          <svg viewBox="0 0 {W} {FH}" preserveAspectRatio="none" class="bars" role="img" aria-label={t('Form over 12 weeks')}>
            <line x1="0" x2={W} y1={zeroY} y2={zeroY} class="zero" />
            {#each s as x, i (x.day)}
              <rect x={X(i) - 1.4} width="2.8" y={Math.min(zeroY, fy(x.form))} height={Math.max(0.5, Math.abs(fy(x.form) - zeroY))} class:neg={x.form < 0} />
            {/each}
          </svg>
          <div class="ax"><span>{dm(s[0].day)}</span><span>{t('today')}</span></div>
        {:else}
          <p class="wait">{t('The curve comes with your first activities from Strava.')}</p>
        {/if}
        {#if rpath}
          <p class="rl"><b>{t('Resting pulse')}</b> <span class="num">{num(rlo + 2)}–{num(rhi - 2)} bpm</span></p>
          <svg viewBox="0 0 {W} 60" preserveAspectRatio="none" class="rhr" role="img" aria-label={t('Resting pulse over 12 weeks')}><path d={rpath} /></svg>
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
  .lg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 0;
    padding: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    list-style: none;
  }
  .lg li {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .lg i {
    width: 14px;
    height: 4px;
    border-radius: 2px;
  }
  .lg b {
    color: var(--ink);
  }
  .c-fit {
    background: var(--hi);
  }
  .c-fat {
    background: var(--warn);
  }
  .c-form {
    background: linear-gradient(90deg, var(--ok) 50%, var(--bad) 50%);
  }
  .lines,
  .bars,
  .rhr {
    width: 100%;
  }
  .lines {
    height: 150px;
  }
  .bars {
    height: 70px;
  }
  .rhr {
    height: 60px;
  }
  .lines path,
  .rhr path {
    fill: none;
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
  }
  .lines .fit {
    stroke: var(--hi);
  }
  .lines .fat {
    stroke: var(--warn);
  }
  .rhr path {
    stroke: var(--bad);
  }
  .bars rect {
    fill: var(--ok);
  }
  .bars rect.neg {
    fill: var(--bad);
  }
  .zero {
    stroke: var(--line-strong);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }
  .ax {
    display: flex;
    justify-content: space-between;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .rl {
    margin: 8px 0 0;
    font-size: var(--fs-small);
  }
  .rl span {
    color: var(--ink-2);
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
</style>
