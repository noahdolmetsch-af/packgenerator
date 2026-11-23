<script>
  /**
   * «Heute entdecken» (Noah 23.11.2026 «1a 2b 3a 4a 5a»): the card «Entdecken» left «Mehr» and is a row under the chips on
   * Heute now (IdeenZeile.svelte). This tile stays in the wall only so an older wall keeps working: it shows while you
   * customise Heute (never otherwise, Home.svelte) and holds the switch that shows or takes away the row.
   */
  import { liveQuery } from 'dexie';
  import { Compass } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { db } from '../db.js';
  import { DISCOVER_KEY, discoverOf } from './discover.js';
  import TileHead from './TileHead.svelte';

  let { isnew = false } = $props();
  const recQ = liveQuery(async () => discoverOf((await db.settings.get(DISCOVER_KEY))?.value));
  const rec = $derived($recQ ?? discoverOf(null));
  const set = (off) => db.settings.put({ key: DISCOVER_KEY, value: { ...rec, off } });
</script>

<section class="di surf" aria-labelledby="di-h" data-section="discover">
  <TileHead icon={Compass} id="di-h" title={t('Discover|tile')} {isnew} />
  <p class="note">{t('One idea a day stands in a row under the chips: «Discover today».')}</p>
  <label class="di-sw">
    <input type="checkbox" role="switch" checked={!rec.off} onchange={(e) => set(!e.currentTarget.checked)} data-discover-switch />
    <span>{t('Show «Discover today» under the chips')}</span>
  </label>
</section>

<style>
  .di {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 18px;
    box-sizing: border-box;
  }
  .note {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .di-sw {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    cursor: pointer;
  }
</style>
