<script>
  /**
   * v0.127.0 «Tages-Check» 1 (mockups T1, T2): one question on a scale 1–10, one tap. A line under a
   * number marks yesterday's answer; a tap on the chosen number takes it back (every question can be
   * skipped). label: the id of the question's heading.
   */
  import { t } from '../../i18n.svelte.js';

  let { value = null, yesterday = null, label, onpick } = $props();
</script>

<div class="scale" role="group" aria-labelledby={label}>
  {#each Array.from({ length: 10 }, (_, i) => i + 1) as v (v)}
    <button type="button" class="sv num" class:y={yesterday === v} aria-pressed={value === v} aria-label={yesterday === v ? t('{n}, yesterday', { n: v }) : String(v)} onclick={() => onpick(value === v ? null : v)}>{v}</button>
  {/each}
</div>

<style>
  .scale {
    display: grid;
    grid-template-columns: repeat(10, minmax(0, 1fr));
    gap: var(--sp-1);
  }
  .sv {
    position: relative;
    min-width: 0;
    height: 44px;
    padding: 0;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-body) / 1 var(--font-body);
    cursor: pointer;
  }
  /* ten in one row (Noah 9a: one row, never wider): on a small phone a number is narrower than 44 px,
     so an invisible tap area 44 px wide sits centred on it (the app's ::after pattern since v0.27.0) */
  .sv::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: min(0px, calc(50% - 22px));
    right: min(0px, calc(50% - 22px));
  }
  .sv:hover {
    background: var(--paper-2);
  }
  .sv.y {
    box-shadow: inset 0 -3px 0 var(--l2);
  }
  .sv[aria-pressed='true'] {
    border-color: var(--hi);
    background: var(--hi);
    color: var(--hi-ink);
  }
  @media (max-width: 400px) {
    .scale {
      gap: 3px;
    }
    .sv {
      font-size: var(--fs-small);
    }
  }
</style>
