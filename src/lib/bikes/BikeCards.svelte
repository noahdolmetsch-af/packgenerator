<script>
  /**
   * «Velos-Übersicht» step 1 (Noah 1.11.2026): one card per bike with its km, an honest status and the next work,
   * so you see at once which bike needs attention. Same words as Care (bikeCareWords). Buttons: open its care, show its details.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { activeBikes } from '../bikeretire.js';
  import { sortBikes, bikesHash } from '../bikes.js';
  import { withVisits } from '../workshop.js';
  import { bikeCare, bikeCareWords } from '../readiness.js';
  import { localDay } from '../localday.js';
  import BikeQuickDialog from '../hubs/BikeQuickDialog.svelte';
  import { t, num } from '../i18n.svelte.js';
  let { bikeId = null, onbike } = $props();
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const tasksQ = liveQuery(() => db.maintenance.toArray());
  const bikes = $derived(sortBikes(activeBikes($bikesQ ?? [])));
  const visits = $derived($visitsQ ?? []);
  const tasks = $derived($tasksQ ?? []);
  const today = localDay();
  // step 2: «Log a workshop visit» and «Log a problem» straight from the card (the Today dialogs, one bike chosen)
  let dialog = $state(null); // { kind, bikeId }
  let saved = $state(null);
  let savedTimer;
  function done(s) {
    clearTimeout(savedTimer);
    saved = s;
    savedTimer = setTimeout(() => (saved = null), 6000);
  }
  $effect(() => () => clearTimeout(savedTimer));
  const cards = $derived(
    bikes.map((b) => {
      const care = bikeCare(withVisits(b, visits), { tasks, visits, today });
      const w = bikeCareWords(care);
      return { bike: b, w, status: care?.status ?? 'nodata' };
    }),
  );
</script>

{#if cards.length}
  <section class="cards" data-bike-cards aria-label={t('Your bikes at a glance')}>
    {#each cards as c (c.bike.id)}
      <article class="vcard" class:sel={c.bike.id === bikeId} data-velo-card={c.bike.id}>
        <b class="nm">{c.bike.name}</b>
        <small class="km num">{c.bike.km != null ? `${num(c.bike.km)} km` : t('km not set')}</small>
        <span class="vpill {c.status}">{c.w.tag}</span>
        {#if c.w.text}<p class="next">{c.w.text}</p>{/if}
        <div class="acts">
          <a class="btn sm" href={bikesHash({ tab: 'care', bike: c.bike.id, open: true })}>{t('Open care')}</a>
          <button type="button" class="btn sm hi" onclick={() => (dialog = { kind: 'visit', bikeId: c.bike.id })} data-card-visit>{t('Log a workshop visit')}</button>
          <button type="button" class="btn sm" onclick={() => (dialog = { kind: 'problem', bikeId: c.bike.id })} data-card-problem>{t('Log a problem')}</button>
          <button type="button" class="btn sm" onclick={() => onbike?.(c.bike.id)}>{t('Show details')}</button>
        </div>
      </article>
    {/each}
  </section>
  {#if saved}
    <p class="saved" role="status" data-card-saved>{saved.kind === 'visit' ? t('Workshop visit saved.') : t('Saved in Bike care.')} <a href={bikesHash({ tab: 'care', bike: saved.bikeId, open: true })}>{t('Open')}</a></p>
  {/if}
  {#if dialog}
    <BikeQuickDialog kind={dialog.kind} {bikes} bikeId={dialog.bikeId} onsaved={done} onclose={() => (dialog = null)} />
  {/if}
{/if}

<style>
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
    gap: var(--sp-3);
    margin-bottom: var(--sp-3);
  }
  .vcard {
    display: grid;
    gap: 6px;
    align-content: start;
    min-width: 0;
    padding: var(--sp-3);
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
  }
  .vcard.sel {
    border-color: var(--accent);
  }
  .nm {
    overflow-wrap: break-word;
  }
  .km {
    color: var(--ink-2);
  }
  .vpill {
    justify-self: start;
    padding: 2px 10px;
    border-radius: 99px;
    font: 600 var(--fs-small) / 1.4 var(--font-body);
    background: var(--line);
    color: var(--ink-2);
  }
  .vpill.due {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .vpill.ok {
    background: var(--accent-soft);
    color: var(--accent);
  }
  .next {
    margin: 0;
    font-size: var(--fs-small);
  }
  .saved {
    margin: 0 0 var(--sp-3);
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
</style>
