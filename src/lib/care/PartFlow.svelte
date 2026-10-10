<script>
  /**
   * v0.48.0 (Noah 11a, board «Ersetzen und Warten»): replacing and servicing a part are guided.
   * Replace: measure → decide (with follow-up questions) → the new part (model, price, km, who) →
   * done, with what comes next. Service: what was done, when, at which km, in one step.
   * Nothing is stored before the last step; onsave({ entries: [{ key, entry }], problems: [text] })
   * writes it all at once (the page offers Undo).
   * part: from withVisits; bike: the bike view; shops: the shop names of earlier visits.
   */
  import { localDay } from '../localday.js';
  import { PART, partInfo, partName, parseKm, kmSince, lastReplace, lastValue } from '../care.js';
  import { t, num } from '../i18n.svelte.js';
  import { targetPressure } from '../bikespecs.js';
  import { parseBar } from '../quickcare.js';
  import { Check, X, ChevronRight, CircleAlert } from '@lucide/svelte';

  let { part, bike, mode = 'replace', shops = [], by = 'self', onsave, oncancel } = $props();

  // svelte-ignore state_referenced_locally
  const p = partInfo(part);
  // svelte-ignore state_referenced_locally
  const name = partName(part);
  const measurable = p.unit && p.limit != null;
  /** Quick values to tap per unit (chain checker, pad left, rotor thickness). */
  const QUICK = { '%': p.key === 'chain' ? [0.25, 0.5, 0.75, 1] : [80, 60, 50, 30], mm: [1.8, 1.6, 1.5, 1.4] };
  // svelte-ignore state_referenced_locally
  const STEPS = mode === 'replace' ? [...(measurable ? ['measure'] : []), 'decide', 'new', 'done'] : ['service'];
  let step = $state(STEPS[0]);
  const stepNames = { measure: 'Measure', decide: 'Decide', new: 'New part', done: 'Done|step' };

  let value = $state('');
  const val = $derived(String(value).trim() === '' ? null : Number(String(value).replace(',', '.')));
  const worn = $derived(val != null && Number.isFinite(val) && (p.lowIsWorn ? val <= p.limit : val >= p.limit));
  let replace = $state(true); // after measuring: replace it, or only save the measurement
  // Follow-up for a chain over 0.75 %: test the new chain, replace the cassette too, check the chainring.
  const follow = $derived(p.key === 'chain' && (val == null || val > 0.75));
  let followUp = $state('test');

  // svelte-ignore state_referenced_locally
  let model = $state(part.model ?? '');
  let chf = $state('');
  // svelte-ignore state_referenced_locally
  let km = $state(typeof bike.km === 'number' ? String(bike.km) : '');
  // svelte-ignore state_referenced_locally
  let who = $state(by === 'shop' && shops[0] ? shops[0] : 'self');
  let date = $state(localDay());
  let note = $state('');
  let error = $state('');

  // Service: what was done (more than one is fine).
  const SERVICE = p.key === 'chain' ? ['Waxed', 'Oiled', 'Cleaned', 'Measured'] : p.key === 'tyres' ? ['Sealant topped up', 'Pressure checked', 'Measured'] : ['Serviced', 'Checked', 'Cleaned'];
  let did = $state([]);
  const toggleDid = (k) => (did = did.includes(k) ? did.filter((x) => x !== k) : [...did, k]);
  let sealant = $state('');
  // v0.65.0 «Velo-Masse»: «Pressure checked» asks for the pressure, prefilled with the bike's target
  // (bike.fit pressureF / pressureR), and shows the target beside the last measured value.
  // svelte-ignore state_referenced_locally
  const target = p.key === 'tyres' ? targetPressure(bike) : null;
  // svelte-ignore state_referenced_locally
  const lastP = p.key === 'tyres' ? [...(part.history ?? [])].reverse().find((h) => h.pressureF != null || h.pressureR != null) ?? null : null;
  let presF = $state(target?.f != null ? String(target.f) : '');
  let presR = $state(target?.r != null ? String(target.r) : '');
  const pair = (f, r) => `${f != null ? num(f) : '–'} / ${r != null ? num(r) : '–'} bar`;

  const fmt = (v) => `${num(v)} ${p.unit}`.trim();
  // svelte-ignore state_referenced_locally
  const sinceNew = kmSince(bike, lastReplace(part));
  const go = (s) => ((error = ''), (step = s));
  const next = () => go(STEPS[STEPS.indexOf(step) + 1]);

  function readKm() {
    const n = parseKm(km);
    if (Number.isNaN(n)) {
      error = t('Type the km as a whole number, e.g. 12400.');
      return undefined;
    }
    return n;
  }

  let saved = $state(null); // what the done step tells
  async function saveReplace() {
    const k = readKm();
    if (k === undefined) return;
    const price = String(chf).trim() === '' ? null : Number(String(chf).replace(/[^\d.,]/g, '').replace(',', '.'));
    if (price != null && !Number.isFinite(price)) return (error = t('Type the price as a number, e.g. 39.90'));
    const byWho = who === 'self' ? 'self' : 'shop';
    const base = { date, km: k, by: byWho, note: note.trim(), ...(byWho === 'shop' ? { shop: who } : {}) };
    const entries = [];
    if (val != null) entries.push({ key: p.key, entry: { ...base, value: val, action: 'check', result: replace || worn ? 'needed' : 'ok', model: null, note: '' } });
    if (replace) {
      entries.push({ key: p.key, entry: { ...base, value: null, action: 'replace', result: 'done', model: model.trim() || null, ...(price != null ? { chf: price } : {}) } });
      if (follow && followUp === 'cassette') entries.push({ key: 'cassette', entry: { ...base, value: null, action: 'replace', result: 'done', model: null, note: t('with the chain') } });
    }
    const problems = replace && follow ? (followUp === 'test' ? [t('Cassette: does it skip with the new chain?')] : followUp === 'ring' ? [t('Check the chainring (shark teeth?)')] : []) : [];
    await onsave({ entries, problems });
    saved = { replaced: replace, old: sinceNew, val, problems };
    go('done');
  }
  async function saveService() {
    const k = readKm();
    if (k === undefined) return;
    if (!did.length) return (error = t('Tap what you did.'));
    const v = did.includes('Measured') && val != null ? val : null;
    const onlyLook = did.every((x) => ['Checked', 'Measured', 'Pressure checked'].includes(x));
    const ml = String(sealant).trim() === '' ? null : Number(String(sealant).replace(',', '.'));
    const pf = did.includes('Pressure checked') ? parseBar(presF) : null;
    const pr = did.includes('Pressure checked') ? parseBar(presR) : null;
    if (Number.isNaN(pf) || Number.isNaN(pr)) return (error = t('Type the pressure in bar, e.g. 1.6'));
    const entry = {
      date, km: k, value: v, action: onlyLook ? 'check' : 'service', result: onlyLook && v != null && worn ? 'needed' : onlyLook ? 'ok' : 'done', by: who === 'self' ? 'self' : 'shop', model: null,
      note: did.map((x) => t(x)).join(', '), ...(ml != null && Number.isFinite(ml) ? { sealantMl: ml } : {}),
      ...(pf != null ? { pressureF: pf } : {}), ...(pr != null ? { pressureR: pr } : {}),
    };
    await onsave({ entries: [{ key: p.key, entry }], problems: [] });
  }
  /** What comes next after a replacement, in words. */
  const nextUp = $derived([
    ...(p.everyKm ? [t('{what} in {km} km', { what: t(p.service ?? 'Service'), km: num(p.everyKm) })] : []),
    ...(measurable ? [t('Measure in {km} km', { km: num(1000) })] : []),
    ...(saved?.problems ?? []),
  ]);
