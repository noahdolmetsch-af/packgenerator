<script>
  /**
   * Vorlagen mit Feldern (Noah 27.10.2026 «3b»): fill in one template. Each field the way it fits: a short or
   * long text, a number with its unit, 1 to 5, one choice, a checklist, a date. Nothing is mandatory.
   * «Take over» hands back the text (forms.js formText) and the values (formRecord); the caller saves.
   * form: one template; onsave({ text, record }); onclose().
   */
  import { X, Plus, Trash2 } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import { dayLong } from '../review/fmt.js';
  import { formName, fieldLabel, optionName, emptyValues, filled, formText, formRecord } from './forms.js';

  let { form, onsave, onclose } = $props();
  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  let values = $state(emptyValues(form));
  let adding = $state({});
  const id = (x) => `fs-${form.key}-${x.key}`;
  function addItem(x) {
    const text = String(adding[x.key] ?? '').trim();
    if (!text) return;
    values[x.key] = [...values[x.key], { text, done: false }];
    adding[x.key] = '';
  }
  function take() {
    const v = $state.snapshot(values);
    for (const x of form.fields) if (x.type === 'check' && String(adding[x.key] ?? '').trim()) v[x.key] = [...v[x.key], { text: adding[x.key].trim(), done: false }];
    onsave?.({ text: formText(form, v, t, dayLong), record: formRecord(form, v, t) });
    dialog.close();
  }
</script>

<dialog class="sheet from-below fsh" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="fsh-h" onkeydown={(e) => e.key === 'Enter' && e.target.tagName === 'INPUT' && e.preventDefault()} data-form-sheet={form.key}>
  <div class="fsh-head">
    <div>
      <h2 id="fsh-h">{formName(form, t)}</h2>
      <p class="fsh-sub">{t('Fill in what you like, nothing is mandatory. You can change the text afterwards.')}</p>
    </div>
    <button type="button" class="fsh-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <div class="fsh-fields">
    {#each form.fields as x (x.key)}
      <div class="fsh-f" data-form-field={x.key}>
        {#if x.type === 'scale' || x.type === 'choice'}
          <span class="fsh-l" id={id(x)}>{fieldLabel(x, t)}</span>
          <div class="fsh-chips" role="group" aria-labelledby={id(x)}>
            {#each x.type === 'scale' ? [1, 2, 3, 4, 5] : x.options ?? [] as o (o)}
              <button type="button" class="fsh-c" aria-pressed={values[x.key] === o} onclick={() => (values[x.key] = values[x.key] === o ? (x.type === 'scale' ? null : '') : o)}>{x.type === 'scale' ? o : optionName(x, o, t)}</button>
            {/each}
          </div>
        {:else if x.type === 'check'}
          <span class="fsh-l" id={id(x)}>{fieldLabel(x, t)}</span>
          {#if values[x.key].length}
            <ul class="fsh-items">
              {#each values[x.key] as it, i (i)}
                <li><label><input type="checkbox" bind:checked={it.done} />{it.text}</label><button type="button" class="fsh-x sm" aria-label={t('Remove {name}', { name: it.text })} onclick={() => (values[x.key] = values[x.key].filter((_, j) => j !== i))}><Trash2 size={16} aria-hidden="true" /></button></li>
              {/each}
            </ul>
          {/if}
          <div class="fsh-add">
            <input class="inp" type="text" bind:value={adding[x.key]} placeholder={t('New point')} aria-labelledby={id(x)} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(x))} />
            <button type="button" class="btn sm" onclick={() => addItem(x)}><Plus size={16} aria-hidden="true" />{t('Add')}</button>
          </div>
        {:else}
          <label class="fsh-l" for={id(x)}>{fieldLabel(x, t)}{#if x.unit}<small> ({x.unit})</small>{/if}</label>
          {#if x.type === 'long'}<textarea class="inp" id={id(x)} rows="2" bind:value={values[x.key]}></textarea>
          {:else if x.type === 'number'}<input class="inp num" id={id(x)} type="number" inputmode="decimal" bind:value={values[x.key]} />
          {:else if x.type === 'date'}<input class="inp" id={id(x)} type="date" bind:value={values[x.key]} />
          {:else}<input class="inp" id={id(x)} type="text" bind:value={values[x.key]} />{/if}
        {/if}
      </div>
    {/each}
  </div>
  <div class="fsh-row">
    <button type="button" class="btn hi" disabled={!filled(form, values) && !Object.values(adding).some((v) => String(v ?? '').trim())} onclick={take} data-form-take>{t('Take over')}</button>
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
  </div>
</dialog>

<style>
  .fsh {
    width: min(560px, 100%);
  }
  .fsh-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }
  h2 {
    margin: 0;
  }
  .fsh-sub {
    margin: 4px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .fsh-x {
    display: grid;
    place-items: center;
    flex: none;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .fsh-fields {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-bottom: 16px;
  }
  .fsh-f {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .fsh-l {
    font-weight: 600;
  }
  .fsh-l small {
    color: var(--ink-3);
    font-weight: 400;
  }
  .fsh-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .fsh-c {
    min-width: 44px;
    min-height: 44px;
    padding: 4px 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.25 var(--font-body);
    cursor: pointer;
  }
  .fsh-c[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .fsh-items {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .fsh-items li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .fsh-items label {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
  }
  .fsh-add {
    display: flex;
    gap: 8px;
  }
  .fsh-add .inp {
    flex: 1;
    min-width: 0;
  }
  .fsh-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
