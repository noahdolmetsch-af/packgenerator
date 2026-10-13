<script>
  /**
   * SN4g «Filter» (mockup SN4g-touren-filter, Noah 13.10.2026 «SN4g–SN4i freigegeben»): the own filters of
   * «Abgeschlossene Touren». A dialog in two columns on a computer, a sheet from below on a phone. FL1 Tourart,
   * FL2 Velo, FL3 Zustand (the same as the chips over the list), FL4 Dauer, FL5 Distanz and Hm from–to, FL6
   * Wetter, FL7 only with power values, FL8 save under a name. Every choice shows its number of trips (of the
   * period). Nothing is applied before «n Touren zeigen»; «Alles zurücksetzen» clears the draft.
   *
   * filter: the applied filter (filter.js); st: the state chip ('all' | 'done' | 'rated'); rows: the rows of the
   * period; ctx: { bikeOf, wattsOf }; states: factStates; bikes; saved: [{ id, name, f }];
   * onapply(filter, st); onsave(name, filter); ondrop(id); onclose().
   */
  import { t, tn, num } from '../i18n.svelte.js';
  import { backClose } from '../ui/backclose.js';
  import StateChips from '../ui/StateChips.svelte';
  import Seg from '../ui/Seg.svelte';
  import { factCounts, matchesState } from '../review/state.js';
  import { KINDS, DURS, WXS, normFilter, toggle, filterRows, choiceCounts, activeCount } from './filter.js';
  import { SlidersHorizontal, X, Check, Undo2, Bookmark, Trash2 } from '@lucide/svelte';

  let { filter, st = 'all', rows = [], ctx = {}, states = {}, bikes = [], saved = [], onapply, onsave, ondrop, onclose } = $props();

  // svelte-ignore state_referenced_locally
  let draft = $state(normFilter($state.snapshot(filter)));
  // svelte-ignore state_referenced_locally
  let dst = $state(st);
  let name = $state('');
  let dlg = $state();
  $effect(() => {
    if (dlg && !dlg.open) dlg.showModal();
  });

  const counts = $derived(choiceCounts(rows, ctx));
  const stCounts = $derived(factCounts(rows, states));
  const shown = $derived(filterRows(rows, draft, ctx).filter((r) => matchesState(states, r.id, dst)).length);
  const kinds = $derived(KINDS.filter((k) => counts.kinds[k.key] || draft.kinds.includes(k.key)));
  const liveBikes = $derived(bikes.filter((b) => !b.archived || counts.bikes[b.id] || draft.bikes.includes(b.id)));
  const pick = (field, value) => (draft = toggle(draft, field, value));
  const setRange = (field, i, v) => {
    const next = [...draft[field]];
    next[i] = v === '' ? null : v;
    draft = normFilter({ ...draft, [field]: next });
  };
  const reset = () => {
    draft = normFilter(null);
    dst = 'all';
  };
  function apply() {
    onapply?.(normFilter($state.snapshot(draft)), dst);
    dlg.close();
  }
  function save() {
    onsave?.(name, normFilter($state.snapshot(draft)));
    name = '';
  }
</script>

