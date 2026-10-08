<script>
  /**
   * Save the open trip as a template (Noah, 4.10.2026). The name can be changed right away.
   * When the trip came from a template, "Update" overwrites that template (answer 7a).
   * v0.26.1 (AP18, Noah 16a): the dialog then asks "Update template «X»" or "Save as new template"
   * and says in one line what an update changes and that older trips stay as they are.
   */
  import { db } from '../db.js';
  import { saveTripAsTemplate } from '../templates.js';
  import { t } from '../i18n.svelte.js';

  let { trip, templates = [], onclose, onsaved } = $props();

  // svelte-ignore state_referenced_locally
  const source = templates.find((x) => x.id === trip.templateId) ?? null;
  // svelte-ignore state_referenced_locally
  let name = $state(source?.name ?? trip.title);
  let error = $state('');
  let dialog;

  $effect(() => {
    dialog.showModal();
  });

  // v0.24.1: the saving itself lives in templates.js (shared with the offer after a day trip).
  async function store(asNew) {
    const out = await saveTripAsTemplate(db, trip, name, asNew || !source ? null : source.id);
    if (out.error === 'empty') return (error = t('Give the template a name.'));
    if (out.error) return (error = t('There is already a template "{name}". Choose another name.', { name: out.name }));
    onsaved?.(out.name);
    dialog.close();
  }
</script>

<dialog class="sheet" bind:this={dialog} {onclose} aria-labelledby="tpl-h">
  <form onsubmit={(e) => (e.preventDefault(), store(!source))} novalidate>
    <h2 id="tpl-h" class="title">{source ? t('Template') : t('Save as template')}</h2>
    <label class="field"><span class="lbl">{t('Name')}</span><input class="inp" bind:value={name} placeholder={t('e.g. Daily commute')} /></label>
    <p class="note">{t('Saves the bags, every item with its place and amount, the ready check, the kind of ride, the days, the riding hours per day, the overnight stay and the bike. Not saved: the weather and what is ticked.')}</p>
    {#if source}<p class="note upd">{t('Update replaces the items, places and amounts of «{name}» (and its days, hours, overnight stay and bike). Trips made from it before stay unchanged.', { name: source.name })}</p>{/if}
    <p class="err" role="alert">{error}</p>
    <div class="foot">
      {#if source}
        <button type="button" class="btn hi" onclick={() => store(false)}>{t('Update template «{name}»', { name: source.name })}</button>
        <button type="button" class="btn" onclick={() => store(true)}>{t('Save as new template')}</button>
      {:else}
        <button type="submit" class="btn hi">{t('Save template')}</button>
      {/if}
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
    </div>
  </form>
</dialog>

<style>
  h2 {
    font-size: var(--fs-section);
    margin: 0 0 14px;
  }
  .field {
    display: grid;
    gap: 4px;
  }
  .note {
    font-size: 14px;
    color: var(--ink-2);
    margin: 12px 0 0;
  }
  .upd {
    color: var(--ink);
  }
  .err {
    color: var(--bad);
    min-height: 1.2em;
    font-size: 14px;
  }
  .foot {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
</style>
