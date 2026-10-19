<script>
  /**
   * v0.165.0 «Gipfelbuch für alle» (Noah 15.10.2026 «3a … manuelle eingabe möglich? 5b»): one sheet to
   * put a place into the book, to confirm a suggestion or to change a place. Name, sport, height and
   * day; for «Other» (tennis, yoga …) the activity, no height needed. The name is typed by you (N5 «2a»).
   * place: the values to start from; withDay: ask for the day (a new place or a visit by hand);
   * onsave({ name, sport, ele, day, label, note }) saves, may return a text to show as the error.
   */
  import { tick } from 'svelte';
  import { X } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import DateInput from '../ui/DateInput.svelte';
  import { GB_SPORTS } from '../gipfelbuch.js';
  import { localDay } from '../localday.js';
  import { t } from '../i18n.svelte.js';
  import '../ui/daumen.css';

  let { title, hint = '', place = {}, withDay = true, others = [], onsave, onclose } = $props();

  // svelte-ignore state_referenced_locally
  let f = $state({ name: place.name ?? '', sport: place.sport ?? 'bike', ele: place.ele ?? '', day: place.day ?? localDay(), label: place.label ?? '', note: place.note ?? '' });
  let error = $state('');
  let dialog;
  let input;
  $effect(() => {
    dialog.showModal();
    tick().then(() => input?.focus());
  });

  async function save(e) {
    e?.preventDefault();
    if (!f.name.trim()) {
      error = t('Give it a name.');
      input?.focus();
      return;
    }
    const res = await onsave?.({ ...f, name: f.name.trim(), ele: f.ele === '' ? null : f.ele });
    if (typeof res === 'string') return (error = res);
    dialog.close();
  }
</script>

<dialog class="sheet from-below gbs" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="gbs-h" data-place-sheet>
  <form onsubmit={save} novalidate>
    <div class="head">
      <h2 id="gbs-h">{title}</h2>
      <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    {#if hint}<p class="hint">{hint}</p>{/if}
    <label class="fld"><span class="lbl">{t('Name')}</span><input class="inp" bind:this={input} bind:value={f.name} maxlength="80" autocomplete="off" enterkeyhint="done" placeholder={t('e.g. the name of the pass')} oninput={() => (error = '')} data-gb-name /></label>
    <fieldset class="fld">
      <legend class="lbl">{t('Sport')}</legend>
      <div class="chips">
        {#each GB_SPORTS as s (s.key)}<button type="button" class="chip" aria-pressed={f.sport === s.key} onclick={() => (f.sport = s.key)} data-gb-sport={s.key}>{t(s.name)}</button>{/each}
      </div>
    </fieldset>
    {#if f.sport === 'other'}
      <label class="fld"><span class="lbl">{t('Activity')}</span><input class="inp" bind:value={f.label} list="gbs-acts" maxlength="40" placeholder={t('e.g. Tennis')} data-gb-label /></label>
      <datalist id="gbs-acts">{#each others as o (o)}<option value={o}></option>{/each}</datalist>
    {/if}
    <div class="two">
      <label class="fld"><span class="lbl">{f.sport === 'other' ? t('Height (optional)') : t('Height in m')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={f.ele} maxlength="5" data-gb-ele /></label>
      {#if withDay}<label class="fld"><span class="lbl">{t('Day')}</span><DateInput bind:value={f.day} max={localDay()} /></label>{/if}
    </div>
    <label class="fld"><span class="lbl">{t('Note (optional)')}</span><input class="inp" bind:value={f.note} maxlength="200" /></label>
    {#if error}<p class="err" role="alert">{error}</p>{/if}
    <div class="foot daumen-foot">
      <button type="submit" class="btn hi" data-gb-save>{t('Save')}</button>
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
    </div>
  </form>
</dialog>

<style>
  .gbs {
    width: min(480px, calc(100vw - 24px));
  }
  form {
    display: grid;
    gap: 12px;
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -6px -6px 0 0;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .fld {
    display: grid;
    gap: 4px;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }
  .fld .inp {
    width: 100%;
    min-height: 48px;
  }
  .two {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
    gap: 12px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    min-height: 44px;
    padding: 6px 12px;
    border: 1px solid var(--line-strong);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .hint,
  .err {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .err {
    color: var(--bad);
  }
  .foot {
    display: flex;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  @media (max-width: 719px) {
    .foot .btn.hi {
      flex: 1;
    }
  }
</style>
