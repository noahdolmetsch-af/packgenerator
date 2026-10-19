<script>
  /**
   * AT1 part 2 «Filter» of «Abgeschlossene Touren» (mockup AT1, Noah 14.10.2026 21:19 «at1 freigeben»): the
   * filters of the Strava activities, in the look of the SN4g filter (FilterSheet.svelte): a dialog in two
   * columns on a computer, a sheet from below on a phone. AF1 Velo, AF2 Arbeitsweg, AF3 Distanz and Hm
   * from–to, AF4 only with a power meter, AF5 save under a name. Every choice shows its number of activities
   * (of the period and sport). Nothing is applied before «n Aktivitäten zeigen».
   *
   * filter: the applied filter (actfilter.js); rows: the rows of the period and sport; bikes; saved:
   * [{ id, name, f }]; onapply(filter); onsave(name, filter); ondrop(id); onclose().
   */
  import { t, tn, num } from '../i18n.svelte.js';
  import { backClose } from '../ui/backclose.js';
  import Seg from '../ui/Seg.svelte';
  import { COMMUTES, normActFilter, toggleActBike, filterActs, actChoiceCounts, actChips } from './actfilter.js';
  import { SlidersHorizontal, X, Check, Undo2, Bookmark, Trash2 } from '@lucide/svelte';

  let { filter, rows = [], bikes = [], saved = [], onapply, onsave, ondrop, onclose } = $props();

  // svelte-ignore state_referenced_locally
  let draft = $state(normActFilter($state.snapshot(filter)));
  let name = $state('');
  let dlg = $state();
  $effect(() => {
    if (dlg && !dlg.open) dlg.showModal();
  });

  const counts = $derived(actChoiceCounts(rows));
  const shown = $derived(filterActs(rows, draft).length);
  const liveBikes = $derived(bikes.filter((b) => counts.bikes[b.id] || draft.bikes.includes(b.id)));
  const setRange = (field, i, v) => {
    const next = [...draft[field]];
    next[i] = v === '' ? null : v;
    draft = normActFilter({ ...draft, [field]: next });
  };
  const reset = () => (draft = normActFilter(null));
  function apply() {
    onapply?.(normActFilter($state.snapshot(draft)));
    dlg.close();
  }
  function save() {
    onsave?.(name, normActFilter($state.snapshot(draft)));
    name = '';
  }
</script>

{#snippet range(field, label, unit, id)}
  <div class="rg">
    <span class="rl" id="{id}-l">{label}</span>
    <label class="rin"><span class="sr">{t('from|range')}</span><input type="number" inputmode="numeric" min="0" placeholder="0" value={draft[field][0] ?? ''} oninput={(e) => setRange(field, 0, e.currentTarget.value)} data-range="{field}-from" aria-describedby="{id}-l" /><span class="u">{unit}</span></label>
    <span class="dash" aria-hidden="true">–</span>
    <label class="rin"><span class="sr">{t('to|range')}</span><input type="number" inputmode="numeric" min="0" placeholder={t('any|range')} value={draft[field][1] ?? ''} oninput={(e) => setRange(field, 1, e.currentTarget.value)} data-range="{field}-to" aria-describedby="{id}-l" /><span class="u">{unit}</span></label>
  </div>
{/snippet}

<dialog class="sheet from-below fsheet" bind:this={dlg} use:backClose onclose={() => onclose?.()} onclick={(e) => e.target === dlg && dlg.close()} aria-labelledby="af-h" data-act-filter-sheet>
  <div class="fh">
    <span class="fic" aria-hidden="true"><SlidersHorizontal size={20} /></span>
    <div class="ft"><h2 id="af-h">{t('Filter')}</h2><p>{t('For the Strava activities. Everything can be switched off.')}</p></div>
    <button type="button" class="x" aria-label={t('Close')} onclick={() => dlg.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <div class="fbody">
    <div class="fcol">
      <fieldset class="fs" data-fs="AF1">
        <legend>{t('Bike')}</legend>
        <p class="fsub">{t('the bike the ride ledger counted the activity for')}</p>
        {#if liveBikes.length}
          <div class="chips">
            {#each liveBikes as b (b.id)}
              {@const on = draft.bikes.includes(b.id)}
              <button type="button" class="fchip" aria-pressed={on} data-af="bikes" data-value={b.id} onclick={() => (draft = toggleActBike(draft, b.id))}>{#if on}<Check size={15} aria-hidden="true" />{/if}{b.name}<span class="num">{num(counts.bikes[b.id] ?? 0)}</span></button>
            {/each}
          </div>
        {:else}<p class="fsub">{t('No activity with a bike yet.')}</p>{/if}
      </fieldset>
      <fieldset class="fs" data-fs="AF2">
        <legend>{t('Commute|act')}</legend>
        <p class="fsub">{t('as marked in Strava')}</p>
        <Seg small full={false} label={t('Commute|act')} value={draft.commute} options={COMMUTES.map((c) => ({ key: c.key, name: `${t(c.name)} ${num(counts.commute[c.key])}` }))} onchange={(v) => (draft = normActFilter({ ...draft, commute: v }))} />
      </fieldset>
      <fieldset class="fs" data-fs="AF3">
        <legend>{t('Distance and climbing')}</legend>
        <p class="fsub">{t('from–to, empty is open')}</p>
        {@render range('km', t('Distance'), 'km', 'af-km')}
        {@render range('hm', t('Climbing|hm'), t('Hm|col'), 'af-hm')}
      </fieldset>
    </div>
    <div class="fcol">
      <fieldset class="fs" data-fs="AF4">
        <legend>{t('Power values')}</legend>
        <label class="wsw"><span class="wswt"><b>{t('Only with a power meter')}</b><small>{tn(counts.watts, '{n} activity with a power meter', '{n} activities with a power meter')}</small></span><input type="checkbox" role="switch" checked={draft.watts} onchange={(e) => (draft = normActFilter({ ...draft, watts: e.currentTarget.checked }))} data-watts /></label>
      </fieldset>
      <fieldset class="fs" data-fs="AF5">
        <legend>{t('Save your own filter')}</legend>
        <div class="save">
          <label class="nm"><span class="sr">{t('Name of the filter')}</span><input type="text" bind:value={name} maxlength="40" placeholder={t('e.g. Without commute')} data-save-name /></label>
          <button type="button" class="btn k" disabled={!name.trim() || !actChips(draft).length} onclick={save} data-save><Bookmark size={17} aria-hidden="true" /><span class="kl">{t('Save')}</span></button>
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
    <button type="button" class="btn hi" onclick={apply} data-apply>{tn(shown, 'Show {n} activity', 'Show {n} activities')}</button>
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
