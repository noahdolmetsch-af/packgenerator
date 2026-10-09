<script>
  /**
   * v0.24.1 (Noah 4a): after the first debrief of a day trip, offer to keep it as a template, so the
   * next day ride is New → Plan a trip → From template → Create. Shown by Debrief (Saved screen) and
   * Today (after "All good") only when templateOffer() in debrief.js says so. The name starts as
   * "MTB day ride" (templateName) and can be changed. "No thanks" is kept on the trip (tplOffer),
   * so this trip never asks again. Saving uses the same logic as "Save as template" in Pack.
   */
  import { db } from '../db.js';
  import { saveTripAsTemplate } from '../templates.js';
  import { t } from '../i18n.svelte.js';

  let { trip, name: start = '' } = $props();

  // svelte-ignore state_referenced_locally
  let name = $state(start);
  let phase = $state('ask'); // 'ask' | 'saved' | 'gone'
  let savedName = $state('');
  let error = $state('');
  let busy = $state(false);

  async function save(event) {
    event.preventDefault();
    busy = true;
    const out = await saveTripAsTemplate(db, $state.snapshot(trip), name);
    busy = false;
    if (out.error === 'empty') return (error = t('Give the template a name.'));
    if (out.error) return (error = t('There is already a template "{name}". Choose another name.', { name: out.name }));
    savedName = out.name;
    phase = 'saved';
  }
  async function decline() {
    await db.trips.update(trip.id, { tplOffer: 'no' });
    phase = 'gone';
  }
</script>

{#if phase === 'ask'}
  <form class="card offer" onsubmit={save} aria-labelledby="offer-h-{trip.id}">
    <h2 id="offer-h-{trip.id}" class="title">{t('Save as template "{name}"?', { name: name.trim() || start })}</h2>
    <p class="why">{t('Your next day ride then starts with New → Plan a trip → From template.')}</p>
    <label class="field"><span class="lbl">{t('Name')}</span><input class="inp" bind:value={name} oninput={() => (error = '')} /></label>
    {#if error}<p class="err" role="alert">{error}</p>{/if}
    <div class="row">
      <button type="submit" class="btn hi" disabled={busy}>{t('Save template')}</button>
      <button type="button" class="btn" onclick={decline}>{t('No thanks')}</button>
    </div>
  </form>
{:else if phase === 'saved'}
  <p class="card offer ok" role="status">{t('Template "{name}" saved.', { name: savedName })} <a href="#/pack/templates">{t('Show templates')}</a></p>
{/if}

<style>
  .offer {
    margin-top: 12px;
    display: grid;
    gap: 8px;
  }
  .offer h2 {
    font-size: var(--fs-sub);
    margin: 0;
    overflow-wrap: anywhere;
  }
  .why {
    margin: 0;
    color: var(--ink-2);
    font-size: 14px;
  }
  .field {
    display: grid;
    gap: 4px;
  }
  .field .inp {
    min-width: 0;
    max-width: 420px;
  }
  .err {
    margin: 0;
    color: var(--bad);
    font-size: 14px;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .ok {
    display: block;
    border-color: var(--ok);
  }
</style>
