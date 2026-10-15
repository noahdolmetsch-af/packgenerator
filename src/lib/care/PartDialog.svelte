<script>
  import { keepTyped } from '../ui/keeptyped.js';
  import { localDay } from '../localday.js';
  import { partInfo, wear, replaceHint, kmSince, lastReplace, EXTRA, partName, attrsOf, PART } from '../care.js';
  import { readValue, targetPressure } from '../bikespecs.js';
  import PartFlow from './PartFlow.svelte';
  import { ArrowLeftRight, Wrench, X, Droplet, CircleCheck, TriangleAlert, Ruler, FileText, History, Clock } from '@lucide/svelte';
  import OptionButton from '../ui/OptionButton.svelte';
  import FoldRow from '../ui/FoldRow.svelte';
  import Btn from '../ui/Btn.svelte';
  import { partStatus, isDueState } from './last.js';
  import { timeDue } from '../workshop.js';
  import '../bikes/velo-dlg.css';
  import { t, tn, num as fmtNum, dateOf } from '../i18n.svelte.js';
  import Help from '../ui/Help.svelte'; // FE14
  import { FIELD_HELP, weiter } from '../daumen.js'; // FE14, FE16
  import { historyNewest } from './last.js';
  import { UserRound, Store } from '@lucide/svelte';
  import '../ui/daumen.css'; // FE1: Save stays at the bottom edge of the window on a phone

  /**
   * One part of a bike: measure it, say how it is, see everything that was done to it.
   * onlog(entry) stores a new history entry; the page decides the rest (wishlist, km).
   */
  // v0.48.0: onflow({ entries, problems }) saves a guided replacement or service (PartFlow);
  // onspec(field, value) saves one value of the part's spec sheet; tyres / ontyre: tube or tubeless.
  let { part, bike, by = 'self', onby, onlog, onclose, onflow = null, onspec = null, shops = [], tyres = null, ontyre = null, start = null } = $props();
  // svelte-ignore state_referenced_locally
  let flow = $state(start); // null | 'replace' | 'service'
  let specOpen = $state(false);
  const specFields = $derived([
    { key: 'model', name: 'Model' },
    { key: 'weightG', name: 'Weight', unit: 'g', num: true },
    { key: 'material', name: 'Material' },
    ...attrsOf(part.key).map((a) => ({ key: `attrs.${a.key}`, name: a.name, unit: a.unit, num: a.num })),
    { key: 'notes', name: 'Notes', wide: true },
  ]);
  const specOf = (f) => (f.key.startsWith('attrs.') ? part.attrs?.[f.key.slice(6)] : part[f.key]) ?? '';
  const specFilled = $derived(specFields.filter((f) => String(specOf(f)).trim() !== '').length);
  async function flowSave(x) {
    await onflow?.(x);
    if (x.entries.length && flow === 'service' && dialog?.open) dialog.close();
  }

  // v0.31.0 (answer 10a): who did the work is chosen here (me / bike shop), not at the top of the
  // page; the last choice is preselected and remembered (onby).
  // svelte-ignore state_referenced_locally
  let who = $state(by === 'shop' ? 'shop' : 'self');
  function pick(v) {
    who = v;
    onby?.(v);
  }

  // svelte-ignore state_referenced_locally
  const p = partInfo(part);
  let value = $state('');
  // svelte-ignore state_referenced_locally
  let model = $state(part.model ?? '');
  let note = $state('');
  // svelte-ignore state_referenced_locally
  let limit = $state(p.limit ?? '');
  let extra = $state({});
  const num = (v) => (String(v ?? '').trim() === '' ? null : Number(String(v).replace(',', '.')));
  let error = $state('');
  let dialog;

  $effect(() => {
    dialog.showModal();
  });

  const ACTION = { check: 'Checked', service: 'Serviced', replace: 'Replaced' };
  const RESULT = { ok: 'OK', needed: 'Work needed', done: 'Done' };

  async function log(action, result) {
    const v = num(value);
    if (v != null && !Number.isFinite(v)) return (error = t('Type a number, e.g. 0.4'));
    const lim = num(limit);
    if (lim != null && !Number.isFinite(lim)) return (error = t('Replace at: type a number, e.g. 1.5'));
    const extras = Object.fromEntries((p.extra ?? []).map((k) => [k, num(extra[k])]).filter(([, x]) => x != null && Number.isFinite(x)));
    await onlog({
      date: localDay(),
      km: typeof bike.km === 'number' ? bike.km : null,
      value: v,
      action,
      result,
      by: who,
      model: model.trim() || null,
      note: note.trim(),
      ...extras,
      ...(lim != null && lim !== p.limit ? { limit: lim } : {}),
    });
    // v0.27.0 (Noah 1a): Escape during the save already closed (and unmounted) the dialog.
    if (dialog?.open) dialog.close();
  }

  const hint = $derived(replaceHint(part));
  // v0.65.0: the bike's target pressure beside the pressure fields («Soll 1.6»).
  const target = $derived(part.key === 'tyres' ? targetPressure(bike) : null);
  const targetOf = (k) => (k === 'pressureF' ? target?.f : k === 'pressureR' ? target?.r : null);
  const sinceNew = $derived(kmSince(bike, lastReplace(part)));
  const state = $derived(wear(part));

  // SN7 «Seiten neu» (answer 5a): «What did you do?» as big option buttons, one chosen, then «Eintragen».
  // The due point comes first and is chosen when it is due («Gewachst»); everything else is a tap away.
  // «Replaced» and «Serviced» open the guided steps (PartFlow) when the page has them.
  const st = $derived(partStatus(bike, part, timeDue(bike, tyres ?? undefined)));
  const dueNow = $derived(isDueState(st.state) || st.state === 'soon');
  const today = $derived([t('today'), typeof bike.km === 'number' ? `${fmtNum(bike.km)} km` : ''].filter(Boolean).join(' · '));
  const options = $derived([
    p.service ? { key: 'service', label: t(p.service), sub: today, icon: Droplet, tone: 'blue', run: () => log('service', 'done') } : null,
    !p.service && p.due ? { key: 'due', label: t('{what}: done', { what: t(p.due) }), sub: today, icon: Clock, tone: 'blue', run: () => log('replace', 'done') } : null,
    { key: 'ok', label: t('Checked, OK'), sub: t('nothing to do'), icon: CircleCheck, tone: 'green', run: () => log('check', 'ok') },
    onflow ? { key: 'replace', label: t('Replaced'), sub: p.unit ? t('measure, decide, new part, km') : t('new part, km, who'), icon: ArrowLeftRight, tone: 'green', flow: 'replace' } : { key: 'replace', label: t('Replaced or done'), sub: today, icon: ArrowLeftRight, tone: 'green', run: () => log('replace', 'done') },
    onflow ? { key: 'serviced', label: t('Serviced'), sub: t('what, when, km'), icon: Wrench, tone: 'amber', flow: 'service' } : null,
    { key: 'problem', label: t('Problem|part'), sub: t('replace or work needed'), icon: TriangleAlert, tone: 'purple', run: () => log('check', 'needed') },
  ].filter(Boolean));
  // svelte-ignore state_referenced_locally
  let chosen = $state(dueNow && (p.service || p.due) ? (p.service ? 'service' : 'due') : null);
  const choose = (o) => (o.flow ? (flow = o.flow) : (chosen = o.key));
  const enter = () => options.find((o) => o.key === chosen)?.run?.();
  let measureOpen = $state(false);
  const measureSum = $derived([model.trim(), String(value).trim() ? `${value} ${p.unit}` : '', p.hint ? t(p.hint) : ''].filter(Boolean)[0] ?? t('optional'));
