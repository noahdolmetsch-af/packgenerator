<script>
  /**
   * Einheitliche Formulare (Noah 19.10.2026 «1b 2a 3a 4b 5a»): one field of a form, always built the same way.
   *
   *   <Field id="nt-name" label={t('Name')} example={t('e.g. Jura weekend')} error={errors.name}>
   *     {#snippet children(f)}<input class="inp" {...f.attrs} bind:value={name} />{/snippet}
   *   </Field>
   *
   * label    the label above the field, short
   * optional true marks the field «optional» beside the label (2a: only optional fields are marked)
   * example  one line under the field that stays visible while typing («e.g. …»)
   * help     one sentence behind a «?» (ui/Help.svelte)
   * from     where a value the app filled in comes from (green field, class `pre`, see formprefill.js)
   * error    the message at the field (ui/formchecks.js); the form shows it after «Save» (4b)
   * group    true for a group of buttons (ui/ChipChoice.svelte): the label names the group instead of an input
   * The snippet gets f.attrs = { id, aria-invalid, aria-describedby } (group: aria-labelledby too) to spread
   * onto the input, so the label, the example and the message are read out with it.
   */
  import Help from './Help.svelte';
  import { t } from '../i18n.svelte.js';

  let { id, label, optional = false, example = '', help = '', from = '', error = '', group = false, children } = $props();

  const describedby = $derived([error ? `${id}-err` : '', from ? `${id}-from` : '', example ? `${id}-ex` : ''].filter(Boolean).join(' ') || undefined);
  const attrs = $derived({
    id,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': describedby,
    ...(group ? { 'aria-labelledby': `${id}-l` } : {}),
  });
</script>

<div class="fld-u" class:bad={!!error} data-field={id}>
  <div class="fld-h">
    {#if group}<span class="lbl" id="{id}-l">{label}{#if optional}<span class="opt"> · {t('optional|field')}</span>{/if}</span>
    {:else}<label class="lbl" for={id}>{label}{#if optional}<span class="opt"> · {t('optional|field')}</span>{/if}</label>{/if}
    {#if help}<Help field={id} text={help} label={label} />{/if}
  </div>
  {@render children?.({ attrs, invalid: !!error })}
  {#if from}<small class="prefrom" id="{id}-from">{from}</small>{/if}
  {#if example}<small class="fld-ex" id="{id}-ex">{example}</small>{/if}
  {#if error}<p class="fieldmsg" id="{id}-err">{error}</p>{/if}
</div>

<style>
  .fld-u {
    display: block;
    min-width: 0;
    margin: 0 0 14px;
  }
  .fld-h {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 4px;
  }
  .fld-h .lbl {
    margin: 0;
  }
  .opt {
    color: var(--ink-3);
    font-weight: 400;
  }
  .fld-ex {
    display: block;
    margin-top: 4px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  /* a wrong field: a red frame, the message right under it */
  .bad :global(.inp),
  .bad :global(.sel) {
    border-color: var(--bad);
  }
  .bad :global(.fieldmsg) {
    font-weight: 500;
  }
</style>
