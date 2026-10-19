<script>
  /**
   * Einheitliche Formulare (Noah 19.10.2026 «1b 2a 3a 4b 5a»): the frame of every form that makes or changes
   * an entry, in a window or on a page. Fields inside are ui/Field.svelte.
   *
   *   <Form check={() => checkAll({ name: [name, { field: t('a name'), required: true }] }, t)} bind:errors
   *         onsave={save} oncancel={back} saveLabel={t('Create trip idea')}>
   *     …<Field … error={errors.name}>…
   *   </Form>
   *
   * - «Save» is always pressable (3a). It checks first; wrong fields show their message at the field only
   *   now (4b), a line above the buttons counts them («2 entries are missing …») and the cursor jumps to
   *   the first one. From then on a message goes away as soon as its field is right.
   * - While saving, «Save» is locked (no double entries). When saving fails, a message stands at the top
   *   and what was typed stays (thread «Rückmeldungen beim Speichern», F6 and F7).
   * - Enter in a field saves (a real form); Escape and back close the window (its own backClose/keepTyped).
   * - The buttons sit at the bottom: «Cancel» quiet on the left, «Save» as the one main button on the right,
   *   named by what it does. On a phone they stay at the bottom edge of the window (ui/daumen.css).
   * check()  → { name: message } of the wrong fields (ui/formchecks.js checkAll); errors is bound back.
   * onsave() may be async; a throw shows the message at the top. oncancel: leave out to show no «Cancel».
   */
  import { tick } from 'svelte';
  import Btn from './Btn.svelte';
  import { t, tn } from '../i18n.svelte.js';
  import './daumen.css';

  let { check = () => ({}), errors = $bindable({}), onsave, oncancel = null, saveLabel, saveIcon = null, cancelLabel = '', cancelIcon = null, class: cls = '', children, ...rest } = $props();

  let form;
  let tried = $state(false);
  let busy = $state(false);
  let failed = $state('');
  const count = $derived(Object.keys(errors ?? {}).length);

  // after the first «Save»: every change checks again, so a message leaves as soon as its field is right
  $effect(() => {
    if (tried) errors = check();
  });

  function focusFirst() {
    const el = form?.querySelector('[aria-invalid="true"]');
    if (!el) return;
    const target = el.matches('input, textarea, select, button') ? el : el.querySelector('[tabindex="0"], button, input, textarea, select');
    target?.focus();
    target?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    tried = true;
    const found = check();
    errors = found;
    if (Object.keys(found).length) {
      await tick();
      focusFirst();
      return;
    }
    busy = true;
    failed = '';
    try {
      await onsave?.();
      tried = false;
    } catch (err) {
      failed = err?.name === 'QuotaExceededError' ? t("This device's storage is full. Delete old photos or rides, or free up space in the browser. What you typed stays here.") : t("Saving didn't work. What you typed stays here. Try again. If it fails again: Me › Data and backup › Save backup, then reload the page.");
    } finally {
      busy = false;
    }
  }
</script>

<form class="form-u {cls}" bind:this={form} onsubmit={submit} novalidate {...rest}>
  {#if failed}<p class="form-fail" role="alert">{failed}</p>{/if}
  {@render children?.()}
  {#if tried && count}<p class="form-sum" role="alert">{tn(count, '{n} entry is missing or wrong. It is marked in red.', '{n} entries are missing or wrong. They are marked in red.')}</p>{/if}
  <div class="form-foot daumen-foot">
    {#if oncancel}<Btn kind="quiet" icon={cancelIcon} label={cancelLabel || t('Cancel')} onclick={oncancel} data-keeps />{/if}
    <Btn kind="hi" type="submit" icon={saveIcon} label={saveLabel || t('Save')} disabled={busy} aria-busy={busy || undefined} />
  </div>
</form>

<style>
  .form-u {
    display: block;
    min-width: 0;
  }
  .form-fail {
    margin: 0 0 12px;
    padding: 10px 14px;
    border-radius: var(--r-ctl);
    background: var(--bad-soft);
    color: var(--ink);
    font-size: var(--fs-small);
  }
  .form-sum {
    margin: 4px 0 0;
    color: var(--bad);
    font-size: var(--fs-small);
    font-weight: 500;
  }
  .form-foot {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid var(--line);
  }
  .form-foot :global(.btn-link) {
    margin-right: auto;
  }
</style>
