<script>
  /**
   * v0.97.0 «Skitouren» (mockup C): the turnaround time as a notice in the app. While a ski tour is
   * today and its turnaround time (Start-Check) has come, a quiet line shows on every page until
   * «OK» (kept per tour on this device). No push: the app only shows it while it is open.
   */
  import { liveQuery } from 'dexie';
  import { Clock } from '@lucide/svelte';
  import { db } from '../db.js';
  import { turnDue, turnTime } from '../ski.js';
  import { localDay } from '../localday.js';
  import { t } from '../i18n.svelte.js';

  const q = liveQuery(() => db.trips.where('domain').equals('ski').toArray());
  let now = $state(new Date());
  $effect(() => {
    const id = setInterval(() => (now = new Date()), 30_000);
    return () => clearInterval(id);
  });
  const KEY = 'ski.turnSeen';
  let seen = $state(read());
  function read() {
    try {
      return localStorage.getItem(KEY) ?? '';
    } catch {
      return '';
    }
  }
  const trip = $derived(($q ?? []).find((x) => turnDue(x, localDay(now), now) && seen !== `${x.id}@${turnTime(x.ski.turnAt)}`) ?? null);
  function ok() {
    seen = `${trip.id}@${turnTime(trip.ski.turnAt)}`;
    try {
      localStorage.setItem(KEY, seen);
    } catch {
      /* private mode: the notice comes back after a reload */
    }
  }
</script>

{#if trip}
  <div class="turn" role="alert" data-ski-turn>
    <Clock size={20} aria-hidden="true" />
    <p>{t('{time}: time to turn around ({trip}).', { time: turnTime(trip.ski.turnAt), trip: trip.ski?.peak?.trim() || trip.title })}</p>
    <button type="button" class="btn" onclick={ok}>{t('OK')}</button>
  </div>
{/if}

<style>
  .turn {
    position: fixed;
    left: 50%;
    top: calc(12px + env(safe-area-inset-top));
    transform: translateX(-50%);
    z-index: 35;
    display: flex;
    align-items: center;
    gap: 12px;
    width: min(560px, calc(100vw - 32px));
    padding: 10px 12px 10px 16px;
    border-radius: var(--radius-card);
    background: var(--warn-soft);
    color: var(--ink);
    box-shadow: 0 8px 24px var(--shadow);
  }
  .turn > :global(svg) {
    flex: none;
    color: var(--warn);
  }
  p {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .turn .btn {
    flex: none;
    min-height: 44px;
  }
</style>
