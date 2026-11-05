<script>
  /**
   * Paket C › Eigene kleine Experimente (#/me/ruhig/versuche; 996 Ideen UC-254-I1): «Experiment mit Ende».
   * A question, what you change, a time span and a clear end, then a short look back. Logic: versuche.js.
   */
  import { FlaskConical, Plus, Check, X, Pencil, Trash2, RotateCcw } from '@lucide/svelte';
  import Card from './Card.svelte';
  import { t, tn, num } from '../i18n.svelte.js';
  import { analyseData } from '../analyse/data.svelte.js';
  import { analyseGroups, itemsByKey } from '../analyse/catalog.js';
  import { valueText, unitText } from '../analyse/format.js';
  import { addDays } from '../analyse.js';
  import { EXP_METRICS, RIDE_METRICS, RIDE_DAYS, MIN_SIDE, expResult } from './versuch-wert.js';
  import { MIN_RIDES, rideResult } from './versuch-fahrt.js';
  import RideDots from './RideDots.svelte';
  import { localDay } from '../localday.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { settingQ, saveSetting } from './store.js';
  import { dmy } from './base.js';
  import { EXP_KEY, EXP_DAYS, EXP_EXAMPLES, KEEP, expsOf, newExp, expEnd, expState, expProgress, expTick, expNote, expReview, expStop, expAgain } from './versuche.js';

  const today = localDay();
  const q = settingQ(EXP_KEY);
  const exps = $derived(expsOf($q));
  const save = (list) => saveSetting(EXP_KEY, list);
  const change = (id, fn) => save(exps.map((e) => (e.id === id ? fn(e) : e)));
  let open = $state({ exp: true });

  // a measured value (optional): the Analyse values, read the same way as on their pages
  const data = analyseData({ from: () => addDays(today, -120) });
  const byKey = $derived(itemsByKey(analyseGroups({ table: data.table, weights: data.weights, ctx: data.ctx, acts: data.acts, log: data.log, ownKeys: data.ownKeys })));
  const metrics = $derived(EXP_METRICS.map((k) => byKey.get(k)).filter((x) => x?.get));
  // the main value and, if chosen, a second one read the same way (ride values: Idee 2)
  // ride values are compared ride against ride, similar rides only (versuch-fahrt.js); the other values day against day
  const resultOf = (x, key = x.metric) => {
    if (!key || !byKey.get(key)?.get) return null;
    return RIDE_METRICS.includes(key) ? rideResult({ ...x, metric: key }, data.table, key, today, data.ctx.kgOn) : expResult({ ...x, metric: key }, byKey.get(key).get, today);
  };
  const valuesOf = (x) => [x.metric, x.also].filter(Boolean).map((key) => ({ key, ride: RIDE_METRICS.includes(key), mi: byKey.get(key), res: resultOf(x, key) })).filter((v) => v.mi && v.res);
  const vt = (it, v) => `${valueText(it, v, num)} ${unitText(it)}`.trim();
  const dt = (it, v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${vt(it, Math.abs(v))}`;
  const VERDICT = {
    up: 'On average higher during the try than before.|exp',
    down: 'On average lower during the try than before.|exp',
    unclear: 'No clear difference: the two means lie within the swing from day to day.|exp',
  };
  const VERDICT_RIDE = { ...VERDICT, unclear: 'No clear difference: the two means lie within the swing from ride to ride.|exp' };

  let nq = $state('');
  let nchange = $state('');
  let ndays = $state(7);
  let nfrom = $state(today);
  let nmetric = $state('');
  let nalso = $state('');
  const rideChosen = $derived(RIDE_METRICS.includes(nmetric));
  // «show the cadence too» only makes sense next to another ride value
  const cadOffered = $derived(rideChosen && nmetric !== 'cad');
  function add(e) {
    e.preventDefault();
    const x = newExp({ q: nq, change: nchange, from: nfrom, days: ndays, metric: nmetric, also: cadOffered && nalso === 'cad' ? 'cad' : '' });
    if (!x) return;
    save([x, ...exps]);
    nq = '';
    nchange = '';
    nmetric = '';
    nalso = '';
  }
  const STATE = { soon: 'Starts on {day}', running: 'Day {n} of {days}', review: 'Over: your look back', stopped: 'Stopped: your look back', done: 'Finished' };
  let learned = $state({});
  let keep = $state({});
  let note = $state('');
  let editing = $state('');
  let eq = $state('');
  async function remove(x) {
    const ok = await askDelete({ title: t('Delete «{name}»?', { name: x.q }), text: t('The try with its ticks and the look back go.') });
    if (ok !== 'delete') return;
    const before = exps;
    await deleteWithUndo({ run: () => save(exps.filter((e) => e.id !== x.id)).then(() => before), undo: (s) => save(s), text: t('«{name}» deleted.', { name: x.q }), name: x.q });
  }
</script>

<ul class="rh-cards">
  <Card id="exp" icon={FlaskConical} title={t('Experiment with an end')} lead={t('A question, what you change, how long; then a short look back')} bind:open={open.exp}>
    <p class="rh-help">{t('A try is never a routine: after the last day it asks what you learned and ends. You decide whether you keep it.')}</p>
    <form class="rh-new" onsubmit={add}>
      <label class="rh-field"><span>{t('Your question')}</span><input class="inp" bind:value={nq} placeholder={t('e.g. Do I sleep better without a screen after 21:00?')} data-exp-q /></label>
      <label class="rh-field"><span>{t('What you change')}</span><input class="inp" bind:value={nchange} placeholder={t('e.g. No phone after 21:00')} /></label>
      <div class="rh-row">
        <label class="rh-field"><span>{t('From')}</span><input class="inp" type="date" bind:value={nfrom} /></label>
        <label class="rh-field"><span>{t('How long')}</span><select class="inp" bind:value={ndays}>{#each EXP_DAYS as d (d)}<option value={d}>{tn(d, '{n} day', '{n} days')}</option>{/each}</select></label>
      </div>
      <label class="rh-field"><span>{t('Measure it with a value (optional)')}</span>
        <select class="inp" bind:value={nmetric} data-exp-metric>
          <option value="">{t('No value, only my ticks')}</option>
          {#each metrics as m (m.key)}<option value={m.key}>{m.name}</option>{/each}
        </select>
        <small class="rh-help">{t('The look back then compares the mean during the try with the same number of days before it. It needs that value in your data.')}</small>
      </label>
      {#if rideChosen}
        <p class="rh-help" data-exp-ride-hint>{t('Ride values are compared ride against ride, only rides of a similar length and climb. Each side needs at least {min} rides, so a try of {n} days or more is better.|exp', { n: RIDE_DAYS, min: MIN_RIDES })}</p>
      {/if}
      {#if cadOffered}
        <label class="rh-check"><input type="checkbox" checked={nalso === 'cad'} onchange={(e) => (nalso = e.currentTarget.checked ? 'cad' : '')} data-exp-cad /> <span>{t('Show the cadence too|exp')}<small class="rh-help">{t('Example: you pedal 5 rpm faster. The cadence then shows whether you really did, and the felt effort how the rides felt.|exp')}</small></span></label>
      {/if}
      <div class="rh-chips">{#each EXP_EXAMPLES as x (x.q)}<button type="button" class="rh-chip" onclick={() => ((nq = t(x.q)), (nchange = t(x.change)), (nmetric = x.metric ?? ''), (nalso = x.also ?? ''), x.metric && RIDE_METRICS.includes(x.metric) && (ndays = RIDE_DAYS))}>{t(x.q)}</button>{/each}</div>
      <button type="submit" class="btn hi" disabled={!nq.trim()} data-exp-add><Plus size={16} aria-hidden="true" />{t('Start the experiment')}</button>
    </form>
  </Card>

  {#each exps as x (x.id)}
    {@const st = expState(x, today)}
    {@const p = expProgress(x, today)}
    {@const vals = st === 'soon' ? [] : valuesOf(x)}
    <li class="rh-card rh-exp" data-exp={x.id} data-state={st}>
      <div class="rh-body rh-top">
        <div class="rh-row rh-eh">
          {#if editing === x.id}
            <form class="rh-row rh-grow2" onsubmit={(e) => (e.preventDefault(), eq.trim() && change(x.id, (o) => ({ ...o, q: eq.trim() })), (editing = ''))}><input class="inp" bind:value={eq} aria-label={t('Your question')} /><button class="btn sm" type="submit">{t('Save')}</button></form>
          {:else}
            <h3 class="rh-sub rh-grow2">{x.q}</h3>
            <button type="button" class="rh-x" aria-label={t('Rename')} onclick={() => ((editing = x.id), (eq = x.q))}><Pencil size={16} /></button>
          {/if}
          <button type="button" class="rh-x" aria-label={t('Delete')} onclick={() => remove(x)}><Trash2 size={16} /></button>
        </div>
        {#if x.change}<p class="rh-help">{x.change}</p>{/if}
        <p class="rh-help"><span class="rh-tag" class:ok={st === 'done'} class:warn={st === 'review' || st === 'stopped'}>{t(STATE[st], { day: dmy(x.from), n: p.day, days: x.days })}</span> · {dmy(x.from)} – {dmy(expEnd(x))}{#if p.yes || p.no}{' '}· {t('{yes} yes, {no} no', { yes: p.yes, no: p.no })}{/if}</p>
        {#if vals.length}
          {#each vals as v (v.key)}
            <div class="rh-res" data-exp-result data-exp-value={v.key} data-verdict={v.res.verdict} data-exp-rides={v.ride ? '' : undefined}>
              <h4 class="rh-rt">{t('Your value: {name}|exp', { name: v.mi.name })}</h4>
              {#if v.ride}
                <p class="rh-help" data-exp-similar>{t('{similar} of {all} rides are alike in length and climb and are compared.|exp', { similar: v.res.rides.similar, all: v.res.rides.all })}</p>
                {#if v.res.before.n + v.res.during.n}<RideDots before={v.res.before} during={v.res.during} mi={v.mi} />{/if}
                {#if v.res.verdict === 'few'}
                  <p class="rh-help">{t('Not enough rides yet: at least {min} alike rides before and during the try are needed (now {before} and {during}).|exp', { min: MIN_RIDES, before: v.res.before.n, during: v.res.during.n })}</p>
                {:else}
                  <dl class="rh-cmp">
                    <div><dt>{t('Before the try ({n} days)|exp', { n: v.res.days })}</dt><dd>{vt(v.mi, v.res.before.mean)}<small>{tn(v.res.before.n, '{n} ride', '{n} rides')}</small></dd></div>
                    <div><dt>{t('During the try|exp')}</dt><dd>{vt(v.mi, v.res.during.mean)}<small>{tn(v.res.during.n, '{n} ride', '{n} rides')}</small></dd></div>
                  </dl>
                  <p class="rh-help"><strong>{dt(v.mi, v.res.diff)}</strong> · {t(VERDICT_RIDE[v.res.verdict])}</p>
                {/if}
              {:else if v.res.verdict === 'few'}
                <p class="rh-help">{t('Not enough values yet: at least {n} days with a value before and during the try are needed.|exp', { n: MIN_SIDE })}</p>
              {:else}
                <dl class="rh-cmp">
                  <div><dt>{t('Before the try ({n} days)|exp', { n: v.res.days })}</dt><dd>{vt(v.mi, v.res.before.mean)}<small>{valueText(v.mi, v.res.before.lo, num)} – {valueText(v.mi, v.res.before.hi, num)} · {tn(v.res.before.n, '{n} value', '{n} values')}</small></dd></div>
                  <div><dt>{t('During the try|exp')}</dt><dd>{vt(v.mi, v.res.during.mean)}<small>{valueText(v.mi, v.res.during.lo, num)} – {valueText(v.mi, v.res.during.hi, num)} · {tn(v.res.during.n, '{n} value', '{n} values')}</small></dd></div>
                </dl>
                <p class="rh-help"><strong>{dt(v.mi, v.res.diff)}</strong> · {t(VERDICT[v.res.verdict])}</p>
              {/if}
            </div>
          {/each}
          <p class="rh-help">{t('A hint, not proof: a few days are few, and other things change too. Whether higher is better, you judge.|exp')}</p>
        {/if}
        {#if st === 'running'}
          <div class="rh-row" aria-label={t('Today')}>
            <span>{t('Today, did you do it?')}</span>
            <button type="button" class="rh-chip" aria-pressed={x.ticks[today] === 'yes'} onclick={() => change(x.id, (o) => expTick(o, today, 'yes'))} data-exp-yes><Check size={14} aria-hidden="true" /> {t('yes')}</button>
            <button type="button" class="rh-chip" aria-pressed={x.ticks[today] === 'no'} onclick={() => change(x.id, (o) => expTick(o, today, 'no'))}><X size={14} aria-hidden="true" /> {t('no')}</button>
          </div>
          <form class="rh-row" onsubmit={(e) => (e.preventDefault(), change(x.id, (o) => expNote(o, today, note)), (note = ''))}><input class="inp" bind:value={note} placeholder={x.notes[today] ?? t('A short note for today (optional)')} aria-label={t('A short note for today')} /><button class="btn sm" type="submit" disabled={!note.trim()}>{t('Keep')}</button></form>
          <button type="button" class="btn sm btn-link" onclick={() => change(x.id, (o) => expStop(o, today))}>{t('End early')}</button>
        {:else if st === 'review' || st === 'stopped'}
          {#if Object.keys(x.notes).length}<ul class="rh-list">{#each Object.entries(x.notes).sort() as [d, n] (d)}<li><span class="rh-grow">{n}<small>{dmy(d)}</small></span></li>{/each}</ul>{/if}
          <label class="rh-field"><span>{t('What did you learn?')}</span><textarea class="inp" bind:value={learned[x.id]} data-exp-learned></textarea></label>
          <div class="rh-chips">{#each KEEP as k (k.key)}<button type="button" class="rh-chip" aria-pressed={keep[x.id] === k.key} onclick={() => (keep[x.id] = k.key)}>{t(k.label)}</button>{/each}</div>
          <button type="button" class="btn hi" disabled={!(learned[x.id] ?? '').trim() && !keep[x.id]} onclick={() => change(x.id, (o) => expReview(o, { learned: learned[x.id] ?? '', keep: keep[x.id] ?? '' }, today))} data-exp-review>{t('Finish the experiment')}</button>
        {:else if st === 'done'}
          {#if x.review.learned}<p class="rh-note">{x.review.learned}</p>{/if}
          {#if x.review.keep}<p class="rh-help">{t(KEEP.find((k) => k.key === x.review.keep).label)} · {dmy(x.review.at)}</p>{/if}
          <button type="button" class="btn sm" onclick={() => { const n = expAgain(x, today); if (n) save([n, ...exps]); }}><RotateCcw size={14} aria-hidden="true" />{t('Try again from today')}</button>
        {/if}
      </div>
    </li>
  {/each}
</ul>

<style>
  .rh-new {
    display: grid;
    gap: var(--sp-3);
  }
  .rh-top {
    padding-top: var(--sp-4);
  }
  .rh-eh {
    flex-wrap: nowrap;
  }
  .rh-res {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-3);
    border: 1px solid var(--line);
    border-radius: var(--radius);
  }
  .rh-rt {
    margin: 0;
    font-size: var(--fs-body);
  }
  .rh-cmp {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
    gap: var(--sp-3);
    margin: 0;
  }
  .rh-cmp dt {
    font-size: var(--fs-small);
    opacity: 0.75;
  }
  .rh-cmp dd {
    margin: 0;
    font-weight: 600;
  }
  .rh-cmp small {
    display: block;
    font-weight: 400;
    opacity: 0.75;
  }
  .rh-check {
    display: flex;
    gap: var(--sp-2);
    align-items: flex-start;
  }
  .rh-check small {
    display: block;
  }
  .rh-grow2 {
    flex: 1;
    min-width: 0;
    margin: 0;
    overflow-wrap: break-word;
  }
</style>
