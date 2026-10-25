<script>
  /**
   * Paket A part 2, UC-189-I1: next to «Done: chain oiled», what really happened: «Only wiped, oil later» or
   * «Not today». The hint rests for today, and Merken gets a to-do for tomorrow. Undo takes both back.
   */
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { changeSetting } from '../griffdb.js';
  import { addTodo } from '../merkendb.js';
  import { addDays } from '../merken.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { WET_LATER, WET_LATER_KEY } from './stand.js';

  let { bike, today } = $props();
  async function pick(how) {
    const before = await changeSetting(WET_LATER_KEY, {}, (all) => ({ ...(all ?? {}), [bike.id]: { day: today, how } }));
    const text = how === 'wiped' ? t('Oil the chain of {bike} (only wiped)', { bike: bike.name }) : t('Dry and oil the chain of {bike}', { bike: bike.name });
    const r = await addTodo(db, { text, due: addDays(today, 1), area: 'bike', src: `wetlater:${bike.id}` });
    offerDone(t('In Merken for tomorrow.'), async () => {
      await r?.undo();
      await db.settings.put({ key: WET_LATER_KEY, value: before });
    });
  }
</script>

<span class="wl" data-wet-later>
  {#each WET_LATER as w (w.key)}<button type="button" class="lk" onclick={() => pick(w.key)} data-wet-later-how={w.key}>{t(w.name)}</button>{/each}
</span>

<style>
  .wl {
    display: flex;
    flex-wrap: wrap;
    gap: 0 16px;
    flex-basis: 100%;
  }
  .lk {
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    text-decoration: underline;
    cursor: pointer;
  }
</style>
