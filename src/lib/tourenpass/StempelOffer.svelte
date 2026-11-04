<script>
  /**
   * «Tourenpass mit Stempel» (Paket E, Idee 18): on the saved Rückblick of a trip. The stamp is offered with the
   * trip's title as place (changeable); «Stamp» presses it into the tour pass, «No stamp» leaves it out (the page
   * Tourenpass still lists the trip). A stamped trip shows its stamp and the way to the pass.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { putSetting } from '../flowdb.js';
  import { t, locale } from '../i18n.svelte.js';
  import { PASS_KEY, stateOf, proposal, stamp, stampOfTrip, isDeclined, decline } from './pass.js';
  import Stempel from './Stempel.svelte';
  import { offerDone } from '../ui/rename.svelte.js';
  import { Stamp, X, ChevronRight } from '@lucide/svelte';

  let { trip, km = null } = $props();

  const setQ = liveQuery(async () => ({ v: (await db.settings.get(PASS_KEY))?.value }));
  const st = $derived(stateOf($setQ?.v));
  const have = $derived(stampOfTrip(st, trip.id));
  const prop = $derived(proposal(trip, km));
  let place = $state(null);
  const name = $derived(place ?? prop.place);
  let fresh = $state(false);
  const dayText = (d) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }) : '');
  const save = (next) => putSetting(db, PASS_KEY, next);

  async function press() {
    if (!name.trim()) return;
    fresh = true;
    await save(stamp(st, trip, { place: name, km: prop.km }));
  }
  async function leave() {
    const before = st;
    await save(decline(st, trip.id));
    offerDone(t('No stamp for this trip. You can still stamp it under Look back › Tour pass.'), () => save(before));
  }
</script>

{#if !$setQ}
  <!-- loading: nothing yet, so a stamped trip never flashes the offer -->
{:else if have}
    <section class="rv-sec off done" aria-labelledby="so-h" data-stamp-done>
      <div class="rv-h"><div><h2 id="so-h">{t('In your tour pass')}</h2></div></div>
      <div class="row">
        <Stempel id={have.id} place={have.place} date={dayText(have.date)} km={have.km} press={fresh} />
        <a class="lk" href="#/debrief/tourenpass">{t('Open the tour pass')}<ChevronRight size={14} aria-hidden="true" /></a>
      </div>
    </section>
{:else if !isDeclined(st, trip.id) && prop.place}
    <section class="rv-sec off" aria-labelledby="so-h" data-stamp-offer>
      <div class="rv-h"><div><h2 id="so-h">{t('A stamp for your tour pass?')}</h2><p class="rv-sub">{t('Place, day and km of this trip, pressed into your collection. Change the place if you like.')}</p></div></div>
      <div class="row">
        <Stempel id={`s-${trip.id}`} place={name || '…'} date={dayText(prop.date)} km={prop.km} />
        <div class="form">
          <label for="so-place">{t('Place or tour')}</label>
          <input id="so-place" value={name} oninput={(e) => (place = e.currentTarget.value)} maxlength="60" data-stamp-place />
          <div class="acts">
            <button type="button" class="btn hi" onclick={press} disabled={!name.trim()} data-stamp-press><Stamp size={16} aria-hidden="true" />{t('Stamp')}</button>
            <button type="button" class="btn" onclick={leave} data-stamp-leave><X size={16} aria-hidden="true" />{t('No stamp')}</button>
          </div>
        </div>
      </div>
    </section>
  {/if}


<style>
  .off {
    margin-top: var(--sp-4);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-4);
  }
  .form {
    display: grid;
    gap: 6px;
    flex: 1 1 220px;
    min-width: 0;
  }
  label {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  input {
    min-height: 44px;
    padding: 0 10px;
    border: 1px solid var(--card-line);
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .lk {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
</style>
