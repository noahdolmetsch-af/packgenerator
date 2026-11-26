<script>
  // «Heute erholen» / «Welcher Berg ruft?» (Noah 24.11.2026 «1-5»): the one quiet sentence under the greeting (rules in tagessatz.js).
  // The calculation of «Form und Erholung» loads only once the page is calm (it is big); until then nothing stands here.
  import { liveQuery } from 'dexie';
  import { X } from '@lucide/svelte';
  import { db } from '../db.js';
  import { addDays } from '../health.js';
  import { loadHint } from './bodyhints.js';
  import { tagesSatz, putAway, NOT_TODAY_KEY } from './tagessatz.js';
  import { t } from '../i18n.svelte.js';

  // dry: the forecast of today is dry (true), wet (false) or unknown (null)
  let { today, dry = null, show = true } = $props();
  const hq = $derived(liveQuery(() => (db.healthDays ? db.healthDays.where('date').aboveOrEqual(addDays(today, -34)).toArray() : [])));
  let level = $state(null);
  $effect(() => {
    if (!show) return void (level = null);
    const d = today;
    let live = true;
    const run = () => import('../form-data.js').then((m) => m.loadForm(d)).then((f) => live && (level = f?.ready?.level ?? null)).catch(() => live && (level = null));
    const id = typeof requestIdleCallback === 'function' ? requestIdleCallback(run, { timeout: 4000 }) : setTimeout(run, 1500);
    return () => {
      live = false;
      if (typeof cancelIdleCallback === 'function' && typeof requestIdleCallback === 'function') cancelIdleCallback(id);
      else clearTimeout(id);
    };
  });
  // «Welcher Berg ruft?»: on a dry day with good form the real summit (the sums of the Gipfelbuch thread load only then, and only once the page is calm)
  let ruf = $state(null);
  $effect(() => {
    const d = today;
    if (!show || dry !== true || (level !== 'hard' && level !== 'normal')) return void (ruf = null);
    let live = true;
    const lv = level;
    const run = async () => {
      try {
        const [{ bergRuft, ruftSatz }, { loadCatalog }, gb, { homeOf }] = await Promise.all([
          import('../gipfelbuch-ruft.js'),
          import('../gipfelkatalog.js'),
          import('../gipfelbuch.js'),
          import('../dayride.js'),
        ]);
        const [row, home, catalog] = await Promise.all([db.settings.get(gb.GB_KEY), db.settings.get('homePlace'), loadCatalog()]);
        const r = bergRuft({ level: lv, wx: { rainMm: 0 }, home: homeOf(home?.value), book: gb.bookOf(row?.value), catalog, today: d });
        if (live) ruf = r ? { kind: r.kind, href: r.href, text: ruftSatz(r) } : null;
      } catch {
        if (live) ruf = null;
      }
    };
    const id = typeof requestIdleCallback === 'function' ? requestIdleCallback(run, { timeout: 5000 }) : setTimeout(run, 2000);
    return () => {
      live = false;
      if (typeof cancelIdleCallback === 'function' && typeof requestIdleCallback === 'function') cancelIdleCallback(id);
      else clearTimeout(id);
    };
  });
  const stored = (() => {
    try {
      return localStorage.getItem(NOT_TODAY_KEY);
    } catch {
      return null;
    }
  })();
  let away = $state(stored);
  const line = $derived(show && !putAway(away, today) ? tagesSatz({ level, azm: level ? loadHint({ health: $hq ?? [], today }) : null, dry, ruf }) : null);
  function putDown() {
    away = today;
    try {
      localStorage.setItem(NOT_TODAY_KEY, today);
    } catch {
      /* the sentence just comes back after a reload */
    }
  }
</script>

{#if line}
  <p class="day" data-say-day data-kind={line.kind}>
    <a class="jump" href={line.href}>{line.raw ? line.text : t(line.text)}</a>
    <button type="button" class="away" data-say-day-away onclick={putDown} aria-label={t('Not today')}><X size={14} aria-hidden="true" /></button>
  </p>
{/if}

<style>
  /* the sentence belongs to «Things are up today» above it: close to it; the × stays at the right edge, a full touch target */
  .day {
    margin: -0.45rem 0 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--fs-body);
    line-height: 1.4;
  }
  .jump {
    color: inherit;
    text-decoration: underline;
    text-decoration-color: color-mix(in srgb, currentColor 35%, transparent);
    text-underline-offset: 0.18em;
  }
  .away {
    flex: none;
    display: inline-grid;
    place-items: center;
    min-width: 44px;
    min-height: 44px;
    margin: -12px 0 -12px auto;
    border: 0;
    background: none;
    color: var(--muted, inherit);
    cursor: pointer;
  }
</style>
