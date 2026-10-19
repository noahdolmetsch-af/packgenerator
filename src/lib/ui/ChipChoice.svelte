<script>
  /**
   * Einheitliche Formulare (Noah 19.10.2026): a choice as chips, the same everywhere (bike, topic, area …).
   *
   *   <Field id="nt-bike" group label={t('Bike')} error={errors.bike}>
   *     {#snippet children(f)}<ChipChoice {...f.attrs} options={bikes.map((b) => ({ value: b.id, label: b.name }))} bind:value={bike} />{/snippet}
   *   </Field>
   *
   * options  [{ value, label }] (labels already translated; typed names stay as typed)
   * value    the chosen value; with `multiple` a list of values
   * One choice: a radio group (arrow keys move and choose, Tab leaves the group). Several: buttons that
   * stay pressed. The chosen chip is filled in ink; touch targets 44 px. Other attributes (aria-*,
   * data-*) go to the group.
   */
  let { options = [], value = $bindable(null), multiple = false, onchange = undefined, ...rest } = $props();

  const isOn = (v) => (multiple ? (value ?? []).includes(v) : value === v);
  function pick(v) {
    value = multiple ? (isOn(v) ? value.filter((x) => x !== v) : [...(value ?? []), v]) : v;
    onchange?.(value);
  }
  // one choice: Tab reaches the chosen chip (or the first); arrows move along and choose
  const tabStop = $derived(multiple ? null : options.some((o) => o.value === value) ? value : options[0]?.value);
  function key(e, i) {
    if (multiple) return;
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const n = (i + step + options.length) % options.length;
    pick(options[n].value);
    e.currentTarget.parentElement?.children[n]?.focus();
  }
</script>

<div class="chipc" role={multiple ? 'group' : 'radiogroup'} {...rest}>
  {#each options as o, i (o.value)}
    {#if multiple}
      <button type="button" class="chipc-c" aria-pressed={isOn(o.value)} onclick={() => pick(o.value)}>{o.label}</button>
    {:else}
      <button type="button" class="chipc-c" role="radio" aria-checked={isOn(o.value)} tabindex={o.value === tabStop ? 0 : -1} onclick={() => pick(o.value)} onkeydown={(e) => key(e, i)}>{o.label}</button>
    {/if}
  {/each}
</div>

<style>
  .chipc {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chipc-c {
    display: inline-flex;
    align-items: center;
    min-height: 40px;
    padding: 6px 14px;
    box-sizing: border-box;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.25 var(--font-body);
    cursor: pointer;
  }
  .chipc-c[aria-pressed='true'],
  .chipc-c[aria-checked='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .chipc-c:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  /* nothing chosen and the form says so: the chips get the red frame of a wrong field */
  .chipc[aria-invalid='true'] .chipc-c {
    border-color: var(--bad);
  }
  @media (pointer: coarse) {
    .chipc-c {
      min-height: 44px;
    }
  }
</style>
