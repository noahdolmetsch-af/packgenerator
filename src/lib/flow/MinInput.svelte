<script>
  /**
   * «Eigene Dauer» (Noah 21.11.2026, Thread «Training erfassen vereinfachen»: «für alle Aktivitäten möchte ich neben den vorgeschlagenen Buttons
   * immer zusätzlich die Option, eine eigene Dauer in Min einzugeben»): a small field next to every row of duration buttons.
   * Whole minutes, 1 to 1440; «Enter» or «Set» saves. When the saved length is not one of the buttons, it stands in the field.
   * `value` is the minutes now (or null), `chips` the buttons next to it, `onset(minutes)` is called with a valid number.
   */
  import { t } from '../i18n.svelte.js';
  import { parseMinutes, MAX_MIN } from './feel.js';

  let { value = null, chips = [], onset, id = 'own-min' } = $props();
  const own = $derived(Number.isFinite(value) && value > 0 && !chips.includes(value) ? String(value) : '');
  let draft = $state('');
  let bad = $state(false);
  $effect(() => {
    draft = own;
    bad = false;
  });
  const save = () => {
    const n = parseMinutes(draft);
    bad = n == null && draft.trim() !== '';
    if (n != null) onset?.(n);
  };
</script>

<div class="own" data-own-min>
  <label for={id}>{t('Own length')}</label>
  <input
    {id}
    type="text"
    inputmode="numeric"
    autocomplete="off"
    maxlength="4"
    placeholder={t('e.g. 75')}
    bind:value={draft}
    aria-invalid={bad}
    aria-describedby="{id}-hint"
    onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), save())}
    data-own-min-input
  />
  <span class="u">{t('min|unit')}</span>
  <button type="button" class="set" onclick={save} data-own-min-set>{t('Set|min')}</button>
  <small id="{id}-hint" class:bad data-own-min-hint>{bad ? t('Whole minutes from 1 to {max}.', { max: MAX_MIN }) : ''}</small>
</div>

<style>
  .own { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  label { flex: none; min-width: 5.5em; color: var(--ink-2); font-size: var(--fs-small); font-weight: 600; }
  input { width: 6em; min-height: 44px; padding: 0 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--paper); color: var(--ink); font: 600 var(--fs-small) var(--font-body); }
  input[aria-invalid='true'] { border-color: var(--bad); }
  .u { color: var(--ink-2); font-size: var(--fs-small); }
  .set { min-height: 44px; padding: 0 16px; border: 1px solid var(--line); border-radius: 99px; background: var(--paper); color: var(--ink); font: 600 var(--fs-small) var(--font-body); cursor: pointer; }
  small { flex-basis: 100%; min-height: 1em; color: var(--ink-2); font-size: var(--fs-small); }
  small.bad { color: var(--bad); }
</style>
