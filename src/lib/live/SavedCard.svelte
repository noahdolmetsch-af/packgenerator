<script>
  /**
   * «Gespeichert in Touren» (Noah 28.10.2026, Handy-Test: «unklar, ob und wo die Tour gespeichert ist»;
   * name «b Automatisch, Umbenennen später»): after a ride a clear card says where it is, under which
   * name, opens it and renames it in place (with Undo).
   */
  import { CircleCheck, Pencil } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { db } from '../db.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { tourHref } from '../touren/tour.js';
  import LiveLabel from './LiveLabel.svelte';

  let { saved, trip = null } = $props();

  let name = $state(saved?.name ?? '');
  let editing = $state(false);
  let draft = $state('');
  const openHref = $derived(trip?.id ? tourHref(`t:${trip.id}`) : `#/debrief/ride/${encodeURIComponent(saved?.id ?? '')}`);

  function edit() {
    draft = name;
    editing = true;
  }
  async function keep() {
    const next = draft.trim();
    editing = false;
    if (!next || next === name || !saved?.id) return;
    const old = name;
    name = next;
    await db.rides.update(saved.id, { name: next });
    offerDone(t('Renamed to «{name}».', { name: next }), async () => {
      name = old;
      await db.rides.update(saved.id, { name: old });
    });
  }
</script>

<div class="lv-saved" role="status" data-live-saved>
  <CircleCheck size={28} aria-hidden="true" />
  <div class="lv-saved-main">
    <b>{t('Saved in Trips')} <LiveLabel /></b>
    {#if editing}
      <form
        class="lv-saved-edit"
        onsubmit={(e) => {
          e.preventDefault();
          keep();
        }}
      >
        <label class="sr" for="lv-saved-name">{t('Name')}</label>
        <!-- svelte-ignore a11y_autofocus -->
        <input id="lv-saved-name" class="inp" bind:value={draft} autofocus data-live-saved-input />
        <button type="submit" class="btn sm hi" data-live-saved-keep>{t('Save')}</button>
        <button type="button" class="btn sm" onclick={() => (editing = false)}>{t('Cancel')}</button>
      </form>
    {:else}
      <span class="lv-saved-name" data-live-saved-name>«{name}»</span>
    {/if}
    <small>{trip?.id ? t('In Trips with the tour, under «Live Navigation».') : t('In Trips as its own entry «Live Navigation».')}</small>
    <span class="lv-saved-acts">
      <a class="btn sm hi" href={openHref} data-live-saved-open>{t('Open')}</a>
      {#if !editing}<button type="button" class="btn sm" onclick={edit} data-live-saved-rename><Pencil size={16} aria-hidden="true" />{t('Rename')}</button>{/if}
      <a class="btn sm" href="#/trips" data-live-saved-link>{t('Open Trips')}</a>
    </span>
  </div>
</div>

<style>
  .lv-saved {
    display: flex;
    gap: var(--sp-2);
    align-items: flex-start;
    padding: var(--sp-3);
    border: 2px solid var(--accent);
    border-radius: var(--radius-card);
    background: var(--accent-soft);
    color: var(--accent);
    margin: var(--sp-2) 0;
  }
  .lv-saved-main {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    flex: 1;
    color: var(--ink);
  }
  .lv-saved-main b {
    font-size: var(--fs-section);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-1);
  }
  .lv-saved-name {
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .lv-saved-main small {
    color: var(--ink-2);
  }
  .lv-saved-acts,
  .lv-saved-edit {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-1);
    margin-top: 4px;
  }
  .lv-saved-edit .input {
    flex: 1 1 12rem;
    min-width: 0;
  }
</style>
