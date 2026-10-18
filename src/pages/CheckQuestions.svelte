<script>
  /**
   * v0.127.0 «Tages-Check» 2 (mockup T4, Noah 13.10.2026 «T1–T4 freigegeben»): «Deine 15 Fragen»
   * (#/check/questions), reached from the tile on Heute and from the morning and evening pages.
   * One table of the 15 questions in three groups (morning, evening, Sunday) with how often they come,
   * the kind of answer, the category of the ring and a switch each. A question switched off is no
   * longer asked (settings record 'checkQuestionsOff', in every backup). At the side: what comes by
   * itself and the rule. On a phone the columns «Wie oft» and «Antwort» stay away.
   */
  import { Flower2, Bike, Activity, Heart, Lightbulb } from '@lucide/svelte';
  import Crumb from '../lib/flow/kit/Crumb.svelte';
  import { db } from '../lib/db.js';
  import { offQuery } from '../lib/flow/data.svelte.js';
  import { QUESTIONS, OFF_KEY, isOn, switchQuestion } from '../lib/flowcheck.js';
  import { CAT } from '../lib/balance.js';
  import { phone } from '../lib/media.svelte.js';
  import { t } from '../lib/i18n.svelte.js';

  const offQ = offQuery();
  const off = $derived($offQ ?? []);
  const on = (n) => isOn(off, n);
  const flip = (n) => db.settings.put({ key: OFF_KEY, value: switchQuestion(off, n, !on(n)) });
  // taps per part: the rotating 4/5 and the alternating 12/13 are one tap each
  const taps = $derived({
    morning: [1, 2, 3, 6, 7].filter(on).length + (on(4) || on(5) ? 1 : 0),
    evening: [8, 9, 10, 11, 14].filter(on).length + (on(12) || on(13) ? 1 : 0),
  });
  const GROUPS = $derived([
    { part: 'morning', title: t('Morning · {n} taps', { n: taps.morning }) },
    { part: 'evening', title: t('Evening · from 20:30 · {n} taps', { n: taps.evening }) },
    { part: 'sunday', title: t('Sunday|group') },
  ]);
  const AUTO = [
    { icon: Flower2, name: 'Meditation', line: 'from your log → question 14' },
    { icon: Bike, name: 'Bike rides', line: 'Strava and trips → question 11' },
    { icon: Activity, name: 'Active goals', line: 'ticks of the week → ring Sport' },
    { icon: Heart, name: 'Sleep, HRV, steps', line: 'with Fitbit/Google, later' },
  ];
</script>

