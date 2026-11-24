<script>
  /**
   * One number style («Zahlenstil», Noah 24.11.2026 «5a»): the number big and tabular (--fs-num), the unit small beside it,
   * the label quiet underneath. Use it wherever a number stands on its own (sums of a week, a book, a profile, a course),
   * not for a number inside a sentence.
   *
   *   <Stat value={num(guess)} label={t('Guessed')} />
   *   <Stat value={num(km)} unit="km" label={t('This year')} align="center" />
   *
   * value: text of the number (already formatted with num()/hours()). unit: small, after the number. label: one quiet line.
   * align: 'start' | 'center'. Other attributes (data-…) go on the tile.
   */
  let { value, unit = '', label = '', align = 'start', ...rest } = $props();
</script>

<div class="stat {align}" {...rest}>
  <span class="sv"><b class="num">{value}</b>{#if unit}{' '}<small>{unit}</small>{/if}</span>
  {#if label}{' '}<span class="sl">{label}</span>{/if}
</div>

<style>
  .stat {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .stat.center {
    justify-items: center;
    text-align: center;
  }
  .sv {
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    color: var(--ink);
  }
  .sv b {
    font: 700 var(--fs-num) / 1.1 var(--font-body);
    font-variant-numeric: tabular-nums;
  }
  .sv small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .sl {
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: anywhere;
  }
</style>
