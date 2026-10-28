<script>
  /**
   * «Rennen detailliert planen» (Ziel 6, Noah 27.10.2026 «1b 2b»): its own page with all coming races,
   * each with its Rennen-Check (the five paper sheets: order A–Z, target setup, basic list, sleep, one
   * night). #/racecheck = the races, #/racecheck/<tripId> = the check of one race. A race is a trip with
   * the race parts (race.js); the check lives in the race (stored.check), so it is in the backup.
   */
  import { Flag, ChevronRight, Plus, Info } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import Crumb from '../lib/flow/kit/Crumb.svelte';
  import Check from '../lib/race/Check.svelte';
  import RaceLinks from '../lib/race/RaceLinks.svelte';
  import { db } from '../lib/db.js';
  import { racesQuery, saveRace } from '../lib/race/store.js';
  import { raceTrips, countdown } from '../lib/race/race.js';
  import { raceHref } from '../lib/race/parts.js';
  import { SHEETS, filled } from '../lib/race/check-lib.js';
  import { homeTrips } from '../lib/home/heute.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import '../lib/race/race.css';

  let { id = '' } = $props();
  const tripsQ = liveQuery(() => db.trips.toArray());
  const racesQ = racesQuery();
  const today = localDay();
  const list = $derived(raceTrips(homeTrips($tripsQ ?? []), $racesQ ?? {}, today));
  const trip = $derived(id ? ($tripsQ ?? []).find((x) => x.id === id) ?? null : null);
  const stored = $derived(($racesQ ?? {})[id] ?? {});
  const ctx = $derived(trip ? { trip, stored, save: (patch) => saveRace(id, patch) } : null);
  let info = $state(false);

  const total = (check) => SHEETS.reduce((a, s) => ((f) => ({ done: a.done + f.done, of: a.of + f.of }))(filled(check, s.id)), { done: 0, of: 0 });
  const dateOf = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' }) : t('no date yet'));
</script>

{#if id}
  <div class="rc" data-page="racecheck-one">
    <Crumb path={[{ href: '#/trips', label: t('Trips|place') }, { href: '#/racecheck', label: t('Plan races in detail') }]} here={trip?.title ?? t('Race')} />
    {#if $tripsQ === undefined || $racesQ === undefined}
      <p class="rc-note">{t('Loading…')}</p>
    {:else if !trip}
      <h1 class="rc-h1" tabindex="-1" data-page-title>{t('This race is not here')}</h1>
      <p class="rc-text">{t('Its trip was deleted or is on another device.')}</p>
      <a class="btn" href="#/racecheck">{t('To the races')}</a>
    {:else}
      <h1 class="rc-h1" tabindex="-1" data-page-title>{trip.title}</h1>
      <p class="rc-intro">
        {t('Race check')} · {dateOf(trip.startDate)}
        {#if countdown(trip.startDate, today)?.days > 0}{' '}· {tn(countdown(trip.startDate, today).days, 'in {n} day', 'in {n} days')}{/if}
      </p>
      <p><a class="btn sm" href={raceHref(trip.id)} data-racecheck-race><Flag size={16} aria-hidden="true" />{t('Route, strategy and race mode')}</a></p>
      {#if ctx}<RaceLinks {ctx} /><Check {ctx} />{/if}
    {/if}
  </div>
{:else}
  <div class="rc" data-page="racecheck">
    <Crumb path={[{ href: '#/trips', label: t('Trips|place') }]} here={t('Plan races in detail')} />
    <h1 class="rc-h1" tabindex="-1" data-page-title>{t('Plan races in detail')}</h1>
    <p class="rc-intro">{t('All your coming races, each with its race check: packing from A to Z, target setup, basic list, sleep and one night.')}</p>
    <button type="button" class="help-line" aria-expanded={info} data-racecheck-help onclick={() => (info = !info)}><Info size={18} aria-hidden="true" /><span>{t('How it works|help')}</span><ChevronRight class="hl-chev" size={16} aria-hidden="true" /></button>
    {#if info}
      <div class="rc-info">
        <p>{t('Tap a race and fill in its check, sheet by sheet. Everything saves by itself and is in the backup.')}</p>
        <p>{t('A new race comes from Trips › Races. Route, strategy and race mode stay there.')}</p>
      </div>
    {/if}

    {#if $tripsQ !== undefined && $racesQ !== undefined}
      {#each [{ key: 'coming', name: 'Coming|races', rows: list.coming }, { key: 'past', name: 'Done|races', rows: list.past }] as g (g.key)}
        {#if g.rows.length}
          <section class="rc-box" aria-labelledby="rck-{g.key}">
            <h2 id="rck-{g.key}" class="rc-h2">{t(g.name)}</h2>
            <ul class="rowlist rc-races">
              {#each g.rows as tr (tr.id)}
                {@const cd = countdown(tr.startDate, today)}
                {@const f = total(($racesQ ?? {})[tr.id]?.check)}
                <li>
                  <a class="lrow" href="#/racecheck/{encodeURIComponent(tr.id)}" data-racecheck-row={tr.id}>
                    <span class="ic" aria-hidden="true"><Flag size={18} /></span>
                    <span class="m">
                      <span class="t">{tr.title}</span>
                      <span class="s">{dateOf(tr.startDate)}{#if cd && cd.days > 0}{' '}· {tn(cd.days, 'in {n} day', 'in {n} days')}{/if} · {f.done ? t('check: {n} fields filled', { n: f.done }) : t('check not started')}</span>
                    </span>
                    <ChevronRight class="chev" size={18} aria-hidden="true" />
                  </a>
                </li>
              {/each}
            </ul>
          </section>
        {/if}
      {/each}
      {#if !list.coming.length && !list.past.length}
        <section class="rc-box rc-soft" data-racecheck-empty>
          <h2 class="rc-h2"><Flag size={18} aria-hidden="true" /> {t('No race yet')}</h2>
          <p class="rc-text">{t('Create a race under Trips › Races. It shows up here with its check.')}</p>
        </section>
      {/if}
      <div class="rc-acts"><a class="btn" href="#/race" data-racecheck-new><Plus size={16} aria-hidden="true" />{t('New race')}</a></div>
    {/if}
  </div>
{/if}
