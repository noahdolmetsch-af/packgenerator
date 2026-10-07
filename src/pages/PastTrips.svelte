<script>
  /**
   * Past trips (v0.25.1, Noah 3a): every finished trip, newest first, from Today's Trips tile
   * (#/pack/past). Per trip: dates, days, bike, km (from the debrief), items and whether the debrief
   * is done. Tapping a trip opens it in Pack; "Write debrief" opens its debrief.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { pastTrips } from '../lib/hubs.js';
  import { openTrip } from '../lib/nav.js';
  import { domainOf, domainName, hasBike } from '../lib/domains.js';
  import { t, tn, num, locale } from '../lib/i18n.svelte.js';

  const tripsQ = liveQuery(() => db.trips.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const today = new Date().toLocaleDateString('sv-SE');
  const rows = $derived(pastTrips($tripsQ ?? [], $debriefsQ ?? [], today));
  const loaded = $derived(!!$tripsQ && !!$debriefsQ);

  const fmt = (iso, opts) => new Date(`${iso}T00:00:00`).toLocaleDateString(locale(), opts);
  const dates = (r) =>
    r.days > 1 && r.end
      ? `${fmt(r.start, { day: 'numeric', month: 'short' })} – ${fmt(r.end, { day: 'numeric', month: 'short', year: 'numeric' })}`
      : fmt(r.start, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const debriefHref = (r) => `#/debrief/${encodeURIComponent(r.trip.id)}`;
</script>

<div class="past">
  <p class="back"><a href="#/">← {t('Today|place')}</a></p>
  <h1 class="title big">{t('Past trips')}</h1>
  {#if loaded}
    <p class="hint">{rows.length ? tn(rows.length, '{n} finished trip, newest first. Tap one to open it in Pack.', '{n} finished trips, newest first. Tap one to open it in Pack.') : ''}</p>
    <ul class="list">
      {#each rows as r (r.trip.id)}
        <li class="card">
          <a class="open" href="#/pack" onclick={() => openTrip(r.trip.id)}>
            <b class="ttl">{r.trip.title}</b>
            <span class="facts">
              <span>{dates(r)}</span>
              <span>{tn(r.days, '{n} day', '{n} days')}</span>
              {#if !hasBike(r.trip)}<span>{t(domainName(domainOf(r.trip)))}</span>{:else if r.bike}<span>{r.bike}</span>{/if}
              <span class="num">{r.km != null ? `${num(r.km)} km` : t('km unknown')}</span>
              <span class="num">{tn(r.items, '{n} item', '{n} items')}</span>
            </span>
          </a>
          <span class="state">
            {#if r.debrief === 'done'}
              <a class="tag done" href={debriefHref(r)} onclick={() => openTrip(r.trip.id)}>✓ {t('Debrief done')}</a>
            {:else if r.canDebrief}
              <a class="tag write" href={debriefHref(r)} onclick={() => openTrip(r.trip.id)}>{r.debrief === 'draft' ? t('Continue debrief') : t('Write debrief')}</a>
            {:else}
              <span class="tag none">{t('No debrief: nothing packed in the app')}</span>
            {/if}
          </span>
        </li>
      {:else}
        <li class="card empty">
          <b>{t('No finished trips yet.')}</b>
          <p>{t('A trip shows up here the day after it ends, or as soon as you end it on the ride day.')}</p>
          <a class="btn" href="#/pack">{t('Open Pack')}</a>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .past {
    max-width: 880px;
    margin: 0 auto;
  }
  .big {
    font-size: var(--fs-page);
    line-height: var(--lh-title);
    margin: 0 0 6px;
  }
  .back {
    margin: 0 0 6px;
  }
  .hint {
    color: var(--ink-3);
    margin: 0 0 12px;
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  .card {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
    min-width: 0;
  }
  .open {
    flex: 1 1 260px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-height: 44px;
    justify-content: center;
    color: inherit;
    text-decoration: none;
  }
  .open:hover .ttl {
    text-decoration: underline;
  }
  .ttl {
    font-size: 17px;
    overflow-wrap: anywhere;
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 14px;
    font-size: 14px;
    color: var(--ink-2);
  }
  .state {
    flex: none;
    max-width: 100%;
  }
  .tag {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    padding: 2px 12px;
    border-radius: 999px;
    font-size: var(--fs-small);
    text-decoration: none;
    overflow-wrap: anywhere;
  }
  .tag.done {
    border: 1.5px solid var(--line-strong);
    color: var(--ink-2);
  }
  .tag.write {
    background: var(--hi-soft);
    color: #8a2f00;
    font-weight: 600;
  }
  .tag.none {
    border: 1.5px dashed var(--ink-3);
    color: var(--ink-3);
  }
  .empty {
    flex-direction: column;
    align-items: flex-start;
  }
  .empty p {
    margin: 0;
    color: var(--ink-2);
  }
</style>
