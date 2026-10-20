<script>
  /**
   * Thread «Seetemperatur und Sauna» (Noah 20.10.2026 «1a», «Zürisee reicht»): the lake in one short
   * line for Heute, «Zürisee 17,8 °C · frisch». The weather core (thread «Wetter, Wind, Energie und
   * Umweg») mounts it inside its Heute weather line; a tap opens the lake card in Aktiv. It loads the
   * value itself (at most every 30 minutes, src/lib/lake.js) and shows nothing without a value.
   *
   * Props: fetcher (for tests), auto (fetch on show, default true), href (where a tap goes).
   */
  import { onMount } from 'svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { LAKE_CACHE_KEY, LAKE_SET_KEY, LAKE_NAME, SCALE_WORDS, lakeSetOf, briefOf, loadLake } from '../lake.js';
  import { t, locale } from '../i18n.svelte.js';
  import { Waves } from '@lucide/svelte';

  let { fetcher = undefined, auto = true, href = '#/flow' } = $props();

  let now = $state(new Date());
  const q = liveQuery(async () => {
    const [c, s] = await Promise.all([db.meta.get(LAKE_CACHE_KEY), db.settings.get(LAKE_SET_KEY)]);
    return { cache: c?.value ?? null, set: lakeSetOf(s?.value) };
  });
  const st = $derived($q);
  const b = $derived(st ? briefOf(st.cache, st.set, now) : null);
  const one = (n) => Number(n).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  onMount(() => {
    if (auto && (typeof navigator === 'undefined' || navigator.onLine !== false)) loadLake(db, fetcher ? { fetcher } : {}).finally(() => (now = new Date()));
  });
</script>

{#if b}
  <a class="lchip num" {href} data-lake-chip data-scale={b.scale} aria-label={t('{name} {w} °C, {scale}. Open the lake card.', { name: t(LAKE_NAME), w: one(b.water), scale: t(SCALE_WORDS[b.scale]) })}>
    <Waves size={14} aria-hidden="true" />
    <span>{t(LAKE_NAME)} <b>{one(b.water)} °C</b> · {t(SCALE_WORDS[b.scale])}{#if b.stale}{' · '}{t('older value')}{/if}</span>
  </a>
{/if}

<style>
  .lchip { display: inline-flex; align-items: center; gap: var(--sp-1); min-height: 44px; color: var(--ink-2); font-size: var(--fs-small); text-decoration: none; }
  .lchip b { color: var(--ink); }
  .lchip:hover span { text-decoration: underline; }
  .lchip:focus-visible { outline: var(--focus-ring); border-radius: var(--r-ctl); }
</style>
