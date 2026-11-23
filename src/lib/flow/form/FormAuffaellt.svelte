<script>
  /**
   * «Was auffällt» (Noah 21.11.2026, Klügere Auswertungen K3): the card on «Form und Erholung». It looks at the resting pulse of the
   * last days against your normal (rule in auffaellt.js) and, only when it is clearly up, says it as an observation with the question
   * «Set a marker?». Never a cause, never advice. Always «Tendency». The limit is changeable under «How it is counted»
   * (setting training.auffaellt); marked days (K1) are left out. f: formOf() of the page (table); today: «YYYY-MM-DD».
   * Noah 23.11.2026 «ja»: HRV and sleep are looked at too (auffaellt-werte.js), so the card no longer says «Nothing stands out»
   * while a night was 3 h 55 and the HRV 42 % under the normal. One question «Set a marker?» for all observations.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../../db.js';
  import { Info, ChevronDown } from '@lucide/svelte';
  import Sicherheit from './Sicherheit.svelte';
  import MarkerSheet from '../MarkerSheet.svelte';
  import { restingAlert, cleanSettings, SETTINGS_KEY, DEFAULTS, BASE_DAYS, MIN_BASE } from './auffaellt.js';
  import { valueAlerts, HRV_LOW, HRV_LOW_NOW, SLEEP_LOW, SLEEP_LOW_NOW, SLEEP_MIN } from './auffaellt-werte.js';
  import { shown } from '../../messwerte.js';
  import { MARKER_KEY, markedDays, readMarkers, withMarker, saveMarkers, restoreMarkers } from '../marker.js';
  import { kindText, periodText } from '../markerwords.js';
  import { offerDone } from '../../ui/rename.svelte.js';
  import { t, tn, num, locale } from '../../i18n.svelte.js';

  let { f, today } = $props();

  const mq = liveQuery(() => db.settings.get(MARKER_KEY));
  const sq = liveQuery(() => db.settings.get(SETTINGS_KEY));
  const marked = $derived(markedDays($mq?.value));
  const set = $derived(cleanSettings($sq?.value));
  const r = $derived(restingAlert({ table: f?.table, today, marked, settings: set }));
  const vs = $derived(valueAlerts({ table: f?.table, today, marked }));
  // every observation: the resting pulse (as before), then HRV and sleep
  const hits = $derived([...(r.state === 'up' ? [{ ...r, key: 'rhr' }] : []), ...vs.filter((v) => v.state === 'low' || v.state === 'lowNow')]);
  // the values that were looked at and are in the normal
  const calm = $derived([...(r.state === 'none' ? ['rhr'] : []), ...vs.filter((v) => v.state === 'none').map((v) => v.key)]);
  const state = $derived(hits.length ? 'up' : calm.length ? 'none' : r.state);
  const NAMES = { rhr: 'resting pulse|aw', hrv: 'HRV|aw', sleep: 'sleep|aw' };
  const calmText = $derived.by(() => {
    if (calm.length === 1 && calm[0] === 'rhr') return t('Nothing stands out: your resting pulse of the last days is within your normal.');
    const list = new Intl.ListFormat(locale(), { style: 'long', type: 'conjunction' }).format(calm.map((k) => t(NAMES[k])));
    return t('Nothing stands out: {list} of the last days are within your normal.', { list });
  });
  const min = (v) => shown('sleep', v, num);
  function sentence(h) {
    if (h.key === 'rhr') return tn(h.n, 'Your resting pulse has been {above} beats above your normal for {n} day.', 'Your resting pulse has been {above} beats above your normal for {n} days.', { above: h.above });
    if (h.key === 'hrv') return h.state === 'low' ? tn(h.n, 'Your HRV has been {pct} % below your normal for {n} day.', 'Your HRV has been {pct} % below your normal for {n} days.', { pct: h.pct }) : t('Your latest HRV is {pct} % below your normal.', { pct: h.pct });
    return h.state === 'low' ? t('You slept {gap} less than your normal on average over the last nights.', { gap: min(h.gap) }) : t('Your last night was short: {value}.', { value: min(h.value) });
  }
  function detail(h) {
    const fmt = h.key === 'sleep' ? min : (v) => num(Math.round(v));
    if (h.state === 'lowNow') return t('Normal: {normal}. Latest: {value}.', { normal: fmt(h.normal), value: fmt(h.value) });
    return t('Normal: {normal}. Last days: {mean}.', { normal: fmt(h.normal), mean: fmt(h.mean) });
  }
  // the marker window gets the whole period of all observations
  const period = $derived(hits.length ? { from: hits.map((h) => h.from).sort()[0], to: hits.map((h) => h.to).sort().at(-1) } : null);
  let sheet = $state(null); // { from, to } while the marker window is open

  async function save(m) {
    const before = await saveMarkers(db, withMarker(await readMarkers(db), m));
    offerDone(t('Marker set: {name}.', { name: `${kindText(m.kind)}, ${periodText({ from: m.from, to: m.to })}` }), () => restoreMarkers(db, before));
  }
  async function saveDelta(v) {
    await db.settings.put({ key: SETTINGS_KEY, value: cleanSettings({ delta: Math.round(Number(v)) }) });
  }
  const reset = () => db.settings.delete(SETTINGS_KEY);
</script>

<div class="card af" data-auffaellt data-auffaellt-state={state}>
  {#if state === 'up'}
    <Sicherheit level="trend" />
    {#each hits as h (h.key)}
      <div class="hit" data-auffaellt-hit={h.key}>
        <p class="sen" data-auffaellt-text>{sentence(h)}</p>
        <p class="sub">{detail(h)}</p>
      </div>
    {/each}
    <div class="ask">
      <span>{t('Do you know why? A marker helps the evaluations.')}</span>
      <button type="button" class="btn" onclick={() => (sheet = { from: period.from, to: period.to })} data-auffaellt-mark>{t('Set a marker')}</button>
    </div>
  {:else if state === 'none'}
    <p class="wait" data-auffaellt-text>{calmText}</p>
  {:else if state === 'marked'}
    <p class="wait" data-auffaellt-text>{t('The newest day carries a marker, so nothing is judged.')}</p>
  {:else if state === 'few'}
    <Sicherheit level="few" />
    <p class="wait" data-auffaellt-text>{t('Too few resting pulse values yet: the app needs {n} days with a value to know your normal.', { n: MIN_BASE })}</p>
  {:else}
    <p class="wait" data-auffaellt-text>{t('No resting pulse of the last days. It comes with Fitbit.')}</p>
  {/if}

  <details class="how" data-auffaellt-how>
    <summary><Info size={16} aria-hidden="true" /><span>{t('How it is counted')}</span><ChevronDown class="cv" size={16} aria-hidden="true" /></summary>
    <p>{t('Your normal is the middle of the last {n} resting pulse values before the last 3 days. The card speaks when the mean of the last 3 days is at least {d} beats above it. It only says what it sees, never why.', { n: BASE_DAYS, d: set.delta })}</p>
    <p>{t('HRV and sleep are looked at the same way: the card speaks when the last days are {h} % (HRV) or {s} min (sleep) under your normal, or when the newest value is {hn} % or {sn} min under it (sleep also under {m} h).', { h: Math.round(HRV_LOW * 100), s: SLEEP_LOW, hn: Math.round(HRV_LOW_NOW * 100), sn: SLEEP_LOW_NOW, m: SLEEP_MIN / 60 })}</p>
    <p>{t('Days with a marker count neither into the normal nor as a trigger. That keeps the normal clean after an illness or an injury.')}</p>
    <label class="fld"><span>{t('Beats above the normal')}</span><input class="inp" type="number" inputmode="numeric" min="1" max="10" value={set.delta} onchange={(e) => saveDelta(e.currentTarget.value)} data-auffaellt-delta /></label>
    {#if set.delta !== DEFAULTS.delta}
      <button type="button" class="btn sm" onclick={reset} data-auffaellt-reset>{t('Back to the usual values')}</button>
    {/if}
  </details>
</div>

{#if sheet}
  <MarkerSheet marker={null} prefill={sheet} {today} onsave={save} onclose={() => (sheet = null)} />
{/if}

<style>
  .af {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .af > :global(.sg) {
    justify-self: start;
  }
  .hit {
    display: grid;
    gap: 2px;
  }
  .sen {
    margin: 0;
    font-weight: 600;
  }
  .sub,
  .wait {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ask {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
  }
  .ask span {
    flex: 1;
    min-width: 12rem;
    color: var(--ink-2);
  }
  .how summary {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    cursor: pointer;
    color: var(--ink-2);
  }
  .how p {
    margin: 6px 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .fld {
    display: grid;
    gap: 4px;
    max-width: 14rem;
    margin: 8px 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
</style>
