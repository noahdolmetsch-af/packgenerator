<script>
  /**
   * «Nach harten Tagen» (Noah 27.11.2026, Fragen 13, 14 und 17): the card under «Was Bewegung mit dir macht» on Auswerten › Woche. Your resting pulse and
   * your sleep the day after a hard day (your own upper quarter, the rule of the rest-day hint), after an easier day and after a day without movement, and
   * how far apart your hard days usually lie. Rules: flow/hakentage.js. Only looking: a pattern, never a cause; with too few days it says so.
   * table: the day table of the app (loadTable); units: the shared units (training); today: the local day.
   */
  import { afterHard, hardGap, afterFeel } from './hakentage.js';
  import { formOf } from '../form-data.js';
  import { hoursMin } from '../charts/exact.js';
  import { t, tn, num } from '../i18n.svelte.js';

  let { table = new Map(), units = [], log = [], today } = $props();

  const loads = $derived(new Map(formOf({ table, today, days: 180 }).series.filter((s) => s.load > 0).map((s) => [s.day, s.load])));
  const moved = $derived(new Set(units.map((u) => u.day)));
  const res = $derived(afterHard({ table, loads, moved, today }));
  const gap = $derived(hardGap(loads, today));
  const feel = $derived(afterFeel({ log, table, today }));
  const hrvText = (v) => (v == null ? '–' : `${dec(v)} ms`);
  const missingText = $derived(
    feel
      ? [feel.missing.hard ? tn(feel.missing.hard, '{n} day with «hard»', '{n} days with «hard»') : '', feel.missing.easy ? tn(feel.missing.easy, '{n} day with «light» or «good»', '{n} days with «light» or «good»') : ''].filter(Boolean).join(', ')
      : '',
  );

  const dec = (v) => num(Math.round(v * 10) / 10);
  const rhrText = (v) => (v == null ? '–' : `${dec(v)} bpm`);
  const sleepText = (v) => (v == null ? '–' : hoursMin(v));
  const ROWS = [
    { key: 'hard', label: 'After a hard day' },
    { key: 'easy', label: 'After an easier day' },
    { key: 'rest', label: 'After a day without movement' },
  ];
  const RHR = {
    higher: 'The day after a hard day your resting pulse was {x} beats per minute higher than after a day without movement.',
    lower: 'The day after a hard day your resting pulse was {x} beats per minute lower than after a day without movement.',
    none: 'Your resting pulse the day after a hard day was about the same as after a day without movement.',
  };
  const SLEEP = {
    higher: 'The night after a hard day you slept {x} longer than after a day without movement.',
    lower: 'The night after a hard day you slept {x} shorter than after a day without movement.',
    none: 'Your sleep the night after a hard day was about the same as after a day without movement.',
  };
  const sentences = $derived.by(() => {
    if (!res) return [];
    const out = [];
    if (res.verdict.rhr) out.push(t(RHR[res.verdict.rhr], { x: dec(Math.abs(res.hard.rhr - res.rest.rhr)) }));
    if (res.verdict.sleep) out.push(t(SLEEP[res.verdict.sleep], { x: hoursMin(Math.abs(res.hard.sleep - res.rest.sleep)) }));
    return out;
  });
</script>

<section class="card he" aria-labelledby="he-h" data-nach-hart>
  <h2 id="he-h" class="h2">{t('After hard days')}</h2>
  <p class="det">{t('Your resting pulse and your sleep after a hard day (your own upper quarter), an easier day and a day without movement. A pattern, not a cause.')}</p>
  {#if res}
    <table class="tb">
      <thead>
        <tr><th scope="col"><span class="sr">{t('Day|tw')}</span></th><th scope="col">{t('Resting pulse the day after')}</th><th scope="col">{t('Sleep the night after')}</th></tr>
      </thead>
      <tbody>
        {#each ROWS as r (r.key)}
          <tr data-he-row={r.key}>
            <th scope="row">{t(r.label)}</th>
            <td class="num">{rhrText(res[r.key].rhr)}<small>{tn(res[r.key].n.rhr, '{n} day', '{n} days')}</small></td>
            <td class="num">{sleepText(res[r.key].sleep)}<small>{tn(res[r.key].n.sleep, '{n} day', '{n} days')}</small></td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#each sentences as s, i (i)}<p class="sent" data-he-sentence>{s}</p>{/each}
  {:else}
    <p class="det" data-he-none>{t('Not enough days yet. This needs about six days of each kind with a resting pulse or sleep value from your Fitbit.')}</p>
  {/if}
  {#if feel && feel.enough}
    <h3 class="h3" data-he-feel-h>{t('How hard it felt')}</h3>
    <table class="tb" data-he-feel>
      <thead>
        <tr><th scope="col"><span class="sr">{t('Day|tw')}</span></th><th scope="col">{t('Resting pulse the day after')}</th><th scope="col">{t('HRV the day after')}</th><th scope="col">{t('Sleep the night after')}</th></tr>
      </thead>
      <tbody>
        <tr data-he-feel-row="hard"><th scope="row">{t('Days you felt «hard»')}<small>{tn(feel.hard.n, '{n} day', '{n} days')}</small></th><td class="num">{rhrText(feel.hard.rhr)}</td><td class="num">{hrvText(feel.hard.hrv)}</td><td class="num">{sleepText(feel.hard.sleep)}</td></tr>
        <tr data-he-feel-row="easy"><th scope="row">{t('Days you felt «light» or «good»')}<small>{tn(feel.easy.n, '{n} day', '{n} days')}</small></th><td class="num">{rhrText(feel.easy.rhr)}</td><td class="num">{hrvText(feel.easy.hrv)}</td><td class="num">{sleepText(feel.easy.sleep)}</td></tr>
      </tbody>
    </table>
  {:else if feel}
    <p class="sent" data-he-feel-wait>{t('Your feeling after training is noted for {a} days. For a comparison with the day after, six days of each kind are needed. Still missing: {list}.', { a: feel.answered, list: missingText })}</p>
  {:else}
    <p class="det" data-he-feel-none>{t('Tap «light», «good» or «hard» after a session on the page «Done». With six days of each kind, this compares your feeling with the day after.')}</p>
  {/if}
  {#if gap}
    <p class="sent" data-he-gap>{t('Between two hard days there are usually {u}; the last one was {s} ago ({n} hard days in the last 120 days).', { u: tn(gap.usual, '{n} day', '{n} days'), s: tn(gap.since, '{n} day', '{n} days'), n: gap.n })}</p>
  {/if}
</section>

<style>
  .he {
    padding: var(--sp-4);
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    min-width: 0;
  }
  .h2 {
    margin: 0;
    font: 600 var(--fs-h3, 1.1rem) / 1.25 var(--font-body);
    color: var(--ink);
  }
  .det {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .tb {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    margin-top: var(--sp-1);
  }
  .tb th,
  .tb td {
    padding: var(--sp-2) 4px;
    border-top: 1px solid var(--line);
    text-align: left;
    vertical-align: top;
    font-weight: 400;
    overflow-wrap: break-word;
  }
  .tb thead th {
    border-top: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .tb tbody th {
    font-weight: 600;
    color: var(--ink);
  }
  .tb td small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .h3 {
    margin: var(--sp-2) 0 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
    color: var(--ink);
  }
  .tb tbody th small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .sent {
    margin: 0;
    color: var(--ink);
    line-height: 1.4;
  }
</style>