</script>

<!-- Design-Refresh P7 (V8, Noah 12.10.2026 «v5-v10 freigabe»): the part as a window of the bike pages:
     the name, «bike · model» below, ✕ top right; «Done by» as chips; the history folded. -->
<dialog use:keepTyped={'part:' + (bike?.id ?? '') + ':' + (part?.key ?? '')} class="sheet vdlg partdlg from-below" bind:this={dialog} onclose={onclose} aria-labelledby={flow ? 'flow-h' : 'part-h'} use:weiter>
  {#if flow}
    <PartFlow {part} {bike} mode={flow} {shops} {by} onsave={flowSave} oncancel={() => (start ? dialog?.close() : (flow = null))} />
  {:else}
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="part-h">{partName(part)}</h2>
      <p class="vd-sub num">{[bike.name, typeof bike.km === 'number' ? `${fmtNum(bike.km)} km` : '', part.model].filter(Boolean).join(' · ')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog?.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <!-- SN7: what is due stands on top, in a soft box -->
  {#if dueNow && st.next}<p class="duebox" data-due><Clock size={18} aria-hidden="true" /><span><b>{st.state === 'soon' ? t('Soon|part') : t('Due|part')}:</b> {st.next}</span></p>{/if}
  <p class="facts num">
    {#if state}<span class="badge {state}">{state === 'ok' ? t('OK') : state === 'warn' ? t('Soon') : t('Worn|part')}</span>{/if}
    {#if sinceNew != null}{t('{km} km since it was new', { km: fmtNum(sinceNew) })}{:else if bike.km == null}{t("Set the bike's km to count km per part")}{/if}
  </p>
  {#if part.key === 'tyres' && tyres && ontyre}
    <div class="tyres" role="group" aria-label={t('Tube or tubeless')}>
      {#each [['front', 'Front'], ['rear', 'Rear']] as [w, label] (w)}
        <span class="tw"><span class="lbl">{t(label)}</span>
          <span class="seg" role="group" aria-label="{t(label)}: {t('Tube or tubeless')}">
            <button type="button" aria-pressed={tyres[w] === 'tubeless'} onclick={() => ontyre(w, 'tubeless')}>{t('Tubeless')}</button>
            <button type="button" aria-pressed={tyres[w] === 'tube'} onclick={() => ontyre(w, 'tube')}>{t('Tube')}</button>
          </span>
        </span>
      {/each}
    </div>
  {/if}
  <span class="lbl vd-lbl" id="did-l">{t('What did you do?')}</span>
  <div class="dids" role="group" aria-labelledby="did-l">
    {#each options as o (o.key)}<OptionButton size="lg" pressed={chosen === o.key} icon={o.icon} tone={o.tone} label={o.label} sub={o.sub} data-did={o.key} onclick={() => choose(o)} />{/each}
  </div>
  {#if hint}<p class="warnbox soft">{hint}</p>{/if}
  <div class="who" role="group" aria-labelledby="who-l">
    <span class="lbl" id="who-l">{t('Done by')}</span>
    <span class="vd-chips">
      <button type="button" class="vd-chip" aria-pressed={who === 'self'} onclick={() => pick('self')}><UserRound size={16} aria-hidden="true" />{t('me|by')}</button>
      <button type="button" class="vd-chip" aria-pressed={who === 'shop'} onclick={() => pick('shop')}><Store size={16} aria-hidden="true" />{t('bike shop|by')}</button>
    </span>
  </div>
  <div class="vd-folds">
    <!-- SN7: measuring, the model and a note folded («Messen und Modell»); they go with «Eintragen» -->
    <FoldRow icon={Ruler} label={t('Measure and model')} summary={measureSum} bind:open={measureOpen} data-fold="measure">
      {#if p.hint}<p class="hint">{t(p.hint)}</p>{/if}
      <div class="grid">
        <label><span class="lbl">{t('Model')}</span><input class="inp" bind:value={model} placeholder={t('e.g. SRAM GX Eagle 12-speed')} /></label>
        <label><span class="lbl">{t('Measured')}{p.unit ? ` (${p.unit})` : ''}</span><input class="inp num" type="text" inputmode="decimal" bind:value={value} placeholder={p.unit ? t('optional') : t('no measurement')} disabled={!p.unit} /></label>
        {#if p.limit != null}<div><span class="lbl"><label for="pd-limit">{p.lowIsWorn ? t('Replace below ({unit}) on this bike', { unit: p.unit }) : t('Replace at ({unit}) on this bike', { unit: p.unit })}</label> <Help field="pd-limit" text={t(FIELD_HELP.limit)} /></span><input id="pd-limit" class="inp num" type="text" inputmode="decimal" bind:value={limit} /></div>{/if}
        {#each p.extra ?? [] as k (k)}
          <label><span class="lbl">{t(EXTRA[k].name)} ({EXTRA[k].unit})</span><input class="inp num" type="text" inputmode="decimal" bind:value={extra[k]} placeholder={targetOf(k) != null ? `${t('Target')} ${fmtNum(targetOf(k))}` : t('optional')} /></label>
        {/each}
        <label class="wide"><span class="lbl">{t('Note')}</span><input class="inp" bind:value={note} placeholder={t('optional')} /></label>
      </div>
    </FoldRow>
    {#if onspec && (PART[part.key]?.spec || part.key.startsWith('own-'))}
      <!-- v0.48.0 «Teile pro Velo»: the spec sheet of this part (model, weight, material, its values). -->
      <FoldRow icon={FileText} label={t('Spec sheet')} summary={t('{n} of {all} filled', { n: specFilled, all: specFields.length })} bind:open={specOpen} data-fold="spec">
        <div class="grid">
          {#each specFields as f (f.key)}
            <label class:wide={f.wide}><span class="lbl">{t(f.name)}{f.unit ? ` (${f.unit})` : ''}</span><input class="inp" class:num={f.num} type="text" inputmode={f.num ? 'decimal' : 'text'} value={specOf(f)} placeholder="–" onchange={(e) => onspec(f.key, readValue(e.currentTarget.value, f.num))} /></label>
          {/each}
        </div>
      </FoldRow>
    {/if}
    <FoldRow icon={History} label={t('History')} summary={tn(part.history?.length ?? 0, '{n} entry', '{n} entries')} data-fold="history">
      {#if part.history?.length}
        <ol class="hist">
          {#each historyNewest(part.history) as h, n (n)}
            <li>
              <span class="num">{dateOf(h.date)}{h.km != null ? ` · ${fmtNum(h.km)} km` : ''}</span>
              <b>{t(h.action === 'check' ? RESULT[h.result] : h.action === 'replace' && !p.unit ? 'Done' : ACTION[h.action])}{h.value != null ? ` · ${h.value} ${p.unit}` : ''}</b>
              <span class="m">{[h.model, ...Object.keys(EXTRA).filter((k) => h[k] != null).map((k) => `${t(EXTRA[k].name.toLowerCase())} ${h[k]} ${EXTRA[k].unit}`), h.by === 'shop' ? t('bike shop') : h.by === 'self' ? t('me') : '', h.note, h.chf ? `CHF ${h.chf.toFixed(2)}` : ''].filter(Boolean).join(' · ')}</span>
            </li>
          {/each}
        </ol>
      {:else}
        <p class="hint">{t('Nothing recorded yet.')}</p>
      {/if}
    </FoldRow>
  </div>
  <p class="err" role="alert">{error}</p>
  <div class="vd-foot sn7 daumen-foot">
    <Btn kind="quiet" label={t('Cancel')} onclick={() => dialog?.close()} />
    <Btn kind="hi" icon={CircleCheck} label={t('Enter|part')} disabled={!chosen} explain={chosen ? '' : t('Choose first what you did')} onclick={enter} />
  </div>
  {/if}
</dialog>

<style>
  /* SN7: what is due, in a soft box on top; «What did you do?» as big option buttons, two per row */
  .duebox {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin: 0 0 12px;
    padding: 10px 14px;
    border-radius: var(--r-ctl);
    background: var(--warn-soft);
    color: var(--ink);
    font-size: var(--fs-small);
  }
  .duebox :global(svg) {
    flex: none;
    margin-top: 1px;
    color: var(--warn);
  }
  .dids {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin: 0 0 12px;
  }
  @media (max-width: 480px) {
    .dids {
      grid-template-columns: 1fr;
    }
  }
  .tyres {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    margin: 0 0 10px;
  }
  .tw {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .tw .lbl {
    margin: 0;
  }
  .who .vd-chip {
    gap: 6px;
  }
  h2 {
    font-size: var(--fs-section);
    margin: 4px 0 6px;
  }
  .hint {
    font-size: 14px;
    color: var(--ink-3);
    margin: 0 0 8px;
  }
  .facts {
    display: flex;
    gap: 8px;
    align-items: center;
    margin: 0 0 12px;
    font-size: 14px;
  }
  /* v0.40.0 (Noah 6a): badges neutral grey; only an urgent one has a small coloured dot. */
  .badge {
    padding: 1px 8px;
    border-radius: 999px;
    font-weight: 600;
    font-size: var(--fs-small);
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .badge.warn {
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .badge.warn::before {
    content: '';
    display: inline-block;
    width: 7px;
    height: 7px;
    margin-right: 5px;
    border-radius: 50%;
    vertical-align: 1px;
    background: var(--warn);
  }
  .badge.worn {
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .badge.worn::before {
    content: '';
    display: inline-block;
    width: 7px;
    height: 7px;
    margin-right: 5px;
    border-radius: 50%;
    vertical-align: 1px;
    background: var(--bad);
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .wide {
    grid-column: 1 / -1;
  }
  @media (max-width: 480px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
  .err {
    color: var(--bad);
    min-height: 1.2em;
    font-size: 14px;
    margin: 4px 0;
  }
  .warnbox {
    border: 1.5px solid var(--hi);
    background: var(--hi-soft);
    padding: 8px 10px;
    font-size: 14px;
  }
  .who {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    margin: 4px 0;
  }
  .who .lbl {
    margin: 0;
  }
  .seg {
    display: inline-flex;
    border: 1.5px solid var(--line-strong);
    border-radius: 8px;
    overflow: hidden;
  }
  .seg button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 6px 16px;
    border: 0;
    background: var(--paper);
    font: 600 15px var(--font-body);
    color: var(--ink);
    cursor: pointer;
  }
  .seg button + button {
    border-left: 1px solid var(--line);
  }
  .seg button[aria-pressed='true'] {
    background: var(--ink);
    color: var(--paper);
  }
  .hist {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .hist li {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 2px 10px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
    font-size: 14px;
  }
  .hist .m {
    grid-column: 2;
    color: var(--ink-3);
  }
</style>
