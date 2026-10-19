<script>
  /**
   * Paket G «Ozon und Pollen» (Noah 19.10.2026 «3a»): today and tomorrow at the home place, from
   * Open-Meteo's free air-quality service. Says plainly when ozone is high or a chosen pollen is strong;
   * which pollen counts is chosen in the fold (everything a suggestion). Offline: the last answer.
   * Observation only, no advice beyond «take it easier at midday».
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { AIR_KEY, AIR_CACHE, POLLEN, POLLEN_NAMES, airPrefs, airHigh, fetchAir } from '../air.js';
  import { localDay } from '../localday.js';
  import { t } from '../i18n.svelte.js';
  import { Flower2, RefreshCw } from '@lucide/svelte';

  let { fetcher = undefined, auto = true, headingLevel = 2 } = $props();

  const q = liveQuery(async () => {
    const [c, s, h] = await Promise.all([db.meta.get(AIR_CACHE), db.settings.get(AIR_KEY), db.settings.get('homePlace')]);
    return { cache: c?.value ?? null, prefs: airPrefs(s?.value), home: h?.value ?? null };
  });
  const st = $derived($q);
  const home = $derived(st?.home && Number.isFinite(st.home.lat) && Number.isFinite(st.home.lon) ? st.home : null);
  let busy = $state(false);
  let failed = $state(false);
  const hid = `air-${Math.random().toString(36).slice(2, 8)}`;
  const today = localDay();
  const days = $derived((st?.cache?.days ?? []).filter((d) => d.day >= today && (d.ozone != null || Object.values(d.pollen ?? {}).some((v) => v != null))));
  const highs = $derived(days.map((d) => ({ d, h: airHigh(d, st?.prefs) })));
  const nameOf = (k) => t(POLLEN_NAMES[k]);
  const dayWord = (day) => (day === today ? t('Today') : t('Tomorrow'));

  async function refresh() {
    if (busy || !home) return;
    busy = true;
    try {
      await fetchAir(home, { db, ...(fetcher ? { fetcher } : {}) });
      failed = false;
    } catch {
      failed = true;
    } finally {
      busy = false;
    }
  }
  async function setPollen(key, on) {
    const p = airPrefs((await db.settings.get(AIR_KEY))?.value);
    await db.settings.put({ key: AIR_KEY, value: { ...p, pollen: on ? [...new Set([...p.pollen, key])] : p.pollen.filter((k) => k !== key) } });
  }
  async function setOzone(on) {
    const p = airPrefs((await db.settings.get(AIR_KEY))?.value);
    await db.settings.put({ key: AIR_KEY, value: { ...p, ozone: on } });
  }

  let asked = false;
  $effect(() => {
    if (auto && home && !asked) {
      asked = true;
      const old = st?.cache?.at ? Date.now() - Date.parse(st.cache.at) : Infinity;
      if (old > 3 * 3600 * 1000 && (typeof navigator === 'undefined' || navigator.onLine !== false)) refresh();
    }
  });
</script>

<section class="air card" aria-labelledby={hid} data-section="air">
  <div class="ai-head">
    <span class="ai-ib" aria-hidden="true"><Flower2 size={18} /></span>
    <svelte:element this={headingLevel === 3 ? 'h3' : 'h2'} id={hid} class="ai-title">{t('Ozone and pollen')}</svelte:element>
    {#if home}<button type="button" class="ai-re" onclick={refresh} disabled={busy} aria-label={t('Load again')}><RefreshCw size={18} class={busy ? 'spin' : ''} aria-hidden="true" /></button>{/if}
  </div>
  {#if !home}
    <p class="ai-quiet">{t('Set your home place under Me › Home place; then the card shows ozone and pollen there.')}</p>
  {:else if !days.length}
    <p class="ai-quiet">{failed ? t('The air values could not be loaded just now. Try again later.') : busy ? t('Loading…') : t('No values yet.')}</p>
  {:else}
    <ul class="ai-days">
      {#each highs as { d, h } (d.day)}
        <li data-air-day={d.day}>
          <b>{dayWord(d.day)}</b>
          {#if h.ozone == null && !h.pollen.length}
            <span class="ai-ok">{t('No strong pollen, ozone normal.')}</span>
          {:else}
            {#if h.ozone != null}<span class="ai-hi">{t('Much ozone (up to {n} µg/m³): take it easier at midday.', { n: h.ozone })}</span>{/if}
            {#if h.pollen.length}<span class="ai-hi">{t('Strong pollen: {list}.', { list: h.pollen.map((p) => nameOf(p.key)).join(', ') })}</span>{/if}
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
  {#if home}
    <details class="ai-set">
      <summary>{t('Which values count')}</summary>
      <label class="ai-row"><input type="checkbox" checked={st?.prefs.ozone} onchange={(e) => setOzone(e.currentTarget.checked)} />{t('Ozone')}</label>
      {#each POLLEN as p (p.key)}
        <label class="ai-row"><input type="checkbox" checked={st?.prefs.pollen.includes(p.key)} onchange={(e) => setPollen(p.key, e.currentTarget.checked)} />{nameOf(p.key)}</label>
      {/each}
      <p class="ai-src">{t('Also for the message on the tour morning (Me › Reminders on the phone).')}</p>
    </details>
    <p class="ai-src">{t('Open-Meteo (CAMS Europe), a model calculation · strong after the Swiss pollen classes')}</p>
  {/if}
</section>

<style>
  .air { padding: var(--sp-4); display: grid; gap: var(--sp-3); }
  .ai-head { display: flex; align-items: center; gap: var(--sp-2); }
  .ai-ib { display: inline-grid; place-items: center; width: 32px; height: 32px; border-radius: var(--radius); background: var(--ok-soft); color: var(--ink); flex: none; }
  .ai-title { margin: 0; font-size: var(--fs-sub); flex: 1; }
  .ai-re { min-width: 44px; min-height: 44px; border: 0; background: none; color: var(--ink-2); border-radius: var(--r-ctl); cursor: pointer; }
  .ai-re:disabled { opacity: 0.5; cursor: default; }
  .ai-re:focus-visible { outline: var(--focus-ring); }
  .ai-re :global(.spin) { animation: ai-spin 1s linear infinite; }
  @keyframes ai-spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .ai-re :global(.spin) { animation: none; } }
  .ai-days { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-2); }
  .ai-days li { display: grid; gap: 2px; font-size: var(--fs-small); overflow-wrap: break-word; }
  .ai-ok { color: var(--ink-2); }
  .ai-hi { color: var(--warn); }
  .ai-quiet { margin: 0; color: var(--ink-2); font-size: var(--fs-small); }
  .ai-set summary { cursor: pointer; color: var(--ink-2); font-size: var(--fs-small); min-height: 44px; display: flex; align-items: center; }
  .ai-set summary:focus-visible { outline: var(--focus-ring); }
  .ai-row { display: flex; align-items: center; gap: var(--sp-2); min-height: 44px; font-size: var(--fs-small); }
  .ai-src { margin: 0; font-size: var(--fs-tiny); color: var(--ink-3); }
</style>
