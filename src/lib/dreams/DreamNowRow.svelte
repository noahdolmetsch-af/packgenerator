<script>
  /**
   * «Träume und Neuland» (Noah 27.10.2026 «1-5 a»): one quiet row at the top of Touren › Übersicht when a
   * dream fits this month and is not a trip yet («A dream that fits now: …»). A tap opens Touren › Träume.
   * Nothing shows without such a dream. Races have their own row (NextRaceRow).
   * N15 «Wetterfenster»: with dry days in a row for the first dream, the row adds «dry Thu–Sat».
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { DREAMS_KEY, dreamsNow } from '../dreams.js';
  import { localDay } from '../localday.js';
  import { t, tn, locale } from '../i18n.svelte.js';
  import { refreshDreamWx, windowsOf, dayRange, DREAM_WX } from './wetterfenster.js';
  import { Sparkles, ChevronRight } from '@lucide/svelte';

  const today = localDay();
  const q = liveQuery(() => db.settings.get(DREAMS_KEY));
  const now = $derived($q === undefined ? [] : dreamsNow($q?.value ?? null, today));
  const homeQ = liveQuery(async () => (await db.settings.get('homePlace'))?.value ?? null);
  const wxQ = liveQuery(async () => (await db.meta.get(DREAM_WX)) ?? null);
  const win = $derived(now.length ? windowsOf(now.slice(0, 1), $homeQ, $wxQ, today).get(now[0].id) : null);
  $effect(() => {
    const ds = now.slice(0, 1);
    const home = $homeQ;
    if (home === undefined || !ds.length) return;
    refreshDreamWx(db, ds, home).catch(() => {});
  });
</script>

{#if now.length}
  <a class="dream-now" href="#/trips/dreams" data-dream-now>
    <Sparkles size={18} aria-hidden="true" />
    <span>{now.length === 1 ? t('A dream that fits now: {name}', { name: now[0].title }) : tn(now.length - 1, 'A dream that fits now: {name} and one more', 'A dream that fits now: {name} and {n} more', { name: now[0].title })}{#if win}{' · '}<span class="wx" data-dream-now-wx>{t('dry {days}', { days: dayRange(win, locale()) })}</span>{/if}</span>
    <ChevronRight size={16} aria-hidden="true" />
  </a>
{/if}

<style>
  .dream-now {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 44px;
    margin: var(--sp-2) 0;
    padding: var(--sp-2) var(--sp-3);
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    background: var(--paper);
    color: var(--ink);
    font-weight: 600;
    text-decoration: none;
    overflow-wrap: break-word;
  }
  .dream-now .wx {
    font-weight: 400;
    color: var(--ink-2);
  }
  .dream-now > span {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
</style>
