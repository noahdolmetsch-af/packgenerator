<script>
  /**
   * Mini-Tools «Find a date» (Noah 1.11.2026 «2a»): the maker types in or changes the answer of one person.
   * It stays on this device; the person does not see it. opts: the days; row: { name, picks, note } or null (new);
   * names: names asked but not answered yet (to pick from); fmt(o): a day as text.
   */
  import { t } from '../i18n.svelte.js';
  import { PICKS, optKey, cleanManual } from './termin.js';

  let { opts, row = null, names = [], fmt, onsave, ondelete = null, oncancel } = $props();
  let name = $state('');
  let note = $state('');
  let picks = $state({});
  let err = $state('');
  $effect.pre(() => {
    name = row?.name ?? '';
    note = row?.note ?? '';
    picks = { ...(row?.picks ?? {}) };
  });
  const pickLabel = (k) => t(PICKS.find((p) => p.key === k)?.label ?? 'No answer yet');
  function set(key, v) {
    picks = picks[key] === v ? Object.fromEntries(Object.entries(picks).filter(([k]) => k !== key)) : { ...picks, [key]: v };
  }
  function save(e) {
    e?.preventDefault?.();
    const a = cleanManual({ name, picks, note }, opts);
    if (!a) return (err = name.trim() ? t('Pick at least one answer.') : t('Write a name first.'));
    onsave(a);
  }
</script>

<form class="card de-box" onsubmit={save} aria-labelledby="de-h" data-de>
  <h2 id="de-h">{row ? t('Change the answer of {name}', { name: row.name || t('Without a name') }) : t('Type in an answer')}</h2>
  <p class="de-help">{t('Only you see this. The person does not get a message.')}</p>
  <label class="de-fld"><span>{t('Name')}</span><input type="text" bind:value={name} maxlength="40" data-de-name /></label>
  {#if !row && names.length}
    <div class="de-names" role="group" aria-label={t('Pick a name')}>
      {#each names as n (n)}<button type="button" class="btn sm" onclick={() => (name = n)} data-de-pickname={n}>{n}</button>{/each}
    </div>
  {/if}
  {#each opts as o (optKey(o))}
    <fieldset class="de-day" data-de-day={optKey(o)}>
      <legend>{fmt(o)}</legend>
      <div class="de-picks">
        {#each PICKS as p (p.key)}
          <button type="button" class={`de-pick p-${p.key}`} aria-pressed={picks[optKey(o)] === p.key} onclick={() => set(optKey(o), p.key)} data-de-pick={`${optKey(o)}:${p.key}`}>{pickLabel(p.key)}</button>
        {/each}
      </div>
    </fieldset>
  {/each}
  <label class="de-fld"><span>{t('A note (optional)')}</span><input type="text" bind:value={note} maxlength="200" data-de-note /></label>
  {#if err}<p class="de-err" role="alert" data-de-err>{err}</p>{/if}
  <div class="de-acts">
    <button type="submit" class="btn hi" data-de-save>{t('Save')}</button>
    <button type="button" class="btn" onclick={oncancel}>{t('Cancel')}</button>
    {#if ondelete}<button type="button" class="btn" onclick={ondelete} data-de-delete>{t('Delete answer')}</button>{/if}
  </div>
</form>

<style>
  .de-box { display: grid; gap: var(--sp-2); min-width: 0; border-top: 3px solid var(--accent); }
  .de-box h2 { margin: 0; font-size: var(--fs-sub); text-wrap: balance; }
  .de-help { margin: 0; color: var(--ink-3); font-size: var(--fs-small); }
  .de-fld { display: grid; gap: 4px; }
  .de-fld input { min-width: 0; min-height: 44px; padding: 0 var(--sp-3); border: 1px solid var(--line); border-radius: 10px; background: var(--paper); color: inherit; font: inherit; }
  .de-names, .de-acts { display: flex; flex-wrap: wrap; gap: 6px; }
  .de-day { border: 0; margin: 0; padding: 0; display: grid; gap: 4px; min-width: 0; }
  .de-day legend { padding: 0; font-weight: 700; }
  .de-picks { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
  .de-pick { min-height: 44px; border: 1px solid var(--line); border-radius: 10px; background: var(--paper); color: inherit; font: inherit; cursor: pointer; padding: 0 4px; overflow-wrap: break-word; }
  .de-pick[aria-pressed='true'] { font-weight: 700; border-color: var(--accent); background: var(--paper-2); }
  .de-err { margin: 0; color: var(--bad); }
</style>
