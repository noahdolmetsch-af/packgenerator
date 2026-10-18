<script>
  /** «Bausteine»: the switch of a block (on: on the sheet, in the PDF and in the text; B4 a). */
  let { on = false, label = '', onchange } = $props();
</script>

<button type="button" class="bsw" role="switch" aria-checked={on} aria-label={label} onclick={() => onchange?.(!on)}><span class="knob"></span></button>

<style>
  .bsw {
    position: relative;
    flex: none;
    width: 56px;
    height: 44px;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .bsw::before {
    content: '';
    position: absolute;
    left: 2px;
    right: 2px;
    top: 50%;
    height: 30px;
    transform: translateY(-50%);
    border-radius: 99px;
    background: var(--line);
  }
  .knob {
    position: absolute;
    top: 50%;
    left: 6px;
    width: 22px;
    height: 22px;
    transform: translateY(-50%);
    border-radius: 50%;
    background: var(--input);
    box-shadow: 0 1px 2px var(--shadow);
    transition: left 120ms ease;
  }
  .bsw[aria-checked='true']::before {
    background: var(--accent);
  }
  .bsw[aria-checked='true'] .knob {
    left: 28px;
  }
  .bsw:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-radius: 99px;
  }
</style>
