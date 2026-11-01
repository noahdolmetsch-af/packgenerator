<script>
  /**
   * Mini-Tools «Spontan-Einladung» (idea 5): day, time, meeting point, route and weather of an invite, as a short
   * list. Used on the maker's page and on the page of the people asked.
   */
  import { t, locale } from '../i18n.svelte.js';
  import { CalendarDays, MapPin, Route, CloudSun, ExternalLink } from '@lucide/svelte';

  let { q } = $props();
  const when = $derived(`${new Date(`${q.day}T12:00:00`).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })}${q.time ? `, ${q.time}` : ''}`);
  const wxLine = (w) => [w.min !== null && w.max !== null ? `${w.min}–${w.max} °C` : '', w.rain !== null ? t('rain {n} %', { n: w.rain }) : ''].filter(Boolean).join(' · ');
</script>

<ul class="if-facts" data-if>
  <li><CalendarDays size={16} aria-hidden="true" /><b>{when}</b></li>
  {#if q.where}<li><MapPin size={16} aria-hidden="true" />{q.where}</li>{/if}
  {#if q.route || q.routeUrl}
    <li>
      <Route size={16} aria-hidden="true" />
      {#if q.routeUrl}<a href={q.routeUrl} target="_blank" rel="noopener noreferrer">{q.route || t('Route')} <ExternalLink size={14} aria-hidden="true" /></a>{:else}{q.route}{/if}
    </li>
  {/if}
  {#if q.wx}<li data-if-wx><CloudSun size={16} aria-hidden="true" />{q.wx.place ? `${q.wx.place}: ` : ''}{wxLine(q.wx)}</li>{/if}
</ul>

<style>
  .if-facts {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
    color: var(--ink-2);
  }
  .if-facts li {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-width: 0;
    overflow-wrap: break-word;
  }
  .if-facts a {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--accent);
  }
</style>
