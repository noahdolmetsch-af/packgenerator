<script>
  /**
   * «Neu heute» (Träume und Neuland N11, Noah 27.10.2026 «1-5 a»): on Heute, after a ride, one quiet line «Neu seit
   * gestern: 3 Gemeinden, 1 See»; a tap opens Neuland, «×» closes it until something new comes (setting SEEN_KEY).
   * Nothing is loaded unless something was ridden since yesterday (then the collections load as on the Neuland page).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { readRaw, computeFrom } from './store.js';
  import { SEEN_KEY, dayBefore, rodeSince, newSince } from './neuheute.js';
  import { t } from '../i18n.svelte.js';
  import { Compass, X } from '@lucide/svelte';

  let { today } = $props();
  const since = $derived(dayBefore(today));
  const rawQ = liveQuery(() => readRaw(db));
  const seenQ = liveQuery(async () => (await db.settings.get(SEEN_KEY))?.value ?? null); // null: nothing closed yet
  let news = $state.raw(null);
  $effect(() => {
    const raw = $rawQ;
    const from = since;
    if (!raw || !rodeSince(raw, from, today)) return void (news = null);
    let live = true;
    computeFrom(raw, { today })
      .then((r) => live && (news = newSince(r, from)))
      .catch((err) => console.error(err));
    return () => (live = false);
  });
  const show = $derived(news?.n > 0 && $seenQ !== undefined && $seenQ !== news.key);
  const close = () => db.settings.put({ key: SEEN_KEY, value: news.key });
</script>

{#if show}
  <div class="nh" data-section="neu-heute" data-neu-heute>
    <a class="row" href="#/neuland">
      <Compass size={20} aria-hidden="true" />
      <span class="tx"><b>{news.text}</b><small>{t('First time ever. A tap shows them in New ground.')}</small></span>
    </a>
    <button type="button" class="x" onclick={close} aria-label={t('Close «New since yesterday»')} data-neu-heute-close><X size={18} aria-hidden="true" /></button>
  </div>
{/if}

<style>
  /* the look of «Weitermachen» and the bag reminder */
  .nh {
    display: flex;
    align-items: stretch;
    gap: 0;
    margin: 0 0 14px;
    border: 1px solid var(--hi-soft);
    border-radius: var(--radius-card);
    background: var(--hi-soft);
  }
  .row {
    display: flex;
    flex: 1;
    min-width: 0;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 8px 4px 8px 14px;
    color: var(--ink);
    text-decoration: none;
  }
  .row :global(svg) {
    flex: none;
    color: var(--ink-3);
  }
  .tx {
    display: grid;
    flex: 1;
    min-width: 0;
    gap: 2px;
    overflow-wrap: break-word;
  }
  b {
    font-size: var(--fs-body);
    font-weight: 600;
  }
  small {
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .x {
    flex: none;
    display: grid;
    place-items: center;
    min-width: 44px;
    border: 0;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
</style>