</script>

<div class="flow">
  <div class="fh">
    <h2 id="flow-h" class="title">{mode === 'replace' ? t('Replace {part}', { part: name }) : t('Service {part}', { part: name })}</h2>
    <button type="button" class="x" aria-label={t('Close')} onclick={oncancel}><X size={20} aria-hidden="true" /></button>
  </div>
  {#if STEPS.length > 1}
    <ol class="steps" aria-label={t('Steps')}>
      {#each STEPS as s, i (s)}
        <li class:done={STEPS.indexOf(step) > i} class:now={step === s}><i></i><span>{STEPS.indexOf(step) > i ? '✓ ' : ''}{t(stepNames[s])}</span></li>
      {/each}
    </ol>
  {/if}

  {#if step === 'measure'}
    <p class="q">{p.key === 'chain' ? t('How long is the old chain?') : t('How worn is it?')}</p>
    <p class="hint">{t(p.hint)}</p>
    <div class="chips" role="group" aria-label={t('Measured')}>
      {#each QUICK[p.unit] ?? [] as q (q)}
        <button type="button" class="chip" aria-pressed={val === q} onclick={() => (value = String(q))}>{#if val === q}<Check size={14} aria-hidden="true" />{/if}{fmt(q)}</button>
      {/each}
    </div>
    <label class="fld"><span class="lbl">{t('Measured')} ({p.unit})</span><input class="inp num" type="text" inputmode="decimal" bind:value placeholder={t('or type it')} /></label>
    {#if p.limit != null}<p class="box"><CircleAlert size={16} aria-hidden="true" /><span>{p.lowIsWorn ? t('Guide: replace below {limit}.', { limit: fmt(p.limit) }) : t('Guide: replace from {limit}.', { limit: fmt(p.limit) })}{p.key === 'chain' ? ` ${t('Over 0.75 % the cassette usually suffers too.')}` : ''}</span></p>{/if}
    <button type="button" class="btn hi wide" onclick={next}>{t('Next|step')}<ChevronRight size={16} aria-hidden="true" /></button>
    <button type="button" class="lnk" onclick={() => ((value = ''), next())}>{t('Not measured, skip')}</button>
  {:else if step === 'decide'}
    {#if val != null}
      <p class="verdict"><Check size={18} aria-hidden="true" />{worn ? t('{value}: replace {part}', { value: fmt(val), part: name }) : t('{value}: still good', { value: fmt(val) })}</p>
      {#if !worn}
        <div class="chips" role="group" aria-label={t('What now?')}>
          <button type="button" class="chip" aria-pressed={replace} onclick={() => (replace = true)}>{t('Replace anyway')}</button>
          <button type="button" class="chip" aria-pressed={!replace} onclick={() => (replace = false)}>{t('Only save the measurement')}</button>
        </div>
      {/if}
    {:else}
      <p class="verdict">{t('Replace {part}', { part: name })}</p>
    {/if}
    {#if follow && replace}
      <div class="fq surf">
        <p class="fqh"><b>{t('Check the cassette?')}</b> <span class="pill warn">{t('Follow-up')}</span></p>
        <p class="hint">{val != null ? t('The old chain was over 0.75 %. Often the cassette is fine then; a new chain under load tells.') : t('Unknown wear: a new chain under load tells if the cassette is fine.')}</p>
        <div class="radios" role="radiogroup" aria-label={t('Check the cassette?')}>
          {#each [['test', 'Test the new chain', 'after the first ride: does it skip?'], ['cassette', 'Replace the cassette too', 'goes into the same entry'], ['ring', 'Check the chainring too', 'shark teeth?']] as [k, a, b] (k)}
            <button type="button" role="radio" aria-checked={followUp === k} class="radio" onclick={() => (followUp = k)}><i aria-hidden="true"></i><span><b>{t(a)}</b><small>{t(b)}</small></span></button>
          {/each}
        </div>
      </div>
    {/if}
    {#if replace}
      <button type="button" class="btn hi wide" onclick={next}>{t('Next|step')}<ChevronRight size={16} aria-hidden="true" /></button>
    {:else}
      <button type="button" class="btn hi wide" onclick={saveReplace}>{t('Save the measurement')}</button>
    {/if}
  {:else if step === 'new'}
    <p class="q">{t('The new part')}</p>
    <label class="fld"><span class="lbl">{t('Model')}{#if part.model && model === part.model}<small class="ok"> · {t('as before')}</small>{/if}</span><input class="inp" bind:value={model} placeholder={t('e.g. SRAM GX Eagle 12-speed')} /></label>
    <div class="two">
      <label class="fld"><span class="lbl">{t('Price (CHF)')}</span><input class="inp num" type="text" inputmode="decimal" bind:value={chf} placeholder={t('optional')} /></label>
      <label class="fld"><span class="lbl">{t('km when fitted')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={km} placeholder={t('not known')} /></label>
    </div>
    <p class="lbl">{t('Who did it?')}</p>
    <div class="chips" role="group" aria-label={t('Who did it?')}>
      {#each ['self', ...shops] as s (s)}
        <button type="button" class="chip" aria-pressed={who === s} onclick={() => (who = s)}>{#if who === s}<Check size={14} aria-hidden="true" />{/if}{s === 'self' ? t('Myself') : s}</button>
      {/each}
    </div>
    <details class="more">
      <summary>{t('Date today, note')}</summary>
      <div class="two">
        <label class="fld"><span class="lbl">{t('Date')}</span><input class="inp" type="date" bind:value={date} /></label>
        <label class="fld"><span class="lbl">{t('Note')}</span><input class="inp" bind:value={note} placeholder={t('optional')} /></label>
      </div>
    </details>
    <p class="err" role="alert">{error}</p>
    <button type="button" class="btn hi wide" onclick={saveReplace}>{t('Replace {part}', { part: name })}</button>
  {:else if step === 'done'}
    <p class="okmark" aria-hidden="true"><Check size={28} /></p>
    <p class="verdict center">{saved?.replaced ? t('{part} replaced', { part: name }) : t('Measurement saved')}</p>
    {#if saved?.replaced}<p class="hint center">{[saved.old != null ? t('Old part: {km} km', { km: num(saved.old) }) : '', saved.val != null ? fmt(saved.val) : ''].filter(Boolean).join(', ')}</p>{/if}
    {#if nextUp.length && saved?.replaced}
      <div class="fq surf">
        <p class="fqh"><b>{t('Next up')}</b></p>
        <ul class="nexts">{#each nextUp as n (n)}<li>{n}</li>{/each}</ul>
      </div>
    {/if}
    <button type="button" class="btn hi wide" onclick={oncancel}>{t('Done|step')}</button>
  {:else if step === 'service'}
    <p class="q">{t('What did you do?')}</p>
    <div class="chips grid2" role="group" aria-label={t('What did you do?')}>
      {#each SERVICE as k (k)}
        <button type="button" class="chip" aria-pressed={did.includes(k)} onclick={() => toggleDid(k)}>{#if did.includes(k)}<Check size={14} aria-hidden="true" />{/if}{t(k)}</button>
      {/each}
    </div>
    {#if did.includes('Measured') && p.unit}
      <label class="fld"><span class="lbl">{t('Measured')} ({p.unit})</span><input class="inp num" type="text" inputmode="decimal" bind:value /></label>
    {/if}
    {#if p.key === 'tyres' && (target || lastP)}
      <p class="psoll num" data-testid="pressure-target">{#if target}<span><b>{t('Target')}</b> {pair(target.f, target.r)}</span>{/if}{#if lastP}<span>{t('Last measured')} {pair(lastP.pressureF ?? null, lastP.pressureR ?? null)}</span>{/if}</p>
    {/if}
    {#if did.includes('Pressure checked')}
      <div class="two">
        <label class="fld"><span class="lbl">{t('Pressure front')} (bar)</span><input class="inp num" type="text" inputmode="decimal" bind:value={presF} placeholder={t('optional')} /></label>
        <label class="fld"><span class="lbl">{t('Pressure rear')} (bar)</span><input class="inp num" type="text" inputmode="decimal" bind:value={presR} placeholder={t('optional')} /></label>
      </div>
    {/if}
    {#if did.includes('Sealant topped up')}
      <label class="fld"><span class="lbl">{t('Sealant added')} (ml)</span><input class="inp num" type="text" inputmode="decimal" bind:value={sealant} placeholder={t('optional')} /></label>
    {/if}
    <div class="two">
      <label class="fld"><span class="lbl">{t('When')}</span><input class="inp" type="date" bind:value={date} /></label>
      <label class="fld"><span class="lbl">km</span><input class="inp num" type="text" inputmode="numeric" bind:value={km} placeholder={t('not known')} /></label>
    </div>
    <div class="chips" role="group" aria-label={t('Who did it?')}>
      {#each ['self', ...shops] as s (s)}
        <button type="button" class="chip" aria-pressed={who === s} onclick={() => (who = s)}>{#if who === s}<Check size={14} aria-hidden="true" />{/if}{s === 'self' ? t('Myself') : s}</button>
      {/each}
    </div>
    <p class="err" role="alert">{error}</p>
    <button type="button" class="btn hi wide" onclick={saveService}>{t('Save')}</button>
  {/if}
</div>

<style>
  .psoll {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 16px;
    margin: 10px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .psoll b {
    color: var(--ink);
  }
  .fh {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
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
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    gap: 6px;
    list-style: none;
    margin: 12px 0 14px;
    padding: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .steps i {
    display: block;
    height: 4px;
    margin-bottom: 4px;
    border-radius: 2px;
    background: var(--line);
  }
  .steps .done i {
    background: var(--accent);
  }
  .steps .now i {
    background: var(--hi);
  }
  .steps .now {
    color: var(--ink);
    font-weight: 600;
  }
  .q {
    margin: 4px 0 4px;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .hint {
    margin: 0 0 10px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .center {
    text-align: center;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 6px 0 12px;
  }
  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 44px;
    padding: 6px 14px;
    border: 1.5px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    font: 500 var(--fs-body) var(--font-body);
    color: var(--ink);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    border-color: var(--hi);
    background: var(--hi-soft);
  }
  .fld {
    display: block;
    margin: 0 0 10px;
  }
  .fld .ok {
    color: var(--accent);
    font-weight: 500;
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .box {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 0 0 12px;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--warn-soft);
    color: var(--ink);
    font-size: var(--fs-small);
  }
  .box :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--warn);
  }
  .wide {
    width: 100%;
    margin-top: 6px;
  }
  .lnk {
    display: block;
    width: 100%;
    min-height: 44px;
    border: 0;
    background: none;
    font: 500 var(--fs-body) var(--font-body);
    color: var(--accent);
    cursor: pointer;
  }
  .verdict {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 4px 0 10px;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .verdict.center {
    justify-content: center;
  }
  .verdict :global(svg) {
    color: var(--accent);
  }
  .okmark {
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    margin: 8px auto 4px;
    border-radius: 50%;
    background: var(--accent-soft);
    color: var(--accent);
  }
  .fq {
    margin: 4px 0 12px;
    padding: 12px;
  }
  .fqh {
    margin: 0 0 4px;
  }
  .radios {
    display: grid;
    gap: 8px;
  }
  .radio {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 52px;
    padding: 8px 12px;
    border: 1.5px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    font: inherit;
    color: var(--ink);
    text-align: left;
    cursor: pointer;
  }
  .radio i {
    flex: none;
    width: 18px;
    height: 18px;
    border: 2px solid var(--line-strong);
    border-radius: 50%;
  }
  .radio[aria-checked='true'] {
    border-color: var(--hi);
    background: var(--hi-soft);
  }
  .radio[aria-checked='true'] i {
    border: 5px solid var(--hi);
  }
  .radio small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .more {
    margin: 0 0 10px;
  }
  .more summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    color: var(--ink-2);
    cursor: pointer;
  }
  .nexts {
    margin: 0;
    padding-left: 18px;
  }
  .err {
    min-height: 1.2em;
    margin: 4px 0;
    color: var(--bad);
    font-size: var(--fs-small);
  }
</style>
