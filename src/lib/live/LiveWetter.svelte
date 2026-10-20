<script>
  /**
   * Paket Y «Unterwegs»: ice, fog, storm gusts and heat in the next 2 hours where you are, from the one
   * weather core (kern.js), checked once an hour while online. Thunderstorms stay with the storm line of
   * the live map. Live.svelte mounts it with one line among its alerts (owner: Live-Karte).
   */
  import { TriangleAlert } from '@lucide/svelte';
  import { db } from '../db.js';
  import { loadCore, hoursBetween, warningsOf, WARN_TEXT } from '../wetter/kern.js';
  import { t, num, locale } from '../i18n.svelte.js';

  let { me = null } = $props();
  let warn = $state(null);
  let at = 0;
  async function check() {
    if (!me || navigator.onLine === false || Date.now() - at < 60 * 6e4) return;
    at = Date.now();
    try {
      const c = await loadCore(db, { lat: me.lat, lon: me.lon });
      const t0 = Date.now();
      warn = c ? (warningsOf(hoursBetween(c, t0 - 36e5, t0 + 2 * 36e5)).find((w) => w.kind !== 'thunder' && w.kind !== 'snow') ?? null) : null;
    } catch {
      /* no weather now: the ride goes on without the line */
    }
  }
  $effect(() => {
    if (me) check();
  });
  $effect(() => {
    const id = setInterval(check, 5 * 6e4);
    return () => clearInterval(id);
  });
  const hm = (ms) => new Date(ms).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
</script>

{#if warn}<p class="lvf-alert lvf-bad" role="status" data-live-wx={warn.kind}><TriangleAlert size={18} aria-hidden="true" /><span>{t(WARN_TEXT[warn.kind], { at: hm(warn.at), v: num(warn.value) })}</span></p>{/if}

<style>
  /* the same look as the other alerts of the live map (Live.svelte .lvf-alert .lvf-bad) */
  .lvf-alert {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 0;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    font-size: var(--fs-small);
    box-shadow: 0 1px 4px var(--shadow);
    pointer-events: auto;
    overflow-wrap: break-word;
  }
  .lvf-bad {
    border-left: 4px solid var(--bad);
  }
</style>
