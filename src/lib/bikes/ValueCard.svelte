<script>
  /**
   * «Bugfix Dateneingabe» D1a (Noah 13.10.2026, «D1–D4 freigegeben», Wert-Karten ★): one value of the
   * Pick-up check as a card, typed right on the sheet. Closed: the name, the value before and the
   * value (or «Enter»); a value taken over or typed is done (green tick). Open: a big field with − and
   * +, «As before» (or «Save» once the value differs) and «Leave empty». Enter (the phone's «Next»)
   * saves and opens the next card.
   * row = { id, label, unit, num, value (number or text or null) }; before: the value before the pick-up.
   */
  import { t, num as fmt } from '../i18n.svelte.js';
  import { Check, Minus, Plus } from '@lucide/svelte';
  import { stepValue } from '../valuefields.js';
  import { readValue } from '../bikespecs.js';

  let { row, before = null, done = false, open = false, disabled = false, onopen, onsave, onskip } = $props();

  const show = (v) => (v == null || v === '' ? '' : typeof v === 'number' ? fmt(v) : String(v));
  const withUnit = (v) => (show(v) ? `${show(v)}${row.unit ? ` ${row.unit}` : ''}` : '');
  let draft = $state('');
  let input = $state();
  $effect(() => {
    if (open) {
      draft = show(row.value ?? before);
      queueMicrotask(() => input?.focus());
    }
  });
  const same = $derived(show(before) === draft.trim());
  function step(dir) {
    const v = readValue(draft || '0', true);
    if (typeof v === 'number') draft = show(stepValue(v, row.unit, dir));
  }
  const save = () => onsave?.(draft.trim() === '' ? before : draft.trim());
  function key(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      save();
    }
  }
</script>

{#if open && !disabled}
  <li class="vcard open">
    <div class="top">
      <span class="dot" aria-hidden="true"></span>
      <label class="l" for="vc-{row.id}"><b>{t(row.label)}</b><small>{before != null ? t('before {value}', { value: withUnit(before) }) : t('no value yet')}</small></label>
    </div>
    <div class="edit">
      {#if row.num}<button type="button" class="st" aria-label={t('One step less')} onmousedown={(e) => e.preventDefault()} onclick={() => step(-1)}><Minus size={20} /></button>{/if}
      <span class="big">
        <input id="vc-{row.id}" bind:this={input} bind:value={draft} inputmode={row.num ? 'decimal' : 'text'} enterkeyhint="next" autocomplete="off" onkeydown={key} />
        {#if row.unit}<small>{row.unit}</small>{/if}
      </span>
      {#if row.num}<button type="button" class="st" aria-label={t('One step more')} onmousedown={(e) => e.preventDefault()} onclick={() => step(1)}><Plus size={20} /></button>{/if}
    </div>
    <div class="acts">
      <button type="button" class="chip hi" onclick={save}><Check size={16} aria-hidden="true" />{same && before != null ? t('As before') : t('Save')}</button>
      <button type="button" class="chip" onclick={() => onskip?.()}>{t('Leave empty')}</button>
    </div>
  </li>
{:else}
  <li class="vcard" class:done>
    <button type="button" class="row" {disabled} aria-label="{t(row.label)}: {withUnit(row.value) || t('Enter|value')}" onclick={() => onopen?.()}>
      {#if done}<span class="ok" aria-hidden="true"><Check size={16} /></span>{:else}<span class="dot" aria-hidden="true"></span>{/if}
      <span class="l"><b>{t(row.label)}</b><small>{before != null ? (done && show(before) === show(row.value) ? t('as before') : t('before {value}', { value: withUnit(before) })) : t('no value yet')}</small></span>
      <span class="vpill" class:add={row.value == null}>{row.value != null ? withUnit(row.value) : t('Enter|value')}</span>
    </button>
  </li>
{/if}

<style>
  .vcard {
    list-style: none;
    margin: 0 0 8px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper);
  }
  .vcard.done {
    background: var(--paper-2);
    border-color: transparent;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 60px;
    padding: 8px 12px;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .row:disabled {
    cursor: default;
  }
  .l {
    flex: 1;
    min-width: 0;
  }
  .l b {
    display: block;
    font-weight: 600;
    line-height: 1.25;
    overflow-wrap: break-word;
  }
  .l small {
    display: block;
    margin-top: 2px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .dot {
    flex: none;
    width: 28px;
    height: 28px;
    border: 2px solid var(--line-strong);
    border-radius: 50%;
  }
  .ok {
    flex: none;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--ok);
    color: var(--hi-ink);
  }
  .vpill {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 92px;
    min-height: 44px;
    padding: 0 14px;
    border-radius: 12px;
    background: var(--paper-2);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .done .vpill {
    background: none;
  }
  .vpill.add {
    background: var(--hi-soft);
    color: var(--hi);
  }
  .vcard.open {
    padding: 12px 14px;
    border: 2px solid var(--hi);
    box-shadow: 0 0 0 4px var(--hi-soft);
  }
  .top {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .edit {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
  }
  .st {
    flex: none;
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border: 1px solid var(--line-strong);
    border-radius: 14px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .big {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 52px;
    padding: 0 10px;
    border: 2px solid var(--hi);
    border-radius: 14px;
    background: var(--paper);
  }
  .big input {
    width: 100%;
    min-width: 0;
    border: 0;
    outline: 0;
    background: none;
    color: var(--ink);
    font: 700 var(--fs-section) / 1 var(--font-body);
    font-variant-numeric: tabular-nums;
    text-align: center;
  }
  .big small {
    flex: none;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 16px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-small) / 1 var(--font-body);
    cursor: pointer;
  }
  .chip.hi {
    border-color: var(--ok);
    background: var(--ok);
    color: var(--hi-ink);
  }
  @media print {
    .vcard {
      border: 0;
      border-bottom: 1px solid var(--line);
      border-radius: 0;
      margin: 0;
    }
    .vpill {
      background: none;
    }
  }
</style>
