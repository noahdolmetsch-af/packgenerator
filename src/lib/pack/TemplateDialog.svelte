<script>
  /**
   * Save the open trip as a template (Noah, 4.10.2026). The name can be changed right away.
   * When the trip came from a template, "Update" overwrites that template (answer 7a).
   */
  import { db } from '../db.js';
  import { loadTemplates, saveTemplates, templateFrom, upsert } from '../templates.js';

  let { trip, templates = [], onclose, onsaved } = $props();

  // svelte-ignore state_referenced_locally
  const source = templates.find((t) => t.id === trip.templateId) ?? null;
  // svelte-ignore state_referenced_locally
  let name = $state(source?.name ?? trip.title);
  let error = $state('');
  let dialog;

  $effect(() => {
    dialog.showModal();
  });

  async function store(asNew) {
    const clean = name.trim();
    if (!clean) return (error = 'Give the template a name.');
    const list = await loadTemplates(db);
    const id = asNew || !source ? `tpl-${Date.now().toString(36)}` : source.id;
    if (list.some((t) => t.id !== id && t.name.toLowerCase() === clean.toLowerCase())) return (error = `There is already a template "${clean}". Choose another name.`);
    await saveTemplates(db, upsert(list, templateFrom(trip, { id, name: clean })));
    await db.trips.update(trip.id, { templateId: id });
    onsaved?.(clean);
    dialog.close();
  }
</script>

<dialog class="sheet" bind:this={dialog} {onclose} aria-labelledby="tpl-h">
  <form onsubmit={(e) => (e.preventDefault(), store(!source))} novalidate>
    <h2 id="tpl-h" class="title">{source ? 'Template' : 'Save as template'}</h2>
    <label class="field"><span class="lbl">Name</span><input class="inp" bind:value={name} placeholder="e.g. Daily commute" /></label>
    <p class="note">Saves the bags, every item with its place and amount, the ready check, the kind of ride, the riding hours and the night sets. Not saved: the weather, what is ticked and the bike.</p>
    <p class="err" role="alert">{error}</p>
    <div class="foot">
      {#if source}
        <button type="button" class="btn hi" onclick={() => store(false)}>Update "{source.name}"</button>
        <button type="button" class="btn" onclick={() => store(true)}>Save as new template</button>
      {:else}
        <button type="submit" class="btn hi">Save template</button>
      {/if}
      <button type="button" class="btn" onclick={() => dialog.close()}>Cancel</button>
    </div>
  </form>
</dialog>

<style>
  h2 {
    font-size: 32px;
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
  .err {
    color: #b42318;
    min-height: 1.2em;
    font-size: 14px;
  }
  .foot {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
</style>