{#snippet chip(field, value, label, n)}
  {@const on = draft[field].includes(value)}
  <button type="button" class="fchip" aria-pressed={on} data-fl={field} data-value={value} onclick={() => pick(field, value)}>{#if on}<Check size={15} aria-hidden="true" />{/if}{label}<span class="num">{num(n ?? 0)}</span></button>
{/snippet}

{#snippet range(field, label, unit, id)}
  <div class="rg">
    <span class="rl" id="{id}-l">{label}</span>
    <label class="rin"><span class="sr">{t('from|range')}</span><input type="number" inputmode="numeric" min="0" placeholder="0" value={draft[field][0] ?? ''} oninput={(e) => setRange(field, 0, e.currentTarget.value)} data-range="{field}-from" aria-describedby="{id}-l" /><span class="u">{unit}</span></label>
    <span class="dash" aria-hidden="true">–</span>
    <label class="rin"><span class="sr">{t('to|range')}</span><input type="number" inputmode="numeric" min="0" placeholder={t('any|range')} value={draft[field][1] ?? ''} oninput={(e) => setRange(field, 1, e.currentTarget.value)} data-range="{field}-to" aria-describedby="{id}-l" /><span class="u">{unit}</span></label>
  </div>
{/snippet}

<dialog class="sheet from-below fsheet" bind:this={dlg} use:backClose onclose={() => onclose?.()} onclick={(e) => e.target === dlg && dlg.close()} aria-labelledby="fl-h" data-filter-sheet>
  <div class="fh">
    <span class="fic" aria-hidden="true"><SlidersHorizontal size={20} /></span>
    <div class="ft"><h2 id="fl-h">{t('Filter')}</h2><p>{t('For the list and «In numbers». Everything can be switched off.')}</p></div>
    <button type="button" class="x" aria-label={t('Close')} onclick={() => dlg.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <div class="fbody">
    <div class="fcol">
      <fieldset class="fs" data-fs="FL1">
        <legend>{t('Kind of trip')}</legend>
        <div class="chips">{#each kinds as k (k.key)}{@render chip('kinds', k.key, t(k.name), counts.kinds[k.key])}{/each}</div>
        {#if !kinds.length}<p class="fsub">{t('No trip in this period.')}</p>{/if}
      </fieldset>
      <fieldset class="fs" data-fs="FL2">
        <legend>{t('Bike')}</legend>
        {#if liveBikes.length}<div class="chips">{#each liveBikes as b (b.id)}{@render chip('bikes', b.id, b.name, counts.bikes[b.id])}{/each}</div>{:else}<p class="fsub">{t('No bike yet.')}</p>{/if}
      </fieldset>
      <fieldset class="fs" data-fs="FL3">
        <legend>{t('State|trip')}</legend>
        <p class="fsub">{t('the same as the chips over the list')}</p>
        <StateChips value={dst} counts={stCounts} onchange={(v) => (dst = v)} label={t('State|trip')} />
      </fieldset>
      <fieldset class="fs" data-fs="FL4">
        <legend>{t('Duration')}</legend>
        <Seg small full={false} label={t('Duration')} value={draft.dur} options={DURS.map((d) => ({ key: d.key, name: `${t(d.name)} ${num(counts.dur[d.key])}` }))} onchange={(v) => (draft = normFilter({ ...draft, dur: v }))} />
      </fieldset>
    </div>
    <div class="fcol">
      <fieldset class="fs" data-fs="FL5">
        <legend>{t('Distance and climbing')}</legend>
        <p class="fsub">{t('from–to, empty is open')}</p>
        {@render range('km', t('Distance'), 'km', 'fl-km')}
        {@render range('hm', t('Climbing|hm'), t('Hm|col'), 'fl-hm')}
      </fieldset>
      <fieldset class="fs" data-fs="FL6">
        <legend>{t('Weather')}</legend>
        <p class="fsub">{t('from the forecast saved with the trip')}</p>
        <div class="chips">{#each WXS as w (w.key)}{@render chip('wx', w.key, t(w.name, { n: w.n }), counts.wx[w.key])}{/each}</div>
      </fieldset>
      <fieldset class="fs" data-fs="FL7">
        <legend>{t('Power values')}</legend>
        <label class="wsw"><span class="wswt"><b>{t('Only trips with power values')}</b><small>{tn(counts.watts, '{n} trip with a power meter', '{n} trips with a power meter')}</small></span><input type="checkbox" role="switch" checked={draft.watts} onchange={(e) => (draft = normFilter({ ...draft, watts: e.currentTarget.checked }))} data-watts /></label>
      </fieldset>
      <fieldset class="fs" data-fs="FL8">
        <legend>{t('Save your own filter')}</legend>
        <div class="save">
          <label class="nm"><span class="sr">{t('Name of the filter')}</span><input type="text" bind:value={name} maxlength="40" placeholder={t('e.g. Road bike with power')} data-save-name /></label>
          <button type="button" class="btn k" disabled={!name.trim() || !activeCount(draft)} onclick={save} data-save><Bookmark size={17} aria-hidden="true" /><span class="kl">{t('Save')}</span></button>
        </div>
        <p class="fsub">{t('It then stands under «My filters» above the list, one tap sets it.')}</p>
        {#if saved.length}
          <ul class="saved">
            {#each saved as s (s.id)}<li><span>{s.name}</span><button type="button" class="del" aria-label={t('Delete the filter {name}', { name: s.name })} onclick={() => ondrop?.(s.id)} data-drop={s.id}><Trash2 size={16} aria-hidden="true" /></button></li>{/each}
          </ul>
        {/if}
      </fieldset>
    </div>
  </div>
  <div class="ff">
    <button type="button" class="reset" onclick={reset} data-reset><Undo2 size={16} aria-hidden="true" />{t('Reset all')}</button>
    <button type="button" class="btn hi" onclick={apply} data-apply>{tn(shown, 'Show {n} trip', 'Show {n} trips')}</button>
  </div>
</dialog>

<style>
  .fsheet {
    width: min(860px, calc(100vw - 24px));
    padding: 20px 24px;
  }
  /* SN4g: head and footer stay, only the choices scroll (a sticky footer let the choices cover its buttons on a phone) */
  .fsheet[open] {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .fh {
    display: flex;
    flex: none;
    align-items: flex-start;
    gap: 12px;
  }
  .fic {
    display: grid;
    flex: none;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .ft {
    flex: 1;
    min-width: 0;
  }
  .ft h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .ft p,
  .fsub {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .x {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: var(--paper-2);
    color: var(--ink);
    cursor: pointer;
  }
  .fbody {
    display: grid;
    flex: 1 1 auto;
    gap: 0 32px;
    min-height: 0;
    margin-top: 12px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  @media (min-width: 720px) {
    .fbody {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
  }
  .fcol {
    min-width: 0;
  }
  .fs {
    margin: 0;
    padding: 12px 0;
    border: 0;
    border-bottom: 1px solid var(--line);
    min-width: 0;
  }
  .fs legend {
    float: left;
    width: 100%;
    padding: 0;
    font: 600 var(--fs-body) / 1.35 var(--font-body);
  }
  .fs legend + * {
    clear: left;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }
  .fchip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.2 var(--font-body);
    cursor: pointer;
  }
  .fchip .num {
    color: var(--ink-3);
    font-weight: 400;
  }
  .fchip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .fchip[aria-pressed='true'] .num {
    color: var(--paper);
  }
  .fchip:focus-visible,
  .x:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  .fs :global(.stchips),
  .fs :global(.seg) {
    margin-top: 8px;
  }
  .rg {
    display: grid;
    grid-template-columns: 6.5em minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    margin-top: 8px;
  }
  .rl {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .rin {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    min-height: 44px;
    padding: 0 10px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
    background: var(--paper);
  }
  .rin input {
    flex: 1;
    width: 100%;
    min-width: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: 400 var(--fs-body) / 1.3 var(--font-body);
  }
  .rin input:focus {
    outline: none;
  }
  .rin:focus-within {
    outline: var(--focus-ring);
    outline-offset: 1px;
  }
  .u,
  .dash {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .wsw {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 48px;
    margin-top: 6px;
    cursor: pointer;
  }
  .wswt {
    display: grid;
    min-width: 0;
  }
  .wswt b {
    font-weight: 500;
  }
  .wswt small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .wsw input {
    flex: none;
    width: 24px;
    height: 24px;
    margin: 0;
    accent-color: var(--accent);
  }
  .save {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  .nm {
    flex: 1;
    min-width: 0;
  }
  .nm input {
    width: 100%;
    min-height: 44px;
    box-sizing: border-box;
  }
  .save .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .saved {
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
  }
  .saved li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 44px;
    border-top: 1px solid var(--line);
    font-size: var(--fs-small);
  }
  .del {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .ff {
    display: flex;
    flex: none;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 8px 16px;
    margin: 8px -24px -20px;
    padding: 12px 24px 16px;
    border-top: 1px solid var(--line);
    background: var(--paper);
  }
  .reset {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-body) var(--font-body);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .ff .btn {
    min-height: 44px;
  }
  @media (max-width: 719px) {
    .fsheet {
      padding: 16px var(--gut);
    }
    .ff {
      margin: 8px calc(-1 * var(--gut)) calc(-18px - env(safe-area-inset-bottom));
      padding: 12px var(--gut) calc(12px + env(safe-area-inset-bottom));
    }
    .rg {
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    }
    .rl {
      grid-column: 1 / -1;
    }
  }
</style>
