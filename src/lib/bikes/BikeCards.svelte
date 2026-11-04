<script>
  /**
   * «Velos-Übersicht» step 1 (Noah 1.11.2026): one card per bike with its km, an honest status and the next work,
   * so you see at once which bike needs attention. Same words as Care (bikeCareWords). Buttons: open its care, show its details.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { activeBikes } from '../bikeretire.js';
  import { sortBikes, bikesHash } from '../bikes.js';
  import { withVisits, visitTotal } from '../workshop.js';
  import { chfText } from '../money.js';
  import { bikeCare, bikeCareWords } from '../readiness.js';
  import { dueCards } from '../care/overview.js';
  import { localDay } from '../localday.js';
  import BikeQuickDialog from '../hubs/BikeQuickDialog.svelte';
  import VeloDraw from './VeloDraw.svelte';
  import { careLook } from './pflegezustand.js';
  import { phone } from '../media.svelte.js';
  import { t, tn, num, dateOf } from '../i18n.svelte.js';
  let { bikeId = null, onbike } = $props();
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const tasksQ = liveQuery(() => db.maintenance.toArray());
  const bikes = $derived(sortBikes(activeBikes($bikesQ ?? [])));
  const visits = $derived($visitsQ ?? []);
  const tasks = $derived($tasksQ ?? []);
  const today = localDay();
  // step 4: «Workshop and history», the three newest workshop visits over all bikes, with cost and receipt
  const names = $derived(Object.fromEntries(bikes.map((b) => [b.id, b.name])));
  const recent = $derived(
    visits
      .filter((v) => names[v.bikeId])
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
      .slice(0, 3),
  );
  // step 2: «Log a workshop visit» and «Log a problem» straight from the card (the Today dialogs, one bike chosen)
  let dialog = $state(null); // { kind, bikeId }
  let saved = $state(null);
  let savedTimer;
  function done(s) {
    clearTimeout(savedTimer);
    saved = s;
    savedTimer = setTimeout(() => (saved = null), s.resets?.length ? 12000 : 6000);
  }
  $effect(() => () => clearTimeout(savedTimer));
  const cards = $derived(
    bikes.map((b) => {
      const care = bikeCare(withVisits(b, visits), { tasks, visits, today });
      const w = bikeCareWords(care);
      // Paket C idea 22: the drawing shows the care (gleams, dusty, cobweb); the line says why, only when there is something to say
      const look = careLook(withVisits(b, visits), tasks, today);
      return { bike: b, w, status: care?.status ?? 'nodata', care, look };
    }),
  );
  // step 3: «Next up», the open work over all bikes, the most urgent first (the same rows as the care overview)
  const upNext = $derived(dueCards(cards.map((c) => ({ bike: c.bike, care: c.care })), phone.matches ? 3 : 5));
</script>

{#if cards.length}
  <section class="cards" data-bike-cards aria-label={t('Your bikes at a glance')}>
    {#each cards as c (c.bike.id)}
      <article class="vcard" class:sel={c.bike.id === bikeId} data-velo-card={c.bike.id}>
        <div class="pic"><VeloDraw look={c.look.look} /></div>
        <b class="nm">{c.bike.name}</b>
        <small class="km num">{c.bike.km != null ? `${num(c.bike.km)} km` : t('km not set')}</small>
        <span class="vpill {c.status}">{c.w.tag}</span>
        {#if c.w.text}<p class="next">{c.w.text}</p>{/if}
        {#if c.look.look === 'clean'}
          <p class="next look" data-velo-look="clean">{t('Cared for lately: the bike gleams.')}</p>
        {:else if c.look.look === 'dusty' || c.look.look === 'web'}
          <p class="next look" data-velo-look={c.look.look}>{t('No care recorded for {n} days: the bike gets dusty.', { n: c.look.days })}</p>
        {/if}
        <div class="acts">
          <a class="btn sm" href={bikesHash({ tab: 'care', bike: c.bike.id, open: true })}>{t('Open care')}</a>
          <button type="button" class="btn sm hi" onclick={() => (dialog = { kind: 'visit', bikeId: c.bike.id })} data-card-visit>{t('Log a workshop visit')}</button>
          <button type="button" class="btn sm" onclick={() => (dialog = { kind: 'problem', bikeId: c.bike.id })} data-card-problem>{t('Log a problem')}</button>
          <button type="button" class="btn sm" onclick={() => onbike?.(c.bike.id)}>{t('Show details')}</button>
        </div>
      </article>
    {/each}
  </section>
  {#if cards.length}
    <section class="vcard next-up" data-next-up aria-label={t('Next up')}>
      <b>{t('Next up')} <small>{t('all bikes')}</small></b>
      {#if upNext.cards.length}
        <ul>
          {#each upNext.cards as x (x.bike.id + x.row.key)}
            <li><a href={bikesHash({ tab: 'care', bike: x.bike.id, open: true })}><span>{x.row.name} · {x.bike.name}</span><small>{x.row.detail || t('due now')}</small></a></li>
          {/each}
        </ul>
        {#if upNext.total > upNext.cards.length}<small class="more">{tn(upNext.total - upNext.cards.length, '{n} more due: open the bike', '{n} more due: open the bike')}</small>{/if}
      {:else}
        <p class="next" data-next-none>{t('Nothing due now on any bike.')}</p>
      {/if}
    </section>
  {/if}
  <section class="vcard hist" data-visit-history aria-label={t('Workshop and history')}>
    <b>{t('Workshop and history')} <small>{t('latest')}</small></b>
    {#if recent.length}
      <ul>
        {#each recent as v (v.id)}
          <li>
            <a href={bikesHash({ tab: 'shop', bike: v.bikeId, visit: v.id })}>
              <span>{v.shop || t('Workshop')} · {names[v.bikeId]}</span>
              <small class="num">{[dateOf(v.date), visitTotal(v) != null ? chfText(visitTotal(v)) : '', v.photos?.length ? t('receipt') : ''].filter(Boolean).join(' · ')}</small>
            </a>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="next" data-visit-none>{t('No workshop visit yet.')} <a href={bikesHash({ tab: 'shop' })}>{t('Open the workshop')}</a></p>
    {/if}
  </section>
  {#if saved}
    <p class="saved" role="status" data-card-saved>{saved.kind === 'visit' ? t('Workshop visit saved.') : t('Saved in Bike care.')} <a href={bikesHash({ tab: 'care', bike: saved.bikeId, open: true })}>{t('Open')}</a>
      {#if saved.resets?.length}<br /><span data-saved-resets>{t('Changed:')} {saved.resets.join(' · ')}</span>{/if}</p>
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
  /* a phone: one swipeable row, so many bikes do not push the rest of the page far down */
  @media (max-width: 719px) {
    .cards {
      display: flex;
      overflow-x: auto;
      scroll-snap-type: x proximity;
      padding-bottom: 4px;
    }
    .cards .vcard {
      flex: 0 0 82%;
      scroll-snap-align: start;
    }
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
  .pic {
    width: 140px;
  }
  .look {
    color: var(--ink-2);
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
  .next-up,
  .hist {
    margin-bottom: var(--sp-3);
  }
  .next-up ul,
  .hist ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .next-up li + li,
  .hist li + li {
    border-top: 1px solid var(--line);
  }
  .next-up li a,
  .hist li a {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 0;
    color: var(--ink);
    text-decoration: none;
  }
  .next-up small,
  .hist small {
    color: var(--ink-2);
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