<div class="cq" data-check="questions">
  <header class="ph">
    <Crumb path={[{ href: '#/', label: t('Today|place') }]} here={t('Your 15 questions')} />
    <h1 class="h1" tabindex="-1" data-page-title>{t('Your 15 questions')}</h1>
    <p>{phone.matches ? t('When they come and where they count') : t('When they come, how you answer and where they count in the ring.')}</p>
  </header>

  <div class="two">
    <section class="card tb" aria-label={t('Your 15 questions')}>
      <table>
        <thead>
          <tr>
            <th scope="col" class="n">#</th>
            <th scope="col">{t('Question|table')}</th>
            {#if !phone.matches}<th scope="col">{t('How often')}</th><th scope="col">{t('Answer|table')}</th>{/if}
            <th scope="col">{t('Category')}</th>
            <th scope="col" class="sw-c">{t('On|switch')}</th>
          </tr>
        </thead>
        {#each GROUPS as g (g.part)}
          <tbody>
            <tr class="g"><th scope="rowgroup" colspan={phone.matches ? 4 : 6}>{g.title}</th></tr>
            {#each QUESTIONS.filter((x) => x.part === g.part) as q (q.n)}
              <tr class:off={!on(q.n)} data-question={q.n}>
                <td class="n num">{q.n}</td>
                <td class="qx">{t(q.text)}</td>
                {#if !phone.matches}<td>{t(q.often)}</td><td>{t(q.answer)}</td>{/if}
                <td>{t(CAT[q.cat].label)}</td>
                <td class="sw-c"><button type="button" class="switch" role="switch" aria-checked={on(q.n)} aria-label={t('Ask question {n}: {question}', { n: q.n, question: t(q.text) })} onclick={() => flip(q.n)}><span class="knob"></span></button></td>
              </tr>
            {/each}
          </tbody>
        {/each}
      </table>
    </section>

    <div class="side">
      <section class="card" aria-labelledby="cq-auto">
        <div class="hl"><h2 id="cq-auto">{t('Comes by itself')}</h2><p>{t('is not asked')}</p></div>
        <ul class="rows">
          {#each AUTO as a (a.name)}
            <li><span class="ib"><a.icon size={18} aria-hidden="true" /></span><span class="rt"><b>{t(a.name)}</b><small>{t(a.line)}</small></span></li>
          {/each}
        </ul>
      </section>
      <p class="note"><Lightbulb size={18} aria-hidden="true" /><span>{t('Every question can be switched off and skipped. Observations come only after about 2 weeks, always with the number of days. Everything stays on your device and in the backup.')}</span></p>
    </div>
  </div>
</div>

<style>
  .cq {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 1120px;
  }
  .ph {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
  }
  .h1 {
    margin: 0;
    font: 800 var(--fs-page) / 1.1 var(--font-brand);
  }
  .ph p {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .two {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    gap: var(--sp-4);
    align-items: start;
  }
  @media (max-width: 899px) {
    .two {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    min-width: 0;
  }
  .tb {
    padding: 0;
    overflow: hidden;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  thead th {
    padding: 8px 10px;
    background: var(--paper-2);
    color: var(--ink-3);
    font: 600 var(--fs-tiny) / 1.4 var(--font-body);
    text-align: left;
  }
  td {
    padding: 9px 10px;
    border-top: 1px solid var(--line);
    line-height: 1.4;
    vertical-align: top;
    overflow-wrap: break-word;
  }
  tr.g th {
    padding: 8px 10px;
    border-top: 1px solid var(--line);
    background: var(--paper-2);
    color: var(--ink-2);
    font: 600 var(--fs-tiny) / 1.4 var(--font-body);
    letter-spacing: 0.04em;
    text-align: left;
    text-transform: uppercase;
  }
  .n {
    width: 28px;
  }
  .qx {
    color: var(--ink);
  }
  tr.off td {
    color: var(--ink-3);
  }
  .sw-c {
    width: 52px;
    padding-block: 0;
    text-align: right;
    vertical-align: middle;
  }
  .switch {
    position: relative;
    flex: none;
    width: 52px;
    height: 44px;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .switch::before {
    content: '';
    position: absolute;
    left: 4px;
    right: 4px;
    top: 50%;
    height: 26px;
    transform: translateY(-50%);
    border-radius: 99px;
    background: var(--line-strong);
  }
  .switch .knob {
    position: absolute;
    top: 50%;
    left: 7px;
    width: 20px;
    height: 20px;
    transform: translateY(-50%);
    border-radius: 50%;
    background: var(--input);
    box-shadow: 0 1px 2px var(--shadow);
  }
  .switch[aria-checked='true']::before {
    background: var(--hi);
  }
  .switch[aria-checked='true'] .knob {
    left: 25px;
  }
  .hl {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0 var(--sp-3);
    margin-bottom: var(--sp-2);
  }
  .hl h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .hl p {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .rows {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rows li {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .ib {
    display: grid;
    flex: none;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .rt {
    min-width: 0;
  }
  .rt b {
    display: block;
    font-weight: 500;
  }
  .rt small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .note {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin: 0;
    padding: 12px 14px;
    border: 1px solid color-mix(in srgb, var(--warn) 25%, var(--paper));
    border-radius: 14px;
    background: var(--warn-soft);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .note :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--warn);
  }
</style>
