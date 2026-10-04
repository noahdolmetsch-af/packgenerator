<script>
  import { db } from '../db.js';
  import { SLOTS } from '../bikes.js';
  import { shrinkImage } from '../photo.js';

  /** bike: the bike to edit, or null for "Add bike". */
  let { bike, bikes, oncreated, onclose } = $props();

  // svelte-ignore state_referenced_locally
  const isNew = !bike;
  // svelte-ignore state_referenced_locally
  let draft = $state(bike ? { name: bike.name, type: bike.type ?? '', use: bike.use ?? '', photo: bike.photo ?? null } : { name: '', type: '', use: '', photo: null });
  let reading = $state(false);
  async function pickPhoto(event) {
    const file = event.currentTarget.files[0];
    event.currentTarget.value = '';
    if (!file) return;
    reading = true;
    error = '';
    try {
      draft.photo = await shrinkImage(file);
    } catch (err) {
      error = err.message || 'This photo could not be read.';
    } finally {
      reading = false;
    }
  }
  let error = $state('');
  let dialog;

  $effect(() => {
    dialog.showModal();
  });

  function newId(name) {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'bike';
    let id = base;
    for (let n = 2; bikes.some((b) => b.id === id); n++) id = `${base}-${n}`;
    return id;
  }

  async function save(event) {
    event.preventDefault();
    const name = draft.name.trim();
    if (!name) return (error = 'Give the bike a name.');
    if (isNew) {
      const id = newId(name);
      await db.bikes.put({ id, name, type: draft.type.trim(), use: draft.use.trim(), gearing: [], openPoints: '', weightG: null, slots: SLOTS.map((s) => s.key), setup: {}, fixtures: [], photo: draft.photo });
      oncreated?.(id);
    } else {
      await db.bikes.update(bike.id, { name, type: draft.type.trim(), use: draft.use.trim(), photo: draft.photo });
      await db.trips.filter((t) => t.bikeId === bike.id).modify({ bike: name });
    }
    dialog.close();
  }

  async function remove() {
    const n = await db.trips.filter((t) => t.bikeId === bike.id).count();
    if (n) return (error = `${n} trip(s) use this bike. Give them another bike first (Pack → Edit trip).`);
    if (!confirm(`Delete the bike "${bike.name}"? A backup file can bring it back.`)) return;
    await db.bikes.delete(bike.id);
    dialog.close();
  }
</script>

<dialog class="sheet" bind:this={dialog} {onclose} aria-labelledby="bike-dlg-h">
  <form onsubmit={save} novalidate>
    <h2 id="bike-dlg-h" class="title">{isNew ? 'Add bike' : 'Bike details'}</h2>
    <div class="grid">
      <label class="wide"><span class="lbl">Name</span><input class="inp" bind:value={draft.name} required /></label>
      <label class="wide"><span class="lbl">Type</span><input class="inp" bind:value={draft.type} placeholder="e.g. Full suspension" /></label>
      <label class="wide"><span class="lbl">What you use it for</span><input class="inp" bind:value={draft.use} /></label>
      <div class="wide photo">
        <span class="lbl">Photo <small>shown in Pack behind the bags; side view works best</small></span>
        {#if draft.photo}<img src={draft.photo} alt="{draft.name}" />{/if}
        <div class="pacts">
          <label class="btn sm">{reading ? 'Reading…' : draft.photo ? 'Other photo' : 'Choose photo'}<input type="file" accept="image/*" onchange={pickPhoto} hidden /></label>
          {#if draft.photo}<button type="button" class="btn sm" onclick={() => (draft.photo = null)}>Remove photo</button>{/if}
        </div>
      </div>
    </div>
    <p class="err" role="alert">{error}</p>
    <div class="foot">
      <button type="submit" class="btn hi">{isNew ? 'Add bike' : 'Save'}</button>
      <button type="button" class="btn" onclick={() => dialog.close()}>Cancel</button>
      {#if !isNew}<button type="button" class="btn del" onclick={remove}>Delete bike</button>{/if}
    </div>
  </form>
</dialog>

<style>
  h2 {
    font-size: 32px;
    margin: 0 0 14px;
  }
  .grid {
    display: grid;
    gap: 12px;
  }
  .photo {
    display: grid;
    gap: 6px;
  }
  .photo small {
    text-transform: none;
    letter-spacing: 0;
    font-weight: 400;
  }
  .photo img {
    width: 100%;
    max-height: 220px;
    object-fit: contain;
    border-radius: 6px;
    background: var(--paper-2, #e6ebe3);
  }
  .pacts {
    display: flex;
    gap: 8px;
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
  .del {
    margin-left: auto;
    border-color: #b42318;
    color: #b42318;
  }
</style>
