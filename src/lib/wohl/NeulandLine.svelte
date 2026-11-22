<script>
  /**
   * Paket P #253 «Neuland im Jahresheft» (Noah 19.10.2026): one line in the year review, how many new
   * places and things the year brought (your own entries, the «New» evenings with a note and the finds of Neuland and the summit book), with the
   * newest names; a tap opens Ich › Was mir gut tut. Without any Neuland nothing shows.
   */
  import { liveQuery } from 'dexie';
  import { Compass } from '@lucide/svelte';
  import { db } from '../db.js';
  import { NEULAND_KEY, neulandYear } from '../wohl.js';
  import { t, tn } from '../i18n.svelte.js';

  let { year } = $props();
  const q = liveQuery(async () => {
    const [own, rows] = await Promise.all([db.settings.get(NEULAND_KEY), db.abAnswers.where('qid').equals('spass.coolstes').toArray()]);
    return { own: own?.value ?? [], rows };
  });
  // N10 «Eine Fundliste»: the finds of Neuland and the summit book join the line (loaded on first use)
  let funde = $state.raw([]);
  $effect(() => {
    let live = true;
    import('../neuland/fundeload.js')
      .then((m) => m.readFunde(db, year))
      .then((f) => live && (funde = f))
      .catch((err) => console.error(err));
    return () => (live = false);
  });
  const list = $derived($q ? neulandYear($q.own, $q.rows, year, funde) : []);
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
