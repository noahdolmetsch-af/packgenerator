<script>
  /**
   * «Rhythmus und Vergleich» (Noah 22.11.2026 «1a 2a 3a 4a 5a», Schritt C und H): under the five numbers of the week review. The seven days as
   * dots (a dot for each day with a session or a ride; today and the days to come grey), one sentence («an 4 von 7 Tagen in Bewegung»),
   * and the week next to your usual week (the mean of the four weeks before) and the same week a year ago. Observation only: nothing is
   * rated, no arrows of good or bad. The rules are pure and tested (lib/weekrhythm.js), the numbers come from weekcalc.js.
   */
  import { shiftDay, hmm } from '../training.js';
  import { dayDots, usualWeek, lastYearWeek, PAUSE_KEY, pausesOf, withPause } from '../weekrhythm.js';
  import { db } from '../db.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';

  let { data, calc, monday, today } = $props();
  const upto = $derived(shiftDay(monday, 6) < today ? shiftDay(monday, 6) : today);
  const dots = $derived(dayDots(calc, monday, today));
  const paused = $derived(pausesOf(data?.pauses).includes(monday));
  // Schritt I: a week marked as a break stays out of «your usual week»; the mark can be taken back (Undo)
  async function setPause(on) {
    const before = (await db.settings.get(PAUSE_KEY))?.value ?? [];
    await db.settings.put({ key: PAUSE_KEY, value: withPause(before, monday, on) });
    offerDone(on ? t('Week marked as a break.') : t('Break mark taken away.'), () => db.settings.put({ key: PAUSE_KEY, value: pausesOf(before) }));
  }
  const usual = $derived(data ? usualWeek(data, monday, upto) : null);
  const year = $derived(data ? lastYearWeek(data, monday, upto) : null);
  const wd = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short' }).replace('.', '');
  const lastYear = $derived(year ? new Date(`${year.monday}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }) : '');
  const rows = $derived([
    { key: 'hours', label: t('Hours|five'), now: `${hmm(calc.secs)} h`, usual: usual && `${hmm(usual.secs)} h`, year: year && `${hmm(year.secs)} h` },
    { key: 'km', label: t('km'), now: num(calc.km), usual: usual && num(usual.km), year: year && num(year.km) },
    { key: 'hm', label: t('Hm'), now: num(calc.hm), usual: usual && num(usual.hm), year: year && num(year.hm) },
    { key: 'n', label: t('Sessions'), now: num(calc.n), usual: usual && num(usual.n), year: year && num(year.n) },
    { key: 'days', label: t('Days'), now: num(dots.active), usual: usual && num(usual.days), year: year && num(year.days) },
  ]);
</script>

<section class="card rh" data-wr="rhythm" aria-labelledby="wr-rhythm">
  <h2 id="wr-rhythm">{t('Rhythm and comparison')}</h2>
  <ol class="dots" aria-label={t('Days with a session or a ride')}>
    {#each dots.dots as d (d.day)}
      <li class:on={d.active} class:fut={d.future} class:now={d.today} data-rhythm-day={d.day} data-on={d.active ? '1' : '0'}>
        <i aria-hidden="true"></i><span>{wd(d.day)}</span>
      </li>
    {/each}
  </ol>
  <p class="say" data-rhythm-say>{tn(dots.of, 'Active on {n} of {m} day.', 'Active on {n} of {m} days.', { n: dots.active, m: dots.of })}</p>

  <p class="cap pz" data-rhythm-pause-line>
    {#if paused}{t('This week is marked as a break: it does not count in your usual week.')}{:else}{t('A holiday, an illness or a quiet week? Mark it as a break so it does not pull your usual week down.')}{/if}
    <button type="button" class="pb" onclick={() => setPause(!paused)} data-rhythm-pause>{paused ? t('Take the break mark away') : t('Mark as a break')}</button>
  </p>

  {#if usual || year}
    <table class="cmp" data-rhythm-table>
      <thead>
        <tr>
          <th scope="col"><span class="vh">{t('Number')}</span></th>
          <th scope="col">{t('This week')}</th>
          {#if usual}<th scope="col" data-rhythm-usual-h>{t('Your usual week')}</th>{/if}
          {#if year}<th scope="col" data-rhythm-year-h>{t('A year ago')}</th>{/if}
        </tr>
      </thead>
      <tbody>
        {#each rows as r (r.key)}
          <tr data-rhythm-row={r.key}>
            <th scope="row">{r.label}</th>
            <td class="num">{r.now}</td>
            {#if usual}<td class="num">{r.usual}</td>{/if}
            {#if year}<td class="num">{r.year}</td>{/if}
          </tr>
        {/each}
      </tbody>
    </table>
    <p class="cap">
      {#if usual}{tn(usual.weeks, 'Your usual week: the mean of the {n} week before that had something.', 'Your usual week: the mean of the {n} weeks before that had something.')}{' '}{/if}{#if year}{t('A year ago: the week of {date}.', { date: lastYear })}{/if}
      {t('Only a comparison, nothing is rated.')}
    </p>
  {:else}
    <p class="cap" data-rhythm-none>{t('Not enough weeks before for a usual week yet. It appears after two weeks with something.')}</p>
  {/if}
</section>

<style>
  .rh {
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
  .dots {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .dots li {
    display: grid;
    justify-items: center;
    gap: 4px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .dots i {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid var(--line);
    background: transparent;
  }
  .dots li.on i {
    background: var(--ok);
    border-color: var(--ok);
  }
  .dots li.fut i {
    border-style: dashed;
    opacity: 0.55;
  }
  .dots li.now span {
    font-weight: 700;
    color: var(--ink);
  }
  .say {
    margin: 0;
    font-size: var(--fs-body);
  }
  .cmp {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-body);
  }
  .cmp th,
  .cmp td {
    padding: 6px 4px;
    text-align: right;
    border-bottom: 1px solid var(--line);
  }
  .cmp thead th {
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-3);
  }
  .cmp tbody th {
    text-align: left;
    font-weight: 500;
  }
  .pz {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2);
  }
  .pb {
    min-height: 36px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .vh {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  .cap {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
</style>
