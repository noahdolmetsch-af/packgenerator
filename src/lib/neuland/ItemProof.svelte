<script>
  /**
   * «Neuland» › one item › «Warum zählt das?» (Entdecken und Sammeln, Noah 04.11.2026): where the app found a
   * place on your route. A little map of the line, the place, the closest point and the distance, in words
   * too. Nothing is counted or changed here; «I was not there» (in the sheet above) stays the way to correct it.
   * item: the place; found: what the app found ({ day, tripId, rideId }) or null; hand: ticked by you;
   * reachKm: the zone of the place; tracks: the lines (tracksOf).
   */
  import { Info } from '@lucide/svelte';
  import { proofOf, mapOf } from './beleg.js';
  import { dayLong, n1 } from '../review/fmt.js';
  import { t } from '../i18n.svelte.js';

  let { item, found = null, hand = false, reachKm = 0.5, tracks = [] } = $props();

  const isPlace = $derived(Number.isFinite(item?.lat) && Number.isFinite(item?.lon) && !item?.rings);
  const proof = $derived(found && isPlace ? proofOf(found, item, reachKm, tracks) : null);
  const map = $derived(proof ? mapOf(proof) : null);
  const dist = (m) => (m >= 1000 ? t('{n} km', { n: n1(m / 1000) }) : t('{n} m', { n: m }));
  const SOURCE = { trip: 'the route of a trip', ride: 'an uploaded ride', activity: 'a Strava ride', rec: 'a ride recorded in the app' };
  const source = $derived(proof ? t(SOURCE[proof.src] ?? 'a line of yours') : '');
</script>

<section class="nl-proof" data-nl-proof aria-labelledby="nlp-h">
  <h3 id="nlp-h"><Info size={16} aria-hidden="true" />{t('Why does it count?')}</h3>
  {#if proof}
    <p data-nlp-text>
      {t('On {day} your line ({source}) passed {dist} from this place. It counts within {zone}.', { day: dayLong(proof.day), source, dist: dist(proof.distM), zone: dist(proof.reachM) })}
    </p>
    <p class="lv {proof.level}" data-nlp-level>
      {proof.level === 'clear' ? t('A clear hit: the line runs close to the place.') : t('A close call: the line only just touched the zone. If you were not there, tap «I was not there».')}
    </p>
    {#if proof.thin}<p class="q">{t('Only the start of this trip counted, not a full line.')}</p>{/if}
    <svg class="map" viewBox="0 0 {map.w} {map.h}" role="img" aria-label={t('Map: your line, the place and the closest point, {dist} apart', { dist: dist(proof.distM) })}>
      <rect class="bg" width={map.w} height={map.h} rx="8" />
      <circle class="zone" cx={map.spot[0]} cy={map.spot[1]} r={map.zone} />
      {#each map.pieces as d, i (i)}<path class="line" {d} />{/each}
      <line class="gap" x1={map.spot[0]} y1={map.spot[1]} x2={map.at[0]} y2={map.at[1]} />
      <circle class="at" cx={map.at[0]} cy={map.at[1]} r="4" />
      <circle class="spot" cx={map.spot[0]} cy={map.spot[1]} r="5" />
      <g class="bar">
        <line x1="10" y1={map.h - 12} x2={10 + map.bar.px} y2={map.h - 12} />
      </g>
    </svg>
    <ul class="key">
      <li><i class="k line"></i>{t('Your line')}</li>
      <li><i class="k spot"></i>{t('The place')}</li>
      <li><i class="k at"></i>{t('Closest point')}</li>
      <li><i class="k zone"></i>{t('Zone where it counts')}</li>
      <li><i class="k bar"></i>{t('Bar at the bottom: {len}', { len: map.bar.m >= 1000 ? t('{n} km', { n: map.bar.m / 1000 }) : t('{n} m', { n: map.bar.m }) })}</li>
    </ul>
  {:else if found && !isPlace}
    <p data-nlp-text>{t('On {day} your route ran through this area.', { day: dayLong(found.day) })}</p>
  {:else if hand}
    <p data-nlp-text>{t('The app did not find it on your routes. It counts because you ticked it.')}</p>
  {:else if found}
    <p data-nlp-text>{t('The app found it on {day}, but the line is no longer there to show.', { day: dayLong(found.day) })}</p>
  {/if}
</section>

<style>
  .nl-proof {
    margin-top: 14px;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
  }
  h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 6px;
    font-size: var(--fs-body);
    font-weight: 650;
  }
  p {
    margin: 0 0 6px;
  }
  .lv.clear {
    color: var(--ok);
  }
  .lv.close {
    color: var(--warn, var(--ink-2));
  }
  .q {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .map {
    display: block;
    width: 100%;
    height: auto;
    margin-top: 8px;
  }
  .bg {
    fill: var(--paper-2);
  }
  .zone {
    fill: color-mix(in srgb, var(--accent) 12%, transparent);
    stroke: var(--accent);
    stroke-width: 1.2;
    stroke-dasharray: 4 3;
  }
  .line {
    fill: none;
    stroke: var(--ink-2);
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .gap {
    stroke: var(--ink-3);
    stroke-width: 1.2;
    stroke-dasharray: 2 2;
  }
  .at {
    fill: var(--paper);
    stroke: var(--ink-2);
    stroke-width: 2;
  }
  .spot {
    fill: var(--accent);
    stroke: var(--paper);
    stroke-width: 1.5;
  }
  .bar line {
    stroke: var(--ink-2);
    stroke-width: 2;
  }
  .key {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .key li {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .k {
    display: inline-block;
    width: 14px;
    height: 10px;
    border-radius: 5px;
  }
  .k.line {
    height: 3px;
    background: var(--ink-2);
  }
  .k.spot {
    width: 10px;
    background: var(--accent);
  }
  .k.at {
    width: 10px;
    border: 2px solid var(--ink-2);
    box-sizing: border-box;
  }
  .k.bar {
    height: 3px;
    background: var(--ink-2);
    opacity: 0.6;
  }
  .k.zone {
    border: 1.5px dashed var(--accent);
    box-sizing: border-box;
  }
</style>
