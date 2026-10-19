<script>
  /**
   * Paket 4 «Haus-Check vor der Abfahrt» (Noah 19.10.2026 «1a»): your own checklist for the flat, ticked
   * per trip; on the sheet «Vor der Abfahrt». haus.js holds the rules.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { HOUSE_KEY, houseOf, houseLabel, addHouse, renameHouse, dropHouse, moveHouse, toggleHouse, resetHouse, doneOf, houseCount, houseValue } from './haus.js';
  import LinesEdit from './LinesEdit.svelte';
  import { House, RotateCcw } from '@lucide/svelte';

  let { tripId = null } = $props();
  const q = liveQuery(() => db.settings.get(HOUSE_KEY));
  const state = $derived(houseOf($q?.value));
  const done = $derived(doneOf(state, tripId));
  const count = $derived(houseCount(state, tripId));
  const save = (s) => db.settings.put({ key: HOUSE_KEY, value: houseValue(s) });
  const label = (x) => houseLabel(x, t);
  let before = null;
</script>

<section class="card" aria-labelledby="house-h" data-house>
  <h2 id="house-h" class="sh"><House size={18} aria-hidden="true" /> {t('House check')} <small class="tp-muted">{t('{done} of {all}', { done: count.done, all: count.all })}</small></h2>
  <p class="tp-small tp-muted">{t('Before you lock the door: tick what is done. The ticks belong to this trip; your list stays for the next one.')}</p>
  <LinesEdit
    name="house"
    items={state.items}
    {label}
    {done}
    addLabel="e.g. Blinds down"
    ontoggle={(id) => save(toggleHouse(state, tripId, id))}
    onadd={(text) => save(addHouse(state, text) ?? state)}
    onrename={(id, text) => save(renameHouse(state, id, text))}
    ondrop={(id) => ((before = state), save(dropHouse(state, id)))}
    onundo={() => before && save(before)}
    onmove={(from, to) => save(moveHouse(state, from, to))}
  />
  {#if count.done}<button type="button" class="tp-link" onclick={() => save(resetHouse(state, tripId))}><RotateCcw size={14} aria-hidden="true" /> {t('Untick all')}</button>{/if}
</section>

<style>
  .sh {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 6px;
  }
  .sh small {
    margin-left: auto;
    font-weight: 400;
  }
  section > p {
    margin: 0 0 8px;
  }
</style>
