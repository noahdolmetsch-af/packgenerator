<script>
  /**
   * «Velos-Übersicht» step 1 (Noah 1.11.2026): one card per bike with its km, an honest status and the next work,
   * so you see at once which bike needs attention. Same words as Care (bikeCareWords). Buttons: open its care, show its details.
   * Velos aufräumen (Noah 23.11.2026): these cards are the only place where the bikes stand and are chosen (the second row of
   * small cards under them is gone); «Show details» chooses the bike and leads down to its page; «+ Bike» adds one.
   */
  import { tick } from 'svelte';
  import { Plus, Star, ChevronRight, BookOpen, ClipboardCheck } from '@lucide/svelte';
  import './standardvelo.css';
  import { wantBike } from '../nav.js';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { activeBikes } from '../bikeretire.js';
  import { sortBikes, bikesHash } from '../bikes.js';
  import { withVisits, visitTotal } from '../workshop.js';
  import { chfText } from '../money.js';
  import { bikeCare, bikeCareWords } from '../readiness.js';
  import { dueCards } from '../care/overview.js';
  import { checkGlance } from '../care/glance.js';
  import { localDay } from '../localday.js';
  import BikeQuickDialog from '../hubs/BikeQuickDialog.svelte';
  import BikeOrderSheet from './BikeOrderSheet.svelte';
  import VeloDraw from './VeloDraw.svelte';
  import { careLook } from './pflegezustand.js';
  import { phone } from '../media.svelte.js';
  import Odometer from '../ui/Odometer.svelte';
  import NumLink from '../ui/NumLink.svelte'; // «Zahl mit Weg» (UI-Prüfung 07.11.2026, V1)
  import { velosHref } from '../analyse/jump.js';
  import { t, tn, num, dateOf } from '../i18n.svelte.js';
  let { bikeId = null, onbike } = $props();
  /** «Show details»: this bike is chosen and its page below comes into view (on a phone it is far down). */
  async function showDetails(id) {
    onbike?.(id);
    await tick();
    document.querySelector('[data-bike-detail]')?.scrollIntoView({ block: 'start' });
  }
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const tasksQ = liveQuery(() => db.maintenance.toArray());
  const inspQ = liveQuery(() => db.inspections.toArray());
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
  let orderOpen = $state(false); // «Change the order and the standard bike»: the window of the order (was a line further down)
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
  // Sitemap K1 (Noah 24.11.2026): «Ride ledger» and «Start inspection» stand right under the cards, for the chosen bike
  const chosen = $derived(bikes.find((b) => b.id === bikeId) ?? bikes[0] ?? null);
  const lastCheck = $derived(chosen ? checkGlance($inspQ ?? [], chosen.id, null) : null);
  const daysAgo = (day) => Math.max(0, Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${day}T00:00:00Z`)) / 864e5));
  const checkLine = $derived(!lastCheck ? t('No check yet') : daysAgo(lastCheck.day) === 0 ? t('Last check: today') : tn(daysAgo(lastCheck.day), 'Last check: {n} day ago', 'Last check: {n} days ago'));
  // step 3: «Next up», the open work over all bikes, the most urgent first (the same rows as the care overview)
  const upNext = $derived(dueCards(cards.map((c) => ({ bike: c.bike, care: c.care })), phone.matches ? 3 : 5));
</script>

{#if cards.length}
  <!-- Velos nach impeccable (Noah 23.11.2026 «1-5 a», 1): one line over the cards says what stands here and where the order is changed -->
  <p class="vhead" data-bikes-head><b>{t('Your bikes')} <span class="num">{cards.length}</span></b>{#if cards.length > 1}<button type="button" class="link" onclick={() => (orderOpen = true)} data-order-open>{t('Change the order and the standard bike')}</button>{/if}</p>
  <section class="cards" data-bike-cards aria-label={t('Your bikes at a glance')}>
    {#each cards as c (c.bike.id)}
      <article class="vcard" class:sel={c.bike.id === bikeId} aria-current={c.bike.id === bikeId ? 'true' : undefined} data-velo-card={c.bike.id}>
        <!-- VS3 (Noah 14.10.2026): the standard bike (first in the order) keeps its star, now on its card -->
        <div class="pic"><VeloDraw look={c.look.look} />{#if c.bike.id === bikes[0]?.id && bikes.length > 1}<Star size={16} class="sv-star" aria-label={t('Standard')} />{/if}</div>
        <b class="nm">{c.bike.name}</b>
        <small class="km num">{#if c.bike.km != null}<NumLink to={velosHref(c.bike.id)} data-card-km-link><Odometer value={c.bike.km} />{' km'}</NumLink>{:else}{t('km not set')}{/if}</small>
        <!-- V1: «nothing due» / «n due» leads to the care list of this bike -->
        <a class="vpill {c.status}" href={bikesHash({ tab: 'care', bike: c.bike.id, open: true })} data-card-status>{c.w.tag}</a>
        {#if c.w.text}<p class="next"><a class="nxl" href={bikesHash({ tab: 'care', bike: c.bike.id, open: true })} data-card-text>{c.w.text}</a></p>{/if}
        {#if c.look.look === 'clean'}
          <p class="next look" data-velo-look="clean">{t('Cared for lately: the bike gleams.')}</p>
        {:else if c.look.look === 'dusty' || c.look.look === 'web'}
          <p class="next look" data-velo-look={c.look.look}>{t('No care recorded for {n} days: the bike gets dusty.', { n: c.look.days })}</p>
        {/if}
        <div class="acts">
          <a class="btn sm" href={bikesHash({ tab: 'care', bike: c.bike.id, open: true })}>{t('Open care')}</a>
          <button type="button" class="btn sm" onclick={() => (dialog = { kind: 'visit', bikeId: c.bike.id })} data-card-visit>{t('Log a workshop visit')}</button>
          <button type="button" class="btn sm" onclick={() => (dialog = { kind: 'problem', bikeId: c.bike.id })} data-card-problem>{t('Log a problem')}</button>
          <button type="button" class="btn sm" onclick={() => showDetails(c.bike.id)} data-card-details>{t('Show details')}</button>
        </div>
      </article>
    {/each}
    <button type="button" class="vcard addcard" onclick={() => wantBike()} data-card-add><Plus size={20} aria-hidden="true" /><span>{t('Add bike')}</span></button>
  </section>
  {#if chosen}
    <ul class="vcard qrows" data-bike-quick-rows aria-label={t('Ride ledger and inspection of {name}', { name: chosen.name })}>
      <li><a href={bikesHash({ tab: 'care', view: 'km', bike: chosen.id })} data-km-row><span class="ib"><BookOpen size={18} aria-hidden="true" /></span><span class="m"><b>{t('Ride ledger')}</b><small class="num">{t('Every km counts')}{chosen.km != null ? ` · ${num(chosen.km)} km` : ''}</small></span><ChevronRight class="chev" size={18} aria-hidden="true" /></a></li>
      <li><a href={bikesHash({ tab: 'care', view: 'inspect', bike: chosen.id, level: 'quick' })} data-inspect-row><span class="ib"><ClipboardCheck size={18} aria-hidden="true" /></span><span class="m"><b>{t('Start inspection')}</b><small>{checkLine}</small></span><ChevronRight class="chev" size={18} aria-hidden="true" /></a></li>
    </ul>
  {/if}
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
  {#if !recent.length}
    <!-- one line as long as there is nothing to show -->
    <p class="vcard hist one" data-visit-history data-visit-none><span>{t('Workshop: no visit yet')}</span><a href={bikesHash({ tab: 'shop' })}>{t('To the workshop')}</a></p>
  {:else}
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
    {/if}
  </section>
  {/if}
  {#if saved}
    <p class="saved" role="status" data-card-saved>{saved.kind === 'visit' ? t('Workshop visit saved.') : t('Saved in Bike care.')} <a href={bikesHash({ tab: 'care', bike: saved.bikeId, open: true })}>{t('Open')}</a>
      {#if saved.resets?.length}<br /><span data-saved-resets>{t('Changed:')} {saved.resets.join(' · ')}</span>{/if}</p>
  {/if}
  {#if orderOpen}
    <BikeOrderSheet {bikes} onclose={() => (orderOpen = false)} />
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
    .cards .addcard {
      flex: 0 0 40%;
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
    box-shadow: inset 0 0 0 1px var(--accent);
  }
  .addcard {
    place-content: center;
    justify-items: center;
    min-height: 96px;
    border-style: dashed;
    border-color: var(--line-strong);
    background: none;
    color: var(--ink-2);
    font: 500 var(--fs-small) / 1.25 var(--font-body);
    cursor: pointer;
  }
  @media (hover: hover) {
    .addcard:hover {
      background: var(--paper-2);
    }
  }
  .nm {
    overflow-wrap: break-word;
  }
  .pic {
    position: relative;
    width: 140px;
  }
  .pic :global(.sv-star) {
    position: absolute;
    top: 0;
    right: 0;
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
  .nxl {
    position: relative;
    color: inherit;
    text-decoration: underline;
    text-decoration-color: var(--line-strong);
    text-underline-offset: 3px;
  }
  /* 44 px tap area around the text link, without moving the layout */
  .nxl::after {
    content: '';
    position: absolute;
    left: -6px;
    right: -6px;
    top: 50%;
    height: 44px;
    transform: translateY(-50%);
  }
  a.vpill {
    position: relative;
    text-decoration: none;
  }
  /* 44 px tap area around the small pill, without moving the layout */
  a.vpill::after {
    content: '';
    position: absolute;
    left: -6px;
    right: -6px;
    top: 50%;
    height: 44px;
    transform: translateY(-50%);
  }
  .km :global(a.numlink) {
    min-height: 0;
  }
  .km :global(a.numlink)::after {
    content: '';
    position: absolute;
    left: -6px;
    right: -6px;
    top: 50%;
    height: 44px;
    transform: translateY(-50%);
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
  .qrows {
    list-style: none;
    margin: 0 0 var(--sp-3);
    padding: 0 var(--sp-3);
  }
  .qrows li + li {
    border-top: 1px solid var(--line);
  }
  .qrows a {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 8px 0;
    color: var(--ink);
    text-decoration: none;
  }
  .qrows .ib {
    flex: none;
    display: inline-grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .qrows .m {
    flex: 1;
    min-width: 0;
    display: grid;
  }
  .qrows b {
    font-weight: 600;
  }
  .qrows small {
    color: var(--ink-2);
  }
  .qrows :global(.chev) {
    flex: none;
    color: var(--ink-3);
  }
  .vhead {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0 12px;
    margin: 0 0 var(--sp-2);
  }
  .vhead b {
    font-weight: 600;
  }
  .vhead .num {
    color: var(--ink-3);
    font-weight: 500;
  }
  .vhead .link {
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--accent);
    font: 500 var(--fs-small) var(--font-body);
    text-decoration: underline;
    cursor: pointer;
  }
  .hist.one {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0 12px;
    margin-top: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .hist.one a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--accent);
    font-weight: 500;
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
