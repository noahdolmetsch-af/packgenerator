<script>
  /**
   * «Erfüllte Träume» (Träume und Neuland N17) in the year card of Rückblick: «Erfüllte Träume 2026: 2 · Über die
   * Furka, Jura», with the photo of the newest; a tap opens Touren › Träume. Without a fulfilled dream nothing shows.
   */
  import { liveQuery } from 'dexie';
  import { Sparkles } from '@lucide/svelte';
  import { db } from '../db.js';
  import { DREAMS_KEY, storeOf } from '../dreams.js';
  import { fulfilledDreams, fulfilledIn } from './erfuellt.js';
  import { localDay } from '../localday.js';
  import { tn } from '../i18n.svelte.js';

  let { year } = $props();
  const today = localDay();
  const q = liveQuery(async () => {
    const [rec, trips, debriefs] = await Promise.all([db.settings.get(DREAMS_KEY), db.trips.toArray(), db.debriefs.toArray()]);
    return { dreams: storeOf(rec?.value).dreams, trips, debriefs };
  });
  const list = $derived($q ? fulfilledIn(fulfilledDreams($q.dreams, $q.trips, $q.debriefs, today), year) : []);
  const photo = $derived(list.find((x) => x.dream.photo)?.dream.photo ?? null);
</script>

{#if list.length}
  <a class="dd" href="#/trips/dreams" data-dreams-done-line>
    {#if photo}<img src={photo} alt="" />{:else}<Sparkles size={16} aria-hidden="true" />{/if}
    <span>{tn(list.length, 'Fulfilled dream {year}: {n}', 'Fulfilled dreams {year}: {n}', { year })} · {list.slice(0, 3).map((x) => x.dream.title).join(', ')}</span>
  </a>
{/if}

<style>
  /* the look of the Neuland line beside it */
  .dd {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin-top: 6px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-decoration: none;
    min-height: 32px;
  }
  img {
    width: 24px;
    height: 24px;
    flex: none;
    object-fit: cover;
    border-radius: 6px;
  }
</style>
