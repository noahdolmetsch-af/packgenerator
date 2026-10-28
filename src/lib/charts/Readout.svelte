<script>
  /**
   * «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): the exact numbers of the bar or day the finger or
   * the mouse points at, in one line over the chart, so the finger covers nothing (phone and computer the
   * same). Without a choice it shows the newest column. title: the day or week; items: [{ label, value, color }].
   */
  let { title = '', items = [] } = $props();
</script>

<div class="ro" aria-live="polite" data-readout>
  <b class="t">{title}</b>
  <span class="vs">
    {#each items as it (it.label)}
      <span class="v"><small>{#if it.color}<i style:background={it.color}></i>{/if}{it.label}</small><b class="num">{it.value}</b></span>
    {/each}
  </span>
</div>

<style>
  .ro {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 16px;
    min-height: 44px;
    padding: 6px 12px;
    border-radius: 12px;
    background: var(--paper-2);
  }
  .t {
    font-size: var(--fs-small);
  }
  .vs {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 14px;
  }
  .v {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
  }
  .v small {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .v i {
    width: 9px;
    height: 9px;
    border-radius: 2px;
  }
  .v b {
    font-size: var(--fs-sub);
  }
</style>
