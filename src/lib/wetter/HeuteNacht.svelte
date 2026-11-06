<script>
  /**
   * «Nachttemperatur» on Today (Noah 06.11.2026 «1a und c 2a 3a 4a 5a», PR 2): one calm line for the home place under the
   * fog line: the lowest value of this morning's night and of the coming night, and one hint: frost within three days, else
   * the change against yesterday. A tap opens the weather page. Offline the kept answer shows with its time. It hides
   * itself without a home place, without a value, or when switched off on the weather page (setting 'nachtHome').
   * HeuteWetter mounts it with one line.
   */
  import { liveQuery } from 'dexie';
  import { Moon } from '@lucide/svelte';
  import { db } from '../db.js';
  import { HOME_PLACE } from '../know.js';
  import { REFRESHED } from '../home/refresh.js';
  import { loadNacht, summary, HOME_KEY } from './nacht.js';
  import { t, num, locale } from '../i18n.svelte.js';

  const homeQ = liveQuery(() => db.settings.get(HOME_PLACE));
  const onQ = liveQuery(() => db.settings.get(HOME_KEY));

  const place = $derived($homeQ?.value && Number.isFinite(Number($homeQ.value.lat)) ? { lat: Number($homeQ.value.lat), lon: Number($homeQ.value.lon) } : null);
  let data = $state(null);
  let key = '';
  const read = (pl, k, force = false) => loadNacht(db, pl, { force }).then((d) => (k == null || k === key) && (data = d)).catch(() => {});
  $effect(() => {
    const k = place ? `${place.lat},${place.lon}` : '';
    if (k === key) return;
    key = k;
    data = null;
    if (place) read(place, k);
  });
  $effect(() => {
    const again = () => place && read(place, null, true);
    globalThis.addEventListener(REFRESHED, again);
    return () => globalThis.removeEventListener(REFRESHED, again);
  });
  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 5 * 60_000);
    return () => clearInterval(id);
  });

  const on = $derived($onQ?.value !== false);
  const s = $derived(data ? summary(data, now) : null);
  const at = $derived(data?.old && data.at ? new Date(data.at).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : '');
  const main = $derived.by(() => {
    if (!s) return '';
    if (s.last != null && s.next != null) return t('Night: this morning {a} °C, tomorrow morning {b} °C', { a: num(s.last), b: num(s.next) });
    if (s.last != null) return t('Night: this morning {a} °C', { a: num(s.last) });
    return t('Night: tomorrow morning {b} °C', { b: num(s.next) });
  });
  // one hint: frost in the next three days (not «frost over»), else the change against yesterday
  const hint = $derived.by(() => {
    if (!s) return '';
    const f = s.frost;
    if (f && !f.ends && f.days <= 3) return f.days === 1 ? t('Frost tomorrow morning (under 0 °C)') : t('Frost in {n} days (under 0 °C)', { n: num(f.days) });
    const d = s.vsYesterday;
    if (d == null) return '';
    return d > 0 ? t('{d}° warmer than yesterday morning', { d: num(d) }) : t('{d}° colder than yesterday morning', { d: num(-d) });
  });
</script>

{#if on && s}
  <a class="hn" href="#/wetter" data-heute-nacht>
    <Moon size={16} aria-hidden="true" />
    <span>
      <b>{main}</b>
      {#if hint}<span class="hn-sub"> · {hint}</span>{/if}
      {#if at}<span class="hn-sub"> · {t('As of {at}', { at })}</span>{/if}
    </span>
  </a>
{/if}

<style>
  .hn {
    flex: 1 1 100%;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink);
    text-decoration: none;
    font-size: var(--fs-small);
  }
  .hn-sub {
    color: var(--ink-2);
  }
</style>
