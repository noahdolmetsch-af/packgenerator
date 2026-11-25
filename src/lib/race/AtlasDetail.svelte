<script>
  /**
   * «Rennatlas» one race (Noah 24.11.2026): the facts of the file in a window, the two marks (favourite,
   * registered), the link to the organiser and the button that makes a race of the app of it (or opens it
   * when it is one already).
   */
  import { Star, Check, ExternalLink, Bell } from '@lucide/svelte';
  import RaceSheet from './RaceSheet.svelte';
  import { raceHref } from './parts.js';
  import { statusOf } from './atlas-view.js';
  import { statusText, longDay, daysLabel, kmText } from './atlas-text.js';
  import { wakeable, wakeDays } from './atlas-wecker.js';
  import { num } from '../i18n.svelte.js';
  import { t, locale } from '../i18n.svelte.js';
  const dayShort = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', timeZone: 'UTC' });

  let { row, today, trip = null, busy = false, onmark, onwake, oncreate, onclose } = $props();
  const st = $derived(statusText(statusOf(row, today)));
  const facts = $derived(
    [
      [t('Start|race'), [longDay(row.date) || t('no date yet'), row.quality].filter(Boolean).join(' · ')],
      [t('Place|race'), [row.city, row.land].filter(Boolean).join(', ')],
      [t('Distance|race'), kmText(row)],
      [t('Climb|race'), row.hm ? `${num(row.hm)} ${t('m up|race')}` : t('not known')],
      [t('Length|race'), daysLabel(row)],
      [t('Ground|race'), row.surface],
      [t('Registration|race'), st.text],
      [t('Opens|race'), longDay(row.opens)],
      [t('Closes|race'), longDay(row.closes)],
    ].filter(([, v]) => v),
  );
  const canWake = $derived(wakeable(row, today));
  const wakeList = $derived(row.wecker ? wakeDays(row, today).map((w) => dayShort(w.day)).join(', ') : '');
  function save() {
    if (trip) location.hash = raceHref(trip.id);
    else return oncreate();
  }
</script>

<RaceSheet title={row.name} sub={[row.city, row.land].filter(Boolean).join(', ')} saveLabel={trip ? t('Open the race') : t('Create race')} onsave={save} {onclose}>
  <div class="ad" data-atlas-detail>
    <div class="ad-marks">
      <button type="button" class="btn" class:hi={row.fav} aria-pressed={row.fav} onclick={() => onmark({ fav: !row.fav })} data-atlas-detail-fav><Star size={16} aria-hidden="true" fill={row.fav ? 'currentColor' : 'none'} />{row.fav ? t('Favourite') : t('Make favourite')}</button>
      <button type="button" class="btn" class:hi={row.registered} aria-pressed={row.registered} onclick={() => onmark({ registered: !row.registered })} data-atlas-detail-reg><Check size={16} aria-hidden="true" />{row.registered ? t('Registered|race') : t('Mark as registered')}</button>
      {#if canWake}<button type="button" class="btn" class:hi={row.wecker} aria-pressed={row.wecker === true} onclick={() => onwake?.()} data-atlas-detail-wake><Bell size={16} aria-hidden="true" fill={row.wecker ? 'currentColor' : 'none'} />{row.wecker ? t('Alarm on') : t('Remind me on the phone')}</button>{/if}
    </div>
    {#if canWake && row.wecker}<p class="ad-wake" data-atlas-detail-wakeline>{t('You get a reminder at 08:00 on: {days}.', { days: wakeList })}</p>{/if}
    <dl class="ad-dl">
      {#each facts as [k, v] (k)}<div><dt>{k}</dt><dd>{v}</dd></div>{/each}
    </dl>
    {#if row.note}<p class="ad-note">{row.note}</p>{/if}
    {#if row.url}<a class="btn" href={row.url} target="_blank" rel="noopener noreferrer" data-atlas-detail-link><ExternalLink size={16} aria-hidden="true" />{t('To the organiser')}</a>{/if}
    {#if trip}<p class="ad-here">{t('This race is already one of your races.')}</p>{/if}
  </div>
</RaceSheet>

<style>
  .ad {
    display: grid;
    gap: 12px;
    justify-items: start;
    padding-top: 3px;
  }
  .ad-marks {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .ad-dl {
    display: grid;
    width: 100%;
    margin: 0;
  }
  .ad-dl div {
    display: grid;
    grid-template-columns: minmax(96px, 36%) 1fr;
    gap: 10px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  dt {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  dd {
    margin: 0;
    font-weight: 600;
  }
  .ad-note {
    margin: 0;
    padding: 10px 12px;
    border-left: 4px solid var(--line-strong);
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ad-wake {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ad-here {
    margin: 0;
    color: var(--accent);
    font-size: var(--fs-small);
    font-weight: 600;
  }
</style>
