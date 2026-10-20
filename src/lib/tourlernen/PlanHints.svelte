<script>
  /**
   * Paket Z on Planen of a trip (Noah 20.10.2026): what earlier tours taught, as quiet suggestions.
   *   - 1120: «Letztes Mal: Platten» → the matching spare parts from your gear, one tap adds one;
   *     «Nicht mehr vorschlagen» hides that kind for this trip.
   *   - 1122: «Deine Schlafplätze hier»: your rated places to sleep near the route.
   * Nothing shows when there is nothing to say.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { touched, slotFor } from '../trips.js';
  import { t, num, nameOf } from '../i18n.svelte.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { ownQuery } from '../map/ownpoints.js';
  import { spareHints, spotsNear, starText } from './tourlernen.js';
  import { Wrench, BedDouble, Plus, X } from '@lucide/svelte';

  let { trip, trips = [], items = [] } = $props();
  const pointsQ = ownQuery();
  const hints = $derived(spareHints(trip, trips, items));
  const spots = $derived(spotsNear($pointsQ ?? [], trip));
  const save = (fields) => db.trips.update(trip.id, touched(fields));

  async function add(item) {
    const before = $state.snapshot(trip.entries ?? []);
    await save({ entries: [...before, { itemId: item.id, slot: slotFor(item.defaultBag, trip.setup), qty: 1, packed: false }] });
    offerDone(t('"{name}" is on the list.', { name: nameOf(item) }), () => save({ entries: before }));
  }
  async function skip(kind) {
    const before = $state.snapshot(trip.spareSkip ?? []);
    await save({ spareSkip: [...before, kind] });
    offerDone(t('Not suggested again for this trip.'), () => save({ spareSkip: before }));
  }
</script>

{#if !trip.finished && (hints.length || spots.length)}
  <section class="card phint" aria-label={t('From earlier tours')} data-plan-learn>
    {#each hints as h (h.kind)}
      <div class="row" data-spare-hint={h.kind}>
        <Wrench size={18} aria-hidden="true" />
        <div class="txt">
          <b>{t('Last time: {what}', { what: t(h.name) })}</b>
          <span class="tp-small tp-muted">{h.from.title}{#if h.part}{' · '}{h.part}{/if}</span>
          <span class="tp-chips">
            {#each h.items as i (i.id)}<button type="button" class="tp-chip" onclick={() => add(i)} data-spare-add={i.id}><Plus size={14} aria-hidden="true" />{nameOf(i)}</button>{/each}
          </span>
          <button type="button" class="tp-link sm" onclick={() => skip(h.kind)}><X size={14} aria-hidden="true" />{t('Do not suggest again')}</button>
        </div>
      </div>
    {/each}
    {#if spots.length}
      <div class="row" data-sleep-near>
        <BedDouble size={18} aria-hidden="true" />
        <div class="txt">
          <b>{t('Your places to sleep here')}</b>
          <ul>
            {#each spots.slice(0, 5) as p (p.id)}
              <li><span class="stars">{starText(p.stars)}</span>{' '}{p.name || t('Place to sleep')}{#if p.note}{' · '}<span class="tp-muted">{p.note}</span>{/if}{' · '}<span class="tp-muted">{t('{km} km from the route', { km: num(Math.round(p.km)) })}</span></li>
            {/each}
          </ul>
        </div>
      </div>
    {/if}
  </section>
{/if}

<style>
  .phint {
    display: grid;
    gap: 10px;
    padding: 12px 14px;
    margin: 12px 0;
  }
  .row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  .row + .row {
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }
  .row > :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .txt {
    display: grid;
    gap: 4px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .txt ul {
    margin: 0;
    padding-left: 18px;
  }
  .stars {
    color: var(--warn);
  }
  .sm {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
</style>
