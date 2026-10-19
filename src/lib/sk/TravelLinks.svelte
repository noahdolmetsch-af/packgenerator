<script>
  /**
   * «Reise-Links» at a trip (Noah 19.10.2026 «1b 2b 3a 4a 5b»): an optional flight number and the
   * links that fit this trip (stay, flight, by car, abroad, bikepacking; links.js travelLinks). Only the
   * place, the days and the flight number go into the links; nothing is fetched. Every link can be
   * switched off with «…» like the other «Woanders» links. «Alle Reise-Links» opens the page.
   *
   * onchange(fn): as in TripRoute, fn returns the fields to store on the trip.
   */
  import { liveQuery } from 'dexie';
  import Woanders from './Woanders.svelte';
  import { travelLinks, flightNo } from './links.js';
  import { domainOf, hasBike } from '../domains.js';
  import { HOME_PLACE } from '../know.js';
  import { db } from '../db.js';
  import { t, lang, locale } from '../i18n.svelte.js';

  let { trip, onchange } = $props();

  const homeQ = liveQuery(() => db.settings.get(HOME_PLACE));
  const fmt = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
  const links = $derived(
    travelLinks(trip, { home: $homeQ?.value ?? null, lang: lang.v, bike: hasBike(trip), mountain: ['ski', 'hiking'].includes(domainOf(trip)), tx: t, fmt }),
  );

  let typed = $state(null);
  const value = $derived(typed ?? trip.flight ?? '');
  const bad = $derived(value.trim() !== '' && !flightNo(value));
  function save() {
    const v = value.trim();
    if (v && !flightNo(v)) return;
    typed = null;
    if ((trip.flight ?? '') !== (v ? flightNo(v) : '')) onchange(() => ({ flight: v ? flightNo(v) : null }));
  }
</script>

<div class="tl" data-travel-links>
  <label class="tl-f">
    <span class="tl-l">{t('Flight number (if you fly)')}</span>
    <input class="inp" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" value={value} placeholder={t('e.g. LX 1234')} aria-invalid={bad} oninput={(e) => (typed = e.currentTarget.value)} onchange={save} />
  </label>
  {#if bad}<p class="warn" role="alert">{t('Two letters and the number, e.g. LX 1234.')}</p>{/if}
  <Woanders stack context={trip.title ?? ''} {links} />
  <p class="hint"><a href="#/travel">{t('All travel links')}</a> · {t('Only the place, the days and the flight number go into the links.')}</p>
</div>

<style>
  .tl {
    display: grid;
    gap: 6px;
    justify-items: stretch;
    width: 100%;
  }
  .tl-f {
    display: grid;
    gap: 4px;
    max-width: 260px;
  }
  .tl-l {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .hint {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .warn {
    margin: 0;
    color: var(--warn, var(--ink));
    font-size: var(--fs-small);
  }
</style>
