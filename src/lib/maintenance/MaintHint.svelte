<script>
  /**
   * «App-Wartung» (Noah 13.10.2026, BF7 and BF8): one calm line on Today when something is due (a key
   * that runs out, a link that does not answer, Strava needs a login, Strava's free limit at 80 % or
   * more), with «View» (Ich › App maintenance) and ×. × hides it until something new is due. Off under
   * Ich › App maintenance. One hint at a time: it waits while «Connect Strava» shows (blocked), and the
   * long-press tip waits while it shows (shown).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { RATE_KEY } from './rate.js';
  import { CHECK_KEY, HINT_CLOSED_KEY, attention, signature, hintLine } from './check.js';
  import { MAINT_KEY, maintOf } from './settings.js';
  import { localDay } from '../localday.js';
  import { t, tn } from '../i18n.svelte.js';
  import { Wrench, X } from '@lucide/svelte';

  let { blocked = false, shown = $bindable(false) } = $props();
  const q = liveQuery(async () => {
    const [rate, check, closed, set] = await Promise.all([db.meta.get(RATE_KEY), db.meta.get(CHECK_KEY), db.meta.get(HINT_CLOSED_KEY), db.settings.get(MAINT_KEY)]);
    return { rate: rate ?? null, check: check ?? null, closed: closed?.sig ?? null, set: maintOf(set?.value) };
  });
  const now = new Date();
  const today = localDay(now);
  const list = $derived($q ? attention({ check: $q.check?.first ? null : $q.check, keys: $q.set.keys, rate: $q.rate, today, now }) : []);
  const sig = $derived(signature(list, today));
  const show = $derived(!!$q && $q.set.hint && list.length > 0 && $q.closed !== sig && !blocked);
  $effect(() => {
    shown = show;
  });
  const close = () => db.meta.put({ key: HINT_CLOSED_KEY, sig });
</script>

{#if show}
  <p class="mhint" role="note" data-hint="maintenance">
    <Wrench size={18} aria-hidden="true" />
    <span><b>{t('App maintenance:')}</b> {hintLine(list, { t, tn })} <a href="#/me">{t('View|maintenance')}</a></span>
    <button type="button" class="mx" aria-label={t('Close the hint')} onclick={close}><X size={18} aria-hidden="true" /></button>
  </p>
{/if}

<style>
  /* the same calm yellow line as the long-press tip on Today */
  .mhint {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 12px;
    padding: 4px 4px 4px 14px;
    border: 1px solid color-mix(in srgb, var(--warn) 25%, var(--paper));
    border-radius: 14px;
    background: var(--warn-soft);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .mhint > :global(svg) {
    flex: none;
    color: var(--warn);
  }
  .mhint span {
    flex: 1;
    min-width: 0;
    padding: 8px 0;
    overflow-wrap: break-word;
  }
  .mhint a {
    color: var(--ink);
    font-weight: 600;
    white-space: nowrap;
  }
  .mx {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
</style>
