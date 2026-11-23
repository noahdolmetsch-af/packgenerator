<script>
  /**
   * Paket X «Stopps als Wegpunkte für Garmin» (Noah 20.10.2026): the route with the places the app knows
   * along it as one GPX file for the bike computer. Chips choose the kinds (shops, food, petrol stations
   * and water first); the file is saved on the device (or shared on a phone), nothing is sent anywhere.
   * Used by the route card (its own kind chips, chips=false) and Verpflegung; points: [{ lat, lon, name, kind, km?, note? }].
   */
  import { Download } from '@lucide/svelte';
  import { routeGpx, stopsOf, kindsIn, STOP_KINDS_STD } from '../gpxstops.js';
  import { saveGpx, saveFit } from '../gpxout.js';
  import { toFit, pointsOf } from '../unterwegs/umwandeln.js';
  import { POI_KIND } from '../race/outside.js';
  import { t, tn } from '../i18n.svelte.js';

  // chips=false: the caller already chose the kinds (its own chips); every point goes in
  let { route = null, points = [], name = '', chips = true } = $props();
  const NAME = { repair: 'Bike shop', camp: 'Place to sleep', own: 'Other stop' };
  const kindName = (k) => t(NAME[k] ?? POI_KIND[k]?.name ?? 'Other stop');
  const present = $derived(kindsIn(points));
  let picked = $state(null); // null: the standard kinds that are there
  const kinds = $derived(!chips ? present : picked ?? (present.some((k) => STOP_KINDS_STD.includes(k)) ? present.filter((k) => STOP_KINDS_STD.includes(k)) : present));
  const n = $derived(stopsOf(points, { kinds }).length);
  const flip = (k) => (picked = kinds.includes(k) ? kinds.filter((x) => x !== k) : [...kinds, k]);
  let msg = $state('');
  async function save() {
    const text = routeGpx(route, points, { name: name || route?.name, kinds, nameOf: (s) => kindName(s.kind) });
    const r = await saveGpx(text, name || route?.name || 'route');
    if (r === 'cancelled') return;
    msg = r === 'shared' ? t('Shared.') : t('Saved. On the Garmin: copy it with Garmin Express or the Connect app; on the Wahoo: import it in the app.');
  }
  async function saveCourse() {
    const places = stopsOf(points, { kinds }).map((p) => ({ ...p, name: p.name || kindName(p.kind) }));
    const bytes = toFit(pointsOf(route), name || route?.name || '', { coursePoints: places });
    const r = await saveFit(bytes, name || route?.name || 'route');
    if (r === 'cancelled') return;
    msg = r === 'shared' ? t('Shared.') : t('Saved. On the Garmin: copy it with Garmin Express or the Connect app; on the Wahoo: import it in the app.');
  }
</script>

{#if route?.line?.length > 1}
  <div class="gs" data-gpx-stops>
    <p class="gs-note">{t('The route with the stops as waypoints, for Garmin and Wahoo.')}</p>
    {#if chips && present.length}
      <div class="gs-row" role="group" aria-label={t('Which stops')}>
        {#each present as k (k)}<button type="button" class="gs-chip" aria-pressed={kinds.includes(k)} onclick={() => flip(k)} data-gpx-kind={k}>{kindName(k)}</button>{/each}
      </div>
    {/if}
    <button type="button" class="btn sm" onclick={save} data-gpx-stops-save><Download size={16} aria-hidden="true" />{n ? tn(n, 'GPX with {n} stop', 'GPX with {n} stops', { n }) : t('GPX of the route')}</button>
    {#if n}
      <!-- P1 «Kurspunkte für den Garmin» (Noah 23.11.2026): the same stops as named course points in a FIT course; the Edge says «Water in 12 km» -->
      <button type="button" class="btn sm" onclick={saveCourse} data-gpx-fit><Download size={16} aria-hidden="true" />{tn(n, 'FIT course with {n} point', 'FIT course with {n} points', { n })}</button>
      <p class="gs-note">{t('For the Edge 850 and 1040: the route with the places as course points. The Edge announces them on the way, even when the phone is off. Copy the file into the folder «NewFiles» of the Edge.')}</p>
    {/if}
    {#if msg}<p class="gs-note" role="status">{msg}</p>{/if}
  </div>
{/if}

<style>
  .gs {
    display: grid;
    gap: 6px;
  }
  .gs-note {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .gs-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .gs-chip {
    min-height: 44px;
    padding: 8px 12px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .gs-chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .btn.sm {
    justify-self: start;
    min-height: 44px;
  }
</style>
