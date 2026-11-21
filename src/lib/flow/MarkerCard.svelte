<script>
  /**
   * «Marker» (Noah 21.11.2026, K1): the card on «Form und Erholung» that lists the days you marked as sick, injured, stress or holiday, newest first,
   * with «Set a marker» to add one. A marker can be changed or deleted (asks first, then «Undo»). Setting training.marker (in the backup).
   */
  import { liveQuery } from 'dexie';
  import { Plus, Pencil, Trash2 } from '@lucide/svelte';
  import { db } from '../db.js';
  import { MARKER_KEY, markerList, withMarker, withoutMarker, saveMarkers, restoreMarkers } from './marker.js';
  import { kindText, periodText, lengthOf } from './markerwords.js';
  import MarkerSheet from './MarkerSheet.svelte';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { localDay } from '../localday.js';
  import { t, tn } from '../i18n.svelte.js';

  let { open = false } = $props();
  const today = localDay();
  const q = liveQuery(() => db.settings.get(MARKER_KEY));
  const list = $derived(markerList($q?.value));
  let sheet = $state(open ? { marker: null } : null); // { marker } while the window is open

  async function save(m) {
    const was = !!m.id;
    const before = await saveMarkers(db, withMarker(list, m));
    offerDone(was ? t('Marker changed.') : t('Marker set: {name}.', { name: `${kindText(m.kind)}, ${periodText({ from: m.from, to: m.to })}` }), () => restoreMarkers(db, before));
  }
  async function remove(m) {
    const answer = await askDelete({
      title: t('Delete the marker «{name}»?', { name: `${kindText(m.kind)}, ${periodText(m)}` }),
      text: t('Only the marker goes. Your activities and values stay.'),
    });
    if (answer !== 'delete') return;
    await deleteWithUndo({ run: () => saveMarkers(db, withoutMarker(list, m.id)), undo: (before) => restoreMarkers(db, before ?? list), text: t('Marker deleted.'), name: kindText(m.kind) });
  }
</script>

<div class="card marker" data-marker-card>
  {#if list.length}
    <ul class="ul">
      {#each list as m (m.id)}
        <li data-marker={m.id}>
          <span class="kd">{kindText(m.kind)}</span>
          <span class="pd">{periodText(m)} · {tn(lengthOf(m), '{n} day', '{n} days')}</span>
          <span class="ac">
            <button type="button" class="btn sm" aria-label={t('Change marker')} onclick={() => (sheet = { marker: m })} data-marker-edit><Pencil size={16} aria-hidden="true" /></button>
            <button type="button" class="btn sm" aria-label={t('Delete marker')} onclick={() => remove(m)} data-marker-delete><Trash2 size={16} aria-hidden="true" /></button>
          </span>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="wait" data-marker-empty>{t('No markers yet. Mark the days you were sick, injured, stressed or on holiday: the evaluations then leave them out of comparisons and can explain what stands out.')}</p>
  {/if}
  <button type="button" class="btn" onclick={() => (sheet = { marker: null })} data-marker-new><Plus size={16} aria-hidden="true" />{t('Set a marker')}</button>
</div>

{#if sheet}
  <MarkerSheet marker={sheet.marker} {today} onsave={save} onclose={() => (sheet = null)} />
{/if}

<style>
  .ul {
    display: grid;
    gap: 8px;
    margin: 0 0 12px;
    padding: 0;
    list-style: none;
  }
  .ul li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    min-height: 44px;
  }
  .kd {
    font-weight: 600;
  }
  .pd {
    color: var(--ink-2);
    flex: 1;
    min-width: 0;
  }
  .ac {
    display: flex;
    gap: 6px;
  }
  .wait {
    margin: 0 0 12px;
    color: var(--ink-2);
  }
</style>
