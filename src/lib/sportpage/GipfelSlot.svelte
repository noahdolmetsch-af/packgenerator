<script>
  /**
   * «Aktiv neu» (Noah 22.10.2026 «1a», proposal «Gipfelbuch auf der Seite der Sportart»): the summit book of
   * one sport as its own part of the sport's page (Velo, Wandern, Skitouren …). The key line, the last places
   * and a link to the whole book filtered to this sport. Shown for the sports of the book and for every own
   * activity that already has a place; the book itself stays at #/flow/gipfelbuch.
   * sport: the sport of the page (sportsbase.js).
   */
  import { liveQuery } from 'dexie';
  import { Mountain, ChevronRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { GB_KEY, bookOf, gbSportOf, placesOfSport } from '../gipfelbuch.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';

  let { sport, today } = $props();
  const SHOW = 5;
  const q = liveQuery(async () => bookOf((await db.settings.get(GB_KEY))?.value));
  const key = $derived(gbSportOf(sport.id));
  const rows = $derived($q ? placesOfSport($q, sport) : []);
  const year = $derived(today.slice(0, 4));
  const fresh = $derived(rows.filter((r) => r.first?.startsWith(year)).length);
  const top = $derived(rows.filter((r) => r.place.ele != null).sort((a, b) => b.place.ele - a.place.ele)[0] ?? null);
  const href = $derived(`#/flow/gipfelbuch${key ? `?sport=${key}` : ''}`);
  const dayOf = (d) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: d.slice(0, 4) === year ? undefined : 'numeric', timeZone: 'UTC' }) : '');
</script>

{#if $q && (key || rows.length)}
  <section class="card blk" aria-labelledby="bl-gb" data-block="gipfelbuch" data-gipfel-slot={sport.id}>
    <div class="hl"><h2 id="bl-gb">{t('Summit book')}</h2><a class="lnk" {href} data-gb-all>{t('Whole summit book')}</a></div>
    {#if rows.length}
      <p class="cnt num">
        <span><b>{rows.length}</b> {tn(rows.length, 'place', 'places')}</span>
        {#if fresh}<span><b>{fresh}</b> {t('new in {year}', { year })}</span>{/if}
        {#if top}<span><b>{num(top.place.ele)} m</b> {t('highest: {name}', { name: top.place.name })}</span>{/if}
      </p>
      <ul class="gl">
        {#each rows.slice(0, SHOW) as r (r.place.id)}
          <li data-gb-place={r.place.id}>
            <a {href}><Mountain size={16} aria-hidden="true" /><span class="nm"><b>{r.place.name}</b><small>{[r.place.ele != null ? `${num(r.place.ele)} m` : '', tn(r.n, '{n} visit', '{n} visits'), dayOf(r.last)].filter(Boolean).join(' · ')}</small></span><ChevronRight size={16} aria-hidden="true" /></a>
          </li>
        {/each}
      </ul>
      {#if rows.length > SHOW}<a class="lnk" {href}>{tn(rows.length - SHOW, 'and {n} more place', 'and {n} more places')}</a>{/if}
    {:else}
      <p class="none">{t('No place in the summit book yet. The app suggests passes and summits from your rides; you can also add one by hand there.')}</p>
    {/if}
  </section>
{/if}

<style>
  .cnt {
    display: flex;
    flex-wrap: wrap;
    gap: 4px var(--sp-4);
    margin: 0 0 var(--sp-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .cnt b {
    color: var(--ink);
    font-size: var(--fs-body);
  }
  .gl {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .gl a {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-height: 44px;
    border-top: 1px solid var(--line);
    color: var(--ink);
    text-decoration: none;
  }
  .nm {
    flex: 1 1 auto;
    min-width: 0;
  }
  .nm b {
    display: block;
    font-weight: 500;
  }
  .nm small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .none {
    margin: 0;
    color: var(--ink-3);
  }
</style>
