<script>
  /**
   * Paket P #253 «Neuland im Jahresheft» (Noah 19.10.2026): one line in the year review, how many new
   * places and things the year brought, with the newest names; a tap opens Ich › Was mir gut tut. Without
   * any Neuland nothing shows. Since N10 «Eine Fundliste» (Noah 27.10.2026 «1-5 a») it reads the one list:
   * your own entries, the «New» evenings, what New ground found first this year and the Gipfelbuch.
   */
  import { liveQuery } from 'dexie';
  import { Compass } from '@lucide/svelte';
  import { db } from '../db.js';
  import { NEULAND_KEY } from '../wohl.js';
  import { readRaw, computeFrom } from '../neuland/store.js';
  import { findsOfYear } from '../neuland/funde.js';
  import { localDay } from '../localday.js';
  import { t, tn } from '../i18n.svelte.js';

  let { year } = $props();
  const q = liveQuery(async () => {
    const [own, rows] = await Promise.all([db.settings.get(NEULAND_KEY), db.abAnswers.where('qid').equals('spass.coolstes').toArray()]);
    return { own: own?.value ?? [], rows };
  });
  const rawQ = liveQuery(() => readRaw(db));
  let cols = $state.raw([]);
  $effect(() => {
    const raw = $rawQ;
    if (!raw) return;
    let live = true;
    computeFrom(raw, { today: localDay() })
      .then((r) => live && (cols = r.collections))
      .catch((err) => console.error(err));
    return () => (live = false);
  });
  const list = $derived($q ? findsOfYear({ own: $q.own, rows: $q.rows, collections: cols, book: $rawQ?.book ?? null, year }) : []);
</script>

{#if list.length}
  <a class="nl" href="#/me/wohl" data-neuland-line>
    <Compass size={16} aria-hidden="true" />
    <span>{tn(list.length, 'Neuland {year}: {n} new place or thing', 'Neuland {year}: {n} new places and things', { year })} · {list.slice(0, 3).map((x) => x.name).join(', ')}</span>
  </a>
{/if}

<style>
  .nl {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin-top: 6px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-decoration: none;
    min-height: 32px;
  }
</style>
