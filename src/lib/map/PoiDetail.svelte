<script>
  /**
   * «Orte auf der Karte»: one place from OpenStreetMap. The map opens it when a symbol is tapped; the
   * «Places» list opens it under the list. Shows the kind, how far (along the route when there is one),
   * the detour off the route (about, there and back), open now and the opening hours as OSM has them,
   * phone and website, and Navigate (Google Maps by bike, OsmAnd). Star keeps it in «Saved places»;
   * Share sends it (the phone's own sheet, or the text is copied). OSM names are never translated.
   *
   * Props: place ({ id, kind, name, lat, lon, hours, phone, website, sub, fee, access, ele }),
   * from ({ lat, lon } | null: where you are), line ([[lat, lon]] | null), profile ([[km, m]] | null),
   * onclose (optional: shows a close button).
   */
  import { X, Navigation, Star, Share2, Phone, Globe, ExternalLink } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { navLinks } from '../live/live-lib.js';
  import { osmUrl } from '../route/pois.js';
  import { distanceOf, detourOf, ptsOf, toggleStar, shareText, shareOrCopy } from './poisearch.js';
  import { prefsQuery, savePrefs } from './poiprefs.js';
  import { iconOf } from './poiicons.js';
  import { kindText, titleOf, distText, kmText, openText } from './poitext.js';

  let { place, from = null, line = null, profile = null, onclose = undefined } = $props();

  const pts = $derived(ptsOf(line));
  const d = $derived(place ? distanceOf(place, from, pts) : null);
  const detour = $derived(place && pts.length ? detourOf(place, pts, profile) : null);
  const now = new Date();
  const open = $derived(place ? openText(place.hours, now) : null);
  const nav = $derived(place ? navLinks(place) : null);
  const Icon = $derived(iconOf(place?.kind));
  const prefs = prefsQuery();
  const starred = $derived(($prefs?.starred ?? []).some((s) => s.id === place?.id));
  let said = $state('');
  const hid = `pd-${Math.random().toString(36).slice(2, 8)}`;
  const site = $derived(place?.website ? (/^https?:\/\//i.test(place.website) ? place.website : `https://${place.website}`) : '');

  async function star() {
    const p = $state.snapshot(place);
    await savePrefs((v) => toggleStar(v, p));
    said = starred ? t('Removed from «Saved places».|poi') : t('Kept in «Saved places».|poi');
  }
  async function share() {
    const p = $state.snapshot(place);
    const text = shareText([p], kindText);
    const r = await shareOrCopy({ title: titleOf(p), text });
    said = r === 'copied' ? t('Copied. Paste it into a message.|poi') : r === 'failed' ? t('Could not share. Copy the place from the map app instead.|poi') : '';
  }
</script>

{#if place}
  <section class="pd" aria-labelledby={hid} data-poi-detail data-kind={place.kind}>
    <div class="pd-head">
      <span class="pd-ic pd-k-{place.kind}" aria-hidden="true"><Icon size={20} /></span>
      <div class="pd-t">
        <h3 id={hid} class="pd-name">{titleOf(place)}</h3>
        <p class="pd-kind">{kindText(place)}{#if d && distText(d)}{' · '}<span class="num" data-poi-dist>{distText(d)}</span>{/if}</p>
      </div>
      {#if onclose}
        <button type="button" class="pd-x" onclick={onclose} aria-label={t('Close')}><X size={20} aria-hidden="true" /></button>
      {/if}
    </div>

    {#if detour && detour.km >= 0.1}
      <p class="pd-line num" data-poi-detour>{t('Detour: about +{km}, +{hm} m climb|poi', { km: kmText(detour.km), hm: detour.hm })}</p>
      <p class="pd-hint">{t('There and back from the nearest point of the route, in a straight line.|poi')}</p>
    {:else if detour}
      <p class="pd-line" data-poi-detour>{t('Right on the route.|poi')}</p>
    {/if}

    {#if open?.text}
      <p class="pd-open pd-{open.state}" class:pd-open-state={open.state === 'open'} data-poi-open={open.state}>{open.text}</p>
    {/if}
    {#if place.hours}
      <p class="pd-hours"><span class="pd-lab">{t('Opening hours|poi')}</span> <span class="pd-raw">{place.hours}</span></p>
    {:else}
      <p class="pd-hint">{t('No opening hours in OpenStreetMap. Check on the spot.|poi')}</p>
    {/if}
    {#if place.fee === 'yes'}<p class="pd-hint">{t('Costs a fee.|poi')}</p>{/if}

    <div class="pd-acts">
      <a class="pd-go" href={nav.google} target="_blank" rel="noopener noreferrer" data-poi-nav="google"><Navigation size={16} aria-hidden="true" />{t('Google Maps')}</a>
      <a class="pd-go" href={nav.osmand} target="_blank" rel="noopener noreferrer" data-poi-nav="osmand"><Navigation size={16} aria-hidden="true" />{t('OsmAnd')}</a>
    </div>
    <div class="pd-acts">
      <button type="button" class="pd-b" aria-pressed={starred} onclick={star} data-poi-star><Star size={16} aria-hidden="true" class={starred ? 'pd-on' : ''} />{starred ? t('Saved|poi') : t('Save|poi')}</button>
      <button type="button" class="pd-b" onclick={share} data-poi-share><Share2 size={16} aria-hidden="true" />{t('Share')}</button>
    </div>
    {#if said}<p class="pd-hint" role="status">{said}</p>{/if}

    <div class="pd-more">
      {#if place.phone}<a class="pd-link" href={`tel:${place.phone.replace(/[^\d+]/g, '')}`}><Phone size={14} aria-hidden="true" /><span class="num">{place.phone}</span></a>{/if}
      {#if site}<a class="pd-link" href={site} target="_blank" rel="noopener noreferrer"><Globe size={14} aria-hidden="true" />{t('Website|poi')}</a>{/if}
      <a class="pd-link" href={osmUrl(place.id)} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} aria-hidden="true" />{t('On OpenStreetMap|poi')}</a>
    </div>
  </section>
{/if}

<style>
  .pd {
    display: grid;
    gap: var(--sp-2);
    min-width: 0;
    padding: var(--sp-3);
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
  }
  .pd-head {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-2);
  }
  .pd-ic {
    display: grid;
    place-items: center;
    flex: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--paper-2);
    color: var(--ink);
  }
  .pd-k-water,
  .pd-k-toilet {
    background: var(--info-soft);
  }
  .pd-k-shop,
  .pd-k-food,
  .pd-k-fuel {
    background: var(--hi-soft);
  }
  .pd-k-bike,
  .pd-k-repair {
    background: var(--accent-soft);
  }
  .pd-k-pharmacy,
  .pd-k-hospital {
    background: var(--bad-soft);
  }
  .pd-t {
    flex: 1;
    min-width: 0;
  }
  .pd-name {
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .pd-kind,
  .pd-line,
  .pd-hours,
  .pd-open {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .pd-open {
    font-weight: 600;
  }
  .pd-open.pd-closed {
    color: var(--bad);
  }
  .pd-open.pd-open-state {
    color: var(--ok);
  }
  .pd-lab {
    font-weight: 600;
    color: var(--ink);
  }
  .pd-hint {
    margin: 0;
    font-size: var(--fs-tiny);
    color: var(--ink-3);
  }
  .pd-x {
    display: grid;
    place-items: center;
    flex: none;
    width: 44px;
    height: 44px;
    margin: -8px -8px 0 0;
    border: 0;
    background: transparent;
    color: var(--ink);
    border-radius: var(--r-ctl);
  }
  .pd-acts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-2);
  }
  .pd-go,
  .pd-b {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--sp-1);
    min-height: 44px;
    padding: 0 var(--sp-2);
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-small) / 1.2 var(--font-body);
    text-decoration: none;
    text-align: center;
  }
  .pd-go {
    background: var(--brand);
    border-color: var(--brand);
    color: var(--brand-ink);
  }
  .pd-b[aria-pressed='true'] {
    background: var(--accent-soft);
    border-color: var(--accent);
  }
  :global(.pd-on) {
    fill: currentColor;
  }
  .pd-more {
    display: flex;
    flex-wrap: wrap;
    gap: 0 var(--sp-3);
  }
  .pd-link {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-1);
    min-height: 44px;
    color: var(--ink);
    font-size: var(--fs-small);
  }
</style>
