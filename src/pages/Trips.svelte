<script>
  /**
   * v0.46.1 (Noah: «Touren» opened the last trip at Packen): #/trips, the calm overview of all trips
   * behind «Touren» (top bar and bottom bar), until the full Touren entry page comes. A heading,
   * «Was jetzt?», «+ Neue Tour», then one list grouped by state (tripsoverview.js): each row with
   * name, date, bike and state, and one button named by its next step that opens the trip there.
   * #/pack and #/pack?… still open a trip directly.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { tripsOverview, GROUPS, RIDDEN_SHOWN } from '../lib/tripsoverview.js';
  import { switchTrip, openNew } from '../lib/nav.js';
  import { localDay } from '../lib/localday.js';
  import { t, num, locale } from '../lib/i18n.svelte.js';
  import { Plus } from '@lucide/svelte';

  const tripsQ = liveQuery(() => db.trips.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const loaded = $derived(!!$tripsQ && !!$debriefsQ);
  const view = $derived(loaded ? tripsOverview($tripsQ, $debriefsQ, localDay()) : null);

  const thisYear = String(new Date().getFullYear());
  const day = (iso) => {
    if (!iso) return t('No date set');
    const y = iso.slice(0, 4) !== thisYear ? { year: 'numeric' } : {};
    return new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', ...y });
  };
  const line = (r) => [day(r.date), r.bike, typeof r.km === 'number' ? `${num(r.km)} km` : ''].filter(Boolean).join(' · ');
  const go = (r) => switchTrip(r.tripId, r.go.href);
</script>

<div class="trips">
  <h1 class="title">{t('Trips|place')}</h1>
  {#if view}
    {#if view.empty}
      <div class="card empty">
        <p>{t('No trips yet. A trip is the packing list for one ride or journey.')}</p>
        <button type="button" class="btn hi" onclick={() => openNew('list')}><Plus size={18} aria-hidden="true" />{t('Create the first trip')}</button>
      </div>
    {:else}
      <div class="now">
        <p><b>{t('What now?')}</b> {t('Tap a trip to continue.')}</p>
        <button type="button" class="btn hi" onclick={() => openNew('list')}><Plus size={18} aria-hidden="true" />{t('New trip')}</button>
      </div>
      {#each GROUPS as g (g.key)}
        {#if view[g.key].length}
          <h2 class="sec-head" id="trips-{g.key}"><span>{t(g.name)}</span><span class="n">{g.key === 'ridden' ? view.riddenTotal : view[g.key].length}</span></h2>
          <ul class="rowlist" aria-labelledby="trips-{g.key}">
            {#each view[g.key] as r (r.id)}
              <li class="tr">
                <span class="m"><span class="t">{r.title}</span><span class="s">{line(r)}</span></span>
                <span class="nbadge">{#if g.key === 'debrief'}<span class="udot" aria-hidden="true"></span>{/if}{t(r.state.label, r.state)}</span>
                <a class="btn sm go" href={r.go.href} onclick={(e) => (e.preventDefault(), go(r))} aria-label="{t(r.go.label)}: {r.title}">{t(r.go.label)}</a>
              </li>
            {/each}
          </ul>
          {#if g.key === 'ridden' && view.riddenTotal > RIDDEN_SHOWN}
            <a class="all" href="#/pack/past">{t('Show all {n}', { n: view.riddenTotal })}</a>
          {/if}
        {/if}
      {/each}
    {/if}
  {/if}
</div>

<style>
  .trips {
    max-width: 880px;
    margin: 0 auto;
  }
  .now {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px 16px;
    margin: 4px 0 0;
  }
  .now p {
    margin: 0;
    color: var(--ink-2);
  }
  .now b {
    color: var(--ink);
  }
  .btn.hi {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .tr {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    min-height: 52px;
    padding: 8px 12px;
    box-sizing: border-box;
  }
  .tr .m {
    flex: 1 1 180px;
    min-width: 0;
  }
  .tr .t {
    display: block;
    font-weight: 500;
    line-height: 1.3;
    overflow-wrap: break-word;
  }
  .tr .s {
    display: block;
    font-size: 14px;
    color: var(--ink-3);
    overflow-wrap: break-word;
  }
  .go {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    margin-left: auto;
    white-space: nowrap;
  }
  .all {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    margin-top: 4px;
    color: var(--ink);
  }
  .empty {
    display: grid;
    gap: 10px;
    justify-items: start;
    margin-top: 12px;
  }
  .empty p {
    margin: 0;
    color: var(--ink-2);
  }
</style>
