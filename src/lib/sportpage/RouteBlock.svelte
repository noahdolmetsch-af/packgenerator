<script>
  /**
   * Paket O, extra block «Wasser und Schotter auf der Route» (#192 Gravel): for a trip with a GPX route, the
   * fountains along it and how much of it is gravel, from OpenStreetMap (Overpass, free, no key). The check
   * is kept, so it shows offline too; «Neu prüfen» fetches again.
   */
  import { Droplet, RefreshCw } from '@lucide/svelte';
  import { putItem, patchItem } from '../sportsdb.js';
  import { overpassQuery, analyseRoute, longestDry, OVERPASS_URL } from '../sportshelp.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';

  let { sport, items = [], trips = [], today, color } = $props();

  const withRoute = $derived(
    trips
      .filter((tr) => Array.isArray(tr.route?.line) && tr.route.line.length > 1 && !tr.skipped)
      .sort((a, b) => {
        const fa = (a.startDate ?? '') >= today;
        const fb = (b.startDate ?? '') >= today;
        return fa !== fb ? (fa ? -1 : 1) : fa ? String(a.startDate).localeCompare(String(b.startDate)) : String(b.startDate ?? '').localeCompare(String(a.startDate ?? ''));
      }),
  );
  let pick = $state('');
  const trip = $derived(withRoute.find((x) => x.id === pick) ?? withRoute[0] ?? null);
  const check = $derived(trip ? items.find((x) => x.kind === 'route' && x.tripId === trip.id) : null);
  let busy = $state(false);
  let error = $state('');
  const fmt = (d) => (d ? new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }) : '');

  async function run() {
    busy = true;
    error = '';
    try {
      const res = await fetch(OVERPASS_URL, { method: 'POST', body: new URLSearchParams({ data: overpassQuery(trip.route.line) }) });
      if (!res.ok) throw new Error(String(res.status));
      const r = analyseRoute(trip.route.line, await res.json());
      if (check) await patchItem(check.id, { ...r, at: new Date().toISOString() });
      else await putItem({ sport: sport.id, kind: 'route', tripId: trip.id, ...r });
    } catch (e) {
      console.error(e);
      error = navigator.onLine === false ? t('No connection. The check needs the internet once; after that it stays here.') : t('OpenStreetMap did not answer. Try again in a minute.');
    } finally {
      busy = false;
    }
  }
</script>

{#if !withRoute.length}
  <p class="none">{t('No trip with a GPX route yet. Add a route to a trip in Pack, then check it here.')}</p>
{:else}
  {#if withRoute.length > 1}
    <label class="small">{t('Trip')}<select bind:value={pick}>{#each withRoute as tr (tr.id)}<option value={tr.id}>{tr.title || t('Trip')} · {fmt(tr.startDate)}</option>{/each}</select></label>
  {:else}
    <p><b>{trip.title || t('Trip')}</b> <span class="small">{fmt(trip.startDate)}</span></p>
  {/if}
  {#if check}
    <div data-route-check>
      {#if check.share != null}
        <p><b class="num">{t('{n} % gravel', { n: check.share })}</b> <span class="small num">{t('{g} km gravel, {p} km paved, {u} km unknown', { g: num(check.gravelKm), p: num(check.pavedKm), u: num(check.unknownKm) })}</span></p>
        <span class="sbar" aria-hidden="true"><i style="width:{(check.gravelKm / check.km) * 100}%;background:{color}"></i><i style="width:{(check.pavedKm / check.km) * 100}%;background:var(--line-strong)"></i></span>
      {:else}
        <p class="small">{t('The road surface is not known in OpenStreetMap here.')}</p>
      {/if}
      <p class="row"><Droplet size={16} aria-hidden="true" /><b>{tn(check.water.length, '{n} fountain on the way', '{n} fountains on the way')}</b>{#if check.water.length}<span class="small num">{t('at km {list}', { list: check.water.map((w) => num(w.km)).join(', ') })}</span>{/if}</p>
      <p class="small num">{t('Longest stretch without water: {n} km. Plan to fill up before it.', { n: num(longestDry(check)) })}</p>
      <p class="small">{t('Checked {date}. From OpenStreetMap: a fountain can be dry, check on site.', { date: fmt(check.at?.slice(0, 10)) })}</p>
    </div>
  {/if}
  <button type="button" class="btn" onclick={run} disabled={busy} data-route-run><RefreshCw size={16} aria-hidden="true" />{busy ? t('Checking …') : check ? t('Check again') : t('Check water and gravel')}</button>
  {#if error}<p class="small down" role="alert">{error}</p>{/if}
{/if}
