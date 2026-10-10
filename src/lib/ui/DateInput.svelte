<script>
  /**
   * v0.67.1 (fix: «Neue Tour» showed 10/10/2026): the browser draws a date field in the format of
   * the phone's own language, not the app's. This field keeps the browser's date picker (tap opens
   * it) but shows the date as the app writes it, «Sa., 10. Okt. 2026» or «Sat 10 Oct 2026».
   * value: YYYY-MM-DD; bind:value or onchange(value). Other attributes go to the input.
   */
  import { t, locale } from '../i18n.svelte.js';

  let { value = $bindable(''), onchange, class: cls = 'inp', ...rest } = $props();

  const shown = $derived.by(() => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
    return new Date(`${value}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  });

  // a click anywhere on the field opens the picker (on the computer the browser only opens it from its icon)
  function pick(e) {
    try {
      e.currentTarget.showPicker?.();
    } catch {
      /* not allowed here (no user gesture or not supported): the browser's own field still works */
    }
  }
</script>

<span class="date-in">
  <input
    {...rest}
    class="{cls} raw"
    type="date"
    bind:value
    onclick={pick}
    onchange={(e) => onchange?.(e.currentTarget.value)}
  />
  <span class="shown" aria-hidden="true">{shown || t('Choose a date')}</span>
</span>

<style>
  .date-in {
    position: relative;
    display: block;
    min-width: 0;
  }
  /* the browser's own text is hidden; its picker icon and its behaviour stay */
  .raw {
    color: transparent;
  }
  .raw::-webkit-datetime-edit {
    color: transparent;
  }
  .raw:focus-visible::-webkit-datetime-edit {
    color: transparent;
  }
  .shown {
    position: absolute;
    left: 12px;
    right: 40px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--ink);
    font: 400 var(--fs-body) var(--font-body);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
