<script>
  /**
   * v0.48.0 (Noah 9a): the start values of a bike without part data, in three steps:
   * 1. the purchase date (= the mounting date of every part) and the km then,
   * 2. the km today,
   * 3. what is new since then («original» or «new», a new part with its date and, if known, km).
   * Unsure? «original» is a good start value. Nothing is stored before the last button.
   */
  import DateInput from '../ui/DateInput.svelte';
  import { localDay } from '../localday.js';
  import { parseKm, partName } from '../care.js';
  import { startValues, WIZARD_PARTS } from './overview.js';
  import { t, tn, num } from '../i18n.svelte.js';
  import { X, ChevronRight, ChevronDown } from '@lucide/svelte';

  let { bike, onsave, onclose } = $props();
  let dialog;
  $effect(() => {
    dialog.showModal();
  });

  let step = $state(0);
  let bought = $state('');
  let kmBought = $state('0');
  // svelte-ignore state_referenced_locally
  let kmNow = $state(typeof bike.km === 'number' ? String(bike.km) : '');
  let fresh = $state({}); // key → { date, km }
  let error = $state('');
  let rest = $state(false);

  // svelte-ignore state_referenced_locally
  const asked = WIZARD_PARTS.map((k) => bike.parts.find((p) => p.key === k)).filter(Boolean);
  const first = asked.slice(0, 7);
  const later = asked.slice(7);
  const counted = $derived(bike.parts.filter((p) => !['bolts', 'bearings'].includes(p.key)).length);

  function next() {
    error = '';
    if (step === 0) {
      if (!bought) return (error = t('Pick the purchase date.'));
      if (bought > localDay()) return (error = t('The purchase date lies in the future.'));
      if (Number.isNaN(parseKm(kmBought))) return (error = t('Type the km as a whole number, e.g. 12400.'));
    }
    if (step === 1) {
      const k = parseKm(kmNow);
      if (k == null || Number.isNaN(k)) return (error = t('Type the km as a whole number, e.g. 12400.'));
      if (k < (parseKm(kmBought) ?? 0)) return (error = t('Today the bike has fewer km than at the purchase.'));
    }
    step += 1;
  }
  const setFresh = (key, on) => {
    const f = { ...fresh };
    if (on) f[key] = { date: localDay(), km: '' };
    else delete f[key];
    fresh = f;
  };
  async function save() {
    error = '';
    const f = {};
    for (const [k, v] of Object.entries(fresh)) {
      if (!v.date) return (error = t('Pick a date for every new part.'));
      const km = parseKm(v.km);
      if (Number.isNaN(km)) return (error = t('Type the km as a whole number, e.g. 12400.'));
      f[k] = { date: v.date, km };
    }
    await onsave(startValues(bike, { bought, kmBought: parseKm(kmBought) ?? 0, kmNow: parseKm(kmNow), fresh: f, parts: $state.snapshot(bike.parts) }));
    dialog.close();
  }
</script>

<dialog class="sheet" bind:this={dialog} onclose={onclose} aria-labelledby="sv-h">
  <div class="fh">
    <div>
      <p class="meta">{bike.name}</p>
      <h2 id="sv-h" class="title">{[t('When did you buy it?'), t('How many km today?'), t('What is new since the purchase?')][step]}</h2>
    </div>
    <button type="button" class="x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <ol class="steps" aria-label={t('Steps')}>{#each [0, 1, 2] as i (i)}<li class:done={step > i} class:now={step === i}><i></i></li>{/each}</ol>

  {#if step === 0}
    <p class="hint">{t('The purchase date counts as the mounting date of every part.')}</p>
    <label class="fld"><span class="lbl">{t('Purchase date')}</span><DateInput bind:value={bought} max={localDay()} /></label>
    <label class="fld"><span class="lbl">{t('km at the purchase')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={kmBought} /></label>
  {:else if step === 1}
    <p class="hint">{t('From the bike computer, Strava or Garmin.')}</p>
    <label class="fld"><span class="lbl">{t('km now')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={kmNow} /></label>
  {:else}
    <p class="hint">{t('«new» asks for the date. Unsure? Leave «original»: a good start value.')}</p>
    {#snippet item(p)}
      {@const on = !!fresh[p.key]}
      <li>
        <div class="pr">
          <span class="pn">{partName(p)}<small>{on ? t('new') : t('since {date}', { date: bought })}</small></span>
          <span class="seg" role="group" aria-label={partName(p)}>
            <button type="button" aria-pressed={!on} onclick={() => setFresh(p.key, false)}>{t('original')}</button>
            <button type="button" aria-pressed={on} onclick={() => setFresh(p.key, true)}>{t('new')}</button>
          </span>
        </div>
        {#if on}
          <div class="two">
            <label class="fld"><span class="lbl">{t('Date')}</span><DateInput bind:value={fresh[p.key].date} min={bought} max={localDay()} /></label>
            <label class="fld"><span class="lbl">km</span><input class="inp num" type="text" inputmode="numeric" bind:value={fresh[p.key].km} placeholder={t('not known')} /></label>
          </div>
        {/if}
      </li>
    {/snippet}
    <ul class="parts">{#each first as p (p.key)}{@render item(p)}{/each}</ul>
    {#if later.length}
      <button type="button" class="restbtn" aria-expanded={rest} onclick={() => (rest = !rest)}>{#if rest}<ChevronDown size={18} aria-hidden="true" />{:else}<ChevronRight size={18} aria-hidden="true" />{/if}{tn(later.length, '{n} more part, all original', '{n} more parts, all original')}</button>
      {#if rest}<ul class="parts">{#each later as p (p.key)}{@render item(p)}{/each}</ul>{/if}
    {/if}
  {/if}

  <p class="err" role="alert">{error}</p>
  <div class="foot">
    {#if step > 0}<button type="button" class="btn" onclick={() => ((error = ''), (step -= 1))}>{t('Back')}</button>{/if}
    {#if step < 2}
      <button type="button" class="btn hi" onclick={next}>{t('Next|step')}</button>
    {:else}
      <button type="button" class="btn hi" onclick={save}>{tn(counted, 'Set up {n} part', 'Set up {n} parts')}</button>
    {/if}
  </div>
  {#if step === 2 && kmNow}<p class="hint small">{t('{km} km today', { km: num(parseKm(kmNow) ?? 0) })}</p>{/if}
</dialog>

<style>
  .fh {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .meta {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .fh .title {
    font-size: var(--fs-section);
  }
  .x {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    flex: none;
    border: 0;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink);
    cursor: pointer;
  }
  .steps {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    list-style: none;
    margin: 12px 0;
    padding: 0;
  }
  .steps i {
    display: block;
    height: 4px;
    border-radius: 2px;
    background: var(--line);
  }
  .steps .done i {
    background: var(--accent);
  }
  .steps .now i {
    background: var(--hi);
  }
  .hint {
    margin: 0 0 12px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .fld {
    display: block;
    margin: 0 0 10px;
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 6px;
  }
  .parts {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .parts li {
    padding: 6px 0;
    border-top: 1px solid var(--line);
  }
  .pr {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .pn {
    min-width: 0;
    font-weight: 500;
  }
  .pn small {
    display: block;
    font-weight: 400;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .seg {
    display: inline-flex;
    flex: none;
    gap: 2px;
    padding: 3px;
    border-radius: 12px;
    background: var(--paper-2);
  }
  .seg button {
    min-height: 44px;
    padding: 4px 12px;
    border: 0;
    border-radius: 9px;
    background: transparent;
    font: 500 var(--fs-small) var(--font-body);
    color: var(--ink-2);
    cursor: pointer;
  }
  .seg button[aria-pressed='true'] {
    background: var(--paper);
    color: var(--ink);
    font-weight: 600;
    box-shadow: 0 1px 3px var(--shadow);
  }
  .restbtn {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    min-height: 44px;
    border: 0;
    border-top: 1px solid var(--line);
    background: none;
    font: 500 var(--fs-body) var(--font-body);
    color: var(--ink-2);
    text-align: left;
    cursor: pointer;
  }
  .err {
    min-height: 1.2em;
    margin: 8px 0 4px;
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .foot {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  .small {
    text-align: right;
    margin: 6px 0 0;
  }
</style>
